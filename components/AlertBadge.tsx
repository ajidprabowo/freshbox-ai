"use client";

import { Alert } from "@/lib/types";
import {
  AlertTriangle,
  Thermometer,
  Droplets,
  DoorOpen,
  BatteryLow,
  TrendingUp,
} from "lucide-react";

const ALERT_CONFIG = {
  TempOutOfRange: { icon: Thermometer, color: "text-red-600 bg-red-50 border-red-200" },
  HumidityOutOfRange: { icon: Droplets, color: "text-amber-600 bg-amber-50 border-amber-200" },
  DoorOpen: { icon: DoorOpen, color: "text-orange-600 bg-orange-50 border-orange-200" },
  BatteryLow: { icon: BatteryLow, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  SpoilageRisk: { icon: TrendingUp, color: "text-red-700 bg-red-100 border-red-300" },
};

interface AlertBadgeProps {
  alert: Alert;
  compact?: boolean;
}

export default function AlertBadge({ alert, compact }: AlertBadgeProps) {
  const config = ALERT_CONFIG[alert.type] || {
    icon: AlertTriangle,
    color: "text-slate-600 bg-slate-50 border-slate-200",
  };
  const Icon = config.icon;

  if (compact) {
    return (
      <span className={`badge ${config.color} gap-1`}>
        <Icon size={10} />
        <span>{alert.type.replace(/([A-Z])/g, " $1").trim()}</span>
      </span>
    );
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${config.color}`}>
      <Icon size={15} className="flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">{alert.message}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] opacity-70">{alert.boxId}</span>
          <span className="text-[10px] opacity-70">•</span>
          <span className="text-[10px] opacity-70">
            {new Date(alert.timestamp).toLocaleTimeString("id-ID")}
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              alert.severity === "Critical"
                ? "bg-red-200 text-red-800"
                : "bg-amber-200 text-amber-800"
            }`}
          >
            {alert.severity}
          </span>
        </div>
      </div>
    </div>
  );
}
