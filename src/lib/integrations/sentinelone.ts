import type { IntegrationAdapter, Credentials, NormalisedAlert } from './types';
import { normSev, safeId } from './helpers';

export const sentinelone: IntegrationAdapter = {
  id: 'sentinelone',
  name: 'SentinelOne',
  credentialFields: [
    { key: 'host', label: 'Management URL', placeholder: 'https://your-tenant.sentinelone.net' },
    { key: 'api_token', label: 'API Token', secret: true },
  ],
  async testConnection(creds) {
    try {
      const res = await fetch(`${creds.host}/web/api/v2.1/system/status`, {
        headers: { Authorization: `ApiToken ${creds.api_token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, message: 'Connected to SentinelOne' };
    } catch(e: any) {
      return { ok: false, message: 'Connection failed', details: e.message };
    }
  },
  async fetchAlerts(creds, since) {
    const createdAfter = since ? new Date(since).toISOString() : new Date(Date.now()-86400000).toISOString();
    const res = await fetch(`${creds.host}/web/api/v2.1/threats?limit=100&sortBy=createdAt&sortOrder=desc&createdAt__gte=${createdAfter}`, {
      headers: { Authorization: `ApiToken ${creds.api_token}`, Accept: 'application/json' },
    });
    const data = await res.json();
    return (data.data || []).map((t: any): NormalisedAlert => ({
      id: safeId('s1', t.id),
      source: 'SentinelOne',
      sourceId: t.id,
      title: t.threatInfo?.threatName || t.threatInfo?.classification || 'SentinelOne threat',
      severity: normSev(t.threatInfo?.confidenceLevel === 'malicious' ? 'High' : t.threatInfo?.confidenceLevel),
      device: t.agentRealtimeInfo?.agentComputerName || 'Unknown',
      user: t.threatInfo?.processUser,
      time: t.threatInfo?.createdAt || new Date().toISOString(),
      rawTime: new Date(t.threatInfo?.createdAt || Date.now()).getTime(),
      mitre: t.threatInfo?.mitigationStatus,
      description: `${t.threatInfo?.classification || 'Threat'}: ${t.threatInfo?.threatName || t.id}`,
      url: `${creds.host}/threats/${t.id}`,
      verdict: t.threatInfo?.analystVerdict === 'true_positive' ? 'TP' : t.threatInfo?.analystVerdict === 'false_positive' ? 'FP' : 'Pending',
      confidence: t.threatInfo?.confidenceLevel === 'malicious' ? 90 : 60,
      tags: ['sentinelone', 'edr', t.threatInfo?.classification].filter(Boolean),
      raw: t,
    }));
  },
};
