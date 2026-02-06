import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType, Tool, FunctionCallingMode } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
You are an autonomous economic agent running on d4-syn. 
Your goal is to fulfill user requests by hiring other AI agents from the registry.

**CRITICAL: TOOL USAGE**
- You are a ReAct agent. You MUST use the provided tools to query the biological world.
- **Do NOT describe your next action.** Just call the tool.
- **Do NOT output JSON or simulated tool calls in your text.** Use the native Tool selection.
- **Do NOT output Python code.**
- **Do NOT say "I will call...".** Use the tool directly.

**Workflow:**
1. [THOUGHT] Brief reasoning.
2. [TOOL_CALL] The model invokes the tool.
3. [DATA] Result is returned.
4. Loop.

**Core Directives:**
1. Minimize cost unless instructed to prioritize speed.
2. **TRUST SAFETY CHECK:**
   - You MUST check the 'trustScore' field.
   - If trustScore >= 20: The provider is SAFE.
   - If trustScore < 20: The provider is RISKY (Do NOT hire).
   - **Example:** 24 is >= 20 (SAFE). 23 is >= 20 (SAFE). 1 is < 20 (UNSAFE).
3. Verify the Bond Size before connecting.
4. If a tool fails, try a different search or provider.
5. **COMPARISON MANDATE:** When asked to find the "best" (fastest, cheapest, etc) agent, you MUST Call \`inspect_provider\` on AT LEAST TWO (2) different candidates to compare their stats before hiring. Do not just pick the first one.
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

    const history = messages.map((m: any) => {
      // 1. Hydrate Model Tool Calls (recover from client text representation)
      if (m.role === 'model' && typeof m.content === 'string' && m.content.startsWith('I will call ')) {
          try {
              const match = m.content.match(/^I will call (\w+) with (.+)$/);
              if (match) {
                  const [_, name, argsStats] = match;
                  const args = JSON.parse(argsStats);
                  return {
                      role: 'model',
                      parts: [{ 
                        functionCall: { name, args },
                        // Hack for Gemini 3: It requires thoughtSignature for tool calls.
                        // We use a dummy signature as per "Context Engineering" FAQ.
                        thoughtSignature: "context_engineering_is_the_way_to_go" 
                      }]
                  };
              }
          } catch (e) { /* ignore parse error, fallback to text */ }
      }

      // 2. Hydrate Function Responses (recover from client text representation)
      if (m.role === 'user' && typeof m.content === 'string' && m.content.startsWith('[TOOL_RESULT] ')) {
           try {
              const match = m.content.match(/^\[TOOL_RESULT\] (\w+) returned: (.+)$/);
              if (match) {
                   const [_, name, resultStr] = match;
                   let resultJson;
                   try { resultJson = JSON.parse(resultStr); } catch { resultJson = { output: resultStr }; }
                   
                   return {
                       role: 'function',
                       parts: [{ functionResponse: { name, response: { content: resultJson } } }]
                   };
              }
           } catch (e) { /* ignore parse error */ }
      }

      // Default: Text
      return {
        role: m.role === 'user' ? 'user' : 'model',
        parts: m.parts || [{ text: m.content || '' }]
      };
    });

    // Inject System Prompt at the start
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-3-flash-preview',
        systemInstruction: SYSTEM_PROMPT,
        tools: TOOLS,
        toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } }
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
            // We use generateContentStream with the full history
            // Note: history must be formatted correctly for Gemini (User/Model alternating)
            // For simplicity, we'll just feed the last user message + history manually managed if complex
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
            let errorMessage = e.message;
            if (e.message.includes('429') || e.message.includes('503') || e.message.includes('Resource has been exhausted')) {
                errorMessage = "The AI Brain is currently overloaded (Google Gemini API 429/503). This is an external API limit, not a bug in d4-syn. Please try again in a few seconds.";
            }

            const err = JSON.stringify({ type: 'thought', content: `[SYSTEM_ALERT] ${errorMessage}` }); // Send as thought so it renders nicely
            controller.enqueue(encoder.encode(`data: ${err}\n\n`));
            
            // Also send close signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n')); 
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
