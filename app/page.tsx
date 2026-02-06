"use client";

import { Shell } from "@/components/layout/Shell";
import { SplitPane } from "@/components/layout/SplitPane";
import { Panel } from "@/components/ui/Panel";
import { YellowMonitor } from "@/components/session/YellowMonitor";
import { BrainConsole } from "@/components/brain/BrainConsole";
import { AgentOrderBook } from "@/components/brain/AgentOrderBook";
import { TerminalLogs } from "@/components/brain/TerminalLogs";
import { useAgentBrain } from "@/hooks/useAgentBrain";

export default function Home() {
  const { 
    status, 
    streamContent, 
    start, 
    stop, 
    providers, 
    activeProvider,
    logs 
  } = useAgentBrain();

  return (
    <Shell>
      <SplitPane
        left={
          <Panel title={`HUMAN_OUTPUT::RENDER [${status}]`} className="h-full border-r-0 border-l-0 border-t-0 border-b-0">
            <BrainConsole 
              status={status} 
              content={streamContent} 
              onStart={start} 
              onStop={stop} 
            />
          </Panel>
        }
        right={
          <Panel title="MACHINE_MIND::LOGS" className="h-full border-r-0 border-l-0 border-t-0 border-b-0">
            <div className="flex flex-col gap-6 h-full p-4">
              {/* MARKET OVERVIEW */}
              <div className="shrink-0">
                <div className="text-[10px] opacity-40 mb-2 uppercase tracking-widest font-sans font-bold text-idle">Global Order Book</div>
                <AgentOrderBook providers={providers} activeProvider={activeProvider} />
              </div>

              {/* FUEL & PAYMENT RAIL */}
              <div className="shrink-0 mb-4">
                 <YellowMonitor />
              </div>

              {/* MODULE 5: SYSTEM LOGS */}
              <div className="flex-1 min-h-0 border-t border-grid border-dashed pt-4 flex flex-col">
                <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-sans font-bold">System_Event_Stream</div>
                <TerminalLogs logs={logs} />
              </div>
            </div>
          </Panel>
        }
      />
    </Shell>
  );
}
