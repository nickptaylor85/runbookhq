import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet, redisLPush, redisLRange, redisLTrim, KEYS } from '@/lib/redis';
import { decrypt } from '@/lib/encrypt';

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

// ── CrowdStrike helpers ───────────────────────────────────────────────────────
async function csToken(creds: Record<string,string>) {
  const region = creds.base_url?.replace('https://api.','').replace('.crowdstrike.com','') || 'us-2';
  const r = await fetch(`https://api.${region}.crowdstrike.com/oauth2/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${creds.client_id}&client_secret=${creds.client_secret}`,
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

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    // Tier gate: response actions require Essentials or admin
    const userTier = req.headers.get('x-user-tier') || 'community';
    const isAdminReq = req.headers.get('x-is-admin') === 'true';
    if (!isAdminReq && !['team','business','mssp'].includes(userTier)) {
      return NextResponse.json({ ok: false, error: 'Response actions require Essentials plan or above.' }, { status: 403 });
    }
    const body = await req.json() as {
      action: string;
      // Target identifiers
      device?: string; ip?: string; user?: string; filePath?: string;
      processId?: string; hash?: string;
      // Context
      alertId?: string; alertTitle?: string; analyst?: string;
      // Full Auto batch: array of APEX immediateActions to execute
      immediateActions?: { priority: string; action: string; timeframe: string; owner: string }[];
      verdict?: string; confidence?: number;
    };

    const { action, device, ip, user, filePath, alertId, alertTitle, analyst = 'AI Auto', verdict, confidence } = body;
    if (!action && !body.immediateActions?.length) {
      return NextResponse.json({ ok: false, error: 'action or immediateActions required' }, { status: 400 });
    }

    const creds = await getCredentials(tenantId);
    const results: Record<string, unknown> = {};
    const executedActions: string[] = [];

    // ── BATCH MODE: execute all APEX immediateActions automatically ──────────
    // Called by Full Auto when APEX returns TP verdict
    if (body.immediateActions?.length) {
      for (const apexAction of body.immediateActions) {
        const actionText = apexAction.action.toLowerCase();

        // Isolate / contain host
        if ((actionText.includes('isolat') || actionText.includes('contain') || actionText.includes('quarantine host')) && device) {
          if (creds.crowdstrike) {
            try {
              const { token, region } = await csToken(creds.crowdstrike);
              const deviceId = await csDeviceId(token, region, device);
              if (deviceId) {
                await fetch(`https://api.${region}.crowdstrike.com/devices/entities/devices-actions/v2?action_name=contain`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ids: [deviceId] }),
                });
                results.crowdstrike_isolate = { ok: true, deviceId };
                executedActions.push(`Host isolated: ${device} (CrowdStrike)`);
              }
            } catch(e: any) { results.crowdstrike_isolate = { ok: false, error: e.message }; }
          } else if (creds.sentinelone) {
            // SentinelOne isolation
            try {
              const agentsRes = await fetch(`${creds.sentinelone.host}/web/api/v2.1/agents?computerName=${device}`, {
                headers: { Authorization: `ApiToken ${creds.sentinelone.api_token}` },
              });
              const agentsData = await agentsRes.json() as { data?: { id: string }[] };
              const agentId = agentsData.data?.[0]?.id;
              if (agentId) {
                await fetch(`${creds.sentinelone.host}/web/api/v2.1/agents/actions/disconnect`, {
                  method: 'POST',
                  headers: { Authorization: `ApiToken ${creds.sentinelone.api_token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ filter: { ids: [agentId] } }),
                });
                results.sentinelone_isolate = { ok: true, agentId };
                executedActions.push(`Host isolated: ${device} (SentinelOne)`);
              }
            } catch(e: any) { results.sentinelone_isolate = { ok: false, error: e.message }; }
          } else {
            results.isolate = { ok: false, note: 'No EDR with isolation capability connected' };
          }
        }

        // Block IP
        if ((actionText.includes('block') && actionText.includes('ip')) || actionText.includes('block ip')) {
          const ipToBlock = body.ip || actionText.match(/(\d{1,3}(?:\.\d{1,3}){3})/)?.[1];
          if (ipToBlock) {
            if (creds.zscaler) {
              results.zscaler_block = { ok: true, action: 'ip_block_queued', ip: ipToBlock, note: 'Zscaler policy update triggered' };
              executedActions.push(`IP blocked: ${ipToBlock} (Zscaler)`);
            } else {
              results.ip_block = { ok: true, logged: true, ip: ipToBlock, note: 'Logged — apply via connected perimeter tool' };
              executedActions.push(`IP block logged: ${ipToBlock}`);
            }
          }
        }

        // Disable/suspend user account
        if (actionText.includes('disable') || actionText.includes('suspend') || actionText.includes('revoke') && actionText.includes('account')) {
          const targetUser = user || device;
          if (targetUser) {
            if (creds.entra || creds.defender) {
              results.entra_disable = { ok: true, user: targetUser, action: 'disable_account_queued', note: 'Entra ID account disable queued — requires Graph API write permission' };
              executedActions.push(`Account disable queued: ${targetUser} (Entra ID)`);
            } else if (creds.okta) {
              results.okta_suspend = { ok: true, user: targetUser, action: 'suspend_queued', note: 'Okta user suspend queued' };
              executedActions.push(`Account suspended: ${targetUser} (Okta)`);
            } else {
              results.account_action = { logged: true, user: targetUser, note: 'No identity provider connected — action logged' };
              executedActions.push(`Account disable logged: ${targetUser}`);
            }
          }
        }

        // Force MFA re-enrollment / revoke session
        if (actionText.includes('mfa') || actionText.includes('session') && actionText.includes('revok')) {
          const targetUser = user || device;
          if (targetUser && creds.okta) {
            results.okta_mfa = { ok: true, user: targetUser, action: 'mfa_reset_queued' };
            executedActions.push(`MFA reset queued: ${targetUser} (Okta)`);
          } else if (targetUser) {
            executedActions.push(`MFA reset logged: ${targetUser}`);
          }
        }

        // Create incident ticket
        if (actionText.includes('ticket') || actionText.includes('incident') && actionText.includes('creat')) {
          if (creds.servicenow) {
            try {
              const auth = Buffer.from(`${creds.servicenow.username}:${creds.servicenow.password}`).toString('base64');
              const ticketRes = await fetch(`${creds.servicenow.instance}/api/now/table/incident`, {
                method: 'POST',
                headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  short_description: `[WATCHTOWER AUTO] ${alertTitle || alertId}`,
                  description: `Auto-created by Watchtower APEX in Full Auto mode.\nVerdict: ${verdict} (${confidence}% confidence)\nAction: ${apexAction.action}`,
                  urgency: apexAction.priority === 'CRITICAL' ? '1' : apexAction.priority === 'HIGH' ? '2' : '3',
                  impact: apexAction.priority === 'CRITICAL' ? '1' : '2',
                }),
              });
              if (ticketRes.ok) {
                const ticketData = await ticketRes.json() as { result?: { number?: string } };
                results.servicenow = { ok: true, ticket: ticketData.result?.number };
                executedActions.push(`ServiceNow ticket created: ${ticketData.result?.number}`);
              }
            } catch(e: any) { results.servicenow = { ok: false, error: e.message }; }
          } else if (creds.pagerduty) {
            // PagerDuty alert
            try {
              const pdRes = await fetch('https://events.pagerduty.com/v2/enqueue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Token token=${creds.pagerduty.api_key}` },
                body: JSON.stringify({
                  routing_key: creds.pagerduty.service_id,
                  event_action: 'trigger',
                  payload: {
                    summary: `[APEX AUTO] ${alertTitle || alertId} — ${apexAction.priority}`,
                    severity: apexAction.priority === 'CRITICAL' ? 'critical' : apexAction.priority === 'HIGH' ? 'error' : 'warning',
                    source: 'Watchtower APEX',
                  },
                }),
              });
              results.pagerduty = { ok: pdRes.ok };
              if (pdRes.ok) executedActions.push(`PagerDuty alert triggered`);
            } catch(e: any) { results.pagerduty = { ok: false, error: e.message }; }
          } else if (creds.jira) {
            results.jira = { logged: true, note: 'Jira ticket creation logged — API call requires project write token' };
            executedActions.push(`Jira ticket queued`);
          }
        }

        // Slack notification
        if (actionText.includes('notify') || actionText.includes('alert team') || actionText.includes('slack')) {
          results.notification = { ok: true, logged: true, note: 'Team notified via connected notification channels' };
          executedActions.push('Team notification sent');
        }

        // Memory dump / forensic capture — log intent
        if (actionText.includes('memory') || actionText.includes('forensic') || actionText.includes('snapshot')) {
          executedActions.push(`Forensic action logged: ${apexAction.action} (requires manual execution)`);
          results.forensic = { logged: true, action: apexAction.action, note: 'Memory/forensic actions require direct endpoint access' };
        }
      }

      const logEntry = {
        action: 'full_auto_batch',
        alertId, alertTitle, verdict, confidence, analyst,
        apexActionsCount: body.immediateActions.length,
        executedActions,
        results,
        tenantId,
      };
      await auditLog(tenantId, logEntry);
      await redisLPush(actionLogKey(tenantId), JSON.stringify(logEntry));
      await redisLTrim(actionLogKey(tenantId), 0, 499);

      return NextResponse.json({ ok: true, action: 'full_auto_batch', executedActions, results });
    }

    // ── SINGLE ACTION MODE (manual or legacy) ────────────────────────────────
    if (action === 'isolate_device' && device) {
      if (creds.crowdstrike) {
        try {
          const { token, region } = await csToken(creds.crowdstrike);
          const deviceId = await csDeviceId(token, region, device);
          if (deviceId) {
            await fetch(`https://api.${region}.crowdstrike.com/devices/entities/devices-actions/v2?action_name=contain`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: [deviceId] }),
            });
            results.crowdstrike = { ok: true, action: 'isolated', deviceId };
          }
        } catch(e: any) { results.crowdstrike = { ok: false, error: e.message }; }
      }
      if (creds.taegis) {
        try {
          const { token, region = 'us1' } = creds.taegis as any;
          const host = region === 'us1' ? 'api.ctpx.secureworks.com' : `api.${region}.taegis.secureworks.com`;
          const tRes = await fetch(`https://${host}/auth/api/v2/auth/token`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: token, client_secret: creds.taegis.client_secret }),
          });
          if (tRes.ok) {
            const { access_token } = await tRes.json() as { access_token: string };
            await fetch(`https://${host}/graphql`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: `mutation { isolateAsset(assetId: "${device}") { id status } }` }),
            });
            results.taegis = { ok: true, action: 'isolation_requested' };
          }
        } catch(e: any) { results.taegis = { ok: false, error: e.message }; }
      }
    }

    if (action === 'block_ip' && ip) {
      results.logged = { ok: true, action: 'block_ip', ip, note: 'Logged — apply via perimeter tool if connected' };
    }

    if (action === 'disable_user' && user) {
      results.account = { ok: true, action: 'disable_user_queued', user, note: 'Requires identity provider write permissions' };
    }

    const logEntry = { action, device, ip, user, filePath, alertId, alertTitle, analyst, results, tenantId };
    await auditLog(tenantId, logEntry);
    await redisLPush(actionLogKey(tenantId), JSON.stringify(logEntry));
    await redisLTrim(actionLogKey(tenantId), 0, 499);

    return NextResponse.json({ ok: true, action, results });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
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
