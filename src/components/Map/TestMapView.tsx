import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export const TestMapView: React.FC = () => {
  console.log('TestMapView rendering');
  
  return (
    <div style={{ 
      height: '100%', 
      width: '100%', 
      border: '2px solid red',
      backgroundColor: 'lightgreen'
    }}>
      <MapContainer
        center={[61.7807, 22.7221]}
        zoom={13}
        style={{ 
          height: '100%', 
          width: '100%'
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </div>
  );
};