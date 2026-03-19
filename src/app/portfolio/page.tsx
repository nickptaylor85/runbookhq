'use client';
import { useState, useEffect } from 'react';

export default function Portfolio() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'clients'|'correlation'|'reports'|'branding'>('clients');
  const [correlation, setCorrelation] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [branding, setBranding] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch('/api/portfolio').then(r => r.ok ? r.json() : null).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  function loadCorrelation() { fetch('/api/mssp/correlation').then(r => r.ok ? r.json() : null).then(d => { if (d) setCorrelation(d); }); }
  function loadSchedules() { fetch('/api/mssp/client-reports').then(r => r.ok ? r.json() : null).then(d => { if (d) setSchedules(d.schedules || []); }); }
  function loadBranding() { fetch('/api/mssp/branding').then(r => r.ok ? r.json() : null).then(d => { if (d) setBranding(d.branding || {}); }); }

  async function saveBranding() { setSaving(true); await fetch('/api/mssp/branding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(branding) }); setSaving(false); }

  async function toggleReport(tenantId: string, enabled: boolean, recipients: string[]) {
    await fetch('/api/mssp/client-reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId, enabled, recipients, frequency: 'weekly' }) });
    loadSchedules();
  }

  async function switchTenant(tenantId: string, email: string) { await fetch('/api/admin/impersonate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); window.location.href = '/dashboard'; }

  const statusColor: Record<string, string> = { active: '#22c992', idle: '#f0a030', inactive: '#50607a', error: '#f0405e' };
  const filtered = (data?.portfolio || []).filter((t: any) => !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.owner?.toLowerCase().includes(search.toLowerCase()));

  return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="pf">
    <div className="pf-hd"><div className="pf-logo"><div className="pf-logo-icon">W</div>Watchtower <span className="pf-badge">MSSP</span></div><div className="pf-nav"><a href="/dashboard" className="pf-tab">Dashboard</a><button className={'pf-tab ' + (tab === 'clients' ? 'active' : '')} onClick={() => setTab('clients')}>Clients</button><button className={'pf-tab ' + (tab === 'correlation' ? 'active' : '')} onClick={() => { setTab('correlation'); if (!correlation) loadCorrelation(); }}>Threat Correlation</button><button className={'pf-tab ' + (tab === 'reports' ? 'active' : '')} onClick={() => { setTab('reports'); loadSchedules(); }}>Client Reports</button><button className={'pf-tab ' + (tab === 'branding' ? 'active' : '')} onClick={() => { setTab('branding'); loadBranding(); }}>White Label</button></div></div>

    {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#8a9ab8' }}>Loading portfolio...</div> : !data ? <div style={{ textAlign: 'center', padding: 60, color: '#f0405e' }}>Access denied. MSSP or superadmin role required.</div> : <>
      <div className="pf-kpis"><div className="pf-kpi"><div className="pf-kpi-val">{data.totals.tenants}</div><div className="pf-kpi-label">Clients</div></div><div className="pf-kpi"><div className="pf-kpi-val" style={{ color: '#22c992' }}>{data.totals.active}</div><div className="pf-kpi-label">Active</div></div><div className="pf-kpi"><div className="pf-kpi-val" style={{ color: '#f0405e' }}>{data.totals.totalIncidents}</div><div className="pf-kpi-label">Open Incidents</div></div><div className="pf-kpi"><div className="pf-kpi-val" style={{ color: data.totals.totalSlaBreaches > 0 ? '#f0405e' : '#22c992' }}>{data.totals.totalSlaBreaches}</div><div className="pf-kpi-label">SLA Breaches</div></div><div className="pf-kpi"><div className="pf-kpi-val" style={{ color: '#22c992' }}>{Math.round(data.totals.totalTimeSaved / 60 * 10) / 10}h</div><div className="pf-kpi-label">AI Time Saved</div></div></div>

      {/* ═══ CLIENTS TAB ═══ */}
      {tab === 'clients' && <><div className="pf-health-summary"><div className="pf-hs-item"><div className="pf-hs-dot" style={{ background: '#22c992' }} /><strong style={{ color: '#22c992' }}>{filtered.filter((t: any) => t.health === 'green').length}</strong> Healthy</div><div className="pf-hs-item"><div className="pf-hs-dot" style={{ background: '#f0a030' }} /><strong style={{ color: '#f0a030' }}>{filtered.filter((t: any) => t.health === 'amber').length}</strong> Attention</div><div className="pf-hs-item"><div className="pf-hs-dot" style={{ background: '#f0405e' }} /><strong style={{ color: '#f0405e' }}>{filtered.filter((t: any) => t.health === 'red').length}</strong> Critical</div></div>
        <div className="pf-toolbar"><input className="pf-search" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="pf-grid">{filtered.map((t: any) => (<div key={t.id} className="pf-card"><div className="pf-card-hd"><div><div className="pf-card-name">{t.name}</div><div className="pf-card-owner">{t.owner} · {t.members} member{t.members !== 1 ? 's' : ''}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div className="pf-hs-dot" style={{ background: t.health === 'red' ? '#f0405e' : t.health === 'amber' ? '#f0a030' : '#22c992' }} /><span className="pf-status" style={{ color: statusColor[t.status] || '#50607a', background: (statusColor[t.status] || '#50607a') + '15' }}>{t.status}</span></div></div><div className="pf-card-stats"><div className="pf-stat"><div className="pf-stat-val">{t.tools}</div><div className="pf-stat-label">Tools</div></div><div className="pf-stat"><div className="pf-stat-val" style={{ color: t.openIncidents > 0 ? '#f0405e' : '#22c992' }}>{t.openIncidents}</div><div className="pf-stat-label">Incidents</div></div><div className="pf-stat"><div className="pf-stat-val" style={{ color: t.slaBreached > 0 ? '#f0405e' : '#22c992' }}>{t.slaBreached}</div><div className="pf-stat-label">SLA Breach</div></div><div className="pf-stat"><div className="pf-stat-val">{t.plan}</div><div className="pf-stat-label">Plan</div></div></div><div className="pf-card-ft"><button className="pf-btn pf-btn-primary" onClick={() => switchTenant(t.id, t.owner)}>Open Dashboard →</button></div></div>))}</div>
      </>}

      {/* ═══ CORRELATION TAB ═══ */}
      {tab === 'correlation' && <div className="pf-section">{!correlation ? <div style={{ textAlign: 'center', padding: 40, color: '#8a9ab8' }}>Loading threat correlation...</div> : <>
        <div className="pf-section-hd"><h2>🔗 Cross-Client Threat Correlation</h2><p>{correlation.crossClientHits} IOCs detected across multiple clients from {correlation.tenantsScanned} tenants scanned</p></div>
        <div className="pf-corr-grid">{(correlation.correlations || []).map((c: any, i: number) => (<div key={i} className="pf-corr-card"><div className="pf-corr-hd"><span className="pf-corr-type">{c.type}</span><span style={{ color: c.severity === 'critical' ? '#f0405e' : '#f0a030', fontSize: '.68rem', fontWeight: 700 }}>{c.severity}</span></div><div className="pf-corr-ioc">{c.ioc}</div><div className="pf-corr-tenants">{c.tenants.map((t: string) => (<span key={t} className="pf-corr-tenant">{t}</span>))}</div><div className="pf-corr-meta">First seen: {new Date(c.firstSeen).toLocaleString()} · Affects {c.tenants.length} clients</div></div>))}</div>
      </>}</div>}

      {/* ═══ REPORTS TAB ═══ */}
      {tab === 'reports' && <div className="pf-section"><div className="pf-section-hd"><h2>📊 Automated Client Reports</h2><p>Configure weekly PDF security reports emailed directly to each client's stakeholders</p></div>
        <div className="pf-report-grid">{(data?.portfolio || []).map((t: any) => { const schedule = schedules.find((s: any) => s.tenantId === t.id); return (<div key={t.id} className="pf-report-card"><div className="pf-report-hd"><div><div style={{ fontWeight: 700, fontSize: '.85rem' }}>{t.name}</div><div style={{ fontSize: '.68rem', color: '#50607a' }}>{t.owner}</div></div><label className="toggle"><input type="checkbox" checked={schedule?.enabled || false} onChange={e => toggleReport(t.id, e.target.checked, schedule?.recipients || [t.owner])} /><span className="toggle-slider" /></label></div><div className="pf-report-body">{schedule?.enabled ? <><div style={{ fontSize: '.72rem', color: '#22c992', marginBottom: 4 }}>✓ {schedule.frequency} reports enabled</div><div style={{ fontSize: '.65rem', color: '#50607a' }}>Recipients: {(schedule.recipients || []).join(', ') || 'None'}</div>{schedule.lastSent && <div style={{ fontSize: '.62rem', color: '#50607a', marginTop: 2 }}>Last sent: {new Date(schedule.lastSent).toLocaleDateString()}</div>}</> : <div style={{ fontSize: '.72rem', color: '#50607a' }}>Reports not enabled for this client</div>}</div></div>); })}</div>
      </div>}

      {/* ═══ BRANDING TAB ═══ */}
      {tab === 'branding' && <div className="pf-section"><div className="pf-section-hd"><h2>🎨 White Label Branding</h2><p>Customise Watchtower with your brand for client-facing dashboards and reports</p></div>
        <div className="pf-brand-form">
          <div className="pf-field"><label>Company Name</label><input value={branding.companyName || ''} onChange={e => setBranding({ ...branding, companyName: e.target.value })} placeholder="Your Company Name" /></div>
          <div className="pf-field"><label>Logo URL</label><input value={branding.logoUrl || ''} onChange={e => setBranding({ ...branding, logoUrl: e.target.value })} placeholder="https://your-site.com/logo.png" /></div>
          <div className="pf-field"><label>Primary Colour</label><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="color" value={branding.primaryColor || '#3b8bff'} onChange={e => setBranding({ ...branding, primaryColor: e.target.value })} style={{ width: 40, height: 32, border: 'none', background: 'transparent', cursor: 'pointer' }} /><input value={branding.primaryColor || '#3b8bff'} onChange={e => setBranding({ ...branding, primaryColor: e.target.value })} placeholder="#3b8bff" style={{ flex: 1 }} /></div></div>
          <div className="pf-field"><label>Accent Colour</label><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="color" value={branding.accentColor || '#7c6aff'} onChange={e => setBranding({ ...branding, accentColor: e.target.value })} style={{ width: 40, height: 32, border: 'none', background: 'transparent', cursor: 'pointer' }} /><input value={branding.accentColor || '#7c6aff'} onChange={e => setBranding({ ...branding, accentColor: e.target.value })} placeholder="#7c6aff" style={{ flex: 1 }} /></div></div>
          <div className="pf-field"><label>Support Email</label><input value={branding.supportEmail || ''} onChange={e => setBranding({ ...branding, supportEmail: e.target.value })} placeholder="support@your-company.com" /></div>
          <div className="pf-field"><label>Report Header Text</label><input value={branding.reportHeader || ''} onChange={e => setBranding({ ...branding, reportHeader: e.target.value })} placeholder="Confidential — Prepared by Your Company" /></div>
          <div className="pf-field"><label>Report Footer Text</label><input value={branding.reportFooter || ''} onChange={e => setBranding({ ...branding, reportFooter: e.target.value })} placeholder="© 2026 Your Company. All rights reserved." /></div>
          <div className="pf-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={branding.hideWatchtowerBranding || false} onChange={e => setBranding({ ...branding, hideWatchtowerBranding: e.target.checked })} /><label style={{ marginBottom: 0 }}>Hide "Powered by Watchtower" branding</label></div>

          {branding.companyName && <div className="pf-brand-preview"><div className="pf-brand-preview-hd">Preview</div><div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#0b0f18', borderRadius: 8, border: '1px solid #1a2030' }}><div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,' + (branding.primaryColor || '#3b8bff') + ',' + (branding.accentColor || '#7c6aff') + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', color: '#fff', fontWeight: 900 }}>{(branding.companyName || 'W').charAt(0)}</div><span style={{ fontWeight: 900, fontSize: '.95rem' }}>{branding.companyName}</span></div></div>}

          <button className="pf-btn pf-btn-primary" onClick={saveBranding} disabled={saving} style={{ marginTop: 12 }}>{saving ? 'Saving...' : 'Save Branding →'}</button>
        </div>
      </div>}
    </>}
  </div></>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#060910;color:#e6ecf8;font-family:'Outfit',sans-serif}
.pf{min-height:100vh;max-width:1200px;margin:0 auto;padding:0 20px}
.pf-hd{display:flex;align-items:center;padding:16px 0;border-bottom:1px solid #1a2030;gap:16px;flex-wrap:wrap}
.pf-logo{display:flex;align-items:center;gap:8px;font-weight:900;font-size:1.05rem;margin-right:auto}
.pf-logo-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#3b8bff,#7c6aff);display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#fff;font-weight:900}
.pf-badge{font-size:.55rem;padding:2px 8px;border-radius:4px;background:#7c6aff20;color:#7c6aff;font-weight:700;margin-left:6px}
.pf-nav{display:flex;gap:4px}
.pf-tab{padding:6px 14px;border:1px solid #1a2030;border-radius:8px;background:transparent;color:#8a9ab8;font-size:.74rem;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;text-decoration:none;transition:all .2s}
.pf-tab:hover{border-color:#3b8bff;color:#3b8bff}.pf-tab.active{background:#3b8bff15;border-color:#3b8bff;color:#3b8bff}
.pf-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:16px 0}
.pf-kpi{background:linear-gradient(145deg,#0b0f18,#10141e);border:1px solid #1a2030;border-radius:12px;padding:16px;text-align:center}
.pf-kpi-val{font-size:1.5rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-1px}
.pf-kpi-label{font-size:.52rem;font-weight:700;color:#50607a;text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.pf-health-summary{display:flex;gap:16px;justify-content:center;margin-bottom:12px;padding:12px;background:linear-gradient(145deg,#0b0f18,#10141e);border:1px solid #1a2030;border-radius:12px}
.pf-hs-item{display:flex;align-items:center;gap:6px;font-size:.78rem}
.pf-hs-dot{width:10px;height:10px;border-radius:50%;box-shadow:0 0 6px currentColor}
.pf-toolbar{display:flex;gap:8px;margin-bottom:12px}
.pf-search{flex:1;padding:10px 14px;background:#0b0f18;border:1px solid #1a2030;border-radius:10px;color:#e6ecf8;font-size:.82rem;outline:none;font-family:'Outfit',sans-serif}
.pf-search:focus{border-color:#3b8bff}
.pf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}
.pf-card{background:linear-gradient(145deg,#0b0f18,#10141e);border:1px solid #1a2030;border-radius:14px;padding:16px}
.pf-card-hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
.pf-card-name{font-size:.88rem;font-weight:700}
.pf-card-owner{font-size:.68rem;color:#50607a;margin-top:2px}
.pf-status{font-size:.58rem;font-weight:700;padding:2px 8px;border-radius:4px}
.pf-card-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px}
.pf-stat{text-align:center;padding:6px;background:#060910;border-radius:6px;border:1px solid #1a2030}
.pf-stat-val{font-size:.95rem;font-weight:800;font-family:'JetBrains Mono',monospace}
.pf-stat-label{font-size:.48rem;font-weight:600;color:#50607a;text-transform:uppercase}
.pf-card-ft{display:flex;gap:6px}
.pf-btn{padding:7px 16px;border:1px solid #1a2030;border-radius:8px;background:transparent;color:#8a9ab8;font-size:.74rem;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;text-decoration:none;transition:all .2s}
.pf-btn:hover{border-color:#3b8bff;color:#3b8bff}
.pf-btn-primary{background:#3b8bff;border-color:#3b8bff;color:#fff}
.pf-btn-primary:hover{background:#2a7aef}
.pf-section{margin:16px 0}
.pf-section-hd{margin-bottom:16px}
.pf-section-hd h2{font-size:1.1rem;font-weight:800}
.pf-section-hd p{font-size:.78rem;color:#50607a;margin-top:2px}
.pf-corr-grid{display:flex;flex-direction:column;gap:8px}
.pf-corr-card{padding:14px 16px;background:linear-gradient(145deg,#0b0f18,#10141e);border:1px solid #1a2030;border-radius:12px}
.pf-corr-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.pf-corr-type{font-size:.58rem;font-weight:700;padding:2px 8px;border-radius:4px;background:#3b8bff15;color:#3b8bff;text-transform:uppercase}
.pf-corr-ioc{font-size:.88rem;font-weight:700;font-family:'JetBrains Mono',monospace;margin-bottom:6px}
.pf-corr-tenants{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px}
.pf-corr-tenant{font-size:.6rem;padding:2px 8px;border-radius:4px;background:#f0405e12;color:#f0405e;font-weight:600;border:1px solid #f0405e20}
.pf-corr-meta{font-size:.65rem;color:#50607a}
.pf-report-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
.pf-report-card{padding:14px 16px;background:linear-gradient(145deg,#0b0f18,#10141e);border:1px solid #1a2030;border-radius:12px}
.pf-report-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.pf-report-body{}
.toggle{position:relative;display:inline-block;width:36px;height:20px}
.toggle input{opacity:0;width:0;height:0}
.toggle-slider{position:absolute;cursor:pointer;inset:0;background:#1a2030;border-radius:10px;transition:.2s}
.toggle-slider::before{content:'';position:absolute;height:16px;width:16px;left:2px;bottom:2px;background:#50607a;border-radius:50%;transition:.2s}
.toggle input:checked+.toggle-slider{background:#3b8bff}
.toggle input:checked+.toggle-slider::before{transform:translateX(16px);background:#fff}
.pf-brand-form{max-width:500px;display:flex;flex-direction:column;gap:12px}
.pf-field{display:flex;flex-direction:column;gap:4px}
.pf-field label{font-size:.72rem;font-weight:600;color:#8a9ab8}
.pf-field input[type="text"],.pf-field input:not([type]){padding:8px 12px;background:#0b0f18;border:1px solid #1a2030;border-radius:8px;color:#e6ecf8;font-size:.78rem;outline:none;font-family:'Outfit',sans-serif}
.pf-field input:focus{border-color:#3b8bff}
.pf-brand-preview{margin-top:8px}
.pf-brand-preview-hd{font-size:.68rem;font-weight:600;color:#50607a;margin-bottom:6px}
@media(max-width:768px){.pf-kpis{grid-template-columns:repeat(2,1fr)}.pf-nav{flex-wrap:wrap}.pf-grid,.pf-report-grid{grid-template-columns:1fr}}`;
