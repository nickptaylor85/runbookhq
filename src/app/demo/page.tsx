'use client';
import { useState, useEffect } from 'react';

const ALERTS = [
  { id: 'da-001', title: 'Suspicious PowerShell execution on WS042', severity: 'high', status: 'new', source: 'Defender', device: 'WS042.corp.local', user: 'jsmith', timestamp: new Date(Date.now() - 1800000).toISOString(), mitre: 'T1059.001' },
  { id: 'da-002', title: 'Credential dumping via LSASS memory access', severity: 'critical', status: 'investigating', source: 'Defender', device: 'SRV-DC01.corp.local', user: 'admin_svc', timestamp: new Date(Date.now() - 3600000).toISOString(), mitre: 'T1003.001' },
  { id: 'da-003', title: 'Outbound C2 beacon to known threat actor IP', severity: 'critical', status: 'new', source: 'Taegis XDR', device: 'WS015.corp.local', user: 'mthompson', timestamp: new Date(Date.now() - 900000).toISOString(), mitre: 'T1071.001' },
  { id: 'ta-001', title: 'Brute force authentication — 47 attempts in 10 min', severity: 'high', status: 'new', source: 'Taegis XDR', device: 'VPN-GW-01', user: 'multiple', timestamp: new Date(Date.now() - 2400000).toISOString(), mitre: 'T1110' },
  { id: 'ta-002', title: 'Anomalous 2.4GB data transfer to external IP', severity: 'high', status: 'new', source: 'Taegis XDR', device: 'WS033.corp.local', user: 'contractor-ext', timestamp: new Date(Date.now() - 4800000).toISOString(), mitre: 'T1048' },
  { id: 'da-005', title: 'Lateral movement via SMB from compromised account', severity: 'high', status: 'investigating', source: 'Defender', device: 'FS01.corp.local', user: 'admin_svc', timestamp: new Date(Date.now() - 5400000).toISOString(), mitre: 'T1021.002' },
  { id: 'da-006', title: 'Ransomware behavior — mass file encryption detected', severity: 'critical', status: 'new', source: 'Defender', device: 'WS088.corp.local', user: 'kpatel', timestamp: new Date(Date.now() - 600000).toISOString(), mitre: 'T1486' },
  { id: 'ta-003', title: 'Kerberoasting activity on domain controller', severity: 'critical', status: 'new', source: 'Taegis XDR', device: 'SRV-DC01.corp.local', user: 'admin_svc', timestamp: new Date(Date.now() - 1200000).toISOString(), mitre: 'T1558.003' },
  { id: 'da-007', title: 'MFA fatigue attack — 23 push notifications', severity: 'high', status: 'investigating', source: 'Defender', device: 'CLOUD-AAD', user: 'cdavis', timestamp: new Date(Date.now() - 2700000).toISOString(), mitre: 'T1621' },
  { id: 'da-008', title: 'Phishing email with weaponised Office macro', severity: 'medium', status: 'resolved', source: 'Defender', device: 'MAIL-GW', user: 'awilliams', timestamp: new Date(Date.now() - 14400000).toISOString(), mitre: 'T1566.001' },
  { id: 'ta-004', title: 'DNS tunnelling indicators on port 53', severity: 'high', status: 'new', source: 'Taegis XDR', device: 'WS042.corp.local', user: 'jsmith', timestamp: new Date(Date.now() - 3200000).toISOString(), mitre: 'T1572' },
  { id: 'da-009', title: 'Suspicious DLL side-loading detected', severity: 'medium', status: 'new', source: 'Defender', device: 'WS022.corp.local', user: 'jlee', timestamp: new Date(Date.now() - 9000000).toISOString(), mitre: 'T1574.002' },
];

function ago(ts: string) { const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000); if (s < 60) return s + 's'; if (s < 3600) return Math.floor(s / 60) + 'm'; if (s < 86400) return Math.floor(s / 3600) + 'h'; return Math.floor(s / 86400) + 'd'; }

