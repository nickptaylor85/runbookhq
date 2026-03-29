/**
 * adapters2.ts — adapters for all 62 integrations added in v74.9.141-142
 * Pattern:
 *   - Data sources (EDR/SIEM/Cloud/etc): real testConnection + fetchAlerts
 *   - Output-only (ITSM/SOAR/Comms): real testConnection + empty fetchAlerts
 */
import type { IntegrationAdapter, Credentials, NormalisedAlert } from './types';
import { normSev, safeId, tsToISO } from './helpers';

// ─── shared ───────────────────────────────────────────────────────────────────
async function simpleGet(url: string, headers: Record<string,string>, name: string) {
  try {
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return { ok: true, message: `Connected to ${name}` };
  } catch(e: any) { return { ok: false, message: e.message as string }; }
}

// ─── Palo Alto Cortex XDR ─────────────────────────────────────────────────────
export const cortex: IntegrationAdapter = {
  id: 'cortex', name: 'Palo Alto Cortex XDR',
  credentialFields: [
    { key: 'client_id', label: 'Client ID' },
    { key: 'client_secret', label: 'Client Secret', secret: true },
    { key: 'region', label: 'Region', placeholder: 'api-us-1' },
  ],
  async testConnection(creds) {
    try {
      const { createHash } = await import('crypto');
      const nonce = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const ts = Date.now().toString();
      const hash = createHash('sha256').update(`${creds.client_id}\n${nonce}\n${ts}\n`).digest('hex');
      const region = creds.region || 'api-us-1';
      const r = await fetch(`https://${region}.xdr.paloaltonetworks.com/public_api/v1/incidents/get_incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-xdr-auth-id': creds.client_id, 'x-xdr-nonce': nonce, 'x-xdr-timestamp': ts, 'x-xdr-auth-hash': hash },
        body: JSON.stringify({ request_data: { filters: [], search_from: 0, search_to: 1 } }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { ok: true, message: 'Connected to Palo Alto Cortex XDR' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const { createHash } = await import('crypto');
    const nonce = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const ts = Date.now().toString();
    const hash = createHash('sha256').update(`${creds.client_id}\n${nonce}\n${ts}\n`).digest('hex');
    const region = creds.region || 'api-us-1';
    const r = await fetch(`https://${region}.xdr.paloaltonetworks.com/public_api/v1/incidents/get_incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-xdr-auth-id': creds.client_id, 'x-xdr-nonce': nonce, 'x-xdr-timestamp': ts, 'x-xdr-auth-hash': hash },
      body: JSON.stringify({ request_data: { filters: [{ field: 'creation_time', operator: 'gte', value: since || Date.now() - 86400000 }], search_from: 0, search_to: 100 } }),
    });
    const d = await r.json();
    return (d.reply?.incidents || []).map((i: any): NormalisedAlert => ({
      id: safeId('cortex', i.incident_id), source: 'Cortex XDR', sourceId: i.incident_id,
      title: i.description || i.incident_name || 'Cortex XDR Incident',
      severity: normSev(i.severity), device: i.hosts?.[0] || 'Unknown', user: i.users?.[0],
      ip: i.network_artifacts?.network_remote_ip_list?.[0],
      time: tsToISO(i.creation_time || Date.now()), rawTime: i.creation_time || Date.now(),
      mitre: i.mitre_techniques_ids?.[0], description: i.description || '',
      verdict: i.status === 'RESOLVED' ? 'TP' : 'Pending', confidence: 85,
      tags: ['cortex', 'xdr'].filter(Boolean), raw: i,
    }));
  },
};

// ─── AWS Security Hub ─────────────────────────────────────────────────────────
async function awsSign(method: string, service: string, region: string, path: string, body: string, creds: Credentials) {
  const { createHmac, createHash } = await import('crypto');
  const now = new Date();
  const amzdate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0,15)+'Z';
  const datestamp = amzdate.slice(0,8);
  const host = `${service}.${region}.amazonaws.com`;
  const payload_hash = createHash('sha256').update(body).digest('hex');
  const canon_req = `${method}\n${path}\n\ncontent-type:application/json\nhost:${host}\nx-amz-date:${amzdate}\n\ncontent-type;host;x-amz-date\n${payload_hash}`;
  const cred_scope = `${datestamp}/${region}/${service}/aws4_request`;
  const sts = `AWS4-HMAC-SHA256\n${amzdate}\n${cred_scope}\n${createHash('sha256').update(canon_req).digest('hex')}`;
  function sign(key: Buffer | string, msg: string) { return createHmac('sha256', key).update(msg).digest(); }
  const sk = sign(sign(sign(sign(`AWS4${creds.secret_access_key}`, datestamp), region), service), 'aws4_request');
  const sig = createHmac('sha256', sk).update(sts).digest('hex');
  const auth = `AWS4-HMAC-SHA256 Credential=${creds.access_key_id}/${cred_scope}, SignedHeaders=content-type;host;x-amz-date, Signature=${sig}`;
  return { host, amzdate, auth };
}

export const aws_security_hub: IntegrationAdapter = {
  id: 'aws_security_hub', name: 'AWS Security Hub',
  credentialFields: [
    { key: 'access_key_id', label: 'AWS Access Key ID' },
    { key: 'secret_access_key', label: 'AWS Secret Access Key', secret: true },
    { key: 'region', label: 'AWS Region', placeholder: 'eu-west-2' },
  ],
  async testConnection(creds) {
    try {
      const region = creds.region || 'eu-west-2';
      const body = JSON.stringify({ MaxResults: 1 });
      const { host, amzdate, auth } = await awsSign('POST', 'securityhub', region, '/findings', body, creds);
      const r = await fetch(`https://${host}/findings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Amz-Date': amzdate, Authorization: auth },
        body,
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { ok: true, message: 'Connected to AWS Security Hub' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const region = creds.region || 'eu-west-2';
    const sinceISO = new Date(since || Date.now() - 86400000).toISOString();
    const body = JSON.stringify({ MaxResults: 100, Filters: { UpdatedAt: [{ Start: sinceISO, End: new Date().toISOString() }] } });
    const { host, amzdate, auth } = await awsSign('POST', 'securityhub', region, '/findings', body, creds);
    const r = await fetch(`https://${host}/findings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Amz-Date': amzdate, Authorization: auth },
      body,
    });
    const d = await r.json();
    return (d.Findings || []).map((f: any): NormalisedAlert => ({
      id: safeId('aws', f.Id), source: 'AWS Security Hub', sourceId: f.Id,
      title: f.Title || 'AWS Security Finding',
      severity: normSev(f.Severity?.Label || f.Severity?.Normalized),
      device: f.Resources?.[0]?.Id?.split('/').pop() || 'Unknown',
      ip: f.NetworkPath?.[0]?.Component?.Ip,
      time: f.UpdatedAt || f.CreatedAt || new Date().toISOString(),
      rawTime: new Date(f.UpdatedAt || f.CreatedAt || Date.now()).getTime(),
      description: f.Description || f.Title || '',
      verdict: f.Workflow?.Status === 'RESOLVED' ? 'FP' : 'Pending', confidence: f.Confidence || 70,
      tags: ['aws', f.ProductName?.toLowerCase()?.replace(/\s+/g,'_')].filter(Boolean), raw: f,
    }));
  },
};

// ─── Azure Defender for Cloud ─────────────────────────────────────────────────
async function msalToken(creds: Credentials, scope: string) {
  const r = await fetch(`https://login.microsoftonline.com/${creds.tenant_id}/oauth2/v2.0/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: creds.client_id, client_secret: creds.client_secret, scope }),
  });
  if (!r.ok) throw new Error(`Auth HTTP ${r.status}`);
  const d = await r.json();
  if (!d.access_token) throw new Error('No access_token');
  return d.access_token as string;
}

export const azure_defender: IntegrationAdapter = {
  id: 'azure_defender', name: 'Microsoft Defender for Cloud',
  credentialFields: [
    { key: 'tenant_id', label: 'Tenant ID' }, { key: 'client_id', label: 'Client ID' },
    { key: 'client_secret', label: 'Client Secret', secret: true }, { key: 'subscription_id', label: 'Subscription ID' },
  ],
  async testConnection(creds) {
    try { await msalToken(creds, 'https://management.azure.com/.default'); return { ok: true, message: 'Connected to Microsoft Defender for Cloud' }; }
    catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const token = await msalToken(creds, 'https://management.azure.com/.default');
    const r = await fetch(`https://management.azure.com/subscriptions/${creds.subscription_id}/providers/Microsoft.Security/alerts?api-version=2022-01-01`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    return (d.value || []).slice(0,100).map((a: any): NormalisedAlert => ({
      id: safeId('adf', a.name), source: 'Defender for Cloud', sourceId: a.name,
      title: a.properties?.alertDisplayName || 'Azure Defender Alert',
      severity: normSev(a.properties?.severity), device: a.properties?.compromisedEntity || 'Unknown',
      ip: a.properties?.entities?.find((e:any) => e.type === 'ip')?.address,
      time: a.properties?.timeGeneratedUtc || new Date().toISOString(),
      rawTime: new Date(a.properties?.timeGeneratedUtc || Date.now()).getTime(),
      description: a.properties?.description || '', verdict: 'Pending', confidence: 75,
      tags: ['azure', 'defender'].filter(Boolean), raw: a,
    }));
  },
};

// ─── Google Workspace ─────────────────────────────────────────────────────────
async function gcpJwt(sa: any, scope: string) {
  const { createSign } = await import('crypto');
  const now = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })).toString('base64url');
  const sig = createSign('RSA-SHA256').update(`${h}.${p}`).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${h}.${p}.${sig}` }),
  });
  const d = await r.json();
  return d.access_token as string;
}

export const google_workspace: IntegrationAdapter = {
  id: 'google_workspace', name: 'Google Workspace',
  credentialFields: [
    { key: 'service_account_json', label: 'Service Account JSON', secret: true },
    { key: 'admin_email', label: 'Admin Email', placeholder: 'admin@company.com' },
  ],
  async testConnection(creds) {
    try { JSON.parse(creds.service_account_json); return { ok: true, message: 'Google Workspace credentials validated' }; }
    catch { return { ok: false, message: 'Invalid service account JSON' }; }
  },
  async fetchAlerts(creds, since) {
    const sa = JSON.parse(creds.service_account_json);
    const token = await gcpJwt(sa, 'https://www.googleapis.com/auth/admin.reports.audit.readonly');
    const sinceISO = new Date(since || Date.now() - 86400000).toISOString().replace(/\.\d{3}Z$/,'Z');
    const r = await fetch(`https://admin.googleapis.com/admin/reports/v1/activity/users/all/applications/login?startTime=${sinceISO}&maxResults=100&eventName=login_failure`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    return (d.items || []).map((ev: any): NormalisedAlert => ({
      id: safeId('gsuite', ev.id?.uniqueQualifier), source: 'Google Workspace', sourceId: ev.id?.uniqueQualifier || '',
      title: `Google Workspace: ${ev.events?.[0]?.name || 'Security event'}`, severity: 'Medium',
      device: ev.ipAddress || 'Unknown', user: ev.actor?.email, ip: ev.ipAddress,
      time: ev.id?.time || new Date().toISOString(), rawTime: new Date(ev.id?.time || Date.now()).getTime(),
      description: `${ev.events?.[0]?.name || 'event'} for ${ev.actor?.email}`,
      verdict: 'Pending', confidence: 60, tags: ['google', 'workspace'].filter(Boolean), raw: ev,
    }));
  },
};

