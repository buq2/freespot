import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline, Popup, useMap } from 'react-leaflet';
import { LatLng } from 'leaflet';
import { useAppContext } from '../../contexts/AppContext';
import type { ExitCalculationResult } from '../../physics/exit-point';
import { landingZoneIcon, exitPointIcon, createGroupExitIcon, createWindArrowIcon } from './icons';
import type { ForecastData } from '../../types';
import { formatSpeed } from '../../utils/units';
import { getDestinationPoint } from '../../physics/geo';
import { DrawingManager } from './DrawingManager';
import './leaflet.css';

interface MapViewProps {
  exitCalculation: ExitCalculationResult | null;
  groundWindData?: ForecastData;
  isDrawingMode?: boolean;
  onFlightPathComplete?: (bearing: number) => void;
  onCancelDrawing?: () => void;
}

// Component to handle map centering
const MapController: React.FC<{ center: LatLng }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
};

export const MapView: React.FC<MapViewProps> = ({ 
  exitCalculation, 
  groundWindData,
  isDrawingMode = false,
  onFlightPathComplete,
  onCancelDrawing
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
    if (points.length < 2) return null;
    
    // Extend the line 1km before first and after last exit
    const heading = exitCalculation.aircraftHeading;
    const extendDistance = 1000; // meters
    
    const firstPoint = points[0].location;
    const lastPoint = points[points.length - 1].location;
    
    // Use proper geo calculations instead of rough approximations
    const startPoint = getDestinationPoint(firstPoint, extendDistance, heading + 180);
    const endPoint = getDestinationPoint(lastPoint, extendDistance, heading);
    
    return [startPoint, ...points.map(p => p.location), endPoint];
  })() : null;

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      style={{ height: '600px', width: '100%' }}
    >
      <MapController center={mapCenter} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
              Safety radius: {Math.round(exitCalculation.safetyRadius)}m
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
          {userPreferences.showDriftVisualization && exitCalculation.exitPoints.length > 0 && (
            <>
              {/* This would show drift paths from exit to landing */}
              {/* Implementation would require additional data from physics calculations */}
            </>
          )}
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
    </MapContainer>
  );
};