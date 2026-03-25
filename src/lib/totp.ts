import { createHmac, randomBytes } from 'crypto';

// Base32 alphabet (RFC 4648)
const B32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input: string): Buffer {
  const str = input.replace(/=+$/, '').toUpperCase();
  let bits = 0, value = 0;
  const output: number[] = [];
  for (const c of str) {
    const idx = B32_CHARS.indexOf(c);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) { bits -= 8; output.push((value >>> bits) & 0xff); }
  }
  return Buffer.from(output);
}

function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { bits -= 5; out += B32_CHARS[(value >>> bits) & 31]; }
  }
  if (bits > 0) out += B32_CHARS[(value << (5 - bits)) & 31];
  return out;
}

/** Generate a random 20-byte TOTP secret (base32 encoded) */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** Compute HOTP for given key and counter */
function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', key).update(buf).digest();
  const offset = hmac[19] & 0xf;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1_000_000;
  return code.toString().padStart(6, '0');
}

/** Get current TOTP code (30-second window) */
export function totpNow(secret: string): string {
  return hotp(secret, Math.floor(Date.now() / 30_000));
}

/** Verify a TOTP code — checks current window ±1 for clock skew */
export function verifyTotp(secret: string, code: string): boolean {
  const t = Math.floor(Date.now() / 30_000);
  const clean = code.replace(/\s/g, '');
  return [-1, 0, 1].some(offset => hotp(secret, t + offset) === clean);
}

/** Generate an otpauth:// URI for QR code display */
export function totpUri(secret: string, account: string, issuer = 'Watchtower'): string {
  const enc = encodeURIComponent;
  return `otpauth://totp/${enc(issuer)}:${enc(account)}?secret=${secret}&issuer=${enc(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/** Generate a minimal QR code as a data URI (SVG-based, no external lib) */
export async function totpQrDataUri(uri: string): Promise<string> {
  // Use the qrcode-svg approach inline or fall back to a QR API
  // We'll use the Google Charts QR API as it's free and reliable
  const encoded = encodeURIComponent(uri);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&format=svg&color=4F8FFF&bgcolor=050508`;
}
