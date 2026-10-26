import React, { useState, useEffect } from 'react';
import { X, Sparkles, Key, CheckCircle, AlertCircle, RefreshCw, Cpu, Zap, Globe, ChevronDown, Code, Bot, Route } from 'lucide-react';

export default function AiSettingsModal({ isOpen, onClose, onConfigSaved }) {
  const [provider, setProvider] = useState('opencode');
  const [model, setModel] = useState('opencode-coder-7b');
  const [customModelInput, setCustomModelInput] = useState('');

  const [antigravityKey, setAntigravityKey] = useState('');
  const [opencodeKey, setOpencodeKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [ninerouterKey, setNinerouterKey] = useState('');
  const [ninerouterBaseUrl, setNinerouterBaseUrl] = useState('http://localhost:20128/v1');

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [dynamicModels, setDynamicModels] = useState({ '9router': [] });
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const debounceTimerRef = React.useRef(null);

  const modelOptions = {
    '9router': [
      { id: 'ocz/deepseek-v4-flash-free', name: '🟢 [FREE] DeepSeek V4 Flash Free (No API Cost)', isFree: true },
      { id: 'ocz/mimo-v2.6-flash-free', name: '🟢 [FREE] Mimo V2.6 Flash Free (No API Cost)', isFree: true },
      { id: 'opencode-go/space-bunny-free', name: '🟢 [FREE] Space Bunny Free (No API Cost)', isFree: true },
      { id: 'kr/claude-sonnet-4.5', name: 'Claude Sonnet 4.5 (9Router Smart Fallback)' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (via 9Router)' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 / Chat (via 9Router)' },
      { id: 'openai/gpt-4o', name: 'GPT-4o (via 9Router)' },
      { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash (via 9Router)' },
      { id: 'custom', name: '✏️ Enter Custom 9Router Model...' }
    ],
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
    deepseek: [
      { id: 'deepseek-chat', name: 'DeepSeek V3 / Chat (High Performance)' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1 / Reasoner (Deep Logic)' },
      { id: 'custom', name: '✏️ Enter Custom DeepSeek Model...' }
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

  const fetchModelsFrom9Router = async (keyToUse, urlToUse, notify = false) => {
    setIsLoadingModels(true);
    try {
      const res = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: '9router',
          key: keyToUse !== undefined ? keyToUse : ninerouterKey,
          baseUrl: urlToUse !== undefined ? urlToUse : ninerouterBaseUrl
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.models) && data.models.length > 0) {
        setDynamicModels(prev => ({
          ...prev,
          '9router': data.models
        }));
        if (!data.models.some(m => m.id === model) && model !== 'custom') {
          setModel(data.models[0].id);
        }
        if (notify) {
          setStatusMsg({
            type: 'success',
            text: `Successfully fetched ${data.models.length} models from 9Router!`
          });
        }
      } else if (notify && data.error) {
        setStatusMsg({ type: 'error', text: data.error });
      }
    } catch (err) {
      if (notify) {
        setStatusMsg({ type: 'error', text: `Failed to fetch 9Router models: ${err.message}` });
      }
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handle9RouterKeyChange = (newKey) => {
    setNinerouterKey(newKey);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchModelsFrom9Router(newKey, ninerouterBaseUrl, false);
    }, 600);
  };

  const handle9RouterKeyPaste = (e) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted && pasted.trim()) {
      setNinerouterKey(pasted.trim());
      fetchModelsFrom9Router(pasted.trim(), ninerouterBaseUrl, true);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/ai/config');
      const data = await res.json();
      setCurrentConfig(data);
      if (data.provider) setProvider(data.provider);
      if (data.ninerouterBaseUrl) setNinerouterBaseUrl(data.ninerouterBaseUrl);
      if (data.provider === '9router') {
        fetchModelsFrom9Router(data.ninerouterKey || '', data.ninerouterBaseUrl, false);
      }
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
    setStatusMsg(null);
    if (newProvider === '9router') {
      fetchModelsFrom9Router(ninerouterKey, ninerouterBaseUrl, false);
    }
    const available = (newProvider === '9router' && dynamicModels['9router']?.length > 0)
      ? dynamicModels['9router']
      : (modelOptions[newProvider] || []);
    const defaultModel = available[0]?.id || '';
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
      deepseek: deepseekKey.trim(),
      openrouter: openrouterKey.trim(),
      openai: openaiKey.trim(),
      gemini: geminiKey.trim(),
      '9router': ninerouterKey.trim()
    };
    const keyToValidate = keyMap[provider] || '';

    // If a key is provided, or if 9router is selected, validate before saving configuration
    if (keyToValidate || provider === '9router') {
      try {
        const validateRes = await fetch('/api/ai/validate-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            key: keyToValidate,
            baseUrl: ninerouterBaseUrl.trim()
          })
        });
        const validateData = await validateRes.json();
        if (!validateData.valid) {
          setStatusMsg({ type: 'error', text: validateData.error || 'Validation failed.' });
          setIsSaving(false);
          return;
        }
      } catch (e) {
        setStatusMsg({ type: 'error', text: 'Error validating AI settings.' });
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
          deepseekKey: deepseekKey.trim() || undefined,
          openrouterKey: openrouterKey.trim() || undefined,
          geminiKey: geminiKey.trim() || undefined,
          openaiKey: openaiKey.trim() || undefined,
          ninerouterKey: ninerouterKey.trim() || undefined,
          ninerouterBaseUrl: ninerouterBaseUrl.trim() || undefined
        })
      });
      const data = await res.json();

      if (data.success) {
        const providerLabels = {
          antigravity: 'Google Antigravity Agent',
          opencode: 'OpenCode Agent',
          deepseek: 'DeepSeek Engine',
          openrouter: 'OpenRouter Engine',
          gemini: 'Google Gemini Engine',
          openai: 'OpenAI Model',
          '9router': '9Router Gateway'
        };
        const label = providerLabels[provider] || 'AI Engine';
        setStatusMsg({ type: 'success', text: `${label} configuration saved successfully!` });
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
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">AI Engine &amp; Subscription Settings</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Configure Google Antigravity 2.0, OpenCode, DeepSeek, OpenRouter, or Gemini API Keys</p>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
              <button
                type="button"
                onClick={() => handleProviderChange('antigravity')}
                className={`p-2 rounded-xl border text-left transition flex flex-col gap-1 ${provider === 'antigravity'
                    ? 'bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border-indigo-500 text-slate-900 dark:text-white ring-2 ring-indigo-500/30 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">Antigravity</span>
                  <Bot className="w-3 h-3 text-indigo-500" />
                </div>
                <span className="text-[9px] text-slate-500 truncate">2.0 Pro</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('9router')}
                className={`p-2 rounded-xl border text-left transition flex flex-col gap-1 ${provider === '9router'
                    ? 'bg-amber-500/10 border-amber-500 text-slate-900 dark:text-white ring-2 ring-amber-500/20 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">9Router</span>
                  <Route className="w-3 h-3 text-amber-500" />
                </div>
                <span className="text-[9px] text-slate-500 truncate">Gateway / Local</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('opencode')}
                className={`p-2 rounded-xl border text-left transition flex flex-col gap-1 ${provider === 'opencode'
                    ? 'bg-cyan-500/10 border-cyan-500 text-slate-900 dark:text-white ring-2 ring-cyan-500/20 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">OpenCode</span>
                  <Code className="w-3 h-3 text-cyan-500" />
                </div>
                <span className="text-[9px] text-slate-500 truncate">Zenith/7B</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('deepseek')}
                className={`p-2 rounded-xl border text-left transition flex flex-col gap-1 ${provider === 'deepseek'
                    ? 'bg-blue-500/10 border-blue-500 text-slate-900 dark:text-white ring-2 ring-blue-500/20 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">DeepSeek</span>
                  <Sparkles className="w-3 h-3 text-blue-500" />
                </div>
                <span className="text-[9px] text-slate-500 truncate">V3 / R1</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('openrouter')}
                className={`p-2 rounded-xl border text-left transition flex flex-col gap-1 ${provider === 'openrouter'
                    ? 'bg-violet-500/10 border-violet-500 text-slate-900 dark:text-white ring-2 ring-violet-500/20 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">OpenRouter</span>
                  <Globe className="w-3 h-3 text-violet-500" />
                </div>
                <span className="text-[9px] text-slate-500 truncate">Claude</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`p-2 rounded-xl border text-left transition flex flex-col gap-1 ${provider === 'gemini'
                    ? 'bg-indigo-500/10 border-indigo-500 text-slate-900 dark:text-white ring-2 ring-indigo-500/20 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">Gemini</span>
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                </div>
                <span className="text-[9px] text-slate-500 truncate">1.5 Flash</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`p-2 rounded-xl border text-left transition flex flex-col gap-1 ${provider === 'openai'
                    ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white ring-2 ring-emerald-500/20 font-bold'
                    : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">OpenAI</span>
                  <Cpu className="w-3 h-3 text-emerald-500" />
                </div>
                <span className="text-[9px] text-slate-500 truncate">GPT-4o</span>
              </button>
            </div>
          </div>

          {/* 2. Model Selection Dropdown */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">2. Select AI Model</label>
              {provider === '9router' && (
                <button
                  type="button"
                  onClick={() => fetchModelsFrom9Router(ninerouterKey, ninerouterBaseUrl, true)}
                  disabled={isLoadingModels}
                  className="text-[10px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold flex items-center gap-1 transition"
                  title="Fetch all live models from 9Router"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} />
                  <span>
                    {isLoadingModels ? 'Fetching Models...' : dynamicModels['9router']?.length > 0 ? `Refresh Models (${dynamicModels['9router'].length} loaded)` : 'Fetch 9Router Models'}
                  </span>
                </button>
              )}
            </div>

            {/* Mention Free Model status prominently above the model name */}
            {provider === '9router' && (
              <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {(() => {
                      const list = dynamicModels['9router']?.length > 0 ? dynamicModels['9router'] : modelOptions['9router'];
                      const freeCount = list.filter(m => m.isFree || /(:free|-free|\bfree\b)/i.test(m.id)).length;
                      const isCurrentFree = /(:free|-free|\bfree\b)/i.test(model);
                      if (isCurrentFree) {
                        return `Selected: 🟢 FREE MODEL (No API cost) • ${freeCount} Free Models Available`;
                      }
                      return `🎁 ${freeCount} Free Models Available Above in Dropdown (Zero API Cost)`;
                    })()}
                  </span>
                </div>
                {!/(:free|-free|\bfree\b)/i.test(model) && (
                  <button
                    type="button"
                    onClick={() => {
                      const list = dynamicModels['9router']?.length > 0 ? dynamicModels['9router'] : modelOptions['9router'];
                      const firstFree = list.find(m => m.isFree || /(:free|-free|\bfree\b)/i.test(m.id));
                      if (firstFree) setModel(firstFree.id);
                    }}
                    className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 underline hover:opacity-80"
                  >
                    Switch to Free Model ↗
                  </button>
                )}
              </div>
            )}

            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-medium appearance-none"
              >
                {provider === '9router' ? (
                  <>
                    {(() => {
                      const fullList = dynamicModels['9router']?.length > 0
                        ? dynamicModels['9router']
                        : modelOptions['9router'];
                      const freeList = fullList.filter(m => m.isFree || /(:free|-free|\bfree\b)/i.test(m.id));
                      const standardList = fullList.filter(m => !(m.isFree || /(:free|-free|\bfree\b)/i.test(m.id)) && m.id !== 'custom');

                      return (
                        <>
                          {freeList.length > 0 && (
                            <optgroup label={`🟢 FREE MODELS (${freeList.length} AVAILABLE - ZERO TOKEN COST)`}>
                              {freeList.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name.startsWith('🟢') ? m.name : `🟢 [FREE] ${m.name}`}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {standardList.length > 0 && (
                            <optgroup label="⚡ STANDARD & REASONING MODELS">
                              {standardList.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="✏️ CUSTOM MODEL">
                            <option value="custom">✏️ Enter Custom 9Router Model...</option>
                          </optgroup>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  (modelOptions[provider] || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {model === 'custom' && (
              <input
                type="text"
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                placeholder="Type custom model name (e.g., deepseek-reasoner)..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white mt-1.5 font-mono"
              />
            )}
          </div>

          {/* 3. API Keys Inputs */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">3. API Key &amp; Subscription Token</label>

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

            {/* 9Router Config */}
            {provider === '9router' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">9Router Gateway Base URL</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold font-mono">
                      Default: http://localhost:20128/v1
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={ninerouterBaseUrl}
                      onChange={(e) => setNinerouterBaseUrl(e.target.value)}
                      placeholder="http://localhost:20128/v1"
                      className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-amber-500/30 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white font-mono"
                    />
                    <Route className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">9Router API Key (Optional)</span>
                      {currentConfig?.savedKeys?.['9router'] && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded font-semibold">
                          ✓ Saved ({currentConfig.provider === '9router' ? currentConfig.maskedKey : 'Active'})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchModelsFrom9Router(ninerouterKey, ninerouterBaseUrl, true)}
                      disabled={isLoadingModels}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} />
                      <span>{isLoadingModels ? 'Fetching Models...' : 'Fetch Models'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={ninerouterKey}
                      onChange={(e) => handle9RouterKeyChange(e.target.value)}
                      onPaste={handle9RouterKeyPaste}
                      placeholder={currentConfig?.savedKeys?.['9router'] ? "Key saved (paste/type to auto-fetch models)" : "Paste 9Router API Key to auto-load models"}
                      className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white font-mono"
                    />
                    <Key className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Paste your API key to automatically retrieve all models from 9Router.</span>
                    {dynamicModels['9router']?.length > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                        ✓ {dynamicModels['9router'].length} models retrieved
                      </span>
                    )}
                  </div>
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

            {/* DeepSeek Key */}
            {provider === 'deepseek' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">DeepSeek API Key</span>
                    {currentConfig?.savedKeys?.deepseek && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded font-semibold">
                        ✓ Saved ({currentConfig.provider === 'deepseek' ? currentConfig.maskedKey : 'Active'})
                      </span>
                    )}
                  </div>
                  <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline">
                    Get DeepSeek Key ↗
                  </a>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={deepseekKey}
                    onChange={(e) => setDeepseekKey(e.target.value)}
                    placeholder={currentConfig?.savedKeys?.deepseek ? "Key already saved (type to replace)" : "Paste DeepSeek API Key (sk-...)"}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white font-mono"
                  />
                  <Key className="w-4 h-4 text-blue-500 absolute left-3 top-3" />
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
              <span>
                Save &amp; Connect {
                  provider === 'deepseek' ? 'DeepSeek Engine' :
                  provider === 'opencode' ? 'OpenCode Agent' :
                  provider === 'openrouter' ? 'OpenRouter Engine' :
                  provider === 'openai' ? 'OpenAI Model' :
                  provider === 'gemini' ? 'Gemini Engine' :
                  provider === '9router' ? '9Router Gateway' :
                  'Antigravity Agent'
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
