import { createHmac, randomBytes, pbkdf2Sync } from 'crypto';

// ═══ PASSWORD HASHING (PBKDF2 — no bcrypt needed) ═══
const SALT_LEN = 32;
const ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN).toString('hex');
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
  return `pbkdf2:${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  // Support legacy simple hash
  if (stored.startsWith('h_')) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) { hash = ((hash << 5) - hash) + password.charCodeAt(i); hash |= 0; }
    return stored === 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
  }
  // PBKDF2 hash
  if (!stored.startsWith('pbkdf2:')) return false;
  const parts = stored.split(':');
  if (parts.length !== 4) return false;
  const [, iters, salt, hash] = parts;
  const check = pbkdf2Sync(password, salt, parseInt(iters), KEY_LEN, DIGEST).toString('hex');
  return check === hash;
}

// ═══ TOTP (RFC 6238 — zero dependencies) ═══
const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;
const TOTP_WINDOW = 1; // Allow 1 step before/after

export function generateTotpSecret(): string {
  return randomBytes(20).toString('hex');
}

function hexToBytes(hex: string): Buffer {
  return Buffer.from(hex, 'hex');
}

function dynamicTruncate(hmacResult: Buffer): number {
  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const code = ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);
  return code % Math.pow(10, TOTP_DIGITS);
}

function generateTotp(secret: string, counter: number): string {
  const buf = Buffer.alloc(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) { buf[i] = tmp & 0xff; tmp >>= 8; }
  const hmac = createHmac('sha1', hexToBytes(secret));
  hmac.update(buf);
  const code = dynamicTruncate(hmac.digest());
  return code.toString().padStart(TOTP_DIGITS, '0');
}

export function getTotpCode(secret: string): string {
  const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  return generateTotp(secret, counter);
}

export function verifyTotp(secret: string, token: string): boolean {
  const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    if (generateTotp(secret, counter + i) === token) return true;
  }
  return false;
}

export function getTotpUri(secret: string, email: string, issuer: string = 'RunbookHQ'): string {
  // Convert hex secret to base32 for authenticator apps
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = hexToBytes(secret);
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
  let base32 = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5).padEnd(5, '0');
    base32 += base32Chars[parseInt(chunk, 2)];
  }
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${base32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

// ═══ RATE LIMITING ═══
const rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

export function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 900000): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: maxAttempts - entry.count, retryAfterMs: 0 };
}

// ═══ SESSION TOKENS ═══
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}
