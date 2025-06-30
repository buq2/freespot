import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  AppBar,
  Toolbar,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Drawer,
  IconButton,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Settings, Map as MapIcon, CloudDownload, Menu, Close, ChevronLeft } from '@mui/icons-material';
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
  const { jumpParameters, customWeatherData } = useAppContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedModels, setSelectedModels] = useState<string[]>(['best_match']);
  const [weatherData, setWeatherData] = useState<{ [modelId: string]: ForecastData[] }>({});
  const [terrainElevation, setTerrainElevation] = useState<number>(0);
  const [exitCalculation, setExitCalculation] = useState<ExitCalculationResult | null>(null);
  const [groundWindData, setGroundWindData] = useState<ForecastData | undefined>();
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  
  const drawerWidth = 400; // Fixed width for drawer

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCalculate = useCallback(async () => {
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
        jumpParameters.jumpTime,
        customWeatherData
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
      
      // Mark initial load as complete
      setInitialLoad(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate exit points');
      setExitCalculation(null);
      setGroundWindData(undefined);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [jumpParameters, selectedModels, customWeatherData]);

  // Auto-calculate when parameters change
  useEffect(() => {
    // Only calculate if we have selected models and a valid landing zone
    if (selectedModels.length > 0 && jumpParameters.landingZone.lat && jumpParameters.landingZone.lon) {
      const delayDebounce = setTimeout(() => {
        handleCalculate();
      }, 500); // 500ms debounce to avoid too many API calls

      return () => clearTimeout(delayDebounce);
    }
  }, [jumpParameters, selectedModels, customWeatherData, handleCalculate]);

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      {/* App Bar */}
      <AppBar position="fixed" elevation={1} sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            {drawerOpen ? <ChevronLeft /> : <Menu />}
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            FreeSpot - Skydiving Exit Point Calculator
          </Typography>
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              <Typography variant="body2" color="inherit">
                Calculating...
              </Typography>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Side Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: isMobile ? '100%' : drawerWidth,
          flexShrink: 0,
          zIndex: theme.zIndex.drawer,
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : drawerWidth,
            boxSizing: 'border-box',
            pt: 8, // Account for app bar
            zIndex: theme.zIndex.drawer,
          },
        }}
      >
        <Box sx={{ overflow: 'auto', height: '100%' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Parameters" />
            <Tab label="Weather" />
            <Tab label="Results" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
              <JumpParametersForm />
              <UserPreferencesForm />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 2 }}>
              <WeatherModelSelector
                selectedModels={selectedModels}
                onModelSelectionChange={setSelectedModels}
              />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Exit Point Results */}
              {exitCalculation && (
                <ExitPointResults result={exitCalculation} />
              )}

              {/* Ground Wind Display */}
              {groundWindData && (
                <WindCompass 
                  windData={groundWindData} 
                  title="Ground Wind (10m AGL)"
                />
              )}

              {/* Weather Tables */}
              {Object.keys(weatherData).length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Weather Data
                  </Typography>
                  {selectedModels.map((modelId) => {
                    const modelData = weatherData[modelId];
                    if (!modelData) return null;
                    
                    const modelName = modelId === 'best_match' ? 'Best Match' :
                                     modelId === 'gfs_global' ? 'GFS Global' :
                                     modelId === 'icon_eu' ? 'ICON EU' :
                                     modelId === 'ecmwf_ifs04' ? 'ECMWF' :
                                     modelId === 'custom' ? 'Custom Weather Data' : modelId;
                    
                    return (
                      <Box key={modelId} sx={{ mb: 2 }}>
                        <WeatherTable
                          data={modelData}
                          modelName={modelName}
                          terrainElevation={terrainElevation}
                        />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </TabPanel>
        </Box>
      </Drawer>

      {/* Main Content - Full Screen Map */}
      <Box
        component="main"
        sx={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Error Display Overlay */}
        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ 
              position: 'absolute', 
              top: 80, 
              left: '50%', 
              transform: 'translateX(-50%)',
              zIndex: 1000,
              maxWidth: '90%'
            }}
          >
            {error}
          </Alert>
        )}

        {/* Full Screen Map */}
        <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
          <MapContainer
            exitCalculation={exitCalculation}
            groundWindData={groundWindData}
          />
          
          {/* Loading Overlay */}
          {initialLoad && loading && (
            <Box
              sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                zIndex: 1000
              }}
            >
              <CircularProgress size={60} />
              <Typography variant="h6" color="text.secondary">
                Loading weather data...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This may take a few moments
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};