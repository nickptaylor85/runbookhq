'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

const INPUT: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: '#070a14',
  border: '1px solid #263044', borderRadius: 8, color: '#e8ecf4',
  fontSize: '0.88rem', fontFamily: 'Inter,sans-serif', outline: 'none',
  boxSizing: 'border-box',
};
const BTN: React.CSSProperties = {
  width: '100%', padding: '11px', border: 'none', borderRadius: 9,
  color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
  fontFamily: 'Inter,sans-serif', transition: 'background .15s',
};

function LoginPageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState<'login'|'mfa'|'invite'|'reset-request'|'reset-confirm'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [userId, setUserId] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const inv = params.get('invite');
    const em = params.get('email');
    const rst = params.get('reset');
    if (inv) { setInviteToken(inv); if (em) setEmail(decodeURIComponent(em)); setStep('invite'); }
    if (rst) { setResetToken(rst); setStep('reset-confirm'); }
  }, [params]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; mfaRequired?: boolean; userId?: string };
      if (data.mfaRequired && data.userId) {
        setUserId(data.userId);
        setStep('mfa');
      } else if (res.ok && data.ok) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch { setError('Network error — please try again'); }
    setLoading(false);
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, mfaCode }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && data.ok) { router.push('/dashboard'); }
      else { setError(data.error || 'Invalid MFA code'); }
    } catch { setError('Network error'); }
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword, inviteToken }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && data.ok) { router.push('/dashboard'); }
      else { setError(data.error || 'Invalid or expired invite link'); }
    } catch { setError('Network error'); }
    setLoading(false);
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email }),
      });
      setSuccess('If that email exists, a reset link has been sent. Check your inbox.');
    } catch { setError('Network error'); }
    setLoading(false);
  }

  async function handleResetConfirm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', token: resetToken, newPassword }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; message?: string };
      if (data.ok) { setSuccess('Password updated. You can now sign in.'); setStep('login'); }
      else { setError(data.message || data.error || 'Reset failed'); }
    } catch { setError('Network error'); }
    setLoading(false);
  }

  const logoSvg = (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="9" fill="url(#lg)"/>
      <path d="M16 6L24 10V18C24 22 20.5 25.5 16 27C11.5 25.5 8 22 8 18V10L16 6Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
      <path d="M13 16.5L15 18.5L19.5 13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
    </svg>
  );

  const container = (title: string, subtitle: string, children: React.ReactNode, footer?: React.ReactNode) => (
    <div style={{ minHeight:'100vh', background:'#090d18', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', color:'#e8ecf4' }}>
      <div style={{ width:'100%', maxWidth:380, padding:'0 24px' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <a href="/" style={{ display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none', color:'inherit' }}>
            {logoSvg}
            <span style={{ fontWeight:800, fontSize:'1.1rem' }}>Watchtower</span>
          </a>
        </div>
        <div style={{ background:'#131929', border:'1px solid #263044', borderRadius:16, padding:'28px' }}>
          <h1 style={{ fontSize:'1.2rem', fontWeight:800, marginBottom:4 }}>{title}</h1>
          <p style={{ fontSize:'0.78rem', color:'#6b7a94', marginBottom:24 }}>{subtitle}</p>
          {success && <div style={{ marginBottom:16, padding:'8px 12px', background:'#22d49a0a', border:'1px solid #22d49a30', borderRadius:7, fontSize:'0.76rem', color:'#22d49a' }}>{success}</div>}
          {error && <div style={{ marginBottom:16, padding:'8px 12px', background:'#f0405e0a', border:'1px solid #f0405e30', borderRadius:7, fontSize:'0.76rem', color:'#f0405e' }}>{error}</div>}
          {children}
        </div>
        {footer}
      </div>
    </div>
  );

  if (step === 'mfa') return container('Two-factor authentication', 'Enter the 6-digit code from your authenticator app',
    <form onSubmit={handleMfa}>
      <input value={mfaCode} onChange={e=>setMfaCode(e.target.value)} placeholder="000000" maxLength={6} autoFocus
        style={{ ...INPUT, fontFamily:'JetBrains Mono,monospace', fontSize:'1.4rem', letterSpacing:8, textAlign:'center', marginBottom:16 }} />
      <button type="submit" disabled={loading} style={{ ...BTN, background: loading ? '#3a3a5a' : '#4f8fff' }}>
        {loading ? 'Verifying…' : 'Verify →'}
      </button>
      <button type="button" onClick={()=>setStep('login')} style={{ ...BTN, background:'transparent', color:'#6b7a94', fontSize:'0.78rem', marginTop:8 }}>
        ← Back to login
      </button>
    </form>
  );

  if (step === 'invite') return container('Accept invitation', `Set a password for ${email}`,
    <form onSubmit={handleInvite}>
      <div style={{ marginBottom:16 }}>
        <label style={{ display:'block', fontSize:'0.72rem', color:'#6b7a94', fontWeight:600, marginBottom:6 }}>Email</label>
        <input value={email} readOnly style={{ ...INPUT, opacity:0.6, cursor:'not-allowed' }} />
      </div>
      <div style={{ marginBottom:20 }}>
        <label style={{ display:'block', fontSize:'0.72rem', color:'#6b7a94', fontWeight:600, marginBottom:6 }}>Create password (min. 8 characters)</label>
        <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required minLength={8}
          placeholder="••••••••••" style={{ ...INPUT, fontFamily:'JetBrains Mono,monospace' }} />
      </div>
      <button type="submit" disabled={loading} style={{ ...BTN, background: loading ? '#3a3a5a' : '#4f8fff' }}>
        {loading ? 'Setting up…' : 'Activate account →'}
      </button>
    </form>
  );

  if (step === 'reset-request') return container('Reset password', 'Enter your email and we\'ll send a reset link',
    <form onSubmit={handleResetRequest}>
      <div style={{ marginBottom:20 }}>
        <label style={{ display:'block', fontSize:'0.72rem', color:'#6b7a94', fontWeight:600, marginBottom:6 }}>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@company.com" style={INPUT} />
      </div>
      {!success && <button type="submit" disabled={loading} style={{ ...BTN, background: loading ? '#3a3a5a' : '#4f8fff' }}>
        {loading ? 'Sending…' : 'Send reset link →'}
      </button>}
      <button type="button" onClick={()=>setStep('login')} style={{ ...BTN, background:'transparent', color:'#6b7a94', fontSize:'0.78rem', marginTop:8 }}>
        ← Back to login
      </button>
    </form>
  );

  if (step === 'reset-confirm') return container('Set new password', 'Enter your new password below',
    <form onSubmit={handleResetConfirm}>
      <div style={{ marginBottom:20 }}>
        <label style={{ display:'block', fontSize:'0.72rem', color:'#6b7a94', fontWeight:600, marginBottom:6 }}>New password (min. 8 characters)</label>
        <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required minLength={8}
          placeholder="••••••••••" style={{ ...INPUT, fontFamily:'JetBrains Mono,monospace' }} />
      </div>
      {!success && <button type="submit" disabled={loading} style={{ ...BTN, background: loading ? '#3a3a5a' : '#4f8fff' }}>
        {loading ? 'Updating…' : 'Set new password →'}
      </button>}
      {success && <button type="button" onClick={()=>setStep('login')} style={{ ...BTN, background:'#4f8fff', marginTop:8 }}>
        Sign in →
      </button>}
    </form>
  );

  // Default: login form
  return container('Sign in', 'Access your SOC dashboard',
    <form onSubmit={handleLogin}>
      <div style={{ marginBottom:14 }}>
        <label style={{ display:'block', fontSize:'0.72rem', color:'#6b7a94', fontWeight:600, marginBottom:6 }}>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"
          placeholder="you@company.com" style={INPUT} />
      </div>
      <div style={{ marginBottom:8 }}>
        <label style={{ display:'block', fontSize:'0.72rem', color:'#6b7a94', fontWeight:600, marginBottom:6 }}>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"
          placeholder="••••••••••" style={{ ...INPUT, fontFamily:'JetBrains Mono,monospace' }} />
      </div>
      <div style={{ textAlign:'right', marginBottom:16 }}>
        <button type="button" onClick={()=>setStep('reset-request')} style={{ background:'none', border:'none', color:'#4f8fff', fontSize:'0.72rem', cursor:'pointer', fontFamily:'Inter,sans-serif', padding:0 }}>
          Forgot password?
        </button>
      </div>
      <button type="submit" disabled={loading} style={{ ...BTN, background: loading ? '#3a3a5a' : '#4f8fff' }}>
        {loading ? 'Signing in…' : 'Sign in →'}
      </button>
    </form>,
    <p style={{ marginTop:16, textAlign:'center', fontSize:'0.72rem', color:'#3a4050' }}>
      Don&apos;t have an account? <a href="/signup" style={{ color:'#4f8fff', textDecoration:'none', fontWeight:600 }}>Sign up free</a>
    </p>
  );
}

import { Suspense } from 'react';
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', background:'#090d18', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', color:'#6b7a94', fontSize:'0.88rem' }}>
        Loading…
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
