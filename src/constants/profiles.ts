import type { JumpProfile, JumpParameters } from '../types';

export const defaultJumpParameters: JumpParameters = {
  jumpAltitude: 4000, // meters
  aircraftSpeed: 36, // m/s (130 km/h)
  freefallSpeed: 55.56, // m/s (200 km/h)
  openingAltitude: 800, // meters
  canopyDescentRate: 6, // m/s
  glideRatio: 2.5, // This gives us ~16.1 m/s canopy air speed (sqrt(6^2 + (6*2.5)^2) = sqrt(36 + 225))
  setupAltitude: 100, // meters AGL - default to 100m for pattern work
};

// Generate unique ID for profiles
export const generateProfileId = (): string => {
  return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Default profile templates
export const createDefaultProfiles = (): JumpProfile[] => [
  {
    id: 'sport_jumpers',
    name: 'Sport',
    enabled: true,
    color: '#2196F3', // Blue
    showDriftVisualization: false,
    showSafetyCircle: true,
    showGroupExitPoints: true,
    showFlightPath: true,
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
    showSafetyCircle: true,
    showGroupExitPoints: false,
    showFlightPath: false,
    parameters: {
      jumpAltitude: 4000,
      aircraftSpeed: 36,
      freefallSpeed: 50,
      openingAltitude: 1200, // Use the value from AppContext
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
    showSafetyCircle: true,
    showGroupExitPoints: false,
    showFlightPath: false,
    parameters: {
      jumpAltitude: 4000,
      aircraftSpeed: 36,
      freefallSpeed: 55.56,
      openingAltitude: 1400, // Use the value from AppContext
      canopyDescentRate: 5,
      glideRatio: 2.2,
      setupAltitude: 100,
    },
  },
];