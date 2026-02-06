import { useEffect, useRef, useState, useCallback } from 'react';
import { AgentBrain, BrainStatus, Provider, BrainLog } from '@/lib/agent-brain';
import { useYellow } from './useYellow';

export function useAgentBrain() {
  const { client: yellowClient } = useYellow();
  const brainRef = useRef<AgentBrain | null>(null);

  // React State Mirrors
  const [status, setStatus] = useState<BrainStatus>('IDLE');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const [logs, setLogs] = useState<BrainLog[]>([]);
  const [streamContent, setStreamContent] = useState<string>('');

  useEffect(() => {
    if (!yellowClient || brainRef.current) return;

    // Instantiate Brain
    const brain = new AgentBrain(yellowClient);
    brainRef.current = brain;

    // Event Listeners
    const handleUpdate = (e: CustomEvent) => {
        setStatus(e.detail.status);
        setProviders(e.detail.providers);
        setActiveProvider(e.detail.activeProvider);
    };

    const handleLog = (e: CustomEvent) => {
        setLogs(prev => [...prev.slice(-49), e.detail]);
    };

    const handleContent = (e: CustomEvent) => {
        setStreamContent(prev => prev + e.detail);
    };

    brain.addEventListener('update', handleUpdate as EventListener);
    brain.addEventListener('log', handleLog as EventListener);
    brain.addEventListener('content', handleContent as EventListener);

    return () => {
        brain.removeEventListener('update', handleUpdate as EventListener);
        brain.removeEventListener('log', handleLog as EventListener);
        brain.removeEventListener('content', handleContent as EventListener);
    };
  }, [yellowClient]);

  // Actions
  const startParam = useCallback(async (prompt: string) => {
      setStreamContent(''); // Clear previous
      setLogs([]); // Optional: Clear logs
      await brainRef.current?.start(prompt);
  }, [yellowClient]);

  const scanRegistry = useCallback(async (category: string = 'finance') => {
      if (!brainRef.current) return [];
      const names = await brainRef.current.searchRegistry(category);
      // We also trigger inspection for all of them to populate providers state
      await Promise.all(names.map(name => brainRef.current?.inspectProvider(name)));
      return names;
  }, [yellowClient]);
  
  const inspectProvider = useCallback(async (ensName: string) => {
      if (!brainRef.current) return null;
      return await brainRef.current.inspectProvider(ensName);
  }, [yellowClient]);

  const stop = useCallback(() => brainRef.current?.stop(), [yellowClient]);

  return {
      status,
      providers,
      activeProvider,
      logs,
      streamContent,
      start: startParam,
      scanRegistry,
      inspectProvider,
      stop
  };
}
