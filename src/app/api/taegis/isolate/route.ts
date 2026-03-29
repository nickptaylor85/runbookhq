import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisLPush, redisLTrim, KEYS } from '@/lib/redis';

// Taegis XDR device isolation via GraphQL
export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const body = await req.json() as { device: string; reason?: string; alertId?: string };
    if (!body.device) {
      return NextResponse.json({ ok: false, error: 'device required' }, { status: 400 });
    }

    const credsRaw = await redisGet(KEYS.TOOL_CREDS(tenantId));
    if (!credsRaw) return NextResponse.json({ ok: false, error: 'No credentials configured' }, { status: 503 });

    const creds = JSON.parse(credsRaw) as Record<string, Record<string, string>>;
    const taegis = creds.taegis;
    if (!taegis?.clientId || !taegis?.clientSecret) {
      return NextResponse.json({ ok: false, error: 'Taegis credentials not configured' }, { status: 503 });
    }

    const { clientId, clientSecret, region = 'us1' } = taegis;
    const host = region === 'us1' ? 'api.ctpx.secureworks.com' : `api.${region}.taegis.secureworks.com`;

    // Auth
    const tokenRes = await fetch(`https://${host}/auth/api/v2/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    });
    if (!tokenRes.ok) return NextResponse.json({ ok: false, error: `Taegis auth failed: ${tokenRes.status}` }, { status: 502 });
    const { access_token: token } = await tokenRes.json() as { access_token: string };

    // Find endpoint ID by hostname
    const findQuery = `
      query FindEndpoint($hostname: String!) {
        endpointsQuery(query: $hostname) {
          assets { id hostnames }
        }
      }
    `;
    const findRes = await fetch(`https://${host}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ query: findQuery, variables: { hostname: body.device } }),
    });
    const findData = await findRes.json() as any;
    const assetId = findData?.data?.endpointsQuery?.assets?.[0]?.id;

    if (!assetId) {
      return NextResponse.json({ ok: false, error: `Device not found in Taegis: ${body.device}` }, { status: 404 });
    }

    // Isolate the endpoint
    const isolateMutation = `
      mutation IsolateEndpoint($id: ID!, $reason: String) {
        isolateEndpoint(endpointId: $id, reason: $reason) {
          success
          message
        }
      }
    `;
    const isolateRes = await fetch(`https://${host}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        query: isolateMutation,
        variables: { id: assetId, reason: body.reason || `Isolated by Watchtower SOC${body.alertId ? ` for alert ${body.alertId}` : ''}` },
      }),
    });
    const isolateData = await isolateRes.json() as any;
    const result = isolateData?.data?.isolateEndpoint;

    if (!result?.success) {
      return NextResponse.json({ ok: false, error: result?.message || 'Isolation failed' }, { status: 502 });
    }

    // Audit log
    const auditEntry = JSON.stringify({
      ts: Date.now(), type: 'auto_response', action: 'taegis_isolate',
      analyst: req.headers.get('x-user-id') || 'system',
      alertTitle: `Device isolated: ${body.device}`,
      alertId: body.alertId,
    });
    await redisLPush(`wt:${tenantId}:audit`, auditEntry).catch(() => {});
    await redisLTrim(`wt:${tenantId}:audit`, 0, 999).catch(() => {});

    return NextResponse.json({ ok: true, device: body.device, assetId, isolated: true, message: result.message });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
