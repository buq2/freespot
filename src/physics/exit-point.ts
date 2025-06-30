import type { LatLon, JumpParameters, ForecastData, ExitPoint } from '../types';
import { movePoint, pointsToVector, calculateBearing, calculateDistance } from './geo';
import { calculateFreefallDrift, calculateCanopyDrift } from './wind-drift';
import type { Vector2D } from './vector';
import { windToVector, addVectors, scaleVector } from './vector';
import { interpolateWeatherData } from '../services/weather/openmeteo';

// Safety margins
const SAFETY_RADIUS_MARGIN = 0.7; // 70% of theoretical maximum distance
const REACHABILITY_MARGIN = 0.9; // 90% of theoretical maximum distance

export interface ExitCalculationResult {
  optimalExitPoint: LatLon;
  exitPoints: ExitPoint[];
  safetyRadius: number; // meters - radius from which landing zone can be reached
  aircraftHeading: number; // degrees
}


// Calculate optimal exit point using pure drift method
const calculateOptimalExitPoint = (
  landingZone: LatLon,
  weatherData: ForecastData[],
  params: JumpParameters
): LatLon => {
  // Calculate freefall drift
  const freefallDrift = calculateFreefallDrift(
    weatherData,
    params.jumpAltitude,
    params.openingAltitude,
    params.freefallSpeed
  );
  
  // Calculate pure canopy drift (no forward speed, just wind)
  // We don't need to specify a direction since we're not flying the canopy
  const canopyDrift = calculateCanopyDrift(
    weatherData,
    params.openingAltitude,
    0, // ground level
    0, // no forward canopy speed - pure drift
    params.canopyDescentRate,
    params.glideRatio,
    0 // direction doesn't matter with 0 forward speed
  );
  
  // Total drift is sum of freefall and canopy drift
  const totalDrift = addVectors(freefallDrift.driftVector, canopyDrift.driftVector);
  
  // Optimal exit point is upwind from landing zone by the total drift amount
  // We negate the drift vector to go upwind
  const negatedDrift = scaleVector(totalDrift, -1);
  
  return movePoint(landingZone, negatedDrift);
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

// Validate jump parameters
const validateParameters = (params: JumpParameters): string | null => {
  if (params.jumpAltitude <= params.openingAltitude) {
    return 'Jump altitude must be higher than opening altitude';
  }
  
  if (params.openingAltitude <= 0) {
    return 'Opening altitude must be greater than 0';
  }
  
  if (params.aircraftSpeed <= 0) {
    return 'Aircraft speed must be greater than 0';
  }
  
  if (params.freefallSpeed <= 0) {
    return 'Freefall speed must be greater than 0';
  }
  
  if (params.canopyAirSpeed <= 0) {
    return 'Canopy air speed must be greater than 0';
  }
  
  if (params.canopyDescentRate <= 0) {
    return 'Canopy descent rate must be greater than 0';
  }
  
  if (params.glideRatio < 0) {
    return 'Glide ratio cannot be negative';
  }
  
  if (params.numberOfGroups <= 0) {
    return 'Number of groups must be at least 1';
  }
  
  if (params.timeBetweenGroups < 0) {
    return 'Time between groups cannot be negative';
  }
  
  if (!params.landingZone.lat || !params.landingZone.lon) {
    return 'Landing zone coordinates must be provided';
  }
  
  return null;
};

// Calculate exit points for multiple groups
export const calculateExitPoints = (
  params: JumpParameters,
  weatherData: ForecastData[]
): ExitCalculationResult => {
  // Validate parameters first
  const validationError = validateParameters(params);
  if (validationError) {
    throw new Error(validationError);
  }
  
  // Check if we have weather data
  if (!weatherData || weatherData.length === 0) {
    throw new Error('No weather data available - try fetching weather first');
  }
  
  // Calculate optimal exit point using the new simplified method
  const optimalExit = calculateOptimalExitPoint(params.landingZone, weatherData, params);
  
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