import { useState, useCallback } from 'react';

/**
 * Custom hook for form field management with validation
 */
export const useFormField = <T>(
  initialValue: T,
  validator?: (value: T) => string | null
) => {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleChange = useCallback((newValue: T) => {
    setValue(newValue);
    if (touched && validator) {
      const validationError = validator(newValue);
      setError(validationError);
    }
  }, [validator, touched]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (validator) {
      const validationError = validator(value);
      setError(validationError);
    }
  }, [validator, value]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
    setTouched(false);
  }, [initialValue]);

  return {
    value,
    error,
    touched,
    isValid: !error,
    handleChange,
    handleBlur,
    reset,
  };
};