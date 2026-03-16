import { getTenantFromRequest } from '@/lib/config-store';
import { NextResponse } from 'next/server';
import { tenableAPI, tenableHeaders, getTaegisToken, taegisGraphQL, getConfiguredTools } from '@/lib/api-clients';

export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const tools = await getConfiguredTools(tenantId || undefined);
  let score = 50; // Base score
  const factors: any[] = [];
  const anyTool = Object.values(tools).some(Boolean);
  if (!anyTool) return NextResponse.json({ score: 0, grade: '?', factors: [{ name: 'No tools connected', impact: 0, detail: 'Connect Tenable or Taegis' }] });

  // Tenable: vuln posture
  const headers = await tenableHeaders(tenantId || undefined);
  if (headers) {
    try {
      const data = await tenableAPI('/workbenches/vulnerabilities?date_range=30');
      const vulns = data.vulnerabilities || [];
      const crit = vulns.filter((v: any) => v.severity === 4).length;
      const high = vulns.filter((v: any) => v.severity === 3).length;
      const critPenalty = Math.min(30, crit * 0.3);
      const highPenalty = Math.min(15, high * 0.05);
      score -= critPenalty;
      score -= highPenalty;
      factors.push({ name: 'Critical Vulns', impact: -Math.round(critPenalty), detail: `${crit} critical vulnerabilities`, count: crit });
      factors.push({ name: 'High Vulns', impact: -Math.round(highPenalty), detail: `${high} high vulnerabilities`, count: high });

      const assets = await tenableAPI('/assets').catch(() => null);
      if (assets?.assets) {
        const total = assets.assets.length;
        const withAgent = assets.assets.filter((a: any) => a.has_agent).length;
        const coveragePct = total > 0 ? withAgent / total : 0;
        const coverageBonus = Math.round(coveragePct * 20);
        score += coverageBonus;
        factors.push({ name: 'Agent Coverage', impact: coverageBonus, detail: `${Math.round(coveragePct * 100)}% of ${total} assets`, count: withAgent });
      }
    } catch {}
  }

  // Taegis: alert posture
  const taegisAuth = await getTaegisToken(tenantId || undefined);
  if (taegisAuth) {
    try {
      const q = `query { alertsServiceSearch(in: { cql_query: "FROM alert WHERE severity >= 0.5 EARLIEST=-1d", offset: 0, limit: 1 }) { alerts { total_results } } }`;
      const data = await taegisGraphQL(q, {}, taegisAuth.token, taegisAuth.base);
      const alertCount = data.data?.alertsServiceSearch?.alerts?.total_results || 0;
      const alertPenalty = Math.min(20, alertCount * 0.1);
      score -= alertPenalty;
      factors.push({ name: 'Active Alerts (24h)', impact: -Math.round(alertPenalty), detail: `${alertCount} alerts severity >= 0.5`, count: alertCount });

      // Bonus for having XDR
      score += 10;
      factors.push({ name: 'XDR Connected', impact: 10, detail: 'Taegis XDR active monitoring' });
    } catch {}
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const grade = score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : score >= 35 ? 'D' : 'F';
  const color = score >= 80 ? '#34e8a5' : score >= 65 ? '#5b9aff' : score >= 50 ? '#ffb340' : '#ff4466';

  return NextResponse.json({ score, grade, color, factors: factors.sort((a, b) => a.impact - b.impact), tools });
}
