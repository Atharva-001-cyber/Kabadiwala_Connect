export type UserRole = 'COLLECTOR' | 'RECYCLER' | 'ADMIN';
export type Language = 'hi' | 'mr' | 'en';

export type MaterialCategory = 
  | 'PCB' 
  | 'BATTERY' 
  | 'CRT' 
  | 'LCD' 
  | 'CABLE' 
  | 'MOTOR' 
  | 'MAGNET' 
  | 'MIXED_PLASTIC';

export type LotCondition = 'INTACT' | 'DAMAGED' | 'DISMANTLED';
export type SourceType = 'HOUSEHOLD' | 'COMMERCIAL' | 'REPAIR_SHOP' | 'SCRAP_HEAP';

export type LotStatus = 
  | 'CREATED'
  | 'OFFER_RECEIVED'
  | 'ACCEPTED'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'RECEIVED'
  | 'PROCESSING'
  | 'RECYCLED';

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type PickupStatus = 'SCHEDULED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
export type RecyclerAuthStatus = 'AUTHORIZED' | 'PENDING_VERIFICATION' | 'EXPIRED' | 'SUSPENDED' | 'CPCB_REGISTRY_VERIFIED';
export type AnomalyType = 'PRICE_OUTLIER' | 'WEIGHT_MISMATCH' | 'REPEATED_SUSPICIOUS' | 'UNVERIFIED_RECYCLER';
export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type AnomalyStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
export type DisputeStatus = 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED' | 'ESCALATED';
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

// Real Data Transparency Types
export type DataSource = 'SEED' | 'LIVE';
export type LocationSource = 'DEVICE_GPS' | 'DISTRICT_FALLBACK' | 'DEMO_SEED' | 'OFFLINE_SAVED';
export type PriceSourceType = 'ADMIN_BENCHMARK' | 'RECYCLER_OFFER' | 'TRANSACTION_SETTLED';
export type RecyclerAuthorizationSource = 'PLATFORM_MANAGED' | 'CPCB_GAZETTE_VERIFIED' | 'GOVERNMENT_API';
export type PaymentRecordType = 'DIGITAL_LEDGER_VOUCHER' | 'EXTERNAL_GATEWAY_SETTLEMENT' | 'EXTERNAL_BANK_PAYOUT';
export type ExternalGatewayStatus = 'NOT_CONNECTED' | 'INITIATED' | 'SUCCESS' | 'CONNECTED' | 'SIMULATED';

export type KycStatus = 'KYC_PENDING' | 'KYC_VERIFIED' | 'NOT_SUBMITTED';

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  language: Language;
  name: string;
  kycStatus?: KycStatus;
  createdAt: string;
}

export interface CollectorProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  district: string;
  state: string;
  totalEarnings: number;
  totalWeightCollected: number;
  lotsCount: number;
  preferredPaymentMethod: PaymentMethod;
  upiId?: string;
  kycStatus?: KycStatus;
  kycMaskedId?: string;
  createdAt: string;
  dataSource?: DataSource;
}

export interface RecyclerProfile {
  id: string;
  userId: string;
  facilityName: string;
  registrationNo: string;
  authorizationStatus: RecyclerAuthStatus;
  authorizationSource: RecyclerAuthorizationSource;
  authValidUntil: string;
  contactPerson: string;
  contactPhone: string;
  district: string;
  state: string;
  address: string;
  latitude: number;
  longitude: number;
  acceptedMaterials: MaterialCategory[];
  pickupAvailable: boolean;
  serviceRadiusKm: number;
  baseOfferedRates: Record<MaterialCategory, number>; // in ₹/kg
  rating: number;
  totalProcessedKg: number;
  minQuantityKg?: number;
  operatingHours?: string;
  matchScore?: number;
  offeredRate?: number;
  estimatedGrossValue?: number;
  estimatedDistanceKm?: number;
  rankingExplanation?: RecyclerRankingExplanation;
  pickupVsSelfDelivery?: PickupVsDeliveryEconomics;
  createdAt: string;
  dataSource?: DataSource;
}

export interface RecyclerRankingExplanation {
  materialScore: number;
  authScore: number;
  rateScore: number;
  pickupScore: number;
  distanceScore: number;
  compositeScore: number;
  method: 'EXPLAINABLE_MULTI_CRITERIA_SCORING';
  reasons: { hi: string; mr: string; en: string }[];
}

export interface PickupVsDeliveryEconomics {
  doorstepPickup: {
    available: boolean;
    transportCostDeduction: number;
    netRatePerKg: number;
    estimatedNetAmount: number;
    notice?: string;
  };
  selfDelivery: {
    available: boolean;
    transportCostDeduction: number | null;
    netRatePerKg: number | null;
    estimatedNetAmount: number | null;
    notice: string;
  };
}

export interface OfficialCpcbRecyclerRecord {
  registrationNo: string;
  facilityName: string;
  state: string;
  district: string;
  address: string;
  authorizedCapacityMTA: number;
  validUntil: string;
  categoriesAuthorized: MaterialCategory[];
}

