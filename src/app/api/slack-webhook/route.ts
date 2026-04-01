import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:\${_rlId}:\${req.nextUrl?.pathname || ''}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  try {
    const body = await req.json() as { webhook?: string; alert?: Record<string, unknown> };
    if (!body?.webhook || !body.webhook.startsWith('https://hooks.slack.com/')) {
      return NextResponse.json({ ok: false, message: 'Invalid webhook URL' }, { status: 400 });
    }
    const { webhook, alert } = body;
    const sev = String(alert?.severity || '');
    const sevEmoji = sev === 'Critical' ? '🔴' : sev === 'High' ? '🟠' : sev === 'Medium' ? '🟡' : '🔵';
    const verdict = String(alert?.verdict || '');
    const verdictEmoji = verdict === 'TP' ? '⚠️' : verdict === 'FP' ? '✅' : '🔍';
    const payload = {
      text: `${sevEmoji} *${sev} Alert* — ${String(alert?.title || 'Unknown')}`,
      attachments: [{
        color: sev === 'Critical' ? '#f0405e' : sev === 'High' ? '#f97316' : '#f0a030',
        fields: [
          { title: 'Source', value: String(alert?.source || '—'), short: true },
          { title: 'Device', value: String(alert?.device || '—'), short: true },
          { title: 'AI Verdict', value: `${verdictEmoji} ${verdict} (${alert?.confidence || '—'}% confidence)`, short: true },
          { title: 'Platform', value: '<https://getwatchtower.io/dashboard|View in Watchtower →>', short: true },
        ],
        footer: 'Watchtower SOC',
        ts: Math.floor(Date.now() / 1000),
      }],
    };
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, message: `Slack returned ${res.status}` }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
