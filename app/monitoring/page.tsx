"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, RefreshCw, Bell, BellOff, Search } from "lucide-react";
import MonitoringCard from "@/components/MonitoringCard";
import AlertBadge from "@/components/AlertBadge";
import {
  initializeStorage,
  getBoxes,
  getProducts,
  getAlerts,
  addAlert,
} from "@/lib/storage";
import { FreshBox, ProductBatch, MonitoringData, Alert, SpoilageRisk } from "@/lib/types";
import { generateId, jitter, clamp } from "@/lib/utils";

/** Generate simulated monitoring data for a box */
function simulateMonitoringData(box: FreshBox, products: ProductBatch[]): MonitoringData {
  const product = products.find((p) => p.assignedBoxId === box.id);

  // Simulate small random variations around the box's current readings
  const temp = clamp(jitter(box.temperature, 0.4), -25, 40);
  const humidity = clamp(jitter(box.humidity, 2), 0, 100);
  const battery = clamp(jitter(box.batteryLevel, 0.5), 0, 100);
  const doorOpen = Math.random() < 0.08; // 8% chance door is open

  // Calculate spoilage risk
  const tempInRange = temp >= box.minTemp && temp <= box.maxTemp;
  const humidityOk = humidity >= 60;
  const shelfLifeRemaining = product
    ? product.estimatedShelfLifeDays -
      Math.floor(
        (Date.now() - new Date(product.dateStored).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 10;

  let spoilageRisk: SpoilageRisk = "Low";
  if (!tempInRange || shelfLifeRemaining <= 1) spoilageRisk = "High";
  else if (!humidityOk || shelfLifeRemaining <= 2 || doorOpen) spoilageRisk = "Medium";

  const remainingSafeHours = Math.max(0, shelfLifeRemaining * 24 - 4);

  // Generate alerts
  const alerts: Alert[] = [];

  if (!tempInRange) {
    alerts.push({
      id: generateId("ALT"),
      boxId: box.id,
      type: "TempOutOfRange",
      message: `Temperature ${temp.toFixed(1)}°C is outside safe range (${box.minTemp}–${box.maxTemp}°C)`,
      severity: Math.abs(temp - (box.minTemp + box.maxTemp) / 2) > 5 ? "Critical" : "Warning",
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }

  if (humidity < 60 || humidity > 98) {
    alerts.push({
      id: generateId("ALT"),
      boxId: box.id,
      type: "HumidityOutOfRange",
      message: `Humidity ${humidity.toFixed(0)}% RH is outside optimal range`,
      severity: "Warning",
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }

  if (doorOpen) {
    alerts.push({
      id: generateId("ALT"),
      boxId: box.id,
      type: "DoorOpen",
      message: `Door has been open for an extended period — check immediately`,
      severity: "Warning",
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }

  if (battery < 20) {
    alerts.push({
      id: generateId("ALT"),
      boxId: box.id,
      type: "BatteryLow",
      message: `Battery at ${battery.toFixed(0)}% — connect to power source`,
      severity: battery < 10 ? "Critical" : "Warning",
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }

  if (spoilageRisk === "High") {
    alerts.push({
      id: generateId("ALT"),
      boxId: box.id,
      type: "SpoilageRisk",
      message: `High spoilage risk detected — immediate action required`,
      severity: "Critical",
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }

  return {
    boxId: box.id,
    timestamp: new Date().toISOString(),
    temperature: parseFloat(temp.toFixed(1)),
    humidity: parseFloat(humidity.toFixed(1)),
    batteryLevel: parseFloat(battery.toFixed(0)),
    doorOpen,
    gpsActive: Math.random() > 0.05,
    coolingActive: box.status === "Rented" && temp > box.minTemp - 1,
    spoilageRisk,
    remainingSafeHours,
    alerts,
  };
}

export default function MonitoringPage() {
  const [boxes, setBoxes] = useState<FreshBox[]>([]);
  const [products, setProducts] = useState<ProductBatch[]>([]);
  const [monitoringData, setMonitoringData] = useState<Record<string, MonitoringData>>({});
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initializeStorage();
    const allBoxes = getBoxes().filter((b) => b.status === "Rented");
    setBoxes(allBoxes);
    setProducts(getProducts());
    setRecentAlerts(getAlerts().slice(0, 10));
    setMounted(true);
  }, []);

  const refreshData = useCallback(() => {
    if (boxes.length === 0) return;

    const newData: Record<string, MonitoringData> = {};
    const newAlerts: Alert[] = [];

    for (const box of boxes) {
      const data = simulateMonitoringData(box, products);
      newData[box.id] = data;

      if (alertsEnabled && data.alerts.length > 0) {
        newAlerts.push(...data.alerts);
        for (const alert of data.alerts) {
          addAlert(alert);
        }
      }
    }

    setMonitoringData(newData);
    setRecentAlerts((prev) => [...newAlerts, ...prev].slice(0, 20));
    setLastUpdated(new Date());
  }, [boxes, products, alertsEnabled]);

  // Initial data load
  useEffect(() => {
    if (boxes.length > 0) refreshData();
  }, [boxes, refreshData]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!mounted || boxes.length === 0) return;
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [mounted, boxes, refreshData]);

  const filtered = boxes.filter((b) =>
    searchQuery
      ? b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        products.find((p) => p.assignedBoxId === b.id)?.productName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      : true
  );

  const totalAlerts = Object.values(monitoringData).reduce(
    (sum, d) => sum + d.alerts.length, 0
  );
  const highRisk = Object.values(monitoringData).filter(
    (d) => d.spoilageRisk === "High"
  ).length;

  if (!mounted) return <LoadingSkeleton />;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Live Monitoring</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time simulated sensor data — refreshes every 5 seconds
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${
              alertsEnabled
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            {alertsEnabled ? <Bell size={13} /> : <BellOff size={13} />}
            {alertsEnabled ? "Alerts On" : "Alerts Off"}
          </button>
          <button
            onClick={refreshData}
            className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryPill
          label="Active Boxes"
          value={boxes.length}
          color="sky"
        />
        <SummaryPill
          label="Active Alerts"
          value={totalAlerts}
          color={totalAlerts > 0 ? "amber" : "emerald"}
        />
        <SummaryPill
          label="High Risk"
          value={highRisk}
          color={highRisk > 0 ? "red" : "emerald"}
        />
      </div>

      {/* Empty state */}
      {boxes.length === 0 ? (
        <div className="card p-20 text-center">
          <Activity size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No active rentals to monitor</p>
          <p className="text-slate-400 text-sm mt-1">
            Book a FreshBox to start monitoring
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Monitoring cards */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="form-input pl-9"
                placeholder="Search by box ID or product name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {filtered.map((box) => {
                const data = monitoringData[box.id];
                const product = products.find((p) => p.assignedBoxId === box.id);
                if (!data) {
                  return (
                    <div key={box.id} className="card p-5 flex items-center justify-center h-52">
                      <div className="text-center text-slate-300">
                        <Activity size={24} className="mx-auto mb-2 animate-pulse" />
                        <p className="text-xs">Loading {box.id}…</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <MonitoringCard
                    key={box.id}
                    data={data}
                    box={box}
                    productName={product?.productName}
                  />
                );
              })}
            </div>
          </div>

          {/* Alert feed */}
          <div className="space-y-4">
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="section-title text-base">Alert Feed</h2>
                {totalAlerts > 0 && (
                  <span className="badge text-red-700 bg-red-50 border-red-200">
                    {totalAlerts} active
                  </span>
                )}
              </div>

              {recentAlerts.length === 0 ? (
                <div className="py-6 text-center text-slate-300">
                  <Bell size={20} className="mx-auto mb-2" />
                  <p className="text-xs">No alerts yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {recentAlerts.map((alert) => (
                    <AlertBadge key={alert.id} alert={alert} />
                  ))}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="card p-4 space-y-3">
              <h3 className="text-sm font-bold text-navy-700">Temperature Ring Guide</h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>Green = Temperature in safe range</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-500 flex-shrink-0" />
                  <span>Blue = Temperature too cold</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                  <span>Red = Temperature too warm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryPill({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    sky: "bg-sky-50 border-sky-200 text-sky-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    red: "bg-red-50 border-red-200 text-red-800",
  };
  return (
    <div className={`${colors[color]} border rounded-2xl p-4 text-center`}>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded-xl w-48" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-200 rounded-2xl" />)}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-slate-200 rounded-2xl" />)}
      </div>
    </div>
  );
}
