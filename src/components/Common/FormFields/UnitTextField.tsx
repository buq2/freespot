import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { convertSpeed, convertAltitude } from '../../../utils/units';
import { usePreferencesContext } from '../../../contexts/PreferencesContext';
import type { Units } from '../../../types';

interface UnitTextFieldProps extends Omit<React.ComponentProps<typeof TextField>, 'value' | 'onChange'> {
  /** The numeric value in base units (meters for altitude, m/s for speed) */
  value: number;
  /** Called when the value changes, receives the value in base units */
  onChange: (value: number) => void;
  /** The type of unit conversion to apply */
  unitType: 'altitude' | 'speed';
  /** Optional override for the unit display */
  unitOverride?: string;
  /** Number of decimal places to show */
  decimals?: number;
}

/**
 * A TextField component that handles unit conversion automatically based on user preferences.
 * Displays values in the user's preferred units but returns values in base units.
 * 
 * @example
 * ```tsx
 * <UnitTextField
 *   label="Jump Altitude"
 *   value={4000} // meters
 *   onChange={(meters) => setAltitude(meters)}
 *   unitType="altitude"
 *   helperText="Altitude for exit"
 * />
 * ```
 */
export const UnitTextField: React.FC<UnitTextFieldProps> = ({
  value,
  onChange,
  unitType,
  unitOverride,
  decimals = 1,
  ...textFieldProps
}) => {
  const { userPreferences } = usePreferencesContext();
  
  // Convert value from base units to display units
  const getDisplayValue = (): number => {
    if (unitType === 'altitude') {
      return convertAltitude(value, 'meters', userPreferences.units.altitude);
    } else if (unitType === 'speed') {
      return convertSpeed(value, 'ms', userPreferences.units.speed);
    }
    return value;
  };

  // Get the appropriate unit label
  const getUnitLabel = (): string => {
    if (unitOverride) return unitOverride;
    
    if (unitType === 'altitude') {
      return userPreferences.units.altitude === 'meters' ? 'm' : 'ft';
    } else if (unitType === 'speed') {
      const speedUnit = userPreferences.units.speed;
      switch (speedUnit) {
        case 'ms': return 'm/s';
        case 'kmh': return 'km/h';
        case 'mph': return 'mph';
        case 'knots': return 'kts';
        default: return 'm/s';
      }
    }
    return '';
  };

  // Handle input change and convert back to base units
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const displayValue = parseFloat(event.target.value) || 0;
    
    let baseValue: number;
    if (unitType === 'altitude') {
      baseValue = convertAltitude(displayValue, userPreferences.units.altitude, 'meters');
    } else if (unitType === 'speed') {
      baseValue = convertSpeed(displayValue, userPreferences.units.speed, 'ms');
    } else {
      baseValue = displayValue;
    }
    
    onChange(baseValue);
  };

  return (
    <TextField
      {...textFieldProps}
      value={getDisplayValue().toFixed(decimals)}
      onChange={handleChange}
      type="number"
      InputProps={{
        endAdornment: <InputAdornment position="end">{getUnitLabel()}</InputAdornment>,
        ...textFieldProps.InputProps,
      }}
    />
  );
};