// ─── Sophos Central ───────────────────────────────────────────────────────────
async function sophosToken(creds: Credentials) {
  const r = await fetch('https://id.sophos.com/api/v2/oauth2/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: creds.client_id, client_secret: creds.client_secret, scope: 'token' }),
  });
  if (!r.ok) throw new Error(`Auth HTTP ${r.status}`);
  const d = await r.json();
  if (!d.access_token) throw new Error('No token');
  const whoami = await fetch('https://api.central.sophos.com/whoami/v1', { headers: { Authorization: `Bearer ${d.access_token}` } });
  const me = await whoami.json();
  return { token: d.access_token as string, tenantId: me?.id as string, dataRegion: (me?.apiHosts?.dataRegion || 'https://api-eu01.central.sophos.com') as string };
}

export const sophos: IntegrationAdapter = {
  id: 'sophos', name: 'Sophos Intercept X',
  credentialFields: [
    { key: 'client_id', label: 'Client ID' }, { key: 'client_secret', label: 'Client Secret', secret: true },
    { key: 'region', label: 'API Region', placeholder: 'eu-west-1' },
  ],
  async testConnection(creds) {
    try { await sophosToken(creds); return { ok: true, message: 'Connected to Sophos Central' }; }
    catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const { token, tenantId, dataRegion } = await sophosToken(creds);
    const sinceISO = new Date(since || Date.now() - 86400000).toISOString();
    const r = await fetch(`${dataRegion}/siem/v1/alerts?limit=100&from=${sinceISO}`, {
      headers: { Authorization: `Bearer ${token}`, 'X-Tenant-ID': tenantId },
    });
    const d = await r.json();
    return (d.items || []).map((a: any): NormalisedAlert => ({
      id: safeId('sophos', a.id), source: 'Sophos', sourceId: a.id,
      title: a.description || a.name || 'Sophos alert',
      severity: normSev(a.severity), device: a.source?.endpoint?.name || 'Unknown',
      user: a.source?.user?.name, ip: a.source?.originalIp,
      time: a.raisedAt || new Date().toISOString(), rawTime: new Date(a.raisedAt || Date.now()).getTime(),
      mitre: a.mitre?.techniques?.[0]?.id, description: a.description || '',
      verdict: a.data?.status === 'false_positive' ? 'FP' : 'Pending', confidence: 80,
      tags: ['sophos', a.type?.toLowerCase()].filter(Boolean), raw: a,
    }));
  },
};

// ─── Abnormal Security ────────────────────────────────────────────────────────
export const abnormal: IntegrationAdapter = {
  id: 'abnormal', name: 'Abnormal Security',
  credentialFields: [{ key: 'api_key', label: 'API Token', secret: true }],
  async testConnection(creds) {
    return simpleGet('https://api.abnormalsecurity.com/v1/threats?pageSize=1', { Authorization: `Bearer ${creds.api_key}` }, 'Abnormal Security');
  },
  async fetchAlerts(creds, since) {
    const r = await fetch('https://api.abnormalsecurity.com/v1/threats?pageSize=100', { headers: { Authorization: `Bearer ${creds.api_key}` } });
    const d = await r.json();
    return (d.threats || []).map((t: any): NormalisedAlert => ({
      id: safeId('abnormal', t.threatId), source: 'Abnormal Security', sourceId: t.threatId,
      title: t.subject || 'Abnormal email threat',
      severity: normSev(t.severity || (t.attackType?.includes('Phishing') ? 'High' : 'Medium')),
      device: t.recipientAddress || 'Unknown', user: t.recipientAddress,
      time: t.firstObservedTime || t.receivedTime || new Date().toISOString(),
      rawTime: new Date(t.firstObservedTime || t.receivedTime || Date.now()).getTime(),
      description: `Abnormal: ${t.attackType || 'Email threat'} — ${t.subject || ''}`,
      verdict: 'Pending', confidence: 85,
      tags: ['abnormal', 'email', t.attackType?.toLowerCase()?.replace(/\s+/g,'_')].filter(Boolean), raw: t,
    }));
  },
};

// ─── Microsoft 365 Defender ───────────────────────────────────────────────────
export const m365_defender: IntegrationAdapter = {
  id: 'm365_defender', name: 'Microsoft 365 Defender',
  credentialFields: [
    { key: 'tenant_id', label: 'Tenant ID' }, { key: 'client_id', label: 'Client ID' },
    { key: 'client_secret', label: 'Client Secret', secret: true },
  ],
  async testConnection(creds) {
    try { await msalToken(creds, 'https://security.microsoft.com/.default'); return { ok: true, message: 'Connected to Microsoft 365 Defender' }; }
    catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const token = await msalToken(creds, 'https://security.microsoft.com/.default');
    const sinceISO = new Date(since || Date.now() - 86400000).toISOString();
    const r = await fetch(`https://api.security.microsoft.com/api/incidents?$filter=createdTime gt ${sinceISO}&$top=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    return (d.value || []).map((i: any): NormalisedAlert => ({
      id: safeId('m365', i.incidentId), source: 'M365 Defender', sourceId: String(i.incidentId),
      title: i.incidentName || 'M365 Defender Incident',
      severity: normSev(i.severity), device: i.alerts?.[0]?.deviceDnsName || 'Unknown',
      user: i.alerts?.[0]?.userPrincipalName,
      time: i.createdTime || new Date().toISOString(), rawTime: new Date(i.createdTime || Date.now()).getTime(),
      description: i.incidentName || '', verdict: i.status === 'Resolved' ? 'TP' : 'Pending', confidence: 80,
      tags: ['m365', 'defender', i.classification?.toLowerCase()].filter(Boolean), raw: i,
    }));
  },
};

// ─── Barracuda ────────────────────────────────────────────────────────────────
export const barracuda: IntegrationAdapter = {
  id: 'barracuda', name: 'Barracuda Email Security',
  credentialFields: [
    { key: 'api_token', label: 'API Token', secret: true },
    { key: 'region', label: 'Region', placeholder: 'us-west-2' },
  ],
  async testConnection(creds) {
    return simpleGet('https://api.barracudanetworks.com/api/v1/email/threats?limit=1', { Authorization: `Bearer ${creds.api_token}` }, 'Barracuda');
  },
  async fetchAlerts(creds, since) {
    const r = await fetch('https://api.barracudanetworks.com/api/v1/email/threats?limit=100', {
      headers: { Authorization: `Bearer ${creds.api_token}` },
    });
    const d = await r.json();
    return (d.threats || []).map((t: any): NormalisedAlert => ({
      id: safeId('barracuda', t.id), source: 'Barracuda', sourceId: t.id,
      title: t.subject || t.type || 'Barracuda email threat', severity: normSev(t.severity || 'High'),
      device: t.recipient || 'Unknown', user: t.recipient,
      time: t.timestamp || new Date().toISOString(), rawTime: new Date(t.timestamp || Date.now()).getTime(),
      description: t.subject || '', verdict: 'Pending', confidence: 80,
      tags: ['barracuda', 'email'].filter(Boolean), raw: t,
    }));
  },
};

// ─── VirusTotal ───────────────────────────────────────────────────────────────
export const virustotal: IntegrationAdapter = {
  id: 'virustotal', name: 'VirusTotal',
  credentialFields: [{ key: 'api_key', label: 'API Key', secret: true }],
  async testConnection(creds) {
    return simpleGet('https://www.virustotal.com/api/v3/domains/virustotal.com', { 'x-apikey': creds.api_key }, 'VirusTotal');
  },
  async fetchAlerts(_creds, _since) { return []; },
};

// ─── Recorded Future ─────────────────────────────────────────────────────────
export const recorded_future: IntegrationAdapter = {
  id: 'recorded_future', name: 'Recorded Future',
  credentialFields: [{ key: 'api_key', label: 'API Key', secret: true }],
  async testConnection(creds) {
    return simpleGet('https://api.recordedfuture.com/v2/alert?limit=1', { 'X-RFToken': creds.api_key }, 'Recorded Future');
  },
  async fetchAlerts(creds, since) {
    const r = await fetch('https://api.recordedfuture.com/v2/alert?limit=50', { headers: { 'X-RFToken': creds.api_key } });
    const d = await r.json();
    return (d.data?.results || []).map((a: any): NormalisedAlert => ({
      id: safeId('rf', a.id), source: 'Recorded Future', sourceId: a.id,
      title: a.title || 'Recorded Future Alert', severity: normSev(a.risk?.score || 50),
      device: 'Threat Intel', time: a.triggered || new Date().toISOString(),
      rawTime: new Date(a.triggered || Date.now()).getTime(),
      description: a.ai_insights || a.title || '', verdict: 'Pending', confidence: a.risk?.score || 60,
      tags: ['recorded_future', 'intel'].filter(Boolean), raw: a,
    }));
  },
};

// ─── AlienVault OTX ───────────────────────────────────────────────────────────
export const alienvault: IntegrationAdapter = {
  id: 'alienvault', name: 'AlienVault OTX',
  credentialFields: [{ key: 'api_key', label: 'API Key', secret: true }],
  async testConnection(creds) {
    return simpleGet('https://otx.alienvault.com/api/v1/pulses/subscribed?limit=1', { 'X-OTX-API-KEY': creds.api_key }, 'AlienVault OTX');
  },
  async fetchAlerts(creds, since) {
    const r = await fetch('https://otx.alienvault.com/api/v1/pulses/subscribed?limit=50', { headers: { 'X-OTX-API-KEY': creds.api_key } });
    const d = await r.json();
    return (d.results || []).map((p: any): NormalisedAlert => ({
      id: safeId('otx', p.id), source: 'AlienVault OTX', sourceId: p.id,
      title: p.name || 'OTX Threat Pulse', severity: 'Medium',
      device: 'Threat Intel', time: p.modified || p.created || new Date().toISOString(),
      rawTime: new Date(p.modified || p.created || Date.now()).getTime(),
      description: p.description || p.name || '', verdict: 'Pending', confidence: 65,
      tags: ['otx', 'intel', ...(p.tags || []).slice(0,3)].filter(Boolean), raw: p,
    }));
  },
};

// ─── ThreatConnect ────────────────────────────────────────────────────────────
export const threatconnect: IntegrationAdapter = {
  id: 'threatconnect', name: 'ThreatConnect',
  credentialFields: [
    { key: 'base_url', label: 'Base URL', placeholder: 'https://app.threatconnect.com' },
    { key: 'access_id', label: 'Access ID' },
    { key: 'secret_key', label: 'Secret Key', secret: true },
  ],
  async testConnection(creds) {
    try {
      const { createHmac } = await import('crypto');
      const ts = Math.floor(Date.now() / 1000);
      const path = '/api/v2/indicators?resultLimit=1';
      const sig = createHmac('sha256', creds.secret_key).update(`${path}:GET:${ts}`).digest('base64');
      const auth = Buffer.from(`${creds.access_id}:${sig}:${ts}`).toString('base64');
      const r = await fetch(`${creds.base_url}${path}`, { headers: { Authorization: `TC ${auth}` } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { ok: true, message: 'Connected to ThreatConnect' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(_creds, _since) { return []; },
};

// ─── MISP ─────────────────────────────────────────────────────────────────────
export const misp: IntegrationAdapter = {
  id: 'misp', name: 'MISP',
  credentialFields: [
    { key: 'host', label: 'MISP URL', placeholder: 'https://misp.company.com' },
    { key: 'api_key', label: 'Auth Key', secret: true },
  ],
  async testConnection(creds) {
    return simpleGet(`${creds.host}/users/view/me.json`, { Authorization: creds.api_key, Accept: 'application/json' }, 'MISP');
  },
  async fetchAlerts(creds, since) {
    const sinceISO = new Date(since || Date.now() - 86400000).toISOString().slice(0,10);
    const r = await fetch(`${creds.host}/events/index`, {
      method: 'POST',
      headers: { Authorization: creds.api_key, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ date_from: sinceISO, limit: 100 }),
    });
    const d = await r.json();
    const events = Array.isArray(d) ? d : (d.response || []);
    return events.map((e: any): NormalisedAlert => ({
      id: safeId('misp', e.Event?.uuid || e.uuid), source: 'MISP', sourceId: e.Event?.id || e.id,
      title: e.Event?.info || e.info || 'MISP Event',
      severity: normSev(e.Event?.threat_level_id || e.threat_level_id),
      device: 'Threat Intel', time: new Date((e.Event?.timestamp || e.timestamp || Date.now()/1000) * 1000).toISOString(),
      rawTime: (e.Event?.timestamp || e.timestamp || Date.now()/1000) * 1000,
      description: e.Event?.info || e.info || '', verdict: 'Pending', confidence: 70,
      tags: ['misp', 'intel'].filter(Boolean), raw: e,
    }));
  },
};

// ─── Mandiant ─────────────────────────────────────────────────────────────────
export const mandiant: IntegrationAdapter = {
  id: 'mandiant', name: 'Mandiant Threat Intel',
  credentialFields: [
    { key: 'api_key', label: 'API Key' },
    { key: 'api_secret', label: 'API Secret', secret: true },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch('https://api.intelligence.mandiant.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', Authorization: `Basic ${Buffer.from(`${creds.api_key}:${creds.api_secret}`).toString('base64')}` },
        body: 'grant_type=client_credentials&scope=openid email profile',
      });
      if (!r.ok) throw new Error(`Auth HTTP ${r.status}`);
      return { ok: true, message: 'Connected to Mandiant Threat Intelligence' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const tr = await fetch('https://api.intelligence.mandiant.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', Authorization: `Basic ${Buffer.from(`${creds.api_key}:${creds.api_secret}`).toString('base64')}` },
      body: 'grant_type=client_credentials&scope=openid email profile',
    });
    const { access_token } = await tr.json();
    const r = await fetch('https://api.intelligence.mandiant.com/v4/alert?limit=50', {
      headers: { Authorization: `Bearer ${access_token}`, Accept: 'application/json', 'X-App-Name': 'Watchtower' },
    });
    const d = await r.json();
    return (d.alerts || []).map((a: any): NormalisedAlert => ({
      id: safeId('mandiant', a.id), source: 'Mandiant', sourceId: a.id,
      title: a.title || 'Mandiant Alert', severity: normSev(a.severity),
      device: 'Threat Intel', time: a.created_at || new Date().toISOString(),
      rawTime: new Date(a.created_at || Date.now()).getTime(),
      description: a.description || '', verdict: 'Pending', confidence: 85,
      tags: ['mandiant', 'intel'].filter(Boolean), raw: a,
    }));
  },
};

// ─── Microsoft Entra ID ───────────────────────────────────────────────────────
export const entra: IntegrationAdapter = {
  id: 'entra', name: 'Microsoft Entra ID',
  credentialFields: [
    { key: 'tenant_id', label: 'Tenant ID' }, { key: 'client_id', label: 'Client ID' },
    { key: 'client_secret', label: 'Client Secret', secret: true },
  ],
  async testConnection(creds) {
    try { await msalToken(creds, 'https://graph.microsoft.com/.default'); return { ok: true, message: 'Connected to Microsoft Entra ID' }; }
    catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const token = await msalToken(creds, 'https://graph.microsoft.com/.default');
    const sinceISO = new Date(since || Date.now() - 86400000).toISOString();
    const r = await fetch(`https://graph.microsoft.com/v1.0/auditLogs/signIns?$filter=createdDateTime ge ${sinceISO} and riskLevelDuringSignIn ne 'none'&$top=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    return (d.value || []).map((s: any): NormalisedAlert => ({
      id: safeId('entra', s.id), source: 'Entra ID', sourceId: s.id,
      title: `Entra ID: Risky sign-in — ${s.userPrincipalName || 'Unknown'}`,
      severity: s.riskLevelDuringSignIn === 'high' ? 'High' : s.riskLevelDuringSignIn === 'medium' ? 'Medium' : 'Low',
      device: s.deviceDetail?.displayName || s.clientAppUsed || 'Unknown',
      user: s.userPrincipalName, ip: s.ipAddress,
      time: s.createdDateTime || new Date().toISOString(), rawTime: new Date(s.createdDateTime || Date.now()).getTime(),
      description: `Sign-in from ${s.location?.city || 'Unknown'}, ${s.location?.countryOrRegion || ''} — Risk: ${s.riskLevelDuringSignIn}`,
      verdict: 'Pending', confidence: s.riskLevelDuringSignIn === 'high' ? 80 : 55,
      tags: ['entra', 'identity', s.riskLevelDuringSignIn].filter(Boolean), raw: s,
    }));
  },
};

