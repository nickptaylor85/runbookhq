'use client';
import { useState, useEffect, useCallback } from 'react';
import { TOOLS, type ToolInfo, type ToolField } from '@/lib/tool-registry-client';

/* ═══ SVG COMPONENTS ═══ */
function Spark({ data, color = '#4f8fff', h = 30, w = 94 }: { data: number[]; color?: string; h?: number; w?: number }) {
  if (!data.length) return null;
  const mx = Math.max(...data), mn = Math.min(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 4) - 2}`).join(' ');
  const lastY = h - ((data[data.length - 1] - mn) / rng) * (h - 4) - 2;
  return <svg width={w} height={h} style={{ display:'block' }}><defs><linearGradient id={`sg${color.replace(/\W/g,'')}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs><polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sg${color.replace(/\W/g,'')})`}/><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx={w} cy={lastY} r="2.5" fill={color}/></svg>;
}
function SevRing({ c, h, m, l, size = 100 }: { c: number; h: number; m: number; l: number; size?: number }) {
  const total = c + h + m + l || 1, r = (size - 12) / 2, circ = 2 * Math.PI * r;
  const segs = [{p:c/total,co:'var(--red)'},{p:h/total,co:'#f97316'},{p:m/total,co:'var(--amber)'},{p:l/total,co:'var(--blue)'}];
  let off = 0;
  return <div style={{position:'relative',width:size,height:size}}><svg width={size} height={size} style={{transform:'rotate(-90deg)'}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg3)" strokeWidth="8"/>{segs.map((s,i)=>{const dash=s.p*circ;const el=<circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.co} strokeWidth="8" strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-off} strokeLinecap="round"/>;off+=dash;return el;})}</svg><div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center'}}><div style={{fontSize:'.95rem',fontWeight:800,fontFamily:'var(--fm)',color:'var(--t1)'}}>{total}</div><div style={{fontSize:'.48rem',color:'var(--t3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.5px'}}>Total</div></div></div>;
}
function ThreatPulse({ size = 140 }: { size?: number }) {
  const c = size/2;
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><circle cx={c} cy={c} r={c-4} fill="none" stroke="var(--brd)" strokeWidth=".5"/><circle cx={c} cy={c} r={(c-4)*.66} fill="none" stroke="var(--brd)" strokeWidth=".5"/><circle cx={c} cy={c} r={(c-4)*.33} fill="none" stroke="var(--brd)" strokeWidth=".5"/><line x1={c} y1={4} x2={c} y2={size-4} stroke="var(--brd)" strokeWidth=".5"/><line x1={4} y1={c} x2={size-4} y2={c} stroke="var(--brd)" strokeWidth=".5"/><line x1={c} y1={c} x2={size-8} y2={12} stroke="var(--accent)" strokeWidth="1.5" opacity=".6" className="radar-sweep"/><circle cx={c+25} cy={c-18} r="3" fill="var(--red)"><animate attributeName="opacity" values="1;.3;1" dur="2s" repeatCount="indefinite"/></circle><circle cx={c-32} cy={c+10} r="2.5" fill="var(--amber)"><animate attributeName="opacity" values=".3;1;.3" dur="1.5s" repeatCount="indefinite"/></circle><circle cx={c+10} cy={c+30} r="2" fill="var(--amber)"><animate attributeName="opacity" values="1;.5;1" dur="2.5s" repeatCount="indefinite"/></circle><circle cx={c-18} cy={c-28} r="3.5" fill="var(--red)"><animate attributeName="opacity" values=".5;1;.5" dur="1.8s" repeatCount="indefinite"/></circle><circle cx={c+38} cy={c+5} r="2" fill="var(--green)"><animate attributeName="opacity" values="1;.4;1" dur="3s" repeatCount="indefinite"/></circle></svg>;
}
function HourlyChart({ data, h = 60, w = 220 }: { data: number[]; h?: number; w?: number }) {
  const mx = Math.max(...data)||1, bw = w/data.length-1;
  return <svg width={w} height={h}>{data.map((v,i)=>{const bh=Math.max(1,(v/mx)*(h-12));return <rect key={i} x={i*(bw+1)} y={h-bh} width={bw} height={bh} rx="1.5" fill="var(--accent)" opacity={i===data.length-1?1:.4}/>})}</svg>;
}
function Donut({ val, max, color, sz=52, label }: { val:number;max:number;color:string;sz?:number;label:string }) {
  const pct=Math.round((val/max)*100),r=(sz-8)/2,circ=2*Math.PI*r,off=circ-(pct/100)*circ;
  return <div style={{textAlign:'center'}}><svg width={sz} height={sz} style={{transform:'rotate(-90deg)'}}><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="var(--bg3)" strokeWidth="4"/><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{transition:'stroke-dashoffset .6s'}}/></svg><div style={{marginTop:-(sz/2)-5,position:'relative'}}><div style={{fontSize:'.78rem',fontWeight:800,fontFamily:'var(--fm)',color}}>{pct}%</div></div><div style={{fontSize:'.54rem',color:'var(--t3)',marginTop:8,fontWeight:600,letterSpacing:'.3px',textTransform:'uppercase'}}>{label}</div></div>;
}

/* ═══ HELPERS ═══ */
function gen(b:number,v:number,n=24){const d:number[]=[];let c=b;for(let i=0;i<n;i++){c+=(Math.random()-.45)*v;c=Math.max(0,c);d.push(Math.round(c))}return d}
function ago(ts:string){const d=(Date.now()-new Date(ts).getTime())/1000;if(d<60)return`${~~d}s`;if(d<3600)return`${~~(d/60)}m`;if(d<86400)return`${~~(d/3600)}h`;return`${~~(d/86400)}d`}
function sc(s:string){return s.includes('Defender')?'defender':s.includes('Taegis')?'taegis':s.includes('Tenable')?'tenable':s.includes('Zscaler')?'zscaler':s.includes('Crowd')?'crowdstrike':s.includes('Sentinel')?'sentinelone':s.includes('Dark')?'darktrace':s.includes('Recorded')?'recordedfuture':''}
const SO:Record<string,number>={critical:0,high:1,medium:2,low:3,info:4};
const TL=[{id:'t1',time:new Date(Date.now()-300000).toISOString(),title:'Credential dumping attempt',source:'Defender MDE',icon:'🔴'},{id:'t2',time:new Date(Date.now()-900000).toISOString(),title:'WS042 isolated by analyst',source:'SOC',icon:'🛡'},{id:'t3',time:new Date(Date.now()-1800000).toISOString(),title:'Encoded PowerShell execution',source:'Taegis XDR',icon:'🟠'},{id:'t4',time:new Date(Date.now()-2700000).toISOString(),title:'C2 blocked: 185.220.101.42',source:'Zscaler ZIA',icon:'🚫'},{id:'t5',time:new Date(Date.now()-3600000).toISOString(),title:'Scan done — 3 new criticals',source:'Tenable',icon:'🔍'},{id:'t6',time:new Date(Date.now()-5400000).toISOString(),title:'VPN brute force attempt',source:'CrowdStrike',icon:'🦅'},{id:'t7',time:new Date(Date.now()-7200000).toISOString(),title:'Phishing quarantined — 12 users',source:'Defender XDR',icon:'📧'},{id:'t8',time:new Date(Date.now()-10800000).toISOString(),title:'Darktrace model breach',source:'Darktrace',icon:'🌐'},{id:'t9',time:new Date(Date.now()-14400000).toISOString(),title:'Shift handover — 4 items',source:'SOC',icon:'📋'},{id:'t10',time:new Date(Date.now()-18000000).toISOString(),title:'2.4GB exfil blocked (DLP)',source:'Zscaler ZIA',icon:'🚫'}];
type Tab='overview'|'alerts'|'coverage'|'vulns'|'tools';
type Al={id:string;title:string;severity:string;status:string;source:string;category:string;device:string;user:string;timestamp:string;mitre:string};


/* ═══ IOC SEARCH ═══ */
function IOCSearch({open,onClose}:{open:boolean;onClose:()=>void}){
  const[q,setQ]=useState('');const[results,setResults]=useState<any>(null);const[searching,setSearching]=useState(false);
  async function search(){if(q.length<3)return;setSearching(true);try{const r=await fetch('/api/ioc-search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ioc:q})});setResults(await r.json())}catch(e){setResults({error:'Search failed'})}setSearching(false)}
  if(!open)return null;
  return<div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:640}}>
    <div className="modal-hd"><h3 style={{fontSize:'.95rem'}}>🔍 IOC Search — All Tools</h3><button className="modal-close" onClick={onClose}>✕</button></div>
    <div className="modal-body">
      <div style={{display:'flex',gap:6,marginBottom:12}}><input className="field-input" placeholder="IP, domain, hash, CVE, hostname, username..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} autoFocus style={{flex:1}}/><button className="tc-btn tc-btn-primary" onClick={search} disabled={searching}>{searching?'Searching...':'Search'}</button></div>
      <div style={{fontSize:'.65rem',color:'var(--t3)',marginBottom:12}}>Searches across: Defender MDE/XDR, Taegis, Tenable, Zscaler ZIA, CrowdStrike, SentinelOne, Darktrace, Recorded Future</div>
      {results&&<>
        <div style={{fontSize:'.78rem',fontWeight:700,marginBottom:8}}>{results.resultCount||0} results for <span className="mono" style={{color:'var(--accent)'}}>{results.ioc}</span></div>
        {results.results?.map((r:any,i:number)=>(<div key={i} className="ioc-result">
          <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:3}}><span className={`src ${sc(r.tool)}`}>{r.tool}</span><span className={`sev sev-${r.severity}`}>{r.severity}</span><span style={{fontSize:'.62rem',color:'var(--t3)',background:'var(--bg3)',padding:'1px 5px',borderRadius:3}}>{r.type.replace(/_/g,' ')}</span></div>
          <div style={{fontSize:'.82rem',fontWeight:600}}>{r.match}</div>
          <div style={{fontSize:'.72rem',color:'var(--t2)'}}>{r.detail}</div>
        </div>))}
        {results.resultCount===0&&<div style={{textAlign:'center',padding:20,color:'var(--t3)'}}>No matches found across connected tools</div>}
      </>}
    </div>
  </div></div>;
}

/* ═══ RESPONSE ACTIONS ═══ */
function ActionMenu({alert,onDone}:{alert:any;onDone:()=>void}){
  const[open,setOpen]=useState(false);const[loading,setLoading]=useState('');const[result,setResult]=useState<any>(null);
  const actions=[
    {id:'isolate_device',label:'🔒 Isolate Device',target:alert.device,tool:alert.source,show:!!alert.device},
    {id:'block_ip',label:'🚫 Block IP',target:'185.220.101.42',tool:'Zscaler ZIA',show:true},
    {id:'disable_user',label:'👤 Disable User',target:alert.user,tool:'Azure AD',show:!!alert.user},
    {id:'quarantine_file',label:'📦 Quarantine File',target:alert.device,tool:alert.source,show:!!alert.device},
    {id:'run_scan',label:'🔍 Run AV Scan',target:alert.device,tool:alert.source,show:!!alert.device},
    {id:'collect_evidence',label:'🧲 Collect Evidence',target:alert.device,tool:alert.source,show:!!alert.device},
  ].filter(a=>a.show);
  async function exec(a:any){setLoading(a.id);try{const r=await fetch('/api/response-actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:a.id,target:a.target,tool:a.tool,alertId:alert.id})});setResult(await r.json())}catch{setResult({error:'Action failed'})}setLoading('')}
  return<div style={{position:'relative'}}><button className="tc-btn" onClick={()=>setOpen(!open)} style={{fontSize:'.6rem',padding:'2px 6px'}}>⚡ Act</button>
    {open&&<div className="action-dropdown">{actions.map(a=>(<button key={a.id} className="action-item" onClick={()=>exec(a)} disabled={!!loading}>{loading===a.id?'Running...':a.label}<span className="muted" style={{fontSize:'.55rem',marginLeft:4}}>{a.target}</span></button>))}
    {result&&<div className={`action-result ${result.ok?'ok':'err'}`}>{result.ok?`✓ ${result.message}`:result.error}</div>}
    </div>}
  </div>;
}

/* ═══ EXPORT ═══ */
function ExportBtn({data,filename,label='Export'}:{data:()=>any[];filename:string;label?:string}){
  function toCSV(){const rows=data();if(!rows.length)return;const keys=Object.keys(rows[0]);const csv=[keys.join(','),...rows.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');dl(csv,'text/csv',filename+'.csv')}
  function dl(content:string,mime:string,name:string){const b=new Blob([content],{type:mime});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}
  return<div style={{display:'flex',gap:4}}><button className="tc-btn" onClick={toCSV} style={{fontSize:'.62rem',padding:'2px 8px'}}>📥 CSV</button></div>;
}


/* ═══ MAIN ═══ */
export default function Dashboard(){
  const[tab,setTab]=useState<Tab>('overview');
  const[data,setData]=useState<any>(null);
  const[alerts,setAlerts]=useState<Al[]>([]);
  const[toolsData,setToolsData]=useState<any>(null);
  const[loading,setLoading]=useState(true);
  const[demo,setDemo]=useState(true);
  const[theme,setTheme]=useState<'dark'|'light'>('dark');
  const[mobileNav,setMobileNav]=useState(false);
  const[clock,setClock]=useState('');
  const[sparks]=useState({al:gen(6,3),mttr:gen(35,8),mttd:gen(9,3),thr:gen(180,40),hourly:gen(12,5)});
  const[iocOpen,setIocOpen]=useState(false);
  const[isFullscreen,setIsFullscreen]=useState(false);
  const[prevCritCount,setPrevCritCount]=useState(0);
  const audioRef=typeof window!=='undefined'?{current:null as AudioContext|null}:{current:null};

  useEffect(()=>{const tick=()=>setClock(new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}));tick();const i=setInterval(tick,1000);return()=>clearInterval(i)},[]);

  const refresh=useCallback(async()=>{
    setLoading(true);
    try{
      const[aR,cR,tR]=await Promise.all([fetch('/api/unified-alerts').then(r=>r.json()),fetch('/api/coverage').then(r=>r.json()),fetch('/api/tools').then(r=>r.json())]);
      setAlerts(aR.alerts||[]);setData(cR);setDemo(aR.demo&&cR.demo);setToolsData(tR);
    }catch(e){console.error(e)}
    setLoading(false);
  },[]);

  useEffect(()=>{refresh();const i=setInterval(refresh,120000);return()=>clearInterval(i)},[refresh]);
  // Critical alert notification sound
  useEffect(()=>{
    const critCount=alerts.filter(a=>a.severity==='critical'&&a.status==='new').length;
    if(critCount>prevCritCount&&prevCritCount>=0&&alerts.length>0){
      try{
        if(!audioRef.current)audioRef.current=new AudioContext();
        const ctx=audioRef.current;const o=ctx.createOscillator();const g=ctx.createGain();
        o.connect(g);g.connect(ctx.destination);o.frequency.value=880;o.type='sine';
        g.gain.setValueAtTime(0.3,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.5);
        o.start(ctx.currentTime);o.stop(ctx.currentTime+0.5);
        // Second beep
        const o2=ctx.createOscillator();const g2=ctx.createGain();
        o2.connect(g2);g2.connect(ctx.destination);o2.frequency.value=1100;o2.type='sine';
        g2.gain.setValueAtTime(0.3,ctx.currentTime+0.15);g2.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.65);
        o2.start(ctx.currentTime+0.15);o2.stop(ctx.currentTime+0.65);
        // Browser notification
        if(typeof Notification!=='undefined'&&Notification.permission==='granted'){new Notification('🔴 Critical Alert',{body:`${critCount} new critical alert(s)`,icon:'/favicon.ico'})}
        else if(typeof Notification!=='undefined'&&Notification.permission!=='denied'){Notification.requestPermission()}
      }catch(e){}
    }
    setPrevCritCount(critCount);
  },[alerts]);
  function toggleFullscreen(){if(!document.fullscreenElement){document.documentElement.requestFullscreen();setIsFullscreen(true)}else{document.exitFullscreen();setIsFullscreen(false)}}
  useEffect(()=>{document.documentElement.setAttribute('data-theme',theme)},[theme]);

  const m=data?.metrics,cov=data?.coverage,zsc=data?.zscaler;
  const hasCrit=alerts.filter(a=>a.severity==='critical'&&a.status==='new').length>0;
  const enabledTools=toolsData?.tools?.filter((t:any)=>t.enabled)||[];
  const tabs:{k:Tab;l:string;i:string}[]=[{k:'overview',l:'Overview',i:'◉'},{k:'alerts',l:'Alerts',i:'⚡'},{k:'coverage',l:'Coverage',i:'🛡'},{k:'vulns',l:'Vulns',i:'🔓'},{k:'tools',l:`Tools (${enabledTools.length})`,i:'🔌'}];

  return(<><style dangerouslySetInnerHTML={{__html:CSS}}/><div className={`shell ${hasCrit?'crit-flash':''}`}>
    <div className="topbar">
      <div className="logo"><div className="logo-icon">S</div><span>Sec</span>Ops</div>
      <div className="tabs desk-only">{tabs.map(t=>(<button key={t.k} className={`tab ${tab===t.k?'active':''}`} onClick={()=>setTab(t.k)}>{t.i} {t.l}</button>))}</div>
      <button className="mob-menu mob-only" onClick={()=>setMobileNav(!mobileNav)}>☰</button>
      <div className="topbar-right"><button className="search-trigger desk-only" onClick={()=>setIocOpen(true)}>🔍 <span className="desk-only">IOC Search</span></button><span className="clock desk-only">{clock}</span><div className="live-dot"/>{demo&&<div className="demo-pill desk-only">DEMO</div>}<button className="theme-btn desk-only" onClick={toggleFullscreen} title="Fullscreen">{isFullscreen?'⊡':'⛶'}</button><button className="theme-btn" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}>{theme==='dark'?'☀':'🌙'}</button><button className="refresh-btn desk-only" onClick={refresh}>↻</button></div>
    </div>
    {mobileNav&&<div className="mob-nav">{tabs.map(t=>(<button key={t.k} className={`mnav-btn ${tab===t.k?'active':''}`} onClick={()=>{setTab(t.k);setMobileNav(false)}}>{t.i} {t.l}</button>))}</div>}
    <div className="main">
      {iocOpen&&<IOCSearch open={iocOpen} onClose={()=>setIocOpen(false)}/>}
      {loading?<div className="loading"><span className="spin"/>Loading...</div>
        :tab==='overview'?<Ov m={m} cov={cov} alerts={alerts} zsc={zsc} sparks={sparks} enabledTools={enabledTools}/>
        :tab==='alerts'?<Als alerts={alerts}/>
        :tab==='coverage'?<CovTab cov={cov}/>
        :tab==='vulns'?<Vul/>
        :<ToolsManager toolsData={toolsData} onRefresh={refresh}/>}
    </div>
  </div></>);
}

/* ═══ OVERVIEW ═══ */
function Ov({m,cov,alerts,zsc,sparks,enabledTools}:any){
  if(!m)return null;
  return(<>
    <div className="kpi-grid">
      <div className="kpi"><div className="kpi-top"><div className="kpi-label">Alerts 24h</div></div><div className="kpi-val">{m.alertsLast24h.total}</div><div className="kpi-sub"><span style={{color:'var(--red)'}}>{m.alertsLast24h.critical} crit</span> · <span style={{color:'#f97316'}}>{m.alertsLast24h.high} high</span></div><div className="kpi-spark"><Spark data={sparks.al} color="var(--accent)"/></div></div>
      <div className="kpi"><div className="kpi-top"><div className="kpi-label">MTTR</div><span className={`kpi-trend ${m.mttr.current<=m.mttr.target?'good':'bad'}`}>{m.mttr.current<m.mttr.previous?'↓':'↑'}{Math.abs(m.mttr.current-m.mttr.previous)}m</span></div><div className="kpi-val" style={{color:m.mttr.current<=m.mttr.target?'var(--green)':'var(--amber)'}}>{m.mttr.current}<span className="kpi-unit">min</span></div><div className="kpi-sub">Target {m.mttr.target}m</div><div className="kpi-spark"><Spark data={sparks.mttr} color={m.mttr.current<=m.mttr.target?'var(--green)':'var(--amber)'}/></div></div>
      <div className="kpi"><div className="kpi-top"><div className="kpi-label">MTTD</div><span className={`kpi-trend ${m.mttd.current<=m.mttd.target?'good':'warn'}`}>{m.mttd.current<m.mttd.previous?'↓':'↑'}{Math.abs(m.mttd.current-m.mttd.previous).toFixed(1)}m</span></div><div className="kpi-val" style={{color:m.mttd.current<=m.mttd.target?'var(--green)':'var(--amber)'}}>{m.mttd.current}<span className="kpi-unit">min</span></div><div className="kpi-sub">Target {m.mttd.target}m</div><div className="kpi-spark"><Spark data={sparks.mttd} color="var(--green)"/></div></div>
      <div className="kpi"><div className="kpi-top"><div className="kpi-label">Open Incidents</div></div><div className="kpi-val" style={{color:m.incidentsOpen>0?'var(--amber)':'var(--green)'}}>{m.incidentsOpen}</div><div className="kpi-sub">SLA {m.slaCompliance}%</div></div>
      <div className="kpi"><div className="kpi-top"><div className="kpi-label">ZIA Blocked</div></div><div className="kpi-val" style={{color:'var(--green)'}}>{zsc?.zia?.blockedThreats?.toLocaleString()}</div><div className="kpi-sub">{zsc?.zia?.dlpViolations} DLP</div><div className="kpi-spark"><Spark data={sparks.thr} color="var(--green)"/></div></div>
      <div className="kpi"><div className="kpi-top"><div className="kpi-label">Tools Active</div></div><div className="kpi-val" style={{color:'var(--accent)'}}>{enabledTools.length}<span className="kpi-unit">/{TOOLS.length}</span></div><div className="kpi-sub">{cov?.totalDevices?.toLocaleString()} devices</div></div>
    </div>
    <div className="hero-grid">
      <div className="panel hero-panel"><div className="panel-hd"><h3>📡 Threat Radar</h3></div><div style={{display:'flex',justifyContent:'center',padding:'10px 0'}}><ThreatPulse size={130}/></div><div style={{textAlign:'center',fontSize:'.6rem',color:'var(--t3)',paddingBottom:8,display:'flex',justifyContent:'center',gap:10}}><span><span style={{color:'var(--red)'}}>●</span> Critical</span><span><span style={{color:'var(--amber)'}}>●</span> High</span><span><span style={{color:'var(--green)'}}>●</span> Resolved</span></div></div>
      <div className="panel hero-panel"><div className="panel-hd"><h3>🎯 Severity</h3></div><div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14,padding:'14px 10px'}}><SevRing c={m.alertsLast24h.critical} h={m.alertsLast24h.high} m={m.alertsLast24h.medium} l={m.alertsLast24h.low} size={90}/><div style={{fontSize:'.7rem',lineHeight:2}}><div><span className="sev sev-critical">{m.alertsLast24h.critical}</span> Crit</div><div><span className="sev sev-high">{m.alertsLast24h.high}</span> High</div><div><span className="sev sev-medium">{m.alertsLast24h.medium}</span> Med</div><div><span className="sev sev-low">{m.alertsLast24h.low}</span> Low</div></div></div></div>
      <div className="panel hero-panel"><div className="panel-hd"><h3>📈 Hourly Alerts</h3></div><div style={{padding:'14px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}><HourlyChart data={sparks.hourly} w={200} h={60}/><div style={{display:'flex',justifyContent:'space-between',width:200,fontSize:'.52rem',color:'var(--t3)',fontFamily:'var(--fm)'}}><span>24h ago</span><span>12h</span><span>Now</span></div></div></div>
      <div className="panel hero-panel"><div className="panel-hd"><h3>🔌 Connected</h3></div><div style={{padding:'10px',display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center'}}>{enabledTools.map((t:any)=>(<div key={t.id} className="tool-chip" style={{borderColor:t.color+'33',color:t.color}}><span>{t.icon}</span>{t.shortName}</div>))}{enabledTools.length===0&&<div style={{fontSize:'.72rem',color:'var(--t3)',padding:12}}>No tools connected — go to Tools tab</div>}</div></div>
    </div>
    <div className="g23">
      <div>
        <div className="panel"><div className="panel-hd"><h3>⚡ Critical & High</h3><span className="count">{alerts.filter((a:Al)=>a.severity==='critical'||a.severity==='high').length}</span></div><div className="tbl-wrap" style={{maxHeight:280}}><table className="tbl"><thead><tr><th>Alert</th><th>Source</th><th>Sev</th><th>Time</th></tr></thead><tbody>{alerts.filter((a:Al)=>a.severity==='critical'||a.severity==='high').sort((a,b)=>SO[a.severity]-SO[b.severity]).slice(0,8).map((a:Al)=>(<tr key={a.id}><td style={{fontWeight:600}}>{a.title}{a.device&&<><br/><span className="device">{a.device}</span></>}</td><td><span className={`src ${sc(a.source)}`}>{a.source}</span></td><td><span className={`sev sev-${a.severity}`}>{a.severity}</span></td><td className="ts">{ago(a.timestamp)}</td></tr>))}</tbody></table></div></div>
        <div className="panel"><div className="panel-hd"><h3>📊 Sources</h3></div><div style={{padding:14}}>{m.topSources.map((s:any)=>(<div key={s.source} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}><span className={`src ${sc(s.source)}`} style={{minWidth:80,justifyContent:'center'}}>{s.source}</span><div className="bar-wrap" style={{flex:1}}><div className="bar-track"><div className="bar-fill" style={{width:`${s.pct}%`,background:'var(--accent)'}}/></div></div><span className="mono" style={{fontSize:'.72rem',minWidth:24,textAlign:'right'}}>{s.count}</span></div>))}</div></div>
      </div>
      <div className="panel" style={{overflow:'hidden'}}><div className="panel-hd"><h3>🕐 Timeline</h3></div><div style={{overflowY:'auto',maxHeight:460,padding:'6px 14px'}}>{TL.map(t=>(<div key={t.id} className="tl-item"><div className="tl-icon">{t.icon}</div><div className="tl-body"><div className="tl-title">{t.title}</div><div className="tl-meta"><span className={`src ${sc(t.source)}`}>{t.source}</span><span className="ts">{ago(t.time)}</span></div></div></div>))}</div></div>
    </div>
  </>);
}

/* ═══ ALERTS ═══ */
function Als({alerts}:{alerts:Al[]}){
  const[sev,setSev]=useState('all');const[src,setSrc]=useState('all');const[grouped,setGrouped]=useState(false);
  const sources=[...new Set(alerts.map(a=>a.source))];
  const f=alerts.filter(a=>sev==='all'||a.severity===sev).filter(a=>src==='all'||a.source===src);
  return(<>
    <div className="filter-row">
      <div className="pills">{['all','critical','high','medium','low'].map(s=>(<button key={s} className={`pill ${sev===s?'on':''}`} onClick={()=>setSev(s)}>{s==='all'?`All (${alerts.length})`:`${s.charAt(0).toUpperCase()+s.slice(1)} (${alerts.filter(a=>a.severity===s).length})`}</button>))}</div>
      <button className={`tc-btn ${grouped?'tc-btn-primary':''}`} onClick={()=>setGrouped(!grouped)} style={{fontSize:'.66rem',padding:'3px 8px'}}>{grouped?'🔗 Correlated':'🔗 Correlate'}</button>
      <ExportBtn data={()=>f.map(a=>({title:a.title,source:a.source,severity:a.severity,status:a.status,device:a.device,user:a.user,mitre:a.mitre,time:a.timestamp}))} filename="secops-alerts"/>
    </div>
    <div className="panel"><div className="tbl-wrap" style={{maxHeight:'calc(100vh - 170px)'}}><table className="tbl"><thead><tr><th>Alert</th><th>Source</th><th>Sev</th><th className="desk-only">Status</th><th className="desk-only">Device</th><th className="desk-only">MITRE</th><th>Time</th><th className="desk-only">Actions</th></tr></thead><tbody>{(()=>{
        if(!grouped)return f.map(a=>(<tr key={a.id}><td style={{fontWeight:600,maxWidth:280}}>{a.title}</td><td><span className={`src ${sc(a.source)}`}>{a.source}</span></td><td><span className={`sev sev-${a.severity}`}>{a.severity}</span></td><td className="desk-only"><span className={`status status-${a.status}`}>{a.status}</span></td><td className="device desk-only">{a.device||'—'}</td><td className="desk-only">{a.mitre?<span className="mitre">{a.mitre}</span>:<span className="muted">—</span>}</td><td className="ts">{ago(a.timestamp)}</td><td className="desk-only"><ActionMenu alert={a} onDone={()=>{}}/></td></tr>));
        // Correlate: group by device within 30min windows
        const groups:Record<string,Al[]>={};
        f.forEach(a=>{const key=a.device||a.user||a.id;if(!groups[key])groups[key]=[];groups[key].push(a)});
        return Object.entries(groups).flatMap(([key,als])=>{
          if(als.length===1)return als.map(a=>(<tr key={a.id}><td style={{fontWeight:600,maxWidth:280}}>{a.title}</td><td><span className={`src ${sc(a.source)}`}>{a.source}</span></td><td><span className={`sev sev-${a.severity}`}>{a.severity}</span></td><td className="desk-only"><span className={`status status-${a.status}`}>{a.status}</span></td><td className="device desk-only">{a.device||'—'}</td><td className="desk-only">{a.mitre?<span className="mitre">{a.mitre}</span>:<span className="muted">—</span>}</td><td className="ts">{ago(a.timestamp)}</td><td className="desk-only"><ActionMenu alert={a} onDone={()=>{}}/></td></tr>));
          const top=als.sort((a,b)=>SO[a.severity]-SO[b.severity])[0];
          return[<tr key={key} className="corr-group"><td colSpan={8} style={{padding:'6px 10px',background:'var(--accent-s)',borderLeft:'3px solid var(--accent)'}}><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:'.7rem',fontWeight:700,color:'var(--accent)'}}>🔗 Correlated ({als.length} alerts)</span><span className="device">{key}</span><span className="muted" style={{fontSize:'.62rem'}}>Highest: <span className={`sev sev-${top.severity}`}>{top.severity}</span></span>{als.map(a=>(<span key={a.id} className={`src ${sc(a.source)}`} style={{marginLeft:2}}>{a.source}</span>))}<span style={{marginLeft:'auto'}}><ActionMenu alert={top} onDone={()=>{}}/></span></div><div style={{fontSize:'.68rem',color:'var(--t2)',marginTop:3}}>{als.map(a=>a.title).join(' → ')}</div></td></tr>];
        });
      })()}</tbody></table></div></div>
  </>);
}

/* ═══ COVERAGE ═══ */
function CovTab({cov}:any){
  if(!cov)return null;
  return(<>
    <div className="kpi-grid"><div className="kpi"><div className="kpi-label">Total Devices</div><div className="kpi-val">{cov.totalDevices.toLocaleString()}</div></div>{Object.entries(cov.tools).map(([k,v]:any)=>(<div key={k} className="kpi"><div className="kpi-label">{k}</div><div className="kpi-val" style={{color:v.offline>10?'var(--amber)':'var(--green)'}}>{v.installed}</div><div className="kpi-sub">{v.offline} off · v{v.version}</div></div>))}</div>
    <div className="panel"><div className="panel-hd"><h3>⚠ Coverage Gaps</h3><span className="count">{cov.gaps.length}</span></div><div className="tbl-wrap"><table className="tbl"><thead><tr><th>Host</th><th className="desk-only">OS</th><th>Missing</th><th className="desk-only">Reason</th></tr></thead><tbody>{cov.gaps.map((g:any,i:number)=>(<tr key={i}><td className="device" style={{fontWeight:600}}>{g.hostname}</td><td className="desk-only" style={{fontSize:'.8rem'}}>{g.os}</td><td>{g.missing.map((m:string)=><span key={m} className={`src ${m}`} style={{marginRight:3}}>{m}</span>)}</td><td className="muted desk-only" style={{fontSize:'.78rem'}}>{g.reason}</td></tr>))}</tbody></table></div></div>
  </>);
}

/* ═══ VULNS ═══ */
function Vul(){
  const[d,setD]=useState<any>(null);
  useEffect(()=>{fetch('/api/tenable').then(r=>r.json()).then(setD)},[]);
  if(!d)return<div className="loading"><span className="spin"/>Loading...</div>;
  const s=d.summary;
  return(<>
    <div className="kpi-grid"><div className="kpi"><div className="kpi-label">Total</div><div className="kpi-val">{s.total.toLocaleString()}</div></div><div className="kpi"><div className="kpi-label">Critical</div><div className="kpi-val" style={{color:'var(--red)'}}>{s.critical}</div></div><div className="kpi"><div className="kpi-label">High</div><div className="kpi-val" style={{color:'#f97316'}}>{s.high}</div></div><div className="kpi"><div className="kpi-label">Coverage</div><div className="kpi-val" style={{color:'var(--green)'}}>{d.scanHealth?.coverage}%</div></div></div>
    <div className="g2r">
      <div className="panel"><div className="panel-hd"><h3>Asset Risk</h3></div><div style={{padding:16,display:'flex',justifyContent:'space-around',alignItems:'center',flexWrap:'wrap',gap:12}}><Donut val={d.assetCounts?.withCritical||0} max={d.assetCounts?.total||1} color="var(--red)" label="Critical"/><Donut val={d.assetCounts?.withHigh||0} max={d.assetCounts?.total||1} color="#f97316" label="High"/><Donut val={d.assetCounts?.scanned||0} max={d.assetCounts?.total||1} color="var(--green)" label="Scanned"/></div></div>
      <div className="panel"><div className="panel-hd"><h3>Severity Ring</h3></div><div style={{display:'flex',justifyContent:'center',padding:16}}><SevRing c={s.critical} h={s.high} m={s.medium} l={s.low} size={110}/></div></div>
    </div>
    <div className="panel"><div className="panel-hd"><h3>🔴 Critical CVEs</h3></div><div className="tbl-wrap"><table className="tbl"><thead><tr><th>CVE</th><th>Name</th><th>CVSS</th><th className="desk-only">EPSS</th><th>Hosts</th></tr></thead><tbody>{d.topCritical?.map((v:any)=>(<tr key={v.id}><td className="mono" style={{fontWeight:700,color:'var(--red)'}}>{v.id}</td><td style={{fontWeight:600,maxWidth:260}}>{v.name}</td><td><span className="sev sev-critical" style={{fontFamily:'var(--fm)'}}>{v.cvss}</span></td><td className="mono desk-only" style={{color:v.epss>=.9?'var(--red)':'var(--amber)'}}>{(v.epss*100).toFixed(0)}%</td><td className="mono">{v.hosts}</td></tr>))}</tbody></table></div></div>
  </>);
}

/* ═══ TOOLS MANAGER ═══ */
function ToolsManager({toolsData,onRefresh}:{toolsData:any;onRefresh:()=>void}){
  const[selectedTool,setSelectedTool]=useState<string|null>(null);
  const[creds,setCreds]=useState<Record<string,string>>({});
  const[saving,setSaving]=useState(false);
  const[msg,setMsg]=useState('');
  const[catFilter,setCatFilter]=useState('all');

  const toolStatuses:Record<string,any>={};
  (toolsData?.tools||[]).forEach((t:any)=>{toolStatuses[t.id]=t});

  const categories=[...new Set(TOOLS.map(t=>t.categoryLabel))];
  const filtered=catFilter==='all'?TOOLS:TOOLS.filter(t=>t.categoryLabel===catFilter);

  function openTool(tool:ToolInfo){
    setSelectedTool(tool.id);
    setCreds({});
    setMsg('');
  }

  async function saveCreds(toolId:string){
    setSaving(true);setMsg('');
    try{
      const res=await fetch('/api/tools',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save_credentials',toolId,credentials:creds})});
      const data=await res.json();
      if(data.ok){setMsg('✓ Saved');setSelectedTool(null);onRefresh()}
      else setMsg(data.error||'Error saving');
    }catch(e){setMsg('Network error')}
    setSaving(false);
  }

  async function toggleTool(toolId:string,enabled:boolean){
    await fetch('/api/tools',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'toggle',toolId,enabled})});
    onRefresh();
  }

  async function removeTool(toolId:string){
    if(!confirm(`Remove ${toolId} credentials?`))return;
    await fetch('/api/tools',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'remove',toolId})});
    onRefresh();
  }

  const sel=TOOLS.find(t=>t.id===selectedTool);

  return(<div style={{maxWidth:900}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
      <div><h2 style={{fontSize:'1.1rem',fontWeight:800}}>🔌 Tool Integrations</h2><p className="muted" style={{fontSize:'.76rem'}}>{toolsData?.enabledCount||0} connected · {TOOLS.length} available</p></div>
      {!toolsData?.kvAvailable&&<div className="kv-warn">⚠ Redis not configured — credentials won't persist. <a href="https://upstash.com" target="_blank" rel="noopener" style={{color:'var(--accent)'}}>Set up Upstash Redis (free) →</a></div>}
    </div>

    <div className="pills" style={{marginBottom:12}}><button className={`pill ${catFilter==='all'?'on':''}`} onClick={()=>setCatFilter('all')}>All ({TOOLS.length})</button>{categories.map(c=>(<button key={c} className={`pill ${catFilter===c?'on':''}`} onClick={()=>setCatFilter(c)}>{c} ({TOOLS.filter(t=>t.categoryLabel===c).length})</button>))}</div>

    <div className="tool-grid">{filtered.map(tool=>{
      const st=toolStatuses[tool.id];
      const isEnabled=st?.enabled;
      const isConfigured=st?.configured;
      return(<div key={tool.id} className={`tool-card ${isEnabled?'enabled':''}`} style={{'--tc':tool.color} as any}>
        <div className="tc-top">
          <span className="tc-icon">{tool.icon}</span>
          <div className="tc-info"><div className="tc-name">{tool.name}</div><div className="tc-cat">{tool.categoryLabel} · {tool.vendor}</div></div>
          {isConfigured&&<label className="toggle"><input type="checkbox" checked={isEnabled} onChange={e=>toggleTool(tool.id,e.target.checked)}/><span className="toggle-slider"/></label>}
        </div>
        <div className="tc-desc">{tool.description}</div>
        <div className="tc-footer">
          {isConfigured?(<>
            <span className="tc-status" style={{color:isEnabled?'var(--green)':'var(--t3)'}}><span className={`dot ${isEnabled?'dot-on':'dot-off'}`}/>{isEnabled?'Connected':'Disabled'}</span>
            <button className="tc-btn" onClick={()=>openTool(tool)}>Edit</button>
            <button className="tc-btn tc-btn-danger" onClick={()=>removeTool(tool.id)}>Remove</button>
          </>):(<>
            <span className="tc-status" style={{color:'var(--t3)'}}><span className="dot dot-off"/>Not configured</span>
            <button className="tc-btn tc-btn-primary" onClick={()=>openTool(tool)}>+ Connect</button>
          </>)}
        </div>
      </div>);
    })}</div>

    {/* Credential modal */}
    {sel&&<div className="modal-overlay" onClick={()=>setSelectedTool(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
      <div className="modal-hd"><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:'1.3rem'}}>{sel.icon}</span><div><h3 style={{fontSize:'.95rem',fontWeight:700}}>{sel.name}</h3><p className="muted" style={{fontSize:'.7rem'}}>{sel.description}</p></div></div><button className="modal-close" onClick={()=>setSelectedTool(null)}>✕</button></div>
      <div className="modal-body">
        <div className="modal-docs">📋 {sel.docs}</div>
        {sel.fields.map(f=>(<div key={f.key} className="field">
          <label className="field-label">{f.label} <span className="field-key">{f.key}</span></label>
          {f.type==='select'?<select className="field-input" value={creds[f.key]||''} onChange={e=>setCreds({...creds,[f.key]:e.target.value})}><option value="">{f.placeholder}</option>{f.options?.map(o=>(<option key={o} value={o}>{o}</option>))}</select>
          :<input className="field-input" type={f.type} placeholder={f.placeholder} value={creds[f.key]||''} onChange={e=>setCreds({...creds,[f.key]:e.target.value})}/>}
        </div>))}
        {msg&&<div className={`modal-msg ${msg.startsWith('✓')?'ok':'err'}`}>{msg}</div>}
      </div>
      <div className="modal-ft"><button className="tc-btn" onClick={()=>setSelectedTool(null)}>Cancel</button><button className="tc-btn tc-btn-primary" onClick={()=>saveCreds(sel.id)} disabled={saving}>{saving?'Saving...':'Save & Connect'}</button></div>
    </div></div>}
  </div>);
}

/* ═══ CSS ═══ */
const CSS=`*{margin:0;padding:0;box-sizing:border-box}:root,[data-theme="dark"]{--bg0:#06080d;--bg1:#0b0e16;--bg2:#10141e;--bg3:#171c28;--bg4:#1e2433;--brd:#1a2030;--brd2:#252d40;--t1:#e4e9f2;--t2:#8893ab;--t3:#505d78;--t4:#343e54;--accent:#4f8fff;--accent2:#7c6aff;--accent-s:#4f8fff12;--red:#f0384a;--amber:#eda033;--green:#2dd4a0;--blue:#4f8fff;--purple:#a07cff;--reds:#f0384a10;--ambers:#eda03310;--greens:#2dd4a010;--blues:#4f8fff10;--fm:'JetBrains Mono',monospace;--fs:'Outfit',sans-serif;--r:8px;--r2:12px;--shadow:0 1px 3px rgba(0,0,0,.3),0 4px 12px rgba(0,0,0,.15);--glow:0 0 20px rgba(79,143,255,.06)}[data-theme="light"]{--bg0:#f4f5f8;--bg1:#fff;--bg2:#f8f9fb;--bg3:#eef0f4;--bg4:#e4e7ec;--brd:#dde1e8;--brd2:#c8cdd6;--t1:#111827;--t2:#4b5563;--t3:#9ca3af;--t4:#d1d5db;--accent:#2563eb;--accent2:#6d28d9;--accent-s:#2563eb10;--red:#dc2626;--amber:#d97706;--green:#059669;--blue:#2563eb;--purple:#7c3aed;--reds:#dc262608;--ambers:#d9770608;--greens:#05966908;--blues:#2563eb08;--shadow:0 1px 3px rgba(0,0,0,.06),0 4px 12px rgba(0,0,0,.04);--glow:none}
body{background:var(--bg0);color:var(--t1);font-family:var(--fs);font-size:14px;line-height:1.5;min-height:100vh;transition:background .3s,color .3s}
.shell{display:flex;flex-direction:column;min-height:100vh}
.topbar{display:flex;align-items:center;gap:12px;padding:0 16px;height:48px;background:var(--bg1);border-bottom:1px solid var(--brd);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
.logo{font-weight:900;font-size:1rem;letter-spacing:-.5px;display:flex;align-items:center;gap:7px;flex-shrink:0}.logo-icon{width:26px;height:26px;border-radius:6px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#fff;font-weight:900}.logo span{color:var(--accent)}
.tabs{display:flex;gap:1px;margin-left:16px;background:var(--bg3);border-radius:var(--r);padding:2px}.tab{padding:4px 11px;border-radius:6px;cursor:pointer;font-size:.74rem;font-weight:500;color:var(--t3);transition:all .15s;border:none;background:none;font-family:var(--fs);white-space:nowrap}.tab:hover{color:var(--t2)}.tab.active{color:var(--t1);background:var(--bg1);box-shadow:var(--shadow)}
.topbar-right{margin-left:auto;display:flex;align-items:center;gap:6px}.clock{font-family:var(--fm);font-size:.72rem;color:var(--t3);letter-spacing:.5px}.demo-pill{font-size:.58rem;font-family:var(--fm);color:var(--amber);background:var(--ambers);padding:2px 7px;border-radius:20px;letter-spacing:.5px;border:1px solid rgba(237,160,51,.1);font-weight:600}.theme-btn{width:30px;height:30px;border-radius:var(--r);border:1px solid var(--brd);background:var(--bg2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.82rem;transition:all .15s}.theme-btn:hover{border-color:var(--accent);background:var(--accent-s)}.refresh-btn{height:30px;padding:0 10px;border-radius:var(--r);border:1px solid var(--brd);background:var(--bg2);cursor:pointer;font-size:.72rem;font-family:var(--fs);color:var(--t2);transition:all .15s}.refresh-btn:hover{border-color:var(--accent);color:var(--accent)}
.live-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:pulse 2s infinite;flex-shrink:0}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.main{flex:1;padding:14px 16px 24px;max-width:1480px;margin:0 auto;width:100%}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:7px;margin-bottom:10px}.kpi{background:var(--bg1);border:1px solid var(--brd);border-radius:var(--r2);padding:12px 14px;position:relative;overflow:hidden;transition:border-color .2s,box-shadow .2s}.kpi:hover{border-color:var(--brd2);box-shadow:var(--glow)}.kpi-top{display:flex;justify-content:space-between;align-items:flex-start}.kpi-label{font-size:.58rem;color:var(--t3);text-transform:uppercase;letter-spacing:.8px;font-weight:700}.kpi-val{font-size:1.6rem;font-weight:800;font-family:var(--fm);letter-spacing:-1.5px;margin-top:3px;line-height:1}.kpi-unit{font-size:.65rem;color:var(--t3);font-weight:500}.kpi-sub{font-size:.64rem;color:var(--t3);margin-top:5px}.kpi-trend{font-size:.6rem;font-weight:700;padding:1px 5px;border-radius:3px}.kpi-trend.good{color:var(--green);background:var(--greens)}.kpi-trend.bad{color:var(--red);background:var(--reds)}.kpi-trend.warn{color:var(--amber);background:var(--ambers)}.kpi-spark{position:absolute;bottom:0;right:0;opacity:.4}
.hero-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}.hero-panel{min-height:0}
.panel{background:var(--bg1);border:1px solid var(--brd);border-radius:var(--r2);margin-bottom:8px;overflow:hidden;transition:border-color .2s}.panel:hover{border-color:var(--brd2)}.panel-hd{padding:9px 14px;border-bottom:1px solid var(--brd);display:flex;justify-content:space-between;align-items:center}.panel-hd h3{font-size:.76rem;font-weight:700;display:flex;align-items:center;gap:5px}.panel-hd .count{font-size:.62rem;color:var(--t3);font-family:var(--fm);background:var(--bg3);padding:1px 6px;border-radius:10px}
.tbl{width:100%;border-collapse:collapse}.tbl th{text-align:left;padding:5px 10px;font-size:.56rem;color:var(--t3);text-transform:uppercase;letter-spacing:.7px;font-weight:700;border-bottom:1px solid var(--brd);background:var(--bg2)}.tbl td{padding:6px 10px;font-size:.76rem;border-bottom:1px solid var(--brd)}.tbl tr:hover td{background:var(--bg2)}.tbl tr:last-child td{border-bottom:none}.tbl-wrap{max-height:400px;overflow-y:auto}.tbl-wrap::-webkit-scrollbar{width:3px}.tbl-wrap::-webkit-scrollbar-thumb{background:var(--brd2);border-radius:3px}
.sev{display:inline-block;padding:1px 6px;border-radius:4px;font-size:.56rem;font-weight:700;text-transform:uppercase;letter-spacing:.3px}.sev-critical{background:var(--reds);color:var(--red);border:1px solid rgba(240,56,74,.1)}.sev-high{background:rgba(249,115,22,.07);color:#f97316;border:1px solid rgba(249,115,22,.08)}.sev-medium{background:var(--ambers);color:var(--amber);border:1px solid rgba(237,160,51,.08)}.sev-low{background:var(--blues);color:var(--blue);border:1px solid rgba(79,143,255,.08)}
.src{display:inline-flex;align-items:center;gap:3px;padding:1px 6px;border-radius:4px;font-size:.56rem;font-family:var(--fm);font-weight:600;letter-spacing:.2px;background:var(--bg3);color:var(--t2);border:1px solid var(--brd)}.src.defender{background:#4f8fff08;color:#60a5fa;border-color:#4f8fff15}.src.taegis{background:#a07cff08;color:#c4b5fd;border-color:#a07cff15}.src.tenable{background:#2dd4a008;color:#5eead4;border-color:#2dd4a015}.src.zscaler{background:#eda03308;color:#fcd34d;border-color:#eda03315}.src.crowdstrike{background:#ef444408;color:#fca5a5;border-color:#ef444415}.src.sentinelone{background:#a855f708;color:#d8b4fe;border-color:#a855f715}.src.darktrace{background:#f59e0b08;color:#fde68a;border-color:#f59e0b15}.src.recordedfuture{background:#f8717108;color:#fecaca;border-color:#f8717115}
.status{display:inline-block;padding:1px 6px;border-radius:4px;font-size:.56rem;font-weight:700}.status-new{background:var(--reds);color:var(--red)}.status-investigating{background:var(--ambers);color:var(--amber)}.status-resolved{background:var(--greens);color:var(--green)}
.mitre{font-family:var(--fm);font-size:.58rem;color:var(--accent);background:var(--accent-s);padding:1px 5px;border-radius:4px;border:1px solid rgba(79,143,255,.06)}
.ts{font-family:var(--fm);font-size:.62rem;color:var(--t3);white-space:nowrap}.mono{font-family:var(--fm)}.muted{color:var(--t3)}.device{font-family:var(--fm);font-size:.68rem}
.g2r{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}.g23{display:grid;grid-template-columns:2fr 1fr;gap:8px;margin-bottom:8px}
.bar-wrap{display:flex;align-items:center;gap:6px}.bar-track{flex:1;height:5px;background:var(--bg3);border-radius:3px;overflow:hidden}.bar-fill{height:100%;border-radius:3px;transition:width .5s}
.filter-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}.pills{display:flex;gap:2px;background:var(--bg2);padding:2px;border-radius:var(--r);flex-wrap:wrap}.pill{padding:3px 9px;border-radius:5px;cursor:pointer;font-size:.66rem;font-weight:500;color:var(--t3);border:none;background:none;font-family:var(--fs);transition:all .15s;white-space:nowrap}.pill:hover{color:var(--t2)}.pill.on{color:var(--t1);background:var(--bg1);box-shadow:var(--shadow)}
.tl-item{display:flex;gap:8px;padding:6px 0;position:relative}.tl-item:not(:last-child)::before{content:'';position:absolute;left:12px;top:28px;bottom:0;width:1px;background:var(--brd)}.tl-icon{width:24px;height:24px;border-radius:50%;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:.62rem;flex-shrink:0;border:1px solid var(--brd);z-index:1}.tl-body{flex:1;min-width:0}.tl-title{font-size:.74rem;font-weight:500;line-height:1.3}.tl-meta{font-size:.58rem;color:var(--t3);display:flex;gap:5px;align-items:center;margin-top:1px}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block;margin-right:4px}.dot-on{background:var(--green);box-shadow:0 0 6px var(--green)}.dot-off{background:var(--t4)}
.loading{display:flex;align-items:center;justify-content:center;gap:8px;padding:60px;color:var(--t3);font-size:.82rem}.spin{width:18px;height:18px;border:2px solid var(--brd);border-top-color:var(--accent);border-radius:50%;animation:spin .6s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.radar-sweep{transform-origin:50% 50%;animation:sweep 4s linear infinite}@keyframes sweep{to{transform:rotate(360deg)}}
@keyframes crit-flash{0%,100%{border-color:var(--brd);box-shadow:none}50%{border-color:var(--red);box-shadow:0 0 20px rgba(240,56,74,.12)}}.crit-flash .topbar{animation:topbar-flash 2s ease infinite}.crit-flash .kpi:first-child{animation:crit-flash 2s ease infinite}@keyframes topbar-flash{0%,100%{border-bottom-color:var(--brd)}50%{border-bottom-color:rgba(240,56,74,.35)}}
/* Tool chips */
.tool-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:5px;font-size:.62rem;font-weight:600;border:1px solid;background:var(--bg2);font-family:var(--fm)}
/* Tool grid */
.tool-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px}
.tool-card{background:var(--bg1);border:1px solid var(--brd);border-radius:var(--r2);padding:14px;transition:all .2s;position:relative}.tool-card:hover{border-color:var(--brd2);box-shadow:var(--glow)}.tool-card.enabled{border-left:3px solid var(--tc,var(--accent))}
.tc-top{display:flex;align-items:center;gap:10px;margin-bottom:8px}.tc-icon{font-size:1.3rem}.tc-info{flex:1;min-width:0}.tc-name{font-size:.82rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tc-cat{font-size:.62rem;color:var(--t3)}
.tc-desc{font-size:.7rem;color:var(--t2);margin-bottom:10px;line-height:1.4}
.tc-footer{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.tc-status{font-size:.65rem;display:flex;align-items:center;gap:2px;margin-right:auto}
.tc-btn{padding:4px 10px;border-radius:5px;font-size:.68rem;font-weight:600;cursor:pointer;border:1px solid var(--brd);background:var(--bg2);color:var(--t2);font-family:var(--fs);transition:all .15s}.tc-btn:hover{border-color:var(--brd2);color:var(--t1)}.tc-btn-primary{background:var(--accent);border-color:var(--accent);color:#fff}.tc-btn-primary:hover{opacity:.85}.tc-btn-danger{color:var(--red)}.tc-btn-danger:hover{background:var(--reds);border-color:var(--red)}
.kv-warn{font-size:.72rem;color:var(--amber);background:var(--ambers);border:1px solid rgba(237,160,51,.15);padding:6px 12px;border-radius:var(--r);line-height:1.5}
/* Toggle switch */
.toggle{position:relative;display:inline-block;width:34px;height:18px;flex-shrink:0}.toggle input{display:none}.toggle-slider{position:absolute;cursor:pointer;inset:0;background:var(--bg3);border-radius:18px;transition:.3s;border:1px solid var(--brd)}.toggle-slider::before{content:'';position:absolute;height:12px;width:12px;left:2px;bottom:2px;background:var(--t3);border-radius:50%;transition:.3s}.toggle input:checked+.toggle-slider{background:var(--greens);border-color:var(--green)}.toggle input:checked+.toggle-slider::before{transform:translateX(16px);background:var(--green)}
/* Modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px}.modal{background:var(--bg1);border:1px solid var(--brd);border-radius:var(--r2);width:100%;max-width:500px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.4)}.modal-hd{display:flex;justify-content:space-between;align-items:flex-start;padding:16px;border-bottom:1px solid var(--brd)}.modal-close{background:none;border:none;color:var(--t3);font-size:1rem;cursor:pointer;padding:4px}.modal-close:hover{color:var(--t1)}.modal-body{padding:16px;overflow-y:auto;flex:1}.modal-ft{padding:12px 16px;border-top:1px solid var(--brd);display:flex;justify-content:flex-end;gap:6px}.modal-docs{font-size:.68rem;color:var(--t2);background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:8px 10px;margin-bottom:12px;line-height:1.5}
.field{margin-bottom:10px}.field-label{display:block;font-size:.72rem;font-weight:600;margin-bottom:3px}.field-key{font-family:var(--fm);font-size:.6rem;color:var(--t3);font-weight:400}.field-input{width:100%;padding:7px 10px;background:var(--bg2);border:1px solid var(--brd);border-radius:6px;color:var(--t1);font-size:.8rem;font-family:var(--fm);outline:none;transition:border-color .2s}.field-input:focus{border-color:var(--accent)}.field-input::placeholder{color:var(--t4)}select.field-input{font-family:var(--fs)}
.modal-msg{font-size:.72rem;margin-top:8px;padding:6px 10px;border-radius:var(--r)}.modal-msg.ok{color:var(--green);background:var(--greens)}.modal-msg.err{color:var(--red);background:var(--reds)}
/* Mobile */
.mob-menu{display:none;background:none;border:none;color:var(--t1);font-size:1.2rem;cursor:pointer;padding:4px 8px}.mob-nav{display:none;background:var(--bg1);border-bottom:1px solid var(--brd);padding:8px 16px;gap:4px;flex-wrap:wrap}.mnav-btn{padding:8px 14px;border-radius:var(--r);border:1px solid var(--brd);background:var(--bg2);color:var(--t2);font-size:.8rem;font-family:var(--fs);cursor:pointer}.mnav-btn.active{background:var(--accent-s);color:var(--accent);border-color:var(--accent)}
.desk-only{}.mob-only{display:none!important}
@media(max-width:768px){.desk-only{display:none!important}.mob-only{display:flex!important}.mob-menu{display:block}.mob-nav{display:flex}.topbar{padding:0 12px;gap:8px}.main{padding:10px 10px 20px}.kpi-grid{grid-template-columns:repeat(2,1fr);gap:5px}.hero-grid{grid-template-columns:1fr 1fr;gap:6px}.g2r,.g23{grid-template-columns:1fr}.tool-grid{grid-template-columns:1fr}}
@media(max-width:480px){.kpi-grid{grid-template-columns:1fr 1fr}.hero-grid{grid-template-columns:1fr}.kpi{padding:10px 12px}.kpi-val{font-size:1.2rem}}`;
/* IOC Search */
.search-trigger{height:30px;padding:0 10px;border-radius:var(--r);border:1px solid var(--brd);background:var(--bg2);cursor:pointer;font-size:.72rem;font-family:var(--fs);color:var(--t2);display:flex;align-items:center;gap:4px;transition:all .15s}.search-trigger:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-s)}
.ioc-result{padding:8px 10px;border:1px solid var(--brd);border-radius:var(--r);margin-bottom:6px;background:var(--bg2);transition:border-color .15s}.ioc-result:hover{border-color:var(--brd2)}
/* Response Actions */
.action-dropdown{position:absolute;right:0;top:100%;margin-top:4px;background:var(--bg1);border:1px solid var(--brd);border-radius:var(--r2);box-shadow:0 8px 24px rgba(0,0,0,.3);z-index:50;min-width:220px;padding:4px}
.action-item{display:block;width:100%;text-align:left;padding:6px 10px;border:none;background:none;color:var(--t1);font-size:.72rem;font-family:var(--fs);cursor:pointer;border-radius:5px;transition:all .15s}.action-item:hover{background:var(--bg2)}.action-item:disabled{opacity:.5}
.action-result{padding:6px 8px;margin:4px;border-radius:5px;font-size:.68rem}.action-result.ok{background:var(--greens);color:var(--green)}.action-result.err{background:var(--reds);color:var(--red)}
/* Correlation */
.corr-group td{background:var(--accent-s)!important}
`;