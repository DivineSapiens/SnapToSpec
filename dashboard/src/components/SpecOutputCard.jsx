import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  ExternalLink, 
  Layers, 
  Image as ImageIcon, 
  ListOrdered, 
  Code2, 
  Sparkles, 
  ShieldAlert, 
  Clock, 
  Maximize2,
  FileDown,
  CheckCircle2,
  Eye,
  Bug
} from 'lucide-react';
import { GithubIcon } from './Icons';

export default function SpecOutputCard({ 
  specData, 
  frameUrls = [], 
  githubUrl, 
  taskId,
  onOpenFrame 
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);

  if (!specData) return null;

  const {
    title = 'Automated Bug Report',
    bug_summary = '',
    severity = 'High',
    tags = ['bug', 'automated-spec'],
    reproduction_steps = [],
    timestamps_of_interest = [],
    playwright_script = ''
  } = specData;

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityStyle = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
        return 'bg-rose-950/80 text-rose-300 border-rose-600/60 ring-1 ring-rose-500/30';
      case 'high':
        return 'bg-amber-950/80 text-amber-300 border-amber-600/60 ring-1 ring-amber-500/30';
      case 'medium':
        return 'bg-blue-950/80 text-blue-300 border-blue-600/60 ring-1 ring-blue-500/30';
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60';
    }
  };

  // Robust frame extraction & mapping: handles strings, object maps, or timestamps
  const displayFrames = (timestamps_of_interest && timestamps_of_interest.length > 0)
    ? timestamps_of_interest.map((ts, idx) => {
        let frameUrl = null;
        if (Array.isArray(frameUrls) && frameUrls[idx]) {
          frameUrl = typeof frameUrls[idx] === 'string' ? frameUrls[idx] : frameUrls[idx].url;
        } else if (frameUrls && typeof frameUrls === 'object' && !Array.isArray(frameUrls)) {
          const values = Object.values(frameUrls);
          if (values[idx]) frameUrl = typeof values[idx] === 'string' ? values[idx] : values[idx]?.url;
        }

        const safeLabel = (ts.label || `Frame_${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = `frame_${idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}_${Math.floor(ts.timestamp_seconds)}s_${safeLabel}.jpg`;

        if (!frameUrl) {
          const gcsBucket = import.meta.env.VITE_GCS_OUTPUT_BUCKET || 'gen-lang-client-0274499098-snaptospec-frames';
          frameUrl = `https://storage.googleapis.com/${gcsBucket}/frames/${taskId}/${filename}`;
        }

        return {
          id: idx + 1,
          timestamp: `${ts.timestamp_seconds}s`,
          label: ts.label || `Keyframe ${idx + 1}`,
          description: ts.description || 'Snapshot of UI state during user action.',
          url: frameUrl,
          fallbackUrl: `http://localhost:8080/frames/${taskId}/${filename}`
        };
      })
    : (frameUrls && (Array.isArray(frameUrls) ? frameUrls.length > 0 : Object.keys(frameUrls).length > 0))
    ? (Array.isArray(frameUrls) ? frameUrls : Object.values(frameUrls)).map((item, idx) => {
        const urlStr = typeof item === 'string' ? item : (item?.url || '');
        return {
          id: idx + 1,
          timestamp: `Frame ${idx + 1}`,
          label: (typeof item === 'object' && item?.label) ? item.label : `Keyframe ${idx + 1}`,
          description: (typeof item === 'object' && item?.description) ? item.description : 'Snapshot of UI state during user action.',
          url: urlStr,
          fallbackUrl: `http://localhost:8080/frames/${taskId}/frame_${idx + 1}.jpg`
        };
      })
    : [];

  const isDefectStep = (step) => {
    if (!step.actual_result) return false;
    const actual = step.actual_result.toLowerCase();
    const failKeywords = ['fail', 'error', 'nothing happens', 'unresponsive', 'crash', 'not work', 'broken', 'no download', 'freeze', 'stuck', 'disabled', '404', '500', 'non-functional'];
    return failKeywords.some(w => actual.includes(w));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      
      {/* 1. Main Overview Header Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl relative overflow-hidden">
        
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getSeverityStyle(severity)}`}>
              <ShieldAlert className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
              {severity} Severity
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-950/60 text-brand-300 border border-brand-800/60">
              <Sparkles className="w-3 h-3 inline mr-1 -mt-0.5" />
              Gemini 3.5 Verified
            </span>
            {taskId && (
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                Task ID: #{taskId}
              </span>
            )}
          </div>

          {/* GitHub Issue CTA Button */}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all shadow-md hover:scale-105 active:scale-95 group"
            >
              <GithubIcon className="w-4 h-4 text-white group-hover:text-brand-400 transition-colors" />
              <span>View Generated GitHub Issue</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </a>
          )}
        </div>

        {/* Issue Title */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
            {title}
          </h2>
          <button
            onClick={() => copyToClipboard(title, setCopiedTitle)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors flex-shrink-0"
            title="Copy Title"
          >
            {copiedTitle ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Bug Summary */}
        <div className="bg-slate-900/70 rounded-xl p-4 sm:p-5 border border-slate-800/80 mb-5">
          <h4 className="text-xs font-mono uppercase tracking-wider text-brand-400 font-bold mb-2 flex items-center gap-1.5">
            <Bug className="w-3.5 h-3.5" />
            Defect Summary & Root Observation
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            {bug_summary}
          </p>
        </div>

        {/* Tags / Labels */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1">Labels:</span>
            {tags.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-md text-xs font-mono bg-slate-800/90 text-slate-300 border border-slate-700/80"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 2. Grid of Extracted Frame Screenshot Thumbnails */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-brand-400" />
              Extracted Visual Frame Timeline ({displayFrames.length} Frames)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              High-resolution keyframe snapshots isolated by FFmpeg at Gemini 3.5 interest timestamps. Click to zoom.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayFrames.map((frame, index) => (
            <div
              key={index}
              onClick={() => onOpenFrame(frame, index, displayFrames)}
              className="group cursor-pointer rounded-xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/60 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 flex flex-col"
            >
              {/* Image Container */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden flex items-center justify-center">
                <img
                  src={frame.url}
                  alt={frame.label || `Frame ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    if (frame.fallbackUrl && e.target.src !== frame.fallbackUrl) {
                      e.target.src = frame.fallbackUrl;
                    }
                  }}
                />
                
                {/* Timestamp Pill Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[11px] font-mono font-bold text-brand-300 border border-white/10 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {frame.timestamp}
                </div>

                {/* Hover overlay icon */}
                <div className="absolute inset-0 bg-brand-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-2 rounded-full bg-brand-600 text-white shadow-lg">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Caption & Meta */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <h5 className="font-semibold text-xs text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                  {frame.label || `Keyframe ${index + 1}`}
                </h5>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {frame.description || 'Snapshot of UI state during user action.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Formatted Step-by-Step Reproduction Instructions */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-brand-400" />
              Deterministic Reproduction Steps
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact sequence of user interactions captured from video for deterministic triage.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {reproduction_steps.map((step, idx) => {
            const isFailing = isDefectStep(step);

            return (
              <div
                key={idx}
                className={`rounded-xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row items-start gap-4 ${
                  isFailing
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Step Number Badge */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm text-white shadow-md ${
                  isFailing
                    ? 'bg-gradient-to-tr from-amber-600 to-rose-600'
                    : 'bg-gradient-to-tr from-brand-600 to-indigo-600'
                }`}>
                  {step.step_number || idx + 1}
                </div>

                {/* Step Content */}
                <div className="flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-white">
                      <span className="text-brand-400 font-mono text-xs uppercase mr-1.5 font-bold">Action:</span>
                      {step.action}
                    </div>
                    {isFailing && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-amber-400" />
                        Defect Point Identified
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                    {step.expected_result && (
                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-slate-200 shadow-sm flex flex-col justify-start">
                        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Expected Result
                        </span>
                        <span className="text-slate-300 leading-relaxed">{step.expected_result}</span>
                      </div>
                    )}

                    {step.actual_result && (
                      <div className={`p-3 rounded-xl shadow-sm flex flex-col justify-start border ${
                        isFailing
                          ? 'bg-amber-950/30 border-amber-600/50 text-amber-100'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-200'
                      }`}>
                        <span className={`flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider mb-1 ${
                          isFailing ? 'text-amber-400 font-extrabold' : 'text-indigo-300'
                        }`}>
                          {isFailing ? <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-indigo-400" />}
                          {isFailing ? 'Observed Defect / Failure' : 'Observed Result'}
                        </span>
                        <span className="leading-relaxed">{step.actual_result}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Syntax-Highlighted Playwright Script Block with Copy Button */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-brand-400" />
              Auto-Generated Playwright Test Script
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Production-ready TypeScript E2E test synthesized by Gemini 3.5 to replicate the defect in CI/CD pipelines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded text-xs font-mono bg-blue-950/80 text-blue-300 border border-blue-800/60">
              TypeScript / Playwright
            </span>
            <button
              onClick={() => copyToClipboard(playwright_script, setCopiedCode)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Block */}
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#090d16] font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-slate-400 text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-slate-300">tests/reproduce_issue.spec.ts</span>
            </div>
            <span>Playwright E2E</span>
          </div>

          <pre className="p-4 sm:p-5 overflow-x-auto text-slate-200 leading-relaxed max-h-[480px]">
            <code>{playwright_script}</code>
          </pre>
        </div>
      </div>

    </div>
  );
}
