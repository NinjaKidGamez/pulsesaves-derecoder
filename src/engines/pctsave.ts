import JSZip from 'jszip';
import {
  ArchiveFileEntry,
  DetectedFormat,
  EncodeOptions,
  ParseResult,
  VerificationResult
} from '../types/save';
import {
  base64ToUint8Array,
  cleanBase64String,
  decodeBytesToText,
  detectBase64Variant,
  encodeTextToBytes,
  uint8ArrayToBase64
} from './base64';
import {
  compressBytes,
  decompressBytes,
  detectCompressionFormat
} from './compression';

export function isSiliconEmpireData(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const target = obj as Record<string, unknown>;
  const keys = Object.keys(target).map(k => k.toLowerCase());
  const deepState = target.state || target.gameState || target.data || target.player;
  const deepKeys = deepState && typeof deepState === 'object'
    ? Object.keys(deepState as Record<string, unknown>).map(k => k.toLowerCase())
    : [];
  const allKeys = [...keys, ...deepKeys];

  const signatures = [
    'silicon',
    'nanobots',
    'alloys',
    'credits',
    'minerals',
    'fleets',
    'colonies',
    'research',
    'techpoints',
    'empire',
    'pctsave'
  ];

  let matches = 0;
  for (const sig of signatures) {
    if (allKeys.some(k => k.includes(sig))) {
      matches++;
    }
  }

  return matches >= 2;
}

