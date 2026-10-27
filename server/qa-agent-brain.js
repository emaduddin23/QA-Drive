import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { knowledgeBase } from './knowledge-indexer.js';

const execFileAsync = promisify(execFile);

export class QAAgentBrain {
  constructor() {}

  async planAndExecute(userPrompt, targetUrl, customApiKey = null, provider = 'antigravity', selectedModel = null) {
    const logTrace = [];

    const addTrace = (step, title, detail) => {
      const entry = { step, title, detail, timestamp: new Date().toLocaleTimeString() };
      logTrace.push(entry);
      return entry;
    };

    addTrace(1, "Requirement Analysis", `Received user instruction: "${userPrompt}"`);

    // Step 1: Query Knowledge Base across categories (RAG Context Retrieval)
    addTrace(2, "Knowledge Base Retrieval", "Searching indexed QA Knowledge Base & Google Drive Docs...");
    
    const searchResults = knowledgeBase.search(userPrompt);
    const topKnowledgeDocs = searchResults.slice(0, 5).map(r => r.doc);

    addTrace(3, "Knowledge Synthesis", `Retrieved ${topKnowledgeDocs.length} relevant QA Knowledge documents for context.`);

    // Determine Key & Model
    const isAntigravityCli = (provider === 'antigravity');
    const isNineRouter = (provider === '9router' || provider === 'ninerouter');
    let apiKey = customApiKey;
    if (!apiKey) {
      if (provider === 'antigravity') apiKey = process.env.ANTIGRAVITY_API_KEY || process.env.GEMINI_API_KEY;
      else if (provider === 'opencode') apiKey = process.env.OPENCODE_API_KEY;
      else if (provider === 'deepseek') apiKey = process.env.DEEPSEEK_API_KEY;
      else if (provider === 'openrouter') apiKey = process.env.OPENROUTER_API_KEY;
      else if (provider === 'openai') apiKey = process.env.OPENAI_API_KEY;
      else if (isNineRouter) apiKey = process.env.NINEROUTER_API_KEY || process.env['9ROUTER_API_KEY'] || '';
      else apiKey = process.env.GEMINI_API_KEY;
    }

    if (isAntigravityCli || isNineRouter || apiKey) {
      try {
        const modelName = selectedModel || (
          provider === 'antigravity' ? 'antigravity-2.0-pro' :
          provider === 'opencode' ? 'opencode-zenith-1' :
          provider === 'deepseek' ? 'deepseek-chat' :
          provider === 'openrouter' ? 'anthropic/claude-3.5-sonnet' :
          provider === 'openai' ? 'gpt-4o-mini' :
          isNineRouter ? 'kgw/kilo-auto/free' : 'gemini-1.5-flash'
        );

        addTrace(4, isNineRouter ? "9Router Gateway Engine" : "Google Antigravity AI Engine", `Invoking ${isNineRouter ? '9Router Gateway' : 'Google Antigravity CLI / Subscription'} (${modelName})...`);

        const llmResult = await this.callLlmApi({
          apiKey,
          provider,
          modelName,
          userPrompt,
          knowledgeDocs: topKnowledgeDocs
        });

        if (llmResult && llmResult.testCases && llmResult.testCases.length > 0) {
          addTrace(5, "Antigravity Agent Test Plan Generated", `Google Antigravity Agent (${modelName}) generated ${llmResult.testCases.length} dynamic QA Test Cases.`);
          return {
            logTrace,
            retrievedKnowledge: topKnowledgeDocs.map(d => ({ title: d.filename, category: d.category, snippet: d.content.substring(0, 150) + '...' })),
            targetUrl: llmResult.targetUrl || targetUrl || '',
            testCases: llmResult.testCases
          };
        }
      } catch (err) {
        console.error("[QAAgentBrain] Antigravity / LLM API Call Error:", err.message);
        addTrace(4, "LLM Error Fallback", `Execution Error: ${err.message}. Falling back to Autonomous QA Brain Engine.`);
      }
    } else {
      addTrace(4, "Autonomous QA Brain Engine", "No external LLM API Key detected. Using pre-packaged Autonomous RAG QA Engine.");
    }

    const extractedUrlMatch = userPrompt.match(/(https?:\/\/[^\s]+)/i);
    const resolvedTargetUrl = extractedUrlMatch ? extractedUrlMatch[1] : (targetUrl || 'https://example.com');
    
    // Extract Email & Password if present in prompt
    const emailMatch = userPrompt.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const passMatch = userPrompt.match(/(?:pass|password)\s+([^\s]+)/i);
    const emailVal = emailMatch ? emailMatch[1] : 'user@example.com';
    const passVal = passMatch ? passMatch[1] : 'Password123!';

    const dynamicTestCases = [
      {
        id: "TC-AUTH-01",
        title: `Authentication & Login Flow (${emailVal})`,
        technique: "Functional Authentication Testing",
        kbReference: "QA Fundamentals/Functional Testing.md",
        expectedResult: "User successfully logs in and accesses feed/dashboard",
        shouldPass: true,
        actions: [
          { type: "goto", url: resolvedTargetUrl },
          { type: "fill", selector: "input[type='email'], input[name='email'], #email, input[placeholder*='email' i]", value: emailVal },
          { type: "fill", selector: "input[type='password'], input[name='password'], #password, input[placeholder*='pass' i]", value: passVal },
          { type: "click", selector: "button[type='submit'], button:has-text('Login'), button:has-text('Sign In')" },
          { type: "wait", timeout: 2000 }
        ]
      },
      {
        id: "TC-NAV-02",
        title: "Navigation & Content Feed Load Verification",
        technique: "Smoke & Sanity Testing",
        kbReference: "QA Fundamentals/Smoke & Sanity Testing.md",
        expectedResult: "Website feed and interactive layout elements render without JS console errors",
        shouldPass: true,
        actions: [
          { type: "goto", url: resolvedTargetUrl },
          { type: "wait", timeout: 1500 },
          { type: "click", selector: "nav a, header a, button" }
        ]
      },
      {
        id: "TC-VAL-03",
        title: "Negative Form Validation & Empty Submit Check",
        technique: "Boundary Value Analysis & Equivalence Partitioning",
        kbReference: "Test Techniques/Equivalence Partitioning.md",
        expectedResult: "Invalid credentials or empty inputs trigger proper error banner",
        shouldPass: false,
        actions: [
          { type: "goto", url: resolvedTargetUrl },
          { type: "fill", selector: "input[type='email'], input[name='email']", value: "invalid_email@test" },
          { type: "click", selector: "button[type='submit']" }
        ]
      }
    ];

    addTrace(5, "Test Plan Synthesis", `Generated ${dynamicTestCases.length} targeted QA Test Cases for ${resolvedTargetUrl}.`);

    return {
      logTrace,
      retrievedKnowledge: topKnowledgeDocs.map(d => ({
        title: d.filename,
        category: d.category,
        snippet: d.content.substring(0, 150) + '...'
      })),
      targetUrl: resolvedTargetUrl,
      testCases: dynamicTestCases
    };
  }

