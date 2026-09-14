import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'public/screenshots');

export async function runPlaywrightSuite(testPlan, targetUrl, onStepProgress) {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  let browser;
  const executionResults = [];

  try {
    onStepProgress({ type: 'STATUS', message: 'Launching Playwright Chromium Browser...' });
    
    // Launch Playwright headless browser
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();

    onStepProgress({ type: 'STATUS', message: `Navigating to target web app: ${targetUrl}` });
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    for (let i = 0; i < testPlan.testCases.length; i++) {
      const tc = testPlan.testCases[i];
      const stepNum = i + 1;

      onStepProgress({
        type: 'STEP_START',
        stepIndex: stepNum,
        totalSteps: testPlan.testCases.length,
        testCase: tc
      });

      const startTime = Date.now();
      let status = 'PASSED';
      let actualOutput = '';
      let screenshotUrl = '';

      try {
        // Reset state or set input
        if (tc.actionType === 'fill_qty') {
          await page.fill('#quantity-input', String(tc.inputQty));
          await page.click('#update-qty-btn');
          await page.waitForTimeout(300);

          const isErrVisible = await page.isVisible('#validation-error');
          if (isErrVisible) {
            actualOutput = await page.innerText('#validation-error');
          } else {
            const subtotal = await page.innerText('#cart-subtotal');
            const total = await page.innerText('#cart-total');
            actualOutput = `Form Accepted. ${subtotal}, Total: ${total}`;
          }

          // Evaluate pass/fail matching expected behavior
          if (tc.shouldPass && isErrVisible) {
            status = 'FAILED';
          } else if (!tc.shouldPass && !isErrVisible) {
            status = 'FAILED';
          }
        } else if (tc.actionType === 'apply_coupon') {
          await page.fill('#quantity-input', String(tc.inputQty || 1));
          await page.fill('#coupon-input', tc.coupon);
          await page.click('#apply-coupon-btn');
          await page.waitForTimeout(300);

          actualOutput = await page.innerText('#coupon-feedback');
          const isSuccess = actualOutput.includes('✓');
          if (tc.shouldPass && !isSuccess) status = 'FAILED';
          if (!tc.shouldPass && isSuccess) status = 'FAILED';
        }

        // Capture step screenshot
        const screenshotFileName = `step-${stepNum}-${tc.id}.png`;
        const screenshotPath = path.join(SCREENSHOT_DIR, screenshotFileName);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        screenshotUrl = `/screenshots/${screenshotFileName}`;

      } catch (err) {
        status = 'FAILED';
        actualOutput = `Execution error: ${err.message}`;
      }

      const durationMs = Date.now() - startTime;
      const resultObj = {
        stepNum,
        testCase: tc,
        status,
        actualOutput,
        screenshotUrl,
        durationMs
      };

      executionResults.push(resultObj);

      onStepProgress({
        type: 'STEP_COMPLETE',
        stepIndex: stepNum,
        totalSteps: testPlan.testCases.length,
        result: resultObj
      });

      await page.waitForTimeout(200);
    }

    onStepProgress({ type: 'STATUS', message: 'Test execution suite completed.' });

  } catch (globalErr) {
    onStepProgress({ type: 'ERROR', message: globalErr.message });
  } finally {
    if (browser) await browser.close();
  }

  const passedCount = executionResults.filter(r => r.status === 'PASSED').length;
  const failedCount = executionResults.filter(r => r.status === 'FAILED').length;

  return {
    summary: {
      total: executionResults.length,
      passed: passedCount,
      failed: failedCount,
      passRate: ((passedCount / executionResults.length) * 100).toFixed(1) + '%'
    },
    results: executionResults
  };
}
