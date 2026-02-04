"use client";

import React from "react";
import { useYellow } from "@/hooks/useYellow";

export function YellowMonitor() {
  const { state, openChannel, closeChannel, pay } = useYellow();

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
            <span className="opacity-50 uppercase tracking-widest text-[10px]">Nitrolite Uplink</span>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${state.status === 'active' ? 'bg-synapse shadow-[0_0_8px_var(--color-synapse)]' : 'bg-gray-700'}`} />
                <span className={`uppercase font-bold ${statusColor} tracking-widest`}>
                    [{state.status.toUpperCase()}]
                </span>
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

        <div className="flex justify-between items-end border-t border-dashed border-grid pt-3">
            <div>
                 <span className="opacity-50 block text-[10px] mb-1">STREAM_ALLOCATION</span>
                 <div className="text-3xl font-bold text-synapse font-sans tracking-tighter tabular-nums leading-none drop-shadow-[0_0_5px_rgba(255,234,0,0.3)]">
                    {displayBalance}<span className="text-xs opacity-50 ml-1 font-mono">USDC</span>
                 </div>
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
                             onClick={() => closeChannel()}
                             className="px-2 py-1 bg-error/10 border border-error/30 text-error hover:bg-error/20 transition-all uppercase text-[10px]"
                             title="Flash Switch"
                        >
                            CUT
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
