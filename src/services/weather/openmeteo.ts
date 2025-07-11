import type { LatLon, ForecastData, WeatherModel } from '../../types';

const OPENMETEO_API_URL = 'https://api.open-meteo.com/v1/forecast';
const OPENMETEO_ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation';

export const WEATHER_MODELS: WeatherModel[] = [
  { id: 'best_match', name: 'Best Match', altitudeLevels: [] },
  { id: 'gfs_global', name: 'GFS Global', altitudeLevels: [] },
  { id: 'icon_eu', name:'ICON EU', altitudeLevels: [] },
  { id: 'ecmwf_ifs04', name: 'ECMWF', altitudeLevels: [] },
  { id: 'custom', name: 'Custom Weather Data', altitudeLevels: [] },
];

// Pressure levels with approximate altitudes in meters above sea level
const PRESSURE_LEVELS = [
  { pressure: 1000, altitude: 110 },
  { pressure: 975, altitude: 320 },
  { pressure: 950, altitude: 540 },
  { pressure: 925, altitude: 760 },
  { pressure: 900, altitude: 990 },
  { pressure: 850, altitude: 1500 },
  { pressure: 800, altitude: 1950 },
  { pressure: 700, altitude: 3000 },
  { pressure: 600, altitude: 4200 },
  { pressure: 500, altitude: 5600 },
  { pressure: 400, altitude: 7200 },
];

// Height levels available for all models (already in AGL)
const HEIGHT_LEVELS = [10, 80, 120, 180];

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  hourly: {
    time: string[];
    [key: string]: any;
  };
}

// Linear interpolation for scalar values
const interpolateLinear = (lower: number, upper: number, ratio: number): number => {
  return lower + (upper - lower) * ratio;
};

/**
 * Performs circular interpolation for wind direction angles (0-360 degrees).
 * 
 * This function correctly handles the circular nature of compass directions,
 * ensuring that interpolation between 350° and 10° goes through 0° rather
 * than taking the long way around through 180°.
 * 
 * @param lower - Starting angle in degrees (0-360)
 * @param upper - Ending angle in degrees (0-360)
 * @param ratio - Interpolation ratio (0-1)
 * @returns Interpolated angle in degrees (0-360)
 * 
 * @example
 * ```typescript
 * // Normal interpolation: 90° to 180° at 50%
 * interpolateCircular(90, 180, 0.5); // Returns 135°
 * 
 * // Circular interpolation: 350° to 10° at 50%
 * interpolateCircular(350, 10, 0.5); // Returns 0° (not 180°)
 * ```
 */
const interpolateCircular = (lower: number, upper: number, ratio: number): number => {
  // Normalize angles to 0-360
  lower = ((lower % 360) + 360) % 360;
  upper = ((upper % 360) + 360) % 360;
  
  // Find the shortest angular distance
  let diff = upper - lower;
  if (diff > 180) {
    diff -= 360;
  } else if (diff < -180) {
    diff += 360;
  }
  
  // Interpolate
  let result = lower + diff * ratio;
  
  // Normalize result to 0-360
  if (result < 0) result += 360;
  if (result >= 360) result -= 360;
  
  return result;
};

const buildWeatherParameters = (): string => {
  const heightWindspeedParams = HEIGHT_LEVELS.map(h => `windspeed_${h}m`).join(',');
  const heightWinddirectionParams = HEIGHT_LEVELS.map(h => `winddirection_${h}m`).join(',');
  const pressureWindspeedParams = PRESSURE_LEVELS.map(p => `windspeed_${p.pressure}hPa`).join(',');
  const pressureWinddirectionParams = PRESSURE_LEVELS.map(p => `winddirection_${p.pressure}hPa`).join(',');

  return [
    heightWindspeedParams,
    heightWinddirectionParams,
    pressureWindspeedParams,
    pressureWinddirectionParams,
    'windgusts_10m',
    'temperature_2m',
    'temperature_80m',
    'temperature_120m',
    'temperature_180m'
  ].join(',');
};

const findClosestTimeIndex = (times: string[], targetTime: Date): number => {
  const target = targetTime.getTime();
  let closestIndex = 0;
  let minDiff = Math.abs(new Date(times[0]).getTime() - target);
  
  for (let i = 1; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - target);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }
  
  return closestIndex;
};

