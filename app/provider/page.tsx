"use client";

import { Shell } from "@/components/layout/Shell";
import { Pane } from "@/components/layout/Pane";
import { BondManager } from "@/components/provider/BondManager";
import { GodModeToggle } from "@/components/provider/GodModeToggle";
import { ProviderMetrics } from "@/components/provider/ProviderMetrics";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function ProviderPage() {
  return (
    <Shell>
      <div className="flex flex-col h-full p-6 gap-6">
        
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-grid pb-4 mb-2">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-idle/10 border border-idle flex items-center justify-center">
                 <span className="text-2xl">⚡</span>
              </div>
              <div>
                 <h1 className="text-xl font-bold tracking-widest text-white">PROVIDER::COCKPIT</h1>
                 <div className="text-xs text-idle font-mono">ID: fast-finance-agent.eth</div>
              </div>
           </div>
           
           <div>
              <ConnectButton 
                accountStatus="full"
                chainStatus="icon"
                showBalance={false} 
              />
           </div>
        </header>

        {/* MAIN GRID */}
        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
           
           {/* LEFT COL: METRICS (3 cols) */}
           <div className="col-span-3 flex flex-col gap-4">
              <Pane title="NODE_HEALTH">
                 <div className="p-4 h-full overflow-y-auto">
                    <ProviderMetrics />
                 </div>
              </Pane>
           </div>

           {/* CENTER COL: BOND (6 cols) */}
           <div className="col-span-6">
              <BondManager />
           </div>

           {/* RIGHT COL: GOD MODE (3 cols) */}
           <div className="col-span-3">
              <Pane title="SIMULATION_DECK" className="h-auto">
                 <div className="p-4">
                    <GodModeToggle />
                    
                    <div className="mt-8 border-t border-grid pt-4">
                       <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Debug Log</h4>
                       <div className="font-mono text-[10px] text-gray-600 h-48 overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-t from-void to-transparent pointer-events-none" />
                         <p>{`> System initialized`}</p>
                         <p>{`> Listening on port 3000`}</p>
                         <p>{`> ServiceBond contract connected`}</p>
                         <p className="animate-pulse">{`> Waiting for sync...`}</p>
                       </div>
                    </div>
                 </div>
              </Pane>
           </div>

        </div>

      </div>
    </Shell>
  );
}
