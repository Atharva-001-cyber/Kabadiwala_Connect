import { offlineDb } from './db';
import {
  Lot,
  PriceRecord,
  RecyclerProfile,
  Offer,
  Pickup,
  HandoverRecord,
  TraceabilityLog,
  OfflineLotItem,
  MaterialCategory
} from '../types';

const BASE_URL = '/api';

export const getAuthToken = () => localStorage.getItem('sih_kabadi_token') || '';
export const setAuthToken = (token: string) => localStorage.setItem('sih_kabadi_token', token);
export const removeAuthToken = () => localStorage.removeItem('sih_kabadi_token');

const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Server error' }));
    throw new Error(errorBody.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export const api = {
  // Auth
  sendOtp: (data: { phone: string; role?: string; language?: string; name?: string }) =>
    request<{ success: boolean; message: string; demoOtp?: string; expiresInSeconds: number }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  verifyOtp: (data: { phone: string; otp: string; selectedRole?: string; language?: string; name?: string; district?: string }) =>
    request<{ success: boolean; token: string; user: any; collectorProfile: any; recyclerProfile: any }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getMe: () => request<{ success: boolean; user: any; collectorProfile: any; recyclerProfile: any }>('/auth/me'),

  updateLanguage: (language: string) =>
    request<{ success: boolean; language: string }>('/auth/language', {
      method: 'PATCH',
      body: JSON.stringify({ language })
    }),

  updateProfile: (data: { name?: string; district?: string; state?: string; preferredPaymentMethod?: string; upiId?: string }) =>
    request<{ success: boolean; user: any; collectorProfile: any; recyclerProfile: any }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  // Lots
  getLots: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ success: boolean; count: number; lots: Lot[] }>(`/lots?${query}`);
  },

  getLotById: (id: string) =>
    request<{ success: boolean; lot: Lot; offers: Offer[]; pickup?: Pickup; handover?: HandoverRecord; traceability: TraceabilityLog[] }>(`/lots/${id}`),

  createLot: async (lotData: any): Promise<{ success: boolean; lot: Lot; message: string; valuation: any }> => {
    try {
      const res = await request<{ success: boolean; lot: Lot; message: string; valuation: any }>('/lots', {
        method: 'POST',
        body: JSON.stringify(lotData)
      });
      return res;
    } catch (err) {
      // Offline fallback: save to Dexie offline queue
      console.warn('Network unavailable, saving lot to offline IndexedDB queue...', err);
      const clientLotId = lotData.clientLotId || `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const photoUrls: string[] = Array.isArray(lotData.imageUrls) && lotData.imageUrls.length > 0
        ? lotData.imageUrls.filter((u: any) => typeof u === 'string' && u.length > 0)
        : (lotData.imageUrl ? [lotData.imageUrl] : []);
      const primaryImageUrl = photoUrls[0] || lotData.imageUrl || '';

      const offlineItem: OfflineLotItem = {
        clientLotId,
        materialCategory: lotData.materialCategory,
        subCategory: lotData.subCategory || `${lotData.materialCategory} Item`,
        description: lotData.description || '',
        imageUrl: primaryImageUrl,
        imageUrls: photoUrls,
        approxWeight: parseFloat(lotData.approxWeight || '0'),
        condition: lotData.condition || 'INTACT',
        sourceType: lotData.sourceType || 'HOUSEHOLD',
        locationDistrict: lotData.locationDistrict || 'Lucknow',
        locationState: lotData.locationState || 'Uttar Pradesh',
        estimatedValueMin: 0,
        estimatedValueMax: 0,
        createdAt: new Date().toISOString(),
        syncStatus: 'PENDING'
      };

      await offlineDb.offlineLots.put(offlineItem);

      const mockOfflineLot: Lot = {
        id: clientLotId,
        clientLotId,
        collectorId: 'local_collector',
        collectorName: (() => {
          try {
            const stored = localStorage.getItem('user');
            if (stored) return JSON.parse(stored)?.name || 'Authorized Collector';
          } catch { /* fallback */ }
          return 'Authorized Collector';
        })(),
        collectorPhone: '',
        materialCategory: lotData.materialCategory,
        subCategory: offlineItem.subCategory || '',
        description: offlineItem.description || '',
        imageUrl: primaryImageUrl,
        imageUrls: photoUrls,
        approxWeight: offlineItem.approxWeight,
        condition: offlineItem.condition,
        sourceType: offlineItem.sourceType,
        locationDistrict: offlineItem.locationDistrict || 'Lucknow',
        locationState: offlineItem.locationState || 'Uttar Pradesh',
        estimatedValueMin: 500,
        estimatedValueMax: 750,
        estimatedValueAvg: 625,
        status: 'CREATED',
        dataSource: 'LIVE',
        createdAt: offlineItem.createdAt,
        updatedAt: offlineItem.createdAt
      };

      return {
        success: true,
        message: 'Saved locally on phone. Will sync automatically when online.',
        lot: mockOfflineLot,
        valuation: { min: 500, max: 750, avg: 625 }
      };
    }
  },

  syncOfflineBatch: (lots: OfflineLotItem[]) =>
    request<{ success: boolean; syncedCount: number; lots: Lot[] }>('/lots/sync-batch', {
      method: 'POST',
      body: JSON.stringify({ lots })
    }),

  // Prices
  getPriceBoard: async (district: string = 'Lucknow') => {
    try {
      const res = await request<{ success: boolean; district: string; prices: PriceRecord[] }>(`/prices/board?district=${district}`);
      // Cache to IndexedDB
      if (res.prices && res.prices.length > 0) {
        await offlineDb.cachedPrices.bulkPut(res.prices).catch(() => {});
      }
      return res;
    } catch (err) {
      // Read from IndexedDB cache if offline
      const cached = await offlineDb.cachedPrices.toArray();
      if (cached.length > 0) {
        return { success: true, district, prices: cached };
      }
      throw err;
    }
  },

  getPriceHistory: (category: MaterialCategory, days: number = 30, district: string = 'Lucknow') =>
    request<{ 
      success: boolean; 
      category: string; 
      district: string; 
      basePrice: number; 
      isSynthetic: boolean; 
      dataSource: string; 
      observedTrend: string; 
      trendPercent: number; 
      hasSufficientData: boolean; 
      dataPoints: number; 
      history: any[] 
    }>(`/prices/history?category=${category}&days=${days}&district=${encodeURIComponent(district)}`),

  estimateLotValue: (data: { materialCategory: MaterialCategory; weight: number; condition?: string; district?: string }) =>
    request<{
      success: boolean;
      materialCategory: MaterialCategory;
      weight: number;
      condition: string;
      district: string;
      estimatedValue: { min: number; max: number; avg: number; ratePerKg: number; formula: string };
      recyclerQuotedPrice: { offerId: string; offeredRatePerKg: number; totalQuotedAmount: number; recyclerName: string; status: string } | null;
      finalSaleBenchmark: { settledAmount: number; settledWeight: number; effectiveRatePerKg: number; transactionRef: string; timestamp: string } | null;
      disclaimer: { hi: string; mr: string; en: string };
    }>('/prices/estimate', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Recyclers
  getRecyclers: async (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    try {
      const res = await request<{ success: boolean; count: number; recyclers: RecyclerProfile[] }>(`/recyclers?${query}`);
      if (res.recyclers && res.recyclers.length > 0) {
        await offlineDb.cachedRecyclers.bulkPut(res.recyclers).catch(() => {});
      }
      return res;
    } catch (err) {
      const cached = await offlineDb.cachedRecyclers.toArray();
      return { success: true, count: cached.length, recyclers: cached };
    }
  },

  getRecyclerById: (id: string) =>
    request<{ success: boolean; recycler: RecyclerProfile }>(`/recyclers/${id}`),

  updateRecyclerAuthStatus: (id: string, authorizationStatus: string) =>
    request<{ success: boolean; message: string; recycler: RecyclerProfile }>(`/recyclers/${id}/auth-status`, {
      method: 'PATCH',
      body: JSON.stringify({ authorizationStatus })
    }),

  // Offers
  createOffer: (data: { lotId: string; offeredRatePerKg: number; pickupOffered?: boolean; pickupEtaHours?: number; notes?: string }) =>
    request<{ success: boolean; message: string; offer: Offer }>('/offers', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  acceptOffer: (offerId: string) =>
    request<{ success: boolean; message: string; lot: Lot; offer: Offer }>(`/offers/${offerId}/accept`, {
      method: 'PATCH'
    }),

  requestRecyclerQuote: (lotId: string, recyclerId: string) =>
    request<{ success: boolean; message: string; offer: Offer; isExisting: boolean }>('/offers/request-quote', {
      method: 'POST',
      body: JSON.stringify({ lotId, recyclerId })
    }),

  compareOffersForLot: (lotId: string) =>
    request<{
      success: boolean;
      lot: Lot;
      offersCount: number;
      offers: any[];
      priceConceptNotice: { hi: string; mr: string; en: string };
    }>(`/offers/compare/${lotId}`),

  // Pickups
  getPickups: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ success: boolean; count: number; pickups: Pickup[] }>(`/pickups?${query}`);
  },

  schedulePickup: (data: any) =>
    request<{ success: boolean; message: string; pickup: Pickup; lot: Lot }>('/pickups/schedule', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Handover
  verifyHandover: (data: any) =>
    request<{ success: boolean; message: string; handover: HandoverRecord; payment: any; lot: Lot }>('/handovers/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getHandoverByLotId: (lotId: string) =>
    request<{ success: boolean; handover: HandoverRecord }>(`/handovers/lot/${lotId}`),

  // Traceability
  getTraceability: (lotId: string) =>
    request<{ success: boolean; lot: Lot; recycler?: RecyclerProfile; handover?: HandoverRecord; timeline: TraceabilityLog[]; currentStage: string }>(
      `/traceability/${lotId}`
    ),

  verifyTraceabilityIntegrity: (lotId: string) =>
    request<{ success: boolean; lotId: string; totalEvents: number; isTamperFree: boolean; compromisedEventId: string | null; failureReason: string | null; algorithm: string; auditChain: any[] }>(
      `/traceability/${lotId}/verify-integrity`
    ),

  updateProcessingStage: (data: any) =>
    request<{ success: boolean; message: string; lot: Lot; log: TraceabilityLog }>('/traceability/stage', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Recyclers & CPCB Registry
  searchCpcbRegistry: (query?: string) =>
    request<{ success: boolean; count: number; gazetteSource: string; records: any[] }>(
      `/recyclers/cpcb-registry?q=${encodeURIComponent(query || '')}`
    ),

  // Price Updates
  updateObservedPrice: (data: { materialCategory: string; subCategory?: string; district: string; state?: string; ratePerKg: number; source?: string; sourceType?: string }) =>
    request<{ success: boolean; message: string; logEntry: any }>('/prices/update', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // AI & Valuation
  classifyMaterial: async (formData: FormData) => {
    return request<{ success: boolean; imageUrl: string; classification?: any; prediction?: any; alternativeCategories?: string[] }>('/ai/classify', {
      method: 'POST',
      body: formData
    });
  },

  recordMLFeedback: (data: { lotId?: string; imagePath: string; initialHeuristicPrediction?: string; userConfirmedCategory: string; collectorId?: string; district?: string }) =>
    request<{ success: boolean; message: string; sampleId: string; totalSamplesCollected: number }>('/ai/feedback', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getInstantValuation: (data: { materialCategory: string; approxWeight: number; condition?: string; district?: string }) =>
    request<{ success: boolean; valuation: any }>('/ai/valuation', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Safety
  getSafetyGuides: () =>
    request<{ success: boolean; count: number; guides: any[] }>('/safety'),

  // Payments / Ledger
  getCollectorLedger: (collectorId?: string) =>
    request<{ success: boolean; collector: any; summary: any; transactions: any[] }>(`/payments/collector/${collectorId || ''}`),

  getRecyclerTransactions: (recyclerId?: string) =>
    request<{ success: boolean; summary: any; transactions: any[] }>(`/payments/recycler/${recyclerId || ''}`),

  // Admin
  getAdminKPIs: () =>
    request<{ success: boolean; kpis: any; materialBreakdown: Record<string, number> }>('/admin/kpis'),

  getAdminMapData: () =>
    request<{ success: boolean; recyclers: any[]; collectionClusters: any[] }>('/admin/map'),

  getAnomalies: () =>
    request<{ success: boolean; count: number; anomalies: any[] }>('/admin/anomalies'),

  updateAnomalyStatus: (id: string, status: string) =>
    request<{ success: boolean; message: string; anomaly: any }>(`/admin/anomalies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  getDisputes: () =>
    request<{ success: boolean; count: number; disputes: any[] }>('/admin/disputes'),

  updateDisputeStatus: (id: string, data: any) =>
    request<{ success: boolean; message: string; dispute: any }>(`/admin/disputes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  getMLTrainingExport: () =>
    request<{ success: boolean; manifest: any }>('/admin/datasets/export/ml-training')
};
