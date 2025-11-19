import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "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",
});

export async function POST(req: NextRequest) {
  try {
    const { subject, from, body, snippet } = await req.json();

    const prompt = `Analyze this email and provide a quick analysis in JSON format:

Subject: ${subject}
From: ${from}
Content: ${snippet || body?.substring(0, 500)}

Provide analysis as JSON:
{
  "sentiment": "positive|negative|neutral",
  "emotion": "string (e.g., happy, angry, concerned, neutral)",
  "tone": "string (e.g., formal, casual, urgent, friendly)",
  "intent": "string (e.g., request, information, complaint, question)",
  "urgency": "high|medium|low",
  "category": "string (e.g., work, personal, finance, support)",
  "keywords": ["array", "of", "key", "words"],
  "quickSummary": "one sentence summary"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an email analysis assistant. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json(analysis);
  } catch (err: any) {
    console.error("Pass1 analysis error:", err);
    return NextResponse.json(
      { error: "Analysis failed", detail: err.message },
      { status: 500 }
    );
  }
}
