import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // List messages
    const listRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!listRes.ok) {
      const errBody = await listRes.text();
      console.error("Gmail list error:", errBody);
      return NextResponse.json({ error: "Failed to list messages", detail: errBody }, { status: 502 });
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];

    const detailed = await Promise.all(
      messages.map(async (msg: { id: string }) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!detailRes.ok) {
            const body = await detailRes.text();
            console.error("Message detail error:", body);
            return { id: msg.id, subject: "(failed)" };
          }
          const detail = await detailRes.json();
          const headers = detail?.payload?.headers || [];
          const sub = headers.find((h: { name: string; value: string }) => h.name === "Subject");
          return { id: msg.id, subject: sub?.value || "(no subject)" };
        } catch (err) {
          console.error(err);
          return { id: msg.id, subject: "(error)" };
        }
      })
    );

    return NextResponse.json({ messages: detailed });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
