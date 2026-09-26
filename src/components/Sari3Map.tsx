import React, { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import { Language, ThemeMode } from '../types';
import { reverseGeocode } from '../utils/reverseGeocoding';
import { calculateDistanceKm } from '../data/wilayas';
import { fetchOsrmRoute, OsrmRouteResult, RouteStep } from '../utils/osrmRouting';
import {
  Crosshair,
  Route,
  Clock,
  Maximize2,
  ChevronDown,
  ChevronUp,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  MapPin,
  Loader2,
  Navigation,
  Compass,
} from 'lucide-react';

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Sari3MapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  pickupCoords?: { lat: number; lng: number };
  dropoffCoords?: { lat: number; lng: number };
  driverCoords?: { lat: number; lng: number };
  interactivePinDropMode?: 'pickup' | 'dropoff' | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  onPinDropped?: (
    coords: { lat: number; lng: number },
    address: string,
    mode: 'pickup' | 'dropoff'
  ) => void;
  theme?: ThemeMode;
  lang?: Language;
  className?: string;
  showRoutePolyline?: boolean;
  userLiveGps?: { lat: number; lng: number } | null;
  onCenterOnGps?: () => void;
  flyToCoords?: { lat: number; lng: number; zoom?: number; id?: number | string } | null;
  isLocating?: boolean;
  onRouteCalculated?: (route: OsrmRouteResult) => void;
}

