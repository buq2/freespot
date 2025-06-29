import React, { useState, useEffect } from 'react';
import { useMapEvents, Polyline, Marker } from 'react-leaflet';
import { LatLng, divIcon } from 'leaflet';
import { Button, IconButton, Tooltip } from '@mui/material';
import { Edit, Check, Clear } from '@mui/icons-material';
import { calculateBearing } from '../../physics/geo';

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
  const [points, setPoints] = useState<LatLng[]>([]);
  
  const map = useMapEvents({
    click: (e) => {
      if (isActive) {
        setPoints([...points, e.latlng]);
      }
    }
  });

  useEffect(() => {
    if (!isActive) {
      setPoints([]);
    }
  }, [isActive]);

  const handleComplete = () => {
    if (points.length >= 2) {
      // Calculate bearing from first to last point
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];
      
      const bearing = calculateBearing(
        { lat: firstPoint.lat, lon: firstPoint.lng },
        { lat: lastPoint.lat, lon: lastPoint.lng }
      );
      
      onFlightPathComplete(bearing);
      setPoints([]);
    }
  };

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
          Draw Flight Path
        </div>
        <div style={{ fontSize: '12px', marginBottom: '8px' }}>
          Click on map to add points
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Tooltip title="Complete">
            <span>
              <IconButton
                size="small"
                color="primary"
                onClick={handleComplete}
                disabled={points.length < 2}
              >
                <Check />
              </IconButton>
            </span>
          </Tooltip>
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