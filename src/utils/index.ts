// Error handling utilities
export {
  ErrorType,
  ErrorSeverity,
  ErrorMessages,
  ErrorTypeConfig,
  ErrorFactories,
  createAppError,
  normalizeError,
  logError,
  handleError,
  type AppError
} from './errorHandling';

// Input sanitization utilities
export {
  sanitizeString,
  sanitizeNumber,
  sanitizeCoordinate,
  sanitizeEmail,
  sanitizeFileName,
  sanitizeJson,
  sanitizeUrl,
  sanitizePhoneNumber,
  sanitizeInput,
  sanitizeObject,
  SanitizationSchemas
} from './inputSanitization';

// Re-export existing utilities
export { 
  convertSpeed, 
  convertAltitude, 
  convertTemperature,
  formatAltitude,
  formatSpeed,
  formatTemperature,
  metersToFeet,
  feetToMeters,
  msToKmh,
  kmhToMs,
  msToMph,
  mphToMs,
  msToKnots,
  knotsToMs,
  celsiusToFahrenheit,
  fahrenheitToCelsius
} from './units';

export { 
  getWindWarningLevel,
  getWindWarningLabel,
  hasWindWarnings,
  type WindWarningLevel
} from './windWarnings';

export { 
  calculateDistance,
  calculateBearing,
  calculateDestination,
  generateCirclePoints,
  formatCoordinates,
  isValidCoordinates
} from './mapUtils';