import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email object required" }, { status: 400 });
    }

    const prompt = `Extract semantic context from this email for advanced search. Return ONLY a valid JSON object:
{
  "entities": ["person1", "person2", "organization1"],
  "roles": ["doctor", "manager", "engineer"],
  "companies": ["Company1", "Company2"],
  "topics": ["topic1", "topic2", "topic3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "category": "work|personal|finance|legal|support|marketing",
  "search_context": "Natural language description combining all context for semantic search"
}

Email:
Subject: ${email.subject}
From: ${email.from}
To: ${email.to}
Body: ${email.body}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    let content = completion.choices[0]?.message?.content || "{}";
    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const semanticContext = JSON.parse(content);

    return NextResponse.json({
      messageId: email.messageId,
      semanticContext,
    });
  } catch (error: any) {
    console.error("Pass3 API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