  async translateInteractiveCommand(userPrompt, apiKey, provider, modelName, pageState = '') {
    const systemPrompt = `You are Google Antigravity Autonomous Agent, an elite AI QA Engineer.
The user is giving a live instruction to the Playwright browser. You must translate it into an array of Playwright actions.

Current Page State (DOM elements you can interact with):
${pageState || 'Not available, you must guess standard selectors.'}

CRITICAL: Return ONLY raw JSON array without markdown code blocks.

Example output:
[
  { "type": "goto", "url": "https://example.com" },
  { "type": "fill", "selector": "input[name='q']", "value": "test" },
  { "type": "click", "selector": "button[type='submit']" },
  { "type": "wait", "timeout": 1000 }
]

Output ONLY the JSON array.`;

    const llmResult = await this.callLlmApi({
      apiKey,
      provider,
      modelName,
      userPrompt,
      knowledgeDocs: [],
      systemPromptOverride: systemPrompt
    });

    return Array.isArray(llmResult) ? llmResult : (llmResult.actions || llmResult);
  }

  async decideNextAutonomousAction({ pageState, pastActions, targetUrl, stepNum, apiKey, provider, modelName, knowledgeDocs = [], goalPrompt, loggedIn = false }) {
    const knowledgeSection = (knowledgeDocs && knowledgeDocs.length > 0)
      ? `\n=== QA KNOWLEDGE BASE (PDF / SPECIFICATION GUIDELINES) ===
You MUST guide your testing decisions using the following QA methodology and test documentation:
${knowledgeDocs.map(d => `--- Document: ${d.filename} (${d.category}) ---\n${d.content.substring(0, 2000)}`).join('\n\n')}
=======================================================\n`
      : '';

    const systemPrompt = `You are an Autonomous QA Agent executing a directed user test mission.
${goalPrompt ? `\n🎯 USER'S PRIMARY MISSION & INSTRUCTIONS (ABSOLUTE HIGHEST PRIORITY):
"${goalPrompt}"
You MUST strictly follow and fulfill this instruction. Every single action you choose MUST directly advance and execute what the user requested in their instruction. Do NOT click random unrelated elements when there are elements matching the user's instructions!\n` : '\nExplore the application systematically, discovering bugs, verifying interactive elements, and testing boundaries.\n'}
The target URL is: ${targetUrl}.
${loggedIn ? `\n⚠️ LOGIN IS COMPLETE: The user is authenticated. You MUST NOT interact with login forms or click logout. Focus exclusively on the internal pages, tabs, features, and workflows specified in the user's instructions.\n` : ''}
${knowledgeSection}
Current Page State (simplified DOM elements you can interact with):
${pageState}

Past Actions you have taken:
${JSON.stringify(pastActions, null, 2)}

Instructions:
1. USER INSTRUCTION ADHERENCE (MANDATORY):
   - Read the user's instruction: "${goalPrompt || 'General application testing'}".
   - Compare with Past Actions to see which part of the user's request has been fulfilled and what remains to be tested.
   - Find the matching element(s) in the Current Page State and take the exact next action that directly progresses the user's instruction (e.g. if the user mentioned News Feed, Chats, Bookings, Schedule, Settings, forms, search, or filters, click into and test those specific features in order).
2. Apply QA testing techniques from the Knowledge Base (boundary checks, negative validation, input limits) to the specific feature being tested.
3. Formulate the Playwright actions for this step using exact selectors from the Current Page State.
4. Provide a clear Test Case title and expected result explaining how this step fulfills the user's instruction.
5. Setting "isDone":
   - Do NOT set "isDone": true until ALL features and steps requested in the user's instruction have been tested (aim for at least 6 to 12 thorough steps).
   - Only set "isDone": true when the user's entire mission has been accomplished, or if a fatal connection error (e.g. ERR_TIMED_OUT) prevents further testing.

CRITICAL: Return ONLY raw JSON without markdown code blocks.

Output Schema:
{
  "isDone": boolean,
  "testCase": {
    "title": "Short title describing what is being tested per user instruction",
    "expectedResult": "What you expect to happen based on user requirements and QA rules",
    "technique": "Functional / Boundary Value Analysis / Equivalence Partitioning / Workflow"
  },
  "referencedDocs": ["Filename1.pdf", "Filename2.pdf"],
  "actions": [
    { "type": "click", "selector": "#target-btn" }
  ]
}`;

    const llmResult = await this.callLlmApi({
      apiKey,
      provider,
      modelName,
      userPrompt: `Step ${stepNum}: Decide next action.`,
      knowledgeDocs,
      systemPromptOverride: systemPrompt
    });

    return llmResult;
  }

  async autoHealFailedAction({ failedAction, errorMessage, pageState, targetUrl, testCaseTitle, apiKey, provider, modelName }) {
    const systemPrompt = `You are an elite AI Self-Healing QA Automation Engine.
A Playwright browser action failed during test execution. Your task is to diagnose the failure, inspect the current DOM state, and provide recovery actions to heal the execution so the intended step succeeds.

Failed Test Case: "${testCaseTitle || 'Dynamic Test Step'}"
Target URL: "${targetUrl || ''}"
Failed Action: ${JSON.stringify(failedAction)}
Error Message: "${errorMessage || 'Element not found or not interactable'}"

Live Page State (DOM elements available on the page right now):
${pageState ? pageState.substring(0, 3500) : 'No elements found.'}

Self-Healing Guidance:
1. Prerequisite Missed: If the intended action requires an earlier step (e.g. must select an item, add to cart, open a menu, or accept terms first), perform that prerequisite step.
2. Overlay or Modal: If a cookie banner, modal popup, or overlay is blocking the target, provide an action to close/dismiss it.
3. Selector Alternative: If the original selector (e.g. "${failedAction.selector || ''}") is missing or changed, find the exact matching element selector from the Live Page State above.
4. Input / Button: Use valid Playwright actions: "click", "fill", "wait", "press", "goto".

CRITICAL: Return ONLY valid JSON in this schema (no markdown formatting):
{
  "reason": "Brief 1-sentence explanation of what was missed, blocked, or healed",
  "healedActions": [
    { "type": "click", "selector": "#correct-selector" }
  ]
}`;

    try {
      const llmResult = await this.callLlmApi({
        apiKey,
        provider,
        modelName,
        userPrompt: `Diagnose and self-heal failed action: ${JSON.stringify(failedAction)} (Error: ${errorMessage})`,
        knowledgeDocs: [],
        systemPromptOverride: systemPrompt
      });

      if (llmResult && Array.isArray(llmResult.healedActions) && llmResult.healedActions.length > 0) {
        return llmResult;
      }
      return null;
    } catch (e) {
      console.warn("[QAAgentBrain] Self-healing reasoning error:", e.message);
      return null;
    }
  }

  async callLlmApi({ apiKey, provider, modelName, userPrompt, knowledgeDocs = [], systemPromptOverride }) {
    const knowledgeText = (knowledgeDocs && knowledgeDocs.length > 0)
      ? knowledgeDocs.map(d => `--- File: ${d.filename} (${d.category}) ---\n${d.content}`).join('\n\n')
      : '';

    const systemPrompt = systemPromptOverride || `You are Google Antigravity Autonomous Agent, an elite AI QA Engineer.
Based on the user requirement and the retrieved QA Knowledge Base documents below, generate a JSON object containing test cases for a dynamic Playwright test runner.

CRITICAL: Return ONLY raw JSON without markdown code blocks.

1. Extract the 'targetUrl' from the user's prompt (e.g. if user says "goto https://your-site.com", use "https://your-site.com"). If no URL is specified in prompt, use the configured targetUrl.
2. For each test case, generate an array of dynamic 'actions' (e.g., 'goto', 'fill', 'click', 'wait', 'press'). Guess standard selectors for login forms, buttons, or checkout based on the context.

CRITICAL WORKFLOW & MULTI-STEP RULES:
- Strict Instruction Faithfulness (HIGHEST PRIORITY): The test cases generated MUST directly execute what the user instructed in their prompt. If the user mentions specific features, flows, or pages (e.g. "click sign with Uapp", "user provide email and password", "Check the Dashboard whole functionality", "test bookings", "verify settings"), create dedicated, focused test cases covering every single part of their instructions in the exact sequence requested.
- Universal Sequential Mapping: The user can give instructions in ANY format or phrasing (English, Banglish, Bengali, shorthand, or detailed steps). You MUST break down their natural language intent into a clean chronological sequence of Playwright actions (e.g., "click X, then fill Y, then submit, then verify Z" or "search for item, add to cart, proceed to checkout").
- Dynamic Intermediate Steps & Modals: If the flow requires an intermediate click (e.g. SSO buttons like "Sign with Uapp", "Sign in with Google", "Login with Okta", "Continue with Email", opening a popup/modal, tab navigation, or accepting cookies/terms) BEFORE inputs become visible, YOU MUST emit the click action for that element FIRST and include a short wait (e.g., 1000-2000ms) before attempting to fill form inputs.
- Post-Submission & Redirection: After submitting a form or triggering an asynchronous action, ALWAYS include a wait action (e.g. { "type": "wait", "timeout": 3000 }) to allow the page or dashboard to complete loading.
- Session Continuity: In subsequent test cases that verify internal functionality (such as "Check Dashboard", "Verify User Profile", "Inspect Settings", "Browse Products"):
  DO NOT navigate back to the initial landing or login page! The session is already active. Generate actions that interact with the active page's navigation links ('nav a', 'header a', '.menu-item', sidebar links), action buttons, tables, and controls!

JSON Output Schema:
{
  "targetUrl": "https://extracted-url.com",
  "testCases": [
    {
      "id": "TC-01",
      "title": "Short title",
      "technique": "QA Technique used",
      "kbReference": "Doc name referenced",
      "expectedResult": "Expected output description",
      "shouldPass": true,
      "actions": [
        { "type": "goto", "url": "https://extracted-url.com" },
        { "type": "click", "selector": "button:has-text('Get Started'), button:has-text('Sign In'), button:has-text('Login')" },
        { "type": "wait", "timeout": 1500 },
        { "type": "fill", "selector": "input[type='email'], #email", "value": "test@test.com" },
        { "type": "fill", "selector": "input[type='password'], #password", "value": "Password123!" },
        { "type": "click", "selector": "button[type='submit'], .submit-btn" },
        { "type": "wait", "timeout": 3000 }
      ]
    }
  ]
}

Knowledge Base Docs:
${knowledgeText}
`;

    const cleanJsonResponse = (text) => {
      if (!text) throw new Error("Empty response from AI model");
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      cleaned = cleaned.trim();

      const firstBrace = cleaned.indexOf('{');
      const firstBracket = cleaned.indexOf('[');
      const lastBrace = cleaned.lastIndexOf('}');
      const lastBracket = cleaned.lastIndexOf(']');

      // Support array responses (e.g. interactive action sequences) as well as object responses
      const isArrayRoot = (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) &&
                          (lastBracket !== -1 && (lastBrace === -1 || lastBracket > lastBrace));

      if (isArrayRoot) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      } else if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
      return JSON.parse(cleaned);
    };

    if (provider === 'antigravity') {
      try {
        // Windows path: C:\Users\EMAD\AppData\Local\agy\bin\agy.exe
        const windowsAgyPath = `C:\\Users\\${process.env.USERNAME || process.env.USER || 'EMAD'}\\AppData\\Local\\agy\\bin\\agy.exe`;
        const agyBin = fs.existsSync(windowsAgyPath)
          ? windowsAgyPath
          : fs.existsSync('/Users/bluebayitlimited/.local/bin/agy')
            ? '/Users/bluebayitlimited/.local/bin/agy'
            : 'agy';

        const fullPrompt = `${systemPrompt}\n\nAntigravity User Goal: ${userPrompt}`;
        const { stdout } = await execFileAsync(agyBin, ['-p', fullPrompt], {
          cwd: process.cwd(),
          maxBuffer: 10 * 1024 * 1024
        });

        return cleanJsonResponse(stdout);
      } catch (agyErr) {
        console.warn("[QAAgentBrain] Native agy CLI invocation warning:", agyErr.message);
        if (apiKey) {
          const targetModel = (modelName && modelName.includes('flash')) ? 'gemini-2.0-flash-exp' : 'gemini-1.5-pro';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: `${systemPrompt}\n\nAntigravity User Goal: ${userPrompt}` }] }
              ],
              generationConfig: { responseMimeType: 'application/json' }
            })
          });

          const data = await res.json();
          if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          return cleanJsonResponse(text);
        }
        throw agyErr;
      }
    } else if (provider === 'opencode') {
      const res = await fetch('https://api.opencode.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName || 'opencode-zenith-1',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      const text = data?.choices?.[0]?.message?.content;
      return cleanJsonResponse(text);
    } else if (provider === 'openrouter') {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'QA Drive AI Agent'
        },
        body: JSON.stringify({
          model: modelName || 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      const text = data?.choices?.[0]?.message?.content;
      return cleanJsonResponse(text);
    } else if (provider === 'deepseek') {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName || 'deepseek-chat',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      const text = data?.choices?.[0]?.message?.content;
      return cleanJsonResponse(text);
    } else if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName || 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      const text = data?.choices?.[0]?.message?.content;
      return cleanJsonResponse(text);
    } else if (provider === '9router' || provider === 'ninerouter') {
      const baseUrl = (process.env.NINEROUTER_BASE_URL || 'http://localhost:20128/v1').replace(/\/+$/, '');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (apiKey && apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }
      let res;
      try {
        res = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: modelName || 'kgw/kilo-auto/free',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ]
          })
        });
      } catch (fetchErr) {
        throw new Error(`Cannot reach 9Router gateway at ${baseUrl} (${fetchErr.message}). Make sure 9router is running on port 20128.`);
      }

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        // Handle router/proxy responses with trailing SSE tags like 'data: [DONE]'
        const cleaned = rawText.replace(/data:\s*\[DONE\].*$/s, '').trim();
        const first = cleaned.indexOf('{');
        const last = cleaned.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
          data = JSON.parse(cleaned.substring(first, last + 1));
        } else {
          throw new Error(`9Router returned non-JSON response: ${rawText.slice(0, 200)}`);
        }
      }

      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.reasoning;
      return cleanJsonResponse(text);
    } else {
      // Default: Google Gemini REST API
      const targetModel = modelName && modelName.startsWith('gemini') ? modelName : 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Instruction: ${userPrompt}` }] }
          ],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return cleanJsonResponse(text);
    }
  }
}

export const agentBrain = new QAAgentBrain();
