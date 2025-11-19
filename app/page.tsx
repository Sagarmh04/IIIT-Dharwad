"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  limit,
  getDocs,
  where,
} from "firebase/firestore";

import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
import EmailListItem from "@/components/EmailListItem";
import EmailDetailPanel from "@/components/EmailDetailPanel";
import SmartReplyBox from "@/components/SmartReplyBox";
import LoadingSpinner from "@/components/LoadingSpinner";

type User = {
  email: string;
  name?: string;
  picture?: string;
};

type EmailMeta = {
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

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [emails, setEmails] = useState<EmailMeta[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailMeta[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [stats, setStats] = useState<any>({});

  // Fetch user
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        router.push("/login");
      }
    }
    fetchUser();
  }, [router]);

  // Real-time listener for emails
  useEffect(() => {
    if (!user) {
      setEmails([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const colRef = collection(db, `users/${user.email}/emails`);
    const q = query(colRef, orderBy("date", "desc"), limit(100));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr: EmailMeta[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          arr.push({
            messageId: docSnap.id,
            threadId: data.threadId,
            subject: data.subject || "(no subject)",
            from: data.from || data.fromName || "",
            to: data.to || "",
            date: data.date || data.createdAt || 0,
            body: data.body || "",
            quickAnalysis: data.quickAnalysis,
            deepAnalysis: data.deepAnalysis,
            semanticContext: data.semanticContext,
          });
        });
        setEmails(arr);
        calculateStats(arr);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore listen error:", err);
        setError("Failed to listen to emails.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  // Apply filters
  useEffect(() => {
    let filtered = [...emails];

    if (filters.sentiment?.length > 0) {
      filtered = filtered.filter((e) =>
        filters.sentiment.includes(e.quickAnalysis?.sentiment)
      );
    }

    if (filters.urgency?.length > 0) {
      filtered = filtered.filter((e) =>
        filters.urgency.includes(e.quickAnalysis?.urgency)
      );
    }

    if (filters.category?.length > 0) {
      filtered = filtered.filter((e) =>
        filters.category.includes(e.quickAnalysis?.category)
      );
    }

    if (filters.hasCompliance) {
      filtered = filtered.filter(
        (e) => e.deepAnalysis?.complianceRisk?.level === "high" || e.deepAnalysis?.complianceRisk?.level === "medium"
      );
    }

    if (filters.hasPII) {
      filtered = filtered.filter(
        (e) => e.deepAnalysis?.piiDetected && e.deepAnalysis.piiDetected.length > 0
      );
    }

    setFilteredEmails(filtered);
  }, [emails, filters]);

  function calculateStats(emailList: EmailMeta[]) {
    const analyzed = emailList.filter((e) => e.quickAnalysis).length;
    const highPriority = emailList.filter((e) => e.quickAnalysis?.urgency === "high").length;
    const compliance = emailList.filter(
      (e) => e.deepAnalysis?.complianceRisk?.level === "high" || e.deepAnalysis?.complianceRisk?.level === "medium"
    ).length;
    const pii = emailList.filter(
      (e) => e.deepAnalysis?.piiDetected && e.deepAnalysis.piiDetected.length > 0
    ).length;

    setStats({ analyzed, highPriority, compliance, pii });
  }

  // Sync Gmail: Fetch emails and run Pass 1
  async function handleSync() {
    if (!user) {
      setError("Not signed in.");
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      // Step 1: Fetch email IDs
      const res = await fetch("/api/gmail/messages");
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Server returned ${res.status}`);
      }
      const data = await res.json();
      const msgs = data.messages || [];

      // Step 2: Fetch and store emails (limit to 10 to avoid overwhelming)
      const emailsToAnalyze: any[] = [];
      const messagesToFetch = msgs.slice(0, 10);

      for (const m of messagesToFetch) {
        try {
          const fullRes = await fetch(`/api/gmail/full?messageId=${m.id}`);
          if (fullRes.ok) {
            const fullEmail = await fullRes.json();
            
            // Save to Firestore
            const docRef = doc(db, `users/${user.email}/emails`, fullEmail.messageId);
            const emailDoc = await getDocs(
              query(
                collection(db, `users/${user.email}/emails`),
                where("messageId", "==", fullEmail.messageId)
              )
            );

            const existingData = emailDoc.empty ? null : emailDoc.docs[0].data();
            
            await setDoc(
              docRef,
              {
                ...fullEmail,
                createdAt: serverTimestamp(),
              },
              { merge: true }
            );

            // Queue for analysis if not already analyzed
            if (!existingData?.quickAnalysis) {
              emailsToAnalyze.push(fullEmail);
            }
          }
        } catch (err) {
          console.error("Error fetching email:", err);
        }
      }

      // Step 3: Run Pass 1 in small batches to avoid rate limits
      if (emailsToAnalyze.length > 0) {
        // Process 2 at a time with delay
        for (let i = 0; i < emailsToAnalyze.length; i += 2) {
          const batch = emailsToAnalyze.slice(i, i + 2);
          
          try {
            const pass1Res = await fetch("/api/analysis/pass1", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ emails: batch }),
            });

            if (pass1Res.ok) {
              const pass1Data = await pass1Res.json();
              
              // Update Firestore with quickAnalysis
              for (const result of pass1Data.results || []) {
                if (result.quickAnalysis) {
                  const docRef = doc(db, `users/${user.email}/emails`, result.messageId);
                  await setDoc(docRef, { quickAnalysis: result.quickAnalysis }, { merge: true });
                }
              }
            }
            
            // Wait 1 second between batches to respect rate limits
            if (i + 2 < emailsToAnalyze.length) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (err) {
            console.error("Pass1 batch error:", err);
          }
        }
      }

      setSyncing(false);
    } catch (err: any) {
      console.error("Sync failed:", err);
      setError(err?.message || "Sync failed");
      setSyncing(false);
    }
  }

  // Trigger Pass 2 when email is selected (with rate limit handling)
  async function handleEmailSelect(email: EmailMeta) {
    setSelectedEmail(email);

    if (!email.deepAnalysis && user) {
      // Run Pass 2 with retry
      let retries = 3;
      let delay = 2000;
      
      while (retries > 0) {
        try {
          const pass2Res = await fetch("/api/analysis/pass2", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          if (pass2Res.status === 429) {
            // Rate limited, wait and retry
            retries--;
            if (retries > 0) {
              console.log(`Rate limited, retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2; // Exponential backoff
              continue;
            }
          }

          if (pass2Res.ok) {
            const pass2Data = await pass2Res.json();
            const docRef = doc(db, `users/${user.email}/emails`, email.messageId);
            await setDoc(docRef, { deepAnalysis: pass2Data.deepAnalysis }, { merge: true });

            // Run Pass 3 after Pass 2
            await runPass3(email);
          }
          break;
        } catch (err) {
          console.error("Pass 2 failed:", err);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
          }
        }
      }
    } else if (email.deepAnalysis && !email.semanticContext && user) {
      // Run Pass 3 if deepAnalysis exists but semanticContext doesn't
      await runPass3(email);
    }
  }

  async function runPass3(email: EmailMeta) {
    if (!user) return;

    try {
      const pass3Res = await fetch("/api/analysis/pass3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (pass3Res.ok) {
        const pass3Data = await pass3Res.json();
        const docRef = doc(db, `users/${user.email}/emails`, email.messageId);
        await setDoc(docRef, { semanticContext: pass3Data.semanticContext }, { merge: true });

        // Append to semanticContext array (for search)
        const semanticDocRef = doc(db, `users/${user.email}/semanticContext`, email.messageId);
        await setDoc(semanticDocRef, {
          messageId: email.messageId,
          ...pass3Data.semanticContext,
        });
      }
    } catch (err) {
      console.error("Pass 3 failed:", err);
    }
  }

  async function handleSendReply(reply: string, tone?: string) {
    console.log("Sending reply:", reply, "with tone:", tone);
    // TODO: Implement send reply via Gmail API
    alert("Reply sent! (not implemented yet)");
  }

  return (
    <div className="flex h-screen bg-[#000000] text-white">
      {/* Sidebar */}
      <Sidebar
        filters={filters}
        onFilterChange={setFilters}
        onSyncClick={handleSync}
        syncing={syncing}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Stats Bar */}
        <div className="p-4 border-b border-white/10 bg-[#0b0b0e]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Inbox</h1>
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/search")}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10"
              >
                Search
              </button>
              <button
                onClick={() => router.push("/api/auth/logout")}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <StatsCard title="Analyzed" value={stats.analyzed || 0} color="blue" />
            <StatsCard title="High Priority" value={stats.highPriority || 0} color="red" />
            <StatsCard title="Compliance Risks" value={stats.compliance || 0} color="yellow" />
            <StatsCard title="PII Detected" value={stats.pii || 0} color="purple" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email List */}
          <div className="w-1/2 overflow-y-auto p-4 border-r border-white/10">
            {error && (
              <div className="mb-4 p-3 rounded bg-red-900/60 text-sm text-red-100">{error}</div>
            )}

            {loading && <LoadingSpinner />}
            
            {syncing && (
              <div className="mb-4 p-4 rounded-lg bg-[#0b3d91]/20 border border-[#0b3d91] text-sm">
                <LoadingSpinner />
              </div>
            )}

            {!loading && filteredEmails.length === 0 && (
              <div className="p-6 rounded bg-white/5 text-gray-400">
                No emails found. Click "Sync Gmail Now" in the sidebar.
              </div>
            )}

            <div className="space-y-3">
              {filteredEmails.map((e) => (
                <EmailListItem
                  key={e.messageId}
                  email={e}
                  onOpen={() => handleEmailSelect(e)}
                  selected={selectedEmail?.messageId === e.messageId}
                />
              ))}
            </div>
          </div>

          {/* Email Detail Panel */}
          <div className="w-1/2 overflow-y-auto">
            <EmailDetailPanel
              email={selectedEmail}
              onClose={() => setSelectedEmail(null)}
            />

            {selectedEmail && selectedEmail.deepAnalysis && (
              <div className="p-6">
                <SmartReplyBox
                  onSendReply={handleSendReply}
                  suggestions={selectedEmail.deepAnalysis?.smartReplies || []}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



