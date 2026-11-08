import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanBase64String,
  detectBase64Variant,
  normalizeBase64,
  uint8ArrayToBase64,
  base64ToUint8Array,
  decodeUniversalBase64,
  encodeTextToBytes,
  decodeBytesToText
} from './base64';

test('cleanBase64String strips whitespace, newlines, and carriage returns', () => {
  const dirty = '  SGVs bG8g V29y bGQ= \r\n\t ';
  assert.equal(cleanBase64String(dirty), 'SGVsbG8gV29ybGQ=');
});

test('detectBase64Variant accurately detects standard padded and url-safe strings', () => {
  const standard = detectBase64Variant('SGVsbG8+V29ybGQ=');
  assert.equal(standard.isBase64, true);
  assert.equal(standard.variant, 'standard');
  assert.equal(standard.hasPadding, true);

  const urlSafe = detectBase64Variant('SGVsbG8-V29ybGQ_');
  assert.equal(urlSafe.isBase64, true);
  assert.equal(urlSafe.variant, 'url-safe');

  const invalid = detectBase64Variant('Not a valid base 64 string!!#$$%');
  assert.equal(invalid.isBase64, false);
});

test('normalizeBase64 repairs url-safe chars and missing padding', () => {
  const unpadded = 'SGVsbG8';
  const normalized = normalizeBase64(unpadded);
  assert.equal(normalized.length % 4, 0);
  assert.ok(normalized.endsWith('='));

  const urlSafe = 'w7j_';
  const repaired = normalizeBase64(urlSafe);
  assert.ok(!repaired.includes('-'));
  assert.ok(!repaired.includes('_'));
});

test('round-trip base64 encoding and decoding preserves exact bytes and text', () => {
  const sample = 'Hello, World! 🌌 Silicon Empire Save File 2026';
  const originalBytes = encodeTextToBytes(sample, 'utf-8');
  const b64 = uint8ArrayToBase64(originalBytes, 'standard');
  const decodedBytes = base64ToUint8Array(b64);
  const { text } = decodeBytesToText(decodedBytes);

  assert.equal(text, sample);
  assert.deepEqual(Array.from(decodedBytes), Array.from(originalBytes));
});

test('decodeUniversalBase64 succeeds on raw base64 string', () => {
  const input = 'eyJjcmVkaXRzIjo5OTk5OTksImVtcGlyZSI6IlB1bHNlIn0=';
  const result = decodeUniversalBase64(input);
  assert.equal(result.success, true);
  assert.ok(result.text.includes('"credits":999999'));
});
