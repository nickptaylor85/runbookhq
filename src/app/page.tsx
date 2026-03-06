'use client';
import { useState, useEffect, useCallback } from 'react';

/* ═══ SVG COMPONENTS ═══ */
function Spark({ data, color = '#4f8fff', h = 30, w = 94 }: { data: number[]; color?: string; h?: number; w?: number }) {
  if (!data.length) return null;
  const mx = Math.max(...data), mn = Math.min(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 4) - 2}`).join(' ');
  const lastY = h - ((data[data.length - 1] - mn) / rng) * (h - 4) - 2;
  return <svg width={w} height={h} style={{ display: 'block' }}><defs><linearGradient id={`sg-${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs><polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sg-${color.replace(/[^a-z0-9]/gi,'')})`} /><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx={w} cy={lastY} r="2.5" fill={color} /></svg>;
}

function SevRing({ c, h, m, l, size = 110 }: { c: number; h: number; m: number; l: number; size?: number }) {
  const total = c + h + m + l || 1;
  const r = (size - 12) / 2, circ = 2 * Math.PI * r;
  const segs = [
    { pct: c / total, color: 'var(--red)' },
    { pct: h / total, color: '#f97316' },
    { pct: m / total, color: 'var(--amber)' },
    { pct: l / total, color: 'var(--blue)' },
  ];
  let offset = 0;
  return <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg3)" strokeWidth="8" />
    {segs.map((s, i) => {
      const dash = s.pct * circ;
      const el = <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.color} strokeWidth="8" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset} strokeLinecap="round" />;
      offset += dash;
      return el;
    })}
  </svg>;
}

function HourlyChart({ data, color = 'var(--accent)', h = 64, w = 260 }: { data: number[]; color?: string; h?: number; w?: number }) {
  const mx = Math.max(...data) || 1;
  const bw = w / data.length - 1;
  return <svg width={w} height={h} style={{ display: 'block' }}>
    {data.map((v, i) => {
      const bh = Math.max(1, (v / mx) * (h - 14));
      return <g key={i}><rect x={i * (bw + 1)} y={h - bh} width={bw} height={bh} rx="1.5" fill={color} opacity={i === data.length - 1 ? 1 : .45} />{i % 6 === 0 && <text x={i * (bw + 1)} y={h - bh - 3} fontSize="7" fill="var(--t3)" fontFamily="var(--fm)">{v}</text>}</g>;
    })}
  </svg>;
}

function ThreatPulse({ size = 160 }: { size?: number }) {
  const c = size / 2;
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pulse-radar">
    <circle cx={c} cy={c} r={c - 4} fill="none" stroke="var(--brd)" strokeWidth=".5" />
    <circle cx={c} cy={c} r={(c - 4) * .66} fill="none" stroke="var(--brd)" strokeWidth=".5" />
    <circle cx={c} cy={c} r={(c - 4) * .33} fill="none" stroke="var(--brd)" strokeWidth=".5" />
    <line x1={c} y1={4} x2={c} y2={size - 4} stroke="var(--brd)" strokeWidth=".5" />
    <line x1={4} y1={c} x2={size - 4} y2={c} stroke="var(--brd)" strokeWidth=".5" />
    <line x1={c} y1={c} x2={size - 8} y2={12} stroke="var(--accent)" strokeWidth="1.5" opacity=".6" className="radar-sweep" />
    <circle cx={c + 25} cy={c - 18} r="3" fill="var(--red)" className="blip b1"><animate attributeName="opacity" values="1;.3;1" dur="2s" repeatCount="indefinite" /></circle>
    <circle cx={c - 32} cy={c + 10} r="2.5" fill="var(--amber)" className="blip b2"><animate attributeName="opacity" values=".3;1;.3" dur="1.5s" repeatCount="indefinite" /></circle>
    <circle cx={c + 10} cy={c + 30} r="2" fill="var(--amber)" className="blip b3"><animate attributeName="opacity" values="1;.5;1" dur="2.5s" repeatCount="indefinite" /></circle>
    <circle cx={c - 18} cy={c - 28} r="3.5" fill="var(--red)" className="blip b4"><animate attributeName="opacity" values=".5;1;.5" dur="1.8s" repeatCount="indefinite" /></circle>
    <circle cx={c + 38} cy={c + 5} r="2" fill="var(--green)" className="blip b5"><animate attributeName="opacity" values="1;.4;1" dur="3s" repeatCount="indefinite" /></circle>
  </svg>;
}

function ToolDot({ name, healthy, total, color }: { name: string; healthy: number; total: number; color: string }) {
  const pct = Math.round(healthy / total * 100);
  return <div className="tool-dot">
    <div className="td-ring"><svg width="48" height="48"><circle cx="24" cy="24" r="20" fill="none" stroke="var(--bg3)" strokeWidth="3" /><circle cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${(pct / 100) * 125.6} 125.6`} strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dasharray .5s' }} /></svg><span className="td-pct" style={{ color }}>{pct}</span></div>
    <div className="td-name">{name}</div>
    <div className="td-sub">{healthy}/{total}</div>
  </div>;
}

function Donut({ val, max, color, sz = 52, label }: { val: number; max: number; color: string; sz?: number; label: string }) {
  const pct = Math.round((val / max) * 100), r = (sz - 8) / 2, circ = 2 * Math.PI * r, off = circ - (pct / 100) * circ;
  return <div style={{ textAlign: 'center' }}><svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="var(--bg3)" strokeWidth="4" /><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{ transition: 'stroke-dashoffset .6s' }} /></svg><div style={{ marginTop: -(sz/2) - 5, position: 'relative' }}><div style={{ fontSize: '.78rem', fontWeight: 800, fontFamily: 'var(--fm)', color }}>{pct}%</div></div><div style={{ fontSize: '.54rem', color: 'var(--t3)', marginTop: 8, fontWeight: 600, letterSpacing: '.3px', textTransform: 'uppercase' }}>{label}</div></div>;
}

