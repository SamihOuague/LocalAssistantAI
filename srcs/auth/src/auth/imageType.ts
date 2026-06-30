const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
const RIFF_SIGNATURE = Buffer.from([0x52, 0x49, 0x46, 0x46]); // "RIFF"
const WEBP_SIGNATURE = Buffer.from([0x57, 0x45, 0x42, 0x50]); // "WEBP"

function startsWith(buffer: Buffer, signature: Buffer): boolean {
  if (buffer.length < signature.length) return false;
  return buffer.subarray(0, signature.length).equals(signature);
}

export function detectImageMime(buffer: Buffer): string | null {
  if (startsWith(buffer, PNG_SIGNATURE)) return 'image/png';
  if (startsWith(buffer, JPEG_SIGNATURE)) return 'image/jpeg';
  if (
    startsWith(buffer, RIFF_SIGNATURE) &&
    buffer.length >= 12 &&
    buffer.subarray(8, 12).equals(WEBP_SIGNATURE)
  ) {
    return 'image/webp';
  }
  return null;
}
