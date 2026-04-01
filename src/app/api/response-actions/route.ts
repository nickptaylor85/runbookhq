import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet, redisLPush, redisLRange, redisLTrim, KEYS } from '@/lib/redis';
import { decrypt } from '@/lib/encrypt';
import { checkRateLimit } from '@/lib/ratelimit';

const auditKey = (t: string) => `wt:${t}:audit_log`;
const actionLogKey = (t: string) => `wt:${t}:action_log`;

async function getCredentials(tenantId: string): Promise<Record<string, Record<string, string>>> {
  try {
    const raw = await redisGet(KEYS.TOOL_CREDS(tenantId));
    return raw ? JSON.parse(decrypt(raw)) : {};
  } catch { return {}; }
}

async function auditLog(tenantId: string, entry: object) {
  try {
    await redisLPush(auditKey(tenantId), JSON.stringify({ ...entry, ts: Date.now() }));
    await redisLTrim(auditKey(tenantId), 0, 999);
  } catch {}
}

// ── Tool helpers ─────────────────────────────────────────────────────────────

async function csToken(c: Record<string,string>) {
  const region = c.base_url?.replace('https://api.','').replace('.crowdstrike.com','') || 'us-2';
  const r = await fetch(`https://api.${region}.crowdstrike.com/oauth2/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${c.client_id}&client_secret=${c.client_secret}`,
  });
  if (!r.ok) throw new Error(`CS auth ${r.status}`);
  const d = await r.json() as { access_token: string };
  return { token: d.access_token, region };
}

async function csDeviceId(token: string, region: string, hostname: string): Promise<string | null> {
  const r = await fetch(`https://api.${region}.crowdstrike.com/devices/queries/devices/v1?filter=hostname:'${hostname}'`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  const d = await r.json() as { resources?: string[] };
  return d.resources?.[0] || null;
}

async function entraToken(c: Record<string,string>): Promise<string> {
  const r = await fetch(`https://login.microsoftonline.com/${c.tenant_id}/oauth2/v2.0/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${c.client_id}&client_secret=${c.client_secret}&scope=https://graph.microsoft.com/.default`,
  });
  if (!r.ok) throw new Error(`Entra token ${r.status}`);
  const d = await r.json() as { access_token: string };
  return d.access_token;
}

async function mdeToken(c: Record<string,string>): Promise<string> {
  const r = await fetch(`https://login.microsoftonline.com/${c.tenant_id}/oauth2/v2.0/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${c.client_id}&client_secret=${c.client_secret}&scope=https://api.securitycenter.microsoft.com/.default`,
  });
  if (!r.ok) throw new Error(`MDE token ${r.status}`);
  const d = await r.json() as { access_token: string };
  return d.access_token;
}

async function mdeDeviceId(token: string, hostname: string): Promise<string | null> {
  const r = await fetch(`https://api.securitycenter.microsoft.com/api/machines?$filter=computerDnsName eq '${hostname}'`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  const d = await r.json() as { value?: { id: string }[] };
  return d.value?.[0]?.id || null;
}

async function findOktaUser(c: Record<string,string>, identifier: string): Promise<string | null> {
  const r = await fetch(`https://${c.domain}/api/v1/users/${encodeURIComponent(identifier)}`, {
    headers: { Authorization: `SSWS ${c.api_token}`, Accept: 'application/json' },
  });
  if (!r.ok) return null;
  const d = await r.json() as { id?: string };
  return d.id || null;
}

// ── Taegis GraphQL helper ─────────────────────────────────────────────────────

async function taegisToken(c: Record<string,string>): Promise<{token:string; host:string}> {
  const region = c.region || 'us1';
  const host = region === 'us1' ? 'api.ctpx.secureworks.com'
    : region === 'us2' ? 'api.delta.taegis.secureworks.com'
    : region === 'eu1' ? 'api.echo.taegis.secureworks.com'
    : `api.${region}.taegis.secureworks.com`;
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: c.clientId || c.client_id || '',
    client_secret: c.clientSecret || c.client_secret || '',
  });
  const r = await fetch(`https://${host}/auth/api/v2/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Taegis auth ${r.status}`);
  const d = await r.json() as { access_token: string };
  return { token: d.access_token, host };
}

