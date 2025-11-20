"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import SmartReplyBox from "@/components/SmartReplyBox";

type EmailData = {
  messageId: string;
  threadId: string;
  subject: string;
  from: string;
  to?: string;
  date: number;
  body?: string;
  quickAnalysis?: any;
  deepAnalysis?: any;
};

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;
  
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [threadAnalysis, setThreadAnalysis] = useState<any>(null);
  const [hasCheckedAnalysis, setHasCheckedAnalysis] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/user");
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        router.push("/login");
      }
    }
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (!user || !threadId) return;

    // Query all emails with this threadId
    const emailsRef = collection(db, `users/${user.email}/emails`);
    const q = query(
      emailsRef,
      where("threadId", "==", threadId),
      orderBy("date", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const emailsData: EmailData[] = [];
      snapshot.forEach((doc) => {
        emailsData.push({ messageId: doc.id, ...doc.data() } as EmailData);
      });
      setEmails(emailsData);
      setLoading(false);

      // Check for existing thread analysis in Firestore first
      if (emailsData.length > 0 && !hasCheckedAnalysis) {
        checkExistingAnalysis(emailsData);
      }
    });

    return () => unsub();
  }, [user, threadId, hasCheckedAnalysis]);

  async function checkExistingAnalysis(emailsData: EmailData[]) {
    if (!user || !threadId) return;
    
    setHasCheckedAnalysis(true);
    
    try {
      // Check if thread analysis already exists in Firestore
      const threadDocRef = doc(db, `users/${user.email}/threads`, threadId);
      const threadDoc = await getDoc(threadDocRef);
      
      if (threadDoc.exists()) {
        const existingAnalysis = threadDoc.data();
        console.log(`Thread ${threadId} already analyzed, using cached analysis`);
        setThreadAnalysis(existingAnalysis);
      } else {
        // No existing analysis, analyze now
        console.log(`Thread ${threadId} not analyzed yet, analyzing...`);
        analyzeThread(emailsData);
      }
    } catch (error) {
      console.error("Error checking existing analysis:", error);
      // If check fails, try to analyze
      analyzeThread(emailsData);
    }
  }

  async function handleSendReply(reply: string, tone?: string, attachments?: any[]) {
    if (!user || emails.length === 0) return;

    setSending(true);
    try {
      const latestEmail = emails[emails.length - 1];
      const fromEmail = latestEmail.from?.match(/<(.+)>/)?.[1] || latestEmail.from;
      
      const response = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: fromEmail,
          subject: latestEmail.subject.startsWith("Re:") ? latestEmail.subject : `Re: ${latestEmail.subject}`,
          message: reply,
          threadId: threadId,
          messageId: latestEmail.messageId,
          attachments: attachments || [],
        }),
      });

      if (response.ok) {
        alert("Reply sent successfully!");
        setShowReplyBox(false);
      } else {
        const error = await response.json();
        alert(`Failed to send reply: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Send reply error:", error);
      alert("Failed to send reply. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function analyzeThread(emailsData: EmailData[]) {
    if (analyzing || !user) return;
    
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analysis/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailsData }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.threads && data.threads.length > 0) {
          const analysis = data.threads[0];
          setThreadAnalysis(analysis);
          
          // Save thread analysis to Firestore for future use
          const threadDocRef = doc(db, `users/${user.email}/threads`, threadId);
          await setDoc(threadDocRef, {
            ...analysis,
            analyzedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          
          console.log(`Thread ${threadId} analyzed and saved to Firestore`);
        }
      }
    } catch (error) {
      console.error("Thread analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] text-white p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <div className="text-gray-400">Loading thread...</div>
        </div>
      </div>
    );
  }

  if (!loading && emails.length === 0) {
    return (
      <div className="min-h-screen bg-[#000000] text-white p-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => router.back()} className="mb-4 text-[#2b58b8] hover:underline transition-colors">
            ← Back
          </button>
          <div className="p-6 rounded-lg bg-[#0b0b0e] border border-white/10 text-center">
            <div className="text-gray-400">No emails found in this thread</div>
          </div>
        </div>
      </div>
    );
  }

  const firstEmail = emails[0];
  const latestEmail = emails[emails.length - 1];

  return (
    <div className="min-h-screen bg-[#000000] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push("/")} className="mb-4 text-[#2b58b8] hover:underline transition-colors">
          ← Back to Inbox
        </button>

        {/* Thread Header */}
        <div className="mb-6 p-6 rounded-lg bg-[#0b0b0e] border border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{firstEmail?.subject || "Thread"}</h1>
              <div className="text-sm text-gray-400">Thread ID: {threadId}</div>
            </div>
            {analyzing && (
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                Analyzing...
              </div>
            )}
          </div>
          
          {threadAnalysis?.summary && (
            <div className="mb-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-sm text-blue-300 mb-1 font-medium">AI Summary</div>
              <div className="text-gray-200">{threadAnalysis.summary}</div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="p-3 rounded bg-white/5">
              <div className="text-xs text-gray-400">Messages</div>
              <div className="text-xl font-semibold mt-1">{emails.length}</div>
            </div>
            <div className="p-3 rounded bg-white/5">
              <div className="text-xs text-gray-400">Escalation Risk</div>
              <div className={`text-xl font-semibold mt-1 capitalize ${
                threadAnalysis?.escalationRisk === "high" ? "text-red-500" : 
                threadAnalysis?.escalationRisk === "medium" ? "text-yellow-500" : "text-green-500"
              }`}>
                {threadAnalysis?.escalationRisk || "analyzing..."}
              </div>
            </div>
            <div className="p-3 rounded bg-white/5">
              <div className="text-xs text-gray-400">Last Message</div>
              <div className="text-sm mt-1">
                {latestEmail?.date ? formatDistanceToNow(new Date(latestEmail.date), { addSuffix: true }) : "—"}
              </div>
            </div>
          </div>

          {threadAnalysis?.conversationHealthScore !== undefined && (
            <div className="mt-4 p-3 rounded bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-400">Conversation Health Score</div>
                <div className="text-lg font-semibold">{threadAnalysis.conversationHealthScore}/100</div>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    threadAnalysis.conversationHealthScore >= 70 ? "bg-green-500" :
                    threadAnalysis.conversationHealthScore >= 40 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${threadAnalysis.conversationHealthScore}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Key Topics & Action Items */}
        {threadAnalysis && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {threadAnalysis.keyTopics && threadAnalysis.keyTopics.length > 0 && (
              <div className="p-4 rounded-lg bg-[#0b0b0e] border border-white/10">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Key Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {threadAnalysis.keyTopics.map((topic: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {threadAnalysis.actionItems && threadAnalysis.actionItems.length > 0 && (
              <div className="p-4 rounded-lg bg-[#0b0b0e] border border-white/10">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Action Items</h3>
                <ul className="space-y-2">
                  {threadAnalysis.actionItems.map((item: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        {threadAnalysis?.timeline && threadAnalysis.timeline.length > 0 && (
          <div className="mb-6 p-6 rounded-lg bg-[#0b0b0e] border border-white/10">
            <h2 className="text-lg font-semibold mb-4">Sentiment Timeline</h2>
            <div className="space-y-3">
              {threadAnalysis.timeline.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${
                    item.sentiment === "positive" ? "bg-green-500" :
                    item.sentiment === "negative" ? "bg-red-500" : "bg-gray-500"
                  }`} />
                  <div className="text-sm text-gray-300 flex-1">{item.from || "Unknown"}</div>
                  <div className="text-xs text-gray-500">{item.date ? new Date(item.date).toLocaleDateString() : ""}</div>
                  <span className={`text-xs px-2 py-1 rounded capitalize ${
                    item.sentiment === "positive" ? "bg-green-500/20 text-green-300" :
                    item.sentiment === "negative" ? "bg-red-500/20 text-red-300" : "bg-gray-500/20 text-gray-300"
                  }`}>
                    {item.sentiment}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reply Box */}
        <div className="mb-6">
          <button
            onClick={() => setShowReplyBox(!showReplyBox)}
            className="px-4 py-2 rounded-lg bg-green-600/10 hover:bg-green-600/20 border border-green-500/20 hover:border-green-500/40 text-green-400 hover:text-green-300 transition-all text-sm"
          >
            {showReplyBox ? "Hide Reply" : "Reply to Thread"}
          </button>
        </div>

        {showReplyBox && (
          <div className="mb-6 p-6 rounded-lg bg-[#0b0b0e] border border-white/10">
            {sending && (
              <div className="mb-3 p-3 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm">
                Sending reply...
              </div>
            )}
            <SmartReplyBox
              onSendReply={handleSendReply}
              suggestions={latestEmail?.deepAnalysis?.smartReplies || []}
              emailContext={{
                from: latestEmail?.from,
                subject: latestEmail?.subject || "",
                body: latestEmail?.body,
              }}
            />
          </div>
        )}

        {/* Email List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">Messages in Thread ({emails.length})</h2>
          {emails.map((email, index) => (
            <div
              key={email.messageId}
              className="p-5 rounded-lg bg-[#0b0b0e] border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-semibold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{email.subject}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      <span className="font-medium">From:</span> {email.from}
                    </div>
                    {email.to && (
                      <div className="text-sm text-gray-400">
                        <span className="font-medium">To:</span> {email.to}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {email.date ? formatDistanceToNow(new Date(email.date), { addSuffix: true }) : ""}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  {email.quickAnalysis?.sentiment && (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      email.quickAnalysis.sentiment === "positive" ? "bg-green-500/20 text-green-400" :
                      email.quickAnalysis.sentiment === "negative" ? "bg-red-500/20 text-red-400" : 
                      "bg-gray-500/20 text-gray-400"
                    }`}>
                      {email.quickAnalysis.sentiment}
                    </div>
                  )}
                  {email.quickAnalysis?.urgency && (
                    <div className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      email.quickAnalysis.urgency === "high" ? "bg-red-500/20 text-red-400" :
                      email.quickAnalysis.urgency === "medium" ? "bg-yellow-500/20 text-yellow-400" : 
                      "bg-gray-500/20 text-gray-400"
                    }`}>
                      {email.quickAnalysis.urgency}
                    </div>
                  )}
                </div>
              </div>
              
              {email.quickAnalysis?.summary && (
                <div className="mb-3 p-3 rounded bg-blue-500/5 border border-blue-500/10">
                  <div className="text-xs text-blue-400 mb-1">Summary</div>
                  <div className="text-sm text-gray-300">{email.quickAnalysis.summary}</div>
                </div>
              )}

              {email.body && (
                <div className="text-sm text-gray-300 mt-3 leading-relaxed">
                  {email.body.length > 500 ? (
                    <>
                      {email.body.substring(0, 500)}
                      <span className="text-gray-500">... </span>
                      <button className="text-blue-400 hover:text-blue-300 text-xs">
                        Read more
                      </button>
                    </>
                  ) : (
                    email.body
                  )}
                </div>
              )}

              {email.quickAnalysis?.keywords && email.quickAnalysis.keywords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {email.quickAnalysis.keywords.map((keyword: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 rounded bg-white/5 text-gray-400 text-xs">
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
