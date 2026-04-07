'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PortalBranding {
  name: string;
  primaryColor: string;
  accentColor: string;
  tagline: string;
}

export default function PortalLoginPage() {
  const router = useRouter();
  const [branding, setBranding] = useState<PortalBranding>({ name: '', primaryColor: '#4f8fff', accentColor: '#00e5ff', tagline: 'Security Portal' });
  const [tenantId, setTenantId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [step, setStep] = useState<'login' | 'mfa'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Resolve subdomain on mount
  useEffect(() => {
    const host = window.location.hostname;
    const parts = host.split('.');
    // Extract subdomain — handle *.getwatchtower.io and localhost setups
    let slug = '';
    if (parts.length >= 3 && (host.endsWith('.getwatchtower.io') || host.endsWith('.getwatchtower.com'))) {
      slug = parts.slice(0, parts.length - 2).join('.');
    } else if (parts.length >= 2 && !host.includes('vercel.app') && !host.includes('localhost')) {
      slug = parts[0];
    }

    if (slug && slug !== 'www' && slug !== 'app') {
      fetch(`/api/portal/resolve?slug=${encodeURIComponent(slug)}`)
        .then(r => r.json())
        .then(d => {
          if (d.ok) {
            setTenantId(d.tenantId);
            setBranding(d.branding);
            setResolved(true);
          } else {
            setNotFound(true);
            setResolved(true);
          }
        })
        .catch(() => { setNotFound(true); setResolved(true); });
    } else {
      // Fallback: try from slug-map API or query param
      const params = new URLSearchParams(window.location.search);
      const qSlug = params.get('org') || '';
      if (qSlug) {
        fetch(`/api/portal/resolve?slug=${encodeURIComponent(qSlug)}`)
          .then(r => r.json())
          .then(d => {
            if (d.ok) {
              setTenantId(d.tenantId);
              setBranding(d.branding);
              setResolved(true);
            } else {
              setNotFound(true);
              setResolved(true);
            }
          })
          .catch(() => { setNotFound(true); setResolved(true); });
      } else {
        setNotFound(true);
        setResolved(true);
      }
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify(step === 'mfa' ? { email, password, mfaCode } : { email, password }),
      });
      const d = await res.json() as { ok?: boolean; error?: string; mfaRequired?: boolean; mfaSetupRequired?: boolean };
      if (d.ok) {
        if (d.mfaSetupRequired) {
          router.push('/setup-2fa');
        } else {
          router.push('/portal');
        }
      } else if (d.mfaRequired) {
        setStep('mfa');
      } else {
        setError(d.error || 'Invalid credentials');
      }
    } catch { setError('Connection error — please try again.'); }
    setLoading(false);
  }

  const accent = branding.primaryColor;
  const orgName = branding.name || 'Security Portal';

  if (!resolved) {
    return (
      <html lang="en"><body style={{ margin: 0, background: '#060c18' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,system-ui,sans-serif', color: '#6b7a94' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #1d2535', borderTopColor: '#4f8fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontSize: '0.85rem' }}>Connecting to portal…</div>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </body></html>
    );
  }

  if (notFound) {
    return (
      <html lang="en"><body style={{ margin: 0, background: '#060c18' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,system-ui,sans-serif', color: '#e8ecf4', padding: 20, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #f0405e, #f0405e80)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: 18 }}>🔒</div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px' }}>Portal Not Found</h1>
          <p style={{ fontSize: '0.85rem', color: '#6b7a94', maxWidth: 360, margin: '0 0 24px' }}>
            This subdomain isn&apos;t associated with any organisation. Check the URL or contact your security provider.
          </p>
          <a href="https://getwatchtower.io" style={{ fontSize: '0.82rem', color: '#4f8fff', textDecoration: 'none' }}>← Back to Watchtower</a>
        </div>
      </body></html>
    );
  }

  return (
    <html lang="en"><body style={{ margin: 0, background: '#060c18' }}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,system-ui,sans-serif', color: '#e8ecf4', padding: 20 }}>

        {/* Branding header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, background: `linear-gradient(135deg, ${accent}, ${accent}80)`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.5rem', fontWeight: 900, color: '#fff', boxShadow: `0 8px 32px ${accent}40` }}>
            {orgName.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>{orgName}</div>
          <div style={{ fontSize: '0.82rem', color: '#6b7a94' }}>{branding.tagline}</div>
        </div>

        {/* Login form */}
        <div style={{ width: '100%', maxWidth: 420 }}>
          <form onSubmit={handleLogin} style={{ background: '#0a0d18', border: '1px solid #1d2535', borderRadius: 16, padding: '32px 28px', boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 24, color: '#e8ecf4' }}>
              {step === 'mfa' ? 'Enter verification code' : 'Sign in to your security portal'}
            </div>

            {step === 'login' && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#6b7a94', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" autoComplete="email"
                    style={{ width: '100%', padding: '11px 14px', background: 'rgba(4,8,20,0.6)', border: `1px solid ${email ? accent + '50' : '#1d2535'}`, borderRadius: 9, color: '#e8ecf4', fontSize: '0.9rem', fontFamily: 'Inter,system-ui,sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#6b7a94', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                    style={{ width: '100%', padding: '11px 14px', background: 'rgba(4,8,20,0.6)', border: `1px solid ${password ? accent + '50' : '#1d2535'}`, borderRadius: 9, color: '#e8ecf4', fontSize: '0.9rem', fontFamily: 'Inter,system-ui,sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }} />
                </div>
              </>
            )}

            {step === 'mfa' && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#6b7a94', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>6-digit code from your authenticator</label>
                <input type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required placeholder="000000" autoComplete="one-time-code"
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(4,8,20,0.6)', border: `1px solid ${mfaCode ? accent + '50' : '#1d2535'}`, borderRadius: 9, color: '#e8ecf4', fontSize: '1.2rem', fontFamily: "'JetBrains Mono',monospace", outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '6px' }} />
              </div>
            )}

            {error && (
              <div style={{ background: '#f0405e10', border: '1px solid #f0405e30', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#f0405e', marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: 9, border: 'none',
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              color: '#fff', fontSize: '0.92rem', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'Inter,system-ui,sans-serif',
              transition: 'opacity .15s, transform .1s',
              boxShadow: `0 4px 16px ${accent}30`,
            }}>
              {loading ? 'Signing in…' : step === 'mfa' ? 'Verify →' : 'Sign in →'}
            </button>
          </form>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.7rem', color: '#2a3040', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="9" fill="url(#wgp)" />
              <path d="M17 7L26 11V18C26 22.5 22 26.5 17 28C12 26.5 8 22.5 8 18V11L17 7Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
              <defs><linearGradient id="wgp" x1="0" y1="0" x2="34" y2="34"><stop stopColor="#3b7fff" /><stop offset="1" stopColor="#7c3aff" /></linearGradient></defs>
            </svg>
            <span>Secured by <a href="https://getwatchtower.io" style={{ color: '#4f8fff', textDecoration: 'none' }}>Watchtower</a></span>
          </div>
        </div>
      </div>
    </body></html>
  );
}
