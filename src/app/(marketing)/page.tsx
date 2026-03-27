'use client';
import { useState, useEffect, useRef } from 'react';

const ALERTS = [
  { sev:'crit', title:'LSASS credential dump — DC01', verdict:'TP', conf:98, action:'Isolated host, opened INC-0847', time:'09:14' },
  { sev:'high', title:'C2 beacon → 185.220.101.42', verdict:'TP', conf:94, action:'Blocked IP, notified SOC', time:'09:16' },
  { sev:'med', title:'Scheduled task persistence — SRV-APP02', verdict:'SUS', conf:67, action:'Flagged for analyst review', time:'09:22' },
  { sev:'low', title:'Windows Update triggered PowerShell', verdict:'FP', conf:99, action:'Auto-closed, suppressed', time:'09:31' },
];

// Inline SVG tool icons — no external dependency, always renders
const TOOLS = [
  { name:'CrowdStrike',  color:'#f0405e', abbr:'CS' },
  { name:'Defender',     color:'#00a4ef', abbr:'DF' },
  { name:'Taegis XDR',   color:'#e8172c', abbr:'TX' },
  { name:'Tenable',      color:'#00b3e3', abbr:'TN' },
  { name:'SentinelOne',  color:'#8c2be2', abbr:'S1' },
  { name:'Splunk',       color:'#65a637', abbr:'SP' },
  { name:'Sentinel',     color:'#0078d4', abbr:'MS' },
  { name:'Darktrace',    color:'#6b4fbd', abbr:'DT' },
  { name:'Zscaler',      color:'#00aae7', abbr:'ZS' },
  { name:'Elastic',      color:'#00bfb3', abbr:'EL' },
  { name:'QRadar',       color:'#006699', abbr:'QR' },
  { name:'Okta',         color:'#007dc1', abbr:'OK' },
  { name:'Proofpoint',   color:'#007dba', abbr:'PP' },
  { name:'Nessus',       color:'#00b3e3', abbr:'NS' },
  { name:'Wiz',          color:'#10b981', abbr:'WZ' },
];

const FEATURES = [
  { icon:'⚡', title:'AI Triage in 3.2s', body:'Every alert assessed, scored, and actioned before your analyst opens Slack. TP, FP, or Suspicious — full evidence chain and confidence score.' },
  { icon:'🛡', title:'Estate Visibility', body:'Devices, coverage gaps, missing agents — mapped in real time. Know exactly where you are blind before an attacker finds it first.' },
  { icon:'🔍', title:'AI Remediation Queries', body:'Top CVEs ranked by severity. One click generates production-ready Splunk SPL, Sentinel KQL, and Defender hunting queries.' },
  { icon:'🌐', title:'IOC Hunt Queries', body:'Industry threat feeds with one-click AI query generation. Hunt for specific IOCs across Splunk, Sentinel, and Defender instantly.' },
  { icon:'🤖', title:'Autonomous Response', body:'Isolate a host, block an IP, disable a compromised account — automatically, in seconds. Full audit trail and one-click revert.' },
  { icon:'📊', title:'MSSP Portfolio View', body:'Manage multiple clients from one pane. Per-client posture, alerts, revenue, and usage. White-label ready with your branding.' },
  { icon:'👥', title:'Role-Based Access', body:'Owner, Tech Admin, Sales, Viewer — granular roles for your whole team. Invite staff, set permissions, track last-seen per user.' },
  { icon:'📈', title:'Sales Dashboard', body:'Set MRR/ARR targets, get AI-generated go-to-market strategy. Exactly which plan mix to sell to hit your revenue goal.' },
  { icon:'🔐', title:'BYOK — Per-Client Keys', body:'Each client\'s AI calls run under their own Anthropic key. Complete data isolation. No shared AI context across tenants.' },
  { icon:'✦', title:'AI Co-Pilot', body:'Chat with a security-scoped AI in the dashboard. Explain MITRE techniques, generate detection queries, summarise incidents without leaving the SOC view.' },
  { icon:'🛡', title:'Compliance Mapping', body:'Active alerts and vulnerabilities automatically mapped to ISO 27001, Cyber Essentials, and NIST CSF. Framework score cards with gap analysis.' },
  { icon:'📋', title:'Shift Handover', body:'One-click handover brief covering alerts triaged, incidents open, posture score, and top threats. Paste into Slack or Teams at shift end.' },
];

