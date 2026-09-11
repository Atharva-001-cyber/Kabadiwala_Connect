/**
 * Reverse Geocoding Service (OpenStreetMap Nominatim with Local Cache)
 * SIH 2026 Problem Statement #229
 * 
 * Complies with OSM Nominatim Usage Policy:
 * - Max 1 request per second
 * - Descriptive User-Agent header
 * - Local in-memory caching (24h TTL)
 * - Transparent fallback to District Centroid if network/rate-limit fails
 */

interface GeocodeCacheEntry {
  displayName: string;
  locality?: string;
  district?: string;
  state?: string;
  timestamp: number;
}

export class GeocodingService {
  private cache: Map<string, GeocodeCacheEntry> = new Map();
  private lastRequestTime: number = 0;
  private minIntervalMs: number = 1100; // Enforce Nominatim 1 req/sec policy

  private getCacheKey(lat: number, lng: number): string {
    // Round to 3 decimal places (~110m resolution) for cache sharing
    return `${lat.toFixed(3)},${lng.toFixed(3)}`;
  }

  public async reverseGeocode(
    latitude: number, 
    longitude: number, 
    fallbackDistrict: string = 'Lucknow'
  ): Promise<{
    displayName: string;
    locality?: string;
    district: string;
    state: string;
    source: 'OSM_NOMINATIM' | 'DISTRICT_FALLBACK';
    cached: boolean;
  }> {
    const key = this.getCacheKey(latitude, longitude);
    const cached = this.cache.get(key);

    // 1. Return from local cache if within 24 hours
    if (cached && (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000)) {
      return {
        displayName: cached.displayName,
        locality: cached.locality,
        district: cached.district || fallbackDistrict,
        state: cached.state || 'Uttar Pradesh',
        source: 'OSM_NOMINATIM',
        cached: true
      };
    }

    // 2. Throttle to satisfy Nominatim usage policy (1 req/sec)
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise(resolve => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();

    // 3. Attempt live Nominatim reverse geocode
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=16`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'KabadiwalaConnect-SIH2026/1.0 (sih2026.kabadiwala@gov.in)',
          'Accept-Language': 'hi,en'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const address = data.address || {};
          const locality = address.suburb || address.neighbourhood || address.residential || address.road;
          const district = address.state_district || address.city || address.county || fallbackDistrict;
          const state = address.state || 'Uttar Pradesh';

          const entry: GeocodeCacheEntry = {
            displayName: data.display_name,
            locality,
            district,
            state,
            timestamp: Date.now()
          };
          this.cache.set(key, entry);

          return {
            displayName: data.display_name,
            locality,
            district,
            state,
            source: 'OSM_NOMINATIM',
            cached: false
          };
        }
      }
    } catch (err: any) {
      console.warn('Nominatim reverse geocoding unreachable, using district fallback:', err.message);
    }

    // 4. Honest fallback to District Centroid without fabricating false addresses
    return {
      displayName: `${fallbackDistrict}, Uttar Pradesh (District Centroid)`,
      district: fallbackDistrict,
      state: 'Uttar Pradesh',
      source: 'DISTRICT_FALLBACK',
      cached: false
    };
  }
}

export const geocodingService = new GeocodingService();
