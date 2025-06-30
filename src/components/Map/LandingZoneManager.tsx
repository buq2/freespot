import React from 'react';
import { useMapEvents } from 'react-leaflet';
import { IconButton, Tooltip, Box, Typography, Paper, useTheme } from '@mui/material';
import { Clear } from '@mui/icons-material';

interface LandingZoneManagerProps {
  onLandingZoneSet: (lat: number, lon: number) => void;
  isActive: boolean;
  onCancel: () => void;
}

export const LandingZoneManager: React.FC<LandingZoneManagerProps> = ({
  onLandingZoneSet,
  isActive,
  onCancel
}) => {
  const theme = useTheme();
  
  const map = useMapEvents({
    click: (e) => {
      if (isActive) {
        onLandingZoneSet(e.latlng.lat, e.latlng.lng);
      }
    }
  });

  const handleCancel = () => {
    onCancel();
  };

  if (!isActive) return null;

  return (
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
        Set Landing Zone
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
        Click on map to set landing location
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
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
    </Paper>
  );
};