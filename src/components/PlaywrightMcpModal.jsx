import React, { useState, useEffect } from 'react';
import { X, Cpu, CheckCircle, AlertCircle, RefreshCw, Unlink, Activity, ShieldCheck, Play, Globe } from 'lucide-react';

export default function PlaywrightMcpModal({ isOpen, onClose, isMcpConnected, isExecuting, onToggleConnection }) {
  const [latency, setLatency] = useState(null);
  const [isPinging, setIsPinging] = useState(false);
  const [mcpInfo, setMcpInfo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchMcpInfo();
      pingServer();
    }
  }, [isOpen]);

  const fetchMcpInfo = async () => {
    try {
      const res = await fetch('/api/mcp/status');
      const data = await res.json();
      setMcpInfo(data);
    } catch (e) {
      console.error("Failed to fetch MCP status:", e);
    }
  };

  const pingServer = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await fetch('/api/mcp/status');
      const end = performance.now();
      setLatency(Math.round(end - start));
    } catch (e) {
      setLatency(null);
    } finally {
      setIsPinging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Playwright MCP Engine Controller</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Manage real-time browser automation runner & WebSocket streaming</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Engine Status Card */}
        <div className={`p-4 rounded-xl border transition ${
          isMcpConnected
            ? 'bg-emerald-500/5 border-emerald-500/30'
            : 'bg-rose-500/5 border-rose-500/30'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${
                isExecuting
                  ? 'bg-indigo-500 animate-ping'
                  : isMcpConnected
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-rose-500'
              }`}></div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isExecuting
                      ? 'Playwright MCP: Executing Tests...'
                      : isMcpConnected
                      ? 'Playwright MCP: Online & Connected'
                      : 'Playwright MCP: Disconnected'}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isMcpConnected
                    ? 'WebSocket streaming bridge active on port 3000'
                    : 'WebSocket connection paused or server offline'}
                </p>
              </div>
            </div>

            {/* Quick Ping / Latency Badge */}
            {isMcpConnected && (
              <div className="flex items-center gap-2">
                <button
                  onClick={pingServer}
                  disabled={isPinging}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <Activity className={`w-3.5 h-3.5 text-indigo-500 ${isPinging ? 'animate-spin' : ''}`} />
                  <span>{latency !== null ? `${latency}ms` : 'Ping'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Engine Specs & Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Automated Browser</span>
            <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Chromium (Visible Playwright)</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Streaming Channel</span>
            <div className="font-semibold text-slate-900 dark:text-slate-200 font-mono">
              ws://localhost:3000
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Target Application</span>
            <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span>Configurable (Prompt / URL)</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">MCP Protocol Version</span>
            <div className="font-semibold text-slate-900 dark:text-slate-200 font-mono text-indigo-600 dark:text-indigo-400">
              @playwright/mcp v1.44+
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Connection & Stream Control
          </label>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {isMcpConnected ? (
              <button
                type="button"
                onClick={() => onToggleConnection(false)}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <Unlink className="w-4 h-4" />
                <span>Disconnect Playwright MCP</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleConnection(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reconnect Playwright MCP</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition text-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
