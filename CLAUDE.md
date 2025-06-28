The project is to write a client only web app which fetches weather information for given location and estimates best location for jumping from an airplane when doing a skydive. This is a very similar application to https://skydivespot.com/.

The best location for skydiving is determined by:
- Altitude from the jump is made (in meters)
- Air speed of the airplane (km/h)
- Wind direction and strength in different altitudes below the jump altitude (direction in degrees, speed in m/s)
-- The wind affects how much skydiver will drift during free fall
- Time of jump. This affects the weather information.
- Skydiver freefall speed (by default 200km/h)
- Parachute opening altitude (meters)
- Parachute relative air speed after opening (m/s)
-- This can also be given as canopy descent rate (m/s, default 6m/s) and glide ratio (by default 2.5, so for each meter down the canopy glides 2.5 meters forwards)
- Number of jump groups (each jump group can be modeled as a single falling skydiver)
- Time between the jump groups (time between the jump groups, number of groups and the airplane speed gives us a distance which it takes all jumpers to exit the airplane)
- Landing location (given as lat/lon)
- Airplane flight direction. By default this should be headwind in the exit altitude, but user should also be able to set this direction as degrees.

Given the above parameters, the application calculates locations where the jump groups should exit the airplane. The exit locations are calculated such that after the freefall when the skydivers open the parachute, first and last group have the same flight time under the canopy (taking into account the wind strength and direction in different altitudes) to the landing location. As the airplane is flying to a specific direction and jump groups exit evenly spaced, this means that we are trying to calculate optimal latitude and longitude location for the middle of the jump groups (we call this as "optimal exit point")

The user should be able to give the given parameters with different units. For example altitude can be given as meters or feet. Speed in m/s, knots or miles per hour.

After calculating the "optimal exit point", the application draws:
- a circle around the "optimal exit point". The circle radius should correspond to distance from which the landing location can be reached safely.
- positions of the group exits
- the given landing location
- airplane flight direction as a line

Write project in typescript and react.
Use Vite.
Use leaflet library for displaying map.
Use openmeteo to get weather information.
Cache weather data for 3 hours.
When user changes the parameters, the parameters should be saved to local storage.
The parameters can be exported or imported as .json.
The weather model can be selected between GFS, Icon EU, ECMWF or "Best match" (model in openmeteo).
Interpolate the weather data for given time.
The weather data for the landing location is displayed as a table for different altitudes (wind direction, wind speed, temperature).
Include tests for the physics calculations.
Support modern desktop and mobile browsers. No need to support legacy browsers.
Take into account terrain elevation (use Openmeteo) as usually the weather models give the altitudes from the sea level, not from the ground level.                                        
Map should default to current user location.
Show visual warnings for high ground winds (8m/s student max, 11m/s for sport, make these configurable)
The weather forecast data should be fetched for the given day
Fetch the weather information for all elevation levels the given model supports.
Make visualization of the freewall drift for the groups optional.
Use Material-UI for UI components as much as possible.
Use Jest for testing framework.
Make the app deployable as a static site.
The canopy has constant air speed, the ground speed is affected by the wind direction and strength.
Use React Context for state management
Do not use strict typescript
For each weather prediction model, fetch weather data for all altitudes supported by that model.
User should be able to draw custom flight path (if the fligh path is not selected to be headwind)
No multiple jump scenarios.
User should be able to compare multiple weather models side-by-side.
Later, we should also calculate cloud probability in different altitude levels.
App should remember user choice in units.
Cached weather data should be available offline.
Mobile interface should have same features as desktop interface.
Visualize ground wind direction at the set landing position (direction and speed with a text).
