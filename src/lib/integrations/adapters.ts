import type { IntegrationAdapter, Credentials, NormalisedAlert } from './types';
import { normSev, safeId } from './helpers';

// ─── Elastic Security ─────────────────────────────────────────────────────────
export const elastic: IntegrationAdapter = {
  id: 'elastic',
  name: 'Elastic Security',
  credentialFields: [
    { key: 'host', label: 'Kibana URL', placeholder: 'https://kibana.company.com' },
    { key: 'api_key', label: 'API Key (base64)', secret: true, placeholder: 'ApiKey base64encodedkey==' },
    { key: 'space', label: 'Space ID (optional)', placeholder: 'default' },
  ],
  async testConnection(creds) {
    try {
      const space = creds.space || 'default';
      const res = await fetch(`${creds.host}/s/${space}/api/detection_engine/index`, {
        headers: { Authorization: `ApiKey ${creds.api_key}`, 'kbn-xsrf': 'true' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, message: 'Connected to Elastic Security' };
    } catch(e: any) { return { ok: false, message: 'Connection failed', details: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const space = creds.space || 'default';
    const gte = since ? new Date(since).toISOString() : new Date(Date.now()-86400000).toISOString();
    const body = JSON.stringify({ query: { bool: { filter: [{ range: { '@timestamp': { gte } } }, { term: { 'kibana.alert.workflow_status': 'open' } }] } }, size: 100, sort: [{ '@timestamp': { order: 'desc' } }] });
    const res = await fetch(`${creds.host}/s/${space}/api/detection_engine/signals/search`, {
      method: 'POST',
      headers: { Authorization: `ApiKey ${creds.api_key}`, 'kbn-xsrf': 'true', 'Content-Type': 'application/json' },
      body,
    });
    const data = await res.json();
    return (data.hits?.hits || []).map((h: any): NormalisedAlert => {
      const s = h._source;
      return {
        id: safeId('elastic', h._id),
        source: 'Elastic',
        sourceId: h._id,
        title: s['kibana.alert.rule.name'] || s.message || 'Elastic alert',
        severity: normSev(s['kibana.alert.severity'] || s['kibana.alert.risk_score']),
        device: s['host.hostname'] || s['host.name'] || 'Unknown',
        user: s['user.name'],
        ip: s['source.ip'],
        time: s['@timestamp'] || new Date().toISOString(),
        rawTime: new Date(s['@timestamp'] || Date.now()).getTime(),
        mitre: s['kibana.alert.rule.threat']?.[0]?.technique?.[0]?.id,
        description: s['kibana.alert.rule.description'] || s['kibana.alert.rule.name'],
        verdict: 'Pending', confidence: Math.min(100, Math.round((s['kibana.alert.risk_score'] || 50))),
        tags: ['elastic', 'siem'],
        raw: s,
      };
    });
  },
};

// ─── Tenable.io ───────────────────────────────────────────────────────────────
export const tenable: IntegrationAdapter = {
  id: 'tenable',
  name: 'Tenable.io',
  credentialFields: [
    { key: 'access_key', label: 'Access Key', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
    { key: 'secret_key', label: 'Secret Key', secret: true },
  ],
  async testConnection(creds) {
    try {
      // Use /scans endpoint as a lightweight auth check (session endpoint deprecated)
      const res = await fetch('https://cloud.tenable.com/scans?limit=1', {
        headers: {
          'X-ApiKeys': `accessKey=${creds.access_key};secretKey=${creds.secret_key}`,
          'Accept': 'application/json',
        },
      });
      if (res.status === 401) throw new Error('Invalid API keys — check Access Key and Secret Key');
      if (res.status === 403) throw new Error('API keys valid but insufficient permissions');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, message: 'Connected to Tenable.io' };
    } catch(e: any) { return { ok: false, message: e.message }; }
  },
  async fetchAlerts(creds, since) {
    // Tenable.io API — get high/critical vulnerabilities from the last 7 days
    const headers = { 'X-ApiKeys': `accessKey=${creds.access_key};secretKey=${creds.secret_key}`, 'Accept': 'application/json' };
    // Export vulnerability data via workbench
    const params = new URLSearchParams({
      date_range: '7',
      'filter.0.filter': 'severity',
      'filter.0.quality': 'gte',
      'filter.0.value': '3', // 3=High, 4=Critical
      'filter.search_type': 'and',
      limit: '100',
    });
    const res = await fetch(`https://cloud.tenable.com/workbenches/vulnerabilities?${params.toString()}`, { headers });
    if (!res.ok) throw new Error(`Tenable API error: HTTP ${res.status}`);
    const data = await res.json();
    return (data.vulnerabilities || []).slice(0, 100).map((v: any): NormalisedAlert => ({
      id: safeId('tenable', v.plugin_id, v.asset_id),
      source: 'Tenable',
      sourceId: `${v.plugin_id}`,
      title: v.plugin_name || 'Tenable vulnerability',
      severity: normSev(v.severity),
      device: v.asset?.fqdn || v.asset?.ipv4 || 'Unknown',
      ip: v.asset?.ipv4,
      time: v.last_found || new Date().toISOString(),
      rawTime: new Date(v.last_found || Date.now()).getTime(),
      description: `CVE: ${v.cve?.[0] || 'N/A'} — ${v.plugin_name}`,
      verdict: 'Pending', confidence: v.cvss3_base_score ? Math.round(v.cvss3_base_score * 10) : 50,
      tags: ['tenable', 'vuln', v.cve?.[0]].filter(Boolean),
      raw: v,
    }));
  },
};

// ─── Nessus ───────────────────────────────────────────────────────────────────
export const nessus: IntegrationAdapter = {
  id: 'nessus',
  name: 'Nessus',
  credentialFields: [
    { key: 'host', label: 'Nessus Host', placeholder: 'https://nessus.company.com:8834' },
    { key: 'access_key', label: 'Access Key' },
    { key: 'secret_key', label: 'Secret Key', secret: true },
  ],
  async testConnection(creds) {
    try {
      const res = await fetch(`${creds.host}/server/status`, {
        headers: { 'X-ApiKeys': `accessKey=${creds.access_key};secretKey=${creds.secret_key}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, message: 'Connected to Nessus' };
    } catch(e: any) { return { ok: false, message: 'Connection failed', details: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const headers = { 'X-ApiKeys': `accessKey=${creds.access_key};secretKey=${creds.secret_key}`, Accept: 'application/json' };
    const scansRes = await fetch(`${creds.host}/scans`, { headers });
    const scansData = await scansRes.json();
    const recentScans = (scansData.scans || []).filter((s: any) => s.status === 'completed').slice(0, 3);
    const alerts: NormalisedAlert[] = [];
    for (const scan of recentScans) {
      const scanRes = await fetch(`${creds.host}/scans/${scan.id}`, { headers });
      const scanData = await scanRes.json();
      for (const host of (scanData.hosts || [])) {
        const hostRes = await fetch(`${creds.host}/scans/${scan.id}/hosts/${host.host_id}`, { headers });
        const hostData = await hostRes.json();
        for (const vuln of (hostData.vulnerabilities || []).filter((v: any) => v.severity >= 3).slice(0, 20)) {
          alerts.push({
            id: safeId('nessus', scan.id, host.host_id, vuln.plugin_id),
            source: 'Nessus',
            sourceId: `${scan.id}-${vuln.plugin_id}`,
            title: vuln.plugin_name,
            severity: normSev(vuln.severity),
            device: host.hostname || host.host_ip || 'Unknown',
            ip: host.host_ip,
            time: new Date(scan.last_modification_date * 1000).toISOString(),
            rawTime: scan.last_modification_date * 1000,
            description: `Nessus Plugin ${vuln.plugin_id}: ${vuln.plugin_name}`,
            verdict: 'Pending', confidence: vuln.severity * 20,
            tags: ['nessus', 'vuln'],
            raw: vuln,
          });
        }
      }
    }
    return alerts;
  },
};

// ─── Qualys ───────────────────────────────────────────────────────────────────
export const qualys: IntegrationAdapter = {
  id: 'qualys',
  name: 'Qualys',
  credentialFields: [
    { key: 'platform', label: 'Platform URL', placeholder: 'https://qualysapi.qualys.com' },
    { key: 'username', label: 'Username' },
    { key: 'password', label: 'Password', secret: true },
  ],
  async testConnection(creds) {
    try {
      const auth = btoa(`${creds.username}:${creds.password}`);
      const res = await fetch(`${creds.platform}/api/2.0/fo/scan/?action=list&echo_request=1`, {
        headers: { Authorization: `Basic ${auth}`, 'X-Requested-With': 'Watchtower' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, message: 'Connected to Qualys' };
    } catch(e: any) { return { ok: false, message: 'Connection failed', details: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const auth = btoa(`${creds.username}:${creds.password}`);
    const headers = { Authorization: `Basic ${auth}`, 'X-Requested-With': 'Watchtower', Accept: 'application/json' };
    const res = await fetch(`${creds.platform}/api/2.0/fo/asset/host/vm/detection/?action=list&severity_levels=3,4,5&status=New,Active&show_results=1`, { headers });
    const text = await res.text();
    // Qualys returns XML — basic parse
    const matches = text.matchAll(/<DETECTION>([\s\S]*?)<\/DETECTION>/g);
    const alerts: NormalisedAlert[] = [];
    for (const m of matches) {
      const block = m[1];
      const get = (tag: string) => block.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`))?.[1] || '';
      alerts.push({
        id: safeId('qualys', get('QID'), get('ID')),
        source: 'Qualys',
        sourceId: get('QID'),
        title: get('RESULTS') || `Qualys QID ${get('QID')}`,
        severity: normSev(get('SEVERITY')),
        device: get('IP') || 'Unknown',
        ip: get('IP'),
        time: get('LAST_FOUND_DATETIME') || new Date().toISOString(),
        rawTime: new Date(get('LAST_FOUND_DATETIME') || Date.now()).getTime(),
        description: `Qualys detection QID: ${get('QID')}`,
        verdict: 'Pending', confidence: Number(get('SEVERITY')) * 20,
        tags: ['qualys', 'vuln'],
        raw: block,
      });
      if (alerts.length >= 100) break;
    }
    return alerts;
  },
};

// ─── Wiz ──────────────────────────────────────────────────────────────────────
export const wiz: IntegrationAdapter = {
  id: 'wiz',
  name: 'Wiz',
  credentialFields: [
    { key: 'client_id', label: 'Client ID' },
    { key: 'client_secret', label: 'Client Secret', secret: true },
    { key: 'api_endpoint', label: 'API Endpoint URL', placeholder: 'https://api.eu1.app.wiz.io/graphql' },
  ],
  async testConnection(creds) {
    try {
      const tokenRes = await fetch('https://auth.app.wiz.io/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'client_credentials', client_id: creds.client_id, client_secret: creds.client_secret, audience: 'wiz-api' }),
      });
      if (!tokenRes.ok) throw new Error('Auth failed');
      return { ok: true, message: 'Connected to Wiz' };
    } catch(e: any) { return { ok: false, message: 'Connection failed', details: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const tokenRes = await fetch('https://auth.app.wiz.io/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: creds.client_id, client_secret: creds.client_secret, audience: 'wiz-api' }),
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    const query = `query { issues(first:100, filterBy:{status:[OPEN], severity:[CRITICAL,HIGH]}) { nodes { id title severity status createdAt type entitySnapshot { id name type subscriptionExternalId } } } }`;
    const res = await fetch(creds.api_endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    return (data.data?.issues?.nodes || []).map((i: any): NormalisedAlert => ({
      id: safeId('wiz', i.id),
      source: 'Wiz',
      sourceId: i.id,
      title: i.title || 'Wiz issue',
      severity: normSev(i.severity),
      device: i.entitySnapshot?.name || i.entitySnapshot?.id || 'Cloud resource',
      time: i.createdAt || new Date().toISOString(),
      rawTime: new Date(i.createdAt || Date.now()).getTime(),
      description: `Wiz ${i.type || 'issue'}: ${i.title}`,
      verdict: 'Pending', confidence: i.severity === 'CRITICAL' ? 90 : 70,
      tags: ['wiz', 'cspm', i.type].filter(Boolean),
      raw: i,
    }));
  },
};

// ─── Proofpoint ───────────────────────────────────────────────────────────────
export const proofpoint: IntegrationAdapter = {
  id: 'proofpoint',
  name: 'Proofpoint',
  credentialFields: [
    { key: 'principal', label: 'Service Principal' },
    { key: 'secret', label: 'Secret', secret: true },
  ],
  async testConnection(creds) {
    try {
      const res = await fetch('https://tap-api-v2.proofpoint.com/v2/siem/all?format=json&sinceSeconds=3600', {
        headers: { Authorization: `Basic ${btoa(`${creds.principal}:${creds.secret}`)}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, message: 'Connected to Proofpoint TAP' };
    } catch(e: any) { return { ok: false, message: 'Connection failed', details: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const sinceSeconds = since ? Math.floor((Date.now() - since) / 1000) : 86400;
    const res = await fetch(`https://tap-api-v2.proofpoint.com/v2/siem/all?format=json&sinceSeconds=${sinceSeconds}`, {
      headers: { Authorization: `Basic ${btoa(`${creds.principal}:${creds.secret}`)}` },
    });
    const data = await res.json();
    const clicks = (data.clicksPermitted || []).concat(data.clicksBlocked || []);
    const messages = (data.messagesDelivered || []).concat(data.messagesBlocked || []);
    const all = [...clicks, ...messages];
    return all.slice(0, 100).map((e: any): NormalisedAlert => ({
      id: safeId('pp', e.GUID || e.messageID || Math.random()),
      source: 'Proofpoint',
      sourceId: e.GUID || e.messageID,
      title: e.subject || e.url || 'Proofpoint email threat',
      severity: e.threatStatus === 'active' ? 'High' : 'Medium',
      device: e.recipient?.[0] || e.recipientAddress || 'Unknown',
      user: e.recipient?.[0],
      time: e.messageTime || e.clickTime || new Date().toISOString(),
      rawTime: new Date(e.messageTime || e.clickTime || Date.now()).getTime(),
      description: `Proofpoint: ${e.classification || e.threatType || 'email threat'} — ${e.subject || e.url || ''}`,
      verdict: 'Pending', confidence: e.threatStatus === 'active' ? 85 : 60,
      tags: ['proofpoint', 'email', e.classification, e.threatType].filter(Boolean),
      raw: e,
    }));
  },
};

// ─── Mimecast ─────────────────────────────────────────────────────────────────
export const mimecast: IntegrationAdapter = {
  id: 'mimecast',
  name: 'Mimecast',
  credentialFields: [
    { key: 'base_url', label: 'Base URL', placeholder: 'https://eu-api.mimecast.com' },
    { key: 'client_id', label: 'Client ID' },
    { key: 'client_secret', label: 'Client Secret', secret: true },
  ],
  async testConnection(creds) {
    try {
      const res = await fetch(`${creds.base_url}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'client_credentials', client_id: creds.client_id, client_secret: creds.client_secret }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, message: 'Connected to Mimecast' };
    } catch(e: any) { return { ok: false, message: 'Connection failed', details: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const tokenRes = await fetch(`${creds.base_url}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: creds.client_id, client_secret: creds.client_secret }),
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    const fromDate = since ? new Date(since).toISOString() : new Date(Date.now()-86400000).toISOString();
    const res = await fetch(`${creds.base_url}/api/ttp/url/get-logs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [{ from: fromDate, scanResult: 'malicious', maxResults: 100 }] }),
    });
    const data = await res.json();
    return (data.data?.[0]?.clickLogs || []).map((l: any): NormalisedAlert => ({
      id: safeId('mimecast', l.messageId || Math.random()),
      source: 'Mimecast',
      sourceId: l.messageId,
      title: `Malicious URL click: ${l.url?.slice(0,60) || 'unknown'}`,
      severity: l.actions === 'Block' ? 'High' : 'Medium',
      device: l.userEmailAddress || 'Unknown',
      user: l.userEmailAddress,
      time: l.date || new Date().toISOString(),
      rawTime: new Date(l.date || Date.now()).getTime(),
      description: `Mimecast TTP: User clicked malicious URL. Action: ${l.actions || 'N/A'}`,
      verdict: 'Pending', confidence: 80,
      tags: ['mimecast', 'email', 'url'],
      raw: l,
    }));
  },
};

// ─── Okta ─────────────────────────────────────────────────────────────────────
export const okta: IntegrationAdapter = {
  id: 'okta',
  name: 'Okta',
  credentialFields: [
    { key: 'domain', label: 'Okta Domain', placeholder: 'https://company.okta.com' },
    { key: 'api_token', label: 'API Token', secret: true },
  ],
  async testConnection(creds) {
    try {
      const res = await fetch(`${creds.domain}/api/v1/users/me`, {
        headers: { Authorization: `SSWS ${creds.api_token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, message: 'Connected to Okta' };
    } catch(e: any) { return { ok: false, message: 'Connection failed', details: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const since_iso = since ? new Date(since).toISOString() : new Date(Date.now()-86400000).toISOString();
    // Get system logs for suspicious events
    const res = await fetch(`${creds.domain}/api/v1/logs?since=${since_iso}&limit=100&filter=eventType+eq+"user.authentication.auth_via_mfa"`, {
      headers: { Authorization: `SSWS ${creds.api_token}`, Accept: 'application/json' },
    });
    const events = await res.json();
    // Also get security events
    const secRes = await fetch(`${creds.domain}/api/v1/logs?since=${since_iso}&limit=100&filter=severity+eq+"WARN"+or+severity+eq+"ERROR"`, {
      headers: { Authorization: `SSWS ${creds.api_token}`, Accept: 'application/json' },
    });
    const secEvents = await secRes.json();
    const allEvents = [...(Array.isArray(events) ? events : []), ...(Array.isArray(secEvents) ? secEvents : [])].slice(0, 100);
    return allEvents.map((e: any): NormalisedAlert => ({
      id: safeId('okta', e.uuid),
      source: 'Okta',
      sourceId: e.uuid,
      title: e.displayMessage || e.eventType || 'Okta security event',
      severity: normSev(e.severity),
      device: e.client?.userAgent?.os || e.device?.name || 'Unknown',
      user: e.actor?.alternateId || e.actor?.displayName,
      ip: e.client?.ipAddress,
      time: e.published || new Date().toISOString(),
      rawTime: new Date(e.published || Date.now()).getTime(),
      description: e.displayMessage || e.eventType,
      verdict: 'Pending', confidence: e.severity === 'ERROR' ? 75 : 50,
      tags: ['okta', 'identity', e.eventType?.split('.')?.[0]].filter(Boolean),
      raw: e,
    }));
  },
};

// ─── Zscaler ──────────────────────────────────────────────────────────────────
export const zscaler: IntegrationAdapter = {
  id: 'zscaler',
  name: 'Zscaler',
  credentialFields: [
    { key: 'cloud', label: 'Zscaler Cloud', placeholder: 'https://zsapi.zscaler.net' },
    { key: 'username', label: 'Username / API Key Name' },
    { key: 'password', label: 'Password', secret: true },
    { key: 'api_key', label: 'API Key', secret: true },
  ],
  async testConnection(creds) {
    try {
      // Authenticate
      const now = Date.now().toString();
      const key = now.substring(now.length - 6);
      const n = parseInt(key) >> 1;
      const obfKey = `${creds.api_key.substring(0,n)}${now.substring(now.length-1-(n%6), now.length-1-(n%6)+1)}${creds.api_key.substring(n+1)}`;
      const authRes = await fetch(`${creds.cloud}/api/v1/authenticatedSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: creds.username, password: creds.password, apiKey: obfKey, timestamp: now }),
      });
      if (!authRes.ok) throw new Error(`Auth HTTP ${authRes.status}`);
      return { ok: true, message: 'Connected to Zscaler' };
    } catch(e: any) { return { ok: false, message: 'Connection failed', details: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const now = Date.now().toString();
    const key = now.substring(now.length - 6);
    const n = parseInt(key) >> 1;
    const obfKey = `${creds.api_key.substring(0,n)}${now.substring(now.length-1-(n%6), now.length-1-(n%6)+1)}${creds.api_key.substring(n+1)}`;
    const authRes = await fetch(`${creds.cloud}/api/v1/authenticatedSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: creds.username, password: creds.password, apiKey: obfKey, timestamp: now }),
    });
    const setCookie = authRes.headers.get('set-cookie') || '';
    const cookie = setCookie.split(';')[0];
    const res = await fetch(`${creds.cloud}/api/v1/auditlogEntryReport`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ startTime: Math.floor((since || Date.now()-86400000)/1000), endTime: Math.floor(Date.now()/1000), actionTypes: ['SIGN_IN', 'BLOCK', 'CAUTION'] }),
    });
    const data = await res.json();
    return (data || []).slice(0, 100).map((e: any): NormalisedAlert => ({
      id: safeId('zs', e.time, Math.random()),
      source: 'Zscaler',
      sourceId: String(e.time),
      title: `Zscaler: ${e.action || 'policy event'} — ${e.requestedURL || e.category || 'N/A'}`,
      severity: e.action === 'BLOCK' ? 'High' : 'Medium',
      device: e.clientIP || 'Unknown',
      user: e.login,
      ip: e.clientIP,
      time: new Date((e.time || Date.now()/1000) * 1000).toISOString(),
      rawTime: (e.time || Date.now()/1000) * 1000,
      description: `Zscaler ${e.actionType}: ${e.requestedURL || e.category}`,
      verdict: 'Pending', confidence: e.action === 'BLOCK' ? 80 : 50,
      tags: ['zscaler', 'network', e.action].filter(Boolean),
      raw: e,
    }));
  },
};

// ─── Carbon Black ─────────────────────────────────────────────────────────────
export const carbonblack: IntegrationAdapter = {
  id: 'carbonblack',
  name: 'Carbon Black',
  credentialFields: [
    { key: 'host', label: 'CB Cloud URL', placeholder: 'https://defense.conferdeploy.net' },
    { key: 'org_key', label: 'Org Key' },
    { key: 'api_id', label: 'API ID' },
    { key: 'api_secret', label: 'API Secret Key', secret: true },
  ],
  async testConnection(creds) {
    try {
      const res = await fetch(`${creds.host}/appservices/v6/orgs/${creds.org_key}/policies`, {
        headers: { 'X-Auth-Token': `${creds.api_secret}/${creds.api_id}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, message: 'Connected to Carbon Black Cloud' };
    } catch(e: any) { return { ok: false, message: 'Connection failed', details: e.message }; }
  },
  async fetchAlerts(creds, since) {
    const startTime = since ? new Date(since).toISOString() : new Date(Date.now()-86400000).toISOString();
    const body = JSON.stringify({ criteria: { minimum_severity: 3, create_time: { start: startTime } }, rows: 100, sort: [{ field: 'create_time', order: 'DESC' }] });
    const res = await fetch(`${creds.host}/api/alerts/v7/orgs/${creds.org_key}/alerts/_search`, {
      method: 'POST',
      headers: { 'X-Auth-Token': `${creds.api_secret}/${creds.api_id}`, 'Content-Type': 'application/json' },
      body,
    });
    const data = await res.json();
    return (data.results || []).map((a: any): NormalisedAlert => ({
      id: safeId('cb', a.id),
      source: 'Carbon Black',
      sourceId: a.id,
      title: a.reason || a.type || 'Carbon Black alert',
      severity: normSev(a.severity),
      device: a.device_name || a.device_id || 'Unknown',
      user: a.device_username,
      ip: a.device_internal_ip,
      time: a.create_time || new Date().toISOString(),
      rawTime: new Date(a.create_time || Date.now()).getTime(),
      mitre: a.ttps?.[0],
      description: a.reason || a.type,
      verdict: a.status === 'DISMISSED' ? 'FP' : 'Pending',
      confidence: a.severity * 10,
      tags: ['carbonblack', 'edr', a.type].filter(Boolean),
      raw: a,
    }));
  },
};

// ─── Secureworks Taegis ───────────────────────────────────────────────────────
export const taegis: IntegrationAdapter = {
  id: 'taegis',
  name: 'Secureworks Taegis',
  credentialFields: [
    { key: 'client_id', label: 'Client ID' },
    { key: 'client_secret', label: 'Client Secret', secret: true },
    { key: 'region', label: 'Region', placeholder: 'us1 / eu1 / us2' },
  ],
  async testConnection(creds) {
    try {
      const params = new URLSearchParams({ grant_type: 'client_credentials', client_id: creds.client_id, client_secret: creds.client_secret });
      const tokenRes = await fetch('https://api.ctpx.secureworks.com/auth/api/v2/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      if (!tokenRes.ok) {
        const err = await tokenRes.text().catch(()=>'');
        throw new Error(`Auth HTTP ${tokenRes.status}: ${err.slice(0,100)}`);
      }
      const d = await tokenRes.json();
      if (!d.access_token) throw new Error('No access_token in response');
      return { ok: true, message: 'Connected to Secureworks Taegis' };
    } catch(e: any) { return { ok: false, message: 'Connection failed: ' + e.message }; }
  },
  async fetchAlerts(creds, since) {
    const region = creds.region || 'us1';
    const params = new URLSearchParams({ grant_type: 'client_credentials', client_id: creds.client_id, client_secret: creds.client_secret });
    const tokenRes = await fetch('https://api.ctpx.secureworks.com/auth/api/v2/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    // Taegis GraphQL - using official documented schema
    // Ref: https://docs.taegis.secureworks.com/apis/using_alerts_api/
    const graphqlHost = region === 'us1' || !region
      ? 'api.ctpx.secureworks.com'
      : `api.${region}.taegis.secureworks.com`;
    const query = `query alertsServiceSearch($in: SearchRequestInput) {
      alertsServiceSearch(in: $in) {
        reason
        status
        alerts {
          total_results
          list {
            id
            status
            resolution_reason
            metadata {
              title
              severity
              confidence
              description
              created_at { seconds }
            }
          }
        }
      }
    }`;
    const variables = {
      in: {
        limit: 100,
        offset: 0,
        cql_query: "FROM alert WHERE severity >= 0.6 AND status = 'OPEN' EARLIEST=-7d",
      }
    };
    const res = await fetch(`https://${graphqlHost}/graphql`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(()=>'');
      throw new Error(`Taegis GraphQL error: HTTP ${res.status} ${errText.slice(0,200)}`);
    }
    const data = await res.json();
    if (data.errors) throw new Error(`Taegis query error: ${data.errors[0]?.message}`);
    const alertList = data.data?.alertsServiceSearch?.alerts?.list || [];
    return alertList.map((a: any): NormalisedAlert => {
      const meta = a.metadata || {};
      const createdMs = meta.created_at?.seconds ? meta.created_at.seconds * 1000 : Date.now();
      return {
        id: safeId('taegis', a.id),
        source: 'Taegis XDR',
        sourceId: a.id,
        title: meta.title || meta.description || 'Taegis alert',
        severity: normSev(meta.severity),
        device: 'Unknown',
        time: new Date(createdMs).toISOString(),
        rawTime: createdMs,
        description: meta.description || meta.title,
        verdict: a.status === 'FALSE_POSITIVE' || a.resolution_reason === 'FALSE_POSITIVE' ? 'FP' : 'Pending',
        confidence: meta.confidence ? Math.round(meta.confidence * 100) : 70,
        tags: ['taegis', 'xdr', a.status].filter(Boolean),
        raw: a,
      };
    });
  },
};