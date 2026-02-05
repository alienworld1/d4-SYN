import { useState } from "react";
import { useServiceBond } from "@/hooks/useServiceBond";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function BondManager() {
  const { 
    amount, 
    bondState, 
    countdown, 
    isOwner, 
    deposit, 
    initiateExit, 
    finalizeExit,
    isWritePending,
    isConfirming 
  } = useServiceBond();

  const [inputAmount, setInputAmount] = useState("0.0");
  const [activeTab, setActiveTab] = useState<"deposit" | "manage">("deposit");

  const isUnbonding = bondState === "UNBONDING";
  const isUnbonded = bondState === "UNBONDED";
  const isLoading = isWritePending || isConfirming;

  const handleDeposit = () => {
    if (!inputAmount || isLoading) return;
    deposit(inputAmount);
  };

  return (
    <div className="flex flex-col h-full border border-grid bg-void/80 p-6 relative">
      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-idle opacity-50"/>

      <h2 className="text-xl font-bold text-idle tracking-widest mb-6">CAPITAL_CONSOLE::BOND</h2>

      <div className="grid grid-cols-2 gap-0 mb-8 border-b border-grid">
        <button
          onClick={() => setActiveTab("deposit")}
          className={`
            py-3 font-mono text-sm tracking-widest transition-colors
            ${activeTab === "deposit" ? "bg-idle/10 text-idle border-b-2 border-idle" : "text-gray-500 hover:text-gray-300"}
          `}
        >
          [DEPOSIT]
        </button>
        <button
          onClick={() => setActiveTab("manage")}
          className={`
            py-3 font-mono text-sm tracking-widest transition-colors
            ${activeTab === "manage" ? "bg-heat/10 text-heat border-b-2 border-heat" : "text-gray-500 hover:text-gray-300"}
          `}
        >
          [MANAGE]
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {activeTab === "deposit" && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-widest">Stake Amount (ETH)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    disabled={isUnbonding || isLoading}
                    className="w-full bg-void border-b border-idle text-4xl font-mono text-idle focus:outline-none focus:border-white py-2"
                    placeholder="0.0"
                  />
                  <span className="absolute right-0 bottom-4 text-xs text-idle/50">ETH</span>
                </div>
             </div>

             <div className="text-center">
               {!isLoading && (
                 <button
                   onClick={handleDeposit}
                   disabled={isUnbonding}
                   className={`
                     w-full py-4 text-lg font-bold tracking-widest border border-idle
                     hover:bg-idle hover:text-void transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-idle
                   `}
                 >
                   {isUnbonding ? "LOCKED (UNBONDING)" : "[ EXECUTE STAKE ]"}
                 </button>
               )}
               {isLoading && (
                 <div className="text-idle animate-pulse font-mono tracking-widest">
                   PROCESSING ON-CHAIN...
                 </div>
               )}
             </div>
          </div>
        )}

        {activeTab === "manage" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {!isOwner ? (
               <div className="text-center p-6 border border-gray-800 text-gray-500">
                 <div className="text-4xl mb-4">🔒</div>
                 <div>ACCESS DENIED</div>
                 <div className="text-xs mt-2">Owner Wallet Required</div>
                 <div className="mt-4 flex justify-center">
                     <ConnectButton />
                 </div>
               </div>
            ) : (
              <div className="space-y-6">
                 {bondState === "ACTIVE" && (
                    <button
                      onClick={() => initiateExit()}
                      disabled={isLoading}
                      className="w-full py-6 text-xl text-heat border border-heat hover:bg-heat hover:text-void transition-all tracking-widest font-bold"
                    >
                      {isLoading ? "PROCESSING..." : "[ INITIATE EXIT ]"}
                    </button>
                 )}

                 {isUnbonding && (
                   <div className="text-center space-y-4">
                     <div className="text-xs text-heat uppercase tracking-widest animate-pulse">Unbonding in Progress</div>
                     <div className="text-6xl font-mono text-heat">
                       00:{countdown.toString().padStart(2, '0')}
                     </div>
                     <div className="text-xs text-gray-500">Capital Lock Active</div>
                   </div>
                 )}

                 {isUnbonded && (
                    <button
                      onClick={() => finalizeExit()}
                      disabled={isLoading}
                      className="w-full py-6 text-xl text-white border border-white hover:bg-white hover:text-black transition-all tracking-widest font-bold"
                    >
                      {isLoading ? "WITHDRAWING..." : "[ WITHDRAW FUNDS ]"}
                    </button>
                 )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-grid grid grid-cols-2 gap-4 text-xs font-mono">
        <div>
           <div className="text-gray-500 mb-1">CURRENT BOND</div>
           <div className="text-xl text-idle">{amount} ETH</div>
        </div>
        <div className="text-right">
           <div className="text-gray-500 mb-1">STATUS</div>
           <div className={`${bondState === 'ACTIVE' ? 'text-idle' : 'text-heat'}`}>
             {bondState}
           </div>
        </div>
      </div>
    </div>
  );
}
