import type { IntegrationAdapter, Credentials, NormalisedAlert } from './types';
import { normSev, safeId } from './helpers';

async function dtRequest(creds: Credentials, path: string): Promise<any> {
  const date = new Date().toUTCString();
  const msg = `${path}\n${date}\n`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(creds.private_key),
    { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('');
  const token = `${creds.public_key}:${sigHex}`;

  const res = await fetch(`${creds.host}${path}`, {
    headers: { DTAPI: token, Date: date, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const darktrace: IntegrationAdapter = {
  id: 'darktrace',
  name: 'Darktrace',
  credentialFields: [
    { key: 'host', label: 'Darktrace Hostname', placeholder: 'https://darktrace.company.com' },
    { key: 'public_key', label: 'Public Token', placeholder: 'pub_xxxxxxxxxxxx' },
    { key: 'private_key', label: 'Private Token', secret: true },
  ],
  async testConnection(creds) {
    try {
      await dtRequest(creds, '/status');
      return { ok: true, message: 'Connected to Darktrace' };
    } catch(e: any) {
      return { ok: false, message: 'Connection failed', details: e.message };
    }
  },
  async fetchAlerts(creds, since) {
    const startTime = since || Date.now() - 86400000;
    const data = await dtRequest(creds, `/alerts?starttime=${startTime}&endtime=${Date.now()}&minscore=0.5&includeacknowledged=true`);
    const alerts = Array.isArray(data) ? data : data.alerts || [];
    return alerts.map((a: any): NormalisedAlert => ({
      id: safeId('dt', a.id || a.pbid),
      source: 'Darktrace',
      sourceId: String(a.id || a.pbid),
      title: a.headline || a.modelName || 'Darktrace model breach',
      severity: normSev(a.score >= 0.9 ? 'Critical' : a.score >= 0.7 ? 'High' : a.score >= 0.4 ? 'Medium' : 'Low'),
      device: a.device?.hostname || a.device?.ip || a.triggeredComponents?.[0]?.device?.hostname || 'Unknown',
      ip: a.device?.ip,
      time: a.createdAt ? new Date(a.createdAt * 1000).toISOString() : new Date().toISOString(),
      rawTime: (a.createdAt || Date.now() / 1000) * 1000,
      description: a.summary || a.modelName || 'Darktrace anomaly detected',
      url: a.id ? `${creds.host}/model-breaches/${a.id}` : undefined,
      verdict: 'Pending',
      confidence: Math.round((a.score || 0.5) * 100),
      tags: ['darktrace', 'ndr', a.modelCategory].filter(Boolean),
      raw: a,
    }));
  },
};
