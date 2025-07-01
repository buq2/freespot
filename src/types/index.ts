export interface LatLon {
  lat: number;
  lon: number;
}

export interface ForecastData {
  altitude: number; // meters above sea level
  direction: number; // degrees
  speed: number; // m/s
  gustSpeed?: number; // m/s
  temperature?: number; // celsius
}

export interface JumpParameters {
  jumpAltitude: number; // meters
  aircraftSpeed: number; // m/s
  freefallSpeed: number; // m/s
  openingAltitude: number; // meters
  canopyDescentRate: number; // m/s
  glideRatio: number;
  setupAltitude: number; // meters AGL - altitude to be on top of landing zone without forward canopy speed
  numberOfGroups: number;
  timeBetweenGroups: number; // seconds
  landingZone: LatLon;
  flightDirection?: number; // degrees, undefined means headwind
  flightOverLandingZone: boolean; // if true, airplane flies directly over landing zone
  jumpTime: Date;
}

export interface JumpProfile {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
  showDriftVisualization: boolean;
  parameters: JumpParameters;
}

export interface ExitPoint {
  location: LatLon;
  groupNumber: number;
}

export interface WeatherModel {
  id: string;
  name: string;
  altitudeLevels: number[];
}

export interface Units {
  altitude: 'meters' | 'feet';
  speed: 'ms' | 'kmh' | 'mph' | 'knots';
  temperature: 'celsius' | 'fahrenheit';
}

export interface UserPreferences {
  units: Units;
  studentWindLimit: number; // m/s
  sportWindLimit: number; // m/s
}

export interface TerrainData {
  location: LatLon;
  elevation: number; // meters above sea level
}

export interface CachedLocationData {
  location: LatLon;
  terrain: TerrainData;
  timestamp: number;
  forecastDate: Date;
  weatherModels: {
    [modelId: string]: ForecastData[];
  };
}