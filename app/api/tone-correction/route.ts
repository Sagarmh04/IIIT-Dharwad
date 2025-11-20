import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { text, tone } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const prompt = `Rewrite this text in a ${tone || "professional"} tone while maintaining the core message. Return ONLY the corrected text, no explanations:

${text}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const correctedText = result.text || text;

    return NextResponse.json({ correctedText });
  } catch (error: any) {
    console.error("Tone correction error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
