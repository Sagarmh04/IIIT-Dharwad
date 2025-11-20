import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// GET - Fetch all contacts for the user (stored as array in single document)
export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get user email
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
    }

    const profile = await profileRes.json();
    const userEmail = profile.email;

    // Fetch contacts array directly from user document
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const contacts = data.contacts || [];
      return NextResponse.json({ contacts });
    } else {
      return NextResponse.json({ contacts: [] });
    }
  } catch (error: any) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add a new contact (stored in array)
export async function POST(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Get user email
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
    }

    const profile = await profileRes.json();
    const userEmail = profile.email;

    // Get existing contacts from user document
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);
    
    let contacts: { name: string; email: string }[] = [];
    if (userDoc.exists()) {
      contacts = userDoc.data().contacts || [];
    }

    // Check if contact already exists
    const existingIndex = contacts.findIndex(c => c.email.toLowerCase() === email.toLowerCase());
    
    if (existingIndex >= 0) {
      // Update existing contact
      contacts[existingIndex] = { name, email };
    } else {
      // Add new contact
      contacts.push({ name, email });
    }

    // Save back to user document (merge to preserve other fields)
    await setDoc(userDocRef, {
      contacts,
    }, { merge: true });

    return NextResponse.json({ 
      success: true,
      contact: { name, email }
    });
  } catch (error: any) {
    console.error("Error adding contact:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove a contact (from array)
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const contactEmail = url.searchParams.get("email");

    if (!contactEmail) {
      return NextResponse.json({ error: "Contact email is required" }, { status: 400 });
    }

    // Get user email
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
    }

    const profile = await profileRes.json();
    const userEmail = profile.email;

    // Get existing contacts from user document
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "No contacts found" }, { status: 404 });
    }

    let contacts: { name: string; email: string }[] = userDoc.data().contacts || [];
    
    // Filter out the contact to delete
    contacts = contacts.filter(c => c.email !== contactEmail);

    // Save back to user document
    await setDoc(userDocRef, {
      contacts,
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting contact:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
