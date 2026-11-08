import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCode,
  Sparkles,
  ClipboardPaste,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

interface DropZoneProps {
  onFileLoaded: (file: File) => void;
  onRawTextSubmitted: (text: string, suggestedName?: string) => void;
  onLoadDemo: (type: 'silicon' | 'base64') => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileLoaded,
  onRawTextSubmitted,
  onLoadDemo
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pastedContent, setPastedContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileLoaded(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileLoaded(e.target.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedContent.trim()) return;
    onRawTextSubmitted(pastedContent.trim(), 'pasted_save.pctsave');
  };

  const handleNativePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setPastedContent(text);
          onRawTextSubmitted(text.trim(), 'clipboard_save.pctsave');
        }
      }
    } catch {
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Lossless Universal Save Processor</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Universal <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">.pctsave</span> & Base64 Studio
        </h2>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Parse, inspect, modify, and re-pack game save files with byte-level integrity.
          Native support for <strong>Silicon Empire</strong> archives, all Base64 variants, and compressed payloads.
        </p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
            : 'border-slate-800 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept=".pctsave,.pct,.json,.txt,.sav,.dat,.b64,*"
          className="hidden"
          aria-label="Upload save file"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <p className="text-base sm:text-lg font-bold text-white">
              Drop your save file here or <span className="text-cyan-400 underline underline-offset-4">browse</span>
            </p>
            <p className="text-xs text-slate-400">
              Supports <strong className="text-slate-300">.pctsave</strong>, <strong className="text-slate-300">.json</strong>, <strong className="text-slate-300">.txt</strong>, <strong className="text-slate-300">.sav</strong>, ZIP archives & Base64
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Silicon Empire (.pctsave)
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              URL-Safe Base64
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Gzip / Deflate / Zlib
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardPaste className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Paste Raw Base64 or JSON</h3>
            </div>
            <button
              onClick={handleNativePaste}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-900"
            >
              <span>From Clipboard</span>
            </button>
          </div>

          <textarea
            value={pastedContent}
            onChange={(e) => setPastedContent(e.target.value)}
            placeholder="Paste raw Base64 string, URL-safe Base64, or JSON save string here..."
            className="w-full h-24 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
          />

          <button
            onClick={handlePasteSubmit}
            disabled={!pastedContent.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white disabled:text-slate-500 transition-all shadow-md active:scale-98"
          >
            <span>Decode & Open In Editor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Instant Presets & Samples</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jump straight into editing with verified save state files engineered for high-complexity test scenarios.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => onLoadDemo('silicon')}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
            >
              <div>
                <p className="text-xs font-bold text-white group-hover:text-cyan-300">
                  Silicon Empire (.pctsave)
                </p>
                <p className="text-[11px] text-slate-400">
                  Aethelgard Ascendancy — 14M Population, Fleets & Nanobots
                </p>
              </div>
              <span className="text-xs text-cyan-400 font-semibold">Load</span>
            </button>

            <button
              onClick={() => onLoadDemo('base64')}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
            >
              <div>
                <p className="text-xs font-bold text-white group-hover:text-purple-300">
                  Universal Base64 Save
                </p>
                <p className="text-[11px] text-slate-400">
                  RFC 4648 Padded & Nested Incremental State Payload
                </p>
              </div>
              <span className="text-xs text-purple-400 font-semibold">Load</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/30 border border-slate-800/60">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-white">Lossless Round-Trip</h4>
            <p className="text-[11px] text-slate-400">Zero data corruption or precision truncation on floats & integers.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/30 border border-slate-800/60">
          <FileCode className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-white">Dual Tree & Code Views</h4>
            <p className="text-[11px] text-slate-400">Interactive visual tree editor plus raw code mode with syntax checking.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/30 border border-slate-800/60">
          <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-white">Zero Paid Dependencies</h4>
            <p className="text-[11px] text-slate-400">Runs 100% client-side in the browser, mobile ready, offline capable.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
