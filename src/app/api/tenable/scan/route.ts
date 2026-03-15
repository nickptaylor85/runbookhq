import { NextResponse } from 'next/server';
import { tenableHeaders, tenableAPI } from '@/lib/api-clients';

export async function GET() {
  const headers = await tenableHeaders();
  if (!headers) return NextResponse.json({ error: 'No Tenable credentials' });
  try {
    const data = await tenableAPI('/scans');
    const scans = (data.scans || []).map((s: any) => ({ id: s.id, name: s.name, status: s.status, lastRun: s.last_modification_date ? new Date(s.last_modification_date * 1000).toISOString() : null, targets: s.target_count || 0 }));
    return NextResponse.json({ ok: true, scans });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }); }
}

export async function POST(req: Request) {
  const { scanId } = await req.json();
  const headers = await tenableHeaders();
  if (!headers) return NextResponse.json({ error: 'No Tenable credentials' });
  try {
    const res = await fetch(`https://cloud.tenable.com/scans/${scanId}/launch`, { method: 'POST', headers, cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json({ ok: res.ok, scanUuid: data.scan_uuid, message: res.ok ? 'Scan launched' : (data.error || 'Launch failed') });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }); }
}
