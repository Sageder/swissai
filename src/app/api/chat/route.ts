import { createOpenAI } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Get OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;

    console.log("API Key exists:", !!apiKey);
    console.log("Messages received:", messages?.length);
    console.log(
      "Environment variables available:",
      Object.keys(process.env).filter((key) => key.includes("OPENAI"))
    );

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

    console.log("About to call streamText...");

    const result = streamText({
        model: openai('gpt-4.1'),
        messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(
      `Server error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      {
        status: 500,
      }
    );
  }
}
