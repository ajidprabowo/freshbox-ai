// lib/recommendationFallback.ts — Rule-based cold-chain recommendations
// Used when Gemini API key is missing or request fails

import { ProductCategory, Recommendation, SpoilageRisk, AirflowLevel } from "./types";

interface FallbackRule {
  recommendedTemperature: string;
  recommendedHumidity: string;
  airflowLevel: AirflowLevel;
  storageDurationLimit: string;
  spoilageRisk: SpoilageRisk;
  handlingRecommendation: string;
  energyOptimizationTip: string;
  reasoningSummary: string;
}

const CATEGORY_RULES: Record<ProductCategory, FallbackRule> = {
  Tomatoes: {
    recommendedTemperature: "10–13°C",
    recommendedHumidity: "85–90% RH",
    airflowLevel: "Medium",
    storageDurationLimit: "5–7 days",
    spoilageRisk: "Low",
    handlingRecommendation:
      "Store away from ethylene-producing fruits. Avoid sub-10°C (chilling injury risk). Check daily for soft spots or mold.",
    energyOptimizationTip:
      "Maintain steady 11°C rather than cycling. Pre-cool box 1 hour before loading.",
    reasoningSummary:
      "Tomatoes are chilling-sensitive. Moderate humidity prevents skin shrinkage while inhibiting mold. Medium airflow distributes temperature evenly without over-drying.",
  },
  "Leafy Vegetables": {
    recommendedTemperature: "0–5°C",
    recommendedHumidity: "90–95% RH",
    airflowLevel: "High",
    storageDurationLimit: "3–5 days",
    spoilageRisk: "Medium",
    handlingRecommendation:
      "High priority for fast dispatch. Keep near-freezing to slow respiration. Use moisture-retaining packaging. Dispatch within 4 days.",
    energyOptimizationTip:
      "Use vacuum-sealed bags to reduce humidity load on cooling system. Pre-chill at 2°C before sealing batch.",
    reasoningSummary:
      "Leafy vegetables have high respiration rates and lose quality rapidly. Near-freezing temperatures and high humidity are critical for cell structure preservation.",
  },
  Seafood: {
    recommendedTemperature: "0–2°C",
    recommendedHumidity: "75–90% RH",
    airflowLevel: "High",
    storageDurationLimit: "2–3 days",
    spoilageRisk: "High",
    handlingRecommendation:
      "Maintain near-freezing at all times. Dispatch within 48 hours. Avoid temperature fluctuations. Ensure FIFO rotation.",
    energyOptimizationTip:
      "Pre-ice box 2 hours before loading. Use vacuum insulation panels. Monitor door open events closely.",
    reasoningSummary:
      "Fresh seafood is highly perishable due to bacterial growth and enzymatic decomposition. Near-freezing is mandatory. High airflow ensures cold permeation through fish mass.",
  },
  Dairy: {
    recommendedTemperature: "0–5°C",
    recommendedHumidity: "70–85% RH",
    airflowLevel: "Medium",
    storageDurationLimit: "7–14 days",
    spoilageRisk: "Low",
    handlingRecommendation:
      "Stable temperature required — avoid fluctuations above 2°C. Store milk away from strong-smelling items. Check seals before storage.",
    energyOptimizationTip:
      "Consistent temperature more important than minimum. Avoid frequent door opening. Group similar items to reduce air exchange.",
    reasoningSummary:
      "Dairy products require stable cold temperatures to prevent curdling and bacterial growth. Lower humidity prevents surface moisture that leads to mold on soft cheeses.",
  },
  Meat: {
    recommendedTemperature: "0–4°C",
    recommendedHumidity: "75–85% RH",
    airflowLevel: "High",
    storageDurationLimit: "3–5 days",
    spoilageRisk: "High",
    handlingRecommendation:
      "Strict temperature control mandatory. Store raw meat separately from ready-to-eat products. Use food-grade absorbent pads. FIFO strictly.",
    energyOptimizationTip:
      "High airflow reduces surface moisture which harbors bacteria. Pre-chill box to 1°C before loading.",
    reasoningSummary:
      "Meat requires near-freezing temperatures to control bacterial growth (Salmonella, Listeria). Moderate humidity maintains product weight without excess moisture.",
  },
  "Tropical Fruit": {
    recommendedTemperature: "10–15°C",
    recommendedHumidity: "80–90% RH",
    airflowLevel: "Medium",
    storageDurationLimit: "5–10 days",
    spoilageRisk: "Low",
    handlingRecommendation:
      "Avoid chilling injury — do not go below 10°C. Separate ethylene-sensitive items. Inspect for bruising before storage.",
    energyOptimizationTip:
      "Use natural shade in warehouse during pre-cooling. Medium airflow prevents surface moisture accumulation on skin.",
    reasoningSummary:
      "Tropical fruits like mango, banana, and papaya are chilling-sensitive. Temperatures below 10°C cause irreversible skin blackening and loss of flavor.",
  },
  "Frozen Food": {
    recommendedTemperature: "-18°C",
    recommendedHumidity: "Low — minimal",
    airflowLevel: "Low",
    storageDurationLimit: "30–90 days",
    spoilageRisk: "Low",
    handlingRecommendation:
      "⚠️ MVP Note: FreshBox is optimized for chilled mode (0–15°C). Frozen mode at -18°C has limited battery efficiency in current units. Ensure extended battery or plug-in power.",
    energyOptimizationTip:
      "Ensure box is fully loaded to minimize air volume. Pre-freeze contents before loading to reduce thermal load.",
    reasoningSummary:
      "Frozen food requires sub-zero temperatures. This MVP supports chilled mode primarily; frozen mode is experimental and requires additional power supply planning.",
  },
  Other: {
    recommendedTemperature: "4–8°C",
    recommendedHumidity: "80–90% RH",
    airflowLevel: "Medium",
    storageDurationLimit: "Validate manually",
    spoilageRisk: "Medium",
    handlingRecommendation:
      "Product type is unclassified. Apply food safety best practices. Validate temperature requirements with product supplier.",
    energyOptimizationTip:
      "Default moderate cooling applied. Adjust based on product-specific requirements.",
    reasoningSummary:
      "Generic cold storage recommendation applied. Manual validation required for accurate microclimate settings.",
  },
};

