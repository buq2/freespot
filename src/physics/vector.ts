// Vector math utilities for 2D wind calculations

export interface Vector2D {
  x: number; // East-West component (positive = East)
  y: number; // North-South component (positive = North)
}

/**
 * Converts wind direction and speed to vector components.
 * 
 * Uses meteorological convention where wind direction is where the wind is
 * coming FROM (e.g., 270° wind comes from the west, blowing toward the east).
 * The resulting vector represents the wind effect on a falling object.
 * 
 * @param direction - Wind direction in degrees (where wind comes FROM)
 * @param speed - Wind speed in m/s
 * @returns Vector with x=East component, y=North component
 * 
 * @example
 * ```typescript
 * // 270° wind at 10 m/s (west wind)
 * const windVector = windToVector(270, 10);
 * // Result: { x: 10, y: 0 } - pushes objects eastward
 * ```
 */
export const windToVector = (direction: number, speed: number): Vector2D => {
  // Convert from "coming from" to "going to" by adding 180°
  const radians = (direction + 180) * Math.PI / 180;
  return {
    x: speed * Math.sin(radians), // East component
    y: speed * Math.cos(radians), // North component
  };
};

/**
 * Converts vector components back to wind direction and speed.
 * 
 * Converts a drift vector back to meteorological wind notation
 * (direction is where wind comes FROM).
 * 
 * @param vector - Wind vector with x=East, y=North components
 * @returns Object with direction (degrees) and speed (m/s)
 * 
 * @example
 * ```typescript
 * const wind = vectorToWind({ x: 10, y: 0 });
 * // Result: { direction: 270, speed: 10 } - west wind at 10 m/s
 * ```
 */
export const vectorToWind = (vector: Vector2D): { direction: number; speed: number } => {
  const speed = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  
  if (speed === 0) {
    return { direction: 0, speed: 0 };
  }
  
  // Calculate direction the wind is going to
  let direction = Math.atan2(vector.x, vector.y) * 180 / Math.PI;
  
  // Convert to "coming from" by adding 180°
  direction = (direction + 180) % 360;
  if (direction < 0) direction += 360;
  
  return { direction, speed };
};

// Add two vectors
export const addVectors = (a: Vector2D, b: Vector2D): Vector2D => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

// Subtract vectors (a - b)
export const subtractVectors = (a: Vector2D, b: Vector2D): Vector2D => ({
  x: a.x - b.x,
  y: a.y - b.y,
});

// Scale a vector by a scalar
export const scaleVector = (vector: Vector2D, scalar: number): Vector2D => ({
  x: vector.x * scalar,
  y: vector.y * scalar,
});

// Get vector magnitude
export const vectorMagnitude = (vector: Vector2D): number => {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
};

// Normalize a vector to unit length
export const normalizeVector = (vector: Vector2D): Vector2D => {
  const mag = vectorMagnitude(vector);
  if (mag === 0) return { x: 0, y: 0 };
  return scaleVector(vector, 1 / mag);
};