import React, { useState, useCallback } from 'react';
import { Box, Button, ButtonGroup, Paper, Typography, FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem, useTheme, useMediaQuery } from '@mui/material';
import { Navigation, Edit, LocationOn } from '@mui/icons-material';
import { MapView } from './MapView';
import { useAppContext } from '../../contexts/AppContext';
import type { ExitCalculationResult } from '../../physics/exit-point';
import type { ForecastData } from '../../types';

interface MapContainerProps {
  exitCalculation: ExitCalculationResult | null;
  groundWindData?: ForecastData;
  showControls?: boolean;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  exitCalculation,
  groundWindData,
  showControls = true
}) => {
  const { jumpParameters, setJumpParameters } = useAppContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isSettingLandingZone, setIsSettingLandingZone] = useState(false);
  const [mapLayer, setMapLayer] = useState('osm');

  const handleFlightPathComplete = useCallback((bearing: number) => {
    setJumpParameters({
      ...jumpParameters,
      flightDirection: Math.round(bearing * 10) / 10
    });
    setIsDrawingMode(false);
  }, [jumpParameters, setJumpParameters]);

  const handleUseHeadwind = useCallback(() => {
    setJumpParameters({
      ...jumpParameters,
      flightDirection: undefined
    });
  }, [jumpParameters, setJumpParameters]);

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
              variant={jumpParameters.flightDirection === undefined ? 'contained' : 'outlined'}
            >
              Auto Headwind
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