"use client";

import React from "react";
import { MonitoringData, FreshBox, SpoilageRisk } from "@/lib/types";
import { RISK_COLORS } from "@/lib/utils";
import {
  Thermometer,
  Droplets,
  Battery,
  DoorOpen,
  DoorClosed,
  MapPin,
  Wind,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface MonitoringCardProps {
  data: MonitoringData;
  box: FreshBox;
  productName?: string;
}

/** SVG arc gauge — the signature visual element of FreshBox AI */
function TempRing({
  temp,
  minTemp,
  maxTemp,
}: {
  temp: number;
  minTemp: number;
  maxTemp: number;
}) {
  const R = 36;
  const cx = 44;
  const cy = 44;
  const circumference = 2 * Math.PI * R;
  const arcLength = circumference * 0.75; // 270° arc

  // Normalize temp position within range (with padding)
  const rangeMin = minTemp - 2;
  const rangeMax = maxTemp + 2;
  const ratio = Math.max(0, Math.min(1, (temp - rangeMin) / (rangeMax - rangeMin)));
  const dashOffset = arcLength * (1 - ratio);

  const inRange = temp >= minTemp && temp <= maxTemp;
  const color = inRange
    ? "#10B981"
    : temp < minTemp
    ? "#0EA5E9"
    : "#EF4444";

  return (
    <div className="relative flex items-center justify-center">
      <svg width={88} height={88} viewBox="0 0 88 88">
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={7}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
        />
        {/* Value arc */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeDasharray={`${arcLength - dashOffset} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.6s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-sm font-extrabold text-navy-800 leading-none">
          {temp.toFixed(1)}°C
        </span>
        <span className="text-[9px] text-slate-400 font-medium">temp</span>
      </div>
    </div>
  );
}

const RISK_DOT = {
  Low:    "bg-emerald-500",
  Medium: "bg-amber-500",
  High:   "bg-red-500",
};

export default function MonitoringCard({ data, box, productName }: MonitoringCardProps) {
  const riskColor = RISK_COLORS[data.spoilageRisk];
  const hasAlerts = data.alerts.length > 0;

  return (
    <div
      className={`card p-5 card-hover flex flex-col gap-4 ${
        hasAlerts ? "border-amber-300" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy-800">{box.id}</span>
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${
                box.status === "Rented" ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
          </div>
          {productName && (
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-40">{productName}</p>
          )}
        </div>
        <span className={`badge ${riskColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${RISK_DOT[data.spoilageRisk]}`} />
          {data.spoilageRisk} Risk
        </span>
      </div>

      {/* Temperature ring + humidity/battery */}
      <div className="flex items-center gap-4">
        <TempRing temp={data.temperature} minTemp={box.minTemp} maxTemp={box.maxTemp} />

        <div className="flex-1 space-y-2">
          <MetricRow icon={Droplets} label="Humidity" value={`${data.humidity.toFixed(0)}% RH`} />
          <MetricRow icon={Battery} label="Battery" value={`${data.batteryLevel.toFixed(0)}%`} />
          <MetricRow
            icon={data.doorOpen ? DoorOpen : DoorClosed}
            label="Door"
            value={data.doorOpen ? "Open" : "Closed"}
            valueColor={data.doorOpen ? "text-amber-600" : "text-emerald-600"}
          />
          <MetricRow
            icon={Wind}
            label="Cooling"
            value={data.coolingActive ? "Active" : "Off"}
            valueColor={data.coolingActive ? "text-sky-600" : "text-slate-400"}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <MapPin size={11} className="text-slate-400" />
          <span className="text-[10px] text-slate-500">{box.location}</span>
        </div>
        <div className="flex items-center gap-1">
          {data.remainingSafeHours > 0 ? (
            <span className="text-[10px] font-semibold text-slate-600">
              {data.remainingSafeHours}h safe
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-red-600">Time exceeded</span>
          )}
        </div>
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2">
          <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            {data.alerts.slice(0, 2).map((a) => (
              <p key={a.id} className="text-[10px] text-amber-800 font-medium leading-tight">
                {a.message}
              </p>
            ))}
            {data.alerts.length > 2 && (
              <p className="text-[10px] text-amber-600 mt-0.5">
                +{data.alerts.length - 2} more alerts
              </p>
            )}
          </div>
        </div>
      )}

      {!hasAlerts && (
        <div className="flex items-center gap-1.5 text-emerald-600">
          <CheckCircle2 size={13} />
          <span className="text-xs font-medium">All systems normal</span>
        </div>
      )}
    </div>
  );
}

function MetricRow({
  icon: Icon,
  label,
  value,
  valueColor = "text-navy-700",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon size={11} className="text-slate-400" />
        <span className="text-[11px] text-slate-500">{label}</span>
      </div>
      <span className={`text-[11px] font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}
