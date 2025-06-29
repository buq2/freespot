import { LatLon, JumpParameters, ForecastData, ExitPoint } from '../types';
import { movePoint, pointsToVector, calculateBearing, calculateDistance } from './geo';
import { calculateFreefallDrift, calculateCanopyDrift } from './wind-drift';
import { Vector2D, windToVector, vectorToWind, subtractVectors, addVectors, scaleVector, vectorMagnitude } from './vector';
import { interpolateWeatherData } from '../services/weather/openmeteo';

// Safety margins
const SAFETY_RADIUS_MARGIN = 0.7; // 70% of theoretical maximum distance
const REACHABILITY_MARGIN = 0.9; // 90% of theoretical maximum distance
const CONVERGENCE_TOLERANCE = 10; // meters
const MAX_ITERATIONS = 20;
const INITIAL_GUESS_DISTANCE = 2000; // meters upwind

export interface ExitCalculationResult {
  optimalExitPoint: LatLon;
  exitPoints: ExitPoint[];
  safetyRadius: number; // meters - radius from which landing zone can be reached
  aircraftHeading: number; // degrees
}

// Calculate the direction to fly the canopy to reach target from a given position
const calculateCanopyDirection = (
  currentPosition: LatLon,
  targetPosition: LatLon,
  weatherData: ForecastData[],
  openingAltitude: number,
  canopyAirSpeed: number
): number => {
  const targetVector = pointsToVector(currentPosition, targetPosition);
  
  // Get average wind during canopy flight
  const numSamples = 5;
  let avgWindVector: Vector2D = { x: 0, y: 0 };
  
  for (let i = 0; i < numSamples; i++) {
    const altitude = openingAltitude * (1 - i / (numSamples - 1));
    const wind = interpolateWeatherData(weatherData, altitude);
    const windVector = windToVector(wind.direction, wind.speed);
    avgWindVector = addVectors(avgWindVector, windVector);
  }
  
  avgWindVector = scaleVector(avgWindVector, 1 / numSamples);
  
  // Calculate required ground speed vector
  const requiredGroundSpeed = targetVector;
  
  // Required airspeed = ground speed - wind
  const requiredAirSpeed = subtractVectors(requiredGroundSpeed, avgWindVector);
  
  // Convert to direction
  const { direction } = vectorToWind(requiredAirSpeed);
  
  return direction;
};

// Find exit point for a single jumper/group
const findSingleExitPoint = (
  landingZone: LatLon,
  weatherData: ForecastData[],
  params: JumpParameters
): LatLon | null => {
  // Start with an initial guess - upwind from landing zone
  const windAtExit = interpolateWeatherData(weatherData, params.jumpAltitude);
  const initialOffset = windToVector(windAtExit.direction, INITIAL_GUESS_DISTANCE);
  let currentGuess = movePoint(landingZone, initialOffset);
  
  // Iterative refinement
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Calculate freefall drift from current guess
    const freefallDrift = calculateFreefallDrift(
      weatherData,
      params.jumpAltitude,
      params.openingAltitude,
      params.freefallSpeed
    );
    
    // Position after freefall
    const openingPosition = movePoint(currentGuess, freefallDrift.driftVector);
    
    // Calculate required canopy direction
    const canopyDirection = calculateCanopyDirection(
      openingPosition,
      landingZone,
      weatherData,
      params.openingAltitude,
      params.canopyAirSpeed
    );
    
    // Calculate canopy drift
    const canopyDrift = calculateCanopyDrift(
      weatherData,
      params.openingAltitude,
      0, // ground level
      params.canopyAirSpeed,
      params.canopyDescentRate,
      params.glideRatio,
      canopyDirection
    );
    
    // Final landing position
    const landingPosition = movePoint(openingPosition, canopyDrift.driftVector);
    
    // Calculate error
    const error = calculateDistance(landingPosition, landingZone);
    
    if (error < CONVERGENCE_TOLERANCE) {
      return currentGuess;
    }
    
    // Adjust guess based on error
    const errorVector = pointsToVector(landingPosition, landingZone);
    currentGuess = movePoint(currentGuess, errorVector);
  }
  
  return null; // Failed to converge
};

// Calculate aircraft heading based on wind or user preference
const calculateAircraftHeading = (
  weatherData: ForecastData[],
  exitAltitude: number,
  userDefinedHeading?: number
): number => {
  if (userDefinedHeading !== undefined) {
    return userDefinedHeading;
  }
  
  // Use headwind at exit altitude
  const windAtExit = interpolateWeatherData(weatherData, exitAltitude);
  return (windAtExit.direction + 180) % 360; // Fly into the wind
};

// Calculate exit points for multiple groups
export const calculateExitPoints = (
  params: JumpParameters,
  weatherData: ForecastData[]
): ExitCalculationResult => {
  // Find optimal exit point for middle group
  const optimalExit = findSingleExitPoint(params.landingZone, weatherData, params);
  
  if (!optimalExit) {
    throw new Error('Could not calculate exit point - check parameters');
  }
  
  // Calculate aircraft heading
  const aircraftHeading = calculateAircraftHeading(
    weatherData,
    params.jumpAltitude,
    params.flightDirection
  );
  
  // Calculate spacing between groups
  const spacingTime = params.timeBetweenGroups;
  const spacingDistance = params.aircraftSpeed * spacingTime;
  
  // Generate exit points for all groups
  const exitPoints: ExitPoint[] = [];
  const halfGroups = Math.floor(params.numberOfGroups / 2);
  
  for (let i = 0; i < params.numberOfGroups; i++) {
    const groupOffset = (i - halfGroups) * spacingDistance;
    
    // Move along aircraft flight path
    const offsetVector = windToVector(aircraftHeading - 180, groupOffset);
    const exitLocation = movePoint(optimalExit, offsetVector);
    
    exitPoints.push({
      location: exitLocation,
      groupNumber: i + 1
    });
  }
  
  // Calculate safety radius (maximum distance from which landing zone can be reached)
  const maxCanopyDistance = params.canopyAirSpeed * (params.openingAltitude / params.canopyDescentRate);
  const safetyRadius = maxCanopyDistance * SAFETY_RADIUS_MARGIN;
  
  return {
    optimalExitPoint: optimalExit,
    exitPoints,
    safetyRadius,
    aircraftHeading
  };
};

// Check if a given exit point can reach the landing zone
export const canReachLandingZone = (
  exitPoint: LatLon,
  landingZone: LatLon,
  weatherData: ForecastData[],
  params: JumpParameters
): boolean => {
  // Calculate freefall drift
  const freefallDrift = calculateFreefallDrift(
    weatherData,
    params.jumpAltitude,
    params.openingAltitude,
    params.freefallSpeed
  );
  
  // Position after freefall
  const openingPosition = movePoint(exitPoint, freefallDrift.driftVector);
  
  // Calculate distance to landing zone
  const distanceToTarget = calculateDistance(openingPosition, landingZone);
  
  // Maximum canopy range (simplified - doesn't account for wind)
  const maxCanopyRange = params.canopyAirSpeed * (params.openingAltitude / params.canopyDescentRate);
  
  return distanceToTarget <= maxCanopyRange * REACHABILITY_MARGIN;
};