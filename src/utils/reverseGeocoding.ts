import { Language } from '../types';
import { ALGERIA_WILAYAS, calculateDistanceKm } from '../data/wilayas';

// In-memory cache to prevent repeated calls for same coords
const geocodeCache = new Map<string, string>();

/**
 * Reverse geocode latitude and longitude to a human-readable address.
 * Uses OpenStreetMap Nominatim with fallback to closest Algerian Wilaya / Daira.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  lang: Language = 'ar'
): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}_${lang}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // 1. Try OpenStreetMap Nominatim reverse geocode
  try {
    const langHeader = lang === 'ar' ? 'ar,fr,en' : lang === 'fr' ? 'fr,ar,en' : 'en,fr,ar';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=${langHeader}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};

      const road = addr.road || addr.pedestrian || addr.street || addr.suburb || '';
      const neighbourhood = addr.neighbourhood || addr.suburb || addr.quarter || '';
      const city = addr.city || addr.town || addr.municipality || addr.county || '';
      const state = addr.state || '';

      const parts = [road, neighbourhood, city, state].filter(Boolean);
      if (parts.length > 0) {
        const fullAddress = parts.join('، ');
        geocodeCache.set(cacheKey, fullAddress);
        return fullAddress;
      } else if (data.display_name) {
        // Fallback to truncated display_name
        const shortName = data.display_name.split(',').slice(0, 3).join('، ');
        geocodeCache.set(cacheKey, shortName);
        return shortName;
      }
    }
  } catch (err) {
    // Network timeout or blocked, proceed to regional fallback
    console.warn('Nominatim reverse geocode note:', err);
  }

  // 2. Intelligent Regional Fallback: Match closest Algerian Wilaya
  let closestWilaya = ALGERIA_WILAYAS[0];
  let minDistance = calculateDistanceKm(lat, lng, closestWilaya.lat, closestWilaya.lng);

  for (const wilaya of ALGERIA_WILAYAS) {
    const dist = calculateDistanceKm(lat, lng, wilaya.lat, wilaya.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestWilaya = wilaya;
    }
  }

  const wilayaName = lang === 'ar' ? closestWilaya.nameAr : closestWilaya.nameFr;
  const fallbackAddress =
    lang === 'ar'
      ? `موقع محدد بالقرب من ${wilayaName} (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      : `Location near ${wilayaName} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

  geocodeCache.set(cacheKey, fallbackAddress);
  return fallbackAddress;
}
