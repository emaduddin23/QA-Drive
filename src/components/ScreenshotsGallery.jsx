import React, { useState, useEffect } from 'react';
import { Camera, RefreshCw, Trash2, ExternalLink, Maximize2, Search, Calendar, HardDrive, Download, AlertCircle } from 'lucide-react';
import ScreenshotModal from './ScreenshotModal';

export default function ScreenshotsGallery() {
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeModalIndex, setActiveModalIndex] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchScreenshots = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/screenshots');
      const data = await res.json();
      setScreenshots(data.screenshots || []);
    } catch (err) {
      console.error("Failed to fetch screenshots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenshots();
  }, []);

  const handleDelete = async (filename, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete screenshot "${filename}"?`)) return;

    try {
      const res = await fetch(`/api/screenshots/${filename}`, { method: 'DELETE' });
      if (res.ok) {
        setScreenshots(prev => prev.filter(s => s.filename !== filename));
      }
    } catch (err) {
      console.error("Failed to delete screenshot:", err);
    }
  };

  const filtered = screenshots.filter(s =>
    s.filename.toLowerCase().includes(search.toLowerCase())
  );

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (mtime) => {
    if (!mtime) return '';
    return new Date(mtime).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Search */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-500/30">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Playwright Captured Screenshots
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  View, inspect full resolution, and download visual DOM snapshots captured during test runs.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by filename..."
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <button
              onClick={fetchScreenshots}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer"
              title="Refresh Screenshots"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2 text-xs">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading captured screenshots...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800">
          <Camera className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No screenshots found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? "No screenshots match your search query." : "Playwright captures screenshots automatically during Autonomous Crawler and Test Execution runs."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item, idx) => (
            <div
              key={item.filename}
              onClick={() => setActiveModalIndex(idx)}
              className="glass-panel rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 transition group cursor-pointer flex flex-col shadow-sm hover:shadow-md"
            >
              {/* Thumbnail Container */}
              <div className="relative h-44 bg-slate-950 overflow-hidden">
                <img
                  src={item.url}
                  alt={item.filename}
                  className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 group-hover:scale-105 transition duration-200"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <span className="bg-indigo-600/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                    <Maximize2 className="w-3.5 h-3.5" /> View Fullscreen
                  </span>
                </div>

                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    onClick={(e) => handleDelete(item.filename, e)}
                    className="p-1.5 bg-slate-900/80 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition opacity-0 group-hover:opacity-100"
                    title="Delete screenshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Footer Info */}
              <div className="p-3 bg-white/50 dark:bg-slate-900/50 flex flex-col justify-between flex-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                <div className="font-mono text-slate-800 dark:text-slate-200 font-semibold truncate" title={item.filename}>
                  {item.filename}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
                  <span>{formatSize(item.size)}</span>
                  <span>{formatDate(item.modifiedTime)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeModalIndex !== null && (
        <ScreenshotModal
          isOpen={true}
          onClose={() => setActiveModalIndex(null)}
          screenshots={filtered.map(s => ({
            url: s.url,
            title: s.filename,
            filename: s.filename
          }))}
          currentIndex={activeModalIndex}
          onNavigate={(newIdx) => setActiveModalIndex(newIdx)}
        />
      )}
    </div>
  );
}

