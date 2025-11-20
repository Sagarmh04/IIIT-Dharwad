import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { intent, emailContext, conversationHistory = [], contacts = [], userName } = await req.json();

    console.log("🤖 AI Generate Email - Received:", {
      intent,
      contactsCount: contacts.length,
      contacts: contacts.slice(0, 3).map((c: any) => ({ name: c.name, email: c.email })),
      userName,
      hasMoreContacts: contacts.length > 3
    });

    if (!intent) {
      return NextResponse.json({ error: "intent required" }, { status: 400 });
    }

    // Build contacts context with explicit mapping format
    let contactsContext = "";
    if (contacts && contacts.length > 0) {
      contactsContext = `
============================================
📇 YOUR CONTACT PHONEBOOK (${contacts.length} contacts)
============================================
${contacts.map((c: any, index: number) => `${index + 1}. Name: "${c.name}" | Email: ${c.email}`).join("\n")}
============================================

HOW TO USE THIS PHONEBOOK:
When the user's intent mentions ANY name (like "send to John", "email Sarah", "compose for Mike"):
1. SCAN the phonebook above line by line
2. COMPARE the mentioned name with each contact's name (case-insensitive)
3. Try these matches in order:
   a) Full name match: "John Doe" matches "John Doe"
   b) First name match: "John" matches "John Doe" or "John Smith"  
   c) Last name match: "Smith" matches "John Smith"
   d) Partial match: "Sara" matches "Sarah"
4. When you find a match:
   - Copy the EXACT email from that contact
   - Set recipientEmail to that email
   - Set recipientName to that contact's full name
5. If NO match found: Ask user "I don't have [name] in your contacts. Please provide their email address."

EXAMPLE WORKFLOW:
User says: "send email to John about project"
→ Search phonebook for "John"
→ Find: "John Doe | Email: john@example.com"  
→ Response: recipientEmail: "john@example.com", recipientName: "John Doe"
`;
    }

    // Build user context
    let userContext = "";
    if (userName) {
      userContext = `
YOUR NAME: ${userName}
(Use this name in email signature when appropriate)
`;
    }

    // Build context from email being replied to
    let contextPrompt = "";
    if (emailContext) {
      contextPrompt = `
ORIGINAL EMAIL CONTEXT (This is what we're replying to):
Subject: ${emailContext.subject || "(No subject)"}
From: ${emailContext.from || "Unknown"}
Email Body: ${emailContext.body || "No content"}

${emailContext.quickAnalysis ? `AI Analysis of Original Email:
- Sentiment: ${emailContext.quickAnalysis.sentiment || "N/A"}
- Urgency: ${emailContext.quickAnalysis.urgency || "N/A"}
- Intent: ${emailContext.quickAnalysis.intent || "N/A"}
- Summary: ${emailContext.quickAnalysis.summary || "N/A"}` : ""}
`;
    }

    // Check if we need more information
    const analysisPrompt = `${userContext}
${contactsContext}
${contextPrompt}

USER'S REPLY INTENT: "${intent}"

INSTRUCTIONS:
You are helping compose an email. You have the FULL CONTEXT of the original email (if replying), the user's contact list, and their real name.

### ⚠️ MANDATORY STEP: CHECK CONTACT PHONEBOOK FIRST ###

BEFORE generating ANY email, you MUST:

STEP 1: Extract names from intent
- Look for patterns: "send to [NAME]", "email [NAME]", "compose for [NAME]", "write to [NAME]"
- Extract the name mentioned by the user

STEP 2: Search the phonebook (shown above)
- The phonebook contains ${contacts?.length || 0} contacts with Name and Email
- Compare the extracted name with EACH contact in the phonebook
- Try matching: full name, first name only, last name only, or partial name
- Matching is case-insensitive

STEP 3: If contact found
- COPY the email address from the phonebook
- Set recipientEmail = [the contact's email]
- Set recipientName = [the contact's full name]
- This is MANDATORY - you MUST fill these fields when a name is mentioned

STEP 4: If contact NOT found
- Set needsMoreInfo = true
- Ask: "I don't see [name] in your contacts. Could you provide their email address?"

REAL EXAMPLES TO FOLLOW:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Example 1:
Intent: "send email to John about the meeting"
Phonebook has: "John Doe | Email: john@company.com"
→ recipientEmail: "john@company.com"
→ recipientName: "John Doe"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Example 2:
Intent: "email Sarah to discuss project timeline"  
Phonebook has: "Sarah Johnson | Email: sarah@tech.com"
→ recipientEmail: "sarah@tech.com"
→ recipientName: "Sarah Johnson"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THIS IS CRITICAL: Always check the phonebook when a name is mentioned!

OTHER RULES:
- Use the user's real name (YOUR NAME) in the signature instead of placeholders like "Best regards, [Your Name]"
- If replying to an email, use context from the original email
- Don't ask about information already provided in the original email

Your job is to analyze if the user's intent is specific enough to write their email. 

IMPORTANT RULES:
1. DO NOT ask about information that's already in the original email (sender's details, what they asked for, dates they mentioned, etc.)
2. DO NOT ask questions that can be reasonably inferred from context
3. ONLY ask about the user's specific response details if their intent is vague (e.g., "reply to meeting" - do they accept/decline? what time works for them?)
4. Ask MINIMAL questions (maximum 2-3) and only about what the USER wants to say/do
5. If the intent is reasonably clear (accept, decline, acknowledge, thank, etc.), write the email directly

Examples of GOOD questions (about user's response):
- "Are you accepting or declining the meeting?" (when user says "reply about meeting")
- "What time would you like to propose?" (when user accepts but doesn't specify time)
- "What's your reason for declining?" (if needed for polite refusal)

Examples of BAD questions (information already in original email - DON'T ASK):
- "What time did they suggest?" (it's in the original email!)
- "What is the meeting about?" (it's in the original email!)
- "Who sent this?" (we already know!)

### 📋 RESPONSE FORMAT (FOLLOW EXACTLY) ###

Case A: Name mentioned + Found in phonebook
{
  "needsMoreInfo": false,
  "subject": "...",
  "body": "...",
  "recipientEmail": "[MUST BE EXACT EMAIL FROM PHONEBOOK]",
  "recipientName": "[MUST BE EXACT NAME FROM PHONEBOOK]"
}

Case B: Name mentioned + NOT found in phonebook  
{
  "needsMoreInfo": true,
  "questions": ["I don't see [name] in your contacts. What is their email address?"],
  "explanation": "Need recipient's email address"
}

Case C: No name mentioned (replying to existing email)
{
  "needsMoreInfo": false,
  "subject": "...",
  "body": "...",
  "recipientEmail": null,
  "recipientName": null
}

⚠️ VALIDATION CHECKLIST BEFORE RESPONDING:
□ Did I check if intent contains a name?
□ If yes, did I search the phonebook?
□ If found, did I copy the EXACT email from phonebook to recipientEmail?
□ If found, did I copy the EXACT name from phonebook to recipientName?
□ If not found, did I ask for the email address?

Respond ONLY with valid JSON, no markdown formatting.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: analysisPrompt,
    });

    let content = result.text || "";
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(content);

    console.log("🤖 AI Response:", {
      needsMoreInfo: analysis.needsMoreInfo,
      hasRecipient: !!analysis.recipientEmail,
      recipientEmail: analysis.recipientEmail || 'none',
      recipientName: analysis.recipientName || 'none'
    });

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("Email generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handle answering follow-up questions
export async function PUT(req: NextRequest) {
  try {
    const { intent, emailContext, questions, answers, conversationHistory = [], contacts = [], userName } = await req.json();

    if (!intent || !questions || !answers) {
      return NextResponse.json({ error: "intent, questions, and answers required" }, { status: 400 });
    }

    // Build contacts context with same detailed format
    let contactsContext = "";
    if (contacts && contacts.length > 0) {
      contactsContext = `
