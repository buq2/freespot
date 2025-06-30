import type { LatLon } from '../types';

/**
 * Calculate distance between two points in meters using Haversine formula
 */
export const calculateDistance = (point1: LatLon, point2: LatLon): number => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lon - point1.lon) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calculate bearing between two points in degrees
 */
export const calculateBearing = (point1: LatLon, point2: LatLon): number => {
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δλ = ((point2.lon - point1.lon) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
};

/**
 * Calculate new position given a starting point, distance, and bearing
 */
export const calculateDestination = (
  start: LatLon,
  distance: number,
  bearing: number
): LatLon => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (start.lat * Math.PI) / 180;
  const λ1 = (start.lon * Math.PI) / 180;
  const θ = (bearing * Math.PI) / 180;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(distance / R) +
    Math.cos(φ1) * Math.sin(distance / R) * Math.cos(θ)
  );

  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(distance / R) * Math.cos(φ1),
    Math.cos(distance / R) - Math.sin(φ1) * Math.sin(φ2)
  );

  return {
    lat: (φ2 * 180) / Math.PI,
    lon: (λ2 * 180) / Math.PI,
  };
};

/**
 * Generate points for a circle around a center point
 */
export const generateCirclePoints = (
  center: LatLon,
  radius: number,
  numPoints: number = 64
): LatLon[] => {
  const points: LatLon[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const bearing = (i * 360) / numPoints;
    const point = calculateDestination(center, radius, bearing);
    points.push(point);
  }
  
  return points;
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (latLon: LatLon, precision: number = 4): string => {
  return `${latLon.lat.toFixed(precision)}, ${latLon.lon.toFixed(precision)}`;
};

/**
 * Validate if coordinates are within valid ranges
 */
export const isValidCoordinates = (latLon: LatLon): boolean => {
  return (
    latLon.lat >= -90 &&
    latLon.lat <= 90 &&
    latLon.lon >= -180 &&
    latLon.lon <= 180
  );
};