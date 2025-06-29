import { ForecastData } from '../types';
import { Vector2D, windToVector, addVectors, scaleVector } from './vector';
import { interpolateWeatherData } from '../services/weather/openmeteo';

export interface DriftResult {
  horizontalDistance: number; // meters
  driftVector: Vector2D; // meters
  timeInAir: number; // seconds
}

// Calculate wind drift during freefall
export const calculateFreefallDrift = (
  weatherData: ForecastData[],
  startAltitude: number, // AGL in meters
  endAltitude: number, // AGL in meters  
  freefallSpeed: number // m/s
): DriftResult => {
  // Calculate time to fall
  const altitudeDifference = startAltitude - endAltitude;
  const timeInAir = altitudeDifference / freefallSpeed;
  
  // Integrate wind drift over altitude range
  // We'll use Simpson's rule for better accuracy
  const numSteps = Math.ceil(altitudeDifference / 100); // Sample every 100m
  const stepSize = altitudeDifference / numSteps;
  
  let totalDrift: Vector2D = { x: 0, y: 0 };
  
  for (let i = 0; i <= numSteps; i++) {
    const altitude = startAltitude - (i * stepSize);
    const wind = interpolateWeatherData(weatherData, altitude);
    const windVector = windToVector(wind.direction, wind.speed);
    
    // Simpson's rule coefficients
    let coefficient = 1;
    if (i === 0 || i === numSteps) {
      coefficient = 1;
    } else if (i % 2 === 0) {
      coefficient = 2;
    } else {
      coefficient = 4;
    }
    
    const timeAtThisStep = stepSize / freefallSpeed;
    const driftAtThisStep = scaleVector(windVector, timeAtThisStep * coefficient);
    totalDrift = addVectors(totalDrift, driftAtThisStep);
  }
  
  // Apply Simpson's rule divisor
  totalDrift = scaleVector(totalDrift, 1 / 3);
  
  return {
    horizontalDistance: Math.sqrt(totalDrift.x * totalDrift.x + totalDrift.y * totalDrift.y),
    driftVector: totalDrift,
    timeInAir
  };
};

// Calculate wind drift under canopy
export const calculateCanopyDrift = (
  weatherData: ForecastData[],
  startAltitude: number, // AGL in meters
  targetAltitude: number, // AGL in meters (usually 0 for ground)
  canopyAirSpeed: number, // m/s
  canopyDescentRate: number, // m/s
  glideRatio: number,
  desiredDirection: number // degrees, direction TO fly
): DriftResult => {
  // Calculate base canopy performance
  const forwardSpeed = canopyAirSpeed;
  const canopyVector = windToVector(desiredDirection - 180, forwardSpeed); // Convert to vector
  
  // Time to descend
  const altitudeDifference = startAltitude - targetAltitude;
  const timeInAir = altitudeDifference / canopyDescentRate;
  
  // Integrate wind effect over descent
  const numSteps = Math.ceil(altitudeDifference / 50); // Sample every 50m for canopy
  const stepSize = altitudeDifference / numSteps;
  
  let totalDrift: Vector2D = { x: 0, y: 0 };
  
  for (let i = 0; i <= numSteps; i++) {
    const altitude = startAltitude - (i * stepSize);
    const wind = interpolateWeatherData(weatherData, altitude);
    const windVector = windToVector(wind.direction, wind.speed);
    
    // Ground speed = air speed + wind
    const groundSpeed = addVectors(canopyVector, windVector);
    
    // Time at this altitude band
    const timeAtThisStep = stepSize / canopyDescentRate;
    
    // Distance covered at this altitude
    const distanceAtThisStep = scaleVector(groundSpeed, timeAtThisStep);
    
    totalDrift = addVectors(totalDrift, distanceAtThisStep);
  }
  
  return {
    horizontalDistance: Math.sqrt(totalDrift.x * totalDrift.x + totalDrift.y * totalDrift.y),
    driftVector: totalDrift,
    timeInAir
  };
};

// Calculate total drift from exit to landing
export const calculateTotalDrift = (
  weatherData: ForecastData[],
  exitAltitude: number, // AGL
  openingAltitude: number, // AGL
  landingAltitude: number, // AGL (usually 0)
  freefallSpeed: number,
  canopyAirSpeed: number,
  canopyDescentRate: number,
  glideRatio: number,
  canopyDirection: number
): { freefall: DriftResult; canopy: DriftResult; total: Vector2D } => {
  const freefall = calculateFreefallDrift(
    weatherData,
    exitAltitude,
    openingAltitude,
    freefallSpeed
  );
  
  const canopy = calculateCanopyDrift(
    weatherData,
    openingAltitude,
    landingAltitude,
    canopyAirSpeed,
    canopyDescentRate,
    glideRatio,
    canopyDirection
  );
  
  const total = addVectors(freefall.driftVector, canopy.driftVector);
  
  return { freefall, canopy, total };
};