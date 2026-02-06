// components/brain/AgentOrderBook.tsx
import React from 'react';
import { Provider } from '@/lib/agent-brain';
import { Badge } from '@/components/ui/Badge';
import { Panel } from '@/components/ui/Panel'; // Wait, layout Pane vs UI Panel. Using UI Panel internally if needed, or simply div since Parent provides Panel.
// Actually, AgentOrderBook is used INSIDE a Panel in page.tsx. So it should probably just be a div or list.
// But the item rows could use Button or just styled divs.
// The spec says "The `Panel` (Container) ... border border-grid".
// The current code has a wrapper div with border border-grid. 
// I will remove the wrapper border if it's redundant or use Panel if it's independent.
// In page.tsx: <Pane ...><AgentOrderBook .../></Pane>. So it is already in a Pane.
// So AgentOrderBook content should just be the list.
// However, the internal rows can use the visual primitives.

interface AgentOrderBookProps {
  providers: Provider[];
  activeProvider: Provider | null;
}

export function AgentOrderBook({ providers, activeProvider }: AgentOrderBookProps) {
  return (
    <div className="font-mono text-xs w-full">
        {/* Header removed or simplified since parent Pane has title, but this is sub-header */}
        <div className="flex justify-between mb-2 text-[10px] opacity-40 uppercase tracking-widest pl-2 pr-2">
            <span>Identity</span>
            <span>Trust / Spend / Status</span>
        </div>
        
        <div className="space-y-1">
             {providers.length === 0 && (
                 <div className="text-center opacity-30 py-4 italic border border-dashed border-grid">
                     Scanning Discovery Layer...
                 </div>
             )}

             {providers.map((p) => {
                 const isActive = activeProvider?.ensName === p.ensName;
                 const isUnbonding = p.isUnbonding;
                 
                 // Using row styling manually as it's complex, but could iterate to components later.
                 // Spec doesn't demand a "Row" component.
                 // But I should use text-idle, text-data colors.
                 
                 return (
                     <div 
                        key={p.ensName} 
                        className={`
                            flex justify-between items-center p-2 border transition-all
                            ${isActive ? 'border-idle bg-idle/5 shadow-[0_0_10px_rgba(0,255,65,0.1)]' : 'border-grid hover:border-white/20'}
                            ${isUnbonding ? 'opacity-50 grayscale' : ''}
                        `}
                     >
                         <div className="flex items-center gap-3">
                             {/* Status Dot */}
                             <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-idle animate-pulse shadow-[0_0_5px_rgba(0,255,65,0.8)]' : 'bg-cold'}`} />
                             
                             <div>
                                 <div className={`font-bold tracking-tight ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                     {p.ensName}
                                 </div>
                                 <div className="text-[9px] opacity-50 font-sans tracking-wide">
                                     BOND: {(Number(p.bondAmount)/1e18).toFixed(2)} ETH • AGE: {(p.bondAge/86400).toFixed(1)}d
                                 </div>
                             </div>
                         </div>

                         <div className="text-right flex flex-col items-end gap-1">
                             <div className="text-idle font-bold">
                                 SCORE: <span className="tabular-nums">{p.trustScore}</span>
                             </div>
                             {isActive && (
                                 <Badge variant="idle" animate className="text-[9px]">STREAMING</Badge>
                             )}
                             {isUnbonding && (
                                 <Badge variant="heat" className="text-[9px]">UNBONDING</Badge>
                             )}
                         </div>
                     </div>
                 );
             })}
        </div>
    </div>
  );
}