const TESTIMONIALS = [
  { quote:'The AI triage alone saved us 30+ hours a week. We went from drowning in alerts to actually doing security work.', name:'Sarah R.', role:'CISO, Healthcare SaaS', init:'SR', color:'#4f8fff' },
  { quote:'As an MSSP managing 12 clients, the portfolio view is a game-changer. One click to drill into any tenant.', name:'Marcus T.', role:'Director, MSSP', init:'MT', color:'#22d49a' },
  { quote:'Junior analysts now triage alerts that used to require a senior. The AI explains its reasoning — it\'s like having a mentor on every alert.', name:'James C.', role:'SOC Manager, Financial Services', init:'JC', color:'#8b6fff' },
];

const PLANS = [
  { name:'Community', price:'£0', period:'forever', color:'#6b7a94', features:['2 tool integrations','AI alert triage (read-only)','1 seat','Community support'] },
  { name:'Team', price:'£49', period:'/seat/mo', color:'#4f8fff', badge:'Popular', features:['Unlimited integrations','Full AI Co-Pilot','Automation (Full Auto)','BYOK required','From 3 seats'] },
  { name:'Business', price:'£199', period:'/mo', color:'#22d49a', features:['Everything in Team','10 seats included','PDF reports & API','RBAC — full roles','Compliance mapping'] },
  { name:'MSSP', price:'£799', period:'/mo', color:'#8b6fff', badge:'Best value', features:['Everything in Business','Unlimited clients (+£79/client)','White-label branding','Per-client BYOK','Portfolio dashboard','Sales dashboard & AI GTM'] },
];

function ToolChip({ name, color, abbr }: { name: string; color: string; abbr: string }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:7,
      padding:'6px 12px', background:'#131929', border:'1px solid #1a2030',
      borderRadius:20, fontSize:'0.72rem', color:'#8a9ab0', fontWeight:600,
      transition:'all .15s', cursor:'default',
    }}
    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=color+'40';(e.currentTarget as HTMLElement).style.color='#e8ecf4';}}
    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='#1a2030';(e.currentTarget as HTMLElement).style.color='#8a9ab0';}}>
      <span style={{
        width:16, height:16, borderRadius:4, flexShrink:0,
        background:`linear-gradient(135deg,${color}cc,${color}55)`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'0.42rem', fontWeight:900, color:'#fff', letterSpacing:0,
      }}>{abbr}</span>
      {name}
    </span>
  );
}

