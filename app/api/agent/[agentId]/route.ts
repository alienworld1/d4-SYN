import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAgentState } from '@/lib/agent-state';

// Initialize Gemini
// NOTE: Strictly using env variable as per spec
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper for artificial delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  
  // 1. Discovery Validation
  const agentState = getAgentState(agentId);
  if (!agentState) {
    return NextResponse.json({ error: 'Agent Not Found in Global Registry' }, { status: 404 });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    // 2. Model Initialization
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 3. Setup Streaming Response
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Generate content stream
                const result = await model.generateContentStream(prompt);

                for await (const chunk of result.stream) {
                    if (req.signal.aborted) {
                        controller.close();
                        return;
                    }

                    const text = chunk.text();
                    
                    // CRITICAL: Re-fetch state INSIDE the loop to capture live price spikes
                    // This enables the "Flash Switch" demo where price changes mid-stream
                    const currentLiveState = getAgentState(agentId)!; // We know it exists
                    
                    // Apply Latency (Simulate load or slow Tier)
                    if (currentLiveState.latency > 0) {
                        await delay(currentLiveState.latency);
                    }

                    // Construct Event
                    // Note: We send the PRICE with every chunk so the client can calculate spent total in real-time
                    const eventData = JSON.stringify({
                        type: 'content',
                        text: text,
                        price: currentLiveState.price,
                        timestamp: Date.now()
                    });

                    // SSE Format: data: {json}\n\n
                    controller.enqueue(encoder.encode(`data: ${eventData}\n\n`));
                }

                // End of stream
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
            } catch (error: any) {
                // Silence "Controller is already closed" errors which happen on client abort
                if (req.signal.aborted || error.message.includes('Controller is already closed')) {
                     return; 
                }

                console.error("Gemini Stream Error:", error);
                
                // Fallback for throttling or API errors
                try {
                    // We keep the stream alive to show the "System Overload" message
                    const errorData = JSON.stringify({
                        type: 'error',
                        text: `[SYSTEM: NETWORK_CONGESTION] ${error.message || 'Stream interrupted'}.`,
                        price: agentState.price, // Charge them anyway just for fun/realism? keeping static for safety
                        timestamp: Date.now()
                    });
                    controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (e) {
                    // Ignore secondary errors during error handling
                }
            }
        },
        cancel() {
            // Handle client disconnect cleanup if needed
        }
    });

    // Return the stream with SSE headers
    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    });

  } catch (error) {
    console.error("Agent Endpoint Error:", error);
    return NextResponse.json({ error: 'Internal Agent Error' }, { status: 500 });
  }
}
