import { Shell } from "@/components/layout/Shell";
import { SplitPane } from "@/components/layout/SplitPane";
import { Pane } from "@/components/layout/Pane";

export default function Home() {
  return (
    <Shell>
      <SplitPane
        left={
          <Pane title="HUMAN_OUTPUT::RENDER">
            <div className="space-y-4">
              <h1 className="text-xl tracking-widest uppercase text-white opacity-80">
                Awaiting Input...
              </h1>
              <p className="text-sm opacity-50 typing-effect">
                _ system initialized.
                <br />
                _ shell ready.
                <br />
                _ waiting for agent command.
              </p>
            </div>
          </Pane>
        }
        right={
          <Pane title="MACHINE_MIND::LOGS">
            <div className="space-y-2 text-xs font-mono">
              <div className="flex gap-2">
                <span className="text-terminal">[SYS]</span>
                <span className="opacity-70">Boot sequence complete.</span>
              </div>
              <div className="flex gap-2">
                <span className="text-discovery">[NET]</span>
                <span className="opacity-70">Listening on 0.0.0.0:3000</span>
              </div>
              <div className="flex gap-2">
                <span className="text-error">[MEM]</span>
                <span className="opacity-70">Heap verified.</span>
              </div>
              <div className="flex gap-2">
                <span className="text-synapse">[BUS]</span>
                <span className="opacity-70">Enabling Yellow Protocol...</span>
              </div>
            </div>
          </Pane>
        }
      />
    </Shell>
  );
}