============================================
📇 YOUR CONTACT PHONEBOOK (${contacts.length} contacts)
============================================
${contacts.map((c: any, index: number) => `${index + 1}. Name: "${c.name}" | Email: ${c.email}`).join("\n")}
============================================

IMPORTANT: Check both the ORIGINAL INTENT and ALL ANSWERS for any names mentioned!
`;
    }

    // Build user context
    let userContext = "";
    if (userName) {
      userContext = `
YOUR NAME: ${userName}
`;
    }

    let contextPrompt = "";
    if (emailContext) {
      contextPrompt = `
ORIGINAL EMAIL (that we're replying to):
Subject: ${emailContext.subject || "(No subject)"}
From: ${emailContext.from || "Unknown"}
Email Body: ${emailContext.body || "No content"}

${emailContext.quickAnalysis ? `AI Analysis:
- Sentiment: ${emailContext.quickAnalysis.sentiment || "N/A"}
- Urgency: ${emailContext.quickAnalysis.urgency || "N/A"}
- Intent: ${emailContext.quickAnalysis.intent || "N/A"}
- Summary: ${emailContext.quickAnalysis.summary || "N/A"}` : ""}
`;
    }

    // Build Q&A context
    const qaContext = questions.map((q: string, i: number) => 
      `Q: ${q}\nA: ${answers[i] || "(not answered)"}`
    ).join("\n\n");

    const generatePrompt = `${userContext}
${contactsContext}
${contextPrompt}

USER'S REPLY INTENT: "${intent}"

USER'S ANSWERS TO CLARIFYING QUESTIONS:
${qaContext}

INSTRUCTIONS:
Write a complete, professional email that:
1. Directly addresses what the original sender asked or said (if replying)
2. Incorporates the user's intent and their answers to the questions
3. Matches the tone and formality of the context
4. Is clear, concise, and ready to send
5. Uses appropriate greeting and closing
6. References specific details from the original email when relevant
7. Use the user's real name (YOUR NAME) in signature, not placeholders like "[Your Name]"

### ⚠️ MANDATORY: CHECK PHONEBOOK FOR NAMES ###

STEP 1: Look for names in TWO places:
- Original intent: "${intent}"
- User's answers: ${answers.map((a: string, i: number) => `Answer ${i + 1}: "${a}"`).join(", ")}

STEP 2: If you find ANY name mentioned:
- Search the phonebook above (${contacts?.length || 0} contacts)
- Match by full name, first name, or last name (case-insensitive)
- If found: Copy EXACT email and name from phonebook

STEP 3: Fill response fields:
- If contact found → recipientEmail = [email from phonebook], recipientName = [name from phonebook]
- If no name mentioned or replying → recipientEmail = null, recipientName = null

### RESPONSE FORMAT ###
{
  "subject": "[Email subject line]",
  "body": "[Complete email body]",
  "recipientEmail": "[MUST BE FROM PHONEBOOK if name mentioned, otherwise null]",
  "recipientName": "[MUST BE FROM PHONEBOOK if name mentioned, otherwise null]"
}

DOUBLE-CHECK: Did I search the phonebook if a name was mentioned? Did I copy the exact email?
No markdown, ONLY JSON.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: generatePrompt,
    });

    let content = result.text || "";
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const emailData = JSON.parse(content);

    return NextResponse.json({ 
      needsMoreInfo: false,
      subject: emailData.subject || "",
      body: emailData.body || "",
      recipientEmail: emailData.recipientEmail || null,
      recipientName: emailData.recipientName || null
    });
  } catch (error: any) {
    console.error("Email generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
