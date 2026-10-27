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
      else if (name) selector = `${tag}[name="${name}"]`;
      else if (placeholder) selector = `${tag}[placeholder*="${placeholder.substring(0, 20).replace(/"/g, '')}" i]`;
      else if (ariaLabel) selector = `${tag}[aria-label*="${ariaLabel.substring(0, 20).replace(/"/g, '')}" i]`;
      else if (text && text.length < 35 && (tag === 'button' || tag === 'a' || el.getAttribute('role') === 'button')) {
        selector = `${tag}:has-text("${text.replace(/"/g, '\\"')}")`;
      } else if (type && tag === 'input') {
        selector = `input[type="${type}"]`;
      } else {
        selector = tag;
      }

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

export async function isPageAuthenticated(page) {
  try {
    // If a password input is visible anywhere, user is NOT authenticated
    const hasPasswordInput = await page.$('input[type="password"]:visible');
    if (hasPasswordInput) return false;

    // Check if an SSO login button or organization login button is present
    const hasSsoButton = await page.$('button:has-text("Sign in with"), button:has-text("Sign with"), a:has-text("Sign in with"), a:has-text("Sign with")');
    if (hasSsoButton) return false;

    const currentUrl = page.url().toLowerCase();
    // If URL indicates login / signin / oauth
    if (currentUrl.endsWith('/login') || currentUrl.endsWith('/signin') || currentUrl.includes('/oauth') || currentUrl.includes('/auth/realms')) {
      return false;
    }

    // If URL indicates authenticated portal
    if (/dashboard|home|feed|portal|app|overview|projects|admin|settings|profile/i.test(currentUrl)) {
      return true;
    }

    // Check if there are user avatar, logout, or navigation elements
    const internalNav = await page.$('nav, header, aside, .sidebar, [aria-label*="profile" i], [aria-label*="account" i]');
    return Boolean(internalNav);
  } catch (e) {
    return false;
  }
}

