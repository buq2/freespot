import React, { useState } from 'react';
import {
  Grid,
  TextField,
  Typography,
  Paper,
  Box,
  InputAdornment,
  Switch,
  FormControlLabel,
  IconButton,
  Collapse,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAppContext } from '../../contexts/AppContext';

export const CommonParametersForm: React.FC = () => {
  const { commonParameters, setCommonParameters } = useAppContext();
  const [expanded, setExpanded] = useState(true);

  const handleLocationChange = (field: 'lat' | 'lon') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || 0;
    setCommonParameters({
      ...commonParameters,
      landingZone: {
        ...commonParameters.landingZone,
        [field]: value
      }
    });
  };

  const handleFlightDirectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCommonParameters({
      ...commonParameters,
      flightDirection: value === '' ? undefined : Math.round(parseFloat(value) * 10) / 10
    });
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setCommonParameters({
        ...commonParameters,
        jumpTime: date
      });
    }
  };

  const handleFlightOverLandingZoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCommonParameters({
      ...commonParameters,
      flightOverLandingZone: event.target.checked
    });
  };

  const handleParameterChange = (field: keyof typeof commonParameters) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || 0;
    setCommonParameters({
      ...commonParameters,
      [field]: value
    });
  };

  return (
    <Paper elevation={2} sx={{ mb: 3 }}>
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">
              Common Parameters
            </Typography>
            <Typography variant="body2" color="textSecondary">
              These parameters are shared across all profiles
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {/* Collapsible Content */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
        {/* Landing Zone */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Landing Zone
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Latitude"
            value={commonParameters.landingZone.lat}
            onChange={handleLocationChange('lat')}
            type="number"
            inputProps={{ step: '0.0001' }}
            InputProps={{
              endAdornment: <InputAdornment position="end">°</InputAdornment>
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="Longitude"
            value={commonParameters.landingZone.lon}
            onChange={handleLocationChange('lon')}
            type="number"
            inputProps={{ step: '0.0001' }}
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
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
};