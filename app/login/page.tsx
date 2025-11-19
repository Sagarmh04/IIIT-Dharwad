"use client";

import Image from "next/image";
import React from "react";

export default function LoginPage() {
    return (
        <div className="relative w-full h-screen overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        {/* Make sure this file exists in /public */}
        <source src="/login video.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay on top of video */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Centered Login Card */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="bg-white/95 rounded-2xl shadow-xl p-8 w-[360px] max-w-[90%] text-center backdrop-blur-sm">
          {/* App Logo */}
          <img
            src="/logo.png"
            alt="App Logo"
            className="mx-auto w-20 h-20 object-contain mb-4 rounded-full border border-gray-200"
          />

          <h1 className="text-2xl font-semibold mb-2">Welcome to InsightMail</h1>
          <p className="text-sm text-gray-500 mb-6">
            Sign in to continue to your smart inbox.
          </p>

          {/* Google Login Button */}
          <button
            onClick={() => (window.location.href = "/api/oauth/google")}
            className="flex items-center justify-center gap-3 w-full bg-white text-gray-700 border border-gray-300 rounded-lg py-2.5 hover:bg-gray-100 shadow transition"
          >
            <Image
              src="/google.png"
              alt="Google Logo"
              width={120}
              height={120}
              className="w-5 h-5"
            />
            <span className="font-medium text-sm">Sign in with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
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
