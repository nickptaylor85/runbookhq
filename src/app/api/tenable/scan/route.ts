import { getTenantFromRequest } from '@/lib/config-store';
import { NextResponse } from 'next/server';
import { tenableHeaders, tenableAPI } from '@/lib/api-clients';

export async function GET(req: Request) {
  const { isDemoMode } = await import('@/lib/demo-check');
  if (await isDemoMode(getTenantFromRequest(req).tenantId)) {
    return NextResponse.json({ scans: [
      { id: 1001, name: 'Weekly Infrastructure Scan', status: 'completed', lastRun: new Date(Date.now()-86400000*2).toISOString() },
      { id: 1002, name: 'Critical Servers — Daily', status: 'completed', lastRun: new Date(Date.now()-43200000).toISOString() },
      { id: 1003, name: 'DMZ Perimeter Scan', status: 'completed', lastRun: new Date(Date.now()-86400000*7).toISOString() },
      { id: 1004, name: 'PCI Compliance Scan', status: 'running', lastRun: new Date(Date.now()-3600000).toISOString() },
      { id: 1005, name: 'New Assets Discovery', status: 'completed', lastRun: new Date(Date.now()-86400000).toISOString() },
    ], demo: true });
  }
  const { tenantId } = getTenantFromRequest(req);
  const headers = await tenableHeaders(tenantId || undefined);
  if (!headers) return NextResponse.json({ error: 'No Tenable credentials' });
  try {
    const data = await tenableAPI('/scans');
    const scans = (data.scans || []).map((s: any) => ({ id: s.id, name: s.name, status: s.status, lastRun: s.last_modification_date ? new Date(s.last_modification_date * 1000).toISOString() : null, targets: s.target_count || 0 }));
    return NextResponse.json({ ok: true, scans });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }); }
}

export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const { scanId } = await req.json();
  const headers = await tenableHeaders(tenantId || undefined);
  if (!headers) return NextResponse.json({ error: 'No Tenable credentials' });
  try {
    const res = await fetch(`https://cloud.tenable.com/scans/${scanId}/launch`, { method: 'POST', headers, cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json({ ok: res.ok, scanUuid: data.scan_uuid, message: res.ok ? 'Scan launched' : (data.error || 'Launch failed') });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }); }
}
