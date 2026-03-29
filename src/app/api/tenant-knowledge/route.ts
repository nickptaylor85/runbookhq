import { NextRequest, NextResponse } from 'next/server';
import { redisLPush, redisLRange, redisLTrim } from '@/lib/redis';

// Stores per-tenant analyst verdict history so Co-Pilot can learn from past decisions
// Structure: recent FP/TP decisions with alert metadata, kept to last 100 entries

const knowledgeKey = (tenantId: string) => `wt:${tenantId}:knowledge`;
const MAX_ENTRIES = 100;

export interface KnowledgeEntry {
  ts: number;
  alertTitle: string;
  source: string;
  severity: string;
  device?: string;
  mitre?: string;
  verdict: 'TP' | 'FP';
  analystNote?: string;
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const body = await req.json() as KnowledgeEntry;
    if (!body.alertTitle || !body.verdict) {
      return NextResponse.json({ ok: false, error: 'alertTitle and verdict required' }, { status: 400 });
    }

    const entry: KnowledgeEntry = {
      ts: body.ts || Date.now(),
      alertTitle: String(body.alertTitle).slice(0, 200),
      source: String(body.source || '').slice(0, 50),
      severity: String(body.severity || '').slice(0, 20),
      verdict: body.verdict === 'TP' ? 'TP' : 'FP',
      device: body.device ? String(body.device).slice(0, 100) : undefined,
      mitre: body.mitre ? String(body.mitre).slice(0, 20) : undefined,
      analystNote: body.analystNote ? String(body.analystNote).slice(0, 300) : undefined,
    };

    const key = knowledgeKey(tenantId);
    await redisLPush(key, JSON.stringify(entry));
    await redisLTrim(key, 0, MAX_ENTRIES - 1);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const limit = Math.min(parseInt(new URL(req.url).searchParams.get('limit') || '25'), 100);

    const raw = await redisLRange(knowledgeKey(tenantId), 0, limit - 1);
    const entries: KnowledgeEntry[] = raw.map(r => {
      try { return JSON.parse(r); } catch { return null; }
    }).filter(Boolean);

    // Build a compact summary for AI injection
    const fpCount = entries.filter(e => e.verdict === 'FP').length;
    const tpCount = entries.filter(e => e.verdict === 'TP').length;

    // Group FPs by source for pattern recognition
    const fpBySrc: Record<string, number> = {};
    const tpBySrc: Record<string, number> = {};
    entries.forEach(e => {
      if (e.verdict === 'FP') fpBySrc[e.source] = (fpBySrc[e.source] || 0) + 1;
      else tpBySrc[e.source] = (tpBySrc[e.source] || 0) + 1;
    });

    // Format as a readable summary for AI context injection
    const lines: string[] = [];
    lines.push(`Last ${entries.length} analyst decisions: ${tpCount} TP, ${fpCount} FP`);
    if (Object.keys(fpBySrc).length > 0) {
      lines.push(`Common FP sources: ${Object.entries(fpBySrc).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([s,n])=>`${s}(${n})`).join(', ')}`);
    }
    if (Object.keys(tpBySrc).length > 0) {
      lines.push(`Common TP sources: ${Object.entries(tpBySrc).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([s,n])=>`${s}(${n})`).join(', ')}`);
    }
    // Add recent examples
    const recent = entries.slice(0, 10);
    if (recent.length > 0) {
      lines.push('Recent decisions:');
      recent.forEach(e => {
        const ago = Math.round((Date.now() - e.ts) / 3600000);
        lines.push(`  [${e.verdict}] "${e.alertTitle}" (${e.source}, ${e.severity})${e.device ? ` on ${e.device}` : ''} — ${ago}h ago`);
      });
    }

    return NextResponse.json({ ok: true, entries, summary: lines.join('\n'), counts: { tp: tpCount, fp: fpCount } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message, entries: [], summary: '', counts: { tp: 0, fp: 0 } });
  }
}
