import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { action, intent, chatHistory, emailContext, currentDraft } = await req.json();

    if (!action) {
      return NextResponse.json({ error: "action required" }, { status: 400 });
    }

    // Action: analyze_intent - Determine if we have enough info to draft
    if (action === "analyze_intent") {
      if (!intent) {
        return NextResponse.json({ error: "intent required" }, { status: 400 });
      }

      const emailInfo = emailContext ? `
Original Email Context:
From: ${emailContext.from}
Subject: ${emailContext.subject}
Body: ${emailContext.body?.substring(0, 500)}
` : "";

      const prompt = `You are an email composition assistant. A user wants to reply to an email with the following intent:

${emailInfo}

User's Intent: "${intent}"

Analyze if this intent provides enough information to draft a complete, professional email reply. 

If the intent is clear and complete (e.g., "Accept the meeting invitation for Tuesday at 3pm", "Decline politely and suggest alternative time", "Provide the requested quarterly report data"), respond with:
{
  "sufficient": true,
  "reasoning": "Brief explanation of why it's sufficient"
}

If the intent is vague or missing key details (e.g., "Reply positively", "Send the info", "Decline"), respond with:
{
  "sufficient": false,
  "reasoning": "Brief explanation of what's missing",
  "questions": ["Question 1 to clarify?", "Question 2 to clarify?", "Question 3 to clarify?"]
}

Respond ONLY with valid JSON, no other text.`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const responseText = (result.text || "").trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return NextResponse.json(analysis);
    }

    // Action: chat - Handle conversational Q&A
    if (action === "chat") {
      const { userMessage } = await req.json();
      if (!userMessage) {
        return NextResponse.json({ error: "userMessage required" }, { status: 400 });
      }

      const emailInfo = emailContext ? `
Original Email Being Replied To:
From: ${emailContext.from}
Subject: ${emailContext.subject}
Body: ${emailContext.body?.substring(0, 500)}
` : "";

      const conversationContext = chatHistory && chatHistory.length > 0
        ? chatHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join("\n")
        : "";

      const prompt = `You are a helpful email composition assistant helping a user draft a reply.

${emailInfo}

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ""}

User's response: "${userMessage}"

Ask ONE follow-up question to gather more details needed for composing the email, OR if you have enough information, say "I have enough information now. Let me draft your email."

Keep your response conversational, brief, and helpful. Be specific about what information you need.`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const assistantMessage = (result.text || "I'm having trouble generating a response. Please try again.").trim();
      return NextResponse.json({ message: assistantMessage });
    }

    // Action: draft - Generate email from intent and chat history
    if (action === "draft") {
      const emailInfo = emailContext ? `
Original Email:
From: ${emailContext.from}
Subject: ${emailContext.subject}
Body: ${emailContext.body?.substring(0, 500)}
` : "";

      const conversationContext = chatHistory && chatHistory.length > 0
        ? chatHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join("\n")
        : "";

      const prompt = `You are composing an email reply based on the user's intent and clarifications.

${emailInfo}

Initial Intent: "${intent}"

${conversationContext ? `Clarification conversation:\n${conversationContext}\n` : ""}

Based on all this information, compose a professional, clear, and complete email reply. 

${currentDraft ? `The user has already started a draft:\n${currentDraft}\n\nIncorporate their existing content where appropriate.` : ""}

Return ONLY the email body text, ready to send. Be concise but complete. Do not include greetings like "Dear..." unless specifically requested. Start directly with the content.`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const draftedEmail = (result.text || "Unable to generate draft. Please try again.").trim();
      return NextResponse.json({ draft: draftedEmail });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Compose assistant error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
