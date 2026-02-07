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
                  <a href="#core-problem" className="hover:text-idle transition-colors border-l-2 border-transparent hover:border-idle pl-2">1. The Core Problem</a>
                  <a href="#game-theory" className="hover:text-idle transition-colors border-l-2 border-transparent hover:border-idle pl-2">2. Making Malice Expensive</a>
                  <a href="#digital-real-estate" className="hover:text-idle transition-colors border-l-2 border-transparent hover:border-idle pl-2">3. Identity as an Asset</a>
                  <a href="#quality-of-service" className="hover:text-idle transition-colors border-l-2 border-transparent hover:border-idle pl-2">4. The Customer is Oracle</a>
                   <a href="#threat-model" className="hover:text-idle transition-colors border-l-2 border-transparent hover:border-idle pl-2">5. Threat Model Analysis</a>
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
              <h1 className="text-6xl font-sans font-bold uppercase tracking-tight text-white leading-none">
                Security at the<br/>
                <span className="text-idle">Speed of Light</span>
              </h1>
              <p className="text-xl text-gray-400 font-mono border-l-4 border-grid pl-4 py-2">
                Engineering Whitepaper // Module 10.5
              </p>
            </header>

            {/* Section A: The Core Problem */}
            <section id="core-problem" className="space-y-6">
              <h2 className="text-3xl font-sans font-bold uppercase text-white flex items-center gap-3">
                <Terminal className="text-idle w-8 h-8" />
                1. The Core Problem
              </h2>
              <div className="prose prose-invert max-w-none text-justify text-gray-300 font-sans leading-relaxed">
                 <p className="mb-4">
                  In traditional finance, fraud is prevented by friction: 2-day settlement times, chargebacks, and manual reviews.
                </p>
                <p className="mb-4">
                  Autonomous Agents cannot afford friction. They trade at millisecond speeds. If an Agent is tricked, it can be drained instantly with no recourse.
                </p>
                <p>
                  We cannot rely on human oversight. We must rely on <strong>Economic Determinism</strong>. Security in d4-syn is not enforced by a moderator; it is enforced by the math of the protocol.
                </p>
              </div>

               {/* Insight Callout */}
              <div className="border-l-2 border-idle bg-idle/5 p-6 mt-6">
                <div className="text-idle text-xs font-bold uppercase tracking-widest mb-2 font-mono">
                    [ARCHITECTURAL NOTE]
                </div>
                <p className="font-sans text-sm text-gray-300">
                    Why Yellow? L2 blockchains have 2-second block times. We need 50ms heartbeat verification. State Channels are the only technology that fits the physics of this problem.
                </p>
              </div>
            </section>

            {/* Section B: Game Theory & Rationality */}
            <section id="game-theory" className="space-y-6">
              <h2 className="text-3xl font-sans font-bold uppercase text-white flex items-center gap-3">
                <ShieldCheck className="text-idle w-8 h-8" />
                2. Making Malice Expensive
              </h2>
              <div className="prose prose-invert max-w-none text-justify text-gray-300 font-sans leading-relaxed">
                <p className="mb-4">
                  We don't try to make scamming impossible. We make it <strong>unprofitable</strong>.
                </p>
                <p className="mb-4">
                  To attack the network (e.g., serve bad data), a provider must first build a high Trust Score. This requires:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4 marker:text-idle font-mono text-sm">
                    <li><strong className="text-white">Capital:</strong> Locking real ETH (Opportunity Cost).</li>
                    <li><strong className="text-white">Time:</strong> Waiting weeks for the 'Age' score to mature.</li>
                </ul>
                <p>
                  The moment a provider attempts to exit (to run away with funds), the protocol enforces a 'Lame Duck' period. Agents immediately detect the exit signal and stop streaming payments. The attacker burns their reputation for zero profit.
                </p>

                <div className="mt-8 space-y-4">
                     <h3 className="text-xl text-white font-bold font-mono border-b border-grid pb-2">Mechanic A: Activity Decay</h3>
                     <p className="text-gray-300 font-sans text-justify">
                        To prevent "Bond Parking" (where an attacker stakes $10k and goes dormant to build a fake history), we use an <strong>Activity Decay</strong> function. If a node has no certified settlements for 24 hours, its Trust Score receives a <span className="text-heat font-mono">0.5x Penalty</span>. Trust is "Use-it-or-Lose-it".
                     </p>
                </div>

              </div>

               {/* Unbonding Diagram */}
                <div className="mt-8 relative pt-8 pb-4 font-mono">
                    <div className="flex justify-between items-center text-xs relative z-10 w-full">
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
            </section>

             {/* Section C: Digital Real Estate */}
            <section id="digital-real-estate" className="space-y-6">
              <h2 className="text-3xl font-sans font-bold uppercase text-white flex items-center gap-3">
                <Scale className="text-idle w-8 h-8" />
                3. Identity is an Asset, Not a User
              </h2>
               <div className="prose prose-invert max-w-none text-justify text-gray-300 font-sans leading-relaxed">
                <p className="mb-4">
                  A common question is: <em>'What if I forget to renew my ENS domain and someone takes my Bond?'</em>
                </p>
                <p className="mb-4">
                  In d4-syn, we treat the ENS Domain like a <strong>Business License</strong> or a piece of <strong>Digital Real Estate</strong>. The reputation and the bonded capital belong to the <em>Name</em>, not the <em>Wallet</em>.
                </p>
                <p>
                   This is a feature. It ensures that 'Dead Capital' doesn't rot in the system. If a business shuts down (expires), the market can recycle the identity and the bond, keeping the registry active and efficient.
                </p>
              </div>
            </section>

             {/* Section D: Quality of Service */}
             <section id="quality-of-service" className="space-y-6">
              <h2 className="text-3xl font-sans font-bold uppercase text-white flex items-center gap-3">
                <Zap className="text-idle w-8 h-8" />
                4. The Customer is the Oracle
              </h2>
               <div className="prose prose-invert max-w-none text-justify text-gray-300 font-sans leading-relaxed">
                <p className="mb-4">
                  Verifying latency on a blockchain is impossible. So we don't try.
                </p>
                <p className="mb-4">
                  We rely on <strong>Local Consensus</strong>. If an Agent perceives that a provider is slow, it automatically reduces the payment rate via the Yellow State Channel.
                </p>
                <p className="mb-8">
                   The Provider accepts this 'penalty' because earning a reduced rate on idle capacity is better than earning nothing. This aligns the incentives of the Buyer (speed) and the Seller (utilization) without needing a central arbitrator.
                </p>

                <h3 className="text-xl text-white font-bold font-mono border-b border-grid pb-2 mb-4">Micro-SLA Enforcement</h3>
                <p className="mb-4">
                   We adhere to the philosophy of "Pay-for-Performance, not Pay-for-Promise." Agents calculate latency per-token. If a provider lags by 50ms, the payment stream is throttled by 10% in real-time.
                </p>
              </div>
            </section>

             {/* Section: Threat Model (retained but compacted) */}
            <section id="threat-model" className="space-y-8 pb-20">
               <h2 className="text-3xl font-sans font-bold uppercase text-white flex items-center gap-3">
                <ShieldCheck className="text-idle w-8 h-8" />
                5. Threat Model Analysis
              </h2>
              
              <div className="overflow-x-auto border border-grid">
                <table className="w-full text-left font-mono text-sm">
                    <thead>
                        <tr className="border-b border-grid bg-grid/30 text-gray-400 uppercase text-xs">
                            <th className="p-4">Threat</th>
                            <th className="p-4">Probability</th>
                            <th className="p-4">Engineering Mitigation</th>
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
                                <strong className="text-idle block mb-1">Client-Side Slippage Caps</strong>
                                SDK enforces strict limits on mid-stream rate changes.
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
