import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// Optional env; if not provided we'll default to the runtime origin + this route
// (e.g. http://localhost:3000/api/oauth/google). Register that exact URI in
// Google Cloud Console as an authorized redirect URI.
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// STEP 1 & 2 in one endpoint (for demo)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  // If Google sent an error
  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect("/login?error=google_oauth");
  }

  // Step 1: No code yet -> redirect user to Google
  if (!code) {
    if (!GOOGLE_CLIENT_ID) {
      console.error("Missing GOOGLE_CLIENT_ID env var");
      return NextResponse.json({ error: "Missing Google client ID on server" }, { status: 500 });
    }

    const origin = req.nextUrl.origin;
    const redirectUri = GOOGLE_REDIRECT_URI || `${origin}/api/oauth/google`;

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set(
      "scope",
      [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.compose",
        "https://www.googleapis.com/auth/gmail.modify"
      ].join(" ")
    );
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    return NextResponse.redirect(authUrl.toString());
  }

  // Step 2: Got ?code=... -> exchange for tokens
  const origin = req.nextUrl.origin;
  const redirectUri = GOOGLE_REDIRECT_URI || `${origin}/api/oauth/google`;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error("Missing Google client credentials on server");
    return NextResponse.json({ error: "Missing Google client credentials on server" }, { status: 500 });
  }

  const body = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const tokens = await tokenRes.json();
  console.log("Google tokens:", tokens);

  if (!tokenRes.ok) {
    // Redirect back with error details for easier debugging locally
    const detail = tokens.error_description || tokens.error || JSON.stringify(tokens);
    return NextResponse.redirect(`${origin}/?oauth_error=${encodeURIComponent(detail)}`);
  }

  // Store access token and refresh token in HttpOnly cookies
  const accessToken = tokens.access_token;
  const refreshToken = tokens.refresh_token;
  const expiresIn = tokens.expires_in || 3600;

  console.log("Setting cookies - access_token exists:", !!accessToken);
  console.log("Setting cookies - refresh_token exists:", !!refreshToken);

  const response = NextResponse.redirect(`${origin}/`);
  
  // Set access token cookie - force httpOnly false for debugging
  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: false, // Disable secure for localhost
    sameSite: "lax",
    maxAge: expiresIn,
    path: "/",
  });

  // Set refresh token cookie if provided
  if (refreshToken) {
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false, // Disable secure for localhost
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  console.log("Cookies set, redirecting to:", `${origin}/`);

  return response;
}