'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
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
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error — please try again');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:'100vh', background:'#050508', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', color:'#e8ecf4' }}>
      <div style={{ width:'100%', maxWidth:380, padding:'0 24px' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <a href="/" style={{ display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none', color:'inherit' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="9" fill="url(#lg)"/>
              <path d="M16 6L24 10V18C24 22 20.5 25.5 16 27C11.5 25.5 8 22 8 18V10L16 6Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
              <path d="M13 16.5L15 18.5L19.5 13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs><linearGradient id="lg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
            </svg>
            <span style={{ fontWeight:800, fontSize:'1.1rem' }}>Watchtower</span>
          </a>
        </div>

        <div style={{ background:'#0a0d14', border:'1px solid #1e2536', borderRadius:16, padding:'28px 28px' }}>
          <h1 style={{ fontSize:'1.2rem', fontWeight:800, marginBottom:4 }}>Sign in</h1>
          <p style={{ fontSize:'0.78rem', color:'#6b7a94', marginBottom:24 }}>Access your SOC dashboard</p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:'0.72rem', color:'#6b7a94', fontWeight:600, marginBottom:6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                style={{ width:'100%', padding:'10px 12px', background:'#070a14', border:'1px solid #1e2536', borderRadius:8, color:'#e8ecf4', fontSize:'0.88rem', fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }}
              />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:'0.72rem', color:'#6b7a94', fontWeight:600, marginBottom:6 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••••"
                style={{ width:'100%', padding:'10px 12px', background:'#070a14', border:'1px solid #1e2536', borderRadius:8, color:'#e8ecf4', fontSize:'0.88rem', fontFamily:'JetBrains Mono,monospace', outline:'none', boxSizing:'border-box' }}
              />
            </div>
            {error && (
              <div style={{ marginBottom:16, padding:'8px 12px', background:'#f0405e0a', border:'1px solid #f0405e30', borderRadius:7, fontSize:'0.76rem', color:'#f0405e' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ width:'100%', padding:'11px', background: loading ? '#3a3a5a' : '#4f8fff', border:'none', borderRadius:9, color:'#fff', fontWeight:700, fontSize:'0.9rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'Inter,sans-serif', transition:'background .15s' }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p style={{ marginTop:20, textAlign:'center', fontSize:'0.72rem', color:'#3a4050' }}>
            Don&apos;t have an account? <a href="/signup" style={{ color:'#4f8fff', textDecoration:'none', fontWeight:600 }}>Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