/* ═══ HELPERS ═══ */
function genSpark(base: number, v: number, n = 24) { const d: number[] = []; let c = base; for (let i = 0; i < n; i++) { c += (Math.random() - .45) * v; c = Math.max(0, c); d.push(Math.round(c)); } return d; }
function ago(ts: string) { const d = (Date.now() - new Date(ts).getTime()) / 1000; if (d < 60) return `${~~d}s`; if (d < 3600) return `${~~(d / 60)}m`; if (d < 86400) return `${~~(d / 3600)}h`; return `${~~(d / 86400)}d`; }
function sc(s: string) { return s.includes('Defender') ? 'defender' : s.includes('Taegis') ? 'taegis' : s.includes('Tenable') ? 'tenable' : s.includes('Zscaler') ? 'zscaler' : ''; }
const SO: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

const TL = [
  { id: 't1', time: new Date(Date.now() - 300000).toISOString(), title: 'Credential dumping attempt', source: 'Defender MDE', icon: '🔴' },
  { id: 't2', time: new Date(Date.now() - 900000).toISOString(), title: 'WS042 isolated by analyst', source: 'SOC', icon: '🛡' },
  { id: 't3', time: new Date(Date.now() - 1800000).toISOString(), title: 'Encoded PowerShell execution', source: 'Taegis XDR', icon: '🟠' },
  { id: 't4', time: new Date(Date.now() - 2700000).toISOString(), title: 'C2 blocked: 185.220.101.42', source: 'Zscaler ZIA', icon: '🚫' },
  { id: 't5', time: new Date(Date.now() - 3600000).toISOString(), title: 'Scan done — 3 new criticals', source: 'Tenable', icon: '🔍' },
  { id: 't6', time: new Date(Date.now() - 5400000).toISOString(), title: 'VPN brute force attempt', source: 'Taegis XDR', icon: '🟠' },
  { id: 't7', time: new Date(Date.now() - 7200000).toISOString(), title: 'Phishing quarantined — 12 users', source: 'Defender XDR', icon: '📧' },
  { id: 't8', time: new Date(Date.now() - 10800000).toISOString(), title: '2 devices failed ZPA posture', source: 'Zscaler ZPA', icon: '⚠️' },
  { id: 't9', time: new Date(Date.now() - 14400000).toISOString(), title: 'Shift handover — 4 items', source: 'SOC', icon: '📋' },
  { id: 't10', time: new Date(Date.now() - 18000000).toISOString(), title: '2.4GB exfil blocked (DLP)', source: 'Zscaler ZIA', icon: '🚫' },
];

type Tab = 'overview' | 'alerts' | 'coverage' | 'vulns' | 'zscaler' | 'settings';
type Al = { id: string; title: string; severity: string; status: string; source: string; category: string; device: string; user: string; timestamp: string; mitre: string };

