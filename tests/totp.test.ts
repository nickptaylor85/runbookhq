import { describe, it, expect } from 'vitest';
import { generateTotpSecret, totpNow, verifyTotp, totpUri } from '@/lib/totp';

describe('TOTP', () => {
  it('generates a base32 secret', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(secret.length).toBeGreaterThanOrEqual(20);
  });

  it('generates unique secrets', () => {
    const s1 = generateTotpSecret();
    const s2 = generateTotpSecret();
    expect(s1).not.toEqual(s2);
  });

  it('generates a 6-digit code', () => {
    const secret = generateTotpSecret();
    const code = totpNow(secret);
    expect(code).toMatch(/^\d{6}$/);
  });

  it('verifies current code', () => {
    const secret = generateTotpSecret();
    const code = totpNow(secret);
    expect(verifyTotp(secret, code)).toBe(true);
  });

  it('rejects wrong code', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, '000000')).toBe(false);
    expect(verifyTotp(secret, '999999')).toBe(false);
  });

  it('handles code with spaces (user input)', () => {
    const secret = generateTotpSecret();
    const code = totpNow(secret);
    const spaced = code.slice(0, 3) + ' ' + code.slice(3);
    expect(verifyTotp(secret, spaced)).toBe(true);
  });

  it('generates valid otpauth URI', () => {
    const secret = generateTotpSecret();
    const uri = totpUri(secret, 'user@example.com');
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('Watchtower');
    expect(uri).toContain(secret);
    expect(uri).toContain('user%40example.com');
    expect(uri).toContain('algorithm=SHA1');
    expect(uri).toContain('digits=6');
    expect(uri).toContain('period=30');
  });
});
