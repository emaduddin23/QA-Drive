import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KnowledgeExplorer from './components/KnowledgeExplorer';
import AgentCommandCenter from './components/AgentCommandCenter';
import ExecutionMonitor from './components/ExecutionMonitor';
import SandboxPreview from './components/SandboxPreview';
import GoogleDriveModal from './components/GoogleDriveModal';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [activeTab, setActiveTab] = useState('agent');
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Agent & Execution state
  const [isPlanning, setIsPlanning] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [executionResults, setExecutionResults] = useState([]);
  const [finalReport, setFinalReport] = useState(null);

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

  // 1. Load Knowledge Docs on Mount
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

  useEffect(() => {
    fetchKnowledge();
  }, []);

  // 2. Connect WebSocket for Real-time Playwright Updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3000`;
    const ws = new WebSocket(wsUrl);

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

    return () => ws.close();
  }, []);

  // 3. Sync Google Drive / Local KB
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/knowledge/sync', { method: 'POST' });
      await fetchKnowledge();
    } catch (err) {
      console.error("Sync failed:", err);
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
        body: JSON.stringify({ testPlan: currentPlan })
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
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'agent' && (
          <div className="space-y-8">
            <AgentCommandCenter
              onGeneratePlan={handleGeneratePlan}
              isPlanning={isPlanning}
              currentPlan={currentPlan}
              onExecuteSuite={handleExecuteSuite}
              isExecuting={isExecuting}
            />

            <ExecutionMonitor
              isExecuting={isExecuting}
              currentStep={currentStep}
              executionResults={executionResults}
              finalReport={finalReport}
            />
          </div>
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeExplorer
            documents={documents}
            stats={stats}
            onRefresh={fetchKnowledge}
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
        onSyncComplete={fetchKnowledge}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 font-mono">
        AI QA Agent Platform • Driven by Google Drive Knowledge Base & Playwright Automation
      </footer>
    </div>
  );
}
