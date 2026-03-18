'use client';
import { useState, useEffect } from 'react';

export default function Portfolio() {
  const [data, setData] = useState<any>(null);const [loading, setLoading] = useState(true);const [search, setSearch] = useState('');

  useEffect(() => { fetch('/api/portfolio').then(r => r.ok ? r.json() : null).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  async function switchTenant(tenantId: string, email: string) {
    await fetch('/api/admin/impersonate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    window.location.href = '/dashboard';
  }

  const statusColor: Record<string, string> = { active: '#22c992', idle: '#ffb340', inactive: '#50607a', error: '#f0405e' };
  const filtered = (data?.portfolio || []).filter((t: any) => !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.owner?.toLowerCase().includes(search.toLowerCase()));

  return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="pf">
    <div className="pf-hd"><div className="pf-logo"><div className="pf-logo-icon">W</div>Watchtower <span className="pf-badge">MSSP</span></div><div className="pf-nav"><a href="/dashboard" className="pf-tab">Dashboard</a><a href="/admin" className="pf-tab">Admin</a><a href="/portfolio" className="pf-tab active">Portfolio</a></div></div>

    {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#8a9ab8' }}>Loading portfolio...</div> : !data ? <div style={{ textAlign: 'center', padding: 60, color: '#f0405e' }}>Access denied. MSSP or superadmin role required.</div> : <>
      <div className="pf-kpis"><div className="pf-kpi"><div className="pf-kpi-val">{data.totals.tenants}</div><div className="pf-kpi-label">Clients</div></div><div className="pf-kpi"><div className="pf-kpi-val" style={{ color: '#22c992' }}>{data.totals.active}</div><div className="pf-kpi-label">Active</div></div><div className="pf-kpi"><div className="pf-kpi-val" style={{ color: '#f0405e' }}>{data.totals.totalIncidents}</div><div className="pf-kpi-label">Open Incidents</div></div><div className="pf-kpi"><div className="pf-kpi-val" style={{ color: data.totals.totalSlaBreaches > 0 ? '#f0405e' : '#22c992' }}>{data.totals.totalSlaBreaches}</div><div className="pf-kpi-label">SLA Breaches</div></div><div className="pf-kpi"><div className="pf-kpi-val" style={{ color: '#22c992' }}>{Math.round(data.totals.totalTimeSaved / 60 * 10) / 10}h</div><div className="pf-kpi-label">AI Time Saved</div></div></div>

      <div className="pf-toolbar"><input className="pf-search" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} /><a href="/report" className="pf-btn">📥 Generate Report</a></div>

      <div className="pf-grid">{filtered.map((t: any) => (<div key={t.id} className="pf-card"><div className="pf-card-hd"><div><div className="pf-card-name">{t.name}</div><div className="pf-card-owner">{t.owner} · {t.members} member{t.members !== 1 ? 's' : ''}</div></div><span className="pf-status" style={{ color: statusColor[t.status] || '#50607a', background: (statusColor[t.status] || '#50607a') + '15' }}>{t.status}</span></div><div className="pf-card-stats"><div className="pf-stat"><div className="pf-stat-val">{t.tools}</div><div className="pf-stat-label">Tools</div></div><div className="pf-stat"><div className="pf-stat-val" style={{ color: t.openIncidents > 0 ? '#f0405e' : '#22c992' }}>{t.openIncidents}</div><div className="pf-stat-label">Incidents</div></div><div className="pf-stat"><div className="pf-stat-val" style={{ color: t.slaBreached > 0 ? '#f0405e' : '#22c992' }}>{t.slaBreached}</div><div className="pf-stat-label">SLA Breach</div></div><div className="pf-stat"><div className="pf-stat-val">{t.plan}</div><div className="pf-stat-label">Plan</div></div></div><div className="pf-card-ft"><button className="pf-btn pf-btn-primary" onClick={() => switchTenant(t.id, t.owner)}>Open Dashboard →</button></div></div>))}{filtered.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#50607a' }}>No clients match your search</div>}</div>
    </>}
  </div></>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#060910;color:#e6ecf8;font-family:'Outfit',sans-serif}
.pf{max-width:1200px;margin:0 auto;padding:20px}
.pf-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px}
.pf-logo{display:flex;align-items:center;gap:8px;font-weight:900;font-size:1.05rem}
.pf-logo-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#3b8bff,#7c6aff);display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#fff;font-weight:900}
.pf-badge{font-size:.55rem;color:#7c6aff;background:#7c6aff15;padding:2px 8px;border-radius:6px;letter-spacing:1px;margin-left:4px}
.pf-nav{display:flex;gap:4px}
.pf-tab{padding:7px 14px;border:1px solid #252e42;border-radius:8px;color:#8a9ab8;font-size:.74rem;font-weight:600;text-decoration:none;transition:all .2s}
.pf-tab:hover{border-color:#3b8bff;color:#3b8bff}.pf-tab.active{background:#3b8bff15;border-color:#3b8bff;color:#3b8bff}
.pf-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px}
.pf-kpi{background:linear-gradient(145deg,#0b0f18,#10141e);border:1px solid #1a2030;border-radius:14px;padding:18px;text-align:center}
.pf-kpi-val{font-size:1.8rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-2px;line-height:1.2}
.pf-kpi-label{font-size:.58rem;font-weight:700;color:#50607a;text-transform:uppercase;letter-spacing:.5px;margin-top:4px}
.pf-toolbar{display:flex;gap:8px;margin-bottom:16px}
.pf-search{flex:1;padding:10px 14px;background:#0b0f18;border:1px solid #252e42;border-radius:10px;color:#e6ecf8;font-size:.85rem;font-family:'Outfit',sans-serif;outline:none}
.pf-search:focus{border-color:#3b8bff}
.pf-btn{padding:10px 18px;border:1px solid #252e42;border-radius:10px;background:transparent;color:#8a9ab8;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .2s;text-decoration:none;font-family:'Outfit',sans-serif;display:inline-flex;align-items:center;gap:6px}
.pf-btn:hover{border-color:#3b8bff;color:#3b8bff}
.pf-btn-primary{background:linear-gradient(135deg,#3b8bff,#7c6aff);border:none;color:#fff;box-shadow:0 2px 8px rgba(91,154,255,.2)}
.pf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}
.pf-card{background:linear-gradient(145deg,#0b0f18,#10141e);border:1px solid #1a2030;border-radius:14px;padding:18px;transition:all .2s}
.pf-card:hover{border-color:#252e42;box-shadow:0 4px 20px rgba(0,0,0,.2)}
.pf-card-hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
.pf-card-name{font-size:.95rem;font-weight:800;letter-spacing:-.3px}
.pf-card-owner{font-size:.68rem;color:#50607a;margin-top:2px}
.pf-status{font-size:.58rem;font-weight:700;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:.3px}
.pf-card-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}
.pf-stat{text-align:center;padding:8px;background:#10141e40;border-radius:8px}
.pf-stat-val{font-size:1rem;font-weight:800;font-family:'JetBrains Mono',monospace}
.pf-stat-label{font-size:.52rem;color:#50607a;font-weight:600;text-transform:uppercase;margin-top:2px}
.pf-card-ft{display:flex;justify-content:flex-end}
@media(max-width:768px){.pf-kpis{grid-template-columns:repeat(2,1fr)}.pf-grid{grid-template-columns:1fr}.pf-hd{flex-direction:column}.pf-toolbar{flex-direction:column}}`;
