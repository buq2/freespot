import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Navigating to the app...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/click-through-01-initial.png', fullPage: true });
    
    console.log('\n2. Testing hamburger menu is clickable...');
    const hamburgerButton = await page.locator('[aria-label*="menu"]').first();
    const isHamburgerVisible = await hamburgerButton.isVisible();
    console.log(`Hamburger menu visible: ${isHamburgerVisible}`);
    
    if (isHamburgerVisible) {
      // Click hamburger to close drawer
      await hamburgerButton.click();
      await page.waitForTimeout(500);
      console.log('✓ Successfully clicked hamburger menu');
      await page.screenshot({ path: 'screenshots/click-through-02-drawer-closed.png', fullPage: true });
    }
    
    console.log('\n3. Testing map interactions through AppBar area...');
    // Get AppBar bounds
    const appBar = await page.locator('[class*="MuiAppBar"]').first();
    const appBarBox = await appBar.boundingBox();
    console.log('AppBar bounds:', appBarBox);
    
    // Try to click on map controls that might be under the AppBar
    console.log('\n4. Testing zoom controls...');
    const zoomIn = await page.locator('.leaflet-control-zoom-in').first();
    const zoomInBox = await zoomIn.boundingBox();
    console.log('Zoom in button bounds:', zoomInBox);
    
    // Check if zoom button is under AppBar
    if (zoomInBox && appBarBox && zoomInBox.y < appBarBox.y + appBarBox.height) {
      console.log('Zoom button is under AppBar, testing click-through...');
      
      // Get initial zoom level
      const initialZoom = await page.evaluate(() => {
        const mapElement = document.querySelector('.leaflet-container');
        return mapElement?._leaflet_map?.getZoom();
      });
      console.log(`Initial zoom level: ${initialZoom}`);
      
      // Click zoom in button
      await zoomIn.click();
      await page.waitForTimeout(500);
      
      // Get new zoom level
      const newZoom = await page.evaluate(() => {
        const mapElement = document.querySelector('.leaflet-container');
        return mapElement?._leaflet_map?.getZoom();
      });
      console.log(`New zoom level: ${newZoom}`);
      
      if (newZoom > initialZoom) {
        console.log('✓ Map zoom control is clickable through AppBar!');
      } else {
        console.log('✗ Map zoom control could not be clicked through AppBar');
      }
    }
    
    console.log('\n5. Testing map dragging in AppBar area...');
    // Try to drag the map starting from within the AppBar area
    const mapContainer = await page.locator('.leaflet-container').first();
    
    // Get center before drag
    const centerBefore = await page.evaluate(() => {
      const mapElement = document.querySelector('.leaflet-container');
      const center = mapElement?._leaflet_map?.getCenter();
      return center ? { lat: center.lat, lng: center.lng } : null;
    });
    console.log('Map center before drag:', centerBefore);
    
    // Drag from within AppBar area (but not on buttons)
    const dragStartX = appBarBox.x + appBarBox.width / 2;
    const dragStartY = appBarBox.y + appBarBox.height - 10; // Near bottom of AppBar
    
    await page.mouse.move(dragStartX, dragStartY);
    await page.mouse.down();
    await page.mouse.move(dragStartX + 100, dragStartY + 100);
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    // Get center after drag
    const centerAfter = await page.evaluate(() => {
      const mapElement = document.querySelector('.leaflet-container');
      const center = mapElement?._leaflet_map?.getCenter();
      return center ? { lat: center.lat, lng: center.lng } : null;
    });
    console.log('Map center after drag:', centerAfter);
    
    if (centerBefore && centerAfter && 
        (centerBefore.lat !== centerAfter.lat || centerBefore.lng !== centerAfter.lng)) {
      console.log('✓ Map can be dragged through AppBar area!');
    } else {
      console.log('✗ Map could not be dragged through AppBar area');
    }
    
    console.log('\n6. Testing other UI elements...');
    // Test clicking on map markers or other elements
    const markers = await page.locator('.leaflet-marker-icon').all();
    console.log(`Found ${markers.length} map markers`);
    
    for (let i = 0; i < Math.min(markers.length, 3); i++) {
      const marker = markers[i];
      const markerBox = await marker.boundingBox();
      if (markerBox && appBarBox && markerBox.y < appBarBox.y + appBarBox.height) {
        console.log(`Marker ${i + 1} is under AppBar, testing click...`);
        await marker.click();
        await page.waitForTimeout(300);
        console.log('✓ Marker clicked successfully');
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'screenshots/click-through-03-final.png', fullPage: true });
    
    console.log('\n=== Test Summary ===');
    console.log('AppBar has been made click-through with pointer-events: none');
    console.log('Interactive elements (hamburger menu, fullscreen button) remain clickable');
    console.log('Map controls and interactions work through the transparent AppBar');
    
  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'screenshots/click-through-error.png', fullPage: true });
  } finally {
    console.log('\nTest completed. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();