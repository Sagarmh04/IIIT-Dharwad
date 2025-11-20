"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import EmailDetailPanel from "@/components/EmailDetailPanel";
import SmartReplyBox from "@/components/SmartReplyBox";

type EmailData = {
  messageId: string;
  threadId?: string;
  subject: string;
  from?: string;
  to?: string;
  date?: number;
  body?: string;
  quickAnalysis?: any;
  deepAnalysis?: any;
  semanticContext?: any;
};

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const messageId = params.id as string;

  const [email, setEmail] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/user");
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user || !messageId) return;

    const emailRef = doc(db, `users/${user.email}/emails`, messageId);
    const unsub = onSnapshot(emailRef, (snap) => {
      if (snap.exists()) {
        setEmail(snap.data() as EmailData);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user, messageId]);

  async function handleSendReply(reply: string, tone?: string, attachments?: any[]) {
    if (!email) return;

    try {
      // Extract sender email from the "from" field
      const fromEmail = email.from?.match(/<(.+)>/)?.[1] || email.from;
      
      const response = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: fromEmail,
          subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
          message: reply,
          threadId: email.threadId,
          messageId: email.messageId,
          attachments: attachments || [],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert("Reply sent successfully!");
        console.log("Reply sent:", result);
      } else {
        const error = await response.json();
        console.error("Send error:", error);
        alert(`Failed to send reply: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Send reply error:", error);
      alert("Failed to send reply. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] text-white p-6 flex items-center justify-center">
        <div className="text-gray-400">Loading email...</div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-[#000000] text-white p-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => router.back()} className="mb-4 text-[#2b58b8] hover:underline">
            ← Back
          </button>
          <div className="text-gray-400">Email not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <div className="max-w-6xl mx-auto p-6">
        <button onClick={() => router.back()} className="mb-4 text-[#2b58b8] hover:underline">
          ← Back to Inbox
        </button>

        <div className="flex gap-6">
          <div className="flex-1">
            <EmailDetailPanel email={email} showReplyBox={true} />
          </div>
        </div>

        {email.threadId && (
          <div className="mt-6">
            <button
              onClick={() => router.push(`/thread/${email.threadId}`)}
              className="px-4 py-2 rounded-lg bg-[#0b3d91] hover:bg-[#2b58b8]"
            >
              View Full Thread
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
