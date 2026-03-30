import { createHash } from 'crypto';

/**
 * Checks if a password appears in known data breaches via HIBP k-anonymity API.
 * Only sends the first 5 chars of the SHA1 hash — the full password never leaves the server.
 * @returns true if the password has been breached (should be rejected)
 */
export async function isPasswordBreached(password: string): Promise<boolean> {
  try {
    const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'Watchtower-SOC-Platform' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false; // Fail open — don't block if HIBP is down
    const text = await res.text();
    const lines = text.split('\r\n');
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix === suffix && parseInt(countStr, 10) > 0) {
        return true; // Found in breach database
      }
    }
    return false;
  } catch {
    return false; // Fail open — HIBP timeout/error should not block login
  }
}
