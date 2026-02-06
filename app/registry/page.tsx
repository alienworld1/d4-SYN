"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { useAgentBrain } from '@/hooks/useAgentBrain';
import { Provider } from '@/lib/agent-brain';
import { formatEther } from 'viem';
import { Search, Server, Shield, Zap } from 'lucide-react';

export default function RegistryPage() {
    const { scanRegistry, providers: brainProviders } = useAgentBrain();
    const [isScanning, setIsScanning] = useState(true);
    const [sortBy, setSortBy] = useState<'trust' | 'price' | 'bond'>('trust');
    const [filterCategory, setFilterCategory] = useState<string>('finance');

    useEffect(() => {
        let mounted = true;
        const scan = async () => {
            setIsScanning(true);
            try {
                if (scanRegistry) {
                   await scanRegistry(filterCategory);
                }
            } catch (error) {
                console.error("Scan failed", error);
            } finally {
                if (mounted) setIsScanning(false);
            }
        };
        scan();
        return () => { mounted = false; };
    }, [scanRegistry, filterCategory]);

    // Sort providers
    const sortedProviders = [...brainProviders].sort((a, b) => {
        if (sortBy === 'trust') return b.trustScore - a.trustScore;
        if (sortBy === 'price') return a.lastKnownPrice - b.lastKnownPrice; // Ascending for price
        if (sortBy === 'bond') return Number(b.bondAmount) - Number(a.bondAmount);
        return 0;
    });

    return (
        <Shell>
            <div className="flex flex-col h-full w-full overflow-hidden">
                {/* HEADER */}
                <header className="h-14 border-b border-grid flex justify-between items-center px-6 bg-void/80 backdrop-blur-md z-30 shrink-0">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                            <div className="text-xl font-bold tracking-tighter text-white font-mono group-hover:text-idle transition-colors">
                                d4-syn
                            </div>
                            <span className="text-gray-600">/</span>
                            <div className="text-sm text-idle font-mono tracking-widest">
                                REGISTRY
                            </div>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                         {/* CATEGORY FILTER */}
                         <div className="flex gap-2 border-r border-gray-800 pr-4 mr-2">
                            {['finance', 'quant'].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={`px-3 py-1 uppercase border transition-all ${
                                        filterCategory === cat 
                                        ? 'border-idle text-idle bg-idle/10 shadow-[0_0_10px_rgba(0,255,65,0.2)]' 
                                        : 'border-gray-800 text-gray-600 hover:text-gray-400 hover:border-gray-600'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                         </div>

                         <div className="flex gap-2">
                             <button 
                                onClick={() => setSortBy('trust')} 
                                className={`px-3 py-1 border ${sortBy === 'trust' ? 'border-idle text-idle' : 'border-gray-800 text-gray-500'} hover:border-gray-600`}
                             >
                                SORT:TRUST
                             </button>
                             <button 
                                onClick={() => setSortBy('price')} 
                                className={`px-3 py-1 border ${sortBy === 'price' ? 'border-idle text-idle' : 'border-gray-800 text-gray-500'} hover:border-gray-600`}
                             >
                                SORT:PRICE
                             </button>
                             <button 
                                onClick={() => setSortBy('bond')} 
                                className={`px-3 py-1 border ${sortBy === 'bond' ? 'border-idle text-idle' : 'border-gray-800 text-gray-500'} hover:border-gray-600`}
                             >
                                SORT:BOND
                             </button>
                         </div>
                    </div>
                </header>

                {/* CONTENT */}
                <main className="flex-1 overflow-y-auto p-6">
                    {/* STATUS BAR */}
                    <div className="mb-6 flex items-center justify-between font-mono text-sm">
                        <div className="flex items-center gap-2">
                            <Search size={16} className={isScanning ? "text-warn animate-pulse" : "text-gray-500"} />
                            <span className={isScanning ? "text-warn" : "text-gray-500"}>
                                {isScanning ? "SCANNING_D4_REGISTRY..." : `SCAN_COMPLETE: ${sortedProviders.length} NODES FOUND`}
                            </span>
                        </div>
                    </div>

                    {/* GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sortedProviders.map((provider) => (
                            <Link href={`/agent/${provider.ensName}`} key={provider.ensName} className="block group">
                                <Panel className="h-full hover:border-idle transition-colors relative overflow-hidden group-hover:shadow-[0_0_15px_rgba(0,255,65,0.1)]">
                                    <div className="p-4 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="h-10 w-10 bg-grid flex items-center justify-center border border-gray-800 group-hover:border-idle/50 text-white font-bold text-lg">
                                                {provider.ensName.slice(0, 2).toUpperCase()}
                                            </div>
                                            <Badge variant={provider.trustScore > 80 ? "idle" : provider.trustScore > 50 ? "warn" : "heat"}>
                                                TS: {provider.trustScore}
                                            </Badge>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-idle font-mono truncate">
                                                {provider.ensName}
                                            </h3>
                                            <div className="text-xs text-gray-500 truncate">
                                                {provider.endpoint}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-4 border-t border-gray-800">
                                            <div>
                                                <div className="text-gray-600 mb-0.5">PRICE</div>
                                                <div className="text-data">${provider.lastKnownPrice}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-gray-600 mb-0.5">BOND</div>
                                                <div className="text-white">{formatEther(provider.bondAmount)} ETH</div>
                                            </div>
                                            <div className="col-span-2 pt-2">
                                                <div className="text-gray-600 mb-0.5">STATUS</div>
                                                <div className={provider.status === 'active' || provider.status === 'online' ? "text-idle" : "text-gray-500"}>
                                                    ● {provider.status.toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Unbonding Warning Overlay */}
                                    {provider.isUnbonding && (
                                        <div className="absolute inset-0 bg-void/80 backdrop-blur-[1px] flex items-center justify-center border border-dashed border-heat/50">
                                            <div className="bg-void border border-heat text-heat px-3 py-1 text-xs font-bold animate-pulse">
                                                UNBONDING
                                            </div>
                                        </div>
                                    )}
                                </Panel>
                            </Link>
                        ))}
                    </div>
                    
                    {!isScanning && sortedProviders.length === 0 && (
                         <div className="flex flex-col items-center justify-center h-64 text-gray-600 font-mono">
                             <Server size={48} className="mb-4 opacity-20" />
                             <p>NO AGENTS DETECTED IN SECTOR</p>
                             <p className="text-xs mt-2">Check connection or change search category</p>
                         </div>
                    )}
                </main>
            </div>
        </Shell>
    );
}