export interface Lot {
  id: string; // e.g. EW-LKO-2026-000125
  clientLotId?: string; // For offline sync idempotency
  collectorId: string;
  collectorName: string;
  collectorPhone: string;
  materialCategory: MaterialCategory;
  subCategory: string;
  description: string;
  imageUrl: string;
  imageUrls?: string[];
  approxWeight: number; // in kg
  actualWeight?: number; // Measured on scale at handover
  condition: LotCondition;
  sourceType: SourceType;
  locationDistrict: string;
  locationState: string;
  latitude?: number;
  longitude?: number;
  locationSource?: LocationSource;
  estimatedValueMin: number;
  estimatedValueMax: number;
  estimatedValueAvg: number;
  quotedPrice?: number;
  finalSaleValue?: number;
  selectedRecyclerId?: string;
  selectedOfferId?: string;
  handoverOtp?: string;
  status: LotStatus;
  dataSource?: DataSource;
  createdAt: string;
  updatedAt: string;
}

export interface OfflineLotItem {
  id?: number;
  clientLotId: string;
  materialCategory: MaterialCategory;
  subCategory?: string;
  approxWeight: number;
  condition: LotCondition;
  sourceType: SourceType;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  locationDistrict?: string;
  locationState?: string;
  estimatedValueMin?: number;
  estimatedValueMax?: number;
  estimatedValueAvg?: number;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  createdAt: string;
}

export interface Offer {
  id: string;
  lotId: string;
  recyclerId: string;
  recyclerName: string;
  recyclerDistrict: string;
  recyclerPhone: string;
  offeredRatePerKg: number;
  totalOfferedPrice: number;
  pickupOffered: boolean;
  pickupEtaHours?: number;
  notes?: string;
  status: OfferStatus;
  dataSource?: DataSource;
  createdAt: string;
}

export interface Pickup {
  id: string;
  lotId: string;
  recyclerId: string;
  collectorId: string;
  scheduledDate: string;
  timeSlot: string;
  driverName: string;
  driverContact: string;
  vehicleNumber: string;
  status: PickupStatus;
  notes?: string;
  createdAt: string;
}

export interface HandoverRecord {
  id: string; // HO-2026-XXXX
  lotId: string;
  recyclerId: string;
  recyclerName?: string;
  collectorId: string;
  approxWeight: number;
  initialEstimatedWeight?: number;
  actualWeight: number;
  weightDifference: number; // actual - approx
  weightDiffPercentage: number;
  proofImageUrl?: string;
  signatureImageUrl?: string;
  handoverOtp: string;
  gpsLocation?: { lat: number; lng: number };
  locationSource: LocationSource;
  deviceAccuracyMeters?: number;
  formattedAddress?: string;
  verifiedByRecyclerName: string;
  paymentMethod: PaymentMethod;
  paymentRecordType: PaymentRecordType;
  externalGatewayStatus: ExternalGatewayStatus;
  finalPaymentAmount: number;
  timestamp: string;
}

export interface TraceabilityLog {
  id: string;
  lotId: string;
  stage: 'COLLECTED' | 'PICKUP_DONE' | 'RECYCLER_RECEIVED' | 'SORTED' | 'PROCESSING' | 'RECOVERED' | 'RECYCLED';
  title: string;
  description: string;
  facilityLocation: string;
  actorRole: UserRole;
  actorName: string;
  timestamp: string;
  proofUrl?: string;
  dataSource?: DataSource;
  previousEventHash?: string;
  payloadHash?: string;
  eventHash?: string;
}

export interface PriceRecord {
  id: string;
  materialCategory: MaterialCategory;
  subCategory: string;
  district: string;
  state: string;
  prevailingBuyPrice: number; // ₹/kg
  minPrice: number;
  maxPrice: number;
  priceChange7DaysPercent: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  unit: string;
  source: string;
  sourceType: PriceSourceType;
  dataSource: DataSource;
  audioText?: {
    hi: string;
    mr: string;
    en: string;
  };
  updatedAt: string;
}

export interface PriceLogEntry {
  id: string;
  materialCategory: MaterialCategory;
  subCategory: string;
  district: string;
  state: string;
  ratePerKg: number;
  source: string;
  sourceType: PriceSourceType;
  dataSource: DataSource;
  validationStatus?: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED';
  lotId?: string;
  observedAt: string;
}

export interface MLTrainingSample {
  id: string;
  lotId?: string;
  imagePath: string;
  initialHeuristicPrediction: MaterialCategory;
  userConfirmedCategory: MaterialCategory;
  isOverride: boolean;
  collectorId: string;
  district: string;
  timestamp: string;
}

export interface AnomalyFlag {
  id: string;
  lotId: string;
  collectorId: string;
  recyclerId?: string;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  description: string;
  detectedRate?: number;
  expectedRate?: number;
  weightDiffPercent?: number;
  statisticalZScore?: number;
  sampleMean?: number;
  sampleStdDev?: number;
  status: AnomalyStatus;
  createdAt: string;
}

export interface Dispute {
  id: string;
  lotId: string;
  raisedByUserId: string;
  raisedByRole: UserRole;
  raisedByName: string;
  reason: string;
  details: string;
  status: DisputeStatus;
  adminNotes?: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface PaymentLedgerEntry {
  id: string;
  lotId: string;
  collectorId: string;
  recyclerId: string;
  recyclerName: string;
  materialCategory: MaterialCategory;
  weight: number;
  ratePerKg: number;
  amount: number;
  paymentMethod: PaymentMethod;
  recordType: PaymentRecordType;
  payoutStatus?: 'SETTLED_IN_LEDGER' | 'CASH_PAID' | 'EXTERNAL_PAYMENT_PENDING' | 'ACTUAL_EXTERNAL_PAYMENT' | 'PENDING';
  externalGatewayStatus: ExternalGatewayStatus;
  status: PaymentStatus;
  transactionRef: string;
  dataSource: DataSource;
  timestamp: string;
}
