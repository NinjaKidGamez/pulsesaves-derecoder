import { Base64Variant, TextEncoding } from '../types/save';

export function cleanBase64String(input: string): string {
  return input.replace(/[\s\r\n\t]+/g, '');
}

export function detectBase64Variant(input: string): { isBase64: boolean; variant: Base64Variant; hasPadding: boolean } {
  const cleaned = cleanBase64String(input);
  if (!cleaned || cleaned.length < 2) {
    return { isBase64: false, variant: 'standard', hasPadding: false };
  }

  const isUrlSafe = /[-_]/.test(cleaned);
  const isStandard = /[+/]/.test(cleaned);

  if (isUrlSafe && isStandard) {
    return { isBase64: false, variant: 'standard', hasPadding: false };
  }

  const hasPadding = cleaned.endsWith('=');
  const validBase64Regex = isUrlSafe
    ? /^[A-Za-z0-9\-_]+={0,3}$/
    : /^[A-Za-z0-9+/]+={0,3}$/;

  if (!validBase64Regex.test(cleaned)) {
    return { isBase64: false, variant: 'standard', hasPadding: false };
  }

  const variant: Base64Variant = isUrlSafe ? 'url-safe' : hasPadding ? 'standard' : 'unpadded';
  return { isBase64: true, variant, hasPadding };
}

export function normalizeBase64(input: string): string {
  let cleaned = cleanBase64String(input);
  cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  const missingPadding = (4 - (cleaned.length % 4)) % 4;
  if (missingPadding > 0) {
    cleaned += '='.repeat(missingPadding);
  }
  return cleaned;
}

export function base64ToUint8Array(input: string): Uint8Array {
  const normalized = normalizeBase64(input);
  if (typeof atob === 'function') {
    const binaryString = atob(normalized);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  let bufferLength = normalized.length * 0.75;
  if (normalized.endsWith('==')) bufferLength -= 2;
  else if (normalized.endsWith('=')) bufferLength -= 1;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < normalized.length; i += 4) {
    const enc1 = lookup[normalized.charCodeAt(i)];
    const enc2 = lookup[normalized.charCodeAt(i + 1)];
    const enc3 = lookup[normalized.charCodeAt(i + 2)];
    const enc4 = lookup[normalized.charCodeAt(i + 3)];

    bytes[p++] = (enc1 << 2) | (enc2 >> 4);
    if (normalized.charAt(i + 2) !== '=') {
      bytes[p++] = ((enc2 & 15) << 4) | (enc3 >> 2);
    }
    if (normalized.charAt(i + 3) !== '=') {
      bytes[p++] = ((enc3 & 3) << 6) | enc4;
    }
  }
  return bytes;
}

export function uint8ArrayToBase64(bytes: Uint8Array, variant: Base64Variant = 'standard'): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }

  let base64 = btoa(binary);

  if (variant === 'url-safe') {
    base64 = base64.replace(/\+/g, '-').replace(/\//g, '_');
  } else if (variant === 'unpadded') {
    base64 = base64.replace(/=+$/, '');
  }

  return base64;
}

export function decodeBytesToText(bytes: Uint8Array): { text: string; encoding: TextEncoding } {
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    return {
      text: utf8Decoder.decode(bytes),
      encoding: 'utf-8'
    };
  } catch {
    try {
      const utf16Decoder = new TextDecoder('utf-16le', { fatal: true });
      const text = utf16Decoder.decode(bytes);
      if (text.length > 0 && !text.includes('\uFFFD')) {
        return { text, encoding: 'utf-16le' };
      }
    } catch {
      let ascii = '';
      for (let i = 0; i < bytes.length; i++) {
        ascii += String.fromCharCode(bytes[i] & 0x7f);
      }
      return { text: ascii, encoding: 'ascii' };
    }
  }

  let fallback = '';
  for (let i = 0; i < bytes.length; i++) {
    fallback += String.fromCharCode(bytes[i]);
  }
  return { text: fallback, encoding: 'ascii' };
}

export function encodeTextToBytes(text: string, encoding: TextEncoding = 'utf-8'): Uint8Array {
  if (encoding === 'utf-16le') {
    const bytes = new Uint8Array(text.length * 2);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      bytes[i * 2] = code & 0xff;
      bytes[i * 2 + 1] = (code >> 8) & 0xff;
    }
    return bytes;
  }
  return new TextEncoder().encode(text);
}

export function decodeUniversalBase64(input: string): {
  success: boolean;
  bytes: Uint8Array;
  text: string;
  encoding: TextEncoding;
  variant: Base64Variant;
  error?: string;
} {
  try {
    const { isBase64, variant } = detectBase64Variant(input);
    if (!isBase64) {
      return {
        success: false,
        bytes: new Uint8Array(),
        text: '',
        encoding: 'utf-8',
        variant: 'standard',
        error: 'Invalid Base64 sequence'
      };
    }
    const bytes = base64ToUint8Array(input);
    const { text, encoding } = decodeBytesToText(bytes);
    return {
      success: true,
      bytes,
      text,
      encoding,
      variant
    };
  } catch (err) {
    return {
      success: false,
      bytes: new Uint8Array(),
      text: '',
      encoding: 'utf-8',
      variant: 'standard',
      error: err instanceof Error ? err.message : 'Base64 decoding failed'
    };
  }
}
