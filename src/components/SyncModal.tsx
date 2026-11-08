import React, { useState, useRef } from 'react';
import {
  X,
  Cloud,
  Save,
  Download,
  Upload,
  Link,
  Trash2,
  Check,
  Copy,
  Clock,
  Sparkles,
  Smartphone,
  Laptop
} from 'lucide-react';
import { DetectedFormat, SaveSlot } from '../types/save';
import {
  deleteSlot,
  exportWorkspaceSnapshot,
  generateShareableUrl,
  getStoredSlots,
  importWorkspaceSnapshot,
  saveSlot
} from '../engines/storage';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: unknown;
  rawJson: string;
  format: DetectedFormat;
  onLoadSlot: (slot: SaveSlot) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  currentData,
  rawJson,
  format,
  onLoadSlot
}) => {
  const [slots, setSlots] = useState<SaveSlot[]>(() => getStoredSlots());
  const [slotName, setSlotName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCreateSlot = () => {
    const name = slotName.trim() || `Backup ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newSlot: SaveSlot = {
      id: `slot_${Date.now()}`,
      name,
      timestamp: Date.now(),
      fileName: format.originalFileName,
      format,
      data: currentData,
      rawJson
    };
    const updated = saveSlot(newSlot);
    setSlots(updated);
    setSlotName('');
  };

  const handleDeleteSlot = (id: string) => {
    const updated = deleteSlot(id);
    setSlots(updated);
  };

  const handleExportSnapshot = (slot: SaveSlot) => {
    const jsonStr = exportWorkspaceSnapshot(slot);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulsesaves_${slot.name.replace(/\s+/g, '_')}_snapshot.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSnapshotFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const slot = importWorkspaceSnapshot(text);
          if (slot) {
            const updated = saveSlot(slot);
            setSlots(updated);
            onLoadSlot(slot);
            onClose();
          }
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const handleCopyShareLink = async () => {
    const url = generateShareableUrl(rawJson, format.originalFileName);
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Multi-Device Save Slots & Cross-Sync</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Save className="w-4 h-4 text-cyan-400" />
                Store Save to Device Slot
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Slot description (e.g. Pre-War Fleet Maxed)"
                value={slotName}
                onChange={(e) => setSlotName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-750 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleCreateSlot}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all active:scale-95 shrink-0"
              >
                Save Slot
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Saved Slots on this Device ({slots.length})
              </h4>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportSnapshotFile}
                  className="hidden"
                  aria-label="Import snapshot file"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Snapshot</span>
                </button>
              </div>
            </div>

            {slots.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-500">
                No saved slots found. Create a slot above to preserve local revisions.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {slots.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{s.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>·</span>
                        <span className="font-mono text-cyan-400">{s.fileName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onLoadSlot(s);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all active:scale-95"
                      >
                        Load
                      </button>

                      <button
                        onClick={() => handleExportSnapshot(s)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        title="Export snapshot JSON"
                        aria-label="Export snapshot"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteSlot(s.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                        title="Delete slot"
                        aria-label="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-900/40 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center -space-x-1">
                <Laptop className="w-4 h-4 text-cyan-400" />
                <Smartphone className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="text-xs font-bold text-white">Instant Cross-Device Sync Link</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Generate an end-to-end zero-server URL containing the active save state. Send this link to your phone or tablet to resume editing immediately without uploading files.
            </p>

            <button
              onClick={handleCopyShareLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-all"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Sync Link Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Link className="w-4 h-4" />
                  <span>Copy Cross-Device Sync URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
