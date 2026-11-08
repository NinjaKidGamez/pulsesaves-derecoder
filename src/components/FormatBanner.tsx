import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Cpu,
  Archive,
  Binary,
  ShieldCheck,
  Settings2
} from 'lucide-react';
import { Base64Variant, CompressionFormat, DetectedFormat } from '../types/save';

interface FormatBannerProps {
  format: DetectedFormat;
  onExport: () => void;
  onCopyDecoded: () => Promise<boolean>;
  onCopyEncoded: () => Promise<boolean>;
  onFormatOptionsChange?: (options: {
    forceBase64?: boolean;
    variant?: Base64Variant;
    compression?: CompressionFormat;
  }) => void;
  isRepacking?: boolean;
}

export const FormatBanner: React.FC<FormatBannerProps> = ({
  format,
  onExport,
  onCopyDecoded,
  onCopyEncoded,
  isRepacking = false
}) => {
  const [copiedDecoded, setCopiedDecoded] = useState(false);
  const [copiedEncoded, setCopiedEncoded] = useState(false);

  const handleCopyDecoded = async () => {
    const success = await onCopyDecoded();
    if (success) {
      setCopiedDecoded(true);
      setTimeout(() => setCopiedDecoded(false), 2000);
    }
  };

  const handleCopyEncoded = async () => {
    const success = await onCopyEncoded();
    if (success) {
      setCopiedEncoded(true);
      setTimeout(() => setCopiedEncoded(false), 2000);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 p-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 shrink-0">
            {format.isZipArchive ? (
              <Archive className="w-5 h-5 text-amber-400" />
            ) : format.isSiliconEmpire ? (
              <Cpu className="w-5 h-5 text-cyan-400" />
            ) : format.isBase64 ? (
              <Binary className="w-5 h-5 text-purple-400" />
            ) : (
              <FileText className="w-5 h-5 text-emerald-400" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-white tracking-wide text-sm sm:text-base break-all">
                {format.originalFileName}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                {formatBytes(format.originalSizeBytes)}
              </span>
              {format.isSiliconEmpire && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/80 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  Silicon Empire Validated
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/50 uppercase font-mono text-[11px] text-cyan-300">
                .{format.originalExtension || 'pctsave'}
              </span>

              {format.isZipArchive && (
                <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[11px]">
                  ZIP Container ({format.extractedFileName || 'save.json'})
                </span>
              )}

              {format.isBase64 && (
                <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300 text-[11px]">
                  Base64 ({format.base64Variant || 'standard'})
                </span>
              )}

              {format.compression !== 'none' && format.compression !== 'zip-archive' && (
                <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60 text-blue-300 text-[11px] uppercase">
                  {format.compression}
                </span>
              )}

              <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/50 text-slate-400 text-[11px] uppercase">
                {format.textEncoding}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto justify-start sm:justify-end">
          <button
            onClick={handleCopyDecoded}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
            title="Copy decoded JSON/Text to clipboard"
          >
            {copiedDecoded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied JSON</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Decoded</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyEncoded}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
            title="Re-encode and copy as Base64 string"
          >
            {copiedEncoded ? (
              <>
                <Check className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-purple-400 font-semibold">Copied Base64</span>
              </>
            ) : (
              <>
                <Binary className="w-3.5 h-3.5 text-purple-400" />
                <span>Copy Base64</span>
              </>
            )}
          </button>

          <button
            onClick={onExport}
            disabled={isRepacking}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isRepacking ? 'Exporting...' : `Export .${format.originalExtension || 'pctsave'}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
