// app/api/box-recommendation/route.ts — Server-side box recommendation API
// Uses Gemini API if available, falls back to rule-based engine
// GEMINI_API_KEY is never exposed to the browser

import { NextRequest, NextResponse } from "next/server";
import { generateBoxRecommendation } from "@/lib/boxRecommendation";
import { BoxRecommendationInput, BoxRecommendationResult } from "@/lib/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

function buildPrompt(input: BoxRecommendationInput): string {
  return `You are an expert cold-chain logistics consultant for FreshBox AI, a modular cold box rental system.

Given the following user requirements, recommend the optimal FreshBox configuration.

FreshBox Specifications:
- FreshBox S: 70 L usable volume, 25 kg payload, Rp75,000/day. Best for small batch, last-mile, sample product.
- FreshBox M: 165 L usable volume, 60 kg payload, Rp120,000/day. Best for standard storage and distribution.
- FreshBox L: 750 L usable volume, 250 kg payload, Rp200,000/day. Best for warehouse and large batch.

User Requirements:
- Product Category: ${input.productCategory}
- Product Name: ${input.productName}
- Total Weight: ${input.totalWeightKg} kg
- Estimated Volume: ${input.estimatedVolumeLiters ? `${input.estimatedVolumeLiters} L` : "Not specified (estimate from weight)"}
- Storage Duration: ${input.storageDuration} days
- Usage Mode: ${input.usageMode}
- Pickup Location: ${input.pickupLocation}
- Destination Location: ${input.destinationLocation}
- Required Delivery Date: ${input.requiredDeliveryDate}
- Product Sensitivity: ${input.productSensitivity}
- Need Battery Backup: ${input.needBatteryBackup ? "Yes" : "No"}
- Need GPS Tracking: ${input.needGpsTracking ? "Yes" : "No"}

Respond ONLY with a valid JSON object (no markdown, no backticks, no explanation). Use exactly this schema:
{
  "recommendedBoxType": "FreshBox S | FreshBox M | FreshBox L",
  "recommendedQuantity": number,
  "estimatedCapacityUsed": "string — e.g. 180 kg / 180 kg",
  "utilizationRate": "string — e.g. 100%",
  "estimatedRentalCost": "string — e.g. Rp720,000 for 2 days",
  "microclimateSummary": "string — brief microclimate advice for this product",
  "usageModeRecommendation": "string — advice on usage mode",
  "alternativeOption": "string — describe an alternative box configuration",
  "reasoningSummary": "string — brief reasoning for the recommendation",
  "warning": "string | null — any warnings about special product handling"
}`;
}

export async function POST(req: NextRequest) {
  let body: BoxRecommendationInput;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  // If no API key, return rule-based recommendation immediately
  if (!GEMINI_API_KEY) {
    const result = generateBoxRecommendation(body);
    return NextResponse.json({ ...result, source: "Fallback" });
  }

  // Try Gemini API
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(body) }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API returned ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Strip any accidental markdown code fences
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed: BoxRecommendationResult = JSON.parse(cleaned);

    // Validate required fields
    const required = [
      "recommendedBoxType",
      "recommendedQuantity",
      "estimatedCapacityUsed",
      "utilizationRate",
      "estimatedRentalCost",
      "microclimateSummary",
      "usageModeRecommendation",
      "alternativeOption",
      "reasoningSummary",
    ];
    for (const field of required) {
      if (!(field in parsed)) throw new Error(`Missing field: ${field}`);
    }

    return NextResponse.json({ ...parsed, source: "AI" });
  } catch (err) {
    // Gemini failed — use rule-based fallback gracefully
    console.error("Gemini API error for box recommendation, using fallback:", err);
    const result = generateBoxRecommendation(body);
    return NextResponse.json({ ...result, source: "Fallback" });
  }
}
