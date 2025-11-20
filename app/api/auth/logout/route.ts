import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Get the origin for proper redirect
  const origin = req.nextUrl.origin;
  
  // Create redirect response
  const response = NextResponse.redirect(`${origin}/login`, {
    status: 302,
  });
  
  // Clear all auth-related cookies
  response.cookies.set("access_token", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
  });
  
  response.cookies.set("refresh_token", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
  });
  
  response.cookies.set("session", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
  });
  
  // Clear site data
  response.headers.set("Clear-Site-Data", '"cookies", "storage"');
  
  return response;
}
