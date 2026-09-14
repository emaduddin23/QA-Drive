import React from 'react';
import { ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';

export default function SandboxPreview() {
  const [iframeKey, setIframeKey] = React.useState(0);

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Target Application Sandbox</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive E-Commerce Checkout App (Quantity limits 1–10, coupons, credit card checks).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIframeKey(k => k + 1)}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition text-xs flex items-center gap-1 border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset App</span>
          </button>
          <a
            href="/sandbox"
            target="_blank"
            rel="noreferrer"
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-xs font-semibold flex items-center gap-1"
          >
            <span>Open New Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-[650px] shadow-2xl">
        <iframe
          key={iframeKey}
          src="/sandbox"
          title="Target Application Sandbox"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
