import { NextResponse } from "next/server";

export async function GET() {
  // Clear the access_token cookie
  const cookie = `access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;`;
  return NextResponse.redirect("/login", {
    headers: {
      "Set-Cookie": cookie,
    },
  });
}
