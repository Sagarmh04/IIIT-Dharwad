import React from "react";

type StatsCardProps = {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "yellow" | "purple";
  subtitle?: string;
};

export default function StatsCard({ title, value, icon, color = "blue", subtitle }: StatsCardProps) {
  const colorClasses = {
    blue: "border-[#0b3d91] bg-[#0b3d91]/10",
    green: "border-green-600 bg-green-600/10",
    red: "border-red-600 bg-red-600/10",
    yellow: "border-yellow-600 bg-yellow-600/10",
    purple: "border-purple-600 bg-purple-600/10",
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-400 mb-1">{title}</div>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}
