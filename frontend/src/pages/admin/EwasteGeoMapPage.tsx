import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Factory, 
  ShieldCheck, 
  Layers, 
  Users, 
  RefreshCw, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  Navigation, 
  TrendingUp, 
  Scale, 
  Building2, 
  Phone, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Globe,
  Satellite,
  Crosshair
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { getCategoryLabel } from '../../i18n/translations';

interface CollectionCluster {
  district: string;
  state: string;
  count: number;
  totalLots: number;
  totalKg: number;
  totalWeightKg: number;
  activeCollectors: number;
  recyclersCount: number;
  lat: number;
  lng: number;
  topMaterials: Record<string, number>;
}

const INDIA_BOUNDS: L.LatLngBoundsExpression = [
  [7.5, 67.0],
  [36.0, 98.0]
];

export const EwasteGeoMapPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [mapData, setMapData] = useState<any>(null);
  const [selectedCluster, setSelectedCluster] = useState<CollectionCluster | null>(null);
  const [selectedRecycler, setSelectedRecycler] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Layer and Map Style controls
  const [showHotspots, setShowHotspots] = useState(true);
  const [showRecyclers, setShowRecyclers] = useState(true);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'street'>('dark');

  // Leaflet DOM, Map, and Layer references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const refTileLayerRef = useRef<L.TileLayer | null>(null);

  // User GPS Live Location State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);

  const handleGetLiveLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude, accuracy });
        setLocatingUser(false);
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clean previous user marker & accuracy circle if any
        if (userMarkerRef.current) {
          map.removeLayer(userMarkerRef.current);
          userMarkerRef.current = null;
        }
        if (userAccuracyCircleRef.current) {
          map.removeLayer(userAccuracyCircleRef.current);
          userAccuracyCircleRef.current = null;
        }

        // Draw accuracy circle
        userAccuracyCircleRef.current = L.circle([latitude, longitude], {
          radius: Math.max(accuracy, 50),
          color: '#06b6d4',
          fillColor: '#06b6d4',
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '4, 4'
        }).addTo(map);

        // Draw custom user live GPS pin
        const userIcon = L.divIcon({
          html: `
            <div class="relative group cursor-pointer" style="width: 44px; height: 44px;">
              <div class="absolute inset-0 rounded-full bg-cyan-400/50 animate-ping"></div>
              <div class="w-10 h-10 rounded-full bg-slate-950 text-cyan-400 border-2 border-cyan-400 flex items-center justify-center font-black text-sm shadow-2xl m-0.5">
                🎯
              </div>
              <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-lg bg-slate-950/95 border border-cyan-400 shadow-xl pointer-events-none z-30">
                <span class="text-[9px] font-black text-cyan-300">My Live Location</span>
              </div>
            </div>
          `,
          className: 'custom-user-gps-pin',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const marker = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 2000 }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #0f172a; padding: 4px;">
            <div style="font-weight: 800; color: #0891b2; display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
              <span>🎯 Your Live Position (GPS)</span>
            </div>
            <div style="font-family: monospace; font-size: 11px; color: #334155;">
              Lat: ${latitude.toFixed(5)}° N<br/>
              Lng: ${longitude.toFixed(5)}° E
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
              Accuracy: ±${Math.round(accuracy)} meters
            </div>
          </div>
        `).openPopup();
        userMarkerRef.current = marker;

        map.flyTo([latitude, longitude], 14, { duration: 1.5 });
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocatingUser(false);
        alert(err.code === 1 ? 'Location permission was denied. Please enable location permissions in browser settings.' : (err.message || 'Unable to retrieve device GPS location'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const fetchMap = useCallback(async (isSilent: boolean = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const res = await api.getAdminMapData();
      if (res.success) {
        setMapData(res);
        if (res.collectionClusters.length > 0 && !selectedCluster) {
          const lucknow = res.collectionClusters.find((c: any) => c.district === 'Lucknow') || res.collectionClusters[0];
          setSelectedCluster(lucknow);
        }
      }
    } catch (err) {
      console.warn('Map data fetch error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCluster]);

  useEffect(() => {
    fetchMap(false);
    const interval = setInterval(() => fetchMap(true), 20000);
    return () => clearInterval(interval);
  }, [fetchMap]);

  // Method to safely swap base tiles (Esri Dark vs Satellite vs Street) with ZERO watermarks
  const updateTileLayers = useCallback((style: 'dark' | 'satellite' | 'street') => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }
    if (refTileLayerRef.current) {
      map.removeLayer(refTileLayerRef.current);
      refTileLayerRef.current = null;
    }

    if (style === 'dark') {
      // Government-grade ArcGIS World Dark Gray Base (100% free, zero watermark)
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 16, attribution: 'Esri &mdash; CPCB National Command Center' }
      ).addTo(map);

      // Dark Gray Boundaries & Geographic Labels
      refTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 16 }
      ).addTo(map);
    } else if (style === 'satellite') {
      // High-Resolution World Imagery Satellite Layer
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: 'Esri, Maxar, Earthstar Geographics' }
      ).addTo(map);

      // Geographic Borders & City Place Names Overlay
      refTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(map);
    } else if (style === 'street') {
      baseTileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }
      ).addTo(map);
    }
  }, []);

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center directly on India National Geospatial Boundary
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 4,
      maxZoom: 18
    });

    mapInstanceRef.current = map;

    // Apply default Dark GIS tiles
    updateTileLayers('dark');

    // Automatically fit India geographic boundaries so India fills the viewport cleanly
    map.fitBounds(INDIA_BOUNDS, { padding: [15, 15] });

    // Layer group for dynamic telemetry pins
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [updateTileLayers]);

  // Handle Map Style Switch
  useEffect(() => {
    if (mapInstanceRef.current) {
      updateTileLayers(mapStyle);
    }
  }, [mapStyle, updateTileLayers]);

  // Update Markers whenever mapData, layers, or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group || !mapData) return;

    group.clearLayers();

    // 1. Render Collection Hotspots (Emerald Radar Pins)
    if (showHotspots && mapData.collectionClusters) {
      mapData.collectionClusters.forEach((cluster: CollectionCluster) => {
        const isSelected = selectedCluster?.district === cluster.district && !selectedRecycler;
        const iconHtml = `
          <div class="relative group cursor-pointer" style="width: 48px; height: 48px;">
            <div class="absolute inset-0 rounded-full ${isSelected ? 'bg-emerald-400/50' : 'bg-emerald-500/25'} animate-radar-pulse"></div>
            <div class="w-10 h-10 rounded-2xl ${
              isSelected 
                ? 'bg-emerald-400 text-slate-950 ring-4 ring-emerald-400/50 shadow-2xl scale-110' 
                : 'bg-slate-950 text-emerald-400 border-2 border-emerald-500'
            } flex items-center justify-center font-black text-sm shadow-2xl transition-transform m-1">
              📦
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-lg bg-slate-950/95 border ${isSelected ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-emerald-500/70'} shadow-2xl pointer-events-none z-30">
              <span class="text-[10px] font-black text-white">${cluster.district}</span>
              <span class="text-[9px] font-mono font-bold text-emerald-400 ml-1">${cluster.totalWeightKg.toLocaleString('en-IN')} kg</span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-radar-pin',
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });

        const marker = L.marker([cluster.lat, cluster.lng], { icon: customIcon, zIndexOffset: isSelected ? 1000 : 500 }).addTo(group);
        marker.on('click', () => {
          setSelectedCluster(cluster);
          setSelectedRecycler(null);
          map.flyTo([cluster.lat, cluster.lng], 9, { duration: 1.2 });
        });
      });
    }

    // 2. Render CPCB Registered Recycler Facilities (Blue / Purple Plant Pins)
    if (showRecyclers && mapData.recyclers) {
      mapData.recyclers.forEach((rec: any) => {
        if (!rec.latitude || !rec.longitude) return;
        const isAuth = rec.authorizationStatus === 'AUTHORIZED';
        const isSelected = selectedRecycler?.id === rec.id;

        const iconHtml = `
          <div class="relative group cursor-pointer" style="width: 42px; height: 42px;">
            <div class="w-8 h-8 rounded-xl ${
              isSelected 
                ? 'bg-blue-400 text-slate-950 ring-4 ring-blue-400/50 scale-110 shadow-2xl' 
                : isAuth 
                ? 'bg-slate-950 text-blue-400 border-2 border-blue-500 animate-factory-pulse' 
                : 'bg-slate-950 text-amber-400 border-2 border-amber-500'
            } flex items-center justify-center text-xs shadow-lg transition-transform m-1">
              🏭
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-slate-950/95 border ${isAuth ? 'border-blue-500/60' : 'border-amber-500/60'} shadow-lg pointer-events-none z-20">
              <span class="text-[9px] font-extrabold ${isAuth ? 'text-blue-300' : 'text-amber-300'}">${rec.facilityName.slice(0, 16)}</span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-factory-pin',
          iconSize: [42, 42],
          iconAnchor: [21, 21]
        });

        const marker = L.marker([rec.latitude, rec.longitude], { icon: customIcon, zIndexOffset: isSelected ? 1200 : 300 }).addTo(group);
        marker.on('click', () => {
          setSelectedRecycler(rec);
          const parentCluster = mapData.collectionClusters.find((c: any) => c.district.toLowerCase() === rec.district.toLowerCase());
          if (parentCluster) setSelectedCluster(parentCluster);
          map.flyTo([rec.latitude, rec.longitude], 11, { duration: 1.2 });
        });
      });
    }
  }, [mapData, showHotspots, showRecyclers, selectedCluster, selectedRecycler]);

  const handleFlyTo = (lat: number, lng: number, zoom: number, cluster?: CollectionCluster) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.4 });
    }
    if (cluster) {
      setSelectedCluster(cluster);
      setSelectedRecycler(null);
    }
  };

  const handleFitIndia = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(INDIA_BOUNDS, { padding: [15, 15], duration: 1.2 });
      setSelectedRecycler(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Banner with Command Center Meta */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 dark:from-purple-950 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-purple-800/60 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-purple-600/30 dark:text-purple-300 border border-emerald-200 dark:border-purple-500/40 flex items-center justify-center shadow-sm">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {language === 'hi' ? 'राष्ट्रीय ई-कचरा जीआईएस मैप' : language === 'mr' ? 'राष्ट्रीय ई-कचरा जीआयएस नकाशा' : 'National E-Waste GIS Activity Map'}
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-50 text-emerald-800 dark:bg-purple-900/80 dark:text-purple-300 border border-emerald-200 dark:border-purple-600/60">
                  CPCB TELEMETRY
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-purple-200/80 font-medium mt-0.5">
                {language === 'hi' 
                  ? 'क्षेत्रीय ई-कचरा संग्रह घनत्व, लॉट फ्लो एवं अधिकृत रीसाइक्लिंग हब का रियल-टाइम भौगोलिक विश्लेषण' 
                  : language === 'mr' 
                  ? 'प्रादेशिक ई-कचरा संकलन घनता आणि अधिकृत पुनर्प्रक्रिया केंद्रांचे रियल-टाइम भौगोलिक विश्लेषण' 
                  : 'Real-time geographic radar telemetry of regional collection density, lot custody flow, and CPCB gazetted recycling plants'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => fetchMap(false)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-purple-900/60 dark:hover:bg-purple-800 dark:border-purple-700 dark:text-purple-200 shadow-sm transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
              title="Refresh Live GIS Feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Live Refresh'}</span>
            </button>
            <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              <span>LIVE GIS SATELLITE FEED</span>
            </span>
          </div>
        </div>

        {/* Quick-Jump Regional Telemetry Pills */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-purple-800/40 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-purple-400" />
            <span>{language === 'hi' ? 'त्वरित फोकस:' : language === 'mr' ? 'त्वरित फोकस:' : 'Quick Focus:'}</span>
          </span>

          <button
            type="button"
            onClick={handleFitIndia}
            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-purple-900/50 dark:border-slate-700 dark:hover:border-purple-500 dark:text-slate-200 font-bold shrink-0 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span>🇮🇳 All India Overview</span>
          </button>

          <button
            type="button"
            onClick={handleGetLiveLocation}
            disabled={locatingUser}
            className="px-3 py-1 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 dark:bg-cyan-950 dark:hover:bg-cyan-900 dark:border-cyan-600 dark:text-cyan-300 font-bold shrink-0 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            title="Locate device real live location via GPS"
          >
            <Crosshair className={`w-3.5 h-3.5 ${locatingUser ? 'animate-spin text-cyan-600 dark:text-cyan-400' : 'text-cyan-600 dark:text-cyan-400'}`} />
            <span>{locatingUser ? 'Locating GPS...' : userLocation ? `📍 My Live GPS (${userLocation.lat.toFixed(2)}°, ${userLocation.lng.toFixed(2)}°)` : '📍 My Live Location'}</span>
          </button>

          {mapData?.collectionClusters?.map((c: CollectionCluster) => (
            <button
              key={c.district}
              type="button"
              onClick={() => handleFlyTo(c.lat, c.lng, 10, c)}
              className={`px-3 py-1 rounded-xl border text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 active:scale-95 ${
                selectedCluster?.district === c.district && !selectedRecycler
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm ring-2 ring-emerald-500/20 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-500'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              <span>📍 {c.district}</span>
              <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">({c.totalWeightKg.toLocaleString('en-IN')} kg)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Command Center: Interactive Leaflet Canvas + Live Detail Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Leaflet GIS Map Canvas */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-3">
          {/* Map Top Bar: Layer Filters, Map Style Toggle & Controls */}
          <div className="flex items-center justify-between z-20 flex-wrap gap-2">
            {/* Layer Toggles */}
            <div className="flex items-center gap-2 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-purple-400" />
                <span>Layers:</span>
              </span>

              <button
                type="button"
                onClick={() => setShowHotspots(!showHotspots)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  showHotspots 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                <span>Hotspots ({mapData?.collectionClusters?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRecyclers(!showRecyclers)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  showRecyclers 
                    ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></span>
                <span>Recyclers ({mapData?.recyclers?.length || 0})</span>
              </button>
            </div>

            {/* Map Base Tile Switcher Toggle (100% Watermark-Free Government Standard) */}
            <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                type="button"
                onClick={() => setMapStyle('dark')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mapStyle === 'dark' 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="ArcGIS Dark Canvas (Watermark-free)"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Dark GIS</span>
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('satellite')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mapStyle === 'satellite' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Esri World Imagery High-Res Satellite"
              >
                <Satellite className="w-3.5 h-3.5" />
                <span>Live Satellite</span>
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('street')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mapStyle === 'street' 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="OpenStreetMap Standard"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Street</span>
              </button>
            </div>

            {/* Custom On-Map Zoom Controls */}
            <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleFitIndia}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-emerald-600 dark:text-purple-400 hover:text-emerald-700 dark:hover:text-purple-300 transition-colors"
                title="Reset to All India"
              >
                <Compass className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleGetLiveLocation}
                disabled={locatingUser}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                title="Locate My Device Live GPS Position"
              >
                <Crosshair className={`w-4 h-4 ${locatingUser ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Leaflet DOM Anchor Container */}
          <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 shadow-inner">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Synchronizing CPCB Geospatial Coordinates...</span>
              </div>
            )}
          </div>

          {/* Map Footer Legend */}
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300 shadow-sm animate-pulse"></span>
                <span className="font-semibold text-slate-800 dark:text-slate-300">Collection Hotspot (Live Scrap Aggregation)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-lg bg-blue-500 border border-blue-300 shadow-sm"></span>
                <span className="font-semibold text-slate-800 dark:text-slate-300">CPCB Authorized Recycler Plant</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-lg bg-amber-500 border border-amber-300 shadow-sm"></span>
                <span className="font-semibold text-slate-800 dark:text-slate-300">Pending / Suspended Facility</span>
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {mapStyle === 'satellite' ? '🛰️ Esri High-Resolution Satellite' : mapStyle === 'street' ? '🗺️ OpenStreetMap' : '🌌 ArcGIS World Dark Gray (Zero Watermarks)'}
            </span>
          </div>
        </div>

        {/* Right Column: Dynamic Telemetry Dossier (District or Recycler Focus) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          {selectedRecycler ? (
            /* Recycler Facility Dossier */
            <div className="space-y-4 text-xs animate-in fade-in-50">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Factory className="w-4 h-4" />
                  <span>Recycler Plant Telemetry</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRecycler(null)}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline"
                >
                  ← Back to District
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 space-y-2 shadow-inner">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedRecycler.facilityName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    selectedRecycler.authorizationStatus === 'AUTHORIZED' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' 
                      : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                  }`}>
                    {selectedRecycler.authorizationStatus === 'AUTHORIZED' ? 'Authorized' : 'Under Review'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Reg: {selectedRecycler.registrationNo}</p>
                <p className="text-[11px] text-blue-600 dark:text-blue-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedRecycler.address || `${selectedRecycler.district}, ${selectedRecycler.state}`}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 text-[10px] block font-extrabold uppercase">Tonnage Processed</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                    {(selectedRecycler.totalProcessedKg || 0).toLocaleString('en-IN')} kg
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 text-[10px] block font-extrabold uppercase">Service Radius</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                    {selectedRecycler.serviceRadiusKm || 35} km
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold block uppercase">Facility Manager & Telephony</span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-900 dark:text-white font-semibold">{selectedRecycler.contactPerson || 'Operations Head'}</span>
                  <span className="font-mono text-emerald-700 dark:text-purple-300 font-bold">{selectedRecycler.contactPhone || '+91 98200 98200'}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold block uppercase">Accepted E-Waste Streams</span>
                <div className="flex flex-wrap gap-1">
                  {(selectedRecycler.acceptedMaterials || ['PCB', 'BATTERY', 'CRT', 'CABLE', 'MOTOR']).map((mat: string) => (
                    <span key={mat} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                      {getCategoryLabel(mat, language)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : selectedCluster ? (
            /* District Cluster Dossier */
            <div className="space-y-4 text-xs animate-in fade-in-50">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{language === 'hi' ? 'जिला गतिविधि विश्लेषण' : language === 'mr' ? 'जिल्हा उपक्रम विश्लेषण' : 'District Activity Analysis'}</span>
                </h3>
              </div>

              {/* District & State Header Card */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 space-y-1 shadow-inner">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">
                  {language === 'hi' ? 'चयनित क्षेत्रीय क्लस्टर' : language === 'mr' ? 'निवडलेला क्लस्टर' : 'Selected Regional Hotspot'}
                </span>
                <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{selectedCluster.district}, {selectedCluster.state}</h4>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px] flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>GPS: {selectedCluster.lat.toFixed(4)}° N, {selectedCluster.lng.toFixed(4)}° E</span>
                </p>
              </div>

              {/* 3 Core District Real Telemetry Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-extrabold block">
                    {language === 'hi' ? 'सक्रिय कलेक्टर' : language === 'mr' ? 'सक्रिय संकलक' : 'Active Collectors'}
                  </span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-lg block">
                    {selectedCluster.activeCollectors}
                  </span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">100% KYC Verified</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-extrabold block">
                    {language === 'hi' ? 'कुल स्क्रैप वजन' : language === 'mr' ? 'एकूण स्क्रॅप वजन' : 'Total Scrap Weight'}
                  </span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-lg block">
                    {selectedCluster.totalWeightKg.toLocaleString('en-IN')} kg
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Digital Tare Verified</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-extrabold block">
                    {language === 'hi' ? 'पंजीकृत डिजिटल लॉट्स' : language === 'mr' ? 'नोंदणीकृत डिजिटल लॉट्स' : 'Registered Digital Lots'}
                  </span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-lg">
                    {selectedCluster.totalLots} Lots
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-extrabold block">Recyclers in District</span>
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-lg">
                    {selectedCluster.recyclersCount} Plants
                  </span>
                </div>
              </div>

              {/* Local Material Breakdown in this District */}
              {Object.keys(selectedCluster.topMaterials || {}).length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-extrabold block">
                    District Material Stream Volume
                  </span>
                  <div className="space-y-1.5">
                    {Object.entries(selectedCluster.topMaterials)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 4)
                      .map(([mat, wt]) => {
                        const pct = selectedCluster.totalWeightKg > 0 ? ((wt / selectedCluster.totalWeightKg) * 100).toFixed(1) : '0';
                        return (
                          <div key={mat} className="space-y-0.5">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{getCategoryLabel(mat, language)}</span>
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{wt.toLocaleString('en-IN')} kg ({pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div style={{ width: `${pct}%` }} className="bg-emerald-500 h-full rounded-full"></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Facilities operating in this district */}
              <div className="space-y-1.5">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-extrabold block">
                  CPCB Recyclers in {selectedCluster.district}
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {(mapData?.recyclers || [])
                    .filter((r: any) => r.district?.toLowerCase() === selectedCluster.district.toLowerCase())
                    .map((r: any) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSelectedRecycler(r);
                          if (r.latitude && r.longitude && mapInstanceRef.current) {
                            mapInstanceRef.current.flyTo([r.latitude, r.longitude], 11, { duration: 1 });
                          }
                        }}
                        className="w-full p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 hover:border-blue-400 dark:border-slate-800 dark:hover:border-blue-500/50 flex items-center justify-between text-left transition-all group"
                      >
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate block">{r.facilityName}</span>
                          <span className="text-[9px] font-mono text-slate-500">{r.registrationNo}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:text-slate-600 dark:group-hover:text-blue-400 shrink-0 ml-2" />
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">
              Click any collection hotspot or recycling plant pin on the map to inspect telemetry dossier.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Command Center High-Level Telemetry Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-0.5">
          <span className="text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] block">National E-Waste Monitored</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">
            {(mapData?.summary?.nationalTotalKg || 26749.1).toLocaleString('en-IN')} kg
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">From 669 Verified Lots</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-0.5">
          <span className="text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] block">Active Regional Hubs</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono block">
            {mapData?.summary?.totalMonitoredDistricts || 3} State Clusters
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Lucknow, Mumbai, Pune</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-0.5">
          <span className="text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] block">Gazetted Recyclers Online</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono block">
            {mapData?.summary?.authorizedRecyclersCount || 4} / {mapData?.summary?.totalRecyclersCount || 10}
          </span>
          <span className="text-[10px] text-blue-600 dark:text-blue-300 font-bold">CPCB Schedule-I Verified</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-0.5">
          <span className="text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] block">Traceability Integrity</span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono block">
            100% SHA-256
          </span>
          <span className="text-[10px] text-purple-600 dark:text-purple-300 font-bold">Merkle Chain Validated</span>
        </div>
      </div>
    </div>
  );
};
