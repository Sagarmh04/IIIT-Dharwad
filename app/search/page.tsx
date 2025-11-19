"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useUser } from "@/lib/UserContext";

export default function SearchPage() {
  const router = useRouter();
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || !user) return;

    setLoading(true);
    try {
      // Fetch semantic contexts from Firestore
      const semanticContextsSnap = await getDocs(collection(db, `users/${user.email}/semanticContext`));
      const semanticContexts = semanticContextsSnap.docs.map((doc) => doc.data());

      // Call search API with semantic contexts
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, semanticContexts }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Fetch full email data for each result
        const emailResults = await Promise.all(
          (data.results || []).map(async (result: any) => {
            const emailSnap = await getDocs(
              collection(db, `users/${user.email}/emails`)
            );
            const emailDoc = emailSnap.docs.find((doc) => doc.id === result.messageId);
            if (emailDoc) {
              return {
                ...emailDoc.data(),
                matchReason: result.matchReason,
              };
            }
            return null;
          })
        );

        setResults(emailResults.filter(Boolean));
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Semantic Search</h1>
          <p className="text-gray-400">Search by intent, topic, company, role, or keywords</p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try: "urgent emails from doctors" or "ByteDocker compliance risks"'
              className="flex-1 px-4 py-3 rounded-lg bg-[#0b0b0e] border border-white/10 focus:border-[#0b3d91] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-[#0b3d91] hover:bg-[#2b58b8] disabled:opacity-50 font-medium"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {results.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">
              No results yet. Try searching for something!
            </div>
          )}

          {results.map((email) => (
            <div
              key={email.messageId}
              onClick={() => router.push(`/emails/${email.messageId}`)}
              className="p-4 rounded-lg bg-[#0b0b0e] border border-white/10 hover:border-[#0b3d91] cursor-pointer transition"
            >
              <div className="font-medium mb-1">{email.subject}</div>
              <div className="text-sm text-gray-400">{email.from}</div>
              {email.matchReason && (
                <div className="mt-2 text-xs text-[#2b58b8]">Match: {email.matchReason}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
