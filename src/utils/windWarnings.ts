import type { UserPreferences } from '../types';

export type WindWarningLevel = 'success' | 'warning' | 'error' | 'default';

/**
 * Calculate wind warning level based on speed and user preferences
 */
export const getWindWarningLevel = (
  speed: number,
  gustSpeed: number | undefined,
  altitude: number,
  userPreferences: UserPreferences
): WindWarningLevel => {
  // Only show warnings for ground wind (< 50m AGL)
  if (altitude >= 50) {
    return 'default';
  }
  
  const maxSpeed = Math.max(speed, gustSpeed || 0);
  
  if (maxSpeed >= userPreferences.sportWindLimit) {
    return 'error';
  } else if (maxSpeed >= userPreferences.studentWindLimit) {
    return 'warning';
  }
  return 'success';
};

/**
 * Get human-readable wind warning label
 */
export const getWindWarningLabel = (level: WindWarningLevel): string => {
  switch (level) {
    case 'error':
      return 'High';
    case 'warning':
      return 'Moderate';
    case 'success':
      return 'OK';
    default:
      return '-';
  }
};

/**
 * Check if wind data has any warnings
 */
export const hasWindWarnings = (
  windData: Array<{ speed: number; gustSpeed?: number; altitude: number }>,
  userPreferences: UserPreferences
): { hasHigh: boolean; hasModerate: boolean } => {
  const groundWindData = windData.filter(d => d.altitude < 50);
  
  const hasHigh = groundWindData.some(d => {
    const maxSpeed = Math.max(d.speed, d.gustSpeed || 0);
    return maxSpeed >= userPreferences.sportWindLimit;
  });
  
  const hasModerate = groundWindData.some(d => {
    const maxSpeed = Math.max(d.speed, d.gustSpeed || 0);
    return maxSpeed >= userPreferences.studentWindLimit;
  });
  
  return { hasHigh, hasModerate };
};