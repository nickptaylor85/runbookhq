import { NextResponse } from 'next/server';

async function redis(...args: string[]): Promise<any> {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args), cache: 'no-store' });
    const data = await res.json();
    return data.result ?? null;
  } catch (e) { return null; }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const alertId = searchParams.get('alertId');
  if (!alertId) return NextResponse.json({ notes: [] });
  const raw = await redis('GET', `secops:notes:${alertId}`);
  const notes = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const { alertId, note, analyst } = await req.json();
  if (!alertId || !note) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const key = `secops:notes:${alertId}`;
  const raw = await redis('GET', key);
  const notes = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
  notes.unshift({ id: Date.now().toString(), text: note, analyst: analyst || 'Analyst', time: new Date().toISOString() });
  await redis('SET', key, JSON.stringify(notes));
  return NextResponse.json({ ok: true, notes });
}
