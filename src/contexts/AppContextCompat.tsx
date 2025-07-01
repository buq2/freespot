import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { FullJumpParameters } from '../types';
import { useProfileContext } from './ProfileContext';
import { useParametersContext } from './ParametersContext';
import { useWeatherContext } from './WeatherContext';
import { usePreferencesContext } from './PreferencesContext';

/**
 * Compatibility layer that maintains the original AppContext interface
 * while using the new focused contexts internally.
 * 
 * This allows existing components to continue using useAppContext()
 * without breaking changes during the migration.
 */
interface AppContextCompatType {
  // Profile management
  profiles: ReturnType<typeof useProfileContext>['profiles'];
  setProfiles: ReturnType<typeof useProfileContext>['setProfiles'];
  addProfile: ReturnType<typeof useProfileContext>['addProfile'];
  updateProfile: ReturnType<typeof useProfileContext>['updateProfile'];
  deleteProfile: ReturnType<typeof useProfileContext>['deleteProfile'];
  
  // Common parameters
  commonParameters: ReturnType<typeof useParametersContext>['commonParameters'];
  setCommonParameters: ReturnType<typeof useParametersContext>['setCommonParameters'];
  
  // User preferences
  userPreferences: ReturnType<typeof usePreferencesContext>['userPreferences'];
  setUserPreferences: ReturnType<typeof usePreferencesContext>['setUserPreferences'];
  
  // Weather data
  weatherCache: ReturnType<typeof useWeatherContext>['weatherCache'];
  setWeatherCache: ReturnType<typeof useWeatherContext>['setWeatherCache'];
  terrainData: ReturnType<typeof useWeatherContext>['terrainData'];
  setTerrainData: ReturnType<typeof useWeatherContext>['setTerrainData'];
  selectedWeatherModel: ReturnType<typeof useWeatherContext>['selectedWeatherModel'];
  setSelectedWeatherModel: ReturnType<typeof useWeatherContext>['setSelectedWeatherModel'];
  customWeatherData: ReturnType<typeof useWeatherContext>['customWeatherData'];
  setCustomWeatherData: ReturnType<typeof useWeatherContext>['setCustomWeatherData'];
  
  // Backward compatibility - combined parameters
  jumpParameters: FullJumpParameters;
  setJumpParameters: (params: FullJumpParameters) => void;
}

const AppContextCompat = createContext<AppContextCompatType | undefined>(undefined);

/**
 * Hook that provides the original AppContext interface by combining
 * all focused contexts. This maintains backward compatibility.
 */
export const useAppContext = () => {
  const context = useContext(AppContextCompat);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider or CombinedProvider');
  }
  return context;
};

interface AppProviderCompatProps {
  children: ReactNode;
}

/**
 * Compatibility provider that creates the original AppContext interface
 * using the new focused contexts.
 */
export const AppProviderCompat: React.FC<AppProviderCompatProps> = ({ children }) => {
  const profileContext = useProfileContext();
  const parametersContext = useParametersContext();
  const weatherContext = useWeatherContext();
  const preferencesContext = usePreferencesContext();

  // Backward compatibility - combine common parameters with active profile
  const jumpParameters: FullJumpParameters = {
    ...parametersContext.commonParameters,
    ...profileContext.getActiveParameters()
  };
  
  const setJumpParameters = (params: FullJumpParameters) => {
    // Split params into common and profile-specific
    const { landingZone, flightDirection, flightOverLandingZone, jumpTime, numberOfGroups, timeBetweenGroups, ...profileParams } = params;
    
    // Update common parameters
    parametersContext.setCommonParameters({ landingZone, flightDirection, flightOverLandingZone, jumpTime, numberOfGroups, timeBetweenGroups });
    
    // Update the enabled profile or first profile
    const targetProfile = profileContext.getEnabledProfile() || profileContext.profiles[0];
    if (targetProfile) {
      profileContext.updateProfile(targetProfile.id, { parameters: profileParams });
    }
  };

  const value: AppContextCompatType = {
    // Profile management
    profiles: profileContext.profiles,
    setProfiles: profileContext.setProfiles,
    addProfile: profileContext.addProfile,
    updateProfile: profileContext.updateProfile,
    deleteProfile: profileContext.deleteProfile,
    
    // Common parameters
    commonParameters: parametersContext.commonParameters,
    setCommonParameters: parametersContext.setCommonParameters,
    
    // User preferences
    userPreferences: preferencesContext.userPreferences,
    setUserPreferences: preferencesContext.setUserPreferences,
    
    // Weather data
    weatherCache: weatherContext.weatherCache,
    setWeatherCache: weatherContext.setWeatherCache,
    terrainData: weatherContext.terrainData,
    setTerrainData: weatherContext.setTerrainData,
    selectedWeatherModel: weatherContext.selectedWeatherModel,
    setSelectedWeatherModel: weatherContext.setSelectedWeatherModel,
    customWeatherData: weatherContext.customWeatherData,
    setCustomWeatherData: weatherContext.setCustomWeatherData,
    
    // Backward compatibility
    jumpParameters,
    setJumpParameters,
  };

  return <AppContextCompat.Provider value={value}>{children}</AppContextCompat.Provider>;
};