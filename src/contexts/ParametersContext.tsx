import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CommonParameters } from '../types';

interface ParametersContextType {
  commonParameters: CommonParameters;
  setCommonParameters: (params: CommonParameters) => void;
  updateCommonParameter: <K extends keyof CommonParameters>(key: K, value: CommonParameters[K]) => void;
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

export const defaultCommonParameters: CommonParameters = {
  landingZone: { lat: 61.7807, lon: 22.7221 },
  flightDirection: undefined, // headwind
  flightOverLandingZone: false, // default to normal offset exit
  jumpTime: roundToNearestHour(new Date()),
  numberOfGroups: 5,
  timeBetweenGroups: 10, // seconds
};

const ParametersContext = createContext<ParametersContextType | undefined>(undefined);

export const useParametersContext = () => {
  const context = useContext(ParametersContext);
  if (!context) {
    throw new Error('useParametersContext must be used within ParametersProvider');
  }
  return context;
};

interface ParametersProviderProps {
  children: ReactNode;
}

export const ParametersProvider: React.FC<ParametersProviderProps> = ({ children }) => {
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

  const setCommonParameters = (params: CommonParameters) => {
    setCommonParametersState(params);
    localStorage.setItem('commonParameters', JSON.stringify(params));
  };

  const updateCommonParameter = <K extends keyof CommonParameters>(
    key: K, 
    value: CommonParameters[K]
  ) => {
    const updatedParams = { ...commonParameters, [key]: value };
    setCommonParameters(updatedParams);
  };

  // Get user location on mount if no location is set
  useEffect(() => {
    if (navigator.geolocation && commonParameters.landingZone.lat === 61.7807 && commonParameters.landingZone.lon === 22.7221) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLandingZone = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          
          updateCommonParameter('landingZone', newLandingZone);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []); // Empty dependency array to run only on mount

  const value: ParametersContextType = {
    commonParameters,
    setCommonParameters,
    updateCommonParameter,
  };

  return <ParametersContext.Provider value={value}>{children}</ParametersContext.Provider>;
};