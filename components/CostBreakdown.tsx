"use client";

import { CostBreakdownResult } from "@/lib/calculations";
import { formatIDR } from "@/lib/utils";
import { Receipt, Package, Zap, Truck, Sparkles, Clock } from "lucide-react";

interface CostBreakdownProps {
  breakdown: CostBreakdownResult;
  onGenerateInvoice?: () => void;
}

export default function CostBreakdown({ breakdown, onGenerateInvoice }: CostBreakdownProps) {
  const items = [
    {
      icon: Package,
      label: "Box Rental Cost",
      value: breakdown.boxRentalCost,
      color: "text-navy-600",
    },
    {
      icon: Zap,
      label: "Energy Cost",
      value: breakdown.energyCost,
      color: "text-amber-600",
    },
    {
      icon: Truck,
      label: "Pickup / Delivery",
      value: breakdown.pickupDeliveryCost,
      color: "text-sky-600",
    },
    {
      icon: Sparkles,
      label: "Cleaning Fee",
      value: breakdown.cleaningCost,
      color: "text-purple-600",
    },
    {
      icon: Clock,
      label: "Late Return Fee",
      value: breakdown.lateReturnFee,
      color: "text-red-600",
    },
  ];

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Receipt size={18} className="text-navy-600" />
        <h3 className="section-title">Cost Breakdown</h3>
      </div>

      <div className="space-y-2">
        {items.map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
          >
            <div className="flex items-center gap-2.5">
              <Icon size={14} className={color} />
              <span className="text-sm text-slate-600">{label}</span>
            </div>
            <span
              className={`text-sm font-semibold ${
                value === 0 ? "text-slate-300" : "text-slate-800"
              }`}
            >
              {value === 0 ? "—" : formatIDR(value)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-navy-600 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-navy-200 uppercase tracking-wider">
            Total Estimate
          </p>
          <p className="text-2xl font-extrabold text-white mt-0.5">
            {formatIDR(breakdown.totalCost)}
          </p>
        </div>
        {onGenerateInvoice && (
          <button
            onClick={onGenerateInvoice}
            className="bg-white text-navy-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-navy-50 transition-colors"
          >
            Preview Invoice
          </button>
        )}
      </div>
    </div>
  );
}
