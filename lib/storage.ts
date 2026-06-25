// lib/storage.ts — Client-side localStorage persistence layer
// All functions are safe to call only on the client (window is available)

import {
  FreshBox,
  Rental,
  ProductBatch,
  Recommendation,
  Alert,
  BoxRecommendationInput,
  BoxRecommendationResult,
} from "./types";
import {
  INITIAL_BOXES,
  INITIAL_RENTALS,
  INITIAL_PRODUCTS,
  INITIAL_RECOMMENDATIONS,
} from "./mockData";

const KEYS = {
  BOXES: "freshbox_boxes",
  RENTALS: "freshbox_rentals",
  PRODUCTS: "freshbox_products",
  RECOMMENDATIONS: "freshbox_recommendations",
  ALERTS: "freshbox_alerts",
  INITIALIZED: "freshbox_initialized",
  BOX_RECOMMENDATION: "freshbox_latest_box_recommendation",
};

/** Seed localStorage with mock data on first load */
export function initializeStorage(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.INITIALIZED)) return;
  localStorage.setItem(KEYS.BOXES, JSON.stringify(INITIAL_BOXES));
  localStorage.setItem(KEYS.RENTALS, JSON.stringify(INITIAL_RENTALS));
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(KEYS.RECOMMENDATIONS, JSON.stringify(INITIAL_RECOMMENDATIONS));
  localStorage.setItem(KEYS.ALERTS, JSON.stringify([]));
  localStorage.setItem(KEYS.INITIALIZED, "true");
}

/** Reset all data back to initial seed (useful for demo) */
export function resetStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEYS.INITIALIZED);
  initializeStorage();
}

// ─── FreshBox ───────────────────────────────────────────────────────────────

export function getBoxes(): FreshBox[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEYS.BOXES);
  return raw ? (JSON.parse(raw) as FreshBox[]) : INITIAL_BOXES;
}

export function saveBoxes(boxes: FreshBox[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.BOXES, JSON.stringify(boxes));
}

export function updateBox(updated: FreshBox): void {
  const boxes = getBoxes();
  const idx = boxes.findIndex((b) => b.id === updated.id);
  if (idx !== -1) boxes[idx] = updated;
  saveBoxes(boxes);
}

// ─── Rentals ────────────────────────────────────────────────────────────────

export function getRentals(): Rental[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEYS.RENTALS);
  return raw ? (JSON.parse(raw) as Rental[]) : INITIAL_RENTALS;
}

export function saveRentals(rentals: Rental[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.RENTALS, JSON.stringify(rentals));
}

export function addRental(rental: Rental): void {
  const rentals = getRentals();
  rentals.push(rental);
  saveRentals(rentals);
}

// ─── Products ───────────────────────────────────────────────────────────────

export function getProducts(): ProductBatch[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEYS.PRODUCTS);
  return raw ? (JSON.parse(raw) as ProductBatch[]) : INITIAL_PRODUCTS;
}

export function saveProducts(products: ProductBatch[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
}

export function addProduct(product: ProductBatch): void {
  const products = getProducts();
  products.push(product);
  saveProducts(products);
}

// ─── Recommendations ────────────────────────────────────────────────────────

export function getRecommendations(): Recommendation[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEYS.RECOMMENDATIONS);
  return raw ? (JSON.parse(raw) as Recommendation[]) : INITIAL_RECOMMENDATIONS;
}

export function saveRecommendations(recs: Recommendation[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.RECOMMENDATIONS, JSON.stringify(recs));
}

export function addRecommendation(rec: Recommendation): void {
  const recs = getRecommendations();
  recs.push(rec);
  saveRecommendations(recs);
}

// ─── Alerts ─────────────────────────────────────────────────────────────────

export function getAlerts(): Alert[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEYS.ALERTS);
  return raw ? (JSON.parse(raw) as Alert[]) : [];
}

export function saveAlerts(alerts: Alert[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts));
}

export function addAlert(alert: Alert): void {
  const alerts = getAlerts();
  // Keep only the last 50 alerts to avoid storage bloat
  const trimmed = [alert, ...alerts].slice(0, 50);
  saveAlerts(trimmed);
}

// ─── Box Recommendation ─────────────────────────────────────────────────────

export type StoredBoxRecommendation = BoxRecommendationResult & {
  input: BoxRecommendationInput;
};

export function saveLatestBoxRecommendation(
  rec: StoredBoxRecommendation
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.BOX_RECOMMENDATION, JSON.stringify(rec));
}

export function getLatestBoxRecommendation(): StoredBoxRecommendation | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEYS.BOX_RECOMMENDATION);
  return raw ? (JSON.parse(raw) as StoredBoxRecommendation) : null;
}
