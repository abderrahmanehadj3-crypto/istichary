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
  const [coords, setCoords] = useState<GpsCoordinates | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [status, setStatus] = useState<GpsStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);

  // Seamless bypass mechanism: sets valid coordinates and clears blockers
  const bypassGps = useCallback((fallbackCoords?: GpsCoordinates): GpsCoordinates => {
    const target = fallbackCoords || coords || DEFAULT_ALGIERS_COORDS;
    setCoords(target);
    setAccuracy(15);
    setStatus('granted');
    setErrorMessage(null);
    return target;
  }, [coords]);

  // Request GPS position on demand with robust Median native bridge and Web Geolocation fallback
  const requestGps = useCallback((): Promise<GpsCoordinates | null> => {
    return new Promise(async (resolve) => {
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
            timeout: 10000,
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
          console.warn('[useNativeGps] Capacitor Geolocation error, continuing with navigator:', capErr);
        }
      }

      // 3. Standard navigator.geolocation check
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setStatus('error');
        setErrorMessage('خاصية تحديد الموقع الجغرافي (GPS) غير مدعومة على هذا الجهاز.');
        resolve(null);
        return;
      }

      // Primary call: High Accuracy with exact required options
      // enableHighAccuracy: true, timeout: 10000, maximumAge: 0
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
        (highAccErr) => {
          console.warn('[useNativeGps] Primary high-accuracy GPS failed in WebView, trying network fallback:', highAccErr);

          // Fallback: Low accuracy network / wifi / cell tower triangulation
          // (Crucial inside buildings and Android WebViews to prevent locking)
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
            (finalError) => {
              let errorMsg = 'تعذر الحصول على إحداثيات الموقع عبر GPS.';
              let newStatus: GpsStatus = 'error';

              if (finalError.code === finalError.PERMISSION_DENIED) {
                newStatus = 'denied';
                errorMsg = 'تم رفض إذن الوصول إلى الموقع. يمكنك تفعيله من الإعدادات أو المتابعة باختيار الموقع على الخريطة.';
              } else if (finalError.code === finalError.POSITION_UNAVAILABLE) {
                newStatus = 'disabled';
                errorMsg = 'خدمات الموقع (GPS) غير مفعلة أو ضعيفة الإشارة. يرجى التأكد من تشغيل زر الموقع بالهاتف.';
              } else if (finalError.code === finalError.TIMEOUT) {
                newStatus = 'disabled';
                errorMsg = 'انتهت مهلة استجابة GPS. يمكنك المتابعة بتحديد الموقع مباشرة على الخريطة.';
              }

              setStatus(newStatus);
              setErrorMessage(errorMsg);
              resolve(null);
            },
            {
              enableHighAccuracy: false,
              timeout: 8000,
              maximumAge: 60000,
            }
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  // Start continuous live tracking
  const startLiveTracking = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('error');
      setErrorMessage('GPS غير مدعوم على هذا الجهاز.');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsTracking(true);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 3000,
    };

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
        console.warn('[useNativeGps] watchPosition warning:', error);
      },
      options
    );

    watchIdRef.current = watchId;
  }, []);

  // Stop live tracking
  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Cleanup on unmount or autoStart
  useEffect(() => {
    if (autoStart) {
      requestGps();
      startLiveTracking();
    }

    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [autoStart, requestGps, startLiveTracking]);

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
