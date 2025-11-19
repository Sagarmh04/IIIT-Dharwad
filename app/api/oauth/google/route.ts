import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
// For local dev, this will usually be: http://localhost:3000/api/oauth/google

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // 1️⃣ No code yet → redirect user to Google OAuth consent screen
  if (!code) {
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set(
      "scope",
      [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
      ].join(" ")
    );
    authUrl.searchParams.set("access_type", "offline"); // to get refresh_token
    authUrl.searchParams.set("prompt", "consent"); // force consent to always get refresh_token

    return NextResponse.redirect(authUrl.toString());
  }

  // 2️⃣ We have ?code=... → exchange it for tokens
  const params = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const tokenJson = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("Google token error:", tokenJson);
    return NextResponse.json(
      { error: "Failed to exchange code for tokens", details: tokenJson },
      { status: 400 }
    );
  }

  const {
    access_token,
    refresh_token,
    expires_in,
    id_token,
    scope,
    token_type,
  } = tokenJson;

  // 3️⃣ TODO: save refresh_token somewhere secure (DB) and create a session
  // For now, we'll just log it and redirect to /inbox
  console.log("Gmail OAuth tokens:", {
    access_token,
    refresh_token,
    expires_in,
    id_token,
    scope,
    token_type,
  });

  // Later you can:
  // - Create a user in DB if not exists
  // - Store refresh_token in DB (encrypted)
  // - Set a cookie/JWT for the session

  return NextResponse.redirect("/inbox");
}