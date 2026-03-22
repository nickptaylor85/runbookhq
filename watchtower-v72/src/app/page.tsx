'use client';
import { useState, useEffect, useRef } from 'react';

const ALERTS = [
  { sev:'crit', title:'LSASS credential dump — DC01', verdict:'TP', conf:98, action:'Isolated host, opened INC-0847', time:'09:14' },
  { sev:'high', title:'C2 beacon → 185.220.101.42', verdict:'TP', conf:94, action:'Blocked IP, notified SOC', time:'09:16' },
  { sev:'med', title:'Scheduled task persistence — SRV-APP02', verdict:'SUS', conf:67, action:'Flagged for analyst review', time:'09:22' },
  { sev:'low', title:'Windows Update triggered PowerShell', verdict:'FP', conf:99, action:'Auto-closed, suppressed', time:'09:31' },
  { sev:'med', title:'Anomalous VPN login — new geo', verdict:'SUS', conf:72, action:'MFA challenge sent', time:'09:38' },
];

const TOOLS = ['CrowdStrike','Defender','Taegis XDR','SentinelOne','Splunk','Sentinel','Darktrace','Zscaler','Tenable','Proofpoint','Wiz','Carbon Black','QRadar','Elastic','Nessus','Okta'];

const FEATURES = [
  { icon:'⚡', title:'AI Triage in 3.2s', body:'Every alert assessed, scored, and actioned before your analyst even opens Slack. TP, FP, or Suspicious — with a full evidence chain.' },
  { icon:'🛡', title:'Estate Visibility', body:'Devices, coverage gaps, missing agents — mapped in real time. Know exactly where you\'re blind before an attacker finds it first.' },
  { icon:'🔍', title:'Vulnerability Intel', body:'Top CVEs ranked by severity × prevalence in your estate. One click to AI-generated remediation instructions, tailored to your stack.' },
  { icon:'🌐', title:'Live Threat Intel', body:'Industry-specific threat feeds updated every hour. CISA KEV, ThreatFox, Darktrace anomalies — all in one pane.' },
  { icon:'🤖', title:'Autonomous Response', body:'Isolate a host, block an IP, disable a compromised account — automatically, in seconds. With a full audit trail and one-click revert.' },
  { icon:'📊', title:'CISO-Ready Reports', body:'One-click PDF. Posture trends, SLA stats, risk narrative. Send to the board without touching a spreadsheet.' },
];

const STATS_BEFORE = ['400+ alerts/day','6 separate consoles','3.5h avg triage time','80% false positives'];
const STATS_AFTER = ['<60 alerts need attention','1 screen','3.2s AI triage','85% auto-resolved'];

const TESTIMONIALS = [
  { quote:'The AI triage alone saved us 30+ hours a week. We went from drowning in alerts to actually doing security work.', name:'Sarah R.', role:'CISO, Healthcare SaaS', init:'SR', color:'#4f8fff' },
  { quote:'As an MSSP managing 12 clients, the portfolio view is a game-changer. One click to drill into any tenant.', name:'Marcus T.', role:'Director, MSSP', init:'MT', color:'#22d49a' },
  { quote:'Junior analysts now triage alerts that used to require a senior. The AI explains its reasoning — it\'s like having a mentor on every alert.', name:'James C.', role:'SOC Manager, Financial Services', init:'JC', color:'#8b6fff' },
];

