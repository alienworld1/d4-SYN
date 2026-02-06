import { Panel } from "@/components/ui/Panel";
import { Ticker } from "@/components/ui/Ticker";

export function ProviderMetrics() {
    return (
      <div className="space-y-4">
        <MetricCard label="LIQUID REVENUE" value="12.450" unit="ETH" delta="+0.4%" />
        <MetricCard label="SLA EFFICIENCY" value="99.9" unit="%" color="text-idle" />
        <MetricCard label="ACTIVE STREAMS" value="04" color="text-data" />
        <MetricCard label="TOTAL SETTLED" value="$42,000" />
      </div>
    );
  }
  
  function MetricCard({ label, value, unit, delta, color = "text-white" }: { label: string, value: string, unit?: string, delta?: string, color?: string }) {
    return (
      <div className="border border-grid bg-void/50 p-4 transition-all hover:bg-void hover:border-white/20">
        <div className="text-[10px] text-gray-500 tracking-widest mb-1 font-sans font-bold">{label}</div>
        <div className="flex items-end justify-between">
           <div className={`text-2xl font-mono ${color} flex items-baseline gap-1`}>
              <Ticker value={value} />
              {unit && <span className="text-sm opacity-50">{unit}</span>}
           </div>
           {delta && <div className="text-xs text-idle mb-1">{delta}</div>}
        </div>
      </div>
    );
  }