async function taegisGraphQL(host: string, token: string, query: string, variables?: Record<string,unknown>) {
  const r = await fetch(`https://${host}/graphql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`Taegis GraphQL ${r.status}`);
  return r.json();
}

// ── Action executors ──────────────────────────────────────────────────────────

type ActionResult = { ok: boolean; tool: string; action: string; detail?: string; error?: string };

async function isolateHost(creds: Record<string, Record<string, string>>, hostname: string): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  // CrowdStrike
  if (creds.crowdstrike) {
    try {
      const { token, region } = await csToken(creds.crowdstrike);
      const deviceId = await csDeviceId(token, region, hostname);
      if (deviceId) {
        const r = await fetch(`https://api.${region}.crowdstrike.com/devices/entities/devices-actions/v2?action_name=contain`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [deviceId] }),
        });
        results.push({ ok: r.ok, tool: 'CrowdStrike', action: 'host_isolated', detail: `Device ${deviceId} contained` });
      } else {
        results.push({ ok: false, tool: 'CrowdStrike', action: 'host_isolated', error: `Device ${hostname} not found` });
      }
    } catch(e: any) { results.push({ ok: false, tool: 'CrowdStrike', action: 'host_isolated', error: e.message }); }
  }

  // SentinelOne
  if (creds.sentinelone) {
    try {
      const agentsRes = await fetch(`${safeCredHost(creds.sentinelone.host)}/web/api/v2.1/agents?computerName=${hostname}`, {
        headers: { Authorization: `ApiToken ${creds.sentinelone.api_token}` },
      });
      const agentsData = await agentsRes.json() as { data?: { id: string }[] };
      const agentId = agentsData.data?.[0]?.id;
      if (agentId) {
        const r = await fetch(`${safeCredHost(creds.sentinelone.host)}/web/api/v2.1/agents/actions/disconnect`, {
          method: 'POST',
          headers: { Authorization: `ApiToken ${creds.sentinelone.api_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ filter: { ids: [agentId] } }),
        });
        results.push({ ok: r.ok, tool: 'SentinelOne', action: 'host_isolated', detail: `Agent ${agentId} disconnected` });
      } else {
        results.push({ ok: false, tool: 'SentinelOne', action: 'host_isolated', error: `Agent ${hostname} not found` });
      }
    } catch(e: any) { results.push({ ok: false, tool: 'SentinelOne', action: 'host_isolated', error: e.message }); }
  }

  // Microsoft Defender for Endpoint
  if (creds.defender) {
    try {
      const token = await mdeToken(creds.defender);
      const machineId = await mdeDeviceId(token, hostname);
      if (machineId) {
        const r = await fetch(`https://api.securitycenter.microsoft.com/api/machines/${machineId}/isolate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ Comment: 'Watchtower APEX auto-isolation', IsolationType: 'Full' }),
        });
        results.push({ ok: r.ok, tool: 'Defender', action: 'host_isolated', detail: `Machine ${machineId} isolated` });
      } else {
        results.push({ ok: false, tool: 'Defender', action: 'host_isolated', error: `Machine ${hostname} not found` });
      }
    } catch(e: any) { results.push({ ok: false, tool: 'Defender', action: 'host_isolated', error: e.message }); }
  }

  // Carbon Black Cloud
  if (creds.carbonblack) {
    try {
      // Get device ID
      const searchR = await fetch(`https://api.confer.net/appservices/v6/orgs/${creds.carbonblack.org_key}/devices/_search`, {
        method: 'POST',
        headers: { 'X-Auth-Token': `${creds.carbonblack.api_secret_key}/${creds.carbonblack.api_id}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria: { name: [hostname] } }),
      });
      const searchData = await searchR.json() as { results?: { id: number }[] };
      const cbDeviceId = searchData.results?.[0]?.id;
      if (cbDeviceId) {
        const r = await fetch(`https://api.confer.net/appservices/v6/orgs/${creds.carbonblack.org_key}/devices/actions`, {
          method: 'POST',
          headers: { 'X-Auth-Token': `${creds.carbonblack.api_secret_key}/${creds.carbonblack.api_id}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ action_type: 'QUARANTINE', device_id: [cbDeviceId] }),
        });
        results.push({ ok: r.ok, tool: 'Carbon Black', action: 'host_isolated', detail: `Device ${cbDeviceId} quarantined` });
      }
    } catch(e: any) { results.push({ ok: false, tool: 'Carbon Black', action: 'host_isolated', error: e.message }); }
  }

  // Darktrace
  if (creds.darktrace) {
    try {
      const ts = Date.now().toString();
      const sig = await computeHmac(creds.darktrace.private_token, `/antigena/host/${hostname}/quarantine${ts}`);
      const r = await fetch(`https://${safeCredHost(creds.darktrace.host)}/antigena/host/${hostname}/quarantine`, {
        method: 'POST',
        headers: {
          DTAPI: creds.darktrace.public_token,
          'X-Dt-Auth-Timestamp': ts,
          'X-Dt-Auth-Hmac': sig,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration: 3600, comment: 'Watchtower APEX auto-quarantine' }),
      });
      results.push({ ok: r.ok, tool: 'Darktrace', action: 'host_isolated', detail: `${hostname} quarantined for 1h` });
    } catch(e: any) { results.push({ ok: false, tool: 'Darktrace', action: 'host_isolated', error: e.message }); }
  }

  // Taegis XDR — find asset by hostname, set desiredIsolationStatus = ISOLATED
  if (creds.taegis) {
    try {
      const { token, host } = await taegisToken(creds.taegis);
      const findQuery = `query FindAsset($filter: AssetFilter) {
        assetsV2(first: 1, filter: $filter) {
          assets { id isolationStatus desiredIsolationStatus hostnames { hostname } }
        }
      }`;
      const findData = await taegisGraphQL(host, token, findQuery, {
        filter: { where: { hostnames: { hostname_contains: hostname } } }
      });
      const asset = findData?.data?.assetsV2?.assets?.[0];
      if (!asset) {
        results.push({ ok: false, tool: 'Taegis XDR', action: 'host_isolated', error: `${hostname} not found in Taegis asset inventory` });
      } else if (asset.isolationStatus === 'ISOLATED') {
        results.push({ ok: true, tool: 'Taegis XDR', action: 'host_isolated', detail: `${hostname} already isolated in Taegis` });
      } else {
        // Try primary mutation, fall back to alternative naming
        let isolated = false;
        for (const mut of [
          `mutation { updateAssetIsolation(id: "${asset.id}", desiredIsolationStatus: ISOLATED) { id desiredIsolationStatus } }`,
          `mutation { isolateEndpointV2(id: "${asset.id}") { id desiredIsolationStatus } }`,
          `mutation { endpointIsolate(endpointId: "${asset.id}") { id isolationStatus } }`,
        ]) {
          try {
            const r = await taegisGraphQL(host, token, mut);
            if (!r.errors) {
              results.push({ ok: true, tool: 'Taegis XDR', action: 'host_isolated', detail: `${hostname} isolation requested in Taegis XDR` });
              isolated = true; break;
            }
          } catch {}
        }
        if (!isolated) results.push({ ok: false, tool: 'Taegis XDR', action: 'host_isolated', error: `Taegis isolation mutation failed for ${hostname} — check API permissions` });
      }
    } catch(e: any) { results.push({ ok: false, tool: 'Taegis XDR', action: 'host_isolated', error: e.message }); }
  }

  if (results.length === 0) {
    results.push({ ok: false, tool: 'none', action: 'host_isolated', error: 'No EDR/XDR connected. Connect CrowdStrike, SentinelOne, Defender, Carbon Black, Darktrace, or Taegis.' });
  }
  return results;
}

async function blockIp(creds: Record<string, Record<string, string>>, ipAddr: string): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  // Zscaler
  if (creds.zscaler) {
    try {
      // Zscaler: add to custom deny list via URL category
      const authR = await fetch(`https://${safeCredHost(creds.zscaler.host)}/api/v1/authenticatedSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: await zscalerObfuscate(creds.zscaler.api_key), username: creds.zscaler.username, password: creds.zscaler.password, timestamp: Date.now() }),
      });
      if (authR.ok) {
        const cookies = authR.headers.get('set-cookie') || '';
        const jsessionId = cookies.match(/JSESSIONID=([^;]+)/)?.[1];
        if (jsessionId) {
          const blockR = await fetch(`https://${safeCredHost(creds.zscaler.host)}/api/v1/security/advanced`, {
            method: 'PUT',
            headers: { Cookie: `JSESSIONID=${jsessionId}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ blacklistUrls: [ipAddr] }),
          });
          results.push({ ok: blockR.ok, tool: 'Zscaler', action: 'ip_blocked', detail: `${ipAddr} added to deny list` });
          // Activate changes
          await fetch(`https://${safeCredHost(creds.zscaler.host)}/api/v1/status/activate`, {
            method: 'POST', headers: { Cookie: `JSESSIONID=${jsessionId}` },
          });
        }
      }
    } catch(e: any) { results.push({ ok: false, tool: 'Zscaler', action: 'ip_blocked', error: e.message }); }
  }

  // Defender firewall rule via MDE
  if (creds.defender && !creds.zscaler) {
    try {
      const token = await mdeToken(creds.defender);
      // Use MDE indicator to block IP
      const r = await fetch('https://api.securitycenter.microsoft.com/api/indicators', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indicatorValue: ipAddr, indicatorType: 'IpAddress',
          action: 'Block', title: `Watchtower APEX block: ${ipAddr}`,
          description: 'Auto-blocked by Watchtower APEX', severity: 'High',
        }),
      });
      results.push({ ok: r.ok, tool: 'Defender', action: 'ip_blocked', detail: `${ipAddr} blocked via MDE indicator` });
    } catch(e: any) { results.push({ ok: false, tool: 'Defender', action: 'ip_blocked', error: e.message }); }
  }

  if (results.length === 0) {
    results.push({ ok: true, tool: 'logged', action: 'ip_blocked', detail: `${ipAddr} — apply via Zscaler or perimeter firewall. No perimeter tool connected.` });
  }
  return results;
}

