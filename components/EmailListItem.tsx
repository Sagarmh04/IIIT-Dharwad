"use client";

import { EmailMessage } from "@/lib/types";

interface EmailListItemProps {
  email: EmailMessage;
  selected: boolean;
  onClick: () => void;
}

export default function EmailListItem({ email, selected, onClick }: EmailListItemProps) {
  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "positive": return "bg-green-100 text-green-800";
      case "negative": return "bg-red-100 text-red-800";
      case "neutral": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition ${
        selected ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{email.subject || "(No Subject)"}</p>
          <p className="text-xs text-gray-600 truncate">{email.from}</p>
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
          {new Date(email.date).toLocaleDateString()}
        </span>
      </div>

      {email.quickAnalysis && (
        <div className="flex flex-wrap gap-1 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded ${getSentimentColor(email.quickAnalysis.sentiment)}`}>
            {email.quickAnalysis.sentiment}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded ${getUrgencyColor(email.quickAnalysis.urgency)}`}>
            {email.quickAnalysis.urgency}
          </span>
          {email.quickAnalysis.category && (
            <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800">
              {email.quickAnalysis.category}
            </span>
          )}
        </div>
      )}

      {!email.quickAnalysis && (
        <div className="mt-2">
          <span className="text-xs text-gray-400 italic">Analyzing...</span>
        </div>
      )}
    </div>
  );
}
