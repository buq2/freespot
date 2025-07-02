import L from 'leaflet';

// Fix for default markers in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix the default icon issue with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Landing zone icon (target)
export const landingZoneIcon = L.divIcon({
  className: 'landing-zone-icon',
  html: `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="none" stroke="#ff0000" stroke-width="3"/>
      <circle cx="20" cy="20" r="12" fill="none" stroke="#ff0000" stroke-width="2"/>
      <circle cx="20" cy="20" r="6" fill="none" stroke="#ff0000" stroke-width="2"/>
      <circle cx="20" cy="20" r="2" fill="#ff0000"/>
    </svg>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});


// Exit point icon with custom color
export const createExitPointIcon = (color: string = '#0066ff') => {
  // Create a darker shade for the stroke
  const strokeColor = color.replace(/^#/, '');
  const r = parseInt(strokeColor.substring(0, 2), 16);
  const g = parseInt(strokeColor.substring(2, 4), 16);
  const b = parseInt(strokeColor.substring(4, 6), 16);
  const darkerColor = `#${Math.floor(r * 0.7).toString(16).padStart(2, '0')}${Math.floor(g * 0.7).toString(16).padStart(2, '0')}${Math.floor(b * 0.7).toString(16).padStart(2, '0')}`;
  
  return L.divIcon({
    className: 'exit-point-icon',
    html: `
      <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 5 L10 25 L15 20 L20 25 Z" fill="${color}" stroke="${darkerColor}" stroke-width="1"/>
      </svg>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};


// Group exit icon with custom color
export const createColoredGroupExitIcon = (groupNumber: number, color: string = '#0066ff') => {
  // Determine text color based on background brightness
  const colorWithoutHash = color.replace(/^#/, '');
  const r = parseInt(colorWithoutHash.substring(0, 2), 16);
  const g = parseInt(colorWithoutHash.substring(2, 4), 16);
  const b = parseInt(colorWithoutHash.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const textColor = brightness > 128 ? 'black' : 'white';
  
  return L.divIcon({
    className: 'group-exit-icon',
    html: `
      <div style="
        background: ${color};
        color: ${textColor};
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">${groupNumber}</div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Wind arrow icon
export const createWindArrowIcon = (direction: number, speed: number) => {
  const length = Math.min(40, 20 + speed * 2); // Scale with wind speed
  // Wind direction in meteorology is where wind comes FROM
  // We want to show where wind is going TO, so add 180 degrees
  const arrowDirection = (direction + 180) % 360;
  
  return L.divIcon({
    className: 'wind-arrow-icon',
    html: `
      <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" 
           style="transform: rotate(${arrowDirection}deg)">
        <line x1="30" y1="30" x2="30" y2="${30 - length}" 
              stroke="#666" stroke-width="2"/>
        <path d="M30 ${30 - length} L25 ${35 - length} L35 ${35 - length} Z" 
              fill="#666"/>
      </svg>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 30],
  });
};