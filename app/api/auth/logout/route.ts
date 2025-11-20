import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Clear all auth-related cookies
  const cookies = [
    `access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;`,
    `refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;`,
    `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;`,
  ];
  
  // Get the origin for proper redirect
  const origin = req.nextUrl.origin;
  
  return NextResponse.redirect(`${origin}/login`, {
    status: 302,
    headers: {
      "Set-Cookie": cookies,
      "Clear-Site-Data": '"cookies", "storage"',
    },
  });
}
