import { Language } from '../types';
import { ALGERIA_WILAYAS, calculateDistanceKm } from '../data/wilayas';

export interface DetailedAddress {
  fullAddress: string;
  street: string;
  neighborhood: string;
  city: string;
  wilaya: string;
  landmark?: string;
  postcode?: string;
}

// In-memory cache to prevent repeated network calls for same coordinates
const geocodeCache = new Map<string, string>();
const detailedGeocodeCache = new Map<string, DetailedAddress>();

/**
 * Clean up road names (remove duplicates or overly repetitive text)
 */
function cleanName(name: string): string {
  if (!name) return '';
  return name.trim().replace(/\s{2,}/g, ' ');
}

/**
 * Format a human-readable, professional Algerian address from components.
 * Prioritizes: [Landmark / POI] -> [Street / Boulevard] -> [Neighborhood / Quarter] -> [Commune / City] -> [Wilaya]
 */
function composeAlgerianAddress(
  components: {
    landmark?: string;
    street?: string;
    neighborhood?: string;
    city?: string;
    wilaya?: string;
  },
  lang: Language | string = 'ar'
): string {
  const parts: string[] = [];

  if (components.landmark) {
    parts.push(cleanName(components.landmark));
  }

  if (components.street && components.street !== components.landmark) {
    parts.push(cleanName(components.street));
  }

  if (
    components.neighborhood &&
    components.neighborhood !== components.street &&
    components.neighborhood !== components.landmark
  ) {
    const isAr = lang === 'ar';
    const nbName = cleanName(components.neighborhood);
    // Add "حي" prefix if not already present in Arabic
    const formattedNb =
      isAr && !nbName.startsWith('حي') && !nbName.startsWith('منطقة')
        ? `حي ${nbName}`
        : nbName;
    parts.push(formattedNb);
  }

  if (components.city && !parts.includes(components.city)) {
    parts.push(cleanName(components.city));
  }

  if (
    components.wilaya &&
    !parts.includes(components.wilaya) &&
    !parts.some((p) => p.includes(components.wilaya!))
  ) {
    parts.push(cleanName(components.wilaya));
  }

  const separator = lang === 'ar' ? '، ' : ', ';
  return parts.filter(Boolean).join(separator);
}

/**
 * Reverse geocode latitude and longitude to detailed address components.
 * Uses OpenStreetMap Nominatim with fallback to Photon (OSM cluster) and Algerian Wilayas.
 */
export async function reverseGeocodeDetailed(
  lat: number,
  lng: number,
  lang: Language | string = 'ar'
): Promise<DetailedAddress> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}_${lang}`;
  if (detailedGeocodeCache.has(cacheKey)) {
    return detailedGeocodeCache.get(cacheKey)!;
  }

  const langHeader = lang === 'ar' ? 'ar,fr,en' : lang === 'fr' ? 'fr,ar,en' : 'en,fr,ar';

  // 1. Try Primary: OpenStreetMap Nominatim (High resolution zoom=18 for street & building level)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=${encodeURIComponent(
      langHeader
    )}`;

    const response = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};

      const landmark =
        addr.amenity ||
        addr.building ||
        addr.shop ||
        addr.tourism ||
        addr.office ||
        addr.historic ||
        (data.category === 'amenity' || data.category === 'tourism' ? data.name : '') ||
        '';

      const street =
        addr.road ||
        addr.pedestrian ||
        addr.street ||
        addr.boulevard ||
        addr.avenue ||
        addr.residential ||
        addr.footway ||
        addr.path ||
        '';

      const neighborhood =
        addr.neighbourhood ||
        addr.suburb ||
        addr.quarter ||
        addr.city_district ||
        addr.hamlet ||
        addr.village ||
        '';

      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.county ||
        addr.district ||
        '';

      const wilaya = addr.state || '';
      const postcode = addr.postcode || '';

      const fullAddress = composeAlgerianAddress(
        { landmark, street, neighborhood, city, wilaya },
        lang
      );

      if (fullAddress) {
        const result: DetailedAddress = {
          fullAddress,
          street,
          neighborhood,
          city,
          wilaya,
          landmark,
          postcode,
        };
        detailedGeocodeCache.set(cacheKey, result);
        geocodeCache.set(cacheKey, fullAddress);
        return result;
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode note, checking backup:', err);
  }

  // 2. Try Secondary Backup: Photon Geocoder (OSM Global Elastic Cluster)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const photonUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
    const response = await fetch(photonUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const props = data.features[0].properties || {};

        const landmark = props.name || '';
        const street = props.street || '';
        const neighborhood = props.locality || props.district || '';
        const city = props.city || props.town || '';
        const wilaya = props.state || '';
        const postcode = props.postcode || '';

        const fullAddress = composeAlgerianAddress(
          { landmark, street, neighborhood, city, wilaya },
          lang
        );

        if (fullAddress) {
          const result: DetailedAddress = {
            fullAddress,
            street,
            neighborhood,
            city,
            wilaya,
            landmark,
            postcode,
          };
          detailedGeocodeCache.set(cacheKey, result);
          geocodeCache.set(cacheKey, fullAddress);
          return result;
        }
      }
    }
  } catch (err) {
    console.warn('Photon reverse geocode backup note:', err);
  }

  // 3. Intelligent Regional Fallback: Match closest Algerian Wilaya
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
  const isAr = lang === 'ar';
  const fallbackAddress = isAr
    ? `موقع محدد بالقرب من ${wilayaName} (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    : `Location near ${wilayaName} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

  const fallbackResult: DetailedAddress = {
    fullAddress: fallbackAddress,
    street: isAr ? 'موقع محدد على الخريطة' : 'Selected location',
    neighborhood: '',
    city: wilayaName,
    wilaya: wilayaName,
  };

  detailedGeocodeCache.set(cacheKey, fallbackResult);
  geocodeCache.set(cacheKey, fallbackAddress);
  return fallbackResult;
}

/**
 * Reverse geocode latitude and longitude to a human-readable street address string.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  lang: Language | string = 'ar'
): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}_${lang}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  const detailed = await reverseGeocodeDetailed(lat, lng, lang);
  return detailed.fullAddress;
}
