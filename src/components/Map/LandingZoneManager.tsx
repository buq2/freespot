import React from 'react';
import { useMapEvents } from 'react-leaflet';
import { IconButton, Tooltip } from '@mui/material';
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
    <>
      {/* Control buttons */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        background: 'white',
        padding: '10px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
          Set Landing Zone
        </div>
        <div style={{ fontSize: '12px', marginBottom: '8px' }}>
          Click on map to set landing location
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Tooltip title="Cancel">
            <IconButton
              size="small"
              color="error"
              onClick={handleCancel}
            >
              <Clear />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </>
  );
};