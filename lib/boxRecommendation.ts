// lib/boxRecommendation.ts — Rule-based box recommendation engine
// Works without Gemini API. Used as primary engine and as fallback when API fails.

import {
  BoxRecommendationInput,
  BoxRecommendationResult,
  ProductCategory,
} from "./types";

// ─── Box Specifications ─────────────────────────────────────────────────────

export interface BoxSpec {
  label: "FreshBox S" | "FreshBox M" | "FreshBox L";
  type: "S" | "M" | "L";
  usableVolumeLiters: number;
  payloadKg: number;
  rentalPricePerDay: number;
  bestFor: string;
}

export const BOX_SPECS: BoxSpec[] = [
  {
    label: "FreshBox S",
    type: "S",
    usableVolumeLiters: 70,
    payloadKg: 25,
    rentalPricePerDay: 75_000,
    bestFor: "Small batch, last-mile, sample product",
  },
  {
    label: "FreshBox M",
    type: "M",
    usableVolumeLiters: 165,
    payloadKg: 60,
    rentalPricePerDay: 120_000,
    bestFor: "Standard storage and distribution",
  },
  {
    label: "FreshBox L",
    type: "L",
    usableVolumeLiters: 750,
    payloadKg: 250,
    rentalPricePerDay: 200_000,
    bestFor: "Warehouse and large batch",
  },
];

// ─── Volume Estimation ──────────────────────────────────────────────────────
// Approximate liters per kg by product category (bulk density assumption)

const VOLUME_PER_KG: Record<ProductCategory, number> = {
  Tomatoes: 1.5,
  "Leafy Vegetables": 4.0,
  Seafood: 1.2,
  Dairy: 1.1,
  Meat: 1.1,
  "Tropical Fruit": 1.8,
  "Frozen Food": 1.3,
  Other: 1.5,
};

// ─── Microclimate Summaries ─────────────────────────────────────────────────

const MICROCLIMATE_SUMMARY: Record<ProductCategory, string> = {
  Tomatoes:
    "Tomatoes require moderate cooling (10–13°C) and should avoid excessive cold exposure to prevent chilling injury.",
  "Leafy Vegetables":
    "Leafy vegetables need near-freezing temperatures (0–5°C) with high humidity (90–95% RH) to slow respiration.",
  Seafood:
    "Seafood requires strict near-freezing storage (0–2°C) with high airflow. Dispatch within 48 hours.",
  Dairy:
    "Dairy products need stable cold temperatures (0–5°C) with moderate humidity. Avoid temperature fluctuations.",
  Meat:
    "Meat requires near-freezing temperatures (0–4°C) with strict temperature control. Store separately from ready-to-eat products.",
  "Tropical Fruit":
    "Tropical fruits are chilling-sensitive. Store at 10–15°C with 80–90% humidity. Do not go below 10°C.",
  "Frozen Food":
    "Frozen food requires -18°C. Note: FreshBox is optimized for chilled mode (0–15°C). Frozen mode is experimental.",
  Other:
    "Generic cold storage recommendation applied (4–8°C, 80–90% RH). Validate with product supplier.",
};

// ─── Usage Mode Recommendations ─────────────────────────────────────────────

function getUsageModeRecommendation(
  mode: string,
  hasRoute: boolean
): string {
  if (mode === "Storage + Distribution") {
    return "Use Storage + Distribution mode to maintain cold chain continuity from warehouse to delivery point.";
  }
  if (mode === "Distribution") {
    return hasRoute
      ? "Distribution mode is optimal for inter-city transit. Ensure battery backup for routes over 4 hours."
      : "Distribution mode selected. Battery backup recommended for extended transit.";
  }
  return "Storage mode is suitable for warehouse holding. Ensure box is connected to power for extended durations.";
}

// ─── Core Recommendation Logic ──────────────────────────────────────────────

