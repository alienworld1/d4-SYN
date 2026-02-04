import { NextRequest, NextResponse } from 'next/server';
import { updateAgentState } from '@/lib/agent-state';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, price, dormant } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });
    }

    const updates: any = {};
    if (typeof price === 'number') updates.price = price;
    if (dormant === true) {
        // Set lastSettlement to 30 days ago to trigger decay
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        updates.lastSettlement = Date.now() - THIRTY_DAYS_MS;
    } else if (dormant === false) {
        updates.lastSettlement = Date.now();
    }

    const success = updateAgentState(agentId, updates);

    if (!success) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ 
        message: 'Agent state updated', 
        agentId, 
        updates 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 500 });
  }
}
