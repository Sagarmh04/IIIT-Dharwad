import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "emails array required" }, { status: 400 });
    }

    // Group emails by threadId
    const threadMap = new Map<string, any[]>();
    
    for (const email of emails) {
      if (email.threadId) {
        if (!threadMap.has(email.threadId)) {
          threadMap.set(email.threadId, []);
        }
        threadMap.get(email.threadId)!.push(email);
      }
    }

    const threadAnalyses: any[] = [];

    // Analyze each thread
    for (const [threadId, threadEmails] of threadMap.entries()) {
      try {
        // Sort by date
        threadEmails.sort((a, b) => (a.date || 0) - (b.date || 0));

        // Build timeline
        const timeline = threadEmails.map((email) => ({
          messageId: email.messageId,
          from: email.from,
          date: email.date,
          sentiment: email.quickAnalysis?.sentiment || "neutral",
        }));

        // Create conversation context for AI
        const conversationText = threadEmails
          .map((e, idx) => `[Message ${idx + 1}]\nFrom: ${e.from}\nSubject: ${e.subject}\nBody: ${e.body?.substring(0, 500)}\n`)
          .join("\n");

        const prompt = `Analyze this email thread and return ONLY a valid JSON object:
{
  "summary": "2-3 sentence summary of the entire conversation",
  "escalationRisk": "low|medium|high",
  "keyTopics": ["topic1", "topic2"],
  "actionItems": ["action1", "action2"],
  "conversationHealthScore": 0-100
}

Thread:
${conversationText}`;

        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        let content = result.text;
        
        // Strip markdown code blocks if present
        content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const analysis = JSON.parse(content);

        threadAnalyses.push({
          threadId,
          messageIds: threadEmails.map((e) => e.messageId),
          timeline,
          summary: analysis.summary,
          escalationRisk: analysis.escalationRisk,
          keyTopics: analysis.keyTopics,
          actionItems: analysis.actionItems,
          conversationHealthScore: analysis.conversationHealthScore,
        });
      } catch (err) {
        console.error(`Thread analysis error for ${threadId}:`, err);
      }
    }

    return NextResponse.json({ threads: threadAnalyses });
  } catch (error: any) {
    console.error("Thread analysis API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
