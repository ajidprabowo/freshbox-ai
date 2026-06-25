"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent?: "navy" | "emerald" | "sky" | "amber" | "red";
}

const ACCENTS = {
  navy:    { bg: "bg-navy-600",   icon: "text-white", ring: "bg-navy-50" },
  emerald: { bg: "bg-emerald-500", icon: "text-white", ring: "bg-emerald-50" },
  sky:     { bg: "bg-sky-500",    icon: "text-white", ring: "bg-sky-50" },
  amber:   { bg: "bg-amber-500",  icon: "text-white", ring: "bg-amber-50" },
  red:     { bg: "bg-red-500",    icon: "text-white", ring: "bg-red-50" },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent = "navy",
}: StatCardProps) {
  const a = ACCENTS[accent];

  return (
    <div className="card p-5 card-hover flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`${a.ring} p-2.5 rounded-xl`}>
          <div className={`w-8 h-8 ${a.bg} rounded-lg flex items-center justify-center`}>
            <Icon size={16} className={a.icon} />
          </div>
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.positive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-navy-800 tracking-tight leading-none">
          {value}
        </p>
        <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
