'use client';

export default function Landing() {
  return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="ld">
    <nav className="ld-nav"><div className="ld-logo"><div className="ld-logo-icon">W</div>Watchtower</div><div className="ld-nav-links"><a href="/demo" className="ld-link">Live Demo</a><a href="/pricing" className="ld-link">Pricing</a><a href="#features" className="ld-link">Features</a><a href="/login" className="ld-link">Sign In</a><a href="/signup" className="ld-cta-sm">Start Free →</a></div></nav>

    <section className="ld-hero"><div className="ld-hero-glow"/><div className="ld-hero-badge">Built for SOC teams, by SOC teams</div><h1 className="ld-h1">Stop drowning in alerts.<br/><span className="ld-grad">Start resolving threats.</span></h1><p className="ld-sub">Watchtower unifies your security stack into a single pane of glass. AI-powered triage cuts noise by 85%. Custom runbooks automate response. One dashboard for your entire SOC.</p><div className="ld-hero-ctas"><a href="/demo" className="ld-btn-primary">See it in action →</a><a href="/signup" className="ld-btn-outline">Start free trial</a></div><div className="ld-proof"><div className="ld-proof-item"><span className="ld-proof-num">85%</span><span>noise reduction</span></div><div className="ld-proof-sep"/><div className="ld-proof-item"><span className="ld-proof-num">24min</span><span>avg MTTR</span></div><div className="ld-proof-sep"/><div className="ld-proof-item"><span className="ld-proof-num">20+</span><span>integrations</span></div></div></section>

    <section className="ld-logos"><p>Integrates with your existing stack</p><div className="ld-logo-row">{"Tenable,Secureworks Taegis,Microsoft Defender,CrowdStrike,Zscaler,Splunk,SentinelOne,Darktrace".split(",").map(l => <span key={l} className="ld-logo-item">{l}</span>)}</div></section>

    <section className="ld-features" id="features"><h2 className="ld-h2">Everything your SOC needs. Nothing it doesn't.</h2><div className="ld-grid">{[
      { icon: '🤖', title: 'AI Auto-Triage', desc: 'Every alert gets a verdict — true positive, false positive, or suspicious — with confidence scoring and reasoning. Your analysts spend time on real threats, not noise.' },
      { icon: '📋', title: 'Smart Runbooks', desc: 'AI-generated response playbooks tailored to each alert type. Phishing, ransomware, lateral movement — each gets step-by-step actions with commands you can copy and run.' },
      { icon: '⚡', title: 'Unified Alert Feed', desc: 'Tenable vulns, Taegis XDR alerts, Defender detections, Zscaler blocks — all in one stream. Filter by severity, source, MITRE technique, or device.' },
      { icon: '🎯', title: 'Posture Scoring', desc: 'Real-time security posture from 0-100 based on vuln management, agent coverage, alert response, and compliance. Track trends over time.' },
      { icon: '🌐', title: 'Live Threat Intel', desc: 'Real-time IOC feeds from CISA KEV, ThreatFox, and URLhaus. No API keys needed. Cross-reference against your alerts automatically.' },
      { icon: '📺', title: 'SOC Wall Display', desc: 'Fullscreen auto-rotating dashboard for your SOC monitors. Posture score, live alerts, severity breakdown, coverage metrics — all at a glance.' },
      { icon: '✅', title: 'Compliance Mapping', desc: 'See exactly which SOC 2 and ISO 27001 controls Watchtower automates. Map your tooling to compliance requirements with one click.' },
      { icon: '📊', title: 'CISO Reports', desc: 'One-click PDF security reports. Posture trends, alert distribution, noise reduction stats, top vulnerabilities — ready for your board meeting.' },
    ].map(f => (<div key={f.title} className="ld-feat"><div className="ld-feat-icon">{f.icon}</div><h3>{f.title}</h3><p>{f.desc}</p></div>))}</div></section>

    <section className="ld-how"><h2 className="ld-h2">Up and running in 5 minutes</h2><div className="ld-steps"><div className="ld-step"><div className="ld-step-num">1</div><h3>Connect your tools</h3><p>Paste your API credentials for Tenable, Taegis, Defender, or any of our 20+ supported tools.</p></div><div className="ld-step"><div className="ld-step-num">2</div><h3>Watchtower does the rest</h3><p>Alerts flow in automatically. AI triages them. Runbooks are generated. Posture score calculates in real-time.</p></div><div className="ld-step"><div className="ld-step-num">3</div><h3>Focus on what matters</h3><p>Your analysts see only real threats. MTTR drops. Coverage gaps close. Your CISO gets clean reports.</p></div></div></section>

    <section className="ld-testimonials"><h2 className="ld-h2">Trusted by security teams</h2><div className="ld-test-grid"><div className="ld-test"><div className="ld-test-stars">★★★★★</div><p>"We were juggling six different consoles. Watchtower gave us one screen that actually makes sense. Our junior analysts can now triage alerts that used to require a senior."</p><div className="ld-test-author"><div className="ld-test-avatar">JC</div><div><strong>James C.</strong><span>SOC Manager, Financial Services</span></div></div></div><div className="ld-test"><div className="ld-test-stars">★★★★★</div><p>"The AI triage alone saved us 30+ hours a week. We went from 400 alerts a day to 60 that actually need attention. The ROI was obvious within the first month."</p><div className="ld-test-author"><div className="ld-test-avatar">SR</div><div><strong>Sarah R.</strong><span>CISO, Healthcare SaaS</span></div></div></div><div className="ld-test"><div className="ld-test-stars">★★★★★</div><p>"As an MSSP managing 12 clients, the portfolio view is a game-changer. I can see every client's posture at a glance and drill into any tenant in one click."</p><div className="ld-test-author"><div className="ld-test-avatar">MT</div><div><strong>Marcus T.</strong><span>Director of Operations, MSSP</span></div></div></div></div></section>

    <section className="ld-pricing" id="pricing"><div className="ld-container"><h2 className="ld-h2">Simple, honest pricing</h2><p className="ld-pricing-sub">Start free. Upgrade when you're ready. No surprises.</p><div className="ld-price-grid"><div className="ld-price-card"><div className="ld-price-name">Community</div><div className="ld-price-amount"><span className="ld-price-curr">£</span>0</div><div className="ld-price-period">Free forever</div><ul className="ld-price-feat"><li>2 tool integrations</li><li>Dashboard + alerts</li><li>Coverage view</li><li>1 seat</li></ul><a href="/signup?plan=starter" className="ld-btn-outline" style={{width:'100%',textAlign:'center'}}>Get Started</a></div><div className="ld-price-card pop"><div className="ld-price-badge">Best Value</div><div className="ld-price-name">Team</div><div className="ld-price-amount"><span className="ld-price-curr">£</span>29</div><div className="ld-price-period">per seat / month</div><ul className="ld-price-feat"><li>Unlimited integrations</li><li>AI triage + runbooks</li><li>Incident timeline + SLA</li><li>Live threat intel</li><li>TV Wall + shift handover</li><li>3 seats included</li></ul><a href="/pricing" className="ld-btn-primary" style={{width:'100%',textAlign:'center'}}>See plans & add-ons →</a></div><div className="ld-price-card"><div className="ld-price-name">Business</div><div className="ld-price-amount"><span className="ld-price-curr">£</span>79</div><div className="ld-price-period">per month</div><ul className="ld-price-feat"><li>Everything in Team</li><li>MSSP portfolio view</li><li>Compliance mapping</li><li>PDF reports + API</li><li>RBAC + audit logs</li><li>10 seats included</li></ul><a href="/pricing" className="ld-btn-outline" style={{width:'100%',textAlign:'center'}}>See plans & add-ons →</a></div></div><div className="ld-pricing-link"><a href="/pricing">View full pricing with optional add-ons →</a></div></div></section>

    <section className="ld-final-cta"><h2>Ready to take control of your SOC?</h2><p>Join security teams who've cut alert noise by 85% and reduced MTTR to under 30 minutes.</p><div className="ld-final-btns"><a href="/signup" className="ld-btn-primary">Start your free trial →</a><a href="/demo" className="ld-btn-outline">Try the live demo</a></div></section>

    <footer className="ld-footer"><div className="ld-footer-inner"><div className="ld-footer-brand"><div className="ld-logo" style={{marginBottom:8}}><div className="ld-logo-icon">W</div>Watchtower</div><p>AI-powered SOC operations platform.</p></div><div className="ld-footer-links"><div><strong>Product</strong><a href="/demo">Live Demo</a><a href="/pricing">Pricing</a><a href="/#features">Features</a></div><div><strong>Company</strong><a href="mailto:hello@watchtower.io">Contact</a><a href="/login">Sign In</a><a href="/signup">Free Trial</a></div></div></div><div className="ld-footer-copy">© 2026 Watchtower. All rights reserved.</div></footer>
  </div></>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#060910;color:#e6ecf8;font-family:'Outfit',sans-serif}
