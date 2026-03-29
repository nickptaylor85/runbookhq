'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const INPUT: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: '#070a14',
  border: '1px solid #263044', borderRadius: 8, color: '#e8ecf4',
  fontSize: '0.88rem', fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box',
};

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<'community'|'team'|'business'|'mssp'>('community');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const PLANS = [
    { id:'community', label:'Community', price:'Free', note:'2 tools, 1 seat' },
    { id:'team',      label:'Essentials', price:'£149/seat', note:'Full AI, min 2 seats' },
    { id:'business',  label:'Professional', price:'£1,199/mo', note:'Up to 15 analysts, reports, API' },
    { id:'mssp',      label:'Enterprise', price:'£3,499/mo', note:'Unlimited clients, white-label' },
  ] as const;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!agreedToTerms) { setError('Please accept the Terms of Service and Privacy Policy to continue.'); return; }
    setLoading(true); setError('');
    try {
      // Community plan — create account directly
      if (plan === 'community') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, plan }),
        });
        const data = await res.json() as { ok?: boolean; error?: string; redirect?: string };
        if (res.ok && data.ok) {
          // Auto-login
          const loginRes = await fetch('/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const loginData = await loginRes.json() as { ok?: boolean };
          if (loginData.ok) { router.push(data.redirect || '/setup-2fa'); return; }
        }
        setError(data.error || 'Signup failed');
      } else {
        // Paid plans — create account then redirect to Stripe checkout
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, plan }),
        });
        const data = await res.json() as { ok?: boolean; error?: string; redirect?: string };
        if (res.ok && data.ok) {
          // Get checkout URL
          const checkoutRes = await fetch('/api/stripe/checkout', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan, email }),
          });
          const checkout = await checkoutRes.json() as { url?: string; error?: string };
          if (checkout.url) { window.location.href = checkout.url; return; }
          // Stripe not configured — go straight to dashboard
          const loginRes = await fetch('/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const loginData = await loginRes.json() as { ok?: boolean };
          if (loginData.ok) { router.push(data.redirect || '/setup-2fa'); return; }
        }
        setError(data.error || 'Signup failed');
      }
    } catch { setError('Network error — please try again'); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:'100vh', background:'#090d18', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', color:'#e8ecf4', padding:'24px' }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <a href="/" style={{ display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none', color:'inherit' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="9" fill="url(#sg)"/>
              <path d="M16 6L24 10V18C24 22 20.5 25.5 16 27C11.5 25.5 8 22 8 18V10L16 6Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
              <path d="M13 16.5L15 18.5L19.5 13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs><linearGradient id="sg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
            </svg>
            <span style={{ fontWeight:800, fontSize:'1.1rem' }}>Watchtower</span>
          </a>
        </div>

        <div style={{ background:'#131929', border:'1px solid #263044', borderRadius:16, padding:'28px' }}>
          <h1 style={{ fontSize:'1.2rem', fontWeight:800, marginBottom:4 }}>Create your account</h1>
          <p style={{ fontSize:'0.78rem', color:'#6b7a94', marginBottom:24 }}>Start with Community free, or choose a plan</p>

          {error && <div style={{ marginBottom:16, padding:'8px 12px', background:'#f0405e0a', border:'1px solid #f0405e30', borderRadius:7, fontSize:'0.76rem', color:'#f0405e' }}>{error}</div>}

          <form onSubmit={handleSignup}>
            {/* Plan selector */}
            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:'0.72rem', color:'#6b7a94', fontWeight:600, marginBottom:8 }}>Plan</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {PLANS.map(p => (
                  <button key={p.id} type="button" onClick={()=>setPlan(p.id as any)}
                    style={{ padding:'8px 10px', borderRadius:8, border:`1px solid ${plan===p.id?'#4f8fff':'#263044'}`,
                      background: plan===p.id?'#4f8fff15':'transparent', cursor:'pointer', textAlign:'left',
                      color: plan===p.id?'#4f8fff':'#6b7a94', fontFamily:'Inter,sans-serif', transition:'all .15s' }}>
                    <div style={{ fontSize:'0.78rem', fontWeight:700 }}>{p.label}</div>
                    <div style={{ fontSize:'0.62rem', marginTop:1, color: plan===p.id?'#4f8fff':'#3a4050' }}>{p.price} · {p.note}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={{ display:'block', fontSize:'0.72rem', color:'#6b7a94', fontWeight:600, marginBottom:6 }}>Full name</label>
              <input value={name} onChange={e=>setName(e.target.value)} required placeholder="Your name" style={INPUT} />
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ display:'block', fontSize:'0.72rem', color:'#6b7a94', fontWeight:600, marginBottom:6 }}>Work email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@company.com" style={INPUT} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:'0.72rem', color:'#6b7a94', fontWeight:600, marginBottom:6 }}>Password (min. 8 characters)</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8}
                placeholder="••••••••••" style={{ ...INPUT, fontFamily:'JetBrains Mono,monospace' }} />
              {password.length > 0 && (() => {
                const score = password.length < 8 ? 0 : password.length < 12 && !/[!@#$%^&*]/.test(password) ? 1 : password.length >= 12 && /[!@#$%^&*]/.test(password) && /[A-Z]/.test(password) ? 3 : 2;
                const labels = ['Too short', 'Weak', 'Fair', 'Strong'];
                const colors = ['#f0405e', '#f0405e', '#f0a030', '#22d49a'];
                return (
                  <div style={{ marginTop:6 }}>
                    <div style={{ display:'flex', gap:3, marginBottom:4 }}>
                      {[0,1,2].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:2, background: score > i ? colors[score] : '#263044', transition:'background .2s' }} />)}
                    </div>
                    <div style={{ fontSize:'0.62rem', color: colors[score], fontWeight:600 }}>{labels[score]}</div>
                  </div>
                );
              })()}
            </div>

            {/* T&C checkbox */}
            <div style={{ marginBottom:20, display:'flex', gap:10, alignItems:'flex-start' }}>
              <div onClick={()=>setAgreedToTerms(v=>!v)}
                style={{ width:16, height:16, borderRadius:4, border:`1px solid ${agreedToTerms?'#4f8fff':'#263044'}`, background:agreedToTerms?'#4f8fff':'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:1 }}>
                {agreedToTerms && <span style={{ color:'#fff', fontSize:'0.6rem', fontWeight:900 }}>✓</span>}
              </div>
              <span style={{ fontSize:'0.72rem', color:'#6b7a94', lineHeight:1.5 }}>
                I agree to the{' '}
                <a href="/terms" target="_blank" style={{ color:'#4f8fff', textDecoration:'none', fontWeight:600 }}>Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" style={{ color:'#4f8fff', textDecoration:'none', fontWeight:600 }}>Privacy Policy</a>
              </span>
            </div>

            <button type="submit" disabled={loading || !agreedToTerms}
              style={{ width:'100%', padding:'11px', border:'none', borderRadius:9, color:'#fff', fontWeight:700,
                fontSize:'0.9rem', cursor: loading?'not-allowed':'pointer', fontFamily:'Inter,sans-serif',
                background: loading?'#3a3a5a':'#4f8fff', transition:'background .15s' }}>
              {loading ? 'Creating account…' : plan==='community' ? 'Start free →' : `Continue to payment →`}
            </button>

            <p style={{ marginTop:10, fontSize:'0.66rem', color:'#3a4050', textAlign:'center' }}>
              {plan !== 'community' ? '14-day free trial · No card charged today · Cancel anytime' : 'Free forever · No card required'}
            </p>
          </form>
        </div>

        <p style={{ marginTop:16, textAlign:'center', fontSize:'0.72rem', color:'#3a4050' }}>
          Already have an account? <a href="/login" style={{ color:'#4f8fff', textDecoration:'none', fontWeight:600 }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
