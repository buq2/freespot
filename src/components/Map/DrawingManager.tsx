import React, { useState, useEffect } from 'react';
import { useMapEvents, useMap, Polyline, Marker } from 'react-leaflet';
import { LatLng, divIcon } from 'leaflet';
import { IconButton, Tooltip, Box, Typography, Paper, useTheme } from '@mui/material';
import { Clear } from '@mui/icons-material';
import { calculateBearing } from '../../physics/geo';
import { useMapInteractionMode } from '../../hooks/useMapInteractionMode';

interface DrawingManagerProps {
  onFlightPathComplete: (bearing: number) => void;
  isActive: boolean;
  onCancel: () => void;
}

const drawingIcon = divIcon({
  className: 'drawing-point-icon',
  html: `
    <div style="
      background: #ff6b6b;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

export const DrawingManager: React.FC<DrawingManagerProps> = ({
  onFlightPathComplete,
  isActive,
  onCancel
}) => {
  const theme = useTheme();
  const [points, setPoints] = useState<LatLng[]>([]);
  const map = useMap();
  
  // Use custom hook to manage map interaction mode
  useMapInteractionMode(map, isActive);
  
  const mapEvents = useMapEvents({
    click: (e) => {
      if (isActive) {
        const newPoints = [...points, e.latlng];
        setPoints(newPoints);
        
        // Auto-complete after 2 clicks
        if (newPoints.length === 2) {
          const firstPoint = newPoints[0];
          const lastPoint = newPoints[1];
          
          const bearing = calculateBearing(
            { lat: firstPoint.lat, lon: firstPoint.lng },
            { lat: lastPoint.lat, lon: lastPoint.lng }
          );
          
          onFlightPathComplete(bearing);
          setPoints([]);
        }
      }
    }
  });

  useEffect(() => {
    if (!isActive) {
      setPoints([]);
    }
  }, [isActive]);

  const handleCancel = () => {
    setPoints([]);
    onCancel();
  };

  if (!isActive) return null;

  return (
    <>
      {/* Drawing line */}
      {points.length > 1 && (
        <Polyline
          positions={points}
          pathOptions={{
            color: '#ff6b6b',
            weight: 3,
            opacity: 0.8,
            dashArray: '5, 10'
          }}
        />
      )}

      {/* Drawing points */}
      {points.map((point, index) => (
        <Marker
          key={index}
          position={point}
          icon={drawingIcon}
          interactive={false}
        />
      ))}

      {/* Control buttons */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16, // Position on left to avoid conflict with map controls
          zIndex: theme.zIndex.modal + 1, // Use Material-UI's modal z-index + 1
          p: 2,
          minWidth: 200,
          maxWidth: 280
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Draw Flight Direction
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Click two points to set direction
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          {points.length === 1 && (
            <Typography variant="caption" color="text.secondary">
              Click one more point...
            </Typography>
          )}
          <Box sx={{ ml: 'auto' }}>
            <Tooltip title="Cancel">
              <IconButton
                size="small"
                color="error"
                onClick={handleCancel}
                sx={{ 
                  minWidth: 40,
                  minHeight: 40 // Better touch target
                }}
              >
                <Clear />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>
    </>
  );
};