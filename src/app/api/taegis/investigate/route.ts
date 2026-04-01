import { NextRequest, NextResponse } from 'next/server';
import { redisGet, KEYS } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

// Taegis XDR investigation — enriches an alert with related events, threat context, and IOC lookups
export async function POST(req: NextRequest) {
  // Rate limiting — 60 req/min per user
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:${_rlId}:${req.nextUrl.pathname}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const body = await req.json() as {
      alertId?: string;
      device?: string;
      ip?: string;
      user?: string;
      mitre?: string;
      title?: string;
    };

    if (!body.alertId && !body.device && !body.ip) {
      return NextResponse.json({ ok: false, error: 'alertId, device, or ip required' }, { status: 400 });
    }

    // Load Taegis credentials for this tenant
    const credsRaw = await redisGet(KEYS.TOOL_CREDS(tenantId));
    if (!credsRaw) {
      return NextResponse.json({ ok: false, error: 'No credentials configured for tenant' }, { status: 503 });
    }

    const creds = JSON.parse(credsRaw) as Record<string, Record<string, string>>;
    const taegis = creds.taegis;
    if (!taegis?.clientId || !taegis?.clientSecret) {
      return NextResponse.json({ ok: false, error: 'Taegis credentials not configured — add in Tools tab' }, { status: 503 });
    }

    const { clientId, clientSecret, region = 'us1' } = taegis;
    const host = region === 'us1'
      ? 'api.ctpx.secureworks.com'
      : `api.${region}.taegis.secureworks.com`;

    // Get Taegis auth token
    const tokenRes = await fetch(`https://${host}/auth/api/v2/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    });
    if (!tokenRes.ok) {
      return NextResponse.json({ ok: false, error: `Taegis auth failed: ${tokenRes.status}` }, { status: 502 });
    }
    const { access_token: token } = await tokenRes.json() as { access_token: string };

    // Query Taegis GraphQL for related alerts and endpoint context
    // Validate host before building Taegis endpoint (SSRF guard)
    if (!host || /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.)/.test(host) ||
        host.includes('..') || host.includes('/')) {
      return NextResponse.json({ error: 'Invalid Taegis host' }, { status: 400 });
    }
    const gqlUrl = `https://${host}/graphql`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const results: Record<string, unknown> = {};

    // 1. Search for related alerts by device/IP
    if (body.device || body.ip) {
      const searchTerm = body.device || body.ip;
      const alertsQuery = `
        query InvestigateAlerts($q: String!) {
          alertsServiceSearch(q: $q, limit: 10) {
            alerts {
              id
              metadata { title severity createdAt }
              status
              entities { type value }
            }
          }
        }
      `;
      try {
        const alertsRes = await fetch(gqlUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ query: alertsQuery, variables: { q: searchTerm } }),
        });
        if (alertsRes.ok) {
          const data = await alertsRes.json() as any;
          results.relatedAlerts = data?.data?.alertsServiceSearch?.alerts || [];
        }
      } catch { results.relatedAlerts = []; }
    }

    // 2. Query endpoint data if device provided
    if (body.device) {
      const endpointQuery = `
        query EndpointContext($hostname: String!) {
          endpointsQuery(query: $hostname) {
            assets {
              hostnames
              os
              sensorVersion
              lastSeen
              networkInterfaces { addresses }
              tags
            }
          }
        }
      `;
      try {
        const epRes = await fetch(gqlUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ query: endpointQuery, variables: { hostname: body.device } }),
        });
        if (epRes.ok) {
          const data = await epRes.json() as any;
          results.endpointContext = data?.data?.endpointsQuery?.assets?.[0] || null;
        }
      } catch { results.endpointContext = null; }
    }

    // 3. Threat intel lookup for IP
    if (body.ip) {
      const intelQuery = `
        query ThreatIntel($ip: String!) {
          threatIntelIndicators(value: $ip, type: "ip") {
            value
            type
            confidence
            sources
            tags
            firstSeen
            lastSeen
          }
        }
      `;
      try {
        const intelRes = await fetch(gqlUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ query: intelQuery, variables: { ip: body.ip } }),
        });
        if (intelRes.ok) {
          const data = await intelRes.json() as any;
          results.threatIntel = data?.data?.threatIntelIndicators || [];
        }
      } catch { results.threatIntel = []; }
    }

    return NextResponse.json({
      ok: true,
      alertId: body.alertId,
      device: body.device,
      ip: body.ip,
      results,
      source: 'taegis',
      queriedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
