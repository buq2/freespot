import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box,
  InputAdornment,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { CollapsibleSection } from '../Common/CollapsibleSection';
import { CoordinateField } from '../Common/FormFields';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useParametersContext } from '../../contexts/ParametersContext';

export const CommonParametersForm: React.FC = () => {
  const { commonParameters, updateCommonParameter } = useParametersContext();

  const handleLocationChange = (field: 'lat' | 'lon') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || 0;
    updateCommonParameter('landingZone', {
      ...commonParameters.landingZone,
      [field]: value
    });
  };

  const handleFlightDirectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    updateCommonParameter('flightDirection', value === '' ? undefined : Math.round(parseFloat(value) * 10) / 10);
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      updateCommonParameter('jumpTime', date);
    }
  };

  const handleFlightOverLandingZoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateCommonParameter('flightOverLandingZone', event.target.checked);
  };

  const handleParameterChange = (field: keyof typeof commonParameters) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || 0;
    updateCommonParameter(field, value);
  };

  return (
    <CollapsibleSection
      title="Common Parameters"
      subtitle="These parameters are shared across all profiles"
      defaultExpanded={true}
    >
      <Grid container spacing={3}>
        {/* Landing Zone */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Landing Zone
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <CoordinateField
            fullWidth
            size="small"
            label="Latitude"
            value={commonParameters.landingZone.lat}
            onChange={(lat) => updateCommonParameter('landingZone', {
              ...commonParameters.landingZone, lat
            })}
            coordinateType="latitude"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <CoordinateField
            fullWidth
            size="small"
            label="Longitude"
            value={commonParameters.landingZone.lon}
            onChange={(lon) => updateCommonParameter('landingZone', {
              ...commonParameters.landingZone, lon
            })}
            coordinateType="longitude"
          />
        </Grid>

        {/* Flight Direction */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Aircraft Flight Direction
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Flight Direction"
            value={commonParameters.flightDirection !== undefined ? commonParameters.flightDirection.toFixed(1) : ''}
            onChange={handleFlightDirectionChange}
            placeholder="Auto (headwind)"
            InputProps={{
              endAdornment: <InputAdornment position="end">°</InputAdornment>
            }}
            helperText="Leave empty for automatic headwind direction"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={commonParameters.flightOverLandingZone}
                onChange={handleFlightOverLandingZoneChange}
                size="small"
              />
            }
            label="Fly directly over landing zone"
          />
        </Grid>

        {/* Jump Groups */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Jump Groups
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Number of Groups"
            value={commonParameters.numberOfGroups}
            onChange={handleParameterChange('numberOfGroups')}
            type="number"
            inputProps={{ min: 1, max: 10 }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Time Between Groups"
            value={commonParameters.timeBetweenGroups}
            onChange={handleParameterChange('timeBetweenGroups')}
            type="number"
            InputProps={{
              endAdornment: <InputAdornment position="end">sec</InputAdornment>
            }}
          />
        </Grid>

        {/* Jump Time */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Jump Time
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Jump Date & Time"
              value={commonParameters.jumpTime}
              onChange={handleDateChange}
              ampm={false}
              slotProps={{ 
                textField: { fullWidth: true, size: 'small' },
                actionBar: {
                  actions: ['clear', 'today']
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>
    </CollapsibleSection>
  );
};