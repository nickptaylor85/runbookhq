import type { IntegrationAdapter, Credentials, NormalisedAlert } from './types';
import { normSev, safeId } from './helpers';

async function getToken(creds: Credentials): Promise<string> {
  const res = await fetch(`https://login.microsoftonline.com/${creds.tenant_id}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: creds.client_id,
      client_secret: creds.client_secret,
      scope: 'https://api.securitycenter.microsoft.com/.default',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Auth failed');
  return data.access_token;
}

export const defender: IntegrationAdapter = {
  id: 'defender',
  name: 'Microsoft Defender for Endpoint',
  credentialFields: [
    { key: 'tenant_id', label: 'Tenant ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    { key: 'client_id', label: 'Application (Client) ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    { key: 'client_secret', label: 'Client Secret', secret: true },
  ],
  async testConnection(creds) {
    try {
      await getToken(creds);
      return { ok: true, message: 'Connected to Microsoft Defender for Endpoint' };
    } catch(e: any) {
      return { ok: false, message: 'Connection failed', details: e.message };
    }
  },
  async fetchAlerts(creds, since) {
    const token = await getToken(creds);
    const filter = since
      ? `$filter=alertCreationTime+ge+${new Date(since).toISOString()}`
      : `$filter=alertCreationTime+ge+${new Date(Date.now()-86400000).toISOString()}`;
    const res = await fetch(`https://api.securitycenter.microsoft.com/api/alerts?${filter}&$orderby=alertCreationTime+desc&$top=100`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const data = await res.json();
    return (data.value || []).map((a: any): NormalisedAlert => ({
      id: safeId('mde', a.id),
      source: 'Defender',
      sourceId: a.id,
      title: a.title || 'Defender alert',
      severity: normSev(a.severity),
      device: a.computerDnsName || a.machineId || 'Unknown',
      user: a.relatedUser?.userName,
      ip: a.evidence?.find((e: any) => e.entityType === 'Ip')?.ipAddress,
      time: a.alertCreationTime || new Date().toISOString(),
      rawTime: new Date(a.alertCreationTime || Date.now()).getTime(),
      mitre: a.mitreTechniques?.[0],
      description: a.description || a.title,
      url: `https://security.microsoft.com/alerts/${a.id}`,
      verdict: 'Pending',
      confidence: 0,
      tags: ['defender', 'mde', a.category, a.status].filter(Boolean),
      raw: a,
    }));
  },
};
