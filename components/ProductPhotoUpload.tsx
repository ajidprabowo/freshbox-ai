"use client";

import { useState, useRef, useCallback } from "react";
import {
  Camera,
  Upload,
  X,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  ImageIcon,
  RefreshCw,
} from "lucide-react";
import { ProductPhotoAnalysis } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProductPhotoUploadProps {
  photo: string | undefined;
  photoAnalysis: ProductPhotoAnalysis | undefined;
  onPhotoChange: (photo: string | undefined) => void;
  onAnalysisComplete: (analysis: ProductPhotoAnalysis) => void;
  productName: string;
  category: string;
}

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ─── Image Compression ─────────────────────────────────────────────────────
// Resize and compress image to reduce localStorage usage.
// NOTE: For MVP, images are stored as base64 in localStorage.
// This has practical limits (~2-5 MB per image after compression).
// A production app should use cloud storage (S3, GCS, etc.).

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let { width, height } = img;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG quality 0.7 for reasonable file size
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// ─── Analysis Badge Colors ──────────────────────────────────────────────────

const QUALITY_COLORS: Record<string, string> = {
  Good: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Moderate: "text-amber-700 bg-amber-50 border-amber-200",
  Poor: "text-red-700 bg-red-50 border-red-200",
  Unknown: "text-slate-600 bg-slate-50 border-slate-200",
};

const RIPENESS_COLORS: Record<string, string> = {
  Unripe: "text-lime-700 bg-lime-50 border-lime-200",
  "Semi-ripe": "text-yellow-700 bg-yellow-50 border-yellow-200",
  Ripe: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Overripe: "text-orange-700 bg-orange-50 border-orange-200",
  Unknown: "text-slate-600 bg-slate-50 border-slate-200",
};

const RISK_COLORS: Record<string, string> = {
  Low: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Medium: "text-amber-700 bg-amber-50 border-amber-200",
  High: "text-red-700 bg-red-50 border-red-200",
  Unknown: "text-slate-600 bg-slate-50 border-slate-200",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  Low: "text-slate-600 bg-slate-50 border-slate-200",
  Medium: "text-sky-700 bg-sky-50 border-sky-200",
  High: "text-purple-700 bg-purple-50 border-purple-200",
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ProductPhotoUpload({
  photo,
  photoAnalysis,
  onPhotoChange,
  onAnalysisComplete,
  productName,
  category,
}: ProductPhotoUploadProps) {
  const [error, setError] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError("");

      // Validate file type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(
          "Invalid file type. Please upload JPG, PNG, or WebP images only."
        );
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError(
          `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 3 MB.`
        );
        return;
      }

      setUploading(true);
      try {
        const compressed = await compressImage(file);
        onPhotoChange(compressed);
      } catch {
        setError("Failed to process image. Please try a different file.");
      } finally {
        setUploading(false);
      }
    },
    [onPhotoChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleAnalyze = async () => {
    if (!photo) return;
    setAnalyzing(true);

    try {
      const resp = await fetch("/api/analyze-product-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: photo,
          productName,
          category,
        }),
      });

      if (!resp.ok) throw new Error("API error");
      const data = await resp.json();
      onAnalysisComplete(data);
    } catch {
      // Show fallback message if API fails
      onAnalysisComplete({
        detectedProduct: "Unknown",
        visualQuality: "Unknown",
        ripenessLevel: "Unknown",
        visibleRiskSigns: [],
        estimatedSpoilageRisk: "Unknown",
        handlingRecommendation:
          "AI photo analysis is unavailable. Product photo has been saved for documentation.",
        confidenceLevel: "Low",
        disclaimer:
          "AI photo analysis is an estimate and should be validated by human inspection.",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Camera size={14} className="text-navy-500" />
          <span className="text-sm font-bold text-navy-700">
            Product Photo
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Upload a product photo to document initial quality. Advanced AI
          analysis can estimate visible freshness and spoilage risk.
        </p>
      </div>

      {/* Upload Area */}
      {!photo ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-navy-400 hover:bg-slate-50 transition-colors"
        >
          {uploading ? (
            <Loader2
              size={28}
              className="text-navy-500 animate-spin mx-auto mb-2"
            />
          ) : (
            <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <ImageIcon size={24} className="text-slate-400" />
            </div>
          )}
          <p className="text-sm font-semibold text-slate-600">
            {uploading
              ? "Processing image…"
              : "Drop an image here or click to upload"}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            JPG, PNG, or WebP · Max 3 MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Image Preview */}
          <div className="relative rounded-xl overflow-hidden border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt="Product photo preview"
              className="w-full h-48 object-cover"
            />
            {/* Overlay controls */}
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                title="Replace photo"
              >
                <RefreshCw size={14} className="text-slate-600" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onPhotoChange(undefined);
                  setError("");
                }}
                className="w-8 h-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                title="Remove photo"
              >
                <X size={14} className="text-red-500" />
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Analyze Button */}
          {!photoAnalysis && (
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-150 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {analyzing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Analyzing Photo…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Analyze Product Photo with AI
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertTriangle
            size={14}
            className="text-red-500 flex-shrink-0 mt-0.5"
          />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Analysis Result */}
      {photoAnalysis && <PhotoAnalysisResult analysis={photoAnalysis} />}
    </div>
  );
}

