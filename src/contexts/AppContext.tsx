import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { JumpParameters, UserPreferences, LatLon, TerrainData, CachedLocationData, ForecastData } from '../types';

interface AppContextType {
  jumpParameters: JumpParameters;
  setJumpParameters: (params: JumpParameters) => void;
  userPreferences: UserPreferences;
  setUserPreferences: (prefs: UserPreferences) => void;
  weatherCache: CachedLocationData[];
  setWeatherCache: (cache: CachedLocationData[]) => void;
  terrainData: TerrainData | null;
  setTerrainData: (data: TerrainData | null) => void;
  selectedWeatherModel: string;
  setSelectedWeatherModel: (model: string) => void;
  customWeatherData: ForecastData[] | null;
  setCustomWeatherData: (data: ForecastData[] | null) => void;
}

// Helper function to round time to nearest hour
const roundToNearestHour = (date: Date): Date => {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  
  if (minutes >= 30) {
    // Round up to next hour
    rounded.setHours(rounded.getHours() + 1);
  }
  
  rounded.setMinutes(0);
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);
  
  return rounded;
};

export const defaultJumpParameters: JumpParameters = {
  jumpAltitude: 4000, // meters
  aircraftSpeed: 36, // m/s (130 km/h)
  freefallSpeed: 55.56, // m/s (200 km/h)
  openingAltitude: 800, // meters
  canopyDescentRate: 6, // m/s
  glideRatio: 2.5, // This gives us ~16.1 m/s canopy air speed (sqrt(6^2 + (6*2.5)^2) = sqrt(36 + 225))
  setupAltitude: 100, // meters AGL - default to 100m for pattern work
  numberOfGroups: 5,
  timeBetweenGroups: 10, // seconds
  landingZone: { lat: 61.7807, lon: 22.7221 },
  flightDirection: undefined, // headwind
  flightOverLandingZone: false, // default to normal offset exit
  jumpTime: roundToNearestHour(new Date()),
};

export const defaultUserPreferences: UserPreferences = {
  units: {
    altitude: 'meters',
    speed: 'ms',
    temperature: 'celsius',
  },
  studentWindLimit: 8, // m/s
  sportWindLimit: 11, // m/s
  showDriftVisualization: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Load initial values from localStorage
  const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [jumpParameters, setJumpParametersState] = useState<JumpParameters>(() => {
    const stored = loadFromStorage('jumpParameters', defaultJumpParameters);
    // Merge with defaults to ensure all fields exist (for backward compatibility)
    const merged = { ...defaultJumpParameters, ...stored };
    // Convert stored date string back to Date object and round to nearest hour
    return { ...merged, jumpTime: roundToNearestHour(new Date(merged.jumpTime)) };
  });

  const [userPreferences, setUserPreferencesState] = useState<UserPreferences>(() => 
    loadFromStorage('userPreferences', defaultUserPreferences)
  );

  const [weatherCache, setWeatherCache] = useState<CachedLocationData[]>([]);
  const [terrainData, setTerrainData] = useState<TerrainData | null>(null);
  const [selectedWeatherModel, setSelectedWeatherModel] = useState<string>('best_match');
  const [customWeatherData, setCustomWeatherData] = useState<ForecastData[] | null>(null);

  // Save to localStorage whenever state changes
  const setJumpParameters = (params: JumpParameters) => {
    setJumpParametersState(params);
    localStorage.setItem('jumpParameters', JSON.stringify(params));
  };

  const setUserPreferences = (prefs: UserPreferences) => {
    setUserPreferencesState(prefs);
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
  };

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation && jumpParameters.landingZone.lat === 0 && jumpParameters.landingZone.lon === 0) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setJumpParameters({
            ...jumpParameters,
            landingZone: {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            },
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const value: AppContextType = {
    jumpParameters,
    setJumpParameters,
    userPreferences,
    setUserPreferences,
    weatherCache,
    setWeatherCache,
    terrainData,
    setTerrainData,
    selectedWeatherModel,
    setSelectedWeatherModel,
    customWeatherData,
    setCustomWeatherData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};