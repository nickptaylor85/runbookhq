'use client';
import { useState } from 'react';

export default function Landing() {
  const [email, setEmail] = useState('');

  return (<>
    <style dangerouslySetInnerHTML={{__html: LCSS}} />
    <div className="ld">
      <nav className="ld-nav">
        <div className="ld-logo"><div className="ld-logo-icon">W</div>Watchtower</div>
        <div className="ld-nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="/login" className="ld-btn-ghost">Sign In</a>
          <a href="/signup" className="ld-btn-primary">Start Free Trial</a>
        </div>
      </nav>

      <section className="ld-hero">
        <div className="ld-hero-badge">AI-Powered SOC Operations</div>
        <h1 className="ld-h1">Your entire SOC.<br/><span className="ld-gradient">One pane of glass.</span></h1>
        <p className="ld-sub">Watchtower unifies Tenable, Taegis, Defender, and 15+ security tools into a single dashboard with AI-powered triage, automated runbooks, and real-time threat intelligence.</p>
        <div className="ld-cta">
          <a href="/signup" className="ld-btn-primary ld-btn-lg">Start Free Trial →</a><a href="/demo" className="ld-btn-ghost ld-btn-lg">Try Live Demo →</a>
          <a href="/login" className="ld-btn-ghost ld-btn-lg">Sign In</a>
        </div>
        <div className="ld-social-proof">
          <div className="ld-sp-item"><span className="ld-sp-num">5,000+</span>assets monitored</div>
          <div className="ld-sp-sep" />
          <div className="ld-sp-item"><span className="ld-sp-num">500K+</span>alerts triaged</div>
          <div className="ld-sp-sep" />
          <div className="ld-sp-item"><span className="ld-sp-num">15+</span>tool integrations</div>
        </div>
      </section>

      <section className="ld-features" id="features">
        <h2 className="ld-h2">Everything your SOC needs</h2>
        <div className="ld-grid">
          <div className="ld-card"><div className="ld-card-icon">🤖</div><h3>AI Triage</h3><p>Claude-powered alert analysis with confidence scoring. Reduce false positives by 80%. Every alert gets a verdict, reasoning, and recommended action.</p></div>
          <div className="ld-card"><div className="ld-card-icon">📋</div><h3>Auto Runbooks</h3><p>Click any alert to get a step-by-step response checklist tailored to the attack type. Phishing, lateral movement, malware — each gets a specific playbook.</p></div>
          <div className="ld-card"><div className="ld-card-icon">🛡</div><h3>Unified Alerts</h3><p>Tenable, Taegis, Defender, CrowdStrike, Zscaler — all your tools feeding one alert stream. No more tab switching.</p></div>
          <div className="ld-card"><div className="ld-card-icon">🔓</div><h3>Vuln Management</h3><p>Real Tenable data with VPR × host prioritisation. Click any CVE to see affected hosts, remediation steps, and compliance impact.</p></div>
          <div className="ld-card"><div className="ld-card-icon">📺</div><h3>TV Wall Mode</h3><p>Fullscreen auto-rotating display for your SOC monitors. Security posture, live alerts, severity distribution — all at a glance.</p></div>
          <div className="ld-card"><div className="ld-card-icon">🔮</div><h3>Threat Intel</h3><p>Industry-specific threat intelligence powered by AI web search. Real-time IOCs, MITRE mappings, and source links.</p></div>
        </div>
      </section>

      <section className="ld-roi" id="roi"><div className="ld-container"><h2 className="ld-h2">💰 ROI Calculator</h2><p className="ld-roi-sub">See how much Watchtower saves your SOC team</p><div className="ld-roi-calc"><div className="ld-roi-inputs"><div className="ld-roi-field"><label>SOC Analysts</label><input id="roi-analysts" type="range" min="1" max="20" defaultValue="3" onChange={() => { const a = parseInt((document.getElementById('roi-analysts') as any).value); const s = parseInt((document.getElementById('roi-salary') as any).value); const h = parseFloat((document.getElementById('roi-hours') as any).value); const saved = a * h * 260; const cost = Math.round(saved * (s / 2080)); const plan = 49 * 12; (document.getElementById('roi-out-hours') as any).innerText = Math.round(saved) + ' hours/year'; (document.getElementById('roi-out-cost') as any).innerText = '£' + cost.toLocaleString() + '/year'; (document.getElementById('roi-out-roi') as any).innerText = Math.round(cost / plan) + 'x'; (document.getElementById('roi-analysts-val') as any).innerText = a; }} /><span id="roi-analysts-val" style={{fontFamily:'JetBrains Mono,monospace',color:'#5b9aff',fontWeight:700}}>3</span></div><div className="ld-roi-field"><label>Avg Analyst Salary (£/year)</label><input id="roi-salary" type="range" min="25000" max="80000" step="5000" defaultValue="45000" onChange={() => { (document.getElementById('roi-analysts') as any).dispatchEvent(new Event('change')); (document.getElementById('roi-salary-val') as any).innerText = '£' + parseInt((document.getElementById('roi-salary') as any).value).toLocaleString(); }} /><span id="roi-salary-val" style={{fontFamily:'JetBrains Mono,monospace',color:'#5b9aff',fontWeight:700}}>£45,000</span></div><div className="ld-roi-field"><label>Hours saved per analyst per day</label><input id="roi-hours" type="range" min="0.5" max="4" step="0.5" defaultValue="1.5" onChange={() => { (document.getElementById('roi-analysts') as any).dispatchEvent(new Event('change')); (document.getElementById('roi-hours-val') as any).innerText = parseFloat((document.getElementById('roi-hours') as any).value) + 'h'; }} /><span id="roi-hours-val" style={{fontFamily:'JetBrains Mono,monospace',color:'#5b9aff',fontWeight:700}}>1.5h</span></div></div><div className="ld-roi-results"><div className="ld-roi-result"><div className="ld-roi-result-val" id="roi-out-hours">1,170 hours/year</div><div className="ld-roi-result-label">Time Saved</div></div><div className="ld-roi-result"><div className="ld-roi-result-val" id="roi-out-cost" style={{color:'#34e8a5'}}>£25,324/year</div><div className="ld-roi-result-label">Cost Saved</div></div><div className="ld-roi-result"><div className="ld-roi-result-val" id="roi-out-roi" style={{color:'#8b6fff'}}>43x</div><div className="ld-roi-result-label">ROI vs Pro Plan</div></div></div></div></div></section><section className="ld-pricing" id="pricing">
        <div className="ld-container">
          <h2 className="ld-h2">Pricing</h2>
          <p style={{color:'#8896b8',textAlign:'center',marginTop:'-16px',marginBottom:'24px',fontSize:'.88rem'}}>Start free. Scale as your SOC grows. Pay only for what you need.</p>
          <div className="ld-price-grid">
            <div className="ld-price-card">
              <div className="ld-price-name">Community</div>
              <div className="ld-price-amount"><span className="ld-price-currency">£</span>0<span className="ld-price-period">/forever</span></div>
              <ul className="ld-price-features"><li>2 tool integrations</li><li>Dashboard + alerts</li><li>Coverage view</li><li>Manual refresh</li><li>1 seat</li></ul>
              <a href="/signup?plan=starter" className="ld-btn-ghost" style={{width:'100%',textAlign:'center'}}>Get Started Free</a>
            </div>
            <div className="ld-price-card featured">
              <div className="ld-price-badge">Most Popular</div>
              <div className="ld-price-name">Team</div>
              <div className="ld-price-amount"><span className="ld-price-currency">£</span>29<span className="ld-price-period">/seat/month</span></div>
              <ul className="ld-price-features"><li>Unlimited integrations</li><li>AI Co-Pilot + auto-triage</li><li>Custom runbooks</li><li>Incident timeline + SLA</li><li>Threat intelligence</li><li>TV Wall + shift handover</li><li>3 seats included</li></ul>
              <a href="/pricing" className="ld-btn-primary" style={{width:'100%',textAlign:'center'}}>See Plans & Add-ons →</a>
            </div>
            <div className="ld-price-card">
              <div className="ld-price-name">Business</div>
              <div className="ld-price-amount"><span className="ld-price-currency">£</span>79<span className="ld-price-period">/month</span></div>
              <ul className="ld-price-features"><li>Everything in Team</li><li>MSSP portfolio view</li><li>Compliance mapping</li><li>PDF reports</li><li>API + webhooks</li><li>RBAC + audit logs</li><li>10 seats included</li></ul>
              <a href="/pricing" className="ld-btn-ghost" style={{width:'100%',textAlign:'center'}}>See Plans & Add-ons →</a>
            </div>
            <div className="ld-price-card">
              <div className="ld-price-name">Enterprise</div>
              <div className="ld-price-amount"><span className="ld-price-currency" style={{fontSize:'.85rem',color:'#8896b8'}}>Custom</span></div>
              <ul className="ld-price-features"><li>Everything in Business</li><li>SSO / SAML</li><li>Custom branding</li><li>Dedicated instance</li><li>Unlimited seats</li><li>Dedicated account manager</li></ul>
              <a href="/pricing" className="ld-btn-ghost" style={{width:'100%',textAlign:'center'}}>Contact Sales</a>
            </div>
          </div>
          <div style={{textAlign:'center',marginTop:'16px'}}><a href="/pricing" style={{color:'#5b9aff',textDecoration:'none',fontWeight:700,fontSize:'.85rem'}}>View full pricing with add-ons →</a></div>
        </div>
      </section>

      <section className="ld-trust"><div style={{display:'flex',gap:32,justifyContent:'center',alignItems:'center',flexWrap:'wrap',opacity:.4}}><span style={{fontSize:'.82rem',fontWeight:700,letterSpacing:'1px'}}>TENABLE</span><span style={{fontSize:'.82rem',fontWeight:700,letterSpacing:'1px'}}>SECUREWORKS</span><span style={{fontSize:'.82rem',fontWeight:700,letterSpacing:'1px'}}>MICROSOFT</span><span style={{fontSize:'.82rem',fontWeight:700,letterSpacing:'1px'}}>CROWDSTRIKE</span><span style={{fontSize:'.82rem',fontWeight:700,letterSpacing:'1px'}}>ZSCALER</span></div></section><section className="ld-cta-section">
        <h2 className="ld-h2" style={{color:'#fff'}}>Ready to unify your SOC?</h2>
        <p className="ld-sub" style={{color:'rgba(255,255,255,.7)',maxWidth:460,margin:'0 auto 30px'}}>Connect your first tool in under 2 minutes. No credit card required.</p>
        <a href="/signup" className="ld-btn-primary ld-btn-lg">Start Free Trial →</a><a href="/demo" className="ld-btn-ghost ld-btn-lg">Try Live Demo →</a>
      </section>

      <footer className="ld-footer">
        <div className="ld-logo" style={{marginBottom:16}}><div className="ld-logo-icon" style={{width:22,height:22,fontSize:'.55rem'}}>W</div>Watchtower</div>
        <p style={{fontSize:'.72rem',color:'#8896b8'}}>Single pane of glass for security operations.</p>
        <p style={{fontSize:'.62rem',color:'#4a5672',marginTop:8}}>© 2026 Watchtower. All rights reserved.</p>
      </footer>
    </div>
  </>);
}

const LCSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{background:#05070c;color:#eaf0ff;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
.ld{min-height:100vh}

.ld-nav{display:flex;align-items:center;justify-content:space-between;padding:16px 40px;position:sticky;top:0;z-index:100;background:rgba(5,7,12,.85);backdrop-filter:blur(20px);border-bottom:1px solid #141928}
.ld-nav-links{display:flex;align-items:center;gap:24px}
.ld-nav-links a{color:#8896b8;font-size:.82rem;text-decoration:none;font-weight:500;transition:color .2s}
.ld-nav-links a:hover{color:#eaf0ff}
.ld-logo{display:flex;align-items:center;gap:8px;font-weight:900;font-size:1.05rem;letter-spacing:-.5px}
.ld-logo-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#5b9aff,#8b6fff);display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#fff;font-weight:900}

.ld-hero{text-align:center;padding:100px 24px 80px;position:relative;overflow:hidden}
.ld-hero::before{content:'';position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:900px;height:900px;background:radial-gradient(circle at 30% 40%,rgba(91,154,255,.1) 0%,transparent 50%),radial-gradient(circle at 70% 60%,rgba(139,111,255,.08) 0%,transparent 50%),radial-gradient(circle at 50% 50%,rgba(255,68,102,.03) 0%,transparent 40%);pointer-events:none;animation:heroGlow 8s ease-in-out infinite alternate}
@keyframes heroGlow{from{opacity:.8;transform:translateX(-50%) scale(1)}to{opacity:1;transform:translateX(-50%) scale(1.05)}}
.ld-hero-badge{display:inline-block;padding:6px 16px;border-radius:20px;background:rgba(91,154,255,.1);border:1px solid rgba(91,154,255,.15);color:#5b9aff;font-size:.72rem;font-weight:600;letter-spacing:.3px;margin-bottom:24px}
.ld-h1{font-size:3.5rem;font-weight:900;letter-spacing:-2.5px;line-height:1.1;margin-bottom:20px}
@media(max-width:768px){
.ld-h1{font-size:2rem;letter-spacing:-1.5px}
.ld-sub{font-size:.88rem}
.ld-nav{padding:10px 14px}
.ld-nav-links{gap:8px}
.ld-nav-links a{font-size:.72rem}
.ld-btn-primary,.ld-btn-ghost{padding:8px 14px;font-size:.76rem}
.ld-btn-lg{padding:12px 20px;font-size:.82rem}
.ld-hero{padding:48px 16px 36px}
.ld-hero-badge{font-size:.65rem;padding:5px 12px}
.ld-grid{grid-template-columns:1fr!important;gap:10px}
.ld-card{padding:20px}
.ld-card-icon{font-size:1.4rem;margin-bottom:8px}
.ld-card h3{font-size:.9rem}
.ld-price-grid{grid-template-columns:1fr!important;gap:12px}
.ld-price-card{padding:24px 20px}
.ld-price-amount{font-size:2.2rem}
.ld-features{padding:40px 16px}
.ld-pricing{padding:40px 16px}
.ld-cta{flex-direction:column;align-items:center;gap:8px}
.ld-social-proof{flex-direction:column;gap:12px}
.ld-sp-sep{width:40px;height:1px}
.ld-sp-item{padding:0}
.ld-cta-section{padding:48px 16px}
.ld-roi{padding:60px 24px;text-align:center}
.ld-roi-sub{font-size:.88rem;color:#8896b8;margin-bottom:32px;margin-top:-16px}
.ld-roi-calc{max-width:700px;margin:0 auto;background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #141928;border-radius:20px;padding:32px}
.ld-roi-inputs{display:flex;flex-direction:column;gap:20px;margin-bottom:28px}
.ld-roi-field{display:flex;align-items:center;gap:12px}
.ld-roi-field label{font-size:.78rem;font-weight:600;color:#8896b8;min-width:200px;text-align:right}
.ld-roi-field input[type=range]{flex:1;accent-color:#5b9aff;height:6px}
.ld-roi-results{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.ld-roi-result{background:#141928;border-radius:12px;padding:18px;text-align:center}
.ld-roi-result-val{font-size:1.5rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-1px;color:#eaf0ff}
.ld-roi-result-label{font-size:.6rem;font-weight:700;color:#4a5672;text-transform:uppercase;letter-spacing:.5px;margin-top:4px}
@media(max-width:768px){.ld-roi-field{flex-direction:column;align-items:stretch}.ld-roi-field label{text-align:left;min-width:auto}.ld-roi-results{grid-template-columns:1fr}}
.ld-trust{padding:24px 16px}
.ld-h2{font-size:1.5rem;margin-bottom:32px}
}
@media(max-width:480px){
.ld-nav-links a:not(.ld-btn-primary):not(.ld-btn-ghost){display:none}
.ld-h1{font-size:1.7rem}
.ld-hero{padding:36px 12px 28px}
}
.ld-gradient{background:linear-gradient(135deg,#5b9aff,#8b6fff,#ff4466);-webkit-background-clip:text;background-clip:text;color:transparent}
.ld-sub{font-size:1.05rem;color:#8896b8;max-width:580px;margin:0 auto 32px;line-height:1.6}
.ld-cta{display:flex;gap:12px;justify-content:center;margin-bottom:48px}
.ld-social-proof{display:flex;gap:0;justify-content:center;align-items:center}
.ld-sp-item{text-align:center;padding:0 24px}
.ld-sp-num{display:block;font-size:1.3rem;font-weight:900;font-family:'JetBrains Mono',monospace;color:#eaf0ff;letter-spacing:-1px}
.ld-sp-item{font-size:.68rem;color:#4a5672}
.ld-sp-sep{width:1px;height:32px;background:#1e2840}

.ld-btn-primary{display:inline-flex;align-items:center;padding:10px 20px;border-radius:10px;background:linear-gradient(135deg,#5b9aff,#8b6fff);color:#fff;font-size:.82rem;font-weight:700;text-decoration:none;border:none;cursor:pointer;transition:all .25s;box-shadow:0 4px 16px rgba(91,154,255,.25)}
.ld-btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(91,154,255,.35)}
.ld-btn-ghost{display:inline-flex;align-items:center;padding:10px 20px;border-radius:10px;background:transparent;color:#8896b8;font-size:.82rem;font-weight:600;text-decoration:none;border:1px solid #1e2840;cursor:pointer;transition:all .2s}
.ld-btn-ghost:hover{border-color:#5b9aff;color:#5b9aff}
.ld-btn-lg{padding:14px 28px;font-size:.92rem}

.ld-features{padding:80px 40px;max-width:1100px;margin:0 auto}
.ld-h2{font-size:2rem;font-weight:900;letter-spacing:-1.5px;text-align:center;margin-bottom:48px}
.ld-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.ld-card{background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #141928;border-radius:16px;padding:28px;transition:all .3s}
.ld-card:hover{border-color:#5b9aff30;transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.3),0 0 0 1px #5b9aff15}
.ld-card-icon{font-size:1.8rem;margin-bottom:12px}
.ld-card h3{font-size:1rem;font-weight:800;margin-bottom:8px;letter-spacing:-.3px}
.ld-card p{font-size:.78rem;color:#8896b8;line-height:1.6}

.ld-pricing{padding:80px 40px;max-width:1000px;margin:0 auto}
.ld-price-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:start}
.ld-price-card{background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #141928;border-radius:16px;padding:32px 24px;position:relative;transition:all .3s}
.ld-price-card.featured{border-color:#5b9aff;box-shadow:0 0 60px rgba(91,154,255,.12),0 0 0 1px #5b9aff30}
.ld-price-card:hover{transform:translateY(-3px)}
.ld-price-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#5b9aff,#8b6fff);color:#fff;padding:4px 16px;border-radius:20px;font-size:.62rem;font-weight:700;letter-spacing:.5px;white-space:nowrap}
.ld-price-name{font-size:.82rem;font-weight:700;color:#8896b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.ld-price-amount{font-size:2.8rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-3px;margin-bottom:20px}
.ld-price-currency{font-size:1.2rem;color:#8896b8;vertical-align:super}
.ld-price-period{font-size:.72rem;color:#4a5672;font-weight:500;letter-spacing:0}
.ld-price-features{list-style:none;margin-bottom:24px}
.ld-price-features li{padding:6px 0;font-size:.78rem;color:#8896b8;border-bottom:1px solid #141928}
.ld-price-features li::before{content:'✓ ';color:#34e8a5;font-weight:700}

.ld-roi{padding:60px 24px;text-align:center}
.ld-roi-sub{font-size:.88rem;color:#8896b8;margin-bottom:32px;margin-top:-16px}
.ld-roi-calc{max-width:700px;margin:0 auto;background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #141928;border-radius:20px;padding:32px}
.ld-roi-inputs{display:flex;flex-direction:column;gap:20px;margin-bottom:28px}
.ld-roi-field{display:flex;align-items:center;gap:12px}
.ld-roi-field label{font-size:.78rem;font-weight:600;color:#8896b8;min-width:200px;text-align:right}
.ld-roi-field input[type=range]{flex:1;accent-color:#5b9aff;height:6px}
.ld-roi-results{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.ld-roi-result{background:#141928;border-radius:12px;padding:18px;text-align:center}
.ld-roi-result-val{font-size:1.5rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-1px;color:#eaf0ff}
.ld-roi-result-label{font-size:.6rem;font-weight:700;color:#4a5672;text-transform:uppercase;letter-spacing:.5px;margin-top:4px}
@media(max-width:768px){.ld-roi-field{flex-direction:column;align-items:stretch}.ld-roi-field label{text-align:left;min-width:auto}.ld-roi-results{grid-template-columns:1fr}}
.ld-trust{padding:40px 24px;text-align:center;border-top:1px solid #141928;border-bottom:1px solid #141928}
.ld-cta-section{text-align:center;padding:80px 24px;background:linear-gradient(180deg,transparent,rgba(91,154,255,.05),transparent)}
.ld-footer{text-align:center;padding:40px 24px;border-top:1px solid #141928}
`;
