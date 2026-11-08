export type Base64Variant = 'standard' | 'url-safe' | 'unpadded';

export type TextEncoding = 'utf-8' | 'utf-16le' | 'ascii';

export type CompressionFormat = 'none' | 'gzip' | 'deflate' | 'zlib' | 'zip-archive';

export interface ArchiveFileEntry {
  path: string;
  isMainState: boolean;
  size: number;
  data: Uint8Array;
}

export interface DetectedFormat {
  isPctSave: boolean;
  isZipArchive: boolean;
  isBase64: boolean;
  base64Variant?: Base64Variant;
  compression: CompressionFormat;
  textEncoding: TextEncoding;
  isJson: boolean;
  isSiliconEmpire: boolean;
  gameTitle?: string;
  originalFileName: string;
  originalExtension: string;
  originalSizeBytes: number;
  extractedFileName?: string;
}

export interface ParseResult {
  format: DetectedFormat;
  rawParsedData: unknown;
  jsonString: string;
  archiveEntries?: ArchiveFileEntry[];
  error?: string;
}

export interface EncodeOptions {
  fileName?: string;
  forceBase64?: boolean;
  base64Variant?: Base64Variant;
  compression?: CompressionFormat;
  indent?: number;
  zipMainFileName?: string;
}

export interface SaveSlot {
  id: string;
  name: string;
  timestamp: number;
  fileName: string;
  format: DetectedFormat;
  data: unknown;
  rawJson: string;
}

export interface TreeNodeItem {
  id: string;
  key: string;
  path: (string | number)[];
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';
  depth: number;
  isExpanded?: boolean;
  childrenCount?: number;
}

export interface DiffEntry {
  path: string;
  type: 'added' | 'removed' | 'modified';
  oldValue: unknown;
  newValue: unknown;
}

export interface VerificationResult {
  isValid: boolean;
  originalSize: number;
  newSize: number;
  diffCount: number;
  compressionRatio?: string;
  roundTripMatch: boolean;
  errors: string[];
}