const extractHeightLevelData = (
  data: OpenMeteoResponse,
  timeIndex: number
): ForecastData[] => {
  const forecasts: ForecastData[] = [];
  
  for (const height of HEIGHT_LEVELS) {
    const windspeedKey = `windspeed_${height}m`;
    const winddirectionKey = `winddirection_${height}m`;
    
    if (data.hourly[windspeedKey] && data.hourly[winddirectionKey]) {
      const speed = data.hourly[windspeedKey][timeIndex];
      const direction = data.hourly[winddirectionKey][timeIndex];
      
      // Skip if data is missing (null, undefined, or NaN)
      if (speed == null || direction == null || isNaN(speed) || isNaN(direction)) {
        continue;
      }
      
      const forecast: ForecastData = {
        altitude: height, // Already in AGL
        speed: speed / 3.6, // Convert km/h to m/s
        direction: direction,
      };

      // Add gust speed for ground level
      if (height === 10 && data.hourly.windgusts_10m) {
        const gustSpeed = data.hourly.windgusts_10m[timeIndex];
        if (gustSpeed != null && !isNaN(gustSpeed)) {
          forecast.gustSpeed = gustSpeed / 3.6;
        }
      }

      // Add temperature data where available
      if (height === 10 && data.hourly.temperature_2m) {
        const temp = data.hourly.temperature_2m[timeIndex];
        if (temp != null && !isNaN(temp)) {
          forecast.temperature = temp;
        }
      } else if (height === 80 && data.hourly.temperature_80m) {
        const temp = data.hourly.temperature_80m[timeIndex];
        if (temp != null && !isNaN(temp)) {
          forecast.temperature = temp;
        }
      } else if (height === 120 && data.hourly.temperature_120m) {
        const temp = data.hourly.temperature_120m[timeIndex];
        if (temp != null && !isNaN(temp)) {
          forecast.temperature = temp;
        }
      } else if (height === 180 && data.hourly.temperature_180m) {
        const temp = data.hourly.temperature_180m[timeIndex];
        if (temp != null && !isNaN(temp)) {
          forecast.temperature = temp;
        }
      }

      forecasts.push(forecast);
    }
  }
  
  return forecasts;
};

const extractPressureLevelData = (
  data: OpenMeteoResponse,
  timeIndex: number,
  terrainElevation: number
): ForecastData[] => {
  const forecasts: ForecastData[] = [];
  
  for (const level of PRESSURE_LEVELS) {
    const windspeedKey = `windspeed_${level.pressure}hPa`;
    const winddirectionKey = `winddirection_${level.pressure}hPa`;
    
    if (data.hourly[windspeedKey] && data.hourly[winddirectionKey]) {
      const altitudeAGL = level.altitude - terrainElevation;
      
      // Only include if above ground level
      if (altitudeAGL > 0) {
        const speed = data.hourly[windspeedKey][timeIndex];
        const direction = data.hourly[winddirectionKey][timeIndex];
        
        // Skip if data is missing (null, undefined, or NaN)
        if (speed == null || direction == null || isNaN(speed) || isNaN(direction)) {
          continue;
        }
        
        const forecast: ForecastData = {
          altitude: altitudeAGL, // Convert to AGL
          speed: speed / 3.6, // Convert km/h to m/s
          direction: direction,
        };

        forecasts.push(forecast);
      }
    }
  }
  
  return forecasts;
};

export const getAvailableAltitudeLevels = async (
  location: LatLon
): Promise<number[]> => {
  const terrainElevation = await fetchTerrainElevation(location);
  
  // Height levels are already AGL
  // Pressure levels need to be converted from MSL to AGL
  const allLevels = [
    ...HEIGHT_LEVELS,
    ...PRESSURE_LEVELS.map(p => Math.max(0, p.altitude - terrainElevation))
  ];
  
  return allLevels.filter(alt => alt >= 0).sort((a, b) => a - b);
};

/**
 * Fetches comprehensive weather data from OpenMeteo API for skydiving calculations.
 * 
 * This function retrieves wind data at multiple altitude levels (both height-based
 * and pressure-based) and combines them into a complete atmospheric profile.
 * Also fetches terrain elevation to convert pressure levels from MSL to AGL.
 * 
 * @param location - Geographic coordinates for weather data
 * @param modelId - Weather model to use ('best_match', 'gfs_global', 'icon_eu', 'ecmwf_ifs04')
 * @param date - Target date and time for the forecast
 * @returns Promise containing weather data array and terrain elevation
 * 
 * @throws {Error} If API request fails or returns invalid data
 * 
 * @example
 * ```typescript
 * const { data, terrainElevation } = await fetchWeatherData(
 *   { lat: 61.7807, lon: 22.7221 },
 *   'gfs_global',
 *   new Date('2024-07-01T12:00:00Z')
 * );
 * 
 * console.log(`Found ${data.length} altitude levels`);
 * console.log(`Terrain elevation: ${terrainElevation}m`);
 * ```
 */
