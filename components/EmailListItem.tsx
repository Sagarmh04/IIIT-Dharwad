import React from "react";
import { formatDistanceToNow } from "date-fns";

type EmailListItemProps = {
  email: {
    messageId: string;
    subject: string;
    from?: string;
    date?: number;
    quickAnalysis?: {
      sentiment?: string;
      urgency?: string;
      intent?: string;
      keywords?: string[];
      category?: string;
    };
  };
  onOpen: () => void;
  selected?: boolean;
};

export default function EmailListItem({ email, onOpen, selected }: EmailListItemProps) {
  const { subject, from, date, quickAnalysis } = email;
  const timeLabel = date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : "";

  const sentimentColor =
    quickAnalysis?.sentiment === "positive"
      ? "bg-green-600"
      : quickAnalysis?.sentiment === "negative"
      ? "bg-red-600"
      : "bg-gray-600";

  const urgencyColor =
    quickAnalysis?.urgency === "high"
      ? "bg-red-700"
      : quickAnalysis?.urgency === "medium"
      ? "bg-yellow-600"
      : "bg-gray-600";

  return (
    <div
      onClick={onOpen}
      role="button"
      className={`cursor-pointer p-4 rounded-lg border transition ${
        selected
          ? "bg-[#0b3d91]/20 border-[#0b3d91]"
          : "bg-[#0b0b0e] border-white/10 hover:border-[#2b58b8]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-md flex items-center justify-center bg-gradient-to-br from-[#0b3d91] to-[#2b58b8] text-white font-semibold">
              {from ? String(from).slice(0, 1).toUpperCase() : "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-white truncate">{subject}</div>
              <div className="text-xs text-gray-400 truncate mt-1">
                {from ? `${from} · ` : ""}
                {timeLabel}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-2">
            {quickAnalysis?.category && (
              <span className="px-2 py-1 text-xs rounded bg-white/10 text-gray-300">
                {quickAnalysis.category}
              </span>
            )}
            {quickAnalysis?.intent && (
              <span className="px-2 py-1 text-xs rounded bg-white/10 text-gray-300">
                {quickAnalysis.intent}
              </span>
            )}
            {quickAnalysis?.keywords?.slice(0, 3).map((kw, idx) => (
              <span key={idx} className="px-2 py-1 text-xs rounded bg-[#0b3d91]/30 text-[#2b58b8]">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="ml-4 flex flex-col gap-2">
          {quickAnalysis?.sentiment && (
            <div className={`text-xs text-white px-2 py-1 rounded ${sentimentColor}`}>
              {quickAnalysis.sentiment}
            </div>
          )}
          {quickAnalysis?.urgency && (
            <div className={`text-xs text-white px-2 py-1 rounded ${urgencyColor}`}>
              {quickAnalysis.urgency}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
