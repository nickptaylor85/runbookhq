'use client';
import { useState, useEffect } from 'react';

const ATTACK = [
  { id: 'a1', time: '09:14', title: 'Phishing email delivered — weaponised macro targeting finance team', sev: 'high', src: 'Proofpoint', device: 'MAIL-GW', user: 'jsmith', mitre: 'T1566.001', verdict: 'tp', conf: 96, phase: 'Initial Access' },
  { id: 'a2', time: '09:22', title: 'Suspicious PowerShell execution from outlook.exe child process', sev: 'high', src: 'CrowdStrike', device: 'WS042.corp.local', user: 'jsmith', mitre: 'T1059.001', verdict: 'tp', conf: 94, phase: 'Execution' },
  { id: 'a3', time: '09:25', title: 'Outbound C2 beacon to 185.220.101.42 (Cobalt Strike)', sev: 'critical', src: 'Taegis XDR', device: 'WS015.corp.local', user: 'mthompson', mitre: 'T1071.001', verdict: 'tp', conf: 97, phase: 'Command & Control' },
  { id: 'a4', time: '09:31', title: 'Credential dumping via LSASS memory access on domain controller', sev: 'critical', src: 'Defender', device: 'SRV-DC01.corp.local', user: 'admin_svc', mitre: 'T1003.001', verdict: 'tp', conf: 98, phase: 'Credential Access' },
  { id: 'a5', time: '09:38', title: 'Lateral movement via SMB from compromised service account', sev: 'high', src: 'Darktrace', device: 'FS01.corp.local', user: 'admin_svc', mitre: 'T1021.002', verdict: 'tp', conf: 89, phase: 'Lateral Movement' },
  { id: 'a6', time: '09:42', title: 'Kerberoasting activity — TGS tickets requested for service accounts', sev: 'critical', src: 'Sentinel', device: 'SRV-DC01.corp.local', user: 'admin_svc', mitre: 'T1558.003', verdict: 'tp', conf: 95, phase: 'Privilege Escalation' },
  { id: 'a7', time: '09:48', title: 'Anomalous 2.4GB data transfer to external IP', sev: 'high', src: 'Taegis XDR', device: 'FS01.corp.local', user: 'contractor-ext', mitre: 'T1048', verdict: 'tp', conf: 91, phase: 'Exfiltration' },
  { id: 'a8', time: '09:52', title: 'Brute force authentication — 47 attempts on VPN gateway', sev: 'medium', src: 'Splunk', device: 'VPN-GW-01', user: 'multiple', mitre: 'T1110', verdict: 'suspicious', conf: 72, phase: 'Noise' },
  { id: 'a9', time: '09:55', title: 'DNS tunnelling detected — encoded exfiltration channel', sev: 'high', src: 'Zscaler ZIA', device: 'WS042.corp.local', user: 'jsmith', mitre: 'T1572', verdict: 'tp', conf: 86, phase: 'Exfiltration' },
];

const sevC: Record<string, string> = { critical: '#f0405e', high: '#f0a030', medium: '#e8993a', low: '#3b8bff' };
const verdC: Record<string, string> = { tp: '#f0405e', fp: '#22c992', suspicious: '#e8993a' };

