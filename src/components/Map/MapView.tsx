import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline, Popup, useMap } from 'react-leaflet';
import { LatLng } from 'leaflet';
import { useAppContext } from '../../contexts/AppContext';
import type { ExitCalculationResult } from '../../physics/exit-point';
import { landingZoneIcon, exitPointIcon, createGroupExitIcon, createWindArrowIcon } from './icons';
import type { ForecastData, JumpParameters } from '../../types';
import { formatSpeed, formatAltitude } from '../../utils/units';
import { getDestinationPoint, movePoint } from '../../physics/geo';
import { DrawingManager } from './DrawingManager';
import { LandingZoneManager } from './LandingZoneManager';
import { calculateFreefallDrift, calculateCanopyDrift } from '../../physics/wind-drift';
import { interpolateWeatherData } from '../../services/weather/openmeteo';
import './leaflet.css';

interface MapViewProps {
  exitCalculation: ExitCalculationResult | null;
  groundWindData?: ForecastData;
  isDrawingMode?: boolean;
  onFlightPathComplete?: (bearing: number) => void;
  onCancelDrawing?: () => void;
  isSettingLandingZone?: boolean;
  onLandingZoneSet?: (lat: number, lon: number) => void;
  onCancelLandingZone?: () => void;
  mapLayer?: string;
}

// Component to handle map centering
const MapController: React.FC<{ center: LatLng }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
};

