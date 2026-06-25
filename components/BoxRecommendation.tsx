"use client";

import { useState } from "react";
import {
  Sparkles,
  Package,
  Loader2,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
  Battery,
  MapPin,
  Gauge,
} from "lucide-react";
import {
  BoxRecommendationInput,
  BoxRecommendationResult,
  ProductCategory,
  UsageMode,
  ProductSensitivity,
} from "@/lib/types";
import { BOX_SPECS, BoxSpec } from "@/lib/boxRecommendation";

// ─── Types ──────────────────────────────────────────────────────────────────

interface BoxRecommendationProps {
  onApplyRecommendation: (
    result: BoxRecommendationResult,
    input: BoxRecommendationInput
  ) => void;
}

type RecommendationState = "idle" | "loading" | "result" | "error";

const CATEGORIES: ProductCategory[] = [
  "Tomatoes",
  "Leafy Vegetables",
  "Seafood",
  "Dairy",
  "Meat",
  "Tropical Fruit",
  "Frozen Food",
  "Other",
];

// ─── Box Comparison Cards ───────────────────────────────────────────────────

function BoxSpecCard({
  spec,
  isRecommended,
}: {
  spec: BoxSpec;
  isRecommended: boolean;
}) {
  return (
    <div
      className={`relative card p-4 text-center transition-all duration-200 ${
        isRecommended
          ? "ring-2 ring-navy-500 shadow-card-hover scale-[1.02]"
          : "opacity-70"
      }`}
    >
      {isRecommended && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 badge bg-navy-600 text-white border-navy-600 text-[10px] px-2 py-0.5">
          Recommended
        </span>
      )}
      <div
        className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${
          spec.type === "S"
            ? "bg-sky-50 text-sky-600"
            : spec.type === "M"
            ? "bg-emerald-50 text-emerald-600"
            : "bg-purple-50 text-purple-600"
        }`}
      >
        <Package size={20} />
      </div>
      <p className="text-sm font-extrabold text-navy-800">{spec.label}</p>
      <div className="mt-2 space-y-1 text-[11px] text-slate-500">
        <p>{spec.usableVolumeLiters} L volume</p>
        <p>{spec.payloadKg} kg payload</p>
        <p className="font-semibold text-navy-700">
          Rp{spec.rentalPricePerDay.toLocaleString("id-ID")}/day
        </p>
      </div>
      <p className="mt-2 text-[10px] text-slate-400 leading-snug">
        {spec.bestFor}
      </p>
    </div>
  );
}

// ─── Utilization Bar ────────────────────────────────────────────────────────

function UtilizationBar({ rate }: { rate: number }) {
  const clampedWidth = Math.min(rate, 120);
  const color =
    rate <= 90
      ? "bg-emerald-500"
      : rate <= 105
      ? "bg-amber-500"
      : "bg-red-500";
  const label =
    rate <= 90
      ? "Optimal"
      : rate <= 105
      ? "Near Capacity"
      : "Over Capacity";
  const labelColor =
    rate <= 90
      ? "text-emerald-700"
      : rate <= 105
      ? "text-amber-700"
      : "text-red-700";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Capacity Utilization
        </span>
        <span className={`text-xs font-bold ${labelColor}`}>
          {rate}% — {label}
        </span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(clampedWidth, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function BoxRecommendation({
  onApplyRecommendation,
}: BoxRecommendationProps) {
  const [expanded, setExpanded] = useState(true);
  const [state, setState] = useState<RecommendationState>("idle");
  const [result, setResult] = useState<
    (BoxRecommendationResult & { source?: string }) | null
  >(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<BoxRecommendationInput>({
    productCategory: "Tomatoes",
    productName: "",
    totalWeightKg: 0,
    estimatedVolumeLiters: undefined,
    storageDuration: 1,
    usageMode: "Storage",
    pickupLocation: "",
    destinationLocation: "",
    requiredDeliveryDate: today,
    productSensitivity: "Medium",
    needBatteryBackup: false,
    needGpsTracking: false,
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.productName.trim()) e.productName = "Product name required";
    if (!form.totalWeightKg || form.totalWeightKg <= 0)
      e.totalWeightKg = "Valid weight required";
    if (!form.storageDuration || form.storageDuration <= 0)
      e.storageDuration = "Valid duration required";
    if (!form.pickupLocation.trim())
      e.pickupLocation = "Pickup location required";
    if (!form.destinationLocation.trim())
      e.destinationLocation = "Destination required";
    if (!form.requiredDeliveryDate)
      e.requiredDeliveryDate = "Delivery date required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setState("loading");

    try {
      const resp = await fetch("/api/box-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!resp.ok) throw new Error("API error");
      const data = await resp.json();
      setResult(data);
      setState("result");
    } catch {
      setState("error");
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApplyRecommendation(result, form);
  };

  const parsedRate = result
    ? parseInt(result.utilizationRate.replace("%", ""), 10)
    : 0;

  const recommendedType = result?.recommendedBoxType || "";

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-extrabold text-navy-800">
              AI Box Recommendation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your product, quantity, duration, and route. FreshBox
              AI will recommend the most suitable box configuration before
              you book.
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-slate-100">
          {/* Box Comparison Cards */}
          <div className="p-5 bg-slate-50 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Available Box Types
            </p>
            <div className="grid grid-cols-3 gap-3">
              {BOX_SPECS.map((spec) => (
                <BoxSpecCard
                  key={spec.type}
                  spec={spec}
                  isRecommended={recommendedType === spec.label}
                />
              ))}
            </div>
          </div>

          {/* Content Grid: Form + Result */}
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Left: Form */}
            <div className="p-5 space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Recommendation Input
              </p>

              {/* Product category & name */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Product Category" required>
                  <select
                    className="form-input text-sm"
                    value={form.productCategory}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        productCategory: e.target.value as ProductCategory,
                      })
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Product Name"
                  error={errors.productName}
                  required
                >
                  <input
                    className="form-input text-sm"
                    placeholder="e.g. Fresh Tomatoes"
                    value={form.productName}
                    onChange={(e) =>
                      setForm({ ...form, productName: e.target.value })
                    }
                  />
                </Field>
              </div>

              {/* Weight & volume */}
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Total Weight (kg)"
                  error={errors.totalWeightKg}
                  required
                >
                  <input
                    type="number"
                    min="0"
                    className="form-input text-sm"
                    placeholder="e.g. 180"
                    value={form.totalWeightKg || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        totalWeightKg: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Est. Volume (L)" helper="Optional — auto-estimated if blank">
                  <input
                    type="number"
                    min="0"
                    className="form-input text-sm"
                    placeholder="Auto-estimated"
                    value={form.estimatedVolumeLiters ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        estimatedVolumeLiters: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </Field>
              </div>

              {/* Duration & delivery */}
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Storage Duration (days)"
                  error={errors.storageDuration}
                  required
                >
                  <input
                    type="number"
                    min="1"
                    className="form-input text-sm"
                    placeholder="e.g. 2"
                    value={form.storageDuration || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        storageDuration: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field
                  label="Required Delivery Date"
                  error={errors.requiredDeliveryDate}
                  required
                >
                  <input
                    type="date"
                    className="form-input text-sm"
                    value={form.requiredDeliveryDate}
                    min={today}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        requiredDeliveryDate: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>

              {/* Usage Mode */}
              <Field label="Usage Mode" required>
                <div className="flex gap-2 flex-wrap">
                  {(
                    [
                      "Storage",
                      "Distribution",
                      "Storage + Distribution",
                    ] as UsageMode[]
                  ).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm({ ...form, usageMode: m })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        form.usageMode === m
                          ? "bg-navy-600 text-white border-navy-600"
                          : "border-slate-300 text-slate-600 hover:border-navy-400"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Locations */}
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Pickup Location"
                  error={errors.pickupLocation}
                  required
                >
                  <input
                    className="form-input text-sm"
                    placeholder="e.g. Bandung"
                    value={form.pickupLocation}
                    onChange={(e) =>
                      setForm({ ...form, pickupLocation: e.target.value })
                    }
                  />
                </Field>
                <Field
                  label="Destination"
                  error={errors.destinationLocation}
                  required
                >
                  <input
                    className="form-input text-sm"
                    placeholder="e.g. Jakarta"
                    value={form.destinationLocation}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        destinationLocation: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>

              {/* Sensitivity */}
              <Field label="Product Sensitivity">
                <div className="flex gap-2">
                  {(["Low", "Medium", "High"] as ProductSensitivity[]).map(
                    (s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setForm({ ...form, productSensitivity: s })
                        }
                        className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                          form.productSensitivity === s
                            ? s === "Low"
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : s === "Medium"
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-red-500 text-white border-red-500"
                            : "border-slate-300 text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {s}
                      </button>
                    )
                  )}
                </div>
              </Field>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3">
                <ToggleField
                  icon={Battery}
                  label="Battery Backup"
                  value={form.needBatteryBackup}
                  onChange={(v) =>
                    setForm({ ...form, needBatteryBackup: v })
                  }
                />
                <ToggleField
                  icon={MapPin}
                  label="GPS Tracking"
                  value={form.needGpsTracking}
                  onChange={(v) =>
                    setForm({ ...form, needGpsTracking: v })
                  }
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={state === "loading"}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                {state === "loading" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Get Box Recommendation
                  </>
                )}
              </button>
            </div>

            {/* Right: Result */}
            <div className="p-5">
              {state === "idle" && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <Gauge size={28} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400">
                    No recommendation yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-48">
                    Fill in the form and click &quot;Get Box
                    Recommendation&quot; to see AI suggestions
                  </p>
                </div>
              )}

              {state === "loading" && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Loader2
                    size={32}
                    className="text-navy-500 animate-spin mb-4"
                  />
                  <p className="text-sm font-semibold text-slate-500">
                    Generating recommendation…
                  </p>
                </div>
              )}

              {state === "error" && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                    <AlertTriangle size={28} className="text-red-400" />
                  </div>
                  <p className="text-sm font-semibold text-red-600">
                    Failed to get recommendation
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Please try again or check your connection
                  </p>
                  <button
                    onClick={handleSubmit}
                    className="btn-secondary text-xs mt-4 px-4 py-2"
                  >
                    Retry
                  </button>
                </div>
              )}

              {state === "result" && result && (
                <div className="space-y-4">
                  {/* Source badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge text-[10px] ${
                        result.source === "AI"
                          ? "text-purple-700 bg-purple-50 border-purple-200"
                          : "text-slate-600 bg-slate-50 border-slate-200"
                      }`}
                    >
                      {result.source === "AI" ? (
                        <>
                          <Sparkles size={10} /> AI Powered
                        </>
                      ) : (
                        <>
                          <Info size={10} /> Rule-Based
                        </>
                      )}
                    </span>
                  </div>

                  {/* Primary recommendation */}
                  <div className="bg-gradient-to-br from-navy-50 to-sky-50 rounded-xl p-4 border border-navy-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-navy-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-extrabold text-navy-800">
                          {result.recommendedQuantity}×{" "}
                          {result.recommendedBoxType}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {result.estimatedCapacityUsed}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Utilization bar */}
                  <UtilizationBar rate={parsedRate} />

                  {/* Cost */}
                  <div className="flex items-center gap-2 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <Zap size={14} className="text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-800">
                      {result.estimatedRentalCost}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <DetailItem
                      label="Microclimate"
                      value={result.microclimateSummary}
                    />
                    <DetailItem
                      label="Usage Mode"
                      value={result.usageModeRecommendation}
                    />
                    <DetailItem
                      label="Alternative"
                      value={result.alternativeOption}
                    />
                    <DetailItem
                      label="Reasoning"
                      value={result.reasoningSummary}
                    />
                  </div>

                  {/* Warning */}
                  {result.warning && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <AlertTriangle
                        size={14}
                        className="text-amber-600 flex-shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-amber-800 whitespace-pre-line">
                        {result.warning}
                      </p>
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={handleApply}
                    className="w-full bg-gradient-to-r from-navy-600 to-indigo-600 text-white font-semibold px-5 py-3 rounded-xl hover:from-navy-700 hover:to-indigo-700 transition-all duration-150 flex items-center justify-center gap-2 text-sm shadow-lg shadow-navy-600/20"
                  >
                    Use This Recommendation for Booking
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper Sub-Components ──────────────────────────────────────────────────

function Field({
  label,
  error,
  required,
  helper,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="form-label">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {helper && !error && (
        <p className="text-[10px] text-slate-400 mt-1">{helper}</p>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function ToggleField({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
        value
          ? "bg-navy-600 text-white border-navy-600"
          : "border-slate-300 text-slate-600 hover:border-navy-400"
      }`}
    >
      <Icon size={14} />
      {label}: {value ? "Yes" : "No"}
    </button>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-xs text-slate-700 leading-relaxed">{value}</p>
    </div>
  );
}