export function generateBoxRecommendation(
  input: BoxRecommendationInput
): BoxRecommendationResult {
  const {
    productCategory,
    productName,
    totalWeightKg,
    storageDuration,
    usageMode,
    pickupLocation,
    destinationLocation,
    productSensitivity,
  } = input;

  // Step 1: Estimate volume if not provided
  const volumePerKg = VOLUME_PER_KG[productCategory] || 1.5;
  const totalVolume = input.estimatedVolumeLiters ?? totalWeightKg * volumePerKg;

  // Step 2: Determine best box type
  // Strategy: find the box where using the fewest units keeps utilization in the ideal range (60–100%)
  let bestSpec = BOX_SPECS[1]; // Default to M
  let bestQty = 1;
  let bestScore = Infinity;

  for (const spec of BOX_SPECS) {
    const qtyByWeight = Math.ceil(totalWeightKg / spec.payloadKg);
    const qtyByVolume = Math.ceil(totalVolume / spec.usableVolumeLiters);
    const qty = Math.max(qtyByWeight, qtyByVolume, 1);

    const weightUtil = totalWeightKg / (qty * spec.payloadKg);
    const volumeUtil = totalVolume / (qty * spec.usableVolumeLiters);
    const maxUtil = Math.max(weightUtil, volumeUtil);

    // Score: prefer utilization 70–90%. Penalize over 100% heavily.
    // Also penalize using too many small boxes (>6) or using L when weight < 30 kg
    let score = Math.abs(maxUtil - 0.8) * 10;
    if (maxUtil > 1.0) score += (maxUtil - 1.0) * 50; // over capacity penalty
    if (qty > 6) score += (qty - 6) * 5; // too many boxes penalty
    if (spec.type === "L" && totalWeightKg < 30) score += 10; // oversized for small load
    if (spec.type === "S" && totalWeightKg > 100) score += 8; // too many small boxes

    // For distribution mode, prefer modular M boxes over single L for flexibility
    if (usageMode !== "Storage" && spec.type === "M" && qty <= 5) {
      score -= 1;
    }

    if (score < bestScore) {
      bestScore = score;
      bestSpec = spec;
      bestQty = qty;
    }
  }

  // Step 3: Calculate utilization
  const totalPayload = bestQty * bestSpec.payloadKg;
  const totalBoxVolume = bestQty * bestSpec.usableVolumeLiters;
  const weightUtil = (totalWeightKg / totalPayload) * 100;
  const volumeUtil = (totalVolume / totalBoxVolume) * 100;
  const primaryUtil = Math.max(weightUtil, volumeUtil);

  // Step 4: Calculate cost
  const totalCost = bestQty * bestSpec.rentalPricePerDay * storageDuration;
  const formattedCost = `Rp${totalCost.toLocaleString("id-ID")} for ${storageDuration} day${storageDuration > 1 ? "s" : ""}`;

  // Step 5: Generate alternative option
  const altSpecs = BOX_SPECS.filter((s) => s.type !== bestSpec.type);
  let altOption = "No alternative available.";
  for (const alt of altSpecs) {
    const altQtyW = Math.ceil(totalWeightKg / alt.payloadKg);
    const altQtyV = Math.ceil(totalVolume / alt.usableVolumeLiters);
    const altQty = Math.max(altQtyW, altQtyV, 1);
    const altCost = altQty * alt.rentalPricePerDay * storageDuration;
    const altUtil = Math.max(
      totalWeightKg / (altQty * alt.payloadKg),
      totalVolume / (altQty * alt.usableVolumeLiters)
    ) * 100;

    if (altUtil <= 110) {
      const cheaper = altCost < totalCost ? " (lower cost)" : altCost > totalCost ? " (higher cost)" : "";
      altOption = `${altQty} ${alt.label} can also be used (${altUtil.toFixed(0)}% utilization${cheaper}), but ${bestQty} ${bestSpec.label} provides ${
        bestQty > 1 ? "better modular handling" : "a more compact solution"
      }.`;
      break;
    }
  }

  // Step 6: Generate warnings
  const warnings: string[] = [];
  if (primaryUtil > 100) {
    warnings.push("⚠️ Recommended configuration is slightly over capacity. Consider adding an extra unit.");
  }
  if (productCategory === "Frozen Food") {
    warnings.push("⚠️ FreshBox is optimized for chilled mode (0–15°C). Frozen food at -18°C requires extended battery or plug-in power.");
  }
  if (productSensitivity === "High") {
    warnings.push("⚠️ High-sensitivity product detected. Ensure continuous temperature monitoring and avoid door opening during transit.");
  }
  if (productCategory === "Seafood" && storageDuration > 2) {
    warnings.push("⚠️ Seafood storage beyond 2 days increases spoilage risk significantly. Consider dispatching sooner.");
  }
  if (productCategory === "Meat" && storageDuration > 4) {
    warnings.push("⚠️ Fresh meat storage beyond 4 days is not recommended without vacuum packaging.");
  }

  const hasRoute = pickupLocation.trim() !== "" && destinationLocation.trim() !== "";
  const routeStr = hasRoute
    ? `${pickupLocation}–${destinationLocation}`
    : "local storage";

  return {
    recommendedBoxType: bestSpec.label,
    recommendedQuantity: bestQty,
    estimatedCapacityUsed: `${totalWeightKg} kg / ${totalPayload} kg`,
    utilizationRate: `${primaryUtil.toFixed(0)}%`,
    estimatedRentalCost: formattedCost,
    microclimateSummary: MICROCLIMATE_SUMMARY[productCategory] || MICROCLIMATE_SUMMARY.Other,
    usageModeRecommendation: getUsageModeRecommendation(usageMode, hasRoute),
    alternativeOption: altOption,
    reasoningSummary: `${bestSpec.label} is recommended because each unit supports up to ${bestSpec.payloadKg} kg payload and ${bestSpec.usableVolumeLiters} L volume, making ${bestQty} unit${bestQty > 1 ? "s" : ""} suitable for ${totalWeightKg} kg ${productName} with ${storageDuration}-day ${usageMode.toLowerCase()} on route ${routeStr}.`,
    warning: warnings.length > 0 ? warnings.join("\n") : undefined,
  };
}
