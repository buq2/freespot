import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline, Popup, useMap } from 'react-leaflet';
import { LatLng } from 'leaflet';
import { useAppContext } from '../../contexts';
import type { ExitCalculationResult } from '../../physics/exit-point';
import './icons'; // Import to trigger Leaflet icon fixes
import { landingZoneIcon, exitPointIcon, createGroupExitIcon, createWindArrowIcon } from './icons';
import type { ForecastData, JumpParameters, JumpProfile } from '../../types';

// Multi-profile calculation result
interface MultiProfileResult {
  profileId: string;
  calculation: ExitCalculationResult;
  groundWind: ForecastData | undefined;
}
import { formatSpeed, formatAltitude } from '../../utils/units';
import { getDestinationPoint, movePoint } from '../../physics/geo';
import { DrawingManager } from './DrawingManager';
import { LandingZoneManager } from './LandingZoneManager';
import { calculateFreefallDrift, calculateCanopyDrift } from '../../physics/wind-drift';
import { interpolateWeatherData } from '../../services/weather/openmeteo';
import './leaflet.css';

interface MapViewProps {
  multiProfileResults?: MultiProfileResult[];
  profiles?: JumpProfile[];
  primaryWeatherData?: ForecastData[] | null;
  isDrawingMode?: boolean;
  onFlightPathComplete?: (bearing: number) => void;
  onCancelDrawing?: () => void;
  isSettingLandingZone?: boolean;
  onLandingZoneSet?: (lat: number, lon: number) => void;
  onCancelLandingZone?: () => void;
  mapLayer?: string;
  // Backward compatibility
  exitCalculation?: ExitCalculationResult | null;
  groundWindData?: ForecastData;
}

// Component to handle map centering and initialization
const MapController: React.FC<{ center: LatLng; shouldCenter: boolean }> = ({ center, shouldCenter }) => {
  const map = useMap();
  
  useEffect(() => {
    // Only set view on initial load or when explicitly requested
    if (shouldCenter) {
      map.setView(center, map.getZoom());
    }
  }, [center, map, shouldCenter]);
  
  useEffect(() => {
    // Force map to resize and invalidate when first loaded
    const timer = setTimeout(() => {
      map.invalidateSize();
      console.log('Map invalidated and resized');
    }, 100);
    
    return () => clearTimeout(timer);
  }, [map]);
  
  return null;
};

// Calculate drift paths for visualization using real weather data
const calculateDriftPaths = (
  exitCalculation: ExitCalculationResult | null,
  primaryWeatherData: ForecastData[] | null,
  jumpParameters: JumpParameters,
  showDriftVisualization: boolean
) => {
  if (!exitCalculation || !showDriftVisualization || !primaryWeatherData) {
    return [];
  }

  // Check if exitPoints exists and is iterable
  const exitPoints = exitCalculation.exitPoints;
  if (!exitPoints || !Array.isArray(exitPoints) || exitPoints.length === 0) {
    return [];
  }

  const paths = [];
  
  for (const exitPoint of exitPoints) {
    try {
      // Use the same weather data and functions as optimal exit point calculation
      
      // Calculate freefall drift using real weather data
      const freefallDrift = calculateFreefallDrift(
        primaryWeatherData,
        jumpParameters.jumpAltitude,
        jumpParameters.openingAltitude,
        jumpParameters.freefallSpeed
      );
      
      // Position after freefall
      const openingPosition = movePoint(exitPoint.location, freefallDrift.driftVector);
      
      // Calculate canopy drift using real weather data
      // Note: Using 0 forward speed to show pure wind drift (same as optimal exit point calculation)
      const canopyDrift = calculateCanopyDrift(
        primaryWeatherData,
        jumpParameters.openingAltitude,
        jumpParameters.setupAltitude,
        0, // no forward canopy speed - pure drift (consistent with optimal exit point calculation)
        jumpParameters.canopyDescentRate,
        jumpParameters.glideRatio,
        0 // direction doesn't matter with 0 forward speed
      );
      
      // Final landing position
      const landingPosition = movePoint(openingPosition, canopyDrift.driftVector);
      
      paths.push({
        groupNumber: exitPoint.groupNumber,
        path: [
          exitPoint.location,
          openingPosition,
          landingPosition
        ]
      });
    } catch (error) {
      // Skip this path if calculation fails
      console.warn(`Failed to calculate drift path for group ${exitPoint.groupNumber}:`, error);
      continue;
    }
  }
  
  return paths;
};

