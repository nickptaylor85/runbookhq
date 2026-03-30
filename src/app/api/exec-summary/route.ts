import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
    const rl = await checkRateLimit(`ai:${userId}`, 30, 60);
    if (!rl.ok) return NextResponse.json({ ok: false, error: `Rate limit exceeded. Resets in ${rl.reset}s.` }, { status: 429 });
  // Tier enforcement: requires Professional (business) or above
  const userTier = req.headers.get('x-user-tier') || 'community';
  const isAdminReq = req.headers.get('x-is-admin') === 'true';
  const tierLevels: Record<string, number> = { community: 0, team: 1, business: 2, mssp: 3 };
  if (!isAdminReq && (tierLevels[userTier] || 0) < 1) {
    return NextResponse.json({ ok: false, error: 'Executive reports require Essentials plan or above.' }, { status: 403 });
  }
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const body = await req.json() as Record<string, unknown>;
    const apiKey = await getAnthropicKey(tenantId);

    const { period = 'Last 7 days', totalAlerts = 0, critAlerts = 0, openCases = 0,
      closedCases = 0, slaBreaches = 0, fpsClosed = 0, tpConfirmed = 0,
      posture = 0, coverage = 0, topVulns = [], topAlerts = [], tools = 0, org = 'Organisation' } = body as Record<string, unknown>;

    if (!apiKey) {
      // Return HTML template without AI
      return NextResponse.json({ ok: true, html: buildHtmlReport({ period, totalAlerts, critAlerts, openCases, closedCases, slaBreaches, fpsClosed, tpConfirmed, posture, coverage, topVulns: topVulns as string[], topAlerts: topAlerts as string[], tools, org, executiveSummary: 'Add your Anthropic API key in Tools → AI Engine to generate an AI executive summary.', keyFindings: [], recommendations: [] }) });
    }

    const prompt = `You are a senior SOC analyst writing an executive security report for ${org}.

Period: ${period}
Metrics:
- Total alerts: ${totalAlerts} (${critAlerts} critical)
- Cases opened: ${Number(openCases) + Number(closedCases)}, closed: ${closedCases}, SLA breaches: ${slaBreaches}
- AI auto-closed FPs: ${fpsClosed}, confirmed TPs: ${tpConfirmed}
- Posture score: ${posture}/100, Coverage: ${coverage}%
- Tools connected: ${tools}
- Top alerts: ${(topAlerts as string[]).slice(0,3).join('; ')}
- Critical vulns: ${(topVulns as string[]).slice(0,3).join('; ')}

Return ONLY valid JSON (no markdown):
{
  "executiveSummary": "3-4 sentence executive summary for CISO/board",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "recommendations": ["action 1", "action 2", "action 3"],
  "riskLevel": "Low|Medium|High|Critical",
  "trend": "Improving|Stable|Deteriorating"
}`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, system: 'Return only valid JSON, no markdown.', messages: [{ role: 'user', content: prompt }] }),
    });

    let aiContent = { executiveSummary: '', keyFindings: [] as string[], recommendations: [] as string[], riskLevel: 'Medium', trend: 'Stable' };
    if (resp.ok) {
      const data = await resp.json() as { content: Array<{type:string;text:string}> };
      const text = data.content?.find((b:any) => b.type === 'text')?.text?.trim() || '{}';
      try { aiContent = JSON.parse(text.replace(/^```(?:json)?[\r\n]*/i,'').replace(/[\r\n]*```\s*$/i,'').trim()); } catch {}
    }

    const html = buildHtmlReport({ period, totalAlerts, critAlerts, openCases, closedCases, slaBreaches, fpsClosed, tpConfirmed, posture, coverage, topVulns: topVulns as string[], topAlerts: topAlerts as string[], tools, org, ...aiContent });
    return NextResponse.json({ ok: true, html });
  } catch(e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

function buildHtmlReport(d: Record<string, unknown>): string {
  const riskColor: Record<string, string> = { Low: '#22d49a', Medium: '#f0a030', High: '#f97316', Critical: '#f0405e' };
  const rc = riskColor[d.riskLevel as string] || '#f0a030';
  const now = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Security Report — ${d.org}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', sans-serif; background: #f7f8fa; color: #1a2030; line-height: 1.6; }
  .page { max-width: 780px; margin: 0 auto; padding: 40px 32px; background: #fff; min-height: 100vh; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #4f8fff; padding-bottom: 20px; margin-bottom: 28px; }
  .logo { display: flex; align-items: center; gap: 10px; }
  .logo-box { width: 40px; height: 40px; background: linear-gradient(135deg, #3b7fff, #7c3aff); border-radius: 9px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 1.1rem; }
  .logo-text { font-weight: 800; font-size: 1.1rem; color: #1a2030; }
  .report-meta { text-align: right; font-size: 0.8rem; color: #6b7a94; }
  h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 4px; color: #0d1320; letter-spacing: -0.5px; }
  h2 { font-size: 1rem; font-weight: 700; color: #1a2030; margin-bottom: 10px; border-left: 3px solid #4f8fff; padding-left: 10px; }
  .risk-badge { display: inline-block; padding: 4px 14px; border-radius: 6px; font-weight: 800; font-size: 0.85rem; background: ${rc}18; color: ${rc}; border: 1px solid ${rc}40; }
  .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .metric { background: #f7f8fa; border-radius: 10px; padding: 14px; text-align: center; }
  .metric-val { font-size: 1.8rem; font-weight: 900; font-family: 'Courier New', monospace; color: #1a2030; }
  .metric-val.red { color: #f0405e; }
  .metric-val.green { color: #22d49a; }
  .metric-val.amber { color: #f0a030; }
  .metric-val.blue { color: #4f8fff; }
  .metric-label { font-size: 0.68rem; color: #6b7a94; margin-top: 3px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .section { margin-bottom: 24px; }
  .summary-text { font-size: 0.9rem; color: #2a3545; line-height: 1.7; background: #f0f4ff; padding: 14px 18px; border-radius: 8px; border-left: 3px solid #4f8fff; }
  ul.findings { padding-left: 0; list-style: none; }
  ul.findings li { padding: 6px 0 6px 20px; position: relative; font-size: 0.84rem; color: #2a3545; border-bottom: 1px solid #f0f2f5; }
  ul.findings li:before { content: '→'; position: absolute; left: 0; color: #4f8fff; font-weight: 700; }
  ul.recs li:before { color: #22d49a; content: '✓'; }
  .footer { border-top: 1px solid #e8ecf4; padding-top: 14px; font-size: 0.72rem; color: #a0aab8; display: flex; justify-content: space-between; }
  @media print { body { background: white; } .page { padding: 20px; } }
</style></head><body><div class="page">
  <div class="header">
    <div class="logo"><div class="logo-box">W</div><div><div class="logo-text">Watchtower</div><div style="font-size:0.7rem;color:#6b7a94">Security Operations</div></div></div>
    <div class="report-meta"><div style="font-size:0.88rem;font-weight:700;color:#1a2030">Security Report — ${d.org}</div><div>${d.period}</div><div>Generated ${now}</div></div>
  </div>
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
    <h1>Executive Security Summary</h1>
    <span class="risk-badge">${d.riskLevel} Risk</span>
    ${d.trend ? `<span style="font-size:0.78rem;color:#6b7a94">${d.trend === 'Improving' ? '↑' : d.trend === 'Deteriorating' ? '↓' : '→'} ${d.trend}</span>` : ''}
  </div>
  <div class="metrics-grid">
    <div class="metric"><div class="metric-val ${Number(d.critAlerts) > 0 ? 'red' : 'green'}">${d.critAlerts}</div><div class="metric-label">Critical Alerts</div></div>
    <div class="metric"><div class="metric-val amber">${d.totalAlerts}</div><div class="metric-label">Total Alerts</div></div>
    <div class="metric"><div class="metric-val ${Number(d.slaBreaches) > 0 ? 'red' : 'green'}">${d.slaBreaches}</div><div class="metric-label">SLA Breaches</div></div>
    <div class="metric"><div class="metric-val blue">${d.posture}</div><div class="metric-label">Posture Score</div></div>
    <div class="metric"><div class="metric-val green">${d.fpsClosed}</div><div class="metric-label">FPs Auto-Closed</div></div>
    <div class="metric"><div class="metric-val red">${d.tpConfirmed}</div><div class="metric-label">TPs Confirmed</div></div>
    <div class="metric"><div class="metric-val blue">${d.coverage}%</div><div class="metric-label">Estate Coverage</div></div>
    <div class="metric"><div class="metric-val green">${d.tools}</div><div class="metric-label">Tools Connected</div></div>
  </div>
  ${d.executiveSummary ? `<div class="section"><h2>Executive Summary</h2><div class="summary-text">${d.executiveSummary}</div></div>` : ''}
  ${(d.keyFindings as string[])?.length > 0 ? `<div class="section"><h2>Key Findings</h2><ul class="findings">${(d.keyFindings as string[]).map(f => `<li>${f}</li>`).join('')}</ul></div>` : ''}
  ${(d.recommendations as string[])?.length > 0 ? `<div class="section"><h2>Recommendations</h2><ul class="findings recs">${(d.recommendations as string[]).map(r => `<li>${r}</li>`).join('')}</ul></div>` : ''}
  ${(d.topAlerts as string[])?.length > 0 ? `<div class="section"><h2>Top Alerts This Period</h2><ul class="findings">${(d.topAlerts as string[]).slice(0,5).map(a => `<li>${a}</li>`).join('')}</ul></div>` : ''}
  <div class="footer"><span>Watchtower Security Platform — getwatchtower.io</span><span>Confidential — ${d.org}</span></div>
</div></body></html>`;
}
