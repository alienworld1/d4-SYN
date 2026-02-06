"use client";

import React, { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useYellow } from "@/hooks/useYellow";
import { Ticker } from "@/components/ui/Ticker";
import { Badge } from "@/components/ui/Badge";

export function YellowMonitor() {
  const { state, openChannel, closeChannel, pay, payWithSLA, eventBus, getTelemetry } = useYellow();
  const [slaMessage, setSlaMessage] = useState<string | null>(null);
  const [isRequestingFaucet, setIsRequestingFaucet] = useState(false);

  const requestFaucet = async () => {
    if (!state.address) return;
    setIsRequestingFaucet(true);
    try {
        const res = await fetch('https://clearnet-sandbox.yellow.com/faucet/requestTokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userAddress: state.address })
        });
        const data = await res.json();
        console.log('Faucet Response:', data);
        if (!res.ok) alert('Faucet Limit Reached or Error: ' + JSON.stringify(data));
    } catch (e) {
        console.error('Faucet Request Failed', e);
    } finally {
        setIsRequestingFaucet(false);
    }
  };

  // SLA Event Listener
  useEffect(() => {
    if (!eventBus) return; // Should be available if client init

    // We can use the native EventListener since we used EventTarget
    const onPenalty = (e: any) => {
        const d = e.detail;
        setSlaMessage(`[SLA] PENALTY: ${(1-d.multiplier).toFixed(2)}x (${Math.floor(d.latency)}ms)`);
        setTimeout(() => setSlaMessage(null), 3000);
    };

    const onViolation = (e: any) => {
         setSlaMessage(`[SLA] HARD CAP VIOLATION: ${Math.floor(e.detail.latency)}ms`);
         setTimeout(() => setSlaMessage(null), 4000);
    };

    eventBus.addEventListener('SLA_PENALTY', onPenalty as EventListener);
    eventBus.addEventListener('SLA_VIOLATION', onViolation as EventListener);

    return () => {
        eventBus.removeEventListener('SLA_PENALTY', onPenalty as EventListener);
        eventBus.removeEventListener('SLA_VIOLATION', onViolation as EventListener);
    }
  }, [eventBus]);

  // Status Color Mapping
  const statusColor = {
    'disconnected': 'text-gray-500',
    'connecting': 'text-yellow-500 animate-pulse',
    'connected': 'text-terminal animate-pulse', // IDLE Green
    'active': 'text-synapse', // Active Yellow
    'settling': 'text-error animate-pulse',
    'error': 'text-error'
  }[state.status] || 'text-gray-500';

  // Format Balance (Assuming 6 decimals for USDC)
  const displayBalance = (Number(state.balance) / 1000000).toFixed(6); 

  return (
    <div className="border border-grid mt-4 p-4 bg-void/80 backdrop-blur-sm font-mono text-xs relative overflow-hidden group">
        {/* Decorative scanning line */}
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-synapse to-transparent opacity-20" />

        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
                <span className="opacity-50 uppercase tracking-widest text-[10px]">Nitrolite Uplink</span>
                <div className="scale-75 origin-left opacity-80 hover:opacity-100 transition-opacity [&_button]:font-mono! [&_button]:rounded-none!">
                    <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${state.status === 'active' ? 'bg-synapse shadow-[0_0_8px_var(--color-synapse)]' : 'bg-gray-700'}`} />
                <Badge variant={state.status === 'active' ? 'warn' : 'cold'} animate={state.status === 'active'}>
                    [{state.status.toUpperCase()}]
                </Badge>
            </div>
        </div>

        {state.channelId && (
            <div className="mb-4 space-y-1">
                <div className="flex justify-between">
                    <span className="opacity-40">CHANNEL_ID</span>
                    <span className="text-discovery opacity-80 font-sans truncate w-32 text-right">{state.channelId}</span>
                </div>
                <div className="flex justify-between">
                     <span className="opacity-40">PROVIDER</span>
                     <span className="text-white opacity-60 truncate w-32 text-right">{state.provider || 'VOID'}</span>
                </div>
            </div>
        )}

        {state.address && (
          <div className="mb-4 p-2 bg-black/40 border border-grid/50 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] opacity-40">BURNER_WALLET</span>
              <button 
                onClick={() => navigator.clipboard.writeText(state.address!)}
                className="text-[10px] text-synapse hover:underline uppercase"
              >
                [COPY]
              </button>
            </div>
            <div className="font-mono text-[10px] break-all opacity-80 text-gray-300">
              {state.address}
            </div>
            {state.balance === BigInt(0) && (
                <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[9px] text-warn opacity-80 uppercase animate-pulse">
                        ! LOW FUEL !
                    </span>
                    <button 
                        onClick={requestFaucet}
                        disabled={isRequestingFaucet}
                        className="px-2 py-1 bg-warn/10 border border-warn/30 text-warn hover:bg-warn/20 transition-all uppercase text-[9px] disabled:opacity-50"
                    >
                        {isRequestingFaucet ? "[INJECTING...]" : "[REQ_FAUCET]"}
                    </button>
                </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-end border-t border-dashed border-grid pt-3">
            <div>
                 <span className="opacity-50 block text-[10px] mb-1 font-sans font-bold">STREAM_ALLOCATION</span>
                 <div className="text-3xl font-bold text-synapse font-sans tracking-tighter leading-none drop-shadow-[0_0_5px_rgba(255,234,0,0.3)] flex items-baseline">
                    <Ticker value={displayBalance} />
                    <span className="text-xs opacity-50 ml-1 font-mono">USDC</span>
                 </div>
                 {slaMessage && (
                     <div className="text-[10px] text-warn font-bold animate-pulse mt-1 bg-black/50 px-1 border-l-2 border-warn">
                         {slaMessage}
                     </div>
                 )}
            </div>
            
            {/* Dev Controls - Visible for Manual Verification */}
            <div className="flex flex-col gap-1 items-end">
                {state.status === 'connected' && (
                    <button 
                         onClick={() => openChannel('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')} // Arbitrary valid-looking address
                         className="px-3 py-1 bg-terminal/10 border border-terminal/30 text-terminal hover:bg-terminal/20 transition-all uppercase text-[10px] tracking-wider"
                    >
                        INIT_LINK
                    </button>
                )}
                 {state.status === 'active' && (
                    <div className="flex gap-1">
                         <button 
                             onClick={() => pay(0.01)}
                             className="px-2 py-1 bg-synapse/10 border border-synapse/30 text-synapse hover:bg-synapse/20 transition-all uppercase text-[10px]"
                             title="Stream 0.01 USDC"
                        >
                            STREAM_TX
                        </button>
                        <button 
                             onClick={async () => {
                                 console.log('INIT STRESS TEST: 20 TX @ 50ms');
                                 for(let i=0; i<20; i++) {
                                     pay(0.001);
                                     await new Promise(r => setTimeout(r, 50)); // ~20 TPS burst
                                 }
                             }}
                             className="px-2 py-1 bg-warn/10 border border-warn/30 text-warn hover:bg-warn/20 transition-all uppercase text-[10px]"
                             title="Burst 20 TX (Stress Test)"
                        >
                            BURST_TEST
                        </button>
                        <button 
                             onClick={() => closeChannel()}
                             className="px-2 py-1 bg-error/10 border border-error/30 text-error hover:bg-error/20 transition-all uppercase text-[10px]"
                             title="Flash Switch"
                        >
                            CUT
                        </button>
                    </div>
                )}
                {state.status === 'active' && (
                     <button
                        onClick={async () => {
                            if (!payWithSLA) return;
                            console.log('--- STARTING SLA SIMULATION ---');
                            // 1. Reset timer (First Token)
                            await payWithSLA(0, 0.001);
                            
                            const sequence = [
                                50, // Fast
                                80, // Fast
                                120, // Mild Penalty
                                200, // Big Penalty
                                600 // Hard Cap
                            ];

                            for (let i = 0; i < sequence.length; i++) {
                                await new Promise(r => setTimeout(r, sequence[i]));
                                const res: any = await payWithSLA(i+1, 0.001);
                                console.log(`[TEST] Token #${i+1} Waited ${sequence[i]}ms ->`, res);
                            }
                        }}
                        className="px-2 py-1 mt-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-all uppercase text-[10px]"
                     >
                         TEST_SLA
                     </button>
                )}
            </div>
        </div>
    </div>
  );
}
