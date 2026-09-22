import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ThemeMode } from '../types';
import { reverseGeocode } from '../utils/reverseGeocoding';
import { calculateDistanceKm, calculateSuggestedFare } from '../data/wilayas';
import { Navigation, Compass, Crosshair, Check, Loader2, Clock, DollarSign } from 'lucide-react';

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
  className?: string;
  showRoutePolyline?: boolean;
  userLiveGps?: { lat: number; lng: number } | null;
  onCenterOnGps?: () => void;
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
  className = 'h-64 w-full rounded-2xl',
  showRoutePolyline = true,
  userLiveGps = null,
  onCenterOnGps,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const userGpsMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [lastReverseAddress, setLastReverseAddress] = useState<string | null>(null);

  // Calculate live route distance
  const currentDistanceKm =
    pickupCoords && dropoffCoords
      ? calculateDistanceKm(
          pickupCoords.lat,
          pickupCoords.lng,
          dropoffCoords.lat,
          dropoffCoords.lng
        )
      : null;

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

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Zoom control in bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Handle map clicks for direct pin dropping
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const clickedCoords = { lat: e.latlng.lat, lng: e.latlng.lng };

        if (onMapClick) {
          onMapClick(clickedCoords);
        }

        // If in direct pin drop mode (pickup or dropoff), reverse geocode immediately!
        if (interactivePinDropMode && onPinDropped) {
          setIsGeocoding(true);
          try {
            const resolvedAddress = await reverseGeocode(
              clickedCoords.lat,
              clickedCoords.lng,
              'ar'
            );
            setLastReverseAddress(resolvedAddress);
            onPinDropped(clickedCoords, resolvedAddress, interactivePinDropMode);
          } finally {
            setIsGeocoding(false);
          }
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Tile layer selection (Dark Matter for deep matte black, Voyager for light mode)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl =
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const newLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [theme]);

  // 3. Center map when center prop updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], map.getZoom() || zoom);
  }, [center.lat, center.lng]);

  // 4. Update Markers & Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Helper for dragend reverse geocode
    const handleMarkerDragEnd = async (marker: L.Marker, mode: 'pickup' | 'dropoff') => {
      const pos = marker.getLatLng();
      const coords = { lat: pos.lat, lng: pos.lng };
      if (onPinDropped) {
        setIsGeocoding(true);
        try {
          const addr = await reverseGeocode(coords.lat, coords.lng, 'ar');
          setLastReverseAddress(addr);
          onPinDropped(coords, addr, mode);
        } finally {
          setIsGeocoding(false);
        }
      }
    };

    // A. Pickup Marker (Green Sari3 Pin)
    if (pickupCoords) {
      const pickupIcon = L.divIcon({
        className: 'sari3-pickup-marker',
        html: `
          <div style="cursor: pointer; background-color: #00D589; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,213,137,0.6); border: 3px solid #FFFFFF;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      if (!pickupMarkerRef.current) {
        const marker = L.marker([pickupCoords.lat, pickupCoords.lng], {
          icon: pickupIcon,
          draggable: true,
          title: 'مكان الاستلام (يمكنك سحب الدبوس)',
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

    // B. Dropoff Marker (Purple Sari3 Pin)
    if (dropoffCoords) {
      const dropoffIcon = L.divIcon({
        className: 'sari3-dropoff-marker',
        html: `
          <div style="cursor: pointer; background-color: #8B5CF6; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(139,92,246,0.6); border: 3px solid #FFFFFF;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" x2="4" y1="22" y2="15"/>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      if (!dropoffMarkerRef.current) {
        const marker = L.marker([dropoffCoords.lat, dropoffCoords.lng], {
          icon: dropoffIcon,
          draggable: true,
          title: 'مكان التسليم (يمكنك سحب الدبوس)',
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
            <div style="position: absolute; inset: 0; border-radius: 50%; background-color: rgba(0, 213, 137, 0.35); animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; background-color: #0F172A; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #00D589; box-shadow: 0 4px 18px rgba(0,213,137,0.7);">
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
            <div style="background-color: #2563EB; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 2px 8px rgba(37,99,235,0.6);"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      if (!userGpsMarkerRef.current) {
        userGpsMarkerRef.current = L.marker([userLiveGps.lat, userLiveGps.lng], {
          icon: userGpsIcon,
          title: 'موقع جهازك الحالي',
        }).addTo(map);
      } else {
        userGpsMarkerRef.current.setLatLng([userLiveGps.lat, userLiveGps.lng]);
      }
    } else if (userGpsMarkerRef.current) {
      map.removeLayer(userGpsMarkerRef.current);
      userGpsMarkerRef.current = null;
    }

    // E. Route Polyline
    if (showRoutePolyline && pickupCoords && dropoffCoords) {
      const waypoints: [number, number][] = [];
      if (driverCoords) {
        waypoints.push([driverCoords.lat, driverCoords.lng]);
      }
      waypoints.push([pickupCoords.lat, pickupCoords.lng]);
      waypoints.push([dropoffCoords.lat, dropoffCoords.lng]);

      if (!polylineRef.current) {
        polylineRef.current = L.polyline(waypoints, {
          color: '#00D589',
          weight: 4.5,
          opacity: 0.9,
          dashArray: driverCoords ? '7, 9' : undefined,
        }).addTo(map);
      } else {
        polylineRef.current.setLatLngs(waypoints);
      }

      // Auto fit bounds
      try {
        const bounds = L.latLngBounds(waypoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch (e) {
        // Safe catch if bounds collapsed
      }
    } else if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
  }, [pickupCoords, dropoffCoords, driverCoords, userLiveGps, showRoutePolyline, interactivePinDropMode]);

  // Handle "Center on GPS" click
  const handleLocateMe = () => {
    if (onCenterOnGps) {
      onCenterOnGps();
    } else if (userLiveGps && mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLiveGps.lat, userLiveGps.lng], 15);
    } else if (pickupCoords && mapInstanceRef.current) {
      mapInstanceRef.current.setView([pickupCoords.lat, pickupCoords.lng], 15);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Map Target Canvas */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full ${interactivePinDropMode ? 'cursor-crosshair' : 'cursor-grab'}`}
      />

      {/* Floating Pin-Drop Mode Indicator */}
      {interactivePinDropMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-2xl bg-slate-900/95 text-white border-2 border-emerald-500 shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-black">
            {interactivePinDropMode === 'pickup'
              ? '📍 انقر على الخريطة لتحديد مكان الاستلام'
              : '🎯 انقر على الخريطة لتحديد مكان التسليم'}
          </span>
        </div>
      )}

      {/* Reverse Geocoding in Progress Banner */}
      {isGeocoding && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-xl bg-slate-950/90 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold shadow-lg flex items-center gap-2 backdrop-blur">
          <Loader2 size={13} className="animate-spin" />
          <span>جارٍ استخراج اسم الشارع والبلدية...</span>
        </div>
      )}

      {/* Driver Proximity Badge (if active mission) */}
      {driverProximityKm !== null && (
        <div className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-emerald-500/60 shadow-xl backdrop-blur-md text-xs font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {driverProximityKm < 0.15 ? (
            <span className="text-emerald-400 font-black animate-pulse">الكابتن وصل الآن! ✓</span>
          ) : (
            <span className="text-slate-200">
              الكابتن على بعد: <strong className="text-emerald-400 font-mono">{driverProximityKm} كم</strong>
            </span>
          )}
        </div>
      )}

      {/* Live Distance & Fare Pill (Bottom Left) */}
      {currentDistanceKm !== null && (
        <div className="absolute bottom-3 left-3 z-20 px-3 py-1.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-slate-200 shadow-xl backdrop-blur flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 font-mono">
            <Navigation size={13} className="text-emerald-400" />
            <span className="font-bold text-white">{currentDistanceKm} كم</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 font-mono text-emerald-400 font-bold">
            <span>~ {calculateSuggestedFare(currentDistanceKm)} دج</span>
          </div>
        </div>
      )}

      {/* "Locate Me / GPS" Floating Button (Top Left) */}
      <button
        type="button"
        onClick={handleLocateMe}
        title="تحديد موقعي الحالي على الخريطة"
        className="absolute top-3 left-3 z-20 p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-xl backdrop-blur-md transition flex items-center justify-center cursor-pointer active:scale-95"
      >
        <Crosshair size={18} />
      </button>
    </div>
  );
};
