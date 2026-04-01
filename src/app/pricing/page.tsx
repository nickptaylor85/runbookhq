'use client';
import { useState } from 'react';

const PLANS = [
  {
    id: 'community',
    name: 'Community',
    price: '£0',
    period: 'free forever',
    color: '#6b7a94',
    features: [
      '2 tool integrations',
      'AI triage verdicts — read only',
      'Alert feed up to 250/day',
      '1 analyst seat',
      'Community support',
    ],
    cta: 'Get Started Free',
    free: true,
    byok: false,
    badge: null,
  },
  {
    id: 'team',
    name: 'Essentials',
    price: '£149',
    period: '/seat/mo · min 2 seats',
    color: '#4f8fff',
    popular: true,
    features: [
      'Unlimited tool integrations',
      'Full AI Co-Pilot & agentic triage',
      'Automation slider & response actions',
      'Threat intelligence feed',
      'Incidents, runbooks, & shift handover',
      'Alert assignees & SLA tracking',
      'BYOK — your Anthropic key',
      'Email & Slack notifications',
      'Email support',
    ],
    cta: 'Start 14-Day Free Trial',
    free: false,
    byok: true,
    badge: 'MOST POPULAR',
  },
  {
    id: 'business',
    name: 'Professional',
    price: '£1,199',
    period: '/mo · up to 15 analysts',
    color: '#22d49a',
    features: [
      'Everything in Essentials',
      'PDF executive reports (board-ready)',
      'API access & webhooks',
      'Role-based access control (RBAC)',
      'MITRE ATT&CK compliance mapping',
      'Audit log — full analyst action trail',
      'SLA reporting — MTTA/MTTR by severity',
      'Priority support + CSM',
    ],
    cta: 'Start 14-Day Free Trial',
    free: false,
    byok: true,
    badge: null,
  },
  {
    id: 'mssp',
    name: 'Enterprise / MSSP',
    price: '£3,499',
    period: '/mo · unlimited analysts',
    color: '#8b6fff',
    features: [
      'Everything in Professional',
      'Multi-tenant MSSP portfolio view',
      'Cross-client AI threat correlation',
      'Automated weekly client reports',
      'White-label — your brand, your domain',
      'Branded client login pages',
      'Per-client BYOK key isolation',
      'Dedicated account manager',
      'Custom SLA & enterprise agreement',
    ],
    cta: 'Talk to Sales',
    free: false,
    byok: true,
    badge: 'ENTERPRISE',
  },
];

const FAQ = [
  { q: `What is BYOK and why does it matter?`, a: `BYOK means Bring Your Own Key — you connect Watchtower to your own Anthropic API account. All AI calls run under your credentials, your security data never passes through a shared key, and you get a full audit trail of every AI decision. Enterprise and regulated organisations require this. AI costs are transparent on your Anthropic bill — typically £20–60/mo at normal SOC usage volumes.` },
  { q: `How does pricing compare to Sentinel or Cortex XSIAM?`, a: `Microsoft Sentinel costs ~£4–5/GB ingested — a mid-sized org at 50GB/day pays £6,000–7,500/mo before retention. Cortex XSIAM is enterprise-only starting at $250K+/year. Watchtower sits in a different category: we're an AI intelligence layer that overlays your existing stack. You keep your current tools; Watchtower unifies and automates the analyst workflow on top. Most teams replace 2–3 FTE of Tier 1 analyst work.` },
  { q: `What's the ROI?`, a: `Our customers typically process 200–400 alerts/day. Without AI, each alert takes 8–15 minutes of analyst time. Watchtower auto-resolves 80%+ as verified FPs, reducing Tier 1 workload by 20+ analyst-hours/day. At a £55,000 analyst salary, that's £800–1,200 of analyst time recovered daily — well above the platform cost. Plus: faster mean-time-to-contain on real threats.` },
  { q: `Do you have a free trial?`, a: `Yes — 14 days free, no Watchtower credit card needed. Community tier is free forever with basic features. You'll need an Anthropic API account (free to create) for AI features on paid plans.` },
  { q: `How do MSSP client seats work?`, a: `The Enterprise/MSSP plan includes unlimited analysts across all your tenants. Each client is a separate tenant with isolated credentials, BYOK keys, and branding. Additional clients beyond 10 are £199/client/mo. You can add clients instantly from your portfolio dashboard with a branded login URL for each.` },
  { q: `Do you offer annual discounts?`, a: `Yes — 20% off on annual billing. Enterprise plans include custom terms. Contact hello@getwatchtower.io for an annual invoice or enterprise agreement.` },
];

