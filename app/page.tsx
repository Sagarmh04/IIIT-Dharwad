"use client";

import { useState, useEffect } from "react";

/**
 * Environment configuration notes:
 * - For quick local testing you can paste your OAuth credentials below.
 * - DO NOT commit client secrets to source control. This is insecure.
 * - Recommended: perform the token exchange on a server (Next.js API route).
 *
 * Make sure in Google Cloud Console you created an OAuth 2.0 Client ID of type
 * "Web application" and added the redirect URI (for example `http://localhost:3000`).
 */

const FALLBACK_CLIENT_ID = "PASTE_YOUR_CLIENT_ID_HERE"; // e.g. xxxxx.apps.googleusercontent.com
const FALLBACK_CLIENT_SECRET = "PASTE_YOUR_CLIENT_SECRET_HERE"; // for local testing only

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || FALLBACK_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || FALLBACK_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || "http://localhost:3000";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
].join(" ");

export default function HomePage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [emails, setEmails] = useState<{ id: string; subject: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extract `access_token` from redirect query (set by server route)
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("access_token");
    const oauthError = url.searchParams.get("oauth_error");
    if (oauthError) {
      setErrorMsg(oauthError);
      url.searchParams.delete("oauth_error");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    if (token) {
      setAccessToken(token);
      url.searchParams.delete("access_token");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  // Fetch last 20 email subjects
  useEffect(() => {
    if (!accessToken) return;

    async function fetchEmails() {
        try {
        const listRes = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        const listData = await listRes.json();
          if (!listRes.ok) {
            setErrorMsg(`Gmail list error: ${listData.error?.message || JSON.stringify(listData)}`);
            console.error("Gmail list error:", listData);
            return;
          }
        if (!listData.messages) return;

        const detailed = await Promise.all(
          listData.messages.map(async (msg: any) => {
            const detailRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );
            if (!detailRes.ok) {
              const errBody = await detailRes.text();
              console.error("Message detail fetch error:", errBody);
              return { id: msg.id, subject: "(failed to fetch)" };
            }
            const detail = await detailRes.json();

            let subject = "No Subject";
            const headers = detail?.payload?.headers || [];
            const sub = headers.find((h: any) => h.name === "Subject");
            if (sub) subject = sub.value;

            return { id: msg.id, subject };
          })
        );

        setEmails(detailed);
      } catch (error) {
        console.error("Error fetching emails:", error);
      }
    }

    fetchEmails();
  }, [accessToken]);

  function handleLogin() {
    // Use server-side OAuth entrypoint which initiates the Google auth and
    // performs the token exchange server-side. The server will redirect back
    // with `?access_token=...` (quick local testing). Recommended: server
    // should store tokens and set a secure cookie instead of exposing tokens.
    window.location.href = "/api/oauth/google";
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gmail API Test Page</h1>

      {!accessToken && (
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
        >
          Login with Google (Gmail Access)
        </button>
      )}

      {accessToken && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Last 20 Emails</h2>
          {emails.length === 0 && <p>Loading…</p>}

          <ul className="space-y-3">
            {emails.map((email) => (
              <li
                key={email.id}
                className="p-3 border rounded bg-gray-50 text-sm"
              >
                {email.subject}
              </li>
            ))}
          </ul>
        </div>
      )}
      {errorMsg && (
        <div className="mt-4 p-3 border rounded bg-red-50 text-red-800 text-sm">
          <strong>Error:</strong> {errorMsg}
          <div className="mt-2 text-xs text-gray-600">
            Common causes: wrong client ID/secret, missing redirect URI in Google Cloud
            Console, or using the wrong OAuth client type. For production, move the
            token exchange to a server-side endpoint so the client secret isn't exposed.
          </div>
        </div>
      )}
    </div>
  );
}



