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
    
    // Launch Playwright headed browser for visual feedback
    browser = await chromium.launch({ headless: false });
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
        // Execute dynamic actions
        actualOutput = "Actions executed successfully";
        if (tc.actions && Array.isArray(tc.actions)) {
          for (let a = 0; a < tc.actions.length; a++) {
            const action = tc.actions[a];
            onStepProgress({ type: 'STATUS', message: `Executing action: ${action.type} ${action.selector || action.url || ''}` });
            
            if (action.type === 'goto') {
              await page.goto(action.url, { waitUntil: 'domcontentloaded' });
            } else if (action.type === 'fill') {
              // Wait for element to be visible before filling
              await page.waitForSelector(action.selector, { state: 'visible', timeout: 5000 }).catch(() => {});
              await page.fill(action.selector, String(action.value));
            } else if (action.type === 'click') {
              await page.waitForSelector(action.selector, { state: 'visible', timeout: 5000 }).catch(() => {});
              await page.click(action.selector);
            } else if (action.type === 'wait') {
              await page.waitForTimeout(action.timeout || 1000);
            } else if (action.type === 'press') {
              await page.keyboard.press(action.key);
            }
          }
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
