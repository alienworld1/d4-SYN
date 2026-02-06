import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { SERVICE_BOND_ADDRESS, SERVICE_BOND_ABI } from "@/lib/contracts";
import { namehash, parseEther, formatEther } from "viem";
import { normalize } from "viem/ens";
import { useEffect, useState } from "react";

// For demo purposes, we manage this specific node
export const DEMO_ENS_NAME = "fast-finance-agent.eth";
export const DEMO_NODE_HASH = namehash(normalize(DEMO_ENS_NAME));
export const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

export type BondState = "ACTIVE" | "UNBONDING" | "UNBONDED";

export function useServiceBond(ensNameOverride?: string) {
  const ensName = ensNameOverride || DEMO_ENS_NAME;
  const nodeHash = namehash(normalize(ensName));
  const [bondState, setBondState] = useState<BondState>("ACTIVE");
  const [countdown, setCountdown] = useState<number>(0);
  const { address } = useAccount();

  // Read Bond Info
  const { data: bondData, refetch } = useReadContract({
    address: SERVICE_BOND_ADDRESS,
    abi: SERVICE_BOND_ABI,
    functionName: "bonds",
    args: [nodeHash],
  });

  // Read ENS Owner
  const { data: ownerAddress } = useReadContract({
    address: ENS_REGISTRY_ADDRESS,
    abi: [{
      name: "owner",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "node", type: "bytes32" }],
      outputs: [{ name: "", type: "address" }],
    }],
    functionName: "owner",
    args: [nodeHash],
  });

  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Derived State
  const amount = bondData ? formatEther(bondData[0]) : "0.0";
  const unbondRequestTime = bondData ? Number(bondData[2]) : 0;
  const now = Math.floor(Date.now() / 1000);
  const isOwner = ownerAddress && address ? ownerAddress.toLowerCase() === address.toLowerCase() : false;

  useEffect(() => {
    if (isConfirmed) {
      refetch();
    }
  }, [isConfirmed, refetch]);

  // Timer Logic for Unbonding
  useEffect(() => {
    if (unbondRequestTime > 0) {
      const finishTime = unbondRequestTime + 30; // 30s as per spec
      const remaining = Math.max(0, finishTime - now);
      
      setCountdown(remaining);
      if (remaining > 0) {
        setBondState("UNBONDING");
        const timer = setInterval(() => {
            setCountdown((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
      } else {
        setBondState("UNBONDED");
      }
    } else {
      setBondState("ACTIVE");
    }
  }, [unbondRequestTime, now]);

  // Actions
  const deposit = (ethAmount: string) => {
    writeContract({
      address: SERVICE_BOND_ADDRESS,
      abi: SERVICE_BOND_ABI,
      functionName: "deposit",
      args: [nodeHash],
      value: parseEther(ethAmount),
    });
  };

  const initiateExit = () => {
    writeContract({
      address: SERVICE_BOND_ADDRESS,
      abi: SERVICE_BOND_ABI,
      functionName: "initiateExit",
      args: [nodeHash],
    });
  };

  const finalizeExit = () => {
    writeContract({
      address: SERVICE_BOND_ADDRESS,
      abi: SERVICE_BOND_ABI,
      functionName: "finalizeExit",
      args: [DEMO_NODE_HASH],
    });
  };

  return {
    bondData,
    amount,
    bondState,
    countdown,
    unbondRequestTime,
    deposit,
    initiateExit,
    finalizeExit,
    isWritePending,
    isOwner,
    isConfirming,
  };
}
