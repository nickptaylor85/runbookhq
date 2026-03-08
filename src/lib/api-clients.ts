// ═══ API Clients for Defender, Taegis, Tenable, Zscaler ═══

// ─── Microsoft Defender (MDE + XDR) ───
export async function getDefenderToken(): Promise<string | null> {
  const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = process.env;
  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) return null;
  const res = await fetch(`https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AZURE_CLIENT_ID,
      client_secret: AZURE_CLIENT_SECRET,
      scope: 'https://api.security.microsoft.com/.default',
    }),
  });
  const data = await res.json();
  return data.access_token || null;
}

export async function defenderAPI(path: string, token: string) {
  const res = await fetch(`https://api.security.microsoft.com/api${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return res.json();
}

// MDE-specific (uses different scope)
export async function getMDEToken(): Promise<string | null> {
  const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = process.env;
  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) return null;
  const res = await fetch(`https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AZURE_CLIENT_ID,
      client_secret: AZURE_CLIENT_SECRET,
      scope: 'https://api.securitycenter.microsoft.com/.default',
    }),
  });
  const data = await res.json();
  return data.access_token || null;
}

export async function mdeAPI(path: string, token: string) {
  const res = await fetch(`https://api.securitycenter.microsoft.com/api${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return res.json();
}

// ─── Secureworks Taegis XDR ───
export async function getTaegisToken(): Promise<string | null> {
  const { TAEGIS_CLIENT_ID, TAEGIS_CLIENT_SECRET, TAEGIS_REGION } = process.env;
  if (!TAEGIS_CLIENT_ID || !TAEGIS_CLIENT_SECRET) return null;
  const region = TAEGIS_REGION || 'us';
  const authUrl = region === 'eu'
    ? 'https://api.ctpx.secureworks.com/auth/api/v2/auth/token'
    : 'https://api.ctpx.secureworks.com/auth/api/v2/auth/token';
  const res = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credentials', client_id: TAEGIS_CLIENT_ID, client_secret: TAEGIS_CLIENT_SECRET }),
  });
  const data = await res.json();
  return data.access_token || null;
}

export async function taegisGraphQL(query: string, variables: any, token: string) {
  const region = process.env.TAEGIS_REGION || 'us';
  const url = region === 'eu'
    ? 'https://api.ctpx.secureworks.com/graphql'
    : 'https://api.ctpx.secureworks.com/graphql';
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// ─── Tenable.io ───
export function tenableHeaders() {
  const { TENABLE_ACCESS_KEY, TENABLE_SECRET_KEY } = process.env;
  if (!TENABLE_ACCESS_KEY || !TENABLE_SECRET_KEY) return null;
  return {
    'X-ApiKeys': `accessKey=${TENABLE_ACCESS_KEY};secretKey=${TENABLE_SECRET_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

export async function tenableAPI(path: string) {
  const headers = tenableHeaders();
  if (!headers) return null;
  const res = await fetch(`https://cloud.tenable.com${path}`, { headers });
  return res.json();
}

// ─── Zscaler ZIA ───
export async function getZIASession(): Promise<string | null> {
  const { ZIA_BASE_URL, ZIA_API_KEY, ZIA_USERNAME, ZIA_PASSWORD } = process.env;
  if (!ZIA_BASE_URL || !ZIA_API_KEY || !ZIA_USERNAME || !ZIA_PASSWORD) return null;
  
  // ZIA requires obfuscated API key based on timestamp
  const now = Date.now().toString();
  const n = now.slice(-6);
  const r = String.fromCharCode(
    parseInt(n[0] + n[1], 10) + ZIA_API_KEY.charCodeAt(parseInt(n[0] + n[1], 10) % ZIA_API_KEY.length),
    parseInt(n[2] + n[3], 10) + ZIA_API_KEY.charCodeAt(parseInt(n[2] + n[3], 10) % ZIA_API_KEY.length),
    parseInt(n[4] + n[5], 10) + ZIA_API_KEY.charCodeAt(parseInt(n[4] + n[5], 10) % ZIA_API_KEY.length),
  );
  
  const res = await fetch(`${ZIA_BASE_URL}/api/v1/authenticatedSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: r, username: ZIA_USERNAME, password: ZIA_PASSWORD, timestamp: now }),
  });
  const data = await res.json();
  return data.authType ? 'authenticated' : null;
}

export async function ziaAPI(path: string) {
  const { ZIA_BASE_URL } = process.env;
  if (!ZIA_BASE_URL) return null;
  const res = await fetch(`${ZIA_BASE_URL}/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

// ─── Zscaler ZPA ───
export async function getZPAToken(): Promise<string | null> {
  const { ZPA_CLIENT_ID, ZPA_CLIENT_SECRET, ZPA_CUSTOMER_ID } = process.env;
  if (!ZPA_CLIENT_ID || !ZPA_CLIENT_SECRET || !ZPA_CUSTOMER_ID) return null;
  const res = await fetch('https://config.private.zscaler.com/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: ZPA_CLIENT_ID, client_secret: ZPA_CLIENT_SECRET }),
  });
  const data = await res.json();
  return data.access_token || null;
}

export async function zpaAPI(path: string, token: string, customerId: string) {
  const res = await fetch(`https://config.private.zscaler.com/mgmtconfig/v1/admin/customers/${customerId}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return res.json();
}

// ─── Connection status checker ───
export function getConfiguredTools(): { defender: boolean; taegis: boolean; tenable: boolean; zia: boolean; zpa: boolean } {
  return {
    defender: !!(process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET),
    taegis: !!(process.env.TAEGIS_CLIENT_ID && process.env.TAEGIS_CLIENT_SECRET),
    tenable: !!(process.env.TENABLE_ACCESS_KEY && process.env.TENABLE_SECRET_KEY),
    zia: !!(process.env.ZIA_BASE_URL && process.env.ZIA_API_KEY),
    zpa: !!(process.env.ZPA_CLIENT_ID && process.env.ZPA_CLIENT_SECRET),
  };
}
