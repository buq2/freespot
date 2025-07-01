// Export all custom hooks for centralized access
export { useResponsive } from './useResponsive';

// Form handling hooks
export { 
  useFormField, 
  validators,
  type UseFormFieldOptions,
  type UseFormFieldReturn,
  type ValidationRule,
  type Validator
} from './useFormField';

export {
  useFormValidation,
  type FieldConfig,
  type FormSchema,
  type FormValidationState,
  type UseFormValidationReturn
} from './useFormValidation';

// Async operation hooks
export {
  useAsyncOperation,
  useWeatherOperation,
  useCalculationOperation,
  useAsyncOperations,
  type AsyncOperationState,
  type UseAsyncOperationOptions,
  type UseAsyncOperationReturn
} from './useAsyncOperation';

// Application-specific hooks
export { 
  useWeatherCalculations,
  type WeatherCalculationResult,
  type UseWeatherCalculationsReturn
} from './useWeatherCalculations';

export { 
  useExitPointCalculations,
  type MultiProfileResult,
  type UseExitPointCalculationsReturn
} from './useExitPointCalculations';