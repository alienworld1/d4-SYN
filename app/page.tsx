"use client";

import { Shell } from "@/components/layout/Shell";
import { Panel } from "@/components/ui/Panel";
import { YellowMonitor } from "@/components/session/YellowMonitor";
import { BrainConsole } from "@/components/brain/BrainConsole";
import { AgentOrderBook } from "@/components/brain/AgentOrderBook";
import { TerminalLogs } from "@/components/brain/TerminalLogs";
import { SLAChart } from "@/components/brain/SLAChart";
import { AuditLog } from "@/components/brain/AuditLog";
// import { useAgentBrain } from "@/hooks/useAgentBrain";
import { useCognitiveAgent } from "@/hooks/useCognitiveAgent";
import { useYellow } from "@/hooks/useYellow";
import { RollingTicker } from "@/components/ui/RollingTicker";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MissionControl() {
  const { 
    status, 
    streamContent, 
    start, 
    stop, 
    providers, 
    activeProvider,
    logs 
  } = useCognitiveAgent();
  
  const searchParams = useSearchParams();
  const preSelectedAgent = searchParams.get('agent');

  const { state: yellowState } = useYellow();

  // Assuming 6 decimals for USDC
  const balance = yellowState.balance ? Number(yellowState.balance) / 1000000 : 0;
  
  const handleStart = (prompt: string) => {
      start(prompt, preSelectedAgent || undefined);
  }

  return (
    <Shell>
       <div className="flex flex-col h-full w-full">
           {/* HEADER */}
           <header className="h-12 border-b border-grid flex justify-between items-center px-4 bg-void/80 backdrop-blur-md z-30 shrink-0">
               <div className="flex items-center gap-4">
                   <div className="text-lg font-bold tracking-tighter text-white font-mono">d4-syn // AGENT_V1</div>
                   <div className="h-4 w-px bg-grid"></div>
                   <div className="text-xs text-gray-500 font-mono tracking-widest">MISSION CONTROL</div>
               </div>
               <div className="flex items-center gap-6 text-xs font-mono">
                   {preSelectedAgent && (
                       <div className="flex items-center gap-2 animate-pulse">
                           <span className="text-idle">TARGET_LOCKED:</span>
                           <span className="bg-idle/10 text-idle px-2 py-0.5 border border-idle">{preSelectedAgent}</span>
                       </div>
                   )}
                   <div className="flex items-center gap-2">
                       <span className="opacity-50">NETWORK</span>
                       <span className={yellowState.status === 'active' ? 'text-idle animate-pulse' : 'text-cold'}>
                           [{yellowState.status.toUpperCase()}]
                       </span>
                   </div>
                   <div className="flex items-center gap-2">
                        <span className="opacity-50">UNIFIED_BAL</span>
                        <span className="text-white font-bold">${balance.toFixed(2)} USDC</span>
                   </div>
               </div>
           </header>

           {/* MAIN GRID */}
           <div className="flex-1 flex overflow-hidden">
               {/* COL 1: ORDER BOOK (20%) */}
               <div className="w-[20%] border-r border-grid flex flex-col min-w-62.5 bg-black/20">
                   <Panel title="MARKET DEPTH" className="h-full border-0 bg-transparent flex flex-col">
                        <AgentOrderBook providers={providers} activeProvider={activeProvider} />
                   </Panel>
               </div>
               
               {/* COL 2: MAIN OUTPUT (50%) */}
               <div className="w-[50%] flex flex-col min-w-100 relative z-10 border-r border-grid">
                   <div className="h-full">
                       <BrainConsole status={status} content={streamContent} onStart={handleStart} onStop={stop} />
                   </div>
               </div>

               {/* COL 3: ENGINE ROOM (30%) */}
               <div className="w-[30%] flex flex-col min-w-75 bg-black/40">
                   {/* Top: Ticker (The Money Shot) */}
                   <div className="p-8 border-b border-grid flex flex-col justify-center items-end bg-black/40">
                       <div className="text-[10px] opacity-40 uppercase tracking-widest mb-2 text-right w-full">Live Settlement Stream</div>
                       <RollingTicker 
                            value={balance} 
                            className="text-5xl text-idle font-bold text-glow-idle" 
                            prefix="$" 
                        />
                   </div>
                   
                   {/* Middle: Connection Info */}
                   <div className="p-4 border-b border-grid">
                        <YellowMonitor />
                   </div>
                   
                   {/* Bottom: Logs */}
                   <div className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden relative border-b border-grid">
                       <div className="absolute top-0 left-0 w-full h-px bg-grid z-10"></div>
                       <div className="p-2 text-[10px] opacity-40 uppercase tracking-widest bg-grid/10 pl-4 border-b border-grid/20">Audit Trail</div>
                       <div className="flex-1 overflow-hidden relative">
                           <AuditLog />
                       </div>
                   </div>

                   {/* SLA Visualizer */}
                   <div className="h-32 w-full bg-black/60 border-t border-grid relative overflow-hidden flex flex-col">
                       <SLAChart />
                   </div>
               </div>
           </div>
       </div>
    </Shell>
  );
}

export default function Home() {
    return (
        <Suspense fallback={<div className="text-white">Loading Mission Control...</div>}>
            <MissionControl />
        </Suspense>
    )
}
