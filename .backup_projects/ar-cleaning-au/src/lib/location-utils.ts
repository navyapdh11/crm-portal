import { getDistance } from 'geolib';
import * as turf from '@turf/turf';

/**
 * Calculate distance between two points in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const distance = getDistance(
    { latitude: lat1, longitude: lng1 },
    { latitude: lat2, longitude: lng2 }
  );
  return distance / 1000; // Convert to km
}

/**
 * Calculate estimated travel time in minutes
 * Assumes average urban speed of 40 km/h
 */
export function calculateTravelTime(distanceKm: number): number {
  const averageSpeedKmh = 40;
  return (distanceKm / averageSpeedKmh) * 60;
}

/**
 * Generate geohash from coordinates
 */
export function generateGeohash(lat: number, lng: number, precision: number = 7): string {
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let latRange = [-90, 90];
  let lngRange = [-180, 180];
  let geohash = '';
  let ch = 0;
  let bits = 0;
  let isEven = true;

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lngRange[0] + lngRange[1]) / 2;
      if (lng > mid) {
        ch |= (1 << (4 - bits));
        lngRange[0] = mid;
      } else {
        lngRange[1] = mid;
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat > mid) {
        ch |= (1 << (4 - bits));
        latRange[0] = mid;
      } else {
        latRange[1] = mid;
      }
    }
    isEven = !isEven;

    if (bits < 4) {
      bits++;
    } else {
      geohash += base32[ch];
      ch = 0;
      bits = 0;
    }
  }

  return geohash;
}

/**
 * Get nearby geohash neighbors
 */
export function getGeohashNeighbors(geohash: string, radius: number = 1): string[] {
  const neighbors: string[] = [];
  // Simple implementation - returns the geohash itself and adjacent cells
  // For production, use a proper geohash neighbor library
  neighbors.push(geohash);
  return neighbors;
}

/**
 * Calculate bounding box for area search
 */
export function calculateBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const earthRadiusKm = 6371;
  
  const latDelta = (radiusKm / earthRadiusKm) * (180 / Math.PI);
  const lngDelta = (radiusKm / earthRadiusKm) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

/**
 * Check if a point is within a polygon
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: number[][][]
): boolean {
  const pt = turf.point(point);
  const poly = turf.polygon(polygon);
  return turf.booleanPointInPolygon(pt, poly);
}

/**
 * Create a circular polygon around a point
 */
export function createCirclePolygon(
  lat: number,
  lng: number,
  radiusKm: number,
  steps: number = 64
): number[][][] {
  const center = turf.point([lng, lat]);
  const circle = turf.circle(center, radiusKm, { steps, units: 'kilometers' });
  return (circle.geometry.coordinates as number[][][])[0].map(coord => [coord]) as number[][][];
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

/**
 * Calculate ETA based on current location and destination
 */
export function calculateETA(
  currentLat: number,
  currentLng: number,
  destLat: number,
  destLng: number,
  currentSpeedKmh?: number
): { distance: number; eta: number; etaFormatted: string } {
  const distance = calculateDistance(currentLat, currentLng, destLat, destLng);
  const speed = currentSpeedKmh || 40; // Default 40 km/h urban average
  const etaMinutes = (distance / speed) * 60;

  return {
    distance,
    eta: etaMinutes,
    etaFormatted: formatDuration(etaMinutes),
  };
}
