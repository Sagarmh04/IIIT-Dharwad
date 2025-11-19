import React, { useState } from "react";

type SmartReplyBoxProps = {
  onSendReply: (reply: string, tone?: string) => void;
  suggestions?: string[];
};

export default function SmartReplyBox({ onSendReply, suggestions = [] }: SmartReplyBoxProps) {
  const [reply, setReply] = useState("");
  const [selectedTone, setSelectedTone] = useState<string>("professional");
  const [correcting, setCorrecting] = useState(false);

  const tones = ["professional", "friendly", "formal", "casual"];

  async function handleToneCorrection() {
    if (!reply.trim()) return;
    
    setCorrecting(true);
    try {
      const res = await fetch("/api/tone-correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply, tone: selectedTone }),
      });

      if (res.ok) {
        const data = await res.json();
        setReply(data.correctedText || reply);
      }
    } catch (err) {
      console.error("Tone correction failed:", err);
    } finally {
      setCorrecting(false);
    }
  }

  return (
    <div className="p-4 rounded-lg bg-[#0b0b0e] border border-white/10">
      <div className="text-sm font-semibold mb-3 text-gray-300">Smart Reply</div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-2">Suggested Replies</div>
          <div className="space-y-2">
            {suggestions.map((sugg, idx) => (
              <button
                key={idx}
                onClick={() => setReply(sugg)}
                className="w-full text-left p-2 rounded text-sm bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
              >
                {sugg}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tone Selector */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-2">Tone</div>
        <div className="flex gap-2">
          {tones.map((tone) => (
            <button
              key={tone}
              onClick={() => setSelectedTone(tone)}
              className={`px-3 py-1 rounded text-xs capitalize transition ${
                selectedTone === tone
                  ? "bg-[#0b3d91] text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* Reply Text Area */}
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Type your reply here..."
        rows={6}
        className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 placeholder-gray-500 focus:border-[#0b3d91] focus:outline-none resize-none"
      />

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => onSendReply(reply, selectedTone)}
          disabled={!reply.trim()}
          className="px-4 py-2 rounded-lg bg-[#0b3d91] hover:bg-[#2b58b8] disabled:opacity-50 text-sm font-medium"
        >
          Send Reply
        </button>
        <button
          onClick={handleToneCorrection}
          disabled={!reply.trim() || correcting}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 text-sm font-medium"
        >
          {correcting ? "Correcting..." : "Correct Tone"}
        </button>
      </div>
    </div>
  );
}
