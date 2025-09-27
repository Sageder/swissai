import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log("🧪 Test Chat API - Request received");
  try {
    const { message } = await req.json();
    console.log("📨 Test message:", message);

    // Get OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;

    console.log("🔑 API Key exists:", !!apiKey);

    if (!apiKey) {
      console.error("OpenAI API key not found in environment variables");
      return new Response(
        "OpenAI API key not configured. Please set OPENAI_API_KEY in your .env.local file.",
        { status: 500 }
      );
    }

    // Create OpenAI instance with explicit API key
    const openai = createOpenAI({
      apiKey: apiKey,
    });

    console.log("🚀 Starting simple streamText test...");

    const result = streamText({
      model: openai('gpt-4.1'),
      messages: [
        {
          role: 'user',
          content: message || 'Hello, can you respond with a simple test message?'
        }
      ],
      temperature: 0.7,
    });

    console.log("📤 Returning test stream response...");
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("❌ Test Chat API Error:", error);
    return new Response(
      `Server error: ${error instanceof Error ? error.message : "Unknown error"
      }`,
      {
        status: 500,
      }
    );
  }
}