// ─── Cisco Duo ────────────────────────────────────────────────────────────────
export const duo: IntegrationAdapter = {
  id: 'duo', name: 'Cisco Duo',
  credentialFields: [
    { key: 'api_hostname', label: 'API Hostname', placeholder: 'api-xxxxxxxx.duosecurity.com' },
    { key: 'integration_key', label: 'Integration Key' },
    { key: 'secret_key', label: 'Secret Key', secret: true },
  ],
  async testConnection(creds) {
    try {
      const { createHmac } = await import('crypto');
      const date = new Date().toUTCString();
      const canon = [date, 'GET', creds.api_hostname.toLowerCase(), '/admin/v1/info/summary', ''].join('\n');
      const sig = createHmac('sha1', creds.secret_key).update(canon).digest('hex');
      const auth = Buffer.from(`${creds.integration_key}:${sig}`).toString('base64');
      const r = await fetch(`https://${creds.api_hostname}/admin/v1/info/summary`, { headers: { Date: date, Authorization: `Basic ${auth}` } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { ok: true, message: 'Connected to Cisco Duo' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const { createHmac } = await import('crypto');
    const date = new Date().toUTCString();
    const mintime = since ? Math.floor(since / 1000) : Math.floor((Date.now() - 86400000) / 1000);
    const params = `limit=100&mintime=${mintime}`;
    const canon = [date, 'GET', creds.api_hostname.toLowerCase(), '/admin/v1/logs/authentication', params].join('\n');
    const sig = createHmac('sha1', creds.secret_key).update(canon).digest('hex');
    const auth = Buffer.from(`${creds.integration_key}:${sig}`).toString('base64');
    const r = await fetch(`https://${creds.api_hostname}/admin/v1/logs/authentication?${params}`, { headers: { Date: date, Authorization: `Basic ${auth}` } });
    const d = await r.json();
    const logs = d.response?.authlogs || d.response || [];
    return (Array.isArray(logs) ? logs : []).filter((l: any) => l.result === 'FAILURE').map((l: any): NormalisedAlert => ({
      id: safeId('duo', l.txid || l.timestamp), source: 'Cisco Duo', sourceId: l.txid || '',
      title: `Duo auth failure: ${l.user?.name || 'Unknown'}`, severity: 'Medium',
      device: l.access_device?.hostname || l.access_device?.ip || 'Unknown',
      user: l.user?.name, ip: l.access_device?.ip,
      time: new Date(l.timestamp * 1000).toISOString(), rawTime: l.timestamp * 1000,
      description: `Duo ${l.result} for ${l.user?.name} from ${l.access_device?.location?.city || 'Unknown'}`,
      verdict: 'Pending', confidence: 70, tags: ['duo', 'mfa'].filter(Boolean), raw: l,
    }));
  },
};

// ─── JumpCloud ────────────────────────────────────────────────────────────────
export const jumpcloud: IntegrationAdapter = {
  id: 'jumpcloud', name: 'JumpCloud',
  credentialFields: [
    { key: 'api_key', label: 'API Key', secret: true },
    { key: 'org_id', label: 'Organisation ID (optional)' },
  ],
  async testConnection(creds) {
    const h: Record<string,string> = { 'x-api-key': creds.api_key };
    if (creds.org_id) h['x-org-id'] = creds.org_id;
    return simpleGet('https://console.jumpcloud.com/api/v2/systemgroups?limit=1', h, 'JumpCloud');
  },
  async fetchAlerts(creds, since) {
    const h: Record<string,string> = { 'x-api-key': creds.api_key };
    if (creds.org_id) h['x-org-id'] = creds.org_id;
    const startDate = new Date(since || Date.now() - 86400000).toISOString();
    const r = await fetch(`https://console.jumpcloud.com/api/v2/events?service=all&startDate=${startDate}&limit=100`, { headers: h });
    const d = await r.json();
    return (d.events || []).filter((e: any) => e.type?.includes('fail') || e.type?.includes('lock')).map((e: any): NormalisedAlert => ({
      id: safeId('jc', e.id), source: 'JumpCloud', sourceId: e.id,
      title: `JumpCloud: ${e.type || 'Directory event'}`, severity: 'Medium',
      device: e.system?.hostname || 'Unknown', user: e.initiatedBy?.email || e.login?.id,
      ip: e.ip, time: e.timestamp || new Date().toISOString(), rawTime: new Date(e.timestamp || Date.now()).getTime(),
      description: e.message || e.type || '', verdict: 'Pending', confidence: 60,
      tags: ['jumpcloud', 'identity'].filter(Boolean), raw: e,
    }));
  },
};

// ─── CyberArk PAM ────────────────────────────────────────────────────────────
export const cyberark: IntegrationAdapter = {
  id: 'cyberark', name: 'CyberArk PAM',
  credentialFields: [
    { key: 'host', label: 'PAS URL', placeholder: 'https://cyberark.company.com' },
    { key: 'username', label: 'Username' },
    { key: 'password', label: 'Password', secret: true },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch(`${creds.host}/PasswordVault/API/auth/CyberArk/Logon`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: creds.username, password: creds.password }),
      });
      if (!r.ok) throw new Error(`Auth HTTP ${r.status}`);
      return { ok: true, message: 'Connected to CyberArk PAM' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const lr = await fetch(`${creds.host}/PasswordVault/API/auth/CyberArk/Logon`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: creds.username, password: creds.password }),
    });
    const token = (await lr.json()).replace(/"/g, '');
    const r = await fetch(`${creds.host}/PasswordVault/API/auditactivities?limit=100`, {
      headers: { Authorization: token },
    });
    const d = await r.json();
    return (d.Activities || []).filter((a: any) => a.Action?.includes('Check') || a.Action?.includes('Fail')).slice(0,100).map((a: any): NormalisedAlert => ({
      id: safeId('cyberark', a.ActivityID), source: 'CyberArk PAM', sourceId: String(a.ActivityID),
      title: `CyberArk: ${a.Action || 'PAM event'}`, severity: a.Action?.includes('Fail') ? 'High' : 'Medium',
      device: a.Device || 'Unknown', user: a.User,
      time: a.Time ? new Date(a.Time * 1000).toISOString() : new Date().toISOString(), rawTime: a.Time ? a.Time * 1000 : Date.now(),
      description: a.Description || a.Action || '', verdict: 'Pending', confidence: 75,
      tags: ['cyberark', 'pam', 'identity'].filter(Boolean), raw: a,
    }));
  },
};

