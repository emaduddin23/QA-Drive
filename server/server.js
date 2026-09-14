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
  res.json({
    hasCredentials: driveSyncService.hasCredentials(),
    isAuthenticated: driveSyncService.isAuthenticated,
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

// Sync from Live Google Drive Folder ID
app.post('/api/drive/sync', async (req, res) => {
  const { folderId } = req.body;
  if (!folderId) {
    return res.status(400).json({ error: 'Google Drive Folder ID is required' });
  }

  try {
    const downloaded = await driveSyncService.syncFolder(folderId);
    const count = await knowledgeBase.initialize();
    res.json({
      success: true,
      downloadedCount: downloaded.length,
      indexedCount: count,
      message: `Successfully retrieved ${downloaded.length} files from Google Drive and indexed ${count} documents.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI QA Agent Plan Generator
app.post('/api/test/plan', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const targetUrl = `http://localhost:${PORT}/sandbox`;
  const plan = await agentBrain.planAndExecute(prompt, targetUrl);
  res.json(plan);
});

// Execute Playwright Automation Suite
app.post('/api/test/execute', async (req, res) => {
  const { testPlan } = req.body;
  if (!testPlan || !testPlan.testCases) {
    return res.status(400).json({ error: 'Valid test plan is required' });
  }

  const targetUrl = `http://localhost:${PORT}/sandbox`;
  
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
