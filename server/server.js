import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { knowledgeBase } from './knowledge-indexer.js';
import { agentBrain } from './qa-agent-brain.js';
import { runPlaywrightSuite, startInteractiveSession, executeInteractiveActions, stopInteractiveSession } from './playwright-runner.js';
import { startAutonomousTesting, stopAutonomousTesting } from './autonomous-agent.js';
import { driveSyncService } from './google-drive-sync.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static screenshots & public assets
app.use('/screenshots', express.static(path.resolve(process.cwd(), 'public/screenshots')));

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket Server for live execution streaming
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch (e) {}
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 1. Initialize Knowledge Indexer
knowledgeBase.initialize();
driveSyncService.initAuth();

// 2. API Routes
// Playwright MCP Status & Health
app.get('/api/mcp/status', (req, res) => {
  res.json({
    status: 'online',
    engine: 'Playwright Chromium Automation Runner',
    wsClients: wss.clients.size,
    timestamp: Date.now()
  });
});

// Knowledge API: Get Indexed Docs & Search
app.get('/api/knowledge', (req, res) => {
  const { query, category } = req.query;
  const results = knowledgeBase.search(query || '', category || null);
  const stats = knowledgeBase.getStats();
  res.json({ stats, results });
});

// Local / Drive Index Re-sync Endpoint
app.post('/api/knowledge/sync', async (req, res) => {
  const count = await knowledgeBase.initialize();
  res.json({ success: true, count, message: 'QA Knowledge Base synchronized successfully.' });
});

// Google Drive API Status
app.get('/api/drive/status', (req, res) => {
  if (!driveSyncService.isAuthenticated && driveSyncService.hasCredentials()) {
    driveSyncService.initAuth();
  }
  res.json({
    hasCredentials: driveSyncService.hasCredentials(),
    isAuthenticated: driveSyncService.isAuthenticated,
    clientEmail: driveSyncService.getAccountEmail(),
  });
});

// Upload & Save Google Drive Service Account Credentials
app.post('/api/drive/credentials', (req, res) => {
  const { credentials } = req.body;
  if (!credentials) {
    return res.status(400).json({ error: 'Credentials payload is required' });
  }

  try {
    const credsPath = path.resolve(process.cwd(), 'credentials.json');
    fs.writeFileSync(credsPath, JSON.stringify(credentials, null, 2));
    const authOk = driveSyncService.initAuth(credentials);
    res.json({ success: authOk, message: 'Google Drive credentials saved and authenticated successfully.' });
  } catch (err) {
    res.status(500).json({ error: `Failed to save credentials: ${err.message}` });
  }
});

// Disconnect Google Drive API & Remove Credentials
app.post('/api/drive/disconnect', (req, res) => {
  driveSyncService.disconnect();
  res.json({ success: true, message: 'Google Drive disconnected successfully.' });
});

