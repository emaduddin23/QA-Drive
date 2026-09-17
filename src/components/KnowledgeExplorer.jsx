import React, { useState } from 'react';
import { Search, FileText, CheckCircle, Sparkles, BookOpen, Bug, Cpu, CloudDownload, RefreshCw } from 'lucide-react';

export default function KnowledgeExplorer({ documents, stats, onRefresh, onOpenDriveModal, driveStatus, onOpenAiModal }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeDoc, setActiveDoc] = useState(documents[0] || null);

  const categories = ['All', 'QA Fundamentals', 'Test Techniques', 'Project Documents', 'Bug Knowledge'];

  const filteredDocs = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'All' || doc.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'test techniques':
        return <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'project documents':
        return <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'bug knowledge':
        return <Bug className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-semibold border border-indigo-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Indexed Google Drive Repository
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">QA Knowledge MCP Database</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              All testing techniques, boundary value rules, requirement specifications, and historical defect logs are indexed here for the AI QA Agent.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto justify-start lg:justify-end">
            {/* Configure AI Engine Button */}
            {onOpenAiModal && (
              <button
                onClick={onOpenAiModal}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>Configure AI Engine</span>
              </button>
            )}

            {/* Direct Connect Drive Button inside Knowledge Tab */}
            {onOpenDriveModal && (
              <button
                onClick={onOpenDriveModal}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg ${
                  driveStatus?.isConnected
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                {driveStatus?.isConnected ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Google Drive Connected ✓</span>
                  </>
                ) : (
                  <>
                    <CloudDownload className="w-4 h-4" />
                    <span>Connect Google Drive</span>
                  </>
                )}
              </button>
            )}

            <div className="bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3 sm:px-4 py-2 text-center flex-1 sm:flex-initial">
              <div className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">{stats?.totalDocs || documents.length}</div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Indexed Files</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3 sm:px-4 py-2 text-center flex-1 sm:flex-initial">
              <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">100%</div>
              <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">MCP Sync Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Knowledge Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Category & File Browser */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search boundary rules, BVA, defects..."
              className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex overflow-x-auto pb-1 gap-1.5 sm:flex-wrap scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Document List */}
          <div className="glass-panel rounded-xl p-2 space-y-1 max-h-[380px] lg:max-h-[500px] overflow-y-auto">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">No matching documents found</div>
            ) : (
              filteredDocs.map(doc => {
                const isSelected = activeDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setActiveDoc(doc)}
                    className={`p-3 rounded-lg cursor-pointer transition flex items-start gap-3 border ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-600/10 border-indigo-400 dark:border-indigo-500/40 text-slate-900 dark:text-white font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 border-transparent text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{getCategoryIcon(doc.category)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs truncate">{doc.title}</h4>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{(doc.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                          {doc.category}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">MCP Indexed</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Document Reader & Knowledge Chunks */}
        <div className="lg:col-span-7">
          {activeDoc ? (
            <div className="glass-panel rounded-xl p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">
                    {activeDoc.category}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">{activeDoc.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 break-all">{activeDoc.filename}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 px-2.5 py-1.5 rounded-lg text-emerald-700 dark:text-emerald-300 text-xs font-mono shrink-0">
                  <CheckCircle className="w-4 h-4" /> Ready for RAG Retrieval
                </div>
              </div>

              {/* Document Content View */}
              <div className="bg-slate-900 text-slate-100 dark:bg-slate-950/90 rounded-xl p-3.5 sm:p-4 border border-slate-800 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-[350px] sm:max-h-[440px] overflow-y-auto">
                {activeDoc.content}
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-8 sm:p-12 text-center text-slate-500 text-xs">
              Select a QA document from the list to inspect its contents.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
