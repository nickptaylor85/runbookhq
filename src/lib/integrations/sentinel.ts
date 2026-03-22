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
      scope: 'https://management.azure.com/.default',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Auth failed');
  return data.access_token;
}

export const sentinel: IntegrationAdapter = {
  id: 'sentinel',
  name: 'Microsoft Sentinel',
  credentialFields: [
    { key: 'tenant_id', label: 'Tenant ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    { key: 'client_id', label: 'Client ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    { key: 'client_secret', label: 'Client Secret', secret: true },
    { key: 'subscription_id', label: 'Subscription ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    { key: 'resource_group', label: 'Resource Group', placeholder: 'my-resource-group' },
    { key: 'workspace', label: 'Workspace Name', placeholder: 'my-sentinel-workspace' },
  ],
  async testConnection(creds) {
    try {
      await getToken(creds);
      return { ok: true, message: 'Connected to Microsoft Sentinel' };
    } catch(e: any) {
      return { ok: false, message: 'Connection failed', details: e.message };
    }
  },
  async fetchAlerts(creds, since) {
    const token = await getToken(creds);
    const base = `https://management.azure.com/subscriptions/${creds.subscription_id}/resourceGroups/${creds.resource_group}/providers/Microsoft.OperationalInsights/workspaces/${creds.workspace}/providers/Microsoft.SecurityInsights`;
    const filter = since ? `properties/createdTimeUtc ge ${new Date(since).toISOString()}` : `properties/createdTimeUtc ge ${new Date(Date.now()-86400000).toISOString()}`;
    const res = await fetch(`${base}/incidents?api-version=2023-02-01&$filter=${encodeURIComponent(filter)}&$top=100&$orderby=properties/createdTimeUtc desc`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const data = await res.json();
    return (data.value || []).map((i: any): NormalisedAlert => ({
      id: safeId('sentinel', i.name),
      source: 'Sentinel',
      sourceId: i.name,
      title: i.properties?.title || 'Sentinel incident',
      severity: normSev(i.properties?.severity),
      device: i.properties?.relatedEntities?.[0]?.properties?.hostName || 'Unknown',
      time: i.properties?.createdTimeUtc || new Date().toISOString(),
      rawTime: new Date(i.properties?.createdTimeUtc || Date.now()).getTime(),
      description: i.properties?.description || i.properties?.title,
      url: i.properties?.incidentUrl,
      verdict: 'Pending',
      confidence: 0,
      tags: ['sentinel', 'siem', i.properties?.status].filter(Boolean),
      raw: i,
    }));
  },
};
