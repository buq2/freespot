import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { useFormField, validators } from '../../../hooks/useFormField';

interface CoordinateFieldProps extends Omit<React.ComponentProps<typeof TextField>, 'value' | 'onChange' | 'type'> {
  /** The coordinate value */
  value: number;
  /** Called when the coordinate changes */
  onChange: (value: number) => void;
  /** Type of coordinate for validation */
  coordinateType: 'latitude' | 'longitude';
}

/**
 * A specialized TextField for latitude/longitude coordinate input with validation.
 * Provides appropriate constraints and formatting for geographic coordinates.
 * 
 * @example
 * ```tsx
 * <CoordinateField
 *   label="Latitude"
 *   value={61.7807}
 *   onChange={(lat) => setLatitude(lat)}
 *   coordinateType="latitude"
 * />
 * ```
 */
export const CoordinateField: React.FC<CoordinateFieldProps> = ({
  value,
  onChange,
  coordinateType,
  ...textFieldProps
}) => {
  // Use the enhanced useFormField hook with coordinate validation
  const field = useFormField({
    initialValue: value,
    validator: coordinateType === 'latitude' ? validators.latitude : validators.longitude,
    validateOnBlur: true,
    transform: (val: number) => {
      // Ensure the value is a valid number and round to 4 decimal places
      const num = isNaN(val) ? 0 : val;
      return Math.round(num * 10000) / 10000;
    }
  });

  // Sync external value changes with field state
  React.useEffect(() => {
    if (value !== field.value) {
      field.setValue(value);
    }
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value) || 0;
    field.handleChange(newValue);
    onChange(newValue);
  };

  const getConstraints = () => {
    if (coordinateType === 'latitude') {
      return { min: -90, max: 90, step: 0.0001 };
    } else if (coordinateType === 'longitude') {
      return { min: -180, max: 180, step: 0.0001 };
    }
    return { step: 0.0001 };
  };

  const constraints = getConstraints();

  return (
    <TextField
      {...textFieldProps}
      value={field.value.toFixed(4)}
      onChange={handleChange}
      onBlur={field.handleBlur}
      type="number"
      error={field.touched && !!field.error}
      helperText={field.touched && field.error ? field.error : textFieldProps.helperText}
      inputProps={{
        ...constraints,
        ...textFieldProps.inputProps,
      }}
      InputProps={{
        endAdornment: <InputAdornment position="end">°</InputAdornment>,
        ...textFieldProps.InputProps,
      }}
    />
  );
};