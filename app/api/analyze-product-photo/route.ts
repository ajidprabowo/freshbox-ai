// app/api/analyze-product-photo/route.ts — Server-side product photo analysis API
// Uses Gemini API with vision capabilities if available
// GEMINI_API_KEY is never exposed to the browser

import { NextRequest, NextResponse } from "next/server";
import { ProductPhotoAnalysis } from "@/lib/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

/** Fallback response when Gemini is unavailable or fails */
function getFallbackAnalysis(): ProductPhotoAnalysis {
  return {
    detectedProduct: "Unknown",
    visualQuality: "Unknown",
    ripenessLevel: "Unknown",
    visibleRiskSigns: [],
    estimatedSpoilageRisk: "Unknown",
    handlingRecommendation:
      "AI photo analysis is unavailable. Product photo has been saved for documentation. Please perform manual inspection.",
    confidenceLevel: "Low",
    disclaimer:
      "AI photo analysis is an estimate and should be validated by human inspection.",
  };
}

interface AnalyzeRequest {
  image: string; // base64 data URL
  productName: string;
  category: string;
}

export async function POST(req: NextRequest) {
  let body: AnalyzeRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!body.image) {
    return NextResponse.json(
      { error: "No image provided" },
      { status: 400 }
    );
  }

  // If no API key, return fallback immediately
  if (!GEMINI_API_KEY) {
    return NextResponse.json({
      ...getFallbackAnalysis(),
      source: "Fallback",
    });
  }

  // Try Gemini API with vision
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    // Extract base64 data and mime type from data URL
    const dataUrlMatch = body.image.match(
      /^data:(image\/\w+);base64,(.+)$/
    );
    if (!dataUrlMatch) {
      throw new Error("Invalid image data URL format");
    }
    const mimeType = dataUrlMatch[1];
    const base64Data = dataUrlMatch[2];

    const prompt = `You are an expert food quality inspector. Analyze this product photo and provide a quality assessment.

Product context:
- Product Name: ${body.productName || "Unknown"}
- Category: ${body.category || "Unknown"}

Tasks:
1. Identify the product if visible in the photo.
2. Estimate the visual freshness condition.
3. Detect any visible spoilage signs (bruising, mold, soft spots, color inconsistency, wilting, etc.).
4. Recommend handling or storage action based on visual assessment.

Respond ONLY with a valid JSON object (no markdown, no backticks, no explanation). Use exactly this schema:
{
  "detectedProduct": "string — name of the detected product",
  "visualQuality": "Good | Moderate | Poor | Unknown",
  "ripenessLevel": "Unripe | Semi-ripe | Ripe | Overripe | Unknown",
  "visibleRiskSigns": ["array", "of", "visible", "risk", "signs"],
  "estimatedSpoilageRisk": "Low | Medium | High | Unknown",
  "handlingRecommendation": "string — practical advice",
  "confidenceLevel": "Low | Medium | High",
  "disclaimer": "AI photo analysis is an estimate and should be validated by human inspection."
}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
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

    const parsed: ProductPhotoAnalysis = JSON.parse(cleaned);

    // Validate required fields
    const required = [
      "detectedProduct",
      "visualQuality",
      "ripenessLevel",
      "visibleRiskSigns",
      "estimatedSpoilageRisk",
      "handlingRecommendation",
      "confidenceLevel",
      "disclaimer",
    ];
    for (const field of required) {
      if (!(field in parsed)) throw new Error(`Missing field: ${field}`);
    }

    return NextResponse.json({ ...parsed, source: "AI" });
  } catch (err) {
    // Gemini failed (model may not support images, API error, etc.)
    console.error(
      "Gemini API error for photo analysis, using fallback:",
      err
    );
    return NextResponse.json({
      ...getFallbackAnalysis(),
      source: "Fallback",
    });
  }
}