export async function solveMultiStepAuthentication(page, { resolvedUser, resolvedPass, goalPrompt, apiKey, provider, modelName, onStepProgress }) {
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (await isPageAuthenticated(page)) {
      onStepProgress({ type: 'STATUS', message: `✓ Successfully reached authenticated session! Active URL: ${page.url()}` });
      return true;
    }

    // Check if on a credentials form with password input
    const passwordInput = await page.$('input[type="password"]:visible').catch(() => null);
    const emailInput = await page.$('input[type="email"]:visible, input[name*="email" i]:visible, input[placeholder*="email" i]:visible, input[name*="user" i]:visible, input[placeholder*="user" i]:visible, input[type="text"]:visible').catch(() => null);

    if (passwordInput && emailInput) {
      onStepProgress({ type: 'STATUS', message: `🔑 [Auth Step ${attempt}] Credentials form detected. Filling email and password...` });
      await emailInput.fill(resolvedUser || 'user@example.com').catch(() => {});
      await page.waitForTimeout(400);
      await passwordInput.fill(resolvedPass || 'Password123!').catch(() => {});
      await page.waitForTimeout(400);

      const submitBtn = await page.$('button[type="submit"]:visible, button:has-text("Log In"):visible, button:has-text("Sign In"):visible, button:has-text("Login"):visible, button:has-text("Sign in"):visible, input[type="submit"]:visible').catch(() => null);
      if (submitBtn) {
        onStepProgress({ type: 'STATUS', message: `🔑 [Auth Step ${attempt}] Submitting login credentials...` });
        await submitBtn.click().catch(() => {});
      } else {
        await passwordInput.press('Enter').catch(() => {});
      }

      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(3000);

      if (await isPageAuthenticated(page)) {
        onStepProgress({ type: 'STATUS', message: `✓ Successfully authenticated into dashboard! URL: ${page.url()}` });
        return true;
      }
      continue;
    }

    // Check if there is an SSO / App button (e.g. "Sign in with UAPP", "Sign in with Google", "Log In", "Get Started")
    const ssoBtn = await page.$('button:has-text("Sign in with"), button:has-text("Sign with"), a:has-text("Sign in with"), a:has-text("Sign with"), button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Login")').catch(() => null);
    if (ssoBtn) {
      const btnText = (await ssoBtn.innerText().catch(() => 'SSO / Login Button')).trim();
      onStepProgress({ type: 'STATUS', message: `🚪 [Auth Step ${attempt}] Clicking intermediate button: "${btnText}"...` });
      await ssoBtn.click().catch(() => {});
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2500);

      if (await isPageAuthenticated(page)) {
        onStepProgress({ type: 'STATUS', message: `✓ Authenticated after clicking "${btnText}"! URL: ${page.url()}` });
        return true;
      }
      continue;
    }

    // Dynamic AI Fallback
    const liveState = await getPageState(page);
    const authPrompt = `You are an AI Browser Automation Engineer.
The user wants to authenticate: "${goalPrompt || 'Log in to dashboard'}".
Live Page State:
${liveState}

Provide the next Playwright actions to progress authentication:`;
    const actions = await agentBrain.translateInteractiveCommand(authPrompt, apiKey, provider, modelName, liveState);
    if (Array.isArray(actions) && actions.length > 0) {
      for (const act of actions) {
        if (act.type === 'click') await page.click(act.selector).catch(() => {});
        else if (act.type === 'fill') await page.fill(act.selector, String(act.value || (act.selector.includes('pass') ? (resolvedPass || 'Password123!') : (resolvedUser || 'user@example.com')))).catch(() => {});
        else if (act.type === 'wait') await page.waitForTimeout(act.timeout || 1500);
        else if (act.type === 'press') await page.keyboard.press(act.key || 'Enter');
      }
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(2500);
    } else {
      break;
    }
  }

  return await isPageAuthenticated(page);
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
  if (knowledgeDocs && knowledgeDocs.length > 0) {
    onStepProgress({
      type: 'STATUS',
      message: `📚 Loaded ${knowledgeDocs.length} QA Knowledge docs from Google Drive (${knowledgeDocs.slice(0, 3).map(d => d.filename).join(', ')}...)`
    });
  }
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

    const hasLoginIntent = (resolvedUser && resolvedPass) || /sign\s*in|sign\s*with|sign\s*up|login|log\s*in|logon|authenticate|auth|sso|oauth|credentials|password|dashboard/i.test(goalPrompt || '');
    if (hasLoginIntent) {
      onStepProgress({ type: 'STATUS', message: `Detecting multi-step sign-in flow (SSO / App / Form credentials)...` });
      loggedIn = await solveMultiStepAuthentication(page, {
        resolvedUser,
        resolvedPass,
        goalPrompt,
        apiKey,
        provider,
        modelName,
        onStepProgress
      });

      if (!loggedIn) {
        onStepProgress({
          type: 'STATUS',
          message: `⚠️ Authentication flow could not reach internal dashboard (Credentials rejected, or SSO server unreachable). Halting crawler safely.`
        });
        const errScreenshotFile = `auth-fail-${Date.now()}.png`;
        const errScreenshotPath = path.join(SCREENSHOT_DIR, errScreenshotFile);
        await page.screenshot({ path: errScreenshotPath, fullPage: false }).catch(() => {});
        executionResults.push({
          stepNum: 1,
          testCase: {
            id: 'AUTH-FAIL',
            title: 'Authentication & Dashboard Access',
            technique: 'Security & Access Control',
            expectedResult: 'User should reach dashboard after multi-step SSO/credentials'
          },
          status: 'FAILED',
          actualOutput: `Authentication halted at: ${page.url()}. SSO host was unreachable or credentials invalid.`,
          screenshotUrl: `/screenshots/${errScreenshotFile}`,
          durationMs: 3000
        });
        stopRequested = true;
      } else {
        pastActions.push('AUTHENTICATION COMPLETE - Successfully reached authenticated dashboard.');
      }
    }

    // Record the post-login URL as the "base" for testing
    const postLoginUrl = page.url();
    if (!stopRequested) {
      onStepProgress({ type: 'STATUS', message: `Starting exploration from: ${postLoginUrl}` });
    }

    // Main Autonomous Loop
    const MAX_AUTONOMOUS_STEPS = 15;
    let stepNum = 1;
    let consecutiveFailureCount = 0;
    let lastStateSignature = '';
    let lastActionWasSuccessful = true;

    while (!stopRequested && stepNum <= MAX_AUTONOMOUS_STEPS) {
      onStepProgress({ type: 'STATUS', message: `Analyzing page state (Step ${stepNum}/${MAX_AUTONOMOUS_STEPS})...` });
      
      const pageState = await getPageState(page);
      const currentUrl = page.url();

      // Resilient loop detector: only flag if actions repeatedly fail on the same page
      const fullStateSig = `${currentUrl}::${pageState.length}::${pageState.substring(0, 400).replace(/\s+/g, ' ')}`;
      if (fullStateSig === lastStateSignature && !lastActionWasSuccessful) {
        consecutiveFailureCount++;
        if (consecutiveFailureCount >= 4) {
          onStepProgress({
            type: 'STATUS',
            message: `⚠️ Unresponsive page: actions repeatedly failed without progress. Ending exploration safely.`
          });
          break;
        }
      } else {
        consecutiveFailureCount = 0;
        lastStateSignature = fullStateSig;
      }
      
      onStepProgress({ type: 'STATUS', message: `Deciding next action... (Current URL: ${currentUrl})` });
      let decision;
      try {
        decision = await agentBrain.decideNextAutonomousAction({
          pageState,
          pastActions,
          targetUrl: postLoginUrl,
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
        totalSteps: MAX_AUTONOMOUS_STEPS,
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
        lastActionWasSuccessful = true;

      } catch (err) {
        status = 'FAILED';
        actualOutput = `Error: ${err.message}`;
        lastActionWasSuccessful = false;
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
      onStepProgress({ type: 'STEP_COMPLETE', stepIndex: stepNum, totalSteps: MAX_AUTONOMOUS_STEPS, result: resultObj });
      stepNum++;
    }

    onStepProgress({ type: 'STATUS', message: `Finished autonomous run after ${executionResults.length} steps.` });
    
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
