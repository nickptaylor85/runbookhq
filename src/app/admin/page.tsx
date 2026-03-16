'use client';
import { useState, useEffect } from 'react';

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [tab, setTab] = useState<'users'|'tenants'|'audit'>('users');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => { if (d.users) setUsers(d.users); else setError(d.error || 'Access denied'); });
    fetch('/api/admin/tenants').then(r => r.json()).then(d => { if (d.tenants) setTenants(d.tenants); });
    fetch('/api/audit').then(r => r.json()).then(d => { if (d.logs) setAuditLogs(d.logs); });
  }, []);

  function updateUser(email: string, changes: any) {
    fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, ...changes }) })
      .then(r => r.json()).then(d => { setMsg(d.message || d.error); setTimeout(() => setMsg(''), 3000);
        fetch('/api/admin/users').then(r => r.json()).then(d => { if (d.users) setUsers(d.users); });
      });
  }

  function impersonate(email: string) {
    if (!confirm(`Impersonate ${email}? You will see their dashboard.`)) return;
    fetch('/api/admin/impersonate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      .then(r => r.json()).then(d => { if (d.ok) window.location.href = '/dashboard'; else alert(d.error); });
  }

  function deleteUser(email: string) {
    if (!confirm(`Delete ${email}? This cannot be undone.`)) return;
    fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      .then(r => r.json()).then(d => { setMsg(d.ok ? 'Deleted' : d.error); fetch('/api/admin/users').then(r => r.json()).then(d => { if (d.users) setUsers(d.users); }); });
  }

  if (error) return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="ap"><div className="ap-err">{error}<br /><a href="/login" style={{ color: '#5b9aff' }}>Back to login</a></div></div></>);

  return (<>
    <style dangerouslySetInnerHTML={{ __html: CSS }} />
    <div className="ap">
      <div className="ap-hd">
        <div className="ap-logo"><div className="ap-logo-icon">S</div>RunbookHQ <span className="ap-badge">ADMIN</span></div>
        <div className="ap-nav">
          <button className={`ap-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>👥 Users ({users.length})</button>
          <button className={`ap-tab ${tab === 'tenants' ? 'active' : ''}`} onClick={() => setTab('tenants')}>🏢 Tenants ({tenants.length})</button>
          <button className={`ap-tab ${tab === 'audit' ? 'active' : ''}`} onClick={() => setTab('audit')}>📋 Audit Log</button>
          <a href="/dashboard" className="ap-tab">← Dashboard</a>
        </div>
      </div>
      {msg && <div className="ap-msg">{msg}</div>}

      {tab === 'users' && <div className="ap-section">
        <h2>All Users</h2>
        <table className="ap-tbl">
          <thead><tr><th>Email</th><th>Org</th><th>Plan</th><th>Role</th><th>Created</th><th>Trial Ends</th><th>Stripe</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.email}>
                <td className="ap-mono">{u.email}</td>
                <td>{u.org}</td>
                <td>
                  <select value={u.plan} onChange={e => updateUser(u.email, { plan: e.target.value })} className="ap-select">
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </td>
                <td>
                  <select value={u.role} onChange={e => updateUser(u.email, { role: e.target.value })} className="ap-select">
                    <option value="admin">Admin</option>
                    <option value="analyst">Analyst</option>
                    <option value="viewer">Viewer</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </td>
                <td className="ap-ts">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                <td className="ap-ts">{u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleDateString() : '—'}</td>
                <td>{u.hasStripe ? '✅' : '—'}</td>
                <td>
                  <button className="ap-btn" onClick={() => impersonate(u.email)} title="View as this user">👁</button>
                  {u.role !== 'superadmin' && <button className="ap-btn ap-btn-danger" onClick={() => deleteUser(u.email)} title="Delete">🗑</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}

      {tab === 'tenants' && <div className="ap-section">
        <h2>All Tenants</h2>
        <table className="ap-tbl">
          <thead><tr><th>ID</th><th>Name</th><th>Plan</th><th>Owner</th><th>Members</th><th>Created</th></tr></thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id}>
                <td className="ap-mono" style={{ fontSize: '.65rem' }}>{t.id}</td>
                <td style={{ fontWeight: 700 }}>{t.name}</td>
                <td><span className={`ap-plan ${t.plan}`}>{t.plan}</span></td>
                <td className="ap-mono">{t.owner}</td>
                <td>{t.memberCount}</td>
                <td className="ap-ts">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}

      {tab === 'audit' && <div className="ap-section">
        <h2>Audit Log</h2>
        <table className="ap-tbl">
          <thead><tr><th>Time</th><th>Action</th><th>User</th><th>Details</th></tr></thead>
          <tbody>
            {auditLogs.slice(0, 50).map((log, i) => (
              <tr key={i}>
                <td className="ap-ts">{log.time ? new Date(log.time).toLocaleString() : '—'}</td>
                <td><span className="ap-action">{log.action}</span></td>
                <td className="ap-mono">{log.email || log.admin || log.target || '—'}</td>
                <td style={{ fontSize: '.68rem', color: '#8896b8', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.detail || log.plan || log.status || (log.changes ? JSON.stringify(log.changes) : '') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  </>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#05070c;color:#eaf0ff;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
.ap{min-height:100vh;max-width:1200px;margin:0 auto;padding:20px}
.ap-err{text-align:center;padding:60px;font-size:1rem;color:#ff4466}
.ap-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
.ap-logo{display:flex;align-items:center;gap:8px;font-weight:900;font-size:1.05rem}
.ap-logo-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#5b9aff,#8b6fff);display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#fff;font-weight:900}
.ap-badge{font-size:.55rem;background:linear-gradient(135deg,#ff4466,#f97316);color:#fff;padding:2px 8px;border-radius:10px;letter-spacing:1px;font-weight:700}
.ap-nav{display:flex;gap:4px;flex-wrap:wrap}
.ap-tab{padding:8px 14px;border:1px solid #1e2840;border-radius:8px;background:transparent;color:#8896b8;font-size:.76rem;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s;text-decoration:none}
.ap-tab:hover{border-color:#5b9aff;color:#5b9aff}
.ap-tab.active{background:#5b9aff15;border-color:#5b9aff;color:#5b9aff}
.ap-msg{background:rgba(52,232,165,.1);border:1px solid rgba(52,232,165,.2);color:#34e8a5;padding:8px 16px;border-radius:8px;font-size:.78rem;margin-bottom:16px;text-align:center}
.ap-section h2{font-size:1.1rem;font-weight:800;margin-bottom:16px;letter-spacing:-.5px}
.ap-tbl{width:100%;border-collapse:collapse;font-size:.78rem}
.ap-tbl thead{border-bottom:2px solid #1e2840}
.ap-tbl th{padding:8px 10px;text-align:left;color:#4a5672;font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.ap-tbl td{padding:8px 10px;border-bottom:1px solid #141928}
.ap-tbl tr:hover td{background:#0a0d1580}
.ap-mono{font-family:'JetBrains Mono',monospace;font-size:.7rem}
.ap-ts{font-size:.68rem;color:#4a5672}
.ap-select{background:#0f1219;border:1px solid #1e2840;color:#eaf0ff;padding:3px 6px;border-radius:6px;font-size:.7rem;font-family:'DM Sans',sans-serif;cursor:pointer}
.ap-select:focus{border-color:#5b9aff;outline:none}
.ap-btn{padding:4px 8px;border:1px solid #1e2840;border-radius:6px;background:transparent;color:#8896b8;cursor:pointer;font-size:.7rem;transition:all .15s;margin-right:4px}
.ap-btn:hover{border-color:#5b9aff;color:#5b9aff;background:#5b9aff10}
.ap-btn-danger:hover{border-color:#ff4466;color:#ff4466;background:#ff446610}
.ap-action{font-family:'JetBrains Mono',monospace;font-size:.65rem;background:#1e2840;padding:2px 6px;border-radius:4px;color:#8896b8}
.ap-plan{font-size:.6rem;font-weight:700;padding:2px 8px;border-radius:10px;text-transform:uppercase;letter-spacing:.5px}
.ap-plan.starter{background:#1e284040;color:#8896b8}
.ap-plan.pro{background:#5b9aff15;color:#5b9aff}
.ap-plan.enterprise{background:#8b6fff15;color:#8b6fff}
`;
