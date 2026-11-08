import React, { useState, useEffect, useCallback } from 'react';
import {
  ArchiveFileEntry,
  DetectedFormat,
  SaveSlot
} from './types/save';
import {
  parseSaveBuffer,
  repackSaveData,
  createSiliconEmpireDemoSave,
  verifySaveIntegrity
} from './engines/pctsave';
import {
  encodeTextToBytes,
  uint8ArrayToBase64
} from './engines/base64';
import {
  getStoredSlots,
  loadActiveWorkspace,
  parseShareableUrl,
  saveActiveWorkspace
} from './engines/storage';
import { Header } from './components/Header';
import { FormatBanner } from './components/FormatBanner';
import { DropZone } from './components/DropZone';
import { TreeEditor } from './components/TreeEditor';
import { RawEditor } from './components/RawEditor';
import { PresetPanel } from './components/PresetPanel';
import { DiffModal } from './components/DiffModal';
import { SyncModal } from './components/SyncModal';
import {
  FolderTree,
  Code2,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [originalBytes, setOriginalBytes] = useState<Uint8Array | null>(null);
  const [originalData, setOriginalData] = useState<unknown | null>(null);
  const [currentData, setCurrentData] = useState<unknown | null>(null);
  const [rawJson, setRawJson] = useState<string>('');
  const [format, setFormat] = useState<DetectedFormat | null>(null);
  const [archiveEntries, setArchiveEntries] = useState<ArchiveFileEntry[]>([]);
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isRepacking, setIsRepacking] = useState(false);
  const [slotsCount, setSlotsCount] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateSlotsCounter = useCallback(() => {
    const slots = getStoredSlots();
    setSlotsCount(slots.length);
  }, []);

  const loadSaveBufferInternal = async (bytes: Uint8Array, name: string) => {
    try {
      const parsed = await parseSaveBuffer(bytes, name);
      setOriginalBytes(bytes);
      setOriginalData(parsed.rawParsedData);
      setCurrentData(parsed.rawParsedData);
      setRawJson(parsed.jsonString);
      setFormat(parsed.format);
      setArchiveEntries(parsed.archiveEntries || []);
      setIsVerified(true);

      saveActiveWorkspace({
        fileName: name,
        format: parsed.format,
        rawJson: parsed.jsonString
      });
      showToast(`Loaded ${name} successfully`);
    } catch (err) {
      showToast(`Failed to parse save: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  useEffect(() => {
    updateSlotsCounter();
    const shared = parseShareableUrl();
    if (shared) {
      const bytes = encodeTextToBytes(JSON.stringify(shared.data), 'utf-8');
      loadSaveBufferInternal(bytes, shared.fileName);
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    const savedWorkspace = loadActiveWorkspace();
    if (savedWorkspace) {
      try {
        const bytes = encodeTextToBytes(savedWorkspace.rawJson, 'utf-8');
        loadSaveBufferInternal(bytes, savedWorkspace.fileName);
      } catch {
      }
    }
  }, [updateSlotsCounter]);

  const handleFileLoaded = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (buffer) {
        await loadSaveBufferInternal(new Uint8Array(buffer), file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRawTextSubmitted = async (text: string, suggestedName = 'save.pctsave') => {
    const bytes = encodeTextToBytes(text, 'utf-8');
    await loadSaveBufferInternal(bytes, suggestedName);
  };

  const handleLoadDemo = async (type: 'silicon' | 'base64') => {
    if (type === 'silicon') {
      const demoData = createSiliconEmpireDemoSave();
      const jsonStr = JSON.stringify(demoData, null, 2);
      const bytes = encodeTextToBytes(jsonStr, 'utf-8');
      await loadSaveBufferInternal(bytes, 'silicon_empire_autosave.pctsave');
    } else {
      const base64Payload = {
        game: 'Pulse Incremental',
        version: '1.8.0',
        player: {
          level: 99,
          energy: 495000000,
          cores: 128,
          unlockedTiers: [1, 2, 3, 4, 5]
        },
        checksum: 'b4a8e0f19c'
      };
      const jsonBytes = encodeTextToBytes(JSON.stringify(base64Payload), 'utf-8');
      const b64 = uint8ArrayToBase64(jsonBytes, 'standard');
      const b64Bytes = encodeTextToBytes(b64, 'utf-8');
      await loadSaveBufferInternal(b64Bytes, 'incremental_save.b64');
    }
  };

  const handleTreeChange = (updated: unknown) => {
    setCurrentData(updated);
    const newJson = JSON.stringify(updated, null, 2);
    setRawJson(newJson);
    if (format) {
      saveActiveWorkspace({
        fileName: format.originalFileName,
        format,
        rawJson: newJson
      });
    }
  };

  const handleRawChange = (newVal: string, isValid: boolean, parsed?: unknown) => {
    setRawJson(newVal);
    if (isValid && parsed !== undefined) {
      setCurrentData(parsed);
      if (format) {
        saveActiveWorkspace({
          fileName: format.originalFileName,
          format,
          rawJson: newVal
        });
      }
    }
  };

  const handleExport = async () => {
    if (!currentData || !format) return;
    setIsRepacking(true);
    try {
      const packedBytes = await repackSaveData(currentData, format, {}, archiveEntries);
      const blob = new Blob([packedBytes as any], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format.originalFileName || 'save.pctsave';
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${format.originalFileName}`);
    } catch (err) {
      showToast(`Export error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRepacking(false);
    }
  };

  const handleCopyDecoded = async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(rawJson);
      showToast('Copied decoded JSON to clipboard');
      return true;
    } catch {
      return false;
    }
  };

  const handleCopyEncoded = async (): Promise<boolean> => {
    if (!currentData || !format) return false;
    try {
      const packed = await repackSaveData(currentData, format, { forceBase64: true }, archiveEntries);
      const b64 = uint8ArrayToBase64(packed, format.base64Variant || 'standard');
      await navigator.clipboard.writeText(b64);
      showToast('Copied Base64 string to clipboard');
      return true;
    } catch {
      return false;
    }
  };

  const handleClear = () => {
    setOriginalBytes(null);
    setOriginalData(null);
    setCurrentData(null);
    setRawJson('');
    setFormat(null);
    setArchiveEntries([]);
    localStorage.removeItem('pulsesaves_active_workspace');
    showToast('Workspace cleared');
  };

  const handleLoadSlot = (slot: SaveSlot) => {
    const bytes = encodeTextToBytes(slot.rawJson, 'utf-8');
    loadSaveBufferInternal(bytes, slot.fileName);
  };

  const handleApplyPresetData = (modified: unknown, title: string) => {
    handleTreeChange(modified);
    showToast(`Preset applied: ${title}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header
        onLoadDemo={handleLoadDemo}
        onClear={handleClear}
        onOpenSync={() => setIsSyncOpen(true)}
        onOpenDiff={() => setIsDiffOpen(true)}
        slotsCount={slotsCount}
        hasData={Boolean(currentData && format)}
        isVerified={isVerified}
      />

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-800/80 text-cyan-300 text-xs shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {format && currentData ? (
        <main className="flex-1 flex flex-col">
          <FormatBanner
            format={format}
            onExport={handleExport}
            onCopyDecoded={handleCopyDecoded}
            onCopyEncoded={handleCopyEncoded}
            isRepacking={isRepacking}
          />

          <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
            <PresetPanel
              currentData={currentData}
              onApplyModifiedData={handleApplyPresetData}
              isSiliconEmpire={Boolean(format.isSiliconEmpire)}
            />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
                <button
                  onClick={() => setViewMode('tree')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'tree'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Visual Tree Inspector</span>
                </button>

                <button
                  onClick={() => setViewMode('raw')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'raw'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Raw Code / JSON</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDiffOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Verify Integrity</span>
                </button>

                <button
                  onClick={handleExport}
                  disabled={isRepacking}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div className="min-h-[500px]">
              {viewMode === 'tree' ? (
                <TreeEditor data={currentData} onChange={handleTreeChange} />
              ) : (
                <RawEditor initialValue={rawJson} onChange={handleRawChange} />
              )}
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col justify-center">
          <DropZone
            onFileLoaded={handleFileLoaded}
            onRawTextSubmitted={handleRawTextSubmitted}
            onLoadDemo={handleLoadDemo}
          />
        </main>
      )}

      {isDiffOpen && originalBytes !== null && originalData !== null && currentData !== null && format !== null ? (
        <DiffModal
          isOpen={isDiffOpen}
          onClose={() => setIsDiffOpen(false)}
          originalBytes={originalBytes}
          originalData={originalData}
          currentData={currentData}
          format={format}
          onConfirmExport={handleExport}
        />
      ) : null}

      {isSyncOpen && format !== null ? (
        <SyncModal
          isOpen={isSyncOpen}
          onClose={() => {
            setIsSyncOpen(false);
            updateSlotsCounter();
          }}
          currentData={currentData}
          rawJson={rawJson}
          format={format}
          onLoadSlot={handleLoadSlot}
        />
      ) : null}

      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Pulsesaves De&Recoder · Lossless Base64 & .pctsave Architecture</span>
          <div className="flex items-center gap-3">
            <span>Zero-Cost GitHub Pages Static Architecture</span>
            <span>·</span>
            <span>Client-Side Encryption & Verification</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