export default function Demo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selAlert, setSelAlert] = useState<any>(null);
  const [triaged, setTriaged] = useState(false);
  const [clock, setClock] = useState('');

  useEffect(() => { const i = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000); return () => clearInterval(i); }, []);

  useEffect(() => { if (!playing) return; if (step >= ATTACK.length) { setPlaying(false); setTriaged(true); return; } const t = setTimeout(() => setStep(s => s + 1), 800); return () => clearTimeout(t); }, [playing, step]);

  const visible = ATTACK.slice(0, step);
  const tpCount = visible.filter(a => a.verdict === 'tp').length;
  const susCount = visible.filter(a => a.verdict === 'suspicious').length;
  const critCount = visible.filter(a => a.sev === 'critical').length;
  const autoActions = triaged ? 6 : 0;

  function startReplay() { setStep(0); setTriaged(false); setSelAlert(null); setPlaying(true); }

  return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="dm">
    <div className="dm-banner">🏰 You're watching a simulated APT attack — and how Watchtower responds automatically.<a href="/signup"> Start your free trial →</a></div>

    <div className="dm-top"><div className="dm-logo"><div className="dm-li">W</div><span>Watch</span>tower</div><div className="dm-clock">{clock}</div><div className="dm-live" /><a href="/signup" className="dm-cta">Start Free Trial →</a></div>

    <div className="dm-cols">
      <div className="dm-left">
        <div className="dm-scenario"><div className="dm-scenario-hd">🎯 Scenario: Operation Midnight</div><p>A targeted phishing campaign has breached your perimeter. Watch Watchtower detect, correlate, triage, and respond to a multi-stage APT attack across 6 security tools — without any human intervention.</p>{!playing && step === 0 && <button className="dm-play" onClick={startReplay}>▶ Start Attack Simulation</button>}{!playing && step > 0 && <button className="dm-play" onClick={startReplay}>↻ Replay</button>}{playing && <div className="dm-progress"><div className="dm-pbar"><div style={{ width: (step / ATTACK.length * 100) + '%' }} /></div><span>{step}/{ATTACK.length} alerts ingested</span></div>}</div>

        <div className="dm-timeline">{visible.map((a, i) => (<div key={a.id} className={'dm-tl-item' + (i === visible.length - 1 && playing ? ' new' : '')} onClick={() => setSelAlert(a)}>
          <div className="dm-tl-time">{a.time}</div>
          <div className="dm-tl-dot" style={{ background: sevC[a.sev] }} />
          <div className="dm-tl-body">
            <div className="dm-tl-phase">{a.phase}</div>
            <div className="dm-tl-title">{a.title}</div>
            <div className="dm-tl-meta"><span className="dm-src">{a.src}</span><span className="dm-mitre">{a.mitre}</span>{triaged && <span className="dm-verdict" style={{ color: verdC[a.verdict], background: verdC[a.verdict] + '15' }}>{a.verdict === 'tp' ? 'TRUE POSITIVE' : a.verdict === 'fp' ? 'FALSE POSITIVE' : 'SUSPICIOUS'} ({a.conf}%)</span>}</div>
          </div>
        </div>))}{visible.length === 0 && <div className="dm-tl-empty">Press "Start Attack Simulation" to begin</div>}</div>

        {triaged && <div className="dm-result"><div className="dm-result-hd">🤖 Watchtower Auto-Response — 3.2 seconds</div><div className="dm-result-grid"><div className="dm-result-item"><div className="dm-ri-val" style={{ color: '#f0405e' }}>{tpCount}</div><div className="dm-ri-label">True Positives</div></div><div className="dm-result-item"><div className="dm-ri-val" style={{ color: '#e8993a' }}>{susCount}</div><div className="dm-ri-label">Suspicious</div></div><div className="dm-result-item"><div className="dm-ri-val" style={{ color: '#22c992' }}>{autoActions}</div><div className="dm-ri-label">Auto-Actions</div></div><div className="dm-result-item"><div className="dm-ri-val" style={{ color: '#3b8bff' }}>1</div><div className="dm-ri-label">Incident Created</div></div></div><div className="dm-result-actions"><div className="dm-ra">✓ Auto-escalated to Incident #INC-2024-0847</div><div className="dm-ra">✓ Isolated WS042 + WS015 via Taegis XDR</div><div className="dm-ra">✓ Disabled admin_svc account</div><div className="dm-ra">✓ Blocked 185.220.101.42 at perimeter</div><div className="dm-ra">✓ Notified SOC Slack channel</div><div className="dm-ra">✓ Generated full response runbook (14 steps)</div></div></div>}
      </div>

      <div className="dm-right">
        <div className="dm-card"><div className="dm-card-hd">📊 Live Stats</div><div className="dm-stats"><div className="dm-stat"><div className="dm-stat-v">{visible.length}</div><div className="dm-stat-l">Alerts</div></div><div className="dm-stat"><div className="dm-stat-v" style={{ color: '#f0405e' }}>{critCount}</div><div className="dm-stat-l">Critical</div></div><div className="dm-stat"><div className="dm-stat-v">6</div><div className="dm-stat-l">Sources</div></div><div className="dm-stat"><div className="dm-stat-v" style={{ color: '#22c992' }}>68</div><div className="dm-stat-l">Posture</div></div></div></div>

        <div className="dm-card"><div className="dm-card-hd">🛡 Tools Detecting</div><div className="dm-tools-list">{['Proofpoint', 'CrowdStrike', 'Taegis XDR', 'Defender', 'Darktrace', 'Sentinel', 'Splunk', 'Zscaler ZIA'].map(t => { const active = visible.some(a => a.src === t); return <div key={t} className={'dm-tool-item' + (active ? ' active' : '')}><div className={'dm-tool-dot' + (active ? ' on' : '')} />{t}</div>; })}</div></div>

        {selAlert && <div className="dm-card dm-detail"><div className="dm-card-hd">🤖 AI Analysis<button onClick={() => setSelAlert(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#50607a', cursor: 'pointer' }}>✕</button></div><div className="dm-detail-title">{selAlert.title}</div><div className="dm-detail-meta"><span className="dm-src">{selAlert.src}</span><span style={{ color: sevC[selAlert.sev], fontSize: '.62rem', fontWeight: 700 }}>{selAlert.sev}</span><span className="dm-mitre">{selAlert.mitre}</span></div>{triaged && <><div className="dm-verdict-big" style={{ color: verdC[selAlert.verdict] }}>{selAlert.verdict === 'tp' ? 'TRUE POSITIVE' : selAlert.verdict === 'suspicious' ? 'SUSPICIOUS' : 'FALSE POSITIVE'} — {selAlert.conf}% confidence</div><div className="dm-detail-cta"><a href="/signup" className="dm-cta" style={{ fontSize: '.72rem' }}>See full AI analysis in your trial →</a></div></>}</div>}

        {!selAlert && <div className="dm-card"><div className="dm-card-hd">💡 What You're Seeing</div><div className="dm-explainer">{step === 0 ? 'This demo simulates a real APT attack chain across your security stack. Watchtower ingests alerts from 6 different tools, correlates them into an attack narrative, and auto-responds — all without human intervention.' : step < ATTACK.length ? 'Alerts are flowing in from multiple tools as the attack progresses. Watchtower is correlating them in real-time. Click any alert to inspect it.' : 'All 9 alerts triaged in 3.2 seconds. 8 confirmed true positives from a single attack campaign. Watchtower auto-isolated compromised devices, disabled the stolen account, blocked the C2 IP, and created an incident with a full response runbook. A human analyst would take 45+ minutes for this.'}</div></div>}
      </div>
    </div>

    <div className="dm-bottom"><strong>This is what Watchtower does every day, automatically.</strong> Connect your tools and let AI handle the noise while your analysts focus on what matters.<a href="/signup" className="dm-cta">Start 14-Day Free Trial →</a><a href="/pricing" className="dm-cta-ghost">View Pricing</a></div>
  </div></>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#060910;color:#e6ecf8;font-family:'Outfit',sans-serif}
.dm{min-height:100vh;display:flex;flex-direction:column}
.dm-banner{text-align:center;padding:8px 16px;background:#3b8bff08;border-bottom:1px solid #3b8bff15;font-size:.76rem;color:#8a9ab8}
.dm-banner a{color:#3b8bff;font-weight:700;text-decoration:none;margin-left:6px}
.dm-top{display:flex;align-items:center;padding:12px 20px;border-bottom:1px solid #1a2030;gap:12px}
.dm-logo{display:flex;align-items:center;gap:6px;font-weight:900;font-size:.95rem;margin-right:auto}
.dm-li{width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#3b8bff,#7c6aff);display:flex;align-items:center;justify-content:center;font-size:.6rem;color:#fff;font-weight:900}
.dm-logo span{color:#3b8bff}
.dm-clock{font-size:.7rem;font-family:'JetBrains Mono',monospace;color:#50607a}
.dm-live{width:6px;height:6px;border-radius:50%;background:#22c992;box-shadow:0 0 6px #22c992;animation:pulse 2s ease infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.dm-cta{padding:7px 18px;border-radius:8px;background:#3b8bff;color:#fff;font-size:.78rem;font-weight:700;text-decoration:none;border:none;cursor:pointer;font-family:'Outfit',sans-serif;white-space:nowrap}
.dm-cta-ghost{padding:7px 18px;border-radius:8px;background:transparent;color:#8a9ab8;font-size:.78rem;font-weight:600;text-decoration:none;border:1px solid #252e42;cursor:pointer;font-family:'Outfit',sans-serif;white-space:nowrap}
.dm-cols{display:grid;grid-template-columns:1fr 320px;gap:0;flex:1}
.dm-left{padding:16px 20px;border-right:1px solid #1a2030;overflow-y:auto}
.dm-right{padding:16px;display:flex;flex-direction:column;gap:10px;overflow-y:auto}
.dm-scenario{padding:20px;background:linear-gradient(145deg,#0b0f18,#10141e);border:1px solid #1a2030;border-radius:12px;margin-bottom:14px}
.dm-scenario-hd{font-size:.92rem;font-weight:800;margin-bottom:6px}
.dm-scenario p{font-size:.78rem;color:#8a9ab8;line-height:1.6;margin-bottom:12px}
.dm-play{padding:10px 24px;border-radius:10px;background:linear-gradient(135deg,#3b8bff,#7c6aff);color:#fff;font-size:.88rem;font-weight:700;border:none;cursor:pointer;font-family:'Outfit',sans-serif;box-shadow:0 4px 20px rgba(59,139,255,.25);transition:all .2s}
.dm-play:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(59,139,255,.35)}
.dm-progress{display:flex;align-items:center;gap:10px}
.dm-pbar{flex:1;height:4px;background:#1a2030;border-radius:2px;overflow:hidden}
.dm-pbar div{height:100%;background:linear-gradient(90deg,#3b8bff,#7c6aff);border-radius:2px;transition:width .3s}
.dm-progress span{font-size:.68rem;color:#50607a;font-family:'JetBrains Mono',monospace;white-space:nowrap}
.dm-timeline{display:flex;flex-direction:column;gap:2px}
.dm-tl-item{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #10141e;cursor:pointer;transition:background .15s;animation:slideIn .3s ease}
.dm-tl-item:hover{background:#0b0f1880}
.dm-tl-item.new{animation:slideIn .3s ease,flash .5s ease}
@keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
@keyframes flash{0%{background:#3b8bff10}100%{background:transparent}}
.dm-tl-time{font-size:.68rem;font-family:'JetBrains Mono',monospace;color:#50607a;min-width:38px;padding-top:3px}
.dm-tl-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px;box-shadow:0 0 6px currentColor}
.dm-tl-body{flex:1}
.dm-tl-phase{font-size:.55rem;font-weight:700;color:#50607a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.dm-tl-title{font-size:.78rem;font-weight:600}
.dm-tl-meta{display:flex;gap:5px;margin-top:4px;flex-wrap:wrap;align-items:center}
.dm-src{font-size:.52rem;font-weight:700;padding:1px 6px;border-radius:3px;background:#3b8bff12;color:#3b8bff}
.dm-mitre{font-size:.52rem;font-weight:600;color:#7c6aff;font-family:'JetBrains Mono',monospace}
.dm-verdict{font-size:.52rem;font-weight:700;padding:1px 6px;border-radius:3px}
.dm-tl-empty{text-align:center;padding:40px;color:#50607a;font-size:.82rem}
.dm-result{padding:18px;background:linear-gradient(145deg,#0b0f18,#10141e);border:1px solid #22c99230;border-radius:12px;margin-top:14px}
.dm-result-hd{font-size:.88rem;font-weight:800;margin-bottom:12px;color:#22c992}
.dm-result-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}
.dm-result-item{text-align:center;padding:10px;background:#060910;border-radius:8px;border:1px solid #1a2030}
.dm-ri-val{font-size:1.4rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-1px}
.dm-ri-label{font-size:.5rem;color:#50607a;font-weight:600;text-transform:uppercase;letter-spacing:.3px;margin-top:2px}
.dm-result-actions{display:flex;flex-direction:column;gap:4px}
.dm-ra{font-size:.72rem;color:#22c992;padding:4px 0}
.dm-card{background:linear-gradient(145deg,#0b0f18,#10141e);border:1px solid #1a2030;border-radius:12px;padding:14px}
.dm-card-hd{font-size:.75rem;font-weight:800;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.dm-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.dm-stat{text-align:center;padding:8px;background:#060910;border-radius:8px;border:1px solid #1a2030}
.dm-stat-v{font-size:1.3rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-1px}
.dm-stat-l{font-size:.48rem;color:#50607a;font-weight:600;text-transform:uppercase;letter-spacing:.3px}
.dm-tools-list{display:flex;flex-direction:column;gap:4px}
.dm-tool-item{display:flex;align-items:center;gap:8px;font-size:.72rem;color:#50607a;padding:4px 0;transition:color .3s}
.dm-tool-item.active{color:#e6ecf8}
.dm-tool-dot{width:6px;height:6px;border-radius:50%;background:#252e42;flex-shrink:0;transition:all .3s}
.dm-tool-dot.on{background:#22c992;box-shadow:0 0 6px #22c992}
.dm-detail{border-color:#3b8bff30}
.dm-detail-title{font-size:.85rem;font-weight:700;margin-bottom:6px}
.dm-detail-meta{display:flex;gap:5px;margin-bottom:10px;flex-wrap:wrap;align-items:center}
.dm-verdict-big{font-size:.78rem;font-weight:800;margin-bottom:10px}
.dm-detail-cta{padding-top:10px;border-top:1px solid #1a2030;text-align:center}
.dm-explainer{font-size:.76rem;color:#8a9ab8;line-height:1.7}
.dm-bottom{display:flex;align-items:center;justify-content:center;gap:14px;padding:18px;border-top:1px solid #1a2030;background:#0b0f18;flex-wrap:wrap;text-align:center;font-size:.82rem;color:#8a9ab8}
.dm-bottom strong{color:#e6ecf8}
@media(max-width:768px){.dm-cols{grid-template-columns:1fr}.dm-right{border-top:1px solid #1a2030}.dm-result-grid{grid-template-columns:repeat(2,1fr)}}`;
