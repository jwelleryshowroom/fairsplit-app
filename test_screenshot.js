const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }});
  await page.goto('http://localhost:5173');
  // Wait for the app to load
  await page.waitForTimeout(2000);
  
  // Enter a group name and enter group
  await page.fill('input[type="text"]', 'Test Group');
  await page.click('button:has-text("Create New Group")');
  await page.waitForTimeout(2000);
  
  // Click Show Results to trigger results mode
  await page.click('button:has-text("Show Results")');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: '/tmp/test_shot.png' });
  await browser.close();
})();
