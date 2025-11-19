"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

type ThreadData = {
  threadId: string;
  messageIds: string[];
  timeline: any[];
  summary?: string;
  escalationRisk?: string;
  updatedAt?: any;
};

type EmailData = {
  messageId: string;
  subject: string;
  from: string;
  date: number;
  body?: string;
  quickAnalysis?: any;
};

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;
  
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [emails, setEmails] = useState<EmailData[]>([]);
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
    if (!user || !threadId) return;

    const threadRef = doc(db, `users/${user.email}/threads`, threadId);
    const unsub = onSnapshot(threadRef, async (snap) => {
      if (snap.exists()) {
        const threadData = snap.data() as ThreadData;
        setThread(threadData);

        // Fetch all emails in this thread
        if (threadData.messageIds?.length > 0) {
          const emailPromises = threadData.messageIds.map(async (msgId) => {
            const emailRef = doc(db, `users/${user.email}/emails`, msgId);
            const emailSnap = await getDocs(query(collection(db, `users/${user.email}/emails`), where("messageId", "==", msgId)));
            if (!emailSnap.empty) {
              return emailSnap.docs[0].data() as EmailData;
            }
            return null;
          });

          const emailsData = await Promise.all(emailPromises);
          setEmails(emailsData.filter(Boolean) as EmailData[]);
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user, threadId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] text-white p-6 flex items-center justify-center">
        <div className="text-gray-400">Loading thread...</div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-[#000000] text-white p-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => router.back()} className="mb-4 text-[#2b58b8] hover:underline">
            ← Back
          </button>
          <div className="text-gray-400">Thread not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="mb-4 text-[#2b58b8] hover:underline">
          ← Back to Inbox
        </button>

        {/* Thread Header */}
        <div className="mb-6 p-6 rounded-lg bg-[#0b0b0e] border border-white/10">
          <h1 className="text-2xl font-bold mb-4">Thread: {thread.threadId}</h1>
          
          {thread.summary && (
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-1">Summary</div>
              <div className="text-gray-200">{thread.summary}</div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="p-3 rounded bg-white/5">
              <div className="text-xs text-gray-400">Messages</div>
              <div className="text-xl font-semibold mt-1">{emails.length}</div>
            </div>
            <div className="p-3 rounded bg-white/5">
              <div className="text-xs text-gray-400">Escalation Risk</div>
              <div className={`text-xl font-semibold mt-1 ${
                thread.escalationRisk === "high" ? "text-red-500" : 
                thread.escalationRisk === "medium" ? "text-yellow-500" : "text-green-500"
              }`}>
                {thread.escalationRisk || "low"}
              </div>
            </div>
            <div className="p-3 rounded bg-white/5">
              <div className="text-xs text-gray-400">Last Updated</div>
              <div className="text-sm mt-1">
                {thread.updatedAt ? formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true }) : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {thread.timeline && thread.timeline.length > 0 && (
          <div className="mb-6 p-6 rounded-lg bg-[#0b0b0e] border border-white/10">
            <h2 className="text-lg font-semibold mb-4">Sentiment Timeline</h2>
            <div className="space-y-2">
              {thread.timeline.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    item.sentiment === "positive" ? "bg-green-500" :
                    item.sentiment === "negative" ? "bg-red-500" : "bg-gray-500"
                  }`} />
                  <div className="text-sm text-gray-300">{item.from || "Unknown"}</div>
                  <div className="text-xs text-gray-500">{item.date ? new Date(item.date).toLocaleDateString() : ""}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Messages in Thread</h2>
          {emails.map((email) => (
            <div
              key={email.messageId}
              className="p-4 rounded-lg bg-[#0b0b0e] border border-white/10"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium">{email.subject}</div>
                  <div className="text-sm text-gray-400 mt-1">{email.from}</div>
                </div>
                {email.quickAnalysis?.sentiment && (
                  <div className={`px-3 py-1 rounded text-xs ${
                    email.quickAnalysis.sentiment === "positive" ? "bg-green-600" :
                    email.quickAnalysis.sentiment === "negative" ? "bg-red-600" : "bg-gray-600"
                  }`}>
                    {email.quickAnalysis.sentiment}
                  </div>
                )}
              </div>
              {email.body && (
                <div className="text-sm text-gray-300 mt-3 line-clamp-3">{email.body}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
