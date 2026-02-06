import { useState, useRef, useEffect } from 'react';
import { AgentBrain, BrainLog, BrainStatus, Provider } from '@/lib/agent-brain';
import { useYellow } from '@/hooks/useYellow';

export type Message = {
    role: 'user' | 'model' | 'tool';
    content?: string;
    tool_call_id?: string;
    name?: string; 
    parts?: any[]; 
};

export function useCognitiveAgent() {
    // Brain State
    const [status, setStatus] = useState<BrainStatus | 'THINKING' | 'ACTING'>('IDLE');
    const [providers, setProviders] = useState<Provider[]>([]);
    const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
    const [logs, setLogs] = useState<BrainLog[]>([]);
    const [streamContent, setStreamContent] = useState<string>('');
    
    // Cognitive State
    const [messages, setMessages] = useState<Message[]>([]);

    const { client: yellowClient } = useYellow();
    const brainRef = useRef<AgentBrain | null>(null);

    // Initialize & Sync
    useEffect(() => {
        if (!yellowClient || brainRef.current) return;
        
        const brain = new AgentBrain(yellowClient);
        brainRef.current = brain;

        const handleUpdate = (e: CustomEvent) => {
            // Only update status from brain if we are not in cognitive "THINKING" mode
            // or if brain is effectively doing something concrete like STREAMING
            const s = e.detail.status;
            if (s !== 'IDLE') setStatus(s); 
            setProviders(e.detail.providers);
            setActiveProvider(e.detail.activeProvider);
        };

        const handleLog = (e: CustomEvent) => {
            setLogs(prev => [...prev.slice(-99), e.detail]);
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

    const addToHistory = (msg: Message) => {
        setMessages(prev => [...prev, msg]);
    };

    const processGoal = async (goal: string, preSelectedAgent?: string) => {
        if (!brainRef.current) return;
        
        const brain = brainRef.current;
        brain.log('INFO', '--- COGNITIVE MISSION START ---');
        setStreamContent(''); // Clear previous stream
        setStatus('THINKING');
        
        let content = goal;
        if (preSelectedAgent) {
             content = `${goal} \n(IMPORTANT: You must bypass discovery and immediately hire the provider '${preSelectedAgent}' using the hire_provider tool. Do not search.)`;
             // We can also potentially prime the providers list here if needed, but the tool usage is better.
             // We might want to "inspect" it first so the brain knows it exists? 
             // Ideally the LLM just calls hire_provider('name') and the tool handles it.
        }

        const initialMsg: Message = { role: 'user', content };
        let currentHistory = [initialMsg]; 
        setMessages(currentHistory);

        try {
            await runLoop(currentHistory, brain);
        } catch (e: any) {
            brain.log('ERROR', `Mission Failed: ${e.message}`);
            setStatus('ERROR');
        }
    };

    const runLoop = async (history: Message[], brain: AgentBrain) => {
        if (history.length > 20) throw new Error("Max steps exceeded");

        const response = await fetch('/api/brain/reason', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: history })
        });

        if (!response.ok) {
            const err = await response.text();
             throw new Error(`API Error: ${err}`);
        }
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const jsonStr = line.slice(6);
                if (jsonStr === '[DONE]') return;

                try {
                    const event = JSON.parse(jsonStr);
                    
                    if (event.type === 'thought') {
                        brain.log('THOUGHT', event.content);
                    }
                    
                    if (event.type === 'tool_call') {
                        setStatus('ACTING');
                        const args = event.args; 
                        const toolName = event.tool;
                        
                        brain.log('OP', `CALL: ${toolName}(${JSON.stringify(args)})`);

                        let result: any = "Success";
                        
                        try {
                            if (toolName === 'search_registry') {
                                result = await brain.searchRegistry(args.category);
                            } else if (toolName === 'inspect_provider') {
                                result = await brain.inspectProvider(args.ens_name);
                                if (!result) result = "Provider not found / No Resolver";
                            } else if (toolName === 'hire_provider') {
                                result = await brain.hireProvider(args.ens_name, args.prompt);
                                // The streaming happens via 'content' event listener attached in useEffect
                                setStatus('STREAMING'); 
                                return; // EXIT LOOP.
                            } else {
                                result = "Unknown Tool";
                            }
                        } catch (e: any) {
                            result = `Error: ${e.message}`;
                        }

                        const toolMsg: Message = {
                            role: 'user', 
                            content: `[TOOL_RESULT] ${toolName} returned: ${JSON.stringify(result, (k, v) => typeof v === 'bigint' ? v.toString() : v)}`
                        };
                        
                        const assistantMsg: Message = {
                            role: 'model',
                            content: `I will call ${toolName} with ${JSON.stringify(args)}`
                        };

                        const nextHistory = [...history, assistantMsg, toolMsg];
                        setMessages(nextHistory);
                        await runLoop(nextHistory, brain);
                        return;
                    }
                } catch (e) {
                    console.error("Parse Error", e);
                }
            }
        }
        // If we exit the loop without return, the stream finished.
        if (brain.status === 'THINKING' || brain.status === 'ACTING') {
            // Brain stopped talking without calling a tool.
             brain.log('WARN', 'Brain finished stream without action.');
             setStatus('IDLE');
        }
    };

    return {
        status, // specific cognitive status or brain status
        providers,
        activeProvider,
        logs,
        streamContent,
        start: processGoal, // Alias processGoal to start to match interface
        stop: () => brainRef.current?.stop(),
        messages
    };
}
