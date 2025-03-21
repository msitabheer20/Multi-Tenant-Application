import { streamText, Message } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { initialMessage } from "@/lib/data";

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
    compatibility: "strict"
});

export const runtime = "edge";

export async function POST(request: Request) {
    const { messages } = await request.json();
    
    const stream = streamText({
        model: openai("gpt-4o-mini"),
        messages: [initialMessage, ...messages],
        temperature: 0.7,
    });

    return stream?.toDataStreamResponse();
}