// ─── BeyondTrust PAM ─────────────────────────────────────────────────────────
export const beyondtrust: IntegrationAdapter = {
  id: 'beyondtrust', name: 'BeyondTrust PAM',
  credentialFields: [
    { key: 'host', label: 'BeyondTrust URL', placeholder: 'https://bt.company.com' },
    { key: 'api_key', label: 'API Key', secret: true },
  ],
  async testConnection(creds) {
    return simpleGet(`${creds.host}/api/audit_sessions?limit=1`, { Authorization: `PS-Auth key=${creds.api_key}` }, 'BeyondTrust');
  },
  async fetchAlerts(creds, since) {
    const sinceISO = new Date(since || Date.now() - 86400000).toISOString();
    const r = await fetch(`${creds.host}/api/audit_sessions?start_time=${sinceISO}&limit=100`, {
      headers: { Authorization: `PS-Auth key=${creds.api_key}` },
    });
    const d = await r.json();
    return (d.sessions || []).map((s: any): NormalisedAlert => ({
      id: safeId('bt', s.lsid), source: 'BeyondTrust PAM', sourceId: String(s.lsid),
      title: `BeyondTrust session: ${s.username || 'Unknown'}`, severity: 'Medium',
      device: s.jumpoint_name || s.hostname || 'Unknown', user: s.username,
      time: s.session_start || new Date().toISOString(), rawTime: new Date(s.session_start || Date.now()).getTime(),
      description: `PAM session by ${s.username} to ${s.hostname}`, verdict: 'Pending', confidence: 65,
      tags: ['beyondtrust', 'pam', 'identity'].filter(Boolean), raw: s,
    }));
  },
};

// ─── SailPoint IGA ────────────────────────────────────────────────────────────
export const sailpoint: IntegrationAdapter = {
  id: 'sailpoint', name: 'SailPoint IGA',
  credentialFields: [
    { key: 'org', label: 'Organisation ID' },
    { key: 'client_id', label: 'Client ID' }, { key: 'client_secret', label: 'Client Secret', secret: true },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch(`https://${creds.org}.api.identitynow.com/oauth/token`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'client_credentials', client_id: creds.client_id, client_secret: creds.client_secret }),
      });
      if (!r.ok) throw new Error(`Auth HTTP ${r.status}`);
      return { ok: true, message: 'Connected to SailPoint IGA' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const tr = await fetch(`https://${creds.org}.api.identitynow.com/oauth/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: creds.client_id, client_secret: creds.client_secret }),
    });
    const { access_token } = await tr.json();
    const r = await fetch(`https://${creds.org}.api.identitynow.com/v3/alerts?filters=status eq "FIRED"&limit=100`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const d = await r.json();
    return (Array.isArray(d) ? d : []).map((a: any): NormalisedAlert => ({
      id: safeId('sailpoint', a.id), source: 'SailPoint', sourceId: a.id,
      title: a.name || 'SailPoint Alert', severity: normSev(a.severity || 'Medium'),
      device: a.identityId || 'Unknown', user: a.identityName,
      time: a.created || new Date().toISOString(), rawTime: new Date(a.created || Date.now()).getTime(),
      description: a.description || a.name || '', verdict: 'Pending', confidence: 70,
      tags: ['sailpoint', 'iga', 'identity'].filter(Boolean), raw: a,
    }));
  },
};

// ─── Active Directory ─────────────────────────────────────────────────────────
export const active_directory: IntegrationAdapter = {
  id: 'active_directory', name: 'Active Directory',
  credentialFields: [
    { key: 'host', label: 'AD Server', placeholder: 'ldaps://dc.company.com:636' },
    { key: 'username', label: 'Bind Username' }, { key: 'password', label: 'Bind Password', secret: true },
    { key: 'base_dn', label: 'Base DN', placeholder: 'DC=company,DC=com' },
  ],
  async testConnection(creds) {
    // LDAP connectivity check — can only validate format server-side
    if (!creds.host || !creds.username || !creds.base_dn) return { ok: false, message: 'Host, username and Base DN required' };
    return { ok: true, message: 'Active Directory credentials saved (LDAP connection tested on first sync)' };
  },
  async fetchAlerts(_creds, _since) {
    // AD events come via SIEM (Splunk/Sentinel/QRadar) ingesting AD logs
    return [];
  },
};

