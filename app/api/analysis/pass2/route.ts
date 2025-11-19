import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "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",
});

export async function POST(req: NextRequest) {
  try {
    const { subject, from, to, body } = await req.json();

    const prompt = `Analyze this email in depth and provide a detailed analysis in JSON format:

Subject: ${subject}
From: ${from}
To: ${to}
Content: ${body}

Provide deep analysis as JSON:
{
  "detailedSummary": "detailed multi-sentence summary",
  "complianceRisk": boolean,
  "complianceIssues": ["array of compliance concerns if any"],
  "piiDetected": boolean,
  "piiEntities": ["array of PII found: emails, phone numbers, SSN, credit cards, etc."],
  "smartReply": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "toneCorrectedReply": "a professional tone-corrected reply suggestion"
}

Check for:
- Personal Identifiable Information (PII): emails, phone numbers, addresses, SSN, credit cards
- Compliance risks: legal threats, confidential data, GDPR concerns
- Provide 3 smart reply suggestions
- Provide a tone-corrected professional reply`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert email analysis assistant. Respond only with valid JSON.",
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
  } catch (err) {
    console.error("Pass2 analysis error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Analysis failed", detail: errorMessage },
      { status: 500 }
    );
  }
}
