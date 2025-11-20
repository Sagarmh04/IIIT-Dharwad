import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { query, semanticContexts } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }

    // Use AI to interpret the query and match against semantic contexts
    const prompt = `Given this search query: "${query}"

Extract search intents and return ONLY a valid JSON object:
{
  "searchType": "semantic|role|company|topic|entity|keyword",
  "extractedTerms": ["term1", "term2"],
  "intent": "Brief description of what user is looking for"
}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    let content = result.text;
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const searchIntent = JSON.parse(content);

    // Match against semantic contexts
    const matches: any[] = [];
    
    if (semanticContexts && Array.isArray(semanticContexts)) {
      for (const ctx of semanticContexts) {
        let score = 0;
        let matchReasons: string[] = [];

        // Check search context
        if (ctx.search_context?.toLowerCase().includes(query.toLowerCase())) {
          score += 10;
          matchReasons.push("context match");
        }

        // Check extracted terms
        for (const term of searchIntent.extractedTerms || []) {
          const termLower = term.toLowerCase();
          
          if (ctx.roles?.some((r: string) => r.toLowerCase().includes(termLower))) {
            score += 8;
            matchReasons.push(`role: ${term}`);
          }
          
          if (ctx.companies?.some((c: string) => c.toLowerCase().includes(termLower))) {
            score += 8;
            matchReasons.push(`company: ${term}`);
          }
          
          if (ctx.topics?.some((t: string) => t.toLowerCase().includes(termLower))) {
            score += 6;
            matchReasons.push(`topic: ${term}`);
          }
          
          if (ctx.keywords?.some((k: string) => k.toLowerCase().includes(termLower))) {
            score += 5;
            matchReasons.push(`keyword: ${term}`);
          }

          if (ctx.entities?.some((e: string) => e.toLowerCase().includes(termLower))) {
            score += 7;
            matchReasons.push(`entity: ${term}`);
          }
        }

        if (score > 0) {
          matches.push({
            messageId: ctx.messageId,
            score,
            matchReason: matchReasons.join(", "),
          });
        }
      }
    }

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      searchIntent,
      results: matches.slice(0, 20),
    });
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