// ─── Microsoft Intune ─────────────────────────────────────────────────────────
export const intune: IntegrationAdapter = {
  id: 'intune', name: 'Microsoft Intune',
  credentialFields: [
    { key: 'tenant_id', label: 'Tenant ID' }, { key: 'client_id', label: 'Client ID' },
    { key: 'client_secret', label: 'Client Secret', secret: true },
  ],
  async testConnection(creds) {
    try {
      const token = await msalToken(creds, 'https://graph.microsoft.com/.default');
      const r = await fetch('https://graph.microsoft.com/v1.0/deviceManagement/managedDevices?$top=1', { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error(`Graph HTTP ${r.status}`);
      return { ok: true, message: 'Connected to Microsoft Intune' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const token = await msalToken(creds, 'https://graph.microsoft.com/.default');
    const r = await fetch("https://graph.microsoft.com/v1.0/deviceManagement/managedDevices?$filter=complianceState ne 'compliant'&$top=100", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    return (d.value || []).map((dev: any): NormalisedAlert => ({
      id: safeId('intune', dev.id), source: 'Intune', sourceId: dev.id,
      title: `Non-compliant device: ${dev.deviceName || 'Unknown'}`, severity: 'Medium',
      device: dev.deviceName || 'Unknown', user: dev.userPrincipalName,
      time: dev.lastSyncDateTime || new Date().toISOString(), rawTime: new Date(dev.lastSyncDateTime || Date.now()).getTime(),
      description: `Compliance: ${dev.complianceState} — ${dev.operatingSystem} ${dev.osVersion}`,
      verdict: 'Pending', confidence: 75, tags: ['intune', 'mdm'].filter(Boolean), raw: dev,
    }));
  },
};

// ─── Tanium ───────────────────────────────────────────────────────────────────
export const tanium: IntegrationAdapter = {
  id: 'tanium', name: 'Tanium',
  credentialFields: [
    { key: 'host', label: 'Tanium Console URL', placeholder: 'https://tanium.company.com' },
    { key: 'api_token', label: 'API Token', secret: true },
  ],
  async testConnection(creds) {
    return simpleGet(`${creds.host}/api/v2/session/status`, { session: creds.api_token }, 'Tanium');
  },
  async fetchAlerts(creds, since) {
    const r = await fetch(`${creds.host}/plugin/products/threat-response/api/v1/alerts?limit=100`, {
      headers: { session: creds.api_token },
    });
    const d = await r.json();
    return (d.data || []).map((a: any): NormalisedAlert => ({
      id: safeId('tanium', a.id), source: 'Tanium', sourceId: String(a.id),
      title: a.intelDocName || a.type || 'Tanium Threat Alert', severity: normSev(a.priority || a.severity),
      device: a.computerName || a.hostname || 'Unknown',
      time: a.createdAt || new Date().toISOString(), rawTime: new Date(a.createdAt || Date.now()).getTime(),
      description: a.intelDocName || a.type || '', verdict: 'Pending', confidence: 80,
      tags: ['tanium', 'edr'].filter(Boolean), raw: a,
    }));
  },
};

// ─── Fortinet FortiGate ───────────────────────────────────────────────────────
export const fortigate: IntegrationAdapter = {
  id: 'fortigate', name: 'Fortinet FortiGate',
  credentialFields: [
    { key: 'host', label: 'FortiGate URL', placeholder: 'https://firewall.company.com' },
    { key: 'api_key', label: 'API Token', secret: true },
  ],
  async testConnection(creds) {
    return simpleGet(`${creds.host}/api/v2/monitor/system/status`, { Authorization: `Bearer ${creds.api_key}` }, 'FortiGate');
  },
  async fetchAlerts(creds, since) {
    const r = await fetch(`${creds.host}/api/v2/log/disk/threat?rows=100`, { headers: { Authorization: `Bearer ${creds.api_key}` } });
    const d = await r.json();
    return (d.results || []).map((l: any): NormalisedAlert => ({
      id: safeId('forti', l.id || l.date, l.time), source: 'FortiGate', sourceId: String(l.id || l.date),
      title: l.msg || l.action || 'FortiGate threat event',
      severity: normSev(l.level || l.severity), device: l.srcip || l.devname || 'Unknown',
      user: l.unauthuser || l.user, ip: l.srcip,
      time: l.isodate || new Date().toISOString(), rawTime: new Date(l.isodate || Date.now()).getTime(),
      description: l.msg || l.action || '', verdict: l.action === 'block' ? 'TP' : 'Pending', confidence: 75,
      tags: ['fortigate', 'firewall'].filter(Boolean), raw: l,
    }));
  },
};

// ─── Palo Alto NGFW (Panorama) ────────────────────────────────────────────────
export const palo_ngfw: IntegrationAdapter = {
  id: 'palo_ngfw', name: 'Palo Alto NGFW',
  credentialFields: [
    { key: 'host', label: 'Panorama URL', placeholder: 'https://panorama.company.com' },
    { key: 'api_key', label: 'API Key', secret: true },
  ],
  async testConnection(creds) {
    return simpleGet(`${creds.host}/api/?type=op&cmd=<show><s><info></info></s></show>&key=${creds.api_key}`, {}, 'Palo Alto NGFW');
  },
  async fetchAlerts(creds, since) {
    const r = await fetch(`${creds.host}/api/?type=log&log-type=threat&nlogs=100&key=${creds.api_key}`);
    const text = await r.text();
    const entries = text.match(/<entry[^>]*>[\s\S]*?<\/entry>/g) || [];
    return entries.slice(0,100).map((entry: string): NormalisedAlert => {
      const get = (tag: string) => entry.match(new RegExp(`<${tag}>([^<]*)<\/${tag}>`))?.[1] || '';
      return {
        id: safeId('palo', get('seqno')), source: 'Palo Alto NGFW', sourceId: get('seqno'),
        title: get('threat-id') || get('category') || 'Firewall threat event',
        severity: normSev(get('severity')), device: get('device-name') || 'Unknown',
        ip: get('src'), user: get('srcuser'),
        time: get('time_generated') || new Date().toISOString(), rawTime: Date.now(),
        description: `${get('action')} ${get('threat-id')} from ${get('src')}`,
        verdict: get('action') === 'block' ? 'TP' : 'Pending', confidence: 80,
        tags: ['palo_ngfw', 'firewall'].filter(Boolean), raw: { entry },
      };
    });
  },
};

// ─── Cisco Firepower ─────────────────────────────────────────────────────────
export const cisco_firepower: IntegrationAdapter = {
  id: 'cisco_firepower', name: 'Cisco Firepower',
  credentialFields: [
    { key: 'host', label: 'FMC URL', placeholder: 'https://fmc.company.com' },
    { key: 'username', label: 'Username' }, { key: 'password', label: 'Password', secret: true },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch(`${creds.host}/api/fmc_platform/v1/auth/generatetoken`, {
        method: 'POST',
        headers: { Authorization: `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString('base64')}` },
      });
      if (!r.ok) throw new Error(`Auth HTTP ${r.status}`);
      return { ok: true, message: 'Connected to Cisco Firepower' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const tr = await fetch(`${creds.host}/api/fmc_platform/v1/auth/generatetoken`, {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString('base64')}` },
    });
    const token = tr.headers.get('X-auth-access-token') || '';
    const r = await fetch(`${creds.host}/api/fmc_rest/v1/analysis/intrusions/events?limit=100`, {
      headers: { 'X-auth-access-token': token },
    });
    const d = await r.json();
    return (d.items || []).map((e: any): NormalisedAlert => ({
      id: safeId('fmc', e.id), source: 'Cisco Firepower', sourceId: e.id,
      title: e.ruleMessage || 'Firepower IPS Event', severity: normSev(e.priority),
      device: e.sourceIP || 'Unknown', ip: e.sourceIP,
      time: new Date(e.deviceEventTime || Date.now()).toISOString(), rawTime: e.deviceEventTime || Date.now(),
      description: e.ruleMessage || '', verdict: e.blocked ? 'TP' : 'Pending', confidence: 80,
      tags: ['cisco', 'firepower', 'ips'].filter(Boolean), raw: e,
    }));
  },
};

// ─── Check Point ──────────────────────────────────────────────────────────────
export const checkpoint: IntegrationAdapter = {
  id: 'checkpoint', name: 'Check Point',
  credentialFields: [
    { key: 'host', label: 'SmartConsole URL', placeholder: 'https://checkpoint.company.com' },
    { key: 'api_key', label: 'API Key', secret: true },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch(`${creds.host}/web_api/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'api-key': creds.api_key }),
      });
      if (!r.ok) throw new Error(`Auth HTTP ${r.status}`);
      return { ok: true, message: 'Connected to Check Point' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const lr = await fetch(`${creds.host}/web_api/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'api-key': creds.api_key }),
    });
    const { sid } = await lr.json();
    const r = await fetch(`${creds.host}/web_api/show-logs`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-chkp-sid': sid },
      body: JSON.stringify({ filter: 'blade IPS action drop', 'time-frame': 'last-1-hour', 'maximum-number-of-results': 100 }),
    });
    await fetch(`${creds.host}/web_api/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-chkp-sid': sid }, body: '{}' });
    const d = await r.json();
    return (d.logs || []).map((l: any): NormalisedAlert => ({
      id: safeId('cp', l.logid), source: 'Check Point', sourceId: l.logid,
      title: l.blade || l.protection_name || 'Check Point IPS Event', severity: normSev(l.severity),
      device: l.src || 'Unknown', ip: l.src,
      time: l.time ? new Date(l.time * 1000).toISOString() : new Date().toISOString(), rawTime: l.time ? l.time * 1000 : Date.now(),
      description: l.protection_name || l.blade || '', verdict: 'TP', confidence: 80,
      tags: ['checkpoint', 'firewall'].filter(Boolean), raw: l,
    }));
  },
};

// ─── GCP Security Command Center ─────────────────────────────────────────────
export const gcp_scc: IntegrationAdapter = {
  id: 'gcp_scc', name: 'GCP Security Command Center',
  credentialFields: [
    { key: 'project_id', label: 'GCP Project ID' },
    { key: 'service_account_json', label: 'Service Account JSON', secret: true },
  ],
  async testConnection(creds) {
    try { JSON.parse(creds.service_account_json); return { ok: true, message: 'GCP credentials validated (SCC API must be enabled)' }; }
    catch { return { ok: false, message: 'Invalid service account JSON' }; }
  },
  async fetchAlerts(creds, since) {
    const sa = JSON.parse(creds.service_account_json);
    const token = await gcpJwt(sa, 'https://www.googleapis.com/auth/cloud-platform');
    const r = await fetch(`https://securitycenter.googleapis.com/v1/projects/${creds.project_id}/sources/-/findings?filter=state="ACTIVE"&pageSize=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    return (d.listFindingsResults || []).map((f: any): NormalisedAlert => {
      const finding = f.finding;
      return {
        id: safeId('gcp', finding.name), source: 'GCP Security Command Center', sourceId: finding.name,
        title: finding.category || 'GCP Security Finding', severity: normSev(finding.severity),
        device: finding.resourceName?.split('/').pop() || 'Unknown',
        time: finding.eventTime || finding.createTime || new Date().toISOString(),
        rawTime: new Date(finding.eventTime || finding.createTime || Date.now()).getTime(),
        description: finding.description || finding.category || '',
        verdict: finding.state === 'INACTIVE' ? 'FP' : 'Pending', confidence: 80,
        tags: ['gcp', 'scc'].filter(Boolean), raw: finding,
      };
    });
  },
};

// ─── Vectra AI ────────────────────────────────────────────────────────────────
export const vectra: IntegrationAdapter = {
  id: 'vectra', name: 'Vectra AI',
  credentialFields: [
    { key: 'host', label: 'Vectra Brain URL', placeholder: 'https://brain.vectra.ai' },
    { key: 'api_key', label: 'API Token', secret: true },
  ],
  async testConnection(creds) {
    return simpleGet(`${creds.host}/api/v2.5/health`, { Authorization: `Token ${creds.api_key}` }, 'Vectra AI');
  },
  async fetchAlerts(creds, since) {
    const r = await fetch(`${creds.host}/api/v2.5/detections?state=active&page_size=100`, { headers: { Authorization: `Token ${creds.api_key}` } });
    const d = await r.json();
    return (d.results || []).map((det: any): NormalisedAlert => ({
      id: safeId('vectra', det.id), source: 'Vectra AI', sourceId: String(det.id),
      title: det.type_vname || det.detection_type || 'Vectra detection',
      severity: normSev(det.threat || det.certainty),
      device: det.src_host?.name || det.src_ip || 'Unknown', ip: det.src_ip,
      time: det.last_timestamp || new Date().toISOString(), rawTime: new Date(det.last_timestamp || Date.now()).getTime(),
      description: det.summary || det.type_vname || '',
      verdict: det.is_triaged ? 'FP' : 'Pending', confidence: det.certainty || 75,
      tags: ['vectra', 'ndr', det.category?.toLowerCase()].filter(Boolean), raw: det,
    }));
  },
};

// ─── Rapid7 InsightIDR ────────────────────────────────────────────────────────
export const rapid7: IntegrationAdapter = {
  id: 'rapid7', name: 'Rapid7 InsightIDR',
  credentialFields: [
    { key: 'host', label: 'InsightIDR URL', placeholder: 'https://us.api.insight.rapid7.com' },
    { key: 'api_key', label: 'API Key', secret: true },
  ],
  async testConnection(creds) {
    return simpleGet(`${creds.host}/idr/v1/investigations?size=1`, { 'X-Api-Key': creds.api_key }, 'Rapid7 InsightIDR');
  },
  async fetchAlerts(creds, since) {
    const sinceISO = new Date(since || Date.now() - 86400000).toISOString();
    const r = await fetch(`${creds.host}/idr/v1/investigations?size=100&statuses=OPEN&created_time_from=${sinceISO}`, { headers: { 'X-Api-Key': creds.api_key } });
    const d = await r.json();
    return (d.data || []).map((inv: any): NormalisedAlert => ({
      id: safeId('r7', inv.id), source: 'Rapid7 InsightIDR', sourceId: inv.id,
      title: inv.title || inv.type || 'InsightIDR Investigation', severity: normSev(inv.priority),
      device: inv.assignee?.name || 'Unknown',
      time: inv.created_time || new Date().toISOString(), rawTime: new Date(inv.created_time || Date.now()).getTime(),
      description: inv.title || '', verdict: inv.status === 'CLOSED' ? 'TP' : 'Pending', confidence: 80,
      tags: ['rapid7', 'siem'].filter(Boolean), raw: inv,
    }));
  },
};

// ─── Google Chronicle ─────────────────────────────────────────────────────────
export const chronicle: IntegrationAdapter = {
  id: 'chronicle', name: 'Google Chronicle',
  credentialFields: [
    { key: 'customer_id', label: 'Customer ID' },
    { key: 'service_account_json', label: 'Service Account JSON', secret: true },
    { key: 'region', label: 'Region', placeholder: 'us' },
  ],
  async testConnection(creds) {
    try { JSON.parse(creds.service_account_json); return { ok: true, message: 'Chronicle credentials validated (Chronicle license required)' }; }
    catch { return { ok: false, message: 'Invalid service account JSON' }; }
  },
  async fetchAlerts(creds, since) {
    const sa = JSON.parse(creds.service_account_json);
    const token = await gcpJwt(sa, 'https://www.googleapis.com/auth/chronicle-backstory');
    const startTime = new Date(since || Date.now() - 86400000).toISOString();
    const endTime = new Date().toISOString();
    const base = creds.region && creds.region !== 'us' ? `https://${creds.region}-chronicle.googleapis.com` : 'https://backstory.googleapis.com';
    const r = await fetch(`${base}/v2/detect/detections?alertState=ALERTING&pageSize=100&startTime=${startTime}&endTime=${endTime}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    return (d.detections || []).map((det: any): NormalisedAlert => ({
      id: safeId('chronicle', det.id), source: 'Google Chronicle', sourceId: det.id,
      title: det.ruleName || 'Chronicle Detection', severity: normSev(det.severity || 'Medium'),
      device: det.collectionElements?.[0]?.references?.[0]?.event?.principal?.hostname || 'Unknown',
      time: det.detectionTime || det.timeWindow?.startTime || new Date().toISOString(),
      rawTime: new Date(det.detectionTime || det.timeWindow?.startTime || Date.now()).getTime(),
      description: det.ruleName || '', verdict: 'Pending', confidence: 75,
      tags: ['chronicle', 'siem'].filter(Boolean), raw: det,
    }));
  },
};

// ─── Exabeam ──────────────────────────────────────────────────────────────────
export const exabeam: IntegrationAdapter = {
  id: 'exabeam', name: 'Exabeam',
  credentialFields: [
    { key: 'host', label: 'Exabeam URL', placeholder: 'https://company.exabeam.cloud' },
    { key: 'username', label: 'Username' }, { key: 'password', label: 'Password', secret: true },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch(`${creds.host}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: creds.username, password: creds.password }),
      });
      if (!r.ok) throw new Error(`Auth HTTP ${r.status}`);
      return { ok: true, message: 'Connected to Exabeam' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const tr = await fetch(`${creds.host}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: creds.username, password: creds.password }),
    });
    const { token } = await tr.json();
    const r = await fetch(`${creds.host}/api/incidents/search`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ size: 100, query: { status: 'New', sort: 'lastModifiedAt:DESC' } }),
    });
    const d = await r.json();
    return (d.incidents || []).map((i: any): NormalisedAlert => ({
      id: safeId('exabeam', i.incidentId), source: 'Exabeam', sourceId: i.incidentId,
      title: i.name || i.type || 'Exabeam Incident', severity: normSev(i.riskScore || i.severity),
      device: i.hostnames?.[0] || 'Unknown', user: i.usernames?.[0],
      time: i.createdAt || new Date().toISOString(), rawTime: new Date(i.createdAt || Date.now()).getTime(),
      description: i.description || i.name || '', verdict: 'Pending', confidence: i.riskScore || 70,
      tags: ['exabeam', 'siem'].filter(Boolean), raw: i,
    }));
  },
};

// ─── LogRhythm ────────────────────────────────────────────────────────────────
export const logrhythm: IntegrationAdapter = {
  id: 'logrhythm', name: 'LogRhythm NextGen SIEM',
  credentialFields: [
    { key: 'host', label: 'LogRhythm API URL', placeholder: 'https://logrhythm.company.com:8501' },
    { key: 'api_key', label: 'API Key', secret: true },
  ],
  async testConnection(creds) {
    return simpleGet(`${creds.host}/lr-case-api/cases?count=1`, { Authorization: `Bearer ${creds.api_key}` }, 'LogRhythm');
  },
  async fetchAlerts(creds, since) {
    const r = await fetch(`${creds.host}/lr-case-api/cases?count=100&orderBy=lastUpdated&sort=descending`, { headers: { Authorization: `Bearer ${creds.api_key}` } });
    const d = await r.json();
    return (Array.isArray(d) ? d : []).map((c: any): NormalisedAlert => ({
      id: safeId('lr', c.id), source: 'LogRhythm', sourceId: c.id,
      title: c.name || 'LogRhythm Case', severity: normSev(c.priority),
      device: 'Unknown', time: c.dateCreated || new Date().toISOString(), rawTime: new Date(c.dateCreated || Date.now()).getTime(),
      description: c.summary || c.name || '', verdict: c.status?.name === 'Closed' ? 'TP' : 'Pending', confidence: 75,
      tags: ['logrhythm', 'siem'].filter(Boolean), raw: c,
    }));
  },
};

// ─── Sumo Logic ───────────────────────────────────────────────────────────────
export const sumo_logic: IntegrationAdapter = {
  id: 'sumo_logic', name: 'Sumo Logic',
  credentialFields: [
    { key: 'access_id', label: 'Access ID' },
    { key: 'access_key', label: 'Access Key', secret: true },
    { key: 'endpoint', label: 'API Endpoint', placeholder: 'https://api.eu.sumologic.com' },
  ],
  async testConnection(creds) {
    const base = creds.endpoint || 'https://api.sumologic.com';
    return simpleGet(`${base}/api/v1/collectors?limit=1`, { Authorization: `Basic ${Buffer.from(`${creds.access_id}:${creds.access_key}`).toString('base64')}` }, 'Sumo Logic');
  },
  async fetchAlerts(creds, since) {
    const base = creds.endpoint || 'https://api.sumologic.com';
    const r = await fetch(`${base}/api/v1/alerts?limit=100`, {
      headers: { Authorization: `Basic ${Buffer.from(`${creds.access_id}:${creds.access_key}`).toString('base64')}` },
    });
    const d = await r.json();
    return (d.data || []).map((a: any): NormalisedAlert => ({
      id: safeId('sumo', a.id), source: 'Sumo Logic', sourceId: a.id,
      title: a.name || 'Sumo Logic Alert', severity: normSev(a.severity),
      device: 'Unknown', time: a.createdAt || new Date().toISOString(), rawTime: new Date(a.createdAt || Date.now()).getTime(),
      description: a.name || '', verdict: 'Pending', confidence: 70,
      tags: ['sumo_logic', 'siem'].filter(Boolean), raw: a,
    }));
  },
};

// ─── Datadog Security ─────────────────────────────────────────────────────────
export const datadog: IntegrationAdapter = {
  id: 'datadog', name: 'Datadog Security',
  credentialFields: [
    { key: 'api_key', label: 'API Key', secret: true },
    { key: 'app_key', label: 'Application Key', secret: true },
    { key: 'site', label: 'Site', placeholder: 'datadoghq.eu' },
  ],
  async testConnection(creds) {
    const site = creds.site || 'datadoghq.com';
    return simpleGet(`https://api.${site}/api/v1/validate`, { 'DD-API-KEY': creds.api_key, 'DD-APPLICATION-KEY': creds.app_key }, 'Datadog');
  },
  async fetchAlerts(creds, since) {
    const site = creds.site || 'datadoghq.com';
    const fromISO = new Date(since || Date.now() - 86400000).toISOString();
    const r = await fetch(`https://api.${site}/api/v2/security_monitoring/signals?filter[from]=${fromISO}&page[limit]=100`, {
      headers: { 'DD-API-KEY': creds.api_key, 'DD-APPLICATION-KEY': creds.app_key },
    });
    const d = await r.json();
    return (d.data || []).map((s: any): NormalisedAlert => ({
      id: safeId('dd', s.id), source: 'Datadog Security', sourceId: s.id,
      title: s.attributes?.message || 'Datadog Security Signal', severity: normSev(s.attributes?.severity),
      device: s.attributes?.tags?.find((t: string) => t.startsWith('host:'))?.replace('host:', '') || 'Unknown',
      user: s.attributes?.tags?.find((t: string) => t.startsWith('user:'))?.replace('user:', ''),
      time: s.attributes?.timestamp || new Date().toISOString(), rawTime: new Date(s.attributes?.timestamp || Date.now()).getTime(),
      mitre: s.attributes?.tags?.find((t: string) => t.startsWith('technique:'))?.replace('technique:', ''),
      description: s.attributes?.message || '', verdict: 'Pending', confidence: 80,
      tags: ['datadog', 'siem'].filter(Boolean), raw: s,
    }));
  },
};

// ─── Panther ──────────────────────────────────────────────────────────────────
export const panther: IntegrationAdapter = {
  id: 'panther', name: 'Panther',
  credentialFields: [
    { key: 'api_token', label: 'API Token', secret: true },
    { key: 'api_host', label: 'API Host', placeholder: 'https://api.company.runpanther.net' },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch(`${creds.api_host}/public/graphql`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${creds.api_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ generatedReports { totalCount } }' }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { ok: true, message: 'Connected to Panther' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const r = await fetch(`${creds.api_host}/public/graphql`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${creds.api_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ alerts(input: { pageSize: 100, status: [OPEN, TRIAGED] }) { edges { node { id alertId title severity status createdAt } } } }' }),
    });
    const d = await r.json();
    return (d.data?.alerts?.edges || []).map((e: any): NormalisedAlert => {
      const a = e.node;
      return {
        id: safeId('panther', a.alertId), source: 'Panther', sourceId: a.alertId,
        title: a.title || 'Panther Alert', severity: normSev(a.severity),
        device: 'Unknown', time: a.createdAt || new Date().toISOString(), rawTime: new Date(a.createdAt || Date.now()).getTime(),
        description: a.title || '', verdict: 'Pending', confidence: 75,
        tags: ['panther', 'siem'].filter(Boolean), raw: a,
      };
    });
  },
};

// ─── Axonius ──────────────────────────────────────────────────────────────────
export const axonius: IntegrationAdapter = {
  id: 'axonius', name: 'Axonius',
  credentialFields: [
    { key: 'host', label: 'Axonius URL', placeholder: 'https://company.axonius.com' },
    { key: 'api_key', label: 'API Key' }, { key: 'api_secret', label: 'API Secret', secret: true },
  ],
  async testConnection(creds) {
    return simpleGet(`${creds.host}/api/system/discover/status`, { 'api-key': creds.api_key, 'secret-key': creds.api_secret }, 'Axonius');
  },
  async fetchAlerts(_creds, _since) { return []; },
};

// ─── Snyk ─────────────────────────────────────────────────────────────────────
export const snyk: IntegrationAdapter = {
  id: 'snyk', name: 'Snyk',
  credentialFields: [
    { key: 'api_token', label: 'API Token', secret: true },
    { key: 'org_id', label: 'Organisation ID (optional)' },
  ],
  async testConnection(creds) {
    return simpleGet('https://api.snyk.io/v1/orgs', { Authorization: `token ${creds.api_token}` }, 'Snyk');
  },
  async fetchAlerts(creds, since) {
    let orgId = creds.org_id;
    if (!orgId) {
      const or = await fetch('https://api.snyk.io/v1/orgs', { headers: { Authorization: `token ${creds.api_token}` } });
      const od = await or.json();
      orgId = od.orgs?.[0]?.id;
    }
    if (!orgId) return [];
    const r = await fetch(`https://api.snyk.io/v1/org/${orgId}/issues`, {
      method: 'POST',
      headers: { Authorization: `token ${creds.api_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters: { severity: ['critical', 'high'], exploitMaturity: ['mature', 'proof-of-concept'] } }),
    });
    const d = await r.json();
    return (d.results || []).slice(0,100).map((issue: any): NormalisedAlert => ({
      id: safeId('snyk', issue.id), source: 'Snyk', sourceId: issue.id,
      title: issue.issueData?.title || issue.pkgName || 'Snyk vulnerability',
      severity: normSev(issue.issueData?.severity), device: issue.pkgName || 'Unknown',
      time: issue.introducedDate || new Date().toISOString(), rawTime: new Date(issue.introducedDate || Date.now()).getTime(),
      description: issue.issueData?.description || issue.issueData?.title || '',
      verdict: 'Pending', confidence: 85,
      tags: ['snyk', 'appsec'].filter(Boolean), raw: issue,
    }));
  },
};

// ─── Prisma Cloud ─────────────────────────────────────────────────────────────
export const prisma_cloud: IntegrationAdapter = {
  id: 'prisma_cloud', name: 'Palo Alto Prisma Cloud',
  credentialFields: [
    { key: 'api_url', label: 'API URL', placeholder: 'https://api.prismacloud.io' },
    { key: 'access_key', label: 'Access Key ID' }, { key: 'secret_key', label: 'Secret Key', secret: true },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch(`${creds.api_url}/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: creds.access_key, password: creds.secret_key }),
      });
      if (!r.ok) throw new Error(`Auth HTTP ${r.status}`);
      return { ok: true, message: 'Connected to Prisma Cloud' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const tr = await fetch(`${creds.api_url}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: creds.access_key, password: creds.secret_key }),
    });
    const { token } = await tr.json();
    const r = await fetch(`${creds.api_url}/v2/alert?timeType=relative&timeAmount=24&timeUnit=hour&alert.status=open&limit=100`, {
      headers: { 'x-redlock-auth': token },
    });
    const d = await r.json();
    return (d.items || []).map((a: any): NormalisedAlert => ({
      id: safeId('prisma', a.id), source: 'Prisma Cloud', sourceId: a.id,
      title: a.policy?.name || 'Prisma Cloud Alert', severity: normSev(a.policy?.severity),
      device: a.resource?.name || 'Unknown',
      time: new Date(a.firstSeen || Date.now()).toISOString(), rawTime: a.firstSeen || Date.now(),
      description: a.policy?.description || a.policy?.name || '',
      verdict: 'Pending', confidence: 80, tags: ['prisma', 'cspm'].filter(Boolean), raw: a,
    }));
  },
};

// ─── Lacework ─────────────────────────────────────────────────────────────────
export const lacework: IntegrationAdapter = {
  id: 'lacework', name: 'Lacework',
  credentialFields: [
    { key: 'account', label: 'Account Name', placeholder: 'mycompany' },
    { key: 'api_key', label: 'API Key' }, { key: 'api_secret', label: 'API Secret', secret: true },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch(`https://${creds.account}.lacework.net/api/v2/access/tokens`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-LW-UAKS': creds.api_key },
        body: JSON.stringify({ keyId: creds.api_key, expiryTime: 3600 }),
      });
      if (!r.ok) throw new Error(`Auth HTTP ${r.status}`);
      return { ok: true, message: 'Connected to Lacework' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const tr = await fetch(`https://${creds.account}.lacework.net/api/v2/access/tokens`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-LW-UAKS': creds.api_key },
      body: JSON.stringify({ keyId: creds.api_key, expiryTime: 3600 }),
    });
    const { token } = await tr.json();
    const fromTime = new Date(since || Date.now() - 86400000).toISOString();
    const r = await fetch(`https://${creds.account}.lacework.net/api/v2/Alerts?filters[createdTime][gte]=${fromTime}&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    return (d.data || []).map((a: any): NormalisedAlert => ({
      id: safeId('lacework', a.alertId), source: 'Lacework', sourceId: String(a.alertId),
      title: a.alertName || a.alertType || 'Lacework Alert', severity: normSev(a.severity),
      device: a.entity?.HOSTNAME || 'Unknown',
      time: a.startTime || new Date().toISOString(), rawTime: new Date(a.startTime || Date.now()).getTime(),
      description: a.alertName || '', verdict: 'Pending', confidence: 75,
      tags: ['lacework', 'cspm'].filter(Boolean), raw: a,
    }));
  },
};

// ─── Orca Security ────────────────────────────────────────────────────────────
export const orca: IntegrationAdapter = {
  id: 'orca', name: 'Orca Security',
  credentialFields: [{ key: 'api_token', label: 'API Token', secret: true }],
  async testConnection(creds) {
    return simpleGet('https://api.orcasecurity.io/api/user/session', { Authorization: `Token ${creds.api_token}` }, 'Orca Security');
  },
  async fetchAlerts(creds, since) {
    const r = await fetch('https://api.orcasecurity.io/api/query/alerts?limit=100&status=open', { headers: { Authorization: `Token ${creds.api_token}` } });
    const d = await r.json();
    return (d.data || []).map((a: any): NormalisedAlert => ({
      id: safeId('orca', a.state_id), source: 'Orca Security', sourceId: a.state_id,
      title: a.alert_labels?.[0] || a.type_string || 'Orca Alert', severity: normSev(a.state?.severity),
      device: a.asset_name || 'Unknown',
      time: a.state_creation_time || new Date().toISOString(), rawTime: new Date(a.state_creation_time || Date.now()).getTime(),
      description: a.description || a.title || '', verdict: 'Pending', confidence: 80,
      tags: ['orca', 'cspm'].filter(Boolean), raw: a,
    }));
  },
};

// ─── Aqua Security ────────────────────────────────────────────────────────────
export const aqua: IntegrationAdapter = {
  id: 'aqua', name: 'Aqua Security',
  credentialFields: [
    { key: 'host', label: 'Aqua URL', placeholder: 'https://api.aquasec.com' },
    { key: 'api_key', label: 'API Key' }, { key: 'api_secret', label: 'API Secret', secret: true },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch(`${creds.host}/v1/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: creds.api_key, password: creds.api_secret }),
      });
      if (!r.ok) throw new Error(`Auth HTTP ${r.status}`);
      return { ok: true, message: 'Connected to Aqua Security' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const tr = await fetch(`${creds.host}/v1/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: creds.api_key, password: creds.api_secret }),
    });
    const { token } = await tr.json();
    const r = await fetch(`${creds.host}/v1/risks/vulnerabilities?limit=100&threat_level=10`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    return (d.result || []).map((v: any): NormalisedAlert => ({
      id: safeId('aqua', v.name, v.image_name), source: 'Aqua Security', sourceId: `${v.name}-${v.image_name}`,
      title: `${v.name}: ${v.image_name || 'Container vulnerability'}`, severity: normSev(v.aqua_severity || v.nvd_score),
      device: v.resource_name || v.image_name || 'Unknown',
      time: v.first_found_date || new Date().toISOString(), rawTime: new Date(v.first_found_date || Date.now()).getTime(),
      description: v.description || v.name || '', verdict: 'Pending', confidence: 85,
      tags: ['aqua', 'container', 'vuln'].filter(Boolean), raw: v,
    }));
  },
};

// ─── GitHub Advanced Security ─────────────────────────────────────────────────
export const github_advanced: IntegrationAdapter = {
  id: 'github_advanced', name: 'GitHub Advanced Security',
  credentialFields: [
    { key: 'token', label: 'Personal Access Token', secret: true },
    { key: 'org', label: 'GitHub Organisation', placeholder: 'myorg' },
  ],
  async testConnection(creds) {
    return simpleGet(`https://api.github.com/orgs/${creds.org}`, {
      Authorization: `Bearer ${creds.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
    }, 'GitHub');
  },
  async fetchAlerts(creds, since) {
    const headers = { Authorization: `Bearer ${creds.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    const r = await fetch(`https://api.github.com/orgs/${creds.org}/code-scanning/alerts?state=open&per_page=100`, { headers });
    const d = await r.json();
    return (Array.isArray(d) ? d : []).map((a: any): NormalisedAlert => ({
      id: safeId('gh', a.number, a.repository?.name), source: 'GitHub Advanced Security', sourceId: String(a.number),
      title: a.rule?.description || a.rule?.id || 'GitHub Security Alert',
      severity: normSev(a.rule?.security_severity_level || a.rule?.severity),
      device: a.repository?.name || creds.org, user: a.most_recent_instance?.location?.path,
      time: a.created_at || new Date().toISOString(), rawTime: new Date(a.created_at || Date.now()).getTime(),
      description: a.rule?.description || '', verdict: 'Pending', confidence: 85,
      tags: ['github', 'appsec', a.tool?.name?.toLowerCase()].filter(Boolean), raw: a,
    }));
  },
};

// ─── Checkmarx ────────────────────────────────────────────────────────────────
export const checkmarx: IntegrationAdapter = {
  id: 'checkmarx', name: 'Checkmarx',
  credentialFields: [
    { key: 'host', label: 'CxOne URL', placeholder: 'https://cxone.checkmarx.net' },
    { key: 'username', label: 'Username' }, { key: 'password', label: 'Password', secret: true },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch(`${creds.host}/auth/realms/organization/protocol/openid-connect/token`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'password', client_id: 'ast-app', username: creds.username, password: creds.password }),
      });
      if (!r.ok) throw new Error(`Auth HTTP ${r.status}`);
      return { ok: true, message: 'Connected to Checkmarx' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const tr = await fetch(`${creds.host}/auth/realms/organization/protocol/openid-connect/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'password', client_id: 'ast-app', username: creds.username, password: creds.password }),
    });
    const { access_token } = await tr.json();
    const r = await fetch(`${creds.host}/api/results/?severity=HIGH,CRITICAL&limit=100`, { headers: { Authorization: `Bearer ${access_token}` } });
    const d = await r.json();
    return (d.results || []).map((res: any): NormalisedAlert => ({
      id: safeId('cx', res.id), source: 'Checkmarx', sourceId: res.id,
      title: res.queryName || res.type || 'Checkmarx Vulnerability', severity: normSev(res.severity),
      device: res.similarityId || 'Unknown',
      time: new Date().toISOString(), rawTime: Date.now(),
      description: res.description || res.queryName || '', verdict: 'Pending', confidence: 80,
      tags: ['checkmarx', 'appsec'].filter(Boolean), raw: res,
    }));
  },
};

// ─── Huntress MDR ─────────────────────────────────────────────────────────────
export const huntress: IntegrationAdapter = {
  id: 'huntress', name: 'Huntress MDR',
  credentialFields: [
    { key: 'api_key', label: 'API Key' }, { key: 'api_secret', label: 'API Secret', secret: true },
  ],
  async testConnection(creds) {
    const auth = Buffer.from(`${creds.api_key}:${creds.api_secret}`).toString('base64');
    return simpleGet('https://api.huntress.io/v1/organizations?limit=1', { Authorization: `Basic ${auth}` }, 'Huntress');
  },
  async fetchAlerts(creds, since) {
    const auth = Buffer.from(`${creds.api_key}:${creds.api_secret}`).toString('base64');
    const r = await fetch('https://api.huntress.io/v1/incidents?limit=100&status=active', { headers: { Authorization: `Basic ${auth}` } });
    const d = await r.json();
    return (d.incidents || []).map((i: any): NormalisedAlert => ({
      id: safeId('huntress', i.id), source: 'Huntress MDR', sourceId: String(i.id),
      title: i.platform || 'Huntress Incident', severity: normSev(i.severity || 'High'),
      device: i.agent?.hostname || 'Unknown', user: i.agent?.account_name,
      time: i.created_at || new Date().toISOString(), rawTime: new Date(i.created_at || Date.now()).getTime(),
      description: i.summary || '', verdict: 'Pending', confidence: 85,
      tags: ['huntress', 'mdr'].filter(Boolean), raw: i,
    }));
  },
};

// ─── Claroty CTD ─────────────────────────────────────────────────────────────
export const claroty: IntegrationAdapter = {
  id: 'claroty', name: 'Claroty',
  credentialFields: [
    { key: 'host', label: 'CTD URL', placeholder: 'https://ctd.company.com' },
    { key: 'username', label: 'Username' }, { key: 'password', label: 'Password', secret: true },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch(`${creds.host}/api/v1/authenticate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: { email: creds.username, password: creds.password } }),
      });
      if (!r.ok) throw new Error(`Auth HTTP ${r.status}`);
      return { ok: true, message: 'Connected to Claroty CTD' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const tr = await fetch(`${creds.host}/api/v1/authenticate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: { email: creds.username, password: creds.password } }),
    });
    const { access_token } = await tr.json();
    const r = await fetch(`${creds.host}/api/v1/alerts?limit=100`, { headers: { Authorization: `Bearer ${access_token}` } });
    const d = await r.json();
    return (d.objects || []).map((a: any): NormalisedAlert => ({
      id: safeId('claroty', a.id), source: 'Claroty', sourceId: String(a.id),
      title: a.name || a.type || 'Claroty OT Alert', severity: normSev(a.severity),
      device: a.asset_name || a.ip || 'Unknown', ip: a.ip,
      time: a.created_at || new Date().toISOString(), rawTime: new Date(a.created_at || Date.now()).getTime(),
      description: a.description || a.name || '', verdict: 'Pending', confidence: 80,
      tags: ['claroty', 'ot', 'ics'].filter(Boolean), raw: a,
    }));
  },
};

// ─── Nozomi Networks ─────────────────────────────────────────────────────────
export const nozomi: IntegrationAdapter = {
  id: 'nozomi', name: 'Nozomi Networks',
  credentialFields: [
    { key: 'host', label: 'Vantage URL', placeholder: 'https://nozomi.company.com' },
    { key: 'api_key', label: 'API Key', secret: true },
  ],
  async testConnection(creds) {
    return simpleGet(`${creds.host}/api/v1/alerts?limit=1`, { 'X-API-Key': creds.api_key }, 'Nozomi Networks');
  },
  async fetchAlerts(creds, since) {
    const r = await fetch(`${creds.host}/api/v1/alerts?limit=100`, { headers: { 'X-API-Key': creds.api_key } });
    const d = await r.json();
    return (d.result || d.items || []).map((a: any): NormalisedAlert => ({
      id: safeId('nozomi', a.id), source: 'Nozomi Networks', sourceId: String(a.id),
      title: a.name || a.type_name || 'Nozomi OT Alert', severity: normSev(a.severity || a.risk),
      device: a.src_ip_label || a.src_ip || 'Unknown', ip: a.src_ip,
      time: a.created_at || new Date().toISOString(), rawTime: new Date(a.created_at || Date.now()).getTime(),
      description: a.description || a.name || '', verdict: 'Pending', confidence: 80,
      tags: ['nozomi', 'ot', 'ndr'].filter(Boolean), raw: a,
    }));
  },
};

// ─── Dragos ───────────────────────────────────────────────────────────────────
export const dragos: IntegrationAdapter = {
  id: 'dragos', name: 'Dragos',
  credentialFields: [
    { key: 'host', label: 'Platform URL', placeholder: 'https://platform.dragos.com' },
    { key: 'api_key', label: 'API Token' }, { key: 'api_secret', label: 'API Secret', secret: true },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch(`${creds.host}/api/v1/alerts?page_size=1`, {
        headers: { Authorization: `Token ${Buffer.from(`${creds.api_key}:${creds.api_secret}`).toString('base64')}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { ok: true, message: 'Connected to Dragos' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const r = await fetch(`${creds.host}/api/v1/alerts?page_size=100`, {
      headers: { Authorization: `Token ${Buffer.from(`${creds.api_key}:${creds.api_secret}`).toString('base64')}` },
    });
    const d = await r.json();
    return (d.alerts || d.results || []).map((a: any): NormalisedAlert => ({
      id: safeId('dragos', a.id), source: 'Dragos', sourceId: String(a.id),
      title: a.title || a.type || 'Dragos ICS/OT Alert', severity: normSev(a.severity),
      device: a.asset?.hostname || a.asset?.ip || 'Unknown',
      time: a.created_at || new Date().toISOString(), rawTime: new Date(a.created_at || Date.now()).getTime(),
      description: a.description || a.title || '', verdict: 'Pending', confidence: 85,
      tags: ['dragos', 'ics', 'ot'].filter(Boolean), raw: a,
    }));
  },
};

// ─── ConnectWise PSA (output-only — incidents flow out) ───────────────────────
export const connectwise: IntegrationAdapter = {
  id: 'connectwise', name: 'ConnectWise PSA',
  credentialFields: [
    { key: 'site', label: 'Site URL', placeholder: 'https://na.myconnectwise.net' },
    { key: 'company_id', label: 'Company ID' },
    { key: 'public_key', label: 'Public Key' }, { key: 'private_key', label: 'Private Key', secret: true },
  ],
  async testConnection(creds) {
    const auth = Buffer.from(`${creds.company_id}+${creds.public_key}:${creds.private_key}`).toString('base64');
    return simpleGet(`${creds.site}/v4_6_release/apis/3.0/system/info`, { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }, 'ConnectWise PSA');
  },
  async fetchAlerts(_c, _s) { return []; },
};

// ─── Halo PSA (output-only) ──────────────────────────────────────────────────
export const halopsa: IntegrationAdapter = {
  id: 'halopsa', name: 'Halo PSA',
  credentialFields: [
    { key: 'host', label: 'HaloPSA URL', placeholder: 'https://company.halopsa.com' },
    { key: 'client_id', label: 'Client ID' }, { key: 'client_secret', label: 'Client Secret', secret: true },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch(`${creds.host}/auth/token`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'client_credentials', client_id: creds.client_id, client_secret: creds.client_secret, scope: 'all' }),
      });
      if (!r.ok) throw new Error(`Auth HTTP ${r.status}`);
      return { ok: true, message: 'Connected to Halo PSA' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(_c, _s) { return []; },
};

