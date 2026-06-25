"use client";

import { useEffect, useState } from "react";
import {
  Leaf,
  Zap,
  TrendingDown,
  DollarSign,
  Package,
  Info,
  Globe,
  BarChart3,
} from "lucide-react";
import { initializeStorage, getProducts, getRecommendations } from "@/lib/storage";
import { ProductBatch, Recommendation, SpoilageRisk } from "@/lib/types";
import { calculateImpact } from "@/lib/calculations";
import { ImpactMetrics } from "@/lib/types";
import { formatIDR } from "@/lib/utils";

export default function ImpactPage() {
  const [products, setProducts] = useState<ProductBatch[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initializeStorage();
    setProducts(getProducts());
    setRecommendations(getRecommendations());
    setMounted(true);
  }, []);

  if (!mounted) return <LoadingSkeleton />;

  // Build risk map
  const riskMap: Record<string, SpoilageRisk> = {};
  for (const rec of recommendations) {
    const prod = products.find((p) => p.id === rec.productBatchId);
    if (prod) riskMap[prod.id] = rec.spoilageRisk;
  }

  const impact = calculateImpact(products, riskMap);

  // Category breakdown
  const categoryTotals = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.quantityKg;
    return acc;
  }, {});

  const totalKg = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="page-title">Sustainability Impact</h1>
        <p className="text-sm text-slate-500 mt-1">
          Estimated environmental and economic impact from FreshBox AI cold chain optimization
        </p>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HeroCard
          icon={Package}
          value={`${impact.kgFoodProtected} kg`}
          label="Food Protected"
          sublabel="Total kg under cold storage"
          color="navy"
        />
        <HeroCard
          icon={Leaf}
          value={`${impact.kgFoodLossAvoided} kg`}
          label="Food Loss Avoided"
          sublabel="Estimated kg saved from spoilage"
          color="emerald"
        />
        <HeroCard
          icon={Globe}
          value={`${impact.co2eAvoided} kg`}
          label="CO₂e Avoided"
          sublabel="Greenhouse gases not emitted"
          color="sky"
        />
        <HeroCard
          icon={DollarSign}
          value={formatIDR(impact.costLossAvoided)}
          label="Economic Value Saved"
          sublabel="Estimated food loss cost avoided"
          color="amber"
        />
      </div>

      {/* Energy saved */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
              <Zap size={22} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-navy-800">{impact.energySavedKwh} kWh</p>
              <p className="text-sm text-slate-500">Estimated Energy Saved vs. Conventional Cooling</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 max-w-xs">
            <p className="text-xs font-semibold text-amber-700 mb-1">How is this calculated?</p>
            <p className="text-xs text-amber-600 leading-relaxed">
              FreshBox AI uses ~0.35 kWh/kg vs. ~0.80 kWh/kg for conventional full-room cold storage.
              Savings = difference × total kg stored.
            </p>
          </div>
        </div>

        {/* Energy bar */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>FreshBox AI</span>
            <span className="text-emerald-600">0.35 kWh/kg</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "44%" }} />
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Conventional</span>
            <span className="text-red-400">0.80 kWh/kg</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-300 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-navy-600" />
            <h2 className="section-title text-base">Product Category Breakdown</h2>
          </div>
          {Object.keys(categoryTotals).length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No products registered yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, kg]) => {
                  const pct = totalKg > 0 ? (kg / totalKg) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">{cat}</span>
                        <span className="text-slate-500 font-semibold">{kg} kg</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-navy-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 text-right">
                        {pct.toFixed(1)}% of total
                      </p>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Impact assumptions */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-navy-600" />
            <h2 className="section-title text-base">Calculation Assumptions</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                label: "Food Loss Avoided (Low Risk)",
                value: "5% of batch quantity",
                icon: Leaf,
                color: "emerald",
              },
              {
                label: "Food Loss Avoided (Medium Risk)",
                value: "3% of batch quantity",
                icon: Leaf,
                color: "amber",
              },
              {
                label: "Food Loss Avoided (High Risk)",
                value: "1% of batch quantity",
                icon: Leaf,
                color: "red",
              },
              {
                label: "CO₂e Factor",
                value: "2.5 kg CO₂e per kg food waste",
                icon: Globe,
                color: "sky",
              },
              {
                label: "Economic Value",
                value: "Rp20,000 per kg food saved",
                icon: DollarSign,
                color: "amber",
              },
              {
                label: "Energy Saving Rate",
                value: "0.45 kWh/kg difference",
                icon: Zap,
                color: "amber",
              },
            ].map(({ label, value, icon: Icon, color }) => {
              const iconColors: Record<string, string> = {
                emerald: "text-emerald-600 bg-emerald-50",
                amber: "text-amber-600 bg-amber-50",
                red: "text-red-600 bg-red-50",
                sky: "text-sky-600 bg-sky-50",
              };
              return (
                <div key={label} className="flex items-start gap-3">
                  <div className={`w-7 h-7 ${iconColors[color]} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon size={13} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{label}</p>
                    <p className="text-xs text-slate-500">{value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SDG alignment */}
      <div className="card p-6">
        <h2 className="section-title mb-4">SDG Alignment</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              sdg: "SDG 2",
              title: "Zero Hunger",
              desc: "Reducing post-harvest food loss through cold chain optimization directly supports food security.",
              color: "bg-yellow-50 border-yellow-200 text-yellow-800",
            },
            {
              sdg: "SDG 12",
              title: "Responsible Consumption",
              desc: "Minimizing food waste reduces resource inefficiency across the entire food supply chain.",
              color: "bg-amber-50 border-amber-200 text-amber-800",
            },
            {
              sdg: "SDG 13",
              title: "Climate Action",
              desc: "Energy-efficient cold storage reduces CO₂ emissions from food systems.",
              color: "bg-emerald-50 border-emerald-200 text-emerald-800",
            },
          ].map(({ sdg, title, desc, color }) => (
            <div key={sdg} className={`${color} border rounded-2xl p-4`}>
              <p className="font-extrabold text-sm">{sdg}</p>
              <p className="font-bold text-base mt-0.5">{title}</p>
              <p className="text-xs mt-2 leading-relaxed opacity-80">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center pb-4">
        ⚠️ All impact figures are estimates based on simplified assumptions. Actual impact depends on real operational data. FreshBox AI MVP v0.1.
      </p>
    </div>
  );
}

function HeroCard({
  icon: Icon,
  value,
  label,
  sublabel,
  color,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  sublabel: string;
  color: string;
}) {
  const styles: Record<string, string> = {
    navy: "from-navy-600 to-navy-700",
    emerald: "from-emerald-500 to-emerald-600",
    sky: "from-sky-500 to-sky-600",
    amber: "from-amber-500 to-amber-600",
  };

  return (
    <div className={`bg-gradient-to-br ${styles[color]} rounded-2xl p-5 text-white`}>
      <Icon size={20} className="opacity-80 mb-3" />
      <p className="text-xl font-extrabold leading-tight">{value}</p>
      <p className="text-sm font-bold mt-1 opacity-90">{label}</p>
      <p className="text-[10px] opacity-60 mt-1 leading-snug">{sublabel}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded-xl w-48" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-slate-200 rounded-2xl" />)}
      </div>
      <div className="h-40 bg-slate-200 rounded-2xl" />
    </div>
  );
}
