import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { agentBrain } from './qa-agent-brain.js';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'public/screenshots');

async function getPageState(page) {
  // A simple function to extract interactive elements from the DOM
  return await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('a, button, input, select, textarea, [role="button"], [role="link"]'));
    return elements.map((el, i) => {
      const tag = el.tagName.toLowerCase();
      const text = el.innerText || el.value || el.placeholder || el.name || el.id || '';
      const id = el.id ? `#${el.id}` : '';
      const className = el.className && typeof el.className === 'string' ? `.${el.className.split(' ').join('.')}` : '';
      let selector = id || className;
      if (!selector) {
        if (el.name) selector = `[name="${el.name}"]`;
        else selector = tag; // Fallback
      }
      return `[${i}] <${tag} selector="${selector}"> ${text.substring(0, 50).replace(/\n/g, ' ')} </${tag}>`;
    }).slice(0, 100).join('\n'); // Limit to 100 elements to avoid massive tokens
  });
}

export async function startAutonomousTesting(url, username, password, apiKey, provider, modelName, knowledgeDocs, goalPrompt, onStepProgress) {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  onStepProgress({ type: 'STATUS', message: 'Starting Autonomous QA Explorer...' });
  let browser;
  const executionResults = [];
  const pastActions = [];

  try {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();

    onStepProgress({ type: 'STATUS', message: `Navigating to ${url}` });
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Initial Login Step (if credentials provided)
    if (username && password) {
      onStepProgress({ type: 'STATUS', message: `Attempting auto-login with provided credentials...` });
      pastActions.push({ action: 'login', username });
      const loginPrompt = `Find the login fields and submit them with username: ${username} and password: ${password}`;
      
      const loginActions = await agentBrain.translateInteractiveCommand(loginPrompt, apiKey, provider, modelName);
      if (Array.isArray(loginActions)) {
        for (const action of loginActions) {
          if (action.type === 'fill') await page.fill(action.selector, action.value).catch(() => {});
          else if (action.type === 'click') await page.click(action.selector).catch(() => {});
        }
        await page.waitForTimeout(2000); // wait for redirect
      }
    }

    // Main Autonomous Loop
    const MAX_STEPS = 10;
    for (let stepNum = 1; stepNum <= MAX_STEPS; stepNum++) {
      onStepProgress({ type: 'STATUS', message: `Analyzing page state (Step ${stepNum}/${MAX_STEPS})...` });
      
      const pageState = await getPageState(page);
      
      onStepProgress({ type: 'STATUS', message: `Deciding next action...` });
      const decision = await agentBrain.decideNextAutonomousAction({
        pageState,
        pastActions,
        targetUrl: url,
        stepNum,
        apiKey,
        provider,
        modelName,
        knowledgeDocs,
        goalPrompt
      });

      if (decision.isDone) {
        onStepProgress({ type: 'STATUS', message: `Autonomous agent decided testing is complete.` });
        break;
      }

      onStepProgress({
        type: 'STEP_START',
        stepIndex: stepNum,
        totalSteps: MAX_STEPS,
        testCase: { title: decision.testCase?.title || `Autonomous Step ${stepNum}`, id: `AUTO-${stepNum}` }
      });

      const startTime = Date.now();
      let status = 'PASSED';
      let actualOutput = 'Action executed successfully';
      let screenshotUrl = '';

      try {
        if (decision.actions && Array.isArray(decision.actions)) {
          for (const action of decision.actions) {
            if (action.type === 'goto') await page.goto(action.url, { waitUntil: 'domcontentloaded' });
            else if (action.type === 'fill') await page.fill(action.selector, String(action.value)).catch(()=> { actualOutput = `Failed to find selector ${action.selector}`});
            else if (action.type === 'click') await page.click(action.selector).catch(()=> { actualOutput = `Failed to find selector ${action.selector}`});
            else if (action.type === 'wait') await page.waitForTimeout(action.timeout || 1000);
          }
        }
        
        // Let UI settle before screenshot
        await page.waitForTimeout(1000);
        
        const screenshotFileName = `auto-${stepNum}-${Date.now()}.png`;
        const screenshotPath = path.join(SCREENSHOT_DIR, screenshotFileName);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        screenshotUrl = `/screenshots/${screenshotFileName}`;
        
        pastActions.push(decision.testCase?.title || `Step ${stepNum}`);

      } catch (err) {
        status = 'FAILED';
        actualOutput = `Error: ${err.message}`;
      }

      const resultObj = {
        stepNum,
        testCase: {
          id: `AUTO-${stepNum}`,
          title: decision.testCase?.title || `Autonomous Step ${stepNum}`,
          technique: decision.testCase?.technique || 'Exploratory',
          expectedResult: decision.testCase?.expectedResult || 'Expected application to respond correctly'
        },
        status,
        actualOutput,
        screenshotUrl,
        durationMs: Date.now() - startTime
      };

      executionResults.push(resultObj);
      onStepProgress({ type: 'STEP_COMPLETE', stepIndex: stepNum, totalSteps: MAX_STEPS, result: resultObj });
    }

    onStepProgress({ type: 'STATUS', message: `Finished autonomous run.` });
    
  } catch (err) {
    console.error("Autonomous Engine Error:", err);
    onStepProgress({ type: 'STATUS', message: `Error: ${err.message}` });
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
      passRate: executionResults.length > 0 ? ((passedCount / executionResults.length) * 100).toFixed(1) + '%' : '0%'
    },
    results: executionResults
  };
}