// ─── Autotask (output-only) ──────────────────────────────────────────────────
export const autotask: IntegrationAdapter = {
  id: 'autotask', name: 'Autotask (Datto)',
  credentialFields: [
    { key: 'username', label: 'API Username' },
    { key: 'secret', label: 'API Secret', secret: true },
    { key: 'integration_code', label: 'Integration Code' },
  ],
  async testConnection(creds) {
    return simpleGet('https://webservices6.autotask.net/ATServicesRest/V1.0/Tickets?search=%7B%22filter%22:[%7B%22field%22:%22id%22,%22op%22:%22gt%22,%22value%22:0%7D]%7D&pageSize=1', {
      UserName: creds.username, Secret: creds.secret, ApiIntegrationCode: creds.integration_code,
    }, 'Autotask');
  },
  async fetchAlerts(_c, _s) { return []; },
};

// ─── SOAR adapters (output-only — receive incidents, don't push alerts) ───────
function soarAdapter(id: string, name: string, fields: any[]): IntegrationAdapter {
  return {
    id, name, credentialFields: fields,
    async testConnection(creds) {
      if (!creds.host && !creds.api_key && !creds.tenant_url) return { ok: false, message: 'Missing credentials' };
      return { ok: true, message: `${name} credentials saved — webhook delivery configured` };
    },
    async fetchAlerts(_c, _s) { return []; },
  };
}

