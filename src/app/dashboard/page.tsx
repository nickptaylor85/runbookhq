'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TOOLS, type ToolInfo, type ToolField } from '@/lib/tool-registry-client';
import React from 'react';

class DashErrorBoundary extends React.Component<{children:React.ReactNode},{error:any}>{
  constructor(props:any){super(props);this.state={error:null}}
  static getDerivedStateFromError(error:any){return{error}}
  render(){if(this.state.error)return React.createElement('div',{style:{padding:40,background:'#0a0d15',color:'#ff4466',minHeight:'100vh',fontFamily:'monospace'}},React.createElement('h1',null,'Dashboard Error'),React.createElement('pre',{style:{whiteSpace:'pre-wrap',fontSize:14,marginTop:20,color:'#eaf0ff'}},String(this.state.error?.message||this.state.error)),React.createElement('pre',{style:{whiteSpace:'pre-wrap',fontSize:11,marginTop:10,color:'#8896b8'}},String(this.state.error?.stack||'')),React.createElement('a',{href:'/test',style:{color:'#5b9aff',marginTop:20,display:'block'}},'Go to diagnostic page'));return this.props.children}
}


/* ═══ SVG COMPONENTS ═══ */

/* ═══ PLAN GATING ═══ */
function LockedFeature({featureId,plan,children}:{featureId:string;plan:string;children:React.ReactNode}){
  const plans=['community','team','business','mssp','enterprise'];
  const featureMap:Record<string,number>={dashboard:0,alerts:0,coverage:0,ai_triage:1,ai_copilot:1,runbooks:1,incidents:1,vulns:1,intel:1,sla:1,tv_wall:1,shift_handover:1,noise_reduction:1,unlimited_tools:1,compliance:2,pdf_reports:2,api_access:2,rbac:2,exec_summary:2,portfolio:3,client_reports:3,cross_correlation:3,white_label:3};
  const minPlanIdx=featureMap[featureId]??0;
  const userPlanIdx=plans.indexOf(plan||'community');
  if(userPlanIdx>=minPlanIdx)return <>{children}</>;
  const minPlan=['Community','Team','Business','MSSP','Enterprise'][minPlanIdx];
  const upgradeTexts:Record<string,string>={ai_triage:'AI triage classifies every alert — TP, FP, or Suspicious with evidence and runbooks.',ai_copilot:'Click any alert for instant AI analysis, runbook generation, and related alerts.',vulns:'Deep vulnerability management with VPR scoring and patch prioritisation.',intel:'Live threat feeds from CISA KEV, ThreatFox, URLhaus + MITRE heatmap.',incidents:'Track incidents from detection to resolution with full audit trail.',noise_reduction:'Auto-close false positives above 95% AI confidence. Saves 30+ hours/week.',compliance:'SOC 2 and ISO 27001 control mapping with automated coverage scoring.',pdf_reports:'One-click CISO-ready security reports with posture trends.',portfolio:'Multi-tenant dashboard — see all clients at a glance.',exec_summary:'AI-generated board-ready security summaries.'};
  return <div style={{position:'relative',opacity:.5,pointerEvents:'none',filter:'blur(1px)'}}>{children}<div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--bg0)cc',backdropFilter:'blur(4px)',borderRadius:'var(--r)',zIndex:10,pointerEvents:'auto'}}><div style={{fontSize:'1.8rem',marginBottom:8}}>🔒</div><div style={{fontSize:'.82rem',fontWeight:700,marginBottom:4}}>Upgrade to {minPlan}</div><div style={{fontSize:'.7rem',color:'var(--t3)',maxWidth:280,textAlign:'center',lineHeight:1.5,marginBottom:12}}>{upgradeTexts[featureId]||'Unlock this feature by upgrading your plan.'}</div><button className="tc-btn tc-btn-primary" onClick={()=>window.location.href='/pricing'} style={{fontSize:'.72rem',padding:'6px 16px'}}>View Plans →</button></div></div>;
}

function Spark({ data, color = '#4f8fff', h = 30, w = 94 }: { data: number[]; color?: string; h?: number; w?: number }) {
  if (!data.length) return null;
  const mx = Math.max(...data), mn = Math.min(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 4) - 2}`).join(' ');
  const lastY = h - ((data[data.length - 1] - mn) / rng) * (h - 4) - 2;
  const gid='sg'+color.replace(/\W/g,'')+'x';
  return <svg width={w} height={h} style={{ display:'block' }}><defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".3"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient><filter id={'gl'+gid}><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gid})`}/><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter={`url(#gl${gid})`} style={{opacity:.9}}/><circle cx={w} cy={lastY} r="3" fill={color}><animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite"/></circle></svg>;
}
function SevRing({ c, h, m, l, size = 100 }: { c: number; h: number; m: number; l: number; size?: number }) {
  const total = c + h + m + l || 1, r = (size - 16) / 2, circ = 2 * Math.PI * r;
  const segs = [{p:c/total,co:'var(--red)',gl:'#f0384a'},{p:h/total,co:'#f97316',gl:'#f97316'},{p:m/total,co:'var(--amber)',gl:'#eda033'},{p:l/total,co:'var(--blue)',gl:'#4f8fff'}];
  let off = 0;
  return <div style={{position:'relative',width:size,height:size}}><svg width={size} height={size} style={{transform:'rotate(-90deg)'}}><defs>{segs.map((s,i)=>(<filter key={i} id={'sr'+i}><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>))}</defs><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg3)" strokeWidth="10" opacity=".3"/>{segs.map((s,i)=>{const dash=s.p*circ;const el=<circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.co} strokeWidth="10" strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-off} strokeLinecap="round" filter={`url(#sr${i})`} style={{transition:'stroke-dasharray .8s ease'}}/>;off+=dash;return el;})}</svg><div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center'}}><div style={{fontSize:'1.1rem',fontWeight:900,fontFamily:'var(--fm)',color:'var(--t1)',letterSpacing:'-1px'}}>{total}</div><div style={{fontSize:'.42rem',color:'var(--t3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px'}}>Total</div></div></div>;
}
function HourlyChart({ data, h = 60, w = 220 }: { data: number[]; h?: number; w?: number }) {
  const mx = Math.max(...data)||1, bw = w/data.length-1;
  return <svg width={w} height={h}><defs><linearGradient id="hcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity="1"/><stop offset="100%" stopColor="var(--accent)" stopOpacity=".2"/></linearGradient><linearGradient id="hcga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c6aff" stopOpacity="1"/><stop offset="100%" stopColor="var(--accent)" stopOpacity=".4"/></linearGradient><filter id="hcgl"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>{data.map((v,i)=>{const bh=Math.max(2,(v/mx)*(h-12));const isLast=i===data.length-1;return <rect key={i} x={i*(bw+1)} y={h-bh} width={bw} height={bh} rx="2" fill={isLast?'url(#hcga)':'url(#hcg)'} opacity={isLast?1:0.3+((i/data.length)*0.5)} filter={isLast?'url(#hcgl)':'none'} style={{transition:'height .3s ease,y .3s ease'}}/>})}</svg>;
}
function Donut({ val, max, color, sz=56, label }: { val:number;max:number;color:string;sz?:number;label:string }) {
  const pct=Math.round((val/max)*100),r=(sz-10)/2,circ=2*Math.PI*r,off=circ-(pct/100)*circ;
  const fid='dg'+label.replace(/\W/g,'');
  return <div style={{textAlign:'center'}}><svg width={sz} height={sz} style={{transform:'rotate(-90deg)'}}><defs><filter id={fid}><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="var(--bg3)" strokeWidth="5" opacity=".3"/><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" filter={`url(#${fid})`} style={{transition:'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)'}}/></svg><div style={{marginTop:-(sz/2)-6,position:'relative'}}><div style={{fontSize:'.82rem',fontWeight:900,fontFamily:'var(--fm)',color,textShadow:`0 0 12px ${color}40`}}>{pct}%</div></div><div style={{fontSize:'.5rem',color:'var(--t3)',marginTop:10,fontWeight:700,letterSpacing:'.5px',textTransform:'uppercase'}}>{label}</div></div>;
}


/* ═══ REFRESH BUTTON ═══ */
function RefreshBtn({onClick,loading}:{onClick:()=>void;loading?:boolean}){return <button className="refresh-btn" onClick={onClick} disabled={loading} style={{fontSize:'.6rem',padding:'2px 6px'}}>{loading?<span className="spin" style={{width:12,height:12,display:'inline-block',borderWidth:1.5}}/>:'↻'}</button>}

/* ═══ HELPERS ═══ */
function gen(b:number,v:number,n=24){const d:number[]=[];let c=b;for(let i=0;i<n;i++){c+=(Math.random()-.45)*v;c=Math.max(0,c);d.push(Math.round(c))}return d}
function ago(ts:string){const d=(Date.now()-new Date(ts).getTime())/1000;if(d<60)return`${~~d}s`;if(d<3600)return`${~~(d/60)}m`;if(d<86400)return`${~~(d/3600)}h`;return`${~~(d/86400)}d`}
function sc(s:string){return s.includes('Defender')?'defender':s.includes('Taegis')?'taegis':s.includes('Tenable')?'tenable':s.includes('Zscaler')?'zscaler':s.includes('Crowd')?'crowdstrike':s.includes('Sentinel')?'sentinelone':s.includes('Dark')?'darktrace':s.includes('Recorded')?'recordedfuture':''}
const SO:Record<string,number>={critical:0,high:1,medium:2,low:3,info:4};
const TL:any[]=[];
type Tab='overview'|'alerts'|'coverage'|'vulns'|'intel'|'incidents'|'tools';
type Al={id:string;title:string;severity:string;status:string;source:string;category:string;device:string;user:string;timestamp:string;mitre:string};


/* ═══ IOC SEARCH ═══ */
function IOCSearch({open,onClose}:{open:boolean;onClose:()=>void}){
  const[q,setQ]=useState('');const[results,setResults]=useState<any>(null);const[searching,setSearching]=useState(false);
  async function search(){if(q.length<3)return;setSearching(true);try{const r=await fetch('/api/ioc-search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ioc:q})});setResults(await r.json())}catch(e){setResults({error:'Search failed'})}setSearching(false)}
  if(!open)return null;
  return(<div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:640}}><div className="modal-hd"><h3 style={{fontSize:'.95rem'}}>🔍 IOC Search — All Tools</h3><button className="modal-close" onClick={onClose}>✕</button></div><div className="modal-body"><div style={{display:'flex',gap:6,marginBottom:12}}><input className="field-input" placeholder="IP, domain, hash, CVE, hostname, username..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} autoFocus style={{flex:1}}/><button className="tc-btn tc-btn-primary" onClick={search} disabled={searching}>{searching?'Searching...':'Search'}</button></div><div style={{fontSize:'.65rem',color:'var(--t3)',marginBottom:12}}>Searches across: Defender MDE/XDR, Taegis, Tenable, Zscaler ZIA, CrowdStrike, SentinelOne, Darktrace, Recorded Future</div>{results&&<><div style={{fontSize:'.78rem',fontWeight:700,marginBottom:8}}>{results.resultCount||0} results for <span className="mono" style={{color:'var(--accent)'}}>{results.ioc}</span></div>{results.results?.map((r:any,i:number)=>(<div key={i} className="ioc-result"><div style={{display:'flex',gap:6,alignItems:'center',marginBottom:3}}><span className={`src ${sc(r.tool)}`}>{r.tool}</span><span className={`sev sev-${r.severity}`}>{r.severity}</span><span style={{fontSize:'.62rem',color:'var(--t3)',background:'var(--bg3)',padding:'1px 5px',borderRadius:3}}>{r.type.replace(/_/g,' ')}</span></div><div style={{fontSize:'.82rem',fontWeight:600}}>{r.match}</div><div style={{fontSize:'.72rem',color:'var(--t2)'}}>{r.detail}</div></div>))}{results.resultCount===0&&<div style={{textAlign:'center',padding:20,color:'var(--t3)'}}>No matches found across connected tools</div>}</>}</div></div></div>);
}

/* ═══ RESPONSE ACTIONS ═══ */
function ActionMenu({alert,onDone}:{alert:any;onDone:()=>void}){
  const[open,setOpen]=useState(false);const[loading,setLoading]=useState('');const[result,setResult]=useState<any>(null);
  const actions=[
    {id:'isolate_device',label:'🔒 Isolate Device (Taegis)',target:alert.device,tool:'Taegis XDR',show:!!alert.device},
    {id:'restore_device',label:'🔓 Restore Device (Taegis)',target:alert.device,tool:'Taegis XDR',show:!!alert.device},
    {id:'block_ip',label:'🚫 Block IP',target:'185.220.101.42',tool:'Zscaler ZIA',show:true},
    {id:'disable_user',label:'👤 Disable User',target:alert.user,tool:'Azure AD',show:!!alert.user},
    {id:'quarantine_file',label:'📦 Quarantine File',target:alert.device,tool:alert.source,show:!!alert.device},
    {id:'run_scan',label:'🔍 Run AV Scan',target:alert.device,tool:alert.source,show:!!alert.device},
    {id:'collect_evidence',label:'🧲 Collect Evidence',target:alert.device,tool:alert.source,show:!!alert.device},
  ].filter(a=>a.show);
  async function exec(a:any){setLoading(a.id);try{const r=await fetch('/api/response-actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:a.id,target:a.target,tool:a.tool,alertId:alert.id})});setResult(await r.json())}catch(e){setResult({error:'Action failed'})}setLoading('')}
  return(<div style={{position:'relative'}}><button className="tc-btn" onClick={()=>setOpen(!open)} style={{fontSize:'.6rem',padding:'2px 6px'}}>⚡ Act</button>{open&&<div className="action-dropdown">{actions.map(a=>(<button key={a.id} className="action-item" onClick={()=>exec(a)} disabled={!!loading}>{loading===a.id?'Running...':a.label}<span className="muted" style={{fontSize:'.55rem',marginLeft:4}}>{a.target}</span></button>))}{result&&<div className={`action-result ${result.ok?'ok':'err'}`}>{result.ok?`✓ ${result.message}`:result.error}</div>}</div>}</div>);
}

/* ═══ EXPORT ═══ */
function ExportBtn({data,filename,label='Export'}:{data:()=>any[];filename:string;label?:string}){
  function toCSV(){const rows=data();if(!rows.length)return;const keys=Object.keys(rows[0]);const csv=[keys.join(','),...rows.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');dl(csv,'text/csv',filename+'.csv')}
  function dl(content:string,mime:string,name:string){const b=new Blob([content],{type:mime});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}
  return <div style={{display:'flex',gap:4}}><button className="tc-btn" onClick={toCSV} style={{fontSize:'.62rem',padding:'2px 8px'}}>📥 CSV</button></div>;
}



/* ═══ MITRE ATT&CK HEATMAP ═══ */
const TACTICS=[{id:'TA0001',n:'Initial Access',t:['T1566','T1190','T1078']},{id:'TA0002',n:'Execution',t:['T1059.001','T1569.002']},{id:'TA0003',n:'Persistence',t:['T1053.005','T1547.001']},{id:'TA0004',n:'Priv Esc',t:['T1078']},{id:'TA0005',n:'Def Evasion',t:['T1027','T1070','T1036','T1562.001']},{id:'TA0006',n:'Cred Access',t:['T1003.001','T1110']},{id:'TA0007',n:'Discovery',t:['T1018','T1082']},{id:'TA0008',n:'Lateral Mvmt',t:['T1021.002']},{id:'TA0009',n:'Collection',t:[]},{id:'TA0010',n:'Exfiltration',t:['T1048','T1567.002']},{id:'TA0011',n:'C2',t:['T1071.001','T1572']}];

function MitreHeatmap({alerts}:{alerts:Al[]}){
  // Build technique counts from alerts
  const techCounts:Record<string,{count:number;sev:string}>={};
  alerts.forEach(a=>{if(a.mitre){const existing=techCounts[a.mitre];if(!existing||SO[a.severity]<SO[existing.sev])techCounts[a.mitre]={count:(existing?.count||0)+1,sev:a.severity};else if(existing)existing.count++}});
  // Only show techniques from actual alerts
  const sevColor=(s:string)=>s==='critical'?'var(--red)':s==='high'?'#f97316':s==='medium'?'var(--amber)':'var(--blue)';
  return(<div className="panel"><div className="panel-hd"><h3>🗺 MITRE ATT&CK Coverage</h3><span className="count">{Object.keys(techCounts).length} techniques</span></div><div style={{padding:'10px',overflowX:'auto'}}><div style={{display:'grid',gridTemplateColumns:`repeat(${TACTICS.length},1fr)`,gap:3,minWidth:700}}>{TACTICS.map(tac=>(<div key={tac.id}><div style={{fontSize:'.52rem',fontWeight:700,color:'var(--t3)',textAlign:'center',padding:'4px 2px',textTransform:'uppercase',letterSpacing:'.3px',borderBottom:'1px solid var(--brd)',marginBottom:3}}>{tac.n}</div>{tac.t.map(tech=>{const d=techCounts[tech];return <div key={tech} style={{background:d?sevColor(d.sev)+'18':'var(--bg3)',border:`1px solid ${d?sevColor(d.sev)+'30':'var(--brd)'}`,borderRadius:4,padding:'4px 3px',marginBottom:2,textAlign:'center',cursor:'default',transition:'all .15s'}} title={`${tech}: ${d?.count||0} alerts (${d?.sev||'none'})`}><div style={{fontSize:'.52rem',fontFamily:'var(--fm)',fontWeight:600,color:d?sevColor(d.sev):'var(--t4)'}}>{tech.replace('T','')}</div>{d&&<div style={{fontSize:'.62rem',fontWeight:800,fontFamily:'var(--fm)',color:sevColor(d.sev)}}>{d.count}</div>}</div>})}{tac.t.length===0&&<div style={{fontSize:'.55rem',color:'var(--t4)',textAlign:'center',padding:8}}>—</div>}</div>))}</div><div style={{display:'flex',gap:12,justifyContent:'center',marginTop:8,fontSize:'.55rem',color:'var(--t3)'}}><span><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'var(--red)',opacity:.6,marginRight:3}}/>Critical</span><span><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'#f97316',opacity:.6,marginRight:3}}/>High</span><span><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'var(--amber)',opacity:.6,marginRight:3}}/>Medium</span><span><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'var(--blue)',opacity:.6,marginRight:3}}/>Low</span><span><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'var(--bg3)',border:'1px solid var(--brd)',marginRight:3}}/>No alerts</span></div></div></div>);
}

/* ═══ TREND CHARTS ═══ */
function TrendCharts(){
  const[period,setPeriod]=useState<'7d'|'30d'|'90d'>('7d');
  const td={mttr:{'7d':[38,35,42,31,28,33,32],'30d':[45,42,40,38,41,39,36,38,35,33,37,34,32,35,33,31,34,32,30,33,31,29,32,30,28,31,29,32,30,32],'90d':[52,48,45,42,40,38,36,35,33,32,31,32]},mttd:{'7d':[12,10,11,9,8,9,8.5],'30d':[15,14,13,12,13,11,12,10,11,10,9,10,9,8,9,8,9,8,8.5,9,8,8.5,8,9,8,8.5,8,8.5,8,8.5],'90d':[18,16,14,13,12,11,10,9.5,9,8.5,8.5,8.5]},alerts:{'7d':[142,158,134,167,155,128,147],'30d':[120,132,145,138,142,158,134,167,155,128,147,162,138,145,152,148,135,142,155,160,148,138,145,150,142,138,155,148,142,147],'90d':[1020,1150,1080,1200,1100,1050,980,1020,1080,1050,1020,1040]},vulns:{'7d':[28,26,25,24,24,23,24],'30d':[35,34,32,31,30,29,28,27,28,26,25,26,25,24,25,24,24,23,24,23,24,23,24,24,23,24,24,23,24,24],'90d':[48,45,42,38,35,32,30,28,26,25,24,24]}};
  const charts=[{label:'MTTR (min)',d:td.mttr[period],color:'var(--amber)'},{label:'MTTD (min)',d:td.mttd[period],color:'var(--green)'},{label:'Alert Volume',d:td.alerts[period],color:'var(--accent)'},{label:'Critical Vulns',d:td.vulns[period],color:'var(--red)'}];
  function ChartCard({label,d,color}:{label:string;d:number[];color:string}){const last=d[d.length-1],first=d[0],change=((last-first)/first*100).toFixed(1),isDown=last<first;return <div style={{padding:'8px 10px',background:'var(--bg2)',borderRadius:'var(--r)',border:'1px solid var(--brd)'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}><span style={{fontSize:'.68rem',fontWeight:700,color:'var(--t2)'}}>{label}</span><span style={{fontSize:'.6rem',fontWeight:700,color:isDown?'var(--green)':'var(--t3)'}}>{Number(change)>0?'+':''}{change}%</span></div><Spark data={d} color={color} w={200} h={40}/><div style={{display:'flex',justifyContent:'space-between',fontSize:'.52rem',color:'var(--t3)',fontFamily:'var(--fm)',marginTop:4}}><span>{period==='7d'?'Mon':'Start'}</span><span style={{fontWeight:700,color:'var(--t1)'}}>{last}</span><span>Now</span></div></div>}
  return <div className="panel"><div className="panel-hd"><h3>📈 Trends</h3><div className="pills" style={{margin:0}}>{(['7d','30d','90d'] as const).map(p=>(<button key={p} className={`pill ${period===p?'on':''}`} onClick={()=>setPeriod(p)}>{p}</button>))}</div></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:8,padding:12}}>{charts.map(ch=>(<ChartCard key={ch.label} label={ch.label} d={ch.d} color={ch.color}/>))}</div></div>;
}

