import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink, Download, ZoomIn, ZoomOut, RotateCcw, Camera, CheckCircle2, XCircle } from 'lucide-react';

export default function ScreenshotModal({ isOpen, onClose, screenshots = [], currentIndex = 0, onNavigate }) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    // Reset zoom when switching screenshots
    setZoom(1);
  }, [currentIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      else if (e.key === 'ArrowRight' && currentIndex < screenshots.length - 1) onNavigate(currentIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, screenshots.length, onClose, onNavigate]);

  if (!isOpen || !screenshots || screenshots.length === 0) return null;

  const current = screenshots[currentIndex] || screenshots[0];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < screenshots.length - 1;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleDownload = () => {
    if (!current?.url) return;
    const a = document.createElement('a');
    a.href = current.url;
    a.download = current.filename || `playwright-capture-${currentIndex + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md text-white select-none animate-fadeIn">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="font-bold text-sm sm:text-base text-slate-100 truncate">
              {current.title || `Capture ${currentIndex + 1}`}
            </span>
          </div>
          {current.status && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
              current.status === 'PASSED' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
            }`}>
              {current.status === 'PASSED' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {current.status}
            </span>
          )}
          <span className="text-xs font-mono text-slate-400">
            ({currentIndex + 1} / {screenshots.length})
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-700 text-slate-300 rounded transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono text-slate-300 min-w-[45px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-700 text-slate-300 rounded transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:bg-slate-700 text-slate-300 rounded transition border-l border-slate-700"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Open in New Tab */}
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
            title="Open Full Resolution in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
            title="Download Screenshot"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-rose-600/30 text-slate-300 hover:text-rose-400 rounded-lg transition ml-1"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {/* Previous Navigation Button */}
        {hasPrev && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            className="absolute left-3 sm:left-6 z-20 p-2.5 sm:p-3 rounded-full bg-slate-900/80 hover:bg-indigo-600 text-white shadow-xl backdrop-blur border border-slate-700 hover:border-indigo-500 transition group cursor-pointer"
            title="Previous Screenshot (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition" />
          </button>
        )}

        {/* The Fullscreen Image */}
        <div className="max-w-full max-h-full overflow-auto flex items-center justify-center rounded-lg shadow-2xl p-2">
          <img
            src={current.url}
            alt={current.title || 'Playwright Capture'}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="max-h-[75vh] max-w-[90vw] object-contain rounded border border-slate-800 transition-transform duration-150"
          />
        </div>

        {/* Next Navigation Button */}
        {hasNext && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className="absolute right-3 sm:right-6 z-20 p-2.5 sm:p-3 rounded-full bg-slate-900/80 hover:bg-indigo-600 text-white shadow-xl backdrop-blur border border-slate-700 hover:border-indigo-500 transition group cursor-pointer"
            title="Next Screenshot (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {screenshots.length > 1 && (
        <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 overflow-x-auto flex items-center gap-2.5 justify-center">
          {screenshots.map((s, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={idx}
                onClick={() => onNavigate(idx)}
                className={`relative rounded-md overflow-hidden shrink-0 border-2 transition h-12 w-20 bg-slate-950 ${
                  isSelected ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/30' : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                }`}
                title={`Step ${idx + 1}`}
              >
                <img
                  src={s.url}
                  alt={`Thumb ${idx + 1}`}
                  className="w-full h-full object-cover object-top"
                />
                <span className="absolute bottom-0 right-0 bg-slate-900/90 text-[9px] font-mono px-1 rounded-tl text-slate-300">
                  #{idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
