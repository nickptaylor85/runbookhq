'use client';
import { useState, useEffect, useCallback } from 'react';

const DEMO_ALERTS = [
  { id: 'da-001', title: 'Suspicious PowerShell execution on WS042', severity: 'high', status: 'new', source: 'Defender', category: 'Execution', device: 'WS042.corp.local', user: 'jsmith', timestamp: new Date(Date.now() - 1800000).toISOString(), mitre: 'T1059.001' },
  { id: 'da-002', title: 'Credential dumping via LSASS memory access', severity: 'critical', status: 'investigating', source: 'Defender', category: 'Credential Access', device: 'SRV-DC01.corp.local', user: 'admin_svc', timestamp: new Date(Date.now() - 3600000).toISOString(), mitre: 'T1003.001' },
  { id: 'da-003', title: 'Outbound C2 beacon to known threat actor IP', severity: 'critical', status: 'new', source: 'Taegis XDR', category: 'C2', device: 'WS015.corp.local', user: 'mthompson', timestamp: new Date(Date.now() - 900000).toISOString(), mitre: 'T1071.001' },
  { id: 'da-004', title: 'Phishing email with weaponised attachment', severity: 'medium', status: 'resolved', source: 'Defender', category: 'Initial Access', device: 'MAIL-GW', user: 'awilliams', timestamp: new Date(Date.now() - 14400000).toISOString(), mitre: 'T1566.001' },
  { id: 'ta-001', title: 'Brute force authentication — 47 attempts in 10 min', severity: 'high', status: 'new', source: 'Taegis XDR', category: 'Credential Access', device: 'VPN-GW-01', user: 'multiple', timestamp: new Date(Date.now() - 2400000).toISOString(), mitre: 'T1110' },
  { id: 'ta-002', title: 'Anomalous 2.4GB data transfer to external IP', severity: 'high', status: 'new', source: 'Taegis XDR', category: 'Exfiltration', device: 'WS033.corp.local', user: 'contractor-ext', timestamp: new Date(Date.now() - 4800000).toISOString(), mitre: 'T1048' },
  { id: 'da-005', title: 'Lateral movement via SMB from compromised account', severity: 'high', status: 'investigating', source: 'Defender', category: 'Lateral Movement', device: 'FS01.corp.local', user: 'admin_svc', timestamp: new Date(Date.now() - 5400000).toISOString(), mitre: 'T1021.002' },
  { id: 'da-006', title: 'Ransomware behavior — mass file encryption detected', severity: 'critical', status: 'new', source: 'Defender', category: 'Impact', device: 'WS088.corp.local', user: 'kpatel', timestamp: new Date(Date.now() - 600000).toISOString(), mitre: 'T1486' },
  { id: 'ta-003', title: 'Kerberoasting activity on domain controller', severity: 'critical', status: 'new', source: 'Taegis XDR', category: 'Credential Access', device: 'SRV-DC01.corp.local', user: 'admin_svc', timestamp: new Date(Date.now() - 1200000).toISOString(), mitre: 'T1558.003' },
  { id: 'da-007', title: 'MFA fatigue attack — 23 push notifications', severity: 'high', status: 'investigating', source: 'Defender', category: 'Credential Access', device: 'CLOUD-AAD', user: 'cdavis', timestamp: new Date(Date.now() - 2700000).toISOString(), mitre: 'T1621' },
];

function ago(ts: string) { const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000); if (s < 60) return s + 's ago'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago'; }

