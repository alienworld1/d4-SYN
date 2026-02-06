// components/brain/AgentOrderBook.tsx
import React from 'react';
import { Provider } from '@/lib/agent-brain';

interface AgentOrderBookProps {
  providers: Provider[];
  activeProvider: Provider | null;
}

export function AgentOrderBook({ providers, activeProvider }: AgentOrderBookProps) {
  return (
    <div className="font-mono text-xs w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between mb-4 text-[10px] opacity-40 uppercase tracking-widest px-2 border-b border-grid pb-2">
            <span>Identity // Depth</span>
            <span>Trust / Px</span>
        </div>
        
        <div className="space-y-2 overflow-y-auto flex-1 scrollbar-custom pr-1">
             {providers.length === 0 && (
                 <div className="text-center opacity-30 py-8 italic border border-dashed border-grid mx-2">
                     Searching_
                 </div>
             )}

             {providers.map((p) => {
                 const isActive = activeProvider?.ensName === p.ensName;
                 const isUnbonding = p.isUnbonding;
                 
                 // Bond Gravity Visualization
                 const bondScore = Math.min(Number(p.bondAmount) / 100000000000000000 + 0.2, 1); 
                 
                 return (
                     <div 
                        key={p.ensName} 
                        className={`
                            relative group cursor-crosshair transition-all duration-300
                            ${isActive ? 'bg-idle/5 border-idle text-idle shadow-[0_0_15px_rgba(0,255,65,0.2)]' : 'border-grid text-gray-400 hover:border-white/40'}
                            ${isUnbonding ? 'opacity-40 grayscale border-dashed' : ''}
                        `}
                        style={{
                            borderWidth: isActive ? '1px' : '1px', 
                            borderLeftWidth: isActive ? '4px' : '1px',
                            opacity: isUnbonding ? 0.4 : (isActive ? 1 : 0.6 + bondScore * 0.4)
                        }}
                     >
                        {/* Hover Crosshair Corners */}
                        <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-current opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-current opacity-0 group-hover:opacity-100 transition-opacity" />

                         <div className="p-3 flex justify-between items-center relative overflow-hidden">
                             {/* Scanline effect for active */}
                             {isActive && <div className="absolute inset-0 bg-idle/5 animate-scan pointer-events-none" />}
                             
                             <div className="flex flex-col gap-1 z-10">
                                 <span className="font-bold tracking-tight text-sm">
                                    {p.ensName}
                                 </span>
                                 <span className="text-[10px] opacity-60">
                                     BOND: {(Number(p.bondAmount) / 1e18).toFixed(1)} ETH
                                 </span>
                             </div>

                             <div className="flex flex-col items-end gap-1 z-10 text-right">
                                 <div className="flex items-center gap-2">
                                     <span className={`text-xs font-bold ${p.trustScore < 40 ? 'text-heat' : p.trustScore > 80 ? 'text-idle' : 'text-warn'}`}>
                                         {p.trustScore}
                                     </span>
                                     <span className="text-[9px] opacity-50">SCORE</span>
                                 </div>
                                 <div className="font-mono text-[10px]">
                                     ${p.lastKnownPrice.toFixed(4)}
                                 </div>
                             </div>
                         </div>
                         
                         {/* Active Status Indicator */}
                         {isActive && (
                             <div className="absolute top-2 right-2 flex gap-1 items-center">
                                 <div className="w-1.5 h-1.5 bg-idle rounded-full shadow-[0_0_5px_var(--color-idle)] animate-pulse" />
                             </div>
                         )}
                     </div>
                 );
             })}
        </div>
    </div>
  );
}
