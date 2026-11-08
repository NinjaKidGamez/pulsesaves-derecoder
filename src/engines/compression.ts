import { CompressionFormat } from '../types/save';

export function detectCompressionFormat(bytes: Uint8Array): CompressionFormat {
  if (bytes.length < 2) return 'none';

  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    return 'gzip';
  }

  if (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)
  ) {
    return 'zip-archive';
  }

  if (bytes[0] === 0x78 && (bytes[1] === 0x01 || bytes[1] === 0x9c || bytes[1] === 0xda || bytes[1] === 0x5e)) {
    const checksum = (bytes[0] * 256 + bytes[1]) % 31;
    if (checksum === 0) {
      return 'zlib';
    }
  }

  return 'none';
}

export async function decompressBytes(
  bytes: Uint8Array,
  format: 'gzip' | 'deflate' | 'deflate-raw' | 'zlib'
): Promise<Uint8Array> {
  const streamFormat = format === 'zlib' ? 'deflate' : format;

  if (typeof DecompressionStream !== 'undefined') {
    try {
      const stream = new DecompressionStream(streamFormat as 'gzip' | 'deflate');
      const writer = stream.writable.getWriter();
      writer.write(bytes as any);
      writer.close();
      const response = new Response(stream.readable);
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    } catch {
      if (format === 'zlib' && bytes.length > 6) {
        try {
          const rawDeflateStream = new DecompressionStream('deflate-raw');
          const stripped = bytes.subarray(2, bytes.length - 4);
          const rawWriter = rawDeflateStream.writable.getWriter();
          rawWriter.write(stripped as any);
          rawWriter.close();
          const rawResp = new Response(rawDeflateStream.readable);
          const rawBuf = await rawResp.arrayBuffer();
          return new Uint8Array(rawBuf);
        } catch {
          throw new Error('Decompression stream failed to decode buffer');
        }
      }
      throw new Error(`Failed to decompress data using ${format}`);
    }
  }

  throw new Error('DecompressionStream is not supported in this runtime environment');
}

export async function compressBytes(
  bytes: Uint8Array,
  format: 'gzip' | 'deflate'
): Promise<Uint8Array> {
  if (typeof CompressionStream !== 'undefined') {
    const stream = new CompressionStream(format);
    const writer = stream.writable.getWriter();
    writer.write(bytes as any);
    writer.close();
    const response = new Response(stream.readable);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  throw new Error('CompressionStream is not supported in this runtime environment');
}
