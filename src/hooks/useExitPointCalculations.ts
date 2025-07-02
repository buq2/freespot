import { useState, useCallback, useMemo } from 'react';
import type { JumpProfile, ForecastData, FullJumpParameters } from '../types';
import { calculateExitPoints as calculateExitPointsPhysics } from '../physics/exit-point';
import type { ExitCalculationResult } from '../physics/exit-point';
import { useProfileContext } from '../contexts/ProfileContext';
import { useParametersContext } from '../contexts/ParametersContext';

export interface MultiProfileResult {
  profileId: string;
  profile: JumpProfile;
  calculation: ExitCalculationResult;
  groundWind: ForecastData | null;
  error?: string;
}

export interface UseExitPointCalculationsReturn {
  // State
  results: MultiProfileResult[];
  primaryResult: MultiProfileResult | null;
  isCalculating: boolean;
  error: string | null;
  
  // Computed properties
  enabledProfiles: JumpProfile[];
  fullParameters: FullJumpParameters[];
  
  // Actions
  calculateExitPoints: (
    weatherData: ForecastData[],
    groundWindData?: ForecastData | null
  ) => Promise<MultiProfileResult[]>;
  calculateForProfile: (
    profile: JumpProfile,
    weatherData: ForecastData[],
    groundWindData?: ForecastData | null
  ) => Promise<MultiProfileResult>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Custom hook for exit point calculations across multiple profiles.
 * 
 * Handles exit point calculations for enabled profiles, combining
 * common parameters with profile-specific parameters. Provides
 * error handling and loading states for individual profiles.
 * 
 * @example
 * ```typescript
 * const { 
 *   results, 
 *   primaryResult, 
 *   isCalculating, 
 *   calculateExitPoints 
 * } = useExitPointCalculations();
 * 
 * const handleCalculate = async () => {
 *   try {
 *     const results = await calculateExitPoints(weatherData, groundWind);
 *     console.log('Exit points:', results);
 *   } catch (err) {
 *     console.error('Calculation failed:', err);
 *   }
 * };
 * ```
 */
export const useExitPointCalculations = (): UseExitPointCalculationsReturn => {
  const [results, setResults] = useState<MultiProfileResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { profiles, getEnabledProfile } = useProfileContext();
  const { commonParameters } = useParametersContext();

  // Get enabled profiles
  const enabledProfiles = useMemo(() => 
    profiles.filter(p => p.enabled), 
    [profiles]
  );

  // Get primary result (first enabled profile)
  const primaryResult = useMemo(() => {
    const enabledProfile = getEnabledProfile();
    return results.find(r => r.profileId === enabledProfile?.id) || results[0] || null;
  }, [results, getEnabledProfile]);

  // Generate full parameters for each enabled profile
  const fullParameters = useMemo((): FullJumpParameters[] => 
    enabledProfiles.map(profile => ({
      ...commonParameters,
      ...profile.parameters
    })),
    [enabledProfiles, commonParameters]
  );

  const calculateForProfile = useCallback(async (
    profile: JumpProfile,
    weatherData: ForecastData[],
    groundWindData?: ForecastData | null
  ): Promise<MultiProfileResult> => {
    try {
      // Combine common parameters with profile-specific parameters
      const fullParams: FullJumpParameters = {
        ...commonParameters,
        ...profile.parameters
      };
      
      // Calculate exit points for this profile
      const calculation = calculateExitPointsPhysics(fullParams, weatherData);
      
      return {
        profileId: profile.id,
        profile,
        calculation,
        groundWind: groundWindData || null
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Calculation failed';
      return {
        profileId: profile.id,
        profile,
        calculation: {
          optimalExitPoint: { lat: 0, lon: 0 },
          exitPoints: [],
          safetyRadius: 0,
          aircraftHeading: 0
        },
        groundWind: groundWindData || null,
        error: errorMessage
      };
    }
  }, [commonParameters]); // Restore commonParameters dependency for reactivity

  const calculateExitPoints = useCallback(async (
    weatherData: ForecastData[],
    groundWindData?: ForecastData | null
  ): Promise<MultiProfileResult[]> => {
    if (!weatherData || weatherData.length === 0) {
      const errorMsg = 'No weather data available for calculations';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    if (enabledProfiles.length === 0) {
      const errorMsg = 'Please enable at least one profile';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsCalculating(true);
    setError(null);

    try {
      // Calculate exit points for all enabled profiles
      const profileResults = await Promise.all(
        enabledProfiles.map(profile => 
          calculateForProfile(profile, weatherData, groundWindData)
        )
      );

      // Check if any calculations failed
      const failedCalculations = profileResults.filter(r => r.error);
      if (failedCalculations.length > 0) {
        const errorMsg = `Failed to calculate for ${failedCalculations.length} profile(s)`;
        setError(errorMsg);
        console.warn('Some profile calculations failed:', failedCalculations);
      }

      setResults(profileResults);
      return profileResults;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Exit point calculations failed';
      setError(errorMessage);
      throw err;
      
    } finally {
      setIsCalculating(false);
    }
  }, [enabledProfiles, calculateForProfile]); // Restore enabledProfiles dependency for proper reactivity

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
    setIsCalculating(false);
  }, []);

  return {
    results,
    primaryResult,
    isCalculating,
    error,
    enabledProfiles,
    fullParameters,
    calculateExitPoints,
    calculateForProfile,
    clearError,
    reset
  };
};