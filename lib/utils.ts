// lib/utils.ts — General utility helpers

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Add small random variation for simulated sensor data */
export function jitter(value: number, maxDelta: number): number {
  return value + (Math.random() - 0.5) * 2 * maxDelta;
}

/** Days between two ISO date strings */
export function daysBetween(a: string, b: string): number {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/** Truncate string with ellipsis */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

export const RISK_COLORS = {
  Low: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Medium: "text-amber-600 bg-amber-50 border-amber-200",
  High: "text-red-600 bg-red-50 border-red-200",
} as const;

export const STATUS_COLORS = {
  Available: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Rented: "text-sky-700 bg-sky-50 border-sky-200",
  Maintenance: "text-amber-700 bg-amber-50 border-amber-200",
} as const;
