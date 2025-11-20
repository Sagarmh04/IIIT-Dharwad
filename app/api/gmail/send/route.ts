import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { to, subject, message, threadId, messageId, attachments = [] } = body;

    if (!to || !message) {
      return NextResponse.json({ error: "to and message are required" }, { status: 400 });
    }

    // Build email in RFC 2822 format
    const boundary = "boundary_" + Math.random().toString(36).substring(2);
    let email = [
      `To: ${to}`,
      `Subject: ${subject || "(No Subject)"}`,
      "MIME-Version: 1.0",
    ];

    // If it's a reply, add necessary headers
    if (threadId) {
      email.push(`In-Reply-To: ${messageId || ""}`);
      email.push(`References: ${messageId || ""}`);
    }

    // Handle attachments
    if (attachments.length > 0) {
      email.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      email.push("");
      email.push(`--${boundary}`);
      email.push("Content-Type: text/plain; charset=UTF-8");
      email.push("");
      email.push(message);

      // Add each attachment
      for (const attachment of attachments) {
        email.push("");
        email.push(`--${boundary}`);
        email.push(`Content-Type: ${attachment.mimeType || "application/octet-stream"}`);
        email.push("Content-Transfer-Encoding: base64");
        email.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
        email.push("");
        email.push(attachment.data); // Should be base64 encoded
      }

      email.push("");
      email.push(`--${boundary}--`);
    } else {
      email.push("Content-Type: text/plain; charset=UTF-8");
      email.push("");
      email.push(message);
    }

    const emailContent = email.join("\r\n");
    const encodedMessage = Buffer.from(emailContent)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send the email
    const sendUrl = threadId
      ? `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`
      : `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`;

    const payload: any = {
      raw: encodedMessage,
    };

    if (threadId) {
      payload.threadId = threadId;
    }

    const sendRes = await fetch(sendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!sendRes.ok) {
      const errorText = await sendRes.text();
      console.error("Gmail send error:", errorText);
      return NextResponse.json(
        { error: "Failed to send email", detail: errorText },
        { status: sendRes.status }
      );
    }

    const result = await sendRes.json();
    return NextResponse.json({
      success: true,
      messageId: result.id,
      threadId: result.threadId,
    });
  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
