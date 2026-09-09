export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CityPreset {
  name: string;
  country: string;
  coords: Coordinates;
}

export const POPULAR_CITIES: CityPreset[] = [
  { name: 'Algiers', country: 'Algeria', coords: { lat: 36.7538, lng: 3.0588 } },
  { name: 'Paris', country: 'France', coords: { lat: 48.8566, lng: 2.3522 } },
  { name: 'Casablanca', country: 'Morocco', coords: { lat: 33.5731, lng: -7.5898 } },
  { name: 'Cairo', country: 'Egypt', coords: { lat: 30.0444, lng: 31.2357 } },
  { name: 'London', country: 'United Kingdom', coords: { lat: 51.5074, lng: -0.1278 } },
  { name: 'Boston', country: 'United States', coords: { lat: 42.3601, lng: -71.0589 } },
  { name: 'Dubai', country: 'UAE', coords: { lat: 25.2048, lng: 55.2708 } },
  { name: 'Tunis', country: 'Tunisia', coords: { lat: 36.8065, lng: 10.1815 } },
  { name: 'Riyadh', country: 'Saudi Arabia', coords: { lat: 24.7136, lng: 46.6753 } },
];

/**
 * Calculates great-circle distance between two points in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}
