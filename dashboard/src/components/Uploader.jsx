import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Film, 
  CheckCircle2, 
  X, 
  Zap, 
  ArrowRight, 
  HardDrive,
  FileVideo,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function Uploader({ onStartProcessing, isProcessing }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [videoMeta, setVideoMeta] = useState({ duration: 0, size: '' });
  const [outputBucket, setOutputBucket] = useState('snaptospec-frames');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.includes('video') && !file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
      alert('Please upload an MP4, WebM, or MOV video file.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);

    // Format file size
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setVideoMeta({ duration: 0, size: `${sizeInMB} MB` });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setSelectedFile(null);
    setVideoPreviewUrl(null);
    setVideoMeta({ duration: 0, size: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!selectedFile && !isProcessing) return;
    onStartProcessing({
      file: selectedFile,
      outputBucket: outputBucket.trim() || 'snaptospec-frames'
    });
  };

  return (
    <section className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-brand-400" />
            Ingest Screencast Video
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Drop bug recordings (.mp4) to trigger autonomous frame extraction and Playwright spec generation.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <HardDrive className="w-3.5 h-3.5 text-brand-400" />
          <span>GCS Bucket:</span>
          <span className="font-mono text-brand-300 font-semibold">{outputBucket}</span>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer group rounded-xl border-2 border-dashed transition-all duration-300 p-8 sm:p-12 text-center flex flex-col items-center justify-center ${
            dragActive
              ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
              : 'border-slate-700/80 hover:border-brand-500/50 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-brand-500/40 transition-all shadow-lg">
            <UploadCloud className="w-8 h-8 text-brand-400 group-hover:text-brand-300 transition-colors" />
          </div>

          <h3 className="text-base font-semibold text-white mb-1 group-hover:text-brand-300 transition-colors">
            Click to upload or drag & drop video
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Supports MP4, WebM, or MOV screencasts up to 500MB. Analyzed natively by Gemini 3.5 Multimodal.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700">
              .mp4
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700">
              .webm
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700">
              .mov
            </span>
          </div>
        </div>
      ) : (
        /* Selected File Card & Video Preview */
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 flex flex-col md:flex-row gap-5 items-center">
          
          {/* Video Thumbnail / Preview */}
          <div className="w-full md:w-56 h-36 bg-black rounded-lg overflow-hidden relative border border-slate-800 flex-shrink-0 group">
            {videoPreviewUrl && (
              <video
                src={videoPreviewUrl}
                controls
                className="w-full h-full object-cover"
                onLoadedMetadata={(e) => {
                  setVideoMeta((prev) => ({
                    ...prev,
                    duration: Math.round(e.target.duration)
                  }));
                }}
              />
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 w-full flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileVideo className="w-5 h-5 text-brand-400" />
                  <span className="font-semibold text-white truncate max-w-[280px] sm:max-w-md">
                    {selectedFile.name}
                  </span>
                </div>
                {!isProcessing && (
                  <button
                    onClick={clearFile}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Remove selected video"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400">
                <span className="bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60">
                  Size: <strong className="text-slate-200">{videoMeta.size}</strong>
                </span>
                {videoMeta.duration > 0 && (
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60">
                    Duration: <strong className="text-slate-200">{videoMeta.duration}s</strong>
                  </span>
                )}
                <span className="bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 px-2.5 py-1 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Analysis
                </span>
              </div>
            </div>

            {/* Ingest CTA */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 active:scale-98 transition-all shadow-lg shadow-brand-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    <span>Submit Video</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              {!isProcessing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  Choose Different File
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
