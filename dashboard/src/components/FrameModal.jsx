import React from 'react';
import { X, ChevronLeft, ChevronRight, Download, Clock, Maximize } from 'lucide-react';

export default function FrameModal({ 
  frame, 
  currentIndex, 
  totalFrames, 
  onClose, 
  onPrev, 
  onNext 
}) {
  if (!frame) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Click outside to close backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-5xl bg-[#090d1a] border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-brand-950 text-brand-300 border border-brand-800/60 text-xs font-mono font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {frame.timestamp}
            </span>
            <h4 className="font-bold text-white text-base">
              {frame.label || `Frame ${currentIndex + 1}`}
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              ({currentIndex + 1} of {totalFrames})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={frame.url}
              target="_blank"
              rel="noreferrer"
              download
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Open full resolution in new tab"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Image Body with Prev/Next Controls */}
        <div className="relative flex-1 bg-black flex items-center justify-center p-2 sm:p-4 min-h-[300px] overflow-hidden">
          <img
            src={frame.url}
            alt={frame.label}
            className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
            onError={(e) => {
              if (frame.fallbackUrl && e.target.src !== frame.fallbackUrl) {
                e.target.src = frame.fallbackUrl;
              }
            }}
          />

          {/* Prev Button */}
          {currentIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="absolute left-4 p-3 rounded-full bg-slate-900/80 hover:bg-brand-600 text-white border border-slate-700 hover:border-brand-500 backdrop-blur-md transition-all shadow-xl"
              title="Previous frame"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Button */}
          {currentIndex < totalFrames - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-4 p-3 rounded-full bg-slate-900/80 hover:bg-brand-600 text-white border border-slate-700 hover:border-brand-500 backdrop-blur-md transition-all shadow-xl"
              title="Next frame"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Modal Footer Description */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800">
          <p className="text-xs sm:text-sm text-slate-300">
            {frame.description || 'Isolated keyframe snapshot captured by FFmpeg during multimodal Gemini 3.5 timeline sweep.'}
          </p>
        </div>

      </div>
    </div>
  );
}
