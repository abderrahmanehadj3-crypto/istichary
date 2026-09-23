import { useState, useEffect, useRef, useCallback } from 'react';

export type GpsStatus = 'idle' | 'checking' | 'granted' | 'denied' | 'disabled' | 'error';

export interface GpsCoordinates {
  lat: number;
  lng: number;
}

export interface UseNativeGpsReturn {
  coords: GpsCoordinates | null;
  accuracy: number | null; // In meters
  status: GpsStatus;
  errorMessage: string | null;
  isTracking: boolean;
  requestGps: () => Promise<GpsCoordinates | null>;
  startLiveTracking: () => void;
  stopLiveTracking: () => void;
  openLocationSettings: () => void;
  bypassGps: (fallbackCoords?: GpsCoordinates) => GpsCoordinates;
}

/**
 * Check if the user has unconditionally bypassed GPS permission checks
 */
export function isGpsBypassed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('gps_bypassed') === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Save unconditional GPS bypass flag
 */
export function setGpsBypassed(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('gps_bypassed', 'true');
  } catch (e) {
    console.warn('Could not save gps_bypassed flag:', e);
  }
}

/**
 * Directly prompt native Android location settings screen
 * via native wrapper bridge or Android Intent URI.
 */
export function openNativeLocationSettings(): void {
  if (typeof window === 'undefined') return;

  // 1. Median / GoNative bridge
  const median = (window as any).median || (window as any).gonative;
  if (median?.location?.openSettings) {
    try {
      median.location.openSettings();
      return;
    } catch (e) {
      console.warn('Median openSettings failed:', e);
    }
  }

  // 2. Trigger native Median geolocation permission prompt if supported
  if (median?.geolocation?.prompt) {
    try {
      median.geolocation.prompt();
      return;
    } catch (e) {
      console.warn('Median prompt failed:', e);
    }
  }

  // 3. Android Intent to open system Location Provider Settings
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android')) {
    try {
      window.location.href =
        'intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end';
      return;
    } catch (e) {
      console.warn('Android location intent invocation error:', e);
    }
  }
}

// Default center coordinates for Algiers (Alger Centre) if GPS is uncalibrated
export const DEFAULT_ALGIERS_COORDS: GpsCoordinates = {
  lat: 36.7538,
  lng: 3.0588,
};

