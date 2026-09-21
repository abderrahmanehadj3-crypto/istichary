import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { ThemeMode } from '../types';

// Fix Leaflet default icon paths if needed
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
  theme?: ThemeMode;
  className?: string;
  showRoutePolyline?: boolean;
}

export const Sari3Map: React.FC<Sari3MapProps> = ({
  center,
  zoom = 13,
  pickupCoords,
  dropoffCoords,
  driverCoords,
  interactivePinDropMode = null,
  onMapClick,
  theme = 'dark',
  className = 'h-64 w-full rounded-2xl',
  showRoutePolyline = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Add zoom control on bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Handle map clicks for pin-dropping
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClick) {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when Theme changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // CartoDB Positron for Light, Dark Matter for Deep Matte Dark
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

  // Update Center if changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], map.getZoom() || zoom);
  }, [center.lat, center.lng]);

  // Update Markers & Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Pickup Marker (Green)
    if (pickupCoords) {
      const pickupIcon = L.divIcon({
        className: 'sari3-pickup-marker',
        html: `
          <div style="background-color: #00D589; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,213,137,0.5); border: 3px solid #FFFFFF;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = L.marker([pickupCoords.lat, pickupCoords.lng], {
          icon: pickupIcon,
        }).addTo(map);
      } else {
        pickupMarkerRef.current.setLatLng([pickupCoords.lat, pickupCoords.lng]);
      }
    } else if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }

    // 2. Dropoff Marker (Purple / Flag)
    if (dropoffCoords) {
      const dropoffIcon = L.divIcon({
        className: 'sari3-dropoff-marker',
        html: `
          <div style="background-color: #8B5CF6; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(139,92,246,0.5); border: 3px solid #FFFFFF;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" x2="4" y1="22" y2="15"/>
            </svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      if (!dropoffMarkerRef.current) {
        dropoffMarkerRef.current = L.marker([dropoffCoords.lat, dropoffCoords.lng], {
          icon: dropoffIcon,
        }).addTo(map);
      } else {
        dropoffMarkerRef.current.setLatLng([dropoffCoords.lat, dropoffCoords.lng]);
      }
    } else if (dropoffMarkerRef.current) {
      map.removeLayer(dropoffMarkerRef.current);
      dropoffMarkerRef.current = null;
    }

    // 3. Driver Live Marker (Courier on Motorcycle with pulsing radar)
    if (driverCoords) {
      const driverIcon = L.divIcon({
        className: 'sari3-driver-marker',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background-color: rgba(0, 213, 137, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; background-color: #0F172A; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #00D589; box-shadow: 0 4px 16px rgba(0,213,137,0.6);">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D589" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="5.5" cy="17.5" r="3.5"/>
                <circle cx="18.5" cy="17.5" r="3.5"/>
                <path d="M15 6h-2.5l-3 6.5"/>
                <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
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

    // 4. Route Polyline
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
          weight: 4,
          opacity: 0.85,
          dashArray: driverCoords ? '6, 8' : undefined,
        }).addTo(map);
      } else {
        polylineRef.current.setLatLngs(waypoints);
      }

      // Auto fit bounds
      try {
        const bounds = L.latLngBounds(waypoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch (e) {
        // Ignore zoom errors if bounds collapsed
      }
    } else if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
  }, [pickupCoords, dropoffCoords, driverCoords, showRoutePolyline]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Map Target Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Pin-drop helper banner */}
      {interactivePinDropMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white border border-emerald-500/40 text-xs font-semibold shadow-lg backdrop-blur-md flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>
            {interactivePinDropMode === 'pickup'
              ? 'انقر على الخريطة لتحديد مكان الاستلام'
              : 'انقر على الخريطة لتحديد مكان التسليم'}
          </span>
        </div>
      )}
    </div>
  );
};
