import { getTenantFromRequest } from '@/lib/config-store';
import { NextResponse } from 'next/server';
import { tenableHeaders, tenableAPI } from '@/lib/api-clients';

export async function GET(req: Request) {
  const { isDemoMode } = await import('@/lib/demo-check');
  if (await isDemoMode(getTenantFromRequest(req).tenantId)) {
    return NextResponse.json({ summary: { passed: 142, warn: 18, failed: 7, total: 167, pct: 85 }, checks: [
      { id: 1, name: 'Password complexity requirements', family: 'Account Policies', severity: 0, hosts: 847 },
      { id: 2, name: 'Account lockout threshold', family: 'Account Policies', severity: 0, hosts: 847 },
      { id: 3, name: 'Audit policy — logon events', family: 'Audit Policies', severity: 0, hosts: 690 },
      { id: 4, name: 'Windows Firewall enabled', family: 'Firewall', severity: 0, hosts: 798 },
      { id: 5, name: 'SMBv1 disabled', family: 'Network', severity: 1, hosts: 12 },
      { id: 6, name: 'TLS 1.0/1.1 disabled', family: 'Network', severity: 2, hosts: 8 },
      { id: 7, name: 'BitLocker encryption enabled', family: 'Encryption', severity: 3, hosts: 23 },
      { id: 8, name: 'Automatic updates enabled', family: 'Patch Management', severity: 1, hosts: 45 },
      { id: 9, name: 'Screen lock timeout <= 15min', family: 'User Policies', severity: 1, hosts: 67 },
      { id: 10, name: 'Remote Desktop restricted', family: 'Access Control', severity: 3, hosts: 4 },
    ], demo: true });
  }
  const { tenantId } = getTenantFromRequest(req);
  const headers = await tenableHeaders(tenantId || undefined);
  if (!headers) return NextResponse.json({ error: 'No Tenable credentials' });
  try {
    // Get compliance audit results
    const data = await tenableAPI('/workbenches/vulnerabilities?filter.0.filter=plugin_type&filter.0.quality=eq&filter.0.value=compliance&date_range=30');
    const vulns = data.vulnerabilities || [];
    const passed = vulns.filter((v: any) => v.severity === 0).length;
    const warn = vulns.filter((v: any) => v.severity === 1 || v.severity === 2).length;
    const failed = vulns.filter((v: any) => v.severity === 3 || v.severity === 4).length;
    return NextResponse.json({
      ok: true,
      summary: { total: vulns.length, passed, warn, failed, pct: vulns.length > 0 ? Math.round(passed / vulns.length * 100) : 0 },
      checks: vulns.slice(0, 30).map((v: any) => ({ id: v.plugin_id, name: v.plugin_name, severity: v.severity, hosts: v.count || 0, family: v.plugin_family || '' })),
    });
  } catch (e) { return NextResponse.json({ ok: false, error: String(e) }); }
}
