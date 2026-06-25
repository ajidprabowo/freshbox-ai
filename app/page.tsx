"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Activity,
  ShoppingBasket,
  AlertTriangle,
  Zap,
  Leaf,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import AlertBadge from "@/components/AlertBadge";
import {
  initializeStorage,
  getBoxes,
  getRentals,
  getProducts,
  getRecommendations,
  getAlerts,
} from "@/lib/storage";
import { FreshBox, Rental, ProductBatch, Recommendation, Alert } from "@/lib/types";
import { calculateImpact } from "@/lib/calculations";
import { formatIDR, formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const [boxes, setBoxes] = useState<FreshBox[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [products, setProducts] = useState<ProductBatch[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initializeStorage();
    setBoxes(getBoxes());
    setRentals(getRentals());
    setProducts(getProducts());
    setRecommendations(getRecommendations());
    setAlerts(getAlerts());
    setMounted(true);
  }, []);

  if (!mounted) return <LoadingSkeleton />;

  const available = boxes.filter((b) => b.status === "Available").length;
  const active = rentals.filter((r) => r.status === "Active").length;
  const maintenance = boxes.filter((b) => b.status === "Maintenance").length;

  // Spoilage risk map from recommendations
  const riskMap: Record<string, "Low" | "Medium" | "High"> = {};
  for (const rec of recommendations) {
    const prod = products.find((p) => p.id === rec.productBatchId);
    if (prod) riskMap[prod.id] = rec.spoilageRisk;
  }

  const impact = calculateImpact(products, riskMap);

  const avgRisk =
    recommendations.length === 0
      ? "N/A"
      : recommendations.filter((r) => r.spoilageRisk === "High").length >
        recommendations.length / 2
      ? "High"
      : recommendations.filter((r) => r.spoilageRisk === "Medium").length >
        recommendations.length / 3
      ? "Medium"
      : "Low";

  const recentAlerts = alerts.slice(0, 5);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            FreshBox AI — Real-time cold chain overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live (Simulated)
          </span>
          <button
            onClick={() => {
              setBoxes(getBoxes());
              setRentals(getRentals());
              setProducts(getProducts());
              setAlerts(getAlerts());
            }}
            className="btn-secondary text-sm py-2 px-3"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Available Boxes"
          value={available}
          subtitle={`${maintenance} under maintenance`}
          icon={Package}
          accent="emerald"
        />
        <StatCard
          title="Active Rentals"
          value={active}
          subtitle="Currently deployed"
          icon={Activity}
          accent="sky"
        />
        <StatCard
          title="Products Stored"
          value={products.length}
          subtitle={`${products.reduce((a, p) => a + p.quantityKg, 0)} kg total`}
          icon={ShoppingBasket}
          accent="navy"
        />
        <StatCard
          title="Avg Spoilage Risk"
          value={avgRisk}
          subtitle="Across active batches"
          icon={AlertTriangle}
          accent={avgRisk === "Low" ? "emerald" : avgRisk === "High" ? "red" : "amber"}
        />
      </div>

      {/* Impact highlights */}
      <div>
        <h2 className="section-title mb-4">Sustainability Impact</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ImpactTile
            icon={Leaf}
            value={`${impact.kgFoodLossAvoided} kg`}
            label="Food Loss Avoided"
            color="emerald"
          />
          <ImpactTile
            icon={Zap}
            value={`${impact.energySavedKwh} kWh`}
            label="Energy Saved"
            color="amber"
          />
          <ImpactTile
            icon={TrendingUp}
            value={`${impact.co2eAvoided} kg`}
            label="CO₂e Avoided"
            color="sky"
          />
          <ImpactTile
            icon={Package}
            value={formatIDR(impact.costLossAvoided)}
            label="Cost Loss Avoided"
            color="navy"
          />
        </div>
      </div>

      {/* Bottom grid: recent alerts + quick actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Recent Alerts</h2>
            <Link href="/monitoring" className="text-xs text-sky-600 font-semibold hover:underline">
              View All →
            </Link>
          </div>
          {recentAlerts.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <AlertTriangle size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No recent alerts</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAlerts.map((alert) => (
                <AlertBadge key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-5 space-y-3">
          <h2 className="section-title">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/boxes", label: "Check Availability", icon: Package, color: "bg-navy-50 text-navy-700 hover:bg-navy-100" },
              { href: "/booking", label: "Book a Box", icon: Activity, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
              { href: "/products", label: "Register Product", icon: ShoppingBasket, color: "bg-sky-50 text-sky-700 hover:bg-sky-100" },
              { href: "/monitoring", label: "Live Monitor", icon: TrendingUp, color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className={`${color} rounded-xl p-4 flex flex-col gap-2 transition-colors`}
              >
                <Icon size={18} />
                <span className="text-sm font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Box status summary */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Box Fleet Status</h2>
        <div className="flex gap-6 flex-wrap">
          {[
            { label: "Available", count: available, color: "bg-emerald-500" },
            { label: "Rented", count: active, color: "bg-sky-500" },
            { label: "Maintenance", count: maintenance, color: "bg-amber-500" },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <span className="text-sm text-slate-600">{label}</span>
              <span className="text-sm font-bold text-navy-800">{count}</span>
            </div>
          ))}
        </div>
        {/* Bar chart */}
        <div className="mt-4 h-3 bg-slate-100 rounded-full overflow-hidden flex">
          {boxes.length > 0 && (
            <>
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${(available / boxes.length) * 100}%` }}
              />
              <div
                className="bg-sky-500 h-full transition-all"
                style={{ width: `${(active / boxes.length) * 100}%` }}
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${(maintenance / boxes.length) * 100}%` }}
              />
            </>
          )}
        </div>
      </div>

      {/* Recent Products */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Recent Product Batches</h2>
          <Link href="/products" className="text-xs text-sky-600 font-semibold hover:underline">
            View All →
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No product batches registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Product", "Category", "Qty (kg)", "Box", "Grade", "Stored"].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-medium text-navy-700">{p.productName}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{p.category}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{p.quantityKg}</td>
                    <td className="py-2.5 pr-4">
                      <span className="badge text-sky-700 bg-sky-50 border-sky-200">{p.assignedBoxId}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`badge ${p.qualityGrade === "A" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : p.qualityGrade === "B" ? "text-amber-700 bg-amber-50 border-amber-200" : "text-red-700 bg-red-50 border-red-200"}`}>
                        Grade {p.qualityGrade}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500 text-xs">{formatDateTime(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ImpactTile({
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
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    sky: "bg-sky-50 border-sky-100 text-sky-700",
    navy: "bg-navy-50 border-navy-100 text-navy-700",
  };
  return (
    <div className={`${colors[color]} border rounded-2xl p-4 flex flex-col gap-2`}>
      <Icon size={18} />
      <p className="text-lg font-extrabold leading-tight">{value}</p>
      <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded-xl w-48" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
        ))}
      </div>
      <div className="h-40 bg-slate-200 rounded-2xl" />
    </div>
  );
}
