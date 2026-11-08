import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Shield,
  Coins,
  Cpu,
  Smile,
  Sliders,
  CheckCircle2,
  Wand2
} from 'lucide-react';
import { applySiliconEmpirePreset } from '../engines/pctsave';

interface PresetPanelProps {
  currentData: unknown;
  onApplyModifiedData: (modified: unknown, presetName: string) => void;
  isSiliconEmpire: boolean;
}

export const PresetPanel: React.FC<PresetPanelProps> = ({
  currentData,
  onApplyModifiedData,
  isSiliconEmpire
}) => {
  const [lastApplied, setLastApplied] = useState<string | null>(null);
  const [customKey, setCustomKey] = useState('');
  const [customVal, setCustomVal] = useState('');

  const triggerPreset = (
    presetId: 'max-resources' | 'instant-research' | 'nanobots-swarm' | 'invincible-fleet' | 'utopia' | 'god-mode',
    title: string
  ) => {
    const updated = applySiliconEmpirePreset(currentData, presetId);
    onApplyModifiedData(updated, title);
    setLastApplied(title);
    setTimeout(() => setLastApplied(null), 3000);
  };

  const handleCustomPatch = () => {
    if (!customKey.trim()) return;
    const cloned = JSON.parse(JSON.stringify(currentData));
    const targetKeyLower = customKey.trim().toLowerCase();
    let parsedVal: unknown = customVal;
    if (!isNaN(Number(customVal)) && customVal.trim() !== '') {
      parsedVal = Number(customVal);
    } else if (customVal.toLowerCase() === 'true') {
      parsedVal = true;
    } else if (customVal.toLowerCase() === 'false') {
      parsedVal = false;
    }

    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;
      for (const k of Object.keys(node)) {
        if (k.toLowerCase() === targetKeyLower) {
          node[k] = parsedVal;
        }
        if (typeof node[k] === 'object' && node[k] !== null) {
          traverse(node[k]);
        }
      }
    };

    traverse(cloned);
    const title = `Batch Patch (${customKey})`;
    onApplyModifiedData(cloned, title);
    setLastApplied(title);
    setTimeout(() => setLastApplied(null), 3000);
    setCustomKey('');
    setCustomVal('');
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">
            {isSiliconEmpire ? 'Silicon Empire Quick Modder' : 'Universal Save State Modder'}
          </h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
            One-Click Patches
          </span>
        </div>

        {lastApplied && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Applied: {lastApplied}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          onClick={() => triggerPreset('max-resources', 'Max Resources (999M)')}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 text-center transition-all group active:scale-95"
        >
          <Coins className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-white">Max Resources</span>
          <span className="text-[10px] text-slate-400">Credits, Alloys, Silicon</span>
        </button>

        <button
          onClick={() => triggerPreset('instant-research', 'Instant Tech Research')}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 text-center transition-all group active:scale-95"
        >
          <Zap className="w-5 h-5 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-white">Tech Points</span>
          <span className="text-[10px] text-slate-400">10,000,000 Science</span>
        </button>

        <button
          onClick={() => triggerPreset('nanobots-swarm', '50M Nanobots Swarm')}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 text-center transition-all group active:scale-95"
        >
          <Cpu className="w-5 h-5 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-white">Nanobots Swarm</span>
          <span className="text-[10px] text-slate-400">50,000,000 Units</span>
        </button>

        <button
          onClick={() => triggerPreset('invincible-fleet', 'Invincible Armada')}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 text-center transition-all group active:scale-95"
        >
          <Shield className="w-5 h-5 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-white">Fleet Armada</span>
          <span className="text-[10px] text-slate-400">Max Shields & Power</span>
        </button>

        <button
          onClick={() => triggerPreset('utopia', 'Utopian Colonies')}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 text-center transition-all group active:scale-95"
        >
          <Smile className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-white">Utopian Colony</span>
          <span className="text-[10px] text-slate-400">100% Morale & Pop</span>
        </button>

        <button
          onClick={() => triggerPreset('god-mode', 'Full Omnipotent God Mode')}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br from-cyan-950 to-purple-950 hover:from-cyan-900 hover:to-purple-900 border border-cyan-500/40 text-center transition-all group active:scale-95"
        >
          <Sparkles className="w-5 h-5 text-cyan-300 mb-1 group-hover:scale-120 transition-transform animate-pulse" />
          <span className="text-xs font-extrabold text-cyan-200">GOD MODE</span>
          <span className="text-[10px] text-cyan-300/80">Apply All Max Stats</span>
        </button>
      </div>

      <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span>Batch Key Patcher:</span>
        </div>

        <input
          type="text"
          placeholder="Target Key (e.g. credits, level)"
          value={customKey}
          onChange={(e) => setCustomKey(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 sm:w-44 font-mono"
        />

        <input
          type="text"
          placeholder="New Value (e.g. 999999)"
          value={customVal}
          onChange={(e) => setCustomVal(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 sm:w-44 font-mono"
        />

        <button
          onClick={handleCustomPatch}
          disabled={!customKey.trim()}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-cyan-300 border border-slate-700 transition-all active:scale-95 shrink-0"
        >
          Apply Patch
        </button>
      </div>
    </div>
  );
};
