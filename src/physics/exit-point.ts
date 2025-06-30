import type { LatLon, JumpParameters, ForecastData, ExitPoint } from '../types';
import { movePoint, pointsToVector, calculateBearing, calculateDistance, getDestinationPoint } from './geo';
import { calculateFreefallDrift, calculateCanopyDrift } from './wind-drift';
import type { Vector2D } from './vector';
import { windToVector, addVectors, scaleVector } from './vector';
import { interpolateWeatherData } from '../services/weather/openmeteo';
import { calculateCanopyAirSpeed } from './constants';

// Safety margins
const SAFETY_RADIUS_MARGIN = 0.7; // 70% of theoretical maximum distance

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
    params.setupAltitude, // setup altitude AGL
    0, // no forward canopy speed - pure drift
    params.canopyDescentRate,
    params.glideRatio,
    0 // direction doesn't matter with 0 forward speed
  );
  
  // Total drift is sum of freefall and canopy drift
  const totalDrift = addVectors(freefallDrift.driftVector, canopyDrift.driftVector);
  
  // Optimal exit point is upwind from landing zone by the total drift amount
  // This is the same calculation regardless of flight path type
  const negatedDrift = scaleVector(totalDrift, -1);
  return movePoint(landingZone, negatedDrift);
};

// Project a point onto a flight line that passes through a given point with a given heading
const projectPointOntoFlightLine = (
  pointToProject: LatLon,
  linePassesThrough: LatLon,
  heading: number // degrees
): LatLon => {
  // Vector from linePassesThrough to pointToProject
  const toPoint = pointsToVector(linePassesThrough, pointToProject);
  
  // Flight direction unit vector
  const flightVector = windToVector(heading - 180, 1); // unit vector in flight direction
  
  // Project toPoint onto flightVector
  // projection = (toPoint · flightVector) * flightVector
  const dotProduct = toPoint.x * flightVector.x + toPoint.y * flightVector.y;
  const projectedVector = scaleVector(flightVector, dotProduct);
  
  // The projected point is linePassesThrough + projectedVector
  return movePoint(linePassesThrough, projectedVector);
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
  // Wind direction is where wind comes FROM, so to fly into the wind (headwind),
  // aircraft should fly in the same direction as the wind direction
  return windAtExit.direction;
};

// Validate jump parameters
const validateParameters = (params: JumpParameters): string | null => {
  if (params.jumpAltitude <= params.openingAltitude) {
    return 'Jump altitude must be higher than opening altitude';
  }
  
  if (params.openingAltitude <= 0) {
    return 'Opening altitude must be greater than 0';
  }
  
  if (params.setupAltitude < 0) {
    return 'Setup altitude cannot be negative';
  }
  
  if (params.setupAltitude >= params.openingAltitude) {
    return 'Setup altitude must be lower than opening altitude';
  }
  
  if (params.aircraftSpeed <= 0) {
    return 'Aircraft speed must be greater than 0';
  }
  
  if (params.freefallSpeed <= 0) {
    return 'Freefall speed must be greater than 0';
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
  
  // Calculate spacing between groups accounting for wind effect on ground speed
  const spacingTime = params.timeBetweenGroups;
  
  // Get wind at exit altitude
  const windAtExit = interpolateWeatherData(weatherData, params.jumpAltitude);
  const windVector = windToVector(windAtExit.direction, windAtExit.speed);
  
  // Aircraft flight direction unit vector
  // aircraftHeading is the direction the aircraft is flying TO (e.g., 0° = flying north)
  // Convert to unit vector
  const headingRad = aircraftHeading * Math.PI / 180;
  const flightVector: Vector2D = {
    x: Math.sin(headingRad), // East component
    y: Math.cos(headingRad), // North component
  };
  
  // Wind component along flight direction (positive = tailwind, negative = headwind)
  const windAlongFlight = windVector.x * flightVector.x + windVector.y * flightVector.y;
  
  // Ground speed = air speed + wind component along flight
  const groundSpeed = params.aircraftSpeed + windAlongFlight;
  
  // Distance between groups based on ground speed
  const spacingDistance = groundSpeed * spacingTime;
  
  // Generate exit points for all groups
  const exitPoints: ExitPoint[] = [];
  const halfGroups = Math.floor(params.numberOfGroups / 2);
  
  let groupCenterPoint: LatLon;
  
  if (params.flightOverLandingZone) {
    // When flying over landing zone, project the optimal exit point onto the flight line
    // that passes through the landing zone
    groupCenterPoint = projectPointOntoFlightLine(
      optimalExit,
      params.landingZone,
      aircraftHeading
    );
  } else {
    // Normal offset exit - groups positioned around the optimal exit point
    groupCenterPoint = optimalExit;
  }
  
  // Position all groups around the center point
  for (let i = 0; i < params.numberOfGroups; i++) {
    const groupOffset = (i - halfGroups) * spacingDistance;
    
    // Move along aircraft flight path from center point
    // Negative offset means earlier groups (opposite to flight direction)
    // Positive offset means later groups (along flight direction)
    const offsetRad = aircraftHeading * Math.PI / 180;
    const offsetVector: Vector2D = {
      x: groupOffset * Math.sin(offsetRad),
      y: groupOffset * Math.cos(offsetRad)
    };
    const exitLocation = movePoint(groupCenterPoint, offsetVector);
    
    exitPoints.push({
      location: exitLocation,
      groupNumber: i + 1
    });
  }
  
  // Calculate safety radius (maximum distance from which landing zone can be reached)
  const canopyAirSpeed = calculateCanopyAirSpeed(params.canopyDescentRate, params.glideRatio);
  const canopyAltitudeDifference = params.openingAltitude - params.setupAltitude;
  const maxCanopyDistance = canopyAirSpeed * (canopyAltitudeDifference / params.canopyDescentRate);
  const safetyRadius = maxCanopyDistance * SAFETY_RADIUS_MARGIN;
  
  return {
    optimalExitPoint: optimalExit,
    exitPoints,
    safetyRadius,
    aircraftHeading
  };
};