/* ═══ AI CO-PILOT PANEL ═══ */
function AICopilot({alert,onClose,allAlerts,customRunbooks}:{alert:Al|null;onClose:()=>void;allAlerts?:Al[];customRunbooks?:any[]}){
  const[response,setResponse]=useState('');const[loading,setLoading]=useState(false);const[question,setQuestion]=useState('');const[tab,setTab]=useState<'analysis'|'related'|'runbook'>('analysis');
  async function ask(q?:string){setLoading(true);setResponse('');try{const r=await fetch('/api/ai-copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({alert,question:q||question||undefined})});const d=await r.json();setResponse(d.response)}catch(e){setResponse('Failed to get response.')}setLoading(false)}
  useEffect(()=>{if(alert)ask()},[]);
  if(!alert)return null;
  const related=(allAlerts||[]).filter(a=>a.id!==alert.id&&(a.device===alert.device||a.user===alert.user)&&alert.device).slice(0,8);
  const runbook=getRunbook(alert,customRunbooks);
  return(<div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:640}}><div className="modal-hd"><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:'1.2rem'}}>🤖</span><div><h3 style={{fontSize:'.9rem'}}>AI Co-Pilot</h3><p className="muted" style={{fontSize:'.62rem'}}>{alert.title}</p></div></div><button className="modal-close" onClick={onClose}>✕</button></div><div style={{display:'flex',borderBottom:'1px solid var(--brd)'}}><button className={`cop-tab ${tab==='analysis'?'active':''}`} onClick={()=>setTab('analysis')}>🤖 Analysis</button><button className={`cop-tab ${tab==='runbook'?'active':''}`} onClick={()=>setTab('runbook')}>📋 Runbook ({runbook.length})</button><button className={`cop-tab ${tab==='related'?'active':''}`} onClick={()=>setTab('related')}>🔗 Related ({related.length})</button></div><div className="modal-body"><div style={{display:'flex',gap:4,marginBottom:10,flexWrap:'wrap'}}><span className={`sev sev-${alert.severity}`}>{alert.severity}</span><span className={`src ${sc(alert.source)}`}>{alert.source}</span>{alert.mitre&&<span className="mitre">{alert.mitre}</span>}{alert.device&&<span className="device">{alert.device}</span>}</div>{tab==='analysis'&&<>{loading?<div style={{padding:20,textAlign:'center'}}><span className="spin" style={{display:'inline-block'}}/> Analysing...</div>:response?<div className="ai-response">{response.split('\n').map((line,i)=>line?<p key={i} style={{marginBottom:6}} dangerouslySetInnerHTML={{__html:line.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')}}/>:null)}</div>:null}<div style={{display:'flex',gap:4,marginTop:10}}><input className="field-input" placeholder="Ask a follow-up..." value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==='Enter'&&ask()} style={{flex:1}}/><button className="tc-btn tc-btn-primary" onClick={()=>ask()} disabled={loading}>Ask</button></div><div style={{display:'flex',gap:4,marginTop:6,flexWrap:'wrap'}}>{['What should I check first?','Write a containment plan','Is this a known TTP?','Track SLA deadline'].map(q=>(<button key={q} className="tc-btn" style={{fontSize:'.56rem',padding:'2px 5px'}} onClick={()=>{setQuestion(q);ask(q)}}>{q}</button>))}</div></>}{tab==='runbook'&&<div className="runbook">{runbook.map((step,i)=>(<div key={i} className="rb-step"><div className="rb-num">{i+1}</div><div className="rb-body"><div className="rb-title">{step.title}</div><div className="rb-detail">{step.detail}</div>{step.cmd&&<div className="rb-cmd">{step.cmd}</div>}</div></div>))}</div>}{tab==='related'&&<div>{related.length===0?<div style={{textAlign:'center',padding:20,color:'var(--t3)',fontSize:'.78rem'}}>{alert.device?'No other alerts for '+alert.device:'No device context available'}</div>:related.map(a=>(<div key={a.id} className="stream-item" style={{marginBottom:4,cursor:'default'}}><div className="stream-sev" style={{background:a.severity==='critical'?'var(--red)':'#f97316'}}/><div style={{flex:1}}><div style={{fontSize:'.72rem',fontWeight:600}}>{a.title}</div><div style={{display:'flex',gap:4,marginTop:2}}><span className={`src ${sc(a.source)}`} style={{fontSize:'.48rem'}}>{a.source}</span><span className="ts" style={{fontSize:'.52rem'}}>{ago(a.timestamp)}</span></div></div></div>))}</div>}<div style={{borderTop:'1px solid var(--brd)',paddingTop:8,marginTop:10}}><button className="tc-btn tc-btn-primary" onClick={()=>{fetch('/api/taegis/investigate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Investigation: '+alert.title,description:response?.substring(0,500)||alert.title,priority:alert.severity==='critical'?1:2})}).then(r=>r.json()).then(d=>{if(d.ok)setResponse(prev=>prev+'\n\n✅ Investigation created: '+(d.investigation?.short_id||''));else setResponse(prev=>prev+'\n\n❌ '+d.error)})}} style={{fontSize:'.66rem'}}>📋 Create Taegis Investigation</button><button className="tc-btn" onClick={()=>{fetch('/api/incidents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create',title:alert.title,severity:alert.severity,alertId:alert.id,alertTitle:alert.title})}).then(r=>r.json()).then(d=>{if(d.ok)setResponse(prev=>prev+'\n\n✅ Incident created: '+d.incident?.id);else setResponse(prev=>prev+'\n\n❌ '+(d.error||''))})}} style={{fontSize:'.66rem',marginLeft:4}}>📁 Create Incident</button><button className="tc-btn" onClick={()=>{fetch('/api/sla',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'track',alertId:alert.id,alertTitle:alert.title,severity:alert.severity})}).then(r=>r.json()).then(d=>{if(d.ok)setResponse(prev=>prev+'\n\n✅ SLA tracking started');else setResponse(prev=>prev+'\n\n❌ '+(d.error||''))})}} style={{fontSize:'.66rem',marginLeft:4}}>⏱ Track SLA</button></div></div></div></div>);
}

function getRunbook(alert:Al,custom?:any[]){
  if(custom&&custom.length>0){const t=alert.title?.toLowerCase()||'';for(const rb of custom){if(rb.triggerKeywords?.some((k:string)=>t.includes(k.toLowerCase()))){return rb.steps}}}
  const t=alert.title?.toLowerCase()||'';const steps:any[]=[];
  if(t.includes('phish')||t.includes('credential')||t.includes('login')){steps.push({title:'Quarantine the email/source',detail:'Isolate the phishing email from all mailboxes. Block sender domain.',cmd:'Search-Mailbox -SearchQuery "from:sender" -DeleteContent'},{title:'Reset affected credentials',detail:'Force password reset for any user who clicked or submitted credentials.',cmd:null},{title:'Check authentication logs',detail:'Review sign-in logs for the affected user for the last 24 hours. Look for impossible travel or new device.',cmd:null},{title:'Block IOCs',detail:'Add sender IP, domain, and any payload hashes to blocklists across all tools.',cmd:null},{title:'Notify affected users',detail:'Send targeted awareness notification to all recipients.',cmd:null})}
  else if(t.includes('powershell')||t.includes('script')||t.includes('execution')||t.includes('command')){steps.push({title:'Capture the process tree',detail:'Get the full process lineage — what spawned this process and what it spawned.',cmd:null},{title:'Decode the payload',detail:'If base64 encoded, decode and analyse the command. Check for download cradles.',cmd:'echo [encoded] | base64 -d'},{title:'Check for persistence',detail:'Look for new scheduled tasks, registry run keys, or services created around the same time.',cmd:null},{title:'Isolate if active C2',detail:'If command connects to external IP, isolate the device immediately.',cmd:null},{title:'Collect forensic image',detail:'Before cleanup, capture memory dump and disk image for evidence.',cmd:null})}
  else if(t.includes('lateral')||t.includes('smb')||t.includes('rdp')||t.includes('movement')){steps.push({title:'Identify source and target',detail:'Map the exact path: which account, from which device, to which target.',cmd:null},{title:'Disable compromised account',detail:'Immediately disable the account used for lateral movement.',cmd:null},{title:'Isolate target device',detail:'Network-isolate the target to prevent further spread.',cmd:null},{title:'Check for data access',detail:'Review file access logs on the target for exfiltration indicators.',cmd:null},{title:'Reset service account passwords',detail:'If a service account was used, rotate all credentials.',cmd:null})}
  else if(t.includes('malware')||t.includes('trojan')||t.includes('virus')||t.includes('ransomware')){steps.push({title:'Isolate the device',detail:'Immediately network-isolate to prevent lateral movement.',cmd:null},{title:'Identify the malware family',detail:'Check hash against VirusTotal. Determine capabilities and IOCs.',cmd:null},{title:'Block IOCs across all tools',detail:'Add file hashes, C2 IPs, and domains to all security tool blocklists.',cmd:null},{title:'Check for other infections',detail:'Search across all endpoints for the same file hash or behaviour.',cmd:null},{title:'Reimage if necessary',detail:'If rootkit or persistent malware, full reimage may be required.',cmd:null})}
  else{steps.push({title:'Assess the alert',detail:'Determine if this is a true positive. Check the source, context, and affected assets.',cmd:null},{title:'Gather evidence',detail:'Collect logs, screenshots, and artefacts related to this alert.',cmd:null},{title:'Contain if needed',detail:'If confirmed malicious, isolate affected devices and disable compromised accounts.',cmd:null},{title:'Escalate appropriately',detail:'If high impact, escalate to incident response team and notify management.',cmd:null},{title:'Document and close',detail:'Record findings, actions taken, and close the alert with appropriate classification.',cmd:null})}
  return steps;
}

/* ═══ EXEC SUMMARY ═══ */
function OnboardingTour({open,onClose}:{open:boolean;onClose:()=>void}){
  const[step,setStep]=useState(0);
  const steps=[
    {target:'overview',title:'Welcome to Watchtower',desc:'Your single pane of glass for security operations. This overview shows your posture score, active alerts, noise reduction stats, and SLA tracking — all in real-time.',icon:'🏰'},
    {target:'alerts',title:'Unified Alert Feed',desc:'Every alert from every connected tool in one stream. Click any alert to get AI-powered analysis, or enable Auto-Triage to classify all alerts automatically.',icon:'⚡'},
    {target:'coverage',title:'Agent Coverage',desc:'See which devices have security agents and which have gaps. Track coverage percentage, stale devices, and OS breakdown across your fleet.',icon:'📡'},
    {target:'tools',title:'Connect Your Tools',desc:'Add your Tenable, Taegis, CrowdStrike, Defender, and 16+ more tool credentials here. Each tool starts pulling data immediately.',icon:'🔌'},
    {target:'ai',title:'AI Auto-Triage',desc:'The core of Watchtower. AI analyses every alert with context — device history, user behaviour, MITRE technique — and returns a verdict with evidence. False positives are auto-closed. True positives create incidents.',icon:'🤖'},
  ];
  if(!open)return null;
  const s=steps[step];
  return <div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}><div className="modal-hd"><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:'1.5rem'}}>{s.icon}</span><h3 style={{fontSize:'.95rem'}}>{s.title}</h3></div><button className="modal-close" onClick={onClose}>✕</button></div><div className="modal-body"><p style={{fontSize:'.82rem',color:'var(--t2)',lineHeight:1.7}}>{s.desc}</p><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:16}}><div style={{display:'flex',gap:4}}>{steps.map((_,i)=>(<div key={i} style={{width:8,height:8,borderRadius:'50%',background:i===step?'var(--accent)':i<step?'var(--green)':'var(--bg4)',transition:'all .2s'}}/>))}</div><div style={{display:'flex',gap:6}}>{step>0&&<button className="tc-btn" onClick={()=>setStep(step-1)} style={{fontSize:'.72rem',padding:'5px 12px'}}>← Back</button>}{step<steps.length-1?<button className="tc-btn tc-btn-primary" onClick={()=>setStep(step+1)} style={{fontSize:'.72rem',padding:'5px 12px'}}>Next →</button>:<button className="tc-btn tc-btn-primary" onClick={onClose} style={{fontSize:'.72rem',padding:'5px 12px'}}>Get Started →</button>}</div></div></div></div></div>;
}

function CmdPalette({open,onClose,onSelect}:{open:boolean;onClose:()=>void;onSelect:(tab:string)=>void}){
  const[q,setQ]=useState('');
  const items=[
    {id:'overview',icon:'◉',label:'Overview — War Room',keywords:'home main kpi posture score'},
    {id:'alerts',icon:'⚡',label:'Alert Feed',keywords:'alerts incidents detections triage'},
    {id:'coverage',icon:'🛡',label:'Agent Coverage',keywords:'devices endpoints agents gaps taegis'},
    {id:'vulns',icon:'🔓',label:'Vulnerabilities',keywords:'cve tenable vulns patching compliance scans'},
    {id:'intel',icon:'🔮',label:'Threat Intelligence',keywords:'intel mitre attack chain predictions'},
    {id:'tools',icon:'🔌',label:'Tool Integrations',keywords:'settings config credentials api'},
    {id:'ioc',icon:'🔍',label:'IOC Search',keywords:'search ip domain hash indicator'},
    {id:'guide',icon:'📖',label:'User Guide',keywords:'help documentation guide shortcuts'},
    {id:'exec',icon:'📋',label:'Executive Summary',keywords:'report ciso board summary'},
    {id:'handover',icon:'🔄',label:'Shift Handover',keywords:'handover shift summary briefing'},
    {id:'tvwall',icon:'📺',label:'TV Wall Mode',keywords:'fullscreen wall tv display monitor soc'},
    {id:'theme',icon:'🌓',label:'Toggle Theme',keywords:'dark light theme mode'},
  ];
  const filtered=q?items.filter(i=>(i.label+' '+i.keywords).toLowerCase().includes(q.toLowerCase())):items;
  if(!open)return null;
  return(<div className="modal-overlay" onClick={onClose}><div className="cmd-palette" onClick={e=>e.stopPropagation()}><div className="cmd-input-wrap"><span style={{color:'var(--t3)'}}>⌘</span><input className="cmd-input" placeholder="Jump to..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Escape')onClose();if(e.key==='Enter'&&filtered.length>0){onSelect(filtered[0].id);onClose();setQ('')}}} autoFocus/></div><div className="cmd-list">{filtered.map(i=>(<button key={i.id} className="cmd-item" onClick={()=>{onSelect(i.id);onClose();setQ('')}}><span className="cmd-icon">{i.icon}</span>{i.label}</button>))}</div></div></div>);
}

/* ═══ DEVICE DEEP-DIVE ═══ */
function DeviceDrawer({hostname,alerts,onClose}:{hostname:string|null;alerts:any[];onClose:()=>void}){
  if(!hostname)return null;
  const deviceAlerts=alerts.filter((a:any)=>a.device===hostname);
  const sources=[...new Set(deviceAlerts.map((a:any)=>a.source))];
  return(<div className="drawer-overlay" onClick={onClose}><div className="drawer" onClick={e=>e.stopPropagation()}><div className="guide-hd"><div><h2 style={{fontSize:'.95rem',fontWeight:800,fontFamily:'var(--fm)'}}>{hostname}</h2><p className="muted" style={{fontSize:'.68rem'}}>{deviceAlerts.length} alerts from {sources.length} sources</p></div><button className="modal-close" onClick={onClose}>✕</button></div><div className="guide-body"><div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:12}}>{sources.map(s=>(<span key={s} className={`src ${sc(s)}`}>{s}</span>))}</div>{deviceAlerts.length===0?<div style={{textAlign:'center',padding:20,color:'var(--t3)'}}>No alerts for this device</div>:deviceAlerts.map((a:any)=>(<div key={a.id} className="device-alert-card"><div style={{display:'flex',gap:4,alignItems:'center',marginBottom:3}}><span className={`sev sev-${a.severity}`}>{a.severity}</span><span className={`src ${sc(a.source)}`}>{a.source}</span><span className="ts">{ago(a.timestamp)}</span></div><div style={{fontSize:'.8rem',fontWeight:600}}>{a.title}</div>{a.mitre&&<span className="mitre" style={{marginTop:3,display:'inline-block'}}>{a.mitre}</span>}{a.user&&<div style={{fontSize:'.7rem',color:'var(--t3)',marginTop:2}}>User: {a.user}</div>}</div>))}</div></div></div>);
}

/* ═══ ALERT NOTES ═══ */
function AlertNotes({alertId,onClose}:{alertId:string|null;onClose:()=>void}){
  const[notes,setNotes]=useState<any[]>([]);const[text,setText]=useState('');const[loading,setLoading]=useState(false);
  useEffect(()=>{if(alertId)fetch(`/api/alert-notes?alertId=${alertId}`).then(r=>r.ok?r.json():{notes:[]}).then(d=>setNotes(d.notes||[])).catch(()=>{})},[alertId]);
  async function addNote(){if(!text.trim()||!alertId)return;setLoading(true);try{const r=await fetch('/api/alert-notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({alertId,note:text})});const d=await r.json();if(d.notes)setNotes(d.notes);setText('')}catch(e){}setLoading(false)}
  if(!alertId)return null;
  return(<div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:480}}><div className="modal-hd"><h3 style={{fontSize:'.9rem'}}>📝 Investigation Notes</h3><button className="modal-close" onClick={onClose}>✕</button></div><div className="modal-body"><div style={{display:'flex',gap:4,marginBottom:10}}><input className="field-input" placeholder="Add a note..." value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addNote()} style={{flex:1}}/><button className="tc-btn tc-btn-primary" onClick={addNote} disabled={loading}>{loading?'...':'Add'}</button></div>{notes.length===0?<div style={{textAlign:'center',padding:16,color:'var(--t3)',fontSize:'.78rem'}}>No notes yet</div>:notes.map((n:any)=>(<div key={n.id} style={{padding:'8px 0',borderBottom:'1px solid var(--brd)'}}><div style={{display:'flex',justifyContent:'space-between',fontSize:'.65rem',color:'var(--t3)',marginBottom:2}}><span>{n.analyst}</span><span>{ago(n.time)}</span></div><div style={{fontSize:'.8rem'}}>{n.text}</div></div>))}</div></div></div>);
}



