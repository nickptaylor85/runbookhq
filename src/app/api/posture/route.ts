import { NextRequest, NextResponse } from 'next/server';
import { sanitiseTenantId } from '@/lib/redis';
import { redisGet, redisSet, KEYS } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

// Posture score: 0-100 calculated from 4 weighted factors
// Coverage 30% | Critical alerts 30% | KEV vulns 20% | FP rate 20%

function getTenantId(req: NextRequest): string {
  return sanitiseTenantId(req.headers.get('x-tenant-id'));
}

interface PostureInput {
  totalAlerts?: number;
  critAlerts?: number;
  kevVulns?: number;
  coveredPct?: number;
  fpAlerts?: number;
}

function calcPosture(input: PostureInput): {
  score: number;
  breakdown: { factor: string; weight: number; score: number; reason: string }[];
} {
  const { totalAlerts = 0, critAlerts = 0, kevVulns = 0, coveredPct = 100, fpAlerts = 0 } = input;

  // Coverage score (0-100): 100% coverage = 100 pts
  const coverageScore = Math.min(100, coveredPct);

  // Critical alert score (0-100): 0 crits = 100 pts, decreasing
  const critScore = Math.max(0, 100 - critAlerts * 15);

  // KEV score (0-100): 0 KEVs = 100 pts
  const kevScore = Math.max(0, 100 - kevVulns * 20);

  // FP rate score (0-100): low noise = high score
  const fpRate = totalAlerts > 0 ? fpAlerts / totalAlerts : 0;
  const fpScore = Math.max(0, Math.round(100 - fpRate * 50));

  const score = Math.round(
    coverageScore * 0.30 +
    critScore     * 0.30 +
    kevScore      * 0.20 +
    fpScore       * 0.20
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: [
      { factor: 'Estate Coverage',   weight: 30, score: Math.round(coverageScore), reason: `${coveredPct}% of devices covered` },
      { factor: 'Critical Alerts',   weight: 30, score: Math.round(critScore),     reason: `${critAlerts} unresolved critical alerts` },
      { factor: 'KEV Vulnerabilities', weight: 20, score: Math.round(kevScore),   reason: `${kevVulns} actively exploited CVEs unpatched` },
      { factor: 'Noise (FP Rate)',   weight: 20, score: Math.round(fpScore),       reason: `${Math.round(fpRate * 100)}% of alerts are false positives` },
    ],
  };
}

export async function GET(req: NextRequest) {
  // Rate limiting — 60 req/min per user
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:${_rlId}:${req.nextUrl.pathname}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const tenantId = getTenantId(req);
    const cached = await redisGet(`wt:${tenantId}:posture`);
    if (cached) {
      const p = JSON.parse(cached);
      if (Date.now() - p.cachedAt < 5 * 60 * 1000) {
        return NextResponse.json({ ok: true, ...p, cached: true });
      }
    }
    // No input = return last cached or default
    return NextResponse.json({ ok: true, score: 0, breakdown: [], cached: false });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const input = await req.json() as PostureInput;
    const result = calcPosture(input);
    const payload = { ...result, input, cachedAt: Date.now() };
    await redisSet(`wt:${tenantId}:posture`, JSON.stringify(payload));
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