// Calculate drift paths for visualization
const calculateDriftPaths = (
  exitCalculation: ExitCalculationResult | null,
  groundWindData: ForecastData | undefined,
  jumpParameters: JumpParameters,
  showDriftVisualization: boolean
) => {
  if (!exitCalculation || !showDriftVisualization) {
    return [];
  }

  const paths = [];
  
  for (const exitPoint of exitCalculation.exitPoints) {
    try {
      // Get weather data (we'll need to fetch it - for now use a simple approach)
      // This is a simplified approach - in a real implementation, we'd need the weather data
      if (!groundWindData) continue;
      
      // Create simplified weather data array for this visualization
      // In reality, we'd need the full weather profile
      const simpleWeatherData = [
        // High altitude (jump level)
        { altitude: jumpParameters.jumpAltitude, direction: groundWindData.direction, speed: groundWindData.speed * 1.5 },
        // Mid altitude
        { altitude: (jumpParameters.jumpAltitude + jumpParameters.openingAltitude) / 2, direction: groundWindData.direction, speed: groundWindData.speed * 1.2 },
        // Opening altitude
        { altitude: jumpParameters.openingAltitude, direction: groundWindData.direction, speed: groundWindData.speed },
        // Ground level
        { altitude: 0, direction: groundWindData.direction, speed: groundWindData.speed }
      ];
      
      // Calculate freefall drift
      const freefallDrift = calculateFreefallDrift(
        simpleWeatherData,
        jumpParameters.jumpAltitude,
        jumpParameters.openingAltitude,
        jumpParameters.freefallSpeed
      );
      
      // Position after freefall
      const openingPosition = movePoint(exitPoint.location, freefallDrift.driftVector);
      
      // Calculate canopy drift (pure drift - no forward speed)
      const canopyDrift = calculateCanopyDrift(
        simpleWeatherData,
        jumpParameters.openingAltitude,
        0,
        0, // no forward speed for this visualization
        jumpParameters.canopyDescentRate,
        jumpParameters.glideRatio,
        0
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
  exitCalculation, 
  groundWindData,
  isDrawingMode = false,
  onFlightPathComplete,
  onCancelDrawing,
  isSettingLandingZone = false,
  onLandingZoneSet,
  onCancelLandingZone,
  mapLayer = 'osm'
}) => {
  const { jumpParameters, userPreferences } = useAppContext();
  const [mapCenter, setMapCenter] = useState<LatLng>(
    new LatLng(jumpParameters.landingZone.lat, jumpParameters.landingZone.lon)
  );

  useEffect(() => {
    if (exitCalculation) {
      // Center between landing zone and optimal exit point
      const centerLat = (jumpParameters.landingZone.lat + exitCalculation.optimalExitPoint.lat) / 2;
      const centerLon = (jumpParameters.landingZone.lon + exitCalculation.optimalExitPoint.lon) / 2;
      setMapCenter(new LatLng(centerLat, centerLon));
    } else {
      setMapCenter(new LatLng(jumpParameters.landingZone.lat, jumpParameters.landingZone.lon));
    }
  }, [exitCalculation, jumpParameters.landingZone]);

  // Create aircraft flight path
  const flightPath = exitCalculation ? (() => {
    const points = exitCalculation.exitPoints;
    if (points.length === 0) return null;
    
    const heading = exitCalculation.aircraftHeading;
    const extendDistance = 1000; // meters
    
    if (jumpParameters.flightOverLandingZone) {
      // For overhead flight, show the flight path passing over the landing zone
      // Extend beyond the landing zone in both directions
      const landingZone = jumpParameters.landingZone;
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
        // Single exit point - show short line
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
  })() : null;

  // Calculate drift paths for visualization
  const driftPaths = calculateDriftPaths(exitCalculation, groundWindData, jumpParameters, userPreferences.showDriftVisualization);

  // Get tile layer configuration
  const tileConfig = getTileLayerConfig(mapLayer);

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      style={{ 
        height: '600px', 
        width: '100%',
        cursor: isSettingLandingZone ? 'crosshair' : 'default'
      }}
    >
      <MapController center={mapCenter} />
      
      <TileLayer
        attribution={tileConfig.attribution}
        url={tileConfig.url}
      />

      {/* Landing Zone */}
      <Marker
        position={[jumpParameters.landingZone.lat, jumpParameters.landingZone.lon]}
        icon={landingZoneIcon}
      >
        <Popup>
          <div>
            <strong>Landing Zone</strong>
            <br />
            Lat: {jumpParameters.landingZone.lat.toFixed(4)}
            <br />
            Lon: {jumpParameters.landingZone.lon.toFixed(4)}
            {groundWindData && (
              <>
                <br />
                <br />
                <strong>Ground Wind:</strong>
                <br />
                Direction: {Math.round(groundWindData.direction)}°
                <br />
                Speed: {formatSpeed(groundWindData.speed, userPreferences.units.speed)}
                {groundWindData.gustSpeed && (
                  <>
                    <br />
                    Gusts: {formatSpeed(groundWindData.gustSpeed, userPreferences.units.speed)}
                  </>
                )}
              </>
            )}
          </div>
        </Popup>
      </Marker>

      {/* Ground wind visualization */}
      {groundWindData && groundWindData.speed > 0.5 && (
        <Marker
          position={[jumpParameters.landingZone.lat, jumpParameters.landingZone.lon]}
          icon={createWindArrowIcon(groundWindData.direction, groundWindData.speed)}
          interactive={false}
        />
      )}

      {exitCalculation && (
        <>
          {/* Safety circle */}
          <Circle
            center={[exitCalculation.optimalExitPoint.lat, exitCalculation.optimalExitPoint.lon]}
            radius={exitCalculation.safetyRadius}
            pathOptions={{
              color: 'green',
              fillColor: 'green',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '5, 10'
            }}
          >
            <Popup>
              Safety radius: {formatAltitude(exitCalculation.safetyRadius, userPreferences.units.altitude)}
            </Popup>
          </Circle>

          {/* Optimal exit point */}
          <Marker
            position={[exitCalculation.optimalExitPoint.lat, exitCalculation.optimalExitPoint.lon]}
            icon={exitPointIcon}
          >
            <Popup>
              <strong>Optimal Exit Point</strong>
              <br />
              Lat: {exitCalculation.optimalExitPoint.lat.toFixed(4)}
              <br />
              Lon: {exitCalculation.optimalExitPoint.lon.toFixed(4)}
            </Popup>
          </Marker>

          {/* Individual group exits */}
          {exitCalculation.exitPoints.map((exit) => (
            <Marker
              key={exit.groupNumber}
              position={[exit.location.lat, exit.location.lon]}
              icon={createGroupExitIcon(exit.groupNumber)}
            >
              <Popup>
                <strong>Group {exit.groupNumber}</strong>
                <br />
                Lat: {exit.location.lat.toFixed(4)}
                <br />
                Lon: {exit.location.lon.toFixed(4)}
              </Popup>
            </Marker>
          ))}

          {/* Aircraft flight path */}
          {flightPath && (
            <Polyline
              positions={flightPath.map(p => [p.lat, p.lon])}
              pathOptions={{
                color: 'blue',
                weight: 3,
                opacity: 0.8,
                dashArray: '10, 5'
              }}
            >
              <Popup>
                Aircraft heading: {Math.round(exitCalculation.aircraftHeading)}°
              </Popup>
            </Polyline>
          )}

          {/* Drift visualization (if enabled) */}
          {driftPaths.map((driftPath) => (
            <React.Fragment key={`drift-${driftPath.groupNumber}`}>
              {/* Freefall drift path */}
              <Polyline
                positions={[
                  [driftPath.path[0].lat, driftPath.path[0].lon], // Exit point
                  [driftPath.path[1].lat, driftPath.path[1].lon]  // Opening position
                ]}
                pathOptions={{
                  color: '#ff4444',
                  weight: 2,
                  opacity: 0.7,
                  dashArray: '5, 5'
                }}
              >
                <Popup>
                  Group {driftPath.groupNumber} - Freefall drift
                </Popup>
              </Polyline>
              
              {/* Canopy drift path */}
              <Polyline
                positions={[
                  [driftPath.path[1].lat, driftPath.path[1].lon], // Opening position
                  [driftPath.path[2].lat, driftPath.path[2].lon]  // Landing position
                ]}
                pathOptions={{
                  color: '#4444ff',
                  weight: 2,
                  opacity: 0.7,
                  dashArray: '10, 5'
                }}
              >
                <Popup>
                  Group {driftPath.groupNumber} - Canopy drift
                </Popup>
              </Polyline>
              
              {/* Opening position marker */}
              <Marker
                position={[driftPath.path[1].lat, driftPath.path[1].lon]}
                icon={createGroupExitIcon(driftPath.groupNumber)}
                opacity={0.6}
              >
                <Popup>
                  Group {driftPath.groupNumber} - Opening position
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </>
      )}

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
  );
};