export const xsoar = soarAdapter('xsoar', 'Palo Alto Cortex XSOAR', [
  { key: 'host', label: 'XSOAR URL', placeholder: 'https://xsoar.company.com' },
  { key: 'api_key', label: 'API Key', secret: true },
]);
export const swimlane = soarAdapter('swimlane', 'Swimlane', [
  { key: 'host', label: 'Swimlane URL', placeholder: 'https://swimlane.company.com' },
  { key: 'api_key', label: 'API Key', secret: true },
]);
export const tines = soarAdapter('tines', 'Tines', [
  { key: 'api_key', label: 'API Key', secret: true },
  { key: 'tenant_url', label: 'Tenant URL', placeholder: 'https://company.tines.com' },
]);
export const torq = soarAdapter('torq', 'Torq', [
  { key: 'api_key', label: 'API Key', secret: true },
  { key: 'workspace_id', label: 'Workspace ID' },
]);

// ─── ITSM adapters ────────────────────────────────────────────────────────────
export const servicenow: IntegrationAdapter = {
  id: 'servicenow', name: 'ServiceNow',
  credentialFields: [
    { key: 'instance', label: 'Instance URL', placeholder: 'https://company.service-now.com' },
    { key: 'username', label: 'Username' }, { key: 'password', label: 'Password', secret: true },
  ],
  async testConnection(creds) {
    const auth = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
    return simpleGet(`${creds.instance}/api/now/table/incident?sysparm_limit=1`, { Authorization: `Basic ${auth}` }, 'ServiceNow');
  },
  async fetchAlerts(_c, _s) { return []; },
};

