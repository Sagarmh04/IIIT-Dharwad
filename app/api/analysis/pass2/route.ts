import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email object required" }, { status: 400 });
    }

    const prompt = `Perform deep analysis on this email and return ONLY a valid JSON object with these exact fields:
{
  "detailedSummary": "Comprehensive 2-3 sentence summary",
  "emotion": "joy|anger|sadness|fear|surprise|neutral",
  "tone": "formal|informal|aggressive|passive|assertive|friendly",
  "complianceRisk": {
    "level": "low|medium|high",
    "reason": "Brief explanation",
    "issues": ["issue1", "issue2"]
  },
  "piiDetected": ["type1", "type2"],
  "smartReplies": ["reply1", "reply2", "reply3"],
  "conversationHealthScore": 0-100
}

Email:
Subject: ${email.subject}
From: ${email.from}
Body: ${email.body}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    let content = result.text;
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const deepAnalysis = JSON.parse(content);

    return NextResponse.json({
      messageId: email.messageId,
      deepAnalysis,
    });
  } catch (error: any) {
    console.error("Pass2 API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
