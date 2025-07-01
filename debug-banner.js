import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to the app...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for everything to render
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/debug-banner-issue.png', fullPage: true });
    
    // Get AppBar element info
    console.log('\n=== AppBar Analysis ===');
    const appBar = await page.locator('[class*="MuiAppBar"]').first();
    if (await appBar.count() > 0) {
      const appBarBox = await appBar.boundingBox();
      console.log('AppBar position:', appBarBox);
      
      const appBarStyles = await appBar.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          position: computed.position,
          zIndex: computed.zIndex,
          backgroundColor: computed.backgroundColor,
          top: computed.top,
          left: computed.left,
          width: computed.width,
          height: computed.height
        };
      });
      console.log('AppBar computed styles:', appBarStyles);
    } else {
      console.log('AppBar not found!');
    }
    
    // Get Map container info
    console.log('\n=== Map Container Analysis ===');
    const mapContainer = await page.locator('.leaflet-container').first();
    if (await mapContainer.count() > 0) {
      const mapBox = await mapContainer.boundingBox();
      console.log('Map position:', mapBox);
      
      const mapStyles = await mapContainer.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          position: computed.position,
          zIndex: computed.zIndex,
          top: computed.top,
          left: computed.left,
          width: computed.width,
          height: computed.height
        };
      });
      console.log('Map computed styles:', mapStyles);
    } else {
      console.log('Map container not found!');
    }
    
    // Get main content box info
    console.log('\n=== Main Content Box Analysis ===');
    const mainBox = await page.locator('main').first();
    if (await mainBox.count() > 0) {
      const mainBoxBounds = await mainBox.boundingBox();
      console.log('Main box position:', mainBoxBounds);
      
      const mainStyles = await mainBox.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          position: computed.position,
          top: computed.top,
          left: computed.left,
          zIndex: computed.zIndex
        };
      });
      console.log('Main box computed styles:', mainStyles);
    }
    
    // Check z-index hierarchy
    console.log('\n=== Z-Index Hierarchy ===');
    const elements = await page.locator('*').all();
    const zIndexMap = new Map();
    
    for (const element of elements.slice(0, 100)) { // Check first 100 elements
      try {
        const zIndex = await element.evaluate(el => window.getComputedStyle(el).zIndex);
        if (zIndex !== 'auto' && zIndex !== '0') {
          const tagName = await element.evaluate(el => el.tagName);
          const className = await element.evaluate(el => el.className);
          zIndexMap.set(`${tagName}.${className}`, zIndex);
        }
      } catch (e) {
        // Skip if element is no longer attached
      }
    }
    
    console.log('Elements with z-index:', Object.fromEntries(zIndexMap));
    
    console.log('\nDebug complete. Check screenshots/debug-banner-issue.png');
    
  } catch (error) {
    console.error('Error during debug:', error);
    await page.screenshot({ path: 'screenshots/debug-error.png', fullPage: true });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();