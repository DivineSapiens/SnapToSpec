import React from 'react';
import { 
  Clock, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Database,
  GitPullRequest,
  Film,
  Terminal
} from 'lucide-react';

const STEPS = [
  {
    key: 'QUEUED',
    label: 'QUEUED',
    title: 'Task Queued & Ingested',
    description: 'Video received, initialized asynchronous background worker task.',
    icon: Clock,
  },
  {
    key: 'PROCESSING',
    label: 'PROCESSING',
    title: 'Gemini 3.5 Multimodal Analysis',
    description: 'Gemini 3.5 deep visual scan, defect detection, and timestamp extraction.',
    icon: Cpu,
  },
  {
    key: 'ANALYZED',
    label: 'ANALYZED',
    title: 'Frame Extraction & Spec Synthesis',
    description: 'FFmpeg high-res screenshot isolation & Playwright E2E script generation.',
    icon: Sparkles,
  },
  {
    key: 'COMPLETED',
    label: 'COMPLETED',
    title: 'GitHub Issue & Firestore Synced',
    description: 'Artifacts uploaded to GCS, GitHub issue published, state finalized.',
    icon: CheckCircle2,
  },
];

export default function StatusFeed({ 
  currentStatus = 'IDLE', 
  taskId, 
  updatedAt, 
  logs = [],
  errorMessage 
}) {
  const getStepIndex = (status) => {
    switch (status) {
      case 'QUEUED': return 0;
      case 'PROCESSING': return 1;
      case 'ANALYZED': return 2;
      case 'COMPLETED': return 3;
      case 'FAILED': return -1;
      default: return -1;
    }
  };

  const currentIndex = getStepIndex(currentStatus);
  const isFailed = currentStatus === 'FAILED';

  if (currentStatus === 'IDLE') {
    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-800/60 text-center text-slate-400">
        <p className="text-sm">No active pipeline execution. Upload a video above or click <strong className="text-brand-300">Demo Preview</strong> to view a sample run.</p>
      </div>
    );
  }

  return (
    <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl relative overflow-hidden">
      
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/30">
            <Database className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Real-time Workflow Pipeline
            </h3>
            <p className="text-xs text-slate-400">
              Live state synchronization with Firestore <span className="font-mono text-slate-300">snaptospec_tasks</span> collection
            </p>
          </div>
        </div>

        {taskId && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Task ID:</span>
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-brand-950/60 text-brand-300 border border-brand-800/60 shadow-sm">
              #{taskId}
            </span>
          </div>
        )}
      </div>

      {/* Error state banner if failed */}
      {isFailed && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Pipeline Execution Failed</h4>
            <p className="text-xs mt-0.5 text-rose-200">{errorMessage || 'An unhandled error occurred during pipeline execution.'}</p>
          </div>
        </div>
      )}

      {/* Step by Step Progress Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {STEPS.map((step, idx) => {
          const isCompletedOverall = currentStatus === 'COMPLETED';
          const isDone = isCompletedOverall || currentIndex > idx;
          const isCurrent = !isCompletedOverall && currentIndex === idx && !isFailed;
          const isPending = !isCompletedOverall && currentIndex < idx && !isFailed;
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={`relative rounded-xl p-4 transition-all duration-300 border ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                  : isCurrent
                  ? 'bg-brand-950/30 border-brand-500/60 ring-2 ring-brand-500/20 shadow-lg shadow-brand-500/10 scale-[1.02]'
                  : 'bg-slate-900/40 border-slate-800/80 opacity-60'
              }`}
            >
              {/* Step indicator header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-500 text-slate-950'
                        : isCurrent
                        ? 'bg-brand-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={`text-[11px] font-mono font-bold tracking-wider uppercase ${
                    isDone ? 'text-emerald-400' : isCurrent ? 'text-brand-300' : 'text-slate-500'
                  }`}>
                    {step.label}
                  </span>
                </div>

                {isCurrent && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <h4 className="text-sm font-semibold text-white mb-1">
                {step.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {step.description}
              </p>

              {/* Bottom active animation bar */}
              {isCurrent && (
                <div className="mt-3 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-500 via-indigo-400 to-purple-500 animate-shimmer w-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Logs Stream Drawer */}
      {logs.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-brand-400" />
              Real-time Event Dispatcher Logs:
            </span>
            {updatedAt && (
              <span className="text-[11px] text-slate-500 font-mono">
                Last update: {new Date(updatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="bg-black/60 rounded-xl p-3 font-mono text-xs text-slate-300 border border-slate-800 max-h-32 overflow-y-auto space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-brand-400 select-none">&gt;</span>
                <span className="text-slate-300">{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
}
