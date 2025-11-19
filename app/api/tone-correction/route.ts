import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text, tone } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const prompt = `Rewrite this text in a ${tone || "professional"} tone while maintaining the core message. Return ONLY the corrected text, no explanations:

${text}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const correctedText = completion.choices[0]?.message?.content || text;

    return NextResponse.json({ correctedText });
  } catch (error: any) {
    console.error("Tone correction error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
