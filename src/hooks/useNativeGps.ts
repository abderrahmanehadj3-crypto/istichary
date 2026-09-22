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
const DEFAULT_ALGIERS_COORDS: GpsCoordinates = {
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
    if ('permissions' in navigator && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted') {
            setStatus('granted');
          } else if (permissionStatus.state === 'denied') {
            setStatus('denied');
          } else {
            setStatus('idle');
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
          // Permissions API query not supported in this browser environment
        });
    }
  }, []);

  // Request GPS position on demand
  const requestGps = useCallback((): Promise<GpsCoordinates | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setStatus('error');
        setErrorMessage('خاصية تحديد الموقع الجغرافي (GPS) غير مدعومة على هذا الجهاز.');
        resolve(null);
        return;
      }

      setStatus('checking');
      setErrorMessage(null);

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      };

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
          let errorMsg = 'تعذر الحصول على إحداثيات الموقع عبر GPS.';
          let newStatus: GpsStatus = 'error';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              newStatus = 'denied';
              errorMsg = 'تم رفض إذن الوصول إلى الموقع. يرجى تفعيل إذن GPS في إعدادات المتصفح/الهاتف.';
              break;
            case error.POSITION_UNAVAILABLE:
              newStatus = 'disabled';
              errorMsg = 'خدمات الموقع (GPS) غير مفعلة على هاتفك. يرجى تشغيل زر الموقع في شريط الإشعارات.';
              break;
            case error.TIMEOUT:
              newStatus = 'disabled';
              errorMsg = 'انتهت مهلة استجابة GPS. يرجى التأكد من تشغيل الموقع والمحاولة مجدداً.';
              break;
          }

          setStatus(newStatus);
          setErrorMessage(errorMsg);
          resolve(null);
        },
        options
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
      timeout: 12000,
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

  // Set manual fallback coordinates (useful for emulator testing or wilaya center)
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