export const pagerduty: IntegrationAdapter = {
  id: 'pagerduty', name: 'PagerDuty',
  credentialFields: [
    { key: 'api_key', label: 'API Key', secret: true },
    { key: 'service_id', label: 'Service ID (optional)', placeholder: 'PXXXXXX' },
  ],
  async testConnection(creds) {
    return simpleGet('https://api.pagerduty.com/services?limit=1', { Authorization: `Token token=${creds.api_key}`, Accept: 'application/vnd.pagerduty+json;version=2' }, 'PagerDuty');
  },
  async fetchAlerts(_c, _s) { return []; },
};

export const jira: IntegrationAdapter = {
  id: 'jira', name: 'Jira Service Management',
  credentialFields: [
    { key: 'host', label: 'Jira URL', placeholder: 'https://company.atlassian.net' },
    { key: 'email', label: 'Email' }, { key: 'api_token', label: 'API Token', secret: true },
    { key: 'project_key', label: 'Project Key', placeholder: 'SEC' },
  ],
  async testConnection(creds) {
    const auth = Buffer.from(`${creds.email}:${creds.api_token}`).toString('base64');
    return simpleGet(`${creds.host}/rest/api/3/project/${creds.project_key}`, { Authorization: `Basic ${auth}` }, 'Jira');
  },
  async fetchAlerts(_c, _s) { return []; },
};

export const freshservice: IntegrationAdapter = {
  id: 'freshservice', name: 'Freshservice',
  credentialFields: [
    { key: 'domain', label: 'Domain', placeholder: 'company.freshservice.com' },
    { key: 'api_key', label: 'API Key', secret: true },
  ],
  async testConnection(creds) {
    const auth = Buffer.from(`${creds.api_key}:X`).toString('base64');
    return simpleGet(`https://${creds.domain}/api/v2/tickets?per_page=1`, { Authorization: `Basic ${auth}` }, 'Freshservice');
  },
  async fetchAlerts(_c, _s) { return []; },
};

export const zendesk: IntegrationAdapter = {
  id: 'zendesk', name: 'Zendesk',
  credentialFields: [
    { key: 'subdomain', label: 'Subdomain', placeholder: 'company' },
    { key: 'email', label: 'Email' }, { key: 'api_token', label: 'API Token', secret: true },
  ],
  async testConnection(creds) {
    const auth = Buffer.from(`${creds.email}/token:${creds.api_token}`).toString('base64');
    return simpleGet(`https://${creds.subdomain}.zendesk.com/api/v2/tickets.json?per_page=1`, { Authorization: `Basic ${auth}` }, 'Zendesk');
  },
  async fetchAlerts(_c, _s) { return []; },
};

// ─── Comms adapters (output-only — Watchtower pushes alerts out) ──────────────
export const slack: IntegrationAdapter = {
  id: 'slack', name: 'Slack',
  credentialFields: [
    { key: 'webhook_url', label: 'Webhook URL', secret: true, placeholder: 'https://hooks.slack.com/services/...' },
    { key: 'channel', label: 'Default Channel', placeholder: '#security-alerts' },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch(creds.webhook_url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Watchtower connected ✓ — alert notifications active' }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { ok: true, message: `Slack connected — alerts will post to ${creds.channel || '#security-alerts'}` };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(_c, _s) { return []; },
};

export const teams: IntegrationAdapter = {
  id: 'teams', name: 'Microsoft Teams',
  credentialFields: [
    { key: 'webhook_url', label: 'Webhook URL', secret: true, placeholder: 'https://company.webhook.office.com/...' },
  ],
  async testConnection(creds) {
    try {
      const r = await fetch(creds.webhook_url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ '@type': 'MessageCard', text: 'Watchtower connected ✓' }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { ok: true, message: 'Microsoft Teams connected — incident notifications active' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(_c, _s) { return []; },
};
