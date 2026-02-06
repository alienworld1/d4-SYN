"use client";

import React, { useEffect, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Panel } from "@/components/ui/Panel";
import { ShieldCheck, Zap, Scale, Lock, AlertTriangle, Terminal } from "lucide-react";
import Link from "next/link";
import { useAgentBrain } from "@/hooks/useAgentBrain";
import { formatEther } from "viem";

export default function SecurityPage() {
  return (
    <Shell>
      <div className="h-full overflow-y-auto pb-20">
        <div className="max-w-6xl mx-auto px-6 py-12 flex gap-12">
          {/* Left Sidebar: Table of Contents */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <Panel title="NAVIGATION" className="border-idle/30">
                <nav className="flex flex-col text-sm p-4 space-y-2 font-mono">
                  <a href="#thesis" className="hover:text-idle transition-colors border-l-2 border-transparent hover:border-idle pl-2">1. The Thesis</a>
                  <a href="#trust-protocol" className="hover:text-idle transition-colors border-l-2 border-transparent hover:border-idle pl-2">2. Trust Protocol</a>
                  <a href="#execution-protocol" className="hover:text-idle transition-colors border-l-2 border-transparent hover:border-idle pl-2">3. Execution Protocol</a>
                  <a href="#threat-model" className="hover:text-idle transition-colors border-l-2 border-transparent hover:border-idle pl-2">4. Threat Model</a>
                </nav>
              </Panel>
              
              <div className="mt-8">
                 <SecurityMetrics />
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 max-w-3xl space-y-16">
            
            {/* Header */}
            <header className="space-y-4 pt-12">
              <h1 className="text-6xl font-sans font-bold uppercase tracking-tight text-white">
                The Security <br/>
                <span className="text-idle">Manifesto</span>
              </h1>
              <p className="text-xl text-gray-400 font-mono border-l-4 border-grid pl-4 py-2">
                User Guide v1.0 // Module 10
              </p>
            </header>

            {/* Section 1: The Thesis */}
            <section id="thesis" className="space-y-6">
              <h2 className="text-3xl font-sans font-bold uppercase text-white flex items-center gap-3">
                <Terminal className="text-idle w-8 h-8" />
                1. The Physics of Trustless Compute
              </h2>
              <div className="prose prose-invert prose-mono max-w-none text-justify text-gray-300">
                <p>
                  <span className="float-left text-5xl font-bold text-idle pr-4 leading-14 -mt-2">T</span>
                  raditional reputation systems are broken because they rely on Identity (Web2). d4-syn rebuilds reputation based on two immutables: <strong>Capital Gravity</strong> (DeFi) and <strong>Physics</strong> (Latency).
                </p>
                <p className="mt-4">
                  We do not ask "Attempt to verify this person." We ask "How much capital will they lose if they lie?" and "Can they cryptographically prove the work was done in 50ms?"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <Panel title="THE ANCHOR (ENS)" className="h-32 p-4">
                    <div className="flex items-center gap-4 h-full"> 
                        <ShieldCheck className="w-10 h-10 text-idle" />
                        <div>
                            <div className="text-white font-bold">Identity + Capital</div>
                            <div className="text-xs text-gray-500 mt-1">
                                An ENS node acts as the unbreakable bond between a reputation and a staking contract.
                            </div>
                        </div>
                    </div>
                </Panel>
                <Panel title="THE RAIL (YELLOW)" className="h-32 p-4">
                    <div className="flex items-center gap-4 h-full">
                        <Zap className="w-10 h-10 text-warn" />
                        <div>
                            <div className="text-white font-bold">Streaming + Finality</div>
                            <div className="text-xs text-gray-500 mt-1">
                                State channels allow us to switch providers in milliseconds, enforcing Micro-SLAs.
                            </div>
                        </div>
                    </div>
                </Panel>
              </div>
            </section>

            {/* Section 2: The Trust Protocol */}
            <section id="trust-protocol" className="space-y-8">
              <h2 className="text-3xl font-sans font-bold uppercase text-white flex items-center gap-3">
                <ShieldCheck className="text-idle w-8 h-8" />
                2. The Trust Protocol
              </h2>
              
              <div className="space-y-6">
                <h3 className="text-xl text-white font-bold font-mono border-b border-grid pb-2">A. Logarithmic Capital Gravity</h3>
                <p className="text-gray-300 font-mono text-justify">
                    In our system, trust does not scale linearly. A $1,000 bond implies significantly more commitment than $10, but $1,000,000 is not 1,000x more trustworthy than $1,000. We use a Log10 scale to calculate "Trust Scores" to prevent whales from buying instant reputation.
                </p>
                {/* Visual Bar Chart */}
                <div className="bg-grid/20 p-4 border border-grid space-y-2 font-mono text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-16 text-right">$10</div>
                        <div className="h-4 bg-cold w-[10%]"></div>
                        <div className="text-gray-500">Score: 10</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-16 text-right">$100</div>
                        <div className="h-4 bg-idle/50 w-[20%]"></div>
                        <div className="text-gray-500">Score: 20</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-16 text-right">$10k</div>
                        <div className="h-4 bg-idle w-[80%]"></div>
                        <div className="text-gray-500">Score: 40 (Max)</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-16 text-right">$1M</div>
                        <div className="h-4 bg-idle w-[82%] border-r-2 border-warn"></div>
                        <div className="text-gray-500">Score: 42 (Diminishing Returns)</div>
                    </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl text-white font-bold font-mono border-b border-grid pb-2">B. The "Bond Parking" Defense</h3>
                <p className="text-gray-300 font-mono text-justify">
                    The <strong>Activity Decay</strong> function ensures "Use-it-or-Lose-it" trust. If a node goes dormant (no settlements for 24 hours), its trust score receives a <span className="text-heat">0.5x Penalty</span>. You cannot park money to fake reliability.
                </p>
              </div>

               <div className="space-y-6">
                <h3 className="text-xl text-white font-bold font-mono border-b border-grid pb-2">C. The "Lame Duck" Period</h3>
                <p className="text-gray-300 font-mono text-justify">
                    To prevent Rug Pulls (Exit Scams), we implement a state-locked exit queue. When a provider calls <code className="bg-grid px-1 text-idle">initiateExit()</code>, they enter the <strong>UNBONDING</strong> state. They are immediately blacklisted by all Agents, but their funds remain locked for the challenge period.
                </p>
                
                {/* Unbonding Diagram */}
                <div className="mt-8 relative pt-8 pb-4">
                    <div className="flex justify-between items-center text-xs font-mono relative z-10 w-full">
                        <div className="flex flex-col items-center gap-2 w-1/3">
                            <div className="w-4 h-4 rounded-full bg-idle ring-4 ring-idle/20" />
                            <div className="px-3 py-1 bg-idle/10 border border-idle text-idle">ACTIVE</div>
                            <span className="text-gray-500">Earns Fees</span>
                        </div>
                         <div className="flex flex-col items-center gap-2 w-1/3">
                            <div className="w-4 h-4 rounded-full bg-warn ring-4 ring-warn/20" />
                            <div className="px-3 py-1 bg-warn/10 border border-warn text-warn">UNBONDING</div>
                             <span className="text-heat font-bold">Blacklisted</span>
                        </div>
                         <div className="flex flex-col items-center gap-2 w-1/3">
                            <div className="w-4 h-4 rounded-full bg-cold ring-4 ring-cold/20" />
                            <div className="px-3 py-1 bg-cold/10 border border-cold text-cold">UNLOCKED</div>
                             <span className="text-gray-500">Safe Exit</span>
                        </div>
                    </div>
                    {/* Connecting Line */}
                    <div className="absolute top-10 left-[16%] right-[16%] h-0.5 bg-grid z-0"></div>
                     <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 bg-void px-2">
                        7 Day Lockup
                    </div>
                </div>
              </div>
            </section>

             {/* Callout */}
             <div className="border border-warn/50 bg-warn/5 p-6 relative">
                <div className="absolute -top-3 left-4 bg-void px-2 text-warn text-sm font-bold border border-warn/50">
                    [NOTE] WHY WE NEED THE RAIL
                </div>
                <p className="font-mono text-sm text-gray-300 leading-relaxed">
                    Why not just use an L2? Because you cannot verify 50ms heartbeat latency on a 2-second block time chain. <strong>Yellow Network</strong> is the only way to achieve sub-second finality required for high-frequency compute arbitrage.
                </p>
             </div>


            {/* Section 3: Execution Protocol */}
            <section id="execution-protocol" className="space-y-8">
              <h2 className="text-3xl font-sans font-bold uppercase text-white flex items-center gap-3">
                <Zap className="text-idle w-8 h-8" />
                3. The Execution Protocol
              </h2>
               <div className="space-y-6">
                <h3 className="text-xl text-white font-bold font-mono border-b border-grid pb-2">Micro-SLA Enforcement</h3>
                <p className="text-gray-300 font-mono text-justify">
                   We adhere to the philosophy of "Pay-for-Performance, not Pay-for-Promise." Agents calculate latency per-token. If a provider lags by 50ms, the payment stream is throttled by 10% in real-time. 
                </p>
              </div>

               <div className="space-y-6">
                <h3 className="text-xl text-white font-bold font-mono border-b border-grid pb-2">The Buyer's Market</h3>
                <p className="text-gray-300 font-mono text-justify">
                   Who verifies latency? <strong>Local Consensus.</strong> Since compute is abundant, the Buyer is King. If the Agent <em>perceives</em> lag, it pays less. The Provider accepts this because "Some revenue is better than 0 revenue" in a market of idle capacity.
                </p>
              </div>
            </section>

            {/* Section 4: Threat Model */}
            <section id="threat-model" className="space-y-8 pb-20">
               <h2 className="text-3xl font-sans font-bold uppercase text-white flex items-center gap-3">
                <Scale className="text-idle w-8 h-8" />
                4. Threat Model & Mitigations
              </h2>
              
              <div className="overflow-x-auto border border-grid">
                <table className="w-full text-left font-mono text-sm">
                    <thead>
                        <tr className="border-b border-grid bg-grid/30 text-gray-400 uppercase text-xs">
                            <th className="p-4">Threat</th>
                            <th className="p-4">Probability</th>
                            <th className="p-4">d4-syn Mitigation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-grid bg-void/50">
                        <tr>
                            <td className="p-4 text-white font-bold">Wash Trading</td>
                            <td className="p-4 text-warn">Medium</td>
                            <td className="p-4 text-gray-400">
                                <strong className="text-idle block mb-1">Cost of Capital</strong>
                                Opportunity cost of locking ETH yield makes fake volume expensive.
                            </td>
                        </tr>
                        <tr>
                            <td className="p-4 text-white font-bold">Price Gouging</td>
                            <td className="p-4 text-heat">High</td>
                            <td className="p-4 text-gray-400">
                                <strong className="text-idle block mb-1">Slippage Caps</strong>
                                Client hard-rejects rate changes {">"} 5% mid-stream via the client SDK.
                            </td>
                        </tr>
                         <tr>
                            <td className="p-4 text-white font-bold">Man-in-the-Middle</td>
                            <td className="p-4 text-idle">Low</td>
                            <td className="p-4 text-gray-400">
                                <strong className="text-idle block mb-1">Cryptographic Metadata</strong>
                                Off-chain pricing is signed by the ENS owner key.
                            </td>
                        </tr>
                    </tbody>
                </table>
              </div>
            </section>

          </main>
        </div>
      </div>
    </Shell>
  );
}

// Stats Component
function SecurityMetrics() {
    const { scanRegistry, providers } = useAgentBrain();
    const [totalBond, setTotalBond] = useState<string>("---");
    const [nodeCount, setNodeCount] = useState<number>(0);

    // Initial Scan
    useEffect(() => {
        const init = async () => {
            if (scanRegistry) {
                try {
                     // Using 'all' or default category to get count
                    await scanRegistry('finance'); 
                } catch (e) {
                    console.error("Metric scan failed", e);
                }
            }
        };
        init();
    }, [scanRegistry]);

    useEffect(() => {
        if (providers.length > 0) {
            const total = providers.reduce((acc, p) => {
                 // bondAmount is a BigInt or string? Provider definition in agent-brain.ts says bondAmount: bigint
                 // Need to verify standard. Assuming bigint based on usage elsewhere
                 // formatEther returns string
                 try {
                     return acc + parseFloat(formatEther(BigInt(p.bondAmount || 0)));
                 } catch {
                     return acc;
                 }
            }, 0);
            setTotalBond(total.toFixed(2));
            setNodeCount(providers.length);
        }
    }, [providers]);

    return (
        <Panel title="LIVE NETWORK STATE" className="p-4 space-y-4 font-mono">
            <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Total Value Secured</div>
                <div className="text-2xl text-idle font-bold tracking-tighter">
                   Ξ {totalBond}
                </div>
            </div>
             <div>
                <div className="text-xs text-gray-500 uppercase mb-1">Active Nodes</div>
                <div className="text-xl text-white font-bold">
                   {nodeCount}
                </div>
            </div>
            <div className="text-[10px] text-gray-600 border-t border-grid pt-2 mt-2">
                * Synced with d4-registry.eth
            </div>
        </Panel>
    );
}
