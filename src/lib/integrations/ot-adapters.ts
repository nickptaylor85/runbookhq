// OT asset fetchers — separate from the alert-focused IntegrationAdapter interface
// These return OTAsset[] from each OT platform's asset inventory API.

export interface OTAsset {
  id: string;
  name: string;
  type: string;
  vendor: string;
  model: string;
  firmware: string;
  zone: 'L0' | 'L1' | 'L2' | 'L3' | 'L35' | 'L4';
  ip: string;
  mac?: string;
  status: 'online' | 'offline' | 'degraded' | 'compromised' | 'unknown';
  protocols: string[];
  cveCount: number;
  riskScore: number;
  lastSeen: string;
  source: string;
  tags: string[];
  raw?: unknown;
}

// Purdue zone auto-detection from network segment string
function detectZone(segment: string | undefined, deviceType: string): OTAsset['zone'] {
  if (!segment) {
    const t = (deviceType || '').toLowerCase();
    if (['plc', 'rtu', 'dcs', 'controller'].some(k => t.includes(k))) return 'L1';
    if (['hmi', 'scada', 'historian', 'engineering'].some(k => t.includes(k))) return 'L2';
    if (['mes', 'batch', 'scheduling'].some(k => t.includes(k))) return 'L3';
    if (['sensor', 'actuator', 'transmitter', 'meter', 'valve'].some(k => t.includes(k))) return 'L0';
    return 'L2';
  }
  const s = segment.toLowerCase();
  if (s.includes('dmz') || s.includes('3.5') || s.includes('jump')) return 'L35';
  if (s.includes('field') || s.includes('l0') || s.includes('level0')) return 'L0';
  if (s.includes('controller') || s.includes('l1') || s.includes('level1') || s.includes('plc')) return 'L1';
  if (s.includes('supervisory') || s.includes('l2') || s.includes('scada') || s.includes('hmi')) return 'L2';
  if (s.includes('operation') || s.includes('l3') || s.includes('mes')) return 'L3';
  if (s.includes('enterprise') || s.includes('l4') || s.includes('corp') || s.includes('erp')) return 'L4';
  return 'L2';
}

function normaliseStatus(raw: string | undefined): OTAsset['status'] {
  const s = (raw || '').toLowerCase();
  if (s.includes('comprom') || s.includes('breach') || s.includes('attack')) return 'compromised';
  if (s.includes('offline') || s.includes('unreachable') || s.includes('down')) return 'offline';
  if (s.includes('degrad') || s.includes('warn') || s.includes('partial')) return 'degraded';
  if (s.includes('online') || s.includes('active') || s.includes('up') || s === 'ok') return 'online';
  return 'unknown';
}

function riskScore(cveCount: number, zone: OTAsset['zone'], status: OTAsset['status']): number {
  let score = 0;
  score += Math.min(cveCount * 15, 40);
  if (zone === 'L1' || zone === 'L0') score += 20;
  else if (zone === 'L2') score += 15;
  else if (zone === 'L35') score += 10;
  if (status === 'compromised') score += 40;
  else if (status === 'degraded') score += 15;
  else if (status === 'offline') score += 10;
  return Math.min(score, 100);
}

// ─── Claroty CTD ───────────────────────────────────────────────────────────────
export async function fetchClarotyAssets(creds: Record<string, string>): Promise<OTAsset[]> {
  const tr = await fetch(`${creds.host}/api/v1/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: { email: creds.username, password: creds.password } }),
    signal: AbortSignal.timeout(10000),
  });
  if (!tr.ok) throw new Error(`Claroty auth HTTP ${tr.status}`);
  const { access_token } = await tr.json() as { access_token: string };

  const r = await fetch(`${creds.host}/api/v1/assets?limit=500`, {
    headers: { Authorization: `Bearer ${access_token}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Claroty assets HTTP ${r.status}`);
  const d = await r.json() as { objects?: any[] };

  return (d.objects || []).map((a: any): OTAsset => {
    const cveCnt = (a.vulnerabilities?.length || a.cve_count || 0);
    const zone = detectZone(a.network_id || a.segment, a.type || '');
    const status = normaliseStatus(a.status);
    return {
      id: `claroty_${a.id}`,
      name: a.name || a.ip || 'Unknown Asset',
      type: a.type || 'Unknown',
      vendor: a.vendor || 'Unknown',
      model: a.model || '',
      firmware: a.firmware_version || a.firmware || '',
      zone,
      ip: a.ip || a.ip_v4 || '',
      mac: a.mac,
      status,
      protocols: Array.isArray(a.protocols) ? a.protocols : (a.protocol ? [a.protocol] : []),
      cveCount: cveCnt,
      riskScore: riskScore(cveCnt, zone, status),
      lastSeen: a.last_seen || new Date().toISOString(),
      source: 'Claroty',
      tags: ['claroty', 'ot', zone.toLowerCase()],
      raw: a,
    };
  });
}

// ─── Nozomi Networks Vantage ─────────────────────────────────────────────────
export async function fetchNozomiAssets(creds: Record<string, string>): Promise<OTAsset[]> {
  const r = await fetch(`${creds.host}/api/v1/nodes?limit=500`, {
    headers: { 'X-API-Key': creds.api_key },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Nozomi nodes HTTP ${r.status}`);
  const d = await r.json() as { result?: any[]; items?: any[] };

  return (d.result || d.items || []).map((a: any): OTAsset => {
    const protocols = Array.isArray(a.protocols) ? a.protocols
      : (a.protocol_list || '').split(',').map((p: string) => p.trim()).filter(Boolean);
    const cveCnt = a.cve_count || a.vulnerabilities_count || 0;
    const zone = detectZone(a.segment || a.zone, a.type || a.os_type || '');
    const status = normaliseStatus(a.status || (a.is_online ? 'online' : 'offline'));
    return {
      id: `nozomi_${a.id}`,
      name: a.label || a.name || a.ip || 'Unknown',
      type: a.type || a.category || 'Unknown',
      vendor: a.vendor || a.manufacturer || 'Unknown',
      model: a.product_name || a.model || '',
      firmware: a.firmware_version || a.os_version || '',
      zone,
      ip: a.ip || a.ip_address || '',
      mac: a.mac_address,
      status,
      protocols,
      cveCount: cveCnt,
      riskScore: riskScore(cveCnt, zone, status),
      lastSeen: a.last_seen || new Date().toISOString(),
      source: 'Nozomi',
      tags: ['nozomi', 'ot', zone.toLowerCase()],
      raw: a,
    };
  });
}