/* ═══ MAIN ═══ */
export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<Al[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mobileNav, setMobileNav] = useState(false);
  const [clock, setClock] = useState('');
  const [sparks] = useState({ al: genSpark(6, 3), mttr: genSpark(35, 8), mttd: genSpark(9, 3), thr: genSpark(180, 40), hourly: genSpark(12, 5) });

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [aR, cR] = await Promise.all([fetch('/api/unified-alerts').then(r => r.json()), fetch('/api/coverage').then(r => r.json())]);
      setAlerts(aR.alerts || []); setData(cR); setDemo(aR.demo && cR.demo);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); const i = setInterval(refresh, 120000); return () => clearInterval(i); }, [refresh]);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const m = data?.metrics, cov = data?.coverage, zsc = data?.zscaler, tools = data?.tools;
  const tabs: { k: Tab; l: string; i: string }[] = [{ k: 'overview', l: 'Overview', i: '◉' }, { k: 'alerts', l: 'Alerts', i: '⚡' }, { k: 'coverage', l: 'Coverage', i: '🛡' }, { k: 'vulns', l: 'Vulns', i: '🔓' }, { k: 'zscaler', l: 'Zscaler', i: '☁' }, { k: 'settings', l: 'Setup', i: '⚙' }];

  return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className={`shell ${alerts.filter((a:any)=>a.severity==="critical"&&a.status==="new").length>0?"crit-flash":""}`}>
    <div className="topbar">
      <div className="logo"><div className="logo-icon">S</div><span>Sec</span>Ops</div>
      <div className="tabs desk-only">{tabs.map(t => (<button key={t.k} className={`tab ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k)}>{t.i} {t.l}</button>))}</div>
      <button className="mob-menu mob-only" onClick={() => setMobileNav(!mobileNav)}>☰</button>
      <div className="topbar-right">
        <span className="clock desk-only">{clock}</span>
        <div className="live-dot" title="Live — auto-refreshes every 2min" />
        {demo && <div className="demo-pill desk-only">DEMO</div>}
        <button className="theme-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☀' : '🌙'}</button>
        <button className="refresh-btn desk-only" onClick={refresh}>↻</button>
      </div>
    </div>
    {mobileNav && <div className="mob-nav">{tabs.map(t => (<button key={t.k} className={`mnav-btn ${tab === t.k ? 'active' : ''}`} onClick={() => { setTab(t.k); setMobileNav(false); }}>{t.i} {t.l}</button>))}</div>}
    <div className="main">
      {loading ? <div className="loading"><span className="spin" />Loading...</div>
        : tab === 'overview' ? <Ov m={m} cov={cov} alerts={alerts} zsc={zsc} sparks={sparks} />
        : tab === 'alerts' ? <Als alerts={alerts} />
        : tab === 'coverage' ? <Cov cov={cov} />
        : tab === 'vulns' ? <Vul />
        : tab === 'zscaler' ? <Zsc zsc={zsc} />
        : <Set tools={tools} />}
    </div>
  </div></>);
}

/* ═══ OVERVIEW ═══ */
function Ov({ m, cov, alerts, zsc, sparks }: any) {
  if (!m) return null;
  return (<>
    <div className="kpi-grid">
      <div className="kpi"><div className="kpi-top"><div className="kpi-label">Alerts 24h</div></div><div className="kpi-val">{m.alertsLast24h.total}</div><div className="kpi-sub"><span style={{ color: 'var(--red)' }}>{m.alertsLast24h.critical} crit</span> · <span style={{ color: '#f97316' }}>{m.alertsLast24h.high} high</span></div><div className="kpi-spark"><Spark data={sparks.al} color="var(--accent)" /></div></div>
      <div className="kpi"><div className="kpi-top"><div className="kpi-label">MTTR</div><span className={`kpi-trend ${m.mttr.current <= m.mttr.target ? 'good' : 'bad'}`}>{m.mttr.current < m.mttr.previous ? '↓' : '↑'}{Math.abs(m.mttr.current - m.mttr.previous)}m</span></div><div className="kpi-val" style={{ color: m.mttr.current <= m.mttr.target ? 'var(--green)' : 'var(--amber)' }}>{m.mttr.current}<span className="kpi-unit">min</span></div><div className="kpi-sub">Target {m.mttr.target}m</div><div className="kpi-spark"><Spark data={sparks.mttr} color={m.mttr.current <= m.mttr.target ? 'var(--green)' : 'var(--amber)'} /></div></div>
      <div className="kpi"><div className="kpi-top"><div className="kpi-label">MTTD</div><span className={`kpi-trend ${m.mttd.current <= m.mttd.target ? 'good' : 'warn'}`}>{m.mttd.current < m.mttd.previous ? '↓' : '↑'}{Math.abs(m.mttd.current - m.mttd.previous).toFixed(1)}m</span></div><div className="kpi-val" style={{ color: m.mttd.current <= m.mttd.target ? 'var(--green)' : 'var(--amber)' }}>{m.mttd.current}<span className="kpi-unit">min</span></div><div className="kpi-sub">Target {m.mttd.target}m</div><div className="kpi-spark"><Spark data={sparks.mttd} color="var(--green)" /></div></div>
      <div className="kpi"><div className="kpi-top"><div className="kpi-label">Open Incidents</div></div><div className="kpi-val" style={{ color: m.incidentsOpen > 0 ? 'var(--amber)' : 'var(--green)' }}>{m.incidentsOpen}</div><div className="kpi-sub">SLA {m.slaCompliance}%</div></div>
      <div className="kpi"><div className="kpi-top"><div className="kpi-label">ZIA Blocked</div></div><div className="kpi-val" style={{ color: 'var(--green)' }}>{zsc?.zia?.blockedThreats?.toLocaleString()}</div><div className="kpi-sub">{zsc?.zia?.dlpViolations} DLP</div><div className="kpi-spark"><Spark data={sparks.thr} color="var(--green)" /></div></div>
      <div className="kpi"><div className="kpi-top"><div className="kpi-label">Endpoints</div></div><div className="kpi-val">{cov?.totalDevices?.toLocaleString()}</div><div className="kpi-sub" style={{ color: (cov?.gaps?.length || 0) > 0 ? 'var(--amber)' : 'var(--green)' }}>{cov?.gaps?.length || 0} coverage gaps</div></div>
    </div>

    {/* Hero row: threat radar + severity ring + hourly chart + tool health */}
    <div className="hero-grid">
      <div className="panel hero-panel">
        <div className="panel-hd"><h3>📡 Threat Radar</h3></div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}><ThreatPulse size={140} /></div>
        <div style={{ textAlign: 'center', fontSize: '.68rem', color: 'var(--t3)', paddingBottom: 10 }}>
          <span style={{ color: 'var(--red)' }}>● Critical</span>&ensp;<span style={{ color: 'var(--amber)' }}>● High</span>&ensp;<span style={{ color: 'var(--green)' }}>● Resolved</span>
        </div>
      </div>
      <div className="panel hero-panel">
        <div className="panel-hd"><h3>🎯 Severity Breakdown</h3></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '16px 12px' }}>
          <SevRing c={m.alertsLast24h.critical} h={m.alertsLast24h.high} m={m.alertsLast24h.medium} l={m.alertsLast24h.low} size={100} />
          <div style={{ fontSize: '.72rem', lineHeight: 2 }}>
            <div><span className="sev sev-critical">{m.alertsLast24h.critical}</span> Critical</div>
            <div><span className="sev sev-high">{m.alertsLast24h.high}</span> High</div>
            <div><span className="sev sev-medium">{m.alertsLast24h.medium}</span> Medium</div>
            <div><span className="sev sev-low">{m.alertsLast24h.low}</span> Low</div>
          </div>
        </div>
      </div>
      <div className="panel hero-panel">
        <div className="panel-hd"><h3>📈 Hourly Alerts</h3></div>
        <div style={{ padding: '16px 12px', display: 'flex', justifyContent: 'center' }}><HourlyChart data={sparks.hourly} w={220} h={70} /></div>
      </div>
      <div className="panel hero-panel">
        <div className="panel-hd"><h3>🔌 Tool Health</h3></div>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 8px', flexWrap: 'wrap', gap: 4 }}>
          {cov && Object.entries(cov.tools).map(([k, v]: [string, any]) => (
            <ToolDot key={k} name={k.charAt(0).toUpperCase() + k.slice(1)} healthy={v.healthy} total={cov.totalDevices} color={k === 'defender' ? '#60a5fa' : k === 'taegis' ? '#c4b5fd' : k === 'tenable' ? '#5eead4' : '#fcd34d'} />
          ))}
        </div>
      </div>
    </div>

    {/* Alerts + Timeline */}
    <div className="g23">
      <div>
        <div className="panel"><div className="panel-hd"><h3>⚡ Critical & High</h3><span className="count">{alerts.filter((a: Al) => a.severity === 'critical' || a.severity === 'high').length}</span></div>
          <div className="tbl-wrap" style={{ maxHeight: 300 }}><table className="tbl"><thead><tr><th>Alert</th><th>Source</th><th>Sev</th><th>Time</th></tr></thead><tbody>
            {alerts.filter((a: Al) => a.severity === 'critical' || a.severity === 'high').sort((a, b) => SO[a.severity] - SO[b.severity]).slice(0, 8).map((a: Al) => (<tr key={a.id}><td style={{ fontWeight: 600 }}>{a.title}{a.device && <><br /><span className="device">{a.device}</span></>}</td><td><span className={`src ${sc(a.source)}`}>{a.source.replace('Defender ', 'D/')}</span></td><td><span className={`sev sev-${a.severity}`}>{a.severity}</span></td><td className="ts">{ago(a.timestamp)}</td></tr>))}
          </tbody></table></div></div>
        <div className="panel"><div className="panel-hd"><h3>📊 Sources</h3></div><div style={{ padding: 14 }}>{m.topSources.map((s: any) => (<div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span className={`src ${sc(s.source)}`} style={{ minWidth: 80, justifyContent: 'center' }}>{s.source.replace('Defender ', 'D/')}</span><div className="bar-wrap" style={{ flex: 1 }}><div className="bar-track"><div className="bar-fill" style={{ width: `${s.pct}%`, background: s.source.includes('Defender') ? '#60a5fa' : s.source.includes('Taegis') ? '#c4b5fd' : s.source.includes('Zscaler') ? '#fcd34d' : '#5eead4' }} /></div></div><span className="mono" style={{ fontSize: '.72rem', minWidth: 24, textAlign: 'right' }}>{s.count}</span></div>))}</div></div>
      </div>
      <div className="panel" style={{ overflow: 'hidden' }}><div className="panel-hd"><h3>🕐 Activity</h3></div><div className="timeline" style={{ overflowY: 'auto', maxHeight: 460, padding: '6px 14px' }}>
        {TL.map(t => (<div key={t.id} className="tl-item"><div className="tl-icon">{t.icon}</div><div className="tl-body"><div className="tl-title">{t.title}</div><div className="tl-meta"><span className={`src ${sc(t.source)}`}>{t.source}</span><span className="ts">{ago(t.time)}</span></div></div></div>))}
      </div></div>
    </div>
  </>);
}

/* ═══ ALERTS ═══ */
function Als({ alerts }: { alerts: Al[] }) {
  const [sev, setSev] = useState('all'); const [src, setSrc] = useState('all');
  const sources = [...new Set(alerts.map(a => a.source))];
  const f = alerts.filter(a => sev === 'all' || a.severity === sev).filter(a => src === 'all' || a.source === src);
  return (<>
    <div className="filter-row"><div className="pills">{['all', 'critical', 'high', 'medium', 'low'].map(s => (<button key={s} className={`pill ${sev === s ? 'on' : ''}`} onClick={() => setSev(s)}>{s === 'all' ? `All (${alerts.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${alerts.filter(a => a.severity === s).length})`}</button>))}</div><div className="pills">{['all', ...sources].map(s => (<button key={s} className={`pill ${src === s ? 'on' : ''}`} onClick={() => setSrc(s)}>{s === 'all' ? 'All' : s.replace('Defender ', 'D/')}</button>))}</div></div>
    <div className="panel"><div className="tbl-wrap" style={{ maxHeight: 'calc(100vh - 180px)' }}><table className="tbl"><thead><tr><th>Alert</th><th>Source</th><th>Sev</th><th className="desk-only">Status</th><th className="desk-only">Device</th><th className="desk-only">MITRE</th><th>Time</th></tr></thead><tbody>
      {f.map(a => (<tr key={a.id}><td style={{ fontWeight: 600, maxWidth: 280 }}>{a.title}</td><td><span className={`src ${sc(a.source)}`}>{a.source.replace('Defender ', 'D/')}</span></td><td><span className={`sev sev-${a.severity}`}>{a.severity}</span></td><td className="desk-only"><span className={`status status-${a.status}`}>{a.status}</span></td><td className="device desk-only">{a.device || '—'}</td><td className="desk-only">{a.mitre ? <span className="mitre">{a.mitre}</span> : <span className="muted">—</span>}</td><td className="ts">{ago(a.timestamp)}</td></tr>))}
    </tbody></table></div></div>
  </>);
}

/* ═══ COVERAGE ═══ */
function Cov({ cov }: any) {
  if (!cov) return null;
  return (<>
    <div className="kpi-grid"><div className="kpi"><div className="kpi-label">Total</div><div className="kpi-val">{cov.totalDevices.toLocaleString()}</div></div>{Object.entries(cov.tools).map(([k, v]: [string, any]) => (<div key={k} className="kpi"><div className="kpi-label">{k}</div><div className="kpi-val" style={{ color: v.offline > 10 ? 'var(--amber)' : 'var(--green)' }}>{v.installed}</div><div className="kpi-sub">{v.offline} off · v{v.version}</div></div>))}</div>
    <div className="g2r">
      <div className="panel"><div className="panel-hd"><h3>⚠ Gaps</h3><span className="count">{cov.gaps.length}</span></div><div className="tbl-wrap"><table className="tbl"><thead><tr><th>Host</th><th className="desk-only">OS</th><th>Missing</th><th className="desk-only">Reason</th></tr></thead><tbody>{cov.gaps.map((g: any, i: number) => (<tr key={i}><td className="device" style={{ fontWeight: 600 }}>{g.hostname}</td><td className="desk-only" style={{ fontSize: '.8rem' }}>{g.os}</td><td>{g.missing.map((m: string) => <span key={m} className={`src ${m}`} style={{ marginRight: 3 }}>{m}</span>)}</td><td className="muted desk-only" style={{ fontSize: '.78rem' }}>{g.reason}</td></tr>))}</tbody></table></div></div>
      <div className="panel"><div className="panel-hd"><h3>Health</h3></div><table className="tbl"><thead><tr><th>Tool</th><th>OK</th><th className="desk-only">Deg</th><th>Off</th><th>Cov</th></tr></thead><tbody>{Object.entries(cov.tools).map(([k, v]: [string, any]) => { const p = Math.round(v.healthy / cov.totalDevices * 100); return (<tr key={k}><td><span className={`src ${k}`}>{k.charAt(0).toUpperCase() + k.slice(1)}</span></td><td className="mono" style={{ color: 'var(--green)' }}>{v.healthy}</td><td className="mono desk-only" style={{ color: 'var(--amber)' }}>{v.degraded}</td><td className="mono" style={{ color: v.offline > 0 ? 'var(--red)' : 'inherit', fontWeight: v.offline > 0 ? 700 : 400 }}>{v.offline}</td><td><div className="bar-wrap"><div className="bar-track"><div className="bar-fill" style={{ width: `${p}%`, background: p >= 95 ? 'var(--green)' : 'var(--amber)' }} /></div><span className="bar-pct" style={{ color: p >= 95 ? 'var(--green)' : 'var(--amber)' }}>{p}%</span></div></td></tr>); })}</tbody></table></div>
    </div>
  </>);
}

/* ═══ VULNS ═══ */
function Vul() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { fetch('/api/tenable').then(r => r.json()).then(setD); }, []);
  if (!d) return <div className="loading"><span className="spin" />Loading...</div>;
  const s = d.summary;
  return (<>
    <div className="kpi-grid"><div className="kpi"><div className="kpi-label">Total</div><div className="kpi-val">{s.total.toLocaleString()}</div></div><div className="kpi"><div className="kpi-label">Critical</div><div className="kpi-val" style={{ color: 'var(--red)' }}>{s.critical}</div></div><div className="kpi"><div className="kpi-label">High</div><div className="kpi-val" style={{ color: '#f97316' }}>{s.high}</div></div><div className="kpi"><div className="kpi-label">Medium</div><div className="kpi-val" style={{ color: 'var(--amber)' }}>{s.medium}</div></div><div className="kpi"><div className="kpi-label">Coverage</div><div className="kpi-val" style={{ color: 'var(--green)' }}>{d.scanHealth?.coverage}%</div></div></div>
    <div className="g2r">
      <div className="panel"><div className="panel-hd"><h3>Asset Risk</h3></div><div style={{ padding: 16, display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}><Donut val={d.assetCounts?.withCritical || 0} max={d.assetCounts?.total || 1} color="var(--red)" label="Critical" /><Donut val={d.assetCounts?.withHigh || 0} max={d.assetCounts?.total || 1} color="#f97316" label="High" /><Donut val={d.assetCounts?.scanned || 0} max={d.assetCounts?.total || 1} color="var(--green)" label="Scanned" /></div></div>
      <div className="panel"><div className="panel-hd"><h3>Severity Ring</h3></div><div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}><SevRing c={s.critical} h={s.high} m={s.medium} l={s.low} size={120} /></div></div>
    </div>
    <div className="panel"><div className="panel-hd"><h3>🔴 Critical CVEs</h3><span className="count">{d.topCritical?.length}</span></div><div className="tbl-wrap"><table className="tbl"><thead><tr><th>CVE</th><th>Name</th><th>CVSS</th><th className="desk-only">EPSS</th><th>Hosts</th><th className="desk-only">Exploit</th></tr></thead><tbody>{d.topCritical?.map((v: any) => (<tr key={v.id}><td className="mono" style={{ fontWeight: 700, color: 'var(--red)' }}>{v.id}</td><td style={{ fontWeight: 600, maxWidth: 260 }}>{v.name}</td><td><span className="sev sev-critical" style={{ fontFamily: 'var(--fm)' }}>{v.cvss}</span></td><td className="mono desk-only" style={{ color: v.epss >= .9 ? 'var(--red)' : 'var(--amber)' }}>{(v.epss * 100).toFixed(0)}%</td><td className="mono">{v.hosts}</td><td className="desk-only">{v.exploitable ? <span style={{ color: 'var(--red)', fontWeight: 700 }}>⚠ YES</span> : <span className="muted">No</span>}</td></tr>))}</tbody></table></div></div>
  </>);
}

/* ═══ ZSCALER ═══ */
function Zsc({ zsc }: any) {
  if (!zsc) return null;
  const { zia, zpa } = zsc;
  return (<div className="g2r">
    <div>
      <h3 style={{ fontSize: '.86rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><span className="src zscaler">ZIA</span> Internet Access</h3>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}><div className="kpi"><div className="kpi-label">Threats</div><div className="kpi-val" style={{ color: 'var(--green)' }}>{zia.blockedThreats.toLocaleString()}</div></div><div className="kpi"><div className="kpi-label">URLs</div><div className="kpi-val">{zia.blockedUrls.toLocaleString()}</div></div><div className="kpi"><div className="kpi-label">DLP</div><div className="kpi-val" style={{ color: zia.dlpViolations > 20 ? 'var(--amber)' : 'var(--green)' }}>{zia.dlpViolations}</div></div><div className="kpi"><div className="kpi-label">BW</div><div className="kpi-val">{zia.bandwidthGB}<span className="kpi-unit">GB</span></div></div></div>
      <div className="panel"><div className="panel-hd"><h3>Blocked Categories</h3></div><div style={{ padding: 12 }}>{zia.topBlocked.map((t: any) => (<div key={t.category} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span style={{ fontSize: '.78rem', minWidth: 88 }}>{t.category}</span><div className="bar-wrap" style={{ flex: 1 }}><div className="bar-track"><div className="bar-fill" style={{ width: `${(t.count / zia.blockedThreats) * 100}%`, background: 'var(--amber)' }} /></div></div><span className="mono" style={{ fontSize: '.72rem', minWidth: 36 }}>{t.count}</span><span style={{ fontSize: '.65rem', color: t.trend === 'up' ? 'var(--red)' : t.trend === 'down' ? 'var(--green)' : 'var(--t3)', fontWeight: 600 }}>{t.trend === 'up' ? '▲' : t.trend === 'down' ? '▼' : '—'}</span></div>))}</div></div>
    </div>
    <div>
      <h3 style={{ fontSize: '.86rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><span className="src zscaler">ZPA</span> Private Access</h3>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}><div className="kpi"><div className="kpi-label">Apps</div><div className="kpi-val">{zpa.totalApps}</div></div><div className="kpi"><div className="kpi-label">Users</div><div className="kpi-val">{zpa.activeUsers}</div></div></div>
      <div className="panel"><div className="panel-hd"><h3>Connectors</h3><span className="count">{zpa.connectors.total}</span></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, padding: '12px 16px' }}><div className="conn-card"><div className="conn-n" style={{ color: 'var(--green)' }}>{zpa.connectors.healthy}</div><div className="conn-l">Healthy</div></div><div className="conn-card"><div className="conn-n" style={{ color: 'var(--amber)' }}>{zpa.connectors.degraded}</div><div className="conn-l">Degraded</div></div><div className="conn-card"><div className="conn-n" style={{ color: 'var(--red)' }}>{zpa.connectors.offline}</div><div className="conn-l">Offline</div></div></div></div>
      <div className="panel"><div className="panel-hd"><h3>Top Apps</h3></div><table className="tbl"><thead><tr><th>App</th><th>Users</th><th className="desk-only">Sessions</th></tr></thead><tbody>{zpa.topApps.map((a: any) => (<tr key={a.name}><td style={{ fontWeight: 600, fontSize: '.8rem' }}>{a.name}</td><td className="mono">{a.users}</td><td className="mono desk-only">{a.sessions}</td></tr>))}</tbody></table></div>
      {zpa.postureFails > 0 && <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--ambers)', border: '1px solid rgba(237,160,51,.18)', borderRadius: 'var(--r2)', fontSize: '.78rem', color: 'var(--amber)', fontWeight: 500 }}>⚠ {zpa.postureFails} posture failures</div>}
    </div>
  </div>);
}

/* ═══ SETTINGS ═══ */
function Set({ tools }: any) {
  const cfg = [
    { n: 'Microsoft Defender (MDE + XDR)', k: 'defender', v: ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET'], d: 'Azure Portal → App Registrations → API Permissions: SecurityEvents.Read.All' },
    { n: 'Secureworks Taegis XDR', k: 'taegis', v: ['TAEGIS_CLIENT_ID', 'TAEGIS_CLIENT_SECRET', 'TAEGIS_REGION'], d: 'Taegis Console → Settings → API Clients' },
    { n: 'Tenable.io', k: 'tenable', v: ['TENABLE_ACCESS_KEY', 'TENABLE_SECRET_KEY'], d: 'Tenable.io → Settings → API Keys' },
    { n: 'Zscaler ZIA', k: 'zia', v: ['ZIA_BASE_URL', 'ZIA_API_KEY', 'ZIA_USERNAME', 'ZIA_PASSWORD'], d: 'ZIA Admin → API Key Management' },
    { n: 'Zscaler ZPA', k: 'zpa', v: ['ZPA_CLIENT_ID', 'ZPA_CLIENT_SECRET', 'ZPA_CUSTOMER_ID'], d: 'ZPA Admin → API Keys' },
  ];
  return (<div style={{ maxWidth: 680 }}>
    <h2 style={{ fontSize: '1.1rem', marginBottom: 4, fontWeight: 800 }}>⚙ Integration Setup</h2>
    <p className="muted" style={{ fontSize: '.78rem', marginBottom: 10 }}>Add env vars in <strong>Vercel → Settings → Environment Variables</strong>.</p>
    <p className="muted" style={{ fontSize: '.78rem', marginBottom: 20 }}>Set <span className="mono" style={{ color: 'var(--accent)' }}>DASHBOARD_PASSWORD</span> to enable login protection.</p>
    {cfg.map(t => (<div key={t.k} className="set-group"><h4><span className={`dot ${tools?.[t.k] ? 'dot-on' : 'dot-off'}`} />{t.n}{tools?.[t.k] ? <span className="tag-on">Connected</span> : <span className="tag-off">Not configured</span>}</h4><div className="env-box">{t.v.map(v => (<div key={v}><span className="env-k">{v}</span><span className="env-e">=</span><span className="env-v">{tools?.[t.k] ? '••••••••' : 'your-value-here'}</span></div>))}</div><p className="muted" style={{ fontSize: '.66rem', marginTop: 4 }}>{t.d}</p></div>))}
  </div>);
}

/* ═══ CSS ═══ */
const CSS = `*{margin:0;padding:0;box-sizing:border-box}:root,[data-theme="dark"]{--bg0:#06080d;--bg1:#0b0e16;--bg2:#10141e;--bg3:#171c28;--bg4:#1e2433;--brd:#1a2030;--brd2:#252d40;--t1:#e4e9f2;--t2:#8893ab;--t3:#505d78;--t4:#343e54;--accent:#4f8fff;--accent2:#7c6aff;--accent-s:#4f8fff12;--red:#f0384a;--amber:#eda033;--green:#2dd4a0;--blue:#4f8fff;--purple:#a07cff;--reds:#f0384a10;--ambers:#eda03310;--greens:#2dd4a010;--blues:#4f8fff10;--fm:'JetBrains Mono',monospace;--fs:'Outfit',sans-serif;--r:8px;--r2:12px;--shadow:0 1px 3px rgba(0,0,0,.3),0 4px 12px rgba(0,0,0,.15);--glow:0 0 20px rgba(79,143,255,.06)}[data-theme="light"]{--bg0:#f4f5f8;--bg1:#fff;--bg2:#f8f9fb;--bg3:#eef0f4;--bg4:#e4e7ec;--brd:#dde1e8;--brd2:#c8cdd6;--t1:#111827;--t2:#4b5563;--t3:#9ca3af;--t4:#d1d5db;--accent:#2563eb;--accent2:#6d28d9;--accent-s:#2563eb10;--red:#dc2626;--amber:#d97706;--green:#059669;--blue:#2563eb;--purple:#7c3aed;--reds:#dc262608;--ambers:#d9770608;--greens:#05966908;--blues:#2563eb08;--shadow:0 1px 3px rgba(0,0,0,.06),0 4px 12px rgba(0,0,0,.04);--glow:none}
body{background:var(--bg0);color:var(--t1);font-family:var(--fs);font-size:14px;line-height:1.5;min-height:100vh;transition:background .3s,color .3s}
.shell{display:flex;flex-direction:column;min-height:100vh}
.topbar{display:flex;align-items:center;gap:12px;padding:0 16px;height:48px;background:var(--bg1);border-bottom:1px solid var(--brd);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
.logo{font-weight:900;font-size:1rem;letter-spacing:-.5px;display:flex;align-items:center;gap:7px;flex-shrink:0}
.logo-icon{width:26px;height:26px;border-radius:6px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#fff;font-weight:900}
.logo span{color:var(--accent)}
.tabs{display:flex;gap:1px;margin-left:16px;background:var(--bg3);border-radius:var(--r);padding:2px}
.tab{padding:4px 11px;border-radius:6px;cursor:pointer;font-size:.74rem;font-weight:500;color:var(--t3);transition:all .15s;border:none;background:none;font-family:var(--fs);white-space:nowrap}
.tab:hover{color:var(--t2)}.tab.active{color:var(--t1);background:var(--bg1);box-shadow:var(--shadow)}
.topbar-right{margin-left:auto;display:flex;align-items:center;gap:6px}
.clock{font-family:var(--fm);font-size:.72rem;color:var(--t3);letter-spacing:.5px}
.demo-pill{font-size:.58rem;font-family:var(--fm);color:var(--amber);background:var(--ambers);padding:2px 7px;border-radius:20px;letter-spacing:.5px;border:1px solid rgba(237,160,51,.1);font-weight:600}
.theme-btn{width:30px;height:30px;border-radius:var(--r);border:1px solid var(--brd);background:var(--bg2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.82rem;transition:all .15s}
.theme-btn:hover{border-color:var(--accent);background:var(--accent-s)}
.refresh-btn{height:30px;padding:0 10px;border-radius:var(--r);border:1px solid var(--brd);background:var(--bg2);cursor:pointer;font-size:.72rem;font-family:var(--fs);color:var(--t2);transition:all .15s}
.refresh-btn:hover{border-color:var(--accent);color:var(--accent)}
.live-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:pulse 2s infinite;flex-shrink:0}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.main{flex:1;padding:14px 16px 24px;max-width:1480px;margin:0 auto;width:100%}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:7px;margin-bottom:10px}
.kpi{background:var(--bg1);border:1px solid var(--brd);border-radius:var(--r2);padding:12px 14px;position:relative;overflow:hidden;transition:border-color .2s,box-shadow .2s}
.kpi:hover{border-color:var(--brd2);box-shadow:var(--glow)}
.kpi-top{display:flex;justify-content:space-between;align-items:flex-start}
.kpi-label{font-size:.58rem;color:var(--t3);text-transform:uppercase;letter-spacing:.8px;font-weight:700}
.kpi-val{font-size:1.6rem;font-weight:800;font-family:var(--fm);letter-spacing:-1.5px;margin-top:3px;line-height:1}
.kpi-unit{font-size:.65rem;color:var(--t3);font-weight:500}
.kpi-sub{font-size:.64rem;color:var(--t3);margin-top:5px}
.kpi-trend{font-size:.6rem;font-weight:700;padding:1px 5px;border-radius:3px}
.kpi-trend.good{color:var(--green);background:var(--greens)}.kpi-trend.bad{color:var(--red);background:var(--reds)}.kpi-trend.warn{color:var(--amber);background:var(--ambers)}
.kpi-spark{position:absolute;bottom:0;right:0;opacity:.4}
.hero-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}
.hero-panel{min-height:0}
.panel{background:var(--bg1);border:1px solid var(--brd);border-radius:var(--r2);margin-bottom:8px;overflow:hidden;transition:border-color .2s}
.panel:hover{border-color:var(--brd2)}
.panel-hd{padding:9px 14px;border-bottom:1px solid var(--brd);display:flex;justify-content:space-between;align-items:center}
.panel-hd h3{font-size:.76rem;font-weight:700;display:flex;align-items:center;gap:5px}
.panel-hd .count{font-size:.62rem;color:var(--t3);font-family:var(--fm);background:var(--bg3);padding:1px 6px;border-radius:10px}
.tbl{width:100%;border-collapse:collapse}
.tbl th{text-align:left;padding:5px 10px;font-size:.56rem;color:var(--t3);text-transform:uppercase;letter-spacing:.7px;font-weight:700;border-bottom:1px solid var(--brd);background:var(--bg2)}
.tbl td{padding:6px 10px;font-size:.76rem;border-bottom:1px solid var(--brd)}
.tbl tr:hover td{background:var(--bg2)}.tbl tr:last-child td{border-bottom:none}
.tbl-wrap{max-height:400px;overflow-y:auto}.tbl-wrap::-webkit-scrollbar{width:3px}.tbl-wrap::-webkit-scrollbar-thumb{background:var(--brd2);border-radius:3px}
.sev{display:inline-block;padding:1px 6px;border-radius:4px;font-size:.56rem;font-weight:700;text-transform:uppercase;letter-spacing:.3px}
.sev-critical{background:var(--reds);color:var(--red);border:1px solid rgba(240,56,74,.1)}.sev-high{background:rgba(249,115,22,.07);color:#f97316;border:1px solid rgba(249,115,22,.08)}.sev-medium{background:var(--ambers);color:var(--amber);border:1px solid rgba(237,160,51,.08)}.sev-low{background:var(--blues);color:var(--blue);border:1px solid rgba(79,143,255,.08)}.sev-info{background:var(--bg3);color:var(--t3);border:1px solid var(--brd)}
.src{display:inline-flex;align-items:center;gap:3px;padding:1px 6px;border-radius:4px;font-size:.56rem;font-family:var(--fm);font-weight:600;letter-spacing:.2px}
.src.defender{background:#4f8fff08;color:#60a5fa;border:1px solid #4f8fff0d}.src.taegis{background:#a07cff08;color:#c4b5fd;border:1px solid #a07cff0d}.src.tenable{background:#2dd4a008;color:#5eead4;border:1px solid #2dd4a00d}.src.zscaler{background:#eda03308;color:#fcd34d;border:1px solid #eda0330d}
.status{display:inline-block;padding:1px 6px;border-radius:4px;font-size:.56rem;font-weight:700}
.status-new{background:var(--reds);color:var(--red)}.status-investigating{background:var(--ambers);color:var(--amber)}.status-resolved{background:var(--greens);color:var(--green)}
.mitre{font-family:var(--fm);font-size:.58rem;color:var(--accent);background:var(--accent-s);padding:1px 5px;border-radius:4px;border:1px solid rgba(79,143,255,.06)}
.ts{font-family:var(--fm);font-size:.62rem;color:var(--t3);white-space:nowrap}.mono{font-family:var(--fm)}.muted{color:var(--t3)}.device{font-family:var(--fm);font-size:.68rem}
.g2r{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
.g23{display:grid;grid-template-columns:2fr 1fr;gap:8px;margin-bottom:8px}
.bar-wrap{display:flex;align-items:center;gap:6px}.bar-track{flex:1;height:5px;background:var(--bg3);border-radius:3px;overflow:hidden}.bar-fill{height:100%;border-radius:3px;transition:width .5s}.bar-pct{font-family:var(--fm);font-size:.7rem;font-weight:700;min-width:40px;text-align:right}
.timeline{padding:6px 14px}.tl-item{display:flex;gap:8px;padding:6px 0;position:relative}.tl-item:not(:last-child)::before{content:'';position:absolute;left:12px;top:28px;bottom:0;width:1px;background:var(--brd)}.tl-icon{width:24px;height:24px;border-radius:50%;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:.62rem;flex-shrink:0;border:1px solid var(--brd);z-index:1}.tl-body{flex:1;min-width:0}.tl-title{font-size:.74rem;font-weight:500;line-height:1.3}.tl-meta{font-size:.58rem;color:var(--t3);display:flex;gap:5px;align-items:center;margin-top:1px}
.filter-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.pills{display:flex;gap:2px;background:var(--bg2);padding:2px;border-radius:var(--r);flex-wrap:wrap}.pill{padding:3px 9px;border-radius:5px;cursor:pointer;font-size:.66rem;font-weight:500;color:var(--t3);border:none;background:none;font-family:var(--fs);transition:all .15s;white-space:nowrap}.pill:hover{color:var(--t2)}.pill.on{color:var(--t1);background:var(--bg1);box-shadow:var(--shadow)}
.conn-card{text-align:center;padding:8px 4px;border-radius:var(--r);background:var(--bg2);border:1px solid var(--brd)}.conn-n{font-size:1.2rem;font-weight:800;font-family:var(--fm)}.conn-l{font-size:.52rem;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:1px}
.set-group{margin-bottom:18px}.set-group h4{font-size:.8rem;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:7px}
.env-box{font-family:var(--fm);font-size:.68rem;background:var(--bg2);padding:8px 12px;border-radius:var(--r);border:1px solid var(--brd);line-height:1.8}.env-k{color:var(--accent)}.env-e{color:var(--t4)}.env-v{color:var(--amber)}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block}.dot-on{background:var(--green);box-shadow:0 0 6px var(--green)}.dot-off{background:var(--t4)}
.tag-on{font-size:.6rem;color:var(--green);font-weight:600}.tag-off{font-size:.6rem;color:var(--t3)}
.loading{display:flex;align-items:center;justify-content:center;gap:8px;padding:60px;color:var(--t3);font-size:.82rem}
.spin{width:18px;height:18px;border:2px solid var(--brd);border-top-color:var(--accent);border-radius:50%;animation:spin .6s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@keyframes crit-flash{0%,100%{border-color:var(--brd);box-shadow:none}50%{border-color:var(--red);box-shadow:0 0 20px rgba(240,56,74,.15),inset 0 0 20px rgba(240,56,74,.03)}}.crit-flash .topbar{animation:topbar-flash 2s ease infinite}.crit-flash .kpi:first-child{animation:crit-flash 2s ease infinite}@keyframes topbar-flash{0%,100%{border-bottom-color:var(--brd)}50%{border-bottom-color:rgba(240,56,74,.4)}}
.tool-dot{text-align:center;min-width:56px}.td-ring{position:relative;display:inline-block}.td-pct{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:.62rem;font-weight:800;font-family:var(--fm)}.td-name{font-size:.56rem;font-weight:600;color:var(--t2);margin-top:2px}.td-sub{font-size:.5rem;color:var(--t3);font-family:var(--fm)}
.radar-sweep{transform-origin:50% 50%;animation:sweep 4s linear infinite}@keyframes sweep{to{transform:rotate(360deg)}}
.mob-menu{display:none;background:none;border:none;color:var(--t1);font-size:1.2rem;cursor:pointer;padding:4px 8px}
.mob-nav{display:none;background:var(--bg1);border-bottom:1px solid var(--brd);padding:8px 16px;gap:4px;flex-wrap:wrap}
.mnav-btn{padding:8px 14px;border-radius:var(--r);border:1px solid var(--brd);background:var(--bg2);color:var(--t2);font-size:.8rem;font-family:var(--fs);cursor:pointer;transition:all .15s}.mnav-btn.active{background:var(--accent-s);color:var(--accent);border-color:var(--accent)}
.desk-only{}.mob-only{display:none}
@media(max-width:768px){
  .desk-only{display:none!important}.mob-only{display:flex!important}
  .mob-menu{display:block}.mob-nav{display:flex}
  .topbar{padding:0 12px;gap:8px}
  .main{padding:10px 10px 20px}
  .kpi-grid{grid-template-columns:repeat(2,1fr);gap:5px}
  .kpi-val{font-size:1.3rem}
  .hero-grid{grid-template-columns:1fr 1fr;gap:6px}
  .g2r,.g23{grid-template-columns:1fr}
  .tbl td,.tbl th{padding:5px 8px;font-size:.72rem}
  .filter-row{gap:4px}.pills{gap:1px}
}
@media(max-width:480px){
  .kpi-grid{grid-template-columns:1fr 1fr}
  .hero-grid{grid-template-columns:1fr}
  .kpi{padding:10px 12px}.kpi-val{font-size:1.2rem}
}`;
