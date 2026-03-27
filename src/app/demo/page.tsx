'use client';
import { useState, useEffect, useRef } from 'react';

type SevKey = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type VerdictKey = 'TP' | 'FP' | 'SUS';

const SEV_COLOR: Record<SevKey, string> = { CRITICAL:'#f0405e', HIGH:'#f97316', MEDIUM:'#f0a030', LOW:'#4f8fff' };
const VERDICT_COLOR: Record<VerdictKey, {c:string,bg:string}> = {
  TP:{c:'#f0405e',bg:'#f0405e12'},
  FP:{c:'#22d49a',bg:'#22d49a12'},
  SUS:{c:'#f0a030',bg:'#f0a03012'},
};

const SCENARIOS = [
  {
    id:'apt',
    title:'🎯 Multi-Stage APT Attack',
    sub:'Spear-phish → Credential dump → Lateral movement → C2',
    description:'A targeted spear-phishing campaign has breached your perimeter. Watch Watchtower detect the full kill chain across 8 security tools, correlate 9 alerts into a single attack narrative, and auto-respond — all in under 4 minutes.',
    duration:9,
    steps:[
      { t:0.8, src:'Proofpoint', sev:'HIGH' as SevKey, title:'Spear-phish email — CFO impersonation', mitre:'T1566.001', device:'laptop-CFO01', verdict:'TP' as VerdictKey, conf:89, action:'Email quarantined, user notified', aiNote:'Sender domain registered 3 days ago. Payload matches Qakbot campaign IOCs.', phase:'Initial Access' },
      { t:2.1, src:'Defender', sev:'CRITICAL' as SevKey, title:'Macro execution — suspicious child process', mitre:'T1059.003', device:'laptop-CFO01', verdict:'TP' as VerdictKey, conf:96, action:'Process killed, device isolated', aiNote:'cmd.exe spawned from WINWORD.EXE. Classic Office macro abuse. High confidence TP.', phase:'Execution' },
      { t:3.0, src:'CrowdStrike', sev:'CRITICAL' as SevKey, title:'LSASS memory access — credential dump', mitre:'T1003.001', device:'laptop-CFO01', verdict:'TP' as VerdictKey, conf:98, action:'Incident INC-0847 opened, admin_svc disabled', aiNote:'Mimikatz-style LSASS access. Service account credentials at risk. Immediate escalation.', phase:'Credential Access' },
      { t:4.2, src:'Taegis XDR', sev:'HIGH' as SevKey, title:'Lateral movement — admin_svc → SRV-FINANCE01', mitre:'T1021.002', device:'SRV-FINANCE01', verdict:'TP' as VerdictKey, conf:93, action:'Blocked SMB, account suspended', aiNote:'admin_svc authenticating to 4 hosts sequentially. Pattern matches worm-like spread.', phase:'Lateral Movement' },
      { t:5.1, src:'Splunk', sev:'HIGH' as SevKey, title:'PowerShell encoded command — download cradle', mitre:'T1105', device:'SRV-FINANCE01', verdict:'TP' as VerdictKey, conf:91, action:'Script blocked, hash added to blocklist', aiNote:'Base64 encoded payload. Resolves to known C2 infrastructure: 185.220.101.42.', phase:'C2 Setup' },
      { t:5.9, src:'Darktrace', sev:'CRITICAL' as SevKey, title:'Anomalous beaconing — 185.220.101.42:443', mitre:'T1071.001', device:'SRV-FINANCE01', verdict:'TP' as VerdictKey, conf:97, action:'IP blocked at perimeter, Zscaler policy updated', aiNote:'Darktrace: device behaviour deviation 98/100. C2 IP on ThreatFox, associated with LockBit.', phase:'C2 Active' },
      { t:7.0, src:'Sentinel', sev:'HIGH' as SevKey, title:'Azure AD: impossible travel login — admin account', mitre:'T1078.004', device:'cloud-identity', verdict:'TP' as VerdictKey, conf:88, action:'Session revoked, MFA re-enrolled', aiNote:'Login from UK then Singapore within 11 minutes. Impossible travel. Credential confirmed compromised.', phase:'Persistence' },
      { t:7.8, src:'Proofpoint', sev:'LOW' as SevKey, title:'Bulk email send from compromised account', mitre:'T1534', device:'cloud-email', verdict:'FP' as VerdictKey, conf:94, action:'Auto-closed — marketing campaign confirmed', aiNote:'Same user authorised bulk send for marketing. Cross-referenced Outlook calendar. FP.', phase:'Noise' },
      { t:8.8, src:'Defender', sev:'MEDIUM' as SevKey, title:'Scheduled task persistence — SRV-FINANCE01', mitre:'T1053.005', device:'SRV-FINANCE01', verdict:'TP' as VerdictKey, conf:85, action:'Task removed, host re-imaged queued', aiNote:'Persistence mechanism installed post-compromise. Task runs at logon, downloads additional payload.', phase:'Persistence' },
    ],
  },
  {
    id:'ransomware',
    title:'💀 Ransomware Pre-Cursor',
    sub:'Detect and kill ransomware before encryption starts',
    description:'Volume shadow copy deletion, rapid file enumeration, and a known ransomware binary — Watchtower identifies the pre-cursor pattern and isolates the host in 8 seconds, before a single file is encrypted.',
    duration:7,
    steps:[
      { t:0.6, src:'CrowdStrike', sev:'HIGH' as SevKey, title:'vssadmin: shadow copy deletion attempt', mitre:'T1490', device:'SRV-FILES01', verdict:'TP' as VerdictKey, conf:95, action:'Process blocked, host flagged', aiNote:'Classic ransomware pre-cursor. vssadmin delete shadows /all executed.', phase:'Defense Evasion' },
      { t:1.8, src:'Defender', sev:'CRITICAL' as SevKey, title:'Rapid file enumeration — 48k files in 3 seconds', mitre:'T1083', device:'SRV-FILES01', verdict:'TP' as VerdictKey, conf:99, action:'Host isolated — network cut', aiNote:'File traversal rate 16x baseline. Combined with shadow deletion: ransomware pre-encryption.', phase:'Impact' },
      { t:3.1, src:'Splunk', sev:'CRITICAL' as SevKey, title:'Known ransomware hash — LockBit 3.0', mitre:'T1486', device:'SRV-FILES01', verdict:'TP' as VerdictKey, conf:99, action:'Binary quarantined, IR team paged', aiNote:'Hash matches LockBit 3.0 variant. No files encrypted. Host isolated at T+8s from first detection.', phase:'Impact' },
      { t:4.5, src:'Taegis XDR', sev:'HIGH' as SevKey, title:'Same hash seen on 2 other hosts — spread detected', mitre:'T1210', device:'SRV-DB01, SRV-APP02', verdict:'TP' as VerdictKey, conf:92, action:'Both hosts isolated proactively', aiNote:'Lateral propagation via SMB. Watchtower proactively isolating all hosts with process lineage match.', phase:'Lateral Movement' },
      { t:5.8, src:'Sentinel', sev:'MEDIUM' as SevKey, title:'Azure backup jobs running — potential target', mitre:'T1537', device:'cloud-backup', verdict:'SUS' as VerdictKey, conf:68, action:'Backup accounts locked, IR notified', aiNote:'Unusual backup access during active incident. Precautionary lock applied pending IR review.', phase:'Exfiltration Risk' },
      { t:6.5, src:'Proofpoint', sev:'LOW' as SevKey, title:'External email alert — phishing link similar domain', mitre:'T1566', device:'all-users', verdict:'FP' as VerdictKey, conf:88, action:'Auto-closed — known pen test domain', aiNote:'Domain registered by internal red team. Confirmed FP via threat intel enrichment.', phase:'Noise' },
    ],
  },
  {
    id:'insider',
    title:'👤 Insider Threat',
    sub:'Detect data exfiltration before the employee leaves',
    description:'A departing employee begins downloading 40GB of IP to personal cloud storage. Watchtower correlates HR data (resignation notice), DLP alerts, and anomalous access patterns to surface the risk in real time.',
    duration:6,
    steps:[
      { t:0.9, src:'Zscaler', sev:'MEDIUM' as SevKey, title:'Abnormal upload volume — Google Drive 40GB', mitre:'T1567.002', device:'laptop-ENG05', verdict:'SUS' as VerdictKey, conf:74, action:'Upload throttled, HR notified', aiNote:'User ENG05 uploaded 40GB in 2 hours. Baseline is <500MB/day. Risk score elevated.', phase:'Exfiltration' },
      { t:2.1, src:'Splunk', sev:'HIGH' as SevKey, title:'Source code repo access — non-working hours', mitre:'T1213', device:'laptop-ENG05', verdict:'TP' as VerdictKey, conf:88, action:'Access revoked, DLP policy enforced', aiNote:'02:14 AM repo clone of entire product codebase. User has 3-day notice period. HR record cross-referenced.', phase:'Collection' },
      { t:3.4, src:'Defender', sev:'MEDIUM' as SevKey, title:'USB device connected — 128GB external drive', mitre:'T1052.001', device:'laptop-ENG05', verdict:'TP' as VerdictKey, conf:82, action:'USB blocked by policy, event logged', aiNote:'DLP policy triggered. USB write access denied. File access log captured.', phase:'Exfiltration' },
      { t:4.6, src:'Sentinel', sev:'LOW' as SevKey, title:'CISA KEV lookup on company systems', mitre:'T1592', device:'laptop-ENG05', verdict:'SUS' as VerdictKey, conf:55, action:'Flagged for analyst review', aiNote:'Searching for vulnerabilities in own company infra. Combined with other signals: elevated risk.', phase:'Reconnaissance' },
      { t:5.5, src:'Proofpoint', sev:'HIGH' as SevKey, title:'Bulk forward — inbox to personal Gmail', mitre:'T1114.003', device:'cloud-email', verdict:'TP' as VerdictKey, conf:93, action:'Forwarding rule deleted, account suspended', aiNote:'3,200 emails forwarded to personal account in last 48h. Matches exfiltration pattern.', phase:'Exfiltration' },
    ],
  },
];

