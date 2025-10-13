import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { instruction, context, knowledgeBase } = await req.json();

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `You are an emergency response AI assistant conducting a workflow. You need to ask the user a question.

INSTRUCTION: ${instruction}

CURRENT WORKFLOW CONTEXT:
${context || 'No context available yet'}

RECENT WORKFLOW ACTIONS:
${knowledgeBase || 'No recent actions'}

Based on the instruction and available context, generate a clear, natural question to ask the user. Use any relevant context from the workflow to make the question more specific and helpful. Output ONLY the question itself, nothing else.`,
    });

    return NextResponse.json({ question: result.text.trim() });
  } catch (error) {
    console.error('Error generating question:', error);
    return NextResponse.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    );
  }
}