// Sync from Live Google Drive Folder ID
app.post('/api/drive/sync', async (req, res) => {
  const { folderId } = req.body;
  if (!folderId) {
    return res.status(400).json({ error: 'Google Drive Folder ID is required' });
  }

  try {
    const downloaded = await driveSyncService.syncFolder(folderId);
    const count = await knowledgeBase.initialize(downloaded);
    res.json({
      success: true,
      downloadedCount: downloaded.length,
      indexedCount: count,
      message: `Successfully retrieved and parsed ${downloaded.length} files from Google Drive into memory.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Persistent AI Config & Provider State
const AI_CONFIG_FILE = path.resolve(process.cwd(), 'ai-config.json');

function loadAiConfig() {
  let config = {
    provider: process.env.SELECTED_AI_PROVIDER || 'antigravity',
    model: process.env.SELECTED_AI_MODEL || 'antigravity-2.0-pro',
    antigravityKey: process.env.ANTIGRAVITY_API_KEY || process.env.GEMINI_API_KEY || '',
    opencodeKey: process.env.OPENCODE_API_KEY || '',
    geminiKey: process.env.GEMINI_API_KEY || '',
    openaiKey: process.env.OPENAI_API_KEY || '',
    openrouterKey: process.env.OPENROUTER_API_KEY || ''
  };

  if (fs.existsSync(AI_CONFIG_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(AI_CONFIG_FILE, 'utf8'));
      config = { ...config, ...saved };
    } catch (e) {
      console.error("Error loading ai-config.json:", e);
    }
  }
  return config;
}

function saveAiConfig(config) {
  try {
    fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error("Error saving ai-config.json:", e);
  }
}

let activeAiConfig = loadAiConfig();

// GET AI Configuration & Status
app.get('/api/ai/config', (req, res) => {
  let activeKey = '';

  if (activeAiConfig.provider === 'antigravity') {
    activeKey = activeAiConfig.antigravityKey || process.env.ANTIGRAVITY_API_KEY || process.env.GEMINI_API_KEY || '';
  } else if (activeAiConfig.provider === 'opencode') {
    activeKey = activeAiConfig.opencodeKey || process.env.OPENCODE_API_KEY || '';
  } else if (activeAiConfig.provider === 'openrouter') {
    activeKey = activeAiConfig.openrouterKey || process.env.OPENROUTER_API_KEY || '';
  } else if (activeAiConfig.provider === 'openai') {
    activeKey = activeAiConfig.openaiKey || process.env.OPENAI_API_KEY || '';
  } else {
    activeKey = activeAiConfig.geminiKey || process.env.GEMINI_API_KEY || '';
  }

  res.json({
    provider: activeAiConfig.provider,
    model: activeAiConfig.model,
    hasKey: Boolean(activeKey),
    maskedKey: activeKey ? `${activeKey.substring(0, 7)}...${activeKey.slice(-4)}` : '',
    savedKeys: {
      antigravity: Boolean(activeAiConfig.antigravityKey),
      opencode: Boolean(activeAiConfig.opencodeKey),
      gemini: Boolean(activeAiConfig.geminiKey),
      openai: Boolean(activeAiConfig.openaiKey),
      openrouter: Boolean(activeAiConfig.openrouterKey)
    }
  });
});

// POST Save AI Provider, API Keys & Model
app.post('/api/ai/config', (req, res) => {
  const { provider, model, apiKey, antigravityKey, opencodeKey, geminiKey, openaiKey, openrouterKey } = req.body;

  if (provider) activeAiConfig.provider = provider;
  if (model) activeAiConfig.model = model;

  if (antigravityKey !== undefined && antigravityKey.trim() !== '') {
    activeAiConfig.antigravityKey = antigravityKey.trim();
    process.env.ANTIGRAVITY_API_KEY = antigravityKey.trim();
  }
  if (opencodeKey !== undefined && opencodeKey.trim() !== '') {
    activeAiConfig.opencodeKey = opencodeKey.trim();
    process.env.OPENCODE_API_KEY = opencodeKey.trim();
  }
  if (geminiKey !== undefined && geminiKey.trim() !== '') {
    activeAiConfig.geminiKey = geminiKey.trim();
    process.env.GEMINI_API_KEY = geminiKey.trim();
  }
  if (openaiKey !== undefined && openaiKey.trim() !== '') {
    activeAiConfig.openaiKey = openaiKey.trim();
    process.env.OPENAI_API_KEY = openaiKey.trim();
  }
  if (openrouterKey !== undefined && openrouterKey.trim() !== '') {
    activeAiConfig.openrouterKey = openrouterKey.trim();
    process.env.OPENROUTER_API_KEY = openrouterKey.trim();
  }

  // Backwards compatibility for single apiKey field
  if (apiKey && apiKey.trim() !== '') {
    const keyTrimmed = apiKey.trim();
    if (activeAiConfig.provider === 'antigravity') {
      activeAiConfig.antigravityKey = keyTrimmed;
      process.env.ANTIGRAVITY_API_KEY = keyTrimmed;
    } else if (activeAiConfig.provider === 'opencode') {
      activeAiConfig.opencodeKey = keyTrimmed;
      process.env.OPENCODE_API_KEY = keyTrimmed;
    } else if (activeAiConfig.provider === 'openrouter') {
      activeAiConfig.openrouterKey = keyTrimmed;
      process.env.OPENROUTER_API_KEY = keyTrimmed;
    } else if (activeAiConfig.provider === 'openai') {
      activeAiConfig.openaiKey = keyTrimmed;
      process.env.OPENAI_API_KEY = keyTrimmed;
    } else {
      activeAiConfig.geminiKey = keyTrimmed;
      process.env.GEMINI_API_KEY = keyTrimmed;
    }
  }

  // Save to file for persistence across server restarts
  saveAiConfig(activeAiConfig);

  let activeKey = '';
  if (activeAiConfig.provider === 'antigravity') activeKey = activeAiConfig.antigravityKey || process.env.ANTIGRAVITY_API_KEY || process.env.GEMINI_API_KEY;
  else if (activeAiConfig.provider === 'opencode') activeKey = activeAiConfig.opencodeKey || process.env.OPENCODE_API_KEY;
  else if (activeAiConfig.provider === 'openrouter') activeKey = activeAiConfig.openrouterKey || process.env.OPENROUTER_API_KEY;
  else if (activeAiConfig.provider === 'openai') activeKey = activeAiConfig.openaiKey || process.env.OPENAI_API_KEY;
  else activeKey = activeAiConfig.geminiKey || process.env.GEMINI_API_KEY;

  res.json({
    success: true,
    message: 'AI Model configuration updated successfully.',
    config: {
      provider: activeAiConfig.provider,
      model: activeAiConfig.model,
      hasKey: Boolean(activeKey),
      maskedKey: activeKey ? `${activeKey.substring(0, 7)}...${activeKey.slice(-4)}` : ''
    }
  });
});

// AI QA Agent Plan Generator
app.post('/api/test/plan', async (req, res) => {
  const { prompt, targetUrl: reqTargetUrl } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const targetUrl = reqTargetUrl || '';
  let currentKey = '';
  if (activeAiConfig.provider === 'antigravity') currentKey = activeAiConfig.antigravityKey || process.env.ANTIGRAVITY_API_KEY || process.env.GEMINI_API_KEY;
  else if (activeAiConfig.provider === 'opencode') currentKey = activeAiConfig.opencodeKey || process.env.OPENCODE_API_KEY;
  else if (activeAiConfig.provider === 'openrouter') currentKey = activeAiConfig.openrouterKey || process.env.OPENROUTER_API_KEY;
  else if (activeAiConfig.provider === 'openai') currentKey = activeAiConfig.openaiKey || process.env.OPENAI_API_KEY;
  else currentKey = activeAiConfig.geminiKey || process.env.GEMINI_API_KEY;

  const plan = await agentBrain.planAndExecute(prompt, targetUrl, currentKey, activeAiConfig.provider, activeAiConfig.model);
  res.json(plan);
});

// Execute Playwright Automation Suite
app.post('/api/test/execute', async (req, res) => {
  const { testPlan, targetUrl: reqTargetUrl } = req.body;
  if (!testPlan || !testPlan.testCases) {
    return res.status(400).json({ error: 'Valid test plan is required' });
  }

  const targetUrl = reqTargetUrl || '';
  
  res.json({ success: true, message: 'Playwright automation suite launched.' });

  runPlaywrightSuite(testPlan, targetUrl, (update) => {
    broadcast(update);
  }).then(report => {
    broadcast({ type: 'EXECUTION_COMPLETE', report });
  });
});

// Autonomous Mode Endpoint
app.post('/api/test/autonomous/start', async (req, res) => {
  try {
    const { url, username, password, useKnowledgeDrive, goalPrompt } = req.body;
    let currentKey = '';
    if (activeAiConfig.provider === 'antigravity') currentKey = activeAiConfig.antigravityKey || process.env.ANTIGRAVITY_API_KEY || process.env.GEMINI_API_KEY;
    else if (activeAiConfig.provider === 'opencode') currentKey = activeAiConfig.opencodeKey || process.env.OPENCODE_API_KEY;
    else if (activeAiConfig.provider === 'openrouter') currentKey = activeAiConfig.openrouterKey || process.env.OPENROUTER_API_KEY;
    else if (activeAiConfig.provider === 'openai') currentKey = activeAiConfig.openaiKey || process.env.OPENAI_API_KEY;
    else currentKey = activeAiConfig.geminiKey || process.env.GEMINI_API_KEY;

    res.json({ success: true, message: 'Autonomous session started' });

    // Retrieve relevant knowledge for autonomous exploration if enabled
    let retrievedDocs = [];
    if (useKnowledgeDrive) {
      const searchResults = knowledgeBase.search(goalPrompt || 'testing QA test cases techniques SDLC STLC workflow', null);
      retrievedDocs = searchResults.slice(0, 8).map(res => res.doc);
      if (retrievedDocs.length === 0 && knowledgeBase.documents.length > 0) {
        retrievedDocs = knowledgeBase.documents.slice(0, 8);
      }
    }

    startAutonomousTesting(url, username, password, currentKey, activeAiConfig.provider, activeAiConfig.model, retrievedDocs, goalPrompt, (update) => {
      broadcast(update);
    }).then(report => {
      broadcast({ type: 'EXECUTION_COMPLETE', report });
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Validate API Key Endpoint
app.post('/api/ai/validate-key', async (req, res) => {
  const { provider, key } = req.body;
  if (!provider || !key) {
    return res.status(400).json({ valid: false, error: 'Provider and key are required.' });
  }
  // Basic validation: ensure key is non‑empty and of reasonable length
  if (key.trim().length < 8) {
    return res.json({ valid: false, error: 'API key appears too short.' });
  }
  // For OpenCode, optionally perform a lightweight test request
  if (provider === 'opencode') {
    try {
      const testRes = await fetch('https://api.openode.ai/v1/models/opencode-coder-7b/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key.trim()}`,
        },
        body: JSON.stringify({ prompt: 'Hello', max_tokens: 1 })
      });
      if (!testRes.ok) {
        const err = await testRes.text();
        return res.json({ valid: false, error: `OpenCode validation failed: ${err}` });
      }
    } catch (e) {
      return res.json({ valid: false, error: `OpenCode validation error: ${e.message}` });
    }
  }
  // Add similar checks for other providers as needed
  return res.json({ valid: true });
});
app.post('/api/test/autonomous/stop', async (req, res) => {
  try {
    stopAutonomousTesting();
    broadcast({ type: 'STATUS', message: 'Autonomous session stopped by user' });
    res.json({ success: true, message: 'Autonomous session stopped' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Interactive Playwright Endpoints
app.post('/api/test/interactive/start', async (req, res) => {
  try {
    const { targetUrl } = req.body;
    const url = targetUrl || '';
    await startInteractiveSession(url, (update) => broadcast(update));
    res.json({ success: true, message: 'Interactive session started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/test/interactive/execute', async (req, res) => {
  try {
    const { prompt } = req.body;
    let currentKey = '';
    if (activeAiConfig.provider === 'antigravity') currentKey = activeAiConfig.antigravityKey || process.env.ANTIGRAVITY_API_KEY || process.env.GEMINI_API_KEY;
    else if (activeAiConfig.provider === 'opencode') currentKey = activeAiConfig.opencodeKey || process.env.OPENCODE_API_KEY;
    else if (activeAiConfig.provider === 'openrouter') currentKey = activeAiConfig.openrouterKey || process.env.OPENROUTER_API_KEY;
    else if (activeAiConfig.provider === 'openai') currentKey = activeAiConfig.openaiKey || process.env.OPENAI_API_KEY;
    else currentKey = activeAiConfig.geminiKey || process.env.GEMINI_API_KEY;

    broadcast({ type: 'STATUS', message: 'Translating command to actions...' });
    const actions = await agentBrain.translateInteractiveCommand(prompt, currentKey, activeAiConfig.provider, activeAiConfig.model);
    
    const result = await executeInteractiveActions(actions, (update) => broadcast(update));
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/test/interactive/stop', async (req, res) => {
  try {
    await stopInteractiveSession();
    broadcast({ type: 'STATUS', message: 'Interactive session stopped' });
    res.json({ success: true, message: 'Interactive session stopped' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static bundle
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/screenshots')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server
server.listen(PORT, () => {
  console.log(`[AI QA Agent Server] Running at http://localhost:${PORT}`);
});