const COMPARISON = [
  ['Feature', 'Community', 'Essentials', 'Professional', 'Enterprise'],
  ['Tool integrations', '2', 'Unlimited', 'Unlimited', 'Unlimited'],
  ['AI triage verdicts', '✓ read-only', '✓ full + agentic', '✓ full + agentic', '✓ full + agentic'],
  ['Daily alert capacity', '250/day', 'Unlimited', 'Unlimited', 'Unlimited'],
  ['AI Co-Pilot', '—', '✓', '✓', '✓'],
  ['Automation & response', '—', '✓', '✓', '✓'],
  ['Threat intelligence', '—', '✓', '✓', '✓'],
  ['BYOK (your Anthropic key)', '—', '✓ required', '✓ required', '✓ per-client'],
  ['SLA tracking (MTTA/MTTR)', '—', '✓', '✓', '✓'],
  ['PDF executive reports', '—', '—', '✓', '✓'],
  ['API access', '—', '—', '✓', '✓'],
  ['RBAC & audit log', '—', '—', '✓', '✓'],
  ['Compliance mapping', '—', '—', '✓', '✓'],
  ['Multi-tenant MSSP', '—', '—', '—', '✓'],
  ['White-label', '—', '—', '—', '✓'],
  ['Analyst seats', '1', 'Min 2', 'Up to 15', 'Unlimited'],
  ['Support', 'Community', 'Email', 'Priority + CSM', 'Dedicated AM'],
];
export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  async function handleCheckout(planId: string) {
    if (planId === 'community') { window.location.href = '/signup'; return; }
    setLoading(planId);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, email: email || undefined }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { setError(data.error || 'Something went wrong. Please try again.'); }
    } catch(e) { setError('Something went wrong. Please try again.'); }
    setLoading(null);
  }

  return (
    <div style={{ background: '#050508', color: '#e8ecf4', fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:#050508}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media(max-width:900px){.price-grid{grid-template-columns:1fr 1fr!important}}
        @media(max-width:600px){.price-grid{grid-template-columns:1fr!important}.compare-grid{display:none!important}}
        a{text-decoration:none;color:inherit}
      `}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', padding: '14px 28px', borderBottom: '1px solid #ffffff06', background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(18px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <a href='/' style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.95rem' }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#4f8fff,#8b6fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', color: '#fff', fontWeight: 900 }}>W</div>
          Watchtower
        </a>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href='/demo' style={{ color: '#6b7a94', fontSize: '0.8rem', fontWeight: 500, padding: '7px 14px' }}>Demo</a>
          <a href='/login' style={{ color: '#6b7a94', fontSize: '0.8rem', fontWeight: 500, padding: '7px 14px' }}>Sign In</a>
          <a href='/signup' style={{ padding: '8px 18px', borderRadius: 8, background: '#4f8fff', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>Start Free →</a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ textAlign: 'center', padding: '64px 24px 32px' }}>
        <div style={{ display: 'inline-block', padding: '4px 14px', border: '1px solid #4f8fff25', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, color: '#4f8fff', marginBottom: 18 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f8fff', display: 'inline-block', marginRight: 6, animation: 'pulse 2s ease infinite', verticalAlign: 'middle' }} />
          14-day free trial · No Watchtower credit card required
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: -2, marginBottom: 12 }}>Simple, transparent pricing</h1>
        <p style={{ fontSize: '1rem', color: '#6b7a94', maxWidth: 520, margin: '0 auto 20px', lineHeight: 1.7 }}>BYOK model — you connect your own Anthropic key. AI costs go direct to your Anthropic account. No markups, no AI overage bills from us.</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder='your@email.com (optional — pre-fills checkout)' style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #1e2536', background: '#0a0d14', color: '#e8ecf4', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif', outline: 'none', width: 300 }} />
        </div>
        {error && <div style={{ marginTop: 10, fontSize: '0.76rem', color: '#f0405e' }}>{error}</div>}
      </div>

      {/* BYOK CALLOUT */}
      <div style={{ maxWidth: 800, margin: '0 auto 40px', padding: '0 24px' }}>
        <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(139,111,255,0.05))', border: '1px solid #4f8fff20', borderRadius: 14, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>🔑</div>
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: 4 }}>Why BYOK? Because your security data should be yours.</div>
            <div style={{ fontSize: '0.76rem', color: '#6b7a94', lineHeight: 1.75 }}>Shared AI keys mean your alert data passes through a commingled account. With BYOK, your Anthropic key is stored encrypted per-tenant in Redis and all AI calls go direct from Watchtower to Anthropic under your account. Full audit trail, full compliance, zero data commingling. Most enterprise security teams require this model.</div>
          </div>
        </div>
      </div>

      {/* PLANS */}
      <div className='price-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, maxWidth: 1060, margin: '0 auto', padding: '0 24px 60px' }}>
        {PLANS.map(plan => (
          <div key={plan.id} style={{ padding: 24, background: '#0a0d14', border: `1px solid ${plan.popular ? '#4f8fff35' : '#141820'}`, borderRadius: 16, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {plan.popular && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center', fontSize: '0.52rem', fontWeight: 700, color: '#fff', background: '#4f8fff', padding: '4px 0' }}>MOST POPULAR</div>}
            <div style={{ marginTop: plan.popular ? 18 : 0, marginBottom: 4, fontSize: '0.92rem', fontWeight: 700 }}>{plan.name}</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', letterSpacing: -2, color: plan.color, lineHeight: 1 }}>{plan.price}</div>
            <div style={{ fontSize: '0.64rem', color: '#4a5568', marginBottom: 8 }}>{plan.period}</div>
            {plan.byok && <div style={{ fontSize: '0.56rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#4f8fff12', color: '#4f8fff', border: '1px solid #4f8fff20', display: 'inline-block', marginBottom: 14 }}>🔑 BYOK — your Anthropic key</div>}
            {!plan.byok && <div style={{ marginBottom: 14 }} />}
            <div style={{ flex: 1, marginBottom: 20 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: '0.76rem', color: '#a0adc4', padding: '4px 0', lineHeight: 1.5 }}>
                  <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>✓</span>{f}
                </div>
              ))}
            </div>
            <button onClick={() => handleCheckout(plan.id)} disabled={loading === plan.id}
              style={{ padding: '11px 0', borderRadius: 10, border: plan.popular ? 'none' : `1px solid ${plan.color}30`, background: plan.popular ? '#4f8fff' : `${plan.color}12`, color: plan.popular ? '#fff' : plan.color, fontSize: '0.82rem', fontWeight: 700, cursor: loading === plan.id ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: loading === plan.id ? 0.7 : 1, transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {loading === plan.id ? <span style={{display:'inline-flex',alignItems:'center',gap:5}}><span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Processing…</span> : <span>{plan.cta}</span>}
            </button>
            {!plan.free && <div style={{ textAlign: 'center', fontSize: '0.6rem', color: '#3a4050', marginTop: 8 }}>14-day free trial · Cancel anytime</div>}
          </div>
        ))}
      </div>

      {/* COMPARISON */}
      <div className='compare-grid' style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: -1, textAlign: 'center', marginBottom: 28 }}>Everything in detail</h2>
        <div style={{ background: '#0a0d14', border: '1px solid #141820', borderRadius: 14, overflow: 'hidden' }}>
          {COMPARISON.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: i < COMPARISON.length - 1 ? '1px solid #141820' : 'none', background: i === 0 ? '#0d1018' : i % 2 === 0 ? '#09091a' : 'transparent' }}>
              {row.map((cell, j) => (
                <div key={j} style={{ padding: '10px 14px', fontSize: i === 0 ? '0.6rem' : '0.74rem', fontWeight: i === 0 || j === 0 ? 700 : 400, color: i === 0 ? '#4f8fff' : j === 0 ? '#e8ecf4' : cell === '—' ? '#2a3040' : cell.startsWith('✓') ? '#22d49a' : cell.includes('🔑') ? '#4f8fff' : '#8a9ab8', textAlign: j > 0 ? 'center' : 'left', textTransform: i === 0 ? 'uppercase' : 'none', letterSpacing: i === 0 ? '0.5px' : 0 }}>{cell}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 80px' }}>
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
        <a href='mailto:hello@getwatchtower.io' style={{ display: 'inline-block', padding: '12px 30px', borderRadius: 10, border: '1px solid #1e2536', background: 'transparent', color: '#e8ecf4', fontSize: '0.88rem', fontWeight: 600 }}>hello@getwatchtower.io</a>
      </div>
    </div>
  );
}const FEATURE_TABLE = [
  ['Feature', 'Community', 'Essentials', 'Professional', 'Enterprise'],
  ['Tool integrations', '3', 'Unlimited', 'Unlimited', 'Unlimited'],
  ['AI triage — APEX verdicts', '✓ full', '✓ full', '✓ full', '✓ full'],
  ['Daily alert capacity', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'],
  ['AI Co-Pilot', '5/day', '✓ unlimited', '✓ unlimited', '✓ unlimited'],
  ['Automation & response actions', '—', '✓', '✓', '✓'],
  ['Incidents + runbooks', '—', '✓', '✓', '✓'],
  ['RBAC & audit log', '—', '✓', '✓', '✓'],
  ['SLA tracking (MTTA/MTTR)', '—', '✓', '✓', '✓'],
  ['BYOK (your Anthropic key)', '—', '✓ required', '✓ required', '✓ per-client'],
  ['Board reports + compliance', '—', '—', '✓', '✓'],
  ['API + webhooks + inbound push', '—', '—', '✓', '✓'],
  ['Multi-tenant managed clients', '—', '—', 'Up to 3', 'Unlimited'],
  ['IOC search + NL query', '—', '—', '✓', '✓'],
  ['White-label', '—', '—', '—', '✓'],
  ['OT / ICS add-on', '—', '—', '+£999/mo', '+£999/mo'],
  ['Analyst seats', '1', 'Min 2', 'Up to 15', 'Unlimited'],
  ['Support', 'Community', 'Email', 'Priority + CSM', 'Dedicated AM'],
];
export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  async function handleCheckout(planId: string) {
    if (planId === 'community') { window.location.href = '/signup'; return; }
    setLoading(planId);
    setError('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, email: email || undefined }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { setError(data.error || 'Something went wrong. Please try again.'); }
    } catch(e) { setError('Something went wrong. Please try again.'); }
    setLoading(null);
  }

  return (
    <div style={{ background: '#050508', color: '#e8ecf4', fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:#050508}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media(max-width:900px){.price-grid{grid-template-columns:1fr 1fr!important}}
        @media(max-width:600px){.price-grid{grid-template-columns:1fr!important}.compare-grid{display:none!important}}
        a{text-decoration:none;color:inherit}
      `}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', padding: '14px 28px', borderBottom: '1px solid #ffffff06', background: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(18px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <a href='/' style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.95rem' }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#4f8fff,#8b6fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', color: '#fff', fontWeight: 900 }}>W</div>
          Watchtower
        </a>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href='/demo' style={{ color: '#6b7a94', fontSize: '0.8rem', fontWeight: 500, padding: '7px 14px' }}>Demo</a>
          <a href='/login' style={{ color: '#6b7a94', fontSize: '0.8rem', fontWeight: 500, padding: '7px 14px' }}>Sign In</a>
          <a href='/signup' style={{ padding: '8px 18px', borderRadius: 8, background: '#4f8fff', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>Start Free →</a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ textAlign: 'center', padding: '64px 24px 32px' }}>
        <div style={{ display: 'inline-block', padding: '4px 14px', border: '1px solid #4f8fff25', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, color: '#4f8fff', marginBottom: 18 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f8fff', display: 'inline-block', marginRight: 6, animation: 'pulse 2s ease infinite', verticalAlign: 'middle' }} />
          14-day free trial · No Watchtower credit card required
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: -2, marginBottom: 12 }}>Simple, transparent pricing</h1>
        <p style={{ fontSize: '1rem', color: '#6b7a94', maxWidth: 520, margin: '0 auto 20px', lineHeight: 1.7 }}>BYOK model — you connect your own Anthropic key. AI costs go direct to your Anthropic account. No markups, no AI overage bills from us.</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder='your@email.com (optional — pre-fills checkout)' style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #1e2536', background: '#0a0d14', color: '#e8ecf4', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif', outline: 'none', width: 300 }} />
        </div>
        {error && <div style={{ marginTop: 10, fontSize: '0.76rem', color: '#f0405e' }}>{error}</div>}
      </div>

      {/* BYOK CALLOUT */}
      <div style={{ maxWidth: 800, margin: '0 auto 40px', padding: '0 24px' }}>
        <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(139,111,255,0.05))', border: '1px solid #4f8fff20', borderRadius: 14, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>🔑</div>
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: 4 }}>Why BYOK? Because your security data should be yours.</div>
            <div style={{ fontSize: '0.76rem', color: '#6b7a94', lineHeight: 1.75 }}>Shared AI keys mean your alert data passes through a commingled account. With BYOK, your Anthropic key is stored encrypted per-tenant in Redis and all AI calls go direct from Watchtower to Anthropic under your account. Full audit trail, full compliance, zero data commingling. Most enterprise security teams require this model.</div>
          </div>
        </div>
      </div>

      {/* PLANS */}
      <div className='price-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, maxWidth: 1060, margin: '0 auto', padding: '0 24px 60px' }}>
        {PLANS.map(plan => (
          <div key={plan.id} style={{ padding: 24, background: '#0a0d14', border: `1px solid ${plan.popular ? '#4f8fff35' : '#141820'}`, borderRadius: 16, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {plan.popular && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center', fontSize: '0.52rem', fontWeight: 700, color: '#fff', background: '#4f8fff', padding: '4px 0' }}>MOST POPULAR</div>}
            <div style={{ marginTop: plan.popular ? 18 : 0, marginBottom: 4, fontSize: '0.92rem', fontWeight: 700 }}>{plan.name}</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', letterSpacing: -2, color: plan.color, lineHeight: 1 }}>{plan.price}</div>
            <div style={{ fontSize: '0.64rem', color: '#4a5568', marginBottom: 8 }}>{plan.period}</div>
            {plan.byok && <div style={{ fontSize: '0.56rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#4f8fff12', color: '#4f8fff', border: '1px solid #4f8fff20', display: 'inline-block', marginBottom: 14 }}>🔑 BYOK — your Anthropic key</div>}
            {!plan.byok && <div style={{ marginBottom: 14 }} />}
            <div style={{ flex: 1, marginBottom: 20 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: '0.76rem', color: '#a0adc4', padding: '4px 0', lineHeight: 1.5 }}>
                  <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>✓</span>{f}
                </div>
              ))}
            </div>
            <button onClick={() => handleCheckout(plan.id)} disabled={loading === plan.id}
              style={{ padding: '11px 0', borderRadius: 10, border: plan.popular ? 'none' : `1px solid ${plan.color}30`, background: plan.popular ? '#4f8fff' : `${plan.color}12`, color: plan.popular ? '#fff' : plan.color, fontSize: '0.82rem', fontWeight: 700, cursor: loading === plan.id ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: loading === plan.id ? 0.7 : 1, transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {loading === plan.id ? <span style={{display:'inline-flex',alignItems:'center',gap:5}}><span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Processing…</span> : <span>{plan.cta}</span>}
            </button>
            {!plan.free && <div style={{ textAlign: 'center', fontSize: '0.6rem', color: '#3a4050', marginTop: 8 }}>14-day free trial · Cancel anytime</div>}
          </div>
        ))}
      </div>

      {/* COMPARISON */}
      <div className='compare-grid' style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: -1, textAlign: 'center', marginBottom: 28 }}>Everything in detail</h2>
        <div style={{ background: '#0a0d14', border: '1px solid #141820', borderRadius: 14, overflow: 'hidden' }}>
          {COMPARISON.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: i < COMPARISON.length - 1 ? '1px solid #141820' : 'none', background: i === 0 ? '#0d1018' : i % 2 === 0 ? '#09091a' : 'transparent' }}>
              {row.map((cell, j) => (
                <div key={j} style={{ padding: '10px 14px', fontSize: i === 0 ? '0.6rem' : '0.74rem', fontWeight: i === 0 || j === 0 ? 700 : 400, color: i === 0 ? '#4f8fff' : j === 0 ? '#e8ecf4' : cell === '—' ? '#2a3040' : cell.startsWith('✓') ? '#22d49a' : cell.includes('🔑') ? '#4f8fff' : '#8a9ab8', textAlign: j > 0 ? 'center' : 'left', textTransform: i === 0 ? 'uppercase' : 'none', letterSpacing: i === 0 ? '0.5px' : 0 }}>{cell}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 80px' }}>
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
        <a href='mailto:hello@getwatchtower.io' style={{ display: 'inline-block', padding: '12px 30px', borderRadius: 10, border: '1px solid #1e2536', background: 'transparent', color: '#e8ecf4', fontSize: '0.88rem', fontWeight: 600 }}>hello@getwatchtower.io</a>
      </div>
    </div>
  );
}
