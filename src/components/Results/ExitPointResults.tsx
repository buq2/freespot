import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import { Flight, LocationOn, Speed, Height } from '@mui/icons-material';
import type { ExitCalculationResult } from '../../physics/exit-point';
import { useAppContext } from '../../contexts/AppContext';
import { formatAltitude } from '../../utils/units';
import { calculateDistance } from '../../physics/geo';

interface ExitPointResultsProps {
  result: ExitCalculationResult;
}

export const ExitPointResults: React.FC<ExitPointResultsProps> = ({ result }) => {
  const { userPreferences } = useAppContext();
  
  // Calculate actual exit spread distance
  const exitSpread = result.exitPoints.length > 1 ? 
    calculateDistance(
      result.exitPoints[0].location,
      result.exitPoints[result.exitPoints.length - 1].location
    ) : 0;

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Exit Point Calculation Results
      </Typography>

      <Grid container spacing={3}>
        {/* Optimal Exit Point */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOn color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Optimal Exit Point</Typography>
              </Box>
              
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Coordinates
              </Typography>
              <Typography variant="body1">
                {result.optimalExitPoint.lat.toFixed(4)}°N, {result.optimalExitPoint.lon.toFixed(4)}°E
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Safety Radius
                </Typography>
                <Typography variant="body1">
                  {formatAltitude(result.safetyRadius, userPreferences.units.altitude)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Aircraft Information */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Flight color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Aircraft Information</Typography>
              </Box>
              
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Flight Heading
              </Typography>
              <Typography variant="body1">
                {Math.round(result.aircraftHeading)}°
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Flight Direction
                </Typography>
                <Typography variant="body1">
                  {result.aircraftHeading >= 0 && result.aircraftHeading < 90 && 'Northeast'}
                  {result.aircraftHeading >= 90 && result.aircraftHeading < 180 && 'Southeast'}
                  {result.aircraftHeading >= 180 && result.aircraftHeading < 270 && 'Southwest'}
                  {result.aircraftHeading >= 270 && 'Northwest'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Exit Points List */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Height color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Group Exit Points</Typography>
              </Box>
              
              <List dense>
                {result.exitPoints.map((exit, index) => (
                  <React.Fragment key={exit.groupNumber}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={`Group ${exit.groupNumber}`} 
                              size="small" 
                              color="primary" 
                            />
                            <Typography variant="body2">
                              {exit.location.lat.toFixed(4)}°N, {exit.location.lon.toFixed(4)}°E
                            </Typography>
                          </Box>
                        }
                        secondary={`Exit point for group ${exit.groupNumber}`}
                      />
                    </ListItem>
                    {index < result.exitPoints.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Statistics */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Total Groups
                  </Typography>
                  <Typography variant="h6">
                    {result.exitPoints.length}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Safety Radius
                  </Typography>
                  <Typography variant="h6">
                    {formatAltitude(result.safetyRadius, userPreferences.units.altitude)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Flight Heading
                  </Typography>
                  <Typography variant="h6">
                    {Math.round(result.aircraftHeading)}°
                  </Typography>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Exit Spread
                  </Typography>
                  <Typography variant="h6">
                    {formatAltitude(exitSpread, userPreferences.units.altitude)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};