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
  isDetecting: boolean;
  requestGps: (forceRealPrompt?: boolean) => Promise<GpsCoordinates | null>;
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
  const [isDetecting, setIsDetecting] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const coordsRef = useRef<GpsCoordinates | null>(coords);
  coordsRef.current = coords;

  // Unconditional bypass mechanism: permanently saves bypass flag, grants permission and sets valid coords
  const bypassGps = useCallback((fallbackCoords?: GpsCoordinates): GpsCoordinates => {
    setGpsBypassed();
    const target = fallbackCoords || coordsRef.current || DEFAULT_ALGIERS_COORDS;
    setCoords(target);
    setAccuracy(15);
    setStatus('granted');
    setErrorMessage(null);
    setIsDetecting(false);
    return target;
  }, []);

  // Request GPS position on demand with strict 4s timeout & automatic graceful fallback (NEVER locks or hangs)
  const requestGps = useCallback((forceRealPrompt: boolean = false): Promise<GpsCoordinates | null> => {
    return new Promise((resolve) => {
      let isDone = false;

      // Safe finish wrapper that clears timeout and always resets isDetecting
      const finish = (result: GpsCoordinates | null, newStatus?: GpsStatus) => {
        if (isDone) return;
        isDone = true;
        clearTimeout(safetyTimer);
        setIsDetecting(false);
        if (result) {
          setCoords(result);
          setStatus('granted');
          setErrorMessage(null);
          setGpsBypassed();
        } else if (newStatus) {
          setStatus(newStatus);
        }
        resolve(result);
      };

      // Strict 4-second timeout: unconditionally dismiss loading state if no response
      const safetyTimer = setTimeout(() => {
        console.warn('[useNativeGps] Strict 4s timeout reached, auto-dismissing location loading');
        finish(null, 'denied');
      }, 4000);

      // If already bypassed and NOT forcing a real prompt, return target coordinates immediately
      if (isGpsBypassed() && !forceRealPrompt) {
        const target = coordsRef.current || DEFAULT_ALGIERS_COORDS;
        finish(target, 'granted');
        return;
      }

      setIsDetecting(true);
      setStatus('checking');
      setErrorMessage(null);

      // 1. Median / GoNative bridge native permission prompt hook
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
              finish({
                lat: Number(res.latitude || res.lat),
                lng: Number(res.longitude || res.lng),
              });
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
          capGeo
            .getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 3500,
            })
            .then((pos: any) => {
              if (pos && pos.coords) {
                finish({
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                });
              }
            })
            .catch((capErr: any) => {
              console.warn('[useNativeGps] Capacitor Geolocation note:', capErr);
            });
        } catch (capErr) {
          console.warn('[useNativeGps] Capacitor Geolocation error:', capErr);
        }
      }

      // 3. Standard navigator.geolocation check
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        const fallbackTarget = coordsRef.current || DEFAULT_ALGIERS_COORDS;
        finish(fallbackTarget, 'granted');
        return;
      }

      // Primary call: High Accuracy with 3.5s timeout (within 4s safety window)
      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            finish({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (_highAccErr) => {
            // Low accuracy network fallback if high accuracy times out
            navigator.geolocation.getCurrentPosition(
              (fallbackPos) => {
                finish({
                  lat: fallbackPos.coords.latitude,
                  lng: fallbackPos.coords.longitude,
                });
              },
              (_finalError) => {
                // Graceful denial fallback
                finish(null, 'denied');
              },
              {
                enableHighAccuracy: false,
                timeout: 1500,
                maximumAge: 60000,
              }
            );
          },
          {
            enableHighAccuracy: true,
            timeout: 3500,
            maximumAge: 0,
          }
        );
      } catch (callError) {
        console.warn('[useNativeGps] Geolocation invocation note:', callError);
        finish(null, 'denied');
      }
    });
  }, []);

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
    isDetecting,
    requestGps,
    startLiveTracking,
    stopLiveTracking,
    openLocationSettings: openNativeLocationSettings,
    bypassGps,
  };
}
