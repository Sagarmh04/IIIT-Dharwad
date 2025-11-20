"use client";

import Image from "next/image";
import React, { useState } from "react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    // Simulate a brief delay for better UX before redirecting
    setTimeout(() => {
      window.location.href = "/api/oauth/google";
    }, 800);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans text-white">
      {/* 1. Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover opacity-80"
      >
        <source src="/login video.mp4" type="video/mp4" />
      </video>

      {/* 2. Cinematic Dark Overlay (Gradient) */}
      {/* This creates a vignette effect, darker at the bottom/right */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/70 to-black/90 backdrop-blur-[2px]" />

      {/* 3. Main Content Container */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        
        {/* 4. The Glass Card */}
        <div className="
          group relative w-full max-w-[400px] 
          p-10 rounded-3xl 
          bg-white/5 border border-white/10 
          backdrop-blur-xl shadow-2xl 
          hover:border-white/20 transition-all duration-500
        ">
          
          {/* Decorative Glow behind the card (Ambient Light) */}
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>

          {/* Content Wrapper */}
          <div className="relative flex flex-col items-center text-center">
            
            {/* Logo with a subtle glass container */}
            <div className="mb-6 p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
              <img
                src="/logo.png"
                alt="App Logo"
                className="w-16 h-16 object-contain rounded-xl"
              />
            </div>

            {/* Typography */}
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-400 mb-8 font-light">
              Sign in to access your InsightMail dashboard.
            </p>

            {/* Custom Google Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className={`
                relative w-full flex items-center justify-center gap-3 
                bg-white text-black 
                hover:bg-gray-100 active:scale-95
                font-semibold py-3.5 rounded-xl 
                transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]
                disabled:opacity-70 disabled:cursor-not-allowed
              `}
            >
              {isLoading ? (
                // Simple SVG Spinner so you don't need external icon libraries
                <svg
                  className="animate-spin h-5 w-5 text-gray-800"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <>
                  <Image
                    src="/google.png"
                    alt="Google Logo"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            {/* Footer Link */}
            <div className="mt-6 text-xs text-gray-500">
              <p>Protected by Enterprise Grade Security</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}