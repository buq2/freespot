import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Alert,
  Chip
} from '@mui/material';
import { Warning, CheckCircle } from '@mui/icons-material';
import { ForecastData } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { formatAltitude, formatSpeed, formatTemperature } from '../../utils/units';

interface WeatherTableProps {
  data: ForecastData[];
  modelName: string;
  terrainElevation: number;
}

export const WeatherTable: React.FC<WeatherTableProps> = ({ 
  data, 
  modelName, 
  terrainElevation 
}) => {
  const { userPreferences } = useAppContext();

  const getWindWarningColor = (speed: number, gustSpeed?: number) => {
    const maxSpeed = Math.max(speed, gustSpeed || 0);
    
    if (maxSpeed >= userPreferences.sportWindLimit) {
      return 'error';
    } else if (maxSpeed >= userPreferences.studentWindLimit) {
      return 'warning';
    }
    return 'success';
  };

  const getWindWarningIcon = (speed: number, gustSpeed?: number) => {
    const maxSpeed = Math.max(speed, gustSpeed || 0);
    
    if (maxSpeed >= userPreferences.studentWindLimit) {
      return <Warning fontSize="small" />;
    }
    return <CheckCircle fontSize="small" />;
  };

  return (
    <Paper elevation={2}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">{modelName}</Typography>
        <Typography variant="body2" color="textSecondary">
          Terrain elevation: {formatAltitude(terrainElevation, userPreferences.units.altitude)}
        </Typography>
      </Box>

      <TableContainer sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Altitude (AGL)</TableCell>
              <TableCell align="center">Wind Direction</TableCell>
              <TableCell align="center">Wind Speed</TableCell>
              <TableCell align="center">Gusts</TableCell>
              <TableCell align="center">Temperature</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((forecast, index) => {
              const warningColor = getWindWarningColor(forecast.speed, forecast.gustSpeed);
              const warningIcon = getWindWarningIcon(forecast.speed, forecast.gustSpeed);
              
              return (
                <TableRow key={index} hover>
                  <TableCell>
                    {formatAltitude(forecast.altitude, userPreferences.units.altitude)}
                  </TableCell>
                  <TableCell align="center">
                    {Math.round(forecast.direction)}°
                  </TableCell>
                  <TableCell align="center">
                    {formatSpeed(forecast.speed, userPreferences.units.speed)}
                  </TableCell>
                  <TableCell align="center">
                    {forecast.gustSpeed ? 
                      formatSpeed(forecast.gustSpeed, userPreferences.units.speed) : 
                      '-'
                    }
                  </TableCell>
                  <TableCell align="center">
                    {forecast.temperature !== undefined ? 
                      formatTemperature(forecast.temperature, userPreferences.units.temperature) : 
                      '-'
                    }
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={warningIcon}
                      label={
                        warningColor === 'error' ? 'High' :
                        warningColor === 'warning' ? 'Moderate' : 'OK'
                      }
                      color={warningColor}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Wind warnings */}
      <Box sx={{ p: 2 }}>
        {data.some(d => d.speed >= userPreferences.sportWindLimit || (d.gustSpeed && d.gustSpeed >= userPreferences.sportWindLimit)) && (
          <Alert severity="error" sx={{ mb: 1 }}>
            High wind speeds detected! Conditions may be unsuitable for jumping.
          </Alert>
        )}
        {data.some(d => d.speed >= userPreferences.studentWindLimit || (d.gustSpeed && d.gustSpeed >= userPreferences.studentWindLimit)) && 
         !data.some(d => d.speed >= userPreferences.sportWindLimit || (d.gustSpeed && d.gustSpeed >= userPreferences.sportWindLimit)) && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            Moderate wind speeds detected. Students should exercise caution.
          </Alert>
        )}
      </Box>
    </Paper>
  );
};