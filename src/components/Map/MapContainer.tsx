import React, { useState, useCallback } from 'react';
import { Box, Button, ButtonGroup, Paper, Typography } from '@mui/material';
import { Navigation, Edit } from '@mui/icons-material';
import { MapView } from './MapView';
import { DrawingManager } from './DrawingManager';
import { useAppContext } from '../../contexts/AppContext';
import { ExitCalculationResult } from '../../physics/exit-point';
import { ForecastData } from '../../types';

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

  return (
    <Paper elevation={3} sx={{ height: '100%', overflow: 'hidden' }}>
      {/* Map controls */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Jump Visualization
        </Typography>
        
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
          >
            Draw Flight Path
          </Button>
        </ButtonGroup>

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
        />
        
        <DrawingManager
          isActive={isDrawingMode}
          onFlightPathComplete={handleFlightPathComplete}
          onCancel={handleCancelDrawing}
        />
      </Box>
    </Paper>
  );
};