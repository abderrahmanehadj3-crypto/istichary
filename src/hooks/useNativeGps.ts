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
  isOverlayBlocked: boolean;
  requestGps: (forceRealPrompt?: boolean) => Promise<GpsCoordinates | null>;
  cancelGps: () => void;
  clearOverlayBlocked: () => void;
  startLiveTracking: () => void;
  stopLiveTracking: () => void;
  openLocationSettings: () => void;
  bypassGps: (fallbackCoords?: GpsCoordinates) => GpsCoordinates;
}

/**
 * Checks if a geolocation error is caused by an Android screen overlay,
 * chat bubble (e.g. Messenger chat heads), or tapjacking security block.
 */
export function isScreenOverlayError(err: any): boolean {
  if (!err) return false;
  // Android error code 1: PERMISSION_DENIED (frequently triggered when screen overlay blocks touch or permission)
  if (err.code === 1 || err.code === (window as any).GeolocationPositionError?.PERMISSION_DENIED) {
    return true;
  }
  const msg = String(err.message || '').toLowerCase();
  return (
    msg.includes('overlay') ||
    msg.includes('bubble') ||
    msg.includes('permission') ||
    msg.includes('denied') ||
    msg.includes('blocked') ||
    msg.includes('obscured') ||
    msg.includes('tapjacking') ||
    msg.includes('not allowed')
  );
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
  const [isOverlayBlocked, setIsOverlayBlocked] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const activeCancelRef = useRef<(() => void) | null>(null);
  const coordsRef = useRef<GpsCoordinates | null>(coords);
  coordsRef.current = coords;

  const clearOverlayBlocked = useCallback(() => {
    setIsOverlayBlocked(false);
  }, []);

  // Unconditional bypass mechanism: permanently saves bypass flag, grants permission and sets valid coords
  const bypassGps = useCallback((fallbackCoords?: GpsCoordinates): GpsCoordinates => {
    setGpsBypassed();
    const target = fallbackCoords || coordsRef.current || DEFAULT_ALGIERS_COORDS;
    setCoords(target);
    setAccuracy(15);
    setStatus('granted');
    setErrorMessage(null);
    setIsDetecting(false);
    setIsOverlayBlocked(false);
    return target;
  }, []);

  // Request GPS position on demand with strict 3s timeout & automatic graceful fallback (NEVER locks or hangs)
  const requestGps = useCallback((forceRealPrompt: boolean = false): Promise<GpsCoordinates | null> => {
    return new Promise((resolve) => {
      let isDone = false;

      // Safe finish wrapper that clears timeout and always resets isDetecting
      const finish = (
        result: GpsCoordinates | null,
        newStatus?: GpsStatus,
        opts?: { isOverlay?: boolean; errorMsg?: string }
      ) => {
        if (isDone) return;
        isDone = true;
        clearTimeout(safetyTimer);
        activeCancelRef.current = null;
        setIsDetecting(false);
        if (result) {
          setCoords(result);
          setStatus('granted');
          setErrorMessage(null);
          setIsOverlayBlocked(false);
          setGpsBypassed();
        } else {
          if (newStatus) {
            setStatus(newStatus);
          }
          if (opts?.errorMsg) {
            setErrorMessage(opts.errorMsg);
          }
          if (opts?.isOverlay) {
            setIsOverlayBlocked(true);
          }
        }
        resolve(result);
      };

      activeCancelRef.current = () => {
        finish(null, 'denied');
      };

      // Strict 3-second timeout: unconditionally dismiss loading state if no response within 3s
      const safetyTimer = setTimeout(() => {
        console.warn('[useNativeGps] Strict 3s timeout reached, auto-dismissing location loading');
        const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '');
        finish(null, 'denied', {
          isOverlay: isAndroid,
          errorMsg: 'Location timeout (potential screen overlay)',
        });
      }, 3000);

      // If already bypassed and NOT forcing a real prompt, return target coordinates immediately
      if (isGpsBypassed() && !forceRealPrompt) {
        const target = coordsRef.current || DEFAULT_ALGIERS_COORDS;
        finish(target, 'granted');
        return;
      }

      setIsDetecting(true);
      setStatus('checking');
      setErrorMessage(null);
      setIsOverlayBlocked(false);

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
              timeout: 2500,
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

      // Primary call: High Accuracy with 2.8s timeout (within 3s safety window)
      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            finish({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (highAccErr) => {
            console.warn('[useNativeGps] High accuracy geolocation note:', highAccErr);
            const highAccIsOverlay = isScreenOverlayError(highAccErr);
            // Low accuracy network fallback if high accuracy times out
            navigator.geolocation.getCurrentPosition(
              (fallbackPos) => {
                finish({
                  lat: fallbackPos.coords.latitude,
                  lng: fallbackPos.coords.longitude,
                });
              },
              (finalError) => {
                console.warn('[useNativeGps] Final geolocation note:', finalError);
                const finalIsOverlay = isScreenOverlayError(finalError) || highAccIsOverlay;
                finish(null, 'denied', {
                  isOverlay: finalIsOverlay,
                  errorMsg: finalError?.message || highAccErr?.message,
                });
              },
              {
                enableHighAccuracy: false,
                timeout: 1200,
                maximumAge: 60000,
              }
            );
          },
          {
            enableHighAccuracy: true,
            timeout: 2800,
            maximumAge: 0,
          }
        );
      } catch (callError: any) {
        console.warn('[useNativeGps] Geolocation invocation note:', callError);
        const isOverlay = isScreenOverlayError(callError);
        finish(null, 'denied', { isOverlay, errorMsg: callError?.message });
      }
    });
  }, []);

  // Cancel any active geolocation detection immediately
  const cancelGps = useCallback(() => {
    if (activeCancelRef.current) {
      activeCancelRef.current();
    }
    setIsDetecting(false);
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
    isOverlayBlocked,
    requestGps,
    cancelGps,
    clearOverlayBlocked,
    startLiveTracking,
    stopLiveTracking,
    openLocationSettings: openNativeLocationSettings,
    bypassGps,
  };
}
