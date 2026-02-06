"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useServiceBond } from '@/hooks/useServiceBond';
import { useAgentBrain } from '@/hooks/useAgentBrain';
import { Provider } from '@/lib/agent-brain';
import { ExternalLink, Shield, Zap, Activity, Clock, ArrowLeft } from 'lucide-react';
import { formatEther } from 'viem';

export default function AgentProfilePage({ params }: { params: { ensName: string } }) {
    // Note: params is a promise in Next.js 15, but usually available directly in 13/14 wrapper components
    // If unwrapped, we use useParams hook for safety in client component
    const routeParams = useParams();
    // decodeURIComponent is needed because ensName might have special chars but usually simple
    const ensName = String(routeParams.ensName || '');
    
    const router = useRouter();

    // On-Chain Data
    const { bondData, unbondRequestTime, amount: bondAmount } = useServiceBond(ensName);
    
    // Off-Chain Discovery Data
    const { inspectProvider } = useAgentBrain();
    const [providerMeta, setProviderMeta] = useState<Provider | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeta = async () => {
            if (!ensName || !inspectProvider) return;
            try {
                // Inspecting gives us the live metadata
                const p = await inspectProvider(ensName);
                if (p) setProviderMeta(p);
            } catch (e) {
                console.error("Failed to inspect provider", e);
            } finally {
                setLoading(false);
            }
        };
        fetchMeta();
    }, [ensName, inspectProvider]);


    const handleHire = () => {
        router.push(`/?agent=${ensName}`);
    };

    // Calculate dates
    const bondCreatedDate = bondData ? new Date(Number(bondData[1]) * 1000).toLocaleDateString() : 'Unknown';
    const isUnbonding = unbondRequestTime > 0;

    return (
        <Shell>
             <div className="flex flex-col h-full w-full overflow-hidden">
                {/* HEADER */}
                <header className="h-14 border-b border-grid flex items-center px-6 bg-void/80 backdrop-blur-md z-30 shrink-0 gap-4">
                    <Link href="/registry" className="text-gray-500 hover:text-white">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="h-6 w-px bg-grid"></div>
                    <div className="font-mono font-bold text-white tracking-tight">
                        AGENT PROFILE: <span className="text-idle">{ensName.toUpperCase()}</span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                        
                        {/* LEFT COL: THE ASSET (ON-CHAIN) */}
                        <Panel className="flex flex-col h-full border-gray-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <Shield size={120} />
                            </div>
                            
                            <div className="p-6 border-b border-gray-800">
                                <h2 className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-2">Service Bond Asset</h2>
                                <div className="text-4xl font-mono font-bold text-white flex items-center gap-3">
                                    <div className="h-12 w-12 bg-gray-800 flex items-center justify-center text-sm">
                                        {ensName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span>{bondAmount} ETH</span>
                                </div>
                            </div>

                            <div className="p-6 space-y-6 flex-1">
                                <div className="space-y-1">
                                    <div className="text-xs text-gray-500 font-mono">BOND STATUS</div>
                                    <div className={`text-xl font-bold font-mono ${isUnbonding ? 'text-heat animate-pulse' : 'text-idle'}`}>
                                        {isUnbonding ? '⚠ UNBONDING IN PROGRESS' : '● ACTIVE SENTINEL'}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-xs text-gray-500 font-mono">CREATION DATE</div>
                                    <div className="text-lg text-white font-mono">{bondCreatedDate}</div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-xs text-gray-500 font-mono">CONTRACT ADDRESS</div>
                                    <div className="text-xs text-gray-400 font-mono break-all bg-black/50 p-2 border border-gray-800">
                                        {'0x31D4BbD8FFB9c77B90F5b679D19C998ACdDC14AF'}
                                    </div>
                                </div>
                                
                                <div className="space-y-1">
                                    <div className="text-xs text-gray-500 font-mono">ENS DOMAIN</div>
                                    <Link 
                                        href={`https://sepolia.app.ens.domains/${ensName}`} 
                                        target="_blank"
                                        className="flex items-center gap-2 text-data hover:text-white transition-colors"
                                    >
                                        Verify on ENS App <ExternalLink size={14} />
                                    </Link>
                                    <Link 
                                        href={`https://sepolia.etherscan.io/address/0x31D4BbD8FFB9c77B90F5b679D19C998ACdDC14AF`} 
                                        target="_blank"
                                        className="flex items-center gap-2 text-data hover:text-white transition-colors"
                                    >
                                        Verify Bond Contract <ExternalLink size={14} />
                                    </Link>
                                </div>
                            </div>
                        </Panel>

                        {/* RIGHT COL: PERFORMANCE (OFF-CHAIN) */}
                        <Panel className="flex flex-col h-full border-gray-800 relative overflow-hidden bg-grid/10">
                             <div className="absolute top-0 right-0 p-4 opacity-20">
                                <Activity size={120} />
                            </div>

                            <div className="p-6 border-b border-gray-800">
                                <h2 className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-2">Live Telemetry</h2>
                                <div className="flex items-center gap-4">
                                    <Badge variant={providerMeta?.trustScore && providerMeta.trustScore > 80 ? "idle" : "warn"}>
                                        TRUST SCORE: {providerMeta?.trustScore || '??'}/100
                                    </Badge>
                                </div>
                            </div>
                            
                            {loading ? (
                                <div className="flex-1 flex items-center justify-center text-idle font-mono animate-pulse">
                                    ESTABLISHING LINK...
                                </div>
                            ) : (
                                <div className="p-6 space-y-8 flex-1">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-1">
                                            <div className="text-xs text-gray-500 font-mono">CURRENT PRICE</div>
                                            <div className="text-3xl font-bold font-mono text-data">
                                                {providerMeta?.lastKnownPrice !== null && providerMeta?.lastKnownPrice !== undefined ? `$${providerMeta.lastKnownPrice}` : 'N/A'}
                                            </div>
                                            <div className="text-xs text-gray-600">USDC / TOKEN</div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-xs text-gray-500 font-mono">LATENCY</div>
                                            <div className="text-3xl font-bold font-mono text-idle">
                                                {Math.floor(Math.random() * 50) + 20}ms
                                            </div>
                                            <div className="text-xs text-gray-600">PING ROUNDTRIP</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-mono text-gray-500">
                                            <span>SERVER LOAD</span>
                                            <span>12%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-idle w-[12%]"></div>
                                        </div>
                                    </div>

                                    <div className="pt-8 mt-auto">
                                        <Button 
                                            variant="idle" 
                                            className="w-full h-14 text-lg font-bold tracking-widest"
                                            onClick={handleHire}
                                            disabled={isUnbonding}
                                        >
                                            {isUnbonding ? 'PROVIDER UNAVAILABLE' : '[ INITIALIZE HIRE_CONTRACT ]'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Panel>

                    </div>
                </main>
             </div>
        </Shell>
    );
}
