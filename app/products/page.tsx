"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  Sparkles,
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react";
import { initializeStorage, getBoxes, addProduct, addRecommendation } from "@/lib/storage";
import {
  ProductBatch,
  ProductCategory,
  QualityGrade,
  Recommendation,
  FreshBox,
} from "@/lib/types";
import { generateId, RISK_COLORS } from "@/lib/utils";
import Link from "next/link";

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

const GRADES: QualityGrade[] = ["A", "B", "C"];

const EMPTY_FORM = {
  productName: "",
  category: "Tomatoes" as ProductCategory,
  batchId: "",
  quantityKg: "",
  origin: "",
  destination: "",
  dateStored: new Date().toISOString().split("T")[0],
  expectedDeliveryDate: "",
  estimatedShelfLifeDays: "",
  assignedBoxId: "",
  qualityGrade: "A" as QualityGrade,
};

export default function ProductsPage() {
  const [boxes, setBoxes] = useState<FreshBox[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [savedProduct, setSavedProduct] = useState<ProductBatch | null>(null);

  useEffect(() => {
    initializeStorage();
    setBoxes(getBoxes());
    setForm((f) => ({
      ...f,
      batchId: `BATCH-${Date.now().toString(36).toUpperCase()}`,
    }));
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.productName.trim()) e.productName = "Product name required";
    if (!form.quantityKg || isNaN(Number(form.quantityKg)) || Number(form.quantityKg) <= 0)
      e.quantityKg = "Valid quantity required";
    if (!form.origin.trim()) e.origin = "Origin required";
    if (!form.destination.trim()) e.destination = "Destination required";
    if (!form.expectedDeliveryDate) e.expectedDeliveryDate = "Delivery date required";
    if (
      form.expectedDeliveryDate &&
      form.expectedDeliveryDate <= form.dateStored
    )
      e.expectedDeliveryDate = "Delivery date must be after storage date";
    if (
      !form.estimatedShelfLifeDays ||
      isNaN(Number(form.estimatedShelfLifeDays)) ||
      Number(form.estimatedShelfLifeDays) <= 0
    )
      e.estimatedShelfLifeDays = "Valid shelf life required";
    if (!form.assignedBoxId) e.assignedBoxId = "Please assign a FreshBox";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    const productId = generateId("PROD");

    const product: ProductBatch = {
      id: productId,
      productName: form.productName,
      category: form.category,
      batchId: form.batchId,
      quantityKg: Number(form.quantityKg),
      origin: form.origin,
      destination: form.destination,
      dateStored: form.dateStored,
      expectedDeliveryDate: form.expectedDeliveryDate,
      estimatedShelfLifeDays: Number(form.estimatedShelfLifeDays),
      assignedBoxId: form.assignedBoxId,
      qualityGrade: form.qualityGrade,
      createdAt: new Date().toISOString(),
    };

    // Call AI recommendation API
    try {
      const resp = await fetch("/api/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productBatchId: productId,
          productName: form.productName,
          productCategory: form.category,
          quantityKg: Number(form.quantityKg),
          estimatedShelfLifeDays: Number(form.estimatedShelfLifeDays),
          dateStored: form.dateStored,
          expectedDeliveryDate: form.expectedDeliveryDate,
          usageMode: "Storage",
          assignedBoxId: form.assignedBoxId,
        }),
      });

      const recData = await resp.json();
      const rec: Recommendation = {
        id: generateId("REC"),
        ...recData,
        productBatchId: productId,
      };

      product.recommendationId = rec.id;
      addProduct(product);
      addRecommendation(rec);
      setSavedProduct(product);
      setRecommendation(rec);
    } catch {
      // If API call fails, product is still saved
      addProduct(product);
      setSavedProduct(product);
    } finally {
      setLoading(false);
    }
  };

  if (savedProduct && recommendation) {
    return (
      <RecommendationResult
        product={savedProduct}
        recommendation={recommendation}
        onReset={() => {
          setSavedProduct(null);
          setRecommendation(null);
          setForm({ ...EMPTY_FORM, batchId: `BATCH-${Date.now().toString(36).toUpperCase()}` });
        }}
      />
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Product Registration</h1>
        <p className="text-sm text-slate-500 mt-1">
          Register your product batch and get AI microclimate recommendations
        </p>
      </div>

      <div className="card p-6 space-y-5">
        {/* Product details */}
        <Section title="Product Details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Product Name" error={errors.productName} required className="col-span-2">
              <input
                className="form-input"
                placeholder="e.g. Tomat Horti Premium"
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
              />
            </Field>

            <Field label="Category" required>
              <select
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field label="Quality Grade" required>
              <div className="flex gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm({ ...form, qualityGrade: g })}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${
                      form.qualityGrade === g
                        ? g === "A"
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : g === "B"
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-red-500 text-white border-red-500"
                        : "border-slate-300 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Batch ID">
              <input
                className="form-input font-mono text-xs"
                value={form.batchId}
                onChange={(e) => setForm({ ...form, batchId: e.target.value })}
              />
            </Field>

            <Field label="Quantity (kg)" error={errors.quantityKg} required>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="e.g. 250"
                value={form.quantityKg}
                onChange={(e) => setForm({ ...form, quantityKg: e.target.value })}
              />
            </Field>

            <Field label="Estimated Shelf Life (days)" error={errors.estimatedShelfLifeDays} required>
              <input
                type="number"
                min="1"
                className="form-input"
                placeholder="e.g. 7"
                value={form.estimatedShelfLifeDays}
                onChange={(e) => setForm({ ...form, estimatedShelfLifeDays: e.target.value })}
              />
            </Field>
          </div>
        </Section>

        {/* Logistics */}
        <Section title="Logistics">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Origin" error={errors.origin} required>
              <input
                className="form-input"
                placeholder="e.g. Garut, Jawa Barat"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
              />
            </Field>
            <Field label="Destination" error={errors.destination} required>
              <input
                className="form-input"
                placeholder="e.g. Pasar Modern BSD"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
              />
            </Field>
            <Field label="Date Stored" required>
              <input
                type="date"
                className="form-input"
                value={form.dateStored}
                onChange={(e) => setForm({ ...form, dateStored: e.target.value })}
              />
            </Field>
            <Field label="Expected Delivery" error={errors.expectedDeliveryDate} required>
              <input
                type="date"
                className="form-input"
                value={form.expectedDeliveryDate}
                min={form.dateStored}
                onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })}
              />
            </Field>
          </div>
        </Section>

        {/* Box Assignment */}
        <Section title="Box Assignment">
          <Field label="Assigned FreshBox" error={errors.assignedBoxId} required>
            <select
              className="form-input"
              value={form.assignedBoxId}
              onChange={(e) => setForm({ ...form, assignedBoxId: e.target.value })}
            >
              <option value="">Select a FreshBox…</option>
              {boxes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id} — Type {b.type} | {b.status} | {b.location}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <div className="flex items-center gap-2 p-3 bg-sky-50 border border-sky-200 rounded-xl">
          <Sparkles size={14} className="text-sky-600 flex-shrink-0" />
          <p className="text-xs text-sky-700">
            After saving, our AI will generate microclimate recommendations for this product batch
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating AI Recommendation…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Save & Get AI Recommendation
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function RecommendationResult({
  product,
  recommendation,
  onReset,
}: {
  product: ProductBatch;
  recommendation: Recommendation;
  onReset: () => void;
}) {
  const riskColor = RISK_COLORS[recommendation.spoilageRisk];

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
          <CheckCircle2 size={20} className="text-emerald-500" />
        </div>
        <div>
          <h1 className="page-title">Product Registered</h1>
          <p className="text-sm text-slate-500">AI Microclimate Recommendation Generated</p>
        </div>
      </div>

      {/* Source badge */}
      <div className="flex items-center gap-2">
        <span
          className={`badge ${
            recommendation.source === "AI"
              ? "text-purple-700 bg-purple-50 border-purple-200"
              : "text-slate-600 bg-slate-50 border-slate-200"
          }`}
        >
          {recommendation.source === "AI" ? (
            <><Sparkles size={10} /> AI Generated</>
          ) : (
            <><Info size={10} /> Rule-Based Fallback</>
          )}
        </span>
        <span className="text-xs text-slate-400">
          {product.productName} — {product.quantityKg} kg
        </span>
      </div>

      {/* Recommendation cards */}
      <div className="grid grid-cols-2 gap-4">
        <RecCard
          icon={Thermometer}
          label="Recommended Temperature"
          value={recommendation.recommendedTemperature}
          color="sky"
        />
        <RecCard
          icon={Droplets}
          label="Recommended Humidity"
          value={recommendation.recommendedHumidity}
          color="blue"
        />
        <RecCard
          icon={Wind}
          label="Airflow Level"
          value={recommendation.airflowLevel}
          color="emerald"
        />
        <RecCard
          icon={AlertTriangle}
          label="Spoilage Risk"
          value={recommendation.spoilageRisk}
          valueClass={riskColor}
          color="amber"
        />
      </div>

      {/* Details */}
      <div className="card p-5 space-y-4">
        <DetailBlock
          icon={ClipboardList}
          title="Storage Duration Limit"
          content={recommendation.storageDurationLimit}
        />
        <DetailBlock
          icon={CheckCircle2}
          title="Handling Recommendation"
          content={recommendation.handlingRecommendation}
        />
        <DetailBlock
          icon={Sparkles}
          title="Energy Optimization Tip"
          content={recommendation.energyOptimizationTip}
        />
        <DetailBlock
          icon={Info}
          title="Reasoning Summary"
          content={recommendation.reasoningSummary}
        />
      </div>

      <div className="flex gap-3">
        <button onClick={onReset} className="btn-secondary flex-1 text-sm">
          Register Another Product
        </button>
        <Link href="/monitoring" className="btn-primary flex-1 text-sm text-center">
          Go to Monitoring
        </Link>
      </div>
    </div>
  );
}

function RecCard({
  icon: Icon,
  label,
  value,
  valueClass,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    sky: "text-sky-600 bg-sky-50",
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
  };
  return (
    <div className="card p-4 space-y-2">
      <div className={`w-8 h-8 ${colors[color]} rounded-lg flex items-center justify-center`}>
        <Icon size={15} />
      </div>
      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
      <p className={`text-base font-extrabold text-navy-800 ${valueClass || ""}`}>{value}</p>
    </div>
  );
}

function DetailBlock({
  icon: Icon,
  title,
  content,
}: {
  icon: React.ElementType;
  title: string;
  content: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={13} className="text-navy-500" />
        <span className="text-xs font-bold text-navy-700 uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{content}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-slate-100">
        <span className="text-sm font-bold text-navy-700">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  required,
  children,
  className,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="form-label">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
