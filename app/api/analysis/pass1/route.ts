import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: "emails array required" }, { status: 400 });
    }

    // Process up to 2 emails concurrently to avoid rate limits
    const batch = emails.slice(0, 2);
    const results = await Promise.all(
      batch.map(async (email) => {
        try {
          const prompt = `Analyze this email and return ONLY a valid JSON object with these exact fields:
{
  "sentiment": "positive|neutral|negative",
  "urgency": "low|medium|high",
  "intent": "request|information|complaint|feedback|other",
  "category": "work|personal|finance|legal|support|marketing|other",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "summary": "Brief one-sentence summary"
}

Email:
Subject: ${email.subject}
From: ${email.from}
Body: ${email.body?.substring(0, 1000)}`;

          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            response_format: { type: "json_object" },
          });

          let content = completion.choices[0]?.message?.content || "{}";
          // Strip markdown code blocks if present
          content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const analysis = JSON.parse(content);

          return {
            messageId: email.messageId,
            quickAnalysis: analysis,
          };
        } catch (err) {
          console.error(`Pass1 error for ${email.messageId}:`, err);
          return {
            messageId: email.messageId,
            quickAnalysis: null,
            error: "Analysis failed",
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Pass1 API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
