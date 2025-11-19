import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const messageId = req.nextUrl.searchParams.get("messageId");
  if (!messageId) {
    return NextResponse.json({ error: "messageId required" }, { status: 400 });
  }

  try {
    // Fetch full message with metadata and body
    const detailRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!detailRes.ok) {
      const body = await detailRes.text();
      console.error("Message detail error:", body);
      return NextResponse.json({ error: "Failed to fetch message" }, { status: 502 });
    }

    const message = await detailRes.json();
    
    // Extract headers
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) => {
      const header = headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase());
      return header?.value || "";
    };

    // Extract body
    let body = "";
    const extractBody = (part: { body?: { data?: string }; parts?: unknown[] }): string => {
      if (part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8");
      }
      if (part.parts) {
        return part.parts.map((p) => extractBody(p as { body?: { data?: string }; parts?: unknown[] })).join("\n");
      }
      return "";
    };

    body = extractBody(message.payload);

    // Construct normalized email object
    const email = {
      messageId: message.id,
      threadId: message.threadId,
      subject: getHeader("Subject"),
      from: getHeader("From"),
      to: getHeader("To"),
      cc: getHeader("Cc"),
      bcc: getHeader("Bcc"),
      date: getHeader("Date"),
      body: body,
      snippet: message.snippet || "",
      labelIds: message.labelIds || [],
    };

    return NextResponse.json(email);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
