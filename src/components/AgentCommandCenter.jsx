import React, { useState } from 'react';
import { Send, Sparkles, Play, Layers, BookOpen } from 'lucide-react';

export default function AgentCommandCenter({ onGeneratePlan, isPlanning, currentPlan, onExecuteSuite, isExecuting }) {
  const [prompt, setPrompt] = useState('Test the checkout feature quantity validation using Boundary Value Analysis');

  const samplePrompts = [
    "Test the checkout feature quantity validation using Boundary Value Analysis",
    "Test promo code validation using Equivalence Partitioning",
    "Perform regression test against historical checkout defects",
    "Test checkout button behavior on invalid inputs"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() || isPlanning) return;
    onGeneratePlan(prompt);
  };

  return (
    <div className="space-y-6">
      {/* Prompt Input Box */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-colors">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
            AUTONOMOUS AI QA AGENT
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tell the AI QA Agent what feature to test... (e.g. 'Test the checkout feature quantity validation')"
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans shadow-inner resize-none transition-colors"
            />
            <button
              type="submit"
              disabled={isPlanning || !prompt.trim()}
              className="absolute right-3 bottom-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {isPlanning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Reasoning...</span>
                </>
              ) : (
                <>
                  <span>Analyze & Plan</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mr-2">Try sample instructions:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(sp);
                    onGeneratePlan(sp);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-left font-medium"
                >
                  <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>{sp}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* AI Agent Reasoning & Execution Flow */}
      {currentPlan && (
        <div className="space-y-6">
          {/* Retrieved Knowledge Sources */}
          <div className="glass-panel rounded-xl p-5 border border-indigo-500/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Retrieved Knowledge Sources (Drive RAG/MCP)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {currentPlan.retrievedKnowledge.map((rk, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.2 bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 rounded border border-indigo-200 dark:border-transparent">
                      {rk.category}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Matched</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-200 mt-1">{rk.title}</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono italic">{rk.snippet}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Synthesized Test Cases Matrix */}
          <div className="glass-panel rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Synthesized Test Matrix ({currentPlan.testCases.length} Scenarios)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Generated automatically by applying BVA boundary rules & historical defect checks to project specs.
                </p>
              </div>

              <button
                onClick={onExecuteSuite}
                disabled={isExecuting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-900/40 flex items-center gap-2 disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Playwright Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run Playwright Suite</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-400 font-semibold">
                    <th className="p-3 font-mono">ID</th>
                    <th className="p-3">Test Scenario</th>
                    <th className="p-3">QA Technique</th>
                    <th className="p-3">KB Source</th>
                    <th className="p-3">Expected Behavior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                  {currentPlan.testCases.map((tc) => (
                    <tr key={tc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">{tc.id}</td>
                      <td className="p-3 text-slate-900 dark:text-slate-200 font-sans font-medium">{tc.title}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 rounded text-[10px] font-semibold">
                          {tc.technique}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px] truncate max-w-[180px]">{tc.kbReference}</td>
                      <td className="p-3 text-slate-800 dark:text-slate-300">{tc.expectedResult}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
