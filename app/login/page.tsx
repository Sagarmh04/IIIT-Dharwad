"use client";

import React from "react";

export default function LoginPage() {
  const handleLogin = () => {
    // Initiate server-side OAuth flow
    window.location.href = "/api/oauth/google";
  };

  const url = new URL(window.location.href);
  const error = url.searchParams.get("error") || url.searchParams.get("oauth_error");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Sign in</h1>
      {error && (
        <div className="mb-4 p-3 border rounded bg-red-50 text-red-800 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <p className="mb-4 text-sm text-gray-700">Sign in with Google to view your Gmail dashboard.</p>

      <button
        onClick={handleLogin}
        className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
      >
        Sign in with Google
      </button>
    </div>
  );
}
