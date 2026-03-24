import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'crypto';

// WATCHTOWER_ENCRYPT_KEY must be 32 bytes hex (64 chars) — set in Vercel env vars
function getKey(): Buffer {
  const key = process.env.WATCHTOWER_ENCRYPT_KEY;
  if (!key || key.length < 32) {
    // Fallback for dev — NOT secure for production
    return Buffer.from('watchtower-dev-key-not-for-prod!!', 'utf8').subarray(0, 32);
  }
  return Buffer.from(key.slice(0, 64), 'hex');
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(ciphertext: string): string {
  try {
    const [ivHex, tagHex, dataHex] = ciphertext.split(':');
    if (!ivHex || !tagHex || !dataHex) return ciphertext; // not encrypted, return as-is
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(data).toString('utf8') + decipher.final('utf8');
  } catch {
    return ciphertext; // fallback for legacy unencrypted data
  }
}

// HMAC session token (no JWT dependency)
export function signSession(payload: object): string {
  const secret = process.env.WATCHTOWER_SESSION_SECRET || 'watchtower-dev-session-secret';
  const data = JSON.stringify({ ...payload, iat: Date.now() });
  const encoded = Buffer.from(data).toString('base64url');
  const sig = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySession(token: string): object | null {
  try {
    const secret = process.env.WATCHTOWER_SESSION_SECRET || 'watchtower-dev-session-secret';
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const expectedSig = createHmac('sha256', secret).update(encoded).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    // Token expires after 24h
    if (Date.now() - payload.iat > 86400000) return null;
    return payload;
  } catch {
    return null;
  }
}
