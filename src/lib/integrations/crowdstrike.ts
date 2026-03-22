import type { IntegrationAdapter, Credentials, NormalisedAlert, ConnectionResult } from './types';
import { normSev, tsToISO, safeId } from './helpers';

async function getToken(creds: Credentials): Promise<string> {
  const base = creds.base_url || 'https://api.crowdstrike.com';
  const res = await fetch(`${base}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: new URLSearchParams({ client_id: creds.client_id, client_secret: creds.client_secret }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.[0]?.message || 'Auth failed');
  return data.access_token;
}

export const crowdstrike: IntegrationAdapter = {
  id: 'crowdstrike',
  name: 'CrowdStrike Falcon',
  credentialFields: [
    { key: 'client_id', label: 'Client ID', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
    { key: 'client_secret', label: 'Client Secret', secret: true, placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
    { key: 'base_url', label: 'Base URL (optional)', placeholder: 'https://api.crowdstrike.com' },
  ],
  async testConnection(creds) {
    try {
      await getToken(creds);
      return { ok: true, message: 'Connected to CrowdStrike Falcon' };
    } catch(e: any) {
      return { ok: false, message: 'Connection failed', details: e.message };
    }
  },
  async fetchAlerts(creds, since) {
    const token = await getToken(creds);
    const base = creds.base_url || 'https://api.crowdstrike.com';
    const filter = since ? `created_timestamp:>='${new Date(since).toISOString()}'` : `created_timestamp:>='${new Date(Date.now()-86400000).toISOString()}'`;

    // 1. Get detection IDs
    const idsRes = await fetch(`${base}/detects/queries/detects/v1?limit=100&filter=${encodeURIComponent(filter)}&sort=created_timestamp.desc`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const idsData = await idsRes.json();
    const ids: string[] = idsData.resources || [];
    if (!ids.length) return [];

    // 2. Get detection details
    const body = JSON.stringify({ ids });
    const detRes = await fetch(`${base}/detects/entities/summaries/GET/v1`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
    });
    const detData = await detRes.json();
    const detections = detData.resources || [];

    return detections.map((d: any): NormalisedAlert => ({
      id: safeId('cs', d.detection_id),
      source: 'CrowdStrike',
      sourceId: d.detection_id,
      title: d.behaviors?.[0]?.display_name || d.detection_id,
      severity: normSev(d.max_severity_displayname),
      device: d.device?.hostname || d.device?.device_id || 'Unknown',
      user: d.behaviors?.[0]?.user_name,
      time: d.created_timestamp || new Date().toISOString(),
      rawTime: new Date(d.created_timestamp || Date.now()).getTime(),
      mitre: d.behaviors?.[0]?.tactic ? `${d.behaviors[0].tactic}/${d.behaviors[0].technique}` : undefined,
      description: d.behaviors?.[0]?.description || `CrowdStrike detection: ${d.detection_id}`,
      url: `https://falcon.crowdstrike.com/activity/detections/detail/${d.detection_id}`,
      verdict: 'Pending',
      confidence: 0,
      tags: ['crowdstrike', 'edr', d.status].filter(Boolean),
      raw: d,
    }));
  },
};
