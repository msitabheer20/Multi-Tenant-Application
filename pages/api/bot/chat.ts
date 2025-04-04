import { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { message } = req.body;
  if (!message) return res.status(400).json({ message: "Message is required" });

  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "gpt-4",
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ message: "Error generating response" });
  }
}
