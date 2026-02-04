// Singleton pattern to preserve state during development hot-reloads
// This acts as our "In-Memory Database" for the virtual agents.

export type AgentState = {
    price: number;       // USDC per chunk, dynamic
    latency: number;     // Artificial delay in ms
    lastSettlement: number; // Timestamp for trust verification
};
  
const DEFAULT_STATE: Record<string, AgentState> = {
    'fast-finance-agent': { 
      price: 0.005, 
      latency: 0, 
      lastSettlement: Date.now() 
    },
    'cheap-finance-agent': { 
      price: 0.001, 
      latency: 100, 
      lastSettlement: Date.now() 
    }
};

// Use globalThis to persist state in Next.js dev server
const globalForAgents = globalThis as unknown as {
    agentStates: Record<string, AgentState> | undefined
};
  
export const agentStore = globalForAgents.agentStates ?? DEFAULT_STATE;
  
if (process.env.NODE_ENV !== 'production') {
    globalForAgents.agentStates = agentStore;
}
  
// Helper to safely get the current state
export function getAgentState(agentId: string): AgentState | undefined {
    return agentStore[agentId];
}

// Helper to update state (Admin Mode)
export function updateAgentState(agentId: string, updates: Partial<AgentState>) {
    if (!agentStore[agentId]) return false;
    
    agentStore[agentId] = {
        ...agentStore[agentId],
        ...updates
    };
    return true;
}
