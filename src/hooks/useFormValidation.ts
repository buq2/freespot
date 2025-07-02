import { useState, useCallback } from 'react';
import { sanitizeInput } from '../utils/inputSanitization';

export type ValidationRule<T> = {
  test: (value: T) => boolean;
  message: string;
  severity?: 'error' | 'warning';
};

export type FieldConfig<T> = {
  /** Validation rules for this field */
  rules?: ValidationRule<T>[];
  /** Sanitization type */
  sanitize?: {
    type: 'string' | 'number' | 'email' | 'url' | 'phone' | 'filename' | 'json' | 'coordinate';
    options?: any;
  };
  /** Whether field is required */
  required?: boolean;
  /** Custom validator function */
  validator?: (value: T) => string | null;
  /** Whether to validate on change */
  validateOnChange?: boolean;
  /** Whether to validate on blur */
  validateOnBlur?: boolean;
  /** Transform function */
  transform?: (value: T) => T;
};

export type FormSchema<T> = {
  [K in keyof T]: FieldConfig<T[K]>;
};

export interface FormValidationState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  warnings: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
}

export interface UseFormValidationReturn<T> {
  /** Current form state */
  state: FormValidationState<T>;
  /** Set a field value */
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Set multiple field values */
  setValues: (values: Partial<T>) => void;
  /** Get field value */
  getValue: <K extends keyof T>(field: K) => T[K];
  /** Get field error */
  getError: <K extends keyof T>(field: K) => string | undefined;
  /** Get field warning */
  getWarning: <K extends keyof T>(field: K) => string | undefined;
  /** Check if field is touched */
  isTouched: <K extends keyof T>(field: K) => boolean;
  /** Check if field is valid */
  isFieldValid: <K extends keyof T>(field: K) => boolean;
  /** Mark field as touched */
  touch: <K extends keyof T>(field: K) => void;
  /** Mark all fields as touched */
  touchAll: () => void;
  /** Validate a specific field */
  validateField: <K extends keyof T>(field: K) => boolean;
  /** Validate all fields */
  validateAll: () => boolean;
  /** Reset form to initial values */
  reset: () => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Clear specific field error */
  clearFieldError: <K extends keyof T>(field: K) => void;
  /** Get sanitized values */
  getSanitizedValues: () => T;
  /** Handle field change with validation */
  handleFieldChange: <K extends keyof T>(field: K) => (value: T[K]) => void;
  /** Handle field blur with validation */
  handleFieldBlur: <K extends keyof T>(field: K) => () => void;
}

/**
 * Enhanced form validation hook with sanitization, real-time feedback, and comprehensive validation.
 * 
 * Provides a complete form management solution with:
 * - Real-time validation and sanitization
 * - Field-level and form-level validation
 * - Error and warning states
 * - Touch state management
 * - Custom validation rules
 * - Built-in sanitization
 * 
 * @example
 * ```typescript
 * const form = useFormValidation({
 *   initialValues: { email: '', age: 0 },
 *   schema: {
 *     email: {
 *       required: true,
 *       sanitize: { type: 'email' },
 *       rules: [
 *         { test: (v) => v.includes('@'), message: 'Invalid email format' }
 *       ]
 *     },
 *     age: {
 *       required: true,
 *       sanitize: { type: 'number', options: { min: 0, max: 120 } },
 *       rules: [
 *         { test: (v) => v >= 18, message: 'Must be 18 or older' }
 *       ]
 *     }
 *   }
 * });
 * ```
 */
