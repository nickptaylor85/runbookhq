'use client';

export default function Landing() {
  return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="ld">
    <nav className="ld-nav"><a href="/" className="ld-logo"><div className="ld-logo-icon">W</div>Watchtower</a><div className="ld-nav-links"><a href="/demo">Demo</a><a href="/pricing">Pricing</a><a href="/login">Sign In</a><a href="/signup" className="ld-nav-cta">Start Free →</a></div></nav>

    <section className="ld-hero"><div className="ld-glow" /><div className="ld-badge">AI-Powered SOC Platform</div><h1>Your SOC,<br/><span>on autopilot.</span></h1><p className="ld-sub">Watchtower connects to your security stack, triages every alert with AI, and responds automatically. Your analysts arrive to a clean queue — threats contained, noise eliminated.</p><div className="ld-ctas"><a href="/demo" className="ld-btn">Watch the demo →</a><a href="/signup" className="ld-btn-ghost">Start free trial</a></div><div className="ld-stats"><div><strong>85%</strong><span>noise eliminated</span></div><div className="ld-sep" /><div><strong>3.2s</strong><span>triage per alert</span></div><div className="ld-sep" /><div><strong>20+</strong><span>integrations</span></div></div></section>

    <section className="ld-ai"><div className="ld-ai-grid"><div className="ld-ai-text"><div className="ld-section-label">THE AI ENGINE</div><h2>Better than your best analyst.<br/>Faster than all of them combined.</h2><p>Every alert is enriched with device history, user context, and cross-alert correlation. The AI returns a verdict — TP, FP, or Suspicious — with a confidence score, evidence chain, and recommended actions. False positives above 95% confidence are auto-closed. Critical threats auto-escalate to incidents with full runbooks.</p><div className="ld-ai-metrics"><div className="ld-ai-metric"><div className="ld-ai-metric-val">98%</div><div>accuracy on credential<br/>access alerts</div></div><div className="ld-ai-metric"><div className="ld-ai-metric-val">42 min</div><div>saved per incident<br/>vs manual triage</div></div><div className="ld-ai-metric"><div className="ld-ai-metric-val">24/7</div><div>autonomous triage<br/>while you sleep</div></div></div></div><div className="ld-ai-card"><div className="ld-ai-card-hd"><div className="ld-ai-dot" />AI Triage Result</div><div className="ld-ai-card-alert">LSASS memory access on domain controller</div><div className="ld-ai-verdict">TRUE POSITIVE — 98%</div><div className="ld-ai-label">Evidence</div><div className="ld-ai-evidence"><div>Domain controller targeted</div><div>Service account used across 3 hosts</div><div>T1003.001 — high-fidelity detection</div></div><div className="ld-ai-label">Auto-Actions Taken</div><div className="ld-ai-actions"><div>✓ Incident #INC-0847 created</div><div>✓ admin_svc account disabled</div><div>✓ SOC Slack channel notified</div><div>✓ 5-step runbook generated</div></div></div></div></section>

    <section className="ld-tools"><div className="ld-section-label" style={{textAlign:'center'}}>INTEGRATIONS</div><h2 className="ld-h2c">Connects to everything you run</h2><div className="ld-tool-row">{['CrowdStrike','Defender','Taegis XDR','SentinelOne','Splunk','Sentinel','Darktrace','Zscaler','Tenable','Proofpoint','Wiz','Carbon Black'].map(t=><span key={t} className="ld-tool">{t}</span>)}</div></section>

    <section className="ld-features" id="features"><div className="ld-section-label" style={{textAlign:'center'}}>PLATFORM</div><h2 className="ld-h2c">One screen for your entire SOC</h2><div className="ld-feat-grid">{[
      {icon:'⚡',title:'Unified Alerts',desc:'13 sources in one feed. Filter by severity, MITRE technique, device, or user.'},
      {icon:'🛡',title:'Posture Scoring',desc:'Real-time A-F grade. Track improvement over time. Show progress to leadership.'},
      {icon:'🔍',title:'Vulnerability Management',desc:'Tenable integration with VPR scoring, patch priority, and compliance audits.'},
      {icon:'🌐',title:'Live Threat Intel',desc:'CISA KEV, ThreatFox, URLhaus — real feeds, no API keys required.'},
      {icon:'📊',title:'CISO Reports',desc:'One-click PDF reports with posture trends, alert stats, and top risks.'},
      {icon:'📺',title:'TV Wall Mode',desc:'Fullscreen auto-rotating display purpose-built for SOC monitors.'},
    ].map(f=><div key={f.title} className="ld-feat"><div className="ld-feat-icon">{f.icon}</div><h3>{f.title}</h3><p>{f.desc}</p></div>)}</div></section>

    <section className="ld-mssp"><div className="ld-mssp-inner"><div className="ld-section-label">FOR MSSPs</div><h2>Manage 50 clients from one console</h2><p>Client health at a glance. Cross-client threat correlation. Automated branded reports. White-label — your brand, zero Watchtower branding.</p><div className="ld-mssp-grid"><div className="ld-mssp-item"><strong>🟢🟡🔴</strong><span>Client health RAG</span></div><div className="ld-mssp-item"><strong>🔗</strong><span>Cross-client IOC correlation</span></div><div className="ld-mssp-item"><strong>📊</strong><span>Auto weekly reports</span></div><div className="ld-mssp-item"><strong>🎨</strong><span>Full white-label</span></div></div><a href="/pricing" className="ld-btn" style={{marginTop:20}}>See MSSP pricing →</a></div></section>

    <section className="ld-social"><h2 className="ld-h2c">What security teams say</h2><div className="ld-test-grid"><div className="ld-test"><p>"The AI triage alone saved us 30+ hours a week. We went from 400 alerts a day to 60 that actually need attention."</p><div className="ld-test-footer"><div className="ld-test-av">SR</div><div><strong>Sarah R.</strong><br/><span>CISO, Healthcare SaaS</span></div></div></div><div className="ld-test"><p>"As an MSSP managing 12 clients, the portfolio view is a game-changer. I can see every client's posture and drill into any tenant in one click."</p><div className="ld-test-footer"><div className="ld-test-av">MT</div><div><strong>Marcus T.</strong><br/><span>Director, MSSP</span></div></div></div><div className="ld-test"><p>"We were juggling six consoles. Watchtower gave us one screen that makes sense. Junior analysts now triage alerts that used to require a senior."</p><div className="ld-test-footer"><div className="ld-test-av">JC</div><div><strong>James C.</strong><br/><span>SOC Manager, Financial Services</span></div></div></div></div></section>

    <section className="ld-pricing"><div className="ld-section-label" style={{textAlign:'center'}}>PRICING</div><h2 className="ld-h2c">Start free. Scale when ready.</h2><div className="ld-price-row"><div className="ld-price"><div className="ld-price-name">Community</div><div className="ld-price-val">£0</div><div className="ld-price-per">Free forever</div><div className="ld-price-feats">2 tools · Dashboard · Alerts · 1 seat</div><a href="/signup" className="ld-btn-ghost" style={{width:'100%',textAlign:'center',padding:'10px 0'}}>Get Started</a></div><div className="ld-price pop"><div className="ld-price-pop">Most Popular</div><div className="ld-price-name">Team</div><div className="ld-price-val">£29<span>/seat/mo</span></div><div className="ld-price-per">3 seats included</div><div className="ld-price-feats">Unlimited tools · AI triage · Co-Pilot · Runbooks · Threat intel · SLA tracking · TV Wall</div><a href="/signup?plan=team" className="ld-btn" style={{width:'100%',textAlign:'center',padding:'10px 0'}}>Start Free Trial →</a></div><div className="ld-price"><div className="ld-price-name">Business</div><div className="ld-price-val">£79<span>/month</span></div><div className="ld-price-per">10 seats included</div><div className="ld-price-feats">Everything in Team · Compliance · Reports · API · RBAC</div><a href="/signup?plan=business" className="ld-btn-ghost" style={{width:'100%',textAlign:'center',padding:'10px 0'}}>Start Free Trial →</a></div><div className="ld-price"><div className="ld-price-name">MSSP</div><div className="ld-price-val">£599<span>/month</span></div><div className="ld-price-per">5 clients included · +£49/client</div><div className="ld-price-feats">Everything in Business · Portfolio · Correlation · Auto reports · White-label</div><a href="/signup?plan=mssp" className="ld-btn-ghost" style={{width:'100%',textAlign:'center',padding:'10px 0'}}>Start Free Trial →</a></div></div><div className="ld-price-link"><a href="/pricing">View full pricing with add-ons →</a></div></section>

    <section className="ld-cta-final"><h2>Ready to transform your SOC?</h2><p>14-day free trial. No credit card. Cancel anytime.</p><a href="/signup" className="ld-btn" style={{fontSize:'1rem',padding:'14px 36px'}}>Start Free Trial →</a></section>

    <footer className="ld-ft"><div className="ld-ft-inner"><a href="/" className="ld-logo" style={{fontSize:'.9rem'}}><div className="ld-logo-icon" style={{width:22,height:22,fontSize:'.55rem'}}>W</div>Watchtower</a><div className="ld-ft-links"><a href="/demo">Demo</a><a href="/pricing">Pricing</a><a href="/login">Sign In</a><a href="mailto:hello@getwatchtower.io">Contact</a></div></div><div className="ld-ft-copy">© 2026 Watchtower. All rights reserved.</div></footer>
  </div></>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#050508;color:#e8ecf4;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
.ld{overflow-x:hidden}
.ld-nav{display:flex;align-items:center;padding:14px 28px;position:sticky;top:0;z-index:50;background:rgba(5,5,8,.8);backdrop-filter:blur(16px);border-bottom:1px solid #ffffff06}
.ld-logo{display:flex;align-items:center;gap:7px;font-weight:800;font-size:.98rem;text-decoration:none;color:#e8ecf4}
.ld-logo-icon{width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#4f8fff,#8b6fff);display:flex;align-items:center;justify-content:center;font-size:.62rem;color:#fff;font-weight:900}
.ld-nav-links{display:flex;align-items:center;gap:2px;margin-left:auto}
.ld-nav-links a{color:#6b7a94;text-decoration:none;font-size:.8rem;font-weight:500;padding:7px 14px;border-radius:8px;transition:color .2s}
.ld-nav-links a:hover{color:#e8ecf4}
.ld-nav-cta{background:#4f8fff!important;color:#fff!important;font-weight:600!important;border-radius:8px!important}
.ld-hero{text-align:center;padding:100px 24px 80px;position:relative;max-width:720px;margin:0 auto}
.ld-glow{position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:500px;height:500px;background:radial-gradient(circle,rgba(79,143,255,.06) 0%,transparent 60%);pointer-events:none}
.ld-badge{display:inline-block;padding:4px 14px;border:1px solid #4f8fff20;border-radius:20px;font-size:.7rem;font-weight:600;color:#4f8fff;margin-bottom:24px;letter-spacing:.3px}
.ld-hero h1{font-size:3.8rem;font-weight:900;letter-spacing:-3px;line-height:1.05;margin-bottom:20px}
.ld-hero h1 span{background:linear-gradient(135deg,#4f8fff 0%,#22d49a 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.ld-sub{font-size:1.05rem;color:#6b7a94;line-height:1.75;max-width:520px;margin:0 auto 32px}
.ld-ctas{display:flex;gap:10px;justify-content:center;margin-bottom:48px}
.ld-btn{padding:11px 26px;border-radius:10px;background:#4f8fff;color:#fff;font-size:.85rem;font-weight:700;text-decoration:none;border:none;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s;display:inline-block}
.ld-btn:hover{background:#3d7de6;transform:translateY(-1px)}
.ld-btn-ghost{padding:11px 26px;border-radius:10px;background:transparent;color:#a0adc4;font-size:.85rem;font-weight:600;text-decoration:none;border:1px solid #1e2536;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s;display:inline-block}
.ld-btn-ghost:hover{border-color:#4f8fff;color:#4f8fff}
.ld-stats{display:flex;gap:32px;justify-content:center;align-items:center}
.ld-stats>div{display:flex;flex-direction:column;align-items:center;gap:2px}
.ld-stats strong{font-size:1.8rem;font-weight:800;font-family:'JetBrains Mono',monospace;letter-spacing:-1px}
.ld-stats span{font-size:.68rem;color:#4a5568;font-weight:500}
.ld-sep{width:1px;height:36px;background:#1a1e2a}
.ld-section-label{font-size:.62rem;font-weight:700;color:#4f8fff;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px}
.ld-h2c{font-size:2rem;font-weight:800;letter-spacing:-1.5px;text-align:center;margin-bottom:40px}
.ld-ai{padding:80px 28px;max-width:1100px;margin:0 auto}
.ld-ai-grid{display:grid;grid-template-columns:1fr 380px;gap:48px;align-items:center}
.ld-ai-text h2{font-size:2.2rem;font-weight:800;letter-spacing:-1.5px;line-height:1.15;margin-bottom:16px}
.ld-ai-text p{font-size:.92rem;color:#6b7a94;line-height:1.8;margin-bottom:28px}
.ld-ai-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.ld-ai-metric{padding:14px 12px;background:#0a0d14;border:1px solid #141820;border-radius:12px;text-align:center}
.ld-ai-metric-val{font-size:1.4rem;font-weight:800;font-family:'JetBrains Mono',monospace;color:#4f8fff;letter-spacing:-1px;margin-bottom:2px}
.ld-ai-metric div:last-child{font-size:.62rem;color:#4a5568;line-height:1.4}
.ld-ai-card{background:#0a0d14;border:1px solid #141820;border-radius:16px;padding:20px;position:relative;overflow:hidden}
.ld-ai-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#4f8fff,#8b6fff)}
.ld-ai-card-hd{display:flex;align-items:center;gap:8px;font-size:.72rem;font-weight:700;color:#6b7a94;margin-bottom:12px}
.ld-ai-dot{width:7px;height:7px;border-radius:50%;background:#4f8fff;box-shadow:0 0 8px #4f8fff}
.ld-ai-card-alert{font-size:.88rem;font-weight:700;margin-bottom:10px}
.ld-ai-verdict{font-size:.82rem;font-weight:800;color:#f0405e;padding:6px 12px;background:#f0405e0a;border:1px solid #f0405e15;border-radius:8px;margin-bottom:14px;display:inline-block}
.ld-ai-label{font-size:.55rem;font-weight:700;color:#4a5568;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;margin-top:10px}
.ld-ai-evidence>div{font-size:.76rem;color:#a0adc4;padding:3px 0;padding-left:14px;position:relative}
.ld-ai-evidence>div::before{content:'';position:absolute;left:0;top:10px;width:5px;height:5px;border-radius:50%;background:#4f8fff}
.ld-ai-actions>div{font-size:.76rem;color:#22d49a;padding:3px 0}
.ld-tools{padding:60px 28px 40px;text-align:center}
.ld-tool-row{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:700px;margin:0 auto}
.ld-tool{font-size:.72rem;font-weight:600;color:#4a5568;padding:6px 14px;border:1px solid #141820;border-radius:8px;background:#0a0d14;transition:all .2s}
.ld-tool:hover{border-color:#4f8fff30;color:#a0adc4}
.ld-features{padding:60px 28px;max-width:900px;margin:0 auto}
.ld-feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.ld-feat{padding:20px;background:#0a0d14;border:1px solid #141820;border-radius:14px;transition:border-color .2s}
.ld-feat:hover{border-color:#4f8fff15}
.ld-feat-icon{font-size:1.4rem;margin-bottom:8px}
.ld-feat h3{font-size:.88rem;font-weight:700;margin-bottom:5px}
.ld-feat p{font-size:.76rem;color:#6b7a94;line-height:1.6}
.ld-mssp{padding:60px 28px;max-width:700px;margin:0 auto}
.ld-mssp-inner{padding:36px;background:linear-gradient(145deg,#0a0d14,#0d1018);border:1px solid #8b6fff15;border-radius:18px;position:relative;overflow:hidden}
.ld-mssp-inner::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#8b6fff,#4f8fff)}
.ld-mssp h2{font-size:1.6rem;font-weight:800;letter-spacing:-1px;margin-bottom:8px}
.ld-mssp p{font-size:.88rem;color:#6b7a94;line-height:1.7;margin-bottom:16px}
.ld-mssp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.ld-mssp-item{display:flex;align-items:center;gap:8px;font-size:.78rem;color:#a0adc4;padding:8px 12px;background:#050508;border-radius:8px;border:1px solid #141820}
.ld-mssp-item strong{font-size:1rem}
.ld-social{padding:60px 28px;max-width:900px;margin:0 auto}
.ld-test-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.ld-test{padding:20px;background:#0a0d14;border:1px solid #141820;border-radius:14px}
.ld-test p{font-size:.82rem;color:#a0adc4;line-height:1.7;margin-bottom:14px;font-style:italic}
.ld-test-footer{display:flex;align-items:center;gap:8px}
.ld-test-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#4f8fff,#8b6fff);display:flex;align-items:center;justify-content:center;font-size:.6rem;color:#fff;font-weight:800;flex-shrink:0}
.ld-test-footer strong{font-size:.76rem;color:#e8ecf4}
.ld-test-footer span{font-size:.64rem;color:#4a5568}
.ld-pricing{padding:60px 28px;max-width:980px;margin:0 auto}
.ld-price-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.ld-price{padding:20px;background:#0a0d14;border:1px solid #141820;border-radius:14px;display:flex;flex-direction:column}
.ld-price.pop{border-color:#4f8fff30;position:relative}
.ld-price-pop{position:absolute;top:0;left:0;right:0;text-align:center;font-size:.55rem;font-weight:700;color:#fff;background:#4f8fff;padding:3px 0;border-radius:14px 14px 0 0}
.ld-price-name{font-size:.88rem;font-weight:700;margin-bottom:4px}
.ld-price.pop .ld-price-name{margin-top:14px}
.ld-price-val{font-size:2rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-2px;margin-bottom:2px}
.ld-price-val span{font-size:.7rem;font-weight:500;color:#4a5568;letter-spacing:0}
.ld-price-per{font-size:.66rem;color:#4a5568;margin-bottom:12px}
.ld-price-feats{font-size:.72rem;color:#6b7a94;line-height:1.8;margin-bottom:16px;flex:1}
.ld-price-link{text-align:center;margin-top:20px}
.ld-price-link a{color:#4f8fff;font-size:.82rem;font-weight:600;text-decoration:none}
.ld-cta-final{text-align:center;padding:80px 24px;max-width:600px;margin:0 auto}
.ld-cta-final h2{font-size:2.2rem;font-weight:800;letter-spacing:-1.5px;margin-bottom:10px}
.ld-cta-final p{color:#6b7a94;font-size:.95rem;margin-bottom:24px}
.ld-ft{border-top:1px solid #141820;padding:20px 28px}
.ld-ft-inner{display:flex;align-items:center;justify-content:space-between;max-width:1100px;margin:0 auto}
.ld-ft-links{display:flex;gap:16px}
.ld-ft-links a{color:#4a5568;text-decoration:none;font-size:.76rem;transition:color .2s}
.ld-ft-links a:hover{color:#a0adc4}
.ld-ft-copy{text-align:center;font-size:.64rem;color:#2a3040;padding:10px 0}
@media(max-width:900px){.ld-hero h1{font-size:2.4rem}.ld-ai-grid{grid-template-columns:1fr}.ld-feat-grid,.ld-test-grid{grid-template-columns:1fr}.ld-price-row{grid-template-columns:repeat(2,1fr)}.ld-mssp-grid{grid-template-columns:1fr}.ld-stats{gap:16px}.ld-stats strong{font-size:1.3rem}}
@media(max-width:600px){.ld-price-row{grid-template-columns:1fr}.ld-nav-links a:not(.ld-nav-cta){display:none}}`;