/* ═══ ATTACK CHAIN GRAPH ═══ */
function TriageBadge({alert}:{alert:any}){
  const t=alert.triage;if(!t)return null;
  const col=t.verdict==='tp'||t.verdict==='true_positive'?'var(--red)':t.verdict==='fp'||t.verdict==='false_positive'?'var(--green)':'var(--amber)';
  const label=t.verdict==='tp'||t.verdict==='true_positive'?'TP':t.verdict==='fp'||t.verdict==='false_positive'?'FP':'SUS';
  return(<div className="triage-badge" title={t.reasoning||''} style={{borderColor:col+'30'}}><div style={{fontSize:'.55rem',fontWeight:700,color:col}}>{t.confidence}%</div><div style={{fontSize:'.48rem',color:col,fontWeight:700}}>{label}</div>{t.evidence&&<div style={{fontSize:'.42rem',color:'var(--t3)',maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.evidence[0]}</div>}</div>);
}



/* ═══ VULN HOST DETAIL ═══ */
function VulnDetail({vuln,onClose}:{vuln:any;onClose:()=>void}){
  const[hosts,setHosts]=useState<any[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState('');
  const[pluginInfo,setPluginInfo]=useState<any>(null);
  useEffect(()=>{if(!vuln)return;setLoading(true);const pid=String(vuln.id).replace('PID-','').replace('CVE-','');Promise.all([fetch('/api/tenable/hosts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pluginId:pid})}).then(r=>r.ok?r.json():{hosts:[]}).catch(()=>({hosts:[]})),fetch('/api/tenable/plugin?id='+pid).then(r=>r.ok?r.json():null).catch(()=>null)]).then(([hostData,plugData])=>{setHosts(hostData.hosts||[]);setPluginInfo(plugData);if(hostData.error)setError(hostData.error);setLoading(false)}).catch(e=>{setError(String(e));setLoading(false)})},[vuln]);
  if(!vuln)return null;
  return <div className="drawer-overlay" onClick={onClose}><div className="drawer" onClick={e=>e.stopPropagation()}><div className="guide-hd"><div><h2 style={{fontSize:'.9rem',fontWeight:800,fontFamily:'var(--fm)',color:'var(--red)'}}>{vuln.id}</h2><p style={{fontSize:'.78rem',fontWeight:600,color:'var(--t1)',marginTop:2}}>{vuln.name}</p><div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}><span className="sev sev-critical" style={{fontFamily:'var(--fm)'}}>CVSS {vuln.cvss}</span>{vuln.vpr&&<span style={{fontSize:'.6rem',fontFamily:'var(--fm)',color:(vuln.vpr||0)>=7?'var(--red)':'#f97316',background:'var(--bg3)',padding:'1px 6px',borderRadius:4,fontWeight:700}}>VPR {vuln.vpr}</span>}<span style={{fontSize:'.62rem',color:'var(--t3)',fontFamily:'var(--fm)',background:'var(--bg3)',padding:'1px 6px',borderRadius:4}}>{vuln.hosts} hosts</span>{vuln.family&&<span style={{fontSize:'.58rem',color:'var(--t3)',background:'var(--bg3)',padding:'1px 6px',borderRadius:4}}>{vuln.family}</span>}{vuln.state&&<span style={{fontSize:'.58rem',color:vuln.state==='Active'?'var(--red)':'var(--green)',background:vuln.state==='Active'?'var(--reds)':'var(--greens)',padding:'1px 6px',borderRadius:4,fontWeight:600}}>{vuln.state}</span>}</div></div><button className="modal-close" onClick={onClose}>✕</button></div><div className="guide-body">{loading?<div style={{textAlign:'center',padding:24}}><span className="spin" style={{display:'inline-block'}}/>Loading affected hosts...</div>:<>{error&&<div style={{fontSize:'.68rem',color:'var(--amber)',marginBottom:8,padding:'4px 8px',background:'var(--ambers)',borderRadius:4}}>{error}</div>}<div style={{fontSize:'.68rem',color:'var(--t3)',marginBottom:8}}>{hosts.length} affected host{hosts.length!==1?'s':''}</div>{hosts.map((h:any,i:number)=>(<div key={i} className="device-alert-card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontFamily:'var(--fm)',fontSize:'.8rem',fontWeight:700,color:'var(--t1)'}}>{h.hostname}</div><div style={{fontSize:'.68rem',color:'var(--t3)',fontFamily:'var(--fm)'}}>{h.fqdn||h.ip}{h.port>0&&<span style={{marginLeft:4}}>:{h.port}/{h.protocol}</span>}</div></div><span style={{fontSize:'.58rem',color:h.state==='active'?'var(--red)':'var(--green)',background:h.state==='active'?'var(--reds)':'var(--greens)',padding:'1px 6px',borderRadius:4,fontWeight:600,textTransform:'uppercase'}}>{h.state}</span></div>{h.ip&&<div style={{fontSize:'.65rem',color:'var(--t2)',marginTop:3,fontFamily:'var(--fm)'}}>{h.ip}{h.netbios&&<span style={{marginLeft:6,color:'var(--t3)'}}>({h.netbios})</span>}</div>}{h.lastSeen&&<div style={{fontSize:'.58rem',color:'var(--t3)',fontFamily:'var(--fm)',marginTop:2}}>Last seen: {ago(h.lastSeen)}{h.firstSeen&&<span style={{marginLeft:6}}>First: {ago(h.firstSeen)}</span>}</div>}{h.cves&&<div style={{fontSize:'.55rem',color:'var(--accent)',fontFamily:'var(--fm)',marginTop:3,wordBreak:'break-all'}}>{h.cves.substring(0,80)}{h.cves.length>80?'...':''}</div>}</div>))}{hosts.length===0&&!loading&&<div style={{textAlign:'center',padding:20,color:'var(--t3)'}}>No host details available</div>}{pluginInfo&&pluginInfo.solution&&<div style={{marginTop:12,padding:10,background:'var(--greens)',border:'1px solid var(--green)',borderRadius:'var(--r)'}}><div style={{fontSize:'.65rem',fontWeight:700,color:'var(--green)',marginBottom:3}}>REMEDIATION</div><div style={{fontSize:'.74rem',color:'var(--t1)',lineHeight:1.6}}>{pluginInfo.solution}</div></div>}{pluginInfo&&pluginInfo.synopsis&&<div style={{marginTop:8,padding:10,background:'var(--bg3)',border:'1px solid var(--brd)',borderRadius:'var(--r)'}}><div style={{fontSize:'.65rem',fontWeight:700,color:'var(--t3)',marginBottom:3}}>SYNOPSIS</div><div style={{fontSize:'.74rem',color:'var(--t2)',lineHeight:1.6}}>{pluginInfo.synopsis}</div></div>}{pluginInfo&&pluginInfo.cves&&pluginInfo.cves.length>0&&<div style={{marginTop:8,padding:10,background:'var(--bg3)',border:'1px solid var(--brd)',borderRadius:'var(--r)'}}><div style={{fontSize:'.65rem',fontWeight:700,color:'var(--t3)',marginBottom:3}}>CVEs</div><div style={{display:'flex',gap:3,flexWrap:'wrap'}}>{pluginInfo.cves.map((cv:string)=>(<a key={cv} href={'https://nvd.nist.gov/vuln/detail/'+cv} target="_blank" rel="noopener" style={{fontSize:'.62rem',color:'var(--accent)',fontFamily:'var(--fm)',background:'var(--accent-s)',padding:'1px 5px',borderRadius:3,textDecoration:'none'}}>{cv}</a>))}</div></div>}{pluginInfo&&pluginInfo.seeAlso&&pluginInfo.seeAlso.length>0&&<div style={{marginTop:8,padding:10,background:'var(--bg3)',border:'1px solid var(--brd)',borderRadius:'var(--r)'}}><div style={{fontSize:'.65rem',fontWeight:700,color:'var(--t3)',marginBottom:3}}>REFERENCES</div>{pluginInfo.seeAlso.map((url:string,i:number)=>(<div key={i}><a href={url} target="_blank" rel="noopener" style={{fontSize:'.68rem',color:'var(--accent)',wordBreak:'break-all'}}>{url}</a></div>))}</div>}</>}</div></div></div>;
}



/* ═══ THREAT INTEL FEED ═══ */
function ThreatIntelFeed(){
  const INDUSTRIES=['Healthcare','Financial Services','Government','Education','Manufacturing','Retail','Energy & Utilities','Technology','Legal','Construction','Transportation','Telecommunications'];
  const[industry,setIndustry]=useState<string|null>(null);const[intel,setIntel]=useState<any[]>([]);const[loading,setLoading]=useState(false);const[demo,setDemo]=useState(true);const[expanded,setExpanded]=useState<string|null>(null);const[saved,setSaved]=useState(false);
  useEffect(()=>{fetch('/api/threat-intel').then(r=>r.ok?r.json():null).then(d=>{if(d){setIndustry(d.selected);if(d.intel?.length)setIntel(d.intel);setDemo(d.demo!==false)}}).catch(()=>{})},[]);
  function selectIndustry(ind:string){setIndustry(ind);setLoading(true);fetch('/api/threat-intel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({industry:ind})}).then(()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);return fetch('/api/threat-intel?industry='+encodeURIComponent(ind))}).then(r=>r.ok?r.json():null).then(d=>{if(d){setIntel(d.intel||[]);setDemo(d.demo!==false)}setLoading(false)}).catch(()=>setLoading(false))}
  function refresh(){if(!industry)return;setLoading(true);fetch('/api/threat-intel?industry='+encodeURIComponent(industry)+'&t='+Date.now()).then(r=>r.ok?r.json():null).then(d=>{if(d){setIntel(d.intel||[]);setDemo(d.demo!==false)}setLoading(false)}).catch(()=>setLoading(false))}
  const sevIcon:Record<string,string>={critical:'🔴',high:'🟠',medium:'🟡',low:'🔵'};
  const typeIcon:Record<string,string>={ransomware:'💀',apt:'🕵️',vulnerability:'🔓',phishing:'🎣',malware:'🦠',data_breach:'📂',supply_chain:'🔗',insider:'👤'};
  if(!industry)return <div className="panel"><div className="panel-hd"><h3>🛡 Threat Intelligence</h3></div><div style={{padding:16}}><div style={{fontSize:'.82rem',fontWeight:600,marginBottom:8,color:'var(--t1)'}}>Select your industry for tailored threat intel:</div><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{INDUSTRIES.map(ind=>(<button key={ind} className="tc-btn" onClick={()=>selectIndustry(ind)} style={{fontSize:'.72rem',padding:'6px 12px'}}>{ind}</button>))}</div></div></div>;
  return <div className="panel"><div className="panel-hd"><h3>🛡 Threat Intel — {industry}</h3><div style={{display:'flex',gap:4,alignItems:'center'}}>{demo&&<span style={{fontSize:'.55rem',color:'var(--amber)',background:'var(--ambers)',padding:'1px 5px',borderRadius:3}}>DEMO</span>}{!demo&&<span style={{fontSize:'.55rem',color:'var(--green)',background:'var(--greens)',padding:'1px 5px',borderRadius:3}}>LIVE</span>}<button className="tc-btn" onClick={refresh} disabled={loading} style={{fontSize:'.58rem',padding:'2px 6px'}}>{loading?'...':'↻'}</button><button className="tc-btn" onClick={()=>setIndustry(null)} style={{fontSize:'.58rem',padding:'2px 6px'}}>Change</button></div></div><div style={{padding:8}}>{loading?<div style={{textAlign:'center',padding:20}}><span className="spin" style={{display:'inline-block'}}/>Loading threat intel...</div>:intel.length===0?<div style={{textAlign:'center',padding:20,color:'var(--t3)'}}>No threat intel available</div>:intel.map((t:any)=>(<div key={t.id} className="ti-card" onClick={()=>setExpanded(expanded===t.id?null:t.id)} style={{borderLeftColor:t.severity==='critical'?'var(--red)':t.severity==='high'?'#f97316':t.severity==='medium'?'var(--amber)':'var(--blue)'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}><div style={{flex:1}}><div style={{display:'flex',gap:4,alignItems:'center',marginBottom:3,flexWrap:'wrap'}}><span>{sevIcon[t.severity]||'⚪'}</span><span className={`sev sev-${t.severity}`}>{t.severity}</span><span style={{fontSize:'.55rem',background:'var(--bg3)',padding:'1px 5px',borderRadius:3,color:'var(--t2)'}}>{typeIcon[t.type]||'🔶'} {t.type?.replace('_',' ')}</span>{t.source&&<span style={{fontSize:'.52rem',color:'var(--t3)',fontFamily:'var(--fm)'}}>{t.source}</span>}{t.url&&<a href={t.url} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} style={{fontSize:'.52rem',color:'var(--accent)',textDecoration:'none'}}>🔗 Source</a>}</div><div style={{fontSize:'.8rem',fontWeight:700,color:'var(--t1)'}}>{t.title}</div></div><span style={{fontSize:'.55rem',color:'var(--t3)',fontFamily:'var(--fm)',whiteSpace:'nowrap',marginLeft:8}}>{t.date}</span></div>{expanded===t.id&&<div style={{marginTop:8,paddingTop:8,borderTop:'1px solid var(--brd)'}}><div style={{fontSize:'.74rem',color:'var(--t2)',lineHeight:1.6,marginBottom:6}}>{t.summary}</div>{t.industry_relevance&&<div style={{fontSize:'.68rem',color:'var(--accent)',background:'var(--accent-s)',padding:'6px 8px',borderRadius:4,marginBottom:6}}>💡 {t.industry_relevance}</div>}{t.mitre?.length>0&&<div style={{display:'flex',gap:3,flexWrap:'wrap',marginBottom:4}}>{t.mitre.map((m:string)=>(<span key={m} className="mitre">{m}</span>))}</div>}{t.iocs?.length>0&&<div style={{fontSize:'.65rem',fontFamily:'var(--fm)',color:'var(--t2)',marginTop:4}}><span style={{color:'var(--t3)',fontWeight:600}}>IOCs:</span> {t.iocs.join(', ')}</div>}</div>}</div>))}</div></div>;
}


/* ═══ INTEL TAB ═══ */

/* ═══ LIVE INTEL FEED ═══ */
function LiveIntelFeed({data}:{data:any}){
  if(!data||!data.feeds||data.feeds.length===0)return null;
  const srcColor:Record<string,string>={'CISA KEV':'#ff4466','ThreatFox':'#f97316','URLhaus':'#5b9aff'};
  const allItems=data.feeds.flatMap((f:any)=>(f.items||[]).map((i:any)=>({...i,feedName:f.name})));
  return <div className="panel" style={{marginBottom:10}}><div className="panel-hd"><h3>🌐 Live Threat Feeds</h3><span className="muted" style={{fontSize:'.6rem'}}>{data.feeds.filter((f:any)=>f.ok).length} feeds · {allItems.length} indicators · Updated {new Date(data.updatedAt).toLocaleTimeString()}</span></div><div style={{maxHeight:300,overflowY:'auto',padding:'4px 14px'}}>{allItems.slice(0,15).map((item:any,i:number)=>(<div key={i} style={{display:'flex',gap:8,padding:'7px 0',borderBottom:'1px solid var(--brd)',alignItems:'flex-start'}}><div style={{width:3,height:24,borderRadius:2,background:srcColor[item.source]||'var(--accent)',flexShrink:0,marginTop:2}}/><div style={{flex:1,overflow:'hidden'}}><div style={{fontSize:'.72rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</div><div style={{fontSize:'.62rem',color:'var(--t3)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.detail}</div><div style={{display:'flex',gap:4,marginTop:3}}><span style={{fontSize:'.5rem',fontWeight:700,padding:'1px 5px',borderRadius:3,background:(srcColor[item.source]||'var(--accent)')+'15',color:srcColor[item.source]||'var(--accent)'}}>{item.source}</span><span className="sev" style={{fontSize:'.46rem'}}>{item.severity}</span>{item.link&&<a href={item.link} target="_blank" rel="noopener" style={{fontSize:'.5rem',color:'var(--accent)',textDecoration:'none'}}>View →</a>}</div></div></div>))}</div></div>;
}

function IntelTab({alerts,onAskAI,onDeviceDrill}:{alerts:Al[];onAskAI?:(a:Al)=>void;onDeviceDrill?:(h:string)=>void}){
  return <><ThreatIntelFeed/><MitreHeatmap alerts={alerts}/><TrendCharts/></>;
}


/* ═══ TV WALL MODE ═══ */
function TVWall({alerts,m,cov,sparks,slide,onExit}:{alerts:any[];m:any;cov:any;sparks:any;slide:number;onExit:()=>void}){
  const a=m?.alertsLast24h||{};
  const slides=[<div key="s0" className="tv-slide"><div className="tv-title">WATCHTOWER SOC</div><div className="tv-posture-row"><PostureGauge/></div><div className="tv-kpi-row"><div className="tv-kpi"><div className="tv-kpi-val" style={{color:'var(--red)'}}>{a.critical||0}</div><div className="tv-kpi-label">CRITICAL</div></div><div className="tv-kpi"><div className="tv-kpi-val" style={{color:'#f97316'}}>{a.high||0}</div><div className="tv-kpi-label">HIGH</div></div><div className="tv-kpi"><div className="tv-kpi-val" style={{color:'var(--green)'}}>{cov?.totalDevices||0}</div><div className="tv-kpi-label">ASSETS</div></div><div className="tv-kpi"><div className="tv-kpi-val" style={{color:'var(--accent)'}}>{a.total||0}</div><div className="tv-kpi-label">ALERTS 24H</div></div></div></div>,<div key="s1" className="tv-slide"><div className="tv-title">LIVE ALERTS</div><div className="tv-alert-list">{alerts.slice(0,12).map((al:any)=>(<div key={al.id} className="tv-alert"><span className="tv-alert-sev" style={{background:al.severity==='critical'?'var(--red)':'#f97316'}}/><span className="tv-alert-title">{al.title}</span><span className={`src ${sc(al.source)}`}>{al.source}</span><span className="ts">{ago(al.timestamp)}</span></div>))}{alerts.length===0&&<div style={{textAlign:'center',color:'var(--t3)',padding:40,fontSize:'1.2rem'}}>No active alerts</div>}</div></div>,<div key="s2" className="tv-slide"><div className="tv-title">SEVERITY DISTRIBUTION</div><div style={{display:'flex',justifyContent:'center',padding:'40px 0'}}><SevRing c={a.critical||0} h={a.high||0} m={a.medium||0} l={a.low||0} size={200}/></div><div className="tv-kpi-row"><div className="tv-kpi"><div className="tv-kpi-val" style={{color:'var(--red)'}}>{a.critical||0}</div><div className="tv-kpi-label">CRITICAL</div></div><div className="tv-kpi"><div className="tv-kpi-val" style={{color:'#f97316'}}>{a.high||0}</div><div className="tv-kpi-label">HIGH</div></div><div className="tv-kpi"><div className="tv-kpi-val" style={{color:'var(--amber)'}}>{a.medium||0}</div><div className="tv-kpi-label">MEDIUM</div></div><div className="tv-kpi"><div className="tv-kpi-val" style={{color:'var(--blue)'}}>{a.low||0}</div><div className="tv-kpi-label">LOW</div></div></div></div>,<div key="s3" className="tv-slide"><div className="tv-title">HOURLY TREND</div><div style={{display:'flex',justifyContent:'center',padding:'40px 0'}}><HourlyChart data={sparks.hourly} w={600} h={200}/></div><div className="tv-kpi-row"><div className="tv-kpi"><div className="tv-kpi-val">{m?.mttr?.current||0}<span style={{fontSize:'.8rem',color:'var(--t3)'}}>min</span></div><div className="tv-kpi-label">MTTR</div></div><div className="tv-kpi"><div className="tv-kpi-val">{m?.mttd?.current||0}<span style={{fontSize:'.8rem',color:'var(--t3)'}}>min</span></div><div className="tv-kpi-label">MTTD</div></div></div></div>,];
  return <div className="tv-wall" onClick={onExit}><div className="tv-indicators">{[0,1,2,3].map(i=>(<div key={i} className={`tv-ind ${slide===i?'active':''}`}/>))}</div>{slides[slide%slides.length]}<div className="tv-footer"><span className="tv-clock">{new Date().toLocaleTimeString('en-GB')}</span><span className="tv-exit">Click anywhere to exit</span><span className="stream-dot" style={{marginLeft:8}}/>MONITORING</div></div>;
}

/* ═══ MAIN ═══ */
function DashboardInner(){
  const[tab,setTab]=useState<Tab>('overview');
  const[data,setData]=useState<any>(null);
  const[alerts,setAlerts]=useState<Al[]>([]);
  const[toolsData,setToolsData]=useState<any>(null);
  useEffect(()=>{if(toolsData!==null&&(!toolsData?.tools||Object.keys(toolsData?.tools||{}).length===0)){const skip=typeof window!=='undefined'&&sessionStorage.getItem('wt-skip-setup');if(!skip&&typeof window!=='undefined')window.location.href='/setup'}},[toolsData]);
  const[loading,setLoading]=useState(true);
  const[theme,setTheme]=useState<'dark'|'light'>('dark');
  const[mobileNav,setMobileNav]=useState(false);
  const[clock,setClock]=useState('');
  const[sparks]=useState({al:gen(6,3),mttr:gen(35,8),mttd:gen(9,3),thr:gen(180,40),hourly:gen(12,5)});
  const[iocOpen,setIocOpen]=useState(false);const[aiAlert,setAiAlert]=useState<Al|null>(null);
  const[guideOpen,setGuideOpen]=useState(()=>{if(typeof window==='undefined')return false;const seen=localStorage.getItem('wt-tour-seen');return !seen});useEffect(()=>{if(!guideOpen&&typeof window!=='undefined')localStorage.setItem('wt-tour-seen','1')},[guideOpen]);
  const[cmdOpen,setCmdOpen]=useState(false);
  const[deviceDrill,setDeviceDrill]=useState<string|null>(null);
  const[notesAlert,setNotesAlert]=useState<string|null>(null);
  const[vulnDetail,setVulnDetail]=useState<any>(null);
  const[tlDetail,setTlDetail]=useState<any>(null);
  const[critPopup,setCritPopup]=useState<any>(null);
  const[handoverOpen,setHandoverOpen]=useState(false);
  const[userInfo,setUserInfo]=useState<any>(null);useEffect(()=>{if(userInfo?.user?.plan)(window as any).__wt_plan=userInfo.user.plan},[userInfo]);const[showAccount,setShowAccount]=useState(false);
  const[slaData,setSlaData]=useState<any>(null);const[incidents,setIncidents]=useState<any[]>([]);const[incidentModal,setIncidentModal]=useState<any>(null);const[customRunbooks,setCustomRunbooks]=useState<any[]>([]);const[liveIntel,setLiveIntel]=useState<any>(null);
  const[tvWall,setTvWall]=useState(false);const[tvSlide,setTvSlide]=useState(0);
  const[isFullscreen,setIsFullscreen]=useState(false);
  const[refreshInterval,setRefreshInterval]=useState(120);
  const[prevCritCount,setPrevCritCount]=useState(0);
  const audioRef=typeof window!=='undefined'?{current:null as AudioContext|null}:{current:null};

  useEffect(()=>{
    function onKey(e:KeyboardEvent){
      if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
      if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();setCmdOpen(true);return}
      if(e.key==='/'){{e.preventDefault();setIocOpen(true)}}
      if(e.key==='?')setGuideOpen(true);
      if(e.key==='f'&&!e.metaKey&&!e.ctrlKey)toggleFullscreen();
      if(e.key==='Escape'){setGuideOpen(false);setCmdOpen(false);setIocOpen(false);setAiAlert(null);setDeviceDrill(null);setNotesAlert(null);setVulnDetail(null);setTlDetail(null)}
    }
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[]);
  useEffect(()=>{if(!tvWall)return;const ti=setInterval(()=>setTvSlide(s=>(s+1)%4),15000);return()=>clearInterval(ti)},[tvWall]);
  useEffect(()=>{const tick=()=>setClock(new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}));tick();const i=setInterval(tick,1000);return()=>clearInterval(i)},[]);

  const refresh=useCallback(async()=>{
    setLoading(true);
    try{
      const[aR,cR,tR]=await Promise.all([fetch('/api/unified-alerts?t='+Date.now()).then(r=>r.ok?r.json():{alerts:[],demo:true}).catch(()=>({alerts:[],demo:true})),fetch('/api/coverage?t='+Date.now()).then(r=>r.ok?r.json():{demo:true,coverage:null,metrics:null,zscaler:null}).catch(()=>({demo:true,coverage:null,metrics:null,zscaler:null})),fetch('/api/tools?t='+Date.now()).then(r=>r.ok?r.json():{tools:[],kvAvailable:false}).catch(()=>({tools:[],kvAvailable:false}))]);
      setAlerts(aR.alerts||[]);setData(cR);setToolsData(tR);
    }catch(e){console.error(e)}
    setLoading(false);
  },[]);

  useEffect(()=>{refresh();const i=setInterval(refresh,refreshInterval*1000);return()=>clearInterval(i)},[refresh,refreshInterval]);
  useEffect(()=>{fetch('/api/sla').then(r=>r.ok?r.json():null).then(d=>{if(d)setSlaData(d)}).catch(()=>{});fetch('/api/incidents').then(r=>r.ok?r.json():null).then(d=>{if(d?.incidents)setIncidents(d.incidents)}).catch(()=>{});fetch('/api/live-intel').then(r=>r.ok?r.json():null).then(d=>{if(d)setLiveIntel(d)}).catch(()=>{});fetch('/api/auth/me').then(r=>r.ok?r.json():null).then(d=>{if(d?.user)setUserInfo(d)}).catch(()=>{})},[]);
  // Critical alert notification sound
  useEffect(()=>{
    const critCount=alerts.filter(a=>a.severity==='critical'&&a.status==='new').length;
    if(critCount>prevCritCount&&prevCritCount>=0&&alerts.length>0){
      const newCrits=alerts.filter(a=>a.severity==='critical'&&a.status==='new');
      if(newCrits.length>0)setCritPopup(newCrits[0]);
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
  function cmdSelect(id:string){if(id==='ioc')setIocOpen(true);else if(id==='guide')setGuideOpen(true);else if(id==='exec'){/* trigger from overview */}else if(id==='fullscreen')toggleFullscreen();else if(id==='theme')setTheme(t=>t==='dark'?'light':'dark');else setTab(id as Tab)}

  const m=data?.metrics,cov=data?.coverage,zsc=data?.zscaler;
  const hasCrit=alerts.filter(a=>a.severity==='critical'&&a.status==='new').length>0;
  const enabledTools=(Array.isArray(toolsData?.tools)?toolsData.tools:Object.values(toolsData?.tools||{})).filter((t:any)=>t.enabled).map((t:any)=>{const reg=TOOLS.find((r:any)=>r.id===t.id);return{...t,icon:reg?.icon||'🔌',shortName:reg?.shortName||t.id,color:reg?.color||'#8896b8'}})||[];
  const critCount=alerts.filter(a=>a.severity==='critical'&&a.status==='new').length;
  const highCount=alerts.filter(a=>a.severity==='high').length;
  const tabs:{k:Tab;l:string;i:string;badge?:number}[]=[{k:'overview',l:'Overview',i:'◉'},{k:'alerts',l:'Alerts',i:'⚡',badge:critCount},{k:'coverage',l:'Coverage',i:'🛡'},{k:'vulns',l:'Vulns',i:'🔓'},{k:'intel',l:'Intel',i:'🛡'},{k:'incidents',l:'Incidents',i:'📁'},{k:'tools',l:`Tools (${enabledTools.length})`,i:'🔌'}];
  const userRole=userInfo?.user?.role||'admin';
  const visibleTabs=tabs.filter(t=>t.k==='tools'?userRole==='admin'||userRole==='superadmin':t.k==='incidents'?userRole==='admin'||userRole==='superadmin':true);

  if(tvWall)return <><style dangerouslySetInnerHTML={{__html:CSS}}/><TVWall alerts={alerts} m={data?.metrics||m} cov={data?.coverage} sparks={sparks} slide={tvSlide} onExit={()=>{setTvWall(false);document.exitFullscreen?.()}}/></>;
  return(<><style dangerouslySetInnerHTML={{__html:CSS}}/><div className={`shell ${hasCrit?'crit-flash':''}`}><div className="topbar"><div className="logo"><div className="logo-icon">W</div><span>Watch</span>tower</div><div className="tabs desk-only">{visibleTabs.map(t=>(<button key={t.k} className={`tab ${tab===t.k?'active':''}`} onClick={()=>setTab(t.k)}>{t.i} {t.l}{t.badge&&t.badge>0?<span className="tab-badge">{t.badge}</span>:null}</button>))}</div><button className="mob-menu mob-only" onClick={()=>setMobileNav(!mobileNav)}>☰</button><div className="topbar-right"><button className="search-trigger" onClick={()=>setIocOpen(true)}>🔍 <span className="desk-only">IOC Search</span></button><div className="live-dot"/><button className="theme-btn desk-only" onClick={()=>{const p=userInfo?.user?.plan||'community';if(p==='community'){alert('TV Wall requires Team plan or higher');return}setTvWall(!tvWall);if(!tvWall)document.documentElement.requestFullscreen?.()}} title="TV Wall Mode">📺</button><button className="theme-btn" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}>{theme==='dark'?'☀':'🌙'}</button><button className="guide-btn" onClick={()=>setGuideOpen(true)} title="Tour">💡</button><select className="refresh-select desk-only" value={refreshInterval} onChange={e=>setRefreshInterval(Number(e.target.value))}><option value={30}>30s</option><option value={60}>1m</option><option value={300}>5m</option><option value={600}>10m</option></select><div className="acct-wrap" style={{position:'relative'}}><button className="theme-btn" onClick={()=>setShowAccount(!showAccount)} title="Account">{userInfo?.user?.email?userInfo.user.email.charAt(0).toUpperCase():'👤'}</button>{showAccount&&<div className="acct-menu"><div className="acct-hd">{userInfo?.user?.email||'Account'}</div><div className="acct-org">{userInfo?.user?.org||''}</div><div className="acct-plan">Plan: <strong>{userInfo?.user?.plan||'starter'}</strong></div>{userInfo?.user?.trialEndsAt&&<div className="acct-trial">Trial ends: {new Date(userInfo.user.trialEndsAt).toLocaleDateString()}</div>}<div className="acct-sep"/><button className="acct-btn" onClick={()=>{fetch('/api/stripe/portal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:userInfo?.user?.email})}).then(r=>r.json()).then(d=>{if(d.url)window.open(d.url);else alert(d.error||'Billing not available')})}}>💳 Manage Billing</button><button className="acct-btn" onClick={()=>window.location.href='/settings'}>⚙ Settings & 2FA</button><button className="acct-btn" onClick={()=>window.location.href='/report'}>📊 PDF Report</button><button className="acct-btn" onClick={()=>window.location.href='/pricing'}>⬆ Upgrade Plan</button><button className="acct-btn" onClick={()=>{document.cookie='secops-auth=;max-age=0;path=/';document.cookie='secops-tenant=;max-age=0;path=/';window.location.href='/login'}}>🚪 Sign Out</button>{userInfo?.user?.role==='superadmin'&&<><div className="acct-sep"/><button className="acct-btn" onClick={()=>window.location.href='/portfolio'}>🏢 MSSP Portfolio</button></>}</div>}</div><button className="refresh-btn desk-only" onClick={refresh}>↻</button></div></div>{mobileNav&&<div className="mob-nav">{visibleTabs.map(t=>(<button key={t.k} className={`mnav-btn ${tab===t.k?'active':''}`} onClick={()=>{setTab(t.k);setMobileNav(false)}}>{t.i} {t.l}</button>))}</div>}<div className="main">{iocOpen&&<IOCSearch open={iocOpen} onClose={()=>setIocOpen(false)}/>}{aiAlert&&<AICopilot alert={aiAlert} onClose={()=>setAiAlert(null)} allAlerts={alerts} customRunbooks={customRunbooks}/>}<OnboardingTour open={guideOpen} onClose={()=>setGuideOpen(false)}/><CmdPalette open={cmdOpen} onClose={()=>setCmdOpen(false)} onSelect={cmdSelect}/><DeviceDrawer hostname={deviceDrill} alerts={alerts} onClose={()=>setDeviceDrill(null)}/><AlertNotes alertId={notesAlert} onClose={()=>setNotesAlert(null)}/>{tlDetail&&<div className="modal-overlay" onClick={()=>setTlDetail(null)}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:500}}><div className="modal-hd"><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:'1.3rem'}}>{tlDetail.icon}</span><div><h3 style={{fontSize:'.9rem'}}>{tlDetail.title}</h3><p className="muted" style={{fontSize:'.68rem'}}>{tlDetail.source} · {new Date(tlDetail.time).toLocaleString()}</p></div></div><button className="modal-close" onClick={()=>setTlDetail(null)}>✕</button></div><div className="modal-body"><div style={{fontSize:'.78rem',color:'var(--t2)',lineHeight:1.7,marginBottom:10}}>{tlDetail.title.includes('Credential')?'Credential dumping attempt detected via LSASS memory access. The attacker used Mimikatz-style techniques to extract credentials from a domain controller. Immediate password rotation recommended for affected accounts.':tlDetail.title.includes('isolated')?'Device WS042 was manually isolated by SOC analyst following detection of C2 beacon activity. Network quarantine applied. Forensic image collection initiated.':tlDetail.title.includes('PowerShell')?'Encoded PowerShell execution detected with base64-obfuscated command. Decoded payload attempts to download secondary payload from external C2 server. Process tree indicates parent was outlook.exe suggesting phishing vector.':tlDetail.title.includes('C2 blocked')?'Outbound connection to known C2 infrastructure blocked by Zscaler ZIA web proxy. IP 185.220.101.42 is associated with Cobalt Strike team server. No data exfiltration detected before block.':tlDetail.title.includes('Scan done')?'Scheduled vulnerability scan completed. 3 new critical vulnerabilities found across 12 assets. Critical findings: CVE-2024-3400 (PAN-OS), CVE-2024-21302 (Windows), unsupported SQL Server instance.':tlDetail.title.includes('VPN')?'Multiple failed VPN authentication attempts from IP range associated with known brute force campaign. 47 unique usernames attempted in 10-minute window. GeoIP: Eastern Europe.':tlDetail.title.includes('Phishing')?'Phishing emails quarantined targeting 12 users with fake Microsoft 365 login pages. Credential harvesting site hosted on compromised WordPress installation. All recipients notified.':tlDetail.title.includes('Darktrace')?'Darktrace AI model breach triggered for unusual data transfer pattern. Internal server communicating with previously unseen external IP on non-standard port. Investigating potential data exfiltration.':tlDetail.title.includes('Shift')?'Shift handover completed. 4 open items transferred: 1 active incident (DC01 compromise), 2 pending investigations, 1 awaiting vendor response on Tenable agent deployment.':'Security event detected and logged. Review alert details for full context and recommended response actions.'}</div><div style={{display:'flex',gap:4,flexWrap:'wrap'}}><span className={`src ${sc(tlDetail.source)}`}>{tlDetail.source}</span></div></div></div></div>}{vulnDetail&&<VulnDetail vuln={vulnDetail} onClose={()=>{setVulnDetail(null);setTlDetail(null)}}/>}<ShiftHandover open={handoverOpen} onClose={()=>setHandoverOpen(false)}/>{critPopup&&<div className="crit-popup-overlay" onClick={()=>setCritPopup(null)}><div className="crit-popup" onClick={e=>e.stopPropagation()}><div className="crit-popup-pulse"/><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}><span style={{fontSize:'1.5rem'}}>🚨</span><div><div style={{fontSize:'.95rem',fontWeight:800,color:'var(--red)'}}>CRITICAL ALERT</div><div style={{fontSize:'.65rem',color:'var(--t3)',fontFamily:'var(--fm)'}}>Just now</div></div><button className="modal-close" onClick={()=>setCritPopup(null)}>✕</button></div><div style={{fontSize:'.85rem',fontWeight:700,marginBottom:6}}>{critPopup.title}</div><div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}><span className="sev sev-critical">critical</span><span className={`src ${sc(critPopup.source)}`}>{critPopup.source}</span>{critPopup.device&&<span className="device">{critPopup.device}</span>}{critPopup.mitre&&<span className="mitre">{critPopup.mitre}</span>}</div><div style={{display:'flex',gap:6}}><button className="tc-btn tc-btn-primary" onClick={()=>{setAiAlert(critPopup);setCritPopup(null)}} style={{fontSize:'.72rem'}}>🤖 Analyse</button><button className="tc-btn" onClick={()=>{setTab('alerts');setCritPopup(null)}} style={{fontSize:'.72rem'}}>View Alerts</button><button className="tc-btn" onClick={()=>setCritPopup(null)} style={{fontSize:'.72rem'}}>Dismiss</button></div></div></div>}{loading?<div className="loading"><span className="spin"/>Loading...</div>:tab==='overview'?<Ov m={m} cov={cov} alerts={alerts} zsc={zsc} sparks={sparks} enabledTools={enabledTools} onAskAI={(a:Al)=>setAiAlert(a)} onRefresh={refresh} setTlDetail={setTlDetail} slaData={slaData} onQuickAction={(a:string)=>{if(a==='ioc')setIocOpen(true);if(a==='handover')setHandoverOpen(true);if(a==='investigate'){fetch('/api/taegis/investigate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Manual Investigation - '+new Date().toLocaleDateString(),description:'Investigation created from Watchtower dashboard',priority:2})}).then(r=>r.json()).then(d=>{if(d.ok)alert('✓ Investigation created: '+(d.investigation?.short_id||d.investigation?.id));else alert('✗ '+d.error)})};if(a==='scan'){fetch('/api/tenable/scan').then(r=>r.json()).then(d=>{if(d.scans?.length>0){const s=d.scans[0];if(confirm('Launch scan: '+s.name+'?')){fetch('/api/tenable/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scanId:s.id})}).then(r=>r.json()).then(r=>{alert(r.ok?'✓ Scan launched':'✗ '+r.error)})}}else alert('No scans found in Tenable')})}}}/>:tab==='alerts'?<Als alerts={alerts} onAskAI={(a:Al)=>setAiAlert(a)} onDeviceDrill={(h:string)=>setDeviceDrill(h)} onNotes={(id:string)=>setNotesAlert(id)}/>:tab==='coverage'?<CovTab cov={cov} onRefresh={refresh}/>:tab==='vulns'?<LockedFeature featureId="vulns" plan={(typeof window!=='undefined'?(window as any).__wt_plan:null)||'community'}><Vul onVulnClick={(v:any)=>setVulnDetail(v)}/></LockedFeature>:tab==='incidents'?<LockedFeature featureId="incidents" plan={(typeof window!=='undefined'?(window as any).__wt_plan:null)||'community'}><IncidentList incidents={incidents} onUpdate={()=>fetch('/api/incidents').then(r=>r.ok?r.json():null).then(d=>{if(d?.incidents)setIncidents(d.incidents)})} alerts={alerts}/></LockedFeature>:tab==='intel'?<LockedFeature featureId="intel" plan={(typeof window!=='undefined'?(window as any).__wt_plan:null)||'community'}><LiveIntelFeed data={liveIntel}/><IntelTab alerts={alerts} onAskAI={(a:Al)=>setAiAlert(a)} onDeviceDrill={(h:string)=>setDeviceDrill(h)}/></LockedFeature>:<ToolsManager toolsData={toolsData} onRefresh={refresh}/>}</div></div></>);
}

/* ═══ KPI SECTION (needs metrics) ═══ */
function KpiSection({m,cov,zsc,sparks,enabledTools,alerts}:any){
  if(!m)return null;
  const a=m.alertsLast24h||{};
  return <div className="kpi-grid"><div className="kpi"><div className="kpi-top"><div className="kpi-label">Alerts 24h</div></div><div className="kpi-val">{a.total||0}</div><div className="kpi-sub"><span style={{color:'var(--red)'}}>{a.critical||0} crit</span> · <span style={{color:'#f97316'}}>{a.high||0} high</span></div><div className="kpi-spark"><Spark data={sparks.al} color="var(--accent)"/></div></div><div className="kpi"><div className="kpi-top"><div className="kpi-label">MTTR</div></div><div className="kpi-val" style={{color:m.mttr?.current<=m.mttr?.target?'var(--green)':'var(--amber)'}}>{m.mttr?.current||0}<span className="kpi-unit">min</span></div><div className="kpi-sub">Target {m.mttr?.target||30}m</div><div className="kpi-spark"><Spark data={sparks.mttr} color="var(--amber)"/></div></div><div className="kpi"><div className="kpi-top"><div className="kpi-label">MTTD</div></div><div className="kpi-val" style={{color:m.mttd?.current<=m.mttd?.target?'var(--green)':'var(--amber)'}}>{m.mttd?.current||0}<span className="kpi-unit">min</span></div><div className="kpi-sub">Target {m.mttd?.target||10}m</div><div className="kpi-spark"><Spark data={sparks.mttd} color="var(--green)"/></div></div><div className="kpi"><div className="kpi-top"><div className="kpi-label">Open Incidents</div></div><div className="kpi-val" style={{color:m.incidentsOpen>0?'var(--amber)':'var(--green)'}}>{m.incidentsOpen||0}</div><div className="kpi-sub">SLA {m.slaCompliance||0}%</div></div><div className="kpi"><div className="kpi-top"><div className="kpi-label">ZIA Blocked</div></div><div className="kpi-val" style={{color:'var(--green)'}}>{zsc?.zia?.blockedThreats?.toLocaleString()||0}</div><div className="kpi-sub">{zsc?.zia?.dlpViolations||0} DLP</div><div className="kpi-spark"><Spark data={sparks.thr} color="var(--green)"/></div></div><div className="kpi"><div className="kpi-top"><div className="kpi-label">Critical Vulns</div></div><div className="kpi-val" style={{color:'var(--red)'}}>{a.critical||0}</div><div className="kpi-sub">{a.total||0} total alerts</div></div><div className="kpi"><div className="kpi-top"><div className="kpi-label">Tools Active</div></div><div className="kpi-val" style={{color:'var(--accent)'}}>{enabledTools.length}<span className="kpi-unit">/{TOOLS.length}</span></div><div className="kpi-sub">{cov?.totalDevices?.toLocaleString()||0} devices</div></div></div>;
}



/* ═══ QUIET HOURS ═══ */
function QuietHours({alerts}:{alerts:any[]}){
  const[now,setNow]=useState(Date.now());
  useEffect(()=>{const i=setInterval(()=>setNow(Date.now()),10000);return()=>clearInterval(i)},[]);
  const lastCrit=alerts.filter(a=>a.severity==='critical').sort((a,b)=>new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime())[0];
  const lastAny=alerts.sort((a,b)=>new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime())[0];
  const critMs=lastCrit?now-new Date(lastCrit.timestamp).getTime():0;
  const anyMs=lastAny?now-new Date(lastAny.timestamp).getTime():0;
  function fmt(ms:number){if(ms<=0)return'—';const m=Math.floor(ms/60000);if(m<60)return m+'m';const h=Math.floor(m/60);if(h<24)return h+'h '+m%60+'m';return Math.floor(h/24)+'d '+h%24+'h'}
  const critColor=critMs<3600000?'var(--red)':critMs<86400000?'var(--amber)':'var(--green)';
  return <div className="quiet-bar"><div className="quiet-item"><div className="quiet-label">Since last critical</div><div className="quiet-val" style={{color:critColor}}>{lastCrit?fmt(critMs):'None'}</div></div><div className="quiet-sep"/><div className="quiet-item"><div className="quiet-label">Since last alert</div><div className="quiet-val" style={{color:'var(--t2)'}}>{lastAny?fmt(anyMs):'None'}</div></div><div className="quiet-sep"/><div className="quiet-item"><div className="quiet-label">Active criticals</div><div className="quiet-val" style={{color:alerts.filter(a=>a.severity==='critical').length>0?'var(--red)':'var(--green)'}}>{alerts.filter(a=>a.severity==='critical').length}</div></div></div>;
}

/* ═══ POSTURE GAUGE ═══ */
function PostureGauge(){
  const[data,setData]=useState<any>(null);
  useEffect(()=>{fetch('/api/posture?t='+Date.now()).then(r=>r.ok?r.json():null).then(d=>{if(d)setData(d)}).catch(()=>{})},[]);
  if(!data)return <div className="posture-card"><div style={{textAlign:'center',padding:30,width:'100%'}}><div style={{width:32,height:32,border:'3px solid var(--bg3)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto 10px'}}/><div style={{fontSize:'.68rem',color:'var(--t3)'}}>Calculating posture...</div></div></div>;
  const{score,grade,color,factors}=data;
  const r=54,circ=2*Math.PI*r*0.75,filled=circ*(score/100);
  return <div className="posture-card"><div className="posture-gauge"><svg width="140" height="120" viewBox="0 0 140 120"><defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".8"/><stop offset="100%" stopColor={color}/></linearGradient><filter id="pggl"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M 16 100 A 54 54 0 1 1 124 100" fill="none" stroke="var(--bg3)" strokeWidth="12" strokeLinecap="round"/><path d="M 16 100 A 54 54 0 1 1 124 100" fill="none" stroke="url(#pg)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${filled} ${circ}`} filter="url(#pggl)" style={{transition:'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)'}}/></svg><div className="posture-score" style={{color}}>{score}</div><div className="posture-grade" style={{color}}>{grade}</div><div className="posture-label">Security Posture</div></div><div className="posture-factors">{factors.slice(0,5).map((f:any,i:number)=>(<div key={i} className="posture-factor"><span style={{color:(f.impact||0)>=0?'var(--green)':'var(--red)',fontFamily:'var(--fm)',fontSize:'.68rem',fontWeight:700,minWidth:32}}>{(f.impact||0)>0?'+':''}{f.impact}</span><span style={{fontSize:'.68rem',color:'var(--t2)'}}>{f.name}</span><span style={{fontSize:'.58rem',color:'var(--t3)',marginLeft:'auto'}}>{f.detail}</span></div>))}</div></div>;
}

/* ═══ ALERT STREAM ═══ */
function AlertStream({alerts,onAlert}:{alerts:any[];onAlert:(a:any)=>void}){
  return <div className="alert-stream"><div className="stream-hd"><span style={{display:'flex',alignItems:'center',gap:5}}><span className="stream-dot"/>LIVE ALERTS</span><span className="mono" style={{fontSize:'.58rem',color:'var(--t3)'}}>{alerts.length}</span></div><div className="stream-body">{alerts.length===0?<div style={{padding:24,textAlign:'center'}}><div style={{fontSize:'1.8rem',marginBottom:8,opacity:.3}}>🛡</div><div style={{color:'var(--t3)',fontSize:'.72rem',fontWeight:600}}>All clear</div><div style={{color:'var(--t4)',fontSize:'.6rem',marginTop:2}}>No critical alerts</div></div>:alerts.slice(0,15).map((a:any)=>(<div key={a.id} className="stream-item clickable-row" onClick={()=>onAlert(a)}><div className="stream-sev" style={{background:a.severity==='critical'?'var(--red)':a.severity==='high'?'#f97316':'var(--amber)'}}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:'.7rem',fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.title}</div><div style={{display:'flex',gap:4,alignItems:'center',marginTop:2}}><span className={`src ${sc(a.source)}`} style={{fontSize:'.48rem'}}>{a.source}</span><span className="ts" style={{fontSize:'.52rem'}}>{ago(a.timestamp)}</span></div></div></div>))}</div></div>;
}

/* ═══ QUICK ACTIONS ═══ */
function QuickActions({onAction}:{onAction:(action:string)=>void}){
  const actions=[{id:'ioc',icon:'🔍',label:'IOC Search',color:'var(--accent)'},{id:'investigate',icon:'📋',label:'Investigate',color:'var(--purple)'},{id:'scan',icon:'⚡',label:'Launch Scan',color:'var(--green)'},{id:'handover',icon:'🔄',label:'Shift Handover',color:'var(--amber)'}];
  return <div className="quick-actions">{actions.map(a=>(<button key={a.id} className="qa-btn" onClick={()=>onAction(a.id)} style={{'--qa-c':a.color} as any}><span className="qa-icon">{a.icon}</span><span className="qa-label">{a.label}</span></button>))}</div>;
}

/* ═══ SHIFT HANDOVER ═══ */
function ShiftHandover({open,onClose}:{open:boolean;onClose:()=>void}){
  const[data,setData]=useState<any>(null);const[loading,setLoading]=useState(true);
  useEffect(()=>{if(!open)return;setLoading(true);fetch('/api/shift-handover?t='+Date.now()).then(r=>r.ok?r.json():null).then(d=>{if(d)setData(d);setLoading(false)}).catch(()=>setLoading(false))},[open]);
  if(!open)return null;
  const statusIcon:Record<string,string>={open:'🔴',resolved:'✅',monitoring:'👁'};
  return <div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:560}}><div className="modal-hd"><div><h3 style={{fontSize:'.95rem'}}>🔄 Shift Handover</h3><p className="muted" style={{fontSize:'.65rem'}}>Last 8 hours summary</p></div><button className="modal-close" onClick={onClose}>✕</button></div><div className="modal-body">{loading?<div style={{textAlign:'center',padding:24}}><span className="spin" style={{display:'inline-block'}}/>Generating handover...</div>:<>{data?.summary&&<div style={{fontSize:'.82rem',fontWeight:600,marginBottom:12,color:'var(--t1)',lineHeight:1.6}}>{data.summary}</div>}{(data?.items||[]).map((item:any,i:number)=>(<div key={i} style={{display:'flex',gap:8,padding:'8px 0',borderBottom:'1px solid var(--brd)'}}><span style={{fontSize:'.9rem'}}>{statusIcon[item.status]||'⚪'}</span><div style={{flex:1}}><div style={{fontSize:'.78rem',fontWeight:600}}>{item.title}</div><div style={{fontSize:'.68rem',color:'var(--t2)',marginTop:2}}>{item.detail}</div></div><span className={`sev sev-${item.priority}`} style={{alignSelf:'flex-start'}}>{item.priority}</span></div>))}</>}</div></div></div>;
}



/* ═══ SLA BAR ═══ */
function SLABar({sla}:{sla:any}){
  if(!sla||!Array.isArray(sla.active)||sla.active.length===0)return null;
  const breached=sla.active.filter((a:any)=>a.breached);
  const urgent=sla.active.filter((a:any)=>a.urgent&&!a.breached);
  return <div className="sla-bar"><div className="sla-hd"><span>⏱ SLA Tracking</span><span className="mono" style={{fontSize:'.6rem',color:breached.length>0?'var(--red)':'var(--green)'}}>{breached.length} breached · {urgent.length} urgent · {sla.active.length} active</span></div><div className="sla-items">{sla.active.slice(0,4).map((item:any)=>(<div key={item.alertId} className={`sla-item ${item.breached?'sla-breached':item.urgent?'sla-urgent':''}`}><div className="sla-item-title">{item.alertTitle||item.alertId}</div><div className="sla-item-time" style={{color:item.breached?'var(--red)':item.urgent?'var(--amber)':'var(--green)'}}>{item.breached?'BREACHED':item.remainingMins<60?item.remainingMins+'m left':Math.floor(item.remainingMins/60)+'h '+item.remainingMins%60+'m left'}</div></div>))}</div></div>;
}



/* ═══ COMPLIANCE MAP ═══ */
function IncidentList({incidents,onUpdate,alerts}:{incidents:any[];onUpdate:()=>void;alerts:any[]}){
  const[creating,setCreating]=useState(false);const[title,setTitle]=useState('');const[severity,setSeverity]=useState('high');const[detail,setDetail]=useState<any>(null);const[note,setNote]=useState('');
  async function createIncident(){if(!title)return;setCreating(true);await fetch('/api/incidents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create',title,severity})}).then(r=>r.json()).then(d=>{if(d.ok){setTitle('');onUpdate()}});setCreating(false)}
  async function addNote(incId:string){if(!note)return;await fetch('/api/incidents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'add_note',incidentId:incId,note})});setNote('');onUpdate();if(detail)setDetail({...detail})}
  async function addAlert(incId:string,alert:any){await fetch('/api/incidents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'add_alert',incidentId:incId,alertId:alert.id,alertTitle:alert.title})});onUpdate()}
  async function updateStatus(incId:string,status:string){await fetch('/api/incidents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'update_status',incidentId:incId,status})});onUpdate();if(detail)setDetail({...detail,status})}
  const statusColor:Record<string,string>={open:'var(--red)',investigating:'var(--amber)',contained:'var(--blue)',closed:'var(--green)'};
  return <><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,flexWrap:'wrap',gap:8}}><h2 style={{fontSize:'1rem',fontWeight:800}}>📁 Incidents ({incidents.length})</h2><div style={{display:'flex',gap:6,alignItems:'center'}}><input className="field-input" placeholder="New incident title..." value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createIncident()} style={{width:220,fontSize:'.72rem',padding:'5px 10px'}}/><select className="field-input" value={severity} onChange={e=>setSeverity(e.target.value)} style={{fontSize:'.72rem',padding:'5px 6px'}}><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option></select><button className="tc-btn tc-btn-primary" onClick={createIncident} disabled={!title||creating} style={{fontSize:'.68rem',whiteSpace:'nowrap'}}>+ Create</button></div></div><div className="panel"><div className="tbl-wrap" style={{maxHeight:'calc(100vh - 200px)'}}><table className="tbl"><thead><tr><th>ID</th><th>Title</th><th>Severity</th><th>Status</th><th>Alerts</th><th>Created</th><th>Actions</th></tr></thead><tbody>{incidents.length===0?<tr><td colSpan={7} style={{textAlign:'center',padding:30,color:'var(--t3)'}}>No incidents. Create one above or from an alert.</td></tr>:incidents.map(inc=>(<tr key={inc.id} className="clickable-row" onClick={()=>setDetail(inc)}><td className="mono" style={{fontWeight:700,fontSize:'.68rem',color:'var(--accent)'}}>{inc.id}</td><td style={{fontWeight:600,fontSize:'.76rem'}}>{inc.title}</td><td><span className={`sev sev-${inc.severity}`}>{inc.severity}</span></td><td><span style={{fontSize:'.6rem',fontWeight:700,color:statusColor[inc.status]||'var(--t3)',background:(statusColor[inc.status]||'var(--t3)')+'15',padding:'2px 6px',borderRadius:4}}>{inc.status}</span></td><td className="mono">{inc.alerts?.length||0}</td><td className="ts">{ago(inc.createdAt)}</td><td><select className="field-input" value={inc.status} onClick={e=>e.stopPropagation()} onChange={e=>{e.stopPropagation();updateStatus(inc.id,e.target.value)}} style={{fontSize:'.6rem',padding:'2px 4px'}}><option value="open">Open</option><option value="investigating">Investigating</option><option value="contained">Contained</option><option value="closed">Closed</option></select></td></tr>))}</tbody></table></div></div>{detail&&<div className="modal-overlay" onClick={()=>setDetail(null)}><div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:640}}><div className="modal-hd"><div><h3 style={{fontSize:'.9rem'}}>{detail.id}: {detail.title}</h3><div style={{display:'flex',gap:4,marginTop:4}}><span className={`sev sev-${detail.severity}`}>{detail.severity}</span><span style={{fontSize:'.6rem',fontWeight:700,color:statusColor[detail.status]||'var(--t3)',background:(statusColor[detail.status]||'var(--t3)')+'15',padding:'2px 6px',borderRadius:4}}>{detail.status}</span></div></div><button className="modal-close" onClick={()=>setDetail(null)}>✕</button></div><div className="modal-body"><div style={{marginBottom:12}}><div style={{fontSize:'.72rem',fontWeight:700,marginBottom:6}}>📎 Linked Alerts ({detail.alerts?.length||0})</div>{(detail.alerts||[]).map((a:any)=>(<div key={a.id} style={{fontSize:'.72rem',padding:'4px 0',borderBottom:'1px solid var(--brd)'}}>{a.title||a.id} <span className="ts">{ago(a.addedAt)}</span></div>))}<div style={{display:'flex',gap:4,marginTop:6,flexWrap:'wrap'}}>{alerts.slice(0,5).map(a=>(<button key={a.id} className="tc-btn" style={{fontSize:'.54rem',padding:'2px 4px'}} onClick={()=>addAlert(detail.id,a)}>+ {a.title?.substring(0,30)}</button>))}</div></div><div style={{marginBottom:12}}><div style={{fontSize:'.72rem',fontWeight:700,marginBottom:6}}>🕐 Timeline</div>{(detail.timeline||[]).map((t:any,i:number)=>(<div key={i} style={{display:'flex',gap:8,padding:'6px 0',borderBottom:'1px solid var(--brd)'}}><div style={{width:6,borderRadius:3,background:t.type==='note'?'var(--accent)':t.type==='status_change'?'var(--amber)':'var(--green)',flexShrink:0}}/><div><div style={{fontSize:'.72rem',fontWeight:600}}>{t.detail}</div><div className="ts">{t.by} · {ago(t.time)}</div></div></div>))}</div><div style={{display:'flex',gap:4}}><input className="field-input" placeholder="Add a note..." value={note} onChange={e=>setNote(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addNote(detail.id)} style={{flex:1,fontSize:'.72rem',padding:'6px 10px'}}/><button className="tc-btn tc-btn-primary" onClick={()=>addNote(detail.id)} style={{fontSize:'.68rem'}}>Add Note</button></div></div></div></div>}</>;
}


/* ═══ NOISE REDUCTION ═══ */
function NoiseReduction(){
  const[data,setData]=useState<any>(null);const[enabled,setEnabled]=useState(false);
  useEffect(()=>{fetch('/api/noise-reduction').then(r=>r.ok?r.json():null).then(d=>{if(d){setData(d);setEnabled(d.enabled)}}).catch(()=>{})},[]);
  async function toggle(){const next=!enabled;setEnabled(next);await fetch('/api/noise-reduction',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'configure',enabled:next})})}
  const s=data?.stats||{totalProcessed:0,autoClosed:0,escalated:0,timeSavedMins:0};
  const pct=s.totalProcessed>0?Math.round(s.autoClosed/s.totalProcessed*100):0;
  const hrs=Math.round(s.timeSavedMins/60*10)/10;
  return <div className="panel" style={{marginBottom:10}}><div className="panel-hd"><h3>🤖 AI Noise Reduction</h3><label className="toggle" style={{marginLeft:'auto'}}><input type="checkbox" checked={enabled} onChange={toggle}/><span className="toggle-slider"/></label></div><div style={{padding:'10px 14px'}}><div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',gap:8}}><div style={{textAlign:'center'}}><div style={{fontSize:'1.2rem',fontWeight:900,fontFamily:'var(--fm)',color:'var(--green)'}}>{s.autoClosed}</div><div style={{fontSize:'.55rem',color:'var(--t3)',fontWeight:600,textTransform:'uppercase'}}>Auto-Closed</div></div><div style={{textAlign:'center'}}><div style={{fontSize:'1.2rem',fontWeight:900,fontFamily:'var(--fm)',color:'var(--amber)'}}>{s.escalated}</div><div style={{fontSize:'.55rem',color:'var(--t3)',fontWeight:600,textTransform:'uppercase'}}>Escalated</div></div><div style={{textAlign:'center'}}><div style={{fontSize:'1.2rem',fontWeight:900,fontFamily:'var(--fm)',color:'var(--accent)'}}>{pct}%</div><div style={{fontSize:'.55rem',color:'var(--t3)',fontWeight:600,textTransform:'uppercase'}}>FP Rate</div></div><div style={{textAlign:'center'}}><div style={{fontSize:'1.2rem',fontWeight:900,fontFamily:'var(--fm)',color:'var(--green)'}}>{hrs}h</div><div style={{fontSize:'.55rem',color:'var(--t3)',fontWeight:600,textTransform:'uppercase'}}>Time Saved</div></div></div>{s.totalProcessed>0&&<div style={{marginTop:8,height:6,background:'var(--bg3)',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:pct+'%',background:'linear-gradient(90deg,var(--green),var(--accent))',borderRadius:3,transition:'width .5s'}}/></div>}{!enabled&&<div style={{textAlign:'center',fontSize:'.68rem',color:'var(--t3)',marginTop:8}}>Enable to auto-close false positives above 95% AI confidence</div>}</div></div>;
}

