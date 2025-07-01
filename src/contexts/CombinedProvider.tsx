import React from 'react';
import type { ReactNode } from 'react';
import { ProfileProvider } from './ProfileContext';
import { ParametersProvider } from './ParametersContext';
import { WeatherProvider } from './WeatherContext';
import { PreferencesProvider } from './PreferencesContext';

interface CombinedProviderProps {
  children: ReactNode;
}

/**
 * Combined provider that wraps all focused contexts in the correct order.
 * This ensures all contexts are available to child components and maintains
 * a clean separation of concerns.
 */
export const CombinedProvider: React.FC<CombinedProviderProps> = ({ children }) => {
  return (
    <PreferencesProvider>
      <ParametersProvider>
        <ProfileProvider>
          <WeatherProvider>
            {children}
          </WeatherProvider>
        </ProfileProvider>
      </ParametersProvider>
    </PreferencesProvider>
  );
};