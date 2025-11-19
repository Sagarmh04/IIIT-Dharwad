import React from "react";

type SidebarProps = {
  filters: {
    sentiment?: string[];
    urgency?: string[];
    category?: string[];
    hasCompliance?: boolean;
    hasPII?: boolean;
  };
  onFilterChange: (filters: any) => void;
  onSyncClick: () => void;
  syncing?: boolean;
};

export default function Sidebar({ filters, onFilterChange, onSyncClick, syncing }: SidebarProps) {
  const sentiments = ["positive", "neutral", "negative"];
  const urgencies = ["low", "medium", "high"];
  const categories = ["work", "personal", "finance", "legal", "support", "marketing"];

  return (
    <div className="w-64 bg-[#0b0b0e] border-r border-white/10 p-4 h-screen overflow-y-auto">
      <div className="mb-6">
        <button
          onClick={onSyncClick}
          disabled={syncing}
          className={`w-full py-2 px-4 rounded-lg font-medium transition ${
            syncing
              ? "bg-[#0b3d91]/60 cursor-wait"
              : "bg-[#0b3d91] hover:bg-[#2b58b8]"
          }`}
        >
          {syncing ? "Syncing..." : "Sync Gmail Now"}
        </button>
      </div>

      {/* Sentiment Filter */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-gray-300 mb-2">Sentiment</div>
        <div className="space-y-2">
          {sentiments.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-200">
              <input
                type="checkbox"
                checked={filters.sentiment?.includes(s)}
                onChange={(e) => {
                  const newSentiments = e.target.checked
                    ? [...(filters.sentiment || []), s]
                    : (filters.sentiment || []).filter((x) => x !== s);
                  onFilterChange({ ...filters, sentiment: newSentiments });
                }}
                className="rounded bg-white/5 border-white/10"
              />
              <span className="capitalize">{s}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Urgency Filter */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-gray-300 mb-2">Urgency</div>
        <div className="space-y-2">
          {urgencies.map((u) => (
            <label key={u} className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-200">
              <input
                type="checkbox"
                checked={filters.urgency?.includes(u)}
                onChange={(e) => {
                  const newUrgency = e.target.checked
                    ? [...(filters.urgency || []), u]
                    : (filters.urgency || []).filter((x) => x !== u);
                  onFilterChange({ ...filters, urgency: newUrgency });
                }}
                className="rounded bg-white/5 border-white/10"
              />
              <span className="capitalize">{u}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-gray-300 mb-2">Category</div>
        <div className="space-y-2">
          {categories.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-200">
              <input
                type="checkbox"
                checked={filters.category?.includes(c)}
                onChange={(e) => {
                  const newCategory = e.target.checked
                    ? [...(filters.category || []), c]
                    : (filters.category || []).filter((x) => x !== c);
                  onFilterChange({ ...filters, category: newCategory });
                }}
                className="rounded bg-white/5 border-white/10"
              />
              <span className="capitalize">{c}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Alert Filters */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-gray-300 mb-2">Alerts</div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-200">
            <input
              type="checkbox"
              checked={filters.hasCompliance}
              onChange={(e) => onFilterChange({ ...filters, hasCompliance: e.target.checked })}
              className="rounded bg-white/5 border-white/10"
            />
            <span>Compliance Risk</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-200">
            <input
              type="checkbox"
              checked={filters.hasPII}
              onChange={(e) => onFilterChange({ ...filters, hasPII: e.target.checked })}
              className="rounded bg-white/5 border-white/10"
            />
            <span>Contains PII</span>
          </label>
        </div>
      </div>
    </div>
  );
}