export async function parseSaveBuffer(
  buffer: ArrayBuffer | Uint8Array,
  fileName: string = 'save.pctsave'
): Promise<ParseResult> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || '' : '';
  const isPctSave = extension === 'pctsave' || fileName.toLowerCase().endsWith('.pctsave');

  const detected: DetectedFormat = {
    isPctSave,
    isZipArchive: false,
    isBase64: false,
    compression: 'none',
    textEncoding: 'utf-8',
    isJson: false,
    isSiliconEmpire: false,
    originalFileName: fileName,
    originalExtension: extension,
    originalSizeBytes: bytes.byteLength
  };

  const compression = detectCompressionFormat(bytes);

  if (compression === 'zip-archive') {
    try {
      const zip = await JSZip.loadAsync(bytes);
      detected.isZipArchive = true;
      detected.compression = 'zip-archive';

      const entries: ArchiveFileEntry[] = [];
      const fileNames = Object.keys(zip.files);
      let mainFileName = '';
      let mainJsonString = '';

      for (const name of fileNames) {
        const file = zip.files[name];
        if (file.dir) continue;
        const entryBytes = await file.async('uint8array');
        entries.push({
          path: name,
          isMainState: false,
          size: entryBytes.byteLength,
          data: entryBytes
        });
      }

      const priorityNames = [
        'save.json',
        'gamestate.json',
        'game.json',
        'state.json',
        'state.pct',
        'data.json',
        'player.json'
      ];

      for (const priority of priorityNames) {
        const match = entries.find(e => e.path.toLowerCase().endsWith(priority));
        if (match) {
          mainFileName = match.path;
          break;
        }
      }

      if (!mainFileName) {
        const jsonMatch = entries.find(e => e.path.toLowerCase().endsWith('.json') || e.path.toLowerCase().endsWith('.pct'));
        if (jsonMatch) {
          mainFileName = jsonMatch.path;
        } else if (entries.length > 0) {
          mainFileName = entries[0].path;
        }
      }

      if (mainFileName) {
        const targetEntry = entries.find(e => e.path === mainFileName)!;
        targetEntry.isMainState = true;
        detected.extractedFileName = mainFileName;
        const { text, encoding } = decodeBytesToText(targetEntry.data);
        detected.textEncoding = encoding;

        try {
          const parsed = JSON.parse(text);
          detected.isJson = true;
          detected.isSiliconEmpire = isSiliconEmpireData(parsed);
          return {
            format: detected,
            rawParsedData: parsed,
            jsonString: JSON.stringify(parsed, null, 2),
            archiveEntries: entries
          };
        } catch {
          mainJsonString = text;
        }
      }

      if (mainJsonString) {
        return {
          format: detected,
          rawParsedData: mainJsonString,
          jsonString: mainJsonString,
          archiveEntries: entries
        };
      }
    } catch {
    }
  }

  if (compression === 'gzip' || compression === 'zlib') {
    try {
      const decompressed = await decompressBytes(bytes, compression);
      detected.compression = compression;
      const { text, encoding } = decodeBytesToText(decompressed);
      detected.textEncoding = encoding;

      try {
        const parsed = JSON.parse(text);
        detected.isJson = true;
        detected.isSiliconEmpire = isSiliconEmpireData(parsed);
        return {
          format: detected,
          rawParsedData: parsed,
          jsonString: JSON.stringify(parsed, null, 2)
        };
      } catch {
        return {
          format: detected,
          rawParsedData: text,
          jsonString: text
        };
      }
    } catch {
    }
  }

  const { text: directText, encoding: textEncoding } = decodeBytesToText(bytes);
  detected.textEncoding = textEncoding;
  const trimmed = directText.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      detected.isJson = true;
      detected.isSiliconEmpire = isSiliconEmpireData(parsed);
      return {
        format: detected,
        rawParsedData: parsed,
        jsonString: JSON.stringify(parsed, null, 2)
      };
    } catch {
    }
  }

  const base64Info = detectBase64Variant(trimmed);
  if (base64Info.isBase64 && trimmed.length >= 8) {
    try {
      const rawDecodedBytes = base64ToUint8Array(trimmed);
      detected.isBase64 = true;
      detected.base64Variant = base64Info.variant;

      const innerCompression = detectCompressionFormat(rawDecodedBytes);
      if (innerCompression !== 'none') {
        detected.compression = innerCompression;
        if (innerCompression === 'zip-archive') {
          const innerZip = await JSZip.loadAsync(rawDecodedBytes);
          detected.isZipArchive = true;
          const innerEntries: ArchiveFileEntry[] = [];
          for (const name of Object.keys(innerZip.files)) {
            const f = innerZip.files[name];
            if (f.dir) continue;
            const ed = await f.async('uint8array');
            innerEntries.push({
              path: name,
              isMainState: false,
              size: ed.byteLength,
              data: ed
            });
          }
          const chosen = innerEntries.find(e => e.path.endsWith('.json')) || innerEntries[0];
          if (chosen) {
            chosen.isMainState = true;
            detected.extractedFileName = chosen.path;
            const innerDecoded = decodeBytesToText(chosen.data);
            const parsed = JSON.parse(innerDecoded.text);
            detected.isJson = true;
            detected.isSiliconEmpire = isSiliconEmpireData(parsed);
            return {
              format: detected,
              rawParsedData: parsed,
              jsonString: JSON.stringify(parsed, null, 2),
              archiveEntries: innerEntries
            };
          }
        } else {
          const innerDecompressed = await decompressBytes(rawDecodedBytes, innerCompression as 'gzip' | 'zlib');
          const innerTextInfo = decodeBytesToText(innerDecompressed);
          const parsed = JSON.parse(innerTextInfo.text);
          detected.isJson = true;
          detected.isSiliconEmpire = isSiliconEmpireData(parsed);
          return {
            format: detected,
            rawParsedData: parsed,
            jsonString: JSON.stringify(parsed, null, 2)
          };
        }
      }

      const innerDecoded = decodeBytesToText(rawDecodedBytes);
      const innerTrimmed = innerDecoded.text.trim();
      if (innerTrimmed.startsWith('{') || innerTrimmed.startsWith('[')) {
        const parsed = JSON.parse(innerTrimmed);
        detected.isJson = true;
        detected.isSiliconEmpire = isSiliconEmpireData(parsed);
        return {
          format: detected,
          rawParsedData: parsed,
          jsonString: JSON.stringify(parsed, null, 2)
        };
      } else {
        return {
          format: detected,
          rawParsedData: innerDecoded.text,
          jsonString: innerDecoded.text
        };
      }
    } catch {
    }
  }

  return {
    format: detected,
    rawParsedData: directText,
    jsonString: directText
  };
}

