import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get user email
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!userRes.ok) {
      return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
    
    const userProfile = await userRes.json();
    const userEmail = userProfile.email;

    // Setup Gmail API with googleapis
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });
    
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Fetch last 20 message IDs
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      maxResults: 20,
    });

    const messages = listResponse.data.messages || [];
    let syncedCount = 0;
    let analyzedCount = 0;
    const emailsToReturn: any[] = [];

    // Fetch full content for each message
    for (const message of messages) {
      try {
        const fullMsg = await gmail.users.messages.get({
          userId: "me",
          id: message.id!,
          format: "full",
        });

        const payload = fullMsg.data.payload;
        const headers = payload?.headers || [];
        
        const getHeader = (name: string) =>
          headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

        // Extract body
        let body = "";
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
            for (const subPart of part.parts) {
              const result = extractBody(subPart);
              if (result) return result;
            }
          }
          return "";
        }

        body = extractBody(payload).substring(0, 10000);

        const emailData = {
          messageId: fullMsg.data.id!,
          threadId: fullMsg.data.threadId!,
          subject: getHeader("Subject"),
          from: getHeader("From"),
          to: getHeader("To"),
          date: parseInt(fullMsg.data.internalDate || "0"),
          body,
          snippet: fullMsg.data.snippet || "",
        };

        syncedCount++;
        analyzedCount++;
        emailsToReturn.push(emailData);

      } catch (err) {
        console.error(`Error syncing message ${message.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      count: syncedCount,
      emails: emailsToReturn,
      message: `Synced ${syncedCount} emails`,
    });

  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