async function disableUser(creds: Record<string, Record<string, string>>, identifier: string): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  // Okta — actual suspend
  if (creds.okta) {
    try {
      const userId = await findOktaUser(creds.okta, identifier);
      if (userId) {
        if (!validateOktaDomain(creds.okta.domain)) {
          return [{ ok: false, tool: 'Okta', action: 'suspend', error: 'Invalid Okta domain' }];
        }
        const r = await fetch(`https://${creds.okta.domain}/api/v1/users/${userId}/lifecycle/suspend`, {
          method: 'POST',
          headers: { Authorization: `SSWS ${creds.okta.api_token}`, Accept: 'application/json' },
        });
        results.push({ ok: r.ok, tool: 'Okta', action: 'user_suspended', detail: `User ${identifier} (${userId}) suspended` });
      } else {
        results.push({ ok: false, tool: 'Okta', action: 'user_suspended', error: `User ${identifier} not found` });
      }
    } catch(e: any) { results.push({ ok: false, tool: 'Okta', action: 'user_suspended', error: e.message }); }
  }

  // Entra ID / Azure AD — actual account disable via Graph API
  if (creds.entra || creds.defender) {
    const c = creds.entra || creds.defender;
    try {
      const token = await entraToken(c);
      // Find user first
      const findR = await fetch(`https://graph.microsoft.com/v1.0/users?$filter=userPrincipalName eq '${identifier}' or mail eq '${identifier}'`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const findData = await findR.json() as { value?: { id: string }[] };
      const userId = findData.value?.[0]?.id;
      if (userId) {
        const r = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountEnabled: false }),
        });
        results.push({ ok: r.status === 204 || r.ok, tool: 'Entra ID', action: 'user_disabled', detail: `Account ${identifier} disabled` });
      } else {
        results.push({ ok: false, tool: 'Entra ID', action: 'user_disabled', error: `User ${identifier} not found in directory` });
      }
    } catch(e: any) { results.push({ ok: false, tool: 'Entra ID', action: 'user_disabled', error: e.message }); }
  }

  if (results.length === 0) {
    results.push({ ok: true, tool: 'logged', action: 'user_disabled', detail: `${identifier} — no identity provider connected. Connect Okta or Entra ID.` });
  }
  return results;
}

