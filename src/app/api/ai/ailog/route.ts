import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const AI_LOG_KEY = (tenantId: string) => `wt:ailog:${tenantId}`;
const MAX_ENTRIES = 500;

export interface AILogEntry {
  ts: number;
  userId: string;
  tenantId: string;
  type: 'copilot' | 'triage' | 'vuln_assist' | 'intel' | 'shift_handover' | 'other';
  promptPreview: string;
  promptLength: number;
  responseLength: number;
  model: string;
  durationMs: number;
  ok: boolean;
  error?: string;
  // context — what triggered the call
  alertId?: string;
  alertTitle?: string;
  alertVerdict?: string;
  vulnId?: string;
  vulnCve?: string;
  industry?: string;
}

function requireAdmin(req: NextRequest): boolean {
  return req.headers.get('x-is-admin') === 'true';
}

// GET — admin only
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorised — admin only' }, { status: 403 });
  }
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const limit = Math.min(Number(new URL(req.url).searchParams.get('limit') || '200'), 500);
    const raw: string[] = await redis.lrange(AI_LOG_KEY(tenantId), 0, limit - 1);
    const entries: AILogEntry[] = raw
      .map((r: string) => { try { return JSON.parse(r) as AILogEntry; } catch { return null; } })
      .filter((e): e is AILogEntry => e !== null);
    const stats = {
      total: entries.length,
      ok: entries.filter(e => e.ok).length,
      errors: entries.filter(e => !e.ok).length,
      byType: entries.reduce((acc: Record<string,number>, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1; return acc;
      }, {}),
      avgDurationMs: entries.length
        ? Math.round(entries.reduce((s, e) => s + e.durationMs, 0) / entries.length)
        : 0,
    };
    return NextResponse.json({ ok: true, entries, stats });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// POST — internal only (called server-side from other routes)
export async function POST(req: NextRequest) {
  // Only accept calls that include the internal header (set by server routes, not browser)
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
  }
  try {
    const entry = await req.json() as AILogEntry;
    if (!entry.ts || !entry.type) return NextResponse.json({ error: 'Invalid entry' }, { status: 400 });
    const tenantId = entry.tenantId || 'global';
    await redis.lpush(AI_LOG_KEY(tenantId), JSON.stringify(entry));
    await redis.ltrim(AI_LOG_KEY(tenantId), 0, MAX_ENTRIES - 1);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
