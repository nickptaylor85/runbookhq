import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet, redisLPush, redisLRange, redisLTrim , sanitiseTenantId } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

function getTenantId(req: NextRequest): string {
  return sanitiseTenantId(req.headers.get('x-tenant-id'));
}
// Store IOC events per tenant, correlate across MSSP clients
const iocKey = (msspId: string, clientId: string) => `wt:mssp:${msspId.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,64)}:client:${clientId.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,64)}:iocs`;
const correlationKey = (msspId: string) => `wt:mssp:${msspId.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,64)}:correlation`;

export async function POST(req: NextRequest) {
  // Rate limiting — 60 req/min per user
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:${_rlId}:${req.nextUrl.pathname}`, 200, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const msspTenantId = getTenantId(req);
    const body = await req.json() as { clientId: string; iocs: string[]; cves: string[]; alertTitles?: string[] };
    const { clientId, iocs = [], cves = [], alertTitles = [] } = body;
    if (!clientId) return NextResponse.json({ ok: false, error: 'clientId required' }, { status: 400 });

    // Store this client's IOC fingerprint
    const fingerprint = { clientId, iocs, cves, alertTitles, ts: Date.now() };
    await redisLPush(iocKey(msspTenantId, clientId), JSON.stringify(fingerprint));
    await redisLTrim(iocKey(msspTenantId, clientId), 0, 29); // last 30 syncs

    // Cross-correlate: find IOCs/CVEs seen in ≥2 clients in last 7 days
    const cutoff = Date.now() - 7 * 86400000;
    const allClients = ['client-acme', 'client-nhs', 'client-retail', 'client-gov', clientId];
    const clientIocs: Record<string, Set<string>> = {};

    for (const cid of allClients) {
      const entries = await redisLRange(iocKey(msspTenantId, cid), 0, 9);
      const iocsForClient = new Set<string>();
      for (const e of entries) {
        try {
          const parsed = JSON.parse(e);
          if (parsed.ts > cutoff) {
            (parsed.iocs || []).forEach((i: string) => iocsForClient.add(i));
            (parsed.cves || []).forEach((c: string) => iocsForClient.add(c));
          }
        } catch {}
      }
      if (iocsForClient.size > 0) clientIocs[cid] = iocsForClient;
    }

    // Build correlation map
    const iocClientMap: Record<string, string[]> = {};
    for (const [cid, iocSet] of Object.entries(clientIocs)) {
      for (const ioc of iocSet) {
        if (!iocClientMap[ioc]) iocClientMap[ioc] = [];
        if (!iocClientMap[ioc].includes(cid)) iocClientMap[ioc].push(cid);
      }
    }

    const correlations = Object.entries(iocClientMap)
      .filter(([, clients]) => clients.length >= 2)
      .map(([indicator, clients]) => ({
        indicator,
        type: indicator.startsWith('CVE-') ? 'CVE' : 'IOC',
        clients,
        severity: clients.length >= 3 ? 'Critical' : 'High',
        detectedAt: Date.now(),
      }))
      .sort((a, b) => b.clients.length - a.clients.length)
      .slice(0, 20);

    await redisSet(correlationKey(msspTenantId), JSON.stringify({ correlations, updatedAt: Date.now() }));
    return NextResponse.json({ ok: true, correlations });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const msspTenantId = getTenantId(req);
    const raw = await redisGet(correlationKey(msspTenantId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return NextResponse.json({ ok: true, ...parsed });
    }
    return NextResponse.json({ ok: true, correlations: [] });
  } catch {
    return NextResponse.json({ ok: true, correlations: [] });
  }
}
