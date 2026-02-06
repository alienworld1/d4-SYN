import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType, Tool } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
You are an autonomous economic agent running on d4-syn. 
Your goal is to fulfill user requests by hiring other AI agents from the registry.

**CRITICAL INSTRUCTION: USE TOOLS!**
You cannot "think" an action into existence. You MUST call the provided tools to interact with the world.
- To search: Call \`search_registry\`.
- To check price/trust: Call \`inspect_provider\`.
- To hiring: Call \`hire_provider\`.

**Do NOT just narrate your plan.**
Incorrect: "[THOUGHT] I will search for finance." (Stops there)
Correct: Call \`search_registry('finance')\`.

**Core Directives:**
1. Minimize cost unless instructed to prioritize speed.
2. NEVER hire a provider with a Trust Score < 20 (Risk of Rug Pull).
3. Verify the Bond Size before connecting.
4. If a tool fails, try a different search or provider.

**Reasoning Style:**
Emulate a cybernetic internal monologue in thoughts, but ACT immediately.
"[THOUGHT] Analyzing user request..." -> TOOL CALL
`;

const TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "search_registry",
        description: "Search the ENS registry for providers by category.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            category: { type: SchemaType.STRING, description: "The category to search for (finance, quant, analysis, etc)." }
          },
          required: ["category"]
        }
      },
      {
        name: "inspect_provider",
        description: "Get financial and trust data for a provider.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            ens_name: { type: SchemaType.STRING, description: "The ENS domain of the provider (e.g. fast-finance.eth)" }
          },
          required: ["ens_name"]
        }
      },
      {
        name: "hire_provider",
        description: "Hire a provider to execute the final prompt.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            ens_name: { type: SchemaType.STRING, description: "The selected provider's ENS domain" },
            prompt: { type: SchemaType.STRING, description: "The actual task/prompt to send to the provider" }
          },
          required: ["ens_name", "prompt"]
        }
      }
    ]
  }
];

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    // Convert frontend messages to Gemini format if needed (simplified here, assuming compatible structure or just taking last)
    // Actually Gemini needs strict checking.
    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: m.parts || [{ text: m.content }]
    }));

    // Inject System Prompt at the start if it's a fresh conversation, 
    // but Gemini API 'systemInstruction' is better.
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash-lite',
        systemInstruction: SYSTEM_PROMPT,
        tools: TOOLS,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
            // We use generateContentStream with the full history
            // Note: history must be formatted correctly for Gemini (User/Model alternating)
            // For simplicity in this hackathon context, we'll just feed the last user message + history manually managed if complex
            // But let's try the chat session mode.
            
            const chat = model.startChat({
                history: history.slice(0, -1), // All previous
            });
            
            const lastMsg = history[history.length - 1];
            if (!lastMsg) throw new Error("No last message");
            const result = await chat.sendMessageStream(lastMsg.parts);

            for await (const chunk of result.stream) {
                // 1. Check for Function Calls
                const calls = chunk.functionCalls();
                if (calls && calls.length > 0) {
                    for (const call of calls) {
                         const event = JSON.stringify({
                             type: 'tool_call',
                             tool: call.name,
                             args: call.args
                         });
                         controller.enqueue(encoder.encode(`data: ${event}\n\n`));
                    }
                    continue; 
                }

                // 2. Check for Text (Thoughts)
                const text = chunk.text();
                if (text) {
                    const event = JSON.stringify({
                        type: 'thought',
                        content: text
                    });
                    controller.enqueue(encoder.encode(`data: ${event}\n\n`));
                }
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
        } catch (e: any) {
            console.error("Brain Error:", e);
            const err = JSON.stringify({ type: 'error', content: e.message });
            controller.enqueue(encoder.encode(`data: ${err}\n\n`));
            controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
