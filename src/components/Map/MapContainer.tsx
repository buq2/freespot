import React, { useState, useCallback } from 'react';
import { Box, Button, ButtonGroup, Paper, Typography, FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Navigation, Edit, LocationOn } from '@mui/icons-material';
import { MapView } from './MapView';
import { useAppContext } from '../../contexts/AppContext';
import type { ExitCalculationResult } from '../../physics/exit-point';
import type { ForecastData } from '../../types';

interface MapContainerProps {
  exitCalculation: ExitCalculationResult | null;
  groundWindData?: ForecastData;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  exitCalculation,
  groundWindData
}) => {
  const { jumpParameters, setJumpParameters } = useAppContext();
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isSettingLandingZone, setIsSettingLandingZone] = useState(false);
  const [mapLayer, setMapLayer] = useState('osm');

  const handleFlightPathComplete = useCallback((bearing: number) => {
    setJumpParameters({
      ...jumpParameters,
      flightDirection: bearing
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
      <Paper 
        elevation={3} 
        sx={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          zIndex: 999,
          p: 2,
          maxWidth: '400px',
          pointerEvents: 'auto'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <ButtonGroup size="small" variant="outlined">
            <Button
              startIcon={<Navigation />}
              onClick={handleUseHeadwind}
              variant={jumpParameters.flightDirection === undefined ? 'contained' : 'outlined'}
            >
              Auto Headwind
            </Button>
            <Button
              startIcon={<Edit />}
              onClick={() => setIsDrawingMode(true)}
              variant={isDrawingMode ? 'contained' : 'outlined'}
              disabled={isSettingLandingZone}
            >
              Draw Flight Direction
            </Button>
          </ButtonGroup>
          
          <Button
            size="small"
            variant={isSettingLandingZone ? 'contained' : 'outlined'}
            startIcon={<LocationOn />}
            onClick={() => setIsSettingLandingZone(true)}
            disabled={isDrawingMode}
          >
            Set Landing Zone
          </Button>

          <FormControl size="small" sx={{ minWidth: 120 }}>
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
                size="small"
              />
            }
            label="Fly directly over landing zone"
            sx={{ 
              '& .MuiFormControlLabel-label': { 
                fontSize: '0.875rem' 
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