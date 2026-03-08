'use client';
import { useState } from 'react';

export default function Login() {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(false);
    const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    if (res.ok) { window.location.href = '/'; }
    else { setErr(true); setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#06080d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Outfit:wght@400;600;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #06080d; }
        .login-box { width: 360px; padding: 40px 32px; background: #0b0e16; border: 1px solid #1a2030; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,.4), 0 0 60px rgba(79,143,255,.04); }
        .login-logo { display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 28px; }
        .login-logo-icon { width: 36px; height: 36px; border-radius: 9px; background: linear-gradient(135deg, #4f8fff, #7c6aff); display: flex; align-items: center; justify-content: center; font-size: .9rem; color: #fff; font-weight: 900; }
        .login-logo-text { font-size: 1.3rem; font-weight: 900; color: #e4e9f2; letter-spacing: -.5px; }
        .login-logo-text span { color: #4f8fff; }
        .login-sub { text-align: center; font-size: .78rem; color: #505d78; margin-bottom: 24px; }
        .login-input { width: 100%; padding: 10px 14px; background: #10141e; border: 1px solid #1a2030; border-radius: 8px; color: #e4e9f2; font-size: .88rem; font-family: 'JetBrains Mono', monospace; outline: none; transition: border-color .2s; }
        .login-input:focus { border-color: #4f8fff; }
        .login-input::placeholder { color: #343e54; }
        .login-btn { width: 100%; padding: 10px; background: linear-gradient(135deg, #4f8fff, #6366f1); border: none; border-radius: 8px; color: #fff; font-size: .88rem; font-weight: 700; cursor: pointer; font-family: 'Outfit', sans-serif; margin-top: 12px; transition: opacity .15s; }
        .login-btn:hover { opacity: .9; }
        .login-btn:disabled { opacity: .5; cursor: not-allowed; }
        .login-err { color: #f0384a; font-size: .78rem; text-align: center; margin-top: 10px; }
        @media (max-width: 480px) { .login-box { width: calc(100vw - 32px); padding: 32px 20px; } }
      `}</style>
      <div className="login-box">
        <div className="login-logo">
          <div className="login-logo-icon">S</div>
          <div className="login-logo-text"><span>Sec</span>Ops</div>
        </div>
        <div className="login-sub">Enter your dashboard password</div>
        <form onSubmit={submit}>
          <input className="login-input" type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} autoFocus />
          <button className="login-btn" type="submit" disabled={loading}>{loading ? 'Authenticating...' : 'Sign In'}</button>
        </form>
        {err && <div className="login-err">Invalid password</div>}
      </div>
    </div>
  );
}
