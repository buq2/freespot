import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserPreferences, Units } from '../types';

interface PreferencesContextType {
  userPreferences: UserPreferences;
  setUserPreferences: (prefs: UserPreferences) => void;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  updateUnits: (units: Partial<Units>) => void;
  resetToDefaults: () => void;
}

export const defaultUserPreferences: UserPreferences = {
  units: {
    altitude: 'meters',
    speed: 'ms',
    temperature: 'celsius',
  },
  studentWindLimit: 8, // m/s
  sportWindLimit: 11, // m/s
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const usePreferencesContext = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferencesContext must be used within PreferencesProvider');
  }
  return context;
};

interface PreferencesProviderProps {
  children: ReactNode;
}

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({ children }) => {
  // Load initial values from localStorage
  const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [userPreferences, setUserPreferencesState] = useState<UserPreferences>(() => 
    loadFromStorage('userPreferences', defaultUserPreferences)
  );

  const setUserPreferences = (prefs: UserPreferences) => {
    setUserPreferencesState(prefs);
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    const updatedPrefs = { ...userPreferences, [key]: value };
    setUserPreferences(updatedPrefs);
  };

  const updateUnits = (units: Partial<Units>) => {
    const updatedUnits = { ...userPreferences.units, ...units };
    updatePreference('units', updatedUnits);
  };

  const resetToDefaults = () => {
    setUserPreferences(defaultUserPreferences);
  };

  const value: PreferencesContextType = {
    userPreferences,
    setUserPreferences,
    updatePreference,
    updateUnits,
    resetToDefaults,
  };

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};