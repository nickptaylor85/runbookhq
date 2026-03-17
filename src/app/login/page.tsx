'use client';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [needs2fa, setNeeds2fa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);setError('');
    try {
      const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, totpCode: needs2fa ? totpCode : undefined }) });
      const d = await r.json();
      if (d.ok) window.location.href = '/dashboard';
      else if (d.requires2fa) { setNeeds2fa(true); setError(''); }
      else setError(d.error || 'Invalid credentials');
    } catch { setError('Network error'); }
    setLoading(false);
  }

  return (<>
    <style dangerouslySetInnerHTML={{__html: CSS}} />
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><div className="auth-logo-icon">S</div>RunbookHQ</div>
        <h1 className="auth-title">{needs2fa ? 'Two-Factor Authentication' : 'Welcome back'}</h1>
        <p className="auth-sub">{needs2fa ? 'Enter the code from your authenticator app.' : 'Sign in to your SOC dashboard.'}</p>
        <form onSubmit={handleLogin}>
          {!needs2fa && <>
            <div className="auth-field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" required /></div>
            <div className="auth-field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" required /></div>
          </>}
          {needs2fa && <div className="auth-field"><label>Authenticator Code</label><input type="text" value={totpCode} onChange={e=>setTotpCode(e.target.value.replace(/\D/g,'').substring(0,6))} placeholder="000000" required autoFocus maxLength={6} style={{fontSize:'1.5rem',textAlign:'center',letterSpacing:'8px',fontFamily:'JetBrains Mono,monospace'}} /></div>}
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Verifying...' : needs2fa ? 'Verify →' : 'Sign In'}</button>
        </form>
        {needs2fa && <button onClick={()=>{setNeeds2fa(false);setTotpCode('');setError('')}} style={{background:'none',border:'none',color:'#5b9aff',cursor:'pointer',fontSize:'.76rem',marginTop:12,display:'block',textAlign:'center',width:'100%'}}>← Back to login</button>}
        {!needs2fa && <p className="auth-link">No account yet? <a href="/signup">Start free trial</a></p>}
      </div>
    </div>
  </>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#05070c;color:#eaf0ff;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
.auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at 50% 30%,rgba(91,154,255,.04),transparent 60%)}
.auth-card{width:100%;max-width:420px;background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #141928;border-radius:20px;padding:40px 32px}
.auth-logo{display:flex;align-items:center;gap:8px;font-weight:900;font-size:1rem;margin-bottom:28px;justify-content:center}
.auth-logo-icon{width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#5b9aff,#8b6fff);display:flex;align-items:center;justify-content:center;font-size:.65rem;color:#fff;font-weight:900}
.auth-title{font-size:1.4rem;font-weight:900;letter-spacing:-1px;text-align:center;margin-bottom:6px}
.auth-sub{font-size:.78rem;color:#8896b8;text-align:center;margin-bottom:28px}
.auth-field{margin-bottom:16px}
.auth-field label{display:block;font-size:.72rem;font-weight:600;color:#8896b8;margin-bottom:5px}
.auth-field input{width:100%;padding:10px 14px;background:#0f1219;border:1px solid #1e2840;border-radius:10px;color:#eaf0ff;font-size:.85rem;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s}
.auth-field input:focus{border-color:#5b9aff}
.auth-field input::placeholder{color:#4a5672}
.auth-error{background:rgba(255,68,102,.1);border:1px solid rgba(255,68,102,.15);color:#ff4466;padding:8px 12px;border-radius:8px;font-size:.76rem;margin-bottom:12px}
.auth-btn{width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#5b9aff,#8b6fff);color:#fff;font-size:.88rem;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .25s;box-shadow:0 4px 16px rgba(91,154,255,.25);margin-top:4px}
.auth-btn:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(91,154,255,.35)}
.auth-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
.auth-link{text-align:center;margin-top:20px;font-size:.76rem;color:#4a5672}
.auth-link a{color:#5b9aff;text-decoration:none;font-weight:600}`;
