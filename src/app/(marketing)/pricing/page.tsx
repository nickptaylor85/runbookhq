'use client';
import { useState } from 'react';

const PLANS = [
  {
    id: 'community',
    name: 'Community',
    price: '£0',
    period: 'free forever',
    color: '#4f8fff',
    features: [
      '2 tool integrations',
      'AI triage verdicts — read only',
      'Alert feed',
      '1 seat',
      'Community support',
    ],
    cta: 'Get Started Free',
    free: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: '£29',
    period: '/seat/mo',
    color: '#4f8fff',
    popular: true,
    features: [
      'Unlimited tool integrations',
      'AI Co-Pilot — full access',
      'Automation slider',
      'Response actions',
      'Threat intelligence',
      'Incidents & runbooks',
      'Minimum 3 seats',
    ],
    cta: 'Start 14-Day Free Trial',
    free: false,
  },
  {
    id: 'business',
    name: 'Business',
    price: '£79',
    period: '/mo',
    color: '#22d49a',
    features: [
      'Everything in Team',
      'PDF reports',
      'API access',
      'RBAC & permissions',
      'Compliance mapping',
      '10 seats included',
    ],
    cta: 'Start 14-Day Free Trial',
    free: false,
  },
  {
    id: 'mssp',
    name: 'MSSP',
    price: '£599',
    period: '/mo',
    color: '#8b6fff',
    features: [
      'Everything in Business',
      'Multi-tenant portfolio view',
      'Cross-client correlation',
      'Automated branded reports',
      'White-label',
      '5 clients included (+£49/client)',
    ],
    cta: 'Start 14-Day Free Trial',
    free: false,
  },
];

