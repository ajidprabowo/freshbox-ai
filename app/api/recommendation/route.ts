// app/api/recommendation/route.ts — Server-side Gemini API integration
// GEMINI_API_KEY is never exposed to the browser

import { NextRequest, NextResponse } from "next/server";
import { generateFallbackRecommendation } from "@/lib/recommendationFallback";
import { ProductCategory } from "@/lib/types";

interface RecommendationRequest {
  productBatchId: string;
  productName: string;
  productCategory: ProductCategory;
  quantityKg: number;
  estimatedShelfLifeDays: number;
  dateStored: string;
  expectedDeliveryDate: string;
  usageMode: string;
  assignedBoxId: string;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Default to gemini-3.5-flash as specified; configurable via env var
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

function buildGeminiPrompt(req: RecommendationRequest): string {
  return `You are an expert cold-chain food storage specialist. Generate practical microclimate recommendations for the following product batch stored in a FreshBox AI cold box unit.

Product Details:
- Product Name: ${req.productName}
- Category: ${req.productCategory}
- Quantity: ${req.quantityKg} kg
- Estimated Shelf Life: ${req.estimatedShelfLifeDays} days
- Date Stored: ${req.dateStored}
- Expected Delivery Date: ${req.expectedDeliveryDate}
- Usage Mode: ${req.usageMode}
- Assigned Box ID: ${req.assignedBoxId}

Respond ONLY with a valid JSON object (no markdown, no backticks, no explanation). Use exactly this schema:
{
  "recommendedTemperature": "string — temperature range in °C",
  "recommendedHumidity": "string — humidity range in % RH",
  "airflowLevel": "Low | Medium | High",
  "storageDurationLimit": "string — recommended max storage duration",
  "spoilageRisk": "Low | Medium | High",
  "handlingRecommendation": "string — practical handling advice",
  "energyOptimizationTip": "string — energy efficiency tip",
  "reasoningSummary": "string — brief scientific reasoning"
}`;
}

export async function POST(req: NextRequest) {
  let body: RecommendationRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // If no API key, return fallback immediately
  if (!GEMINI_API_KEY) {
    const fallback = generateFallbackRecommendation({
      productBatchId: body.productBatchId,
      productCategory: body.productCategory,
      quantityKg: body.quantityKg,
      estimatedShelfLifeDays: body.estimatedShelfLifeDays,
      dateStored: body.dateStored,
      expectedDeliveryDate: body.expectedDeliveryDate,
    });
    return NextResponse.json({ ...fallback, source: "Fallback" });
  }

  // Try Gemini API
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildGeminiPrompt(body) }] }],
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

    // Attempt to parse the JSON response from Gemini
    // Strip any accidental markdown code fences
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate required fields exist
    const required = [
      "recommendedTemperature",
      "recommendedHumidity",
      "airflowLevel",
      "storageDurationLimit",
      "spoilageRisk",
      "handlingRecommendation",
      "energyOptimizationTip",
      "reasoningSummary",
    ];
    for (const field of required) {
      if (!(field in parsed)) throw new Error(`Missing field: ${field}`);
    }

    return NextResponse.json({
      productBatchId: body.productBatchId,
      ...parsed,
      generatedAt: new Date().toISOString(),
      source: "AI",
    });
  } catch (err) {
    // Gemini failed — use rule-based fallback gracefully
    console.error("Gemini API error, using fallback:", err);
    const fallback = generateFallbackRecommendation({
      productBatchId: body.productBatchId,
      productCategory: body.productCategory,
      quantityKg: body.quantityKg,
      estimatedShelfLifeDays: body.estimatedShelfLifeDays,
      dateStored: body.dateStored,
      expectedDeliveryDate: body.expectedDeliveryDate,
    });
    return NextResponse.json({ ...fallback, source: "Fallback" });
  }
}
