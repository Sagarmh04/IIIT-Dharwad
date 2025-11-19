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
  const [emails, setEmails] = useState<{ id: string; subject: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/gmail/messages");
        if (res.status === 401) {
          // Not authenticated -> redirect to login
          window.location.href = "/login";
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || JSON.stringify(data));
          return;
        }
        setEmails(data.messages || []);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout");
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gmail API Test Page</h1>

      <div className="flex items-center gap-3">
        <button
          onClick={() => (window.location.href = "/api/oauth/google")}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
        >
          Reauthenticate
        </button>

        <button
          onClick={handleLogout}
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Logout
        </button>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Last 20 Emails</h2>
        {loading && <p>Loading…</p>}
        {!loading && emails.length === 0 && <p>No emails found.</p>}

        <ul className="space-y-3">
          {emails.map((email) => (
            <li key={email.id} className="p-3 border rounded bg-gray-50 text-sm">
              {email.subject}
            </li>
          ))}
        </ul>
      </div>
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



