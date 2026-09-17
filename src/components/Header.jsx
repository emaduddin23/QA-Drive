import React, { useState } from 'react';
import { Bot, HardDrive, RefreshCw, ExternalLink, ShieldCheck, Sun, Moon, CloudDownload, Menu, X, CheckCircle, Sparkles, Activity, Cpu } from 'lucide-react';

export default function Header({ docCount, isSyncing, onSync, onOpenDriveModal, onOpenPlaywrightModal, onOpenAiModal, activeTab, setActiveTab, theme, toggleTheme, isMcpConnected, isExecuting, driveStatus, aiStatus }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDriveConnected = Boolean(driveStatus?.isConnected);
  const isAiConnected = Boolean(aiStatus?.isConnected);

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0f1523]/90 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* 1. Left: Brand Logo & Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">AI QA Agent</h1>
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-full font-semibold">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden md:block">Autonomous Knowledge-Driven Test Automation</p>
            </div>
          </div>

          {/* 2. Center: Desktop Navigation Tabs */}
          <nav className="hidden md:flex space-x-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => handleTabSelect('agent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'agent'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>QA Agent</span>
            </button>

            <button
              onClick={() => handleTabSelect('knowledge')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'knowledge'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Knowledge Drive</span>
              <span className="ml-0.5 px-1.5 py-0.2 bg-slate-200/80 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 rounded text-[10px] font-mono">
                {docCount}
              </span>
            </button>

            <button
              onClick={() => handleTabSelect('sandbox')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'sandbox'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Target Sandbox</span>
            </button>
          </nav>

          {/* 3. Right: Status Badges & Actions */}
          <div className="hidden lg:flex items-center gap-2">
            {/* AI Engine Status Badge */}
            <button
              type="button"
              onClick={onOpenAiModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border transition cursor-pointer ${
                isAiConnected
                  ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
              title={isAiConnected ? `AI Engine: ${aiStatus?.provider?.toUpperCase()} (${aiStatus?.maskedKey || aiStatus?.model})` : 'Click to configure AI Key'}
            >
              {isAiConnected ? (
                <>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{aiStatus?.isCliConnected ? 'ANTIGRAVITY (CLI):' : `${aiStatus?.provider?.toUpperCase()}:`}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Connected ✓</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                  <span>Configure AI</span>
                </>
              )}
            </button>

            {/* Playwright MCP Badge */}
            <button
              type="button"
              onClick={onOpenPlaywrightModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border transition cursor-pointer ${
                isExecuting
                  ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-950/60 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                  : isMcpConnected
                  ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
              }`}
              title="Click to manage Playwright MCP Connection"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${isExecuting ? 'bg-indigo-500 animate-ping' : isMcpConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>MCP:</span>
              <span className="font-bold">
                {isExecuting ? 'Executing' : isMcpConnected ? 'Connected ✓' : 'Offline'}
              </span>
            </button>

            {/* Drive API Badge */}
            <button
              type="button"
              onClick={onOpenDriveModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                isDriveConnected
                  ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                  : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
              }`}
              title={isDriveConnected ? `Google Drive Authenticated` : 'Click to connect Google Drive'}
            >
              {isDriveConnected ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Drive ✓</span>
                </>
              ) : (
                <>
                  <CloudDownload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Connect Drive</span>
                </>
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs transition border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Sync Index Button */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="p-2 sm:px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition border border-slate-200 dark:border-slate-700 disabled:opacity-50 shrink-0"
              title="Sync Knowledge Index"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* 4. Mobile Quick Controls & Hamburger Menu */}
          <div className="flex items-center gap-1.5 lg:hidden">
            {/* AI Status Chip on Mobile */}
            <button
              onClick={onOpenAiModal}
              className={`p-1.5 rounded-lg text-xs border font-mono ${
                isAiConnected
                  ? 'bg-violet-50 dark:bg-violet-950/60 border-violet-300 dark:border-violet-500/30 text-violet-600 dark:text-violet-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
              title="AI Key"
            >
              <Sparkles className="w-4 h-4 text-violet-500" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs border border-slate-200 dark:border-slate-700"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition border border-slate-200 dark:border-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-indigo-600" /> : <Menu className="w-5 h-5 text-indigo-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex overflow-x-auto gap-1.5 pb-2.5 pt-1 scrollbar-none border-t border-slate-200/50 dark:border-slate-800/50">
          <button
            onClick={() => handleTabSelect('agent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'agent'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>QA Agent</span>
          </button>

          <button
            onClick={() => handleTabSelect('knowledge')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'knowledge'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Knowledge Drive ({docCount})</span>
          </button>

          <button
            onClick={() => handleTabSelect('sandbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'sandbox'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Target Sandbox</span>
          </button>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 py-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { onOpenAiModal(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30"
              >
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span>Configure AI Model</span>
              </button>

              <button
                onClick={() => { onOpenDriveModal(); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30"
              >
                <CloudDownload className="w-4 h-4 text-indigo-500" />
                <span>Google Drive</span>
              </button>
            </div>

            <button
              onClick={() => { onSync(); setMobileMenuOpen(false); }}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-500 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing Index...' : 'Re-sync Knowledge Index'}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
