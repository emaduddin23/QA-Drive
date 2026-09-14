import { chromium } from 'playwright';

async function testThemeToggle() {
  console.log("Launching Playwright to test Dark/Light Theme Toggle...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Check initial theme class on html tag
  const initialTheme = await page.getAttribute('html', 'class');
  console.log(`Initial HTML theme class: "${initialTheme}"`);

  // Take screenshot in Dark Mode
  await page.screenshot({ path: 'public/screenshots/theme-dark-mode.png' });
  console.log("Captured Dark Mode screenshot -> public/screenshots/theme-dark-mode.png");

  // Click the theme toggle button (title="Switch to Light Mode")
  const toggleBtn = page.locator('button[title="Switch to Light Mode"], button[title="Switch to Dark Mode"]');
  await toggleBtn.click();
  await page.waitForTimeout(500);

  // Check new theme class on html tag
  const newTheme = await page.getAttribute('html', 'class');
  console.log(`Updated HTML theme class after click: "${newTheme}"`);

  // Take screenshot in Light Mode
  await page.screenshot({ path: 'public/screenshots/theme-light-mode.png' });
  console.log("Captured Light Mode screenshot -> public/screenshots/theme-light-mode.png");

  // Toggle back to verify bi-directional switching
  await toggleBtn.click();
  await page.waitForTimeout(500);
  const revertedTheme = await page.getAttribute('html', 'class');
  console.log(`Reverted HTML theme class after 2nd click: "${revertedTheme}"`);

  await browser.close();

  if (newTheme.includes('light') && revertedTheme.includes('dark')) {
    console.log("SUCCESS: Dark to White theme toggle test PASSED 100%!");
  } else {
    console.error("FAILED: Theme toggle did not update html class properly.");
    process.exit(1);
  }
}

testThemeToggle();
