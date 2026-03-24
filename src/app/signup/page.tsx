'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Account creation failed. Contact admin to set up access.');
      }
    } catch { setError('Network error'); }
    setLoading(false);
  }
  return (
    <div style={{ minHeight:'100vh', background:'#050508', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:'Inter,sans-serif', color:'#e8ecf4' }}>
      <div style={{ width:'100%', maxWidth:380, padding:'0 24px' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <a href="/" style={{ display:'inline-flex', alignItems:'center', gap:8,
            textDecoration:'none', color:'inherit', fontWeight:800, fontSize:'1.1rem' }}>
            Watchtower
          </a>
        </div>
        <div style={{ background:'#0a0d14', border:'1px solid #1e2536', borderRadius:16, padding:'28px' }}>
          <h1 style={{ fontSize:'1.2rem', fontWeight:800, marginBottom:4 }}>Get started</h1>
          <p style={{ fontSize:'0.78rem', color:'#6b7a94', marginBottom:24 }}>
            Create your account to access the dashboard
          </p>
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:'0.72rem', color:'#6b7a94',
                fontWeight:600, marginBottom:6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="you@company.com"
                style={{ width:'100%', padding:'10px 12px', background:'#070a14',
                  border:'1px solid #1e2536', borderRadius:8, color:'#e8ecf4',
                  fontSize:'0.88rem', fontFamily:'Inter,sans-serif', outline:'none',
                  boxSizing:'border-box' as const }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:'0.72rem', color:'#6b7a94',
                fontWeight:600, marginBottom:6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="Create a password"
                style={{ width:'100%', padding:'10px 12px', background:'#070a14',
                  border:'1px solid #1e2536', borderRadius:8, color:'#e8ecf4',
                  fontSize:'0.88rem', fontFamily:'JetBrains Mono,monospace', outline:'none',
                  boxSizing:'border-box' as const }} />
            </div>
            {error && (
              <div style={{ marginBottom:16, padding:'8px 12px', background:'#f0405e0a',
                border:'1px solid #f0405e30', borderRadius:7, fontSize:'0.76rem',
                color:'#f0405e' }}>{error}</div>
            )}
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'11px', background: loading ? '#3a3a5a' : '#4f8fff',
                border:'none', borderRadius:9, color:'#fff', fontWeight:700,
                fontSize:'0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily:'Inter,sans-serif' }}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>
          <p style={{ marginTop:20, textAlign:'center', fontSize:'0.72rem', color:'#3a4050' }}>
            Already have an account?{' '}
            <a href="/login" style={{ color:'#4f8fff', textDecoration:'none', fontWeight:600 }}>
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
