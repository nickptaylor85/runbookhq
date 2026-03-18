'use client';
import { useState } from 'react';

const PLANS = [
  { id: 'community', name: 'Community', price: 0, period: 'forever', seats: 1, desc: 'For individuals exploring security tooling', features: ['2 tool integrations', 'Dashboard + alerts', 'Coverage view', 'Manual refresh', 'Community support'], cta: 'Get Started Free', ctaStyle: 'ghost' },
  { id: 'team', name: 'Team', price: 29, period: '/seat/month', seats: 3, desc: 'For SOC teams of 2-10 analysts', features: ['Unlimited integrations', 'AI Co-Pilot + auto-triage', 'Custom runbooks', 'Incident timeline', 'SLA tracking', 'Threat intelligence', 'TV Wall + shift handover', '30s auto-refresh', '3 seats included', 'Email support'], cta: 'Start Free Trial', ctaStyle: 'primary', popular: true },
  { id: 'business', name: 'Business', price: 79, period: '/month', seats: 10, desc: 'For mature SOCs and MSSPs', features: ['Everything in Team', 'MSSP portfolio view', 'Compliance mapping', 'PDF reports + scheduling', 'API access + webhooks', 'RBAC + audit logs', '10 seats included', 'Priority support'], cta: 'Start Free Trial', ctaStyle: 'primary' },
  { id: 'enterprise', name: 'Enterprise', price: null, period: '', seats: 0, desc: 'Custom deployment for large organisations', features: ['Everything in Business', 'SSO / SAML', 'Custom branding', 'Dedicated instance', 'SLA guarantee', 'Custom integrations', 'Unlimited seats', 'Dedicated account manager'], cta: 'Contact Sales', ctaStyle: 'ghost' },
];

const ADDONS = [
  { id: 'seats', name: 'Additional Seats', price: 12, unit: '/seat/month', desc: 'Add more analysts beyond your plan limit', icon: '👥' },
  { id: 'ai', name: 'AI Credits Pack', price: 19, unit: '/month', desc: 'Unlimited AI triage, co-pilot, predictions, NL queries', icon: '🤖' },
  { id: 'intel', name: 'Live Threat Intel', price: 9, unit: '/month', desc: 'CISA KEV, ThreatFox, URLhaus — real-time IOC feeds', icon: '🌐' },
  { id: 'reports', name: 'PDF Reports + Scheduling', price: 15, unit: '/month', desc: 'CISO-ready PDF reports, daily/weekly email digests', icon: '📊' },
  { id: 'api', name: 'API Access', price: 25, unit: '/month', desc: 'REST API keys, outbound webhooks, automation', icon: '🔌' },
  { id: 'branding', name: 'Custom Branding (MSSP)', price: 49, unit: '/month', desc: 'White-label with your logo, colours, and domain', icon: '🎨' },
  { id: 'support', name: 'Priority Support', price: 29, unit: '/month', desc: '4-hour SLA, dedicated Slack channel, onboarding call', icon: '🎯' },
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState('team');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [extraSeats, setExtraSeats] = useState(0);
  const [annual, setAnnual] = useState(false);

  function toggleAddon(id: string) { setSelectedAddons(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }

  const plan = PLANS.find(p => p.id === selectedPlan);
  const basePrice = plan?.price || 0;
  const seatsPrice = extraSeats * 12;
  const addonsPrice = selectedAddons.reduce((s, id) => s + (ADDONS.find(a => a.id === id)?.price || 0), 0);
  const monthly = basePrice + seatsPrice + addonsPrice;
  const total = annual ? Math.round(monthly * 10) : monthly;
  const savings = annual ? monthly * 2 : 0;

  async function checkout() {
    if (selectedPlan === 'community') { window.location.href = '/signup?plan=starter'; return; }
    if (selectedPlan === 'enterprise') { window.location.href = 'mailto:sales@watchtower.io?subject=Enterprise%20Enquiry'; return; }
    const r = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: selectedPlan, addons: selectedAddons, seatQty: extraSeats }) });
    const d = await r.json();
    if (d.url) window.location.href = d.url;
    else alert(d.error || 'Checkout failed');
  }

  return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="pp">
    <div className="pp-nav"><a href="/" className="pp-logo"><div className="pp-logo-icon">W</div>Watchtower</a><a href="/demo" className="pp-link">Live Demo</a><a href="/login" className="pp-link">Sign In</a></div>

    <div className="pp-hero"><h1>Simple, transparent pricing</h1><p>Start free. Scale as your SOC grows. No hidden fees.</p><div className="pp-toggle"><button className={!annual ? 'active' : ''} onClick={() => setAnnual(false)}>Monthly</button><button className={annual ? 'active' : ''} onClick={() => setAnnual(true)}>Annual <span className="pp-save">Save 17%</span></button></div></div>

    <div className="pp-plans">{PLANS.map(p => (<div key={p.id} className={`pp-plan ${selectedPlan === p.id ? 'selected' : ''} ${p.popular ? 'popular' : ''}`} onClick={() => setSelectedPlan(p.id)}>
      {p.popular && <div className="pp-badge">Most Popular</div>}
      <div className="pp-plan-name">{p.name}</div>
      <div className="pp-plan-price">{p.price !== null ? <><span className="pp-currency">£</span>{annual ? Math.round(p.price * 10 / 12) : p.price}<span className="pp-period">{p.period}</span></> : <span className="pp-custom">Custom</span>}</div>
      <div className="pp-plan-desc">{p.desc}</div>
      <ul className="pp-features">{p.features.map(f => <li key={f}>{f}</li>)}</ul>
      <button className={`pp-cta ${p.ctaStyle === 'primary' ? 'pp-cta-primary' : ''}`} onClick={(e) => { e.stopPropagation(); setSelectedPlan(p.id); }}>{selectedPlan === p.id ? '✓ Selected' : p.cta}</button>
    </div>))}</div>

    {selectedPlan !== 'community' && selectedPlan !== 'enterprise' && <><div className="pp-section"><h2>🧩 Add-ons</h2><p className="pp-section-sub">Enhance your plan with premium capabilities</p><div className="pp-addons">{ADDONS.map(a => (<div key={a.id} className={`pp-addon ${selectedAddons.includes(a.id) ? 'selected' : ''}`} onClick={() => toggleAddon(a.id)}>
      <div className="pp-addon-icon">{a.icon}</div>
      <div className="pp-addon-info"><div className="pp-addon-name">{a.name}</div><div className="pp-addon-desc">{a.desc}</div></div>
      <div className="pp-addon-price">£{a.price}<span>{a.unit}</span></div>
      <div className={`pp-addon-check ${selectedAddons.includes(a.id) ? 'on' : ''}`}>{selectedAddons.includes(a.id) ? '✓' : '+'}</div>
    </div>))}</div></div>

    {selectedPlan === 'team' && <div className="pp-section"><h2>👥 Additional Seats</h2><p className="pp-section-sub">Team plan includes 3 seats. Add more at £12/seat/month.</p><div className="pp-seats"><button onClick={() => setExtraSeats(Math.max(0, extraSeats - 1))}>−</button><span>{extraSeats}</span><button onClick={() => setExtraSeats(extraSeats + 1)}>+</button><span className="pp-seats-total">{3 + extraSeats} total seats</span></div></div>}</>}

    <div className="pp-summary"><div className="pp-summary-inner"><div className="pp-summary-left"><div className="pp-summary-plan">{plan?.name} Plan</div>{selectedAddons.length > 0 && <div className="pp-summary-addons">+ {selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''}</div>}{extraSeats > 0 && <div className="pp-summary-addons">+ {extraSeats} extra seat{extraSeats > 1 ? 's' : ''}</div>}{annual && savings > 0 && <div className="pp-summary-savings">Save £{savings}/year with annual billing</div>}</div><div className="pp-summary-right"><div className="pp-summary-total">£{total}<span>/{annual ? 'year' : 'month'}</span></div><button className="pp-checkout" onClick={checkout}>{selectedPlan === 'community' ? 'Get Started Free →' : selectedPlan === 'enterprise' ? 'Contact Sales →' : 'Start 14-Day Free Trial →'}</button></div></div></div>
  </div></>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#05070c;color:#eaf0ff;font-family:'DM Sans',sans-serif}
