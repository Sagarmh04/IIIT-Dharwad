"use client";

interface SidebarProps {
  onSync: () => void;
  syncing: boolean;
  filters: {
    sentiment?: string;
    urgency?: string;
    category?: string;
  };
  onFilterChange: (filters: {
    sentiment?: string;
    urgency?: string;
    category?: string;
  }) => void;
}

export default function Sidebar({ onSync, syncing, filters, onFilterChange }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col h-screen">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">InsightMail</h2>
        
        <button
          onClick={onSync}
          disabled={syncing}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {syncing ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Syncing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync Gmail Now
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Sentiment</h3>
          <div className="space-y-2">
            {["all", "positive", "negative", "neutral"].map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="sentiment"
                  checked={filters.sentiment === s || (!filters.sentiment && s === "all")}
                  onChange={() => onFilterChange({ ...filters, sentiment: s === "all" ? undefined : s })}
                  className="cursor-pointer"
                />
                <span className="capitalize">{s}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Urgency</h3>
          <div className="space-y-2">
            {["all", "high", "medium", "low"].map((u) => (
              <label key={u} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="urgency"
                  checked={filters.urgency === u || (!filters.urgency && u === "all")}
                  onChange={() => onFilterChange({ ...filters, urgency: u === "all" ? undefined : u })}
                  className="cursor-pointer"
                />
                <span className="capitalize">{u}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Category</h3>
          <div className="space-y-2">
            {["all", "work", "personal", "finance", "support"].map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === c || (!filters.category && c === "all")}
                  onChange={() => onFilterChange({ ...filters, category: c === "all" ? undefined : c })}
                  className="cursor-pointer"
                />
                <span className="capitalize">{c}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <button
          onClick={async () => {
            await fetch("/api/auth/logout");
            window.location.href = "/login";
          }}
          className="w-full px-3 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
