import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Menu, Close, ChevronLeft, Tune } from '@mui/icons-material';
import { useAppContext, useAdvancedMode } from '../../contexts';
import { JumpParametersForm } from '../Parameters';
import { useWeatherCalculations, useExitPointCalculations } from '../../hooks';
import { weatherCache } from '../../services/weather/cache';

// Lazy load heavy components
const MapContainer = React.lazy(() => import('../Map/MapContainer').then(module => ({ default: module.MapContainer })));
const UserPreferencesForm = React.lazy(() => import('../Parameters/UserPreferencesForm').then(module => ({ default: module.UserPreferencesForm })));
const WeatherModelSelector = React.lazy(() => import('../Parameters/WeatherModelSelector').then(module => ({ default: module.WeatherModelSelector })));
const WeatherTable = React.lazy(() => import('../Weather/WeatherTable').then(module => ({ default: module.WeatherTable })));
const WindCompass = React.lazy(() => import('../Weather/WindCompass').then(module => ({ default: module.WindCompass })));
const ExitPointResults = React.lazy(() => import('../Results/ExitPointResults').then(module => ({ default: module.ExitPointResults })));

// Loading fallback component
const ComponentLoader: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
    <CircularProgress size={24} />
    <Typography variant="body2" sx={{ ml: 2 }}>Loading...</Typography>
  </Box>
);

