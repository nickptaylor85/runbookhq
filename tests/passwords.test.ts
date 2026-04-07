import { describe, it, expect } from 'vitest';

process.env.WATCHTOWER_SESSION_SECRET = 'test-secret';
// @ts-expect-error — test override
process.env.NODE_ENV = 'test';

import { hashPassword, verifyPassword } from '@/lib/users';

describe('hashPassword / verifyPassword', () => {
  it('hashes and verifies a password', () => {
    const hash = hashPassword('MySecureP@ssw0rd!');
    expect(hash).toContain('scrypt:');
    expect(verifyPassword('MySecureP@ssw0rd!', hash)).toBe(true);
  });

  it('rejects wrong password', () => {
    const hash = hashPassword('CorrectPassword123!');
    expect(verifyPassword('WrongPassword456!', hash)).toBe(false);
  });

  it('produces different hashes for same password (random salt)', () => {
    const h1 = hashPassword('SamePassword!');
    const h2 = hashPassword('SamePassword!');
    expect(h1).not.toEqual(h2);
    // Both verify correctly
    expect(verifyPassword('SamePassword!', h1)).toBe(true);
    expect(verifyPassword('SamePassword!', h2)).toBe(true);
  });

  it('uses scrypt format: scrypt:salt:hash', () => {
    const hash = hashPassword('Test123!');
    const parts = hash.split(':');
    expect(parts[0]).toEqual('scrypt');
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/); // 16-byte salt = 32 hex
    expect(parts[2]).toMatch(/^[0-9a-f]{128}$/); // 64-byte hash = 128 hex
  });

  it('handles long passwords', () => {
    const longPw = 'A'.repeat(256) + '!1a';
    const hash = hashPassword(longPw);
    expect(verifyPassword(longPw, hash)).toBe(true);
  });

  it('handles unicode passwords', () => {
    const pw = 'パスワード🔒Secure!1';
    const hash = hashPassword(pw);
    expect(verifyPassword(pw, hash)).toBe(true);
    expect(verifyPassword('wrong', hash)).toBe(false);
  });

  it('accepts custom salt for deterministic hashing', () => {
    const salt = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
    const h1 = hashPassword('Test!', salt);
    const h2 = hashPassword('Test!', salt);
    expect(h1).toEqual(h2);
  });
});
