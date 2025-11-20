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
  "smartReplies": [
    {"subject": "Short subject line", "body": "Complete reply text"},
    {"subject": "Short subject line", "body": "Complete reply text"},
    {"subject": "Short subject line", "body": "Complete reply text"}
  ],
  "conversationHealthScore": 0-100,
  "tasks": [
    {
      "title": "Brief task description",
      "description": "Detailed explanation of what needs to be done",
      "deadline": "ISO 8601 date string (e.g., 2025-11-22T23:59:59Z) or null if no deadline mentioned",
      "priority": "high|medium|low",
      "category": "payment|submission|meeting|response|other"
    }
  ]
}

TASK DETECTION RULES:
- Look for action items, deadlines, payments, submissions, meetings, requests
- Examples of tasks:
  * "Pay fine of $5000 within 2 days" → task with 2-day deadline
  * "Submit report by Friday" → task with Friday deadline
  * "Please respond by EOD" → task with end-of-day deadline
  * "Meeting scheduled for next week" → task with meeting date
- If NO tasks found, return empty array: "tasks": []
- Calculate deadline from current date + mentioned timeframe
- Priority: high (urgent/penalty), medium (important), low (optional)

Email:
Subject: ${email.subject}
From: ${email.from}
Body: ${email.body}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    let content = result.text || "";
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const deepAnalysis = JSON.parse(content);

    // If tasks detected, save them to Firestore
    if (deepAnalysis.tasks && deepAnalysis.tasks.length > 0) {
      try {
        const token = req.cookies.get("access_token")?.value;
        if (token) {
          // Get user email
          const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (profileRes.ok) {
            const profile = await profileRes.json();
            const userEmail = profile.email;
            
            // Save tasks by calling tasks API
            for (const task of deepAnalysis.tasks) {
              await fetch(`${req.nextUrl.origin}/api/tasks`, {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Cookie": `access_token=${token}`
                },
                body: JSON.stringify({
                  ...task,
                  emailId: email.messageId,
                  emailSubject: email.subject,
                  source: "email"
                }),
              });
            }
          }
        }
      } catch (taskError) {
        console.error("Error saving tasks:", taskError);
        // Don't fail the whole analysis if task saving fails
      }
    }

    return NextResponse.json({
      messageId: email.messageId,
      deepAnalysis,
    });
  } catch (error: any) {
    console.error("Pass2 API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
