import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  AppBar,
  Toolbar,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import { Calculate, Settings, Map as MapIcon, CloudDownload } from '@mui/icons-material';
import { useAppContext } from '../../contexts/AppContext';
import { JumpParametersForm, UserPreferencesForm, WeatherModelSelector } from '../Parameters';
import { WeatherTable, WindCompass } from '../Weather';
import { ExitPointResults } from '../Results';
import { MapContainer } from '../Map';
import { fetchWeatherData, fetchMultipleModels } from '../../services/weather';
import { calculateExitPoints } from '../../physics/exit-point';
import { getWindDataAtAltitude } from '../../services/weather';
import type { ExitCalculationResult } from '../../physics/exit-point';
import type { ForecastData } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const AppLayout: React.FC = () => {
  const { jumpParameters } = useAppContext();
  const [selectedModels, setSelectedModels] = useState<string[]>(['best_match']);
  const [weatherData, setWeatherData] = useState<{ [modelId: string]: ForecastData[] }>({});
  const [terrainElevation, setTerrainElevation] = useState<number>(0);
  const [exitCalculation, setExitCalculation] = useState<ExitCalculationResult | null>(null);
  const [groundWindData, setGroundWindData] = useState<ForecastData | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCalculate = async () => {
    if (selectedModels.length === 0) {
      setError('Please select at least one weather model');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch weather data for all selected models
      const results = await fetchMultipleModels(
        jumpParameters.landingZone,
        selectedModels,
        jumpParameters.jumpTime
      );

      setWeatherData(results);
      setTerrainElevation(results.terrainElevation);

      // Use the first selected model for calculations
      const primaryModelData = results[selectedModels[0]];
      
      // Calculate exit points
      const exitResult = calculateExitPoints(jumpParameters, primaryModelData);
      setExitCalculation(exitResult);

      // Get ground wind data
      const groundWind = getWindDataAtAltitude(primaryModelData, 10); // 10m AGL
      setGroundWindData(groundWind);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate exit points');
      setExitCalculation(null);
      setGroundWindData(undefined);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            FreeSpot - Skydiving Exit Point Calculator
          </Typography>
          <Button
            color="inherit"
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Calculate />}
            onClick={handleCalculate}
            disabled={loading || selectedModels.length === 0}
          >
            {loading ? 'Calculating...' : 'Calculate'}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Left Panel - Parameters */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: 'sticky', top: 20 }}>
              <Paper elevation={1}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  variant="fullWidth"
                >
                  <Tab label="Parameters" icon={<Settings />} />
                  <Tab label="Weather" icon={<CloudDownload />} />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <JumpParametersForm />
                    <UserPreferencesForm />
                  </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <WeatherModelSelector
                    selectedModels={selectedModels}
                    onModelSelectionChange={setSelectedModels}
                  />
                </TabPanel>
              </Paper>
            </Box>
          </Grid>

          {/* Right Panel - Results and Map */}
          <Grid item xs={12} lg={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Error Display */}
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Map */}
              <Box sx={{ height: '600px' }}>
                <MapContainer
                  exitCalculation={exitCalculation}
                  groundWindData={groundWindData}
                />
              </Box>

              {/* Results */}
              {exitCalculation && (
                <ExitPointResults result={exitCalculation} />
              )}

              {/* Ground Wind Display */}
              {groundWindData && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <WindCompass 
                      windData={groundWindData} 
                      title="Ground Wind (10m AGL)"
                    />
                  </Grid>
                </Grid>
              )}

              {/* Weather Tables */}
              {Object.keys(weatherData).length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Weather Data
                  </Typography>
                  <Grid container spacing={2}>
                    {selectedModels.map((modelId) => {
                      const modelData = weatherData[modelId];
                      if (!modelData) return null;
                      
                      const modelName = modelId === 'best_match' ? 'Best Match' :
                                       modelId === 'gfs_global' ? 'GFS Global' :
                                       modelId === 'icon_eu' ? 'ICON EU' :
                                       modelId === 'ecmwf_ifs04' ? 'ECMWF' : modelId;
                      
                      return (
                        <Grid item xs={12} lg={selectedModels.length > 1 ? 6 : 12} key={modelId}>
                          <WeatherTable
                            data={modelData}
                            modelName={modelName}
                            terrainElevation={terrainElevation}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};