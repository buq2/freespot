import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to the app...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/app-initial.png', fullPage: true });
    console.log('Screenshot: app-initial.png');

    // Wait a bit for the app to fully load
    await page.waitForTimeout(3000);

    // Go to weather tab
    console.log('Going to Weather tab...');
    await page.locator('text=WEATHER').click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/weather-tab.png', fullPage: true });
    console.log('Screenshot: weather-tab.png');

    // Go to parameters tab
    console.log('Going to Parameters tab...');
    await page.locator('text=PARAMETERS').click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/parameters-tab.png', fullPage: true });
    console.log('Screenshot: parameters-tab.png');

    // Go to results tab
    console.log('Going to Results tab...');
    await page.locator('text=RESULTS').click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/results-tab.png', fullPage: true });
    console.log('Screenshot: results-tab.png');

    // Extract text from the page for analysis
    const pageText = await page.textContent('body');
    const lines = pageText.split('\n').filter(line => line.trim().length > 0);
    
    console.log('\nLooking for heading and wind information...');
    lines.forEach(line => {
      if (line.includes('°') || 
          line.toLowerCase().includes('heading') || 
          line.toLowerCase().includes('direction') ||
          line.toLowerCase().includes('wind') ||
          line.toLowerCase().includes('aircraft')) {
        console.log(`Found: ${line.trim()}`);
      }
    });

    console.log('\nTest completed. Check the screenshots folder for images.');
    
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'screenshots/error.png', fullPage: true });
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();