export interface RouteStep {
  instruction: string;
  name: string;
  distanceMeters: number;
  durationSeconds: number;
  type: string;
  modifier?: string;
}

export interface OsrmRouteResult {
  coordinates: [number, number][]; // [lat, lng] array ready for Leaflet
  distanceKm: number;
  durationMinutes: number;
  summary: string;
  steps: RouteStep[];
  isRealRoadRoute: boolean;
}

// In-memory cache for OSRM routes to avoid duplicate requests
const routeCache = new Map<string, OsrmRouteResult>();

// Translate basic OSRM maneuvers into friendly Arabic or French instructions
function formatStepInstruction(
  type: string,
  modifier: string | undefined,
  streetName: string,
  lang: string = 'ar'
): string {
  const isAr = lang === 'ar';
  const name = streetName || (isAr ? 'شارع غير مسمى' : 'Unnamed road');

  if (type === 'depart') {
    return isAr ? `انطلق في ${name}` : `Head out on ${name}`;
  }
  if (type === 'arrive') {
    return isAr ? `وصلت إلى وجهتك في ${name}` : `Arrive at destination on ${name}`;
  }

  const modAr: Record<string, string> = {
    left: 'يساراً',
    right: 'يميناً',
    'sharp left': 'أقصى اليسار',
    'sharp right': 'أقصى اليمين',
    'slight left': 'انعطاف خفيف لليسار',
    'slight right': 'انعطاف خفيف لليمين',
    straight: 'مباشرة إلى الأمام',
    uturn: 'دوران للخلف (U-turn)',
  };

  const modFr: Record<string, string> = {
    left: 'à gauche',
    right: 'à droite',
    'sharp left': 'fortement à gauche',
    'sharp right': 'fortement à droite',
    'slight left': 'légèrement à gauche',
    'slight right': 'légèrement à droite',
    straight: 'tout droit',
    uturn: 'demi-tour',
  };

  const modText = isAr
    ? (modifier && modAr[modifier]) || 'للأمام'
    : (modifier && modFr[modifier]) || 'tout droit';

  if (type === 'turn') {
    return isAr ? `انعطف ${modText} نحو ${name}` : `Tournez ${modText} sur ${name}`;
  }
  if (type === 'new name' || type === 'continue') {
    return isAr ? `واصل ${modText} على ${name}` : `Continuez ${modText} sur ${name}`;
  }
  if (type === 'roundabout') {
    return isAr ? `ادخل الدوار وواصل في ${name}` : `Prenez le rond-point vers ${name}`;
  }
  if (type === 'fork') {
    return isAr ? `الزم المسار ${modText} نحو ${name}` : `Prenez la bifurcation ${modText} vers ${name}`;
  }

  return isAr ? `اتجه نحو ${name}` : `Dirigez-vous vers ${name}`;
}

/**
 * Fetch a real driving route following actual streets and highways from OSRM.
 * Returns Leaflet-ready coordinates, exact street distance in km, duration, and steps.
 */
export async function fetchOsrmRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  lang: string = 'ar'
): Promise<OsrmRouteResult> {
  const cacheKey = `${start.lat.toFixed(4)},${start.lng.toFixed(4)}->${end.lat.toFixed(4)},${end.lng.toFixed(4)}_${lang}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // Fallback straight line generator in case of network issues
  const createFallbackRoute = (): OsrmRouteResult => {
    // Haversine calculation with realistic urban road curvature multiplier (1.3x)
    const R = 6371;
    const dLat = ((end.lat - start.lat) * Math.PI) / 180;
    const dLng = ((end.lng - start.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((start.lat * Math.PI) / 180) *
        Math.cos((end.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightKm = R * c;
    const roadEstimatedKm = Number((straightKm * 1.3).toFixed(1));
    const durationMinutes = Math.max(3, Math.round(roadEstimatedKm * 2.2));

    return {
      coordinates: [
        [start.lat, start.lng],
        [end.lat, end.lng],
      ],
      distanceKm: roadEstimatedKm,
      durationMinutes,
      summary: lang === 'ar' ? 'مسار مباشر تقديري' : 'Direct estimated route',
      steps: [
        {
          instruction: lang === 'ar' ? 'انطلق من نقطة الاستلام' : 'Depart pickup',
          name: '',
          distanceMeters: roadEstimatedKm * 1000,
          durationSeconds: durationMinutes * 60,
          type: 'depart',
        },
        {
          instruction: lang === 'ar' ? 'الوصول إلى الوجهة' : 'Arrive at destination',
          name: '',
          distanceMeters: 0,
          durationSeconds: 0,
          type: 'arrive',
        },
      ],
      isRealRoadRoute: false,
    };
  };

  // Try endpoints: primary OSRM, secondary OSM routing mirror
  const endpoints = [
    `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`,
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];

          // OSRM GeoJSON geometry coordinates are [lng, lat] -> convert to Leaflet [lat, lng]
          const coordinates: [number, number][] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );

          const distanceMeters = route.distance || 0;
          const distanceKm = Number((distanceMeters / 1000).toFixed(1));
          const durationSeconds = route.duration || 0;
          const durationMinutes = Math.max(2, Math.round(durationSeconds / 60));

          // Extract turn-by-turn steps
          const steps: RouteStep[] = [];
          if (route.legs && route.legs[0] && route.legs[0].steps) {
            for (const step of route.legs[0].steps) {
              steps.push({
                instruction: formatStepInstruction(
                  step.maneuver?.type || 'turn',
                  step.maneuver?.modifier,
                  step.name || '',
                  lang
                ),
                name: step.name || '',
                distanceMeters: Math.round(step.distance || 0),
                durationSeconds: Math.round(step.duration || 0),
                type: step.maneuver?.type || 'turn',
                modifier: step.maneuver?.modifier,
              });
            }
          }

          const summary =
            route.legs?.[0]?.summary ||
            (lang === 'ar' ? 'مسار حقيقي عبر الشوارع' : 'Real street route');

          const result: OsrmRouteResult = {
            coordinates,
            distanceKm,
            durationMinutes,
            summary,
            steps,
            isRealRoadRoute: true,
          };

          routeCache.set(cacheKey, result);
          return result;
        }
      }
    } catch (err) {
      // Continue to next mirror or fallback
      console.warn('OSRM routing fetch note for', url, err);
    }
  }

  // Gracefully return estimated fallback if all mirrors fail
  const fallback = createFallbackRoute();
  routeCache.set(cacheKey, fallback);
  return fallback;
}