// ─── Dragos Platform ─────────────────────────────────────────────────────────
export async function fetchDragosAssets(creds: Record<string, string>): Promise<OTAsset[]> {
  const auth = `Token ${Buffer.from(`${creds.api_key}:${creds.api_secret}`).toString('base64')}`;
  const r = await fetch(`${creds.host}/api/v1/assets?page_size=500`, {
    headers: { Authorization: auth },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Dragos assets HTTP ${r.status}`);
  const d = await r.json() as { assets?: any[]; results?: any[] };

  return (d.assets || d.results || []).map((a: any): OTAsset => {
    const cveCnt = a.vulnerability_count || a.cve_count || 0;
    const zone = detectZone(a.network_segment, a.asset_type || a.type || '');
    const status = normaliseStatus(a.state || a.status);
    return {
      id: `dragos_${a.id}`,
      name: a.hostname || a.name || a.ip || 'Unknown',
      type: a.asset_type || a.type || 'Unknown',
      vendor: a.vendor || 'Unknown',
      model: a.model || a.product_name || '',
      firmware: a.firmware_version || '',
      zone,
      ip: a.ip || a.ip_address || '',
      mac: a.mac_address,
      status,
      protocols: a.protocols || [],
      cveCount: cveCnt,
      riskScore: riskScore(cveCnt, zone, status),
      lastSeen: a.last_seen || new Date().toISOString(),
      source: 'Dragos',
      tags: ['dragos', 'ics', 'ot', zone.toLowerCase()],
      raw: a,
    };
  });
}

// ─── Armis ────────────────────────────────────────────────────────────────────
export async function fetchArmisAssets(creds: Record<string, string>): Promise<OTAsset[]> {
  // Armis uses an AQL-based search API
  const authR = await fetch(`${creds.host}/api/v1/access_token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret_key: creds.secret_key || creds.api_key }),
    signal: AbortSignal.timeout(10000),
  });
  if (!authR.ok) throw new Error(`Armis auth HTTP ${authR.status}`);
  const { data: { access_token } } = await authR.json() as { data: { access_token: string } };

  const r = await fetch(`${creds.host}/api/v1/search/?aql=in:devices%20type:OT%20OR%20type:ICS&length=500`, {
    headers: { Authorization: access_token },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Armis search HTTP ${r.status}`);
  const d = await r.json() as { data?: { results?: any[] } };

  return (d.data?.results || []).map((a: any): OTAsset => {
    const cveCnt = a.vulnerabilities?.length || 0;
    const zone = detectZone(a.networkSegment, a.type || '');
    const status = normaliseStatus(a.operationalStatus || a.connectionStatus);
    return {
      id: `armis_${a.id}`,
      name: a.name || a.displayName || a.ipAddress || 'Unknown',
      type: a.type || a.category || 'Unknown',
      vendor: a.manufacturer || a.vendor || 'Unknown',
      model: a.model || '',
      firmware: a.firmwareVersion || '',
      zone,
      ip: a.ipAddress || '',
      mac: a.macAddress,
      status,
      protocols: Array.isArray(a.protocols) ? a.protocols : [],
      cveCount: cveCnt,
      riskScore: riskScore(cveCnt, zone, status),
      lastSeen: a.lastSeen || new Date().toISOString(),
      source: 'Armis',
      tags: ['armis', 'ot', zone.toLowerCase()],
      raw: a,
    };
  });
}

export const OT_ASSET_FETCHERS: Record<string, (creds: Record<string, string>) => Promise<OTAsset[]>> = {
  claroty: fetchClarotyAssets,
  nozomi: fetchNozomiAssets,
  dragos: fetchDragosAssets,
  armis: fetchArmisAssets,
};

export const OT_TOOL_IDS = ['claroty', 'nozomi', 'dragos', 'armis'];
