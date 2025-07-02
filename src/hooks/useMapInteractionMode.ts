import { useEffect } from 'react';
import { Map } from 'leaflet';

/**
 * Custom hook to manage map interaction states during special modes
 * (like drawing flight paths or setting landing zones)
 */
export const useMapInteractionMode = (map: Map, isActive: boolean) => {
  useEffect(() => {
    if (isActive) {
      // Disable map dragging to prevent panning
      map.dragging.disable();
      
      // Disable all interactive layers to prevent popups
      map.eachLayer((layer: any) => {
        if (layer._path || layer._icon) {
          const element = layer._path || layer._icon;
          if (element) {
            element.style.pointerEvents = 'none';
          }
        }
      });
      
      // Set crosshair cursor
      const container = map.getContainer();
      container.style.cursor = 'crosshair';
      
      return () => {
        // Re-enable map dragging
        map.dragging.enable();
        
        // Re-enable layer interactions
        map.eachLayer((layer: any) => {
          if (layer._path || layer._icon) {
            const element = layer._path || layer._icon;
            if (element) {
              element.style.pointerEvents = '';
            }
          }
        });
        
        // Reset cursor
        const container = map.getContainer();
        container.style.cursor = '';
      };
    }
  }, [isActive, map]);
};