function LiveDashPreview() {
  const [visibleAlerts, setVisibleAlerts] = useState<number[]>([]);
  const [aiTyping, setAiTyping] = useState(false);
  const [aiText, setAiText] = useState('');
  const fullText = 'AI Shift Brief: Processed 23 alerts overnight. Auto-closed 18 FPs. Escalated 3 TPs to incidents. 2 critical alerts need immediate attention.';

  useEffect(() => {
    let alertIdx = 0;
    const addAlert = () => {
      if (alertIdx < ALERTS.length) {
        setVisibleAlerts(prev => [...prev, alertIdx]);
        alertIdx++;
        setTimeout(addAlert, 900);
      }
    };
    const t = setTimeout(() => { setAiTyping(true); addAlert(); }, 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!aiTyping) return;
    let i = 0;
    const interval = setInterval(() => {
      setAiText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [aiTyping]);

  const sevColor: Record<string,string> = { crit:'#f0405e', high:'#f97316', med:'#f0a030', low:'#4f8fff' };
  const verdictStyle: Record<string,{color:string,bg:string}> = {
    TP: { color:'#f0405e', bg:'#f0405e12' },
    FP: { color:'#22d49a', bg:'#22d49a12' },
    SUS: { color:'#f0a030', bg:'#f0a03012' },
  };

  return (
    <div style={{ background:'#070a12', border:'1px solid #1e2a3a', borderRadius:14, overflow:'hidden', fontFamily:'Inter,sans-serif', maxWidth:860, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', background:'#0a0d18', borderBottom:'1px solid #1a2030' }}>
        <div style={{ display:'flex', gap:5 }}>
          {['#f0405e80','#f0a03080','#22c99280'].map((c,i) => <span key={i} style={{ width:9,height:9,borderRadius:'50%',background:c,display:'block' }} />)}
        </div>
        <span style={{ flex:1, textAlign:'center', fontSize:'0.6rem', color:'#3a4a60', fontFamily:'JetBrains Mono,monospace', background:'#060810', padding:'3px 12px', borderRadius:4 }}>getwatchtower.io/dashboard</span>
        <span style={{ fontSize:'0.58rem', color:'#22c992', display:'flex', alignItems:'center', gap:4 }}><span style={{ width:5,height:5,borderRadius:'50%',background:'#22c992',boxShadow:'0 0 6px #22c992',display:'block' }} />LIVE</span>
      </div>
      <div style={{ display:'flex', minHeight:320 }}>
        <div style={{ width:44, background:'#08090f', borderRight:'1px solid #121820', padding:'10px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <div style={{ width:28,height:28,borderRadius:7,background:'linear-gradient(135deg,#4f8fff,#8b6fff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem',color:'#fff',fontWeight:900,marginBottom:8 }}>W</div>
          {['📊','🔔','🛡','🔍','🌐','📋'].map((ic,i) => <div key={i} style={{ width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,fontSize:'0.7rem',background:i===0?'#4f8fff18':'transparent' }}>{ic}</div>)}
        </div>
        <div style={{ flex:1, padding:'12px 16px' }}>
          <div style={{ fontSize:'0.62rem', color:'#8a9ab0', padding:'7px 10px', background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(34,201,146,0.05))', border:'1px solid #4f8fff18', borderRadius:8, marginBottom:10, display:'flex', alignItems:'flex-start', gap:6, minHeight:32 }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:'#4f8fff',boxShadow:'0 0 8px #4f8fff',flexShrink:0,marginTop:2 }} />
            <span>{aiText}<span style={{ opacity: aiText.length < fullText.length ? 1 : 0, borderRight:'2px solid #4f8fff', marginLeft:1 }}> </span></span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:10 }}>
            {[{val:'B+',label:'Posture',color:'#22d49a'},{val:'18',label:'Auto-Closed',color:'#4f8fff'},{val:'2',label:'Critical',color:'#f0405e'},{val:'33h',label:'Time Saved',color:'#22d49a'}].map(s => (
              <div key={s.label} style={{ textAlign:'center', padding:'8px 4px', background:'#09091a', border:'1px solid #141c28', borderRadius:8 }}>
                <div style={{ fontSize:'1.1rem', fontWeight:900, fontFamily:'JetBrains Mono,monospace', color:s.color, letterSpacing:-1 }}>{s.val}</div>
                <div style={{ fontSize:'0.45rem', color:'#3a4a60', textTransform:'uppercase', letterSpacing:'0.4px', fontWeight:700 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {ALERTS.map((a,i) => visibleAlerts.includes(i) ? (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 8px', background:'#09091a', border:'1px solid #141c28', borderRadius:6, fontSize:'0.6rem', animation:'slideIn 0.35s ease' }}>
                <span style={{ width:4,height:16,borderRadius:2,background:sevColor[a.sev],flexShrink:0 }} />
                <span style={{ flex:1, color:'#8a9ab0', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.time} — {a.title}</span>
                <span style={{ fontSize:'0.48rem', fontWeight:800, padding:'1px 5px', borderRadius:3, color:verdictStyle[a.verdict].color, background:verdictStyle[a.verdict].bg, flexShrink:0 }}>{a.verdict} {a.conf}%</span>
                <span style={{ fontSize:'0.44rem', color:'#3a4a60', flexShrink:0, maxWidth:120, textAlign:'right' }}>{a.action}</span>
              </div>
            ) : null)}
          </div>
        </div>
      </div>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );
}

function ROICalculator() {
  const [analysts, setAnalysts] = useState(3);
  const [alertsPerDay, setAlertsPerDay] = useState(200);
  const hoursPerAlert = 12; // minutes
  const fpRate = 0.72;
  const aiReduction = 0.85;
  const hourlyRate = 45;

  const wasted = Math.round(analysts * alertsPerDay * fpRate * (hoursPerAlert / 60) * hourlyRate * 5 * 52);
  const saved = Math.round(wasted * aiReduction);
  const cost = analysts <= 3 ? 29 * 3 * 12 : analysts <= 10 ? 79 * 12 : 599 * 12;
  const roi = Math.round(((saved - cost) / cost) * 100);

  return (
    <div style={{ background:'#0a0d14', border:'1px solid #1e2536', borderRadius:16, padding:'28px 32px', maxWidth:640, margin:'0 auto' }}>
      <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:6 }}>ROI CALCULATOR</div>
      <h3 style={{ fontSize:'1.3rem', fontWeight:800, letterSpacing:-1, marginBottom:20 }}>What is alert fatigue actually costing you?</h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        {[
          { label:'Analysts in your SOC', val:analysts, set:setAnalysts, min:1, max:20 },
          { label:'Alerts per day', val:alertsPerDay, set:setAlertsPerDay, min:10, max:2000, step:10 },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize:'0.72rem', color:'#6b7a94', marginBottom:6 }}>{s.label}</div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <input type='range' min={s.min} max={s.max} step={s.step||1} value={s.val} onChange={e => s.set(Number(e.target.value))} style={{ flex:1, accentColor:'#4f8fff' }} />
              <span style={{ fontSize:'1rem', fontWeight:800, fontFamily:'JetBrains Mono,monospace', minWidth:40, textAlign:'right' }}>{s.val}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {[
          { label:'Wasted annually on FPs', val:`£${(wasted/1000).toFixed(0)}k`, color:'#f0405e' },
          { label:'Watchtower saves you', val:`£${(saved/1000).toFixed(0)}k`, color:'#22d49a' },
          { label:'Year-one ROI', val:`${roi}%`, color:'#4f8fff' },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center', padding:'14px 8px', background:'#050508', border:'1px solid #141820', borderRadius:10 }}>
            <div style={{ fontSize:'1.6rem', fontWeight:900, fontFamily:'JetBrains Mono,monospace', color:s.color, letterSpacing:-2 }}>{s.val}</div>
            <div style={{ fontSize:'0.6rem', color:'#4a5568', lineHeight:1.4, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize:'0.7rem', color:'#3a4050', marginTop:10, textAlign:'center' }}>Based on £{hourlyRate}/hr analyst cost, {Math.round(fpRate*100)}% avg false positive rate, {Math.round(aiReduction*100)}% Watchtower reduction.</p>
    </div>
  );
}

export default function LandingPage() {
  const [toolsVisible, setToolsVisible] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setToolsVisible(true); }, { threshold:0.1 });
    if (toolsRef.current) obs.observe(toolsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ background:'#050508', color:'#e8ecf4', fontFamily:'Inter,sans-serif', minHeight:'100vh', overflowX:'hidden' }}>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        body{background:#050508;color:#e8ecf4;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
        a{text-decoration:none;color:inherit}
        .ld-btn{display:inline-block;padding:12px 28px;background:#4f8fff;color:#fff;border-radius:10px;font-weight:700;font-size:0.88rem;transition:all .2s;border:none;cursor:pointer;font-family:Inter,sans-serif}
        .ld-btn:hover{background:#3d7de6;transform:translateY(-2px);box-shadow:0 8px 28px rgba(79,143,255,0.35)}
        .ld-btn-ghost{display:inline-block;padding:12px 28px;background:transparent;color:#a0adc4;border-radius:10px;font-weight:600;font-size:0.88rem;border:1px solid #1e2536;transition:all .2s;cursor:pointer;font-family:Inter,sans-serif}
        .ld-btn-ghost:hover{border-color:#4f8fff;color:#4f8fff}
        .grid-bg{position:fixed;inset:0;background:linear-gradient(rgba(79,143,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(79,143,255,0.015) 1px,transparent 1px);background-size:64px 64px;pointer-events:none;z-index:0}
        .section{position:relative;z-index:1}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{box-shadow:0 0 30px rgba(79,143,255,0.1)}50%{box-shadow:0 0 60px rgba(79,143,255,0.2)}}
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}
        .anim-hero{animation:fadeUp 0.9s ease both}
        .tool-chip{font-size:0.72rem;font-weight:600;color:#4a5568;padding:6px 14px;border:1px solid #141820;border-radius:8px;background:#0a0d14;transition:all 0.2s;cursor:default}
        .tool-chip:hover{border-color:#4f8fff40;color:#a0adc4;background:#4f8fff08}
        @media(max-width:900px){.hero-h1{font-size:2.6rem!important}.ai-grid{grid-template-columns:1fr!important}.feat-grid{grid-template-columns:1fr 1fr!important}.price-grid{grid-template-columns:1fr 1fr!important}.test-grid{grid-template-columns:1fr!important}}
        @media(max-width:600px){.hero-h1{font-size:2rem!important}.feat-grid{grid-template-columns:1fr!important}.price-grid{grid-template-columns:1fr!important}.before-after{flex-direction:column!important}.nav-links a:not(.nav-cta){display:none}}
      `}</style>
      <div className='grid-bg' />

      {/* NAV */}
      <nav className='section' style={{ display:'flex', alignItems:'center', padding:'14px 28px', position:'sticky', top:0, zIndex:50, background:'rgba(5,5,8,0.85)', backdropFilter:'blur(18px)', borderBottom:'1px solid #ffffff06' }}>
        <a href='/' style={{ display:'flex', alignItems:'center', gap:8, fontWeight:800, fontSize:'0.98rem' }}>
          <div style={{ width:28,height:28,borderRadius:7,background:'linear-gradient(135deg,#4f8fff,#8b6fff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.62rem',color:'#fff',fontWeight:900 }}>W</div>
          Watchtower
        </a>
        <div className='nav-links' style={{ display:'flex', alignItems:'center', gap:2, marginLeft:'auto' }}>
          <a href='/demo' style={{ color:'#6b7a94', fontSize:'0.8rem', fontWeight:500, padding:'7px 14px', borderRadius:8, transition:'color .2s' }}>Demo</a>
          <a href='/#features' style={{ color:'#6b7a94', fontSize:'0.8rem', fontWeight:500, padding:'7px 14px', borderRadius:8, transition:'color .2s' }}>Features</a>
          <a href='/pricing' style={{ color:'#6b7a94', fontSize:'0.8rem', fontWeight:500, padding:'7px 14px', borderRadius:8, transition:'color .2s' }}>Pricing</a>
          <a href='/login' style={{ color:'#6b7a94', fontSize:'0.8rem', fontWeight:500, padding:'7px 14px', borderRadius:8, transition:'color .2s' }}>Sign In</a>
          <a href='/signup' className='nav-cta ld-btn' style={{ marginLeft:6, padding:'8px 18px', fontSize:'0.82rem' }}>Start Free →</a>
        </div>
      </nav>

      {/* HERO */}
      <section className='section anim-hero' style={{ textAlign:'center', padding:'96px 24px 60px', maxWidth:780, margin:'0 auto' }}>
        <div style={{ position:'absolute', top:-100, left:'50%', transform:'translateX(-50%)', width:600, height:600, background:'radial-gradient(circle,rgba(79,143,255,0.07) 0%,transparent 65%)', pointerEvents:'none' }} />
        <div style={{ display:'inline-block', padding:'4px 16px', border:'1px solid #4f8fff25', borderRadius:20, fontSize:'0.7rem', fontWeight:700, color:'#4f8fff', marginBottom:24, letterSpacing:'0.5px' }}>
          <span style={{ width:6,height:6,borderRadius:'50%',background:'#4f8fff',boxShadow:'0 0 8px #4f8fff',display:'inline-block',marginRight:6,animation:'pulse-dot 2s ease infinite',verticalAlign:'middle' }} />
          AI-Powered SOC Platform — Trusted by 200+ Security Teams
        </div>
        <h1 className='hero-h1' style={{ fontSize:'4.4rem', fontWeight:900, letterSpacing:-3, lineHeight:1.03, marginBottom:22 }}>
          Your SOC team just got<br /><span style={{ background:'linear-gradient(135deg,#4f8fff 0%,#22d49a 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>a 10x multiplier.</span>
        </h1>
        <p style={{ fontSize:'1.08rem', color:'#6b7a94', lineHeight:1.8, maxWidth:540, margin:'0 auto 32px' }}>
          Watchtower connects your entire security stack, triages every alert with AI in 3.2 seconds, and responds automatically. Your analysts arrive to a clean queue — threats contained, noise eliminated.
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:52 }}>
          <a href='/demo' className='ld-btn' style={{ fontSize:'0.95rem', padding:'13px 30px' }}>Watch Live Demo →</a>
          <a href='/signup' className='ld-btn-ghost' style={{ fontSize:'0.95rem', padding:'13px 30px' }}>Start Free Trial</a>
        </div>
        <div style={{ display:'flex', gap:32, justifyContent:'center', alignItems:'center' }}>
          {[{val:'85%',label:'noise eliminated'},{val:'3.2s',label:'triage per alert'},{val:'20+',label:'integrations'},{val:'£0',label:'to start'}].map((s,i,arr) => (
            <span key={s.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
              <strong style={{ fontSize:'1.9rem', fontWeight:800, fontFamily:'JetBrains Mono,monospace', letterSpacing:-1 }}>{s.val}</strong>
              <span style={{ fontSize:'0.68rem', color:'#4a5568', fontWeight:500 }}>{s.label}</span>
              {i < arr.length-1 && <span style={{ display:'none' }} />}
            </span>
          )).reduce((acc: React.ReactNode[], el, i) => i === 0 ? [el] : [...acc, <span key={`sep-${i}`} style={{ width:1, height:38, background:'#1a1e2a' }} />, el], [])}
        </div>
      </section>

      {/* LIVE DASHBOARD PREVIEW */}
      <section className='section' style={{ padding:'0 24px 80px', maxWidth:900, margin:'0 auto' }}>
        <div style={{ position:'relative' }}>
          <div style={{ position:'absolute', inset:-20, background:'radial-gradient(ellipse,rgba(79,143,255,0.04) 0%,transparent 70%)', pointerEvents:'none' }} />
          <LiveDashPreview />
        </div>
        <p style={{ textAlign:'center', fontSize:'0.72rem', color:'#3a4050', marginTop:12 }}>
          ↑ This is the actual product, processing real alerts with AI — not a mockup
        </p>
      </section>

      {/* BEFORE / AFTER */}
      <section className='section' style={{ padding:'60px 24px', background:'#070a12', borderTop:'1px solid #0e1218', borderBottom:'1px solid #0e1218' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>THE TRANSFORMATION</div>
            <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5 }}>Monday morning. Before and after.</h2>
          </div>
          <div className='before-after' style={{ display:'flex', gap:16, alignItems:'stretch' }}>
            <div style={{ flex:1, padding:'24px', background:'#0a0608', border:'1px solid #2a1020', borderRadius:14 }}>
              <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#f0405e', textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>😩 Without Watchtower</div>
              {STATS_BEFORE.map(s => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid #1a0810' }}>
                  <span style={{ fontSize:'0.9rem' }}>❌</span>
                  <span style={{ fontSize:'0.82rem', color:'#7a6068' }}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'0 12px', flexShrink:0 }}>
              <span style={{ fontSize:'1.5rem', color:'#4f8fff' }}>→</span>
            </div>
            <div style={{ flex:1, padding:'24px', background:'#040a08', border:'1px solid #0d2a18', borderRadius:14 }}>
              <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#22d49a', textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>🚀 With Watchtower</div>
              {STATS_AFTER.map(s => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid #081810' }}>
                  <span style={{ fontSize:'0.9rem' }}>✅</span>
                  <span style={{ fontSize:'0.82rem', color:'#608a78' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI ENGINE */}
      <section className='section' style={{ padding:'80px 24px', maxWidth:1100, margin:'0 auto' }}>
        <div className='ai-grid' style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:56, alignItems:'center' }}>
          <div>
            <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:12 }}>THE AI ENGINE</div>
            <h2 style={{ fontSize:'2.3rem', fontWeight:800, letterSpacing:-1.5, lineHeight:1.15, marginBottom:18 }}>Better than your best analyst.<br />Faster than all of them combined.</h2>
            <p style={{ fontSize:'0.92rem', color:'#6b7a94', lineHeight:1.85, marginBottom:32 }}>
              Every alert is enriched with device history, user context, and cross-alert correlation. The AI returns a verdict — True Positive, False Positive, or Suspicious — with a confidence score, full evidence chain, and recommended actions. False positives above 95% confidence are auto-closed. Critical threats auto-escalate with full runbooks.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[{val:'98%',label:'accuracy on credential access alerts'},{val:'42 min',label:'saved per incident vs manual triage'},{val:'24/7',label:'autonomous triage while you sleep'}].map(s => (
                <div key={s.label} style={{ padding:'14px 12px', background:'#0a0d14', border:'1px solid #141820', borderRadius:12, textAlign:'center' }}>
                  <div style={{ fontSize:'1.4rem', fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:'#4f8fff', letterSpacing:-1, marginBottom:4 }}>{s.val}</div>
                  <div style={{ fontSize:'0.62rem', color:'#4a5568', lineHeight:1.4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:'#0a0d14', border:'1px solid #141820', borderRadius:16, padding:22, position:'relative', overflow:'hidden', animation:'glow 4s ease infinite' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#4f8fff,#8b6fff)' }} />
            <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4a5568', display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              <span style={{ width:7,height:7,borderRadius:'50%',background:'#4f8fff',boxShadow:'0 0 8px #4f8fff',display:'block' }} />
              AI Triage — Live Result
            </div>
            <div style={{ fontSize:'0.9rem', fontWeight:700, marginBottom:10 }}>LSASS memory access on domain controller</div>
            <div style={{ fontSize:'0.82rem', fontWeight:800, color:'#f0405e', padding:'6px 12px', background:'#f0405e0a', border:'1px solid #f0405e18', borderRadius:8, marginBottom:16, display:'inline-block' }}>TRUE POSITIVE — 98% confidence</div>
            <div style={{ fontSize:'0.55rem', fontWeight:700, color:'#4a5568', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Evidence Chain</div>
            {['Domain controller targeted — highest-value asset','Service account used laterally across 3 hosts','T1003.001 — credential dumping, high-fidelity detection','No scheduled maintenance window active'].map(e => (
              <div key={e} style={{ fontSize:'0.74rem', color:'#a0adc4', padding:'3px 0 3px 14px', position:'relative' }}>
                <span style={{ position:'absolute', left:0, top:10, width:5, height:5, borderRadius:'50%', background:'#4f8fff', display:'block' }} />
                {e}
              </div>
            ))}
            <div style={{ fontSize:'0.55rem', fontWeight:700, color:'#4a5568', textTransform:'uppercase', letterSpacing:1, marginTop:14, marginBottom:6 }}>Auto-Actions Taken</div>
            {['✓ Incident INC-0847 created and assigned','✓ admin_svc account disabled (1-click revert)','✓ SOC Slack channel notified','✓ 5-step runbook generated'].map((a,i) => (
              <div key={a} style={{ fontSize:'0.74rem', color:'#22d49a', padding:'2px 0', animation:`slideIn 0.4s ease ${i*0.1}s both` }}>{a}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI CALCULATOR */}
      <section className='section' style={{ padding:'60px 24px', background:'#070a12', borderTop:'1px solid #0e1218', borderBottom:'1px solid #0e1218' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>BY THE NUMBERS</div>
          <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5 }}>Calculate your savings</h2>
        </div>
        <ROICalculator />
      </section>

      {/* INTEGRATIONS */}
      <section className='section' ref={toolsRef} style={{ padding:'70px 24px', textAlign:'center' }}>
        <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>INTEGRATIONS</div>
        <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5, marginBottom:10 }}>Connects to everything you run</h2>
        <p style={{ color:'#6b7a94', fontSize:'0.88rem', marginBottom:32 }}>No rip-and-replace. Plugs into your existing stack in minutes, not months.</p>
        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:8, maxWidth:780, margin:'0 auto' }}>
          {TOOLS.map((t,i) => (
            <span key={t} className='tool-chip' style={{ opacity: toolsVisible ? 1 : 0, transform: toolsVisible ? 'none' : 'translateY(8px)', transition:`all 0.4s ease ${i*0.04}s` }}>{t}</span>
          ))}
          <span className='tool-chip' style={{ opacity: toolsVisible ? 1 : 0, transition:'all 0.4s ease 0.7s', borderStyle:'dashed' }}>+ your tool →</span>
        </div>
      </section>

      {/* FEATURES */}
      <section id='features' className='section' style={{ padding:'60px 24px', maxWidth:980, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>PLATFORM</div>
          <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5 }}>One screen for your entire SOC</h2>
        </div>
        <div className='feat-grid' style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ padding:22, background:'#0a0d14', border:'1px solid #141820', borderRadius:14, transition:'all .2s', cursor:'default' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#4f8fff25'; (e.currentTarget as HTMLElement).style.transform='translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#141820'; (e.currentTarget as HTMLElement).style.transform='none'; }}>
              <div style={{ fontSize:'1.5rem', marginBottom:10 }}>{f.icon}</div>
              <h3 style={{ fontSize:'0.9rem', fontWeight:700, marginBottom:6 }}>{f.title}</h3>
              <p style={{ fontSize:'0.76rem', color:'#6b7a94', lineHeight:1.7 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MSSP */}
      <section className='section' style={{ padding:'60px 24px', maxWidth:720, margin:'0 auto' }}>
        <div style={{ padding:36, background:'linear-gradient(145deg,#0a0d14,#0d1018)', border:'1px solid #8b6fff18', borderRadius:18, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#8b6fff,#4f8fff)' }} />
          <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#8b6fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>FOR MSSPs</div>
          <h2 style={{ fontSize:'1.7rem', fontWeight:800, letterSpacing:-1, marginBottom:10 }}>Manage 50 clients from one console</h2>
          <p style={{ fontSize:'0.9rem', color:'#6b7a94', lineHeight:1.75, marginBottom:20 }}>Client health at a glance. Cross-client threat correlation. Automated branded reports. White-label — your brand, zero Watchtower branding.</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:24 }}>
            {[['🔴🟡🟢','Client health RAG — instant portfolio view'],['🔗','Cross-client IOC correlation'],['📊','Automated weekly branded reports'],['🎨','Full white-label, your brand only']].map(([icon,text]) => (
              <div key={String(text)} style={{ display:'flex', alignItems:'center', gap:10, fontSize:'0.8rem', color:'#a0adc4', padding:'10px 12px', background:'#050508', borderRadius:8, border:'1px solid #141820' }}>
                <span style={{ fontSize:'1rem', flexShrink:0 }}>{icon}</span>{text}
              </div>
            ))}
          </div>
          <a href='/pricing' className='ld-btn'>See MSSP pricing →</a>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className='section' style={{ padding:'60px 24px', maxWidth:980, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5 }}>What security teams say</h2>
        </div>
        <div className='test-grid' style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ padding:22, background:'#0a0d14', border:'1px solid #141820', borderRadius:14, display:'flex', flexDirection:'column' }}>
              <div style={{ fontSize:'1.2rem', color:'#f0a030', marginBottom:10 }}>★★★★★</div>
              <p style={{ fontSize:'0.82rem', color:'#a0adc4', lineHeight:1.75, marginBottom:16, flex:1, fontStyle:'italic' }}>"{t.quote}"</p>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${t.color},#8b6fff)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.62rem',color:'#fff',fontWeight:800,flexShrink:0 }}>{t.init}</div>
                <div>
                  <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#e8ecf4' }}>{t.name}</div>
                  <div style={{ fontSize:'0.65rem', color:'#4a5568' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className='section' style={{ padding:'60px 24px', maxWidth:1000, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>PRICING</div>
          <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5 }}>Start free. Scale when ready.</h2>
          <p style={{ color:'#6b7a94', fontSize:'0.88rem', marginTop:8 }}>14-day free trial on all paid plans. No credit card required.</p>
        </div>
        <div className='price-grid' style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {[
            { name:'Community', price:'£0', per:'Free forever', feats:'2 tools · AI triage (view) · Alerts · 1 seat', cta:'Get Started', href:'/signup', style:{} },
            { name:'Team', price:'£29', per:'/seat/mo — 3 seats', feats:'Unlimited tools · AI Co-Pilot · Auto-triage · Response actions · Threat intel · Incidents', cta:'Start Free Trial →', href:'/signup?plan=team', pop:true, style:{} },
            { name:'Business', price:'£79', per:'/mo — 10 seats', feats:'Everything in Team · PDF reports · API access · RBAC · Compliance mapping', cta:'Start Free Trial', href:'/signup?plan=business', style:{} },
            { name:'MSSP', price:'£599', per:'/mo — 5 clients', feats:'Everything in Business · Portfolio view · Cross-client correlation · Auto reports · White-label', cta:'Contact Sales', href:'/signup?plan=mssp', style:{} },
          ].map(p => (
            <div key={p.name} style={{ padding:22, background:'#0a0d14', border:`1px solid ${p.pop ? '#4f8fff35' : '#141820'}`, borderRadius:14, display:'flex', flexDirection:'column', position:'relative', ...p.style }}>
              {p.pop && <div style={{ position:'absolute', top:0, left:0, right:0, textAlign:'center', fontSize:'0.52rem', fontWeight:700, color:'#fff', background:'#4f8fff', padding:'3px 0', borderRadius:'14px 14px 0 0' }}>MOST POPULAR</div>}
              <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:4, marginTop: p.pop ? 14 : 0 }}>{p.name}</div>
              <div style={{ fontSize:'2rem', fontWeight:900, fontFamily:'JetBrains Mono,monospace', letterSpacing:-2, marginBottom:2 }}>{p.price}</div>
              <div style={{ fontSize:'0.65rem', color:'#4a5568', marginBottom:14 }}>{p.per}</div>
              <div style={{ fontSize:'0.72rem', color:'#6b7a94', lineHeight:1.85, flex:1, marginBottom:18 }}>{p.feats}</div>
              <a href={p.href} className={p.pop ? 'ld-btn' : 'ld-btn-ghost'} style={{ textAlign:'center', display:'block', padding:'10px 0' }}>{p.cta}</a>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:16 }}>
          <a href='/pricing' style={{ color:'#4f8fff', fontSize:'0.82rem', fontWeight:600 }}>View full pricing with add-ons →</a>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className='section' style={{ textAlign:'center', padding:'80px 24px', maxWidth:620, margin:'0 auto' }}>
        <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:14 }}>READY?</div>
        <h2 style={{ fontSize:'2.4rem', fontWeight:800, letterSpacing:-1.5, marginBottom:12 }}>Your threat won't wait.<br />Neither should you.</h2>
        <p style={{ color:'#6b7a94', fontSize:'0.95rem', marginBottom:28, lineHeight:1.75 }}>14-day free trial. No credit card. Your first month of AI triage, completely free.</p>
        <a href='/signup' className='ld-btn' style={{ fontSize:'1.05rem', padding:'14px 40px' }}>Start Free Trial →</a>
        <p style={{ fontSize:'0.7rem', color:'#3a4050', marginTop:14 }}>Setup takes 12 minutes · No agents required to start · Cancel anytime</p>
      </section>

      {/* FOOTER */}
      <footer className='section' style={{ borderTop:'1px solid #141820', padding:'20px 28px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:1100, margin:'0 auto' }}>
          <a href='/' style={{ display:'flex', alignItems:'center', gap:7, fontWeight:800, fontSize:'0.9rem' }}>
            <div style={{ width:22,height:22,borderRadius:6,background:'linear-gradient(135deg,#4f8fff,#8b6fff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.55rem',color:'#fff',fontWeight:900 }}>W</div>
            Watchtower
          </a>
          <div style={{ display:'flex', gap:18 }}>
            {['Demo','Pricing','Sign In','Contact'].map(l => <a key={l} href={l === 'Contact' ? 'mailto:hello@getwatchtower.io' : `/${l.toLowerCase().replace(' ','')}`} style={{ color:'#4a5568', fontSize:'0.76rem', transition:'color .2s' }}>{l}</a>)}
          </div>
        </div>
        <div style={{ textAlign:'center', fontSize:'0.64rem', color:'#1e2536', padding:'12px 0' }}>© 2026 Watchtower. All rights reserved.</div>
      </footer>
    </div>
  );
}
