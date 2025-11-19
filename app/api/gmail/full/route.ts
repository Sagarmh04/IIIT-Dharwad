import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get("messageId");

  if (!messageId) {
    return NextResponse.json({ error: "messageId required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch email" }, { status: res.status });
    }

    const message = await res.json();

    // Parse email data
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

    let body = "";
    
    // Extract body from payload
    function extractBody(part: any): string {
      if (part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8");
      }
      if (part.parts) {
        for (const subPart of part.parts) {
          if (subPart.mimeType === "text/plain") {
            return extractBody(subPart);
          }
        }
        // Fallback to HTML if no plain text
        for (const subPart of part.parts) {
          if (subPart.mimeType === "text/html") {
            return extractBody(subPart);
          }
        }
        // Recursive
        for (const subPart of part.parts) {
          const result = extractBody(subPart);
          if (result) return result;
        }
      }
      return "";
    }

    body = extractBody(message.payload);

    const emailData = {
      messageId: message.id,
      threadId: message.threadId,
      subject: getHeader("Subject"),
      from: getHeader("From"),
      to: getHeader("To"),
      date: parseInt(message.internalDate) || Date.now(),
      body: body.substring(0, 10000), // Limit body size
      snippet: message.snippet || "",
    };

    return NextResponse.json(emailData);
  } catch (error: any) {
    console.error("Gmail full fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
