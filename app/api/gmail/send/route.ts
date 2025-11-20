import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { to, subject, message, threadId, messageId, attachments = [] } = body;

    console.log("Sending email:", { to, subject, hasAttachments: attachments.length > 0, threadId });

    if (!to || !message) {
      return NextResponse.json({ error: "to and message are required" }, { status: 400 });
    }

    // Build email in RFC 2822 format
    const boundary = "boundary_" + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    let email = [
      `To: ${to}`,
      `Subject: ${subject || "(No Subject)"}`,
      "MIME-Version: 1.0",
    ];

    // If it's a reply, add necessary headers for threading
    if (threadId && messageId) {
      email.push(`In-Reply-To: <${messageId}>`);
      email.push(`References: <${messageId}>`);
    }

    // Handle attachments or plain text
    if (attachments && attachments.length > 0) {
      // Multipart email with attachments
      email.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      email.push("");
      
      // Message body part
      email.push(`--${boundary}`);
      email.push("Content-Type: text/plain; charset=UTF-8");
      email.push("Content-Transfer-Encoding: quoted-printable");
      email.push("");
      email.push(message);
      email.push("");

      // Add each attachment
      for (const attachment of attachments) {
        email.push(`--${boundary}`);
        email.push(`Content-Type: ${attachment.mimeType || "application/octet-stream"}; name="${attachment.filename}"`);
        email.push("Content-Transfer-Encoding: base64");
        email.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
        email.push("");
        // Ensure the base64 data is clean (no whitespace)
        const cleanData = attachment.data.replace(/\s/g, "");
        email.push(cleanData);
        email.push("");
      }

      email.push(`--${boundary}--`);
    } else {
      // Simple plain text email
      email.push("Content-Type: text/plain; charset=UTF-8");
      email.push("Content-Transfer-Encoding: quoted-printable");
      email.push("");
      email.push(message);
    }

    const emailContent = email.join("\r\n");
    
    // Encode to base64url format (Gmail API requirement)
    const encodedMessage = Buffer.from(emailContent)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Prepare payload
    const payload: any = {
      raw: encodedMessage,
    };

    // Add threadId if this is a reply
    if (threadId) {
      payload.threadId = threadId;
    }

    console.log("Sending to Gmail API with threadId:", threadId);

    // Send the email via Gmail API
    const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
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
    console.log("Email sent successfully:", { messageId: result.id, threadId: result.threadId });
    
    return NextResponse.json({
      success: true,
      messageId: result.id,
      threadId: result.threadId,
      labelIds: result.labelIds,
    });
  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
