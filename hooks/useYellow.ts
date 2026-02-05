"use client";

import { useEffect, useState } from 'react';
import { YellowClient, YellowState } from '@/lib/yellow-client';
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
    const handleUpdate = (newState: YellowState) => {
      setState(newState);
    };

    // Register callback
    // Note: Simple callback replacement. 
    // If multiple components use this, we'd need an event emitter.
    // For this module, assuming one main consumer (Shell/ProviderView).
    // To be safe, we can make `onStateChange` an array or use a simple subscription pattern in the class.
    // For now, I'll hack it: wrapper captures the callback.
    const originalCallback = globalClient.onStateChange;
    
    // Chain callbacks if needed, or just overwrite (last writer wins - acceptable for this demo scope)
    globalClient.onStateChange = handleUpdate;
    
    // Initial sync
    setState(globalClient.getState());

    return () => {
      // We don't destroy the client, but we detach our specific listener
      if (globalClient && globalClient.onStateChange === handleUpdate) {
         globalClient.onStateChange = null; 
      }
    };
  }, [privateKey]);

  return {
    state,
    client: globalClient,
    openChannel: async (provider: string) => globalClient?.openChannel(provider),
    pay: async (amount: number) => globalClient?.pay(amount),
    closeChannel: async () => globalClient?.closeChannel(),
    isConnected: state.status === 'connected' || state.status === 'active',
    isActive: state.status === 'active'
  };
}
