/**
 * Centralized error handling utilities for consistent error messaging
 * and error classification throughout the application.
 */

export const enum ErrorType {
  // Network and API errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  WEATHER_API_ERROR = 'WEATHER_API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_COORDINATES = 'INVALID_COORDINATES',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  
  // Calculation errors
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  PHYSICS_ERROR = 'PHYSICS_ERROR',
  WEATHER_DATA_ERROR = 'WEATHER_DATA_ERROR',
  
  // User interface errors
  RENDER_ERROR = 'RENDER_ERROR',
  COMPONENT_ERROR = 'COMPONENT_ERROR',
  
  // Storage errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export const enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  userMessage: string;
  technicalMessage: string;
  context?: Record<string, any>;
  timestamp: Date;
  errorId: string;
  recoverable: boolean;
}

/**
 * Creates a standardized application error with consistent structure
 */
export const createAppError = (
  type: ErrorType,
  userMessage: string,
  technicalMessage?: string,
  context?: Record<string, any>,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  recoverable: boolean = true
): AppError => {
  const error = new Error(userMessage) as AppError;
  error.type = type;
  error.severity = severity;
  error.userMessage = userMessage;
  error.technicalMessage = technicalMessage || userMessage;
  error.context = context;
  error.timestamp = new Date();
  error.errorId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  error.recoverable = recoverable;
  return error;
};

/**
 * Standardized error messages for common scenarios
 */
export const ErrorMessages = {
  // Network errors
  NETWORK_UNREACHABLE: 'Unable to connect to the server. Please check your internet connection.',
  API_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
  REQUEST_TIMEOUT: 'The request took too long to complete. Please try again.',
  
  // Weather API errors
  WEATHER_API_FAILED: 'Failed to fetch weather data. Please try again or select a different weather model.',
  WEATHER_DATA_INVALID: 'The weather data received is invalid or incomplete.',
  TERRAIN_DATA_FAILED: 'Failed to get terrain elevation data for this location.',
  
  // Validation errors
  INVALID_LANDING_ZONE: 'Please enter valid coordinates for the landing zone.',
  INVALID_ALTITUDE: 'Altitude must be a positive number and within reasonable limits.',
  INVALID_SPEED: 'Speed values must be positive and within realistic ranges.',
  INVALID_TIME: 'Please select a valid date and time for the jump.',
  PROFILE_VALIDATION_FAILED: 'One or more profile parameters are invalid.',
  
  // Calculation errors
  CALCULATION_FAILED: 'Unable to calculate exit points. Please check your parameters.',
  PHYSICS_CALCULATION_ERROR: 'Error in physics calculations. Please verify input parameters.',
  INSUFFICIENT_WEATHER_DATA: 'Not enough weather data available for accurate calculations.',
  
  // Storage errors
  STORAGE_QUOTA_EXCEEDED: 'Storage quota exceeded. Some settings may not be saved.',
  CACHE_READ_ERROR: 'Error reading cached data. Fresh data will be fetched.',
  
  // Generic errors
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please refresh the page and try again.',
  FEATURE_UNAVAILABLE: 'This feature is temporarily unavailable.',
} as const;

/**
 * Maps error types to user-friendly messages and severity levels
 */
export const ErrorTypeConfig: Record<ErrorType, { message: string; severity: ErrorSeverity; recoverable: boolean }> = {
  [ErrorType.NETWORK_ERROR]: {
    message: ErrorMessages.NETWORK_UNREACHABLE,
    severity: ErrorSeverity.HIGH,
    recoverable: true
  },
  [ErrorType.API_ERROR]: {
    message: ErrorMessages.API_UNAVAILABLE,
    severity: ErrorSeverity.HIGH,
    recoverable: true
  },
  [ErrorType.WEATHER_API_ERROR]: {
    message: ErrorMessages.WEATHER_API_FAILED,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true
  },
  [ErrorType.TIMEOUT_ERROR]: {
    message: ErrorMessages.REQUEST_TIMEOUT,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true
  },
  [ErrorType.VALIDATION_ERROR]: {
    message: ErrorMessages.PROFILE_VALIDATION_FAILED,
    severity: ErrorSeverity.LOW,
    recoverable: true
  },
  [ErrorType.INVALID_COORDINATES]: {
    message: ErrorMessages.INVALID_LANDING_ZONE,
    severity: ErrorSeverity.LOW,
    recoverable: true
  },
  [ErrorType.INVALID_PARAMETERS]: {
    message: ErrorMessages.PROFILE_VALIDATION_FAILED,
    severity: ErrorSeverity.LOW,
    recoverable: true
  },
  [ErrorType.CALCULATION_ERROR]: {
    message: ErrorMessages.CALCULATION_FAILED,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true
  },
  [ErrorType.PHYSICS_ERROR]: {
    message: ErrorMessages.PHYSICS_CALCULATION_ERROR,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true
  },
  [ErrorType.WEATHER_DATA_ERROR]: {
    message: ErrorMessages.INSUFFICIENT_WEATHER_DATA,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true
  },
  [ErrorType.RENDER_ERROR]: {
    message: ErrorMessages.UNEXPECTED_ERROR,
    severity: ErrorSeverity.HIGH,
    recoverable: false
  },
  [ErrorType.COMPONENT_ERROR]: {
    message: ErrorMessages.UNEXPECTED_ERROR,
    severity: ErrorSeverity.HIGH,
    recoverable: true
  },
  [ErrorType.STORAGE_ERROR]: {
    message: ErrorMessages.STORAGE_QUOTA_EXCEEDED,
    severity: ErrorSeverity.LOW,
    recoverable: true
  },
  [ErrorType.CACHE_ERROR]: {
    message: ErrorMessages.CACHE_READ_ERROR,
    severity: ErrorSeverity.LOW,
    recoverable: true
  },
  [ErrorType.UNKNOWN_ERROR]: {
    message: ErrorMessages.UNEXPECTED_ERROR,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true
  },
  [ErrorType.CONFIGURATION_ERROR]: {
    message: ErrorMessages.FEATURE_UNAVAILABLE,
    severity: ErrorSeverity.HIGH,
    recoverable: false
  }
};

