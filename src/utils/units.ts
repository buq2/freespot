import type { Units } from '../types';

// Altitude conversions
export const metersToFeet = (meters: number): number => meters * 3.28084;
export const feetToMeters = (feet: number): number => feet / 3.28084;

// Speed conversions
export const msToKmh = (ms: number): number => ms * 3.6;
export const kmhToMs = (kmh: number): number => kmh / 3.6;
export const msToMph = (ms: number): number => ms * 2.23694;
export const mphToMs = (mph: number): number => mph / 2.23694;
export const msToKnots = (ms: number): number => ms * 1.94384;
export const knotsToMs = (knots: number): number => knots / 1.94384;

// Temperature conversions
export const celsiusToFahrenheit = (celsius: number): number => (celsius * 9/5) + 32;
export const fahrenheitToCelsius = (fahrenheit: number): number => (fahrenheit - 32) * 5/9;

// Generic conversion functions
export const convertAltitude = (value: number, from: Units['altitude'], to: Units['altitude']): number => {
  if (from === to) return value;
  if (from === 'meters' && to === 'feet') return metersToFeet(value);
  if (from === 'feet' && to === 'meters') return feetToMeters(value);
  return value;
};

export const convertSpeed = (value: number, from: Units['speed'], to: Units['speed']): number => {
  if (from === to) return value;
  
  // First convert to m/s
  let ms = value;
  switch (from) {
    case 'kmh': ms = kmhToMs(value); break;
    case 'mph': ms = mphToMs(value); break;
    case 'knots': ms = knotsToMs(value); break;
  }
  
  // Then convert to target unit
  switch (to) {
    case 'ms': return ms;
    case 'kmh': return msToKmh(ms);
    case 'mph': return msToMph(ms);
    case 'knots': return msToKnots(ms);
  }
  return ms;
};

export const convertTemperature = (value: number, from: Units['temperature'], to: Units['temperature']): number => {
  if (from === to) return value;
  if (from === 'celsius' && to === 'fahrenheit') return celsiusToFahrenheit(value);
  if (from === 'fahrenheit' && to === 'celsius') return fahrenheitToCelsius(value);
  return value;
};

// Format functions for display
export const formatAltitude = (meters: number, unit: Units['altitude']): string => {
  const value = convertAltitude(meters, 'meters', unit);
  return `${Math.round(value)} ${unit === 'meters' ? 'm' : 'ft'}`;
};

export const formatSpeed = (ms: number, unit: Units['speed']): string => {
  const value = convertSpeed(ms, 'ms', unit);
  const unitLabel = {
    'ms': 'm/s',
    'kmh': 'km/h',
    'mph': 'mph',
    'knots': 'kts'
  }[unit];
  return `${value.toFixed(1)} ${unitLabel}`;
};

export const formatTemperature = (celsius: number, unit: Units['temperature']): string => {
  const value = convertTemperature(celsius, 'celsius', unit);
  return `${Math.round(value)}°${unit === 'celsius' ? 'C' : 'F'}`;
};