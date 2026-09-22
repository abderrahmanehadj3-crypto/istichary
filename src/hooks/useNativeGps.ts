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
  setManualFallbackCoords: (coords: GpsCoordinates) => void;
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

  // Check initial browser permission status if supported
  useEffect(() => {
    if ('permissions' in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted') {
            setStatus('granted');
          } else if (permissionStatus.state === 'denied') {
            setStatus('denied');
          }

          permissionStatus.onchange = () => {
            if (permissionStatus.state === 'granted') {
              setStatus('granted');
              requestGps();
            } else if (permissionStatus.state === 'denied') {
              setStatus('denied');
            }
          };
        })
        .catch(() => {
          // Permissions API query not supported in this WebView environment
        });
    }
  }, []);

  // Request GPS position on demand with Android/WebView multi-tier fallback
  const requestGps = useCallback((): Promise<GpsCoordinates | null> => {
    return new Promise(async (resolve) => {
      // 1. Check if Capacitor Geolocation plugin exists in native wrapper
      const capGeo = (window as any).Capacitor?.Plugins?.Geolocation;
      if (capGeo) {
        try {
          setStatus('checking');
          const pos = await capGeo.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
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
          console.warn('[useNativeGps] Capacitor Geolocation failed, trying webview geolocation:', capErr);
        }
      }

      // 2. Standard navigator.geolocation check
      if (!navigator.geolocation) {
        setStatus('error');
        setErrorMessage('خاصية تحديد الموقع الجغرافي (GPS) غير مدعومة على هذا الجهاز.');
        resolve(null);
        return;
      }

      setStatus('checking');
      setErrorMessage(null);

      // Tier 1: High Accuracy (GPS hardware satellite lock)
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
        (error) => {
          console.warn('[useNativeGps] High-accuracy GPS timed out/failed, trying network/cell location fallback:', error);

          // Tier 2: Low-accuracy fast network/Wi-Fi fallback (indispensable inside buildings and Android WebViews)
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

              switch (finalError.code) {
                case finalError.PERMISSION_DENIED:
                  newStatus = 'denied';
                  errorMsg = 'تم رفض إذن الوصول إلى الموقع. يرجى تفعيل إذن GPS لتطبيق Sari3 في إعدادات الهاتف.';
                  break;
                case finalError.POSITION_UNAVAILABLE:
                  newStatus = 'disabled';
                  errorMsg = 'خدمات الموقع (GPS) غير مفعلة على هاتفك. يرجى سحب شريط الإشعارات وتشغيل زر الموقع.';
                  break;
                case finalError.TIMEOUT:
                  newStatus = 'disabled';
                  errorMsg = 'انتهت مهلة استجابة GPS. يرجى التأكد من تشغيل الموقع والمحاولة مجدداً.';
                  break;
              }

              setStatus(newStatus);
              setErrorMessage(errorMsg);
              resolve(null);
            },
            {
              enableHighAccuracy: false,
              timeout: 7000,
              maximumAge: 30000,
            }
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 5000,
        }
      );
    });
  }, []);

  // Start continuous live tracking
  const startLiveTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('GPS غير مدعوم على هذا الجهاز.');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsTracking(true);
    setStatus('checking');

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
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
          setErrorMessage('تم حظر إذن الموقع.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setStatus('disabled');
          setErrorMessage('خدمة GPS متوقفة.');
        }
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

  // Set manual fallback coordinates
  const setManualFallbackCoords = useCallback((fallbackCoords: GpsCoordinates) => {
    setCoords(fallbackCoords);
    setAccuracy(15);
    setStatus('granted');
    setErrorMessage(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    if (autoStart) {
      requestGps();
      startLiveTracking();
    }

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
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
    setManualFallbackCoords,
  };
}
