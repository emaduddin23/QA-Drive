import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'public/screenshots');

let activeInteractiveBrowser = null;
let activeInteractivePage = null;
let interactiveStepCount = 0;

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

    let formattedUrl = (targetUrl || '').trim();
    if (!formattedUrl) {
      formattedUrl = 'https://example.com';
    } else if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    onStepProgress({ type: 'STATUS', message: `Navigating to target web app: ${formattedUrl}` });
    await page.goto(formattedUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(err => {
      onStepProgress({ type: 'STATUS', message: `Initial navigation warning: ${err.message}` });
    });

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

export async function startInteractiveSession(targetUrl, onStepProgress) {
  if (activeInteractiveBrowser) {
    return { success: true, message: 'Interactive session already running.' };
  }
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  onStepProgress({ type: 'STATUS', message: 'Launching Interactive Playwright Browser...' });
  activeInteractiveBrowser = await chromium.launch({ headless: false });
  const context = await activeInteractiveBrowser.newContext({ viewport: { width: 1024, height: 768 } });
  activeInteractivePage = await context.newPage();
  interactiveStepCount = 0;

  if (targetUrl) {
    onStepProgress({ type: 'STATUS', message: `Navigating to ${targetUrl}` });
    await activeInteractivePage.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  }

  return { success: true };
}

export async function executeInteractiveActions(actions, onStepProgress) {
  if (!activeInteractivePage) {
    throw new Error("No active interactive session. Please start one first.");
  }

  interactiveStepCount++;
  const stepNum = interactiveStepCount;

  onStepProgress({
    type: 'STEP_START',
    stepIndex: stepNum,
    totalSteps: '?',
    testCase: { title: 'Live Interactive Command', id: `INT-${stepNum}` }
  });

  const startTime = Date.now();
  let status = 'PASSED';
  let actualOutput = 'Interactive actions executed successfully';
  let screenshotUrl = '';

  try {
    if (actions && Array.isArray(actions)) {
      for (const action of actions) {
        onStepProgress({ type: 'STATUS', message: `Executing action: ${action.type} ${action.selector || action.url || ''}` });
        
        if (action.type === 'goto') {
          await activeInteractivePage.goto(action.url, { waitUntil: 'domcontentloaded' });
        } else if (action.type === 'fill') {
          await activeInteractivePage.waitForSelector(action.selector, { state: 'visible', timeout: 5000 }).catch(() => {});
          await activeInteractivePage.fill(action.selector, String(action.value));
        } else if (action.type === 'click') {
          await activeInteractivePage.waitForSelector(action.selector, { state: 'visible', timeout: 5000 }).catch(() => {});
          await activeInteractivePage.click(action.selector);
        } else if (action.type === 'wait') {
          await activeInteractivePage.waitForTimeout(action.timeout || 1000);
        } else if (action.type === 'press') {
          await activeInteractivePage.keyboard.press(action.key);
        }
      }
    }

    const screenshotFileName = `interactive-${stepNum}-${Date.now()}.png`;
    const screenshotPath = path.join(SCREENSHOT_DIR, screenshotFileName);
    await activeInteractivePage.screenshot({ path: screenshotPath, fullPage: false });
    screenshotUrl = `/screenshots/${screenshotFileName}`;
  } catch (err) {
    status = 'FAILED';
    actualOutput = `Execution error: ${err.message}`;
  }

  const durationMs = Date.now() - startTime;
  const resultObj = {
    stepNum,
    testCase: { title: 'Live Interactive Command', id: `INT-${stepNum}`, technique: 'Manual' },
    status,
    actualOutput,
    screenshotUrl,
    durationMs
  };

  onStepProgress({
    type: 'STEP_COMPLETE',
    stepIndex: stepNum,
    totalSteps: '?',
    result: resultObj
  });

  return resultObj;
}

export async function stopInteractiveSession() {
  if (activeInteractiveBrowser) {
    await activeInteractiveBrowser.close();
    activeInteractiveBrowser = null;
    activeInteractivePage = null;
  }
  return { success: true };
}