export async function repackSaveData(
  currentData: unknown,
  format: DetectedFormat,
  options: EncodeOptions = {},
  archiveEntries?: ArchiveFileEntry[]
): Promise<Uint8Array> {
  let contentString: string;
  if (typeof currentData === 'string') {
    contentString = currentData;
  } else {
    const indent = options.indent !== undefined ? options.indent : 0;
    contentString = indent > 0 ? JSON.stringify(currentData, null, indent) : JSON.stringify(currentData);
  }

  if (format.isZipArchive) {
    const zip = new JSZip();
    const mainPath = options.zipMainFileName || format.extractedFileName || 'save.json';

    if (archiveEntries && archiveEntries.length > 0) {
      for (const entry of archiveEntries) {
        if (entry.path === mainPath || entry.isMainState) {
          zip.file(entry.path, encodeTextToBytes(contentString, format.textEncoding));
        } else {
          zip.file(entry.path, entry.data);
        }
      }
    } else {
      zip.file(mainPath, encodeTextToBytes(contentString, format.textEncoding));
    }

    return await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
  }

  let rawBytes = encodeTextToBytes(contentString, format.textEncoding);

  if (format.compression === 'gzip') {
    rawBytes = await compressBytes(rawBytes, 'gzip');
  } else if (format.compression === 'deflate' || format.compression === 'zlib') {
    rawBytes = await compressBytes(rawBytes, 'deflate');
  }

  if (format.isBase64 || options.forceBase64) {
    const variant = options.base64Variant || format.base64Variant || 'standard';
    const b64String = uint8ArrayToBase64(rawBytes, variant);
    return encodeTextToBytes(b64String, 'utf-8');
  }

  return rawBytes;
}

export function applySiliconEmpirePreset(
  state: unknown,
  presetId: 'max-resources' | 'instant-research' | 'nanobots-swarm' | 'invincible-fleet' | 'utopia' | 'god-mode'
): unknown {
  if (!state || typeof state !== 'object') return state;

  const clone = JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
  const findAndModify = (
    root: Record<string, unknown>,
    predicate: (k: string) => boolean,
    modifier: (val: unknown) => unknown
  ) => {
    for (const key of Object.keys(root)) {
      if (predicate(key.toLowerCase())) {
        root[key] = modifier(root[key]);
      }
      if (root[key] && typeof root[key] === 'object' && !Array.isArray(root[key])) {
        findAndModify(root[key] as Record<string, unknown>, predicate, modifier);
      }
    }
  };

  if (presetId === 'max-resources' || presetId === 'god-mode') {
    findAndModify(
      clone,
      k => ['credits', 'energy', 'minerals', 'alloys', 'silicon', 'funds', 'cash', 'money'].some(s => k.includes(s)),
      () => 999999999
    );
  }

  if (presetId === 'instant-research' || presetId === 'god-mode') {
    findAndModify(
      clone,
      k => ['research', 'techpoints', 'science', 'tech_points', 'technology'].some(s => k.includes(s)),
      val => (typeof val === 'number' ? 10000000 : val)
    );
  }

  if (presetId === 'nanobots-swarm' || presetId === 'god-mode') {
    findAndModify(
      clone,
      k => ['nanobots', 'nano_bots', 'bots', 'swarm', 'drones'].some(s => k.includes(s)),
      () => 50000000
    );
  }

  if (presetId === 'invincible-fleet' || presetId === 'god-mode') {
    findAndModify(
      clone,
      k => ['fleet', 'ships', 'military', 'shields', 'firepower', 'dreadnought'].some(s => k.includes(s)),
      val => (typeof val === 'number' ? Math.max(val, 9999999) : val)
    );
  }

  if (presetId === 'utopia' || presetId === 'god-mode') {
    findAndModify(
      clone,
      k => ['happiness', 'stability', 'approval', 'morale'].some(s => k.includes(s)),
      () => 100
    );
    findAndModify(
      clone,
      k => ['population', 'citizens', 'workers'].some(s => k.includes(s)),
      val => (typeof val === 'number' ? Math.max(val, 5000000) : val)
    );
  }

  return clone;
}

