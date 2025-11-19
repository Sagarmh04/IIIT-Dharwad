import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "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",
});

export async function POST(req: NextRequest) {
  try {
    const { subject, from, to, body, quickAnalysis } = await req.json();

    const prompt = `Extract semantic context from this email for search indexing:

Subject: ${subject}
From: ${from}
To: ${to}
Content: ${body}
Category: ${quickAnalysis?.category || ""}

Extract semantic context as JSON:
{
  "entities": ["person names", "organization names", "locations"],
  "roles": ["job titles or roles mentioned like doctor, engineer, manager"],
  "companies": ["company names mentioned"],
  "topics": ["main topics discussed"],
  "keywords": ["important keywords for search"],
  "category": "refined category",
  "search_context": "a searchable text combining all context for semantic search"
}

Focus on:
- Named entities (people, places, organizations)
- Professional roles and titles
- Company and brand names
- Key topics and themes
- Important keywords
- Create a comprehensive search_context string`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a semantic analysis expert. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const semanticContext = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json(semanticContext);
  } catch (err: any) {
    console.error("Pass3 analysis error:", err);
    return NextResponse.json(
      { error: "Analysis failed", detail: err.message },
      { status: 500 }
    );
  }
}
