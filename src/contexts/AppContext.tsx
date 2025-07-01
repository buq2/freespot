import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { JumpParameters, CommonParameters, FullJumpParameters, JumpProfile, UserPreferences, LatLon, TerrainData, CachedLocationData, ForecastData } from '../types';

interface AppContextType {
  profiles: JumpProfile[];
  setProfiles: (profiles: JumpProfile[]) => void;
  addProfile: (profile: Omit<JumpProfile, 'id'>) => void;
  updateProfile: (id: string, updates: Partial<JumpProfile>) => void;
  deleteProfile: (id: string) => void;
  commonParameters: CommonParameters;
  setCommonParameters: (params: CommonParameters) => void;
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
  // Backward compatibility
  jumpParameters: FullJumpParameters;
  setJumpParameters: (params: FullJumpParameters) => void;
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
};

export const defaultCommonParameters: CommonParameters = {
  landingZone: { lat: 61.7807, lon: 22.7221 },
  flightDirection: undefined, // headwind
  flightOverLandingZone: false, // default to normal offset exit
  jumpTime: roundToNearestHour(new Date()),
  numberOfGroups: 5,
  timeBetweenGroups: 10, // seconds
};

export const defaultFullJumpParameters: FullJumpParameters = {
  ...defaultJumpParameters,
  ...defaultCommonParameters,
};

export const defaultUserPreferences: UserPreferences = {
  units: {
    altitude: 'meters',
    speed: 'ms',
    temperature: 'celsius',
  },
  studentWindLimit: 8, // m/s
  sportWindLimit: 11, // m/s
};

