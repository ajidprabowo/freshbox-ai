"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Printer,
  Thermometer,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Package,
  Leaf,
  Zap,
} from "lucide-react";
import {
  initializeStorage,
  getProducts,
  getBoxes,
  getRentals,
  getRecommendations,
} from "@/lib/storage";
import {
  ProductBatch,
  FreshBox,
  Rental,
  Recommendation,
} from "@/lib/types";
import { formatIDR, formatDate } from "@/lib/utils";
import { calculateImpact } from "@/lib/calculations";

export default function ReportsPage() {
  const [products, setProducts] = useState<ProductBatch[]>([]);
  const [boxes, setBoxes] = useState<FreshBox[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initializeStorage();
    const p = getProducts();
    setProducts(p);
    setBoxes(getBoxes());
    setRentals(getRentals());
    setRecommendations(getRecommendations());
    if (p.length > 0) setSelectedProductId(p[0].id);
    setMounted(true);
  }, []);

  if (!mounted) return <LoadingSkeleton />;

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedBox = selectedProduct
    ? boxes.find((b) => b.id === selectedProduct.assignedBoxId)
    : null;
  const selectedRental = selectedProduct
    ? rentals.find((r) => r.boxId === selectedProduct.assignedBoxId && r.status === "Active")
    : null;
  const selectedRec = selectedProduct
    ? recommendations.find((r) => r.productBatchId === selectedProduct.id)
    : null;

  // Build risk map for impact calculation
  const riskMap: Record<string, "Low" | "Medium" | "High"> = {};
  for (const rec of recommendations) {
    const prod = products.find((p) => p.id === rec.productBatchId);
    if (prod) riskMap[prod.id] = rec.spoilageRisk;
  }

  const impact = selectedProduct
    ? calculateImpact([selectedProduct], riskMap)
    : null;

  // Simulate temperature compliance (in a real app, this would come from sensor logs)
  const simulatedAvgTemp = selectedBox
    ? selectedBox.temperature + (Math.random() - 0.5) * 1.5
    : 0;
  const simulatedAvgHumidity = selectedBox ? selectedBox.humidity : 0;
  const compliancePct = selectedBox
    ? Math.round(
        Math.random() * 15 + 80 // 80–95% compliance
      )
    : 0;
  const alertCount = Math.floor(Math.random() * 4);

  const finalCondition =
    compliancePct >= 90 && (selectedRec?.spoilageRisk !== "High")
      ? "Safe"
      : compliancePct >= 75
      ? "Review Needed"
      : "High Risk";

  const conditionColor = {
    Safe: "text-emerald-700 bg-emerald-50 border-emerald-200",
    "Review Needed": "text-amber-700 bg-amber-50 border-amber-200",
    "High Risk": "text-red-700 bg-red-50 border-red-200",
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3 no-print">
        <div>
          <h1 className="page-title">Cold Chain Report</h1>
          <p className="text-sm text-slate-500 mt-1">
            Select a product batch to generate its cold chain report
          </p>
        </div>
        {selectedProduct && (
          <button
            onClick={() => window.print()}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Printer size={14} />
            Print Report
          </button>
        )}
      </div>

      {/* Product selector */}
      {products.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No product batches registered</p>
          <p className="text-slate-400 text-sm mt-1">
            Register a product first to generate a report
          </p>
        </div>
      ) : (
        <>
          <div className="no-print">
            <label className="form-label">Select Product Batch</label>
            <select
              className="form-input max-w-md"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productName} — {p.batchId} ({p.quantityKg} kg)
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="space-y-5">
              {/* Report header */}
              <div className="card p-6">
                <div className="print-only mb-4">
                  <h2 className="text-xl font-extrabold text-navy-800">
                    FreshBox AI — Cold Chain Report
                  </h2>
                  <p className="text-sm text-slate-500">
                    Generated: {new Date().toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-navy-800">
                      {selectedProduct.productName}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {selectedProduct.category} · Batch {selectedProduct.batchId}
                    </p>
                    <p className="text-sm text-slate-500">
                      Grade {selectedProduct.qualityGrade} · {selectedProduct.quantityKg} kg
                    </p>
                  </div>
                  <span className={`badge text-sm px-3 py-1.5 ${conditionColor[finalCondition]}`}>
                    {finalCondition === "Safe" ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <AlertTriangle size={14} />
                    )}
                    {finalCondition}
                  </span>
                </div>
              </div>

              {/* Key metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ReportMetric
                  icon={Thermometer}
                  label="Avg Temperature"
                  value={`${simulatedAvgTemp.toFixed(1)}°C`}
                  color="sky"
                />
                <ReportMetric
                  icon={Droplets}
                  label="Avg Humidity"
                  value={`${simulatedAvgHumidity.toFixed(0)}% RH`}
                  color="blue"
                />
                <ReportMetric
                  icon={CheckCircle2}
                  label="Temp Compliance"
                  value={`${compliancePct}%`}
                  color={compliancePct >= 90 ? "emerald" : "amber"}
                />
                <ReportMetric
                  icon={AlertTriangle}
                  label="Alerts Triggered"
                  value={alertCount}
                  color={alertCount === 0 ? "emerald" : "amber"}
                />
              </div>

              {/* Storage details */}
              <div className="card p-5 grid md:grid-cols-2 gap-6">
                <Section title="Product & Batch">
                  <DetailRow label="Product Name" value={selectedProduct.productName} />
                  <DetailRow label="Category" value={selectedProduct.category} />
                  <DetailRow label="Batch ID" value={selectedProduct.batchId} mono />
                  <DetailRow label="Quantity" value={`${selectedProduct.quantityKg} kg`} />
                  <DetailRow label="Origin" value={selectedProduct.origin} />
                  <DetailRow label="Destination" value={selectedProduct.destination} />
                  <DetailRow label="Quality Grade" value={`Grade ${selectedProduct.qualityGrade}`} />
                </Section>

                <Section title="Storage & Box">
                  <DetailRow
                    label="Assigned Box"
                    value={selectedProduct.assignedBoxId}
                  />
                  {selectedBox && (
                    <>
                      <DetailRow
                        label="Box Type"
                        value={`FreshBox ${selectedBox.type}`}
                      />
                      <DetailRow label="Location" value={selectedBox.location} />
                      <DetailRow
                        label="Safe Temp Range"
                        value={`${selectedBox.minTemp}°C – ${selectedBox.maxTemp}°C`}
                      />
                    </>
                  )}
                  <DetailRow
                    label="Date Stored"
                    value={formatDate(selectedProduct.dateStored)}
                  />
                  <DetailRow
                    label="Expected Delivery"
                    value={formatDate(selectedProduct.expectedDeliveryDate)}
                  />
                  <DetailRow
                    label="Shelf Life"
                    value={`${selectedProduct.estimatedShelfLifeDays} days`}
                  />
                </Section>
              </div>

              {/* Recommendation summary */}
              {selectedRec && (
                <div className="card p-5 space-y-4">
                  <h3 className="section-title text-base">Microclimate Recommendation</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <RecPill label="Temperature" value={selectedRec.recommendedTemperature} />
                    <RecPill label="Humidity" value={selectedRec.recommendedHumidity} />
                    <RecPill label="Airflow" value={selectedRec.airflowLevel} />
                    <RecPill
                      label="Spoilage Risk"
                      value={selectedRec.spoilageRisk}
                      className={
                        selectedRec.spoilageRisk === "Low"
                          ? "text-emerald-700"
                          : selectedRec.spoilageRisk === "Medium"
                          ? "text-amber-700"
                          : "text-red-700"
                      }
                    />
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Handling Notes
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedRec.handlingRecommendation}
                    </p>
                  </div>
                </div>
              )}

              {/* Rental details */}
              {selectedRental && (
                <div className="card p-5 space-y-3">
                  <h3 className="section-title text-base">Rental Information</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <DetailRow label="Rental ID" value={selectedRental.id} mono />
                    <DetailRow label="Renter" value={selectedRental.userName} />
                    <DetailRow label="Start Date" value={formatDate(selectedRental.startDate)} />
                    <DetailRow label="End Date" value={formatDate(selectedRental.endDate)} />
                    <DetailRow label="Mode" value={selectedRental.usageMode} />
                    <DetailRow label="Status" value={selectedRental.status} />
                  </div>
                </div>
              )}

              {/* Impact summary */}
              {impact && (
                <div className="card p-5 space-y-4">
                  <h3 className="section-title text-base flex items-center gap-2">
                    <Leaf size={16} className="text-emerald-500" />
                    Estimated Impact
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <ImpactPill
                      icon={Package}
                      label="Food Protected"
                      value={`${impact.kgFoodProtected} kg`}
                    />
                    <ImpactPill
                      icon={Leaf}
                      label="Food Loss Avoided"
                      value={`${impact.kgFoodLossAvoided} kg`}
                    />
                    <ImpactPill
                      icon={Zap}
                      label="Energy Saved"
                      value={`${impact.energySavedKwh} kWh`}
                    />
                    <ImpactPill
                      icon={FileText}
                      label="Cost Loss Avoided"
                      value={formatIDR(impact.costLossAvoided)}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-400 text-center no-print">
                * Temperature readings and compliance data are simulated for MVP demonstration purposes.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReportMetric({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  const colors: Record<string, string> = {
    sky: "text-sky-600 bg-sky-50",
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    red: "text-red-600 bg-red-50",
  };
  return (
    <div className="card p-4 text-center">
      <div className={`w-8 h-8 ${colors[color]} rounded-lg flex items-center justify-center mx-auto mb-2`}>
        <Icon size={15} />
      </div>
      <p className="text-lg font-extrabold text-navy-800">{value}</p>
      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-2 text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500 flex-shrink-0">{label}</span>
      <span className={`text-navy-700 font-semibold text-right ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function RecPill({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 text-center">
      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-extrabold text-navy-800 mt-1 ${className || ""}`}>{value}</p>
    </div>
  );
}

function ImpactPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
      <Icon size={16} className="text-emerald-600 mx-auto mb-1" />
      <p className="text-sm font-extrabold text-emerald-800">{value}</p>
      <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mt-0.5">
        {label}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded-xl w-48" />
      <div className="h-12 bg-slate-200 rounded-xl max-w-md" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
      </div>
      <div className="h-48 bg-slate-200 rounded-2xl" />
    </div>
  );
}
