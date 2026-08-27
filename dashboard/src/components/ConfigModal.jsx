import React, { useState } from 'react';
import { X, Save, Settings, Database, Server, Check } from 'lucide-react';

export default function ConfigModal({ isOpen, onClose }) {
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem('snaptospec_backend_url') || 'http://localhost:8080');
  const [firebaseProjectId, setFirebaseProjectId] = useState(() => localStorage.getItem('snaptospec_firebase_project') || 'snaptospec-agent');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('snaptospec_backend_url', backendUrl);
    localStorage.setItem('snaptospec_firebase_project', firebaseProjectId);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-md bg-[#090d1a] border border-slate-700/80 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-400" />
            <h3 className="text-base font-bold text-white">Environment Configuration</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-brand-400" />
              FastAPI Backend Endpoint URL
            </label>
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="http://localhost:8080"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">Default: http://localhost:8080</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-400" />
              Google Cloud Firestore Project ID
            </label>
            <input
              type="text"
              value={firebaseProjectId}
              onChange={(e) => setFirebaseProjectId(e.target.value)}
              placeholder="snaptospec-agent"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">Tracks tickets in Firestore real-time collection</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
