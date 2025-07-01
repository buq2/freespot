/**
 * Input sanitization utilities for cleaning and validating user input
 * to prevent security issues and ensure data integrity.
 */

/**
 * Sanitizes string input by removing/escaping potentially dangerous characters
 */
export const sanitizeString = (input: string, options: {
  /** Remove HTML tags */
  stripHtml?: boolean;
  /** Remove script tags and javascript: protocols */
  removeScripts?: boolean;
  /** Trim whitespace */
  trim?: boolean;
  /** Maximum length */
  maxLength?: number;
  /** Replace line breaks with spaces */
  singleLine?: boolean;
} = {}): string => {
  const {
    stripHtml = true,
    removeScripts = true,
    trim = true,
    maxLength,
    singleLine = false
  } = options;

  let sanitized = input;

  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Remove HTML tags
  if (stripHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Remove script-related content
  if (removeScripts) {
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  }

  // Replace line breaks with spaces
  if (singleLine) {
    sanitized = sanitized.replace(/[\r\n]+/g, ' ');
  }

  // Limit length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
};

/**
 * Sanitizes and validates numeric input
 */
export const sanitizeNumber = (input: string | number, options: {
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Number of decimal places */
  decimals?: number;
  /** Default value if invalid */
  defaultValue?: number;
  /** Allow negative numbers */
  allowNegative?: boolean;
} = {}): number => {
  const {
    min,
    max,
    decimals,
    defaultValue = 0,
    allowNegative = true
  } = options;

  // Convert to number
  let num = typeof input === 'string' ? parseFloat(input) : input;

  // Check if valid number
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }

  // Handle negative numbers
  if (!allowNegative && num < 0) {
    num = Math.abs(num);
  }

  // Apply decimal precision
  if (typeof decimals === 'number') {
    num = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  // Apply min/max constraints
  if (typeof min === 'number') {
    num = Math.max(min, num);
  }
  if (typeof max === 'number') {
    num = Math.min(max, num);
  }

  return num;
};

/**
 * Sanitizes coordinate values (latitude/longitude)
 */
export const sanitizeCoordinate = (input: string | number, type: 'latitude' | 'longitude'): number => {
  const isLatitude = type === 'latitude';
  const min = isLatitude ? -90 : -180;
  const max = isLatitude ? 90 : 180;

  return sanitizeNumber(input, {
    min,
    max,
    decimals: 6,
    defaultValue: 0
  });
};

/**
 * Sanitizes email input
 */
export const sanitizeEmail = (input: string): string => {
  return sanitizeString(input, {
    trim: true,
    singleLine: true,
    maxLength: 254
  }).toLowerCase();
};

/**
 * Sanitizes file names
 */
export const sanitizeFileName = (input: string): string => {
  return sanitizeString(input, {
    stripHtml: true,
    removeScripts: true,
    trim: true,
    maxLength: 255
  })
    // Remove invalid file name characters
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ');
};

/**
 * Sanitizes JSON input
 */
export const sanitizeJson = (input: string): any => {
  try {
    const sanitized = sanitizeString(input, {
      stripHtml: false,
      removeScripts: true,
      trim: true
    });
    
    return JSON.parse(sanitized);
  } catch {
    return null;
  }
};

/**
 * Sanitizes URL input
 */
export const sanitizeUrl = (input: string): string => {
  const sanitized = sanitizeString(input, {
    trim: true,
    singleLine: true,
    maxLength: 2048
  });

  // Basic URL validation and sanitization
  try {
    const url = new URL(sanitized);
    
    // Only allow safe protocols
    const allowedProtocols = ['http:', 'https:', 'ftp:', 'ftps:'];
    if (!allowedProtocols.includes(url.protocol)) {
      return '';
    }
    
    return url.toString();
  } catch {
    return '';
  }
};

/**
 * Sanitizes phone number input
 */
export const sanitizePhoneNumber = (input: string): string => {
  return sanitizeString(input, {
    trim: true,
    singleLine: true
  })
    // Keep only digits, spaces, +, -, (, )
    .replace(/[^\d\s+\-()]/g, '')
    // Normalize spaces
    .replace(/\s+/g, ' ');
};

/**
 * Comprehensive input sanitizer that applies appropriate sanitization based on input type
 */
export const sanitizeInput = (
  input: any,
  type: 'string' | 'number' | 'email' | 'url' | 'phone' | 'filename' | 'json' | 'coordinate',
  options?: any
): any => {
  if (input === null || input === undefined) {
    return input;
  }

  switch (type) {
    case 'string':
      return sanitizeString(String(input), options);
    
    case 'number':
      return sanitizeNumber(input, options);
    
    case 'email':
      return sanitizeEmail(String(input));
    
    case 'url':
      return sanitizeUrl(String(input));
    
    case 'phone':
      return sanitizePhoneNumber(String(input));
    
    case 'filename':
      return sanitizeFileName(String(input));
    
    case 'json':
      return sanitizeJson(String(input));
    
    case 'coordinate':
      return sanitizeCoordinate(input, options?.coordinateType || 'latitude');
    
    default:
      return input;
  }
};

/**
 * Batch sanitizer for objects with multiple fields
 */
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
  schema: Record<keyof T, {
    type: 'string' | 'number' | 'email' | 'url' | 'phone' | 'filename' | 'json' | 'coordinate';
    options?: any;
  }>
): T => {
  const sanitized = {} as T;

  for (const [key, config] of Object.entries(schema)) {
    if (key in obj) {
      sanitized[key as keyof T] = sanitizeInput(obj[key], config.type, config.options);
    }
  }

  return sanitized;
};

/**
 * Predefined sanitization schemas for common form types
 */
export const SanitizationSchemas = {
  jumpParameters: {
    jumpAltitude: { type: 'number' as const, options: { min: 0, max: 15000, decimals: 0 } },
    aircraftSpeed: { type: 'number' as const, options: { min: 0, max: 200, decimals: 1 } },
    freefallSpeed: { type: 'number' as const, options: { min: 0, max: 100, decimals: 2 } },
    openingAltitude: { type: 'number' as const, options: { min: 0, max: 10000, decimals: 0 } },
    canopyDescentRate: { type: 'number' as const, options: { min: 0, max: 20, decimals: 1 } },
    glideRatio: { type: 'number' as const, options: { min: 0, max: 10, decimals: 2 } },
    setupAltitude: { type: 'number' as const, options: { min: 0, max: 1000, decimals: 0 } }
  },
  
  landingZone: {
    lat: { type: 'coordinate' as const, options: { coordinateType: 'latitude' } },
    lon: { type: 'coordinate' as const, options: { coordinateType: 'longitude' } }
  },
  
  profile: {
    name: { type: 'string' as const, options: { maxLength: 50, singleLine: true } },
    color: { type: 'string' as const, options: { maxLength: 7, singleLine: true } }
  },
  
  userPreferences: {
    studentWindLimit: { type: 'number' as const, options: { min: 0, max: 50, decimals: 1 } },
    sportWindLimit: { type: 'number' as const, options: { min: 0, max: 50, decimals: 1 } }
  }
};