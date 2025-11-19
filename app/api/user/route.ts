import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json({ error: "Failed to fetch Google profile" }, { status: 500 });
    }

    const profile = await profileRes.json();
    
    // Return user profile with email, name, picture
    return NextResponse.json({
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      id: profile.id,
    });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}
