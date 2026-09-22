import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { knowledgeBase } from './knowledge-indexer.js';
import { agentBrain } from './qa-agent-brain.js';
import { getSandboxHtml } from './sandbox-app.js';
import { runPlaywrightSuite } from './playwright-runner.js';
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
    timestamp: Date.now(),
    targetApp: `http://localhost:${PORT}/sandbox`
  });
});

// Target Sandbox Application Endpoint
app.get('/sandbox', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(getSandboxHtml());
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

// Live AI Config & Provider State
let activeAiConfig = {
  provider: process.env.SELECTED_AI_PROVIDER || 'antigravity',
  model: process.env.SELECTED_AI_MODEL || 'antigravity-2.0-pro',
  antigravityKey: process.env.ANTIGRAVITY_API_KEY || process.env.GEMINI_API_KEY || '',
  opencodeKey: process.env.OPENCODE_API_KEY || '',
  geminiKey: process.env.GEMINI_API_KEY || '',
  openaiKey: process.env.OPENAI_API_KEY || '',
  openrouterKey: process.env.OPENROUTER_API_KEY || ''
};

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
    maskedKey: activeKey ? `${activeKey.substring(0, 6)}...${activeKey.slice(-4)}` : '',
    antigravityKey: activeAiConfig.antigravityKey ? '***' : '',
    opencodeKey: activeAiConfig.opencodeKey ? '***' : '',
    geminiKey: activeAiConfig.geminiKey ? '***' : '',
    openaiKey: activeAiConfig.openaiKey ? '***' : '',
    openrouterKey: activeAiConfig.openrouterKey ? '***' : ''
  });
});

// POST Save AI Provider, API Keys & Model
app.post('/api/ai/config', (req, res) => {
  const { provider, model, apiKey, antigravityKey, opencodeKey, geminiKey, openaiKey, openrouterKey } = req.body;

  if (provider) activeAiConfig.provider = provider;
  if (model) activeAiConfig.model = model;

  if (antigravityKey !== undefined) {
    activeAiConfig.antigravityKey = antigravityKey;
    process.env.ANTIGRAVITY_API_KEY = antigravityKey;
  }
  if (opencodeKey !== undefined) {
    activeAiConfig.opencodeKey = opencodeKey;
    process.env.OPENCODE_API_KEY = opencodeKey;
  }
  if (geminiKey !== undefined) {
    activeAiConfig.geminiKey = geminiKey;
    process.env.GEMINI_API_KEY = geminiKey;
  }
  if (openaiKey !== undefined) {
    activeAiConfig.openaiKey = openaiKey;
    process.env.OPENAI_API_KEY = openaiKey;
  }
  if (openrouterKey !== undefined) {
    activeAiConfig.openrouterKey = openrouterKey;
    process.env.OPENROUTER_API_KEY = openrouterKey;
  }

  // Backwards compatibility for single apiKey field
  if (apiKey) {
    if (activeAiConfig.provider === 'antigravity') {
      activeAiConfig.antigravityKey = apiKey;
      process.env.ANTIGRAVITY_API_KEY = apiKey;
    } else if (activeAiConfig.provider === 'opencode') {
      activeAiConfig.opencodeKey = apiKey;
      process.env.OPENCODE_API_KEY = apiKey;
    } else if (activeAiConfig.provider === 'openrouter') {
      activeAiConfig.openrouterKey = apiKey;
      process.env.OPENROUTER_API_KEY = apiKey;
    } else if (activeAiConfig.provider === 'openai') {
      activeAiConfig.openaiKey = apiKey;
      process.env.OPENAI_API_KEY = apiKey;
    } else {
      activeAiConfig.geminiKey = apiKey;
      process.env.GEMINI_API_KEY = apiKey;
    }
  }

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
      hasKey: Boolean(activeKey)
    }
  });
});

// AI QA Agent Plan Generator
app.post('/api/test/plan', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const targetUrl = `http://localhost:${PORT}/sandbox`;
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

  const targetUrl = reqTargetUrl || `http://localhost:${PORT}/sandbox`;
  
  res.json({ success: true, message: 'Playwright automation suite launched.' });

  runPlaywrightSuite(testPlan, targetUrl, (update) => {
    broadcast(update);
  }).then(report => {
    broadcast({ type: 'EXECUTION_COMPLETE', report });
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`[AI QA Agent Server] Running at http://localhost:${PORT}`);
  console.log(`[Target Sandbox App] Running at http://localhost:${PORT}/sandbox`);
});