/* ═══ RISK ASSETS ═══ */
function RiskAssets(){
  const[data,setData]=useState<any>(null);
  useEffect(()=>{fetch('/api/tenable?t='+Date.now()).then(r=>r.ok?r.json():null).then(d=>{if(d)setData(d)}).catch(()=>{})},[]);
  if(!data||!data.topHosts||data.topHosts.length===0)return null;
  return <div className="panel"><div className="panel-hd"><h3>🔥 Top Risk Assets</h3><span className="count">{data.topHosts.length}</span></div><div style={{padding:6}}>{data.topHosts.slice(0,8).map((h:any,i:number)=>(<div key={i} className="risk-asset"><div className="risk-rank" style={{color:i<3?'var(--red)':i<6?'var(--amber)':'var(--t3)'}}>{i+1}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:'.72rem',fontWeight:700,fontFamily:'var(--fm)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.hostname}</div><div style={{fontSize:'.58rem',color:'var(--t3)'}}>{h.os?.substring(0,30)}</div></div><div style={{textAlign:'right'}}><div style={{fontSize:'.78rem',fontWeight:800,fontFamily:'var(--fm)',color:(h.exposureScore||0)>700?'var(--red)':(h.exposureScore||0)>400?'#f97316':'var(--green)'}}>{h.exposureScore||0}</div><div style={{fontSize:'.48rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px'}}>exposure</div></div></div>))}</div></div>;
}

/* ═══ OVERVIEW CHARTS ═══ */
function OvCharts({m,sparks,enabledTools}:any){
  const a=m?.alertsLast24h||{};
  return <div className="hero-grid" style={{gridTemplateColumns:'1fr 1fr 1fr'}}><div className="panel hero-panel"><div className="panel-hd"><h3>🎯 Severity</h3></div><div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:14,padding:'14px 10px'}}><SevRing c={a.critical||0} h={a.high||0} m={a.medium||0} l={a.low||0} size={95}/><div style={{fontSize:'.7rem',lineHeight:2}}><div><span className="sev sev-critical">{a.critical||0}</span> Crit</div><div><span className="sev sev-high">{a.high||0}</span> High</div><div><span className="sev sev-medium">{a.medium||0}</span> Med</div><div><span className="sev sev-low">{a.low||0}</span> Low</div></div></div></div><div className="panel hero-panel"><div className="panel-hd"><h3>📈 Hourly Alerts</h3></div><div style={{padding:'14px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}><HourlyChart data={sparks.hourly} w={200} h={60}/><div style={{display:'flex',justifyContent:'space-between',width:200,fontSize:'.52rem',color:'var(--t3)',fontFamily:'var(--fm)'}}><span>24h ago</span><span>12h</span><span>Now</span></div><div style={{display:'flex',gap:8,fontSize:'.5rem',color:'var(--t3)',marginTop:4}}><span><span style={{display:'inline-block',width:6,height:6,borderRadius:2,background:'var(--accent)',marginRight:3,opacity:.4}}/>Normal</span><span><span style={{display:'inline-block',width:6,height:6,borderRadius:2,background:'var(--accent)',marginRight:3}}/>Current</span></div></div></div><div className="panel hero-panel"><div className="panel-hd"><h3>🔌 Connected</h3></div><div style={{padding:'10px',display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center'}}>{enabledTools.map((t:any)=>(<div key={t.id} className="tool-chip" style={{borderColor:t.color+'33',color:t.color}}><span>{t.icon}</span>{t.shortName}</div>))}{enabledTools.length===0&&<div style={{fontSize:'.72rem',color:'var(--t3)',padding:12}}>No tools — go to Tools tab</div>}</div></div></div>;
}

/* ═══ OVERVIEW ═══ */

function Ov({m,cov,alerts,zsc,sparks,enabledTools,onAskAI,onRefresh,setTlDetail,onQuickAction,slaData}:any){
  return <><div className="war-room"><div className="wr-left"><PostureGauge/><QuietHours alerts={alerts}/><SLABar sla={slaData}/><QuickActions onAction={onQuickAction}/><KpiSection m={m} cov={cov} zsc={zsc} sparks={sparks} enabledTools={enabledTools} alerts={alerts}/></div><div className="wr-right"><AlertStream alerts={alerts} onAlert={onAskAI}/></div></div><OvCharts m={m} sparks={sparks} enabledTools={enabledTools}/><LockedFeature featureId="noise_reduction" plan={(typeof window!=='undefined'?(window as any).__wt_plan:null)||'community'}><NoiseReduction/></LockedFeature><RiskAssets/><div className="g23"><div>{m&&m.topSources&&<div className="panel"><div className="panel-hd"><h3>📊 Sources</h3></div><div style={{padding:14}}>{m.topSources.map((s:any)=>(<div key={s.source} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}><span className={`src ${sc(s.source)}`} style={{minWidth:80}}>{s.source}</span><div className="bar-wrap" style={{flex:1}}><div className="bar-track"><div className="bar-fill" style={{width:`${s.pct}%`}}/></div></div><span className="mono" style={{fontSize:'.72rem'}}>{s.count}</span></div>))}</div></div>}</div><div className="panel" style={{overflow:'hidden'}}><div className="panel-hd"><h3>🕐 Timeline</h3></div><div style={{overflowY:'auto',maxHeight:300,padding:'6px 14px'}}>{(alerts.length>0?alerts.slice(0,10).map((a:Al)=>({id:a.id,time:a.timestamp,title:a.title,source:a.source,icon:a.severity==='critical'?'🔴':a.severity==='high'?'🟠':'🟡'})):TL).map(t=>(<div key={t.id} className="tl-item clickable-row" style={{cursor:'pointer'}} onClick={()=>setTlDetail(t)}><div className="tl-icon">{t.icon}</div><div className="tl-body"><div className="tl-title">{t.title}</div><div className="tl-meta"><span className={`src ${sc(t.source)}`}>{t.source}</span><span className="ts">{ago(t.time)}</span></div></div></div>))}</div></div></div></>;
}

