import { 
  Sparkles, 
  Layers, 
  Activity, 
  Settings, 
  PlayCircle,
  Cpu,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GithubIcon } from './Icons';

export default function Header({ 
  backendOnline, 
  onLoadSample, 
  onOpenSettings,
  activeTaskId 
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#060913]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-500 p-0.5 shadow-lg shadow-brand-500/25">
              <div className="w-full h-full bg-[#090d1a] rounded-[10px] flex items-center justify-center">
                <Layers className="w-6 h-6 text-brand-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#090d1a] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
                  Snap<span className="gradient-text-gemini">ToSpec</span>
                </h1>
                
                {/* Live Badge: Powered by Gemini 3.5 & Google Cloud */}
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/30 text-purple-200 shadow-sm shadow-purple-500/10">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Powered by Gemini 3.5 & Google Cloud</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 hidden md:block">
                Autonomous Video-to-Spec Agent Pipeline &bull; Frames &bull; Playwright E2E &bull; GitHub Issues
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            
            {/* Backend Status Indicator */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                backendOnline 
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              }`}
              title={backendOnline ? 'FastAPI Backend is Online (Port 8080)' : 'Backend in Standalone/Demo mode'}
            >
              <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="hidden sm:inline">{backendOnline ? 'Backend Online' : 'Local Sandbox'}</span>
            </div>

            {/* Quick Sample Demo Button */}
            <button
              onClick={onLoadSample}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-105 active:scale-95 shadow-sm"
              title="Load completed sample spec to preview output"
            >
              <PlayCircle className="w-4 h-4 text-brand-400" />
              <span>Demo Preview</span>
            </button>

            {/* GitHub Repo Link */}
            <a
              href="https://github.com/DivineSapiens/SnapToSpec"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="View Repository on GitHub"
            >
              <GithubIcon className="w-4 h-4" />
            </a>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Configure API / Firebase"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
