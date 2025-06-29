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

// Move a point by a vector (in meters) from a given location
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

// Convert a displacement between two points to a vector (in meters)
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