import { useState, useCallback, useRef } from 'react';
import type { LatLon, ForecastData } from '../types';
import { fetchMultipleModels, getWindDataAtAltitude } from '../services/weather';
import { useWeatherContext } from '../contexts/WeatherContext';

export interface WeatherCalculationResult {
  weatherData: { [modelId: string]: ForecastData[] };
  terrainElevation: number;
  primaryWeatherData: ForecastData[] | null;
  groundWindData: ForecastData | null;
}

export interface UseWeatherCalculationsReturn {
  // State
  result: WeatherCalculationResult | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchWeather: (
    location: LatLon,
    models: string[],
    date: Date,
    customWeatherData?: ForecastData[] | null
  ) => Promise<WeatherCalculationResult>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Custom hook for weather data fetching and processing.
 * 
 * Provides centralized weather fetching logic with caching,
 * error handling, and loading states. Integrates with the
 * weather context for cache management.
 * 
 * @example
 * ```typescript
 * const { result, isLoading, error, fetchWeather } = useWeatherCalculations();
 * 
 * const handleFetch = async () => {
 *   try {
 *     const weatherResult = await fetchWeather(
 *       { lat: 61.7807, lon: 22.7221 },
 *       ['best_match'],
 *       new Date()
 *     );
 *     console.log('Weather data:', weatherResult.weatherData);
 *   } catch (err) {
 *     console.error('Weather fetch failed:', err);
 *   }
 * };
 * ```
 */
export const useWeatherCalculations = (): UseWeatherCalculationsReturn => {
  const [result, setResult] = useState<WeatherCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    setIsWeatherLoading, 
    setWeatherError, 
    addToWeatherCache
  } = useWeatherContext();
  
  // Keep track of the current request to avoid race conditions
  const currentRequestRef = useRef<number>(0);

  const fetchWeather = useCallback(async (
    location: LatLon,
    models: string[],
    date: Date,
    customWeatherData?: ForecastData[] | null
  ): Promise<WeatherCalculationResult> => {
    // Increment request counter to handle race conditions
    const requestId = ++currentRequestRef.current;
    
    if (models.length === 0) {
      const errorMsg = 'Please select at least one weather model';
      setError(errorMsg);
      setWeatherError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsLoading(true);
    setIsWeatherLoading(true);
    setError(null);
    setWeatherError(null);

    try {
      // Fetch weather data for all selected models
      const fetchResult = await fetchMultipleModels(
        location,
        models,
        date,
        customWeatherData
      );

      // Check if this is still the current request
      if (requestId !== currentRequestRef.current) {
        // Request was superseded, ignore results
        return result || {
          weatherData: {},
          terrainElevation: 0,
          primaryWeatherData: null,
          groundWindData: null
        };
      }

      const { terrainElevation, ...weatherData } = fetchResult;
      
      // Use the first selected model as primary for calculations
      const primaryModelData = weatherData[models[0]] || null;
      
      // Get ground wind data from primary model
      const groundWindData = primaryModelData 
        ? getWindDataAtAltitude(primaryModelData, 10) // 10m AGL
        : null;

      const calculationResult: WeatherCalculationResult = {
        weatherData,
        terrainElevation,
        primaryWeatherData: primaryModelData,
        groundWindData
      };

      // Cache the weather data
      if (primaryModelData) {
        const locationKey = `${location.lat.toFixed(4)}_${location.lon.toFixed(4)}`;
        addToWeatherCache({
          locationKey,
          modelId: models[0],
          date,
          data: primaryModelData,
          terrainElevation,
          fetchedAt: new Date()
        });
      }

      setResult(calculationResult);
      return calculationResult;

    } catch (err) {
      // Check if this is still the current request
      if (requestId !== currentRequestRef.current) {
        return result || {
          weatherData: {},
          terrainElevation: 0,
          primaryWeatherData: null,
          groundWindData: null
        };
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
      setError(errorMessage);
      setWeatherError(errorMessage);
      throw err;
      
    } finally {
      // Only update loading state if this is still the current request
      if (requestId === currentRequestRef.current) {
        setIsLoading(false);
        setIsWeatherLoading(false);
      }
    }
  }, [addToWeatherCache, setIsWeatherLoading, setWeatherError, result]);

  const clearError = useCallback(() => {
    setError(null);
    setWeatherError(null);
  }, [setWeatherError]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
    setWeatherError(null);
    setIsWeatherLoading(false);
    currentRequestRef.current = 0;
  }, [setWeatherError, setIsWeatherLoading]);

  return {
    result,
    isLoading,
    error,
    fetchWeather,
    clearError,
    reset
  };
};