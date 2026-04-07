import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Set required env vars before imports ──────────────────────────────────────
process.env.WATCHTOWER_ENCRYPT_KEY = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2';
process.env.WATCHTOWER_SESSION_SECRET = 'test-session-secret-for-vitest-only';
// @ts-expect-error — test override
process.env.NODE_ENV = 'test';

import { encrypt, decrypt, signSession, verifySession } from '@/lib/encrypt';

// ═══ Encryption ═══════════════════════════════════════════════════════════════

describe('encrypt / decrypt', () => {
  it('round-trips plaintext correctly', () => {
    const plaintext = 'sk-ant-api03-secret-key-here';
    const ciphertext = encrypt(plaintext);
    expect(ciphertext).not.toEqual(plaintext);
    expect(decrypt(ciphertext)).toEqual(plaintext);
  });

  it('produces different ciphertext each time (random IV)', () => {
    const plaintext = 'same-input-different-output';
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);
    expect(a).not.toEqual(b);
    // Both decrypt to same value
    expect(decrypt(a)).toEqual(plaintext);
    expect(decrypt(b)).toEqual(plaintext);
  });

  it('handles empty string', () => {
    const ciphertext = encrypt('');
    // AES-GCM can encrypt empty strings; ciphertext still has iv:tag:data format
    // The data portion will be empty hex
    expect(ciphertext).toContain(':');
    expect(ciphertext).not.toEqual('');
  });

  it('handles unicode and special characters', () => {
    const plaintext = '日本語テスト 🔐 <script>alert("xss")</script>';
    expect(decrypt(encrypt(plaintext))).toEqual(plaintext);
  });

  it('handles long payloads (API keys, JSON blobs)', () => {
    const payload = JSON.stringify({ users: Array.from({ length: 100 }, (_, i) => ({ id: i, email: `user${i}@test.com` })) });
    expect(decrypt(encrypt(payload))).toEqual(payload);
  });

  it('returns ciphertext as-is if not in encrypted format (legacy fallback)', () => {
    const legacyPlaintext = 'this-is-not-encrypted';
    expect(decrypt(legacyPlaintext)).toEqual(legacyPlaintext);
  });

  it('ciphertext has correct format (iv:tag:data, all hex)', () => {
    const ciphertext = encrypt('test');
    const parts = ciphertext.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toMatch(/^[0-9a-f]{32}$/); // IV: 16 bytes = 32 hex
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/); // Tag: 16 bytes = 32 hex
    expect(parts[2]).toMatch(/^[0-9a-f]+$/);    // Ciphertext: variable length hex
  });

  it('rejects tampered ciphertext (GCM auth tag)', () => {
    const ciphertext = encrypt('sensitive-data');
    const parts = ciphertext.split(':');
    // Flip a byte in the auth tag
    const tampered = parts[0] + ':' + 'ff'.repeat(16) + ':' + parts[2];
    // Should either throw or return the tampered string (fallback)
    // The decrypt function catches errors and returns ciphertext as-is
    const result = decrypt(tampered);
    expect(result).not.toEqual('sensitive-data');
  });
});

// ═══ Session Tokens ═══════════════════════════════════════════════════════════

describe('signSession / verifySession', () => {
  it('signs and verifies a session payload', () => {
    const payload = { userId: 'u_abc123', tenantId: 'global', isAdmin: true, email: 'admin@test.com' };
    const token = signSession(payload);
    const verified = verifySession(token) as any;
    expect(verified).not.toBeNull();
    expect(verified.userId).toEqual('u_abc123');
    expect(verified.tenantId).toEqual('global');
    expect(verified.isAdmin).toBe(true);
    expect(verified.email).toEqual('admin@test.com');
  });

  it('includes iat (issued at) timestamp', () => {
    const before = Date.now();
    const token = signSession({ userId: 'test' });
    const after = Date.now();
    const verified = verifySession(token) as any;
    expect(verified.iat).toBeGreaterThanOrEqual(before);
    expect(verified.iat).toBeLessThanOrEqual(after);
  });

  it('includes unique jti for revocation', () => {
    const t1 = signSession({ userId: 'test' });
    const t2 = signSession({ userId: 'test' });
    const v1 = verifySession(t1) as any;
    const v2 = verifySession(t2) as any;
    expect(v1.jti).toBeTruthy();
    expect(v2.jti).toBeTruthy();
    expect(v1.jti).not.toEqual(v2.jti);
  });

  it('rejects tampered token', () => {
    const token = signSession({ userId: 'test', isAdmin: false });
    // Tamper with the payload
    const [encoded, sig] = token.split('.');
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    payload.isAdmin = true; // Privilege escalation attempt
    const tampered = Buffer.from(JSON.stringify(payload)).toString('base64url') + '.' + sig;
    expect(verifySession(tampered)).toBeNull();
  });

  it('rejects malformed tokens', () => {
    expect(verifySession('')).toBeNull();
    expect(verifySession('not-a-token')).toBeNull();
    expect(verifySession('a.b.c')).toBeNull();
    expect(verifySession('....')).toBeNull();
  });

  it('token format is base64url.base64url', () => {
    const token = signSession({ userId: 'test' });
    const parts = token.split('.');
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(parts[1]).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
