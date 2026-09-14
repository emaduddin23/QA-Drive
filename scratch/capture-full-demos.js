import { chromium } from 'playwright';

async function captureFullDemos() {
  console.log("Launching Playwright to capture Dark Mode and White Mode full UIs...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // 1. In Dark Mode: Generate a full plan to populate the UI with rich data
  console.log("Generating plan in Dark Mode...");
  const analyzeBtn = page.locator('button:has-text("Analyze & Plan")');
  await analyzeBtn.click();
  await page.waitForTimeout(1000);

  // Take screenshot of Dark Mode with full UI & test matrix
  await page.screenshot({ path: 'public/screenshots/full-dark-mode.png' });
  console.log("Captured full Dark Mode UI -> public/screenshots/full-dark-mode.png");

  // 2. Toggle to White / Light Mode
  console.log("Toggling to White / Light Mode...");
  const toggleBtn = page.locator('button[title="Switch to Light Mode"], button[title="Switch to Dark Mode"]');
  await toggleBtn.click();
  await page.waitForTimeout(600);

  // Take screenshot of White / Light Mode with full UI & test matrix
  await page.screenshot({ path: 'public/screenshots/full-light-mode.png' });
  console.log("Captured full White Mode UI -> public/screenshots/full-light-mode.png");

  await browser.close();
  console.log("Done capturing both visual states!");
}

captureFullDemos();