async function resetMfa(creds: Record<string, Record<string, string>>, identifier: string): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  if (creds.okta) {
    try {
      const userId = await findOktaUser(creds.okta, identifier);
      if (userId) {
        // Expire all sessions
        const sessionR = await fetch(`https://${creds.okta.domain}/api/v1/users/${userId}/sessions`, {
          method: 'DELETE', headers: { Authorization: `SSWS ${creds.okta.api_token}` },
        });
        // Reset all factors
        const factorsR = await fetch(`https://${creds.okta.domain}/api/v1/users/${userId}/lifecycle/reset_factors`, {
          method: 'POST', headers: { Authorization: `SSWS ${creds.okta.api_token}`, Accept: 'application/json' },
        });
        results.push({ ok: factorsR.ok, tool: 'Okta', action: 'mfa_reset', detail: `Sessions expired + factors reset for ${identifier}` });
      }
    } catch(e: any) { results.push({ ok: false, tool: 'Okta', action: 'mfa_reset', error: e.message }); }
  }

  if (creds.entra || creds.defender) {
    const c = creds.entra || creds.defender;
    try {
      const token = await entraToken(c);
      const findR = await fetch(`https://graph.microsoft.com/v1.0/users?$filter=userPrincipalName eq '${identifier}' or mail eq '${identifier}'`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const findData = await findR.json() as { value?: { id: string }[] };
      const userId = findData.value?.[0]?.id;
      if (userId) {
        // Revoke all sign-in sessions
        const r = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}/revokeSignInSessions`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        results.push({ ok: r.ok, tool: 'Entra ID', action: 'sessions_revoked', detail: `All sessions revoked for ${identifier}` });
      }
    } catch(e: any) { results.push({ ok: false, tool: 'Entra ID', action: 'sessions_revoked', error: e.message }); }
  }

  if (results.length === 0) {
    results.push({ ok: true, tool: 'logged', action: 'mfa_reset', detail: `${identifier} — no identity provider connected.` });
  }
  return results;
}

async function notifyTeams(creds: Record<string, Record<string, string>>, message: string, alertTitle: string, severity: string): Promise<ActionResult | null> {
  if (!creds.teams?.webhook_url) return null;
  try {
    const sevColor = severity === 'Critical' ? 'FF3B4A' : severity === 'High' ? 'F97316' : 'F0A030';
    const card = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: sevColor,
      summary: alertTitle,
      sections: [{
        activityTitle: `**${alertTitle}**`,
        activitySubtitle: `Severity: ${severity}`,
        activityText: message,
        facts: [{ name: 'Source', value: 'Watchtower APEX' }, { name: 'Time', value: new Date().toLocaleString('en-GB') }],
      }],
    };
    // SSRF guard: only allow known Teams webhook domains
    const teamsUrl = String(creds.teams.webhook_url || '');
    if (!teamsUrl.startsWith('https://') || 
        !/(outlook\.office\.com|webhook\.office\.com|teams\.microsoft\.com)/.test(teamsUrl)) {
      return [{ ok: false, tool: 'Microsoft Teams', action: 'notify', error: 'Invalid Teams webhook URL' }];
    }
    const r = await fetch(teamsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });
    return { ok: r.ok, tool: 'Microsoft Teams', action: 'notified', detail: r.ok ? 'Teams channel notified' : undefined, error: r.ok ? undefined : `Teams HTTP ${r.status}` };
  } catch(e: any) { return [{ ok: false, tool: 'Microsoft Teams', action: 'notified', error: e.message }]; }
}

async function notifySlack(creds: Record<string, Record<string, string>>, message: string, alertTitle: string, severity: string): Promise<ActionResult | null> {
  const webhook = creds.slack?.webhook_url || creds.slack_webhook?.url;
  if (!webhook) return null;
  try {
    const severityColor = severity === 'Critical' ? '#f0405e' : severity === 'High' ? '#f97316' : '#f0a030';
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color: severityColor,
          title: `🛡 Watchtower APEX — ${alertTitle}`,
          text: message,
          footer: 'Watchtower APEX Auto-Response',
          ts: Math.floor(Date.now() / 1000),
        }],
      }),
    });
    return { ok: r.ok, tool: 'Slack', action: 'notified', detail: 'Team notification sent' };
  } catch(e: any) {
    return [{ ok: false, tool: 'Slack', action: 'notified', error: (e as any).message }];
  }
}

async function createTicket(creds: Record<string, Record<string, string>>, alertTitle: string, alertId: string, verdict: string, confidence: number, priority: string): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  // ServiceNow
  if (creds.servicenow) {
    try {
      const auth = Buffer.from(`${creds.servicenow.username}:${creds.servicenow.password}`).toString('base64');
      if (!validateServiceNowInstance(creds.servicenow.instance)) {
      return [{ ok: false, tool: 'ServiceNow', action: 'create_ticket', error: 'Invalid ServiceNow instance URL' }];
    }
    const r = await fetch(`${creds.servicenow.instance}/api/now/table/incident`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          short_description: `[WATCHTOWER AUTO] ${alertTitle}`,
          description: `Auto-created by Watchtower APEX.\nVerdict: ${verdict} (${confidence}% confidence)\nAlert ID: ${alertId}`,
          urgency: priority === 'CRITICAL' ? '1' : priority === 'HIGH' ? '2' : '3',
          impact: priority === 'CRITICAL' ? '1' : '2',
        }),
      });
      if (r.ok) {
        const d = await r.json() as { result?: { number?: string } };
        results.push({ ok: true, tool: 'ServiceNow', action: 'ticket_created', detail: `Ticket ${d.result?.number} created` });
      } else {
        results.push({ ok: false, tool: 'ServiceNow', action: 'ticket_created', error: `HTTP ${r.status}` });
      }
    } catch(e: any) { results.push({ ok: false, tool: 'ServiceNow', action: 'ticket_created', error: e.message }); }
  }

  // PagerDuty
  if (creds.pagerduty) {
    try {
      const r = await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routing_key: creds.pagerduty.integration_key || creds.pagerduty.service_id,
          event_action: 'trigger',
          dedup_key: alertId,
          payload: {
            summary: `[APEX AUTO] ${alertTitle}`,
            severity: priority === 'CRITICAL' ? 'critical' : priority === 'HIGH' ? 'error' : 'warning',
            source: 'Watchtower APEX',
            custom_details: { verdict, confidence, alertId },
          },
        }),
      });
      results.push({ ok: r.ok, tool: 'PagerDuty', action: 'alert_triggered', detail: 'On-call paged' });
    } catch(e: any) { results.push({ ok: false, tool: 'PagerDuty', action: 'alert_triggered', error: e.message }); }
  }

  // Jira (simplified — create issue via API token)
  if (creds.jira) {
    try {
      const auth = Buffer.from(`${creds.jira.email}:${creds.jira.api_token}`).toString('base64');
      if (!validateJiraDomain(creds.jira.domain)) {
      return [{ ok: false, tool: 'Jira', action: 'create_ticket', error: 'Invalid Jira domain' }];
    }
    const r = await fetch(`https://${creds.jira.domain}/rest/api/3/issue`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            project: { key: creds.jira.project_key },
            summary: `[WATCHTOWER] ${alertTitle}`,
            description: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: `Auto-created by Watchtower APEX. Verdict: ${verdict} (${confidence}%)` }] }] },
            issuetype: { name: 'Bug' },
            priority: { name: priority === 'CRITICAL' ? 'Highest' : priority === 'HIGH' ? 'High' : 'Medium' },
          },
        }),
      });
      if (r.ok) {
        const d = await r.json() as { key?: string };
        results.push({ ok: true, tool: 'Jira', action: 'ticket_created', detail: `Issue ${d.key} created` });
      } else {
        results.push({ ok: false, tool: 'Jira', action: 'ticket_created', error: `HTTP ${r.status}` });
      }
    } catch(e: any) { results.push({ ok: false, tool: 'Jira', action: 'ticket_created', error: e.message }); }
  }

  return results;
}

