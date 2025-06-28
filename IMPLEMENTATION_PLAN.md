# FreeSpot Implementation Plan

## Project Overview
A web application for calculating optimal skydiving exit points based on weather conditions, similar to skydivespot.com. The app calculates where skydivers should exit the aircraft to land at their target location, considering wind drift during freefall and canopy flight.

## Technical Stack
- **Framework**: React with TypeScript (non-strict mode)
- **Build Tool**: Vite
- **State Management**: React Context API
- **UI Components**: Material-UI
- **Map**: Leaflet
- **Weather API**: OpenMeteo
- **Testing**: Jest
- **Deployment**: GitHub Pages
- **Browser Support**: Modern browsers only

## Core Features

### 1. Weather Data Management
- Fetch weather data from OpenMeteo API for all supported altitude levels
- Support multiple weather models: GFS, ICON-EU, ECMWF, and "Best Match"
- Cache weather data for 3 hours with offline support
- Interpolate weather data for specific times
- Display weather table showing wind direction, speed, and temperature at different altitudes
- Account for terrain elevation when calculating altitudes

### 2. Exit Point Calculation
- Calculate optimal exit point based on:
  - Jump altitude
  - Aircraft speed
  - Wind conditions at all altitudes
  - Freefall speed (default 200 km/h)
  - Canopy opening altitude
  - Canopy performance (descent rate and glide ratio)
  - Number of jump groups and spacing
  - Landing zone location
  - Aircraft flight direction (headwind or custom)
- When multiple solutions exist, prefer upwind option
- Calculate individual exit points for each jump group

### 3. Map Visualization
- Use Leaflet for interactive map display
- Default to user's current location
- Display:
  - Optimal exit point with circle
  - Individual group exit positions
  - Landing location marker
  - Aircraft flight path line
  - Optional freefall drift visualization
- Allow custom flight path drawing when not using headwind
- Support side-by-side weather model comparison

### 4. User Interface
- Responsive design for desktop and mobile
- Input forms for all parameters with unit conversion
- Unit preferences saved to localStorage
- Parameter sets can be exported/imported as JSON
- Visual wind warnings (configurable thresholds)
- All parameters auto-saved to localStorage

## Implementation Phases

### Phase 1: Project Setup and Core Structure
1. Initialize Vite project with React and TypeScript
2. Configure TypeScript (non-strict mode)
3. Set up project structure
4. Install dependencies (Material-UI, Leaflet, etc.)
5. Configure GitHub Pages deployment

### Phase 2: State Management and Data Models
1. Define TypeScript interfaces for all data types
2. Create React Context for global state
3. Implement localStorage persistence
4. Create unit conversion utilities

### Phase 3: Weather Service Integration
1. Implement OpenMeteo API client
2. Create weather data fetching for all altitude levels
3. Implement 3-hour caching with IndexedDB for offline support
4. Add weather data interpolation for specific times
5. Handle terrain elevation data

### Phase 4: Physics Engine
1. Implement wind drift calculations for freefall
2. Create canopy flight path calculations
3. Develop exit point optimization algorithm
4. Add support for multiple jump groups
5. Write comprehensive Jest tests for all calculations

### Phase 5: Map Implementation
1. Set up Leaflet map component
2. Implement location services for default position
3. Create map markers and overlays
4. Add custom flight path drawing functionality
5. Implement optional drift visualization

### Phase 6: User Interface
1. Create parameter input forms with Material-UI
2. Implement unit conversion in UI
3. Build weather data table component
4. Add JSON export/import functionality
5. Create side-by-side model comparison view

### Phase 7: Polish and Optimization
1. Add progressive web app capabilities
2. Optimize performance for mobile devices
3. Implement error handling and loading states
4. Add user documentation
5. Configure GitHub Actions for automated deployment

## Data Flow Architecture

```
User Input → Context State → LocalStorage
     ↓            ↓
     ↓      Weather Service → Cache (IndexedDB)
     ↓            ↓
     ↓      Physics Engine
     ↓            ↓
     ↓      Map Visualization
     ↓            ↓
     └──────→ UI Updates
```

## Key Algorithms

### Exit Point Calculation
1. For each potential exit point:
   - Calculate freefall drift based on winds from exit to opening altitude
   - Calculate canopy flight path considering wind at each altitude level
   - Determine if skydiver reaches landing zone
2. Find exit points where first and last group have equal canopy flight time
3. If multiple solutions, select the most upwind option

### Wind Drift Calculation
- Freefall: Integrate wind effects over descent time
- Canopy: Vector addition of canopy airspeed and wind at each altitude

## Testing Strategy
- Unit tests for all physics calculations
- Integration tests for weather data processing
- Component tests for React components
- End-to-end tests for critical user flows

## Performance Considerations
- Lazy load map components
- Debounce parameter changes
- Use React.memo for expensive components
- Implement virtual scrolling for weather data tables
- Cache calculated results when parameters haven't changed

## Security and Privacy
- All data processing happens client-side
- No user data sent to external servers (except weather API requests)
- Location permission requested only when needed
- Cached data stored locally only