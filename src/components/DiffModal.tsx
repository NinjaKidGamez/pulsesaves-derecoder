import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Download,
  CheckCircle2,
  FileDiff,
  Hash,
  Scale
} from 'lucide-react';
import { DetectedFormat, DiffEntry, VerificationResult } from '../types/save';
import { verifySaveIntegrity } from '../engines/pctsave';

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalBytes: Uint8Array;
  originalData: unknown;
  currentData: unknown;
  format: DetectedFormat;
  onConfirmExport: () => void;
}

export const DiffModal: React.FC<DiffModalProps> = ({
  isOpen,
  onClose,
  originalBytes,
  originalData,
  currentData,
  format,
  onConfirmExport
}) => {
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      runVerification();
    }
  }, [isOpen, currentData]);

  const runVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await verifySaveIntegrity(originalBytes, currentData, format);
      setVerification(res);
    } catch {
      setVerification({
        isValid: false,
        originalSize: originalBytes.byteLength,
        newSize: 0,
        diffCount: 0,
        roundTripMatch: false,
        errors: ['Verification computation failed']
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const computeDiffs = (oldObj: any, newObj: any, prefix = ''): DiffEntry[] => {
    const diffs: DiffEntry[] = [];
    if (typeof oldObj !== 'object' || typeof newObj !== 'object' || !oldObj || !newObj) {
      if (oldObj !== newObj) {
        diffs.push({
          path: prefix || 'root',
          type: 'modified',
          oldValue: oldObj,
          newValue: newObj
        });
      }
      return diffs;
    }

    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));
    for (const key of allKeys) {
      const currPath = prefix ? `${prefix}.${key}` : key;
      if (!(key in oldObj)) {
        diffs.push({
          path: currPath,
          type: 'added',
          oldValue: undefined,
          newValue: newObj[key]
        });
      } else if (!(key in newObj)) {
        diffs.push({
          path: currPath,
          type: 'removed',
          oldValue: oldObj[key],
          newValue: undefined
        });
      } else if (
        typeof oldObj[key] === 'object' &&
        typeof newObj[key] === 'object' &&
        oldObj[key] !== null &&
        newObj[key] !== null
      ) {
        diffs.push(...computeDiffs(oldObj[key], newObj[key], currPath));
      } else if (oldObj[key] !== newObj[key]) {
        diffs.push({
          path: currPath,
          type: 'modified',
          oldValue: oldObj[key],
          newValue: newObj[key]
        });
      }
    }
    return diffs;
  };

  if (!isOpen) return null;

  const diffs = computeDiffs(originalData, currentData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Save Diff & Round-Trip Verification</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Modified Elements</span>
              <p className="text-xl font-bold text-white mt-1 flex items-center gap-1.5">
                <FileDiff className="w-4 h-4 text-cyan-400" />
                <span>{diffs.length} fields</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Payload Size</span>
              <p className="text-xl font-bold text-white mt-1 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-purple-400" />
                <span>{verification ? `${verification.newSize} B` : 'Checking...'}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Round-Trip Status</span>
              <p className="text-xl font-bold mt-1 flex items-center gap-1.5">
                {isVerifying ? (
                  <span className="text-sm text-cyan-400">Verifying...</span>
                ) : verification?.roundTripMatch ? (
                  <span className="text-emerald-400 flex items-center gap-1 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Byte-Perfect Match
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 text-sm font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Re-Pack Functional
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Field-Level Changes ({diffs.length})
            </h4>

            {diffs.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400">
                No fields have been modified yet. The save matches original input.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-xl border border-slate-800 p-2 bg-slate-950">
                {diffs.map((diff, index) => (
                  <div
                    key={index}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <span className="font-mono text-cyan-400 font-semibold break-all">
                      {diff.path}
                    </span>

                    <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                      <span className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 line-through">
                        {String(diff.oldValue)}
                      </span>
                      <span className="text-slate-500">→</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                        {String(diff.newValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            Back to Editor
          </button>

          <button
            onClick={() => {
              onConfirmExport();
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Confirm & Download Verified .{format.originalExtension || 'pctsave'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