// ─── Analysis Result Display ────────────────────────────────────────────────
// Exported so it can be reused in Reports page

export function PhotoAnalysisResult({
  analysis,
  compact,
}: {
  analysis: ProductPhotoAnalysis;
  compact?: boolean;
}) {
  const hasRealData = analysis.visualQuality !== "Unknown";

  return (
    <div
      className={`${
        compact ? "" : "bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4"
      } space-y-3`}
    >
      {!compact && (
        <div className="flex items-center gap-2">
          <span
            className={`badge text-[10px] ${
              hasRealData
                ? "text-purple-700 bg-purple-50 border-purple-200"
                : "text-slate-600 bg-slate-50 border-slate-200"
            }`}
          >
            {hasRealData ? (
              <>
                <Sparkles size={10} /> AI Analysis
              </>
            ) : (
              <>
                <Info size={10} /> Fallback
              </>
            )}
          </span>
          {analysis.detectedProduct !== "Unknown" && (
            <span className="text-xs text-slate-500">
              Detected: {analysis.detectedProduct}
            </span>
          )}
        </div>
      )}

      {/* Badges Grid */}
      <div className="grid grid-cols-2 gap-2">
        <AnalysisBadge
          label="Visual Quality"
          value={analysis.visualQuality}
          colorMap={QUALITY_COLORS}
        />
        <AnalysisBadge
          label="Ripeness"
          value={analysis.ripenessLevel}
          colorMap={RIPENESS_COLORS}
        />
        <AnalysisBadge
          label="Spoilage Risk"
          value={analysis.estimatedSpoilageRisk}
          colorMap={RISK_COLORS}
        />
        <AnalysisBadge
          label="Confidence"
          value={analysis.confidenceLevel}
          colorMap={CONFIDENCE_COLORS}
        />
      </div>

      {/* Risk Signs */}
      {analysis.visibleRiskSigns.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Visible Risk Signs
          </p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.visibleRiskSigns.map((sign, i) => (
              <span
                key={i}
                className="badge text-[10px] text-amber-700 bg-amber-50 border-amber-200"
              >
                <AlertTriangle size={9} /> {sign}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Handling recommendation */}
      {analysis.handlingRecommendation && (
        <div className="bg-white/60 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Handling Recommendation
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">
            {analysis.handlingRecommendation}
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-1.5">
        <Info size={10} className="text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-400 italic">
          {analysis.disclaimer}
        </p>
      </div>
    </div>
  );
}

// ─── Analysis Badge ─────────────────────────────────────────────────────────

function AnalysisBadge({
  label,
  value,
  colorMap,
}: {
  label: string;
  value: string;
  colorMap: Record<string, string>;
}) {
  const color =
    colorMap[value] || "text-slate-600 bg-slate-50 border-slate-200";

  return (
    <div
      className={`rounded-xl border p-2.5 text-center ${color}`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wider opacity-70">
        {label}
      </p>
      <p className="text-sm font-extrabold mt-0.5">{value}</p>
    </div>
  );
}