function ROICalculator() {
  const [analysts, setAnalysts] = useState(3);
  const [alertsPerDay, setAlertsPerDay] = useState(200);
  const hoursSaved = Math.round(alertsPerDay * 0.72 * 0.05 * 22 * analysts);
  const moneySaved = Math.round(hoursSaved * 65);
  return (
    <div style={{ maxWidth:640, margin:'0 auto', background:'#131929', border:'1px solid #1a2030', borderRadius:16, padding:'28px 32px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
        <div>
          <label style={{ display:'block', fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Analysts on your team</label>
          <input type='range' min={1} max={20} value={analysts} onChange={e=>setAnalysts(Number(e.target.value))} style={{ width:'100%', accentColor:'#4f8fff' }} />
          <span style={{ fontSize:'1.2rem', fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:'#e8ecf4' }}>{analysts}</span>
        </div>
        <div>
          <label style={{ display:'block', fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Alerts per day</label>
          <input type='range' min={50} max={2000} step={50} value={alertsPerDay} onChange={e=>setAlertsPerDay(Number(e.target.value))} style={{ width:'100%', accentColor:'#4f8fff' }} />
          <span style={{ fontSize:'1.2rem', fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:'#e8ecf4' }}>{alertsPerDay}</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[
          { label:'Analyst hours saved/mo', val:`${hoursSaved.toLocaleString()}h`, color:'#4f8fff' },
          { label:'Estimated cost saving/mo', val:`£${moneySaved.toLocaleString()}`, color:'#22d49a' },
        ].map(s => (
          <div key={s.label} style={{ padding:'18px 20px', background:'#0c1020', border:`1px solid ${s.color}20`, borderRadius:12 }}>
            <div style={{ fontSize:'2rem', fontWeight:900, fontFamily:'JetBrains Mono,monospace', color:s.color, letterSpacing:-2 }}>{s.val}</div>
            <div style={{ fontSize:'0.66rem', color:'#6b7a94', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveDashPreview() {
  const [visibleAlerts, setVisibleAlerts] = useState<number[]>([0]);
  const [aiText, setAiText] = useState('');
  const fullText = 'AI Shift Brief: Processed 23 alerts overnight. Auto-closed 18 FPs. Escalated 3 TPs to incidents. 2 critical alerts need immediate attention.';
  useEffect(() => {
    let i = 0;
    const addAlert = () => { if(i<ALERTS.length){setVisibleAlerts(p=>[...p,i]);i++;setTimeout(addAlert,800);} };
    const t = setTimeout(()=>addAlert(), 400);
    return ()=>clearTimeout(t);
  },[]);
  useEffect(()=>{
    let i=0;const iv=setInterval(()=>{setAiText(fullText.slice(0,i));i++;if(i>fullText.length)clearInterval(iv);},16);
    return()=>clearInterval(iv);
  },[]);
  const sevColor: Record<string,string> = { crit:'#f0405e', high:'#f97316', med:'#f0a030', low:'#4f8fff' };
  const vStyle: Record<string,{c:string;bg:string}> = { TP:{c:'#f0405e',bg:'#f0405e12'}, FP:{c:'#22d49a',bg:'#22d49a12'}, SUS:{c:'#f0a030',bg:'#f0a03012'} };
  return (
    <div style={{ background:'#0c1020', border:'1px solid #1e2a3a', borderRadius:14, overflow:'hidden', fontFamily:'Inter,sans-serif', maxWidth:860, margin:'0 auto', boxShadow:'0 40px 80px rgba(0,0,0,0.6)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', background:'#0a0d18', borderBottom:'1px solid #1a2030' }}>
        <div style={{ display:'flex', gap:5 }}>
          {['#f0405e80','#f0a03080','#22c99280'].map((c,i)=><span key={i} style={{width:9,height:9,borderRadius:'50%',background:c,display:'block'}}/>)}
        </div>
        <span style={{ flex:1, textAlign:'center', fontSize:'0.6rem', color:'#3a4a60', fontFamily:'JetBrains Mono,monospace', background:'#060810', padding:'3px 12px', borderRadius:4 }}>getwatchtower.io/dashboard</span>
        <span style={{ fontSize:'0.58rem', color:'#22c992', display:'flex', alignItems:'center', gap:4 }}><span style={{width:5,height:5,borderRadius:'50%',background:'#22c992',boxShadow:'0 0 6px #22c992',display:'block'}}/>LIVE</span>
      </div>
      <div style={{ display:'flex', minHeight:300 }}>
        <div style={{ width:44, background:'#08090f', borderRight:'1px solid #121820', padding:'10px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{marginBottom:8}}>
            <rect width="28" height="28" rx="7" fill="url(#pg2)"/>
            <path d="M14 5.5L22 9V15.5C22 19.5 18.5 23 14 24.5C9.5 23 6 19.5 6 15.5V9L14 5.5Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7"/>
            <path d="M11.5 14.5L13.5 16.5L17.5 12" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="pg2" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
          </svg>
          {['📊','🔔','🛡','🔍','🌐','📋','📈'].map((ic,i)=><div key={i} style={{width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,fontSize:'0.7rem',background:i===0?'#4f8fff18':'transparent'}}>{ic}</div>)}
        </div>
        <div style={{ flex:1, padding:'12px 16px' }}>
          <div style={{ fontSize:'0.62rem', color:'#8a9ab0', padding:'7px 10px', background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(34,201,146,0.05))', border:'1px solid #4f8fff18', borderRadius:8, marginBottom:10, display:'flex', alignItems:'flex-start', gap:6, minHeight:32 }}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#4f8fff',boxShadow:'0 0 8px #4f8fff',flexShrink:0,marginTop:2}}/>
            <span style={{fontSize:'0.6rem'}}>{aiText}<span style={{opacity:aiText.length<fullText.length?1:0,borderRight:'2px solid #4f8fff',marginLeft:1}}> </span></span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:10 }}>
            {[{l:'Posture',v:'91%',c:'#22d49a'},{l:'Critical',v:'0',c:'#22d49a'},{l:'Coverage',v:'99%',c:'#22d49a'},{l:'AI Closed',v:'847',c:'#4f8fff'}].map(s=>(
              <div key={s.l} style={{padding:'8px',background:'#131929',borderRadius:8,textAlign:'center'}}>
                <div style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.c,letterSpacing:-1}}>{s.v}</div>
                <div style={{fontSize:'0.5rem',color:'#4a5568',marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {ALERTS.map((a,i)=>(
              <div key={i} style={{display:visibleAlerts.includes(i)?'flex':'none',alignItems:'center',gap:8,padding:'6px 8px',background:'#131929',borderRadius:8,border:'1px solid #1d2535',animation:'slideIn 0.3s ease'}}>
                <div style={{width:3,height:24,borderRadius:2,background:sevColor[a.sev],flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'0.68rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.title}</div>
                  <div style={{fontSize:'0.54rem',color:'#6b7a94',marginTop:1}}>{a.action}</div>
                </div>
                <span style={{fontSize:'0.5rem',fontWeight:800,padding:'2px 6px',borderRadius:3,color:vStyle[a.verdict]?.c,background:vStyle[a.verdict]?.bg,flexShrink:0}}>{a.verdict}</span>
                <span style={{fontSize:'0.5rem',color:'#3a4a60',flexShrink:0,fontFamily:'JetBrains Mono,monospace'}}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const toolsRef = useRef<HTMLElement>(null);
  const [toolsVisible, setToolsVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(false);

  useEffect(()=>{
    const obs = new IntersectionObserver(([e])=>{if(e.isIntersecting)setToolsVisible(true);},{threshold:0.2});
    if(toolsRef.current) obs.observe(toolsRef.current);
    return ()=>obs.disconnect();
  },[]);

  const CSS = `
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#090d18;color:#e8ecf4;font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    @keyframes slideIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(79,143,255,0.3)}50%{box-shadow:0 0 40px rgba(79,143,255,0.6)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
    .nav-link{color:#6b7a94;text-decoration:none;font-size:0.82rem;font-weight:500;transition:color .15s}
    .nav-link:hover{color:#e8ecf4}
    .btn-primary{padding:11px 24px;background:#4f8fff;color:#fff;border:none;border-radius:9px;font-weight:700;font-size:0.85rem;cursor:pointer;transition:all .15s;text-decoration:none;display:inline-block;font-family:inherit}
    .btn-primary:hover{background:#6b9fff;transform:translateY(-1px);box-shadow:0 8px 24px rgba(79,143,255,0.35)}
    .btn-outline{padding:10px 22px;background:transparent;color:#e8ecf4;border:1px solid #2a3448;border-radius:9px;font-weight:600;font-size:0.85rem;cursor:pointer;transition:all .15s;text-decoration:none;display:inline-block;font-family:inherit}
    .btn-outline:hover{border-color:#4f8fff;color:#4f8fff}
    .section{max-width:1200px;margin:0 auto}
    @media(max-width:768px){.feat-grid{grid-template-columns:1fr!important}.plan-grid{grid-template-columns:1fr!important}.hero-btns{flex-direction:column}}
  `;

  return (
    <main style={{ background:'#090d18', color:'#e8ecf4', minHeight:'100vh', fontFamily:'Inter,system-ui,sans-serif' }}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(5,5,8,0.9)', backdropFilter:'blur(16px)', borderBottom:'1px solid #0e1218', padding:'0 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', height:58, gap:32 }}>
          <a href='/' style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none', color:'inherit', flexShrink:0 }}>
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <rect width="30" height="30" rx="8" fill="url(#navg)"/>
              <path d="M15 6L23 10V16C23 20 19.5 23.5 15 25C10.5 23.5 7 20 7 16V10L15 6Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
              <path d="M12.5 15.5L14.5 17.5L18.5 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs><linearGradient id="navg" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
            </svg>
            <span style={{ fontWeight:800, fontSize:'1rem', letterSpacing:-0.3 }}>Watchtower</span>
          </a>
          <div style={{ display:'flex', gap:24, marginLeft:16 }}>
            {[['Features','#features'],['Pricing','#pricing'],['Integrations','#integrations'],['MSSP','#mssp']].map(([label,href])=>(
              <a key={label} href={href} className='nav-link'>{label}</a>
            ))}
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
            <a href='/login' className='btn-outline' style={{padding:'7px 16px',fontSize:'0.78rem'}}>Sign in</a>
            <a href='/signup' className='btn-primary' style={{padding:'8px 18px',fontSize:'0.78rem'}}>Get started free →</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding:'80px 24px 60px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 50% at 50% -10%,rgba(79,143,255,0.12),transparent)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'20%', left:'10%', width:300, height:300, borderRadius:'50%', background:'rgba(139,111,255,0.04)', filter:'blur(80px)', pointerEvents:'none' }}/>
        <div style={{ maxWidth:800, margin:'0 auto', position:'relative' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px', background:'#4f8fff12', border:'1px solid #4f8fff25', borderRadius:20, fontSize:'0.7rem', color:'#4f8fff', fontWeight:600, marginBottom:24 }}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#4f8fff',boxShadow:'0 0 8px #4f8fff',display:'block',animation:'pulse 2s ease infinite'}}/>
            AI-powered SOC · Multi-tenant · Enterprise-ready
          </div>
          <h1 style={{ fontSize:'clamp(2.2rem,5vw,3.6rem)', fontWeight:900, lineHeight:1.08, letterSpacing:-2.5, marginBottom:20 }}>
            Your entire SOC.<br/>
            <span style={{ background:'linear-gradient(135deg,#4f8fff,#8b6fff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>One screen.</span>
          </h1>
          <p style={{ fontSize:'clamp(0.95rem,2vw,1.15rem)', color:'#6b7a94', lineHeight:1.75, marginBottom:32, maxWidth:580, margin:'0 auto 32px' }}>
            AI triage in 3.2 seconds. Live integrations with CrowdStrike, Splunk, Taegis, Tenable and 12 more.
            Role-based access for your whole team. Built for MSSPs and enterprise SOCs.
          </p>
          <div className='hero-btns' style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
            <a href='/signup' className='btn-primary' style={{fontSize:'0.9rem',padding:'13px 28px'}}>Start free — no card needed →</a>
            <a href='#features' className='btn-outline' style={{fontSize:'0.9rem',padding:'13px 24px'}}>See features</a>
          </div>
          <div style={{ marginTop:16, fontSize:'0.72rem', color:'#3a4a60' }}>Community plan free forever · Team from £49/seat/mo</div>
        </div>
      </section>

      {/* LIVE DASHBOARD PREVIEW */}
      <section style={{ padding:'0 24px 60px' }}>
        <LiveDashPreview />
      </section>

      {/* BEFORE / AFTER */}
      <section style={{ padding:'60px 24px', background:'#0c1020', borderTop:'1px solid #0e1218', borderBottom:'1px solid #0e1218' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#f0405e', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>THE PROBLEM</div>
            <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5 }}>What your SOC looks like today vs with Watchtower</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:24, alignItems:'center' }}>
            <div style={{ padding:24, background:'#131929', border:'1px solid #f0405e18', borderRadius:14 }}>
              <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#f0405e', textTransform:'uppercase', letterSpacing:'1px', marginBottom:14 }}>Before Watchtower</div>
              {['400+ alerts/day, all need human review','6 separate tool consoles open','3.5 hour average triage time','80% are false positives eating analyst time','Junior analysts bottlenecked on senior review'].map(s=>(
                <div key={s} style={{display:'flex',gap:8,marginBottom:8,alignItems:'flex-start'}}>
                  <span style={{color:'#f0405e',flexShrink:0,marginTop:1}}>✗</span>
                  <span style={{fontSize:'0.78rem',color:'#6b7a94',lineHeight:1.5}}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize:'1.5rem', color:'#3a4050' }}>→</div>
            <div style={{ padding:24, background:'#131929', border:'1px solid #22d49a18', borderRadius:14 }}>
              <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#22d49a', textTransform:'uppercase', letterSpacing:'1px', marginBottom:14 }}>With Watchtower</div>
              {['<60 alerts actually need attention','1 screen for everything','3.2s AI triage with evidence chain','85% auto-resolved with full audit trail','Juniors work at senior level with AI guidance'].map(s=>(
                <div key={s} style={{display:'flex',gap:8,marginBottom:8,alignItems:'flex-start'}}>
                  <span style={{color:'#22d49a',flexShrink:0,marginTop:1}}>✓</span>
                  <span style={{fontSize:'0.78rem',color:'#8a9ab0',lineHeight:1.5}}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ROI */}
      <section style={{ padding:'60px 24px', textAlign:'center' }}>
        <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>BY THE NUMBERS</div>
        <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5, marginBottom:32 }}>Calculate your savings</h2>
        <ROICalculator />
      </section>

      {/* INTEGRATIONS */}
      <section id='integrations' ref={toolsRef as React.RefObject<HTMLElement>} style={{ padding:'60px 24px', textAlign:'center', background:'#0c1020', borderTop:'1px solid #0e1218', borderBottom:'1px solid #0e1218' }}>
        <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>INTEGRATIONS</div>
        <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5, marginBottom:10 }}>Connects to everything you run</h2>
        <p style={{ color:'#6b7a94', fontSize:'0.88rem', marginBottom:32 }}>No rip-and-replace. Plugs into your existing stack in minutes, not months.</p>
        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:8, maxWidth:820, margin:'0 auto' }}>
          {TOOLS.map((t,i)=>(
            <span key={t.name+i} style={{ opacity:toolsVisible?1:0, transform:toolsVisible?'none':'translateY(8px)', transition:`all 0.4s ease ${i*0.04}s` }}>
              <ToolChip name={t.name} color={t.color} abbr={t.abbr}/>
            </span>
          ))}
          <span style={{ opacity:toolsVisible?1:0, transition:'all 0.4s ease 0.7s', display:'inline-flex', alignItems:'center', padding:'6px 14px', background:'transparent', border:'1px dashed #4f8fff40', borderRadius:20, fontSize:'0.72rem', color:'#4f8fff', fontWeight:600 }}>
            + your tool →
          </span>
        </div>
      </section>

      {/* FEATURES */}
      <section id='features' style={{ padding:'70px 24px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:44 }}>
          <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>PLATFORM</div>
          <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5 }}>One screen for your entire SOC</h2>
        </div>
        <div className='feat-grid' style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {FEATURES.map(f=>(
            <div key={f.title} style={{ padding:22, background:'#131929', border:'1px solid #1d2535', borderRadius:14, transition:'all .2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='#4f8fff25';(e.currentTarget as HTMLElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLElement).style.boxShadow='0 12px 32px rgba(79,143,255,0.08)';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='#1d2535';(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none';}}>
              <div style={{ fontSize:'1.5rem', marginBottom:10 }}>{f.icon}</div>
              <h3 style={{ fontSize:'0.9rem', fontWeight:700, marginBottom:6 }}>{f.title}</h3>
              <p style={{ fontSize:'0.76rem', color:'#6b7a94', lineHeight:1.7 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MSSP SECTION */}
      <section id='mssp' style={{ padding:'60px 24px', maxWidth:860, margin:'0 auto' }}>
        <div style={{ padding:36, background:'linear-gradient(145deg,#131929,#0d1018)', border:'1px solid #8b6fff18', borderRadius:18, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#8b6fff,#4f8fff)' }}/>
          <div style={{ position:'absolute', bottom:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(139,111,255,0.06)', filter:'blur(40px)', pointerEvents:'none' }}/>
          <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#8b6fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>FOR MSSPs</div>
          <h2 style={{ fontSize:'1.7rem', fontWeight:800, letterSpacing:-1, marginBottom:10 }}>Manage 50 clients from one console</h2>
          <p style={{ fontSize:'0.9rem', color:'#6b7a94', lineHeight:1.75, marginBottom:24 }}>Client health at a glance. Cross-client threat correlation. Per-client BYOK keys — each client's AI calls stay isolated under their own Anthropic account. White-label — your brand, zero Watchtower branding.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:24 }}>
            {[
              { icon:'📊', title:'Portfolio Dashboard', body:'Every client on one screen. Drill into any tenant in one click. Posture, alerts, incidents, coverage.' },
              { icon:'📈', title:'Sales Dashboard + AI GTM', body:'Set your MRR/ARR targets. AI generates the exact customer mix and go-to-market strategy to get there.' },
              { icon:'🔐', title:'Per-client BYOK isolation', body:'Each client gets their own Anthropic key. Zero cross-contamination of AI context between tenants.' },
              { icon:'🏷', title:'Full white-label', body:'Your logo, your domain, your brand. Clients see your product — not Watchtower.' },
            ].map(f=>(
              <div key={f.title} style={{ padding:'14px 16px', background:'rgba(139,111,255,0.06)', border:'1px solid #8b6fff18', borderRadius:10 }}>
                <div style={{ fontSize:'1rem', marginBottom:6 }}>{f.icon}</div>
                <div style={{ fontSize:'0.78rem', fontWeight:700, marginBottom:4 }}>{f.title}</div>
                <div style={{ fontSize:'0.72rem', color:'#6b7a94', lineHeight:1.6 }}>{f.body}</div>
              </div>
            ))}
          </div>
          <a href='/signup?plan=mssp' className='btn-primary' style={{ background:'#8b6fff' }}>Start MSSP trial →</a>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding:'60px 24px', background:'#0c1020', borderTop:'1px solid #0e1218', borderBottom:'1px solid #0e1218' }}>
        <div style={{ maxWidth:980, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>TESTIMONIALS</div>
            <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5 }}>Trusted by security teams</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {TESTIMONIALS.map(t=>(
              <div key={t.name} style={{ padding:24, background:'#131929', border:'1px solid #1d2535', borderRadius:14 }}>
                <p style={{ fontSize:'0.84rem', color:'#8a9ab0', lineHeight:1.8, marginBottom:20, fontStyle:'italic' }}>"{t.quote}"</p>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${t.color}33,${t.color}15)`, border:`1px solid ${t.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:800, color:t.color }}>{t.init}</div>
                  <div>
                    <div style={{ fontSize:'0.78rem', fontWeight:700 }}>{t.name}</div>
                    <div style={{ fontSize:'0.62rem', color:'#4a5568' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id='pricing' style={{ padding:'70px 24px', textAlign:'center' }}>
        <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>PRICING</div>
        <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5, marginBottom:8 }}>Simple, transparent pricing</h2>
        <p style={{ color:'#6b7a94', fontSize:'0.88rem', marginBottom:32 }}>Start free. Upgrade as you grow. No hidden fees.</p>
        <div className='plan-grid' style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, maxWidth:1060, margin:'0 auto' }}>
          {PLANS.map(p=>(
            <div key={p.name} style={{ padding:24, background:'#131929', border:`1px solid ${p.name==='Business'?p.color+'30':'#1d2535'}`, borderRadius:16, position:'relative', display:'flex', flexDirection:'column', gap:4, transition:'all .2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow=`0 20px 48px ${p.color}18`;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none';}}>
              {p.badge && <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', padding:'3px 12px', background:p.color, borderRadius:20, fontSize:'0.6rem', fontWeight:800, color:'#fff', whiteSpace:'nowrap' }}>{p.badge}</div>}
              <div style={{ fontSize:'0.64rem', fontWeight:700, color:p.color, textTransform:'uppercase', letterSpacing:'1px', marginBottom:6 }}>{p.name}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:3, marginBottom:4 }}>
                <span style={{ fontSize:'2rem', fontWeight:900, letterSpacing:-2, fontFamily:'JetBrains Mono,monospace', color:'#e8ecf4' }}>{p.price}</span>
                <span style={{ fontSize:'0.72rem', color:'#4a5568' }}>{p.period}</span>
              </div>
              <div style={{ height:1, background:'#1d2535', margin:'12px 0' }}/>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
                {p.features.map(f=>(
                  <div key={f} style={{ display:'flex', gap:7, alignItems:'flex-start' }}>
                    <span style={{ color:p.color, fontSize:'0.75rem', flexShrink:0, marginTop:1 }}>✓</span>
                    <span style={{ fontSize:'0.75rem', color:'#8a9ab0', lineHeight:1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href='/signup' style={{ display:'block', marginTop:20, padding:'10px 0', background:p.name==='Business'?p.color:'transparent', border:`1px solid ${p.color}${p.name==='Business'?'':'50'}`, borderRadius:9, color:p.name==='Business'?'#fff':p.color, fontSize:'0.78rem', fontWeight:700, textDecoration:'none', textAlign:'center', transition:'all .15s' }}
                onMouseEnter={e=>{if(p.name!=='Business'){(e.currentTarget as HTMLElement).style.background=p.color+'20';}}}
                onMouseLeave={e=>{if(p.name!=='Business'){(e.currentTarget as HTMLElement).style.background='transparent';}}}>
                {p.name==='Community'?'Start for free':'Get started →'}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'70px 24px', textAlign:'center', background:'#0c1020', borderTop:'1px solid #0e1218' }}>
        <div style={{ maxWidth:580, margin:'0 auto' }}>
          <h2 style={{ fontSize:'2.2rem', fontWeight:900, letterSpacing:-2, marginBottom:14, lineHeight:1.1 }}>Your SOC deserves better than 6 tabs.</h2>
          <p style={{ fontSize:'0.95rem', color:'#6b7a94', lineHeight:1.75, marginBottom:32 }}>Start for free today. Connect your first tool in under 5 minutes.</p>
          <a href='/signup' className='btn-primary' style={{ fontSize:'1rem', padding:'14px 36px' }}>Get started free →</a>
          <div style={{ marginTop:14, fontSize:'0.72rem', color:'#3a4a60' }}>No credit card · Community plan free forever · Team from £49/seat/mo</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding:'32px 24px', borderTop:'1px solid #0e1218', display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:1100, margin:'0 auto', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="6" fill="url(#fg)"/>
            <path d="M11 4L17.5 7V11.5C17.5 14.5 14.8 17.5 11 18.5C7.2 17.5 4.5 14.5 4.5 11.5V7L11 4Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
            <path d="M9.5 11.5L11 13L13.5 10" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="fg" x1="0" y1="0" x2="22" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
          </svg>
          <span style={{ fontWeight:700, fontSize:'0.88rem' }}>Watchtower</span>
          <span style={{ color:'#2a3448', marginLeft:8, fontSize:'0.72rem' }}>© 2026 RunbookHQ Ltd</span>
        </div>
        <div style={{ display:'flex', gap:20 }}>
          {[{l:'Privacy',h:'/privacy'},{l:'Terms',h:'/terms'},{l:'Security',h:'/security'},{l:'Docs',h:'/docs'}].map(({l,h})=><a key={l} href={h} style={{color:'#4a5568',fontSize:'0.76rem',textDecoration:'none'}} onMouseEnter={e=>{(e.target as HTMLElement).style.color='#8a9ab0';}} onMouseLeave={e=>{(e.target as HTMLElement).style.color='#4a5568';}}>{l}</a>)}
        </div>
      </footer>
    </main>
  );
}
