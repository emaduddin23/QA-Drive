import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import KnowledgeExplorer from './components/KnowledgeExplorer';
import AgentCommandCenter from './components/AgentCommandCenter';
import ExecutionMonitor from './components/ExecutionMonitor';
import SandboxPreview from './components/SandboxPreview';
import GoogleDriveModal from './components/GoogleDriveModal';
import PlaywrightMcpModal from './components/PlaywrightMcpModal';
import AiSettingsModal from './components/AiSettingsModal';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [activeTab, setActiveTab] = useState('agent');
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isPlaywrightModalOpen, setIsPlaywrightModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Playwright MCP, Google Drive & AI Status
  const [isMcpConnected, setIsMcpConnected] = useState(false);
  const [driveStatus, setDriveStatus] = useState({ isConnected: false, clientEmail: null });
  const [aiStatus, setAiStatus] = useState({ isConnected: false, provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet', maskedKey: '' });
  const [isPlanning, setIsPlanning] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [executionResults, setExecutionResults] = useState([]);
  const [finalReport, setFinalReport] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isManuallyDisconnectedRef = useRef(false);

  // Apply theme class to <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 1. Load Knowledge Docs, Drive Status & AI Status on Mount
  const fetchKnowledge = async () => {
    try {
      const res = await fetch('/api/knowledge');
      const data = await res.json();
      setDocuments(data.results.map(r => r.doc));
      setStats(data.stats);
    } catch (err) {
      console.error("Failed to load knowledge docs:", err);
    }
  };

  const fetchDriveStatus = async () => {
    try {
      const res = await fetch('/api/drive/status');
      const data = await res.json();
      setDriveStatus({
        isConnected: Boolean(data.hasCredentials && data.isAuthenticated),
        clientEmail: data.clientEmail || null
      });
    } catch (err) {
      console.error("Failed to load drive status:", err);
    }
  };

  const fetchAiStatus = async () => {
    try {
      const res = await fetch('/api/ai/config');
      const data = await res.json();
      setAiStatus({
        isConnected: Boolean(data.hasKey),
        provider: data.provider || 'openrouter',
        model: data.model || 'anthropic/claude-3.5-sonnet',
        maskedKey: data.maskedKey || ''
      });
    } catch (err) {
      console.error("Failed to load AI status:", err);
    }
  };

  useEffect(() => {
    fetchKnowledge();
    fetchDriveStatus();
    fetchAiStatus();
  }, []);

  const handleKnowledgeRefresh = () => {
    fetchKnowledge();
    fetchDriveStatus();
    fetchAiStatus();
  };

  // 2. Connect WebSocket for Real-time Playwright Updates & Live Connection Status
  const connectWebSocket = () => {
    if (isManuallyDisconnectedRef.current) return;

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        return;
      }
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3000`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsMcpConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'STEP_START') {
          setCurrentStep(data);
        } else if (data.type === 'STEP_COMPLETE') {
          setExecutionResults(prev => [...prev, data.result]);
        } else if (data.type === 'EXECUTION_COMPLETE') {
          setIsExecuting(false);
          setFinalReport(data.report);
        }
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    };

    ws.onclose = () => {
      setIsMcpConnected(false);
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      if (!isManuallyDisconnectedRef.current) {
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      }
    };

    ws.onerror = () => {
      setIsMcpConnected(false);
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      }
    };
  }, []);

  const handleTogglePlaywrightConnection = (connect) => {
    if (connect) {
      isManuallyDisconnectedRef.current = false;
      connectWebSocket();
    } else {
      isManuallyDisconnectedRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
      setIsMcpConnected(false);
    }
  };

  // 3. Sync Google Drive / Local KB
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/knowledge/sync', { method: 'POST' });
      await handleKnowledgeRefresh();
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 3b. One-click Drive Retrieve (no modal needed)
  const handleDriveSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      // Use the stored folder ID (default from modal)
      const FOLDER_ID = '14eXq0PMPV-_8BsrCeiH3c7nBecOpwf1s';
      await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: FOLDER_ID })
      });
      await fetch('/api/knowledge/sync', { method: 'POST' });
      await handleKnowledgeRefresh();
    } catch (err) {
      console.error("Drive sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Generate Test Plan
  const handleGeneratePlan = async (promptText) => {
    setIsPlanning(true);
    setCurrentPlan(null);
    setExecutionResults([]);
    setFinalReport(null);

    try {
      const res = await fetch('/api/test/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText })
      });
      const plan = await res.json();
      setCurrentPlan(plan);
    } catch (err) {
      console.error("Plan generation error:", err);
    } finally {
      setIsPlanning(false);
    }
  };

  // 5. Run Playwright Suite
  const handleExecuteSuite = async () => {
    if (!currentPlan) return;
    setIsExecuting(true);
    setExecutionResults([]);
    setFinalReport(null);

    try {
      await fetch('/api/test/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testPlan: currentPlan, targetUrl: currentPlan.targetUrl })
      });
    } catch (err) {
      console.error("Execution launch error:", err);
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0d14] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Header
        docCount={documents.length}
        isSyncing={isSyncing}
        onSync={handleSync}
        onDriveSync={handleDriveSync}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onOpenPlaywrightModal={() => setIsPlaywrightModalOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        isMcpConnected={isMcpConnected}
        isExecuting={isExecuting}
        driveStatus={driveStatus}
        aiStatus={aiStatus}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {activeTab === 'agent' && (
          <div className="space-y-6 sm:space-y-8">
            <AgentCommandCenter
              onGeneratePlan={handleGeneratePlan}
              isPlanning={isPlanning}
              currentPlan={currentPlan}
              onExecuteSuite={handleExecuteSuite}
              isExecuting={isExecuting}
              isMcpConnected={isMcpConnected}
              driveStatus={driveStatus}
              aiStatus={aiStatus}
              onOpenDriveModal={() => setIsDriveModalOpen(true)}
              onOpenPlaywrightModal={() => setIsPlaywrightModalOpen(true)}
              onOpenAiModal={() => setIsAiModalOpen(true)}
            />

            <ExecutionMonitor
              isExecuting={isExecuting}
              currentStep={currentStep}
              executionResults={executionResults}
              finalReport={finalReport}
              isMcpConnected={isMcpConnected}
            />
          </div>
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeExplorer
            documents={documents}
            stats={stats}
            onRefresh={handleKnowledgeRefresh}
            onOpenDriveModal={() => setIsDriveModalOpen(true)}
            onOpenAiModal={() => setIsAiModalOpen(true)}
            driveStatus={driveStatus}
          />
        )}

        {activeTab === 'sandbox' && (
          <SandboxPreview />
        )}
      </main>

      {/* Google Drive Integration Modal */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onSyncComplete={handleKnowledgeRefresh}
      />

      {/* Playwright MCP Controller Modal */}
      <PlaywrightMcpModal
        isOpen={isPlaywrightModalOpen}
        onClose={() => setIsPlaywrightModalOpen(false)}
        isMcpConnected={isMcpConnected}
        isExecuting={isExecuting}
        onToggleConnection={handleTogglePlaywrightConnection}
      />

      {/* Live AI Settings Modal */}
      <AiSettingsModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onConfigSaved={fetchAiStatus}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 sm:py-6 px-4 text-center text-[11px] sm:text-xs text-slate-500 font-mono">
        AI QA Agent Platform • Driven by Google Drive Knowledge Base & Playwright Automation
      </footer>
    </div>
  );
}
