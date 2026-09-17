import React, { useState, useEffect } from 'react';
import { X, HardDrive, Key, Folder, CheckCircle, AlertCircle, RefreshCw, UploadCloud, Unlink, Trash2 } from 'lucide-react';

export default function GoogleDriveModal({ isOpen, onClose, onSyncComplete }) {
  const [folderId, setFolderId] = useState('14eXq0PMPV-_8BsrCeiH3c7nBecOpwf1s');
  const [credentialsText, setCredentialsText] = useState('');
  const [hasCredentials, setHasCredentials] = useState(false);
  const [clientEmail, setClientEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      checkDriveStatus();
    }
  }, [isOpen]);

  const checkDriveStatus = async () => {
    try {
      const res = await fetch('/api/drive/status');
      const data = await res.json();
      setHasCredentials(Boolean(data.hasCredentials && data.isAuthenticated));
      setClientEmail(data.clientEmail || null);
    } catch (err) {
      console.error("Failed to check drive status:", err);
    }
  };

  const handleSaveCredentials = async () => {
    if (!credentialsText.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const parsed = JSON.parse(credentialsText);
      const res = await fetch('/api/drive/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: parsed })
      });
      const data = await res.json();
      if (res.ok) {
        setHasCredentials(true);
        setStatusMsg("✓ Credentials authenticated successfully!");
        onSyncComplete();
        checkDriveStatus();
      } else {
        setErrorMsg(data.error || "Failed to save credentials.");
      }
    } catch (err) {
      setErrorMsg("Invalid JSON credentials format. Please check your service account key file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect Google Drive and remove saved credentials?")) {
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/drive/disconnect', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setHasCredentials(false);
        setClientEmail(null);
        setCredentialsText('');
        setStatusMsg("Google Drive disconnected successfully.");
        onSyncComplete();
      } else {
        setErrorMsg(data.error || "Failed to disconnect.");
      }
    } catch (err) {
      setErrorMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCredentialsText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleSyncDrive = async () => {
    if (!folderId.trim()) {
      setErrorMsg("Please enter your Google Drive Folder ID.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: folderId.trim() })
      });
      const data = await res.json();

      if (res.ok) {
        setStatusMsg(`🎉 ${data.message}`);
        onSyncComplete();
      } else {
        setErrorMsg(data.error || "Failed to retrieve files from Google Drive.");
      }
    } catch (err) {
      setErrorMsg(`Error connecting to Google Drive: ${err.message}`);
    } finally {
      setLoading(false);
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
              <HardDrive className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Google Drive Cloud Connector</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Retrieve QA Knowledge PDFs & Docs via Google Drive API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Service Account Credentials */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Step 1: Service Account Credentials</span>
            </label>
            {hasCredentials ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1" title={clientEmail || ''}>
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">Connected {clientEmail ? `(${clientEmail})` : ''}</span>
                </span>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 rounded text-[10px] font-semibold transition flex items-center gap-1"
                  title="Disconnect & remove credentials"
                >
                  <Unlink className="w-3 h-3" />
                  <span>Disconnect</span>
                </button>
              </div>
            ) : (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Key Required
              </span>
            )}
          </div>

          <div className="space-y-2">
            <textarea
              value={credentialsText}
              onChange={(e) => setCredentialsText(e.target.value)}
              placeholder={hasCredentials ? "Google Service Account is connected. Paste new JSON here to update..." : "Paste service account JSON credentials here, or upload credentials.json file below..."}
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700">
                <UploadCloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Upload credentials.json</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleSaveCredentials}
                disabled={loading || !credentialsText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 text-center"
              >
                Save & Authenticate
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: Google Drive Folder ID */}
        <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Folder className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Step 2: Google Drive Folder ID</span>
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              placeholder="e.g. 1a2B3c4D5e6F7g8H9i0JkLmNoPqRsTuVw"
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              💡 Tip: Open your folder in Google Drive and copy the ID from the address bar (after <code className="font-mono text-indigo-600 dark:text-indigo-400">folders/</code>). Make sure you shared the folder with your service account email.
            </p>
          </div>
        </div>

        {/* Status / Error Alerts */}
        {statusMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-medium">
            {statusMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <div>
            {hasCredentials && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={loading}
                className="w-full sm:w-auto px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition flex items-center justify-center gap-1.5 border border-rose-200 dark:border-rose-900/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Disconnect Drive</span>
              </button>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition text-center"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSyncDrive}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Retrieving Files from Drive...</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Retrieve & Sync Drive Knowledge</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
