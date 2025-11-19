"use client";

import Image from "next/image";
import React from "react";

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = "/api/oauth/google";
  };

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
        <source src="/login video.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Centered Login Card */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="bg-white/95 rounded-2xl shadow-xl p-8 w-[360px] max-w-[90%] text-center backdrop-blur-sm">
          {/* Logo */}
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
            onClick={handleLogin}
            className="flex items-center justify-center gap-3 w-full bg-white text-gray-700 border border-gray-300 rounded-lg py-2.5 hover:bg-gray-100 shadow transition"
          >
            <Image
              src="/google.png"
              alt="Google Logo"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            <span className="font-medium text-sm">Sign in with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
