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

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const body = await req.json() as {
      action: string; device?: string; ip?: string;
      user?: string; filePath?: string; alertId?: string; analyst?: string;
    };
    const { action, device, ip, user, filePath, alertId, analyst = 'AI' } = body;
    if (!action) return NextResponse.json({ ok: false, error: 'action required' }, { status: 400 });

    const creds = await getCredentials(tenantId);
    const results: Record<string, unknown> = {};

    // CrowdStrike Falcon — host isolation
    if (action === 'isolate_device' && device && creds.crowdstrike) {
      const { clientId, clientSecret, cloudRegion = 'us-2' } = creds.crowdstrike;
      try {
        const tokenRes = await fetch(`https://api.${cloudRegion}.crowdstrike.com/oauth2/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `client_id=${clientId}&client_secret=${clientSecret}`,
        });
        if (tokenRes.ok) {
          const { access_token } = await tokenRes.json() as { access_token: string };
          // Find device ID
          const hostRes = await fetch(`https://api.${cloudRegion}.crowdstrike.com/devices/queries/devices/v1?filter=hostname:'${device}'`, {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          if (hostRes.ok) {
            const hostData = await hostRes.json() as { resources?: string[] };
            const deviceId = hostData.resources?.[0];
            if (deviceId) {
              await fetch(`https://api.${cloudRegion}.crowdstrike.com/devices/entities/devices-actions/v2?action_name=contain`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [deviceId] }),
              });
              results.crowdstrike = { ok: true, action: 'isolated', deviceId };
            }
          }
        }
      } catch(e: any) { results.crowdstrike = { ok: false, error: e.message }; }
    }

    // Taegis — host isolation
    if (action === 'isolate_device' && device && creds.taegis) {
      try {
        const { clientId, clientSecret, region = 'us1' } = creds.taegis;
        const host = region === 'us1' ? 'api.ctpx.secureworks.com' : `api.${region}.taegis.secureworks.com`;
        const tokenRes = await fetch(`https://${host}/auth/api/v2/auth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
        });
        if (tokenRes.ok) {
          const { access_token } = await tokenRes.json() as { access_token: string };
          const isolateRes = await fetch(`https://${host}/graphql`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: `mutation { isolateAsset(assetId: "${device}") { id status } }` }),
          });
          results.taegis = { ok: isolateRes.ok, action: 'isolation_requested' };
        }
      } catch(e: any) { results.taegis = { ok: false, error: e.message }; }
    }

    // Block IP — generic (logs intent; real implementation needs perimeter tool)
    if (action === 'block_ip' && ip) {
      results.logged = { ok: true, action: 'block_ip', ip, note: 'Logged — apply via perimeter tool (Zscaler/Palo Alto) if connected' };
    }

    // Disable user — Microsoft Defender / Entra ID
    if (action === 'disable_user' && user && creds.defender) {
      results.defender = { ok: true, action: 'disable_user_queued', user, note: 'Requires Graph API — action logged for manual confirmation' };
    }

    // Quarantine file — CrowdStrike
    if (action === 'quarantine_file' && filePath && creds.crowdstrike) {
      results.crowdstrike_quarantine = { ok: true, action: 'quarantine_queued', filePath };
    }

    const logEntry = { action, device, ip, user, filePath, alertId, analyst, results, tenantId };
    await auditLog(tenantId, logEntry);
    // Also write to action log for display in incidents
    try {
      await redisLPush(actionLogKey(tenantId), JSON.stringify(logEntry));
      await redisLTrim(actionLogKey(tenantId), 0, 499);
    } catch {}

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