export default function Demo() {
  const [tab, setTab] = useState<'overview'|'alerts'>('overview');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(true);

  const score = 68;
  const critCount = DEMO_ALERTS.filter(a => a.severity === 'critical').length;
  const highCount = DEMO_ALERTS.filter(a => a.severity === 'high').length;
  const sevColor: Record<string, string> = { critical: '#ff4466', high: '#f97316', medium: '#ffb340', low: '#5b9aff' };

  return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="dm">
    {showBanner && <div className="dm-banner"><span>🏰 You're viewing a live demo of Watchtower. </span><a href="/signup">Start your free trial →</a><button onClick={() => setShowBanner(false)} style={{ background: 'none', border: 'none', color: '#8896b8', cursor: 'pointer', marginLeft: 12, fontSize: '.8rem' }}>✕</button></div>}

    <div className="dm-topbar"><div className="dm-logo"><div className="dm-logo-icon">W</div><span>Watch</span>tower</div><div className="dm-tabs"><button className={`dm-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>◉ Overview</button><button className={`dm-tab ${tab === 'alerts' ? 'active' : ''}`} onClick={() => setTab('alerts')}>⚡ Alerts ({DEMO_ALERTS.length})</button></div><a href="/signup" className="dm-cta-btn">Start Free Trial →</a></div>

    {tab === 'overview' && <div className="dm-main">
      <div className="dm-grid-top">
        <div className="dm-card dm-posture"><div className="dm-card-hd">Security Posture</div><div className="dm-posture-row"><svg viewBox="0 0 120 80" width="140" height="95"><defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ff4466" /><stop offset="50%" stopColor="#ffb340" /><stop offset="100%" stopColor="#34e8a5" /></linearGradient></defs><path d="M 15 70 A 50 50 0 0 1 105 70" fill="none" stroke="#1e2840" strokeWidth="8" strokeLinecap="round" /><path d="M 15 70 A 50 50 0 0 1 105 70" fill="none" stroke="url(#dg)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${score * 1.42} 200`} /><text x="60" y="55" textAnchor="middle" fill="#eaf0ff" fontSize="28" fontWeight="900" fontFamily="JetBrains Mono,monospace">{score}</text><text x="60" y="72" textAnchor="middle" fill="#ffb340" fontSize="10" fontWeight="800">GRADE C</text></svg><div className="dm-factors"><div className="dm-factor"><span>Vuln Management</span><div className="dm-factor-bar"><div style={{ width: '45%', background: '#ff4466' }} /></div></div><div className="dm-factor"><span>Agent Coverage</span><div className="dm-factor-bar"><div style={{ width: '76%', background: '#ffb340' }} /></div></div><div className="dm-factor"><span>Alert Response</span><div className="dm-factor-bar"><div style={{ width: '82%', background: '#34e8a5' }} /></div></div><div className="dm-factor"><span>Compliance</span><div className="dm-factor-bar"><div style={{ width: '61%', background: '#ffb340' }} /></div></div></div></div></div>

        <div className="dm-card"><div className="dm-card-hd">AI Noise Reduction</div><div className="dm-nr-grid"><div className="dm-nr"><div className="dm-nr-val" style={{ color: '#34e8a5' }}>247</div><div className="dm-nr-label">Auto-Closed</div></div><div className="dm-nr"><div className="dm-nr-val" style={{ color: '#ffb340' }}>38</div><div className="dm-nr-label">Escalated</div></div><div className="dm-nr"><div className="dm-nr-val" style={{ color: '#5b9aff' }}>87%</div><div className="dm-nr-label">FP Rate</div></div><div className="dm-nr"><div className="dm-nr-val" style={{ color: '#34e8a5' }}>33h</div><div className="dm-nr-label">Time Saved</div></div></div><div className="dm-nr-bar"><div style={{ width: '87%' }} /></div><div className="dm-nr-sub">↑ Watchtower saved your team <strong>33 hours</strong> this week</div></div>

        <div className="dm-card dm-stream"><div className="dm-card-hd">Live Alerts <span className="dm-live-dot" /></div><div className="dm-stream-list">{DEMO_ALERTS.slice(0, 6).map(a => (<div key={a.id} className="dm-stream-item" onClick={() => setSelectedAlert(a)}><div className="dm-stream-sev" style={{ background: sevColor[a.severity] }} /><div className="dm-stream-body"><div className="dm-stream-title">{a.title}</div><div className="dm-stream-meta"><span className="dm-src">{a.source}</span><span className="dm-ts">{ago(a.timestamp)}</span></div></div></div>))}</div></div>
      </div>

      <div className="dm-kpis"><div className="dm-kpi"><div className="dm-kpi-val">{DEMO_ALERTS.length}</div><div className="dm-kpi-label">Alerts 24h</div></div><div className="dm-kpi"><div className="dm-kpi-val" style={{ color: '#ff4466' }}>{critCount}</div><div className="dm-kpi-label">Critical</div></div><div className="dm-kpi"><div className="dm-kpi-val" style={{ color: '#f97316' }}>{highCount}</div><div className="dm-kpi-label">High</div></div><div className="dm-kpi"><div className="dm-kpi-val">847</div><div className="dm-kpi-label">Assets</div></div><div className="dm-kpi"><div className="dm-kpi-val">76%</div><div className="dm-kpi-label">Coverage</div></div><div className="dm-kpi"><div className="dm-kpi-val" style={{ color: '#34e8a5' }}>24m</div><div className="dm-kpi-label">MTTR</div></div><div className="dm-kpi"><div className="dm-kpi-val" style={{ color: '#34e8a5' }}>1,247</div><div className="dm-kpi-label">ZIA Blocked</div></div></div>
    </div>}

    {tab === 'alerts' && <div className="dm-main"><div className="dm-card" style={{ padding: 0 }}><table className="dm-tbl"><thead><tr><th>Alert</th><th>Source</th><th>Severity</th><th>Device</th><th>MITRE</th><th>Time</th></tr></thead><tbody>{DEMO_ALERTS.map(a => (<tr key={a.id} onClick={() => setSelectedAlert(a)} style={{ cursor: 'pointer' }}><td style={{ fontWeight: 600 }}>{a.title}</td><td><span className="dm-src">{a.source}</span></td><td><span className="dm-sev" style={{ color: sevColor[a.severity], background: sevColor[a.severity] + '15' }}>{a.severity}</span></td><td style={{ fontSize: '.72rem', color: '#8896b8' }}>{a.device}</td><td style={{ fontSize: '.68rem', color: '#5b9aff' }}>{a.mitre}</td><td className="dm-ts">{ago(a.timestamp)}</td></tr>))}</tbody></table></div></div>}

    {selectedAlert && <div className="dm-overlay" onClick={() => setSelectedAlert(null)}><div className="dm-modal" onClick={e => e.stopPropagation()}><div className="dm-modal-hd"><div><h3>{selectedAlert.title}</h3><div style={{ display: 'flex', gap: 4, marginTop: 6 }}><span className="dm-sev" style={{ color: sevColor[selectedAlert.severity], background: sevColor[selectedAlert.severity] + '15' }}>{selectedAlert.severity}</span><span className="dm-src">{selectedAlert.source}</span><span style={{ fontSize: '.62rem', color: '#5b9aff' }}>{selectedAlert.mitre}</span></div></div><button onClick={() => setSelectedAlert(null)} style={{ background: 'none', border: 'none', color: '#8896b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button></div><div className="dm-modal-body"><div className="dm-ai-badge">🤖 AI Co-Pilot Analysis</div><div className="dm-ai-text">This alert indicates <strong>{selectedAlert.severity === 'critical' ? 'an active compromise requiring immediate response' : 'suspicious activity requiring investigation'}</strong>. The {selectedAlert.mitre} technique was detected on <strong>{selectedAlert.device}</strong> by user <strong>{selectedAlert.user}</strong>.<br /><br />Recommended actions: 1) Isolate the affected device, 2) Review authentication logs for the past 24 hours, 3) Check for lateral movement indicators, 4) Preserve forensic evidence before remediation.</div><div className="dm-ai-cta"><a href="/signup" className="dm-cta-btn" style={{ fontSize: '.78rem' }}>Try AI Co-Pilot Free →</a></div></div></div></div>}

    <div className="dm-bottom-cta"><div className="dm-bottom-text"><strong>Ready to connect your real tools?</strong> Watchtower integrates with Tenable, Taegis, Defender, CrowdStrike, and 15+ more.</div><a href="/signup" className="dm-cta-btn">Start Free 14-Day Trial →</a></div>
  </div></>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#05070c;color:#eaf0ff;font-family:'DM Sans',sans-serif}
.dm{min-height:100vh;display:flex;flex-direction:column}
.dm-banner{display:flex;align-items:center;justify-content:center;padding:8px 16px;background:linear-gradient(90deg,#5b9aff15,#8b6fff15);border-bottom:1px solid #5b9aff20;font-size:.78rem;gap:4px;flex-wrap:wrap}
.dm-banner a{color:#5b9aff;font-weight:700;text-decoration:none}
.dm-topbar{display:flex;align-items:center;padding:0 20px;height:50px;border-bottom:1px solid #141928;gap:16px;flex-wrap:wrap}
.dm-logo{display:flex;align-items:center;gap:7px;font-weight:900;font-size:1rem;letter-spacing:-.5px;flex-shrink:0}
.dm-logo-icon{width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#5b9aff,#8b6fff);display:flex;align-items:center;justify-content:center;font-size:.65rem;color:#fff;font-weight:900}
.dm-logo span{color:#5b9aff}
.dm-tabs{display:flex;gap:4px;margin-left:auto}
.dm-tab{padding:6px 14px;border:1px solid #1e2840;border-radius:8px;background:transparent;color:#8896b8;font-size:.74rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
.dm-tab:hover{border-color:#5b9aff;color:#5b9aff}.dm-tab.active{background:#5b9aff15;border-color:#5b9aff;color:#5b9aff}
.dm-cta-btn{padding:8px 18px;border-radius:8px;background:linear-gradient(135deg,#5b9aff,#8b6fff);color:#fff;font-size:.82rem;font-weight:700;text-decoration:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;box-shadow:0 2px 12px rgba(91,154,255,.25);white-space:nowrap;display:inline-block}
.dm-cta-btn:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(91,154,255,.35)}
.dm-main{padding:16px 20px;flex:1}
.dm-grid-top{display:grid;grid-template-columns:1fr 1fr 300px;gap:12px;margin-bottom:14px}
.dm-card{background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #141928;border-radius:14px;padding:16px}
.dm-card-hd{font-size:.78rem;font-weight:800;margin-bottom:12px;display:flex;align-items:center;gap:6px}
.dm-posture{display:flex;flex-direction:column}
.dm-posture-row{display:flex;gap:16px;align-items:center}
.dm-factors{flex:1;display:flex;flex-direction:column;gap:6px}
.dm-factor{display:flex;align-items:center;gap:8px;font-size:.68rem}
.dm-factor span{min-width:100px;color:#8896b8;font-weight:600}
.dm-factor-bar{flex:1;height:6px;background:#141928;border-radius:3px;overflow:hidden}
.dm-factor-bar div{height:100%;border-radius:3px}
.dm-nr-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}
.dm-nr{text-align:center}
.dm-nr-val{font-size:1.3rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-1px}
.dm-nr-label{font-size:.5rem;color:#4a5672;font-weight:700;text-transform:uppercase;letter-spacing:.3px}
.dm-nr-bar{height:5px;background:#141928;border-radius:3px;overflow:hidden;margin-bottom:8px}
.dm-nr-bar div{height:100%;background:linear-gradient(90deg,#34e8a5,#5b9aff);border-radius:3px}
.dm-nr-sub{font-size:.68rem;color:#8896b8;text-align:center}
.dm-nr-sub strong{color:#34e8a5}
.dm-stream{display:flex;flex-direction:column;max-height:280px}
.dm-stream-list{flex:1;overflow-y:auto}
.dm-stream-item{display:flex;gap:8px;padding:8px;border-bottom:1px solid #0f1219;cursor:pointer;transition:background .15s}
.dm-stream-item:hover{background:#141928}
.dm-stream-sev{width:3px;border-radius:2px;flex-shrink:0}
.dm-stream-body{flex:1;overflow:hidden}
.dm-stream-title{font-size:.72rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dm-stream-meta{display:flex;gap:6px;margin-top:2px}
.dm-src{font-size:.55rem;font-weight:700;padding:1px 5px;border-radius:3px;background:#5b9aff15;color:#5b9aff}
.dm-ts{font-size:.58rem;color:#4a5672;font-family:'JetBrains Mono',monospace}
.dm-live-dot{width:6px;height:6px;border-radius:50%;background:#34e8a5;animation:pulse 2s ease infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.dm-kpis{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
.dm-kpi{background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #141928;border-radius:12px;padding:14px;text-align:center}
.dm-kpi-val{font-size:1.4rem;font-weight:900;font-family:'JetBrains Mono',monospace;letter-spacing:-1px;line-height:1.2}
.dm-kpi-label{font-size:.52rem;font-weight:700;color:#4a5672;text-transform:uppercase;letter-spacing:.5px;margin-top:3px}
.dm-sev{font-size:.58rem;font-weight:700;padding:2px 6px;border-radius:4px}
.dm-tbl{width:100%;border-collapse:collapse;font-size:.78rem}
.dm-tbl th{text-align:left;padding:8px 10px;font-size:.55rem;color:#4a5672;font-weight:800;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #1e2840}
.dm-tbl td{padding:8px 10px;border-bottom:1px solid #0f1219}
.dm-tbl tr:hover td{background:#0a0d1580}
.dm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}
.dm-modal{background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #1e2840;border-radius:16px;max-width:560px;width:100%;max-height:80vh;overflow-y:auto}
.dm-modal-hd{display:flex;justify-content:space-between;padding:18px;border-bottom:1px solid #141928}
.dm-modal-hd h3{font-size:.9rem;font-weight:800}
.dm-modal-body{padding:18px}
.dm-ai-badge{display:inline-flex;align-items:center;gap:4px;font-size:.68rem;font-weight:700;color:#5b9aff;background:#5b9aff12;padding:4px 10px;border-radius:6px;margin-bottom:12px}
.dm-ai-text{font-size:.82rem;color:#c8d0e4;line-height:1.7}
.dm-ai-text strong{color:#eaf0ff}
.dm-ai-cta{margin-top:16px;padding-top:16px;border-top:1px solid #141928;text-align:center}
.dm-bottom-cta{display:flex;align-items:center;justify-content:center;gap:16px;padding:20px;border-top:1px solid #141928;background:#0a0d15;flex-wrap:wrap}
.dm-bottom-text{font-size:.82rem;color:#8896b8}
.dm-bottom-text strong{color:#eaf0ff}
@media(max-width:768px){.dm-grid-top{grid-template-columns:1fr!important}.dm-kpis{grid-template-columns:repeat(3,1fr)}.dm-topbar{height:auto;padding:10px 14px}.dm-tabs{margin-left:0}.dm-banner{font-size:.7rem}}`;