export const Sari3Map: React.FC<Sari3MapProps> = ({
  center,
  zoom = 13,
  pickupCoords,
  dropoffCoords,
  driverCoords,
  interactivePinDropMode = null,
  onMapClick,
  onPinDropped,
  theme = 'dark',
  lang = 'ar',
  className = 'min-h-[350px] h-[350px] w-full rounded-2xl',
  showRoutePolyline = true,
  userLiveGps = null,
  onCenterOnGps,
  flyToCoords = null,
  isLocating = false,
  onRouteCalculated,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Markers
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const userGpsMarkerRef = useRef<L.Marker | null>(null);

  // Road Routing Polylines (Dual-layer for realistic street appearance)
  const routeCasingRef = useRef<L.Polyline | null>(null); // Dark outer casing
  const routeCoreRef = useRef<L.Polyline | null>(null); // Vibrant neon emerald inner line
  const driverApproachRef = useRef<L.Polyline | null>(null); // Driver to pickup dashed line

  // Real OSRM Route State
  const [routeInfo, setRouteInfo] = useState<OsrmRouteResult | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState<boolean>(false);
  const [showStepsSheet, setShowStepsSheet] = useState<boolean>(false);

  // Stale-closure prevention refs
  const interactiveModeRef = useRef<'pickup' | 'dropoff' | null>(interactivePinDropMode);
  interactiveModeRef.current = interactivePinDropMode;

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const onPinDroppedRef = useRef(onPinDropped);
  onPinDroppedRef.current = onPinDropped;

  const onRouteCalculatedRef = useRef(onRouteCalculated);
  onRouteCalculatedRef.current = onRouteCalculated;

  // Calculate driver proximity to pickup
  const driverProximityKm =
    driverCoords && pickupCoords
      ? calculateDistanceKm(
          driverCoords.lat,
          driverCoords.lng,
          pickupCoords.lat,
          pickupCoords.lng
        )
      : null;

  // Enhanced reverse geocoding helper (fetches precise street name, neighborhood and city)
  const handleGeocodePoint = useCallback(
    async (coords: { lat: number; lng: number }, mode: 'pickup' | 'dropoff') => {
      try {
        const resolvedAddress = await reverseGeocode(coords.lat, coords.lng, lang);
        if (onPinDroppedRef.current) {
          onPinDroppedRef.current(coords, resolvedAddress, mode);
        }
      } catch (err) {
        console.warn('Reverse geocode error:', err);
      }
    },
    [lang]
  );

  // 1. Initialize Map Instance and Resize Observer
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: false,
        attributionControl: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
      });

      // Zoom control in bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Handle map clicks: directly drop/move the pin and fetch address without popup delays
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const clickedCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
        const currentMode = interactiveModeRef.current || 'pickup';

        // 1. Instantly move or create marker on map for instantaneous visual feedback
        if (currentMode === 'pickup') {
          if (pickupMarkerRef.current) {
            pickupMarkerRef.current.setLatLng([clickedCoords.lat, clickedCoords.lng]);
          }
        } else if (currentMode === 'dropoff') {
          if (dropoffMarkerRef.current) {
            dropoffMarkerRef.current.setLatLng([clickedCoords.lat, clickedCoords.lng]);
          }
        }

        // 2. Smoothly center on the clicked point
        map.panTo([clickedCoords.lat, clickedCoords.lng], {
          animate: true,
          duration: 0.25,
        });

        // 3. Immediately notify parent of raw coords
        if (onMapClickRef.current) {
          onMapClickRef.current(clickedCoords);
        }

        // 4. Perform instant reverse geocode to resolve street address and populate fields
        await handleGeocodePoint(clickedCoords, currentMode);
      });

      mapInstanceRef.current = map;
    }

    const currentMap = mapInstanceRef.current;

    // Delayed size invalidations to ensure proper sizing in WebViews
    const timer1 = setTimeout(() => currentMap?.invalidateSize({ pan: false }), 100);
    const timer2 = setTimeout(() => currentMap?.invalidateSize({ pan: false }), 350);
    const timer3 = setTimeout(() => currentMap?.invalidateSize({ pan: false }), 700);

    // ResizeObserver to automatically recover from container dimension shifts
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (currentMap) {
          currentMap.invalidateSize({ pan: false });
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. 100% Free Public OpenStreetMap Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // Official public OpenStreetMap tiles - 100% free, no API key required
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      crossOrigin: true,
    }).addTo(map);

    tileLayerRef.current = tiles;

    // Trigger invalidateSize after tile layer setup
    map.invalidateSize({ pan: false });
  }, [theme]);

  // 3. Center map when center prop coordinates shift significantly
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const currentCenter = map.getCenter();
    const distLat = Math.abs(currentCenter.lat - center.lat);
    const distLng = Math.abs(currentCenter.lng - center.lng);

    // Only set view if moved by more than ~1km to avoid interrupting manual dragging
    if (distLat > 0.01 || distLng > 0.01) {
      map.setView([center.lat, center.lng], map.getZoom() || zoom, {
        animate: true,
      });
    }
  }, [center.lat, center.lng, zoom]);

  // 3.5. Smooth FlyTo animation for auto-detected geolocation coordinates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToCoords || typeof flyToCoords.lat !== 'number' || typeof flyToCoords.lng !== 'number') return;

    try {
      map.flyTo([flyToCoords.lat, flyToCoords.lng], flyToCoords.zoom || 16, {
        animate: true,
        duration: 1.2,
        easeLinearity: 0.25,
      });
    } catch (e) {
      console.warn('Leaflet flyTo execution note:', e);
    }
  }, [flyToCoords]);

  // 4. Update Markers (Pickup, Dropoff, Driver, Device GPS)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Dragend handler with reverse geocoding
    const handleMarkerDragEnd = async (marker: L.Marker, mode: 'pickup' | 'dropoff') => {
      const pos = marker.getLatLng();
      const coords = { lat: pos.lat, lng: pos.lng };
      if (onMapClickRef.current) {
        onMapClickRef.current(coords);
      }
      await handleGeocodePoint(coords, mode);
    };

    // A. Pickup Marker (Vibrant Green Sari3 Pin)
    if (pickupCoords) {
      const pickupIcon = L.divIcon({
        className: 'sari3-pickup-marker',
        html: `
          <div style="cursor: pointer; background: #00D589; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 18px rgba(0,213,137,0.7); border: 3px solid #FFFFFF;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
      });

      if (!pickupMarkerRef.current) {
        const marker = L.marker([pickupCoords.lat, pickupCoords.lng], {
          icon: pickupIcon,
          draggable: true,
          title: lang === 'ar' ? 'مكان الاستلام (اسحب للتعديل)' : 'Pickup (drag to adjust)',
          zIndexOffset: 100,
        }).addTo(map);

        marker.on('dragend', () => handleMarkerDragEnd(marker, 'pickup'));
        pickupMarkerRef.current = marker;
      } else {
        pickupMarkerRef.current.setLatLng([pickupCoords.lat, pickupCoords.lng]);
      }
    } else if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }

    // B. Dropoff Marker (Vibrant Purple Sari3 Pin)
    if (dropoffCoords) {
      const dropoffIcon = L.divIcon({
        className: 'sari3-dropoff-marker',
        html: `
          <div style="cursor: pointer; background: #8B5CF6; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 18px rgba(139,92,246,0.7); border: 3px solid #FFFFFF;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" x2="4" y1="22" y2="15"/>
            </svg>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
      });

      if (!dropoffMarkerRef.current) {
        const marker = L.marker([dropoffCoords.lat, dropoffCoords.lng], {
          icon: dropoffIcon,
          draggable: true,
          title: lang === 'ar' ? 'مكان التسليم (اسحب للتعديل)' : 'Dropoff (drag to adjust)',
          zIndexOffset: 90,
        }).addTo(map);

        marker.on('dragend', () => handleMarkerDragEnd(marker, 'dropoff'));
        dropoffMarkerRef.current = marker;
      } else {
        dropoffMarkerRef.current.setLatLng([dropoffCoords.lat, dropoffCoords.lng]);
      }
    } else if (dropoffMarkerRef.current) {
      map.removeLayer(dropoffMarkerRef.current);
      dropoffMarkerRef.current = null;
    }

    // C. Driver Marker (Live Courier on Motorcycle with radar pulse)
    if (driverCoords) {
      const driverIcon = L.divIcon({
        className: 'sari3-driver-marker',
        html: `
          <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background-color: rgba(0, 213, 137, 0.4); animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; background-color: #0F172A; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #00D589; box-shadow: 0 4px 20px rgba(0,213,137,0.7);">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D589" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="5.5" cy="17.5" r="3.5"/>
                <circle cx="18.5" cy="17.5" r="3.5"/>
                <path d="M15 6h-2.5l-3 6.5"/>
                <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.marker([driverCoords.lat, driverCoords.lng], {
          icon: driverIcon,
          zIndexOffset: 120,
        }).addTo(map);
      } else {
        driverMarkerRef.current.setLatLng([driverCoords.lat, driverCoords.lng]);
      }
    } else if (driverMarkerRef.current) {
      map.removeLayer(driverMarkerRef.current);
      driverMarkerRef.current = null;
    }

    // D. User Device GPS Marker (Blue beacon if distinct from pickup)
    if (
      userLiveGps &&
      (!pickupCoords ||
        Math.abs(userLiveGps.lat - pickupCoords.lat) > 0.0005 ||
        Math.abs(userLiveGps.lng - pickupCoords.lng) > 0.0005)
    ) {
      const userGpsIcon = L.divIcon({
        className: 'sari3-user-gps-marker',
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background-color: rgba(59, 130, 246, 0.4); animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="background-color: #2563EB; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 2px 10px rgba(37,99,235,0.7);"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      if (!userGpsMarkerRef.current) {
        userGpsMarkerRef.current = L.marker([userLiveGps.lat, userLiveGps.lng], {
          icon: userGpsIcon,
          title: lang === 'ar' ? 'موقع جهازك الحالي' : 'Your device location',
          zIndexOffset: 80,
        }).addTo(map);
      } else {
        userGpsMarkerRef.current.setLatLng([userLiveGps.lat, userLiveGps.lng]);
      }
    } else if (userGpsMarkerRef.current) {
      map.removeLayer(userGpsMarkerRef.current);
      userGpsMarkerRef.current = null;
    }
  }, [pickupCoords, dropoffCoords, driverCoords, userLiveGps, lang, handleGeocodePoint]);

  // 5. Real Turn-by-Turn Street Routing via OSRM Engine
  useEffect(() => {
    let isCancelled = false;
    const map = mapInstanceRef.current;

    if (!map || !pickupCoords || !dropoffCoords || !showRoutePolyline) {
      if (routeCasingRef.current) {
        map?.removeLayer(routeCasingRef.current);
        routeCasingRef.current = null;
      }
      if (routeCoreRef.current) {
        map?.removeLayer(routeCoreRef.current);
        routeCoreRef.current = null;
      }
      if (driverApproachRef.current) {
        map?.removeLayer(driverApproachRef.current);
        driverApproachRef.current = null;
      }
      setRouteInfo(null);
      return;
    }

    setIsRouteLoading(true);

    fetchOsrmRoute(pickupCoords, dropoffCoords, lang)
      .then((routeResult) => {
        if (isCancelled || !mapInstanceRef.current) return;
        setRouteInfo(routeResult);
        setIsRouteLoading(false);

        if (onRouteCalculatedRef.current) {
          onRouteCalculatedRef.current(routeResult);
        }

        const currentMap = mapInstanceRef.current;
        const coords = routeResult.coordinates;

        // 1. Outer Casing (Dark emerald outline for high contrast on streets)
        if (!routeCasingRef.current) {
          routeCasingRef.current = L.polyline(coords, {
            color: '#064E3B',
            weight: 8,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(currentMap);
        } else {
          routeCasingRef.current.setLatLngs(coords);
        }

        // 2. Core Navigation Road Line (Vibrant Sari3 Emerald following real streets)
        if (!routeCoreRef.current) {
          routeCoreRef.current = L.polyline(coords, {
            color: '#00D589',
            weight: 5,
            opacity: 0.98,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(currentMap);
        } else {
          routeCoreRef.current.setLatLngs(coords);
        }

        // 3. Driver Approach Line (if courier is assigned and moving to pickup)
        if (driverCoords) {
          const driverLeg: [number, number][] = [
            [driverCoords.lat, driverCoords.lng],
            [pickupCoords.lat, pickupCoords.lng],
          ];
          if (!driverApproachRef.current) {
            driverApproachRef.current = L.polyline(driverLeg, {
              color: '#38BDF8',
              weight: 4,
              opacity: 0.9,
              dashArray: '8, 8',
            }).addTo(currentMap);
          } else {
            driverApproachRef.current.setLatLngs(driverLeg);
          }
        } else if (driverApproachRef.current) {
          currentMap.removeLayer(driverApproachRef.current);
          driverApproachRef.current = null;
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn('OSRM route calculation error:', err);
          setIsRouteLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    pickupCoords?.lat,
    pickupCoords?.lng,
    dropoffCoords?.lat,
    dropoffCoords?.lng,
    driverCoords?.lat,
    driverCoords?.lng,
    showRoutePolyline,
    lang,
  ]);

  // Handle "Center on GPS" click
  const handleLocateMe = () => {
    if (onCenterOnGps) {
      onCenterOnGps();
    } else if (userLiveGps && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLiveGps.lat, userLiveGps.lng], 16, {
        animate: true,
        duration: 1.2,
      });
    } else if (pickupCoords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([pickupCoords.lat, pickupCoords.lng], 16, {
        animate: true,
        duration: 1.2,
      });
    }
  };

  // Re-fit map view to the full turn-by-turn road route
  const handleFitRoute = () => {
    if (routeInfo && routeInfo.coordinates.length > 0 && mapInstanceRef.current) {
      const bounds = L.latLngBounds(routeInfo.coordinates);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 16,
        animate: true,
      });
    }
  };

  // Render direction step icon
  const renderStepIcon = (modifier?: string, type?: string) => {
    if (modifier?.includes('left')) {
      return <CornerUpLeft size={14} className="text-emerald-400 shrink-0" />;
    }
    if (modifier?.includes('right')) {
      return <CornerUpRight size={14} className="text-emerald-400 shrink-0" />;
    }
    if (type === 'arrive') {
      return <MapPin size={14} className="text-purple-400 shrink-0" />;
    }
    return <ArrowUp size={14} className="text-emerald-400 shrink-0" />;
  };

  return (
    <div
      id="sari3-main-map"
      className={`relative overflow-hidden bg-slate-900 ${className}`}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '350px',
      }}
    >
      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-full cursor-crosshair"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '350px',
          position: 'relative',
        }}
      />

      {/* Floating Pin-Drop Mode Indicator */}
      {interactivePinDropMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-2xl bg-slate-900/95 text-white border-2 border-emerald-500 shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-black">
            {interactivePinDropMode === 'pickup'
              ? lang === 'ar'
                ? '📍 انقر على الخريطة لتحديد مكان الاستلام'
                : '📍 Click map to set pickup location'
              : lang === 'ar'
              ? '🎯 انقر على الخريطة لتحديد مكان التسليم'
              : '🎯 Click map to set dropoff location'}
          </span>
        </div>
      )}

      {/* Driver Proximity Badge (if active mission) */}
      {driverProximityKm !== null && (
        <div className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-emerald-500/60 shadow-xl backdrop-blur-md text-xs font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {driverProximityKm < 0.15 ? (
            <span className="text-emerald-400 font-black animate-pulse">
              {lang === 'ar' ? 'الكابتن وصل الآن! ✓' : 'Driver arrived! ✓'}
            </span>
          ) : (
            <span className="text-slate-200">
              {lang === 'ar' ? 'الكابتن على بعد: ' : 'Driver is: '}
              <strong className="text-emerald-400 font-mono">{driverProximityKm} {lang === 'ar' ? 'كم' : 'km'}</strong>
            </span>
          )}
        </div>
      )}

      {/* "Locate Me / GPS" Floating Button (Top Left) */}
      <button
        type="button"
        id="btn-sari3-locate-gps"
        onClick={handleLocateMe}
        disabled={isLocating}
        title={lang === 'ar' ? 'تحديد موقعي الحالي بدقة (GPS)' : 'Detect my location (GPS)'}
        className="absolute top-3 left-3 z-20 px-3 py-2 rounded-2xl bg-slate-900/95 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-xl backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
      >
        <Crosshair size={16} className={isLocating ? 'animate-spin text-emerald-400' : 'text-emerald-400'} />
        <span className="text-xs font-bold hidden sm:inline">
          {isLocating
            ? lang === 'ar'
              ? 'جاري التحديد...'
              : 'Locating...'
            : lang === 'ar'
            ? 'موقعي الحالي'
            : 'My Location'}
        </span>
      </button>

      {/* Floating Real-Route Info Bar (Turn-by-Turn OSRM Navigation Badge) */}
      {pickupCoords && dropoffCoords && (
        <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-2 pointer-events-none">
          {/* Turn-by-Turn Steps Sheet (Expandable) */}
          {showStepsSheet && routeInfo && routeInfo.steps.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-emerald-500/40 shadow-2xl backdrop-blur-md text-slate-100 max-h-48 overflow-y-auto space-y-2 pointer-events-auto animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Navigation size={13} className="text-emerald-400" />
                  <span>{lang === 'ar' ? 'خطوات المسار الحقيقي بالشوارع' : 'Turn-by-Turn Street Directions'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowStepsSheet(false)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer p-0.5"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                {routeInfo.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/60"
                  >
                    <span className="mt-0.5">{renderStepIcon(step.modifier, step.type)}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-200 text-[11px] leading-tight">
                        {step.instruction}
                      </p>
                      {step.distanceMeters > 0 && (
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {step.distanceMeters >= 1000
                            ? `${(step.distanceMeters / 1000).toFixed(1)} ${lang === 'ar' ? 'كم' : 'km'}`
                            : `${step.distanceMeters} ${lang === 'ar' ? 'متر' : 'm'}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Route Bar */}
          <div className="p-2.5 rounded-2xl bg-slate-900/95 border border-emerald-500/40 shadow-2xl backdrop-blur-md text-slate-100 flex items-center justify-between gap-2 pointer-events-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                {isRouteLoading ? (
                  <Loader2 size={16} className="text-emerald-400 animate-spin" />
                ) : (
                  <Route size={16} className="text-emerald-400" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-400 font-mono">
                    {routeInfo ? `${routeInfo.distanceKm} ${lang === 'ar' ? 'كم' : 'km'}` : '...'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1 font-mono">
                    <Clock size={11} className="text-slate-400" />
                    <span>~{routeInfo?.durationMinutes || 5} {lang === 'ar' ? 'دقيقة' : 'min'}</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-bold uppercase hidden xs:inline">
                    {routeInfo?.isRealRoadRoute
                      ? lang === 'ar'
                        ? 'مسار حقيقي ✓'
                        : 'Real Streets ✓'
                      : lang === 'ar'
                      ? 'تقديري'
                      : 'Estimated'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate max-w-[180px] sm:max-w-[260px]">
                  {routeInfo?.summary || (lang === 'ar' ? 'جاري رسم المسار...' : 'Routing...')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Fit Entire Route Button */}
              <button
                type="button"
                onClick={handleFitRoute}
                title={lang === 'ar' ? 'عرض كامل المسار' : 'Fit route to screen'}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Maximize2 size={13} />
              </button>

              {/* Toggle Steps Drawer */}
              {routeInfo && routeInfo.steps.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowStepsSheet(!showStepsSheet)}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'الخطوات' : 'Steps'}</span>
                  {showStepsSheet ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