// Generate unique ID for profiles
const generateProfileId = (): string => {
  return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Default profile templates
export const createDefaultProfiles = (): JumpProfile[] => [
  {
    id: 'sport_jumpers',
    name: 'Sport Jumpers',
    enabled: true,
    color: '#2196F3', // Blue
    showDriftVisualization: true,
    parameters: {
      jumpAltitude: 4000,
      aircraftSpeed: 36,
      freefallSpeed: 55.56,
      openingAltitude: 800,
      canopyDescentRate: 6,
      glideRatio: 2.5,
      setupAltitude: 100,
    },
  },
  {
    id: 'tandem',
    name: 'Tandem',
    enabled: false,
    color: '#FF9800', // Orange
    showDriftVisualization: false,
    parameters: {
      jumpAltitude: 4000,
      aircraftSpeed: 36,
      freefallSpeed: 50,
      openingAltitude: 1200,
      canopyDescentRate: 4,
      glideRatio: 2.0,
      setupAltitude: 100,
    },
  },
  {
    id: 'student',
    name: 'Student',
    enabled: false,
    color: '#4CAF50', // Green
    showDriftVisualization: false,
    parameters: {
      jumpAltitude: 4000,
      aircraftSpeed: 36,
      freefallSpeed: 55.56,
      openingAltitude: 1400,
      canopyDescentRate: 5,
      glideRatio: 2.2,
      setupAltitude: 100,
    },
  },
];

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

  // Initialize common parameters
  const [commonParameters, setCommonParametersState] = useState<CommonParameters>(() => {
    const storedCommon = loadFromStorage<CommonParameters>('commonParameters', defaultCommonParameters);
    return {
      ...defaultCommonParameters,
      ...storedCommon,
      jumpTime: roundToNearestHour(new Date(storedCommon.jumpTime || new Date()))
    };
  });

  // Migrate existing data and initialize profiles
  const [profiles, setProfilesState] = useState<JumpProfile[]>(() => {
    const storedProfiles = loadFromStorage<JumpProfile[]>('jumpProfiles', []);
    
    if (storedProfiles.length > 0) {
      // Update stored profiles and remove common parameters from them
      return storedProfiles.map(profile => ({
        ...profile,
        parameters: {
          jumpAltitude: profile.parameters.jumpAltitude || defaultJumpParameters.jumpAltitude,
          aircraftSpeed: profile.parameters.aircraftSpeed || defaultJumpParameters.aircraftSpeed,
          freefallSpeed: profile.parameters.freefallSpeed || defaultJumpParameters.freefallSpeed,
          openingAltitude: profile.parameters.openingAltitude || defaultJumpParameters.openingAltitude,
          canopyDescentRate: profile.parameters.canopyDescentRate || defaultJumpParameters.canopyDescentRate,
          glideRatio: profile.parameters.glideRatio || defaultJumpParameters.glideRatio,
          setupAltitude: profile.parameters.setupAltitude || defaultJumpParameters.setupAltitude,
        }
      }));
    }
    
    // Migrate from old single jumpParameters format
    const oldParams = loadFromStorage('jumpParameters', null);
    if (oldParams) {
      // Update common parameters from old format
      const migratedCommon = {
        landingZone: oldParams.landingZone || defaultCommonParameters.landingZone,
        flightDirection: oldParams.flightDirection,
        flightOverLandingZone: oldParams.flightOverLandingZone || defaultCommonParameters.flightOverLandingZone,
        jumpTime: roundToNearestHour(new Date(oldParams.jumpTime || new Date())),
        numberOfGroups: oldParams.numberOfGroups || defaultCommonParameters.numberOfGroups,
        timeBetweenGroups: oldParams.timeBetweenGroups || defaultCommonParameters.timeBetweenGroups,
      };
      setCommonParametersState(migratedCommon);
      
      return createDefaultProfiles().map((profile, index) => ({
        ...profile,
        enabled: index === 0, // Enable only first profile
        parameters: index === 0 ? {
          jumpAltitude: oldParams.jumpAltitude || profile.parameters.jumpAltitude,
          aircraftSpeed: oldParams.aircraftSpeed || profile.parameters.aircraftSpeed,
          freefallSpeed: oldParams.freefallSpeed || profile.parameters.freefallSpeed,
          openingAltitude: oldParams.openingAltitude || profile.parameters.openingAltitude,
          canopyDescentRate: oldParams.canopyDescentRate || profile.parameters.canopyDescentRate,
          glideRatio: oldParams.glideRatio || profile.parameters.glideRatio,
          setupAltitude: oldParams.setupAltitude || profile.parameters.setupAltitude,
        } : profile.parameters
      }));
    }
    
    // Create default profiles
    return createDefaultProfiles();
  });

  const [userPreferences, setUserPreferencesState] = useState<UserPreferences>(() => 
    loadFromStorage('userPreferences', defaultUserPreferences)
  );

  const [weatherCache, setWeatherCache] = useState<CachedLocationData[]>([]);
  const [terrainData, setTerrainData] = useState<TerrainData | null>(null);
  const [selectedWeatherModel, setSelectedWeatherModel] = useState<string>('best_match');
  const [customWeatherData, setCustomWeatherData] = useState<ForecastData[] | null>(null);

  // Profile management functions
  const setProfiles = (newProfiles: JumpProfile[]) => {
    setProfilesState(newProfiles);
    localStorage.setItem('jumpProfiles', JSON.stringify(newProfiles));
  };

  const setCommonParameters = (params: CommonParameters) => {
    setCommonParametersState(params);
    localStorage.setItem('commonParameters', JSON.stringify(params));
  };

  const addProfile = (profileData: Omit<JumpProfile, 'id'>) => {
    const newProfile: JumpProfile = {
      ...profileData,
      id: generateProfileId(),
    };
    const newProfiles = [...profiles, newProfile];
    setProfiles(newProfiles);
  };

  const updateProfile = (id: string, updates: Partial<JumpProfile>) => {
    const newProfiles = profiles.map(profile => 
      profile.id === id ? { ...profile, ...updates } : profile
    );
    setProfiles(newProfiles);
  };

  const deleteProfile = (id: string) => {
    // Prevent deletion if it's the last profile
    if (profiles.length <= 1) return;
    
    const newProfiles = profiles.filter(profile => profile.id !== id);
    setProfiles(newProfiles);
  };

  // Backward compatibility - combine common parameters with first enabled profile
  const jumpParameters: FullJumpParameters = {
    ...commonParameters,
    ...(profiles.find(p => p.enabled)?.parameters || profiles[0]?.parameters || defaultJumpParameters)
  };
  
  const setJumpParameters = (params: FullJumpParameters) => {
    // Split params into common and profile-specific
    const { landingZone, flightDirection, flightOverLandingZone, jumpTime, numberOfGroups, timeBetweenGroups, ...profileParams } = params;
    
    // Update common parameters
    setCommonParameters({ landingZone, flightDirection, flightOverLandingZone, jumpTime, numberOfGroups, timeBetweenGroups });
    
    // Update the first enabled profile or first profile
    const targetProfile = profiles.find(p => p.enabled) || profiles[0];
    if (targetProfile) {
      updateProfile(targetProfile.id, { parameters: profileParams });
    }
  };

  const setUserPreferences = (prefs: UserPreferences) => {
    setUserPreferencesState(prefs);
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
  };

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation && commonParameters.landingZone.lat === 0 && commonParameters.landingZone.lon === 0) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLandingZone = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          
          // Update common parameters with the new landing zone
          setCommonParameters({
            ...commonParameters,
            landingZone: newLandingZone,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, [commonParameters]);

  const value: AppContextType = {
    profiles,
    setProfiles,
    addProfile,
    updateProfile,
    deleteProfile,
    commonParameters,
    setCommonParameters,
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
    // Backward compatibility
    jumpParameters,
    setJumpParameters,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};