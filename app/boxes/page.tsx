"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, SlidersHorizontal } from "lucide-react";
import BoxCard from "@/components/BoxCard";
import { initializeStorage, getBoxes } from "@/lib/storage";
import { FreshBox, BoxStatus, BoxType, BoxLocation } from "@/lib/types";

export default function BoxesPage() {
  const router = useRouter();
  const [boxes, setBoxes] = useState<FreshBox[]>([]);
  const [filterStatus, setFilterStatus] = useState<BoxStatus | "All">("All");
  const [filterType, setFilterType] = useState<BoxType | "All">("All");
  const [filterLocation, setFilterLocation] = useState<BoxLocation | "All">("All");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initializeStorage();
    setBoxes(getBoxes());
    setMounted(true);
  }, []);

  const filtered = boxes.filter((b) => {
    if (filterStatus !== "All" && b.status !== filterStatus) return false;
    if (filterType !== "All" && b.type !== filterType) return false;
    if (filterLocation !== "All" && b.location !== filterLocation) return false;
    return true;
  });

  const counts = {
    Available: boxes.filter((b) => b.status === "Available").length,
    Rented: boxes.filter((b) => b.status === "Rented").length,
    Maintenance: boxes.filter((b) => b.status === "Maintenance").length,
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Box Availability</h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse and book available FreshBox cold storage units
        </p>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Available", count: counts.Available, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          { label: "Rented", count: counts.Rented, color: "bg-sky-50 border-sky-200 text-sky-700" },
          { label: "Maintenance", count: counts.Maintenance, color: "bg-amber-50 border-amber-200 text-amber-700" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`${color} border px-4 py-2 rounded-xl flex items-center gap-2`}>
            <span className="text-sm font-bold">{count}</span>
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <SlidersHorizontal size={15} />
          <span>Filters</span>
        </div>

        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={(v) => setFilterStatus(v as BoxStatus | "All")}
          options={["All", "Available", "Rented", "Maintenance"]}
        />
        <FilterSelect
          label="Type"
          value={filterType}
          onChange={(v) => setFilterType(v as BoxType | "All")}
          options={["All", "S", "M", "L"]}
        />
        <FilterSelect
          label="Location"
          value={filterLocation}
          onChange={(v) => setFilterLocation(v as BoxLocation | "All")}
          options={["All", "Warehouse", "Truck"]}
        />

        {(filterStatus !== "All" || filterType !== "All" || filterLocation !== "All") && (
          <button
            onClick={() => {
              setFilterStatus("All");
              setFilterType("All");
              setFilterLocation("All");
            }}
            className="text-xs text-red-600 hover:text-red-700 font-semibold underline"
          >
            Clear All
          </button>
        )}

        <p className="ml-auto text-xs text-slate-400 font-medium">
          Showing {filtered.length} of {boxes.length} boxes
        </p>
      </div>

      {/* Box grid */}
      {!mounted ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <Package size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No boxes match the current filters</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your filters above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((box) => (
            <BoxCard
              key={box.id}
              box={box}
              showBookButton
              onBook={() => router.push(`/booking?boxId=${box.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 font-semibold">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-input !w-auto !py-1.5 text-xs"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
