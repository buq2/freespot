import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Switch,
  FormControlLabel,
  InputAdornment,
  Divider,
} from '@mui/material';
import { CollapsibleSection } from '../Common/CollapsibleSection';
import { useAppContext } from '../../contexts/AppContext';
import { useResponsive } from '../../hooks/useResponsive';
import type { Units } from '../../types';

export const UserPreferencesForm: React.FC = () => {
  const { userPreferences, setUserPreferences } = useAppContext();
  const responsive = useResponsive();

  const handleUnitsChange = (unitType: keyof Units) => (event: React.ChangeEvent<{ value: unknown }>) => {
    setUserPreferences({
      ...userPreferences,
      units: {
        ...userPreferences.units,
        [unitType]: event.target.value
      }
    });
  };

  const handleWindLimitChange = (field: 'studentWindLimit' | 'sportWindLimit') => 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(event.target.value) || 0;
      setUserPreferences({
        ...userPreferences,
        [field]: value
      });
    };


  return (
    <CollapsibleSection
      title="User Preferences"
      subtitle="Units, wind limits, and display preferences"
      defaultExpanded={false}
    >
      <Grid container spacing={responsive.spacing.gap}>
        {/* Units */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Units
          </Typography>
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Altitude</InputLabel>
            <Select
              value={userPreferences.units.altitude}
              label="Altitude"
              onChange={handleUnitsChange('altitude')}
            >
              <MenuItem value="meters">Meters</MenuItem>
              <MenuItem value="feet">Feet</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Speed</InputLabel>
            <Select
              value={userPreferences.units.speed}
              label="Speed"
              onChange={handleUnitsChange('speed')}
            >
              <MenuItem value="ms">m/s</MenuItem>
              <MenuItem value="kmh">km/h</MenuItem>
              <MenuItem value="mph">mph</MenuItem>
              <MenuItem value="knots">knots</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Temperature</InputLabel>
            <Select
              value={userPreferences.units.temperature}
              label="Temperature"
              onChange={handleUnitsChange('temperature')}
            >
              <MenuItem value="celsius">Celsius</MenuItem>
              <MenuItem value="fahrenheit">Fahrenheit</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>

        {/* Wind Limits */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Wind Warning Limits
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Student Wind Limit"
            value={userPreferences.studentWindLimit}
            onChange={handleWindLimitChange('studentWindLimit')}
            type="number"
            step="0.5"
            InputProps={{
              endAdornment: <InputAdornment position="end">m/s</InputAdornment>
            }}
            helperText="Wind speed warning for student skydivers"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Sport Wind Limit"
            value={userPreferences.sportWindLimit}
            onChange={handleWindLimitChange('sportWindLimit')}
            type="number"
            step="0.5"
            InputProps={{
              endAdornment: <InputAdornment position="end">m/s</InputAdornment>
            }}
            helperText="Wind speed warning for sport skydivers"
          />
        </Grid>


      </Grid>
    </CollapsibleSection>
  );
};