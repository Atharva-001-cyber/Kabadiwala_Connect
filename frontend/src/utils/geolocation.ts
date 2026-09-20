export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  locationSource: 'DEVICE_GPS' | 'DISTRICT_FALLBACK';
  timestamp: string;
}

export interface ReverseGeocodeResult {
  city: string;
  district: string;
  state: string;
  formattedAddress: string;
}

/**
 * Request real device GPS location from browser with graceful district fallback
 */
export const getDeviceLocation = async (districtFallback = 'Lucknow'): Promise<LocationResult> => {
  const districtCentroids: Record<string, { lat: number; lng: number }> = {
    Lucknow: { lat: 26.8467, lng: 80.9462 },
    Pune: { lat: 18.5204, lng: 73.8567 },
    Nagpur: { lat: 21.1458, lng: 78.9876 },
    Delhi: { lat: 28.7041, lng: 77.1025 },
    Bengaluru: { lat: 12.9716, lng: 77.5946 }
  };

  const defaultCoords = districtCentroids[districtFallback] || { lat: 26.8467, lng: 80.9462 };

  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      latitude: defaultCoords.lat,
      longitude: defaultCoords.lng,
      locationSource: 'DISTRICT_FALLBACK',
      timestamp: new Date().toISOString()
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: parseFloat(position.coords.latitude.toFixed(6)),
          longitude: parseFloat(position.coords.longitude.toFixed(6)),
          accuracyMeters: Math.round(position.coords.accuracy),
          locationSource: 'DEVICE_GPS',
          timestamp: new Date(position.timestamp).toISOString()
        });
      },
      (error) => {
        console.warn('Geolocation permission denied or timed out, using district fallback:', error.message);
        resolve({
          latitude: defaultCoords.lat,
          longitude: defaultCoords.lng,
          locationSource: 'DISTRICT_FALLBACK',
          timestamp: new Date().toISOString()
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 30000
      }
    );
  });
};

/**
 * Reverse-geocode latitude and longitude into human-readable city, district, and state.
 * Multi-tier fail-safe:
 * Tier 1: Real-time OpenStreetMap Nominatim reverse geocode (with 2.5s timeout)
 * Tier 2: Mathematical nearest district centroid matcher (covering major Indian hubs including Barabanki, Lucknow, Kanpur, Pune, Delhi, Mumbai, Bengaluru, Nagpur, etc.)
 * Tier 3: High-precision coordinate string fallback
 */
export const reverseGeocodeCoordinates = async (
  lat: number,
  lng: number,
  lang: 'hi' | 'mr' | 'en' = 'hi'
): Promise<ReverseGeocodeResult> => {
  // Tier 1: OpenStreetMap Nominatim Free API with 2.5s timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { 'Accept-Language': lang === 'hi' ? 'hi' : lang === 'mr' ? 'mr' : 'en' }
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const district = addr.county || addr.state_district || addr.district || addr.city || addr.town || addr.suburb || 'District Area';
        const city = addr.city || addr.town || addr.village || addr.suburb || district;
        const state = addr.state || 'India';

        const placePart = city !== district ? `${city}, ${district}` : city;
        const formattedAddress = `${placePart}, ${state}`;

        return { city, district, state, formattedAddress };
      }
    }
  } catch (e) {
    console.warn('[Geolocation] Online reverse geocode timeout/offline, using centroid fallback:', e);
  }

  // Tier 2: Mathematical nearest centroid fallback (Coverage across India)
  const majorCities: Array<{ name: string; state: string; lat: number; lng: number }> = [
    { name: 'Barabanki', state: 'Uttar Pradesh', lat: 26.93, lng: 81.18 },
    { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.85, lng: 80.94 },
    { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.45, lng: 80.33 },
    { name: 'Ayodhya', state: 'Uttar Pradesh', lat: 26.79, lng: 82.20 },
    { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.32, lng: 82.97 },
    { name: 'Gorakhpur', state: 'Uttar Pradesh', lat: 26.76, lng: 83.37 },
    { name: 'Agra', state: 'Uttar Pradesh', lat: 27.18, lng: 78.01 },
    { name: 'Noida / Greater Noida', state: 'Uttar Pradesh', lat: 28.53, lng: 77.39 },
    { name: 'Delhi', state: 'Delhi / NCR', lat: 28.61, lng: 77.21 },
    { name: 'Pune', state: 'Maharashtra', lat: 18.52, lng: 73.85 },
    { name: 'Nagpur', state: 'Maharashtra', lat: 21.15, lng: 78.99 },
    { name: 'Mumbai', state: 'Maharashtra', lat: 19.07, lng: 72.87 },
    { name: 'Thane', state: 'Maharashtra', lat: 19.21, lng: 72.97 },
    { name: 'Nashik', state: 'Maharashtra', lat: 19.99, lng: 73.79 },
    { name: 'Bengaluru', state: 'Karnataka', lat: 12.97, lng: 77.59 },
    { name: 'Hyderabad', state: 'Telangana', lat: 17.38, lng: 78.48 },
    { name: 'Jaipur', state: 'Rajasthan', lat: 26.91, lng: 75.78 },
    { name: 'Kolkata', state: 'West Bengal', lat: 22.57, lng: 88.36 },
    { name: 'Chennai', state: 'Tamil Nadu', lat: 13.08, lng: 80.27 },
    { name: 'Ahmedabad', state: 'Gujarat', lat: 23.02, lng: 72.57 }
  ];

  let nearest = majorCities[0];
  let minDistanceSq = Number.MAX_VALUE;

  for (const c of majorCities) {
    const dLat = lat - c.lat;
    const dLng = lng - c.lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      nearest = c;
    }
  }

  // If distance is within ~1.2 degrees (~120km), use nearest city name
  if (minDistanceSq < 1.44) {
    return {
      city: nearest.name,
      district: nearest.name,
      state: nearest.state,
      formattedAddress: `${nearest.name}, ${nearest.state}`
    };
  }

  // Tier 3: Generic Region Coordinates Fallback
  return {
    city: 'Local Region',
    district: 'GPS Tagged Area',
    state: 'India',
    formattedAddress: `GPS Region (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`
  };
};
