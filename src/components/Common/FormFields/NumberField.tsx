import React from 'react';
import { TextField, InputAdornment } from '@mui/material';

interface NumberFieldProps extends Omit<React.ComponentProps<typeof TextField>, 'value' | 'onChange' | 'type'> {
  /** The numeric value */
  value: number;
  /** Called when the value changes */
  onChange: (value: number) => void;
  /** Unit label to display at the end */
  unit?: string;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step value for increment/decrement */
  step?: number;
  /** Number of decimal places to show */
  decimals?: number;
}

/**
 * A specialized TextField for numeric input with optional unit display and validation.
 * Handles conversion between string and number automatically.
 * 
 * @example
 * ```tsx
 * <NumberField
 *   label="Glide Ratio"
 *   value={2.5}
 *   onChange={(value) => setGlideRatio(value)}
 *   unit=":1"
 *   min={0}
 *   step={0.1}
 *   decimals={1}
 * />
 * ```
 */
export const NumberField: React.FC<NumberFieldProps> = ({
  value,
  onChange,
  unit,
  min,
  max,
  step = 1,
  decimals = 0,
  ...textFieldProps
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseFloat(event.target.value);
    
    // Handle empty input
    if (isNaN(newValue)) {
      newValue = 0;
    }
    
    // Apply constraints
    if (min !== undefined && newValue < min) {
      newValue = min;
    }
    if (max !== undefined && newValue > max) {
      newValue = max;
    }
    
    onChange(newValue);
  };

  return (
    <TextField
      {...textFieldProps}
      value={decimals > 0 ? value.toFixed(decimals) : value.toString()}
      onChange={handleChange}
      type="number"
      inputProps={{
        min,
        max,
        step,
        ...textFieldProps.inputProps,
      }}
      InputProps={{
        endAdornment: unit ? <InputAdornment position="end">{unit}</InputAdornment> : undefined,
        ...textFieldProps.InputProps,
      }}
    />
  );
};