.pp{min-height:100vh}
.pp-nav{display:flex;align-items:center;padding:14px 24px;gap:16px;border-bottom:1px solid #141928}
.pp-logo{display:flex;align-items:center;gap:8px;font-weight:900;font-size:1.05rem;color:#eaf0ff;text-decoration:none;margin-right:auto}
.pp-logo-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#5b9aff,#8b6fff);display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#fff;font-weight:900}
.pp-link{color:#8896b8;text-decoration:none;font-size:.82rem;font-weight:600;transition:color .2s}
.pp-link:hover{color:#5b9aff}
.pp-hero{text-align:center;padding:48px 24px 32px}
.pp-hero h1{font-size:2.4rem;font-weight:900;letter-spacing:-2px;margin-bottom:8px}
.pp-hero p{font-size:.95rem;color:#8896b8;margin-bottom:24px}
.pp-toggle{display:inline-flex;background:#0a0d15;border:1px solid #1e2840;border-radius:10px;padding:3px}
.pp-toggle button{padding:8px 20px;border:none;border-radius:8px;background:transparent;color:#8896b8;font-size:.78rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.pp-toggle button.active{background:#5b9aff15;color:#5b9aff}
.pp-save{font-size:.6rem;color:#34e8a5;font-weight:700;margin-left:4px}
.pp-plans{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:1100px;margin:0 auto;padding:0 24px 40px}
.pp-plan{background:linear-gradient(145deg,#0a0d15,#0f1219);border:2px solid #141928;border-radius:16px;padding:24px 20px;cursor:pointer;transition:all .25s;position:relative}
.pp-plan:hover{border-color:#1e2840}
.pp-plan.selected{border-color:#5b9aff;box-shadow:0 0 30px rgba(91,154,255,.08)}
.pp-plan.popular{border-color:#5b9aff40}
.pp-badge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#5b9aff,#8b6fff);color:#fff;font-size:.6rem;font-weight:700;padding:3px 12px;border-radius:10px;white-space:nowrap}
.pp-plan-name{font-size:1rem;font-weight:800;margin-bottom:8px}
.pp-plan-price{font-size:2.2rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-2px;margin-bottom:4px}
.pp-currency{font-size:1rem;color:#8896b8;vertical-align:top;margin-right:2px}
.pp-period{font-size:.65rem;color:#4a5672;font-weight:500;margin-left:2px;font-family:'DM Sans',sans-serif}
.pp-custom{font-size:1.2rem;color:#8896b8;font-family:'DM Sans',sans-serif;letter-spacing:0}
.pp-plan-desc{font-size:.72rem;color:#4a5672;margin-bottom:16px}
.pp-features{list-style:none;margin-bottom:20px}
.pp-features li{font-size:.72rem;color:#8896b8;padding:4px 0;padding-left:16px;position:relative}
.pp-features li::before{content:'✓';position:absolute;left:0;color:#34e8a5;font-weight:700;font-size:.65rem}
.pp-cta{width:100%;padding:10px;border:1px solid #1e2840;border-radius:10px;background:transparent;color:#8896b8;font-size:.78rem;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.pp-cta:hover{border-color:#5b9aff;color:#5b9aff}
.pp-cta-primary{background:linear-gradient(135deg,#5b9aff,#8b6fff);border:none;color:#fff;box-shadow:0 2px 12px rgba(91,154,255,.2)}
.pp-cta-primary:hover{box-shadow:0 4px 20px rgba(91,154,255,.3)}
.pp-section{max-width:900px;margin:0 auto;padding:0 24px 32px}
.pp-section h2{font-size:1.2rem;font-weight:900;letter-spacing:-.5px;margin-bottom:4px}
.pp-section-sub{font-size:.82rem;color:#4a5672;margin-bottom:16px}
.pp-addons{display:flex;flex-direction:column;gap:8px}
.pp-addon{display:flex;align-items:center;gap:14px;padding:14px 18px;background:linear-gradient(145deg,#0a0d15,#0f1219);border:1.5px solid #141928;border-radius:12px;cursor:pointer;transition:all .2s}
.pp-addon:hover{border-color:#1e2840}
.pp-addon.selected{border-color:#5b9aff;background:#5b9aff05}
.pp-addon-icon{font-size:1.4rem;flex-shrink:0}
.pp-addon-info{flex:1}
.pp-addon-name{font-size:.85rem;font-weight:700}
.pp-addon-desc{font-size:.68rem;color:#4a5672;margin-top:2px}
.pp-addon-price{font-size:1rem;font-weight:900;font-family:'JetBrains Mono',monospace;color:#eaf0ff;white-space:nowrap}
.pp-addon-price span{font-size:.55rem;color:#4a5672;font-family:'DM Sans',sans-serif;margin-left:2px}
.pp-addon-check{width:28px;height:28px;border-radius:50%;border:2px solid #1e2840;display:flex;align-items:center;justify-content:center;font-size:.72rem;color:#4a5672;flex-shrink:0;transition:all .2s}
.pp-addon-check.on{background:#5b9aff;border-color:#5b9aff;color:#fff}
.pp-seats{display:flex;align-items:center;gap:12px}
.pp-seats button{width:36px;height:36px;border-radius:8px;border:1px solid #1e2840;background:transparent;color:#eaf0ff;font-size:1.2rem;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.pp-seats button:hover{border-color:#5b9aff;color:#5b9aff}
.pp-seats>span:nth-child(2){font-size:1.4rem;font-weight:900;font-family:'JetBrains Mono',monospace;min-width:30px;text-align:center}
.pp-seats-total{font-size:.78rem;color:#4a5672;margin-left:8px}
.pp-summary{position:sticky;bottom:0;background:linear-gradient(180deg,transparent,#05070c 20px);padding:20px 24px}
.pp-summary-inner{max-width:900px;margin:0 auto;background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #1e2840;border-radius:14px;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.pp-summary-left{}
.pp-summary-plan{font-size:.92rem;font-weight:800}
.pp-summary-addons{font-size:.72rem;color:#5b9aff;margin-top:2px}
.pp-summary-savings{font-size:.68rem;color:#34e8a5;font-weight:600;margin-top:2px}
.pp-summary-right{display:flex;align-items:center;gap:16px}
.pp-summary-total{font-size:2rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-2px}
.pp-summary-total span{font-size:.65rem;color:#4a5672;font-family:'DM Sans',sans-serif;margin-left:2px}
.pp-checkout{padding:12px 28px;border:none;border-radius:10px;background:linear-gradient(135deg,#5b9aff,#8b6fff);color:#fff;font-size:.88rem;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;box-shadow:0 4px 20px rgba(91,154,255,.3);white-space:nowrap;transition:all .2s}
.pp-checkout:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(91,154,255,.4)}
@media(max-width:900px){.pp-plans{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.pp-plans{grid-template-columns:1fr}.pp-hero h1{font-size:1.6rem}.pp-summary-inner{flex-direction:column;text-align:center}.pp-summary-right{flex-direction:column;width:100%}.pp-checkout{width:100%}}`;
