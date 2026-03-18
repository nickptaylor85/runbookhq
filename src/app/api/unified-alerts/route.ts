import { NextResponse } from 'next/server';
import { getDefenderToken, defenderAPI, getMDEToken, mdeAPI, getTaegisToken, taegisGraphQL, getConfiguredTools } from '@/lib/api-clients';
import { getTenantFromRequest, loadToolConfigs } from '@/lib/config-store';

export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  // Check for demo mode
  const tenantConfigs = await loadToolConfigs(tenantId || undefined);
  if (tenantConfigs?.tools?.['_demo']?.enabled) {
    const { DEMO_DEFENDER_ALERTS, DEMO_TAEGIS_ALERTS } = await import('@/lib/demo-data');
    const all = [...DEMO_DEFENDER_ALERTS, ...DEMO_TAEGIS_ALERTS].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return NextResponse.json({ alerts: all, demo: true, source: 'demo-mode' });
  }

  const tools = await getConfiguredTools(tenantId || undefined);
  const alerts: any[] = [];
  const errors: string[] = [];

  if (tools.defender) {
    try {
      const token = await getMDEToken();
      if (token) {
        const data = await mdeAPI('/alerts?$top=20&$orderby=alertCreationTime desc', token);
        if (data.value) {
          alerts.push(...data.value.map((a: any) => ({
            id: a.id, title: a.title, severity: a.severity?.toLowerCase(),
            status: a.status?.toLowerCase(), source: 'Defender MDE',
            category: a.category, device: a.computerDnsName,
            user: a.relatedUser?.userName, timestamp: a.alertCreationTime,
            mitre: a.mitreTechniques?.[0] || null,
          })));
        }
      }
    } catch (e) { errors.push('Defender MDE: ' + (e as Error).message); }
  }

  if (tools.defender) {
    try {
      const token = await getDefenderToken();
      if (token) {
        const data = await defenderAPI('/incidents?$top=10&$orderby=createdDateTime desc', token);
        if (data.value) {
          alerts.push(...data.value.map((i: any) => ({
            id: i.incidentId, title: i.incidentName, severity: i.severity?.toLowerCase(),
            status: i.status?.toLowerCase(), source: 'Defender XDR',
            category: i.classification || 'Incident', device: null,
            user: null, timestamp: i.createdDateTime, mitre: null,
          })));
        }
      }
    } catch (e) { errors.push('Defender XDR: ' + (e as Error).message); }
  }

  if (tools.taegis) {
    try {
      const taegisAuth = await getTaegisToken(tenantId || undefined);
      if (taegisAuth) {
        const query = `query { alertsServiceSearch(in: { cql_query: "FROM alert WHERE severity >= 0.4 EARLIEST=-7d", offset: 0, limit: 50 }) { reason alerts { total_results list { id metadata { title severity } status } } } }`;
        const data = await taegisGraphQL(query, {}, taegisAuth.token, taegisAuth.base);
        const alertList = data.data?.alertsServiceSearch?.alerts?.list || [];
        if (alertList.length > 0) {
          alerts.push(...alertList.map((a: any) => ({
            id: a.id, title: a.metadata?.title || 'Taegis Alert',
            severity: a.metadata?.severity >= 0.7 ? 'critical' : a.metadata?.severity >= 0.5 ? 'high' : a.metadata?.severity >= 0.3 ? 'medium' : 'low',
            status: (a.status || 'open').toLowerCase(), source: 'Taegis XDR',
            category: null, device: null, user: null,
            timestamp: a.id?.match(/:(\d+):/)?.[1] ? new Date(parseInt(a.id.match(/:(\d+):/)[1])).toISOString() : new Date().toISOString(), mitre: null,
          })));
        }
        if (data.errors) errors.push('Taegis GraphQL: ' + JSON.stringify(data.errors).substring(0, 200));
      } else {
        errors.push('Taegis: Failed to obtain auth token');
      }
    } catch (e) { errors.push('Taegis: ' + (e as Error).message); }
  }

  if (alerts.length === 0) {
    return NextResponse.json({ demo: false, alerts: [], errors: errors.length ? errors : ['No alerts from connected tools'], noTools: !Object.values(tools).some(Boolean), _debug: { tools, errorCount: errors.length } });
  }


    // CrowdStrike Falcon
    if (tools.crowdstrike) {
      try {
        const { getCrowdStrikeToken, crowdStrikeAPI } = await import('@/lib/api-clients');
        const csAuth = await getCrowdStrikeToken(tenantId || undefined);
        if (csAuth) {
          const ids = await crowdStrikeAPI('/alerts/queries/alerts/v2?limit=20&sort=created_time.desc', csAuth.token, csAuth.base);
          if (ids?.resources?.length) {
            const details = await crowdStrikeAPI('/alerts/entities/alerts/v2', csAuth.token, csAuth.base);
            (details?.resources || []).forEach((a: any) => {
              alerts.push({ id: 'cs-' + (a.composite_id || a.id), title: a.name || a.description || 'CrowdStrike Detection', severity: a.severity >= 4 ? 'critical' : a.severity >= 3 ? 'high' : a.severity >= 2 ? 'medium' : 'low', status: (a.status || 'new').toLowerCase(), source: 'CrowdStrike', device: a.hostname || '', user: a.user_name || '', timestamp: a.created_timestamp || new Date().toISOString(), mitre: a.tactic || '' });
            });
          }
        }
      } catch(e) { errors.push('CrowdStrike: ' + (e as Error).message); }
    }

    // SentinelOne
    if (tools.sentinelone) {
      try {
        const { sentinelOneAPI } = await import('@/lib/api-clients');
        const threats = await sentinelOneAPI('/threats?limit=20&sortBy=createdAt&sortOrder=desc', tenantId || undefined);
        (threats?.data || []).forEach((t: any) => {
          alerts.push({ id: 's1-' + t.id, title: t.threatInfo?.threatName || 'SentinelOne Threat', severity: t.threatInfo?.confidenceLevel === 'malicious' ? 'critical' : 'high', status: (t.threatInfo?.incidentStatus || 'new').toLowerCase(), source: 'SentinelOne', device: t.agentRealtimeInfo?.agentComputerName || '', user: '', timestamp: t.threatInfo?.createdAt || new Date().toISOString(), mitre: '' });
        });
      } catch(e) { errors.push('SentinelOne: ' + (e as Error).message); }
    }

    // Cortex XDR
    if (tools.cortex) {
      try {
        const { cortexAPI } = await import('@/lib/api-clients');
        const incidents = await cortexAPI('/incidents/get_incidents', { search_from: 0, search_to: 20, sort: { field: 'creation_time', keyword: 'desc' } }, tenantId || undefined);
        (incidents?.reply?.incidents || []).forEach((inc: any) => {
          alerts.push({ id: 'cx-' + inc.incident_id, title: inc.description || 'Cortex XDR Incident', severity: inc.severity === 'high' ? 'high' : inc.severity === 'critical' ? 'critical' : 'medium', status: (inc.status || 'new').toLowerCase(), source: 'Cortex XDR', device: inc.hosts?.join(', ') || '', user: inc.users?.join(', ') || '', timestamp: new Date(inc.creation_time).toISOString(), mitre: '' });
        });
      } catch(e) { errors.push('Cortex XDR: ' + (e as Error).message); }
    }

    // Splunk Notable Events
    if (tools.splunk) {
      try {
        const { splunkAPI } = await import('@/lib/api-clients');
        const r = await splunkAPI('/services/search/jobs/export?output_mode=json&search=search%20index%3Dnotable%20%7C%20head%2020', tenantId || undefined);
        (r?.results || []).forEach((ev: any) => {
          alerts.push({ id: 'sp-' + (ev._cd || ev.event_id || Math.random()), title: ev.rule_name || ev.search_name || 'Splunk Notable', severity: ev.urgency === 'critical' ? 'critical' : ev.urgency === 'high' ? 'high' : 'medium', status: (ev.status || 'new').toLowerCase(), source: 'Splunk', device: ev.src || ev.dest || '', user: ev.user || '', timestamp: ev._time || new Date().toISOString(), mitre: '' });
        });
      } catch(e) { errors.push('Splunk: ' + (e as Error).message); }
    }

    // Microsoft Sentinel
    if (tools.sentinel) {
      try {
        const { getSentinelToken } = await import('@/lib/api-clients');
        const auth = await getSentinelToken(tenantId || undefined);
        if (auth) {
          const r = await fetch(`https://management.azure.com/subscriptions/${auth.workspaceId}/providers/Microsoft.SecurityInsights/incidents?api-version=2023-11-01&$top=20&$orderby=properties/createdTimeUtc desc`, { headers: { Authorization: `Bearer ${auth.token}` } });
          const d = await r.json();
          (d?.value || []).forEach((inc: any) => {
            alerts.push({ id: 'sn-' + inc.name, title: inc.properties?.title || 'Sentinel Incident', severity: (inc.properties?.severity || 'medium').toLowerCase(), status: (inc.properties?.status || 'new').toLowerCase(), source: 'Sentinel', device: '', user: '', timestamp: inc.properties?.createdTimeUtc || new Date().toISOString(), mitre: '' });
          });
        }
      } catch(e) { errors.push('Sentinel: ' + (e as Error).message); }
    }

    // Darktrace
    if (tools.darktrace) {
      try {
        const { darktraceAPI } = await import('@/lib/api-clients');
        const breaches = await darktraceAPI('/modelbreaches?count=20', tenantId || undefined);
        (breaches || []).forEach((b: any) => {
          alerts.push({ id: 'dt-' + b.pbid, title: b.model?.name || 'Darktrace Model Breach', severity: b.score >= 0.8 ? 'critical' : b.score >= 0.5 ? 'high' : 'medium', status: 'new', source: 'Darktrace', device: b.device?.hostname || b.device?.ip || '', user: '', timestamp: new Date(b.time * 1000).toISOString(), mitre: '' });
        });
      } catch(e) { errors.push('Darktrace: ' + (e as Error).message); }
    }

    // Carbon Black
    if (tools.carbonblack) {
      try {
        const { carbonBlackAPI } = await import('@/lib/api-clients');
        const r = await carbonBlackAPI('/alerts/search', tenantId || undefined);
        (r?.results || []).forEach((a: any) => {
          alerts.push({ id: 'cb-' + a.id, title: a.reason || 'Carbon Black Alert', severity: a.severity >= 8 ? 'critical' : a.severity >= 5 ? 'high' : 'medium', status: (a.workflow?.state || 'open').toLowerCase(), source: 'Carbon Black', device: a.device_name || '', user: a.device_username || '', timestamp: a.create_time || new Date().toISOString(), mitre: '' });
        });
      } catch(e) { errors.push('Carbon Black: ' + (e as Error).message); }
    }

    // Wiz
    if (tools.wiz) {
      try {
        const { wizGraphQL } = await import('@/lib/api-clients');
        const r = await wizGraphQL('{ issues(first: 20, orderBy: { field: SEVERITY, direction: DESC }) { nodes { id title severity status firstDetectedAt resource { name type } } } }', {}, tenantId || undefined);
        (r?.data?.issues?.nodes || []).forEach((iss: any) => {
          alerts.push({ id: 'wiz-' + iss.id, title: iss.title || 'Wiz Issue', severity: iss.severity === 'CRITICAL' ? 'critical' : iss.severity === 'HIGH' ? 'high' : 'medium', status: (iss.status || 'open').toLowerCase(), source: 'Wiz', device: iss.resource?.name || '', user: '', timestamp: iss.firstDetectedAt || new Date().toISOString(), mitre: '' });
        });
      } catch(e) { errors.push('Wiz: ' + (e as Error).message); }
    }

    // Proofpoint TAP
    if (tools.proofpoint) {
      try {
        const { proofpointAPI } = await import('@/lib/api-clients');
        const since = new Date(Date.now() - 86400000).toISOString();
        const r = await proofpointAPI('/siem/all?sinceTime=' + encodeURIComponent(since) + '&format=json', tenantId || undefined);
        (r?.messagesDelivered || []).slice(0, 10).forEach((m: any) => {
          alerts.push({ id: 'pp-' + (m.GUID || Math.random()), title: 'Phishing: ' + (m.subject || 'Suspicious email'), severity: m.threatsInfoMap?.[0]?.classification === 'phish' ? 'high' : 'medium', status: 'new', source: 'Proofpoint', device: '', user: m.recipient?.join(', ') || '', timestamp: m.messageTime || new Date().toISOString(), mitre: 'T1566' });
        });
      } catch(e) { errors.push('Proofpoint: ' + (e as Error).message); }
    }

  const filtered = alerts.filter(a => a.severity === 'critical');
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return NextResponse.json({ demo: false, alerts: filtered, totalBeforeFilter: alerts.length, errors: errors.length ? errors : undefined, _debug: { tools, sources: [...new Set(alerts.map((a:any)=>a.source))] } });
}
