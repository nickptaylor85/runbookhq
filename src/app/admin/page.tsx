'use client';
import { useState, useEffect, useCallback } from 'react';

type Tab = 'overview'|'users'|'tenants'|'health'|'flags'|'announcements'|'audit';

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [flags, setFlags] = useState<any>({});
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>('overview');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [resetModal, setResetModal] = useState<string|null>(null);
  const [newPw, setNewPw] = useState('');
  const [annMsg, setAnnMsg] = useState('');
  const [annType, setAnnType] = useState('info');
  const [flagTenant, setFlagTenant] = useState('_global');
  const [flagKey, setFlagKey] = useState('');
  const [flagVal, setFlagVal] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => { if (d.users) setUsers(d.users); else setError(d.error||''); });
    fetch('/api/admin/tenants').then(r => r.json()).then(d => { if (d.tenants) setTenants(d.tenants); });
    fetch('/api/audit').then(r => r.json()).then(d => { if (d.logs) setAuditLogs(d.logs); });
    fetch('/api/admin/analytics').then(r => r.json()).then(d => { if (d.users) setAnalytics(d); });
    fetch('/api/admin/health').then(r => r.json()).then(d => { if (d.health) setHealth(d); });
    fetch('/api/admin/feature-flags').then(r => r.json()).then(d => { if (d.flags) setFlags(d.flags); });
    fetch('/api/admin/announcements').then(r => r.json()).then(d => { if (d.announcements) setAnnouncements(d.announcements); });
  }, []);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000); }

  function updateUser(email: string, changes: any) {
    fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, ...changes }) })
      .then(r => r.json()).then(d => { flash(d.message || d.error); fetch('/api/admin/users').then(r => r.json()).then(d => { if (d.users) setUsers(d.users); }); });
  }

  function impersonate(email: string) {
    if (!confirm('Impersonate ' + email + '? You will see their dashboard.')) return;
    fetch('/api/admin/impersonate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      .then(r => r.json()).then(d => { if (d.ok) window.location.href = '/dashboard'; else alert(d.error); });
  }

  function deleteUser(email: string) {
    if (!confirm('Delete ' + email + '? This cannot be undone.')) return;
    fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      .then(r => r.json()).then(d => { flash(d.ok ? 'Deleted' : d.error); fetch('/api/admin/users').then(r => r.json()).then(d => { if (d.users) setUsers(d.users); }); });
  }

  function resetPassword() {
    if (!resetModal || newPw.length < 8) return;
    fetch('/api/admin/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resetModal, newPassword: newPw }) })
      .then(r => r.json()).then(d => { flash(d.message || d.error); setResetModal(null); setNewPw(''); });
  }

  function createAnnouncement() {
    if (!annMsg) return;
    fetch('/api/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: annMsg, type: annType }) })
      .then(r => r.json()).then(d => { flash(d.ok ? 'Announcement posted' : d.error); setAnnMsg('');
        fetch('/api/admin/announcements').then(r => r.json()).then(d => { if (d.announcements) setAnnouncements(d.announcements); });
      });
  }

  function deleteAnnouncement(id: string) {
    fetch('/api/admin/announcements', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      .then(() => fetch('/api/admin/announcements').then(r => r.json()).then(d => { if (d.announcements) setAnnouncements(d.announcements); }));
  }

  function saveFlag() {
    if (!flagKey) return;
    fetch('/api/admin/feature-flags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId: flagTenant === '_global' ? undefined : flagTenant, flags: { [flagKey]: flagVal } }) })
      .then(r => r.json()).then(d => { flash(d.ok ? 'Flag saved' : d.error); setFlagKey('');
        fetch('/api/admin/feature-flags').then(r => r.json()).then(d => { if (d.flags) setFlags(d.flags); });
      });
  }

  const filteredUsers = search ? users.filter(u => u.email?.includes(search) || u.org?.includes(search)) : users;

  if (error) return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="ap"><div className="ap-err">{error}<br /><a href="/login" style={{ color: '#5b9aff' }}>Back to login</a></div></div></>);

  const a = analytics;
  const statusColor: Record<string, string> = { active: '#34e8a5', idle: '#5b9aff', inactive: '#ffb340', churned: '#ff4466' };
  const annTypeColor: Record<string, string> = { info: '#5b9aff', warning: '#ffb340', critical: '#ff4466', success: '#34e8a5' };

  return (<>
    <style dangerouslySetInnerHTML={{ __html: CSS }} />
    <div className="ap">
      <div className="ap-hd">
        <div className="ap-logo"><div className="ap-logo-icon">W</div>Watchtower <span className="ap-badge">ADMIN</span></div>
        <div className="ap-nav">
          {(['overview','users','tenants','health','flags','announcements','audit'] as Tab[]).map(t => (<button key={t} className={'ap-tab ' + (tab === t ? 'active' : '')} onClick={() => setTab(t)}>{{overview:'📊',users:'👥',tenants:'🏢',health:'🏥',flags:'🚩',announcements:'📢',audit:'📋'}[t]} {t.charAt(0).toUpperCase()+t.slice(1)}</button>))}
          <a href="/dashboard" className="ap-tab">← Dashboard</a>
        </div>
      </div>
      {msg && <div className="ap-msg">{msg}</div>}

      {tab === 'overview' && a && <div className="ap-section">
        <h2>Platform Analytics</h2>
        <div className="ap-kpi-grid">
          <div className="ap-kpi"><div className="ap-kpi-val">{a.users?.total || 0}</div><div className="ap-kpi-label">Total Users</div></div>
          <div className="ap-kpi"><div className="ap-kpi-val">{a.tenants?.total || 0}</div><div className="ap-kpi-label">Tenants</div></div>
          <div className="ap-kpi"><div className="ap-kpi-val" style={{color:'#34e8a5'}}>£{a.billing?.mrr || 0}</div><div className="ap-kpi-label">MRR</div></div>
          <div className="ap-kpi"><div className="ap-kpi-val">{a.billing?.withStripe || 0}</div><div className="ap-kpi-label">Paying</div></div>
          <div className="ap-kpi"><div className="ap-kpi-val">{a.users?.today || 0}</div><div className="ap-kpi-label">Signups Today</div></div>
          <div className="ap-kpi"><div className="ap-kpi-val">{a.users?.week || 0}</div><div className="ap-kpi-label">This Week</div></div>
          <div className="ap-kpi"><div className="ap-kpi-val">{a.activity?.recentLogins || 0}</div><div className="ap-kpi-label">Logins (7d)</div></div>
          <div className="ap-kpi"><div className="ap-kpi-val">{a.trials?.active || 0}</div><div className="ap-kpi-label">Active Trials</div></div>
        </div>
        <div className="ap-grid2">
          <div className="ap-card"><h3>Plan Distribution</h3>{Object.entries(a.plans || {}).map(([plan, count]) => (<div key={plan} className="ap-bar-row"><span className={'ap-plan ' + plan}>{plan}</span><div className="ap-bar-track"><div className="ap-bar-fill" style={{width: Math.max(4, ((count as number) / (a.users?.total || 1)) * 100) + '%', background: plan === 'enterprise' ? '#8b6fff' : plan === 'pro' ? '#5b9aff' : '#4a5672'}} /></div><span className="ap-mono">{count as number}</span></div>))}</div>
          <div className="ap-card"><h3>Signup Trend (30d)</h3><div className="ap-spark">{Object.values(a.signupsByDay || {}).map((v, i) => (<div key={i} className="ap-spark-bar" style={{height: Math.max(2, ((v as number) / (Math.max(...Object.values(a.signupsByDay || {}).map(Number)) || 1)) * 60) + 'px'}} />))}</div></div>
        </div>
      </div>}

      {tab === 'users' && <div className="ap-section">
        <div className="ap-section-hd"><h2>Users ({users.length})</h2><input className="ap-search" placeholder="Search email or org..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <table className="ap-tbl"><thead><tr><th>Email</th><th>Org</th><th>Plan</th><th>Role</th><th>Created</th><th>Trial</th><th>Stripe</th><th>Actions</th></tr></thead><tbody>
          {filteredUsers.map(u => (<tr key={u.email}><td className="ap-mono">{u.email}</td><td>{u.org}</td><td><select value={u.plan} onChange={e => updateUser(u.email, { plan: e.target.value })} className="ap-select"><option value="starter">Starter</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select></td><td><select value={u.role} onChange={e => updateUser(u.email, { role: e.target.value })} className="ap-select"><option value="admin">Admin</option><option value="analyst">Analyst</option><option value="viewer">Viewer</option><option value="superadmin">Superadmin</option></select></td><td className="ap-ts">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td><td className="ap-ts">{u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleDateString() : '∞'}</td><td>{u.hasStripe ? '✅' : '—'}</td><td className="ap-actions"><button className="ap-btn" onClick={() => impersonate(u.email)} title="Impersonate">👁</button><button className="ap-btn" onClick={() => { setResetModal(u.email); setNewPw(''); }} title="Reset password">🔑</button>{u.role !== 'superadmin' && <button className="ap-btn ap-btn-danger" onClick={() => deleteUser(u.email)} title="Delete">🗑</button>}</td></tr>))}
        </tbody></table>
      </div>}

      {tab === 'tenants' && <div className="ap-section">
        <h2>Tenants ({tenants.length})</h2>
        <table className="ap-tbl"><thead><tr><th>ID</th><th>Name</th><th>Plan</th><th>Owner</th><th>Members</th><th>Created</th></tr></thead><tbody>
          {tenants.map(t => (<tr key={t.id}><td className="ap-mono" style={{fontSize:'.62rem'}}>{t.id}</td><td style={{fontWeight:700}}>{t.name}</td><td><span className={'ap-plan ' + t.plan}>{t.plan}</span></td><td className="ap-mono">{t.owner}</td><td>{t.memberCount}</td><td className="ap-ts">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</td></tr>))}
        </tbody></table>
      </div>}

      {tab === 'health' && <div className="ap-section">
        <h2>Tenant Health</h2>
        {health?.summary && <div className="ap-kpi-grid" style={{marginBottom:16}}>{Object.entries(health.summary).map(([k, v]) => (<div key={k} className="ap-kpi"><div className="ap-kpi-val" style={{color: statusColor[k] || '#8896b8'}}>{v as number}</div><div className="ap-kpi-label">{k}</div></div>))}</div>}
        <table className="ap-tbl"><thead><tr><th>Tenant</th><th>Plan</th><th>Tools</th><th>Connected</th><th>Last Active</th><th>Status</th></tr></thead><tbody>
          {(health?.health || []).map((h: any) => (<tr key={h.id}><td style={{fontWeight:700}}>{h.name}<div className="ap-ts">{h.owner}</div></td><td><span className={'ap-plan ' + h.plan}>{h.plan}</span></td><td className="ap-mono">{h.enabledTools}/{h.toolCount}</td><td style={{fontSize:'.65rem'}}>{h.toolNames?.join(', ') || '—'}</td><td className="ap-ts">{h.lastActive ? new Date(h.lastActive).toLocaleDateString() : '—'}<div style={{fontSize:'.55rem',color:'#4a5672'}}>{h.daysSinceActive}d ago</div></td><td><span className="ap-status" style={{background: (statusColor[h.status] || '#4a5672') + '20', color: statusColor[h.status] || '#4a5672'}}>{h.status}</span></td></tr>))}
        </tbody></table>
      </div>}

      {tab === 'flags' && <div className="ap-section">
        <h2>Feature Flags</h2>
        <div className="ap-card" style={{marginBottom:16}}>
          <div className="ap-flag-form"><select className="ap-select" value={flagTenant} onChange={e => setFlagTenant(e.target.value)}><option value="_global">Global (all tenants)</option>{tenants.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}</select><input className="ap-search" placeholder="Flag name (e.g. ai_copilot)" value={flagKey} onChange={e => setFlagKey(e.target.value)} style={{flex:1}} /><select className="ap-select" value={String(flagVal)} onChange={e => setFlagVal(e.target.value === 'true')}><option value="true">Enabled</option><option value="false">Disabled</option></select><button className="ap-btn-primary" onClick={saveFlag}>Save Flag</button></div>
        </div>
        {Object.entries(flags).map(([scope, scopeFlags]) => (<div key={scope} className="ap-card" style={{marginBottom:8}}><h4 style={{fontSize:'.78rem',marginBottom:8}}>{scope === '_global' ? '🌍 Global' : '🏢 ' + (tenants.find(t => t.id === scope)?.name || scope)}</h4>{Object.entries(scopeFlags as any).map(([k, v]) => (<div key={k} className="ap-flag-row"><span className="ap-mono">{k}</span><span style={{color: v ? '#34e8a5' : '#ff4466', fontWeight:700, fontSize:'.72rem'}}>{v ? '✓ ON' : '✗ OFF'}</span></div>))}</div>))}
      </div>}

      {tab === 'announcements' && <div className="ap-section">
        <h2>System Announcements</h2>
        <div className="ap-card" style={{marginBottom:16}}>
          <div className="ap-flag-form"><select className="ap-select" value={annType} onChange={e => setAnnType(e.target.value)}><option value="info">Info</option><option value="warning">Warning</option><option value="critical">Critical</option><option value="success">Success</option></select><input className="ap-search" placeholder="Announcement message..." value={annMsg} onChange={e => setAnnMsg(e.target.value)} style={{flex:1}} /><button className="ap-btn-primary" onClick={createAnnouncement}>Post</button></div>
        </div>
        {announcements.map(a => (<div key={a.id} className="ap-ann" style={{borderLeftColor: annTypeColor[a.type] || '#5b9aff'}}><div className="ap-ann-body"><div style={{fontSize:'.82rem',fontWeight:600}}>{a.message}</div><div className="ap-ts">{a.type} · {new Date(a.createdAt).toLocaleString()} · by {a.createdBy}</div></div><button className="ap-btn ap-btn-danger" onClick={() => deleteAnnouncement(a.id)}>✕</button></div>))}
      </div>}

      {tab === 'audit' && <div className="ap-section">
        <h2>Audit Log ({auditLogs.length})</h2>
        <table className="ap-tbl"><thead><tr><th>Time</th><th>Action</th><th>User</th><th>Details</th></tr></thead><tbody>
          {auditLogs.slice(0, 100).map((log, i) => (<tr key={i}><td className="ap-ts">{log.time ? new Date(log.time).toLocaleString() : '—'}</td><td><span className="ap-action">{log.action}</span></td><td className="ap-mono">{log.email || log.admin || log.by || log.target || '—'}</td><td style={{fontSize:'.65rem',color:'#8896b8',maxWidth:300,overflow:'hidden',textOverflow:'ellipsis'}}>{log.detail || log.plan || log.status || log.message || (log.changes ? JSON.stringify(log.changes) : '') || '—'}</td></tr>))}
        </tbody></table>
      </div>}

      {resetModal && <div className="ap-modal-overlay" onClick={() => setResetModal(null)}><div className="ap-modal" onClick={e => e.stopPropagation()}><h3>🔑 Reset Password</h3><p style={{fontSize:'.78rem',color:'#8896b8',margin:'8px 0'}}>Resetting password for <strong style={{color:'#eaf0ff'}}>{resetModal}</strong></p><input type="password" className="ap-input" placeholder="New password (min 8 chars)" value={newPw} onChange={e => setNewPw(e.target.value)} /><div style={{display:'flex',gap:8,marginTop:12}}><button className="ap-btn-primary" onClick={resetPassword} disabled={newPw.length < 8}>Reset Password</button><button className="ap-btn" onClick={() => setResetModal(null)}>Cancel</button></div></div></div>}
    </div>
  </>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#05070c;color:#eaf0ff;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
.ap{min-height:100vh;max-width:1280px;margin:0 auto;padding:20px}
.ap-err{text-align:center;padding:60px;font-size:1rem;color:#ff4466}
.ap-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px}
.ap-logo{display:flex;align-items:center;gap:8px;font-weight:900;font-size:1.05rem}
.ap-logo-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#5b9aff,#8b6fff);display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#fff;font-weight:900}
.ap-badge{font-size:.55rem;background:linear-gradient(135deg,#ff4466,#f97316);color:#fff;padding:2px 8px;border-radius:10px;letter-spacing:1px;font-weight:700}
.ap-nav{display:flex;gap:3px;flex-wrap:wrap}
.ap-tab{padding:6px 12px;border:1px solid #1e2840;border-radius:8px;background:transparent;color:#8896b8;font-size:.7rem;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s;text-decoration:none;white-space:nowrap}
.ap-tab:hover{border-color:#5b9aff;color:#5b9aff}.ap-tab.active{background:#5b9aff15;border-color:#5b9aff;color:#5b9aff}
.ap-msg{background:rgba(52,232,165,.1);border:1px solid rgba(52,232,165,.2);color:#34e8a5;padding:8px 16px;border-radius:8px;font-size:.76rem;margin-bottom:12px;text-align:center}
.ap-section h2{font-size:1.1rem;font-weight:800;margin-bottom:14px;letter-spacing:-.5px}
.ap-section-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px}
.ap-section-hd h2{margin-bottom:0}
.ap-kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:16px}
.ap-kpi{background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #141928;border-radius:12px;padding:14px;text-align:center}
.ap-kpi-val{font-size:1.5rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-2px}
.ap-kpi-label{font-size:.55rem;color:#4a5672;text-transform:uppercase;letter-spacing:.5px;font-weight:700;margin-top:2px}
.ap-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:768px){.ap-grid2{grid-template-columns:1fr}.ap-kpi-grid{grid-template-columns:repeat(2,1fr)}}
.ap-card{background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #141928;border-radius:12px;padding:16px}
.ap-card h3{font-size:.85rem;font-weight:800;margin-bottom:12px}
.ap-bar-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.ap-bar-track{flex:1;height:6px;background:#141928;border-radius:3px;overflow:hidden}
.ap-bar-fill{height:100%;border-radius:3px;transition:width .5s}
.ap-spark{display:flex;align-items:flex-end;gap:2px;height:60px;padding-top:4px}
.ap-spark-bar{flex:1;background:linear-gradient(180deg,#5b9aff,#5b9aff40);border-radius:2px 2px 0 0;min-width:3px;transition:height .3s}
.ap-tbl{width:100%;border-collapse:collapse;font-size:.76rem}
.ap-tbl thead{border-bottom:2px solid #1e2840}
.ap-tbl th{padding:8px 8px;text-align:left;color:#4a5672;font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.ap-tbl td{padding:7px 8px;border-bottom:1px solid #0f1219}
.ap-tbl tr:hover td{background:#0a0d1580}
.ap-mono{font-family:'JetBrains Mono',monospace;font-size:.68rem}
.ap-ts{font-size:.65rem;color:#4a5672}
.ap-select{background:#0f1219;border:1px solid #1e2840;color:#eaf0ff;padding:3px 6px;border-radius:6px;font-size:.68rem;font-family:'DM Sans',sans-serif;cursor:pointer}
.ap-select:focus{border-color:#5b9aff;outline:none}
.ap-search{background:#0f1219;border:1px solid #1e2840;color:#eaf0ff;padding:6px 12px;border-radius:8px;font-size:.76rem;font-family:'DM Sans',sans-serif;outline:none;min-width:180px}
.ap-search:focus{border-color:#5b9aff}
.ap-search::placeholder{color:#4a5672}
.ap-actions{display:flex;gap:3px}
.ap-btn{padding:4px 7px;border:1px solid #1e2840;border-radius:6px;background:transparent;color:#8896b8;cursor:pointer;font-size:.68rem;transition:all .15s}
.ap-btn:hover{border-color:#5b9aff;color:#5b9aff;background:#5b9aff10}
.ap-btn-danger:hover{border-color:#ff4466;color:#ff4466;background:#ff446610}
.ap-btn-primary{padding:6px 14px;border:none;border-radius:8px;background:linear-gradient(135deg,#5b9aff,#8b6fff);color:#fff;font-size:.76rem;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s}
.ap-btn-primary:hover{opacity:.9;transform:translateY(-1px)}
.ap-btn-primary:disabled{opacity:.5;cursor:not-allowed}
.ap-action{font-family:'JetBrains Mono',monospace;font-size:.6rem;background:#1e2840;padding:2px 6px;border-radius:4px;color:#8896b8}
.ap-plan{font-size:.58rem;font-weight:700;padding:2px 8px;border-radius:10px;text-transform:uppercase;letter-spacing:.5px}
@media(max-width:768px){
.ap{padding:12px}
.ap-hd{flex-direction:column;gap:8px}
.ap-nav{flex-wrap:wrap;gap:3px}
.ap-tab{padding:5px 8px;font-size:.65rem}
.ap-kpi-grid{grid-template-columns:repeat(2,1fr)!important;gap:8px}
.ap-kpi-val{font-size:1.1rem}
.ap-grid2{grid-template-columns:1fr!important}
.ap-tbl{font-size:.68rem}
.ap-tbl th{font-size:.5rem;padding:5px 4px}
.ap-tbl td{padding:5px 4px}
.ap-section h2{font-size:.95rem}
.ap-flag-form{flex-direction:column}
.ap-search{min-width:auto;width:100%}
}
.ap-plan.starter{background:#1e284040;color:#8896b8}.ap-plan.pro{background:#5b9aff15;color:#5b9aff}.ap-plan.enterprise{background:#8b6fff15;color:#8b6fff}
.ap-status{font-size:.6rem;font-weight:700;padding:2px 8px;border-radius:10px;text-transform:uppercase;letter-spacing:.3px}
.ap-flag-form{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.ap-flag-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #141928}
.ap-ann{display:flex;align-items:center;gap:12px;padding:12px;background:#0a0d15;border:1px solid #141928;border-left:3px solid;border-radius:8px;margin-bottom:8px}
.ap-ann-body{flex:1}
.ap-input{width:100%;padding:8px 12px;background:#0f1219;border:1px solid #1e2840;border-radius:8px;color:#eaf0ff;font-size:.82rem;font-family:'DM Sans',sans-serif;outline:none}
.ap-input:focus{border-color:#5b9aff}
.ap-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:200}
.ap-modal{background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #1e2840;border-radius:16px;padding:24px;max-width:400px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.5)}
.ap-modal h3{font-size:1rem;font-weight:800}
`;
