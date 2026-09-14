import React from 'react';
import { Bot, HardDrive, RefreshCw, ExternalLink, ShieldCheck, Sun, Moon, CloudDownload } from 'lucide-react';

export default function Header({ docCount, isSyncing, onSync, onOpenDriveModal, activeTab, setActiveTab, theme, toggleTheme }) {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0f1523]/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Bot className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">AI QA Agent</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-full font-semibold">
                  PRO Edition
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Autonomous Knowledge-Driven Test Automation</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('agent')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 ${
                activeTab === 'agent'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>QA Agent</span>
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 ${
                activeTab === 'knowledge'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>QA Knowledge Drive</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 rounded text-[10px]">
                {docCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 ${
                activeTab === 'sandbox'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Target Sandbox</span>
            </button>
          </nav>

          {/* Actions & Theme Toggle */}
          <div className="flex items-center gap-2.5">
            {/* Google Drive Cloud Connect Button */}
            <button
              onClick={onOpenDriveModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold transition border border-indigo-200 dark:border-indigo-500/30"
            >
              <CloudDownload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Connect Drive API</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs transition border border-slate-200 dark:border-slate-700 flex items-center justify-center"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Index'}</span>
            </button>

            <a
              href="/sandbox"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold transition"
            >
              <span>App Sandbox</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
