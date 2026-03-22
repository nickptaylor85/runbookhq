import type { IntegrationAdapter, Credentials, NormalisedAlert } from './types';
import { normSev, safeId } from './helpers';

export const splunk: IntegrationAdapter = {
  id: 'splunk',
  name: 'Splunk SIEM',
  credentialFields: [
    { key: 'host', label: 'Splunk Host', placeholder: 'https://splunk.company.com:8089' },
    { key: 'token', label: 'API Token (HEC or management)', secret: true, placeholder: 'Splunk xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
  ],
  async testConnection(creds) {
    try {
      const res = await fetch(`${creds.host}/services/server/info?output_mode=json`, {
        headers: { Authorization: `Bearer ${creds.token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, message: 'Connected to Splunk' };
    } catch(e: any) {
      return { ok: false, message: 'Connection failed', details: e.message };
    }
  },
  async fetchAlerts(creds, since) {
    // Run a search for notable events from ES or general security alerts
    const earliestTime = since ? new Date(since).toISOString() : '-24h';
    const search = `search index=notable earliest=${earliestTime} | fields _time, rule_name, urgency, dest, src_user, src_ip, description, rule_id | sort -_time | head 100`;

    // Create search job
    const jobRes = await fetch(`${creds.host}/services/search/jobs?output_mode=json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ search, exec_mode: 'blocking', count: '100' }),
    });
    const jobData = await jobRes.json();
    const sid = jobData.sid;
    if (!sid) throw new Error('Failed to create search job');

    // Get results
    const resRes = await fetch(`${creds.host}/services/search/jobs/${sid}/results?output_mode=json&count=100`, {
      headers: { Authorization: `Bearer ${creds.token}` },
    });
    const resData = await resRes.json();
    const results = resData.results || [];

    return results.map((r: any): NormalisedAlert => ({
      id: safeId('splunk', r.rule_id || r._time || Math.random()),
      source: 'Splunk',
      sourceId: r.rule_id || r._time,
      title: r.rule_name || 'Splunk notable event',
      severity: normSev(r.urgency),
      device: r.dest || r.host || 'Unknown',
      user: r.src_user,
      ip: r.src_ip,
      time: r._time || new Date().toISOString(),
      rawTime: new Date(r._time || Date.now()).getTime(),
      description: r.description || r.rule_name,
      verdict: 'Pending',
      confidence: 0,
      tags: ['splunk', 'siem'],
      raw: r,
    }));
  },
};
