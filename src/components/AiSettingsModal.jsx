import React, { useState, useEffect } from 'react';
import { X, Sparkles, Key, CheckCircle, AlertCircle, RefreshCw, Cpu, Zap, Globe, ChevronDown, Code, Bot } from 'lucide-react';

export default function AiSettingsModal({ isOpen, onClose, onConfigSaved }) {
  const [provider, setProvider] = useState('opencode');
  const [model, setModel] = useState('opencode-coder-7b');
  const [customModelInput, setCustomModelInput] = useState('');

  const [antigravityKey, setAntigravityKey] = useState('');
  const [opencodeKey, setOpencodeKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null);

  const modelOptions = {
    antigravity: [
      { id: 'antigravity-2.0-pro', name: 'Antigravity 2.0 Pro (Autonomous QA Agent)' },
      { id: 'antigravity-2.0-flash', name: 'Antigravity 2.0 Flash (Fast Reasoning)' },
      { id: 'antigravity-deep-reasoning', name: 'Antigravity Deep Reasoning Engine' },
      { id: 'custom', name: '✏️ Enter Custom Antigravity Agent Model...' }
    ],
    opencode: [
      { id: 'opencode-coder-7b', name: 'OpenCode Coder 7B (Free Fast Coding)' },
      { id: 'opencode-zenith-1', name: 'OpenCode Zenith 1 (High Reasoning)' },
      { id: 'opencode-instruct', name: 'OpenCode Instruct (General Agent)' },
      { id: 'custom', name: '✏️ Enter Custom OpenCode Model...' }
    ],
    openrouter: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Anthropic)' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 / Chat (DeepSeek)' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (OpenAI via OpenRouter)' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct (Meta)' },
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (Google)' },
      { id: 'custom', name: '✏️ Enter Custom OpenRouter Model...' }
    ],
    gemini: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast & Balanced)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (High Reasoning)' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental' }
    ],
    openai: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Intelligent)' },
      { id: 'gpt-4o', name: 'GPT-4o (Omni High Reasoning)' },
      { id: 'o3-mini', name: 'o3 Mini (STEM Reasoning)' }
    ]
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/ai/config');
      const data = await res.json();
      setCurrentConfig(data);
      if (data.provider) setProvider(data.provider);
      if (data.model) {
        setModel(data.model);
        const existing = modelOptions[data.provider || 'antigravity']?.find(m => m.id === data.model);
        if (!existing && data.model) {
          setModel('custom');
          setCustomModelInput(data.model);
        }
      }
    } catch (e) {
      console.error("Failed to load AI config:", e);
    }
  };

  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    const defaultModel = modelOptions[newProvider]?.[0]?.id || '';
    setModel(defaultModel);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);

    const activeModel = (model === 'custom' ? customModelInput.trim() : model) || 'antigravity-2.0-pro';

    // Determine which key to validate based on selected provider
    const keyMap = {
      antigravity: antigravityKey.trim(),
      opencode: opencodeKey.trim(),
      openrouter: openrouterKey.trim(),
      openai: openaiKey.trim(),
      gemini: geminiKey.trim()
    };
    const keyToValidate = keyMap[provider] || '';

    // If a key is provided, validate it before saving configuration
    if (keyToValidate) {
      try {
        const validateRes = await fetch('/api/ai/validate-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, key: keyToValidate })
        });
        const validateData = await validateRes.json();
        if (!validateData.valid) {
          setStatusMsg({ type: 'error', text: validateData.error || 'Invalid API key.' });
          setIsSaving(false);
          return;
        }
      } catch (e) {
        setStatusMsg({ type: 'error', text: 'Error validating API key.' });
        setIsSaving(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model: activeModel,
          antigravityKey: antigravityKey.trim() || undefined,
          opencodeKey: opencodeKey.trim() || undefined,
          openrouterKey: openrouterKey.trim() || undefined,
          geminiKey: geminiKey.trim() || undefined,
          openaiKey: openaiKey.trim() || undefined
        })
      });
      const data = await res.json();

      if (data.success) {
        setStatusMsg({ type: 'success', text: 'Google Antigravity Agent & Provider configuration saved successfully!' });
        fetchConfig();
        if (onConfigSaved) onConfigSaved(data.config);
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to save configuration.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error connecting to backend server.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">AI Engine & Subscription Settings</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Configure Google Antigravity 2.0, OpenCode, OpenRouter, or Gemini API Keys</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Engine Card */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${currentConfig?.hasKey
            ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-indigo-500/5 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
          }`}>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <div className="font-bold flex items-center gap-2">
                <span>Active Provider: {currentConfig?.provider?.toUpperCase() || 'ANTIGRAVITY'}</span>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded font-mono font-semibold">
                  {currentConfig?.model || 'antigravity-2.0-pro'}
                </span>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                {currentConfig?.hasKey ? `Subscription Active / Key Connected (${currentConfig.maskedKey})` : 'No API Key set (Using Built-in Autonomous Engine)'}
              </p>
            </div>
          </div>
          <Zap className="w-4 h-4 shrink-0" />
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${statusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-700 dark:text-rose-300'
            }`}>
            {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">

          {/* Provider Selection Cards */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">1. Select AI Provider</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => handleProviderChange('antigravity')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${provider === 'antigravity'
                    ? 'bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border-indigo-500 text-slate-900 dark:text-white ring-2 ring-indigo-500/30 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Antigravity</span>
                  <Bot className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <span className="text-[9px] text-slate-500 truncate">2.0 Pro Agent</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('opencode')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${provider === 'opencode'
                    ? 'bg-cyan-500/10 border-cyan-500 text-slate-900 dark:text-white ring-2 ring-cyan-500/20'
                    : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">OpenCode</span>
                  <Code className="w-3.5 h-3.5 text-cyan-500" />
                </div>
                <span className="text-[9px] text-slate-500 truncate">Zenith &amp; 7B</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('openrouter')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${provider === 'openrouter'
                    ? 'bg-violet-500/10 border-violet-500 text-slate-900 dark:text-white ring-2 ring-violet-500/20'
                    : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">OpenRouter</span>
                  <Globe className="w-3.5 h-3.5 text-violet-500" />
                </div>
                <span className="text-[9px] text-slate-500 truncate">Claude, DeepSeek</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${provider === 'gemini'
                    ? 'bg-indigo-500/10 border-indigo-500 text-slate-900 dark:text-white ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Gemini</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <span className="text-[9px] text-slate-500 truncate">1.5 / 2.0 Flash</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${provider === 'openai'
                    ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">OpenAI</span>
                  <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className="text-[9px] text-slate-500 truncate">GPT-4o &amp; Mini</span>
              </button>
            </div>
          </div>

          {/* API Keys Inputs */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">2. API Key &amp; Subscription Token</label>

            {/* Antigravity Key */}
            {provider === 'antigravity' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Antigravity API Key / Subscription Key</span>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    {currentConfig?.savedKeys?.antigravity ? `✓ Key Saved (${currentConfig.provider === 'antigravity' ? currentConfig.maskedKey : 'Active'})` : 'Google Antigravity 2.0 Subscribed ✓'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={antigravityKey}
                    onChange={(e) => setAntigravityKey(e.target.value)}
                    placeholder={currentConfig?.savedKeys?.antigravity ? "Key already saved (type to replace)" : "Paste Antigravity API Key or Gemini Key"}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-indigo-500/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-mono"
                  />
                  <Bot className="w-4 h-4 text-indigo-500 absolute left-3 top-3" />
                </div>
              </div>
            )}

            {/* OpenCode Key */}
            {provider === 'opencode' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">OpenCode AI API Key</span>
                    {currentConfig?.savedKeys?.opencode && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded font-semibold">
                        ✓ Saved ({currentConfig.provider === 'opencode' ? currentConfig.maskedKey : 'Active'})
                      </span>
                    )}
                  </div>
                  <a href="https://opencode.ai" target="_blank" rel="noreferrer" className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline">
                    Get OpenCode Key ↗
                  </a>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={opencodeKey}
                    onChange={(e) => setOpencodeKey(e.target.value)}
                    placeholder={currentConfig?.savedKeys?.opencode ? "Key already saved (type to replace)" : "Paste OpenCode Key (opencode-api-key-...)"}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none dark:text-white font-mono"
                  />
                  <Key className="w-4 h-4 text-cyan-500 absolute left-3 top-3" />
                </div>
              </div>
            )}

            {/* OpenRouter Key */}
            {provider === 'openrouter' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">OpenRouter API Key</span>
                    {currentConfig?.savedKeys?.openrouter && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded font-semibold">
                        ✓ Saved ({currentConfig.provider === 'openrouter' ? currentConfig.maskedKey : 'Active'})
                      </span>
                    )}
                  </div>
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline">
                    Get OpenRouter Key ↗
                  </a>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={openrouterKey}
                    onChange={(e) => setOpenrouterKey(e.target.value)}
                    placeholder={currentConfig?.savedKeys?.openrouter ? "Key already saved (type to replace)" : "Paste OpenRouter Key (sk-or-v1-...)"}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none dark:text-white font-mono"
                  />
                  <Key className="w-4 h-4 text-violet-500 absolute left-3 top-3" />
                </div>
              </div>
            )}

            {/* Gemini Key */}
            {provider === 'gemini' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Google Gemini API Key</span>
                    {currentConfig?.savedKeys?.gemini && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded font-semibold">
                        ✓ Saved ({currentConfig.provider === 'gemini' ? currentConfig.maskedKey : 'Active'})
                      </span>
                    )}
                  </div>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
                    Get Gemini Key ↗
                  </a>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={currentConfig?.savedKeys?.gemini ? "Key already saved (type to replace)" : "Paste Gemini Key (AIzaSy...)"}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-mono"
                  />
                  <Key className="w-4 h-4 text-indigo-500 absolute left-3 top-3" />
                </div>
              </div>
            )}

            {/* OpenAI Key */}
            {provider === 'openai' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">OpenAI API Key</span>
                    {currentConfig?.savedKeys?.openai && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded font-semibold">
                        ✓ Saved ({currentConfig.provider === 'openai' ? currentConfig.maskedKey : 'Active'})
                      </span>
                    )}
                  </div>
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline">
                    Get OpenAI Key ↗
                  </a>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder={currentConfig?.savedKeys?.openai ? "Key already saved (type to replace)" : "Paste OpenAI Key (sk-proj-...)"}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white font-mono"
                  />
                  <Key className="w-4 h-4 text-emerald-500 absolute left-3 top-3" />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              <span>Save &amp; Connect Antigravity Agent</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
