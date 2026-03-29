import { NextRequest, NextResponse } from 'next/server';
import { redisGet } from '@/lib/redis';

function requireAdmin(req: NextRequest) {
  return req.headers.get('x-is-admin') === 'true';
}

// Returns usage analytics aggregated across a tenant
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';

    const [aiLogRaw, auditRaw, postureRaw, slaRaw] = await Promise.all([
      redisGet(`wt:${tenantId}:ailog`),
      redisGet(`wt:${tenantId}:audit`),
      redisGet(`wt:${tenantId}:posture`),
      redisGet(`wt:${tenantId}:sla_events`),
    ]);

    const aiLog = aiLogRaw ? JSON.parse(aiLogRaw) : [];
    const audit = auditRaw ? JSON.parse(auditRaw) : [];
    const posture = postureRaw ? JSON.parse(postureRaw) : null;
    const sla = slaRaw ? JSON.parse(slaRaw) : [];

    // AI usage stats
    const aiCalls = Array.isArray(aiLog) ? aiLog : [];
    const totalAiCalls = aiCalls.length;
    const aiSuccessRate = totalAiCalls > 0 ? Math.round(aiCalls.filter((e: any) => e.ok).length / totalAiCalls * 100) : 100;
    const avgDurationMs = totalAiCalls > 0 ? Math.round(aiCalls.reduce((s: number, e: any) => s + (e.durationMs || 0), 0) / totalAiCalls) : 0;

    // Verdict breakdown from audit
    const verdicts = Array.isArray(audit) ? audit.filter((e: any) => e.type === 'verdict') : [];
    const tpCount = verdicts.filter((e: any) => e.verdict === 'TP').length;
    const fpCount = verdicts.filter((e: any) => e.verdict === 'FP').length;

    return NextResponse.json({
      ok: true,
      tenantId,
      ai: { totalCalls: totalAiCalls, successRate: aiSuccessRate, avgDurationMs },
      verdicts: { tp: tpCount, fp: fpCount, total: verdicts.length },
      posture: posture ? { score: posture.score, updatedAt: posture.cachedAt } : null,
      slaEvents: Array.isArray(sla) ? sla.length : 0,
      generatedAt: Date.now(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
