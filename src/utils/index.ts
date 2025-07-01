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
export { convertSpeed, convertAltitude, getSpeedUnit, getAltitudeUnit } from './units';
export { calculateWindWarnings } from './windWarnings';
export { mapUtils } from './mapUtils';