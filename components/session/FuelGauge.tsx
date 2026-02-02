"use client";

import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useReadContract, useWriteContract, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, parseUnits, formatEther, formatUnits } from "viem";
import { useSessionWallet } from "@/hooks/useSessionWallet";
import { USDC_SEPOLIA_ADDRESS, USDC_ABI } from "@/lib/constants";

export function FuelGauge() {
  const { address: mainAddress } = useAccount();
  const { address: sessionAddress } = useSessionWallet();
  const [isFueling, setIsFueling] = useState(false);
  const [fuelStatus, setFuelStatus] = useState<string>("IDLE");

  // --- Session Balances ---
  const { data: ethBalance, refetch: refetchEth } = useBalance({
    address: sessionAddress as `0x${string}`,
    query: {
        enabled: !!sessionAddress,
        refetchInterval: 2000,
    }
  });

  const { data: usdcBalance, refetch: refetchUsdc } = useReadContract({
    address: USDC_SEPOLIA_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: sessionAddress ? [sessionAddress] : undefined,
    query: {
        enabled: !!sessionAddress,
        refetchInterval: 2000,
    }
  });
  
  // --- Transactions ---
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();

  // --- Logic ---
  const hasEth = ethBalance?.value ? ethBalance.value > parseEther("0.001") : false;
  const hasUsdc = usdcBalance ? (usdcBalance as bigint) > parseUnits("1", 6) : false;
  const isReady = hasEth && hasUsdc;

  const handleInject = async () => {
    if (!mainAddress || !sessionAddress) return;
    setIsFueling(true);
    setFuelStatus("INIT FUEL INJECTION...");

    try {
      // 1. Send ETH (0.01)
      setFuelStatus("SENDING 0.01 ETH...");
      const tx1 = await sendTransactionAsync({
        to: sessionAddress as `0x${string}`,
        value: parseEther("0.01"),
      });
      console.log("ETH Tx:", tx1);
      // We accept optimistic update or wait? Spec implies waiting for "Ready" but UI feedback is key.
      // Ideally we wait for receipt, but simpler to fire and verify.
      // Let's fire the second one immediately after await (user signs twice).
      
      // 2. Send USDC (10.0)
      setFuelStatus("SENDING 10.0 USDC...");
      const tx2 = await writeContractAsync({
        address: USDC_SEPOLIA_ADDRESS,
        abi: USDC_ABI,
        functionName: "transfer",
        args: [sessionAddress, parseUnits("10", 6)],
      });
      console.log("USDC Tx:", tx2);

      setFuelStatus("FUEL INJECTED. SYNCING...");
      
      // Artificial delay for vibe + letting indexer catch up slightly (though direct query is fast)
      setTimeout(() => {
        refetchEth();
        refetchUsdc();
        setIsFueling(false);
        setFuelStatus("IDLE");
      }, 3000);

    } catch (e) {
      console.error(e);
      setFuelStatus("INJECTION FAILED");
      setIsFueling(false);
    }
  };

  // --- Formatters ---
  const displayEth = ethBalance ? parseFloat(formatEther(ethBalance.value)).toFixed(4) : "0.0000";
  const displayUsdc = usdcBalance ? parseFloat(formatUnits(usdcBalance as bigint, 6)).toFixed(2) : "0.00";

  return (
    <div className="flex flex-col gap-4 p-4 border border-[#333] bg-[#0A0A0A]/50 font-mono text-xs">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-[#333] pb-2 mb-2">
        <span className="text-gray-500 tracking-widest">POWER_MANAGEMENT</span>
        <div className="text-[10px] text-gray-600">SEP_NET</div>
      </div>

      {/* MAINFRAME CONNECTION */}
      <div className="flex flex-col gap-2">
        <div className="text-gray-400">MAINFRAME_UPLINK</div>
        <div className="[&_button]:font-mono! [&_button]:rounded-none! [&_button]:text-xs! [&_button]:h-8!">
           {/* Custom Wrapper for Rainbow Button to match Vibe if possible, generic for now */}
           <ConnectButton 
             showBalance={false} 
             chainStatus="icon" 
             accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
             }}
           />
        </div>
      </div>

      {/* SESSION KEY CARD */}
      <div className="flex flex-col gap-2 mt-4">
        <div className="text-gray-400">SESSION_IDENTITY (RAM)</div>
        
        <div className={`
            relative p-3 border 
            ${isReady ? 'border-terminal shadow-[0_0_10px_var(--color-terminal)]' : 'border-synapse animate-pulse'} 
            bg-[#111] transition-all duration-300
        `}>
          {/* Status Light */}
          <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isReady ? 'bg-terminal' : 'bg-synapse'}`} />

          <div className="text-[10px] text-gray-500 mb-1">ADDRESS</div>
          <div className="text-discovery text-xs truncate mb-3">
            {sessionAddress || "INITIALIZING..."}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] text-gray-500">ETH_GAS</div>
              <div className={`text-sm ${hasEth ? 'text-white' : 'text-error'}`}>
                {displayEth}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">USDC_AMMO</div>
              <div className={`text-sm ${hasUsdc ? 'text-white' : 'text-error'}`}>
                {displayUsdc}
              </div>
            </div>
          </div>
          
          {!isReady && sessionAddress && (
             <div className="mt-2 text-[10px] text-synapse bg-synapse/10 p-1 text-center border border-synapse/20">
                LOW VOLTAGE - INJECT FUEL
             </div>
          )}
        </div>
      </div>

      {/* INJECT BUTTON */}
      <button
        disabled={!mainAddress || isFueling || isReady}
        onClick={handleInject}
        className={`
          mt-2 relative w-full py-3 px-4 
          border text-center uppercase tracking-widest font-bold text-sm
          transition-all duration-150
          ${
            !mainAddress 
              ? 'border-gray-800 text-gray-600 bg-transparent cursor-not-allowed'
              : isFueling
                ? 'border-synapse text-synapse bg-synapse/10 cursor-wait'
                : isReady 
                 ? 'border-terminal text-terminal bg-terminal/10 cursor-default opacity-50' 
                 : 'border-synapse hover:bg-synapse hover:text-black text-synapse cursor-pointer'
          }
        `}
      >
        {isFueling ? (
          <span className="animate-pulse">{`>> ${fuelStatus} <<`}</span>
        ) : !mainAddress ? (
            "CONNECT MAINFRAME FIRST"
        ) : isReady ? (
            "SYSTEM READY"
        ) : (
          "[ INJECT FUEL ]"
        )}
      </button>
      
      {isFueling && (
        <div className="text-[10px] text-center text-gray-500 animate-pulse">
            Sign 2 Transactions...
        </div>
      )}

    </div>
  );
}