export const useFormValidation = <T extends Record<string, any>>(options: {
  initialValues: T;
  schema: FormSchema<T>;
  /** Enable real-time validation */
  realTimeValidation?: boolean;
  /** Global validation on change */
  validateOnChange?: boolean;
  /** Global validation on blur */
  validateOnBlur?: boolean;
  /** Custom form-level validator */
  formValidator?: (values: T) => Record<string, string>;
}): UseFormValidationReturn<T> => {
  const {
    initialValues,
    schema,
    realTimeValidation = true,
    validateOnChange = false,
    validateOnBlur = true,
    formValidator
  } = options;

  const [state, setState] = useState<FormValidationState<T>>({
    values: { ...initialValues },
    errors: {},
    warnings: {},
    touched: {},
    isValid: true,
    isDirty: false
  });

  const validateFieldValue = useCallback(<K extends keyof T>(
    field: K,
    value: T[K],
    showWarnings = false
  ): { error?: string; warning?: string } => {
    const config = schema[field];
    if (!config) return {};

    // Check required
    if (config.required && (value === null || value === undefined || value === '')) {
      return { error: `${String(field)} is required` };
    }

    // Run custom validator
    if (config.validator) {
      const error = config.validator(value);
      if (error) return { error };
    }

    // Run validation rules
    if (config.rules) {
      for (const rule of config.rules) {
        if (!rule.test(value)) {
          if (rule.severity === 'warning' && showWarnings) {
            return { warning: rule.message };
          } else if (!rule.severity || rule.severity === 'error') {
            return { error: rule.message };
          }
        }
      }
    }

    return {};
  }, [schema]);

  const sanitizeFieldValue = useCallback(<K extends keyof T>(
    field: K,
    value: T[K]
  ): T[K] => {
    const config = schema[field];
    if (!config) return value;

    let sanitized = value;

    // Apply sanitization
    if (config.sanitize) {
      sanitized = sanitizeInput(value, config.sanitize.type, config.sanitize.options);
    }

    // Apply transformation
    if (config.transform) {
      sanitized = config.transform(sanitized);
    }

    return sanitized;
  }, [schema]);

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setState(prev => {
      const sanitizedValue = sanitizeFieldValue(field, value);
      const newValues = { ...prev.values, [field]: sanitizedValue };
      
      const newErrors = { ...prev.errors };
      const newWarnings = { ...prev.warnings };

      // Validate if real-time validation is enabled or field is configured to validate on change
      const config = schema[field];
      const shouldValidate = realTimeValidation || 
        (config?.validateOnChange ?? validateOnChange) ||
        prev.touched[field];

      if (shouldValidate) {
        const validation = validateFieldValue(field, sanitizedValue, true);
        if (validation.error) {
          newErrors[field] = validation.error;
          delete newWarnings[field];
        } else if (validation.warning) {
          newWarnings[field] = validation.warning;
          delete newErrors[field];
        } else {
          delete newErrors[field];
          delete newWarnings[field];
        }
      }

      const isValid = Object.keys(newErrors).length === 0;
      const isDirty = Object.keys(newValues).some(key => 
        newValues[key as keyof T] !== initialValues[key as keyof T]
      );

      return {
        ...prev,
        values: newValues,
        errors: newErrors,
        warnings: newWarnings,
        isValid,
        isDirty
      };
    });
  }, [sanitizeFieldValue, validateFieldValue, schema, realTimeValidation, validateOnChange, initialValues]);

  const setValues = useCallback((values: Partial<T>) => {
    Object.entries(values).forEach(([field, value]) => {
      setValue(field as keyof T, value);
    });
  }, [setValue]);

  const touch = useCallback(<K extends keyof T>(field: K) => {
    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: true }
    }));
  }, []);

  const touchAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      touched: Object.keys(prev.values).reduce(
        (acc, key) => ({ ...acc, [key]: true }), 
        {}
      ) as Partial<Record<keyof T, boolean>>
    }));
  }, []);

  const validateField = useCallback(<K extends keyof T>(field: K) => {
    const value = state.values[field];
    const validation = validateFieldValue(field, value, true);
    
    setState(prev => {
      const newErrors = { ...prev.errors };
      const newWarnings = { ...prev.warnings };
      
      if (validation.error) {
        newErrors[field] = validation.error;
        delete newWarnings[field];
      } else if (validation.warning) {
        newWarnings[field] = validation.warning;
        delete newErrors[field];
      } else {
        delete newErrors[field];
        delete newWarnings[field];
      }

      return {
        ...prev,
        errors: newErrors,
        warnings: newWarnings,
        touched: { ...prev.touched, [field]: true },
        isValid: Object.keys(newErrors).length === 0
      };
    });

    return !validation.error;
  }, [state.values, validateFieldValue]);

  const validateAll = useCallback(() => {
    let hasErrors = false;
    const newErrors: Partial<Record<keyof T, string>> = {};
    const newWarnings: Partial<Record<keyof T, string>> = {};
    const newTouched: Partial<Record<keyof T, boolean>> = {};

    // Validate each field
    Object.keys(state.values).forEach(key => {
      const field = key as keyof T;
      const value = state.values[field];
      const validation = validateFieldValue(field, value, true);
      
      newTouched[field] = true;
      
      if (validation.error) {
        newErrors[field] = validation.error;
        hasErrors = true;
      } else if (validation.warning) {
        newWarnings[field] = validation.warning;
      }
    });

    // Run form-level validation
    if (formValidator && !hasErrors) {
      const formErrors = formValidator(state.values);
      Object.entries(formErrors).forEach(([field, error]) => {
        newErrors[field as keyof T] = error;
        hasErrors = true;
      });
    }

    setState(prev => ({
      ...prev,
      errors: newErrors,
      warnings: newWarnings,
      touched: newTouched,
      isValid: !hasErrors
    }));

    return !hasErrors;
  }, [state.values, validateFieldValue, formValidator]);

  const reset = useCallback(() => {
    setState({
      values: { ...initialValues },
      errors: {},
      warnings: {},
      touched: {},
      isValid: true,
      isDirty: false
    });
  }, [initialValues]);

  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
      warnings: {},
      isValid: true
    }));
  }, []);

  const clearFieldError = useCallback(<K extends keyof T>(field: K) => {
    setState(prev => {
      const newErrors = { ...prev.errors };
      const newWarnings = { ...prev.warnings };
      delete newErrors[field];
      delete newWarnings[field];
      
      return {
        ...prev,
        errors: newErrors,
        warnings: newWarnings,
        isValid: Object.keys(newErrors).length === 0
      };
    });
  }, []);

  const getSanitizedValues = useCallback(() => {
    const sanitized = {} as T;
    Object.keys(state.values).forEach(key => {
      const field = key as keyof T;
      sanitized[field] = sanitizeFieldValue(field, state.values[field]);
    });
    return sanitized;
  }, [state.values, sanitizeFieldValue]);

  const handleFieldChange = useCallback(<K extends keyof T>(field: K) => {
    return (value: T[K]) => {
      setValue(field, value);
    };
  }, [setValue]);

  const handleFieldBlur = useCallback(<K extends keyof T>(field: K) => {
    return () => {
      touch(field);
      const config = schema[field];
      if (config?.validateOnBlur ?? validateOnBlur) {
        validateField(field);
      }
    };
  }, [touch, validateField, schema, validateOnBlur]);

  // Utility functions
  const getValue = useCallback(<K extends keyof T>(field: K) => state.values[field], [state.values]);
  const getError = useCallback(<K extends keyof T>(field: K) => state.errors[field], [state.errors]);
  const getWarning = useCallback(<K extends keyof T>(field: K) => state.warnings[field], [state.warnings]);
  const isTouched = useCallback(<K extends keyof T>(field: K) => !!state.touched[field], [state.touched]);
  const isFieldValid = useCallback(<K extends keyof T>(field: K) => !state.errors[field], [state.errors]);

  return {
    state,
    setValue,
    setValues,
    getValue,
    getError,
    getWarning,
    isTouched,
    isFieldValid,
    touch,
    touchAll,
    validateField,
    validateAll,
    reset,
    clearErrors,
    clearFieldError,
    getSanitizedValues,
    handleFieldChange,
    handleFieldBlur
  };
};