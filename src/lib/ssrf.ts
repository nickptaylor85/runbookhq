// SSRF protection — validate URLs before server-side fetch

// Block private/internal IP ranges
const BLOCKED_RANGES = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/0\./,
  /^https?:\/\/169\.254\./,          // AWS/GCP metadata
  /^https?:\/\/100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // CGNAT 100.64/10
  /^https?:\/\/10\./,                // RFC1918
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[01])\./,  // RFC1918
  /^https?:\/\/192\.168\./,          // RFC1918
  /^https?:\/\/192\.0\.2\./,        // TEST-NET-1
  /^https?:\/\/198\.51\.100\./,     // TEST-NET-2
  /^https?:\/\/203\.0\.113\./,      // TEST-NET-3
  /^https?:\/\/\[?::1\]?/,           // IPv6 loopback
  /^https?:\/\/\[?fe80:/i,            // IPv6 link-local
  /^https?:\/\/\[?fc[0-9a-f]{2}:/i,  // IPv6 ULA fc00::/7
  /^https?:\/\/\[?fd[0-9a-f]{2}:/i,  // IPv6 ULA fd00::/8
  /^https?:\/\/[^/]*\.internal/i,    // internal domains
  /^https?:\/\/[^/]*\.local/i,
  /^https?:\/\/metadata\./i,
  /^file:\/\//i,
  /^ftp:\/\//i,
  /^gopher:\/\//i,
];

// Known-good domains for each tool type (allowlist)
const ALLOWED_DOMAIN_PATTERNS: Record<string, RegExp[]> = {
  crowdstrike: [/\.crowdstrike\.com$/],
  defender: [/\.microsoft\.com$/, /\.microsoftonline\.com$/],
  sentinelone: [/\.sentinelone\.net$/],
  carbonblack: [/\.conferdeploy\.net$/, /\.carbonblack\.com$/],
  splunk: [], // self-hosted — validate not private IP
  sentinel: [/\.azure\.com$/, /\.microsoft\.com$/],
  qradar: [], // self-hosted
  elastic: [/\.elastic\.co$/, /\.cloud\.es\.io$/],
  darktrace: [], // self-hosted
  taegis: [/\.secureworks\.com$/, /\.taegis\.secureworks\.com$/],
  tenable: [/\.tenable\.com$/],
  nessus: [], // self-hosted
  qualys: [/\.qualys\.com$/],
  wiz: [/\.app\.wiz\.io$/],
  proofpoint: [/\.proofpoint\.com$/],
  mimecast: [/\.mimecast\.com$/],
  zscaler: [/\.zscaler\.net$/, /\.zscaler\.com$/],
  okta: [/\.okta\.com$/, /\.oktapreview\.com$/],
};

export function validateIntegrationUrl(url: string, toolId?: string): { ok: boolean; error?: string } {
  if (!url || typeof url !== 'string') return { ok: false, error: 'URL required' };
  
  // Must be http or https
  if (!url.match(/^https?:\/\//i)) {
    return { ok: false, error: 'URL must use http or https protocol' };
  }

  // Block private/internal ranges
  for (const pattern of BLOCKED_RANGES) {
    if (pattern.test(url)) {
      return { ok: false, error: 'URL points to a blocked private/internal address' };
    }
  }

  // If tool has allowlist, enforce it
  if (toolId && ALLOWED_DOMAIN_PATTERNS[toolId]?.length > 0) {
    try {
      const hostname = new URL(url).hostname;
      const allowed = ALLOWED_DOMAIN_PATTERNS[toolId].some(p => p.test(hostname));
      if (!allowed) {
        return { ok: false, error: `URL domain not in allowlist for ${toolId}` };
      }
    } catch {
      return { ok: false, error: 'Invalid URL format' };
    }
  }

  return { ok: true };
}

// Validate all credential URL fields before use
export function validateCredentials(toolId: string, creds: Record<string, string>): { ok: boolean; error?: string } {
  const urlFields = ['host', 'base_url', 'platform', 'domain', 'api_endpoint', 'cloud'];
  for (const field of urlFields) {
    if (creds[field]) {
      const result = validateIntegrationUrl(creds[field], toolId);
      if (!result.ok) return { ok: false, error: `${field}: ${result.error}` };
    }
  }
  return { ok: true };
}
