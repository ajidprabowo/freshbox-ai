// lib/calculations.ts — Cost and impact calculation helpers

import { BoxType, SpoilageRisk, ImpactMetrics, ProductBatch } from "./types";

// ─── Pricing constants (IDR) ─────────────────────────────────────────────────

export const DAILY_RATE: Record<BoxType, number> = {
  S: 75_000,
  M: 120_000,
  L: 200_000,
};

export const ENERGY_COST_PER_KWH = 1_500;         // IDR / kWh
export const PICKUP_DELIVERY_FEE = 50_000;          // IDR flat
export const CLEANING_FEE_PER_BOX = 25_000;         // IDR per box
export const LATE_RETURN_PENALTY = 0.3;             // 30% of daily rate per late day

// ─── Rental cost calculator ───────────────────────────────────────────────────

export interface CostBreakdownResult {
  boxRentalCost: number;
  energyCost: number;
  pickupDeliveryCost: number;
  cleaningCost: number;
  lateReturnFee: number;
  totalCost: number;
}

export function calculateRentalCost(params: {
  boxType: BoxType;
  numberOfBoxes: number;
  rentalDays: number;
  estimatedEnergyKwh: number;
  hasPickupDelivery: boolean;
  hasCleaning: boolean;
  lateReturnDays: number;
}): CostBreakdownResult {
  const dailyRate = DAILY_RATE[params.boxType];
  const boxRentalCost = dailyRate * params.numberOfBoxes * params.rentalDays;
  const energyCost = params.estimatedEnergyKwh * ENERGY_COST_PER_KWH;
  const pickupDeliveryCost = params.hasPickupDelivery ? PICKUP_DELIVERY_FEE : 0;
  const cleaningCost = params.hasCleaning
    ? CLEANING_FEE_PER_BOX * params.numberOfBoxes
    : 0;
  const lateReturnFee =
    dailyRate * LATE_RETURN_PENALTY * params.numberOfBoxes * params.lateReturnDays;

  return {
    boxRentalCost,
    energyCost,
    pickupDeliveryCost,
    cleaningCost,
    lateReturnFee,
    totalCost:
      boxRentalCost + energyCost + pickupDeliveryCost + cleaningCost + lateReturnFee,
  };
}

// ─── Impact metrics ───────────────────────────────────────────────────────────

const FOOD_LOSS_RATE: Record<SpoilageRisk, number> = {
  Low: 0.05,
  Medium: 0.03,
  High: 0.01,
};

const CO2E_PER_KG_FOOD = 2.5;        // kg CO2e per kg food waste avoided
const COST_PER_KG_FOOD_IDR = 20_000; // IDR / kg
const CONVENTIONAL_KWH_PER_KG = 0.8; // kWh per kg in conventional full-room cooling
const FRESHBOX_KWH_PER_KG = 0.35;    // kWh per kg in FreshBox optimized unit

export function calculateImpact(
  products: ProductBatch[],
  spoilageRiskMap: Record<string, SpoilageRisk>
): ImpactMetrics {
  let kgFoodProtected = 0;
  let kgFoodLossAvoided = 0;
  let energySavedKwh = 0;

  for (const product of products) {
    const risk = spoilageRiskMap[product.id] || "Medium";
    const lossRate = FOOD_LOSS_RATE[risk];
    const avoided = product.quantityKg * lossRate;

    kgFoodProtected += product.quantityKg;
    kgFoodLossAvoided += avoided;

    // Energy saved = difference between conventional and FreshBox energy usage
    energySavedKwh +=
      product.quantityKg * (CONVENTIONAL_KWH_PER_KG - FRESHBOX_KWH_PER_KG);
  }

  return {
    kgFoodProtected: Math.round(kgFoodProtected * 10) / 10,
    kgFoodLossAvoided: Math.round(kgFoodLossAvoided * 10) / 10,
    co2eAvoided: Math.round(kgFoodLossAvoided * CO2E_PER_KG_FOOD * 10) / 10,
    energySavedKwh: Math.round(energySavedKwh * 10) / 10,
    costLossAvoided: Math.round(kgFoodLossAvoided * COST_PER_KG_FOOD_IDR),
  };
}

// ─── Average temperature compliance ──────────────────────────────────────────

export function calcTemperatureCompliance(
  readings: number[],
  minTemp: number,
  maxTemp: number
): number {
  if (readings.length === 0) return 100;
  const inRange = readings.filter((t) => t >= minTemp && t <= maxTemp).length;
  return Math.round((inRange / readings.length) * 100);
}
