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
    let apiKey = customApiKey;
    if (!apiKey) {
      if (provider === 'antigravity') apiKey = process.env.ANTIGRAVITY_API_KEY || process.env.GEMINI_API_KEY;
      else if (provider === 'opencode') apiKey = process.env.OPENCODE_API_KEY;
      else if (provider === 'openrouter') apiKey = process.env.OPENROUTER_API_KEY;
      else if (provider === 'openai') apiKey = process.env.OPENAI_API_KEY;
      else apiKey = process.env.GEMINI_API_KEY;
    }

    if (isAntigravityCli || apiKey) {
      try {
        const modelName = selectedModel || (
          provider === 'antigravity' ? 'antigravity-2.0-pro' :
          provider === 'opencode' ? 'opencode-zenith-1' :
          provider === 'openrouter' ? 'anthropic/claude-3.5-sonnet' :
          provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash'
        );

        addTrace(4, "Google Antigravity AI Engine", `Invoking Google Antigravity CLI / Subscription (${modelName})...`);

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

    const defaultTarget = targetUrl || 'https://example.com';
    const testCases = [
      {
        id: "TC-BVA-01",
        title: "BVA Minimum Invalid Below Boundary (Qty: 0)",
        technique: "Boundary Value Analysis (MIN-1)",
        kbReference: "Test Techniques/Boundary Value Analysis.md",
        expectedResult: "Validation Error: Quantity must be at least 1 item",
        shouldPass: false,
        actions: [
          { type: "goto", url: defaultTarget },
          { type: "fill", selector: "#quantity-input", value: "0" },
          { type: "click", selector: "#update-qty-btn" },
          { type: "wait", timeout: 300 }
        ]
      },
      {
        id: "TC-BVA-02",
        title: "BVA Minimum Valid Boundary (Qty: 1)",
        technique: "Boundary Value Analysis (MIN)",
        kbReference: "Test Techniques/Boundary Value Analysis.md",
        expectedResult: "Subtotal: $49.00, Total: $54.00, No Error",
        shouldPass: true,
        actions: [
          { type: "goto", url: defaultTarget },
          { type: "fill", selector: "#quantity-input", value: "1" },
          { type: "click", selector: "#update-qty-btn" },
          { type: "wait", timeout: 300 }
        ]
      },
      {
        id: "TC-EP-08",
        title: "Equivalence Partitioning: Invalid Promo Code",
        technique: "Equivalence Partitioning",
        kbReference: "Test Techniques/Equivalence Partitioning.md",
        expectedResult: "Error: Invalid promo code",
        shouldPass: false,
        actions: [
          { type: "goto", url: defaultTarget },
          { type: "fill", selector: "#quantity-input", value: "1" },
          { type: "fill", selector: "#coupon-input", value: "EXPIRED99" },
          { type: "click", selector: "#apply-coupon-btn" },
          { type: "wait", timeout: 300 }
        ]
      }
    ];

    addTrace(5, "Test Plan Synthesis", `Generated ${testCases.length} QA Test Cases combining BVA boundary rules & historical bug mitigations.`);

    return {
      logTrace,
      retrievedKnowledge: topKnowledgeDocs.map(d => ({
        title: d.filename,
        category: d.category,
        snippet: d.content.substring(0, 150) + '...'
      })),
      targetUrl: defaultTarget,
      testCases
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

    const systemPrompt = `You are an Autonomous QA Exploratory Agent.
Your goal is to test the application by interacting with it, discovering bugs, and generating test cases for what you test.
The user provided a target URL: ${targetUrl}.
${goalPrompt ? `\nCRITICAL USER GOAL/INSTRUCTION:\nThe user has provided a specific instruction for you to focus on: "${goalPrompt}". You MUST prioritize testing this flow or feature.\n` : ''}
${loggedIn ? `\n⚠️ EXTREMELY IMPORTANT - LOGIN IS ALREADY COMPLETE ⚠️
You have ALREADY logged in successfully. The login step was handled automatically BEFORE your testing loop started.
You MUST NOT:
- Navigate to the login page
- Try to fill login forms
- Test login functionality
- Click logout buttons
- Do anything related to authentication/login/signin
Instead, you MUST focus ONLY on testing the INTERNAL pages (dashboard, settings, forms, data, navigation, etc.) that are available AFTER login.
If the current page appears to be a login page, navigate away from it immediately to the dashboard or main content area.\n` : ''}
${knowledgeSection}
Current Page State (simplified DOM elements you can interact with):
${pageState}

Past Actions you have taken:
${JSON.stringify(pastActions, null, 2)}

Instructions:
1. First, study the QA Knowledge Base documents (PDF guidelines) above. Apply testing techniques like Boundary Value Analysis, Equivalence Partitioning, negative validation tests, or exploratory paths as specified in your documents.
2. Review the Current Page State and Past Actions.
3. Decide on ONE logical next step to test the application (e.g., click a specific link, fill a form with invalid data, submit a form).
4. You MUST explore and test AT LEAST 5 different interactions before considering setting "isDone" to true. Do NOT set isDone to true if stepNum < 5. Explore links, try to break forms, submit invalid data, and test boundaries.
5. If stepNum >= 5 and there is genuinely nothing left to test, you may set "isDone" to true.
6. Formulate the Playwright actions for this step.
7. Provide a Test Case description for the action you chose, referencing the exact PDF document name that guided this test.
${loggedIn ? '8. REMINDER: Do NOT test login. Focus on post-login content ONLY.' : ''}

CRITICAL: Return ONLY raw JSON without markdown code blocks.

Output Schema:
{
  "isDone": boolean,
  "testCase": {
    "title": "Short title of what is being tested (e.g., 'Submit Quantity Boundary Test')",
    "expectedResult": "What you expect to happen based on QA doc rules",
    "technique": "Boundary Value Analysis / Equivalence Partitioning / Exploratory"
  },
  "referencedDocs": ["Filename1.pdf", "Filename2.pdf"], // Array of document filenames from the knowledge base that guided this decision.
  "actions": [
    { "type": "click", "selector": "#submit-btn" }
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
  async callLlmApi({ apiKey, provider, modelName, userPrompt, knowledgeDocs = [], systemPromptOverride }) {
    const knowledgeText = (knowledgeDocs && knowledgeDocs.length > 0)
      ? knowledgeDocs.map(d => `--- File: ${d.filename} (${d.category}) ---\n${d.content}`).join('\n\n')
      : '';

    const systemPrompt = systemPromptOverride || `You are Google Antigravity Autonomous Agent, an elite AI QA Engineer.
Based on the user requirement and the retrieved QA Knowledge Base documents below, generate a JSON object containing test cases for a dynamic Playwright test runner.

CRITICAL: Return ONLY raw JSON without markdown code blocks.

1. Extract the 'targetUrl' from the user's prompt (e.g. if user says "goto https://your-site.com", use "https://your-site.com"). If no URL is specified in prompt, use the configured targetUrl.
2. For each test case, generate an array of dynamic 'actions' (e.g., 'goto', 'fill', 'click', 'wait', 'press'). Guess standard selectors for login forms or checkout based on the context.

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
        { "type": "fill", "selector": "input[type='email'], #email", "value": "test@test.com" },
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
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
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