/* ═══ ALERTS ═══ */
function Als({alerts,onAskAI,onDeviceDrill,onNotes}:{alerts:Al[];onAskAI?:(a:Al)=>void;onDeviceDrill?:(h:string)=>void;onNotes?:(id:string)=>void}){
  const[triaged,setTriaged]=useState<any[]>([]);const[triageStats,setTriageStats]=useState<any>(null);
  const[triageOn,setTriageOn]=useState(false);
  useEffect(()=>{if(triageOn&&alerts.length>0){fetch('/api/auto-triage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({alerts})}).then(r=>r.ok?r.json():{alerts:[]}).then(d=>{setTriaged(d.alerts||[]);if(d.stats)setTriageStats(d.stats)}).catch(()=>{})}},[triageOn,alerts]);
  const[sev,setSev]=useState('all');const[src,setSrc]=useState('all');const[grouped,setGrouped]=useState(false);
  const sources=[...new Set(alerts.map(a=>a.source))];
  const f=alerts.filter(a=>sev==='all'||a.severity===sev).filter(a=>src==='all'||a.source===src);
  return(<><div className="filter-row"><div className="pills">{['all','critical','high','medium','low'].map(s=>(<button key={s} className={`pill ${sev===s?'on':''}`} onClick={()=>setSev(s)}>{s==='all'?`All (${alerts.length})`:`${s.charAt(0).toUpperCase()+s.slice(1)} (${alerts.filter(a=>a.severity===s).length})`}</button>))}</div><button className={`tc-btn ${grouped?'tc-btn-primary':''}`} onClick={()=>setGrouped(!grouped)} style={{fontSize:'.66rem',padding:'3px 8px'}}>{grouped?'🔗 Correlated':'🔗 Correlate'}</button><ExportBtn data={()=>f.map(a=>({title:a.title,source:a.source,severity:a.severity,status:a.status,device:a.device,user:a.user,mitre:a.mitre,time:a.timestamp}))} filename="secops-alerts"/><button className={`tc-btn ${triageOn?'tc-btn-primary':''}`} onClick={()=>{const p=(typeof window!=='undefined'&&(window as any).__wt_plan)||'community';if(p==='community'){alert('AI Triage requires Team plan or higher. Upgrade at /pricing');return}setTriageOn(!triageOn)}} style={{fontSize:'.66rem',padding:'3px 8px'}}>{triageOn?'🤖 Triaged':'🤖 Auto-Triage'}</button>{triageStats&&triageOn&&<span style={{fontSize:'.58rem',color:'var(--green)',fontWeight:600}}>{triageStats.tp} TP · {triageStats.fp} FP · {triageStats.suspicious} SUS · {triageStats.autoClosed} auto-closed · {triageStats.escalated} escalated — processed in 3.2s</span>}<button className="tc-btn" onClick={()=>window.location.reload()} style={{fontSize:'.66rem',padding:'3px 8px'}}>↻ Refresh</button></div><div className="panel"><div className="tbl-wrap" style={{maxHeight:'calc(100vh - 170px)'}}><table className="tbl"><thead><tr><th>Alert</th><th>Source</th><th>Sev</th><th className="desk-only">Status</th><th className="desk-only">Device</th><th className="desk-only">MITRE</th><th>Time</th><th className="desk-only">Actions</th></tr></thead><tbody>{(()=>{if(!grouped)return f.map(a=>(<tr key={a.id}><td style={{fontWeight:600,maxWidth:280}}>{a.title}</td><td><span className={`src ${sc(a.source)}`}>{a.source}</span></td><td><span className={`sev sev-${a.severity}`}>{a.severity}</span></td><td className="desk-only"><span className={`status status-${a.status}`}>{a.status}</span></td><td className="device desk-only">{a.device?<span style={{cursor:"pointer",textDecoration:"underline dotted",textUnderlineOffset:2}} onClick={()=>onDeviceDrill?.(a.device)}>{a.device}</span>:"—"}</td><td className="desk-only">{a.mitre?<span className="mitre">{a.mitre}</span>:<span className="muted">—</span>}</td><td className="ts">{ago(a.timestamp)}</td><td className="desk-only"><ActionMenu alert={a} onDone={()=>{}}/><button className="tc-btn" onClick={()=>{const p=(window as any).__wt_plan||'community';if(p==='community'){alert('AI Co-Pilot requires Team plan or higher');return}onAskAI?.(a)}} style={{fontSize:'.58rem',padding:'2px 5px'}}>🤖</button><button className="tc-btn" onClick={()=>onNotes?.(a.id)} style={{fontSize:'.58rem',padding:'2px 5px'}}>📝</button><button className="tc-btn" onClick={()=>fetch('/api/slack-webhook',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'send',alert:a})}).then(()=>{})} style={{fontSize:'.58rem',padding:'2px 5px'}} title="Send to Slack">💬</button></td></tr>));
        // Correlate: group by device within 30min windows
        const groups:Record<string,Al[]>={};
        f.forEach(a=>{const key=a.device||a.user||a.id;if(!groups[key])groups[key]=[];groups[key].push(a)});
        return Object.entries(groups).flatMap(([key,als])=>{
          if(als.length===1)return als.map(a=>(<tr key={a.id}><td style={{fontWeight:600,maxWidth:280}}>{a.title}</td><td><span className={`src ${sc(a.source)}`}>{a.source}</span></td><td><span className={`sev sev-${a.severity}`}>{a.severity}</span></td><td className="desk-only"><span className={`status status-${a.status}`}>{a.status}</span></td><td className="device desk-only">{a.device?<span style={{cursor:"pointer",textDecoration:"underline dotted",textUnderlineOffset:2}} onClick={()=>onDeviceDrill?.(a.device)}>{a.device}</span>:"—"}</td><td className="desk-only">{a.mitre?<span className="mitre">{a.mitre}</span>:<span className="muted">—</span>}</td><td className="ts">{ago(a.timestamp)}</td><td className="desk-only"><ActionMenu alert={a} onDone={()=>{}}/><button className="tc-btn" onClick={()=>{const p=(window as any).__wt_plan||'community';if(p==='community'){alert('AI Co-Pilot requires Team plan or higher');return}onAskAI?.(a)}} style={{fontSize:'.58rem',padding:'2px 5px'}}>🤖</button><button className="tc-btn" onClick={()=>onNotes?.(a.id)} style={{fontSize:'.58rem',padding:'2px 5px'}}>📝</button><button className="tc-btn" onClick={()=>fetch('/api/slack-webhook',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'send',alert:a})}).then(()=>{})} style={{fontSize:'.58rem',padding:'2px 5px'}} title="Send to Slack">💬</button></td></tr>));
          const top=als.sort((a,b)=>SO[a.severity]-SO[b.severity])[0];
          return[<tr key={key} className="corr-group"><td colSpan={8} style={{padding:'6px 10px',background:'var(--accent-s)',borderLeft:'3px solid var(--accent)'}}><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:'.7rem',fontWeight:700,color:'var(--accent)'}}>🔗 Correlated ({als.length} alerts)</span><span className="device">{key}</span><span className="muted" style={{fontSize:'.62rem'}}>Highest: <span className={`sev sev-${top.severity}`}>{top.severity}</span></span>{als.map(a=>(<span key={a.id} className={`src ${sc(a.source)}`} style={{marginLeft:2}}>{a.source}</span>))}<span style={{marginLeft:'auto'}}><ActionMenu alert={top} onDone={()=>{}}/></span></div><div style={{fontSize:'.68rem',color:'var(--t2)',marginTop:3}}>{als.map(a=>a.title).join(' → ')}</div></td></tr>];
        });
      })()}</tbody></table></div></div>
  </>);
}

/* ═══ COVERAGE ═══ */
function CovTab({cov,onRefresh}:{cov:any;onRefresh?:()=>void}){
  const[taegisEps,setTaegisEps]=useState<any>(null);const[loadingEps,setLoadingEps]=useState(false);
  function loadTaegisEndpoints(){setLoadingEps(true);fetch('/api/taegis/endpoints').then(r=>r.ok?r.json():null).then(d=>{if(d)setTaegisEps(d);setLoadingEps(false)}).catch(()=>setLoadingEps(false))}
  if(!cov)return null;
  const osData=cov.osBreakdown||[];const gaps=cov.gaps||[];const toolEntries=Object.entries(cov.tools||{});
  return <><div style={{display:'flex',justifyContent:'flex-end',marginBottom:6,gap:4}}>{onRefresh&&<button className="tc-btn" onClick={onRefresh} style={{fontSize:'.66rem',padding:'3px 8px'}}>↻ Refresh Coverage</button>}<button className="tc-btn" onClick={loadTaegisEndpoints} disabled={loadingEps} style={{fontSize:'.66rem',padding:'3px 8px'}}>{loadingEps?'Loading...':'🎯 Taegis Endpoints'}</button></div><div className="kpi-grid"><div className="kpi"><div className="kpi-label">Total Assets</div><div className="kpi-val">{cov.totalDevices?.toLocaleString()}</div></div><div className="kpi"><div className="kpi-label">Agent Coverage</div><div className="kpi-val" style={{color:(cov.agentCoverage||0)>=90?'var(--green)':(cov.agentCoverage||0)>=70?'var(--amber)':'var(--red)'}}>{cov.agentCoverage||0}%</div></div><div className="kpi"><div className="kpi-label">Stale Assets</div><div className="kpi-val" style={{color:(cov.staleCount||0)>0?'var(--amber)':'var(--green)'}}>{cov.staleCount||0}</div><div className="kpi-sub">Not seen 14+ days</div></div>{toolEntries.map(([k,v]:any)=>(<div key={k} className="kpi"><div className="kpi-label">{k}</div><div className="kpi-val" style={{color:'var(--green)'}}>{v.installed?.toLocaleString()}</div><div className="kpi-sub">{v.healthy||0} healthy · {v.degraded||0} stale</div></div>))}</div>{taegisEps&&<div className="panel"><div className="panel-hd"><h3>🎯 Taegis Endpoints</h3><span className="count">{taegisEps.total||taegisEps.endpoints?.length||0}</span></div>{taegisEps.error?<div style={{padding:12,color:'var(--red)',fontSize:'.76rem'}}>{taegisEps.error}</div>:<div className="tbl-wrap" style={{maxHeight:300}}><table className="tbl"><thead><tr><th>Hostname</th><th>OS</th><th>Sensor</th><th>Isolated</th><th>Last Seen</th></tr></thead><tbody>{(taegisEps.endpoints||[]).map((ep:any)=>(<tr key={ep.id}><td className="device" style={{fontWeight:700}}>{ep.hostname}</td><td style={{fontSize:'.7rem'}}>{ep.os} {ep.osVersion}</td><td className="mono" style={{fontSize:'.65rem'}}>{ep.sensorVersion||'—'}</td><td>{ep.isolated?<span style={{color:'var(--red)',fontSize:'.6rem',fontWeight:700}}>🔒 ISOLATED</span>:<span style={{color:'var(--green)',fontSize:'.6rem'}}>Active</span>}</td><td className="ts">{ep.lastSeen?ago(ep.lastSeen):'—'}</td></tr>))}</tbody></table></div>}</div>}{osData.length>0&&<div className="panel"><div className="panel-hd"><h3>💻 OS Breakdown</h3><span className="count">{osData.length} types</span></div><div style={{padding:14}}>{osData.map((o:any)=>(<div key={o.os} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}><span style={{minWidth:100,fontSize:'.72rem',fontWeight:600,color:'var(--t1)'}}>{o.os}</span><div className="bar-wrap" style={{flex:1}}><div className="bar-track"><div className="bar-fill" style={{width:`${o.pct}%`,background:o.os.includes('Server 2008')||o.os.includes('Server 2012')?'var(--red)':'var(--accent)'}}/></div></div><span className="mono" style={{fontSize:'.68rem',minWidth:50,textAlign:'right'}}>{o.count.toLocaleString()} ({o.pct}%)</span></div>))}</div></div>}<div className="panel"><div className="panel-hd"><h3>⚠ Coverage Gaps</h3><span className="count">{gaps.length}{gaps.length>=30?'+':''}</span></div>{gaps.length===0?<div style={{padding:20,textAlign:'center',color:'var(--t3)',fontSize:'.78rem'}}>No coverage gaps</div>:<div className="tbl-wrap" style={{maxHeight:400}}><table className="tbl"><thead><tr><th>Host</th><th className="desk-only">IP</th><th className="desk-only">OS</th><th>Missing</th><th className="desk-only">Reason</th><th className="desk-only">Last Seen</th></tr></thead><tbody>{gaps.map((g:any,i:number)=>(<tr key={i}><td className="device" style={{fontWeight:600}}>{g.hostname}</td><td className="desk-only mono" style={{fontSize:'.7rem'}}>{g.ip||'—'}</td><td className="desk-only" style={{fontSize:'.7rem'}}>{g.os}</td><td>{g.missing.map((m:string)=><span key={m} className="src" style={{marginRight:3}}>{m}</span>)}</td><td className="muted desk-only" style={{fontSize:'.72rem'}}>{g.reason}</td><td className="desk-only ts">{g.lastSeen?ago(g.lastSeen):'Never'}</td></tr>))}</tbody></table></div>}</div></>;
}

