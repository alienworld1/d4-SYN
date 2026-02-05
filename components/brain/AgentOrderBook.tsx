// components/brain/AgentOrderBook.tsx
import React from 'react';
import { Provider } from '@/lib/agent-brain';

interface AgentOrderBookProps {
  providers: Provider[];
  activeProvider: Provider | null;
}

export function AgentOrderBook({ providers, activeProvider }: AgentOrderBookProps) {
  return (
    <div className="border border-grid bg-void/80 p-4 font-mono text-xs">
        <div className="flex justify-between mb-2 text-[10px] opacity-40 uppercase tracking-widest">
            <span>Identity</span>
            <span>Trust / Spend / Status</span>
        </div>
        
        <div className="space-y-1">
             {providers.length === 0 && (
                 <div className="text-center opacity-30 py-4 italic">
                     Scanning Discovery Layer...
                 </div>
             )}

             {providers.map((p) => {
                 const isActive = activeProvider?.ensName === p.ensName;
                 const isUnbonding = p.isUnbonding;
                 
                 return (
                     <div 
                        key={p.ensName} 
                        className={`
                            flex justify-between items-center p-2 border transition-all
                            ${isActive ? 'border-idle bg-idle/5' : 'border-grid hover:border-white/20'}
                            ${isUnbonding ? 'opacity-50 grayscale' : ''}
                        `}
                     >
                         <div className="flex items-center gap-3">
                             {/* Status Dot */}
                             <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-idle animate-pulse shadow-glow-idle' : 'bg-gray-600'}`} />
                             
                             <div>
                                 <div className={`font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                     {p.ensName}
                                 </div>
                                 <div className="text-[9px] opacity-50 font-sans">
                                     BOND: {(Number(p.bondAmount)/1e18).toFixed(2)} ETH • AGE: {(p.bondAge/86400).toFixed(1)}d
                                 </div>
                             </div>
                         </div>

                         <div className="text-right">
                             <div className="text-idle font-bold">
                                 SCORE: {p.trustScore}
                             </div>
                             {isActive && (
                                 <div className="text-[9px] text-data animate-pulse">
                                     STREAMING
                                 </div>
                             )}
                             {isUnbonding && (
                                 <div className="text-[9px] text-heat">
                                     UNBONDING
                                 </div>
                             )}
                         </div>
                     </div>
                 );
             })}
        </div>
    </div>
  );
}
