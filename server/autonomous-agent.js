import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { agentBrain } from './qa-agent-brain.js';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'public/screenshots');

async function getPageState(page) {
  // Extract interactive elements with detailed selector info
  return await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('a, button, input, select, textarea, [role="button"], [role="link"]'));
    return elements.map((el, i) => {
      const tag = el.tagName.toLowerCase();
      const text = (el.innerText || el.textContent || '').trim().substring(0, 60).replace(/\n/g, ' ');
      const type = el.type || '';
      const id = el.id || '';
      const name = el.name || '';
      const placeholder = el.placeholder || '';
      const ariaLabel = el.getAttribute('aria-label') || '';
      const href = el.href || '';
      const value = (tag === 'input' || tag === 'textarea') ? (el.value || '').substring(0, 30) : '';

      // Build the best possible selector
      let selector = '';
      if (id) selector = `#${id}`;
      else if (name) selector = `[name="${name}"]`;
      else if (type && tag === 'input') selector = `input[type="${type}"]`;
      else selector = tag;

      // Build a descriptive line
      let desc = `[${i}] <${tag}`;
      if (type) desc += ` type="${type}"`;
      if (id) desc += ` id="${id}"`;
      if (name) desc += ` name="${name}"`;
      if (placeholder) desc += ` placeholder="${placeholder}"`;
      if (ariaLabel) desc += ` aria-label="${ariaLabel}"`;
      desc += ` selector="${selector}"`;
      if (text) desc += `> ${text}`;
      else if (value) desc += `> value="${value}"`;
      else desc += `>`;
      if (href) desc += ` href="${href}"`;
      desc += ` </${tag}>`;
      return desc;
    }).slice(0, 100).join('\n');
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
    await page.goto(url, { waitUntil: 'networkidle' });

    let loggedIn = false;
    const loginPageUrl = page.url(); // Save the login page URL before login

    // Initial Login Step (if credentials provided)
    if (username && password) {
      onStepProgress({ type: 'STATUS', message: `Attempting auto-login with provided credentials...` });
      const loginPrompt = `Look at the page state below and find the email/username input field and password input field. Fill them and click the login/submit button.
Username/Email: ${username}
Password: ${password}

IMPORTANT: Use the EXACT selectors from the page state. Do not guess.`;
      
      const loginPageState = await getPageState(page);
      onStepProgress({ type: 'STATUS', message: `Login page state: ${loginPageState.substring(0, 300)}...` });
      
      const loginActions = await agentBrain.translateInteractiveCommand(loginPrompt, apiKey, provider, modelName, loginPageState);
      if (Array.isArray(loginActions)) {
        onStepProgress({ type: 'STATUS', message: `Login actions: ${JSON.stringify(loginActions)}` });
        for (const action of loginActions) {
          try {
            if (action.type === 'fill') {
              await page.fill(action.selector, action.value, { timeout: 5000 });
              onStepProgress({ type: 'STATUS', message: `✓ Filled ${action.selector}` });
            }
            else if (action.type === 'click') {
              await page.click(action.selector, { timeout: 5000 });
              onStepProgress({ type: 'STATUS', message: `✓ Clicked ${action.selector}` });
            }
            else if (action.type === 'wait') await page.waitForTimeout(action.timeout || 1000);
            else if (action.type === 'press') await page.keyboard.press(action.key || 'Enter');
          } catch (e) {
            onStepProgress({ type: 'STATUS', message: `✗ Login action failed: ${action.type} ${action.selector} — ${e.message}` });
          }
        }

        // Wait for navigation/redirect after login
        onStepProgress({ type: 'STATUS', message: `Waiting for login redirect...` });
        try {
          await page.waitForURL((url) => url.toString() !== loginPageUrl, { timeout: 10000 });
          loggedIn = true;
          onStepProgress({ type: 'STATUS', message: `✓ Login successful! Redirected to: ${page.url()}` });
        } catch (e) {
          // URL didn't change — try pressing Enter as fallback
          onStepProgress({ type: 'STATUS', message: `URL did not change. Trying Enter key as fallback...` });
          await page.keyboard.press('Enter');
          await page.waitForTimeout(5000);
          if (page.url() !== loginPageUrl) {
            loggedIn = true;
            onStepProgress({ type: 'STATUS', message: `✓ Login successful after Enter! Now at: ${page.url()}` });
          } else {
            onStepProgress({ type: 'STATUS', message: `✗ Login may have failed. Still at: ${page.url()}. Proceeding anyway...` });
            loggedIn = true; // Mark as logged in anyway to prevent re-testing login
          }
        }
      } else {
        onStepProgress({ type: 'STATUS', message: `Failed to parse login actions. Proceeding without login.` });
      }

      pastActions.push('LOGIN COMPLETED - Authentication done. Do NOT revisit login page or test login forms.');
    }

    // Record the post-login URL as the "base" for testing
    const postLoginUrl = page.url();
    onStepProgress({ type: 'STATUS', message: `Starting testing from: ${postLoginUrl}` });

    // Main Autonomous Loop
    let stepNum = 1;
    while (true) {
      onStepProgress({ type: 'STATUS', message: `Analyzing page state (Step ${stepNum})...` });
      
      const pageState = await getPageState(page);
      const currentUrl = page.url();
      
      onStepProgress({ type: 'STATUS', message: `Deciding next action... (Current URL: ${currentUrl})` });
      const decision = await agentBrain.decideNextAutonomousAction({
        pageState,
        pastActions,
        targetUrl: postLoginUrl, // Use post-login URL, not the original login page URL
        stepNum,
        apiKey,
        provider,
        modelName,
        knowledgeDocs,
        goalPrompt,
        loggedIn
      });

      if (decision.isDone) {
        onStepProgress({ type: 'STATUS', message: `Autonomous agent decided testing is complete.` });
        break;
      }

      if (decision.referencedDocs && decision.referencedDocs.length > 0) {
        onStepProgress({ type: 'STATUS', message: `Using knowledge docs: ${decision.referencedDocs.join(', ')}` });
      }

      onStepProgress({
        type: 'STEP_START',
        stepIndex: stepNum,
        totalSteps: '∞',
        testCase: { title: decision.testCase?.title || `Autonomous Step ${stepNum}`, id: `AUTO-${stepNum}` }
      });

      const startTime = Date.now();
      let status = 'PASSED';
      let actualOutput = 'Action executed successfully';
      let screenshotUrl = '';

      try {
        if (decision.actions && Array.isArray(decision.actions)) {
          for (const action of decision.actions) {
            // BLOCK any action that tries to navigate to login page
            if (loggedIn && action.type === 'goto') {
              const targetLower = (action.url || '').toLowerCase();
              if (targetLower.includes('login') || targetLower.includes('signin') || targetLower.includes('sign-in') || targetLower === loginPageUrl.toLowerCase()) {
                onStepProgress({ type: 'STATUS', message: `⛔ Blocked navigation to login page: ${action.url}` });
                actualOutput = 'Blocked: Attempted to navigate back to login page';
                continue;
              }
            }

            // BLOCK clicking logout buttons
            if (loggedIn && action.type === 'click') {
              const selectorLower = (action.selector || '').toLowerCase();
              if (selectorLower.includes('logout') || selectorLower.includes('log-out') || selectorLower.includes('sign-out') || selectorLower.includes('signout')) {
                onStepProgress({ type: 'STATUS', message: `⛔ Blocked logout click: ${action.selector}` });
                actualOutput = 'Blocked: Attempted to click logout';
                continue;
              }
            }

            if (action.type === 'goto') await page.goto(action.url, { waitUntil: 'domcontentloaded' });
            else if (action.type === 'fill') await page.fill(action.selector, String(action.value)).catch(()=> { actualOutput = `Failed to find selector ${action.selector}`});
            else if (action.type === 'click') await page.click(action.selector).catch(()=> { actualOutput = `Failed to find selector ${action.selector}`});
            else if (action.type === 'wait') await page.waitForTimeout(action.timeout || 1000);
            else if (action.type === 'press') await page.keyboard.press(action.key || 'Enter');
          }
        }

        // Check if we accidentally landed on login page after actions
        if (loggedIn && page.url().toLowerCase().includes('login')) {
          onStepProgress({ type: 'STATUS', message: `⚠️ Detected redirect to login page. Navigating back to: ${postLoginUrl}` });
          await page.goto(postLoginUrl, { waitUntil: 'networkidle' });
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
          technique: (decision.testCase?.technique || 'Exploratory') + (decision.referencedDocs && decision.referencedDocs.length > 0 ? ` [Docs: ${decision.referencedDocs.join(', ')}]` : ''),
          expectedResult: decision.testCase?.expectedResult || 'Expected application to respond correctly'
        },
        status,
        actualOutput,
        screenshotUrl,
        durationMs: Date.now() - startTime
      };

      executionResults.push(resultObj);
      onStepProgress({ type: 'STEP_COMPLETE', stepIndex: stepNum, totalSteps: '∞', result: resultObj });
      stepNum++;
    }

    onStepProgress({ type: 'STATUS', message: `Finished autonomous run after ${stepNum - 1} steps.` });
    
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
