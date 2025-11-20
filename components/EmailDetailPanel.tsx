import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, MessageSquare, Reply } from "lucide-react";
import SmartReplyBox from "./SmartReplyBox";

type Attachment = {
  filename: string;
  mimeType: string;
  data: string;
  size: number;
};

type EmailDetailPanelProps = {
  email: {
    messageId: string;
    threadId?: string;
    subject: string;
    from?: string;
    to?: string;
    date?: number;
    body?: string;
    quickAnalysis?: any;
    deepAnalysis?: any;
  } | null;
  onClose?: () => void;
  showReplyBox?: boolean;
  threadMessageCount?: number;
};

export default function EmailDetailPanel({ email, onClose, showReplyBox = false, threadMessageCount }: EmailDetailPanelProps) {
  const router = useRouter();
  const [isReplying, setIsReplying] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSendReply(subject: string, body: string, tone?: string, attachments?: Attachment[]) {
    if (!email) return;

    setSending(true);
    try {
      // Extract sender email from the "from" field
      const fromEmail = email.from?.match(/<(.+)>/)?.[1] || email.from;
      
      const response = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: fromEmail,
          subject: subject || (email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`),
          message: body,
          threadId: email.threadId,
          messageId: email.messageId,
          attachments: attachments || [],
        }),
      });

      if (response.ok) {
        alert("Reply sent successfully!");
        setIsReplying(false);
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

  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Select an email to view details
      </div>
    );
  }

  const { subject, from, to, date, body, quickAnalysis, deepAnalysis } = email;

  return (
    <div className="flex-1 bg-[#0b0b0e] border-l border-white/10 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold flex-1">{subject}</h2>
            <div className="flex items-center gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all"
                  title="Close"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-400 space-y-1">
            <div>From: {from}</div>
            <div>To: {to}</div>
            <div>Date: {date ? new Date(date).toLocaleString() : "—"}</div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2 flex-wrap">
            
            <button
              onClick={() => router.push(`/emails/${email.messageId}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 hover:text-blue-300 transition-all text-sm"
            >
              <Maximize2 className="w-4 h-4" />
              Open Full Screen
            </button>
            
            {email.threadId && threadMessageCount && threadMessageCount > 1 && (
              <button
                onClick={() => router.push(`/thread/${email.threadId}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 hover:border-purple-500/40 text-purple-400 hover:text-purple-300 transition-all text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Open Thread ({threadMessageCount} messages)
              </button>
            )}
          </div>
        </div>

        {/* Quick Analysis */}
        {quickAnalysis && (
          <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm font-semibold mb-3 text-gray-300">Quick Analysis</div>
            <div className="grid grid-cols-2 gap-3">
              {quickAnalysis.sentiment && (
                <div>
                  <div className="text-xs text-gray-500">Sentiment</div>
                  <div className="text-sm capitalize">{quickAnalysis.sentiment}</div>
                </div>
              )}
              {quickAnalysis.urgency && (
                <div>
                  <div className="text-xs text-gray-500">Urgency</div>
                  <div className="text-sm capitalize">{quickAnalysis.urgency}</div>
                </div>
              )}
              {quickAnalysis.intent && (
                <div>
                  <div className="text-xs text-gray-500">Intent</div>
                  <div className="text-sm">{quickAnalysis.intent}</div>
                </div>
              )}
              {quickAnalysis.category && (
                <div>
                  <div className="text-xs text-gray-500">Category</div>
                  <div className="text-sm capitalize">{quickAnalysis.category}</div>
                </div>
              )}
            </div>
            {quickAnalysis.summary && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-xs text-gray-500 mb-1">Quick Summary</div>
                <div className="text-sm text-gray-300">{quickAnalysis.summary}</div>
              </div>
            )}
          </div>
        )}

        {/* Deep Analysis */}
        {deepAnalysis && (
          <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm font-semibold mb-3 text-gray-300">Deep Analysis</div>
            
            {deepAnalysis.detailedSummary && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Detailed Summary</div>
                <div className="text-sm text-gray-300">{deepAnalysis.detailedSummary}</div>
              </div>
            )}

            {deepAnalysis.complianceRisk && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Compliance Risk</div>
                <div className={`text-sm ${
                  deepAnalysis.complianceRisk.level === "high" ? "text-red-400" :
                  deepAnalysis.complianceRisk.level === "medium" ? "text-yellow-400" : "text-green-400"
                }`}>
                  {deepAnalysis.complianceRisk.level} - {deepAnalysis.complianceRisk.reason}
                </div>
              </div>
            )}

            {deepAnalysis.piiDetected && deepAnalysis.piiDetected.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">PII Detected</div>
                <div className="flex flex-wrap gap-2">
                  {deepAnalysis.piiDetected.map((pii: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 text-xs rounded bg-red-600/20 text-red-400 border border-red-600/30">
                      {pii}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {deepAnalysis.emotion && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Emotion</div>
                <div className="text-sm">{deepAnalysis.emotion}</div>
              </div>
            )}

            {deepAnalysis.tone && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Tone</div>
                <div className="text-sm">{deepAnalysis.tone}</div>
              </div>
            )}
          </div>
        )}

        {/* Email Body */}
        <div className="mb-6">
          <div className="text-sm font-semibold mb-3 text-gray-300">Message</div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 whitespace-pre-wrap">
            {body || "No content available"}
          </div>
        </div>

        {/* Reply Box */}
        {(isReplying || showReplyBox) && (
          <div className="mb-6">
            {sending && (
              <div className="mb-3 p-3 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm">
                Sending reply...
              </div>
            )}
            <SmartReplyBox
              onSendReply={handleSendReply}
              suggestions={deepAnalysis?.smartReplies || []}
              emailContext={{
                messageId: email.messageId,
                subject: subject,
                from: from,
                body: body,
                quickAnalysis: quickAnalysis,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