export function createSiliconEmpireDemoSave(): Record<string, unknown> {
  return {
    game: "Silicon Empire",
    saveVersion: "2.4.1",
    timestamp: Date.now(),
    empireName: "Aethelgard Ascendancy",
    leader: {
      name: "Grand Overseer Vane",
      level: 42,
      traits: ["Synthetics Visionary", "Resource Architect", "Void Navigator"]
    },
    resources: {
      credits: 4852900,
      energy: 942100,
      minerals: 1250400,
      alloys: 683000,
      silicon: 891200,
      nanobots: 154000
    },
    research: {
      techPoints: 74200,
      currentTech: "Hyper-Dimensional Nanofabrication",
      progressPercent: 68.4,
      completedTechs: [
        "Quantum Computing Arrays",
        "Orbital Shipyards Alpha",
        "Plasma Reactor V",
        "Atmospheric Synthesis"
      ]
    },
    colonies: [
      {
        id: "colony-01",
        name: "Prime Alpha",
        classification: "Ecumenopolis",
        population: 14200000,
        happiness: 96,
        stability: 98,
        buildings: {
          nanofoundry: 12,
          solarArray: 25,
          mineralSynthesizer: 18,
          defenseMatrix: 8
        }
      },
      {
        id: "colony-02",
        name: "Neo Cydonia",
        classification: "Mining Outpost",
        population: 3200000,
        happiness: 91,
        stability: 94,
        buildings: {
          deepMantleExcavator: 15,
          siliconRefinery: 20
        }
      }
    ],
    military: {
      fleetPower: 845000,
      fleetsCount: 14,
      flagship: "The Iron Singularity",
      dreadnoughts: 6,
      cruisers: 38,
      corvettes: 120,
      shieldHarmonicsLevel: 15
    },
    flags: {
      hardcoreMode: false,
      ironman: false,
      tutorialCompleted: true,
      galacticCouncilMember: true
    }
  };
}

export async function verifySaveIntegrity(
  originalBytes: Uint8Array,
  editedData: unknown,
  format: DetectedFormat,
  archiveEntries?: ArchiveFileEntry[]
): Promise<VerificationResult> {
  const errors: string[] = [];
  let newBytes: Uint8Array = new Uint8Array();
  let roundTripMatch = false;

  try {
    newBytes = await repackSaveData(editedData, format, {}, archiveEntries);
  } catch (err) {
    errors.push(`Packing failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (newBytes.byteLength > 0) {
    try {
      const reParsed = await parseSaveBuffer(newBytes, format.originalFileName);
      if (typeof editedData === 'object' && editedData !== null) {
        const originalNormalized = JSON.stringify(editedData);
        const reParsedNormalized = JSON.stringify(reParsed.rawParsedData);
        roundTripMatch = originalNormalized === reParsedNormalized;
      } else {
        roundTripMatch = String(editedData) === String(reParsed.rawParsedData);
      }
    } catch (err) {
      errors.push(`Re-decoding failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const originalSize = originalBytes.byteLength;
  const newSize = newBytes.byteLength;
  const compressionRatio = originalSize > 0
    ? `${((newSize / originalSize) * 100).toFixed(1)}%`
    : '100%';

  return {
    isValid: errors.length === 0,
    originalSize,
    newSize,
    diffCount: 0,
    compressionRatio,
    roundTripMatch,
    errors
  };
}
