import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material';
import { CollapsibleSection } from '../Common/CollapsibleSection';
import { usePreferencesContext } from '../../contexts/PreferencesContext';
import type { Units } from '../../types';

export const UserPreferencesForm: React.FC = () => {
  const { userPreferences, updatePreference, updateUnits } = usePreferencesContext();

  const handleUnitsChange = (unitType: keyof Units) => (event: React.ChangeEvent<HTMLInputElement>) => {
    updateUnits({ [unitType]: event.target.value as Units[typeof unitType] });
  };

  const handleWindLimitChange = (field: 'studentWindLimit' | 'sportWindLimit') => 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(event.target.value) || 0;
      updatePreference(field, value);
    };


  return (
    <CollapsibleSection
      title="User Preferences"
      subtitle="Units, wind limits, and display preferences"
      defaultExpanded={false}
    >
      <Grid container spacing={3}>
        {/* Units Card */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Units
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
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

                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
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

                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
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
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Wind Warning Limits Card */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Wind Warning Limits
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Student Wind Limit"
                    value={userPreferences.studentWindLimit}
                    onChange={handleWindLimitChange('studentWindLimit')}
                    type="number"
                    inputProps={{ step: "0.5" }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">m/s</InputAdornment>
                    }}
                    helperText="Wind speed warning for student skydivers"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Sport Wind Limit"
                    value={userPreferences.sportWindLimit}
                    onChange={handleWindLimitChange('sportWindLimit')}
                    type="number"
                    inputProps={{ step: "0.5" }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">m/s</InputAdornment>
                    }}
                    helperText="Wind speed warning for sport skydivers"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </CollapsibleSection>
  );
};