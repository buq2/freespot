import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Box,
  InputAdornment,
  Switch,
  FormControlLabel
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAppContext } from '../../contexts/AppContext';
import { convertSpeed, convertAltitude } from '../../utils/units';

export const JumpParametersForm: React.FC = () => {
  const { jumpParameters, setJumpParameters, userPreferences } = useAppContext();

  const handleNumberChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || 0;
    setJumpParameters({
      ...jumpParameters,
      [field]: value
    });
  };

  const handleLocationChange = (field: 'lat' | 'lon') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || 0;
    setJumpParameters({
      ...jumpParameters,
      landingZone: {
        ...jumpParameters.landingZone,
        [field]: value
      }
    });
  };

  const handleFlightDirectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setJumpParameters({
      ...jumpParameters,
      flightDirection: value === '' ? undefined : parseFloat(value)
    });
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setJumpParameters({
        ...jumpParameters,
        jumpTime: date
      });
    }
  };

  // Convert values for display
  const displayJumpAltitude = convertAltitude(jumpParameters.jumpAltitude, 'meters', userPreferences.units.altitude);
  const displayOpeningAltitude = convertAltitude(jumpParameters.openingAltitude, 'meters', userPreferences.units.altitude);
  const displayAircraftSpeed = convertSpeed(jumpParameters.aircraftSpeed, 'ms', userPreferences.units.speed);
  const displayFreefallSpeed = convertSpeed(jumpParameters.freefallSpeed, 'ms', userPreferences.units.speed);
  const displayCanopyAirSpeed = convertSpeed(jumpParameters.canopyAirSpeed, 'ms', userPreferences.units.speed);
  const displayCanopyDescentRate = convertSpeed(jumpParameters.canopyDescentRate, 'ms', userPreferences.units.speed);

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Jump Parameters
      </Typography>

      <Grid container spacing={3}>
        {/* Altitudes */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Altitudes
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Jump Altitude"
            value={displayJumpAltitude.toFixed(0)}
            onChange={(e) => {
              const displayValue = parseFloat(e.target.value) || 0;
              const metersValue = convertAltitude(displayValue, userPreferences.units.altitude, 'meters');
              setJumpParameters({
                ...jumpParameters,
                jumpAltitude: metersValue
              });
            }}
            InputProps={{
              endAdornment: <InputAdornment position="end">
                {userPreferences.units.altitude === 'meters' ? 'm' : 'ft'}
              </InputAdornment>
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Opening Altitude"
            value={displayOpeningAltitude.toFixed(0)}
            onChange={(e) => {
              const displayValue = parseFloat(e.target.value) || 0;
              const metersValue = convertAltitude(displayValue, userPreferences.units.altitude, 'meters');
              setJumpParameters({
                ...jumpParameters,
                openingAltitude: metersValue
              });
            }}
            InputProps={{
              endAdornment: <InputAdornment position="end">
                {userPreferences.units.altitude === 'meters' ? 'm' : 'ft'}
              </InputAdornment>
            }}
          />
        </Grid>

        {/* Speeds */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Speeds
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Aircraft Speed"
            value={displayAircraftSpeed.toFixed(1)}
            onChange={(e) => {
              const displayValue = parseFloat(e.target.value) || 0;
              const msValue = convertSpeed(displayValue, userPreferences.units.speed, 'ms');
              setJumpParameters({
                ...jumpParameters,
                aircraftSpeed: msValue
              });
            }}
            InputProps={{
              endAdornment: <InputAdornment position="end">
                {userPreferences.units.speed === 'ms' ? 'm/s' : 
                 userPreferences.units.speed === 'kmh' ? 'km/h' :
                 userPreferences.units.speed === 'mph' ? 'mph' : 'kts'}
              </InputAdornment>
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Freefall Speed"
            value={displayFreefallSpeed.toFixed(1)}
            onChange={(e) => {
              const displayValue = parseFloat(e.target.value) || 0;
              const msValue = convertSpeed(displayValue, userPreferences.units.speed, 'ms');
              setJumpParameters({
                ...jumpParameters,
                freefallSpeed: msValue
              });
            }}
            InputProps={{
              endAdornment: <InputAdornment position="end">
                {userPreferences.units.speed === 'ms' ? 'm/s' : 
                 userPreferences.units.speed === 'kmh' ? 'km/h' :
                 userPreferences.units.speed === 'mph' ? 'mph' : 'kts'}
              </InputAdornment>
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Canopy Air Speed"
            value={displayCanopyAirSpeed.toFixed(1)}
            onChange={(e) => {
              const displayValue = parseFloat(e.target.value) || 0;
              const msValue = convertSpeed(displayValue, userPreferences.units.speed, 'ms');
              setJumpParameters({
                ...jumpParameters,
                canopyAirSpeed: msValue
              });
            }}
            InputProps={{
              endAdornment: <InputAdornment position="end">
                {userPreferences.units.speed === 'ms' ? 'm/s' : 
                 userPreferences.units.speed === 'kmh' ? 'km/h' :
                 userPreferences.units.speed === 'mph' ? 'mph' : 'kts'}
              </InputAdornment>
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Canopy Descent Rate"
            value={displayCanopyDescentRate.toFixed(1)}
            onChange={(e) => {
              const displayValue = parseFloat(e.target.value) || 0;
              const msValue = convertSpeed(displayValue, userPreferences.units.speed, 'ms');
              setJumpParameters({
                ...jumpParameters,
                canopyDescentRate: msValue
              });
            }}
            InputProps={{
              endAdornment: <InputAdornment position="end">
                {userPreferences.units.speed === 'ms' ? 'm/s' : 
                 userPreferences.units.speed === 'kmh' ? 'km/h' :
                 userPreferences.units.speed === 'mph' ? 'mph' : 'kts'}
              </InputAdornment>
            }}
          />
        </Grid>

        {/* Canopy Performance */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Canopy Performance
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Glide Ratio"
            value={jumpParameters.glideRatio}
            onChange={handleNumberChange('glideRatio')}
            type="number"
            step="0.1"
            InputProps={{
              endAdornment: <InputAdornment position="end">:1</InputAdornment>
            }}
          />
        </Grid>

        {/* Groups */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Jump Groups
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Number of Groups"
            value={jumpParameters.numberOfGroups}
            onChange={handleNumberChange('numberOfGroups')}
            type="number"
            inputProps={{ min: 1, max: 10 }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Time Between Groups"
            value={jumpParameters.timeBetweenGroups}
            onChange={handleNumberChange('timeBetweenGroups')}
            type="number"
            InputProps={{
              endAdornment: <InputAdornment position="end">sec</InputAdornment>
            }}
          />
        </Grid>

        {/* Landing Zone */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Landing Zone
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Latitude"
            value={jumpParameters.landingZone.lat}
            onChange={handleLocationChange('lat')}
            type="number"
            step="0.0001"
            InputProps={{
              endAdornment: <InputAdornment position="end">°</InputAdornment>
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Longitude"
            value={jumpParameters.landingZone.lon}
            onChange={handleLocationChange('lon')}
            type="number"
            step="0.0001"
            InputProps={{
              endAdornment: <InputAdornment position="end">°</InputAdornment>
            }}
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
            label="Flight Direction"
            value={jumpParameters.flightDirection ?? ''}
            onChange={handleFlightDirectionChange}
            placeholder="Auto (headwind)"
            InputProps={{
              endAdornment: <InputAdornment position="end">°</InputAdornment>
            }}
            helperText="Leave empty for automatic headwind direction"
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
              value={jumpParameters.jumpTime}
              onChange={handleDateChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>
    </Paper>
  );
};