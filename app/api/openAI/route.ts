import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const runtime = 'edge';

// Use AI SDK for OpenAI
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const initialSystemPrompt = `You are a helpful AI assistant. Provide clear, concise, and accurate answers to the user's questions.

IMPORTANT: If the user asks about changing the theme (light/dark mode), do NOT give generic instructions. 
Instead, respond with one of these EXACT phrases:
- "I'll switch to dark mode for you now." (to change to dark mode)
- "I'll switch to light mode for you now." (to change to light mode)
- "I'll switch to system theme for you now." (to use system preference)

These specific phrases will activate the theme change functionality in the application.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Ensure messages is an array
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400 }
      );
    }

    // Set up streaming with AI SDK
    const stream = streamText({
      model: openai('gpt-4o'),
      system: initialSystemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 500,
    });

    // Return streaming response
    return stream.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process the request' }),
      { status: 500 }
    );
  }
}