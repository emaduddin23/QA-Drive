import React from 'react';
import { CheckCircle2, XCircle, Camera } from 'lucide-react';

export default function ExecutionMonitor({ isExecuting, currentStep, executionResults, finalReport }) {
  if (!isExecuting && executionResults.length === 0 && !finalReport) {
    return null;
  }

  const passedCount = executionResults.filter(r => r.status === 'PASSED').length;
  const failedCount = executionResults.filter(r => r.status === 'FAILED').length;
  const totalCount = executionResults.length;

  return (
    <div className="space-y-6">
      {/* Real-time Progress Bar Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-emerald-500/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Playwright Automation Suite Execution</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Executing synthesized BVA & Equivalence Partitioning test cases live in Playwright Chromium.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-center min-w-[70px]">
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{totalCount}</div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">Total</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 rounded-xl px-3 py-1.5 text-center min-w-[70px]">
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{passedCount}</div>
              <div className="text-[9px] text-emerald-700 dark:text-emerald-300 uppercase">Passed</div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/30 rounded-xl px-3 py-1.5 text-center min-w-[70px]">
              <div className="text-sm font-bold text-rose-600 dark:text-rose-400">{failedCount}</div>
              <div className="text-[9px] text-rose-700 dark:text-rose-300 uppercase">Failed</div>
            </div>
          </div>
        </div>

        {/* Live Step Progress Log */}
        {isExecuting && (
          <div className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono text-indigo-300">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Executing Step {currentStep?.stepIndex || 1}...</span>
            </div>
            <span className="text-slate-400">{currentStep?.testCase?.title}</span>
          </div>
        )}
      </div>

      {/* Step Execution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {executionResults.map((res, index) => {
          const isPass = res.status === 'PASSED';
          return (
            <div
              key={index}
              className={`glass-panel rounded-xl p-4 border transition ${
                isPass ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/40' : 'border-rose-400 dark:border-rose-500/40 bg-rose-50/40 dark:bg-rose-950/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {isPass ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
                  )}
                  <div>
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold mr-2">
                      STEP #{res.stepNum} ({res.testCase.id})
                    </span>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200 mt-0.5">{res.testCase.title}</h4>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{res.durationMs}ms</span>
              </div>

              {/* Execution Details & Screenshot */}
              <div className="space-y-2 mt-3">
                <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1">
                  <div className="text-slate-300">
                    <span className="text-indigo-400 font-bold">Technique:</span> {res.testCase.technique}
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-400 font-bold">Actual DOM Response:</span> {res.actualOutput}
                  </div>
                </div>

                {/* Screenshot Preview */}
                {res.screenshotUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 group">
                    <img
                      src={res.screenshotUrl}
                      alt={`Screenshot for ${res.testCase.id}`}
                      className="w-full h-36 object-cover object-top opacity-90 group-hover:opacity-100 transition"
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