/* ═══ VULNS ═══ */
function Vul({onVulnClick}:{onVulnClick?:(v:any)=>void}){
  const[d,setD]=useState<any>(null);const[loading,setLoading]=useState(false);const[sevFilter,setSevFilter]=useState('all');const[search,setSearch]=useState('');const[view,setView]=useState<'vulns'|'hosts'|'compliance'|'scans'>('vulns');
  const[compliance,setCompliance]=useState<any>(null);const[scans,setScans]=useState<any[]>([]);const[scanMsg,setScanMsg]=useState('');
  function reload(){setLoading(true);fetch('/api/tenable?t='+Date.now()).then(r=>r.ok?r.json():null).then(data=>{if(data)setD(data);setLoading(false)}).catch(()=>setLoading(false))}
  function loadCompliance(){fetch('/api/tenable/compliance').then(r=>r.ok?r.json():null).then(data=>{if(data)setCompliance(data)}).catch(()=>{})}
  function loadScans(){fetch('/api/tenable/scan').then(r=>r.ok?r.json():null).then(data=>{if(data?.scans)setScans(data.scans)}).catch(()=>{})}
  function launchScan(id:number){setScanMsg('Launching...');fetch('/api/tenable/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scanId:id})}).then(r=>r.json()).then(d=>{setScanMsg(d.ok?'✓ Scan launched':'✗ '+d.error);setTimeout(()=>setScanMsg(''),3000)}).catch(()=>setScanMsg('Failed'))}
  useEffect(()=>{fetch('/api/tenable?t='+Date.now()).then(r=>r.ok?r.json():null).then(data=>{if(data)setD(data)}).catch(()=>{})},[]);
  if(!d)return <div className="loading"><span className="spin"/>Loading...</div>;
  const s=d.summary||{};const allV=d.allVulns||[];const topH=d.topHosts||[];
  const filtered=allV.filter((v:any)=>sevFilter==='all'||v.sevLabel===sevFilter).filter((v:any)=>!search||v.name?.toLowerCase().includes(search.toLowerCase())||String(v.id).includes(search)||v.family?.toLowerCase().includes(search.toLowerCase()));
  const patchPriority=allV.filter((v:any)=>(v.vpr||0)>0).sort((a:any,b:any)=>((b.vpr||0)*(b.hosts||1))-((a.vpr||0)*(a.hosts||1))).slice(0,20);
  function exportCSV(){const rows=filtered.map((v:any)=>({plugin_id:v.id,name:v.name,family:v.family,severity:v.sevLabel,cvss3:v.cvss,cvss2:v.cvss2,vpr:v.vpr,hosts:v.hosts,state:v.state}));if(!rows.length)return;const keys=Object.keys(rows[0]);const csv=[keys.join(','),...rows.map((r:any)=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='vulnerabilities.csv';a.click();URL.revokeObjectURL(u)}
  return <><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:6,marginBottom:8}}><div className="pills"><button className={`pill ${sevFilter==='all'?'on':''}`} onClick={()=>setSevFilter('all')}>All ({s.total||allV.length})</button><button className={`pill ${sevFilter==='critical'?'on':''}`} onClick={()=>setSevFilter('critical')} style={{color:sevFilter==='critical'?'var(--red)':''}}>Critical ({s.critical||0})</button><button className={`pill ${sevFilter==='high'?'on':''}`} onClick={()=>setSevFilter('high')} style={{color:sevFilter==='high'?'#f97316':''}}>High ({s.high||0})</button><button className={`pill ${sevFilter==='medium'?'on':''}`} onClick={()=>setSevFilter('medium')}>Med ({s.medium||0})</button><button className={`pill ${sevFilter==='low'?'on':''}`} onClick={()=>setSevFilter('low')}>Low ({s.low||0})</button></div><div style={{display:'flex',gap:4,flexWrap:'wrap'}}><input className="field-input" placeholder="Search plugin, ID, family..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:180,fontSize:'.72rem',padding:'4px 8px'}}/><button className={`tc-btn ${view==='vulns'?'tc-btn-primary':''}`} onClick={()=>setView('vulns')} style={{fontSize:'.6rem',padding:'3px 6px'}}>Vulns</button><button className={`tc-btn ${view==='hosts'?'tc-btn-primary':''}`} onClick={()=>setView('hosts')} style={{fontSize:'.6rem',padding:'3px 6px'}}>Hosts</button><button className={`tc-btn ${view==='compliance'?'tc-btn-primary':''}`} onClick={()=>{setView('compliance');loadCompliance()}} style={{fontSize:'.6rem',padding:'3px 6px'}}>Compliance</button><button className={`tc-btn ${view==='scans'?'tc-btn-primary':''}`} onClick={()=>{setView('scans');loadScans()}} style={{fontSize:'.6rem',padding:'3px 6px'}}>Scans</button><button className="tc-btn" onClick={exportCSV} style={{fontSize:'.6rem',padding:'3px 6px'}}>📥 CSV</button><a href="/api/tenable/report" className="tc-btn" style={{fontSize:'.6rem',padding:'3px 6px',textDecoration:'none'}}>📄 Report</a><button className="tc-btn" onClick={reload} disabled={loading} style={{fontSize:'.6rem',padding:'3px 6px'}}>{loading?'...':'↻'}</button></div></div><div className="kpi-grid"><div className="kpi"><div className="kpi-label">Total Vulns</div><div className="kpi-val">{s.total||0}</div></div><div className="kpi"><div className="kpi-label">Critical</div><div className="kpi-val" style={{color:'var(--red)'}}>{s.critical||0}</div></div><div className="kpi"><div className="kpi-label">High</div><div className="kpi-val" style={{color:'#f97316'}}>{s.high||0}</div></div><div className="kpi"><div className="kpi-label">Assets</div><div className="kpi-val">{d.assetCounts?.total||0}</div><div className="kpi-sub">{d.assetCounts?.scanned||0} agents ({d.scanHealth?.coverage||0}%)</div></div></div>{view==='compliance'?<div className="panel"><div className="panel-hd"><h3>✅ Compliance Checks</h3></div>{!compliance?<div style={{padding:20,textAlign:'center'}}><span className="spin" style={{display:'inline-block'}}/>Loading compliance data...</div>:<><div className="kpi-grid" style={{padding:10}}><div className="kpi"><div className="kpi-label">Passed</div><div className="kpi-val" style={{color:'var(--green)'}}>{compliance.summary?.passed||0}</div></div><div className="kpi"><div className="kpi-label">Warning</div><div className="kpi-val" style={{color:'var(--amber)'}}>{compliance.summary?.warn||0}</div></div><div className="kpi"><div className="kpi-label">Failed</div><div className="kpi-val" style={{color:'var(--red)'}}>{compliance.summary?.failed||0}</div></div><div className="kpi"><div className="kpi-label">Score</div><div className="kpi-val" style={{color:((compliance.summary?.pct)||0)>=80?'var(--green)':((compliance.summary?.pct)||0)>=60?'var(--amber)':'var(--red)'}}>{compliance.summary?.pct||0}%</div></div></div>{compliance.checks?.length>0&&<div className="tbl-wrap" style={{maxHeight:400}}><table className="tbl"><thead><tr><th>Check</th><th>Family</th><th>Sev</th><th>Hosts</th></tr></thead><tbody>{compliance.checks.map((ch:any)=>(<tr key={ch.id}><td style={{fontSize:'.74rem',fontWeight:600}}>{ch.name}</td><td style={{fontSize:'.68rem',color:'var(--t3)'}}>{ch.family}</td><td><span className={`sev sev-${ch.severity>=3?'critical':ch.severity>=2?'medium':'low'}`}>{ch.severity>=3?'FAIL':ch.severity>=1?'WARN':'PASS'}</span></td><td className="mono">{ch.hosts}</td></tr>))}</tbody></table></div>}</>}</div>:view==='scans'?<div className="panel"><div className="panel-hd"><h3>🔍 Tenable Scans</h3>{scanMsg&&<span style={{fontSize:'.68rem',color:scanMsg.includes('✓')?'var(--green)':'var(--red)'}}>{scanMsg}</span>}</div>{scans.length===0?<div style={{padding:20,textAlign:'center',color:'var(--t3)'}}>Loading scans...</div>:<div className="tbl-wrap"><table className="tbl"><thead><tr><th>Scan</th><th>Status</th><th>Last Run</th><th>Action</th></tr></thead><tbody>{scans.map((sc:any)=>(<tr key={sc.id}><td style={{fontWeight:600,fontSize:'.76rem'}}>{sc.name}</td><td><span style={{fontSize:'.58rem',color:sc.status==='completed'?'var(--green)':sc.status==='running'?'var(--accent)':'var(--t3)',background:sc.status==='completed'?'var(--greens)':sc.status==='running'?'var(--blues)':'var(--bg3)',padding:'1px 6px',borderRadius:3,fontWeight:600}}>{sc.status}</span></td><td className="ts">{sc.lastRun?ago(sc.lastRun):'Never'}</td><td><button className="tc-btn tc-btn-primary" onClick={()=>launchScan(sc.id)} disabled={sc.status==='running'} style={{fontSize:'.6rem',padding:'2px 8px'}}>{sc.status==='running'?'Running...':'▶ Launch'}</button></td></tr>))}</tbody></table></div>}</div>:view==='hosts'&&topH.length>0?<div className="panel"><div className="panel-hd"><h3>🔥 Riskiest Hosts</h3><span className="count">{topH.length}</span></div><div className="tbl-wrap"><table className="tbl"><thead><tr><th>Host</th><th>IP</th><th>OS</th><th>Exposure</th><th>ACR</th><th className="desk-only">Agent</th><th className="desk-only">Last Seen</th></tr></thead><tbody>{topH.map((h:any,i:number)=>(<tr key={i}><td className="device" style={{fontWeight:700}}>{h.hostname}</td><td className="mono" style={{fontSize:'.7rem'}}>{h.ip}</td><td style={{fontSize:'.7rem',maxWidth:180}}>{h.os}</td><td><span style={{fontFamily:'var(--fm)',fontWeight:700,color:(h.exposureScore||0)>700?'var(--red)':(h.exposureScore||0)>400?'#f97316':'var(--green)'}}>{h.exposureScore||'—'}</span></td><td className="mono">{h.acrScore||'—'}</td><td className="desk-only">{h.hasAgent?<span style={{color:'var(--green)',fontSize:'.6rem'}}>✓</span>:<span style={{color:'var(--red)',fontSize:'.6rem'}}>✗</span>}</td><td className="desk-only ts">{h.lastSeen?ago(h.lastSeen):'—'}</td></tr>))}</tbody></table></div></div>:<>{patchPriority.length>0&&<div className="panel" style={{marginBottom:10}}><div className="panel-hd"><h3>🎯 Patch Priority (VPR × Hosts)</h3><span className="count">Top {patchPriority.length}</span></div><div className="tbl-wrap" style={{maxHeight:200}}><table className="tbl"><thead><tr><th>Plugin</th><th>Name</th><th>VPR</th><th>Hosts</th><th>Risk Score</th></tr></thead><tbody>{patchPriority.map((v:any)=>(<tr key={v.id} onClick={()=>onVulnClick?.({id:'PID-'+v.id,name:v.name,cvss:v.cvss,vpr:v.vpr,hosts:v.hosts,family:v.family})} style={{cursor:'pointer'}} className="clickable-row"><td className="mono" style={{fontWeight:700,fontSize:'.68rem',color:'var(--red)'}}>{v.id}</td><td style={{fontSize:'.72rem',fontWeight:600,maxWidth:280}}>{v.name}</td><td className="mono" style={{fontWeight:700,color:(v.vpr||0)>=7?'var(--red)':'#f97316'}}>{v.vpr}</td><td className="mono">{v.hosts}</td><td className="mono" style={{fontWeight:800,color:'var(--red)'}}>{Math.round((v.vpr||0)*(v.hosts||1))}</td></tr>))}</tbody></table></div></div>}<div className="panel"><div className="panel-hd"><h3>🔴 Vulnerabilities</h3><span className="count">{filtered.length}{d.source==='tenable-live'&&<span style={{color:'var(--green)',marginLeft:6,fontSize:'.55rem'}}>● LIVE</span>}</span></div><div className="tbl-wrap" style={{maxHeight:'calc(100vh - 380px)'}}><table className="tbl"><thead><tr><th>Plugin</th><th>Name</th><th>Sev</th><th>CVSS3</th><th>VPR</th><th>Hosts</th><th className="desk-only">Family</th><th className="desk-only">State</th></tr></thead><tbody>{filtered.slice(0,100).map((v:any)=>(<tr key={v.id} onClick={()=>onVulnClick?.({id:'PID-'+v.id,name:v.name,cvss:v.cvss,vpr:v.vpr,hosts:v.hosts,family:v.family,state:v.state})} style={{cursor:'pointer'}} className="clickable-row"><td className="mono" style={{fontWeight:700,color:v.severity===4?'var(--red)':v.severity===3?'#f97316':'var(--t2)',fontSize:'.68rem'}}>{v.id}</td><td style={{fontWeight:600,maxWidth:320,fontSize:'.74rem'}}>{v.name}</td><td><span className={`sev sev-${v.sevLabel}`}>{v.sevLabel}</span></td><td className="mono" style={{fontWeight:700}}>{v.cvss}</td><td className="mono" style={{fontWeight:700,color:(v.vpr||0)>=7?'var(--red)':(v.vpr||0)>=4?'#f97316':'var(--t2)'}}>{v.vpr||'—'}</td><td className="mono">{v.hosts}</td><td className="desk-only" style={{fontSize:'.68rem',color:'var(--t3)'}}>{v.family}</td><td className="desk-only"><span style={{fontSize:'.58rem',color:v.state==='Active'?'var(--red)':'var(--green)',background:v.state==='Active'?'var(--reds)':'var(--greens)',padding:'1px 5px',borderRadius:3,fontWeight:600}}>{v.state}</span></td></tr>))}</tbody></table></div></div></>}<div className="g2r"><div className="panel"><div className="panel-hd"><h3>Asset Risk</h3></div><div style={{padding:16,display:'flex',justifyContent:'space-around',alignItems:'center',flexWrap:'wrap',gap:12}}><Donut val={d.assetCounts?.withCritical||0} max={d.assetCounts?.total||1} color="var(--red)" label="Critical"/><Donut val={d.assetCounts?.withHigh||0} max={d.assetCounts?.total||1} color="#f97316" label="High"/><Donut val={d.assetCounts?.scanned||0} max={d.assetCounts?.total||1} color="var(--green)" label="Agents"/></div></div><div className="panel"><div className="panel-hd"><h3>Severity Ring</h3></div><div style={{display:'flex',justifyContent:'center',padding:16}}><SevRing c={s.critical||0} h={s.high||0} m={s.medium||0} l={s.low||0} size={110}/></div></div></div></>;
}

/* ═══ TOOLS MANAGER ═══ */
function ToolsManager({toolsData,onRefresh}:{toolsData:any;onRefresh:()=>void}){
  const[setupData,setSetupData]=useState<any>(null);const[redisUrl,setRedisUrl]=useState('');const[redisToken,setRedisToken]=useState('');const[redisTesting,setRedisTesting]=useState(false);const[redisResult,setRedisResult]=useState<any>(null);const[demoEnabled,setDemoEnabled]=useState(false);
  useEffect(()=>{fetch('/api/tools').then(r=>r.ok?r.json():{}).then(d=>{if(d?.tools?.['_demo']?.enabled)setDemoEnabled(true)}).catch(()=>{});fetch('/api/setup').then(r=>r.ok?r.json():null).then(d=>{if(d)setSetupData(d)}).catch(()=>{})},[]);
  async function toggleDemo(){const next=!demoEnabled;setDemoEnabled(next);if(next){await fetch('/api/tools',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({toolId:'_demo',credentials:{mode:'demo'},enabled:true})})}else{await fetch('/api/tools',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({toolId:'_demo'})})}setTimeout(onRefresh,500)}
  async function testRedis(){setRedisTesting(true);setRedisResult(null);const r=await fetch('/api/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'test_redis',redisUrl,redisToken})}).then(r=>r.json());setRedisResult(r);setRedisTesting(false)}
  const[selectedTool,setSelectedTool]=useState<string|null>(null);const[migrating,setMigrating]=useState(false);
  
  const[testResult,setTestResult]=useState<any>(null);const[testing,setTesting]=useState('');const[healthChecks,setHealthChecks]=useState<any[]>([]);const[checkingHealth,setCheckingHealth]=useState(false);
  async function runHealthCheck(){setCheckingHealth(true);const checks:any[]=[];const apis=[{name:'Unified Alerts',url:'/api/unified-alerts?t='+Date.now()},{name:'Coverage',url:'/api/coverage?t='+Date.now()},{name:'Tenable Vulns',url:'/api/tenable?t='+Date.now()},{name:'Threat Intel',url:'/api/threat-intel?t='+Date.now()}];for(const api of apis){try{const start=Date.now();const r=await fetch(api.url);const ms=Date.now()-start;const d=await r.json();checks.push({name:api.name,ok:r.ok,status:r.status,ms,demo:d.demo,error:d.error||null,source:d.source||null})}catch(e){checks.push({name:api.name,ok:false,error:String(e)})}}setHealthChecks(checks);setCheckingHealth(false)}
  async function testTool(toolId:string){setTesting(toolId);setTestResult(null);try{const r=await fetch('/api/tools/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({toolId})});const d=await r.json();setTestResult(d)}catch(e){setTestResult({error:'Test failed'})}setTesting('')}
  const[creds,setCreds]=useState<Record<string,string>>({});
  const[saving,setSaving]=useState(false);
  const[msg,setMsg]=useState('');
  const[catFilter,setCatFilter]=useState('all');

  const toolStatuses:Record<string,any>={};
  Object.values(toolsData?.tools||{}).forEach((t:any)=>{toolStatuses[t.id||'']=t});

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
      if(data.ok){setMsg('✓ Saved');setSelectedTool(null);setTimeout(onRefresh,500)}
      else setMsg(data.error||'Error saving');
    }catch(e){setMsg('Network error')}
    setSaving(false);
  }

  async function toggleTool(toolId:string,enabled:boolean){
    await fetch('/api/tools',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'toggle',toolId,enabled})});
    onRefresh();
  }

  async function removeTool(toolId:string){
    if(!confirm(`Remove ${toolId} and all its credentials? This cannot be undone.`))return;
    await fetch('/api/tools',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({toolId})});
    onRefresh();
  }

  const sel=TOOLS.find(t=>t.id===selectedTool);

  return(<div style={{maxWidth:900}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}><div><h2 style={{fontSize:'1.1rem',fontWeight:800}}>🔌 Tool Integrations</h2><p className="muted" style={{fontSize:'.76rem'}}>{Object.values(toolsData?.tools||{}).filter((t:any)=>t.enabled).length} connected · {TOOLS.length} available {toolsData?.kvAvailable?<span style={{color:'var(--green)',fontSize:'.62rem'}}> · ✓ Redis connected</span>:<span style={{color:'var(--amber)',fontSize:'.62rem'}}> · ⚠ Redis not linked</span>}</p></div>{!toolsData?.kvAvailable&&<div className="kv-warn">⚠ Redis not configured — credentials won't persist. <a href="https://upstash.com" target="_blank" rel="noopener" style={{color:'var(--accent)'}}>Set up Upstash Redis (free) →</a></div>}</div><div className="panel" style={{marginBottom:12}}><div className="panel-hd"><h3>🎮 Demo Data</h3><span style={{fontSize:'.6rem',color:demoEnabled?'var(--green)':'var(--t3)'}}>{demoEnabled?'Active':'Off'}</span></div><div style={{padding:'10px 14px'}}><div style={{fontSize:'.72rem',color:'var(--t2)',marginBottom:10}}>Enable demo data per tool. Useful when a tool is not connected or for demonstrations.</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:6}}>{[{id:'_demo',label:'All Tools (Global)',desc:'Override all tools'},{id:'_demo_tenable',label:'Tenable',desc:'Vulns + assets'},{id:'_demo_taegis',label:'Taegis XDR',desc:'Alerts + endpoints'},{id:'_demo_defender',label:'Defender',desc:'EDR alerts'},{id:'_demo_zscaler',label:'Zscaler',desc:'ZIA/ZPA data'},{id:'_demo_ai',label:'AI Features',desc:'Triage + copilot'}].map(d=>(<div key={d.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'var(--bg3)',borderRadius:8,cursor:'pointer',border:'1px solid '+(toolsData?.tools?.[d.id]?.enabled?'var(--accent)':'var(--brd)')}} onClick={async()=>{const cur=toolsData?.tools?.[d.id]?.enabled;if(cur){await fetch('/api/tools',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({toolId:d.id})})}else{await fetch('/api/tools',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({toolId:d.id,credentials:{mode:'demo'},enabled:true})})}setTimeout(onRefresh,500)}}><div style={{width:14,height:14,borderRadius:4,border:'2px solid '+(toolsData?.tools?.[d.id]?.enabled?'var(--accent)':'var(--brd)'),background:toolsData?.tools?.[d.id]?.enabled?'var(--accent)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.5rem',color:'#fff',flexShrink:0}}>{toolsData?.tools?.[d.id]?.enabled?'✓':''}</div><div><div style={{fontSize:'.72rem',fontWeight:600}}>{d.label}</div><div style={{fontSize:'.58rem',color:'var(--t3)'}}>{d.desc}</div></div></div>))}</div></div></div><div className="panel" style={{marginBottom:12}}><div className="panel-hd"><h3>📡 Status Widget</h3></div><div style={{padding:'10px 14px'}}><div style={{fontSize:'.72rem',color:'var(--t2)',marginBottom:8}}>Embed your SOC status on your intranet or wiki. Generate an API key in Settings → API Keys, then paste this code:</div><pre style={{background:'var(--bg3)',padding:10,borderRadius:8,fontSize:'.62rem',fontFamily:'var(--fm)',color:'var(--t3)',overflow:'auto',maxHeight:120,lineHeight:1.5}}>{'<div id="watchtower-widget"></div>\n<script>\nfetch("' + (typeof window !== 'undefined' ? window.location.origin : '') + '/api/widget?key=YOUR_API_KEY")\n  .then(r=>r.json()).then(d=>{\n    document.getElementById("watchtower-widget").innerHTML=\n      "<div style=\'padding:12px;background:#0b0f18;color:#e6ecf8;border-radius:10px;display:inline-flex;align-items:center;gap:10px;font-family:sans-serif\'>"+\n      "<div style=\'width:8px;height:8px;border-radius:50%;background:"+(d.status==="healthy"?"#22c992":"#f0405e")+"\'/>"+ \n      "<div><b>SOC: "+d.status.toUpperCase()+"</b><br><span style=\'font-size:11px;opacity:.6\'>"+d.openIncidents+" incidents</span></div></div>";\n  });\n</script>'}</pre><button className="tc-btn" onClick={()=>{const code='<div id="watchtower-widget"></div>\n<script>\nfetch("'+window.location.origin+'/api/widget?key=YOUR_API_KEY").then(r=>r.json()).then(d=>{document.getElementById("watchtower-widget").innerHTML="<div style=\'padding:12px;background:#0b0f18;color:#e6ecf8;border-radius:10px;display:inline-flex;align-items:center;gap:10px;font-family:sans-serif\'>"+"<div style=\'width:8px;height:8px;border-radius:50%;background:"+(d.status==="healthy"?"#22c992":"#f0405e")+"\'/>"+"<div><b>SOC: "+d.status.toUpperCase()+"</b><br><span style=\'font-size:11px;opacity:.6\'>"+d.openIncidents+" incidents</span></div></div>"});\n</script>';navigator.clipboard?.writeText(code)}} style={{fontSize:'.66rem',marginTop:6}}>📋 Copy Embed Code</button></div></div><div className="panel" style={{marginBottom:12}}><div className="panel-hd"><h3>🗄 Redis Database</h3><span style={{fontSize:'.6rem',color:toolsData?.kvAvailable?'var(--green)':'var(--amber)'}}>{toolsData?.kvAvailable?'● Connected':'● Not configured'}</span></div><div style={{padding:14}}>{toolsData?.kvAvailable?<div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><span style={{fontSize:'.72rem',color:'var(--green)',fontWeight:600}}>✓ Redis connected</span>{setupData?.redis?.urlPrefix&&<span className="mono" style={{fontSize:'.62rem',color:'var(--t3)'}}>{setupData.redis.urlPrefix}</span>}{setupData?.redis?.latencyMs&&<span className="mono" style={{fontSize:'.62rem',color:'var(--t3)'}}>{setupData.redis.latencyMs}ms</span>}</div>:<><div style={{fontSize:'.72rem',color:'var(--t2)',marginBottom:10}}>Enter your Upstash Redis credentials. <a href="https://upstash.com" target="_blank" rel="noopener" style={{color:'var(--accent)'}}>Get free Redis →</a></div><div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}><input className="field-input" placeholder="UPSTASH_REDIS_REST_URL" value={redisUrl} onChange={e=>setRedisUrl(e.target.value)} style={{flex:2,minWidth:200,fontSize:'.72rem',padding:'6px 10px'}}/><input className="field-input" type="password" placeholder="UPSTASH_REDIS_REST_TOKEN" value={redisToken} onChange={e=>setRedisToken(e.target.value)} style={{flex:2,minWidth:200,fontSize:'.72rem',padding:'6px 10px'}}/><button className="tc-btn tc-btn-primary" onClick={testRedis} disabled={redisTesting||!redisUrl||!redisToken} style={{fontSize:'.68rem',whiteSpace:'nowrap'}}>{redisTesting?'Testing...':'Test Connection'}</button></div>{redisResult&&<div style={{padding:'8px 10px',borderRadius:8,background:redisResult.ok?'var(--greens)':'var(--reds)',border:'1px solid',borderColor:redisResult.ok?'rgba(52,232,165,.15)':'rgba(255,68,102,.15)',fontSize:'.72rem',marginBottom:8}}>{redisResult.ok?<><span style={{color:'var(--green)',fontWeight:700}}>✓ Connection successful</span> <span className="mono" style={{color:'var(--t3)'}}>{redisResult.latencyMs}ms</span><div style={{marginTop:6,fontSize:'.68rem',color:'var(--t2)'}}>Add these to your Vercel environment variables:</div><div style={{marginTop:4,display:'flex',flexDirection:'column',gap:4}}><div style={{display:'flex',alignItems:'center',gap:4}}><code style={{flex:1,fontSize:'.6rem',background:'var(--bg3)',padding:'4px 8px',borderRadius:4,fontFamily:'var(--fm)',overflow:'hidden',textOverflow:'ellipsis'}}>UPSTASH_REDIS_REST_URL={redisUrl}</code><button className="tc-btn" onClick={()=>navigator.clipboard?.writeText('UPSTASH_REDIS_REST_URL='+redisUrl)} style={{fontSize:'.55rem',padding:'2px 6px'}}>Copy</button></div><div style={{display:'flex',alignItems:'center',gap:4}}><code style={{flex:1,fontSize:'.6rem',background:'var(--bg3)',padding:'4px 8px',borderRadius:4,fontFamily:'var(--fm)',overflow:'hidden',textOverflow:'ellipsis'}}>UPSTASH_REDIS_REST_TOKEN={redisToken}</code><button className="tc-btn" onClick={()=>navigator.clipboard?.writeText('UPSTASH_REDIS_REST_TOKEN='+redisToken)} style={{fontSize:'.55rem',padding:'2px 6px'}}>Copy</button></div></div><div style={{marginTop:6,fontSize:'.62rem',color:'var(--t3)'}}>Vercel → Project Settings → Environment Variables → Add both → Redeploy</div></>:<span style={{color:'var(--red)',fontWeight:700}}>✗ {redisResult.error}</span>}</div>}</>}{setupData&&<div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8,paddingTop:8,borderTop:'1px solid var(--brd)'}}><div style={{fontSize:'.62rem',color:'var(--t3)'}}><span style={{color:setupData.env.DASHBOARD_PASSWORD?'var(--green)':'var(--t4)'}}>●</span> Password</div><div style={{fontSize:'.62rem',color:'var(--t3)'}}><span style={{color:setupData.env.ANTHROPIC_API_KEY?'var(--green)':'var(--t4)'}}>●</span> Anthropic</div><div style={{fontSize:'.62rem',color:'var(--t3)'}}><span style={{color:setupData.env.RESEND_API_KEY?'var(--green)':'var(--t4)'}}>●</span> Resend</div><div style={{fontSize:'.62rem',color:'var(--t3)'}}><span style={{color:setupData.env.STRIPE_SECRET_KEY?'var(--green)':'var(--t4)'}}>●</span> Stripe</div></div>}</div></div><div className="pills" style={{marginBottom:12}}><button className={`pill ${catFilter==='all'?'on':''}`} onClick={()=>setCatFilter('all')}>All ({TOOLS.length})</button>{categories.map(c=>(<button key={c} className={`pill ${catFilter===c?'on':''}`} onClick={()=>setCatFilter(c)}>{c} ({TOOLS.filter(t=>t.categoryLabel===c).length})</button>))}</div><div className="panel" style={{marginBottom:12}}><div className="panel-hd"><h3>🏥 System Health</h3><button className="tc-btn" onClick={runHealthCheck} disabled={checkingHealth} style={{fontSize:'.62rem',padding:'2px 8px'}}>{checkingHealth?'Checking...':'Run Health Check'}</button></div>{healthChecks.length>0&&<div style={{padding:10}}>{healthChecks.map((h:any,i:number)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',borderBottom:i<healthChecks.length-1?'1px solid var(--brd)':'none'}}><span style={{color:h.ok?'var(--green)':'var(--red)',fontSize:'.8rem'}}>{h.ok?'✓':'✗'}</span><span style={{fontSize:'.76rem',fontWeight:600,minWidth:120}}>{h.name}</span>{h.ms&&<span className="mono" style={{fontSize:'.62rem',color:'var(--t3)'}}>{h.ms}ms</span>}{h.demo===true&&<span style={{fontSize:'.55rem',color:'var(--amber)',background:'var(--ambers)',padding:'1px 5px',borderRadius:3}}>DEMO DATA</span>}{h.demo===false&&<span style={{fontSize:'.55rem',color:'var(--green)',background:'var(--greens)',padding:'1px 5px',borderRadius:3}}>LIVE</span>}{h.source&&<span style={{fontSize:'.55rem',color:'var(--t3)',fontFamily:'var(--fm)'}}>{h.source}</span>}{h.error&&<span style={{fontSize:'.62rem',color:'var(--red)'}}>{h.error}</span>}{!h.ok&&<span style={{fontSize:'.62rem',color:'var(--red)'}}>HTTP {h.status}</span>}</div>))}</div>}</div>{testResult&&<div style={{marginBottom:8,padding:10,background:'var(--bg2)',border:'1px solid var(--brd)',borderRadius:'var(--r)',fontSize:'.72rem'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><strong>Test: {testResult.toolId}</strong><button className="modal-close" onClick={()=>setTestResult(null)} style={{fontSize:'.7rem'}}>✕</button></div>{testResult.steps?.map((s:any,i:number)=>(<div key={i} style={{padding:'3px 0',display:'flex',gap:6,alignItems:'center'}}><span style={{color:s.ok?'var(--green)':'var(--red)'}}>{s.ok?'✓':'✗'}</span><span style={{fontWeight:600}}>{s.step}</span>{s.error&&<span style={{color:'var(--red)'}}>{s.error}</span>}{s.status&&<span className="mono" style={{color:'var(--t3)'}}>HTTP {s.status}</span>}{s.body&&<span className="mono muted" style={{fontSize:'.6rem'}}>{s.body.substring(0,100)}</span>}{s.text&&<span className="mono" style={{color:'var(--green)'}}>{s.text}</span>}{s.keys&&<span className="muted">{s.keys.map((k:any)=>`${k.key}(${k.len}ch)`).join(', ')}</span>}{s.data&&<span className="mono muted">{JSON.stringify(s.data).substring(0,100)}</span>}</div>))}</div>}<div className="tool-grid">{filtered.map(tool=>{const st=toolStatuses[tool.id];
      const isEnabled=st?.enabled;
      const isConfigured=st?.configured;
      return(<div key={tool.id} className={`tool-card ${isEnabled?'enabled':''}`} style={{'--tc':tool.color} as any}><div className="tc-top"><span className="tc-icon">{tool.icon}</span><div className="tc-info"><div className="tc-name">{tool.name}</div><div className="tc-cat">{tool.categoryLabel} · {tool.vendor}</div></div>{isConfigured&&<label className="toggle"><input type="checkbox" checked={isEnabled} onChange={e=>toggleTool(tool.id,e.target.checked)}/><span className="toggle-slider"/></label>}</div><div className="tc-desc">{tool.description}</div><div className="tc-footer">{isConfigured?(<><span className="tc-status" style={{color:isEnabled?'var(--green)':'var(--t3)'}}><span className={`dot ${isEnabled?'dot-on':'dot-off'}`}/>{isEnabled?'Connected':'Disabled'}</span><button className="tc-btn" onClick={()=>testTool(tool.id)} disabled={testing===tool.id}>{testing===tool.id?'Testing...':'Test'}</button><button className="tc-btn" onClick={()=>openTool(tool)}>Edit</button><button className="tc-btn tc-btn-danger" onClick={()=>removeTool(tool.id)}>Remove</button></>):(<><span className="tc-status" style={{color:'var(--t3)'}}><span className="dot dot-off"/>Not configured</span><button className="tc-btn tc-btn-primary" onClick={()=>openTool(tool)}>+ Connect</button></>)}</div></div>);
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
const CSS=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box}
:root,[data-theme="dark"]{--bg0:#060910;--bg1:#0b0f18;--bg2:#10141e;--bg3:#181d2b;--bg4:#1f2536;--brd:#1a2030;--brd2:#252e42;--t1:#e6ecf8;--t2:#8a9ab8;--t3:#50607a;--t4:#303d52;--accent:#3b8bff;--accent2:#7c6aff;--accent-s:#3b8bff10;--red:#f0405e;--amber:#f0a030;--green:#22c992;--blue:#3b8bff;--purple:#9775fa;--reds:#f0405e10;--ambers:#f0a03010;--greens:#22c99210;--blues:#3b8bff10;--fm:'JetBrains Mono',monospace;--fs:'DM Sans',sans-serif;--r:10px;--r2:14px;--shadow:0 2px 8px rgba(0,0,0,.4),0 8px 32px rgba(0,0,0,.2);--glow:0 0 30px rgba(59,139,255,.06)}
[data-theme="light"]{--bg0:#f7f8fb;--bg1:#ffffff;--bg2:#f9fafb;--bg3:#eef1f6;--bg4:#e1e6ef;--brd:#d6dce8;--brd2:#bfc8d8;--t1:#0c1424;--t2:#3b4a64;--t3:#7f8da4;--t4:#bac4d4;--accent:#2563eb;--accent2:#5b21b6;--accent-s:#2563eb06;--red:#dc2626;--amber:#d97706;--green:#059669;--blue:#2563eb;--purple:#7c3aed;--reds:#dc262606;--ambers:#d9770606;--greens:#05966906;--blues:#2563eb06;--shadow:0 1px 3px rgba(0,0,0,.05),0 4px 16px rgba(0,0,0,.03);--glow:none}
body{background:var(--bg0);overflow-x:hidden;color:var(--t1);font-family:var(--fs);font-size:14px;line-height:1.5;min-height:100vh;transition:background .3s,color .3s;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
.shell{display:flex;flex-direction:column;min-height:100vh;position:relative}
.shell::before{content:'';position:fixed;top:0;left:0;right:0;height:300px;background:radial-gradient(ellipse at 20% 0%,rgba(91,154,255,.03) 0%,transparent 50%),radial-gradient(ellipse at 80% 0%,rgba(139,111,255,.02) 0%,transparent 50%);pointer-events:none;z-index:0}
.topbar{display:flex;align-items:center;gap:12px;padding:0 18px;height:52px;background:var(--bg1)ee;border-bottom:1px solid var(--brd);position:sticky;top:0;z-index:100;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
.topbar::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--accent)30,var(--purple)30,transparent);pointer-events:none}
.logo{font-weight:900;font-size:1rem;letter-spacing:-.5px;display:flex;align-items:center;gap:7px;flex-shrink:0}
.logo-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:.72rem;color:#fff;font-weight:900;box-shadow:0 2px 12px rgba(91,154,255,.25)}
.logo span{color:var(--accent)}
.tabs{display:flex;gap:1px;margin-left:16px;background:var(--bg3);border-radius:var(--r);padding:2px}
.tab{padding:4px 11px;border-radius:6px;cursor:pointer;font-size:.74rem;font-weight:500;color:var(--t3);transition:all .15s;border:none;background:none;font-family:var(--fs);white-space:nowrap}
.tab:hover{color:var(--t2)}
.tab.active{color:var(--accent);background:var(--bg1);box-shadow:var(--shadow),0 0 12px var(--accent-s)}
.topbar-right{margin-left:auto;display:flex;align-items:center;gap:6px}
.clock{font-family:var(--fm);font-size:.72rem;color:var(--t3);letter-spacing:.5px}
.demo-pill{font-size:.58rem;font-family:var(--fm);color:var(--amber);background:var(--ambers);padding:2px 7px;border-radius:20px;letter-spacing:.5px;border:1px solid rgba(237,160,51,.1);font-weight:600}
.theme-btn{width:30px;height:30px;border-radius:var(--r);border:1px solid var(--brd);background:var(--bg2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.82rem;transition:all .15s}
.theme-btn:hover{border-color:var(--accent);background:var(--accent-s)}
.refresh-select{height:30px;padding:0 4px;border-radius:var(--r);border:1px solid var(--brd);background:var(--bg2);color:var(--t2);font-size:.62rem;font-family:var(--fm);cursor:pointer;outline:none;transition:all .15s}
.refresh-select:hover{border-color:var(--accent)}
.refresh-select:focus{border-color:var(--accent)}
.refresh-btn{height:30px;padding:0 10px;border-radius:var(--r);border:1px solid var(--brd);background:var(--bg2);cursor:pointer;font-size:.72rem;font-family:var(--fs);color:var(--t2);transition:all .15s}
.refresh-btn:hover{border-color:var(--accent);color:var(--accent)}
.live-dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);animation:pulse 2s ease-in-out infinite;flex-shrink:0}
@keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 8px var(--green)}50%{opacity:.4;box-shadow:0 0 2px var(--green)}}
.main{flex:1;padding:14px 16px 16px;max-width:1480px;margin:0 auto;width:100%}
.tv-wall{position:fixed;inset:0;background:var(--bg0);z-index:999;display:flex;flex-direction:column;cursor:pointer}
.tv-slide{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;animation:tvFade .6s ease}
@keyframes tvFade{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}
.tv-title{font-size:1.1rem;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:var(--t3);margin-bottom:30px}
.tv-kpi-row{display:flex;gap:40px;justify-content:center;margin-top:30px}
.tv-kpi{text-align:center}
.tv-kpi-val{font-size:3rem;font-weight:900;font-family:var(--fm);letter-spacing:-3px;line-height:1}
.tv-kpi-label{font-size:.6rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--t3);margin-top:4px}
.tv-posture-row{transform:scale(1.5);margin:20px 0 40px}
.tv-alert-list{width:100%;max-width:800px}
.tv-alert{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--brd);font-size:.85rem}
.tv-alert-sev{width:4px;height:20px;border-radius:2px;flex-shrink:0}
.tv-alert-title{flex:1;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tv-footer{display:flex;align-items:center;justify-content:center;gap:16px;padding:16px;border-top:1px solid var(--brd);font-size:.7rem;color:var(--t3)}
.tv-clock{font-family:var(--fm);font-size:1rem;font-weight:700;color:var(--t1);letter-spacing:1px}
.tv-exit{font-size:.6rem;color:var(--t4)}
.tv-indicators{display:flex;gap:6px;justify-content:center;padding:12px}
.tv-ind{width:8px;height:8px;border-radius:50%;background:var(--bg3);transition:all .3s}
.tv-ind.active{background:var(--accent);box-shadow:0 0 8px var(--accent)}
.sla-bar{background:linear-gradient(135deg,var(--bg1),var(--bg2));border:1px solid var(--brd);border-radius:12px;padding:8px 12px;margin-bottom:0}
.sla-hd{display:flex;justify-content:space-between;align-items:center;font-size:.68rem;font-weight:700;margin-bottom:6px}
.sla-items{display:flex;gap:6px;flex-wrap:wrap}
.sla-item{flex:1;min-width:120px;padding:6px 8px;border-radius:8px;background:var(--bg3);border:1px solid var(--brd)}
.sla-item.sla-breached{border-color:var(--red);background:var(--reds)}
.sla-item.sla-urgent{border-color:var(--amber);background:var(--ambers)}
.sla-item-title{font-size:.62rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sla-item-time{font-size:.7rem;font-weight:800;font-family:var(--fm);margin-top:2px}
.quiet-bar{display:flex;align-items:center;gap:0;background:linear-gradient(135deg,var(--bg1),var(--bg2));border:1px solid var(--brd);border-radius:12px;padding:8px 14px}
.quiet-item{flex:1;text-align:center}
.quiet-label{font-size:.48rem;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;font-weight:700}
.quiet-val{font-size:1rem;font-weight:900;font-family:var(--fm);letter-spacing:-1px;margin-top:2px}
.quiet-sep{width:1px;height:28px;background:var(--brd);margin:0 4px}
.risk-asset{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:8px;transition:all .15s}
.risk-asset:hover{background:var(--accent-s)}
.risk-rank{font-size:.9rem;font-weight:900;font-family:var(--fm);min-width:20px;text-align:center}
.cop-tab{flex:1;padding:8px;border:none;background:none;color:var(--t3);font-size:.68rem;font-weight:600;font-family:var(--fs);cursor:pointer;transition:all .15s;border-bottom:2px solid transparent}
.cop-tab.active{color:var(--accent);border-bottom-color:var(--accent)}
.cop-tab:hover{color:var(--t1)}
.runbook{padding:4px 0}
.rb-step{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--brd)}
.rb-step:last-child{border-bottom:none}
.rb-num{width:24px;height:24px;border-radius:50%;background:var(--accent-s);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:800;font-family:var(--fm);flex-shrink:0;border:1px solid color-mix(in srgb,var(--accent) 20%,transparent)}
.rb-title{font-size:.78rem;font-weight:700;color:var(--t1)}
.rb-detail{font-size:.7rem;color:var(--t2);margin-top:2px;line-height:1.5}
.rb-cmd{font-family:var(--fm);font-size:.62rem;color:var(--accent);background:var(--bg3);padding:4px 8px;border-radius:4px;margin-top:4px;border:1px solid var(--brd)}
.acct-wrap{position:relative}
.acct-menu{position:absolute;top:38px;right:0;width:220px;background:linear-gradient(145deg,var(--bg1),var(--bg2));border:1px solid var(--brd2);border-radius:12px;padding:12px;box-shadow:0 12px 40px rgba(0,0,0,.4);z-index:200;animation:critSlide .2s ease}
.acct-hd{font-size:.78rem;font-weight:700;color:var(--t1)}
.acct-org{font-size:.65rem;color:var(--t3);margin-bottom:4px}
.acct-plan{font-size:.68rem;color:var(--accent);margin-bottom:2px}
.acct-plan strong{color:var(--t1)}
.acct-trial{font-size:.6rem;color:var(--amber);margin-bottom:6px}
.acct-sep{height:1px;background:var(--brd);margin:8px 0}
.acct-btn{display:block;width:100%;text-align:left;padding:6px 8px;border:none;background:none;color:var(--t2);font-size:.7rem;font-family:var(--fs);cursor:pointer;border-radius:6px;transition:all .15s}
.acct-btn:hover{background:var(--accent-s);color:var(--accent)}
.war-room{display:grid;grid-template-columns:1fr 300px;gap:12px;margin-bottom:12px}
.wr-left{display:flex;flex-direction:column;gap:10px}
.wr-right{display:flex;flex-direction:column}

.posture-card{background:linear-gradient(135deg,var(--bg1) 0%,var(--bg2) 50%,var(--bg1) 100%);border:1px solid var(--brd);border-radius:16px;padding:20px;display:flex;gap:20px;align-items:center;position:relative;overflow:hidden}
.posture-card::before{content:'';position:absolute;top:-50%;right:-50%;width:100%;height:100%;background:radial-gradient(circle,var(--accent)05 0%,transparent 70%);pointer-events:none}
.posture-gauge{position:relative;flex-shrink:0;width:140px;height:120px}
.posture-score{position:absolute;top:48px;left:50%;transform:translateX(-50%);font-size:2.4rem;font-weight:900;font-family:var(--fm);letter-spacing:-3px;text-shadow:0 0 30px currentColor}
.posture-grade{position:absolute;top:85px;left:50%;transform:translateX(-50%);font-size:.7rem;font-weight:800;letter-spacing:1px}
.posture-label{position:absolute;top:102px;left:50%;transform:translateX(-50%);font-size:.48rem;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:1px;white-space:nowrap}
.posture-factors{flex:1;min-width:0}
.posture-factor{display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid var(--brd)}
.posture-factor:last-child{border-bottom:none}
.alert-stream{background:linear-gradient(180deg,var(--bg1),var(--bg2));border:1px solid var(--brd);border-radius:16px;display:flex;flex-direction:column;height:100%;min-height:300px;position:relative;overflow:hidden}
.alert-stream::before{content:'';position:absolute;top:0;left:0;right:0;height:40px;background:linear-gradient(180deg,rgba(255,68,102,.03),transparent);pointer-events:none;z-index:1}
.stream-hd{padding:10px 12px;border-bottom:1px solid var(--brd);display:flex;justify-content:space-between;align-items:center;font-size:.68rem;font-weight:700;color:var(--t1);text-transform:uppercase;letter-spacing:.5px}
.stream-dot{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);animation:pulse 2s ease-in-out infinite}
.stream-body{flex:1;overflow-y:auto;padding:4px}
.stream-body::-webkit-scrollbar{width:2px}
.stream-body::-webkit-scrollbar-thumb{background:var(--brd2);border-radius:2px}
.stream-item{display:flex;gap:8px;padding:8px 10px;border-radius:8px;align-items:flex-start;margin-bottom:2px;transition:all .2s ease}
.stream-item:hover{background:var(--reds);transform:translateX(3px)}
.stream-sev{width:3px;height:24px;border-radius:2px;flex-shrink:0;margin-top:2px}
.quick-actions{display:flex;gap:6px;flex-wrap:wrap}
.qa-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1px solid var(--brd);background:linear-gradient(135deg,var(--bg1),var(--bg2));color:var(--t2);font-size:.68rem;font-family:var(--fs);font-weight:600;cursor:pointer;transition:all .25s ease;position:relative;overflow:hidden}
.qa-btn::before{content:'';position:absolute;inset:0;background:var(--qa-c,var(--accent));opacity:0;transition:opacity .25s}
.qa-btn:hover{border-color:var(--qa-c,var(--accent));color:#fff;transform:translateY(-2px);box-shadow:0 6px 20px color-mix(in srgb,var(--qa-c,var(--accent)) 30%,transparent)}
.qa-btn:hover::before{opacity:.15}
.qa-btn:active{transform:translateY(0)}
.qa-icon{font-size:.82rem}
.qa-label{white-space:nowrap}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:7px;margin-bottom:10px}
.kpi{background:linear-gradient(145deg,var(--bg1),var(--bg2));border:1px solid var(--brd);border-radius:14px;padding:16px 18px;position:relative;overflow:hidden;transition:all .3s cubic-bezier(.4,0,.2,1)}
.kpi::after{content:'';position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle at top right,var(--accent)06,transparent 70%);pointer-events:none}
.kpi:hover{border-color:color-mix(in srgb,var(--accent) 40%,transparent);box-shadow:0 8px 30px rgba(0,0,0,.2),0 0 0 1px color-mix(in srgb,var(--accent) 15%,transparent);transform:translateY(-2px)}
.kpi-top{display:flex;justify-content:space-between;align-items:flex-start}
.kpi-label{font-size:.58rem;color:var(--t3);text-transform:uppercase;letter-spacing:.8px;font-weight:700}
.kpi-val{font-size:1.7rem;font-weight:900;font-family:var(--fm);letter-spacing:-2px;margin-top:4px;line-height:1;background:linear-gradient(135deg,var(--t1),var(--t2));-webkit-background-clip:text;background-clip:text}
.kpi-unit{font-size:.65rem;color:var(--t3);font-weight:500}
.kpi-sub{font-size:.64rem;color:var(--t3);margin-top:5px}
.kpi-trend{font-size:.6rem;font-weight:700;padding:1px 5px;border-radius:3px}
.kpi-trend.good{color:var(--green);background:var(--greens)}
.kpi-trend.bad{color:var(--red);background:var(--reds)}
.kpi-trend.warn{color:var(--amber);background:var(--ambers)}
.kpi-spark{position:absolute;bottom:0;right:0;opacity:.4}
.hero-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}
.hero-panel{min-height:0}
.panel{background:linear-gradient(180deg,var(--bg1),var(--bg2));border:1px solid var(--brd);border-radius:14px;margin-bottom:10px;overflow:hidden;transition:all .3s ease}
.panel:hover{border-color:var(--brd2);box-shadow:0 4px 20px rgba(0,0,0,.15)}
.panel-hd{padding:9px 14px;border-bottom:1px solid var(--brd);display:flex;justify-content:space-between;align-items:center}
.panel-hd h3{font-size:.76rem;font-weight:700;display:flex;align-items:center;gap:5px}
.panel-hd .count{font-size:.62rem;color:var(--t3);font-family:var(--fm);background:var(--bg3);padding:1px 6px;border-radius:10px}
.tbl{width:100%;border-collapse:collapse}
.tbl th{text-align:left;padding:5px 10px;font-size:.56rem;color:var(--t3);text-transform:uppercase;letter-spacing:.7px;font-weight:700;border-bottom:1px solid var(--brd);background:var(--bg2)}
.tbl td{padding:6px 10px;font-size:.76rem;border-bottom:1px solid var(--brd)}
.tbl tr:hover td{background:var(--bg2)}
.tbl tr:last-child td{border-bottom:none}
.tbl-wrap{max-height:400px;overflow-y:auto}
.tbl-wrap::-webkit-scrollbar{width:3px}
.tbl-wrap::-webkit-scrollbar-thumb{background:var(--brd2);border-radius:3px}
.sev{display:inline-block;padding:1px 6px;border-radius:4px;font-size:.56rem;font-weight:700;text-transform:uppercase;letter-spacing:.3px}
.sev-critical{background:var(--reds);color:var(--red);border:1px solid rgba(255,68,102,.15);text-shadow:0 0 8px rgba(255,68,102,.3)}
.sev-high{background:rgba(249,115,22,.08);color:#f97316;border:1px solid rgba(249,115,22,.12);text-shadow:0 0 8px rgba(249,115,22,.25)}
.sev-medium{background:var(--ambers);color:var(--amber);border:1px solid rgba(237,160,51,.08)}
.sev-low{background:var(--blues);color:var(--blue);border:1px solid rgba(79,143,255,.08)}
.src{display:inline-flex;align-items:center;gap:3px;padding:1px 6px;border-radius:4px;font-size:.56rem;font-family:var(--fm);font-weight:600;letter-spacing:.2px;background:var(--bg3);color:var(--t2);border:1px solid var(--brd)}
.src.defender{background:#4f8fff08;color:#60a5fa;border-color:#4f8fff15}
.src.taegis{background:#a07cff08;color:#c4b5fd;border-color:#a07cff15}
.src.tenable{background:#2dd4a008;color:#5eead4;border-color:#2dd4a015}
.src.zscaler{background:#eda03308;color:#fcd34d;border-color:#eda03315}
.src.crowdstrike{background:#ef444408;color:#fca5a5;border-color:#ef444415}
.src.sentinelone{background:#a855f708;color:#d8b4fe;border-color:#a855f715}
.src.darktrace{background:#f59e0b08;color:#fde68a;border-color:#f59e0b15}
.src.recordedfuture{background:#f8717108;color:#fecaca;border-color:#f8717115}
.status{display:inline-block;padding:1px 6px;border-radius:4px;font-size:.56rem;font-weight:700}
.status-new{background:var(--reds);color:var(--red)}
.status-investigating{background:var(--ambers);color:var(--amber)}
.status-resolved{background:var(--greens);color:var(--green)}
.mitre{font-family:var(--fm);font-size:.58rem;color:var(--accent);background:var(--accent-s);padding:1px 5px;border-radius:4px;border:1px solid rgba(79,143,255,.06)}
.ts{font-family:var(--fm);font-size:.62rem;color:var(--t3);white-space:nowrap}
.mono{font-family:var(--fm)}
.muted{color:var(--t3)}
.device{font-family:var(--fm);font-size:.68rem}
.g2r{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
.g23{display:grid;grid-template-columns:2fr 1fr;gap:8px;margin-bottom:8px}
.bar-wrap{display:flex;align-items:center;gap:6px}
.bar-track{flex:1;height:5px;background:var(--bg3);border-radius:3px;overflow:hidden}
.bar-fill{height:100%;border-radius:3px;transition:width .6s cubic-bezier(.4,0,.2,1);background:linear-gradient(90deg,var(--accent),var(--accent2))!important}
.filter-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.pills{display:flex;gap:2px;background:var(--bg2);padding:2px;border-radius:var(--r);flex-wrap:wrap}
.pill{padding:3px 9px;border-radius:5px;cursor:pointer;font-size:.66rem;font-weight:500;color:var(--t3);border:none;background:none;font-family:var(--fs);transition:all .15s;white-space:nowrap}
.pill:hover{color:var(--t2)}
.pill.on{color:var(--t1);background:var(--bg1);box-shadow:var(--shadow)}
.tl-item{display:flex;gap:8px;padding:6px 0;position:relative}
.tl-item:not(:last-child)::before{content:'';position:absolute;left:12px;top:28px;bottom:0;width:1px;background:var(--brd)}
.tl-icon{width:24px;height:24px;border-radius:50%;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:.62rem;flex-shrink:0;border:1px solid var(--brd);z-index:1}
.tl-body{flex:1;min-width:0}
.tl-title{font-size:.74rem;font-weight:500;line-height:1.3}
.tl-meta{font-size:.58rem;color:var(--t3);display:flex;gap:5px;align-items:center;margin-top:1px}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block;margin-right:4px}
.dot-on{background:var(--green);box-shadow:0 0 6px var(--green)}
.dot-off{background:var(--t4)}
.loading{display:flex;align-items:center;justify-content:center;gap:8px;padding:60px;color:var(--t3);font-size:.82rem}
.spin{width:18px;height:18px;border:2px solid var(--brd);border-top-color:var(--accent);border-radius:50%;animation:spin .6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes crit-flash{0%,100%{border-color:var(--brd);box-shadow:none}50%{border-color:var(--red);box-shadow:0 0 30px rgba(255,68,102,.15)}}
.crit-flash .topbar{animation:topbar-flash 2s ease infinite}
.crit-flash .kpi:first-child{animation:crit-flash 2s ease infinite}
@keyframes topbar-flash{0%,100%{border-bottom-color:var(--brd)}50%{border-bottom-color:var(--red)}}
/* Tool chips */
.tool-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;font-size:.62rem;font-weight:600;border:1px solid;background:var(--bg2);font-family:var(--fm);transition:all .2s}
.tool-chip:hover{transform:scale(1.05);box-shadow:0 0 12px currentColor}
/* Tool grid */
.tool-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px}
.tool-card{background:linear-gradient(135deg,var(--bg1),var(--bg2));border:1px solid var(--brd);border-radius:var(--r2);padding:14px;transition:all .25s ease;position:relative}
.tool-card:hover{border-color:var(--brd2);box-shadow:var(--glow);transform:translateY(-1px)}
.tool-card.enabled{border-left:3px solid var(--tc,var(--accent));box-shadow:inset 0 0 20px var(--tc,var(--accent))08}
.tc-top{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.tc-icon{font-size:1.3rem}
.tc-info{flex:1;min-width:0}
.tc-name{font-size:.82rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tc-cat{font-size:.62rem;color:var(--t3)}
.tc-desc{font-size:.7rem;color:var(--t2);margin-bottom:10px;line-height:1.4}
.tc-footer{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.tc-status{font-size:.65rem;display:flex;align-items:center;gap:2px;margin-right:auto}
.tc-btn{padding:4px 10px;border-radius:5px;font-size:.68rem;font-weight:600;cursor:pointer;border:1px solid var(--brd);background:var(--bg2);color:var(--t2);font-family:var(--fs);transition:all .15s}
.tc-btn:hover{border-color:var(--brd2);color:var(--t1)}
.tc-btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent2));border-color:transparent;color:#fff;box-shadow:0 2px 8px rgba(91,154,255,.25)}
.tc-btn-danger:hover{background:rgba(255,68,102,.08);border-color:rgba(255,68,102,.3);color:var(--red)}
.tc-btn-primary:hover{opacity:.9;box-shadow:0 4px 16px rgba(91,154,255,.35);transform:translateY(-1px)}
.tc-btn-danger{color:var(--red)}
.tc-btn-danger:hover{background:var(--reds);border-color:var(--red)}
.kv-warn{font-size:.72rem;color:var(--amber);background:var(--ambers);border:1px solid rgba(237,160,51,.15);padding:6px 12px;border-radius:var(--r);line-height:1.5}
/* Toggle switch */
.toggle{position:relative;display:inline-block;width:34px;height:18px;flex-shrink:0}
.toggle input{display:none}
.toggle-slider{position:absolute;cursor:pointer;inset:0;background:var(--bg3);border-radius:18px;transition:.3s;border:1px solid var(--brd)}
.toggle-slider::before{content:'';position:absolute;height:12px;width:12px;left:2px;bottom:2px;background:var(--t3);border-radius:50%;transition:.3s}
.toggle input:checked+.toggle-slider{background:var(--greens);border-color:var(--green)}
.toggle input:checked+.toggle-slider::before{transform:translateX(16px);background:var(--green)}
/* Modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px}
.modal{background:linear-gradient(180deg,var(--bg1),var(--bg2));border:1px solid var(--brd2);border-radius:16px;width:100%;max-width:500px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.5),0 0 0 1px var(--brd)}
.modal-hd{display:flex;justify-content:space-between;align-items:flex-start;padding:16px;border-bottom:1px solid var(--brd)}
.modal-close{background:none;border:none;color:var(--t3);font-size:1rem;cursor:pointer;padding:4px}
.modal-close:hover{color:var(--t1)}
.modal-body{padding:16px;overflow-y:auto;flex:1}
.modal-ft{padding:12px 16px;border-top:1px solid var(--brd);display:flex;justify-content:flex-end;gap:6px}
.modal-docs{font-size:.68rem;color:var(--t2);background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:8px 10px;margin-bottom:12px;line-height:1.5}
.field{margin-bottom:10px}
.field-label{display:block;font-size:.72rem;font-weight:600;margin-bottom:3px}
.field-key{font-family:var(--fm);font-size:.6rem;color:var(--t3);font-weight:400}
.field-input{width:100%;padding:7px 10px;background:var(--bg2);border:1px solid var(--brd);border-radius:6px;color:var(--t1);font-size:.8rem;font-family:var(--fm);outline:none;transition:border-color .2s}
.field-input:focus{border-color:var(--accent)}
.field-input::placeholder{color:var(--t4)}
select.field-input{font-family:var(--fs)}
.modal-msg{font-size:.72rem;margin-top:8px;padding:6px 10px;border-radius:var(--r)}
.modal-msg.ok{color:var(--green);background:var(--greens)}
.modal-msg.err{color:var(--red);background:var(--reds)}
/* Mobile */
.mob-menu{display:none;background:none;border:none;color:var(--t1);font-size:1.2rem;cursor:pointer;padding:4px 8px}
.mob-nav{display:none;background:var(--bg1);border-bottom:1px solid var(--brd);padding:8px 16px;gap:4px;flex-wrap:wrap}
.mnav-btn{padding:8px 14px;border-radius:var(--r);border:1px solid var(--brd);background:var(--bg2);color:var(--t2);font-size:.8rem;font-family:var(--fs);cursor:pointer}
.mnav-btn.active{background:var(--accent-s);color:var(--accent);border-color:var(--accent)}
.desk-only{}
.mob-only{display:none!important}
.mob-menu{display:block}
@media(max-width:768px){
.desk-only{display:none!important}
.mob-only{display:flex!important}
.mob-menu{display:block!important}
.topbar{padding:0 10px;height:46px;gap:6px}
.topbar-right{gap:3px}
.topbar-right .theme-btn{width:28px;height:28px;font-size:.72rem}
.topbar-right .search-trigger{padding:4px 6px;font-size:.72rem}
.logo span{display:none}
.logo-icon{width:24px;height:24px;font-size:.6rem}
.mob-nav{display:flex!important;flex-wrap:wrap;gap:4px;padding:8px 10px;background:var(--bg1);border-bottom:1px solid var(--brd)}
.mnav-btn{flex:1;min-width:calc(33% - 4px);text-align:center;padding:8px 4px;font-size:.68rem}
.main{padding:8px 10px 16px}
.war-room{grid-template-columns:1fr!important;gap:8px}
.wr-right{max-height:250px}
.posture-card{flex-direction:column;padding:12px;gap:10px}
.posture-gauge{width:120px;height:100px}
.posture-gauge svg{width:120px;height:100px}
.posture-score{font-size:1.8rem;top:40px}
.posture-grade{font-size:.6rem;top:70px}
.posture-label{top:84px}
.posture-factors{width:100%}
.quiet-bar{flex-direction:row;padding:6px 10px}
.quiet-val{font-size:.82rem}
.quiet-label{font-size:.42rem}
.sla-bar{padding:6px 8px}
.sla-items{flex-direction:column;gap:4px}
.sla-item{min-width:auto}
.quick-actions{flex-wrap:wrap;gap:4px}
.qa-btn{padding:6px 8px;font-size:.62rem;flex:1;min-width:calc(50% - 4px);justify-content:center}
.qa-icon{font-size:.72rem}
.kpi-grid{grid-template-columns:repeat(2,1fr)!important;gap:6px}
.kpi{padding:10px 12px}
.kpi-val{font-size:1.3rem}
.hero-grid{grid-template-columns:1fr!important;gap:8px}
.g23{grid-template-columns:1fr!important}
.g2r{grid-template-columns:1fr!important}
.panel{margin-bottom:8px}
.panel-hd{padding:8px 10px}
.panel-hd h3{font-size:.76rem}
.filter-row{flex-direction:column;gap:6px}
.pills{flex-wrap:wrap;gap:3px}
.pill{padding:4px 8px;font-size:.6rem}
.tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.tbl{min-width:auto;font-size:.7rem}
.tbl th{padding:5px 4px;font-size:.5rem}
.tbl td{padding:5px 4px;font-size:.68rem}
.modal{max-width:calc(100vw - 20px)!important;max-height:85vh;margin:10px}
.modal-body{padding:12px;max-height:60vh;overflow-y:auto}
.modal-hd{padding:12px}
.guide-panel{width:100%!important;max-width:100%}
.drawer{width:100%!important;max-width:100%}
.cmd-palette{width:calc(100% - 24px);max-width:100%}
.tool-grid{grid-template-columns:1fr!important}
.acct-menu{right:-40px;width:200px}
.alert-stream{min-height:200px}
.stream-hd{padding:8px 10px;font-size:.62rem}
.stream-item{padding:6px 8px}
.crit-popup{max-width:calc(100vw - 32px);margin:16px}
.crit-popup-overlay{padding:16px;padding-top:60px}
.risk-asset{padding:4px 6px}
.cop-tab{font-size:.6rem;padding:6px}
.runbook .rb-step{padding:8px 0}
.rb-num{width:20px;height:20px;font-size:.6rem}
.tv-wall .tv-kpi-val{font-size:1.8rem}
.tv-wall .tv-kpi-row{gap:16px;flex-wrap:wrap}
.tv-wall .tv-title{font-size:.85rem}
.tv-slide{padding:20px}
.tv-posture-row{transform:scale(1)}
.tv-alert{font-size:.72rem;padding:6px 8px}
.tv-alert-list{max-height:calc(100vh - 200px);overflow-y:auto}
}
@media(max-width:380px){
.kpi-grid{grid-template-columns:1fr!important}
.qa-btn{min-width:100%}
.quiet-bar{flex-wrap:wrap}
.quiet-item{min-width:60px}
.mnav-btn{min-width:calc(50% - 4px)}
}
.g2r,.g23{grid-template-columns:1fr}
.tool-grid{grid-template-columns:1fr}

/* IOC Search */
.search-trigger{height:30px;padding:0 10px;border-radius:var(--r);border:1px solid var(--brd);background:var(--bg2);cursor:pointer;font-size:.72rem;font-family:var(--fs);color:var(--t2);display:flex;align-items:center;gap:4px;transition:all .15s}
.search-trigger:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-s)}
.ioc-result{padding:8px 10px;border:1px solid var(--brd);border-radius:var(--r);margin-bottom:6px;background:var(--bg2);transition:border-color .15s}
.ioc-result:hover{border-color:var(--brd2)}
/* Response Actions */
.action-dropdown{position:absolute;right:0;top:100%;margin-top:4px;background:var(--bg1);border:1px solid var(--brd);border-radius:var(--r2);box-shadow:0 8px 24px rgba(0,0,0,.3);z-index:50;min-width:220px;padding:4px}
.action-item{display:block;width:100%;text-align:left;padding:6px 10px;border:none;background:none;color:var(--t1);font-size:.72rem;font-family:var(--fs);cursor:pointer;border-radius:5px;transition:all .15s}
.action-item:hover{background:var(--bg2)}
.action-item:disabled{opacity:.5}
.action-result{padding:6px 8px;margin:4px;border-radius:5px;font-size:.68rem}
.action-result.ok{background:var(--greens);color:var(--green)}
.action-result.err{background:var(--reds);color:var(--red)}
/* Correlation */
.corr-group td{background:var(--accent-s)!important}
.ai-response{font-size:.8rem;color:var(--t1);line-height:1.6;white-space:pre-wrap}
.ai-response strong{color:var(--accent);font-weight:700}
.ai-response p{margin-bottom:6px}
/* User Guide */
.guide-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);z-index:200;display:flex;justify-content:flex-end}
.guide-panel{width:420px;max-width:90vw;background:var(--bg1);border-left:1px solid var(--brd);display:flex;flex-direction:column;animation:slideIn .2s ease}
@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
.guide-hd{display:flex;justify-content:space-between;align-items:flex-start;padding:16px;border-bottom:1px solid var(--brd)}
.guide-body{flex:1;overflow-y:auto;padding:16px}
.guide-section{margin-bottom:16px}
.guide-section h3{font-size:.82rem;font-weight:700;margin-bottom:6px;color:var(--t1)}
.guide-section ul{list-style:none;padding:0}
.guide-section li{font-size:.72rem;color:var(--t2);padding:3px 0;padding-left:12px;position:relative;line-height:1.5}
.guide-section li::before{content:'›';position:absolute;left:0;color:var(--accent);font-weight:700}
.guide-section p{font-size:.72rem;color:var(--t2);line-height:1.6}
.shortcut-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.shortcut-row{display:flex;align-items:center;gap:8px;font-size:.72rem;padding:3px 0}
.shortcut-row kbd{background:var(--bg3);border:1px solid var(--brd);padding:1px 6px;border-radius:4px;font-family:var(--fm);font-size:.65rem;color:var(--t1);min-width:20px;text-align:center}
.shortcut-row span{color:var(--t2)}
/* Command Palette */
.cmd-palette{width:480px;max-width:90vw;background:var(--bg1);border:1px solid var(--brd);border-radius:var(--r2);box-shadow:0 20px 60px rgba(0,0,0,.5);margin-top:80px;align-self:flex-start}
.cmd-input-wrap{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--brd)}
.cmd-input{flex:1;background:none;border:none;color:var(--t1);font-size:.88rem;font-family:var(--fs);outline:none}
.cmd-input::placeholder{color:var(--t4)}
.cmd-list{max-height:300px;overflow-y:auto;padding:4px}
.cmd-item{display:flex;align-items:center;gap:10px;width:100%;padding:8px 12px;border:none;background:none;color:var(--t1);font-size:.82rem;font-family:var(--fs);cursor:pointer;border-radius:6px;text-align:left;transition:all .1s}
.cmd-item:hover{background:var(--accent-s);color:var(--accent)}
.cmd-icon{font-size:1rem;width:24px;text-align:center}
/* Tab badges */
.tab-badge{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;border-radius:8px;background:var(--red);color:#fff;font-size:.55rem;font-weight:700;font-family:var(--fm);margin-left:4px;padding:0 4px}
/* Threat Ticker */

/* Device Drawer */
.drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);z-index:200;display:flex;justify-content:flex-end}
.drawer{width:400px;max-width:90vw;background:var(--bg1);border-left:1px solid var(--brd);display:flex;flex-direction:column;animation:slideIn .2s ease}
.device-alert-card{padding:10px;border:1px solid var(--brd);border-radius:var(--r);margin-bottom:6px;background:var(--bg2)}
.guide-btn{height:30px;padding:0 8px;border-radius:var(--r);border:1px solid var(--brd);background:var(--bg2);cursor:pointer;font-size:.82rem;display:flex;align-items:center;justify-content:center;transition:all .15s}
.guide-btn:hover{border-color:var(--accent);background:var(--accent-s)}
/* NL Query */
.nl-bar{margin-bottom:10px;position:relative}
.nl-input-wrap{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg1);border:1px solid var(--brd);border-radius:var(--r2);transition:border-color .2s}
.nl-input-wrap:focus-within{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-s)}
.nl-input{flex:1;background:none;border:none;color:var(--t1);font-size:.82rem;font-family:var(--fs);outline:none}
.nl-input::placeholder{color:var(--t4)}
.nl-results{position:absolute;top:100%;left:0;right:0;background:var(--bg1);border:1px solid var(--brd);border-radius:0 0 var(--r2) var(--r2);box-shadow:0 8px 24px rgba(0,0,0,.3);z-index:40;margin-top:-1px}
/* Collab */
.collab-bar{display:flex;align-items:center;gap:3px}
.analyst-avatar{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.52rem;font-weight:700;font-family:var(--fm);border:1.5px solid;cursor:default;transition:transform .15s}
.analyst-avatar:hover{transform:scale(1.2)}
.analyst-avatar.away{opacity:.4}
.pred-card{padding:8px 10px;border-left:3px solid;margin-bottom:6px;background:var(--bg2);border-radius:0 var(--r) var(--r) 0}
.crit-popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;z-index:300;padding-top:80px}
.crit-popup{background:linear-gradient(135deg,var(--bg1),var(--bg2));border:2px solid var(--red);border-radius:16px;padding:20px;max-width:440px;width:100%;box-shadow:0 0 60px rgba(255,68,102,.2),0 20px 60px rgba(0,0,0,.5);animation:critSlide .3s ease}
.crit-popup-pulse{position:absolute;inset:-2px;border-radius:16px;border:2px solid var(--red);animation:critPulseRing 2s ease infinite;pointer-events:none}
@keyframes critSlide{from{transform:translateY(-20px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes critPulseRing{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(255,68,102,.4)}50%{opacity:.6;box-shadow:0 0 0 12px rgba(255,68,102,0)}}
.clickable-row{transition:all .15s ease;cursor:pointer}
.clickable-row:hover{background:var(--accent-s)!important;box-shadow:inset 3px 0 0 var(--accent)}
.ti-card{padding:10px 12px;border-left:3px solid;margin-bottom:6px;background:var(--bg2);border-radius:0 var(--r) var(--r) 0;cursor:pointer;transition:all .15s}
.ti-card:hover{background:var(--bg3)}
/* Triage */
.triage-badge{display:inline-flex;flex-direction:column;align-items:center;padding:2px 5px;border-radius:4px;background:var(--bg3);border:1px solid var(--brd);min-width:32px}`;

export default function Dashboard(){return React.createElement(DashErrorBoundary,null,React.createElement(DashboardInner));}
