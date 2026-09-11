export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  locationSource: 'DEVICE_GPS' | 'DISTRICT_FALLBACK';
  timestamp: string;
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