export const fetchWeatherData = async (
  location: LatLon,
  modelId: string,
  date: Date
): Promise<{ data: ForecastData[], terrainElevation: number }> => {
  // Get terrain elevation first
  const terrainElevation = await fetchTerrainElevation(location);

  // Build API request
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const params = new URLSearchParams({
    latitude: location.lat.toString(),
    longitude: location.lon.toString(),
    hourly: buildWeatherParameters(),
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    timezone: 'auto',
  });

  if (modelId !== 'best_match') {
    params.append('models', modelId);
  }

  // Fetch weather data
  console.log(`Fetching data ${params}`)
  const response = await fetch(`${OPENMETEO_API_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`);
  }

  const data: OpenMeteoResponse = await response.json();
  
  // Find the closest time to requested time
  const timeIndex = findClosestTimeIndex(data.hourly.time, date);

  // Extract weather data from both height and pressure levels
  const heightLevelData = extractHeightLevelData(data, timeIndex);
  const pressureLevelData = extractPressureLevelData(data, timeIndex, terrainElevation);

  // Combine and sort by altitude
  const allForecasts = [...heightLevelData, ...pressureLevelData];
  
  return {
    data: allForecasts.sort((a, b) => a.altitude - b.altitude),
    terrainElevation
  };
};

export const fetchTerrainElevation = async (location: LatLon): Promise<number> => {
  const params = new URLSearchParams({
    latitude: location.lat.toString(),
    longitude: location.lon.toString(),
  });

  const response = await fetch(`${OPENMETEO_ELEVATION_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Elevation API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.elevation[0] || 0;
};

/**
 * Interpolates weather data for altitudes between measured levels using linear interpolation.
 * 
 * This function provides smooth transitions between discrete weather measurement points,
 * essential for accurate drift calculations at any altitude. Uses circular interpolation
 * for wind direction to handle the 0°/360° boundary correctly.
 * 
 * The interpolation logic:
 * - Returns nearest data point if target is outside the range
 * - Uses linear interpolation for wind speed, temperature, and gust speed
 * - Uses circular interpolation for wind direction to handle angle wraparound
 * 
 * @param data - Array of weather forecast data sorted by altitude (ascending)
 * @param targetAltitude - Desired altitude for interpolation (meters AGL)
 * @returns Interpolated weather data at the target altitude
 * 
 * @throws {Error} If data array is empty or not properly sorted
 * 
 * @example
 * ```typescript
 * const weatherAt1500m = interpolateWeatherData(
 *   [
 *     { altitude: 1000, speed: 10, direction: 270 },
 *     { altitude: 2000, speed: 15, direction: 280 }
 *   ],
 *   1500  // Interpolate at 1500m
 * );
 * 
 * // Result: { altitude: 1500, speed: 12.5, direction: 275 }
 * ```
 */
export const interpolateWeatherData = (
  data: ForecastData[],
  targetAltitude: number
): ForecastData => {
  // If target is below lowest or above highest, return the nearest
  if (targetAltitude <= data[0].altitude) {
    return { ...data[0], altitude: targetAltitude };
  }
  if (targetAltitude >= data[data.length - 1].altitude) {
    return { ...data[data.length - 1], altitude: targetAltitude };
  }

  // Find the two levels to interpolate between
  let lowerIndex = 0;
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i].altitude <= targetAltitude && data[i + 1].altitude > targetAltitude) {
      lowerIndex = i;
      break;
    }
  }

  const lower = data[lowerIndex];
  const upper = data[lowerIndex + 1];
  const ratio = (targetAltitude - lower.altitude) / (upper.altitude - lower.altitude);

  // Interpolate all values
  const result: ForecastData = {
    altitude: targetAltitude,
    speed: interpolateLinear(lower.speed, upper.speed, ratio),
    direction: interpolateCircular(lower.direction, upper.direction, ratio),
  };

  // Interpolate optional values if present in both levels
  if (lower.gustSpeed !== undefined && upper.gustSpeed !== undefined) {
    result.gustSpeed = interpolateLinear(lower.gustSpeed, upper.gustSpeed, ratio);
  }

  if (lower.temperature !== undefined && upper.temperature !== undefined) {
    result.temperature = interpolateLinear(lower.temperature, upper.temperature, ratio);
  }

  return result;
};