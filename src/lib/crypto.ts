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
const TOTP_WINDOW = 1;

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf: Buffer): string {
  let bits = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    out += B32[parseInt(bits.substring(i, i + 5).padEnd(5, '0'), 2)];
  }
  return out;
}

function base32Decode(str: string): Buffer {
  const s = str.replace(/[= ]/g, '').toUpperCase();
  let bits = '';
  for (const ch of s) {
    const idx = B32.indexOf(ch);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  // Return base32-encoded secret (this is what authenticator apps use)
  return base32Encode(randomBytes(20));
}

function hotpCode(secret: string, counter: number): string {
  // secret is base32 — decode to bytes for HMAC
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) { buf[i] = tmp & 0xff; tmp = Math.floor(tmp / 256); }
  const hmac = createHmac('sha1', key);
  hmac.update(buf);
  const digest = hmac.digest();
  const offset = digest[digest.length - 1] & 0xf;
  const code = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
  return (code % Math.pow(10, TOTP_DIGITS)).toString().padStart(TOTP_DIGITS, '0');
}

export function getTotpCode(secret: string): string {
  return hotpCode(secret, Math.floor(Date.now() / 1000 / TOTP_PERIOD));
}

export function verifyTotp(secret: string, token: string): boolean {
  const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    if (hotpCode(secret, counter + i) === token.trim()) return true;
  }
  return false;
}

export function getTotpUri(secret: string, email: string, issuer: string = 'Watchtower'): string {
  // secret is already base32
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
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

// ═══ API KEY VALIDATION ═══
export async function validateApiKey(req: Request): Promise<{ valid: boolean; tenantId?: string; email?: string; scopes?: string[] }> {
  const header = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!header || !header.startsWith('wt_')) return { valid: false };
  
  // Dynamic import to avoid circular deps
  const { loadPlatformData } = await import('@/lib/config-store');
  const platform = await loadPlatformData();
  const key = (platform.apiKeys || []).find((k: any) => k.key === header && !k.revoked);
  if (!key) return { valid: false };
  
  key.lastUsedAt = new Date().toISOString();
  try { const { savePlatformData } = await import('@/lib/config-store'); await savePlatformData(platform); } catch {}
  
  return { valid: true, tenantId: key.tenantId, email: key.createdBy, scopes: key.scopes };
}