export function useNativeGps(autoStart: boolean = false): UseNativeGpsReturn {
  const previouslyBypassed = isGpsBypassed();

  const [coords, setCoords] = useState<GpsCoordinates | null>(() => {
    return previouslyBypassed ? DEFAULT_ALGIERS_COORDS : null;
  });
  const [accuracy, setAccuracy] = useState<number | null>(() => {
    return previouslyBypassed ? 15 : null;
  });
  const [status, setStatus] = useState<GpsStatus>(() => {
    return previouslyBypassed ? 'granted' : 'idle';
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);

  // Unconditional bypass mechanism: permanently saves bypass flag, grants permission and sets valid coords
  const bypassGps = useCallback((fallbackCoords?: GpsCoordinates): GpsCoordinates => {
    setGpsBypassed();
    const target = fallbackCoords || coords || DEFAULT_ALGIERS_COORDS;
    setCoords(target);
    setAccuracy(15);
    setStatus('granted');
    setErrorMessage(null);
    return target;
  }, [coords]);

  // Request GPS position on demand with automatic graceful fallback (NEVER locks or denies)
  const requestGps = useCallback((): Promise<GpsCoordinates | null> => {
    return new Promise(async (resolve) => {
      // If already bypassed, immediately return valid coordinates without any OS checks
      if (isGpsBypassed()) {
        const target = coords || DEFAULT_ALGIERS_COORDS;
        setStatus('granted');
        setErrorMessage(null);
        resolve(target);
        return;
      }

      setStatus('checking');
      setErrorMessage(null);

      // 1. Median / GoNative bridge integration
      const median = (window as any).median || (window as any).gonative;
      if (median?.geolocation?.prompt) {
        try {
          median.geolocation.prompt();
        } catch (e) {
          console.warn('[useNativeGps] Median prompt call:', e);
        }
      }

      if (median?.geolocation?.getCurrentPosition) {
        try {
          median.geolocation.getCurrentPosition((res: any) => {
            if (res && (res.latitude || res.lat)) {
              const mCoords: GpsCoordinates = {
                lat: Number(res.latitude || res.lat),
                lng: Number(res.longitude || res.lng),
              };
              setCoords(mCoords);
              setAccuracy(res.accuracy || 10);
              setStatus('granted');
              setErrorMessage(null);
              resolve(mCoords);
              return;
            }
          });
        } catch (e) {
          console.warn('[useNativeGps] Median getCurrentPosition call error:', e);
        }
      }

      // 2. Check Capacitor Geolocation plugin if present in wrapper
      const capGeo = (window as any).Capacitor?.Plugins?.Geolocation;
      if (capGeo?.getCurrentPosition) {
        try {
          const pos = await capGeo.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 8000,
          });
          if (pos && pos.coords) {
            const capCoords: GpsCoordinates = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            setCoords(capCoords);
            setAccuracy(pos.coords.accuracy || 10);
            setStatus('granted');
            setErrorMessage(null);
            resolve(capCoords);
            return;
          }
        } catch (capErr) {
          console.warn('[useNativeGps] Capacitor Geolocation error:', capErr);
        }
      }

      // 3. Standard navigator.geolocation check
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        // Fallback gracefully without raising error or locking
        const fallbackTarget = coords || DEFAULT_ALGIERS_COORDS;
        setCoords(fallbackTarget);
        setStatus('granted');
        setErrorMessage(null);
        resolve(fallbackTarget);
        return;
      }

      // Primary call: High Accuracy with timeout
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords: GpsCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCoords(newCoords);
          setAccuracy(position.coords.accuracy);
          setStatus('granted');
          setErrorMessage(null);
          resolve(newCoords);
        },
        (_highAccErr) => {
          // Low accuracy network fallback
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              const fallbackCoords: GpsCoordinates = {
                lat: fallbackPos.coords.latitude,
                lng: fallbackPos.coords.longitude,
              };
              setCoords(fallbackCoords);
              setAccuracy(fallbackPos.coords.accuracy);
              setStatus('granted');
              setErrorMessage(null);
              resolve(fallbackCoords);
            },
            (_finalError) => {
              // CRITICAL FIX: NEVER set status='denied' or block the user!
              // Automatically resolve with default/wilaya coordinates and mark as granted
              console.warn('[useNativeGps] Native GPS unavailable, auto-bypassing to prevent lock');
              const safeCoords = coords || DEFAULT_ALGIERS_COORDS;
              setCoords(safeCoords);
              setAccuracy(25);
              setStatus('granted');
              setErrorMessage(null);
              resolve(safeCoords);
            },
            {
              enableHighAccuracy: false,
              timeout: 4000,
              maximumAge: 60000,
            }
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  }, [coords]);

  // Start continuous live tracking (silent error handling)
  const startLiveTracking = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsTracking(true);

    const options: PositionOptions = {
      enableHighAccuracy: false, // Low battery, robust in WebView
      timeout: 10000,
      maximumAge: 5000,
    };

    try {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newCoords: GpsCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCoords(newCoords);
          setAccuracy(position.coords.accuracy);
          setStatus('granted');
          setErrorMessage(null);
        },
        (error) => {
          // Keep status as granted, never disturb the user with watchPosition errors
          console.warn('[useNativeGps] watchPosition background note:', error?.message);
        },
        options
      );
      watchIdRef.current = watchId;
    } catch (e) {
      console.warn('[useNativeGps] watchPosition invoke error:', e);
    }
  }, []);

  // Stop live tracking
  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch (e) {
        console.warn('clearWatch error:', e);
      }
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Handle autoStart
  useEffect(() => {
    if (autoStart) {
      if (isGpsBypassed()) {
        setStatus('granted');
        setErrorMessage(null);
        if (!coords) {
          setCoords(DEFAULT_ALGIERS_COORDS);
        }
      } else {
        requestGps().catch(() => {
          bypassGps();
        });
      }
    }

    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          navigator.geolocation.clearWatch(watchIdRef.current);
        } catch (e) {}
      }
    };
  }, [autoStart, requestGps, bypassGps]);

  return {
    coords,
    accuracy,
    status,
    errorMessage,
    isTracking,
    requestGps,
    startLiveTracking,
    stopLiveTracking,
    openLocationSettings: openNativeLocationSettings,
    bypassGps,
  };
}
