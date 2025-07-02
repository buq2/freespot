import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { WeatherCacheEntry, ForecastData, TerrainData } from '../types';

interface WeatherContextType {
  weatherCache: WeatherCacheEntry[];
  setWeatherCache: (cache: WeatherCacheEntry[]) => void;
  addToWeatherCache: (data: WeatherCacheEntry) => void;
  clearWeatherCache: () => void;
  getWeatherFromCache: (locationKey: string, modelId: string, date: Date) => WeatherCacheEntry | undefined;
  terrainData: TerrainData | null;
  setTerrainData: (data: TerrainData | null) => void;
  selectedWeatherModel: string;
  setSelectedWeatherModel: (model: string) => void;
  customWeatherData: ForecastData[] | null;
  setCustomWeatherData: (data: ForecastData[] | null) => void;
  isWeatherLoading: boolean;
  setIsWeatherLoading: (loading: boolean) => void;
  weatherError: string | null;
  setWeatherError: (error: string | null) => void;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const useWeatherContext = () => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeatherContext must be used within WeatherProvider');
  }
  return context;
};

interface WeatherProviderProps {
  children: ReactNode;
}

export const WeatherProvider: React.FC<WeatherProviderProps> = ({ children }) => {
  const [weatherCache, setWeatherCache] = useState<WeatherCacheEntry[]>([]);
  const [terrainData, setTerrainData] = useState<TerrainData | null>(null);
  const [selectedWeatherModel, setSelectedWeatherModel] = useState<string>('best_match');
  const [customWeatherData, setCustomWeatherData] = useState<ForecastData[] | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const addToWeatherCache = (data: WeatherCacheEntry) => {
    setWeatherCache(prevCache => {
      // Remove any existing entry for the same location/model/date
      const filteredCache = prevCache.filter(cached => 
        !(cached.locationKey === data.locationKey && 
          cached.modelId === data.modelId &&
          cached.date.getTime() === data.date.getTime())
      );
      
      // Add new entry
      const newCache = [...filteredCache, data];
      
      // Keep only the most recent 50 entries to prevent unlimited growth
      return newCache.slice(-50);
    });
  };

  const clearWeatherCache = () => {
    setWeatherCache([]);
  };

  const getWeatherFromCache = (locationKey: string, modelId: string, date: Date): WeatherCacheEntry | undefined => {
    const CACHE_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours
    const now = new Date().getTime();
    
    return weatherCache.find(cached => 
      cached.locationKey === locationKey &&
      cached.modelId === modelId &&
      Math.abs(cached.date.getTime() - date.getTime()) < 60 * 60 * 1000 && // Within 1 hour of requested time
      (now - cached.fetchedAt.getTime()) < CACHE_DURATION_MS // Cache is still valid
    );
  };

  const value: WeatherContextType = {
    weatherCache,
    setWeatherCache,
    addToWeatherCache,
    clearWeatherCache,
    getWeatherFromCache,
    terrainData,
    setTerrainData,
    selectedWeatherModel,
    setSelectedWeatherModel,
    customWeatherData,
    setCustomWeatherData,
    isWeatherLoading,
    setIsWeatherLoading,
    weatherError,
    setWeatherError,
  };

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
};