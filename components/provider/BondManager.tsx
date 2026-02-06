import { useState } from "react";
import { useServiceBond } from "@/hooks/useServiceBond";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
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
    <Panel className="h-full relative overflow-visible" title="CAPITAL_CONSOLE::BOND">
      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-idle opacity-50 z-20"/>

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

      <div className="flex-1 flex flex-col justify-center p-6">
        {activeTab === "deposit" && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-widest font-sans font-bold">Stake Amount (ETH)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    disabled={isUnbonding || isLoading}
                    className="w-full bg-void border-b border-idle text-4xl font-mono text-idle focus:outline-none focus:border-white py-2 placeholder-idle/30"
                    placeholder="0.0"
                  />
                  <span className="absolute right-0 bottom-4 text-xs text-idle/50 font-mono">ETH</span>
                </div>
             </div>

             <div className="text-center">
               {!isLoading && (
                 <Button
                   onClick={handleDeposit}
                   disabled={isUnbonding}
                   variant="idle"
                   className="w-full py-4 text-lg font-bold tracking-widest"
                 >
                   {isUnbonding ? "LOCKED (UNBONDING)" : "[ EXECUTE STAKE ]"}
                 </Button>
               )}
               {isLoading && (
                 <div className="text-idle animate-pulse font-mono tracking-widest py-4">
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
                    <Button
                      onClick={() => initiateExit()}
                      disabled={isLoading}
                      variant="heat"
                      className="w-full py-6 text-xl tracking-widest font-bold"
                    >
                      {isLoading ? "PROCESSING..." : "[ INITIATE EXIT ]"}
                    </Button>
                 )}

                 {isUnbonding && (
                   <div className="text-center space-y-4">
                     <div className="text-xs text-heat uppercase tracking-widest animate-pulse font-sans font-bold">Unbonding in Progress</div>
                     <div className="text-6xl font-mono text-heat tracking-tighter">
                       00:{countdown.toString().padStart(2, '0')}
                     </div>
                     <div className="text-xs text-gray-500">Capital Lock Active</div>
                   </div>
                 )}

                 {isUnbonded && (
                    <Button
                      onClick={() => finalizeExit()}
                      disabled={isLoading}
                      variant="idle"
                      className="w-full py-6 text-xl tracking-widest font-bold"
                    >
                      {isLoading ? "WITHDRAWING..." : "[ WITHDRAW FUNDS ]"}
                    </Button>
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
    </Panel>
  );
}
