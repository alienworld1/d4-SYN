"use client";

import { useEffect, useState } from 'react';
import { YellowClient, YellowState, YellowSLAStats } from '@/lib/yellow-client';
import { useSessionWallet } from './useSessionWallet';

// Global singleton to persist connection across re-renders
let globalClient: YellowClient | null = null;

export function useYellow() {
  const { privateKey } = useSessionWallet();
  const [state, setState] = useState<YellowState>({
    status: 'disconnected',
    balance: BigInt(0),
    channelId: null,
    provider: null,
    address: null
  });

  useEffect(() => {
    if (!privateKey) return;

    // Initialize singleton if needed
    if (!globalClient) {
      globalClient = new YellowClient(privateKey);
      globalClient.init().catch(err => {
        console.error("Yellow Init Failed", err);
      });
    }

    // Subscribe to updates
    const unsubscribe = globalClient.subscribe((newState) => {
      setState(newState);
    });
    
    return () => {
      unsubscribe();
    };
  }, [privateKey]);

  return {
    state,
    client: globalClient,
    openChannel: async (provider: string) => globalClient?.openChannel(provider),
    pay: async (amount: number) => globalClient?.pay(amount),
    payWithSLA: async (chunkId: number, baseRate: number) => globalClient?.payWithSLA(chunkId, baseRate),
    getTelemetry: () => globalClient?.getTelemetry(),
    eventBus: globalClient?.eventBus, 
    closeChannel: async () => globalClient?.closeChannel(),
    isConnected: state.status === 'connected' || state.status === 'active',
    isActive: state.status === 'active'
  };
}