export default function Demo() {
  const [tab, setTab] = useState<'overview'|'alerts'|'intel'>('overview');
  const [sel, setSel] = useState<any>(null);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [clock, setClock] = useState('');
  const [liveIntel, setLiveIntel] = useState<any>(null);

  useEffect(() => { const i = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { fetch('/api/live-intel').then(r => r.ok ? r.json() : null).then(d => { if (d) setLiveIntel(d); }).catch(() => {}); }, []);

  function simulateAI(alert: any) { setSel(alert); setAiLoading(true); setAiText(''); setTimeout(() => { setAiText('**Verdict: True Positive (92% confidence)**\n\nThis ' + alert.severity + ' alert on ' + alert.device + ' indicates ' + (alert.severity === 'critical' ? 'an active compromise requiring immediate containment.' : 'suspicious activity warranting investigation.') + '\n\n**MITRE ATT&CK:** ' + alert.mitre + '\n\n**Recommended Actions:**\n1. Isolate ' + alert.device + ' from the network immediately\n2. Capture memory dump and process tree for forensics\n3. Review authentication logs for ' + alert.user + ' (past 24h)\n4. Check for lateral movement indicators from this host\n5. Escalate to Tier 2 if C2 traffic confirmed\n\n**Risk Context:** This device has 3 other alerts in the past 7 days. The user account ' + alert.user + ' was also involved in a separate credential access alert 2 hours ago.'); setAiLoading(false); }, 1500); }

  const sevColor: Record<string, string> = { critical: '#ff4466', high: '#f97316', medium: '#ffb340', low: '#5b9aff' };
  const critCount = ALERTS.filter(a => a.severity === 'critical').length;
  const hourly = [3, 5, 2, 8, 4, 6, 3, 7, 5, 4, 6, 9, 5, 3, 4, 7, 8, 6, 4, 3, 5, 7, 6, 4];
  const maxH = Math.max(...hourly);

  return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="dm">
    <div className="dm-banner"><span>🏰 Interactive demo with live threat intelligence. </span><a href="/signup">Start your free trial →</a></div>

    <div className="dm-topbar"><div className="dm-logo"><div className="dm-logo-icon">W</div><span>Watch</span>tower</div><div className="dm-tabs"><button className={'dm-tab ' + (tab === 'overview' ? 'active' : '')} onClick={() => setTab('overview')}>◉ Overview</button><button className={'dm-tab ' + (tab === 'alerts' ? 'active' : '')} onClick={() => setTab('alerts')}>⚡ Alerts ({ALERTS.length})</button><button className={'dm-tab ' + (tab === 'intel' ? 'active' : '')} onClick={() => setTab('intel')}>🌐 Live Intel</button></div><div className="dm-right"><span className="dm-clock">{clock}</span><div className="dm-live" /><a href="/signup" className="dm-cta">Start Free Trial →</a></div></div>

    {tab === 'overview' && <div className="dm-main"><div className="dm-war-room">
      <div className="dm-left">
        <div className="dm-card dm-posture"><div className="dm-card-hd">🎯 Security Posture</div><div className="dm-posture-inner"><svg viewBox="0 0 120 80" width="130" height="90"><defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ff4466"/><stop offset="50%" stopColor="#ffb340"/><stop offset="100%" stopColor="#34e8a5"/></linearGradient></defs><path d="M 15 70 A 50 50 0 0 1 105 70" fill="none" stroke="#1e2840" strokeWidth="8" strokeLinecap="round"/><path d="M 15 70 A 50 50 0 0 1 105 70" fill="none" stroke="url(#pg)" strokeWidth="8" strokeLinecap="round" strokeDasharray="96.7 200"/></svg><div className="dm-posture-num">68</div><div className="dm-posture-grade">C</div></div><div className="dm-factors">{[{n:'Vuln Mgmt',v:45,c:'#ff4466'},{n:'Coverage',v:76,c:'#ffb340'},{n:'Response',v:82,c:'#34e8a5'},{n:'Compliance',v:61,c:'#ffb340'}].map(f=>(<div key={f.n} className="dm-factor"><span>{f.n}</span><div className="dm-fbar"><div style={{width:f.v+'%',background:f.c}}/></div><span className="dm-fval">{f.v}%</span></div>))}</div></div>
        <div className="dm-card dm-nr"><div className="dm-card-hd">🤖 AI Noise Reduction</div><div className="dm-nr-stats"><div><div className="dm-nr-val" style={{color:'#34e8a5'}}>247</div><div className="dm-nr-lbl">Auto-Closed</div></div><div><div className="dm-nr-val" style={{color:'#ffb340'}}>38</div><div className="dm-nr-lbl">Escalated</div></div><div><div className="dm-nr-val" style={{color:'#5b9aff'}}>87%</div><div className="dm-nr-lbl">FP Rate</div></div><div><div className="dm-nr-val" style={{color:'#34e8a5'}}>33h</div><div className="dm-nr-lbl">Saved</div></div></div><div className="dm-highlight">↑ Saved your team <strong>33 hours</strong> this week</div></div>
        <div className="dm-kpis">{[{v:ALERTS.length,l:'Alerts 24h',c:''},{v:critCount,l:'Critical',c:'#ff4466'},{v:'847',l:'Assets',c:''},{v:'76%',l:'Coverage',c:''},{v:'24m',l:'MTTR',c:'#34e8a5'},{v:'1,247',l:'ZIA Blocked',c:'#34e8a5'}].map(k=>(<div key={k.l} className="dm-kpi"><div className="dm-kpi-v" style={{color:k.c||'#eaf0ff'}}>{k.v}</div><div className="dm-kpi-l">{k.l}</div></div>))}</div>
        <div className="dm-card"><div className="dm-card-hd">📈 Hourly Alerts (24h)</div><div className="dm-hourly">{hourly.map((v,i)=>(<div key={i} className="dm-hbar" style={{height:Math.max(4,v/maxH*50)+'px',background:i===hourly.length-1?'#5b9aff':'#5b9aff40'}}/>))}</div></div>
      </div>
      <div className="dm-right-col">
        <div className="dm-card dm-stream-card"><div className="dm-card-hd">⚡ Live Alerts <div className="dm-live"/></div><div className="dm-stream">{ALERTS.slice(0,8).map(a=>(<div key={a.id} className="dm-si" onClick={()=>simulateAI(a)}><div className="dm-si-sev" style={{background:sevColor[a.severity]}}/><div className="dm-si-body"><div className="dm-si-title">{a.title}</div><div className="dm-si-meta"><span className="dm-src">{a.source}</span><span className="dm-ts">{ago(a.timestamp)}</span></div></div></div>))}</div></div>
      </div>
    </div></div>}

    {tab === 'alerts' && <div className="dm-main"><div className="dm-card" style={{padding:0,overflow:'hidden'}}><div className="dm-tbl-wrap"><table className="dm-tbl"><thead><tr><th>Alert</th><th>Source</th><th>Severity</th><th>Device</th><th>MITRE</th><th>Time</th><th>AI</th></tr></thead><tbody>{ALERTS.map(a=>(<tr key={a.id}><td style={{fontWeight:600,maxWidth:280}}>{a.title}</td><td><span className="dm-src">{a.source}</span></td><td><span className="dm-sev" style={{color:sevColor[a.severity],background:sevColor[a.severity]+'15'}}>{a.severity}</span></td><td style={{fontSize:'.72rem',color:'#8896b8'}}>{a.device}</td><td style={{fontSize:'.68rem',color:'#5b9aff'}}>{a.mitre}</td><td className="dm-ts">{ago(a.timestamp)}</td><td><button className="dm-ai-btn" onClick={()=>simulateAI(a)}>🤖 Triage</button></td></tr>))}</tbody></table></div></div></div>}

    {tab === 'intel' && <div className="dm-main">{liveIntel?.feeds?.map((feed: any) => feed.ok && (<div key={feed.name} className="dm-card" style={{marginBottom:10}}><div className="dm-card-hd">{feed.name === 'CISA KEV' ? '🛡' : feed.name === 'ThreatFox' ? '🦊' : '🔗'} {feed.name} <span className="dm-feed-count">{feed.count} indicators</span></div><div className="dm-feed-list">{(feed.items || []).map((item: any, i: number) => (<div key={i} className="dm-feed-item"><div className="dm-feed-sev" style={{background: item.severity === 'critical' ? '#ff4466' : '#f97316'}} /><div className="dm-feed-body"><div className="dm-feed-title">{item.title}</div><div className="dm-feed-detail">{item.detail}</div>{item.link && <a href={item.link} target="_blank" rel="noopener" className="dm-feed-link">View details →</a>}</div></div>))}</div></div>))}{!liveIntel && <div className="dm-card" style={{textAlign:'center',padding:40,color:'#4a5672'}}>Loading live threat intelligence...</div>}</div>}

    {sel && <div className="dm-overlay" onClick={() => setSel(null)}><div className="dm-modal" onClick={e => e.stopPropagation()}><div className="dm-modal-hd"><div><h3 style={{fontSize:'.9rem'}}>{sel.title}</h3><div style={{display:'flex',gap:4,marginTop:6}}><span className="dm-sev" style={{color:sevColor[sel.severity],background:sevColor[sel.severity]+'15'}}>{sel.severity}</span><span className="dm-src">{sel.source}</span><span style={{fontSize:'.62rem',color:'#5b9aff'}}>{sel.mitre}</span><span style={{fontSize:'.62rem',color:'#4a5672'}}>{sel.device}</span></div></div><button onClick={() => setSel(null)} style={{background:'none',border:'none',color:'#8896b8',fontSize:'1.2rem',cursor:'pointer'}}>✕</button></div><div className="dm-modal-body">{aiLoading ? <div style={{textAlign:'center',padding:30}}><div className="dm-spinner" /><div style={{marginTop:12,fontSize:'.78rem',color:'#8896b8'}}>AI analysing alert...</div></div> : <div className="dm-ai-response">{aiText.split('\n').map((line, i) => line ? <p key={i} style={{marginBottom:6}} dangerouslySetInnerHTML={{__html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}} /> : <br key={i} />)}</div>}<div className="dm-modal-cta"><a href="/signup" className="dm-cta">Try AI Co-Pilot on your real alerts →</a></div></div></div></div>}

    <div className="dm-bottom"><div className="dm-bottom-inner"><strong>Ready to connect your tools?</strong> Watchtower integrates with Tenable, Taegis, Defender, CrowdStrike, Zscaler, and 15+ more. Live threat intel from CISA, ThreatFox, and URLhaus included free.<a href="/signup" className="dm-cta">Start Free 14-Day Trial →</a></div></div>
  </div></>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#05070c;color:#eaf0ff;font-family:'DM Sans',sans-serif}
.dm{min-height:100vh;display:flex;flex-direction:column}
.dm-banner{display:flex;align-items:center;justify-content:center;padding:8px 16px;background:linear-gradient(90deg,#5b9aff10,#8b6fff10);border-bottom:1px solid #5b9aff15;font-size:.78rem;gap:6px;flex-wrap:wrap;text-align:center}
.dm-banner a{color:#5b9aff;font-weight:700;text-decoration:none}
.dm-topbar{display:flex;align-items:center;padding:0 16px;height:48px;border-bottom:1px solid #141928;gap:12px}
.dm-logo{display:flex;align-items:center;gap:6px;font-weight:900;font-size:.95rem;letter-spacing:-.5px;flex-shrink:0}
.dm-logo-icon{width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#5b9aff,#8b6fff);display:flex;align-items:center;justify-content:center;font-size:.6rem;color:#fff;font-weight:900}
.dm-logo span{color:#5b9aff}
.dm-tabs{display:flex;gap:3px;margin-left:8px}
.dm-tab{padding:5px 12px;border:1px solid #1e2840;border-radius:7px;background:transparent;color:#8896b8;font-size:.7rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.dm-tab:hover{border-color:#5b9aff;color:#5b9aff}.dm-tab.active{background:#5b9aff15;border-color:#5b9aff;color:#5b9aff}
.dm-right{display:flex;align-items:center;gap:10px;margin-left:auto}
.dm-clock{font-size:.7rem;font-family:'JetBrains Mono',monospace;color:#4a5672}
.dm-live{width:6px;height:6px;border-radius:50%;background:#34e8a5;box-shadow:0 0 6px #34e8a5;animation:pulse 2s ease infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.dm-cta{padding:6px 16px;border-radius:7px;background:linear-gradient(135deg,#5b9aff,#8b6fff);color:#fff;font-size:.75rem;font-weight:700;text-decoration:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap;box-shadow:0 2px 10px rgba(91,154,255,.2)}
.dm-cta:hover{box-shadow:0 4px 16px rgba(91,154,255,.35)}
.dm-main{padding:12px 16px;flex:1}
.dm-war-room{display:grid;grid-template-columns:1fr 280px;gap:10px}
.dm-left{display:flex;flex-direction:column;gap:8px}
.dm-right-col{display:flex;flex-direction:column}
.dm-card{background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #141928;border-radius:12px;padding:14px}
.dm-card-hd{font-size:.75rem;font-weight:800;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.dm-posture{display:flex;flex-direction:column}
.dm-posture-inner{position:relative;display:flex;justify-content:center;align-items:center;margin-bottom:8px}
.dm-posture-num{position:absolute;font-size:2rem;font-weight:900;font-family:'JetBrains Mono',monospace;top:32px}
.dm-posture-grade{position:absolute;font-size:.6rem;font-weight:800;color:#ffb340;top:60px}
.dm-factors{display:flex;flex-direction:column;gap:5px}
.dm-factor{display:flex;align-items:center;gap:6px;font-size:.65rem}
.dm-factor span:first-child{min-width:80px;color:#8896b8;font-weight:600}
.dm-fbar{flex:1;height:5px;background:#141928;border-radius:3px;overflow:hidden}
.dm-fbar div{height:100%;border-radius:3px}
.dm-fval{font-size:.6rem;font-family:'JetBrains Mono',monospace;color:#4a5672;min-width:28px;text-align:right}
.dm-nr-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px}
.dm-nr-val{font-size:1.1rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-1px;text-align:center}
.dm-nr-lbl{font-size:.48rem;color:#4a5672;font-weight:700;text-transform:uppercase;letter-spacing:.3px;text-align:center}
.dm-highlight{font-size:.68rem;color:#8896b8;text-align:center;padding:6px;background:#34e8a508;border:1px solid #34e8a515;border-radius:6px}
.dm-highlight strong{color:#34e8a5}
.dm-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.dm-kpi{background:#0a0d15;border:1px solid #141928;border-radius:10px;padding:10px;text-align:center}
.dm-kpi-v{font-size:1.2rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-1px;line-height:1.2}
.dm-kpi-l{font-size:.48rem;font-weight:700;color:#4a5672;text-transform:uppercase;letter-spacing:.4px;margin-top:2px}
.dm-hourly{display:flex;gap:2px;align-items:flex-end;height:55px;padding:4px 0}
.dm-hbar{flex:1;border-radius:2px;min-width:0;transition:height .3s}
.dm-stream-card{display:flex;flex-direction:column;height:100%}
.dm-stream{flex:1;overflow-y:auto}
.dm-si{display:flex;gap:6px;padding:7px 0;border-bottom:1px solid #0f1219;cursor:pointer;transition:background .15s}
.dm-si:hover{background:#14192808}
.dm-si-sev{width:3px;border-radius:2px;flex-shrink:0}
.dm-si-body{flex:1;overflow:hidden}
.dm-si-title{font-size:.68rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dm-si-meta{display:flex;gap:5px;margin-top:2px}
.dm-src{font-size:.52rem;font-weight:700;padding:1px 5px;border-radius:3px;background:#5b9aff15;color:#5b9aff}
.dm-ts{font-size:.55rem;color:#4a5672;font-family:'JetBrains Mono',monospace}
.dm-tbl-wrap{overflow-x:auto}
.dm-tbl{width:100%;border-collapse:collapse;font-size:.76rem}
.dm-tbl th{text-align:left;padding:8px 10px;font-size:.52rem;color:#4a5672;font-weight:800;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #1e2840}
.dm-tbl td{padding:8px 10px;border-bottom:1px solid #0f1219}
.dm-tbl tr:hover td{background:#0a0d1580}
.dm-sev{font-size:.56rem;font-weight:700;padding:2px 6px;border-radius:4px}
.dm-ai-btn{padding:3px 8px;border:1px solid #5b9aff30;border-radius:5px;background:#5b9aff10;color:#5b9aff;font-size:.6rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.dm-ai-btn:hover{background:#5b9aff20}
.dm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
.dm-modal{background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #1e2840;border-radius:14px;max-width:580px;width:100%;max-height:85vh;overflow-y:auto}
.dm-modal-hd{display:flex;justify-content:space-between;padding:16px;border-bottom:1px solid #141928}
.dm-modal-hd h3{font-size:.88rem;font-weight:800}
.dm-modal-body{padding:16px}
.dm-ai-response{font-size:.8rem;color:#c8d0e4;line-height:1.7}
.dm-ai-response strong{color:#eaf0ff}
.dm-ai-response p{margin-bottom:4px}
.dm-spinner{width:28px;height:28px;border:3px solid #1e2840;border-top-color:#5b9aff;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto}
@keyframes spin{to{transform:rotate(360deg)}}
.dm-modal-cta{margin-top:16px;padding-top:14px;border-top:1px solid #141928;text-align:center}
.dm-bottom{border-top:1px solid #141928;background:#0a0d15;padding:16px}
.dm-bottom-inner{display:flex;align-items:center;justify-content:center;gap:14px;font-size:.82rem;color:#8896b8;flex-wrap:wrap;text-align:center}
.dm-bottom-inner strong{color:#eaf0ff}
.dm-feed-count{font-size:.58rem;color:#4a5672;font-weight:600;margin-left:auto}
.dm-feed-list{display:flex;flex-direction:column}
.dm-feed-item{display:flex;gap:8px;padding:8px 0;border-bottom:1px solid #0f1219}
.dm-feed-sev{width:3px;border-radius:2px;flex-shrink:0}
.dm-feed-body{flex:1;overflow:hidden}
.dm-feed-title{font-size:.72rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dm-feed-detail{font-size:.62rem;color:#4a5672;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dm-feed-link{font-size:.55rem;color:#5b9aff;text-decoration:none;margin-top:3px;display:inline-block}
@media(max-width:768px){.dm-war-room{grid-template-columns:1fr!important}.dm-kpis{grid-template-columns:repeat(2,1fr)}.dm-topbar{height:auto;padding:8px 12px;flex-wrap:wrap}.dm-tabs{margin-left:0}.dm-right{margin-left:0;width:100%;justify-content:space-between}.dm-stream-card{max-height:250px}}`;
