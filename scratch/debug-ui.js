import { chromium } from 'playwright';

(async () => {
  console.log("Launching headless Chromium...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('BROWSER PAGE ERROR:', err));

  console.log("Navigating to http://localhost:5173...");
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  console.log("Page title:", await page.title());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("Body inner text length:", bodyText.length);
  console.log("Body inner text:", bodyText);

  await page.screenshot({ path: 'scratch/debug-ui.png', fullPage: true });
  console.log("Screenshot saved to scratch/debug-ui.png");

  await browser.close();
})();
