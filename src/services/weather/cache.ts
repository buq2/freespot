import localforage from 'localforage';
import { LatLon, CachedLocationData, ForecastData, TerrainData } from '../../types';

// Configure localforage
const weatherStore = localforage.createInstance({
  name: 'freespot',
  storeName: 'weather_cache',
  description: 'Weather data cache for FreeSpot'
});

export class WeatherCache {
  private getCacheKey(location: LatLon, forecastDate: Date): string {
    const dateStr = forecastDate.toISOString().split('T')[0];
    return `${location.lat.toFixed(4)},${location.lon.toFixed(4)}-${dateStr}`;
  }

  private getExpirationTime(forecastDate: Date): number {
    const now = new Date();
    const forecast = new Date(forecastDate);
    forecast.setHours(0, 0, 0, 0);
    
    // If forecast date is in the past or more than 6 hours from now, never expire
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    if (forecast < now || forecast > sixHoursFromNow) {
      return Infinity;
    }
    
    // Otherwise, expire in 1 hour
    return 60 * 60 * 1000; // 1 hour
  }

  async get(location: LatLon, forecastDate: Date): Promise<CachedLocationData | null> {
    try {
      const key = this.getCacheKey(location, forecastDate);
      const cached = await weatherStore.getItem<CachedLocationData>(key);
      
      if (!cached) return null;
      
      // Check if cache is expired
      const expirationTime = this.getExpirationTime(new Date(cached.forecastDate));
      const age = Date.now() - cached.timestamp;
      
      if (expirationTime !== Infinity && age > expirationTime) {
        await weatherStore.removeItem(key);
        return null;
      }
      
      // Ensure dates are properly deserialized
      cached.forecastDate = new Date(cached.forecastDate);
      
      return cached;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  async set(
    location: LatLon,
    forecastDate: Date,
    terrain: TerrainData,
    modelId: string,
    data: ForecastData[]
  ): Promise<void> {
    try {
      const key = this.getCacheKey(location, forecastDate);
      
      // Get existing cache or create new
      let cached = await this.get(location, forecastDate);
      
      if (!cached) {
        cached = {
          location,
          terrain,
          timestamp: Date.now(),
          forecastDate,
          weatherModels: {}
        };
      }
      
      // Update the specific model data
      cached.weatherModels[modelId] = data;
      cached.timestamp = Date.now(); // Update timestamp
      
      await weatherStore.setItem(key, cached);
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  }

  async getTerrain(location: LatLon): Promise<TerrainData | null> {
    try {
      // Try to find any cached data for this location
      const keys = await weatherStore.keys();
      const locationPrefix = `${location.lat.toFixed(4)},${location.lon.toFixed(4)}`;
      
      for (const key of keys) {
        if (key.startsWith(locationPrefix)) {
          const cached = await weatherStore.getItem<CachedLocationData>(key);
          if (cached?.terrain) {
            return cached.terrain;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error reading terrain from cache:', error);
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await weatherStore.clear();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async cleanExpired(): Promise<void> {
    try {
      const keys = await weatherStore.keys();
      const now = Date.now();
      
      for (const key of keys) {
        const item = await weatherStore.getItem<CachedLocationData>(key);
        if (item) {
          const expirationTime = this.getExpirationTime(new Date(item.forecastDate));
          const age = now - item.timestamp;
          
          if (expirationTime !== Infinity && age > expirationTime) {
            await weatherStore.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning expired cache:', error);
    }
  }
}

export const weatherCache = new WeatherCache();