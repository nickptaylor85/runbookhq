'use client';
import { useState, useEffect } from 'react';

export default function Report() {
  const [data, setData] = useState<any>(null);const [loading, setLoading] = useState(true);const [period, setPeriod] = useState('7d');
  useEffect(() => {
    Promise.all([
      fetch('/api/unified-alerts').then(r => r.json()),
      fetch('/api/coverage').then(r => r.json()),
      fetch('/api/posture').then(r => r.json()),
      fetch('/api/sla').then(r => r.json()).catch(() => ({})),
      fetch('/api/noise-reduction').then(r => r.json()).catch(() => ({})),
      fetch('/api/auth/me').then(r => r.json()),
    ]).then(([alerts, coverage, posture, sla, nr, auth]) => {
      setData({ alerts: alerts.alerts || [], metrics: coverage.metrics || {}, coverage: coverage.coverage || {}, posture, sla, nr, user: auth.user, tenant: auth.tenant, generatedAt: new Date().toISOString() });
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', fontFamily: 'sans-serif' }}>Generating report...</div>;

  const d = data;
  const a = d.metrics;
  const sev = { critical: d.alerts.filter((x: any) => x.severity === 'critical').length, high: d.alerts.filter((x: any) => x.severity === 'high').length, medium: d.alerts.filter((x: any) => x.severity === 'medium').length, low: d.alerts.filter((x: any) => x.severity === 'low').length };
  const topSources: Record<string, number> = {};
  d.alerts.forEach((al: any) => { topSources[al.source] = (topSources[al.source] || 0) + 1; });
  const score = d.posture?.score || 0;
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';
  const gradeColor = score >= 75 ? '#22c992' : score >= 50 ? '#ffb340' : '#f0405e';
  const nrStats = d.nr?.stats || {};

  return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="rpt">
    <div className="rpt-header no-print"><button className="rpt-btn" onClick={() => window.print()}>📥 Download PDF</button><button className="rpt-btn rpt-btn-ghost" onClick={() => window.location.href = '/dashboard'}>← Dashboard</button></div>

    <div className="rpt-page">
      <div className="rpt-top"><div className="rpt-logo"><div className="rpt-logo-icon">W</div>Watchtower</div><div className="rpt-meta"><div className="rpt-title">Security Posture Report</div><div className="rpt-date">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div><div className="rpt-org">{d.tenant?.name || d.user?.org || 'Organisation'}</div></div></div>

      <div className="rpt-score-row"><div className="rpt-score-box" style={{ borderColor: gradeColor }}><div className="rpt-score-val" style={{ color: gradeColor }}>{score}</div><div className="rpt-score-grade" style={{ color: gradeColor }}>{grade}</div><div className="rpt-score-label">Posture Score</div></div><div className="rpt-score-details">{(d.posture?.factors || []).map((f: any) => (<div key={f.name} className="rpt-factor"><div className="rpt-factor-name">{f.name}</div><div className="rpt-factor-bar"><div className="rpt-factor-fill" style={{ width: f.score + '%', background: f.score >= 70 ? '#22c992' : f.score >= 40 ? '#ffb340' : '#f0405e' }} /></div><div className="rpt-factor-val">{f.score}%</div></div>))}</div></div>

      <div className="rpt-section"><h2>Executive Summary</h2><div className="rpt-kpis"><div className="rpt-kpi"><div className="rpt-kpi-val">{d.alerts.length}</div><div className="rpt-kpi-label">Total Alerts</div></div><div className="rpt-kpi"><div className="rpt-kpi-val" style={{ color: '#f0405e' }}>{sev.critical}</div><div className="rpt-kpi-label">Critical</div></div><div className="rpt-kpi"><div className="rpt-kpi-val" style={{ color: '#f97316' }}>{sev.high}</div><div className="rpt-kpi-label">High</div></div><div className="rpt-kpi"><div className="rpt-kpi-val">{d.coverage?.totalDevices?.toLocaleString() || 0}</div><div className="rpt-kpi-label">Assets</div></div><div className="rpt-kpi"><div className="rpt-kpi-val">{d.coverage?.agentCoverage || 0}%</div><div className="rpt-kpi-label">Coverage</div></div><div className="rpt-kpi"><div className="rpt-kpi-val">{d.sla?.breached || 0}</div><div className="rpt-kpi-label">SLA Breaches</div></div></div></div>

      <div className="rpt-section"><h2>Alert Distribution</h2><div className="rpt-bar-chart">{[{ label: 'Critical', count: sev.critical, color: '#f0405e' }, { label: 'High', count: sev.high, color: '#f97316' }, { label: 'Medium', count: sev.medium, color: '#ffb340' }, { label: 'Low', count: sev.low, color: '#3b8bff' }].map(s => (<div key={s.label} className="rpt-bar-row"><div className="rpt-bar-label">{s.label}</div><div className="rpt-bar-track"><div className="rpt-bar-fill" style={{ width: Math.max(2, (s.count / Math.max(d.alerts.length, 1)) * 100) + '%', background: s.color }} /></div><div className="rpt-bar-count">{s.count}</div></div>))}</div></div>

      {Object.keys(topSources).length > 0 && <div className="rpt-section"><h2>Alerts by Source</h2><div className="rpt-bar-chart">{Object.entries(topSources).sort((a, b) => b[1] - a[1]).map(([src, count]) => (<div key={src} className="rpt-bar-row"><div className="rpt-bar-label">{src}</div><div className="rpt-bar-track"><div className="rpt-bar-fill" style={{ width: Math.max(2, (count / d.alerts.length) * 100) + '%', background: '#3b8bff' }} /></div><div className="rpt-bar-count">{count}</div></div>))}</div></div>}

      {nrStats.totalProcessed > 0 && <div className="rpt-section"><h2>AI Noise Reduction</h2><div className="rpt-kpis"><div className="rpt-kpi"><div className="rpt-kpi-val" style={{ color: '#22c992' }}>{nrStats.autoClosed || 0}</div><div className="rpt-kpi-label">Auto-Closed</div></div><div className="rpt-kpi"><div className="rpt-kpi-val">{nrStats.escalated || 0}</div><div className="rpt-kpi-label">Escalated</div></div><div className="rpt-kpi"><div className="rpt-kpi-val" style={{ color: '#22c992' }}>{Math.round((nrStats.timeSavedMins || 0) / 60 * 10) / 10}h</div><div className="rpt-kpi-label">Time Saved</div></div><div className="rpt-kpi"><div className="rpt-kpi-val">{nrStats.totalProcessed > 0 ? Math.round(nrStats.autoClosed / nrStats.totalProcessed * 100) : 0}%</div><div className="rpt-kpi-label">FP Rate</div></div></div></div>}

      {d.alerts.length > 0 && <div className="rpt-section"><h2>Critical & High Alerts</h2><table className="rpt-tbl"><thead><tr><th>Alert</th><th>Source</th><th>Severity</th><th>Device</th><th>MITRE</th><th>Time</th></tr></thead><tbody>{d.alerts.filter((al: any) => al.severity === 'critical' || al.severity === 'high').slice(0, 20).map((al: any) => (<tr key={al.id}><td style={{ fontWeight: 600 }}>{al.title}</td><td>{al.source}</td><td><span style={{ color: al.severity === 'critical' ? '#f0405e' : '#f97316', fontWeight: 700 }}>{al.severity}</span></td><td style={{ fontSize: '.75rem' }}>{al.device || '—'}</td><td style={{ fontSize: '.72rem', color: '#8a9ab8' }}>{al.mitre || '—'}</td><td style={{ fontSize: '.72rem', color: '#8a9ab8' }}>{new Date(al.timestamp).toLocaleString()}</td></tr>))}</tbody></table></div>}

      <div className="rpt-footer"><div>Generated by Watchtower · {new Date().toLocaleString()}</div><div>{d.user?.email} · {d.tenant?.name}</div></div>
    </div>
  </div></>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#f8fafd;color:#1a1a2e;font-family:'Outfit',sans-serif}
.rpt{max-width:900px;margin:0 auto;padding:20px}
.rpt-header{display:flex;gap:8px;margin-bottom:20px}
.rpt-btn{padding:10px 20px;border:none;border-radius:10px;background:linear-gradient(135deg,#3b8bff,#7c6aff);color:#fff;font-size:.85rem;font-weight:700;cursor:pointer;font-family:'Outfit',sans-serif}
.rpt-btn-ghost{background:transparent;border:1px solid #d8e0ef;color:#50607a}
.rpt-page{background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,.06);padding:48px;border:1px solid #e8ecf4}
.rpt-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:24px;border-bottom:2px solid #eef2f9}
.rpt-logo{display:flex;align-items:center;gap:8px;font-weight:900;font-size:1.1rem;color:#1a1a2e}
.rpt-logo-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#3b8bff,#7c6aff);display:flex;align-items:center;justify-content:center;font-size:.75rem;color:#fff;font-weight:900}
.rpt-meta{text-align:right}
.rpt-title{font-size:1.4rem;font-weight:900;letter-spacing:-1px;color:#1a1a2e}
.rpt-date{font-size:.82rem;color:#6b7a99;margin-top:2px}
.rpt-org{font-size:.78rem;color:#8a9ab8;margin-top:2px}
.rpt-score-row{display:flex;gap:24px;align-items:center;margin-bottom:36px;padding:24px;background:linear-gradient(135deg,#f8fafd,#eef2f9);border-radius:14px;border:1px solid #e8ecf4}
.rpt-score-box{width:120px;height:120px;border-radius:50%;border:4px solid;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0}
.rpt-score-val{font-size:2.2rem;font-weight:900;font-family:'JetBrains Mono',monospace;line-height:1}
.rpt-score-grade{font-size:.7rem;font-weight:800;letter-spacing:1px}
.rpt-score-label{font-size:.6rem;color:#6b7a99;margin-top:2px;font-weight:600}
.rpt-score-details{flex:1;display:flex;flex-direction:column;gap:8px}
.rpt-factor{display:flex;align-items:center;gap:10px}
.rpt-factor-name{font-size:.78rem;font-weight:600;min-width:130px;color:#50607a}
.rpt-factor-bar{flex:1;height:8px;background:#e8ecf4;border-radius:4px;overflow:hidden}
.rpt-factor-fill{height:100%;border-radius:4px;transition:width .5s}
.rpt-factor-val{font-size:.72rem;font-weight:700;font-family:'JetBrains Mono',monospace;min-width:36px;text-align:right;color:#50607a}
.rpt-section{margin-bottom:32px}
.rpt-section h2{font-size:1rem;font-weight:800;color:#1a1a2e;margin-bottom:14px;letter-spacing:-.3px;padding-bottom:8px;border-bottom:1px solid #eef2f9}
.rpt-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px}
.rpt-kpi{background:#f8fafd;border:1px solid #e8ecf4;border-radius:10px;padding:14px;text-align:center}
.rpt-kpi-val{font-size:1.6rem;font-weight:900;font-family:'JetBrains Mono',monospace;color:#1a1a2e;line-height:1.2}
.rpt-kpi-label{font-size:.62rem;font-weight:700;color:#8a9ab8;text-transform:uppercase;letter-spacing:.5px;margin-top:4px}
.rpt-bar-chart{display:flex;flex-direction:column;gap:8px}
.rpt-bar-row{display:flex;align-items:center;gap:10px}
.rpt-bar-label{font-size:.78rem;font-weight:600;min-width:80px;color:#50607a}
.rpt-bar-track{flex:1;height:20px;background:#eef2f9;border-radius:6px;overflow:hidden}
.rpt-bar-fill{height:100%;border-radius:6px;min-width:3px}
.rpt-bar-count{font-size:.82rem;font-weight:800;font-family:'JetBrains Mono',monospace;min-width:40px;text-align:right;color:#1a1a2e}
.rpt-tbl{width:100%;border-collapse:collapse;font-size:.78rem}
.rpt-tbl th{text-align:left;padding:8px;font-size:.62rem;font-weight:700;color:#8a9ab8;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e8ecf4}
.rpt-tbl td{padding:8px;border-bottom:1px solid #f0f3f9}
.rpt-footer{display:flex;justify-content:space-between;margin-top:40px;padding-top:16px;border-top:1px solid #eef2f9;font-size:.7rem;color:#8a9ab8}
@media print{.no-print{display:none!important}body{background:#fff}.rpt{padding:0;max-width:100%}.rpt-page{box-shadow:none;border:none;padding:24px}.rpt-section{break-inside:avoid}}
@media(max-width:768px){.rpt-page{padding:24px 16px}.rpt-top{flex-direction:column;gap:12px}.rpt-meta{text-align:left}.rpt-score-row{flex-direction:column}.rpt-kpis{grid-template-columns:repeat(2,1fr)}}`;
