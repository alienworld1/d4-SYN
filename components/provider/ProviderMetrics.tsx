export function ProviderMetrics() {
    return (
      <div className="space-y-4">
        <MetricCard label="LIQUID REVENUE" value="12.450 ETH" delta="+0.4%" />
        <MetricCard label="SLA EFFICIENCY" value="99.9%" color="text-idle" />
        <MetricCard label="ACTIVE STREAMS" value="04" color="text-data" />
        <MetricCard label="TOTAL SETTLED" value="$42,000" />
      </div>
    );
  }
  
  function MetricCard({ label, value, delta, color = "text-white" }: { label: string, value: string, delta?: string, color?: string }) {
    return (
      <div className="border border-grid bg-void/50 p-4">
        <div className="text-[10px] text-gray-500 tracking-widest mb-1">{label}</div>
        <div className="flex items-end justify-between">
           <div className={`text-2xl font-mono ${color}`}>{value}</div>
           {delta && <div className="text-xs text-idle mb-1">{delta}</div>}
        </div>
      </div>
    );
  }