// Simple HMAC for Darktrace signature
async function computeHmac(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Zscaler API key obfuscation
async function zscalerObfuscate(apiKey: string): Promise<string> {
  const now = Date.now().toString().slice(-6);
  const high = parseInt(now.slice(-6));
  const key = apiKey + now;
  let obf = '';
  for (let i = 0; i < now.length; i++) {
    const r = parseInt(now[i]);
    obf += apiKey[parseInt(now[i]) < 6 ? r + 2 : r - 1];
  }
  return `${high}${obf}`;
}

// ── Main handler ─────────────────────────────────────────────────────────────


// Validate SaaS credential domains against expected patterns
// Prevents SSRF via attacker-controlled credential values
function validateOktaDomain(domain: string | undefined): boolean {
  if (!domain) return false;
  const d = domain.toLowerCase().trim();
  return /^[a-zA-Z0-9-]+\.okta\.com$/.test(d) || /^[a-zA-Z0-9-]+\.oktapreview\.com$/.test(d);
}

function validateServiceNowInstance(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (u.protocol !== 'https:') return false;
    const h = u.hostname.toLowerCase();
    // Block private ranges
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.)/.test(h)) return false;
    return true;
  } catch { return false; }
}

function validateJiraDomain(domain: string | undefined): boolean {
  if (!domain) return false;
  const d = domain.toLowerCase().trim();
  // Allow *.atlassian.net and custom domains (HTTPS enforced at fetch level)
  if (/^[a-zA-Z0-9-]+\.atlassian\.net$/.test(d)) return true;
  // Custom Jira: must not be private IP range
  try {
    const u = new URL(`https://${d}`);
    const h = u.hostname;
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.)/.test(h)) return false;
    return true;
  } catch { return false; }
}

