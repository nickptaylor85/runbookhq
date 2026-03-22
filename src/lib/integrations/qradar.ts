import type { IntegrationAdapter, Credentials, NormalisedAlert } from './types';
import { normSev, safeId } from './helpers';

export const qradar: IntegrationAdapter = {
  id: 'qradar',
  name: 'IBM QRadar',
  credentialFields: [
    { key: 'host', label: 'QRadar Host', placeholder: 'https://qradar.company.com' },
    { key: 'sec_token', label: 'SEC Token', secret: true, placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
  ],
  async testConnection(creds) {
    try {
      const res = await fetch(`${creds.host}/api/system/information/versions`, {
        headers: { SEC: creds.sec_token, Accept: 'application/json', Version: '14.0' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, message: 'Connected to IBM QRadar' };
    } catch(e: any) {
      return { ok: false, message: 'Connection failed', details: e.message };
    }
  },
  async fetchAlerts(creds, since) {
    const startTime = since ? Math.floor(since/1000) : Math.floor((Date.now()-86400000)/1000);
    const res = await fetch(`${creds.host}/api/siem/offenses?filter=start_time>${startTime}&sort=%2Bstart_time&limit=100`, {
      headers: { SEC: creds.sec_token, Accept: 'application/json', Version: '14.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const offenses = await res.json();
    return (offenses || []).map((o: any): NormalisedAlert => ({
      id: safeId('qr', o.id),
      source: 'QRadar',
      sourceId: String(o.id),
      title: o.description || o.offense_name || 'QRadar offense',
      severity: normSev(o.severity),
      device: o.offense_source || o.source_address_ids?.[0] || 'Unknown',
      ip: o.offense_source,
      time: o.start_time ? new Date(o.start_time * 1000).toISOString() : new Date().toISOString(),
      rawTime: (o.start_time || Date.now() / 1000) * 1000,
      description: o.description || o.offense_name,
      url: `${creds.host}/console/do/sem/offensesummary?appName=Sem&pageId=OffenseSummary&summaryId=${o.id}`,
      verdict: o.status === 'CLOSED' ? 'FP' : 'Pending',
      confidence: o.credibility ? Math.round((o.credibility / 10) * 100) : 0,
      tags: ['qradar', 'siem', o.categories?.[0]].filter(Boolean),
      raw: o,
    }));
  },
};
