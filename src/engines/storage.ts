import { DetectedFormat, SaveSlot } from '../types/save';
import { cleanBase64String, normalizeBase64 } from './base64';

const STORAGE_KEY_SLOTS = 'pulsesaves_slots_v1';
const STORAGE_KEY_ACTIVE = 'pulsesaves_active_workspace';

export function getStoredSlots(): SaveSlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SLOTS);
    if (!raw) return [];
    return JSON.parse(raw) as SaveSlot[];
  } catch {
    return [];
  }
}

export function saveSlot(slot: SaveSlot): SaveSlot[] {
  try {
    const existing = getStoredSlots();
    const index = existing.findIndex(s => s.id === slot.id);
    if (index >= 0) {
      existing[index] = slot;
    } else {
      existing.unshift(slot);
    }
    const trimmed = existing.slice(0, 20);
    localStorage.setItem(STORAGE_KEY_SLOTS, JSON.stringify(trimmed));
    return trimmed;
  } catch {
    return [];
  }
}

export function deleteSlot(id: string): SaveSlot[] {
  try {
    const existing = getStoredSlots().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY_SLOTS, JSON.stringify(existing));
    return existing;
  } catch {
    return [];
  }
}

export function saveActiveWorkspace(data: {
  fileName: string;
  format: DetectedFormat;
  rawJson: string;
}): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(data));
  } catch {
  }
}

export function loadActiveWorkspace(): {
  fileName: string;
  format: DetectedFormat;
  rawJson: string;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function exportWorkspaceSnapshot(slot: SaveSlot): string {
  const payload = {
    app: 'Pulsesaves De&Recoder',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    slot
  };
  return JSON.stringify(payload, null, 2);
}

export function importWorkspaceSnapshot(jsonText: string): SaveSlot | null {
  try {
    const parsed = JSON.parse(jsonText);
    if (parsed.slot && parsed.slot.id && parsed.slot.fileName) {
      return parsed.slot as SaveSlot;
    }
    if (parsed.id && parsed.fileName && parsed.format) {
      return parsed as SaveSlot;
    }
    return null;
  } catch {
    return null;
  }
}

export function generateShareableUrl(jsonString: string, fileName: string): string {
  try {
    const minified = JSON.stringify(JSON.parse(jsonString));
    const encoded = encodeURIComponent(minified);
    const origin = window.location.origin + window.location.pathname;
    return `${origin}#share=${encoded}&name=${encodeURIComponent(fileName)}`;
  } catch {
    return '';
  }
}

export function parseShareableUrl(): { data: unknown; fileName: string } | null {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.includes('share=')) return null;

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const shareParam = params.get('share');
    const nameParam = params.get('name') || 'shared_save.pctsave';

    if (!shareParam) return null;
    const decoded = decodeURIComponent(shareParam);
    const parsed = JSON.parse(decoded);
    return { data: parsed, fileName: nameParam };
  } catch {
    return null;
  }
}