const FAQ = [
  { q: 'Is the 14-day trial really free?', a: 'Yes — no credit card required to start. You only pay after the trial ends, and you can cancel any time before.' },
  { q: 'Can I change plans?', a: 'Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately. Downgrades apply at the end of your billing period.' },
  { q: 'What happens to my data if I cancel?', a: 'Your data is retained for 30 days after cancellation. You can export everything before then.' },
  { q: 'Do you offer annual pricing?', a: 'Yes — annual billing saves 20%. Contact us at hello@getwatchtower.io for an annual quote.' },
  { q: 'Can I add more MSSP clients?', a: 'Yes — additional clients are £49/mo each, added instantly from your portfolio dashboard.' },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  async function handleCheckout(planId: string) {
    if (planId === 'community') {
      window.location.href = '/signup';
      return;
    }
    setLoading(planId);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, email: email || undefined }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch(e) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(null);
  }

  return (
    <div style={{ background: '#050508', color: '#e8ecf4', fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:#050508}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @media(max-width:900px){.price-grid{grid-template-columns:1fr 1fr!important}}
        @media(max-width:600px){.price-grid{grid-template-columns:1fr!important}}
      `}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', padding: '14px 28px', borderBottom: '1px solid #ffffff06', background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(18px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <a href='/' style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none', color: '#e8ecf4' }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#4f8fff,#8b6fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', color: '#fff', fontWeight: 900 }}>W</div>
          Watchtower
        </a>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href='/demo' style={{ color: '#6b7a94', fontSize: '0.8rem', fontWeight: 500, padding: '7px 14px', textDecoration: 'none' }}>Demo</a>
          <a href='/login' style={{ color: '#6b7a94', fontSize: '0.8rem', fontWeight: 500, padding: '7px 14px', textDecoration: 'none' }}>Sign In</a>
          <a href='/signup' style={{ padding: '8px 18px', borderRadius: 8, background: '#4f8fff', color: '#fff', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>Start Free →</a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ textAlign: 'center', padding: '64px 24px 40px' }}>
        <div style={{ display: 'inline-block', padding: '4px 14px', border: '1px solid #4f8fff25', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, color: '#4f8fff', marginBottom: 18 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f8fff', display: 'inline-block', marginRight: 6, animation: 'pulse 2s ease infinite', verticalAlign: 'middle' }} />
          14-day free trial · No credit card required
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: -2, marginBottom: 12 }}>Simple, transparent pricing</h1>
        <p style={{ fontSize: '1rem', color: '#6b7a94', maxWidth: 480, margin: '0 auto 24px' }}>Start free. Scale when ready. Cancel any time.</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder='your@email.com (optional — pre-fills checkout)' style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #1e2536', background: '#0a0d14', color: '#e8ecf4', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif', outline: 'none', width: 280 }} />
        </div>
        {error && <div style={{ marginTop: 10, fontSize: '0.76rem', color: '#f0405e' }}>{error}</div>}
      </div>

      {/* PLANS */}
      <div className='price-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, maxWidth: 1060, margin: '0 auto', padding: '0 24px 60px' }}>
        {PLANS.map(plan => (
          <div key={plan.id} style={{ padding: 24, background: '#0a0d14', border: `1px solid ${plan.popular ? '#4f8fff35' : '#141820'}`, borderRadius: 16, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {plan.popular && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center', fontSize: '0.52rem', fontWeight: 700, color: '#fff', background: '#4f8fff', padding: '4px 0' }}>MOST POPULAR</div>
            )}
            <div style={{ marginTop: plan.popular ? 18 : 0, marginBottom: 6, fontSize: '0.92rem', fontWeight: 700 }}>{plan.name}</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', letterSpacing: -2, color: plan.color, lineHeight: 1 }}>{plan.price}</div>
            <div style={{ fontSize: '0.68rem', color: '#4a5568', marginBottom: 20 }}>{plan.period}</div>
            <div style={{ flex: 1, marginBottom: 20 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: '0.76rem', color: '#a0adc4', padding: '4px 0', lineHeight: 1.5 }}>
                  <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
            <button onClick={() => handleCheckout(plan.id)} disabled={loading === plan.id}
              style={{ padding: '11px 0', borderRadius: 10, border: plan.popular ? 'none' : `1px solid ${plan.color}30`, background: plan.popular ? '#4f8fff' : `${plan.color}12`, color: plan.popular ? '#fff' : plan.color, fontSize: '0.82rem', fontWeight: 700, cursor: loading === plan.id ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: loading === plan.id ? 0.7 : 1, transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {loading === plan.id
                ? <><span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Processing…</>
                : plan.cta}
            </button>
            {!plan.free && <div style={{ textAlign: 'center', fontSize: '0.6rem', color: '#3a4050', marginTop: 8 }}>14-day free trial · Cancel anytime</div>}
          </div>
        ))}
      </div>

      {/* COMPARISON */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 60px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: -1, textAlign: 'center', marginBottom: 28 }}>Everything in detail</h2>
        <div style={{ background: '#0a0d14', border: '1px solid #141820', borderRadius: 14, overflow: 'hidden' }}>
          {[
            ['Feature', 'Community', 'Team', 'Business', 'MSSP'],
            ['Tool integrations', '2', 'Unlimited', 'Unlimited', 'Unlimited'],
            ['AI triage verdicts', '✓ read-only', '✓ full', '✓ full', '✓ full'],
            ['AI Co-Pilot', '—', '✓', '✓', '✓'],
            ['Automation slider', '—', '✓', '✓', '✓'],
            ['Response actions', '—', '✓', '✓', '✓'],
            ['Threat intelligence', '—', '✓', '✓', '✓'],
            ['PDF reports', '—', '—', '✓', '✓'],
            ['API access', '—', '—', '✓', '✓'],
            ['RBAC', '—', '—', '✓', '✓'],
            ['Multi-tenant portfolio', '—', '—', '—', '✓'],
            ['White-label', '—', '—', '—', '✓'],
            ['Seats', '1', 'Min 3', '10', 'Unlimited'],
            ['Support', 'Community', 'Email', 'Priority', 'Dedicated'],
          ].map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: i < 14 ? '1px solid #141820' : 'none', background: i === 0 ? '#0d1018' : i % 2 === 0 ? '#09091a' : 'transparent' }}>
              {row.map((cell, j) => (
                <div key={j} style={{ padding: '10px 14px', fontSize: i === 0 ? '0.62rem' : '0.74rem', fontWeight: i === 0 || j === 0 ? 700 : 400, color: i === 0 ? '#4f8fff' : j === 0 ? '#e8ecf4' : cell === '—' ? '#2a3040' : cell.startsWith('✓') ? '#22d49a' : '#8a9ab8', textAlign: j > 0 ? 'center' : 'left', letterSpacing: i === 0 ? '0.5px' : 0, textTransform: i === 0 ? 'uppercase' : 'none' }}>{cell}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: -1, textAlign: 'center', marginBottom: 24 }}>Common questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQ.map(({ q, a }) => (
            <div key={q} style={{ padding: '16px 20px', background: '#0a0d14', border: '1px solid #141820', borderRadius: 12 }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: 6 }}>{q}</div>
              <div style={{ fontSize: '0.76rem', color: '#6b7a94', lineHeight: 1.7 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div style={{ textAlign: 'center', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: -1, marginBottom: 10 }}>Still unsure? Talk to us.</h2>
        <p style={{ color: '#6b7a94', fontSize: '0.88rem', marginBottom: 20 }}>We'll walk you through a live demo on your own stack.</p>
        <a href='mailto:hello@getwatchtower.io' style={{ display: 'inline-block', padding: '12px 30px', borderRadius: 10, border: '1px solid #1e2536', background: 'transparent', color: '#e8ecf4', fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none' }}>hello@getwatchtower.io</a>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
