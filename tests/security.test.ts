import { describe, it, expect } from 'vitest';
import { validateIntegrationUrl, validateCredentials } from '@/lib/ssrf';
import { sanitiseTenantId, sanitiseKeySegment } from '@/lib/redis';
import { meetsRequirement } from '@/lib/plans';

// ═══ SSRF Protection ══════════════════════════════════════════════════════════

describe('validateIntegrationUrl', () => {
  // Should block
  it('blocks localhost', () => {
    expect(validateIntegrationUrl('http://localhost/api').ok).toBe(false);
    expect(validateIntegrationUrl('https://localhost:8080/api').ok).toBe(false);
  });

  it('blocks loopback IPs', () => {
    expect(validateIntegrationUrl('http://127.0.0.1/api').ok).toBe(false);
    expect(validateIntegrationUrl('http://127.0.0.255/api').ok).toBe(false);
  });

  it('blocks RFC1918 private ranges', () => {
    expect(validateIntegrationUrl('http://10.0.0.1/api').ok).toBe(false);
    expect(validateIntegrationUrl('http://172.16.0.1/api').ok).toBe(false);
    expect(validateIntegrationUrl('http://172.31.255.255/api').ok).toBe(false);
    expect(validateIntegrationUrl('http://192.168.1.1/api').ok).toBe(false);
  });

  it('blocks AWS/GCP metadata endpoint', () => {
    expect(validateIntegrationUrl('http://169.254.169.254/latest/meta-data').ok).toBe(false);
    expect(validateIntegrationUrl('http://metadata.google.internal/computeMetadata').ok).toBe(false);
  });

  it('blocks CGNAT range (100.64/10)', () => {
    expect(validateIntegrationUrl('http://100.64.0.1/api').ok).toBe(false);
    expect(validateIntegrationUrl('http://100.127.255.255/api').ok).toBe(false);
  });

  it('blocks IPv6 loopback and link-local', () => {
    expect(validateIntegrationUrl('http://[::1]/api').ok).toBe(false);
    expect(validateIntegrationUrl('http://[fe80::1]/api').ok).toBe(false);
  });

  it('blocks file:// and gopher://', () => {
    expect(validateIntegrationUrl('file:///etc/passwd').ok).toBe(false);
    expect(validateIntegrationUrl('gopher://evil.com').ok).toBe(false);
    expect(validateIntegrationUrl('ftp://files.local/data').ok).toBe(false);
  });

  it('blocks .internal and .local domains', () => {
    expect(validateIntegrationUrl('http://api.internal/v1').ok).toBe(false);
    expect(validateIntegrationUrl('http://db.local/query').ok).toBe(false);
  });

  // Should allow
  it('allows legitimate public URLs', () => {
    expect(validateIntegrationUrl('https://api.crowdstrike.com/detects/queries/detects/v1').ok).toBe(true);
    expect(validateIntegrationUrl('https://cloud.tenable.com/scans').ok).toBe(true);
    expect(validateIntegrationUrl('https://api.eu.sumologic.com/api/v1').ok).toBe(true);
  });

  it('requires URL', () => {
    expect(validateIntegrationUrl('').ok).toBe(false);
    expect(validateIntegrationUrl('not-a-url').ok).toBe(false);
  });

  // Tool-specific allowlists
  it('enforces CrowdStrike domain allowlist', () => {
    expect(validateIntegrationUrl('https://api.crowdstrike.com/detects', 'crowdstrike').ok).toBe(true);
    expect(validateIntegrationUrl('https://evil.com/crowdstrike', 'crowdstrike').ok).toBe(false);
  });

  it('enforces Tenable domain allowlist', () => {
    expect(validateIntegrationUrl('https://cloud.tenable.com/scans', 'tenable').ok).toBe(true);
    expect(validateIntegrationUrl('https://fake-tenable.com/scans', 'tenable').ok).toBe(false);
  });

  it('allows self-hosted tools without domain restriction', () => {
    expect(validateIntegrationUrl('https://my-splunk.company.com:8089/api', 'splunk').ok).toBe(true);
    expect(validateIntegrationUrl('https://qradar.corp.net/api', 'qradar').ok).toBe(true);
  });
});

describe('validateCredentials', () => {
  it('validates all URL fields in credentials', () => {
    const result = validateCredentials('crowdstrike', {
      host: 'https://api.crowdstrike.com',
      api_key: 'secret',
    });
    expect(result.ok).toBe(true);
  });

  it('rejects credentials with SSRF URL', () => {
    const result = validateCredentials('crowdstrike', {
      host: 'http://169.254.169.254',
      api_key: 'secret',
    });
    expect(result.ok).toBe(false);
  });
});

// ═══ Tenant ID Sanitisation ══════════════════════════════════════════════════

describe('sanitiseTenantId', () => {
  it('passes clean tenant IDs through', () => {
    expect(sanitiseTenantId('client-acme')).toEqual('client-acme');
    expect(sanitiseTenantId('tenant_123')).toEqual('tenant_123');
  });

  it('strips injection characters', () => {
    expect(sanitiseTenantId('tenant:../../etc/passwd')).toEqual('tenantetcpasswd');
    expect(sanitiseTenantId('tenant\n\rinjection')).toEqual('tenantinjection');
    expect(sanitiseTenantId('tenant;DROP TABLE users')).toEqual('tenantDROPTABLEusers');
  });

  it('returns global for null/empty', () => {
    expect(sanitiseTenantId(null)).toEqual('global');
    expect(sanitiseTenantId('')).toEqual('global');
  });

  it('truncates to 64 chars', () => {
    const long = 'a'.repeat(100);
    expect(sanitiseTenantId(long).length).toEqual(64);
  });
});

describe('sanitiseKeySegment', () => {
  it('strips non-alphanumeric except hyphens/underscores', () => {
    expect(sanitiseKeySegment('alert:123')).toEqual('alert123');
    expect(sanitiseKeySegment('user@evil.com')).toEqual('userevilcom');
  });

  it('returns unknown for null/undefined', () => {
    expect(sanitiseKeySegment(null)).toEqual('unknown');
    expect(sanitiseKeySegment(undefined)).toEqual('unknown');
  });

  it('truncates to 128 chars', () => {
    const long = 'x'.repeat(200);
    expect(sanitiseKeySegment(long).length).toEqual(128);
  });
});

// ═══ Plan Tier Checks ════════════════════════════════════════════════════════

describe('meetsRequirement', () => {
  it('community meets community', () => {
    expect(meetsRequirement('community', 'community')).toBe(true);
  });

  it('community does not meet team', () => {
    expect(meetsRequirement('community', 'team')).toBe(false);
  });

  it('mssp meets all tiers', () => {
    expect(meetsRequirement('mssp', 'community')).toBe(true);
    expect(meetsRequirement('mssp', 'team')).toBe(true);
    expect(meetsRequirement('mssp', 'business')).toBe(true);
    expect(meetsRequirement('mssp', 'mssp')).toBe(true);
  });

  it('business meets team but not mssp', () => {
    expect(meetsRequirement('business', 'team')).toBe(true);
    expect(meetsRequirement('business', 'mssp')).toBe(false);
  });

  it('handles unknown tiers gracefully (defaults to 0)', () => {
    expect(meetsRequirement('unknown', 'community')).toBe(true);
    expect(meetsRequirement('unknown', 'team')).toBe(false);
  });
});
