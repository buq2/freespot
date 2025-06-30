// Physics constants and conversion factors

// Earth radius in meters (using WGS84 mean radius)
export const EARTH_RADIUS = 6371008.8;

// Conversion factors
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

// Canopy physics helper
// Canopy air speed = sqrt(descent_rate^2 + (descent_rate * glide_ratio)^2)
// This comes from the fact that the canopy flies at an angle where:
// - Vertical component = descent rate
// - Horizontal component = descent rate * glide ratio
export const calculateCanopyAirSpeed = (descentRate: number, glideRatio: number): number => {
  const horizontalSpeed = descentRate * glideRatio;
  return Math.sqrt(descentRate * descentRate + horizontalSpeed * horizontalSpeed);
};