import React, { useState, useEffect } from 'react';
import {
  AlignLeft,
  Minimize,
  Undo2,
  Redo2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

interface RawEditorProps {
  initialValue: string;
  onChange: (newValue: string, isValidJson: boolean, parsed?: unknown) => void;
}

export const RawEditor: React.FC<RawEditorProps> = ({
  initialValue,
  onChange
}) => {
  const [content, setContent] = useState(initialValue);
  const [history, setHistory] = useState<string[]>([initialValue]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setContent(initialValue);
    validateAndPropagate(initialValue, false);
  }, [initialValue]);

  const validateAndPropagate = (val: string, pushHistory = true) => {
    try {
      const parsed = JSON.parse(val);
      setValidationError(null);
      onChange(val, true, parsed);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Invalid JSON Syntax');
      onChange(val, false);
    }

    if (pushHistory) {
      setHistory(prev => [...prev.slice(0, historyIndex + 1), val]);
      setHistoryIndex(prev => prev + 1);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    validateAndPropagate(val, true);
  };

  const handleFormat = (spaces: number) => {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, spaces);
      setContent(formatted);
      validateAndPropagate(formatted, true);
    } catch {
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(content);
      const minified = JSON.stringify(parsed);
      setContent(minified);
      validateAndPropagate(minified, true);
    } catch {
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setContent(prev);
      setHistoryIndex(historyIndex - 1);
      validateAndPropagate(prev, false);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setContent(next);
      setHistoryIndex(historyIndex + 1);
      validateAndPropagate(next, false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = content.split('\n').length;
  const charCount = content.length;

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col h-full shadow-inner">
      <div className="border-b border-slate-800 p-2.5 bg-slate-900/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleFormat(2)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750 transition-all active:scale-95"
            title="Format with 2 spaces indent"
          >
            <AlignLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span>Format (2-space)</span>
          </button>

          <button
            onClick={() => handleFormat(4)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750 transition-all active:scale-95"
          >
            <span>4-space</span>
          </button>

          <button
            onClick={handleMinify}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750 transition-all active:scale-95"
            title="Minify to 1 line"
          >
            <Minimize className="w-3.5 h-3.5 text-amber-400" />
            <span>Minify</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-all"
            title="Undo (Ctrl+Z)"
            aria-label="Undo edit"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-all"
            title="Redo (Ctrl+Y)"
            aria-label="Redo edit"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500 font-mono hidden sm:inline">
            {lineCount} lines · {charCount} chars
          </span>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {validationError ? (
            <span className="flex items-center gap-1 text-rose-400 font-medium text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[150px] sm:max-w-xs">{validationError}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Valid Syntax</span>
            </span>
          )}
        </div>
      </div>

      <div className="relative flex-1">
        <textarea
          value={content}
          onChange={handleTextChange}
          spellCheck={false}
          className="w-full h-full min-h-[450px] p-4 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-cyan-500/30"
          placeholder="JSON or raw text content will appear here..."
        />
      </div>
    </div>
  );
};