/**
 * Creates an error from an unknown error object (e.g., from catch blocks)
 */
export const normalizeError = (error: unknown, fallbackType: ErrorType = ErrorType.UNKNOWN_ERROR): AppError => {
  if (error instanceof Error) {
    // Check if it's already an AppError
    if ('type' in error && 'severity' in error) {
      return error as AppError;
    }
    
    // Try to infer error type from error message or properties
    let type = fallbackType;
    if (error.message.includes('fetch') || error.message.includes('network')) {
      type = ErrorType.NETWORK_ERROR;
    } else if (error.message.includes('timeout')) {
      type = ErrorType.TIMEOUT_ERROR;
    } else if (error.message.includes('validation')) {
      type = ErrorType.VALIDATION_ERROR;
    }
    
    const config = ErrorTypeConfig[type];
    return createAppError(
      type,
      config.message,
      error.message,
      { originalError: error.message, stack: error.stack },
      config.severity,
      config.recoverable
    );
  }
  
  // Handle non-Error objects
  const config = ErrorTypeConfig[fallbackType];
  return createAppError(
    fallbackType,
    config.message,
    typeof error === 'string' ? error : 'Unknown error occurred',
    { originalError: error },
    config.severity,
    config.recoverable
  );
};

/**
 * Logs errors with consistent formatting
 */
export const logError = (error: AppError, additionalContext?: Record<string, any>) => {
  const logLevel = error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH ? 'error' : 'warn';
  
  console.group(`🚨 ${error.type} [${error.errorId}]`);
  console[logLevel]('User Message:', error.userMessage);
  console[logLevel]('Technical Message:', error.technicalMessage);
  console[logLevel]('Severity:', error.severity);
  console[logLevel]('Recoverable:', error.recoverable);
  console[logLevel]('Timestamp:', error.timestamp.toISOString());
  
  if (error.context) {
    console[logLevel]('Context:', error.context);
  }
  
  if (additionalContext) {
    console[logLevel]('Additional Context:', additionalContext);
  }
  
  if (error.stack) {
    console[logLevel]('Stack Trace:', error.stack);
  }
  
  console.groupEnd();
  
  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToErrorReporting(error, additionalContext);
  }
};

/**
 * Handles errors consistently across the application
 */
export const handleError = (
  error: unknown,
  context?: Record<string, any>,
  fallbackType: ErrorType = ErrorType.UNKNOWN_ERROR
): AppError => {
  const appError = normalizeError(error, fallbackType);
  logError(appError, context);
  return appError;
};

/**
 * Creates specific error types for common scenarios
 */
export const ErrorFactories = {
  networkError: (message?: string, context?: Record<string, any>) =>
    createAppError(
      ErrorType.NETWORK_ERROR,
      message || ErrorMessages.NETWORK_UNREACHABLE,
      message,
      context,
      ErrorSeverity.HIGH
    ),
    
  validationError: (message: string, context?: Record<string, any>) =>
    createAppError(
      ErrorType.VALIDATION_ERROR,
      message,
      message,
      context,
      ErrorSeverity.LOW
    ),
    
  calculationError: (message?: string, context?: Record<string, any>) =>
    createAppError(
      ErrorType.CALCULATION_ERROR,
      message || ErrorMessages.CALCULATION_FAILED,
      message,
      context,
      ErrorSeverity.MEDIUM
    ),
    
  weatherError: (message?: string, context?: Record<string, any>) =>
    createAppError(
      ErrorType.WEATHER_API_ERROR,
      message || ErrorMessages.WEATHER_API_FAILED,
      message,
      context,
      ErrorSeverity.MEDIUM
    )
};