import { useState, useCallback, useMemo } from 'react';

export type ValidationRule<T> = {
  rule: (value: T) => boolean;
  message: string;
};

export type Validator<T> = (value: T) => string | null;

export interface UseFormFieldOptions<T> {
  /** Initial value for the field */
  initialValue: T;
  /** Single validator function */
  validator?: Validator<T>;
  /** Array of validation rules */
  validationRules?: ValidationRule<T>[];
  /** Whether to validate on change (default: false) */
  validateOnChange?: boolean;
  /** Whether to validate on blur (default: true) */
  validateOnBlur?: boolean;
  /** Transform function to apply to values before setting */
  transform?: (value: T) => T;
  /** Debounce delay for validation in ms */
  debounceMs?: number;
}

export interface UseFormFieldReturn<T> {
  value: T;
  error: string | null;
  touched: boolean;
  isValid: boolean;
  isDirty: boolean;
  handleChange: (newValue: T) => void;
  handleBlur: () => void;
  setValue: (newValue: T) => void;
  setError: (error: string | null) => void;
  validate: () => boolean;
  reset: () => void;
  clearError: () => void;
}

/**
 * Enhanced custom hook for form field management with advanced validation capabilities.
 * 
 * Supports multiple validation approaches:
 * - Single validator function
 * - Array of validation rules
 * - Built-in common validators
 * 
 * Features:
 * - Configurable validation timing (on change, on blur, manual)
 * - Value transformation
 * - Dirty state tracking
 * - Manual validation trigger
 * - Error clearing
 * 
 * @example
 * ```typescript
 * // Basic usage with validator function
 * const emailField = useFormField({
 *   initialValue: '',
 *   validator: (value) => {
 *     if (!value.includes('@')) return 'Invalid email';
 *     return null;
 *   }
 * });
 * 
 * // Usage with validation rules
 * const altitudeField = useFormField({
 *   initialValue: 4000,
 *   validationRules: [
 *     { rule: (v) => v > 0, message: 'Altitude must be positive' },
 *     { rule: (v) => v <= 10000, message: 'Altitude too high' }
 *   ],
 *   transform: (v) => Math.round(v)
 * });
 * ```
 */
export const useFormField = <T>(options: UseFormFieldOptions<T>): UseFormFieldReturn<T> => {
  const {
    initialValue,
    validator,
    validationRules = [],
    validateOnChange = false,
    validateOnBlur = true,
    transform,
    debounceMs = 0
  } = options;

  const [value, setValueState] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Combine validator and validation rules
  const combinedValidator = useMemo((): Validator<T> => {
    return (val: T) => {
      // First run the custom validator if provided
      if (validator) {
        const result = validator(val);
        if (result) return result;
      }

      // Then check validation rules
      for (const rule of validationRules) {
        if (!rule.rule(val)) {
          return rule.message;
        }
      }

      return null;
    };
  }, [validator, validationRules]);

  const isDirty = useMemo(() => value !== initialValue, [value, initialValue]);
  const isValid = useMemo(() => !error, [error]);

  const validateValue = useCallback((val: T): string | null => {
    return combinedValidator(val);
  }, [combinedValidator]);

  const setValue = useCallback((newValue: T) => {
    const transformedValue = transform ? transform(newValue) : newValue;
    setValueState(transformedValue);
  }, [transform]);

  const handleChange = useCallback((newValue: T) => {
    setValue(newValue);
    
    if (validateOnChange && touched) {
      const validationError = validateValue(newValue);
      setError(validationError);
    }
  }, [setValue, validateOnChange, touched, validateValue]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    
    if (validateOnBlur) {
      const validationError = validateValue(value);
      setError(validationError);
    }
  }, [validateOnBlur, value, validateValue]);

  const validate = useCallback((): boolean => {
    const validationError = validateValue(value);
    setError(validationError);
    setTouched(true);
    return !validationError;
  }, [value, validateValue]);

  const reset = useCallback(() => {
    setValueState(initialValue);
    setError(null);
    setTouched(false);
  }, [initialValue]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    value,
    error,
    touched,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    setValue,
    setError,
    validate,
    reset,
    clearError,
  };
};

// Common validators for convenience
export const validators = {
  required: <T>(value: T): string | null => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }
    return null;
  },

  minLength: (min: number) => (value: string): string | null => {
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max: number) => (value: string): string | null => {
    if (value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  },

  min: (minimum: number) => (value: number): string | null => {
    if (value < minimum) {
      return `Must be at least ${minimum}`;
    }
    return null;
  },

  max: (maximum: number) => (value: number): string | null => {
    if (value > maximum) {
      return `Must be no more than ${maximum}`;
    }
    return null;
  },

  range: (min: number, max: number) => (value: number): string | null => {
    if (value < min || value > max) {
      return `Must be between ${min} and ${max}`;
    }
    return null;
  },

  latitude: (value: number): string | null => {
    if (value < -90 || value > 90) {
      return 'Latitude must be between -90 and 90 degrees';
    }
    return null;
  },

  longitude: (value: number): string | null => {
    if (value < -180 || value > 180) {
      return 'Longitude must be between -180 and 180 degrees';
    }
    return null;
  },

  email: (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  positiveNumber: (value: number): string | null => {
    if (value <= 0) {
      return 'Must be a positive number';
    }
    return null;
  },

  nonNegativeNumber: (value: number): string | null => {
    if (value < 0) {
      return 'Must be zero or positive';
    }
    return null;
  }
};