// Map loading fallback
const MapLoader: React.FC = () => (
  <Box sx={{ 
    height: '100%', 
    width: '100%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 2,
    bgcolor: 'grey.100'
  }}>
    <CircularProgress size={48} />
    <Typography variant="h6" color="text.secondary">Loading Map...</Typography>
    <Typography variant="body2" color="text.secondary">
      Initializing map components
    </Typography>
  </Box>
);

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
  const { profiles, commonParameters, customWeatherData } = useAppContext();
  const { showAdvanced, setShowAdvanced } = useAdvancedMode();
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedModels, setSelectedModels] = useState<string[]>(['best_match']);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Use custom hooks for weather and exit point calculations
  const weatherCalculations = useWeatherCalculations();
  const exitPointCalculations = useExitPointCalculations();
  
  // Backward compatibility - use primary result for legacy components
  // Only show calculation data if there are enabled profiles
  const exitCalculation = exitPointCalculations.enabledProfiles.length > 0 
    ? exitPointCalculations.primaryResult?.calculation || null 
    : null;
  const groundWindData = exitPointCalculations.enabledProfiles.length > 0 
    ? exitPointCalculations.primaryResult?.groundWind || null 
    : null;
  const primaryWeatherData = weatherCalculations.result?.primaryWeatherData || null;
  const weatherData = weatherCalculations.result?.weatherData || {};
  const terrainElevation = weatherCalculations.result?.terrainElevation || 0;
  
  // Combined loading and error states
  const loading = weatherCalculations.isLoading || exitPointCalculations.isCalculating;
  const error = weatherCalculations.error || exitPointCalculations.error;
  const [tabValue, setTabValue] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [showMapControls, setShowMapControls] = useState(!isMobile);
  
  const drawerWidth = 400; // Fixed width for drawer

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Use ref to store current values to avoid stale closures
  const currentValuesRef = useRef({
    selectedModels,
    commonParameters,
    customWeatherData,
    weatherCalculations,
    exitPointCalculations
  });

  // Update ref with current values
  currentValuesRef.current = {
    selectedModels,
    commonParameters,
    customWeatherData,
    weatherCalculations,
    exitPointCalculations
  };

  const handleCalculate = useCallback(async () => {
    try {
      // Get current values from ref to avoid stale closure
      const current = currentValuesRef.current;
      
      // First fetch weather data
      const weatherResult = await current.weatherCalculations.fetchWeather(
        current.commonParameters.landingZone,
        current.selectedModels,
        current.commonParameters.jumpTime,
        current.customWeatherData
      );

      // Then calculate exit points using the weather data
      await current.exitPointCalculations.calculateExitPoints(
        weatherResult.primaryWeatherData || [],
        weatherResult.groundWindData
      );
      
      // Mark initial load as complete
      setInitialLoad(false);

    } catch (err) {
      console.error('Calculation failed:', err);
      // Error handling is done by the hooks
    }
  }, []); // Empty dependency array to prevent recreation

  // Auto-calculate when parameters change with conditional debounce
  useEffect(() => {
    // Only calculate if we have selected models, enabled profiles, and a valid landing zone
    if (selectedModels.length > 0 && exitPointCalculations.enabledProfiles.length > 0 && commonParameters.landingZone.lat && commonParameters.landingZone.lon) {
      
      let timeoutId: NodeJS.Timeout | null = null;
      
      // Check if weather data is already cached for current parameters
      const checkCacheAndCalculate = async () => {
        try {
          const cachedData = await weatherCache.get(
            { lat: commonParameters.landingZone.lat!, lon: commonParameters.landingZone.lon! },
            commonParameters.jumpTime
          );
          
          // If we have cached data for all selected models, skip debounce
          const hasAllModels = cachedData && selectedModels.every(modelId => 
            cachedData.weatherModels[modelId] && cachedData.weatherModels[modelId].length > 0
          );
          
          if (hasAllModels) {
            // Data is available, calculate immediately
            handleCalculate();
          } else {
            // Data not available, use debounce to avoid rapid API calls
            timeoutId = setTimeout(() => {
              handleCalculate();
            }, 500);
          }
        } catch (error) {
          // If cache check fails, fall back to debounced calculation
          console.warn('Cache check failed, using debounced calculation:', error);
          timeoutId = setTimeout(() => {
            handleCalculate();
          }, 500);
        }
      };
      
      checkCacheAndCalculate();
      
      // Cleanup function
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  }, [exitPointCalculations.enabledProfiles, commonParameters, selectedModels, customWeatherData, handleCalculate]);

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        elevation={0} 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(8px)',
          color: 'rgba(0, 0, 0, 0.87)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          pointerEvents: 'none' // Make the AppBar click-through
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ 
              mr: 2,
              minWidth: 48,
              minHeight: 48, // Improve touch target
              pointerEvents: 'auto' // Make button clickable
            }}
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
          >
            {drawerOpen ? <ChevronLeft /> : <Menu />}
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ 
            flexGrow: 1,
            display: { xs: 'none', sm: 'block' } // Hide title on mobile to save space
          }}>
            FreeSpot
          </Typography>

          {/* Map Controls Toggle for Mobile */}
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={() => setShowMapControls(!showMapControls)}
              sx={{ 
                mr: 1,
                minWidth: 48,
                minHeight: 48,
                pointerEvents: 'auto' // Make button clickable
              }}
              aria-label={showMapControls ? "Hide map controls" : "Show map controls"}
            >
              <Tune />
            </IconButton>
          )}


          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pointerEvents: 'none' }}>
              <CircularProgress size={20} color="inherit" />
              <Typography 
                variant="body2" 
                color="inherit"
                sx={{ display: { xs: 'none', sm: 'inline' } }} // Hide text on small screens
              >
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
            // Add better backdrop for mobile
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            }
          },
        }}
        // Close drawer when clicking outside on mobile
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        <Box sx={{ overflow: 'auto', height: '100%' }}>
          {/* App Title with Close Button for Mobile */}
          <Box sx={{ 
            p: 2, 
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="h6" component="div" sx={{ 
              fontSize: isMobile ? '1.1rem' : '1.25rem' 
            }}>
              FreeSpot - Skydiving Exit Point Calculator
            </Typography>
            {isMobile && (
              <IconButton
                onClick={() => setDrawerOpen(false)}
                size="small"
                sx={{ 
                  minWidth: 40,
                  minHeight: 40
                }}
                aria-label="Close menu"
              >
                <Close />
              </IconButton>
            )}
          </Box>
          
          {/* Advanced Options Toggle */}
          <Box sx={{ 
            px: 2, 
            py: 1.5, 
            borderBottom: 1, 
            borderColor: 'divider',
            backgroundColor: 'action.hover'
          }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Show advanced options
                </Typography>
              }
              sx={{ m: 0 }}
            />
          </Box>
          
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: isMobile ? 56 : 48, // Larger touch targets on mobile
                fontSize: isMobile ? '0.9rem' : '0.875rem'
              }
            }}
          >
            <Tab label="Parameters" />
            <Tab label="Weather" />
            <Tab label="Results" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
              <JumpParametersForm />
              <Suspense fallback={<ComponentLoader />}>
                <UserPreferencesForm />
              </Suspense>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Suspense fallback={<ComponentLoader />}>
                <WeatherModelSelector
                  selectedModels={selectedModels}
                  onModelSelectionChange={setSelectedModels}
                />
              </Suspense>

              {/* Ground Wind Display */}
              {groundWindData && (
                <Suspense fallback={<ComponentLoader />}>
                  <WindCompass 
                    windData={groundWindData} 
                    title="Ground Wind (10m AGL)"
                  />
                </Suspense>
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
                        <Suspense fallback={<ComponentLoader />}>
                          <WeatherTable
                            data={modelData}
                            modelName={modelName}
                            terrainElevation={terrainElevation}
                            jumpTime={commonParameters.jumpTime}
                          />
                        </Suspense>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Exit Point Results */}
              {exitCalculation && (
                <Suspense fallback={<ComponentLoader />}>
                  <ExitPointResults result={exitCalculation} />
                </Suspense>
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
          top: 0,
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
            onClose={() => {
              weatherCalculations.clearError();
              exitPointCalculations.clearError();
            }}
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
          <Suspense fallback={<MapLoader />}>
            <MapContainer
              multiProfileResults={exitPointCalculations.enabledProfiles.length > 0 ? exitPointCalculations.results : []}
              profiles={profiles}
              primaryWeatherData={primaryWeatherData}
              showControls={showMapControls}
              exitCalculation={exitCalculation}
              groundWindData={groundWindData}
            />
          </Suspense>
          
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