/** Calculate spoilage risk based on shelf life vs transit duration */
function adjustSpoilageRisk(
  baseRisk: SpoilageRisk,
  shelfLifeDays: number,
  storageDays: number
): SpoilageRisk {
  const ratio = storageDays / shelfLifeDays;
  if (ratio > 0.7) return "High";
  if (ratio > 0.4) return baseRisk === "Low" ? "Medium" : "High";
  return baseRisk;
}

export function generateFallbackRecommendation(params: {
  productBatchId: string;
  productCategory: ProductCategory;
  quantityKg: number;
  estimatedShelfLifeDays: number;
  dateStored: string;
  expectedDeliveryDate: string;
}): Omit<Recommendation, "id"> {
  const rule = CATEGORY_RULES[params.productCategory];

  // Calculate storage duration
  const start = new Date(params.dateStored);
  const end = new Date(params.expectedDeliveryDate);
  const storageDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );

  const adjustedRisk = adjustSpoilageRisk(
    rule.spoilageRisk,
    params.estimatedShelfLifeDays,
    storageDays
  );

  return {
    productBatchId: params.productBatchId,
    recommendedTemperature: rule.recommendedTemperature,
    recommendedHumidity: rule.recommendedHumidity,
    airflowLevel: rule.airflowLevel,
    storageDurationLimit: rule.storageDurationLimit,
    spoilageRisk: adjustedRisk,
    handlingRecommendation: rule.handlingRecommendation,
    energyOptimizationTip: rule.energyOptimizationTip,
    reasoningSummary: rule.reasoningSummary,
    generatedAt: new Date().toISOString(),
    source: "Fallback",
  };
}
