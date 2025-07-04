import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Button, ButtonGroup, Paper, Typography, FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem, useTheme, useMediaQuery } from '@mui/material';
import { Navigation, Edit, LocationOn, Explore } from '@mui/icons-material';
import { MapView } from './MapView';
import { useAppContext } from '../../contexts';
import { calculateExitPoints } from '../../physics/exit-point';
import { calculateBearing } from '../../physics/geo';
import { fetchWeatherData } from '../../services/weather';
import type { ExitCalculationResult } from '../../physics/exit-point';
import type { ForecastData, JumpProfile } from '../../types';

// Multi-profile calculation result
interface MultiProfileResult {
  profileId: string;
  calculation: ExitCalculationResult;
  groundWind: ForecastData | undefined;
}

interface MapContainerProps {
  multiProfileResults?: MultiProfileResult[];
  profiles?: JumpProfile[];
  primaryWeatherData?: ForecastData[] | null;
  showControls?: boolean;
  // Backward compatibility
  exitCalculation?: ExitCalculationResult | null;
  groundWindData?: ForecastData;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  multiProfileResults = [],
  profiles = [],
  primaryWeatherData,
  showControls = true,
  // Backward compatibility
  exitCalculation,
  groundWindData
}) => {
  const { profiles: contextProfiles, commonParameters, setCommonParameters, updateProfile, customWeatherData } = useAppContext();
  
  // Use props profiles or context profiles
  const activeProfiles = profiles.length > 0 ? profiles : contextProfiles;
  const enabledProfiles = activeProfiles.filter(p => p.enabled);
  const primaryProfile = enabledProfiles[0] || activeProfiles[0];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isSettingLandingZone, setIsSettingLandingZone] = useState(false);
  const [isOptimalDirectionMode, setIsOptimalDirectionMode] = useState(false);
  const [mapLayer, setMapLayer] = useState('osm');

  const handleFlightPathComplete = useCallback((bearing: number) => {
    // Disable optimal direction mode when user manually sets direction
    setIsOptimalDirectionMode(false);
    
    // Update common parameters with the new flight direction
    setCommonParameters({
      ...commonParameters,
      flightDirection: Math.round(bearing * 10) / 10
    });
    
    setIsDrawingMode(false);
  }, [enabledProfiles, updateProfile]);

  const handleUseHeadwind = useCallback(() => {
    setIsOptimalDirectionMode(false);
    
    // Update common parameters to use headwind
    setCommonParameters({
      ...commonParameters,
      flightDirection: undefined
    });
  }, [enabledProfiles, updateProfile]);

  const calculateOptimalDirection = useCallback(async () => {
    try {
      if (!primaryProfile) return;
      
      // Use custom weather data if available, otherwise fetch weather data
      let weatherData = customWeatherData;
      
      if (!weatherData) {
        // Fetch weather data for the current location and time
        const result = await fetchWeatherData(
          commonParameters.landingZone,
          'best_match', // Use best match model
          commonParameters.jumpTime
        );
        weatherData = result.data;
      }
      
      if (!weatherData || weatherData.length === 0) {
        console.warn('No weather data available for optimal flight direction calculation');
        return;
      }
      
      // Calculate optimal direction using the primary profile
      if (primaryProfile && weatherData) {
        try {
          // Combine common and profile parameters
          const fullParameters = {
            ...commonParameters,
            ...primaryProfile.parameters
          };
          
          let optimalDirection: number;
          
          if (commonParameters.flightOverLandingZone) {
            // When flying over landing zone, direction should be from landing zone to optimal exit point
            const exitResult = calculateExitPoints(fullParameters, weatherData);
            optimalDirection = calculateBearing(commonParameters.landingZone, exitResult.optimalExitPoint);
          } else {
            // Normal case: use the standard aircraft heading calculation (headwind)
            const exitResult = calculateExitPoints(fullParameters, weatherData);
            optimalDirection = exitResult.aircraftHeading;
          }
          
          const newFlightDirection = Math.round(optimalDirection * 10) / 10;
          
          // Only update if the value actually changed to prevent infinite loops
          if (commonParameters.flightDirection !== newFlightDirection) {
            setCommonParameters({
              ...commonParameters,
              flightDirection: newFlightDirection
            });
          }
        } catch (error) {
          console.warn(`Failed to calculate optimal direction:`, error);
        }
      }
      
    } catch (error) {
      console.error('Failed to calculate optimal flight direction:', error);
    }
  }, [primaryProfile, commonParameters, setCommonParameters, customWeatherData]);

  const handleToggleOptimalDirection = useCallback(() => {
    if (isOptimalDirectionMode) {
      // Turning off optimal direction mode
      setIsOptimalDirectionMode(false);
    } else {
      // Turning on optimal direction mode
      setIsOptimalDirectionMode(true);
      calculateOptimalDirection();
    }
  }, [isOptimalDirectionMode, calculateOptimalDirection]);

  const handleCancelDrawing = useCallback(() => {
    setIsDrawingMode(false);
  }, []);

  const handleLandingZoneSet = useCallback((lat: number, lon: number) => {
    // Update common parameters with the new landing zone
    setCommonParameters({
      ...commonParameters,
      landingZone: { lat, lon }
    });
    setIsSettingLandingZone(false);
  }, [commonParameters, setCommonParameters]);

  const handleCancelLandingZone = useCallback(() => {
    setIsSettingLandingZone(false);
  }, []);

  // Auto-recalculate optimal direction when parameters change
  // We use useRef to track if we're currently calculating to prevent loops
  const isCalculatingRef = useRef(false);
  
  // Disable optimal direction mode when "Fly directly over landing zone" is off
  useEffect(() => {
    if (isOptimalDirectionMode && !commonParameters.flightOverLandingZone) {
      setIsOptimalDirectionMode(false);
    }
  }, [isOptimalDirectionMode, commonParameters.flightOverLandingZone]);
  
  useEffect(() => {
    if (isOptimalDirectionMode && !isCalculatingRef.current && commonParameters.flightOverLandingZone) {
      isCalculatingRef.current = true;
      calculateOptimalDirection().finally(() => {
        isCalculatingRef.current = false;
      });
    }
  }, [
    isOptimalDirectionMode,
    commonParameters.flightOverLandingZone, // Only depend on the specific property
    customWeatherData
    // Removed calculateOptimalDirection from dependencies
  ]);

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Map controls overlay */}
      {showControls && (
        <Paper 
          elevation={3} 
          sx={{ 
            position: 'absolute', 
            top: 80, // Moved below app bar (65px) with some spacing
            right: 16, 
            zIndex: theme.zIndex.speedDial, // Use proper Material-UI z-index
            p: isMobile ? 1.5 : 2,
            maxWidth: isMobile ? '90vw' : '400px',
            pointerEvents: 'auto'
          }}
        >
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap', 
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <ButtonGroup 
            size={isMobile ? "medium" : "small"} 
            variant="outlined"
            orientation={isMobile ? "vertical" : "horizontal"}
            sx={{ 
              '& .MuiButton-root': {
                minHeight: isMobile ? 48 : 'auto' // Better touch targets on mobile
              }
            }}
          >
            <Button
              startIcon={<Navigation />}
              onClick={handleUseHeadwind}
              variant={commonParameters.flightDirection === undefined && !isOptimalDirectionMode ? 'contained' : 'outlined'}
            >
              Auto Headwind
            </Button>
            <Button
              startIcon={<Explore />}
              onClick={handleToggleOptimalDirection}
              variant={isOptimalDirectionMode ? 'contained' : 'outlined'}
              color={isOptimalDirectionMode ? 'primary' : 'inherit'}
              disabled={isDrawingMode || isSettingLandingZone || !commonParameters.flightOverLandingZone}
              sx={{
                ...(isOptimalDirectionMode && {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  }
                })
              }}
            >
              Optimal Direction
            </Button>
            <Button
              startIcon={<Edit />}
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              variant={isDrawingMode ? 'contained' : 'outlined'}
              color={isDrawingMode ? 'primary' : 'inherit'}
              disabled={isSettingLandingZone}
              sx={{
                ...(isDrawingMode && {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  }
                })
              }}
            >
              {isDrawingMode ? 'Cancel Drawing' : 'Draw Flight Direction'}
            </Button>
          </ButtonGroup>
          
          <Button
            size={isMobile ? "medium" : "small"}
            variant={isSettingLandingZone ? 'contained' : 'outlined'}
            color={isSettingLandingZone ? 'primary' : 'inherit'}
            startIcon={<LocationOn />}
            onClick={() => setIsSettingLandingZone(!isSettingLandingZone)}
            disabled={isDrawingMode}
            sx={{ 
              minHeight: isMobile ? 48 : 'auto', // Better touch target on mobile
              ...(isSettingLandingZone && {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                }
              })
            }}
          >
            {isSettingLandingZone ? 'Cancel Change' : 'Set Landing Zone'}
          </Button>

          <FormControl size={isMobile ? "medium" : "small"} sx={{ minWidth: isMobile ? '100%' : 120 }}>
            <InputLabel>Map Layer</InputLabel>
            <Select
              value={mapLayer}
              label="Map Layer"
              onChange={(e) => setMapLayer(e.target.value)}
            >
              <MenuItem value="osm">OpenStreetMap</MenuItem>
              <MenuItem value="google-satellite">Google Satellite</MenuItem>
              <MenuItem value="google-hybrid">Google Hybrid</MenuItem>
              <MenuItem value="esri-satellite">Esri Satellite</MenuItem>
              <MenuItem value="cartodb">CartoDB Positron</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mt: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={commonParameters.flightOverLandingZone}
                onChange={(e) => {
                  // Update common parameters
                  setCommonParameters({
                    ...commonParameters,
                    flightOverLandingZone: e.target.checked
                  });
                }}
                size={isMobile ? "medium" : "small"}
              />
            }
            label="Fly directly over landing zone"
            sx={{ 
              '& .MuiFormControlLabel-label': { 
                fontSize: isMobile ? '0.9rem' : '0.875rem'
              },
              '& .MuiSwitch-root': {
                minHeight: isMobile ? 40 : 'auto' // Better touch target
              }
            }}
          />
        </Box>

        {commonParameters.flightDirection !== undefined && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Flight direction: {Math.round(commonParameters.flightDirection)}°
          </Typography>
        )}
        </Paper>
      )}

      {/* Full Screen Map */}
      <MapView
        multiProfileResults={multiProfileResults}
        profiles={activeProfiles}
        primaryWeatherData={primaryWeatherData}
        isDrawingMode={isDrawingMode}
        onFlightPathComplete={handleFlightPathComplete}
        onCancelDrawing={handleCancelDrawing}
        isSettingLandingZone={isSettingLandingZone}
        onLandingZoneSet={handleLandingZoneSet}
        onCancelLandingZone={handleCancelLandingZone}
        mapLayer={mapLayer}
        // Backward compatibility
        exitCalculation={exitCalculation}
        groundWindData={groundWindData}
      />
    </Box>
  );
};