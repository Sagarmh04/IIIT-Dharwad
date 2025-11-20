import React, { useState } from "react";
import { Mail, Sparkles, Filter, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

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
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState({
    sentiment: false,
    urgency: false,
    category: false,
    alerts: false,
  });

  const sentiments = [
    { value: "positive", label: "Positive", color: "text-green-400", bgColor: "bg-green-500/10" },
    { value: "neutral", label: "Neutral", color: "text-blue-400", bgColor: "bg-blue-500/10" },
    { value: "negative", label: "Negative", color: "text-red-400", bgColor: "bg-red-500/10" },
  ];
  
  const urgencies = [
    { value: "low", label: "Low", color: "text-gray-400", icon: "○" },
    { value: "medium", label: "Medium", color: "text-yellow-400", icon: "◐" },
    { value: "high", label: "High", color: "text-red-400", icon: "●" },
  ];
  
  const categories = [
    { value: "work", label: "Work", icon: "💼" },
    { value: "personal", label: "Personal", icon: "👤" },
    { value: "finance", label: "Finance", icon: "💰" },
    { value: "legal", label: "Legal", icon: "⚖️" },
    { value: "support", label: "Support", icon: "🛟" },
    { value: "marketing", label: "Marketing", icon: "📢" },
  ];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const activeFilterCount = 
    (filters.sentiment?.length || 0) + 
    (filters.urgency?.length || 0) + 
    (filters.category?.length || 0) + 
    (filters.hasCompliance ? 1 : 0) + 
    (filters.hasPII ? 1 : 0);

  return (
    <div className="w-72 bg-linear-to-b from-[#0b0b0e] via-[#0d0d11] to-[#0b0b0e] border-r border-white/10 p-5 h-screen overflow-hidden flex flex-col">
      {/* Brand Header Section */}
      <div className="mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-linear-to-br from-blue-500/20 to-purple-500/20 p-1.5 ring-2 ring-blue-500/20">
            <Image 
              src="/logo.png" 
              alt="Insight Mail Logo" 
              width={40} 
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Insight Mail</h2>
            <p className="text-xs text-gray-500">AI-Powered Analytics</p>
          </div>
        </div>
        
        <button
          onClick={onSyncClick}
          disabled={syncing}
          className={`
            group w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 
            relative overflow-hidden
            ${syncing
              ? "bg-linear-to-r from-blue-600/40 to-purple-600/40 cursor-wait"
              : "bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
            }
          `}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {syncing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Sync Gmail Now
              </>
            )}
          </span>
          {!syncing && (
            <div className="absolute inset-0 bg-linear-to-r from-blue-400/0 via-white/20 to-blue-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          )}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">

      {/* Active Filters Badge */}
      {activeFilterCount > 0 && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-300 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {activeFilterCount} Filter{activeFilterCount > 1 ? 's' : ''} Active
            </span>
            <button
              onClick={() => onFilterChange({})}
              className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Sentiment Filter */}
      <div className="mb-5">
        <button
          onClick={() => toggleSection('sentiment')}
          className="w-full flex items-center justify-between text-sm font-semibold text-gray-300 mb-3 hover:text-white transition-colors group"
        >
          <span className="flex items-center gap-2">
            <div className="w-1 h-4 bg-linear-to-b from-green-400 to-red-400 rounded-full" />
            Sentiment
          </span>
          {expandedSections.sentiment ? 
            <ChevronUp className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" /> : 
            <ChevronDown className="w-4 h-4 group-hover:translate-y-[2px] transition-transform" />
          }
        </button>
        {expandedSections.sentiment && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            {sentiments.map((s) => (
              <label 
                key={s.value} 
                className={`
                  flex items-center gap-3 p-2.5 rounded-lg text-sm cursor-pointer
                  transition-all duration-200 group
                  hover:bg-white/5 hover:translate-x-1
                  ${filters.sentiment?.includes(s.value) ? s.bgColor + ' border border-white/10' : 'border border-transparent'}
                `}
              >
                <Checkbox
                  checked={filters.sentiment?.includes(s.value)}
                  onCheckedChange={(checked) => {
                    const newSentiments = checked
                      ? [...(filters.sentiment || []), s.value]
                      : (filters.sentiment || []).filter((x) => x !== s.value);
                    onFilterChange({ ...filters, sentiment: newSentiments });
                  }}
                />
                <span className={`flex-1 ${filters.sentiment?.includes(s.value) ? s.color + ' font-medium' : 'text-gray-400'}`}>
                  {s.label}
                </span>
                {filters.sentiment?.includes(s.value) && (
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">✓</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Urgency Filter */}
      <div className="mb-5">
        <button
          onClick={() => toggleSection('urgency')}
          className="w-full flex items-center justify-between text-sm font-semibold text-gray-300 mb-3 hover:text-white transition-colors group"
        >
          <span className="flex items-center gap-2">
            <div className="w-1 h-4 bg-linear-to-b from-gray-400 to-red-400 rounded-full" />
            Urgency
          </span>
          {expandedSections.urgency ? 
            <ChevronUp className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" /> : 
            <ChevronDown className="w-4 h-4 group-hover:translate-y-[2px] transition-transform" />
          }
        </button>
        {expandedSections.urgency && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            {urgencies.map((u) => (
              <label 
                key={u.value} 
                className={`
                  flex items-center gap-3 p-2.5 rounded-lg text-sm cursor-pointer
                  transition-all duration-200 group
                  hover:bg-white/5 hover:translate-x-1
                  ${filters.urgency?.includes(u.value) ? 'bg-white/5 border border-white/10' : 'border border-transparent'}
                `}
              >
                <Checkbox
                  checked={filters.urgency?.includes(u.value)}
                  onCheckedChange={(checked) => {
                    const newUrgency = checked
                      ? [...(filters.urgency || []), u.value]
                      : (filters.urgency || []).filter((x) => x !== u.value);
                    onFilterChange({ ...filters, urgency: newUrgency });
                  }}
                />
                <span className={`text-lg ${u.color}`}>{u.icon}</span>
                <span className={`flex-1 ${filters.urgency?.includes(u.value) ? u.color + ' font-medium' : 'text-gray-400'}`}>
                  {u.label}
                </span>
                {filters.urgency?.includes(u.value) && (
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">✓</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-5">
        <button
          onClick={() => toggleSection('category')}
          className="w-full flex items-center justify-between text-sm font-semibold text-gray-300 mb-3 hover:text-white transition-colors group"
        >
          <span className="flex items-center gap-2">
            <div className="w-1 h-4 bg-linear-to-b from-blue-400 to-purple-400 rounded-full" />
            Category
          </span>
          {expandedSections.category ? 
            <ChevronUp className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" /> : 
            <ChevronDown className="w-4 h-4 group-hover:translate-y-[2px] transition-transform" />
          }
        </button>
        {expandedSections.category && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            {categories.map((c) => (
              <label 
                key={c.value} 
                className={`
                  flex items-center gap-3 p-2.5 rounded-lg text-sm cursor-pointer
                  transition-all duration-200 group
                  hover:bg-white/5 hover:translate-x-1
                  ${filters.category?.includes(c.value) ? 'bg-white/5 border border-white/10' : 'border border-transparent'}
                `}
              >
                <Checkbox
                  checked={filters.category?.includes(c.value)}
                  onCheckedChange={(checked) => {
                    const newCategory = checked
                      ? [...(filters.category || []), c.value]
                      : (filters.category || []).filter((x) => x !== c.value);
                    onFilterChange({ ...filters, category: newCategory });
                  }}
                />
                <span className="text-base">{c.icon}</span>
                <span className={`flex-1 ${filters.category?.includes(c.value) ? 'text-white font-medium' : 'text-gray-400'}`}>
                  {c.label}
                </span>
                {filters.category?.includes(c.value) && (
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">✓</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Alert Filters */}
      <div className="mb-5">
        <button
          onClick={() => toggleSection('alerts')}
          className="w-full flex items-center justify-between text-sm font-semibold text-gray-300 mb-3 hover:text-white transition-colors group"
        >
          <span className="flex items-center gap-2">
            <div className="w-1 h-4 bg-linear-to-b from-yellow-400 to-red-400 rounded-full" />
            Alerts & Risks
          </span>
          {expandedSections.alerts ? 
            <ChevronUp className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" /> : 
            <ChevronDown className="w-4 h-4 group-hover:translate-y-[2px] transition-transform" />
          }
        </button>
        {expandedSections.alerts && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            <label 
              className={`
                flex items-center gap-3 p-2.5 rounded-lg text-sm cursor-pointer
                transition-all duration-200 group
                hover:bg-yellow-500/10 hover:translate-x-1
                ${filters.hasCompliance ? 'bg-yellow-500/10 border border-yellow-500/20' : 'border border-transparent'}
              `}
            >
              <Checkbox
                checked={filters.hasCompliance}
                onCheckedChange={(checked) => onFilterChange({ ...filters, hasCompliance: !!checked })}
              />
              <span className="text-base">⚠️</span>
              <span className={`flex-1 ${filters.hasCompliance ? 'text-yellow-300 font-medium' : 'text-gray-400'}`}>
                Compliance Risk
              </span>
              {filters.hasCompliance && (
                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">✓</span>
              )}
            </label>
            <label 
              className={`
                flex items-center gap-3 p-2.5 rounded-lg text-sm cursor-pointer
                transition-all duration-200 group
                hover:bg-purple-500/10 hover:translate-x-1
                ${filters.hasPII ? 'bg-purple-500/10 border border-purple-500/20' : 'border border-transparent'}
              `}
            >
              <Checkbox
                checked={filters.hasPII}
                onCheckedChange={(checked) => onFilterChange({ ...filters, hasPII: !!checked })}
              />
              <span className="text-base">🔒</span>
              <span className={`flex-1 ${filters.hasPII ? 'text-purple-300 font-medium' : 'text-gray-400'}`}>
                Contains PII
              </span>
              {filters.hasPII && (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">✓</span>
              )}
            </label>
          </div>
        )}
      </div>
      </div>

      {/* Footer with Logout */}
      <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
        <button
          onClick={async () => {
            try {
              // Sign out from Firebase
              await signOut(auth);
              
              // Call logout API to clear cookies
              await fetch('/api/auth/logout', { method: 'GET' });
              
              // Clear local storage
              localStorage.clear();
              sessionStorage.clear();
              
              // Redirect to login
              router.push('/login');
            } catch (error) {
              console.error('Logout failed:', error);
              // Fallback: still redirect to login
              router.push('/login');
            }
          }}
          className="
            group w-full py-2.5 px-4 rounded-xl font-medium transition-all duration-300
            bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/40
            text-red-400 hover:text-red-300
            flex items-center justify-center gap-2
          "
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Logout
        </button>
        
        <div className="text-xs text-gray-500 text-center">
          <p className="mb-1">Powered by AI Analytics</p>
          <div className="flex items-center justify-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span>System Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