// Get tile layer configuration based on selected layer
const getTileLayerConfig = (layerId: string) => {
  const configs = {
    'osm': {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    'google-satellite': {
      url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>'
    },
    'google-hybrid': {
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>'
    },
    'esri-satellite': {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
    },
    'cartodb': {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
  };
  
  return configs[layerId] || configs['osm'];
};

export const MapView: React.FC<MapViewProps> = ({ 
  multiProfileResults = [],
  profiles = [],
  primaryWeatherData,
  isDrawingMode = false,
  onFlightPathComplete,
  onCancelDrawing,
  isSettingLandingZone = false,
  onLandingZoneSet,
  onCancelLandingZone,
  mapLayer = 'osm',
  // Backward compatibility
  exitCalculation,
  groundWindData
}) => {
  const { profiles: contextProfiles, commonParameters, userPreferences } = useAppContext();
  
  // Use props profiles or context profiles
  const activeProfiles = profiles.length > 0 ? profiles : contextProfiles;
  const enabledProfiles = activeProfiles.filter(p => p.enabled);
  
  const primaryProfile = enabledProfiles[0] || activeProfiles[0];
  const [mapCenter, setMapCenter] = useState<LatLng>(
    new LatLng(
      commonParameters?.landingZone.lat || 0, 
      commonParameters?.landingZone.lon || 0
    )
  );
  const hasInitializedRef = useRef(false);

  // Debug: Log when component renders
  console.log('MapView rendering with center:', mapCenter, 'multiProfileResults:', multiProfileResults.length);

  // Only center the map on the very first time we get calculation data
  useEffect(() => {
    const firstResult = multiProfileResults[0] || (exitCalculation ? { calculation: exitCalculation } : null);
    
    if (firstResult && commonParameters && !hasInitializedRef.current && firstResult.calculation.optimalExitPoint) {
      // Center between landing zone and optimal exit point only on first successful calculation
      const centerLat = (commonParameters.landingZone.lat + firstResult.calculation.optimalExitPoint.lat) / 2;
      const centerLon = (commonParameters.landingZone.lon + firstResult.calculation.optimalExitPoint.lon) / 2;
      setMapCenter(new LatLng(centerLat, centerLon));
      hasInitializedRef.current = true;
    }
  }, [multiProfileResults, exitCalculation, commonParameters]);

  // Helper function to create flight path for a calculation
  const createFlightPath = (calculation: ExitCalculationResult) => {
    const points = calculation?.exitPoints;
    if (!points || points.length === 0 || !commonParameters) return null;
    
    const heading = calculation.aircraftHeading;
    const extendDistance = 1000; // meters
    
    if (commonParameters.flightOverLandingZone) {
      // For overhead flight, show the flight path passing over the landing zone
      const landingZone = commonParameters.landingZone;
      const startPoint = getDestinationPoint(landingZone, extendDistance * 2, heading + 180);
      const endPoint = getDestinationPoint(landingZone, extendDistance * 2, heading);
      
      if (points.length === 1) {
        return [startPoint, points[0].location, endPoint];
      } else {
        return [startPoint, ...points.map(p => p.location), endPoint];
      }
    } else {
      // Normal offset flight path
      if (points.length < 2) {
        const exitPoint = points[0].location;
        const startPoint = getDestinationPoint(exitPoint, extendDistance / 2, heading + 180);
        const endPoint = getDestinationPoint(exitPoint, extendDistance / 2, heading);
        return [startPoint, exitPoint, endPoint];
      }
      
      const firstPoint = points[0].location;
      const lastPoint = points[points.length - 1].location;
      
      const startPoint = getDestinationPoint(firstPoint, extendDistance, heading + 180);
      const endPoint = getDestinationPoint(lastPoint, extendDistance, heading);
      
      return [startPoint, ...points.map(p => p.location), endPoint];
    }
  };

  // Create multi-profile flight paths and drift paths
  const profileVisualizationData = useMemo(() => {
    const data: Array<{
      profile: JumpProfile;
      calculation: ExitCalculationResult;
      groundWind: ForecastData | undefined;
      flightPath: any[] | null;
      driftPaths: any[];
    }> = [];

    // Process multi-profile results
    for (const result of multiProfileResults) {
      const profile = activeProfiles.find(p => p.id === result.profileId);
      if (!profile || !result.calculation) continue;

      const flightPath = createFlightPath(result.calculation);

      const driftPaths = calculateDriftPaths(
        result.calculation,
        primaryWeatherData,
        { ...commonParameters, ...profile.parameters },
        profile.showDriftVisualization
      );

      data.push({
        profile,
        calculation: result.calculation,
        groundWind: result.groundWind,
        flightPath,
        driftPaths
      });
    }

    // Fallback to backward compatibility mode - only if we have enabled profiles
    if (data.length === 0 && exitCalculation && primaryProfile && commonParameters && enabledProfiles.length > 0) {
      const flightPath = createFlightPath(exitCalculation);
      const driftPaths = calculateDriftPaths(
        exitCalculation,
        primaryWeatherData,
        { ...commonParameters, ...primaryProfile.parameters },
        primaryProfile.showDriftVisualization
      );

      data.push({
        profile: primaryProfile,
        calculation: exitCalculation,
        groundWind: groundWindData,
        flightPath,
        driftPaths
      });
    }

    return data;
  }, [multiProfileResults, activeProfiles, enabledProfiles, primaryWeatherData, exitCalculation, primaryProfile, groundWindData]);

  // Get tile layer configuration
  const tileConfig = getTileLayerConfig(mapLayer);

  // Error boundary for the map
  try {
    return (
      <div style={{ height: '100%', width: '100%', position: 'relative' }}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ 
            height: '100%', 
            width: '100%',
            minHeight: '400px'
          }}
          key="map" // Fixed key to prevent unnecessary re-renders
        >
      <MapController center={mapCenter} shouldCenter={!hasInitializedRef.current} />
      
      <TileLayer
        attribution={tileConfig.attribution}
        url={tileConfig.url}
      />

      {/* Landing Zone */}
      {commonParameters && (
        <Marker
          position={[commonParameters.landingZone.lat, commonParameters.landingZone.lon]}
          icon={landingZoneIcon}
        >
          <Popup>
            <div>
              <strong>Landing Zone</strong>
              <br />
              Lat: {commonParameters.landingZone.lat.toFixed(4)}
              <br />
              Lon: {commonParameters.landingZone.lon.toFixed(4)}
              {profileVisualizationData[0]?.groundWind && (
                <>
                  <br />
                  <br />
                  <strong>Ground Wind:</strong>
                  <br />
                  Direction: {Math.round(profileVisualizationData[0].groundWind.direction)}°
                  <br />
                  Speed: {formatSpeed(profileVisualizationData[0].groundWind.speed, userPreferences.units.speed)}
                  {profileVisualizationData[0].groundWind.gustSpeed && (
                    <>
                      <br />
                    Gusts: {formatSpeed(profileVisualizationData[0].groundWind.gustSpeed, userPreferences.units.speed)}
                  </>
                )}
              </>
            )}
          </div>
        </Popup>
      </Marker>
      )}

      {/* Ground wind visualization */}
      {commonParameters && profileVisualizationData[0]?.groundWind && profileVisualizationData[0].groundWind.speed > 0.5 && (
        <Marker
          position={[commonParameters.landingZone.lat, commonParameters.landingZone.lon]}
          icon={createWindArrowIcon(profileVisualizationData[0].groundWind.direction, profileVisualizationData[0].groundWind.speed)}
        />
      )}

      {/* Multi-profile visualization */}
      {profileVisualizationData.map((profileData, profileIndex) => (
        <React.Fragment key={`profile-${profileData.profile.id}`}>
          {/* Safety circle */}
          {profileData.calculation.optimalExitPoint && (
            <Circle
              center={[profileData.calculation.optimalExitPoint.lat, profileData.calculation.optimalExitPoint.lon]}
              radius={profileData.calculation.safetyRadius}
              pathOptions={{
                color: profileData.profile.color,
                fillColor: profileData.profile.color,
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 10'
              }}
            >
            <Popup>
              <strong>{profileData.profile.name}</strong>
              <br />
              Safety radius: {formatAltitude(profileData.calculation.safetyRadius, userPreferences.units.altitude)}
            </Popup>
          </Circle>
          )}

          {/* Optimal exit point */}
          {profileData.calculation.optimalExitPoint && (
            <Marker
              position={[profileData.calculation.optimalExitPoint.lat, profileData.calculation.optimalExitPoint.lon]}
              icon={exitPointIcon}
            >
              <Popup>
                <strong>{profileData.profile.name} - Optimal Exit Point</strong>
                <br />
                Lat: {profileData.calculation.optimalExitPoint.lat.toFixed(4)}
                <br />
                Lon: {profileData.calculation.optimalExitPoint.lon.toFixed(4)}
              </Popup>
            </Marker>
          )}

          {/* Individual group exits */}
          {profileData.calculation.exitPoints?.map((exit) => (
            <Marker
              key={`${profileData.profile.id}-group-${exit.groupNumber}`}
              position={[exit.location.lat, exit.location.lon]}
              icon={createGroupExitIcon(exit.groupNumber)}
            >
              <Popup>
                <strong>{profileData.profile.name} - Group {exit.groupNumber}</strong>
                <br />
                Lat: {exit.location.lat.toFixed(4)}
                <br />
                Lon: {exit.location.lon.toFixed(4)}
              </Popup>
            </Marker>
          ))}

          {/* Aircraft flight path */}
          {profileData.flightPath && (
            <Polyline
              positions={profileData.flightPath.map(p => [p.lat, p.lon])}
              pathOptions={{
                color: profileData.profile.color,
                weight: 3,
                opacity: 0.8,
                dashArray: profileIndex === 0 ? '10, 5' : '15, 10' // Vary dash pattern for different profiles
              }}
            >
              <Popup>
                <strong>{profileData.profile.name}</strong>
                <br />
                Aircraft heading: {Math.round(profileData.calculation.aircraftHeading)}°
              </Popup>
            </Polyline>
          )}

          {/* Drift visualization (if enabled for this profile) */}
          {profileData.driftPaths.map((driftPath) => (
            <React.Fragment key={`${profileData.profile.id}-drift-${driftPath.groupNumber}`}>
              {/* Freefall drift path */}
              <Polyline
                positions={[
                  [driftPath.path[0].lat, driftPath.path[0].lon], // Exit point
                  [driftPath.path[1].lat, driftPath.path[1].lon]  // Opening position
                ]}
                pathOptions={{
                  color: profileData.profile.color,
                  weight: 2,
                  opacity: 0.5,
                  dashArray: '5, 5'
                }}
              >
                <Popup>
                  {profileData.profile.name} - Group {driftPath.groupNumber} - Freefall drift
                </Popup>
              </Polyline>
              
              {/* Canopy drift path */}
              <Polyline
                positions={[
                  [driftPath.path[1].lat, driftPath.path[1].lon], // Opening position
                  [driftPath.path[2].lat, driftPath.path[2].lon]  // Landing position
                ]}
                pathOptions={{
                  color: profileData.profile.color,
                  weight: 2,
                  opacity: 0.7,
                  dashArray: '10, 5'
                }}
              >
                <Popup>
                  {profileData.profile.name} - Group {driftPath.groupNumber} - Canopy drift
                </Popup>
              </Polyline>
              
              {/* Opening position marker */}
              <Marker
                position={[driftPath.path[1].lat, driftPath.path[1].lon]}
                icon={createGroupExitIcon(driftPath.groupNumber)}
                opacity={0.6}
              >
                <Popup>
                  {profileData.profile.name} - Group {driftPath.groupNumber} - Opening position
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}

      {/* Drawing Manager - must be inside MapContainer */}
      {isDrawingMode && onFlightPathComplete && onCancelDrawing && (
        <DrawingManager
          isActive={isDrawingMode}
          onFlightPathComplete={onFlightPathComplete}
          onCancel={onCancelDrawing}
        />
      )}

      {/* Landing Zone Manager - must be inside MapContainer */}
      {isSettingLandingZone && onLandingZoneSet && onCancelLandingZone && (
        <LandingZoneManager
          isActive={isSettingLandingZone}
          onLandingZoneSet={onLandingZoneSet}
          onCancel={onCancelLandingZone}
        />
      )}
        </MapContainer>
      </div>
    );
  } catch (error) {
    console.error('Error rendering map:', error);
    return (
      <div style={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h3>Map Loading Error</h3>
          <p>Unable to initialize map. Please refresh the page.</p>
          <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
};