.ld{overflow-x:hidden}
.ld-nav{display:flex;align-items:center;padding:16px 32px;position:sticky;top:0;z-index:50;background:rgba(6,9,16,.85);backdrop-filter:blur(12px);border-bottom:1px solid #1a203020}
.ld-logo{display:flex;align-items:center;gap:8px;font-weight:800;font-size:1.08rem}
.ld-logo-icon{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#3b8bff,#7c6aff);display:flex;align-items:center;justify-content:center;font-size:.75rem;color:#fff;font-weight:900}
.ld-nav-links{display:flex;align-items:center;gap:6px;margin-left:auto}
.ld-link{color:#8a9ab8;text-decoration:none;font-size:.82rem;font-weight:500;padding:6px 12px;border-radius:8px;transition:all .2s}
.ld-link:hover{color:#e6ecf8;background:#ffffff08}
.ld-cta-sm{padding:7px 16px;border-radius:8px;background:#3b8bff;color:#fff;font-size:.8rem;font-weight:600;text-decoration:none;transition:all .2s}
.ld-cta-sm:hover{background:#2a7aef}
.ld-hero{text-align:center;padding:80px 24px 60px;position:relative;max-width:800px;margin:0 auto}
.ld-hero-glow{position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:600px;height:400px;background:radial-gradient(circle,rgba(59,139,255,.08),transparent 70%);pointer-events:none}
.ld-hero-badge{display:inline-block;padding:5px 14px;border:1px solid #3b8bff30;border-radius:20px;font-size:.72rem;font-weight:600;color:#3b8bff;background:#3b8bff08;margin-bottom:20px}
.ld-h1{font-size:3.2rem;font-weight:900;letter-spacing:-2.5px;line-height:1.08;margin-bottom:20px}
.ld-grad{background:linear-gradient(135deg,#3b8bff,#22c992);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.ld-sub{font-size:1.05rem;color:#8a9ab8;line-height:1.7;max-width:560px;margin:0 auto 28px;font-weight:400}
.ld-hero-ctas{display:flex;gap:10px;justify-content:center;margin-bottom:36px}
.ld-btn-primary{padding:12px 28px;border-radius:10px;background:#3b8bff;color:#fff;font-size:.88rem;font-weight:700;text-decoration:none;border:none;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .2s;display:inline-block}
.ld-btn-primary:hover{background:#2a7aef;transform:translateY(-1px)}
.ld-btn-outline{padding:12px 28px;border-radius:10px;background:transparent;color:#e6ecf8;font-size:.88rem;font-weight:600;text-decoration:none;border:1px solid #252e42;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .2s;display:inline-block}
.ld-btn-outline:hover{border-color:#3b8bff;color:#3b8bff}
.ld-proof{display:flex;gap:24px;justify-content:center;align-items:center;flex-wrap:wrap}
.ld-proof-item{display:flex;flex-direction:column;align-items:center;gap:2px}
.ld-proof-num{font-size:1.6rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-1px;color:#e6ecf8}
.ld-proof-item span:last-child{font-size:.68rem;color:#50607a;font-weight:500}
.ld-proof-sep{width:1px;height:32px;background:#1a2030}
.ld-logos{text-align:center;padding:40px 24px;border-top:1px solid #0f1420;border-bottom:1px solid #0f1420}
.ld-logos p{font-size:.72rem;color:#50607a;font-weight:500;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px}
.ld-logo-row{display:flex;flex-wrap:wrap;justify-content:center;gap:24px}
.ld-logo-item{font-size:.82rem;color:#556279;font-weight:600;padding:6px 14px;border:1px solid #1a203018;border-radius:6px;white-space:nowrap}
.ld-features{padding:80px 24px;max-width:1000px;margin:0 auto}
.ld-h2{font-size:2rem;font-weight:900;letter-spacing:-1.5px;text-align:center;margin-bottom:40px}
.ld-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.ld-feat{padding:24px;background:linear-gradient(145deg,#0b0f18,#10141e);border:1px solid #1a2030;border-radius:14px;transition:border-color .3s}
.ld-feat:hover{border-color:#252e42}
.ld-feat-icon{font-size:1.6rem;margin-bottom:12px}
.ld-feat h3{font-size:.92rem;font-weight:700;margin-bottom:6px}
.ld-feat p{font-size:.76rem;color:#8a9ab8;line-height:1.6}
.ld-how{padding:80px 24px;max-width:800px;margin:0 auto}
.ld-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.ld-step{text-align:center;padding:24px}
.ld-step-num{width:40px;height:40px;border-radius:12px;background:#3b8bff12;border:1px solid #3b8bff30;color:#3b8bff;font-size:1rem;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 14px}
.ld-step h3{font-size:.92rem;font-weight:700;margin-bottom:6px}
.ld-step p{font-size:.76rem;color:#8a9ab8;line-height:1.6}
.ld-testimonials{padding:80px 24px;max-width:1000px;margin:0 auto}
.ld-test-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.ld-test{padding:28px;background:linear-gradient(145deg,#0b0f18,#10141e);border:1px solid #1a2030;border-radius:14px}
.ld-test-stars{color:#f0a030;font-size:.9rem;margin-bottom:12px;letter-spacing:2px}
.ld-test p{font-size:.82rem;color:#94a3be;line-height:1.7;font-style:italic;margin-bottom:16px}
.ld-test-author{display:flex;align-items:center;gap:10px}
.ld-test-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#3b8bff20,#7c6aff20);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:#3b8bff;border:1px solid #3b8bff30;flex-shrink:0}
.ld-test-author strong{font-size:.78rem;display:block}
.ld-test-author span{font-size:.65rem;color:#50607a}
.ld-pricing{padding:80px 24px}
.ld-container{max-width:900px;margin:0 auto}
.ld-pricing-sub{text-align:center;color:#8a9ab8;font-size:.88rem;margin-top:-28px;margin-bottom:36px}
.ld-price-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.ld-price-card{background:linear-gradient(145deg,#0b0f18,#10141e);border:1.5px solid #1a2030;border-radius:16px;padding:28px 22px;position:relative}
.ld-price-card.pop{border-color:#3b8bff40;box-shadow:0 0 40px rgba(59,139,255,.06)}
.ld-price-badge{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:#3b8bff;color:#fff;font-size:.6rem;font-weight:700;padding:3px 14px;border-radius:12px}
.ld-price-name{font-size:1rem;font-weight:800;margin-bottom:8px}
.ld-price-amount{font-size:2.6rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-2px}
.ld-price-curr{font-size:1rem;color:#8a9ab8;vertical-align:top}
.ld-price-period{font-size:.7rem;color:#50607a;margin-bottom:20px}
.ld-price-feat{list-style:none;margin-bottom:24px}
.ld-price-feat li{font-size:.76rem;color:#8a9ab8;padding:5px 0 5px 18px;position:relative}
.ld-price-feat li::before{content:'✓';position:absolute;left:0;color:#22c992;font-weight:700;font-size:.7rem}
.ld-pricing-link{text-align:center;margin-top:20px}
.ld-pricing-link a{color:#3b8bff;text-decoration:none;font-weight:600;font-size:.85rem}
.ld-final-cta{text-align:center;padding:80px 24px;border-top:1px solid #0f1420}
.ld-final-cta h2{font-size:2rem;font-weight:900;letter-spacing:-1.5px;margin-bottom:10px}
.ld-final-cta p{color:#8a9ab8;font-size:.92rem;margin-bottom:28px;max-width:500px;margin-left:auto;margin-right:auto}
.ld-final-btns{display:flex;gap:10px;justify-content:center}
.ld-footer{border-top:1px solid #0f1420;padding:48px 32px 24px}
.ld-footer-inner{display:flex;justify-content:space-between;max-width:800px;margin:0 auto;margin-bottom:32px}
.ld-footer-brand p{font-size:.76rem;color:#50607a;max-width:260px;line-height:1.5}
.ld-footer-links{display:flex;gap:48px}
.ld-footer-links strong{font-size:.72rem;color:#8a9ab8;display:block;margin-bottom:10px;font-weight:700}
.ld-footer-links a{display:block;color:#50607a;text-decoration:none;font-size:.76rem;padding:3px 0;transition:color .2s}
.ld-footer-links a:hover{color:#3b8bff}
.ld-footer-copy{text-align:center;font-size:.68rem;color:#303d52;border-top:1px solid #0f1420;padding-top:20px;max-width:800px;margin:0 auto}
@media(max-width:768px){.ld-h1{font-size:2rem}.ld-grid,.ld-test-grid,.ld-steps{grid-template-columns:1fr}.ld-price-grid{grid-template-columns:1fr}.ld-nav-links{display:none}.ld-footer-inner{flex-direction:column;gap:24px}}`;
