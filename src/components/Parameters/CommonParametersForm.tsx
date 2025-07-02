import React from 'react';
import {
  Grid,
  TextField,
  Typography,
  Box,
  InputAdornment,
  Switch,
  FormControlLabel,
  IconButton,
  Stack,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import { Add, Remove, Schedule } from '@mui/icons-material';
import { CollapsibleSection } from '../Common/CollapsibleSection';
import { CoordinateField } from '../Common/FormFields';
import { AdvancedOption } from '../Common';
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

  // Time control handlers
  const handleTimeIncrement = () => {
    const newTime = new Date(commonParameters.jumpTime);
    newTime.setHours(newTime.getHours() + 1);
    updateCommonParameter('jumpTime', newTime);
  };

  const handleTimeDecrement = () => {
    const newTime = new Date(commonParameters.jumpTime);
    newTime.setHours(newTime.getHours() - 1);
    updateCommonParameter('jumpTime', newTime);
  };

  const handleSetToNow = () => {
    const now = new Date();
    // Round to nearest hour
    const roundedTime = new Date(now);
    roundedTime.setMinutes(0, 0, 0); // Set minutes, seconds, milliseconds to 0
    if (now.getMinutes() >= 30) {
      roundedTime.setHours(roundedTime.getHours() + 1); // Round up if past 30 minutes
    }
    updateCommonParameter('jumpTime', roundedTime);
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
        {/* Time & Date Card */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Time & Date
              </Typography>
              <Grid container spacing={2}>
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

                {/* Time Control Buttons */}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'center' }}>
                      <Tooltip title="Subtract 1 hour">
                        <IconButton 
                          onClick={handleTimeDecrement}
                          size="small"
                          color="primary"
                          sx={{ 
                            border: 1, 
                            borderColor: 'primary.main',
                            '&:hover': { 
                              backgroundColor: 'primary.main', 
                              color: 'white' 
                            }
                          }}
                        >
                          <Remove />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Set to current time (rounded to nearest hour)">
                        <IconButton 
                          onClick={handleSetToNow}
                          size="small"
                          color="primary"
                          sx={{ 
                            border: 1, 
                            borderColor: 'primary.main',
                            backgroundColor: 'primary.main',
                            color: 'white',
                            '&:hover': { 
                              backgroundColor: 'primary.dark' 
                            }
                          }}
                        >
                          <Schedule />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Add 1 hour">
                        <IconButton 
                          onClick={handleTimeIncrement}
                          size="small"
                          color="primary"
                          sx={{ 
                            border: 1, 
                            borderColor: 'primary.main',
                            '&:hover': { 
                              backgroundColor: 'primary.main', 
                              color: 'white' 
                            }
                          }}
                        >
                          <Add />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Location Card */}
        <AdvancedOption>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Location
                </Typography>
                <Grid container spacing={2}>
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
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </AdvancedOption>

        {/* Flight Planning Card */}
        <AdvancedOption>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Flight Planning
                </Typography>
                <Grid container spacing={2}>
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
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </AdvancedOption>

        {/* Jump Groups Card */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Jump Groups
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Number of Groups"
                    value={commonParameters.numberOfGroups}
                    onChange={handleParameterChange('numberOfGroups')}
                    type="number"
                    InputProps={{
                      min: 1, max: 10,
                      endAdornment: <InputAdornment position="end"></InputAdornment>
                    }}
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
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </CollapsibleSection>
  );
};