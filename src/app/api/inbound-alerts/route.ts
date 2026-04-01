import { NextRequest, NextResponse } from 'next/server';
import { redisLPush, redisLTrim, redisGet, KEYS } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

export const maxDuration = 30;

const inboundKey = (t: string) => `wt:${t}:inbound_alerts`;

function normSevLocal(s: any): 'Critical' | 'High' | 'Medium' | 'Low' {
  const v = String(s || '').toLowerCase();
  if (['critical','crit','4','p1'].includes(v) || Number(s) >= 80) return 'Critical';
  if (['high','3','p2'].includes(v) || Number(s) >= 60) return 'High';
  if (['medium','med','2','p3'].includes(v) || Number(s) >= 40) return 'Medium';
  return 'Low';
}

function detectSource(req: NextRequest, body: any): string {
  if (req.headers.get('x-crowdstrike-event')) return 'CrowdStrike';
  if (req.headers.get('x-sentinelone-signature')) return 'SentinelOne';
  if (body?.result?.source || req.headers.get('user-agent')?.includes('Splunk')) return 'Splunk';
  if (body?.properties?.alertDisplayName) return 'Microsoft Sentinel';
  return body?.source || body?.tool || 'Webhook';
}

function normalise(body: any, source: string): Record<string, unknown> {
  const ts = Date.now();
  const id = `${source.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
  if (source === 'CrowdStrike') {
    const e = body?.event || body;
    return { id, source, title: e.DetectDescription || e.Technique || 'CrowdStrike Detection', severity: normSevLocal(e.Severity), device: e.ComputerName || 'Unknown', user: e.UserName, ip: e.LocalIP, mitre: e.Technique, description: e.DetectDescription || '', time: new Date(e.EventCreationTime || ts).toISOString(), rawTime: e.EventCreationTime || ts, verdict: 'Pending', confidence: 80, tags: ['crowdstrike', 'inbound'], fromWebhook: true };
  }
  if (source === 'SentinelOne') {
    const a = body?.data?.alert || body;
    return { id, source, title: a.threatInfo?.threatName || 'SentinelOne Alert', severity: normSevLocal(a.threatInfo?.confidenceLevel || a.severity), device: a.agentDetectionInfo?.computerName || 'Unknown', ip: a.agentDetectionInfo?.agentIpV4, description: a.threatInfo?.description || '', time: new Date(a.threatInfo?.createdAt || ts).toISOString(), rawTime: a.threatInfo?.createdAt || ts, verdict: 'Pending', confidence: 75, tags: ['sentinelone', 'inbound'], fromWebhook: true };
  }
  if (source === 'Splunk') {
    const r = body?.result || body;
    return { id, source, title: body?.search_name || r?.alert_name || 'Splunk Alert', severity: normSevLocal(r?.severity || r?.urgency || 'medium'), device: r?.host || r?.dest || 'Unknown', ip: r?.src || r?.src_ip, description: String(r || '').slice(0, 200), time: new Date(r?._time ? Number(r._time) * 1000 : ts).toISOString(), rawTime: r?._time ? Number(r._time) * 1000 : ts, verdict: 'Pending', confidence: 70, tags: ['splunk', 'inbound'], fromWebhook: true };
  }
  if (source === 'Microsoft Sentinel') {
    const p = body?.properties || body;
    return { id, source, title: p?.alertDisplayName || 'Sentinel Alert', severity: normSevLocal(p?.severity), device: p?.compromisedEntity || 'Unknown', description: p?.description || '', time: p?.timeGeneratedUtc || new Date(ts).toISOString(), rawTime: new Date(p?.timeGeneratedUtc || ts).getTime(), verdict: 'Pending', confidence: 78, tags: ['sentinel', 'inbound', 'microsoft'], fromWebhook: true };
  }
  // Generic
  return { id, source: body?.source || source, title: body?.title || body?.name || body?.alert_name || 'Inbound Alert', severity: normSevLocal(body?.severity || body?.priority || 'medium'), device: body?.device || body?.host || body?.hostname || 'Unknown', user: body?.user, ip: body?.ip || body?.src_ip, description: body?.description || body?.message || '', time: new Date(body?.time || body?.timestamp || ts).toISOString(), rawTime: body?.time || body?.timestamp || ts, verdict: 'Pending', confidence: 65, tags: ['webhook', 'inbound'], fromWebhook: true };
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenant') || req.headers.get('x-tenant-id') || 'global';
    const rl = await checkRateLimit(`inbound:${tenantId}`, 500, 60);
    if (!rl.ok) return NextResponse.json({ ok: false, error: 'Rate limit' }, { status: 429 });
    const body = await req.json().catch(() => ({}));
    const source = detectSource(req, body);
    const alert = normalise(body, source);
    await redisLPush(inboundKey(tenantId), JSON.stringify({ ...alert, receivedAt: Date.now() }));
    await redisLTrim(inboundKey(tenantId), 0, 999);
    console.log(`[inbound-alerts] tenant=${tenantId} source=${source} title=${String(alert.title || '').slice(0, 60)}`);
    return NextResponse.json({ ok: true, alertId: alert.id, source, tenantId });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenant') || req.headers.get('x-tenant-id') || 'global';
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://getwatchtower.io';
  return NextResponse.json({ ok: true, webhookUrl: `${base}/api/inbound-alerts?tenant=${tenantId}`, supportedSources: ['CrowdStrike', 'SentinelOne', 'Splunk', 'Microsoft Sentinel', 'Generic JSON'] });
}
