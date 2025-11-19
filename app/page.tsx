"use client";

import { useState, useEffect } from "react";
import { collection, doc, setDoc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EmailMessage } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
import EmailListItem from "@/components/EmailListItem";
import EmailDetailPanel from "@/components/EmailDetailPanel";

export default function HomePage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Fetch user
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user");
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const userData = await res.json();
        setUser(userData);
      } catch (err) {
        console.error(err);
        window.location.href = "/login";
      }
    }
    fetchUser();
  }, []);

  // Real-time sync from Firestore
  useEffect(() => {
    if (!user) return;

    const userId = user.email.replace(/[^a-zA-Z0-9]/g, "_");
    const emailsRef = collection(db, "users", userId, "emails");
    
    const unsubscribe = onSnapshot(emailsRef, (snapshot) => {
      const emailData: EmailMessage[] = [];
      snapshot.forEach((doc) => {
        emailData.push(doc.data() as EmailMessage);
      });
      
      // Sort by date descending
      emailData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setEmails(emailData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Gmail
  const handleSync = async () => {
    if (!user || syncing) return;
    
    setSyncing(true);
    try {
      const userId = user.email.replace(/[^a-zA-Z0-9]/g, "_");
      
      // Fetch message list
      const listRes = await fetch("/api/gmail/messages");
      if (!listRes.ok) throw new Error("Failed to fetch messages");
      
      const { messages } = await listRes.json();
      
      // Process 5 at a time
      const BATCH_SIZE = 5;
      for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        const batch = messages.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (msg: any) => {
          const messageId = msg.id;
          
          // Check if already exists in Firestore
          const emailDocRef = doc(db, "users", userId, "emails", messageId);
          
          // Fetch full email
          const fullRes = await fetch(`/api/gmail/full?messageId=${messageId}`);
          if (!fullRes.ok) return;
          
          const fullEmail = await fullRes.json();
          
          // Store raw email
          await setDoc(emailDocRef, {
            messageId: fullEmail.messageId,
            threadId: fullEmail.threadId,
            subject: fullEmail.subject,
            from: fullEmail.from,
            to: fullEmail.to,
            date: fullEmail.date,
            body: fullEmail.body,
          }, { merge: true });
          
          // Pass 1: Quick Analysis
          const pass1Res = await fetch("/api/analysis/pass1", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: fullEmail.subject,
              from: fullEmail.from,
              body: fullEmail.body,
              snippet: fullEmail.snippet,
            }),
          });
          
          if (pass1Res.ok) {
            const quickAnalysis = await pass1Res.json();
            await setDoc(emailDocRef, { quickAnalysis }, { merge: true });
          }
        }));
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  // Trigger Pass 2 when email is selected
  useEffect(() => {
    if (!selectedEmail || !user) return;
    
    const runPass2 = async () => {
      if (selectedEmail.deepAnalysis) return; // Already analyzed
      
      const userId = user.email.replace(/[^a-zA-Z0-9]/g, "_");
      const emailDocRef = doc(db, "users", userId, "emails", selectedEmail.messageId);
      
      try {
        const pass2Res = await fetch("/api/analysis/pass2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: selectedEmail.subject,
            from: selectedEmail.from,
            to: selectedEmail.to,
            body: selectedEmail.body,
          }),
        });
        
        if (pass2Res.ok) {
          const deepAnalysis = await pass2Res.json();
          await setDoc(emailDocRef, { deepAnalysis }, { merge: true });
          
          // Pass 3: Semantic Context
          const pass3Res = await fetch("/api/analysis/pass3", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: selectedEmail.subject,
              from: selectedEmail.from,
              to: selectedEmail.to,
              body: selectedEmail.body,
              quickAnalysis: selectedEmail.quickAnalysis,
            }),
          });
          
          if (pass3Res.ok) {
            const semanticContext = await pass3Res.json();
            await setDoc(emailDocRef, { semanticContext }, { merge: true });
          }
        }
      } catch (err) {
        console.error("Pass 2/3 error:", err);
      }
    };
    
    runPass2();
  }, [selectedEmail, user]);

  // Filter emails
  const filteredEmails = emails.filter((email) => {
    if (filters.sentiment && email.quickAnalysis?.sentiment !== filters.sentiment) return false;
    if (filters.urgency && email.quickAnalysis?.urgency !== filters.urgency) return false;
    if (filters.category && email.quickAnalysis?.category !== filters.category) return false;
    return true;
  });

  // Calculate stats
  const stats = {
    total: emails.length,
    urgent: emails.filter((e) => e.quickAnalysis?.urgency === "high").length,
    positive: emails.filter((e) => e.quickAnalysis?.sentiment === "positive").length,
    negative: emails.filter((e) => e.quickAnalysis?.sentiment === "negative").length,
    compliance: emails.filter((e) => e.deepAnalysis?.complianceRisk).length,
    pii: emails.filter((e) => e.deepAnalysis?.piiDetected).length,
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        onSync={handleSync}
        syncing={syncing}
        filters={filters}
        onFilterChange={setFilters}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Stats Bar */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="grid grid-cols-6 gap-4">
            <StatsCard title="Total" value={stats.total} color="blue" />
            <StatsCard title="Urgent" value={stats.urgent} color="red" />
            <StatsCard title="Positive" value={stats.positive} color="green" />
            <StatsCard title="Negative" value={stats.negative} color="red" />
            <StatsCard title="Compliance" value={stats.compliance} color="yellow" />
            <StatsCard title="PII" value={stats.pii} color="purple" />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Email List */}
          <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : filteredEmails.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {emails.length === 0 ? "Click 'Sync Gmail Now' to load emails" : "No emails match filters"}
              </div>
            ) : (
              filteredEmails.map((email) => (
                <EmailListItem
                  key={email.messageId}
                  email={email}
                  selected={selectedEmail?.messageId === email.messageId}
                  onClick={() => setSelectedEmail(email)}
                />
              ))
            )}
          </div>

          {/* Email Detail */}
          <EmailDetailPanel email={selectedEmail} />
        </div>
      </div>
    </div>
  );
}