type Step = typeof SCENARIOS[0]['steps'][0];

export default function DemoPage() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [activeView, setActiveView] = useState<'timeline'|'alert'>('timeline');
  const [postureScore, setPostureScore] = useState(82);
  const [toolsActive, setToolsActive] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scenario = SCENARIOS[scenarioIdx];
  const tpCount = steps.filter(s => s.verdict === 'TP').length;
  const fpCount = steps.filter(s => s.verdict === 'FP').length;

  function reset() {
    setRunning(false);
    setProgress(0);
    setSteps([]);
    setSelectedStep(null);
    setPostureScore(82);
    setToolsActive(new Set());
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function startSim() {
    reset();
    const sc = SCENARIOS[scenarioIdx];
    const totalMs = sc.duration * 1000;
    const startTime = Date.now();
    setRunning(true);
    const addedSteps = new Set<number>();

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const pct = Math.min((elapsed / sc.duration) * 100, 100);
      setProgress(pct);

      sc.steps.forEach((step, i) => {
        if (!addedSteps.has(i) && elapsed >= step.t) {
          addedSteps.add(i);
          setSteps(prev => [...prev, step]);
          setToolsActive(prev => new Set([...prev, step.src]));
          if (step.verdict === 'TP') setPostureScore(prev => Math.max(prev - 4, 44));
        }
      });

      if (elapsed >= sc.duration) {
        clearInterval(intervalRef.current!);
        setRunning(false);
        setProgress(100);
      }
    }, 100);
  }

  useEffect(() => { return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, []);

  const scoreColor = postureScore >= 75 ? '#22d49a' : postureScore >= 55 ? '#f0a030' : '#f0405e';
  const scoreGrade = postureScore >= 80 ? 'A' : postureScore >= 65 ? 'B' : postureScore >= 50 ? 'C' : 'D';
  const circumference = 2 * Math.PI * 42;
  const dashArray = `${(postureScore / 100) * circumference} ${circumference}`;
  const TOOLS_LIST = ['Proofpoint','CrowdStrike','Taegis XDR','Defender','Darktrace','Sentinel','Splunk','Zscaler'];

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#090d18', color:'#e6ecf8', fontFamily:'Inter,sans-serif', fontSize:14 }}>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        @keyframes slideIn{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes flash{0%{background:#4f8fff15}100%{background:transparent}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .step-new{animation:slideIn 0.35s ease,flash 0.7s ease}
        .sev-bar{width:4px;border-radius:2px;flex-shrink:0}
      `}</style>

      {/* BANNER */}
      <div style={{ textAlign:'center', padding:'7px 16px', background:'#3b8bff08', borderBottom:'1px solid #3b8bff15', fontSize:'0.74rem', color:'#50607a' }}>
        🎯 Interactive product walkthrough — select an attack scenario and press Play
        <a href='/signup' style={{ color:'#4f8fff', fontWeight:700, marginLeft:8 }}>Start free trial →</a>
      </div>

      {/* TOP BAR */}
      <div style={{ display:'flex', alignItems:'center', padding:'10px 20px', borderBottom:'1px solid #141820', gap:12 }}>
        <a href='/' style={{ display:'flex', alignItems:'center', gap:6, fontWeight:900, fontSize:'0.95rem', marginRight:'auto', textDecoration:'none', color:'#e6ecf8' }}>
          <div style={{ width:24,height:24,borderRadius:6,background:'linear-gradient(135deg,#4f8fff,#8b6fff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem',color:'#fff',fontWeight:900 }}>W</div>
          <span style={{ color:'#4f8fff' }}>Watch</span>tower
        </a>
        <span style={{ width:6,height:6,borderRadius:'50%',background:'#22c992',boxShadow:'0 0 6px #22c992',animation:'pulse 2s ease infinite',display:'block' }} />
        <span style={{ fontSize:'0.6rem', fontWeight:700, padding:'3px 10px', borderRadius:4, background:'#f0a03018', color:'#f0a030', border:'1px solid #f0a03028', letterSpacing:'0.5px' }}>DEMO ENVIRONMENT</span>
        <a href='/signup' style={{ padding:'7px 18px', borderRadius:8, background:'#4f8fff', color:'#fff', fontSize:'0.78rem', fontWeight:700, textDecoration:'none', transition:'all .15s' }}>Start Free Trial →</a>
      </div>

      {/* SCENARIO PICKER */}
      <div style={{ display:'flex', gap:8, padding:'12px 20px', borderBottom:'1px solid #141820', background:'#080a12', overflowX:'auto' }}>
        {SCENARIOS.map((sc,i) => (
          <button key={sc.id} onClick={() => { setScenarioIdx(i); reset(); }}
            style={{ padding:'8px 16px', borderRadius:9, border:`1px solid ${i===scenarioIdx ? '#4f8fff50' : '#1e2536'}`, background: i===scenarioIdx ? '#4f8fff12' : 'transparent', color: i===scenarioIdx ? '#e6ecf8' : '#50607a', fontWeight: i===scenarioIdx ? 700 : 500, fontSize:'0.78rem', cursor:'pointer', whiteSpace:'nowrap', transition:'all .15s', fontFamily:'Inter,sans-serif' }}>
            {sc.title}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', flex:1, overflow:'hidden' }}>

        {/* LEFT — Timeline */}
        <div style={{ padding:'16px 20px', overflow:'auto', borderRight:'1px solid #141820' }}>

          {/* Scenario Header */}
          <div style={{ padding:'18px 20px', background:'linear-gradient(145deg,#0a0d14,#0f1219)', border:'1px solid #141820', borderRadius:12, marginBottom:14 }}>
            <div style={{ fontSize:'0.92rem', fontWeight:800, marginBottom:5 }}>{scenario.title}</div>
            <div style={{ fontSize:'0.72rem', color:'#50607a', marginBottom:4 }}>{scenario.sub}</div>
            <p style={{ fontSize:'0.74rem', color:'#8a9ab8', lineHeight:1.65, marginBottom:14 }}>{scenario.description}</p>

            {!running && progress === 0 && (
              <button onClick={startSim} style={{ padding:'10px 28px', borderRadius:10, background:'linear-gradient(135deg,#4f8fff,#7c6aff)', color:'#fff', fontSize:'0.88rem', fontWeight:700, border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', boxShadow:'0 4px 20px rgba(79,143,255,0.3)' }}>
                ▶ Start Simulation
              </button>
            )}
            {running && (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, height:4, background:'#141820', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:'linear-gradient(90deg,#4f8fff,#7c6aff)', borderRadius:2, width:`${progress}%`, transition:'width 0.2s' }} />
                </div>
                <span style={{ fontSize:'0.66rem', color:'#50607a', fontFamily:'JetBrains Mono,monospace', whiteSpace:'nowrap' }}>{progress.toFixed(0)}%</span>
              </div>
            )}
            {!running && progress === 100 && (
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div style={{ fontSize:'0.78rem', color:'#22c992', fontWeight:700 }}>✓ Simulation complete — threat contained in {scenario.duration}s</div>
                <button onClick={() => { reset(); }} style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:7, border:'1px solid #1e2536', background:'transparent', color:'#8a9ab8', fontSize:'0.74rem', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>↺ Replay</button>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {steps.length === 0 && (
              <div style={{ textAlign:'center', padding:'50px 20px', color:'#50607a', fontSize:'0.82rem', lineHeight:1.6 }}>
                <div style={{ fontSize:'2rem', marginBottom:8 }}>🛡</div>
                Perimeter secure — press Play to watch an attack unfold and see how Watchtower responds
              </div>
            )}
            {steps.map((step, i) => {
              const isSel = selectedStep === step;
              return (
                <div key={i} className={i === steps.length-1 && running ? 'step-new' : ''}
                  onClick={() => { setSelectedStep(isSel ? null : step); setActiveView('alert'); }}
                  style={{ display:'flex', gap:0, cursor:'pointer', borderRadius:8, transition:'background .15s', background: isSel ? '#0d1220' : 'transparent' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:54, position:'relative' }}>
                    <span style={{ fontSize:'0.6rem', fontFamily:'JetBrains Mono,monospace', color:'#2a3a50', marginBottom:3, paddingTop:6 }}>T+{step.t.toFixed(1)}s</span>
                    <div style={{ width:10,height:10,borderRadius:'50%',background:SEV_COLOR[step.sev],boxShadow:`0 0 8px ${SEV_COLOR[step.sev]}60`,zIndex:1,flexShrink:0 }} />
                    {i < steps.length-1 && <div style={{ width:1, flex:1, background:'#141820', minHeight:20, marginTop:2 }} />}
                  </div>
                  <div style={{ flex:1, padding:'4px 10px 12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                      <span style={{ fontSize:'0.5rem', fontWeight:700, color:'#4a5568', textTransform:'uppercase', letterSpacing:'0.5px' }}>{step.phase}</span>
                    </div>
                    <div style={{ fontSize:'0.78rem', fontWeight:600, lineHeight:1.4, marginBottom:4 }}>{step.title}</div>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
                      <span style={{ fontSize:'0.5rem', fontWeight:700, padding:'1px 6px', borderRadius:3, background:'#4f8fff12', color:'#4f8fff', border:'1px solid #4f8fff18' }}>{step.src}</span>
                      <span style={{ fontSize:'0.5rem', fontWeight:700, color:'#7c6aff', fontFamily:'JetBrains Mono,monospace' }}>{step.mitre}</span>
                      <span style={{ fontSize:'0.48rem', color:'#2a3a50', fontFamily:'JetBrains Mono,monospace' }}>{step.device}</span>
                      <span style={{ marginLeft:'auto', fontSize:'0.52rem', fontWeight:800, color:VERDICT_COLOR[step.verdict].c, background:VERDICT_COLOR[step.verdict].bg, padding:'1px 6px', borderRadius:3, fontFamily:'JetBrains Mono,monospace' }}>{step.verdict} {step.conf}%</span>
                    </div>
                    <div style={{ fontSize:'0.68rem', color:'#22c992', marginTop:4 }}>⚡ {step.action}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Result Banner */}
          {progress === 100 && (
            <div style={{ padding:'16px 18px', background:'linear-gradient(145deg,#081410,#0a1512)', border:'1px solid #22c99228', borderRadius:12, marginTop:14 }}>
              <div style={{ fontSize:'0.88rem', fontWeight:800, color:'#22c992', marginBottom:12 }}>🏆 Attack Contained — Full AI Response Summary</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:14 }}>
                {[{val:steps.length,label:'Alerts Ingested',c:'#4f8fff'},{val:tpCount,label:'True Positives',c:'#f0405e'},{val:fpCount,label:'Auto-Closed FPs',c:'#22d49a'},{val:`${scenario.duration}s`,label:'Total Response',c:'#8b6fff'}].map(s => (
                  <div key={s.label} style={{ textAlign:'center', padding:'10px 4px', background:'#090d18', border:'1px solid #141820', borderRadius:8 }}>
                    <div style={{ fontSize:'1.4rem', fontWeight:900, fontFamily:'JetBrains Mono,monospace', color:s.c, letterSpacing:-1 }}>{s.val}</div>
                    <div style={{ fontSize:'0.47rem', color:'#50607a', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px', marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {steps.filter(s => s.verdict === 'TP').slice(0,4).map(s => (
                <div key={s.title} style={{ fontSize:'0.72rem', color:'#22c992', display:'flex', gap:8, padding:'3px 0', lineHeight:1.4 }}>
                  <span style={{ flexShrink:0 }}>✓</span>
                  <span><strong>{s.src}:</strong> {s.action}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={{ padding:'14px', display:'flex', flexDirection:'column', gap:8, overflow:'auto', background:'#07080f' }}>

          {/* Posture */}
          <div style={{ padding:'12px 14px', background:'#0a0d14', border:'1px solid #141820', borderRadius:12 }}>
            <div style={{ fontSize:'0.72rem', fontWeight:800, marginBottom:8, color:'#6b7a94' }}>🛡 Security Posture</div>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ position:'relative', width:70, height:70, flexShrink:0 }}>
                <svg viewBox='0 0 100 100' style={{ width:'100%', height:'100%' }}>
                  <circle cx={50} cy={50} r={42} fill='none' stroke='#141820' strokeWidth={7} />
                  <circle cx={50} cy={50} r={42} fill='none' stroke={scoreColor} strokeWidth={7} strokeDasharray={dashArray} strokeLinecap='round' transform='rotate(-90 50 50)' style={{ transition:'stroke-dasharray 0.8s ease,stroke 0.5s' }} />
                </svg>
                <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-62%)', fontSize:'1.4rem', fontWeight:900, fontFamily:'JetBrains Mono,monospace', color:scoreColor }}>{postureScore}</div>
                <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,45%)', fontSize:'0.65rem', fontWeight:800, color:scoreColor }}>{scoreGrade}</div>
              </div>
              <div>
                <div style={{ fontSize:'0.78rem', color:'#8a9ab8', lineHeight:1.6 }}>
                  {postureScore >= 75 ? 'Healthy posture' : postureScore >= 55 ? 'Under attack — degraded' : 'Critical — active incident'}<br />
                  <span style={{ fontSize:'0.65rem', color:'#50607a' }}>Updated live as AI responds</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Metrics */}
          <div style={{ padding:'12px 14px', background:'#0a0d14', border:'1px solid #141820', borderRadius:12 }}>
            <div style={{ fontSize:'0.72rem', fontWeight:800, marginBottom:8, color:'#6b7a94' }}>📊 Live Metrics</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:4 }}>
              {[{val:steps.length,label:'Alerts',c:'#4f8fff'},{val:steps.filter(s=>s.sev==='CRITICAL').length,label:'Critical',c:'#f0405e'},{val:tpCount,label:'TPs Escalated',c:'#f97316'},{val:fpCount,label:'FPs Closed',c:'#22d49a'}].map(s => (
                <div key={s.label} style={{ textAlign:'center', padding:'7px 2px', background:'#090d18', border:'1px solid #141820', borderRadius:6 }}>
                  <div style={{ fontSize:'1.1rem', fontWeight:900, fontFamily:'JetBrains Mono,monospace', letterSpacing:-1, color:s.c }}>{s.val}</div>
                  <div style={{ fontSize:'0.44rem', color:'#50607a', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tool Detection Status */}
          <div style={{ padding:'12px 14px', background:'#0a0d14', border:'1px solid #141820', borderRadius:12 }}>
            <div style={{ fontSize:'0.72rem', fontWeight:800, marginBottom:8, color:'#6b7a94' }}>🔌 Tool Detection Status</div>
            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
              {TOOLS_LIST.map(tool => {
                const active = toolsActive.has(tool);
                const count = steps.filter(s => s.src === tool).length;
                return (
                  <div key={tool} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.7rem', color: active ? '#e6ecf8' : '#50607a', padding:'3px 0', transition:'color 0.3s' }}>
                    <div style={{ width:6,height:6,borderRadius:'50%',background: active ? '#22c992' : '#252e42',boxShadow: active ? '0 0 6px #22c992' : 'none',flexShrink:0,transition:'all 0.3s' }} />
                    <span style={{ flex:1 }}>{tool}</span>
                    {count > 0 && <span style={{ fontSize:'0.58rem', fontFamily:'JetBrains Mono,monospace', color:'#4f8fff', fontWeight:700 }}>{count} alert{count > 1 ? 's' : ''}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert Detail */}
          {selectedStep && (
            <div style={{ padding:'12px 14px', background:'#0a101e', border:'1px solid #4f8fff28', borderRadius:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                <div className='sev-bar' style={{ height:16, background:SEV_COLOR[selectedStep.sev] }} />
                <span style={{ fontSize:'0.52rem', fontWeight:800, color:SEV_COLOR[selectedStep.sev], textTransform:'uppercase' }}>{selectedStep.sev}</span>
                <button onClick={() => setSelectedStep(null)} style={{ marginLeft:'auto', background:'none', border:'none', color:'#50607a', cursor:'pointer', fontSize:'0.9rem', lineHeight:1 }}>×</button>
              </div>
              <div style={{ fontSize:'0.8rem', fontWeight:700, lineHeight:1.4, marginBottom:8 }}>{selectedStep.title}</div>
              <div style={{ fontSize:'0.74rem', fontWeight:800, padding:'5px 10px', borderRadius:6, background:'#090d18', border:'1px solid #141820', marginBottom:10, color:VERDICT_COLOR[selectedStep.verdict].c, display:'inline-block' }}>
                {selectedStep.verdict === 'TP' ? 'TRUE POSITIVE' : selectedStep.verdict === 'FP' ? 'FALSE POSITIVE' : 'SUSPICIOUS'} — {selectedStep.conf}%
              </div>
              <div style={{ fontSize:'0.6rem', fontWeight:700, color:'#50607a', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>AI Analysis</div>
              <div style={{ fontSize:'0.72rem', color:'#8a9ab8', lineHeight:1.65, marginBottom:10 }}>{selectedStep.aiNote}</div>
              <div style={{ fontSize:'0.6rem', fontWeight:700, color:'#50607a', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Action Taken</div>
              <div style={{ fontSize:'0.72rem', color:'#22c992', display:'flex', gap:6 }}>
                <span>⚡</span><span>{selectedStep.action}</span>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:10, paddingTop:10, borderTop:'1px solid #141820', flexWrap:'wrap' }}>
                <span style={{ fontSize:'0.5rem', padding:'2px 8px', borderRadius:3, background:'#4f8fff12', color:'#4f8fff', border:'1px solid #4f8fff18', fontWeight:700 }}>{selectedStep.src}</span>
                <span style={{ fontSize:'0.5rem', padding:'2px 8px', borderRadius:3, background:'#7c6aff12', color:'#7c6aff', fontWeight:700, fontFamily:'JetBrains Mono,monospace' }}>{selectedStep.mitre}</span>
                <span style={{ fontSize:'0.5rem', padding:'2px 8px', borderRadius:3, background:'#141820', color:'#3a4a60', fontFamily:'JetBrains Mono,monospace' }}>{selectedStep.device}</span>
              </div>
            </div>
          )}

          {/* Explainer */}
          {!selectedStep && (
            <div style={{ padding:'12px 14px', background:'#0a0d14', border:'1px solid #141820', borderRadius:12 }}>
              <div style={{ fontSize:'0.72rem', fontWeight:800, marginBottom:8, color:'#6b7a94' }}>💡 What you&apos;re seeing</div>
              <div style={{ fontSize:'0.72rem', color:'#8a9ab8', lineHeight:1.75 }}>
                This is what Watchtower does automatically, 24/7. Every alert is triaged by AI in &lt;3.2 seconds — with a confidence score, evidence chain, and automated response action.<br /><br />
                Click any alert in the timeline to see the AI&apos;s full reasoning.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, padding:'14px 20px', borderTop:'1px solid #141820', background:'#080a12', flexWrap:'wrap' }}>
        <strong style={{ fontSize:'0.82rem' }}>This is what Watchtower does automatically, 24/7.</strong>
        <span style={{ fontSize:'0.78rem', color:'#8a9ab8' }}>Your analysts arrive to a clean queue — threats contained, noise eliminated.</span>
        <a href='/signup' style={{ padding:'8px 20px', borderRadius:8, background:'#4f8fff', color:'#fff', fontSize:'0.8rem', fontWeight:700, textDecoration:'none', whiteSpace:'nowrap' }}>Start 14-Day Free Trial →</a>
        <a href='/pricing' style={{ padding:'8px 18px', borderRadius:8, background:'transparent', color:'#8a9ab8', fontSize:'0.8rem', fontWeight:600, textDecoration:'none', border:'1px solid #252e42', whiteSpace:'nowrap' }}>View Pricing</a>
      </div>
    </div>
  );
}
