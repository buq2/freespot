import { useState, useCallback, useRef } from 'react';
import { handleError, ErrorType, type AppError } from '../utils/errorHandling';

export interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  lastUpdated: Date | null;
}

export interface UseAsyncOperationOptions {
  /** Initial loading state */
  initialLoading?: boolean;
  /** Error type to use for normalizing errors */
  errorType?: ErrorType;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether to retry on failure */
  retryOnFailure?: boolean;
  /** Number of retry attempts */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
}

export interface UseAsyncOperationReturn<T> {
  /** Current operation state */
  state: AsyncOperationState<T>;
  /** Execute the async operation */
  execute: (operation: () => Promise<T>) => Promise<T | null>;
  /** Reset the state */
  reset: () => void;
  /** Clear error */
  clearError: () => void;
  /** Whether operation is currently running */
  isLoading: boolean;
  /** Current data */
  data: T | null;
  /** Current error */
  error: AppError | null;
  /** Retry the last operation */
  retry: () => Promise<T | null>;
}

/**
 * Custom hook for managing async operations with loading states, error handling, and retry logic.
 * 
 * Provides a standardized way to handle async operations throughout the application
 * with consistent loading states, error handling, and optional retry functionality.
 * 
 * @example
 * ```typescript
 * const weatherOperation = useAsyncOperation<WeatherData>({
 *   errorType: ErrorType.WEATHER_API_ERROR,
 *   retryOnFailure: true,
 *   maxRetries: 3
 * });
 * 
 * const fetchWeather = async () => {
 *   const result = await weatherOperation.execute(async () => {
 *     return await weatherService.fetchData(location);
 *   });
 *   
 *   if (result) {
 *     console.log('Weather data:', result);
 *   }
 * };
 * ```
 */
export const useAsyncOperation = <T>(
  options: UseAsyncOperationOptions = {}
): UseAsyncOperationReturn<T> => {
  const {
    initialLoading = false,
    errorType = ErrorType.UNKNOWN_ERROR,
    timeout,
    retryOnFailure = false,
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: initialLoading,
    error: null,
    lastUpdated: null
  });

  const currentOperationRef = useRef<(() => Promise<T>) | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null
    });
    retryCountRef.current = 0;
    
    // Abort any ongoing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const executeWithRetry = useCallback(async (
    operation: () => Promise<T>,
    attemptNumber: number = 0
  ): Promise<T | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Create abort controller for this operation
      abortControllerRef.current = new AbortController();
      
      let result: T;
      
      if (timeout) {
        // Add timeout support
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), timeout);
        });
        
        result = await Promise.race([
          operation(),
          timeoutPromise
        ]);
      } else {
        result = await operation();
      }

      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }));

      retryCountRef.current = 0;
      return result;

    } catch (error) {
      const appError = handleError(error, { attemptNumber }, errorType);
      
      // Check if we should retry
      if (retryOnFailure && attemptNumber < maxRetries && appError.recoverable) {
        retryCountRef.current = attemptNumber + 1;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attemptNumber + 1)));
        
        return executeWithRetry(operation, attemptNumber + 1);
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: appError,
        lastUpdated: new Date()
      }));

      return null;
    }
  }, [timeout, retryOnFailure, maxRetries, retryDelay, errorType]);

  const execute = useCallback(async (operation: () => Promise<T>) => {
    currentOperationRef.current = operation;
    retryCountRef.current = 0;
    return executeWithRetry(operation);
  }, [executeWithRetry]);

  const retry = useCallback(async () => {
    if (currentOperationRef.current) {
      return execute(currentOperationRef.current);
    }
    return null;
  }, [execute]);

  return {
    state,
    execute,
    reset,
    clearError,
    retry,
    isLoading: state.loading,
    data: state.data,
    error: state.error
  };
};

/**
 * Specialized hook for weather operations
 */
export const useWeatherOperation = () => {
  return useAsyncOperation({
    errorType: ErrorType.WEATHER_API_ERROR,
    retryOnFailure: true,
    maxRetries: 3,
    retryDelay: 2000,
    timeout: 30000 // 30 seconds
  });
};

/**
 * Specialized hook for calculation operations
 */
export const useCalculationOperation = () => {
  return useAsyncOperation({
    errorType: ErrorType.CALCULATION_ERROR,
    retryOnFailure: false,
    timeout: 10000 // 10 seconds
  });
};

/**
 * Hook for managing multiple related async operations
 */
export const useAsyncOperations = <T extends Record<string, any>>(
  keys: (keyof T)[],
  options: UseAsyncOperationOptions = {}
) => {
  const operations = keys.reduce((acc, key) => {
    acc[key] = useAsyncOperation(options);
    return acc;
  }, {} as Record<keyof T, UseAsyncOperationReturn<T[keyof T]>>);

  const isAnyLoading = Object.values(operations).some(op => op.isLoading);
  const hasAnyError = Object.values(operations).some(op => op.error);
  const allErrors = Object.values(operations)
    .map(op => op.error)
    .filter(Boolean) as AppError[];

  const resetAll = useCallback(() => {
    Object.values(operations).forEach(op => op.reset());
  }, [operations]);

  const clearAllErrors = useCallback(() => {
    Object.values(operations).forEach(op => op.clearError());
  }, [operations]);

  return {
    operations,
    isAnyLoading,
    hasAnyError,
    allErrors,
    resetAll,
    clearAllErrors
  };
};