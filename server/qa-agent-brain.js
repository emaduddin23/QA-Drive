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

    // Default Fallback: Pre-packaged Knowledge-Driven QA Brain Test Cases
    const testCases = [
      {
        id: "TC-BVA-01",
        title: "BVA Minimum Invalid Below Boundary (Qty: 0)",
        technique: "Boundary Value Analysis (MIN-1)",
        kbReference: "Test Techniques/Boundary Value Analysis.md",
        bugReference: "Historical Defect #BUG-104",
        inputQty: 0,
        expectedResult: "Validation Error: Quantity must be at least 1 item",
        actionType: "fill_qty",
        shouldPass: false
      },
      {
        id: "TC-BVA-02",
        title: "BVA Minimum Valid Boundary (Qty: 1)",
        technique: "Boundary Value Analysis (MIN)",
        kbReference: "Test Techniques/Boundary Value Analysis.md",
        inputQty: 1,
        expectedResult: "Subtotal: $49.00, Total: $54.00, No Error",
        actionType: "fill_qty",
        shouldPass: true
      },
      {
        id: "TC-BVA-03",
        title: "BVA Minimum Valid Inside (Qty: 2)",
        technique: "Boundary Value Analysis (MIN+1)",
        kbReference: "Test Techniques/Boundary Value Analysis.md",
        inputQty: 2,
        expectedResult: "Subtotal: $98.00, Total: $103.00, No Error",
        actionType: "fill_qty",
        shouldPass: true
      },
      {
        id: "TC-BVA-04",
        title: "BVA Maximum Valid Inside (Qty: 9)",
        technique: "Boundary Value Analysis (MAX-1)",
        kbReference: "Test Techniques/Boundary Value Analysis.md",
        inputQty: 9,
        expectedResult: "Subtotal: $441.00, Shipping: FREE, Total: $441.00",
        actionType: "fill_qty",
        shouldPass: true
      },
      {
        id: "TC-BVA-05",
        title: "BVA Maximum Valid Boundary (Qty: 10)",
        technique: "Boundary Value Analysis (MAX)",
        kbReference: "Test Techniques/Boundary Value Analysis.md",
        inputQty: 10,
        expectedResult: "Subtotal: $490.00, Shipping: FREE, Total: $490.00",
        actionType: "fill_qty",
        shouldPass: true
      },
      {
        id: "TC-BVA-06",
        title: "BVA Maximum Invalid Above Boundary (Qty: 11)",
        technique: "Boundary Value Analysis (MAX+1)",
        kbReference: "Test Techniques/Boundary Value Analysis.md",
        inputQty: 11,
        expectedResult: "Validation Error: Quantity cannot exceed 10 items per order",
        actionType: "fill_qty",
        shouldPass: false
      },
      {
        id: "TC-EP-07",
        title: "Equivalence Partitioning: Valid Promo Code (SAVE10)",
        technique: "Equivalence Partitioning (Valid Partition)",
        kbReference: "Test Techniques/Equivalence Partitioning.md",
        inputQty: 1,
        coupon: "SAVE10",
        expectedResult: "10% Discount Applied ($4.90 OFF)",
        actionType: "apply_coupon",
        shouldPass: true
      },
      {
        id: "TC-EP-08",
        title: "Equivalence Partitioning: Invalid Promo Code (EXPIRED99)",
        technique: "Equivalence Partitioning (Invalid Partition)",
        kbReference: "Test Techniques/Equivalence Partitioning.md",
        inputQty: 1,
        coupon: "EXPIRED99",
        expectedResult: "Error: Invalid promo code EXPIRED99",
        actionType: "apply_coupon",
        shouldPass: false
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
      testCases
    };
  }

  async callLlmApi({ apiKey, provider, modelName, userPrompt, knowledgeDocs }) {
    const knowledgeText = knowledgeDocs.map(d => `--- File: ${d.filename} (${d.category}) ---\n${d.content}`).join('\n\n');

    const systemPrompt = `You are Google Antigravity Autonomous Agent, an elite AI QA Engineer.
Based on the user requirement and the retrieved QA Knowledge Base documents below, generate a JSON object containing test cases for Playwright test runner.

CRITICAL: Return ONLY raw JSON without markdown code blocks.

JSON Output Schema:
{
  "testCases": [
    {
      "id": "TC-01",
      "title": "Short title",
      "technique": "QA Technique used",
      "kbReference": "Doc name referenced",
      "inputQty": 1,
      "coupon": "optional promo code string",
      "expectedResult": "Expected output description",
      "actionType": "fill_qty" or "apply_coupon",
      "shouldPass": true
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
        const agyBin = fs.existsSync('/Users/bluebayitlimited/.local/bin/agy')
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
