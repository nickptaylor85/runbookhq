'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Branding { name?: string; primaryColor?: string; tagline?: string; }

export default function BrandedLoginPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string || '';

  const [tenantId, setTenantId] = useState('');
  const [branding, setBranding] = useState<Branding>({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    // Resolve slug → tenantId from Redis via API
    fetch('/api/mssp/slug-map')
      .then(r => r.json())
      .then(d => {
        const tid = d.map?.[slug] || slug;
        setTenantId(tid);
        // Load branding for resolved tenant
        return fetch('/api/mssp/branding', { headers: { 'x-tenant-id': tid } });
      })
      .then(r => r.json())
      .then(d => { if (d.branding?.name) setBranding(d.branding); })
      .catch(() => { setTenantId(slug); });
  }, [slug]);

  const accent = branding.primaryColor || '#4f8fff';
  const orgName = branding.name || 'Security Portal';
  const tagline = branding.tagline || 'Powered by Watchtower';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ email, password }),
      });
      const d = await res.json() as { ok?: boolean; error?: string };
      if (d.ok) { router.push('/dashboard'); }
      else { setError(d.error || 'Invalid credentials'); }
    } catch { setError('Connection error — please try again.'); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#e8ecf4', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: `linear-gradient(135deg, ${accent}, ${accent}99)`, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
            {orgName.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 4 }}>{orgName}</div>
          <div style={{ fontSize: '0.8rem', color: '#6b7a94' }}>{tagline}</div>
        </div>
        <form onSubmit={handleLogin} style={{ background: '#0a0d18', border: '1px solid #1d2535', borderRadius: 14, padding: '28px 24px' }}>
          <div style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: 20, color: '#e8ecf4' }}>Sign in to your account</div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#6b7a94', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com"
              style={{ width: '100%', padding: '10px 12px', background: '#070a14', border: `1px solid ${email ? accent + '60' : '#263044'}`, borderRadius: 8, color: '#e8ecf4', fontSize: '0.88rem', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#6b7a94', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', background: '#070a14', border: `1px solid ${password ? accent + '60' : '#263044'}`, borderRadius: 8, color: '#e8ecf4', fontSize: '0.88rem', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {error && <div style={{ background: '#f0405e12', border: '1px solid #f0405e30', borderRadius: 7, padding: '8px 12px', fontSize: '0.8rem', color: '#f0405e', marginBottom: 14 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'Inter, sans-serif' }}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.7rem', color: '#3a4050' }}>
          Secured by <a href="https://getwatchtower.io" style={{ color: '#4f8fff', textDecoration: 'none' }}>Watchtower</a>
        </div>
      </div>
    </div>
  );
}
