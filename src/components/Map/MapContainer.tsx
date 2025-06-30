import React, { useState, useCallback } from 'react';
import { Box, Button, ButtonGroup, Paper, Typography, FormControlLabel, Switch } from '@mui/material';
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
    <Paper elevation={3} sx={{ height: '100%', overflow: 'hidden' }}>
      {/* Map controls */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Jump Visualization
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
              Draw Flight Path
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
      </Box>

      {/* Map */}
      <Box sx={{ position: 'relative', height: 'calc(100% - 100px)' }}>
        <MapView
          exitCalculation={exitCalculation}
          groundWindData={groundWindData}
          isDrawingMode={isDrawingMode}
          onFlightPathComplete={handleFlightPathComplete}
          onCancelDrawing={handleCancelDrawing}
          isSettingLandingZone={isSettingLandingZone}
          onLandingZoneSet={handleLandingZoneSet}
          onCancelLandingZone={handleCancelLandingZone}
        />
      </Box>
    </Paper>
  );
};