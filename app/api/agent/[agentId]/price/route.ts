import { NextResponse } from 'next/server';
import { getAgentState } from '@/lib/agent-state';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  // Await the params object in Next.js 15
  const { agentId } = await params;

  // The ensName usually comes in as "agent-name.eth"
  // The store uses keys like "agent-name" (or possibly "agent-name.eth" depending on how seed script set it up)
  // Looking at agent-state.ts, the keys are 'fast-finance-agent', 'cheap-finance-agent', etc.
  // We should try to normalize by stripping .eth if present, or trying both.

  const cleanId = agentId.replace(/\.eth$/i, '');
  
  const state = getAgentState(cleanId);

  if (!state) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json({
    price: state.price,
    unit: 'token',
    timestamp: Date.now()
  });
}
