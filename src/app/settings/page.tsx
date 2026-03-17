'use client';
import { useState, useEffect } from 'react';

type Tab = 'security'|'team'|'sessions'|'apikeys'|'webhooks'|'emails';

export default function Settings() {
  const [tab, setTab] = useState<Tab>('security');
  const [user, setUser] = useState<any>(null);
  const [totpSetup, setTotpSetup] = useState<any>(null);
  const [totpCode, setTotpCode] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState('analyst');
  const [invResult, setInvResult] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);const [newKeyName, setNewKeyName] = useState('');const [newKeyResult, setNewKeyResult] = useState<any>(null);
  const [webhooks, setWebhooks] = useState<any[]>([]);const [whUrl, setWhUrl] = useState('');const [whName, setWhName] = useState('');
  const [emailPrefs, setEmailPrefs] = useState<any>({ dailyDigest: false, weeklyReport: false, alertNotify: false });

  function flash(m: string) { setMsg(m); setErr(''); setTimeout(() => setMsg(''), 4000); }
  function flashErr(e: string) { setErr(e); setMsg(''); setTimeout(() => setErr(''), 4000); }

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d));
    fetch('/api/auth/invite').then(r => r.json()).then(d => { if (d.members) setMembers(d.members); if (d.pendingInvites) setInvites(d.pendingInvites); });
    fetch('/api/auth/api-keys').then(r => r.json()).then(d => { if (d.keys) setApiKeys(d.keys); });
    fetch('/api/webhooks').then(r => r.json()).then(d => { if (d.webhooks) setWebhooks(d.webhooks); });
    fetch('/api/auth/sessions').then(r => r.json()).then(d => { if (d.sessions) setSessions(d.sessions); });
  }, []);

  async function setup2fa() {
    const r = await fetch('/api/auth/totp');
    const d = await r.json();
    if (d.enabled) { flash('2FA is already enabled'); return; }
    setTotpSetup(d);
  }

  async function verify2fa() {
    const r = await fetch('/api/auth/totp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: totpCode }) });
    const d = await r.json();
    if (d.ok) { flash(d.message); setTotpSetup(null); setTotpCode(''); fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d)); }
    else flashErr(d.error);
  }

  async function disable2fa() {
    const code = prompt('Enter your current authenticator code to disable 2FA:');
    if (!code) return;
    const r = await fetch('/api/auth/totp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'disable', code }) });
    const d = await r.json();
    if (d.ok) { flash(d.message); fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d)); }
    else flashErr(d.error);
  }

  async function inviteMember() {
    if (!invEmail) return;
    const r = await fetch('/api/auth/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: invEmail, role: invRole }) });
    const d = await r.json();
    if (d.ok) { setInvResult(d); setInvEmail(''); flash(d.message); fetch('/api/auth/invite').then(r => r.json()).then(d => { if (d.members) setMembers(d.members); if (d.pendingInvites) setInvites(d.pendingInvites); }); }
    else flashErr(d.error);
  }

  async function removeMember(email: string) {
    if (!confirm('Remove ' + email + ' from the team?')) return;
    const r = await fetch('/api/auth/invite', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const d = await r.json();
    if (d.ok) { flash(d.message); fetch('/api/auth/invite').then(r => r.json()).then(d => { if (d.members) setMembers(d.members); }); }
    else flashErr(d.error);
  }

  async function revokeAllSessions() {
    if (!confirm('Revoke all other sessions? You will stay logged in.')) return;
    await fetch('/api/auth/sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) });
    flash('All other sessions revoked');
    fetch('/api/auth/api-keys').then(r => r.json()).then(d => { if (d.keys) setApiKeys(d.keys); });
    fetch('/api/webhooks').then(r => r.json()).then(d => { if (d.webhooks) setWebhooks(d.webhooks); });
    fetch('/api/auth/sessions').then(r => r.json()).then(d => { if (d.sessions) setSessions(d.sessions); });
  }

  const u = user?.user;

  return (<>
    <style dangerouslySetInnerHTML={{ __html: CSS }} />
    <div className="sp">
      <div className="sp-hd">
        <div className="sp-logo"><div className="sp-logo-icon">W</div>Watchtower <span style={{color:'#8896b8',fontWeight:500,fontSize:'.82rem',marginLeft:4}}>Settings</span></div>
        <div className="sp-nav">
          <button className={'sp-tab ' + (tab === 'security' ? 'active' : '')} onClick={() => setTab('security')}>🔒 Security</button>
          <button className={'sp-tab ' + (tab === 'team' ? 'active' : '')} onClick={() => setTab('team')}>👥 Team</button>
          <button className={'sp-tab ' + (tab === 'sessions' ? 'active' : '')} onClick={() => setTab('sessions')}>📱 Sessions</button>
          <button className={'sp-tab ' + (tab === 'apikeys' ? 'active' : '')} onClick={() => setTab('apikeys')}>🔑 API Keys</button>
          <button className={'sp-tab ' + (tab === 'webhooks' ? 'active' : '')} onClick={() => setTab('webhooks')}>🔗 Webhooks</button>
          <button className={'sp-tab ' + (tab === 'emails' ? 'active' : '')} onClick={() => setTab('emails')}>📧 Emails</button>
          <a href="/dashboard" className="sp-tab">← Dashboard</a>
        </div>
      </div>
      {msg && <div className="sp-msg">{msg}</div>}
      {err && <div className="sp-err">{err}</div>}

      {tab === 'security' && <div className="sp-section">
        <h2>Two-Factor Authentication</h2>
        <div className="sp-card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:'.88rem',fontWeight:700}}>{u?.totpEnabled ? '🔐 2FA is enabled' : '⚠️ 2FA is not enabled'}</div>
              <div style={{fontSize:'.72rem',color:'#8896b8',marginTop:4}}>{u?.totpEnabled ? 'Your account is protected with an authenticator app.' : 'Add an authenticator app for stronger security.'}</div>
            </div>
            {u?.totpEnabled ? <button className="sp-btn sp-btn-danger" onClick={disable2fa}>Disable 2FA</button> : <button className="sp-btn sp-btn-primary" onClick={setup2fa}>Enable 2FA</button>}
          </div>
        </div>

        {totpSetup && !totpSetup.enabled && <div className="sp-card" style={{marginTop:12}}>
          <h3 style={{marginBottom:12}}>Scan this QR code</h3>
          <div style={{textAlign:'center',marginBottom:16}}>
            <div style={{display:'inline-block',padding:16,background:'#fff',borderRadius:12}}>
              <img src={'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(totpSetup.uri)} alt="QR Code" width={200} height={200} style={{display:'block'}} />
            </div>
          </div>
          <div style={{fontSize:'.68rem',color:'#8896b8',textAlign:'center',marginBottom:4}}>Or enter this key manually:</div>
          <div style={{textAlign:'center',fontSize:'.78rem',fontFamily:'JetBrains Mono,monospace',color:'#5b9aff',background:'#0f1219',padding:'8px 12px',borderRadius:8,border:'1px solid #1e2840',marginBottom:16,wordBreak:'break-all'}}>{totpSetup.secret}</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="text" value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').substring(0, 6))} placeholder="000000" maxLength={6} style={{flex:1,padding:'10px 14px',background:'#0f1219',border:'1px solid #1e2840',borderRadius:10,color:'#eaf0ff',fontSize:'1.2rem',textAlign:'center',letterSpacing:'6px',fontFamily:'JetBrains Mono,monospace',outline:'none'}} />
            <button className="sp-btn sp-btn-primary" onClick={verify2fa} disabled={totpCode.length !== 6}>Verify & Enable</button>
          </div>
        </div>}

        <h2 style={{marginTop:28}}>Password</h2>
        <div className="sp-card">
          <div style={{fontSize:'.78rem',color:'#8896b8'}}>Passwords are hashed with PBKDF2-SHA512 (100,000 iterations). To change your password, contact your administrator or use the admin panel.</div>
        </div>
      </div>}

      {tab === 'team' && <div className="sp-section">
        <h2>Team Members ({members.length})</h2>
        <div className="sp-card" style={{marginBottom:16}}>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <input type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)} placeholder="colleague@company.com" style={{flex:1,minWidth:200,padding:'8px 12px',background:'#0f1219',border:'1px solid #1e2840',borderRadius:8,color:'#eaf0ff',fontSize:'.82rem',fontFamily:'DM Sans,sans-serif',outline:'none'}} />
            <select value={invRole} onChange={e => setInvRole(e.target.value)} style={{padding:'8px 12px',background:'#0f1219',border:'1px solid #1e2840',borderRadius:8,color:'#eaf0ff',fontSize:'.78rem',fontFamily:'DM Sans,sans-serif',cursor:'pointer'}}>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <button className="sp-btn sp-btn-primary" onClick={inviteMember}>Invite →</button>
          </div>
          {invResult?.tempPassword && <div style={{marginTop:10,padding:'10px 12px',background:'rgba(52,232,165,.08)',border:'1px solid rgba(52,232,165,.15)',borderRadius:8,fontSize:'.76rem'}}>
            <div style={{fontWeight:700,color:'#34e8a5'}}>✓ Invite created</div>
            <div style={{color:'#8896b8',marginTop:4}}>Temporary password: <span style={{fontFamily:'JetBrains Mono,monospace',color:'#eaf0ff',background:'#1e2840',padding:'2px 6px',borderRadius:4}}>{invResult.tempPassword}</span></div>
            <div style={{color:'#4a5672',fontSize:'.68rem',marginTop:4}}>Share this securely — they must change it on first login.</div>
          </div>}
        </div>

        <div className="sp-card">
          <table className="sp-tbl">
            <thead><tr><th>Email</th><th>Role</th><th>2FA</th><th>Last Login</th><th>Actions</th></tr></thead>
            <tbody>
              {members.map(m => (<tr key={m.email}><td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.72rem'}}>{m.email}</td><td><span className={'sp-role ' + m.role}>{m.role}</span></td><td>{m.totpEnabled ? <span style={{color:'#34e8a5'}}>✓ On</span> : <span style={{color:'#4a5672'}}>Off</span>}</td><td style={{fontSize:'.68rem',color:'#4a5672'}}>{m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString() : 'Never'}</td><td>{m.email !== u?.email && <button className="sp-btn-sm sp-btn-danger" onClick={() => removeMember(m.email)}>Remove</button>}</td></tr>))}
            </tbody>
          </table>
        </div>

        <div style={{marginTop:12,fontSize:'.72rem',color:'#4a5672'}}>
          <strong>Roles:</strong> Admin — full access + team management · Analyst — view + triage + respond · Viewer — read-only dashboard access
        </div>
      </div>}

      {tab === 'sessions' && <div className="sp-section">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <h2>Active Sessions</h2>
          <button className="sp-btn sp-btn-danger" onClick={revokeAllSessions}>Revoke All Other Sessions</button>
        </div>
        <div className="sp-card">
          <table className="sp-tbl">
            <thead><tr><th>Session</th><th>IP Address</th><th>Browser</th><th>Created</th></tr></thead>
            <tbody>
              {sessions.map((s, i) => (<tr key={i}><td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.72rem'}}>{s.id} {i === 0 && <span style={{color:'#34e8a5',fontSize:'.6rem',fontWeight:700}}>CURRENT</span>}</td><td style={{fontSize:'.72rem'}}>{s.ip}</td><td style={{fontSize:'.68rem',color:'#4a5672',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis'}}>{s.userAgent}</td><td style={{fontSize:'.68rem',color:'#4a5672'}}>{s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}</td></tr>))}
              {sessions.length === 0 && <tr><td colSpan={4} style={{textAlign:'center',color:'#4a5672',padding:20}}>No active sessions</td></tr>}
            </tbody>
          </table>
        </div>
      </div>}

      {tab === 'apikeys' && <div className="sp-section">
        <h2>API Keys</h2>
        <div className="sp-card" style={{marginBottom:16}}>
          <div style={{display:'flex',gap:8}}>
            <input type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key name (e.g. SIEM Integration)" style={{flex:1,padding:'8px 12px',background:'#0f1219',border:'1px solid #1e2840',borderRadius:8,color:'#eaf0ff',fontSize:'.82rem',fontFamily:'DM Sans,sans-serif',outline:'none'}} />
            <button className="sp-btn sp-btn-primary" onClick={() => { fetch('/api/auth/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newKeyName, scopes: ['read', 'write'] }) }).then(r => r.json()).then(d => { if (d.ok) { setNewKeyResult(d); setNewKeyName(''); fetch('/api/auth/api-keys').then(r => r.json()).then(d => { if (d.keys) setApiKeys(d.keys); }); } else flashErr(d.error); }); }}>Generate Key</button>
          </div>
          {newKeyResult && <div style={{marginTop:12,padding:'12px',background:'rgba(52,232,165,.08)',border:'1px solid rgba(52,232,165,.15)',borderRadius:8}}><div style={{fontWeight:700,color:'#34e8a5',fontSize:'.78rem'}}>✓ Key created — copy it now</div><div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.72rem',color:'#eaf0ff',background:'#1e2840',padding:'8px 12px',borderRadius:6,marginTop:8,wordBreak:'break-all'}}>{newKeyResult.key}</div><div style={{fontSize:'.65rem',color:'#4a5672',marginTop:6}}>This key will not be shown again. Use it as X-API-Key header or Bearer token.</div></div>}
        </div>
        <div className="sp-card">
          <table className="sp-tbl"><thead><tr><th>Name</th><th>Key</th><th>Scopes</th><th>Created</th><th>Last Used</th><th>Actions</th></tr></thead><tbody>
            {apiKeys.map(k => (<tr key={k.id}><td style={{fontWeight:600}}>{k.name}</td><td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.68rem',color:'#4a5672'}}>{k.prefix}</td><td style={{fontSize:'.65rem'}}>{k.scopes?.join(', ')}</td><td style={{fontSize:'.68rem',color:'#4a5672'}}>{k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '—'}</td><td style={{fontSize:'.68rem',color:'#4a5672'}}>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}</td><td><button className="sp-btn-sm sp-btn-danger" onClick={() => { if (confirm('Revoke this API key?')) fetch('/api/auth/api-keys', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: k.id }) }).then(() => fetch('/api/auth/api-keys').then(r => r.json()).then(d => { if (d.keys) setApiKeys(d.keys); })); }}>Revoke</button></td></tr>))}
            {apiKeys.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',color:'#4a5672',padding:20}}>No API keys yet</td></tr>}
          </tbody></table>
        </div>
        <div style={{marginTop:12,fontSize:'.72rem',color:'#4a5672'}}><strong>Usage:</strong> Include <code style={{background:'#1e2840',padding:'1px 4px',borderRadius:3}}>X-API-Key: wt_xxx</code> header in requests to any /api/ endpoint.</div>
      </div>}

      {tab === 'emails' && <div className="sp-section">
        <h2>Email Notifications</h2>
        <div className="sp-card">
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <label style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}}><div><div style={{fontWeight:700,fontSize:'.85rem'}}>📊 Daily Digest</div><div style={{fontSize:'.7rem',color:'#8896b8',marginTop:2}}>Morning summary of incidents, SLA status, and AI stats at 8am UTC</div></div><label className="sp-toggle"><input type="checkbox" checked={emailPrefs.dailyDigest} onChange={e => { const p = { ...emailPrefs, dailyDigest: e.target.checked }; setEmailPrefs(p); fetch('/api/tools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toolId: '_emailPrefs', credentials: p, enabled: true }) }); }} /><span className="sp-toggle-slider" /></label></label>
            <label style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}}><div><div style={{fontWeight:700,fontSize:'.85rem'}}>📈 Weekly Report</div><div style={{fontSize:'.7rem',color:'#8896b8',marginTop:2}}>Monday morning email with link to your full PDF posture report</div></div><label className="sp-toggle"><input type="checkbox" checked={emailPrefs.weeklyReport} onChange={e => { const p = { ...emailPrefs, weeklyReport: e.target.checked }; setEmailPrefs(p); fetch('/api/tools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toolId: '_emailPrefs', credentials: p, enabled: true }) }); }} /><span className="sp-toggle-slider" /></label></label>
            <label style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}}><div><div style={{fontWeight:700,fontSize:'.85rem'}}>🚨 Critical Alerts</div><div style={{fontSize:'.7rem',color:'#8896b8',marginTop:2}}>Immediate email for new critical severity alerts</div></div><label className="sp-toggle"><input type="checkbox" checked={emailPrefs.alertNotify} onChange={e => { const p = { ...emailPrefs, alertNotify: e.target.checked }; setEmailPrefs(p); fetch('/api/tools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toolId: '_emailPrefs', credentials: p, enabled: true }) }); }} /><span className="sp-toggle-slider" /></label></label>
          </div>
          <div style={{marginTop:14,fontSize:'.68rem',color:'#4a5672'}}>Requires RESEND_API_KEY environment variable. Cron runs hourly via Vercel.</div>
        </div>
      </div>}

      {tab === 'webhooks' && <div className="sp-section">
        <h2>Outbound Webhooks</h2>
        <div className="sp-card" style={{marginBottom:16}}>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <input type="text" value={whName} onChange={e => setWhName(e.target.value)} placeholder="Name" style={{width:140,padding:'8px 12px',background:'#0f1219',border:'1px solid #1e2840',borderRadius:8,color:'#eaf0ff',fontSize:'.82rem',fontFamily:'DM Sans,sans-serif',outline:'none'}} />
            <input type="url" value={whUrl} onChange={e => setWhUrl(e.target.value)} placeholder="https://your-siem.com/webhook" style={{flex:1,minWidth:200,padding:'8px 12px',background:'#0f1219',border:'1px solid #1e2840',borderRadius:8,color:'#eaf0ff',fontSize:'.82rem',fontFamily:'DM Sans,sans-serif',outline:'none'}} />
            <button className="sp-btn sp-btn-primary" onClick={() => { fetch('/api/webhooks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', name: whName, url: whUrl }) }).then(r => r.json()).then(d => { if (d.ok) { setWhUrl(''); setWhName(''); flash('Webhook created'); fetch('/api/webhooks').then(r => r.json()).then(d => { if (d.webhooks) setWebhooks(d.webhooks); }); } }); }}>Add Webhook</button>
          </div>
        </div>
        <div className="sp-card">
          <table className="sp-tbl"><thead><tr><th>Name</th><th>URL</th><th>Events</th><th>Created</th><th>Actions</th></tr></thead><tbody>
            {webhooks.map((w: any) => (<tr key={w.id}><td style={{fontWeight:600}}>{w.name}</td><td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.65rem',color:'#4a5672',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis'}}>{w.url}</td><td style={{fontSize:'.6rem'}}>{w.events?.join(', ')}</td><td style={{fontSize:'.68rem',color:'#4a5672'}}>{w.createdAt ? new Date(w.createdAt).toLocaleDateString() : '—'}</td><td><button className="sp-btn-sm sp-btn-danger" onClick={() => { fetch('/api/webhooks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', webhookId: w.id }) }).then(() => fetch('/api/webhooks').then(r => r.json()).then(d => { if (d.webhooks) setWebhooks(d.webhooks); })); }}>Delete</button></td></tr>))}
            {webhooks.length === 0 && <tr><td colSpan={5} style={{textAlign:'center',color:'#4a5672',padding:20}}>No webhooks configured</td></tr>}
          </tbody></table>
        </div>
        <div style={{marginTop:12,fontSize:'.72rem',color:'#4a5672'}}><strong>Events:</strong> alert.critical, sla.breach, incident.created, incident.closed. Webhook receives POST with JSON payload.</div>
      </div>}
    </div>
  </>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#05070c;color:#eaf0ff;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
.sp{min-height:100vh;max-width:800px;margin:0 auto;padding:20px}
.sp-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
.sp-logo{display:flex;align-items:center;gap:8px;font-weight:900;font-size:1.05rem}
.sp-logo-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#5b9aff,#8b6fff);display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#fff;font-weight:900}
.sp-nav{display:flex;gap:4px;flex-wrap:wrap}
.sp-tab{padding:7px 14px;border:1px solid #1e2840;border-radius:8px;background:transparent;color:#8896b8;font-size:.74rem;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s;text-decoration:none}
.sp-tab:hover{border-color:#5b9aff;color:#5b9aff}.sp-tab.active{background:#5b9aff15;border-color:#5b9aff;color:#5b9aff}
.sp-msg{background:rgba(52,232,165,.1);border:1px solid rgba(52,232,165,.2);color:#34e8a5;padding:8px 16px;border-radius:8px;font-size:.78rem;margin-bottom:14px;text-align:center}
.sp-err{background:rgba(255,68,102,.1);border:1px solid rgba(255,68,102,.15);color:#ff4466;padding:8px 16px;border-radius:8px;font-size:.78rem;margin-bottom:14px;text-align:center}
.sp-section h2{font-size:1rem;font-weight:800;margin-bottom:12px;letter-spacing:-.5px}
.sp-card{background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #141928;border-radius:14px;padding:20px}
.sp-card h3{font-size:.85rem;font-weight:800}
.sp-btn{padding:8px 16px;border:1px solid #1e2840;border-radius:8px;background:transparent;color:#8896b8;font-size:.76rem;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s}
.sp-btn:hover{border-color:#5b9aff;color:#5b9aff}
.sp-btn-primary{background:linear-gradient(135deg,#5b9aff,#8b6fff);border:none;color:#fff;box-shadow:0 2px 8px rgba(91,154,255,.2)}
.sp-btn-primary:hover{opacity:.9;transform:translateY(-1px)}
.sp-btn-primary:disabled{opacity:.5;cursor:not-allowed}
.sp-btn-danger{border-color:rgba(255,68,102,.2);color:#ff4466}
.sp-btn-danger:hover{background:rgba(255,68,102,.08);border-color:#ff4466}
.sp-btn-sm{padding:4px 10px;font-size:.68rem;border:1px solid #1e2840;border-radius:6px;background:transparent;color:#8896b8;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.sp-btn-sm:hover{border-color:#5b9aff;color:#5b9aff}
.sp-btn-sm.sp-btn-danger{color:#ff4466}.sp-btn-sm.sp-btn-danger:hover{border-color:#ff4466;background:rgba(255,68,102,.08)}
.sp-tbl{width:100%;border-collapse:collapse;font-size:.78rem}
.sp-tbl th{text-align:left;padding:8px 8px;color:#4a5672;font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #1e2840}
.sp-tbl td{padding:8px;border-bottom:1px solid #0f1219}
.sp-tbl tr:hover td{background:#0a0d1580}
.sp-role{font-size:.6rem;font-weight:700;padding:2px 8px;border-radius:10px;text-transform:uppercase;letter-spacing:.3px}
@media(max-width:768px){
.sp{padding:12px}
.sp-hd{flex-direction:column;gap:8px}
.sp-nav{flex-wrap:wrap;gap:3px}
.sp-tab{padding:5px 10px;font-size:.68rem}
.sp-card{padding:14px}
.sp-tbl{font-size:.7rem}
.sp-tbl th{font-size:.52rem;padding:5px 4px}
.sp-tbl td{padding:5px 4px}
.sp-btn{padding:6px 12px;font-size:.7rem}
.sp-section h2{font-size:.9rem}
}
.sp-toggle{position:relative;width:40px;height:22px;cursor:pointer}
.sp-toggle input{opacity:0;width:0;height:0}
.sp-toggle-slider{position:absolute;inset:0;background:#1e2840;border-radius:22px;transition:.3s}
.sp-toggle-slider::before{content:'';position:absolute;width:16px;height:16px;border-radius:50%;background:#4a5672;bottom:3px;left:3px;transition:.3s}
.sp-toggle input:checked+.sp-toggle-slider{background:#5b9aff30}
.sp-toggle input:checked+.sp-toggle-slider::before{transform:translateX(18px);background:#5b9aff}
.sp-role.admin{background:#5b9aff15;color:#5b9aff}.sp-role.analyst{background:#34e8a515;color:#34e8a5}.sp-role.viewer{background:#ffb34015;color:#ffb340}.sp-role.superadmin{background:#8b6fff15;color:#8b6fff}
`;
