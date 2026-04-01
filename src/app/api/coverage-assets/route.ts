import { NextRequest, NextResponse } from 'next/server';
import { sanitiseTenantId } from '@/lib/redis';
import { redisGet, redisSet, KEYS } from '@/lib/redis';
import { decrypt } from '@/lib/encrypt';
import { checkRateLimit } from '@/lib/ratelimit';

export const maxDuration = 60; // dedicated route — full timeout budget

const CACHE_KEY = (t: string) => `wt:${t}:coverage_assets`;
const CACHE_TTL = 600; // 10 minutes

export async function GET(req: NextRequest) {
  // Rate limiting — 60 req/min per user
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:${_rlId}:${req.nextUrl.pathname}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const tenantId = req.headers.get('x-tenant-id') || 'global';

  // Serve from cache if fresh
  try {
    const cached = await redisGet(CACHE_KEY(tenantId));
    if (cached) {
      const p = JSON.parse(cached);
      if (Date.now() - p.cachedAt < CACHE_TTL * 1000) {
        return NextResponse.json({ ok: true, ...p, cached: true });
      }
    }
  } catch {}

  const credsRaw = await redisGet(KEYS.TOOL_CREDS(tenantId));
  if (!credsRaw) return NextResponse.json({ ok: true, tenableDevices: [], taegisDevices: [], cachedAt: Date.now() });

  let creds: Record<string, Record<string, string>> = {};
  try { creds = JSON.parse(decrypt(credsRaw)); } catch {
    return NextResponse.json({ ok: true, tenableDevices: [], taegisDevices: [], cachedAt: Date.now() });
  }

  const tenableDevices: any[] = [];
  const taegisDevices: any[] = [];
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  // ── Tenable /workbenches/assets ──────────────────────────────────────────────
  if (creds.tenable?.access_key && creds.tenable?.secret_key) {
    try {
      const headers = {
        'X-ApiKeys': `accessKey=${creds.tenable.access_key};secretKey=${creds.tenable.secret_key}`,
        'Accept': 'application/json',
      };
      // Fetch up to 5000 assets seen in last 30 days
      const res = await fetch(
        'https://cloud.tenable.com/workbenches/assets?date_range=30&limit=5000',
        { headers, signal: AbortSignal.timeout(25000) }
      );
      if (res.ok) {
        const data = await res.json() as { assets?: any[] };
        for (const asset of (data.assets || [])) {
          const hostname = asset.fqdn?.[0] || asset.hostname?.[0] || asset.netbios_name?.[0] || asset.ipv4?.[0] || '';
          if (!hostname) continue;
          const os = asset.operating_system?.[0] || 'Unknown';
          const lastSeen = asset.last_seen ? new Date(asset.last_seen).getTime() : Date.now();
          if (lastSeen < thirtyDaysAgo) continue;
          tenableDevices.push({
            hostname,
            // All hostname variants for robust matching
            fqdns: (asset.fqdn || []).map((h: string) => h.toLowerCase().split('.')[0]).filter(Boolean),
            hostnames: (asset.hostname || []).map((h: string) => h.toLowerCase().split('.')[0]).filter(Boolean),
            netbios: (asset.netbios_name || []).map((h: string) => h.toLowerCase().split('.')[0]).filter(Boolean),
            ips: asset.ipv4 || [],
            ip: asset.ipv4?.[0] || '',
            os,
            lastSeen,
            source: 'Tenable Assets',
          });
        }
        console.log(`[coverage-assets] Tenable: ${tenableDevices.length} devices`);
      }
    } catch (e: any) {
      console.log('[coverage-assets] Tenable fetch failed:', e.message);
    }
  }

  // ── Taegis endpointsQuery ────────────────────────────────────────────────────
  if (creds.taegis?.clientId && creds.taegis?.clientSecret) {
    try {
      const region = creds.taegis.region || 'us1';
      const host = region === 'us1' ? 'api.ctpx.secureworks.com' : `api.${region}.taegis.secureworks.com`;
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: creds.taegis.clientId,
        client_secret: creds.taegis.clientSecret,
      });
      const tokenRes = await fetch(`https://${host}/auth/api/v2/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        signal: AbortSignal.timeout(8000),
      });
      if (tokenRes.ok) {
        const { access_token: token } = await tokenRes.json() as { access_token: string };
        const query = `query ListEndpoints {
          endpointsQuery(limit: 5000) {
            assets {
              id
              hostnames
              os
              sensorVersion
              lastSeen
              isolationStatus
              networkInterfaces { addresses }
            }
          }
        }`;
        const epRes = await fetch(`https://${host}/graphql`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
          signal: AbortSignal.timeout(20000),
        });
        if (epRes.ok) {
          const epData = await epRes.json();
          const assets = epData.data?.endpointsQuery?.assets || [];
          for (const asset of assets) {
            const hostname = (asset.hostnames || [])[0] || asset.id || '';
            if (!hostname) continue;
            const lastSeen = asset.lastSeen ? new Date(asset.lastSeen).getTime() : Date.now();
            if (lastSeen < thirtyDaysAgo) continue;
            const allAddresses = (asset.networkInterfaces || []).flatMap((n: any) => n.addresses || []).filter(Boolean);
            taegisDevices.push({
              hostname,
              // All hostname variants for matching
              hostnames: (asset.hostnames || []).map((h: string) => h.toLowerCase().split('.')[0]).filter(Boolean),
              ips: allAddresses,
              ip: allAddresses[0] || '',
              os: asset.os || 'Unknown',
              sensorVersion: asset.sensorVersion || '',
              isolationStatus: asset.isolationStatus || '',
              lastSeen,
              source: 'Taegis Endpoints',
            });
          }
          console.log(`[coverage-assets] Taegis: ${taegisDevices.length} devices`);
        }
      }
    } catch (e: any) {
      console.log('[coverage-assets] Taegis fetch failed:', e.message);
    }
  }

  const result = { tenableDevices, taegisDevices, cachedAt: Date.now() };
  try { await redisSet(CACHE_KEY(tenantId), JSON.stringify(result), CACHE_TTL); } catch {}

  return NextResponse.json({ ok: true, ...result });
}
