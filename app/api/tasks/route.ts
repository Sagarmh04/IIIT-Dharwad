import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

type Task = {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  priority: "high" | "medium" | "low";
  category: string;
  completed: boolean;
  createdAt: string;
  emailId?: string;
  emailSubject?: string;
  source: string;
};

// GET - Fetch all tasks for the user
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

    // Fetch tasks array from user document
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const tasks = data.tasks || [];
      return NextResponse.json({ tasks });
    } else {
      return NextResponse.json({ tasks: [] });
    }
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add a new task
export async function POST(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, deadline, priority, category, emailId, emailSubject, source } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
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

    // Get existing tasks from user document
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);
    
    let tasks: Task[] = [];
    if (userDoc.exists()) {
      tasks = userDoc.data().tasks || [];
    }

    // Create new task
    const newTask: Task = {
      id: `task_${Date.now()}`,
      title,
      description,
      deadline: deadline || null,
      priority: priority || "medium",
      category: category || "other",
      completed: false,
      createdAt: new Date().toISOString(),
      emailId,
      emailSubject,
      source: source || "manual"
    };

    tasks.push(newTask);

    // Save back to user document
    await setDoc(userDocRef, {
      tasks,
    }, { merge: true });

    return NextResponse.json({ 
      success: true,
      task: newTask
    });
  } catch (error: any) {
    console.error("Error adding task:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update task (mark as completed)
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { taskId, completed } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
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

    // Get existing tasks from user document
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "No tasks found" }, { status: 404 });
    }

    let tasks: Task[] = userDoc.data().tasks || [];
    
    // Update task completion status
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    tasks[taskIndex].completed = completed;

    // Save back to user document
    await setDoc(userDocRef, {
      tasks,
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove a task
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const taskId = url.searchParams.get("id");

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
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

    // Get existing tasks from user document
    const userDocRef = doc(db, "users", userEmail);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "No tasks found" }, { status: 404 });
    }

    let tasks: Task[] = userDoc.data().tasks || [];
    
    // Filter out the task to delete
    tasks = tasks.filter(t => t.id !== taskId);

    // Save back to user document
    await setDoc(userDocRef, {
      tasks,
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
