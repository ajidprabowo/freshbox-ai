"use client";

import React from "react";
import { FreshBox } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/utils";
import {
  Thermometer,
  Droplets,
  Battery,
  MapPin,
  Package,
  ShieldCheck,
} from "lucide-react";

interface BoxCardProps {
  box: FreshBox;
  onBook?: (box: FreshBox) => void;
  showBookButton?: boolean;
}

const BOX_SIZE_LABELS = { S: "Small", M: "Medium", L: "Large" };
const BATTERY_COLOR = (level: number) =>
  level > 50 ? "text-emerald-600" : level > 20 ? "text-amber-600" : "text-red-600";

export default function BoxCard({ box, onBook, showBookButton }: BoxCardProps) {
  const statusStyle = STATUS_COLORS[box.status];

  return (
    <div className="card p-5 card-hover flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-navy-800 text-base">{box.id}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            FreshBox {box.type} — {BOX_SIZE_LABELS[box.type]}
          </p>
        </div>
        <span className={`badge ${statusStyle}`}>{box.status}</span>
      </div>

      {/* Sensor readings */}
      <div className="grid grid-cols-3 gap-2">
        <SensorPill
          icon={Thermometer}
          value={`${box.temperature.toFixed(1)}°C`}
          label="Temp"
          color="text-sky-600"
        />
        <SensorPill
          icon={Droplets}
          value={`${box.humidity}%`}
          label="Humidity"
          color="text-blue-600"
        />
        <SensorPill
          icon={Battery}
          value={`${box.batteryLevel}%`}
          label="Battery"
          color={BATTERY_COLOR(box.batteryLevel)}
        />
      </div>

      {/* Details */}
      <div className="space-y-2">
        <InfoRow icon={MapPin} label="Location" value={box.location} />
        <InfoRow
          icon={Thermometer}
          label="Temp Range"
          value={`${box.minTemp}°C – ${box.maxTemp}°C`}
        />
        <InfoRow
          icon={ShieldCheck}
          label="Last Sanitized"
          value={new Date(box.lastSanitized).toLocaleDateString("id-ID")}
        />
        <InfoRow
          icon={Package}
          label="Price / Day"
          value={`Rp${box.rentalPricePerDay.toLocaleString("id-ID")}`}
        />
      </div>

      {/* Battery bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            Battery
          </span>
          <span className={`text-xs font-bold ${BATTERY_COLOR(box.batteryLevel)}`}>
            {box.batteryLevel}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              box.batteryLevel > 50
                ? "bg-emerald-500"
                : box.batteryLevel > 20
                ? "bg-amber-400"
                : "bg-red-500"
            }`}
            style={{ width: `${box.batteryLevel}%` }}
          />
        </div>
      </div>

      {/* Book button */}
      {showBookButton && box.status === "Available" && onBook && (
        <button
          onClick={() => onBook(box)}
          className="btn-primary w-full text-sm mt-1"
        >
          Book This Box
        </button>
      )}

      {box.status !== "Available" && showBookButton && (
        <div className="text-center text-xs text-slate-400 py-2">
          {box.status === "Rented" ? "Currently in use" : "Under maintenance"}
        </div>
      )}
    </div>
  );
}

function SensorPill({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-2.5 flex flex-col items-center gap-1">
      <Icon size={14} className={color} />
      <p className="text-sm font-bold text-navy-800 leading-none">{value}</p>
      <p className="text-[10px] text-slate-400 font-medium">{label}</p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={13} className="text-slate-400 flex-shrink-0" />
      <span className="text-xs text-slate-500 flex-shrink-0">{label}:</span>
      <span className="text-xs font-semibold text-slate-700 truncate">{value}</span>
    </div>
  );
}
