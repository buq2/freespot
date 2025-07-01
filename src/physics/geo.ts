import type { LatLon } from '../types';
import type { Vector2D } from './vector';
import * as geolib from 'geolib';

// Re-export useful geolib functions with our types
export const calculateDistance = (from: LatLon, to: LatLon): number => {
  return geolib.getDistance(
    { latitude: from.lat, longitude: from.lon },
    { latitude: to.lat, longitude: to.lon }
  );
};

export const calculateBearing = (from: LatLon, to: LatLon): number => {
  return geolib.getRhumbLineBearing(
    { latitude: from.lat, longitude: from.lon },
    { latitude: to.lat, longitude: to.lon }
  );
};

/**
 * Moves a geographic point by a given vector displacement.
 * 
 * This function is essential for calculating exit points based on drift vectors.
 * It converts a Cartesian vector (in meters) to a geographic displacement and
 * applies it to the starting coordinates.
 * 
 * @param from - Starting geographic coordinates
 * @param vector - Displacement vector in meters (x=East, y=North)
 * @returns New geographic coordinates after applying the displacement
 * 
 * @example
 * ```typescript
 * const newPoint = movePoint(
 *   { lat: 61.7807, lon: 22.7221 },
 *   { x: 1000, y: -500 }  // 1km east, 500m south
 * );
 * ```
 */
export const movePoint = (from: LatLon, vector: Vector2D): LatLon => {
  const distance = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  const bearing = Math.atan2(vector.x, vector.y) * 180 / Math.PI;
  
  const result = geolib.computeDestinationPoint(
    { latitude: from.lat, longitude: from.lon },
    distance,
    bearing
  );
  
  return {
    lat: result.latitude,
    lon: result.longitude
  };
};

/**
 * Converts the displacement between two geographic points to a Cartesian vector.
 * 
 * This function is used to convert geographic coordinates to vectors for drift
 * calculations. The resulting vector represents the displacement in meters.
 * 
 * @param from - Starting geographic coordinates
 * @param to - Ending geographic coordinates
 * @returns Vector representing the displacement (x=East, y=North) in meters
 * 
 * @example
 * ```typescript
 * const displacement = pointsToVector(
 *   { lat: 61.7807, lon: 22.7221 },  // Landing zone
 *   { lat: 61.7900, lon: 22.7300 }   // Exit point
 * );
 * 
 * console.log(`Displacement: ${displacement.x}m east, ${displacement.y}m north`);
 * ```
 */
export const pointsToVector = (from: LatLon, to: LatLon): Vector2D => {
  const distance = calculateDistance(from, to);
  const bearing = calculateBearing(from, to) * Math.PI / 180;
  
  return {
    x: distance * Math.sin(bearing),
    y: distance * Math.cos(bearing)
  };
};

// Calculate a point at a given distance and bearing
export const getDestinationPoint = (from: LatLon, distance: number, bearing: number): LatLon => {
  const result = geolib.computeDestinationPoint(
    { latitude: from.lat, longitude: from.lon },
    distance,
    bearing
  );
  
  return {
    lat: result.latitude,
    lon: result.longitude
  };
};