import React from 'react';
import { TextField, InputAdornment } from '@mui/material';

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
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseFloat(event.target.value);
    
    // Handle empty input
    if (isNaN(newValue)) {
      newValue = 0;
    }
    
    // Apply coordinate-specific constraints
    if (coordinateType === 'latitude') {
      newValue = Math.max(-90, Math.min(90, newValue));
    } else if (coordinateType === 'longitude') {
      newValue = Math.max(-180, Math.min(180, newValue));
    }
    
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
      value={value.toFixed(4)}
      onChange={handleChange}
      type="number"
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