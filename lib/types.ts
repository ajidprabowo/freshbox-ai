// lib/types.ts — Core data models for FreshBox AI

export type BoxType = "S" | "M" | "L";
export type BoxLocation = "Warehouse" | "Truck";
export type BoxStatus = "Available" | "Rented" | "Maintenance";
export type UsageMode = "Storage" | "Distribution" | "Storage + Distribution";
export type QualityGrade = "A" | "B" | "C";
export type SpoilageRisk = "Low" | "Medium" | "High";
export type AirflowLevel = "Low" | "Medium" | "High";

export interface FreshBox {
  id: string;
  type: BoxType;
  location: BoxLocation;
  status: BoxStatus;
  batteryLevel: number;        // 0–100 %
  temperature: number;          // current °C
  humidity: number;             // current % RH
  minTemp: number;              // supported range min
  maxTemp: number;              // supported range max
  lastSanitized: string;        // ISO date string
  rentalPricePerDay: number;    // IDR
  assignedProductId?: string;
  assignedRentalId?: string;
}

export interface Rental {
  id: string;
  userName: string;
  boxId: string;
  startDate: string;
  endDate: string;
  usageMode: UsageMode;
  pickupLocation: string;
  destinationLocation: string;
  status: "Active" | "Completed" | "Cancelled";
  createdAt: string;
}

export type ProductCategory =
  | "Tomatoes"
  | "Leafy Vegetables"
  | "Seafood"
  | "Dairy"
  | "Meat"
  | "Tropical Fruit"
  | "Frozen Food"
  | "Other";

export interface ProductBatch {
  id: string;
  productName: string;
  category: ProductCategory;
  batchId: string;
  quantityKg: number;
  origin: string;
  destination: string;
  dateStored: string;
  expectedDeliveryDate: string;
  estimatedShelfLifeDays: number;
  assignedBoxId: string;
  qualityGrade: QualityGrade;
  createdAt: string;
  recommendationId?: string;
  /** Base64 data URL of the product photo (stored compressed in localStorage) */
  productPhoto?: string;
  /** AI-generated photo analysis results */
  photoAnalysis?: ProductPhotoAnalysis;
  /** ISO date string when photo was uploaded */
  photoUploadedAt?: string;
}

// ─── Product Photo Analysis ─────────────────────────────────────────────────

export interface ProductPhotoAnalysis {
  detectedProduct: string;
  visualQuality: "Good" | "Moderate" | "Poor" | "Unknown";
  ripenessLevel: "Unripe" | "Semi-ripe" | "Ripe" | "Overripe" | "Unknown";
  visibleRiskSigns: string[];
  estimatedSpoilageRisk: "Low" | "Medium" | "High" | "Unknown";
  handlingRecommendation: string;
  confidenceLevel: "Low" | "Medium" | "High";
  disclaimer: string;
}

// ─── Box Recommendation ─────────────────────────────────────────────────────

export type ProductSensitivity = "Low" | "Medium" | "High";

export interface BoxRecommendationInput {
  productCategory: ProductCategory;
  productName: string;
  totalWeightKg: number;
  estimatedVolumeLiters?: number;
  storageDuration: number;
  usageMode: UsageMode;
  pickupLocation: string;
  destinationLocation: string;
  requiredDeliveryDate: string;
  productSensitivity: ProductSensitivity;
  needBatteryBackup: boolean;
  needGpsTracking: boolean;
}

export interface BoxRecommendationResult {
  recommendedBoxType: "FreshBox S" | "FreshBox M" | "FreshBox L";
  recommendedQuantity: number;
  estimatedCapacityUsed: string;
  utilizationRate: string;
  estimatedRentalCost: string;
  microclimateSummary: string;
  usageModeRecommendation: string;
  alternativeOption: string;
  reasoningSummary: string;
  warning?: string;
}

export interface Recommendation {
  id: string;
  productBatchId: string;
  recommendedTemperature: string;
  recommendedHumidity: string;
  airflowLevel: AirflowLevel;
  storageDurationLimit: string;
  spoilageRisk: SpoilageRisk;
  handlingRecommendation: string;
  energyOptimizationTip: string;
  reasoningSummary: string;
  generatedAt: string;
  source: "AI" | "Fallback";
}

export interface MonitoringData {
  boxId: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  batteryLevel: number;
  doorOpen: boolean;
  gpsActive: boolean;
  coolingActive: boolean;
  spoilageRisk: SpoilageRisk;
  remainingSafeHours: number;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  boxId: string;
  type: "TempOutOfRange" | "HumidityOutOfRange" | "DoorOpen" | "BatteryLow" | "SpoilageRisk";
  message: string;
  severity: "Warning" | "Critical";
  timestamp: string;
  acknowledged: boolean;
}

export interface Invoice {
  id: string;
  rentalId: string;
  boxType: BoxType;
  numberOfBoxes: number;
  rentalDays: number;
  usageMode: UsageMode;
  estimatedEnergyKwh: number;
  hasPickupDelivery: boolean;
  hasCleaning: boolean;
  lateReturnDays: number;
  boxRentalCost: number;
  energyCost: number;
  pickupDeliveryCost: number;
  cleaningCost: number;
  lateReturnFee: number;
  totalCost: number;
  createdAt: string;
}

export interface ImpactMetrics {
  kgFoodProtected: number;
  kgFoodLossAvoided: number;
  co2eAvoided: number;          // kg CO2e
  energySavedKwh: number;
  costLossAvoided: number;      // IDR
}
