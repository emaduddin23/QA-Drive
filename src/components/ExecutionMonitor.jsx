import { CheckCircle2, XCircle, Camera, Activity, Cpu, Send, StopCircle, Download } from 'lucide-react';
import { useState } from 'react';

export default function ExecutionMonitor({ isExecuting, isInteractive, onSendInteractiveCommand, onStopInteractive, currentStep, executionResults, finalReport, isMcpConnected }) {
  const [chatInput, setChatInput] = useState('');

  const handleSend = () => {
    if (chatInput.trim()) {
      onSendInteractiveCommand(chatInput);
      setChatInput('');
    }
  };

  const handleDownloadCSV = () => {
    if (!executionResults || executionResults.length === 0) return;
    
    // Create CSV content
    const headers = ['Test Case ID', 'Title', 'Technique', 'Expected Result', 'Status', 'Actual Output', 'Duration (ms)'];
    const rows = executionResults.map(res => {
      const tc = res.testCase || {};
      return [
        tc.id || '',
        (tc.title || '').replace(/"/g, '""'),
        tc.technique || '',
        (tc.expectedResult || '').replace(/"/g, '""'),
        res.status || '',
        (res.actualOutput || '').replace(/"/g, '""'),
        res.durationMs || 0
      ].map(val => `"${val}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `test-cases-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isExecuting && !isInteractive && executionResults.length === 0 && !finalReport) {
    return null;
  }

  const passedCount = executionResults.filter(r => r.status === 'PASSED').length;
  const failedCount = executionResults.filter(r => r.status === 'FAILED').length;
  const totalCount = executionResults.length;

  return (
    <div className="space-y-6">
      {/* Real-time Progress Bar Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-emerald-500/20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Playwright Automation Suite Execution</h3>
              
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                <Cpu className="w-3 h-3" />
                Playwright MCP: {isMcpConnected ? 'Connected & Ready' : 'Connecting...'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Executing synthesized BVA & Equivalence Partitioning test cases live in Playwright Chromium.
            </p>
          </div>

          {/* Quick Metrics & Download */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {executionResults.length > 0 && (
              <button
                onClick={handleDownloadCSV}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                title="Download as CSV (Excel)"
              >
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
            )}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 items-center w-full sm:w-auto">
              <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 sm:px-3 py-1.5 text-center min-w-[60px] sm:min-w-[70px]">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{totalCount}</div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-medium">Total</div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 rounded-xl px-2.5 sm:px-3 py-1.5 text-center min-w-[60px] sm:min-w-[70px]">
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{passedCount}</div>
                <div className="text-[9px] text-emerald-700 dark:text-emerald-300 uppercase font-medium">Passed</div>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/30 rounded-xl px-2.5 sm:px-3 py-1.5 text-center min-w-[60px] sm:min-w-[70px]">
                <div className="text-sm font-bold text-rose-600 dark:text-rose-400">{failedCount}</div>
                <div className="text-[9px] text-rose-700 dark:text-rose-300 uppercase font-medium">Failed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Step Progress Log */}
        {isExecuting && (
          <div className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 text-xs font-mono text-indigo-300">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <span>Executing Step {currentStep?.stepIndex || 1}...</span>
            </div>
            <span className="text-slate-400 text-[11px] truncate max-w-full sm:max-w-[300px]">{currentStep?.testCase?.title}</span>
          </div>
        )}

        {/* Live Interactive Chat Area */}
        {isInteractive && (
          <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-indigo-500/30">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Playwright to do something (e.g., 'Go to google.com', 'Click Login')..."
                className="flex-1 bg-slate-950 text-white rounded-lg px-4 py-2.5 text-sm border border-slate-700 focus:outline-none focus:border-indigo-500 transition w-full"
                disabled={isExecuting}
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleSend}
                  disabled={isExecuting || !chatInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition flex-1 sm:flex-none"
                >
                  <Send className="w-4 h-4" /> Send
                </button>
                <button
                  onClick={onStopInteractive}
                  disabled={isExecuting}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition flex-1 sm:flex-none"
                >
                  <StopCircle className="w-4 h-4" /> Stop
                </button>
              </div>
            </div>
            {isExecuting && (
              <div className="text-xs text-indigo-400 mt-3 flex items-center gap-2 animate-pulse">
                <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                Executing command, please wait...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step Execution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {executionResults.map((res, index) => {
          const isPass = res.status === 'PASSED';
          return (
            <div
              key={index}
              className={`glass-panel rounded-xl p-3.5 sm:p-4 border transition ${
                isPass ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/40' : 'border-rose-400 dark:border-rose-500/40 bg-rose-50/40 dark:bg-rose-950/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5 mb-2">
                <div className="flex items-start sm:items-center gap-2">
                  {isPass ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
                  )}
                  <div>
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold mr-2">
                      STEP #{res.stepNum} ({res.testCase.id})
                    </span>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200 mt-0.5">{res.testCase.title}</h4>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">{res.durationMs}ms</span>
              </div>

              {/* Execution Details & Screenshot */}
              <div className="space-y-2 mt-3">
                <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1 overflow-x-auto">
                  <div className="text-slate-300">
                    <span className="text-indigo-400 font-bold">Technique:</span> {res.testCase.technique}
                  </div>
                  <div className="text-slate-300 break-words">
                    <span className="text-slate-400 font-bold">Actual DOM Response:</span> {res.actualOutput}
                  </div>
                </div>

                {/* Screenshot Preview */}
                {res.screenshotUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 group">
                    <img
                      src={res.screenshotUrl}
                      alt={`Screenshot for ${res.testCase.id}`}
                      className="w-full h-36 sm:h-44 object-cover object-top opacity-90 group-hover:opacity-100 transition"
                    />
                    <div className="absolute bottom-1 right-2 bg-slate-900/80 px-2 py-0.5 rounded text-[9px] text-slate-300 font-mono flex items-center gap-1">
                      <Camera className="w-2.5 h-2.5 text-indigo-400" /> Playwright Capture
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
