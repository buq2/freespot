import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Button, ButtonGroup, Paper, Typography, FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem, useTheme, useMediaQuery } from '@mui/material';
import { Navigation, Edit, LocationOn, Explore } from '@mui/icons-material';
import { MapView } from './MapView';
import { useAppContext } from '../../contexts/AppContext';
import { calculateExitPoints } from '../../physics/exit-point';
import { calculateBearing } from '../../physics/geo';
import { fetchWeatherData } from '../../services/weather';
import type { ExitCalculationResult } from '../../physics/exit-point';
import type { ForecastData } from '../../types';

interface MapContainerProps {
  exitCalculation: ExitCalculationResult | null;
  groundWindData?: ForecastData;
  primaryWeatherData?: ForecastData[] | null;
  showControls?: boolean;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  exitCalculation,
  groundWindData,
  primaryWeatherData,
  showControls = true
}) => {
  const { jumpParameters, setJumpParameters, customWeatherData } = useAppContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isSettingLandingZone, setIsSettingLandingZone] = useState(false);
  const [isOptimalDirectionMode, setIsOptimalDirectionMode] = useState(false);
  const [mapLayer, setMapLayer] = useState('osm');

  const handleFlightPathComplete = useCallback((bearing: number) => {
    // Disable optimal direction mode when user manually sets direction
    setIsOptimalDirectionMode(false);
    setJumpParameters({
      ...jumpParameters,
      flightDirection: Math.round(bearing * 10) / 10
    });
    setIsDrawingMode(false);
  }, [jumpParameters, setJumpParameters]);

  const handleUseHeadwind = useCallback(() => {
    setIsOptimalDirectionMode(false);
    setJumpParameters({
      ...jumpParameters,
      flightDirection: undefined
    });
  }, [jumpParameters, setJumpParameters]);

  const calculateOptimalDirection = useCallback(async () => {
    try {
      // Use custom weather data if available, otherwise fetch weather data
      let weatherData = customWeatherData;
      
      if (!weatherData) {
        // Fetch weather data for the current location and time
        const result = await fetchWeatherData(
          jumpParameters.landingZone,
          'best_match', // Use best match model
          jumpParameters.jumpTime
        );
        weatherData = result.data;
      }
      
      if (!weatherData || weatherData.length === 0) {
        console.warn('No weather data available for optimal flight direction calculation');
        return;
      }
      
      let optimalDirection: number;
      
      if (jumpParameters.flightOverLandingZone) {
        // When flying over landing zone, direction should be from landing zone to optimal exit point
        // This is the direction the aircraft needs to fly to reach the optimal exit point and continue over landing zone
        const exitResult = calculateExitPoints(jumpParameters, weatherData);
        optimalDirection = calculateBearing(jumpParameters.landingZone, exitResult.optimalExitPoint);
      } else {
        // Normal case: use the standard aircraft heading calculation (headwind)
        const exitResult = calculateExitPoints(jumpParameters, weatherData);
        optimalDirection = exitResult.aircraftHeading;
      }
      
      const newFlightDirection = Math.round(optimalDirection * 10) / 10;
      
      // Only update if the value actually changed to prevent infinite loops
      setJumpParameters(currentParams => {
        if (currentParams.flightDirection === newFlightDirection) {
          return currentParams; // No change needed
        }
        return {
          ...currentParams,
          flightDirection: newFlightDirection
        };
      });
      
    } catch (error) {
      console.error('Failed to calculate optimal flight direction:', error);
    }
  }, [jumpParameters, setJumpParameters, customWeatherData]);

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
    setJumpParameters({
      ...jumpParameters,
      landingZone: { lat, lon }
    });
    setIsSettingLandingZone(false);
  }, [jumpParameters, setJumpParameters]);

  const handleCancelLandingZone = useCallback(() => {
    setIsSettingLandingZone(false);
  }, []);

  // Auto-recalculate optimal direction when parameters change
  // We use useRef to track if we're currently calculating to prevent loops
  const isCalculatingRef = useRef(false);
  
  // Disable optimal direction mode when "Fly directly over landing zone" is turned off
  useEffect(() => {
    if (isOptimalDirectionMode && !jumpParameters.flightOverLandingZone) {
      setIsOptimalDirectionMode(false);
    }
  }, [isOptimalDirectionMode, jumpParameters.flightOverLandingZone]);
  
  useEffect(() => {
    if (isOptimalDirectionMode && !isCalculatingRef.current && jumpParameters.flightOverLandingZone) {
      isCalculatingRef.current = true;
      calculateOptimalDirection().finally(() => {
        isCalculatingRef.current = false;
      });
    }
  }, [
    isOptimalDirectionMode,
    jumpParameters.jumpAltitude,
    jumpParameters.openingAltitude,
    jumpParameters.setupAltitude,
    jumpParameters.freefallSpeed,
    jumpParameters.canopyDescentRate,
    jumpParameters.glideRatio,
    jumpParameters.landingZone.lat,
    jumpParameters.landingZone.lon,
    jumpParameters.jumpTime,
    jumpParameters.flightOverLandingZone,
    customWeatherData,
    calculateOptimalDirection
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
              variant={jumpParameters.flightDirection === undefined && !isOptimalDirectionMode ? 'contained' : 'outlined'}
            >
              Auto Headwind
            </Button>
            <Button
              startIcon={<Explore />}
              onClick={handleToggleOptimalDirection}
              variant={isOptimalDirectionMode ? 'contained' : 'outlined'}
              color={isOptimalDirectionMode ? 'primary' : 'inherit'}
              disabled={isDrawingMode || isSettingLandingZone || !jumpParameters.flightOverLandingZone}
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
                checked={jumpParameters.flightOverLandingZone}
                onChange={(e) => setJumpParameters({
                  ...jumpParameters,
                  flightOverLandingZone: e.target.checked
                })}
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

        {jumpParameters.flightDirection !== undefined && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Flight direction: {Math.round(jumpParameters.flightDirection)}°
          </Typography>
        )}
        </Paper>
      )}

      {/* Full Screen Map */}
      <MapView
        exitCalculation={exitCalculation}
        groundWindData={groundWindData}
        primaryWeatherData={primaryWeatherData}
        isDrawingMode={isDrawingMode}
        onFlightPathComplete={handleFlightPathComplete}
        onCancelDrawing={handleCancelDrawing}
        isSettingLandingZone={isSettingLandingZone}
        onLandingZoneSet={handleLandingZoneSet}
        onCancelLandingZone={handleCancelLandingZone}
        mapLayer={mapLayer}
      />
    </Box>
  );
};