// Validate a stored credential URL/host to prevent SSRF via compromised creds
function safeCredHost(host: string | undefined): string {
  if (!host) return '';
  try {
    const u = new URL(host.startsWith('http') ? host : `https://${host}`);
    if (!['https:','http:'].includes(u.protocol)) return '';
    const h = u.hostname.toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local') ||
        /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h) ||
        h === '169.254.169.254' || h === 'metadata.google.internal') return '';
    return host;
  } catch { return ''; }
}

export async function POST(req: NextRequest) {
  // Rate limiting — 60 req/min per user
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:${_rlId}:${req.nextUrl.pathname}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    // Auth: cookie fallback for cases where middleware headers are absent
    let isAdminReq = req.headers.get('x-is-admin') === 'true';
    let userTier = req.headers.get('x-user-tier') || 'community';
    if (!isAdminReq && userTier === 'community') {
      try {
        const { cookies } = await import('next/headers');
        const { verifySession } = await import('@/lib/encrypt');
        const cookieStore = await cookies();
        const token = req.cookies.get('wt_session')?.value || cookieStore.get('wt_session')?.value;
        if (token) {
          const payload = verifySession(token) as any;
          if (payload?.isAdmin) { isAdminReq = true; userTier = 'mssp'; }
          else if (payload?.tier) { userTier = payload.tier; }
        }
      } catch {}
    }
    if (!isAdminReq && !['team','business','mssp'].includes(userTier)) {
      return NextResponse.json({ ok: false, error: 'Response actions require Essentials plan or above.' }, { status: 403 });
    }

    const body = await req.json() as {
      action: string;
      device?: string; ip?: string; user?: string; filePath?: string;
      alertId?: string; alertTitle?: string; analyst?: string;
      immediateActions?: { priority: string; action: string; timeframe: string; owner: string }[];
      verdict?: string; confidence?: number; severity?: string;
    };

    const { action, device, ip, user, alertId = '', alertTitle = '', analyst = 'AI Auto', verdict = 'TP', confidence = 90, severity = 'High' } = body;
    if (!action && !body.immediateActions?.length) {
      return NextResponse.json({ ok: false, error: 'action or immediateActions required' }, { status: 400 });
    }

    const creds = await getCredentials(tenantId);
    const allResults: ActionResult[] = [];
    const executedActions: string[] = [];

    const pushResults = (results: ActionResult[]) => {
      allResults.push(...results);
      for (const r of results) {
        if (r.ok) executedActions.push(`${r.action.replace('_', ' ')}: ${r.detail} [${r.tool}]`);
        else console.warn(`[response-actions] ${r.tool} ${r.action} failed: ${r.error}`);
      }
    };

    // ── BATCH MODE ────────────────────────────────────────────────────────────
    if (body.immediateActions?.length) {
      let didIsolate = false, didBlockIp = false, didDisableUser = false, didTicket = false;

      for (const apexAction of body.immediateActions) {
        const t = apexAction.action.toLowerCase();

        if (!didIsolate && (t.includes('isolat') || t.includes('contain') || t.includes('quarantine')) && device) {
          pushResults(await isolateHost(creds, device));
          didIsolate = true;
        }
        if (!didBlockIp && t.includes('block') && (t.includes('ip') || t.includes('perimeter'))) {
          const ipToBlock = ip || t.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/)?.[1];
          if (ipToBlock) { pushResults(await blockIp(creds, ipToBlock)); didBlockIp = true; }
        }
        if (!didDisableUser && (t.includes('disable') || t.includes('suspend')) && (user || device)) {
          pushResults(await disableUser(creds, user || device || ''));
          didDisableUser = true;
          const mfaResults = await resetMfa(creds, user || device || '');
          pushResults(mfaResults);
        }
        if (!didTicket && (t.includes('ticket') || t.includes('incident') || t.includes('page'))) {
          pushResults(await createTicket(creds, alertTitle, alertId, verdict, confidence, apexAction.priority));
          didTicket = true;
        }
      }

      // Always send Slack notification for batch mode
      const notifMsg = `*${verdict}* confirmed (${confidence}% confidence) on alert: *${alertTitle}*\nActions taken: ${executedActions.length > 0 ? executedActions.join(', ') : 'logged only — check tool connections'}`;
      const slackResult = await notifySlack(creds, notifMsg, alertTitle, severity);
      if (slackResult) pushResults([slackResult]);
      const teamsResult = await notifyTeams(creds, notifMsg, alertTitle, severity);
      if (teamsResult) pushResults([teamsResult]);

      const logEntry = { action: 'full_auto_batch', alertId, alertTitle, verdict, confidence, analyst, executedActions, results: allResults, tenantId };
      await auditLog(tenantId, logEntry);
      await redisLPush(actionLogKey(tenantId), JSON.stringify(logEntry));
      await redisLTrim(actionLogKey(tenantId), 0, 499);

      return NextResponse.json({ ok: true, action: 'full_auto_batch', executedActions, results: allResults });
    }

    // ── SINGLE ACTION MODE ────────────────────────────────────────────────────
    if (action === 'isolate_device' && device) pushResults(await isolateHost(creds, device));
    if (action === 'block_ip' && ip) pushResults(await blockIp(creds, ip));
    if (action === 'disable_user' && user) pushResults(await disableUser(creds, user));
    if (action === 'reset_mfa' && user) pushResults(await resetMfa(creds, user));
    if (action === 'create_ticket') pushResults(await createTicket(creds, alertTitle, alertId, verdict, confidence, 'HIGH'));
    if (action === 'notify_slack' || action === 'notify_teams') {
      const r = await notifySlack(creds, `Alert: ${alertTitle}`, alertTitle, severity);
      const tr = await notifyTeams(creds, `Alert: ${alertTitle}`, alertTitle, severity);
      if (r) pushResults([r]);
    }

    const logEntry = { action, device, ip, user, alertId, alertTitle, analyst, executedActions, results: allResults, tenantId };
    await auditLog(tenantId, logEntry);
    await redisLPush(actionLogKey(tenantId), JSON.stringify(logEntry));
    await redisLTrim(actionLogKey(tenantId), 0, 499);

    return NextResponse.json({ ok: true, action, executedActions, results: allResults });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const entries = await redisLRange(actionLogKey(tenantId), 0, 49);
    return NextResponse.json({ ok: true, actions: entries.map(e => JSON.parse(e)) });
  } catch {
    return NextResponse.json({ ok: true, actions: [] });
  }
}
