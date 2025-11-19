import React from "react";

type EmailDetailPanelProps = {
  email: {
    messageId: string;
    subject: string;
    from?: string;
    to?: string;
    date?: number;
    body?: string;
    quickAnalysis?: any;
    deepAnalysis?: any;
  } | null;
  onClose?: () => void;
};

export default function EmailDetailPanel({ email, onClose }: EmailDetailPanelProps) {
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
            <h2 className="text-2xl font-bold">{subject}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          <div className="text-sm text-gray-400 space-y-1">
            <div>From: {from}</div>
            <div>To: {to}</div>
            <div>Date: {date ? new Date(date).toLocaleString() : "—"}</div>
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
      </div>
    </div>
  );
}
