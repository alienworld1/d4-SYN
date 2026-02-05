"use client";

import { Shell } from "@/components/layout/Shell";
import { SplitPane } from "@/components/layout/SplitPane";
import { Pane } from "@/components/layout/Pane";
import { FuelGauge } from "@/components/session/FuelGauge";
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
          <Pane title={`HUMAN_OUTPUT::RENDER [${status}]`}>
            <BrainConsole 
              status={status} 
              content={streamContent} 
              onStart={start} 
              onStop={stop} 
            />
          </Pane>
        }
        right={
          <Pane title="MACHINE_MIND::LOGS">
            <div className="flex flex-col gap-6 h-full">
              {/* MARKET OVERVIEW */}
              <div>
                <div className="text-[10px] opacity-40 mb-2 uppercase tracking-widest">Global Order Book</div>
                <AgentOrderBook providers={providers} activeProvider={activeProvider} />
              </div>

              {/* FUEL & PAYMENT RAIL */}
              <div className="grid grid-cols-2 gap-4">
                 <FuelGauge />
                 <YellowMonitor />
              </div>

              {/* MODULE 5: SYSTEM LOGS */}
              <div className="flex-1 min-h-0 border-t border-[#333] pt-4 flex flex-col">
                <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest">System_Event_Stream</div>
                <TerminalLogs logs={logs} />
              </div>
            </div>
          </Pane>
        }
      />
    </Shell>
  );
}
