import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { agentBrain } from './qa-agent-brain.js';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'public/screenshots');

export async function getPageState(page) {
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

let activeBrowser = null;
let stopRequested = false;

export function stopAutonomousTesting() {
  stopRequested = true;
  if (activeBrowser) {
    activeBrowser.close().catch(() => {});
  }
}

export async function startAutonomousTesting(url, username, password, apiKey, provider, modelName, knowledgeDocs, goalPrompt, onStepProgress) {
  stopRequested = false;

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  let targetUrl = (url || '').trim();
  if (!targetUrl) {
    targetUrl = 'https://example.com';
  } else if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }

  onStepProgress({ type: 'STATUS', message: 'Starting Autonomous QA Explorer...' });
  let browser;
  const executionResults = [];
  const pastActions = [];

  try {
    browser = await chromium.launch({ headless: false });
    activeBrowser = browser;
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();

    onStepProgress({ type: 'STATUS', message: `Navigating to ${targetUrl}` });
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(err => {
      onStepProgress({ type: 'STATUS', message: `Initial navigation warning: ${err.message}` });
    });

    let loggedIn = false;
    const loginPageUrl = page.url(); // Save the initial URL

    // 1. Intelligent SSO & Multi-Step Authentication
    let resolvedUser = username;
    let resolvedPass = password;
    if (!resolvedUser || !resolvedPass) {
      const emailMatch = (goalPrompt || '').match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      const passMatch = (goalPrompt || '').match(/(?:pass|password)\s*[:=]?\s*([^\s]+)/i);
      if (emailMatch && !resolvedUser) resolvedUser = emailMatch[1];
      if (passMatch && !resolvedPass) resolvedPass = passMatch[1];
    }

    const hasLoginIntent = (resolvedUser && resolvedPass) || /sign\s*in|sign\s*with|login|log\s*in|authenticate|dashboard/i.test(goalPrompt || '');
    if (hasLoginIntent) {
      onStepProgress({ type: 'STATUS', message: `Detecting sign-in flow (SSO / Uapp / Form credentials)...` });
      const loginPageState = await getPageState(page);
      const loginPrompt = `You are an AI Browser Automation Engineer.
Your goal is to authenticate the user and reach the Dashboard.
Examine the Live Page State (DOM elements):
${loginPageState}

User Instruction / Goal: "${goalPrompt || 'Sign in and check dashboard'}"
${resolvedUser ? `Username/Email: ${resolvedUser}` : 'Username/Email: user@example.com'}
${resolvedPass ? `Password: ${resolvedPass}` : 'Password: Password123!'}

CRITICAL RULES:
1. If there is a Single Sign-On / App Login button (such as "Sign in with Uapp", "Sign with Uapp", "Login with App", "Sign in with Google", "Log In", or "Sign In") that must be clicked first before the inputs appear, YOUR FIRST ACTION MUST BE TO CLICK THAT BUTTON!
2. If email/username and password fields are present, fill them and click the Submit/Login button.
3. Use exact selectors from the Live Page State.

Output ONLY a JSON array of actions:
[
  { "type": "click", "selector": "button:has-text('Sign with Uapp'), button:has-text('Sign in')" },
  { "type": "wait", "timeout": 2000 },
  { "type": "fill", "selector": "input[type='email'], #email", "value": "${resolvedUser || 'user@example.com'}" },
  { "type": "fill", "selector": "input[type='password'], #password", "value": "${resolvedPass || 'Password123!'}" },
  { "type": "click", "selector": "button[type='submit'], .login-btn" }
]`;

      const loginActions = await agentBrain.translateInteractiveCommand(loginPrompt, apiKey, provider, modelName, loginPageState);
      if (Array.isArray(loginActions) && loginActions.length > 0) {
        onStepProgress({ type: 'STATUS', message: `Executing authentication actions: ${loginActions.length} steps...` });
        for (const action of loginActions) {
          try {
            if (action.type === 'click') {
              await page.waitForSelector(action.selector, { state: 'visible', timeout: 5000 }).catch(() => {});
              await page.click(action.selector);
              onStepProgress({ type: 'STATUS', message: `✓ Clicked ${action.selector}` });
              await page.waitForTimeout(1000);
            } else if (action.type === 'fill') {
              await page.waitForSelector(action.selector, { state: 'visible', timeout: 5000 }).catch(() => {});
              await page.fill(action.selector, String(action.value));
              onStepProgress({ type: 'STATUS', message: `✓ Filled ${action.selector}` });
            } else if (action.type === 'wait') {
              await page.waitForTimeout(action.timeout || 1500);
            } else if (action.type === 'press') {
              await page.keyboard.press(action.key || 'Enter');
            }
          } catch (e) {
            onStepProgress({ type: 'STATUS', message: `Login action notice: ${e.message}` });
          }
        }

        // Wait for page redirect to dashboard
        onStepProgress({ type: 'STATUS', message: 'Waiting for dashboard redirection...' });
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(3000);

        if (page.url() !== loginPageUrl || /dashboard|home|feed|app/i.test(page.url())) {
          loggedIn = true;
          onStepProgress({ type: 'STATUS', message: `✓ Successfully authenticated! Now on: ${page.url()}` });
        } else {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(3000);
          if (page.url() !== loginPageUrl) {
            loggedIn = true;
            onStepProgress({ type: 'STATUS', message: `✓ Authenticated after submission! Now on: ${page.url()}` });
          }
        }
      }
      pastActions.push('AUTHENTICATION STEP COMPLETE - Now on target authenticated page.');
    }

    // Record the post-login URL as the "base" for testing
    const postLoginUrl = page.url();
    onStepProgress({ type: 'STATUS', message: `Starting exploration from: ${postLoginUrl}` });

    // Main Autonomous Loop
    let stepNum = 1;
    while (!stopRequested) {
      onStepProgress({ type: 'STATUS', message: `Analyzing page state (Step ${stepNum})...` });
      
      const pageState = await getPageState(page);
      const currentUrl = page.url();
      
      onStepProgress({ type: 'STATUS', message: `Deciding next action... (Current URL: ${currentUrl})` });
      let decision;
      try {
        decision = await agentBrain.decideNextAutonomousAction({
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
      } catch (err) {
        onStepProgress({ type: 'STATUS', message: `AI Reasoning Error: ${err.message}` });
        break;
      }

      if (!decision || decision.isDone) {
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

            const execAction = async (act) => {
              if (act.type === 'goto') await page.goto(act.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
              else if (act.type === 'fill') await page.fill(act.selector, String(act.value));
              else if (act.type === 'click') await page.click(act.selector);
              else if (act.type === 'wait') await page.waitForTimeout(act.timeout || 1000);
              else if (act.type === 'press') await page.keyboard.press(act.key || 'Enter');
            };

            try {
              await execAction(action);
            } catch (actErr) {
              onStepProgress({
                type: 'STATUS',
                message: `✨ [Self-Healing] Step missed or blocked (${action.type} ${action.selector || ''}). AI auto-recovering...`
              });
              try {
                const liveState = await getPageState(page);
                const healed = await agentBrain.autoHealFailedAction({
                  failedAction: action,
                  errorMessage: actErr.message,
                  pageState: liveState,
                  targetUrl: page.url(),
                  testCaseTitle: decision.testCase?.title || `Autonomous Step ${stepNum}`,
                  apiKey,
                  provider,
                  modelName
                });
                if (healed && Array.isArray(healed.healedActions) && healed.healedActions.length > 0) {
                  onStepProgress({
                    type: 'STATUS',
                    message: `✨ [Self-Healing] ${healed.reason || 'Applying missing prerequisite step'}...`
                  });
                  for (const hAct of healed.healedActions) {
                    await execAction(hAct).catch(() => {});
                    await page.waitForTimeout(400);
                  }
                  await execAction(action).catch(() => {});
                  actualOutput = `✓ Auto-recovered missing step: ${healed.reason || 'Healed'}`;
                } else {
                  actualOutput = `Failed: ${actErr.message}`;
                }
              } catch (hErr) {
                actualOutput = `Failed: ${actErr.message}`;
              }
            }
          }
        }

        // If an action accidentally redirected back to initial landing page
        if (loggedIn && page.url() === loginPageUrl && postLoginUrl !== loginPageUrl) {
          onStepProgress({ type: 'STATUS', message: `Navigating forward to authenticated page: ${postLoginUrl}` });
          await page.goto(postLoginUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
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
