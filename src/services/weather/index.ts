import type { LatLon, ForecastData, TerrainData } from '../../types';
import { fetchWeatherData as fetchFromAPI, fetchTerrainElevation, interpolateWeatherData } from './openmeteo';
import { weatherCache } from './cache';

export { WEATHER_MODELS, getAvailableAltitudeLevels } from './openmeteo';

export const fetchWeatherData = async (
  location: LatLon,
  model: string,
  date: Date
): Promise<{ data: ForecastData[], terrainElevation: number }> => {
  // Round to nearest hour for caching (weather data is hourly)
  const forecastDate = new Date(date);
  forecastDate.setMinutes(0, 0, 0);
  
  // Try to get from cache first
  const cached = await weatherCache.get(location, forecastDate);
  
  if (cached?.weatherModels[model]) {
    // We have cached data for this model
    return { 
      data: cached.weatherModels[model], 
      terrainElevation: cached.terrain.elevation 
    };
  }
  
  // Get terrain data (from cache if available, or fetch new)
  let terrain: TerrainData;
  if (cached?.terrain) {
    terrain = cached.terrain;
  } else {
    const cachedTerrain = await weatherCache.getTerrain(location);
    if (cachedTerrain) {
      terrain = cachedTerrain;
    } else {
      const elevation = await fetchTerrainElevation(location);
      terrain = { location, elevation };
    }
  }
  
  // Fetch fresh weather data using the exact forecast time
  const result = await fetchFromAPI(location, model, forecastDate);
  
  // Cache the data
  await weatherCache.set(location, forecastDate, terrain, model, result.data);
  
  return { 
    data: result.data, 
    terrainElevation: terrain.elevation 
  };
};

export const fetchMultipleModels = async (
  location: LatLon,
  models: string[],
  date: Date,
  customWeatherData?: ForecastData[] | null
): Promise<{ models: { [modelId: string]: ForecastData[] }; terrainElevation: number }> => {
  const results: { [modelId: string]: ForecastData[] } = {};
  let terrainElevation = 0;
  
  // Fetch data for each model (will use cache when available)
  for (const model of models) {
    if (model === 'custom' && customWeatherData) {
      // Use custom weather data
      results[model] = customWeatherData;
      // Still need terrain elevation for custom data
      if (terrainElevation === 0) {
        const terrain = await fetchTerrain(location);
        terrainElevation = terrain.elevation;
      }
    } else if (model !== 'custom') {
      const result = await fetchWeatherData(location, model, date);
      results[model] = result.data;
      terrainElevation = result.terrainElevation;
    }
  }
  
  return { models: results, terrainElevation };
};

export const getWindDataAtAltitude = (
  weatherData: ForecastData[],
  altitudeAGL: number
): ForecastData => {
  return interpolateWeatherData(weatherData, altitudeAGL);
};

export const fetchTerrain = async (location: LatLon): Promise<TerrainData> => {
  // Check cache first
  const cached = await weatherCache.getTerrain(location);
  if (cached) return cached;
  
  // Fetch new
  const elevation = await fetchTerrainElevation(location);
  return { location, elevation };
};

// Clean up expired cache entries periodically
if (typeof window !== 'undefined') {
  // Clean up on startup
  weatherCache.cleanExpired();
  
  // Clean up every hour
  setInterval(() => {
    weatherCache.cleanExpired();
  }, 60 * 60 * 1000);
}