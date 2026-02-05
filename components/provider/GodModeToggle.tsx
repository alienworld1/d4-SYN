import { useState } from "react";

export function GodModeToggle() {
  const [conjest, setConjest] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleCongestion = async () => {
    setLoading(true);
    const newState = !conjest;
    
    // Simulate Congestion via Admin API
    // Price spike: 0.005 -> 0.05
    const newPrice = newState ? 0.05 : 0.005;

    try {
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
           'Content-Type': 'application/json',
        },
        body: JSON.stringify({
           agentId: 'fast-finance-agent',
           price: newPrice 
        })
      });
      setConjest(newState);
    } catch (e) {
      console.error("Failed to toggle god mode", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-grid bg-void/50 p-6">
      <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-4">GOD_MODE::SIMULATION</h3>
      
      <div className="flex items-center justify-between">
         <span className={`text-sm tracking-widest ${conjest ? 'text-heat animate-pulse' : 'text-gray-400'}`}>
           {conjest ? "CONGESTION: HIGH" : "CONGESTION: NOMINAL"}
         </span>

         <button
           onClick={toggleCongestion}
           disabled={loading}
           className={`
             relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out border
             ${conjest ? 'bg-heat/20 border-heat' : 'bg-void border-gray-600'}
             disabled:opacity-50
           `}
         >
           <span
             className={`
               block w-4 h-4 m-1 rounded-full transition-transform duration-200 ease-in-out
               ${conjest ? 'translate-x-6 bg-heat' : 'translate-x-0 bg-gray-600'}
             `}
           />
         </button>
      </div>

      <div className="mt-4 text-[10px] text-gray-600 font-mono">
        {conjest ? (
            <div className="text-heat">
               Warning: Latency spike &gt; 500ms
               <br/>
               Price Multiplier: 10x
            </div>
        ) : (
            <div>
               Network: Stable
               <br/>
               Price: Standard
            </div>
        )}
      </div>
    </div>
  );
}
