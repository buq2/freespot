import { calculateExitPoints } from '../exit-point';
import type { JumpParameters, ForecastData } from '../../types';

describe('Exit Point Calculation - Headwind', () => {
  const baseParams: JumpParameters = {
    jumpAltitude: 4000,
    openingAltitude: 1000,
    setupAltitude: 100,
    aircraftSpeed: 50, // 50 m/s airspeed
    freefallSpeed: 55,
    canopyDescentRate: 6,
    glideRatio: 2.5,
    numberOfGroups: 3,
    timeBetweenGroups: 6,
    landingZone: { lat: 60, lon: 25 },
    flightDirection: undefined, // Auto headwind
    flightOverLandingZone: false,
    jumpTime: new Date()
  };

  test('Auto headwind should fly into the wind', () => {
    // North wind (coming from north)
    const weatherData: ForecastData[] = [
      { altitude: 0, direction: 0, speed: 10, temperature: 15 },
      { altitude: 1000, direction: 0, speed: 15, temperature: 10 },
      { altitude: 4000, direction: 0, speed: 20, temperature: 0 }
    ];

    const result = calculateExitPoints(baseParams, weatherData);
    
    // Aircraft should fly north (0°) to face the north wind
    expect(result.aircraftHeading).toBe(0);
  });

  test('Headwind should reduce ground speed and group spacing', () => {
    // Strong north wind
    const weatherData: ForecastData[] = [
      { altitude: 0, direction: 0, speed: 10, temperature: 15 },
      { altitude: 1000, direction: 0, speed: 15, temperature: 10 },
      { altitude: 4000, direction: 0, speed: 20, temperature: 0 }
    ];

    const result = calculateExitPoints(baseParams, weatherData);
    
    // With 50 m/s airspeed and 20 m/s headwind, ground speed should be ~30 m/s
    // Group spacing = ground speed * time = 30 * 6 = 180 meters
    const group1 = result.exitPoints[0].location;
    const group2 = result.exitPoints[1].location;
    
    // Calculate distance between groups
    const latDiff = group2.lat - group1.lat;
    const lonDiff = group2.lon - group1.lon;
    
    // Rough distance calculation (for small distances)
    const distance = Math.sqrt(
      Math.pow(latDiff * 111000, 2) + // 1 degree latitude ≈ 111km
      Math.pow(lonDiff * 111000 * Math.cos(group1.lat * Math.PI / 180), 2)
    );
    
    // Should be approximately 180 meters (allowing some tolerance)
    expect(distance).toBeGreaterThan(170);
    expect(distance).toBeLessThan(190);
  });

  test('Tailwind should increase ground speed and group spacing', () => {
    // South wind (coming from south) - aircraft flies south for headwind
    const weatherData: ForecastData[] = [
      { altitude: 0, direction: 180, speed: 10, temperature: 15 },
      { altitude: 1000, direction: 180, speed: 15, temperature: 10 },
      { altitude: 4000, direction: 180, speed: 20, temperature: 0 }
    ];

    const headwindResult = calculateExitPoints(baseParams, weatherData);
    
    // Now test with manual tailwind (flying north with south wind)
    const tailwindParams = { ...baseParams, flightDirection: 0 };
    const tailwindResult = calculateExitPoints(tailwindParams, weatherData);
    
    // Calculate group spacing for both
    const headwindSpacing = Math.sqrt(
      Math.pow((headwindResult.exitPoints[1].location.lat - headwindResult.exitPoints[0].location.lat) * 111000, 2) +
      Math.pow((headwindResult.exitPoints[1].location.lon - headwindResult.exitPoints[0].location.lon) * 111000 * Math.cos(60 * Math.PI / 180), 2)
    );
    
    const tailwindSpacing = Math.sqrt(
      Math.pow((tailwindResult.exitPoints[1].location.lat - tailwindResult.exitPoints[0].location.lat) * 111000, 2) +
      Math.pow((tailwindResult.exitPoints[1].location.lon - tailwindResult.exitPoints[0].location.lon) * 111000 * Math.cos(60 * Math.PI / 180), 2)
    );
    
    // Tailwind spacing should be significantly larger than headwind spacing
    expect(tailwindSpacing).toBeGreaterThan(headwindSpacing * 1.5);
  });

  test('East wind should result in east heading for auto headwind', () => {
    // East wind (coming from east)
    const weatherData: ForecastData[] = [
      { altitude: 0, direction: 90, speed: 10, temperature: 15 },
      { altitude: 1000, direction: 90, speed: 15, temperature: 10 },
      { altitude: 4000, direction: 90, speed: 20, temperature: 0 }
    ];

    const result = calculateExitPoints(baseParams, weatherData);
    
    // Aircraft should fly east (90°) to face the east wind
    expect(result.aircraftHeading).toBe(90);
  });

  test('Groups should be positioned correctly along flight path', () => {
    const weatherData: ForecastData[] = [
      { altitude: 0, direction: 0, speed: 10, temperature: 15 },
      { altitude: 1000, direction: 0, speed: 15, temperature: 10 },
      { altitude: 4000, direction: 0, speed: 20, temperature: 0 }
    ];

    const result = calculateExitPoints(baseParams, weatherData);
    
    // Group 1 should be furthest back (south), Group 3 should be furthest forward (north)
    expect(result.exitPoints[0].location.lat).toBeLessThan(result.exitPoints[1].location.lat);
    expect(result.exitPoints[1].location.lat).toBeLessThan(result.exitPoints[2].location.lat);
    
    // All groups should be roughly on the same longitude (flight path is north-south)
    const lons = result.exitPoints.map(ep => ep.location.lon);
    const lonVariance = Math.max(...lons) - Math.min(...lons);
    expect(lonVariance).toBeLessThan(0.001); // Very small longitude variation
  });
});