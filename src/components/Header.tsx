import React from 'react';
import {
  ShieldCheck,
  FolderOpen,
  Sparkles,
  Cloud,
  FileCode2,
  Trash2,
  CheckCircle2,
  Layers
} from 'lucide-react';

interface HeaderProps {
  onLoadDemo: (type: 'silicon' | 'base64') => void;
  onClear: () => void;
  onOpenSync: () => void;
  onOpenDiff: () => void;
  slotsCount: number;
  hasData: boolean;
  isVerified: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadDemo,
  onClear,
  onOpenSync,
  onOpenDiff,
  slotsCount,
  hasData,
  isVerified
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 shadow-lg shadow-cyan-500/20 text-white font-black tracking-wider">
              <span className="text-lg">P</span>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Pulsesaves <span className="text-cyan-400 font-extrabold">De&Recoder</span>
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 hidden sm:inline-flex">
                  Universal .pctsave
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Silicon Empire & Universal Base64 Save File Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenSync}
              aria-label="Save slots and synchronization"
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              <Cloud className="w-4 h-4" />
              {slotsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[9px] font-bold text-slate-950 flex items-center justify-center">
                  {slotsCount}
                </span>
              )}
            </button>
            {hasData && (
              <button
                onClick={onOpenDiff}
                aria-label="Inspect diff and verify"
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            {isVerified ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Lossless Round-Trip Verified
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                Integrity Engine Ready
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0">
            <button
              onClick={() => onLoadDemo('silicon')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/30 transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Silicon Empire Demo</span>
            </button>

            <button
              onClick={() => onLoadDemo('base64')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all active:scale-95 whitespace-nowrap"
            >
              <FileCode2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Base64 Sample</span>
            </button>

            <button
              onClick={onOpenSync}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-all active:scale-95 whitespace-nowrap"
            >
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              <span>Device Sync</span>
              {slotsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                  {slotsCount}
                </span>
              )}
            </button>

            {hasData && (
              <>
                <button
                  onClick={onOpenDiff}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 transition-all active:scale-95 whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verify & Diff</span>
                </button>

                <button
                  onClick={onClear}
                  aria-label="Clear active workspace"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800 transition-all active:scale-95"
                  title="Clear Workspace"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
