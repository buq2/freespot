import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import type { ForecastData } from '../../types';
import { useAppContext } from '../../contexts';
import { formatSpeed } from '../../utils/units';

interface WindCompassProps {
  windData: ForecastData;
  title?: string;
}

export const WindCompass: React.FC<WindCompassProps> = ({ 
  windData, 
  title = "Wind Direction" 
}) => {
  const { userPreferences } = useAppContext();
  
  const compassSize = 120;
  const center = compassSize / 2;
  const radius = 45;

  // Convert wind direction to arrow direction (wind is FROM direction, arrow shows TO direction)
  const arrowDirection = (windData.direction + 180) % 360;
  const arrowRadians = (arrowDirection - 90) * Math.PI / 180;
  
  const arrowEndX = center + Math.cos(arrowRadians) * radius;
  const arrowEndY = center + Math.sin(arrowRadians) * radius;
  
  const arrowStartX = center - Math.cos(arrowRadians) * radius;
  const arrowStartY = center - Math.sin(arrowRadians) * radius;

  // Arrow head points
  const headSize = 8;
  const headAngle1 = arrowRadians - Math.PI / 6;
  const headAngle2 = arrowRadians + Math.PI / 6;
  
  const head1X = arrowEndX - Math.cos(headAngle1) * headSize;
  const head1Y = arrowEndY - Math.sin(headAngle1) * headSize;
  const head2X = arrowEndX - Math.cos(headAngle2) * headSize;
  const head2Y = arrowEndY - Math.sin(headAngle2) * headSize;

  const getWindColor = () => {
    const maxSpeed = Math.max(windData.speed, windData.gustSpeed || 0);
    if (maxSpeed >= userPreferences.sportWindLimit) return '#f44336';
    if (maxSpeed >= userPreferences.studentWindLimit) return '#ff9800';
    return '#4caf50';
  };

  return (
    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      
      <Box sx={{ display: 'inline-block', position: 'relative' }}>
        <svg width={compassSize} height={compassSize}>
          {/* Compass circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="2"
          />
          
          {/* Cardinal directions */}
          <text x={center} y="15" textAnchor="middle" fontSize="12" fill="#666">N</text>
          <text x={compassSize - 10} y={center + 4} textAnchor="middle" fontSize="12" fill="#666">E</text>
          <text x={center} y={compassSize - 5} textAnchor="middle" fontSize="12" fill="#666">S</text>
          <text x="10" y={center + 4} textAnchor="middle" fontSize="12" fill="#666">W</text>
          
          {/* Wind arrow */}
          <line
            x1={arrowStartX}
            y1={arrowStartY}
            x2={arrowEndX}
            y2={arrowEndY}
            stroke={getWindColor()}
            strokeWidth="3"
            markerEnd="url(#arrowhead)"
          />
          
          {/* Arrow head */}
          <polygon
            points={`${arrowEndX},${arrowEndY} ${head1X},${head1Y} ${head2X},${head2Y}`}
            fill={getWindColor()}
          />
          
          {/* Center dot */}
          <circle
            cx={center}
            cy={center}
            r="3"
            fill={getWindColor()}
          />
        </svg>
      </Box>

      <Typography variant="body2" sx={{ mt: 1 }}>
        <strong>{Math.round(windData.direction)}°</strong>
      </Typography>
      
      <Typography variant="body2" color="textSecondary">
        {formatSpeed(windData.speed, userPreferences.units.speed)}
        {windData.gustSpeed && (
          <span> (gusts {formatSpeed(windData.gustSpeed, userPreferences.units.speed)})</span>
        )}
      </Typography>
    </Paper>
  );
};