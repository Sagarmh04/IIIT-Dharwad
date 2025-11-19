"use client";

import { EmailMessage } from "@/lib/types";
import { useState } from "react";

interface EmailDetailPanelProps {
  email: EmailMessage | null;
}

export default function EmailDetailPanel({ email }: EmailDetailPanelProps) {
  const [showSmartReply, setShowSmartReply] = useState(false);

  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select an email to view details</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{email.subject || "(No Subject)"}</h1>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-semibold">From:</span> {email.from}</p>
            <p><span className="font-semibold">To:</span> {email.to}</p>
            <p><span className="font-semibold">Date:</span> {new Date(email.date).toLocaleString()}</p>
          </div>
        </div>

        {/* Quick Analysis */}
        {email.quickAnalysis && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Quick Analysis</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-semibold">Sentiment:</span> <span className="capitalize">{email.quickAnalysis.sentiment}</span>
              </div>
              <div>
                <span className="font-semibold">Emotion:</span> <span className="capitalize">{email.quickAnalysis.emotion}</span>
              </div>
              <div>
                <span className="font-semibold">Tone:</span> <span className="capitalize">{email.quickAnalysis.tone}</span>
              </div>
              <div>
                <span className="font-semibold">Intent:</span> <span className="capitalize">{email.quickAnalysis.intent}</span>
              </div>
              <div>
                <span className="font-semibold">Urgency:</span> <span className="capitalize">{email.quickAnalysis.urgency}</span>
              </div>
              <div>
                <span className="font-semibold">Category:</span> <span className="capitalize">{email.quickAnalysis.category}</span>
              </div>
            </div>
            {email.quickAnalysis.quickSummary && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-sm"><span className="font-semibold">Summary:</span> {email.quickAnalysis.quickSummary}</p>
              </div>
            )}
            {email.quickAnalysis.keywords && email.quickAnalysis.keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {email.quickAnalysis.keywords.map((kw, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deep Analysis */}
        {email.deepAnalysis && (
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Deep Analysis</h2>
            
            {email.deepAnalysis.detailedSummary && (
              <div className="mb-3">
                <p className="text-sm"><span className="font-semibold">Detailed Summary:</span> {email.deepAnalysis.detailedSummary}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div className={email.deepAnalysis.complianceRisk ? "text-red-700" : ""}>
                <span className="font-semibold">Compliance Risk:</span> {email.deepAnalysis.complianceRisk ? "Yes" : "No"}
              </div>
              <div className={email.deepAnalysis.piiDetected ? "text-red-700" : ""}>
                <span className="font-semibold">PII Detected:</span> {email.deepAnalysis.piiDetected ? "Yes" : "No"}
              </div>
            </div>

            {email.deepAnalysis.complianceIssues && email.deepAnalysis.complianceIssues.length > 0 && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-xs font-semibold text-red-800 mb-1">Compliance Issues:</p>
                <ul className="text-xs text-red-700 list-disc list-inside">
                  {email.deepAnalysis.complianceIssues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {email.deepAnalysis.piiEntities && email.deepAnalysis.piiEntities.length > 0 && (
              <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs font-semibold text-yellow-800 mb-1">PII Detected:</p>
                <div className="flex flex-wrap gap-1">
                  {email.deepAnalysis.piiEntities.map((pii, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded">
                      {pii}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {email.deepAnalysis.smartReply && email.deepAnalysis.smartReply.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setShowSmartReply(!showSmartReply)}
                  className="text-sm font-semibold text-purple-700 hover:text-purple-900"
                >
                  {showSmartReply ? "Hide" : "Show"} Smart Replies
                </button>
                {showSmartReply && (
                  <div className="mt-2 space-y-2">
                    {email.deepAnalysis.smartReply.map((reply, i) => (
                      <div key={i} className="p-2 bg-white border border-purple-200 rounded text-sm">
                        {reply}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Semantic Context */}
        {email.semanticContext && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Semantic Context</h2>
            
            {email.semanticContext.entities && email.semanticContext.entities.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">Entities:</p>
                <div className="flex flex-wrap gap-1">
                  {email.semanticContext.entities.map((e, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded">{e}</span>
                  ))}
                </div>
              </div>
            )}

            {email.semanticContext.roles && email.semanticContext.roles.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">Roles:</p>
                <div className="flex flex-wrap gap-1">
                  {email.semanticContext.roles.map((r, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded">{r}</span>
                  ))}
                </div>
              </div>
            )}

            {email.semanticContext.companies && email.semanticContext.companies.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">Companies:</p>
                <div className="flex flex-wrap gap-1">
                  {email.semanticContext.companies.map((c, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-orange-200 text-orange-800 rounded">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {email.semanticContext.topics && email.semanticContext.topics.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">Topics:</p>
                <div className="flex flex-wrap gap-1">
                  {email.semanticContext.topics.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-purple-200 text-purple-800 rounded">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Email Body */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Email Body</h2>
          <div className="p-4 bg-gray-50 rounded border border-gray-200 text-sm whitespace-pre-wrap">
            {email.body || "(No content)"}
          </div>
        </div>
      </div>
    </div>
  );
}
