'use client';

const SEV_COLOR = { Critical:'#f0405e', High:'#f97316', Medium:'#f0a030', Low:'#4f8fff' };
const VERDICT_STYLE = {
  TP:      { color:'#f0405e', bg:'#f0405e12' },
  FP:      { color:'#22d49a', bg:'#22d49a12' },
  SUS:     { color:'#f0a030', bg:'#f0a03012' },
  Pending: { color:'#6b7a94', bg:'#6b7a9412' },
};
const SevBadge = ({ sev }) => (
  <span style={{ fontSize:'0.5rem', fontWeight:800, padding:'1px 5px', borderRadius:3,
    color:SEV_COLOR[sev]||'#6b7a94', background:`${SEV_COLOR[sev]||'#6b7a94'}18`,
    border:`1px solid ${SEV_COLOR[sev]||'#6b7a94'}30`, textTransform:'uppercase', letterSpacing:'0.5px' }}>
    {sev}
  </span>
);

// Relative time — what a SOC analyst actually wants to see
function relTime(rawTime, timeStr) {
  if (rawTime) {
    const ms = Date.now() - new Date(rawTime).getTime();
    if (ms < 0) return timeStr || 'just now';
    const m = Math.floor(ms/60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m/60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  }
  return timeStr || '—';
}

export default function AlertsTab({
  alerts, demoMode, automation, autColor, autLabel,
  fpAlerts, tpAlerts,
  alertSearch, setAlertSearch,
  alertSevFilter, setAlertSevFilter,
  alertSrcFilter, setAlertSrcFilter,
  alertSort, setAlertSort,
  alertPage, setAlertPage,
  alertTotalPages, alertPageClamped, alertsSorted, alertsFiltered, alertsPaged, ALERT_PAGE_SIZE,
  selectedAlerts, setSelectedAlerts,
  expandedAlerts, setExpandedAlerts,
  alertNotes, setAlertNotes,
  editingNote, setEditingNote,
  noteInput, setNoteInput,
  alertOverrides, setAlertOverrides,
  aiTriageCache,
  alertSnoozes, setAlertSnoozes,
  createdIncidents, setCreatedIncidents,
  setActiveTab,
  userTier,
}) {
  function toggleAlertExpand(id) {
    setExpandedAlerts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  // Generate AI auto-response timeline entries based on alert content
  function buildAiTimeline(alertList, incId) {
    const t = new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    const top = alertList[0];
    const isCrit = top && (top.severity==='Critical'||top.severity==='High');
    const device = (top&&top.device)||'Unknown';
    const mitre = (top&&top.mitre)||'';
    const entries = [{t, actor:'Analyst', action:'Incident created', detail:`${alertList.length} alert${alertList.length!==1?'s':''} grouped into ${incId}`}];
    if (isCrit) {
      entries.push({t, actor:'AI', action:'Cross-source correlation', detail:`Querying SIEM for related events on ${device}`, cmd:`index=* host="${device}" earliest=-4h | stats count by sourcetype, EventCode | where count > 5`});
    }
    if (mitre.startsWith('T1003')||mitre.startsWith('T1055')||mitre.startsWith('T1059')) {
      entries.push({t, actor:'AI', action:'Credential/execution hunt dispatched', detail:`Checking for ${mitre} activity on ${device}`, cmd:`Get-WinEvent -ComputerName ${device} -FilterHashtable @{LogName='Security';Id=4688,4624,4625} -MaxEvents 100 | Where-Object {$_.TimeCreated -gt (Get-Date).AddHours(-4)}`});
    }
    if (mitre.startsWith('T1190')) {
      entries.push({t, actor:'AI', action:'Vulnerability context retrieved', detail:`Cross-referencing Tenable for open CVEs on ${device}`, cmd:`curl -s "https://cloud.tenable.com/workbenches/vulnerabilities?filter.0.filter=hostname&filter.0.value=${device}" -H "X-ApiKeys: accessKey=<key>;secretKey=<key>"`});
    }
    if (mitre.startsWith('T1071')||mitre.startsWith('T1041')||mitre.startsWith('T1486')) {
      entries.push({t, actor:'AI', action:'Network isolation recommended', detail:`C2/exfil TTP detected — isolation pending analyst approval`, cmd:`CsFalcon.exe -policy isolate --host "${device}" --reason "Auto-recommend: ${mitre} detected by Watchtower AI — pending approval"`});
    }
    if (isCrit) {
      entries.push({t, actor:'AI', action:'Runbook generated', detail:'5-step response playbook attached to this incident', cmd:`python3 runbook_gen.py --incident ${incId} --mitre "${mitre}" --severity ${top?.severity||'High'} --device "${device}" --output runbook_${incId}.md`});
    }
    return entries;
  }

  // Device alert count — for hot-device indicator
  const deviceCounts = {};
  alerts.forEach(a => { if (a.device) deviceCounts[a.device] = (deviceCounts[a.device]||0) + 1; });
  const maxDeviceCount = Math.max(...Object.values(deviceCounts), 1);

  // Unacknowledged critical count
  const unackedCrits = alerts.filter(a => a.severity==='Critical' && !(alertOverrides[a.id]?.acknowledged) && !(a.acknowledged)).length;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>

      {/* Header strip */}
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Alerts</h2>
        <span style={{fontSize:'0.62rem',fontWeight:600,padding:'3px 10px',borderRadius:5,background:`${autColor}12`,color:autColor,border:`1px solid ${autColor}20`}}>
          {['⚡','✦','🤖'][automation]} {autLabel}
        </span>
        {unackedCrits > 0 && (
          <span style={{fontSize:'0.62rem',fontWeight:800,padding:'3px 10px',borderRadius:5,background:'#f0405e',color:'#fff',animation:'pulse 2s infinite'}}>
            {unackedCrits} unacked critical{unackedCrits!==1?'s':''}
          </span>
        )}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:'0.66rem',color:'var(--wt-muted)'}}>
            {alerts.length} total · {fpAlerts.length} auto-FP · {tpAlerts.length} escalated
          </span>
          <button onClick={()=>{
            const rows = [['ID','Title','Severity','Source','Device','User','IP','Time','Verdict','Confidence','MITRE','Notes']];
            alertsFiltered.forEach(a=>{
              const ov=alertOverrides[a.id]||{};
              rows.push([a.id,'"'+a.title+'"',a.severity,a.source,a.device||'',a.user||'',a.ip||'',a.time,ov.verdict||a.verdict||'',a.confidence||'',a.mitre||'','"'+(alertNotes[a.id]||'').replace(/"/g,"'")+'"']);
            });
            const csv=rows.map(r=>r.join(',')).join('\n');
            const blob=new Blob([csv],{type:'text/csv'});
            const url=URL.createObjectURL(blob);
            const el=document.createElement('a');el.href=url;el.download='watchtower-alerts-'+new Date().toISOString().split('T')[0]+'.csv';el.click();URL.revokeObjectURL(url);
          }} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
        <input value={alertSearch} onChange={e=>{setAlertSearch(e.target.value);setAlertPage(0);}}
          placeholder="Search alerts…"
          style={{padding:'6px 10px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:'var(--wt-text)',fontSize:'0.74rem',fontFamily:'Inter,sans-serif',outline:'none',flex:'1 1 130px',minWidth:100}}/>
        <select value={alertSevFilter} onChange={e=>{setAlertSevFilter(e.target.value);setAlertPage(0);}}
          style={{padding:'6px 8px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:'var(--wt-text)',fontSize:'0.72rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
          <option value='all'>All severities</option>
          <option value='Critical'>🔴 Critical</option>
          <option value='High'>🟠 High</option>
          <option value='Medium'>🟡 Medium</option>
          <option value='Low'>🔵 Low</option>
        </select>
        <select value={alertSrcFilter} onChange={e=>{setAlertSrcFilter(e.target.value);setAlertPage(0);}}
          style={{padding:'6px 8px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:'var(--wt-text)',fontSize:'0.72rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
          <option value='all'>All sources</option>
          {[...new Set(alerts.map(a=>a.source))].sort().map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={alertSort} onChange={e=>setAlertSort(e.target.value)}
          style={{padding:'6px 8px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:'var(--wt-text)',fontSize:'0.72rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
          <option value='time-desc'>Newest first</option>
          <option value='time-asc'>Oldest first</option>
          <option value='sev-desc'>Severity ↓</option>
          <option value='sev-asc'>Severity ↑</option>
          <option value='src-asc'>Source A–Z</option>
        </select>
        {(alertSearch||alertSevFilter!=='all'||alertSrcFilter!=='all') && (
          <button onClick={()=>{setAlertSearch('');setAlertSevFilter('all');setAlertSrcFilter('all');setAlertPage(0);}}
            style={{padding:'5px 10px',borderRadius:6,border:'1px solid var(--wt-border)',background:'none',color:'var(--wt-muted)',fontSize:'0.68rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            Clear ×
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedAlerts.size > 0 && (
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'#4f8fff10',border:'1px solid #4f8fff25',borderRadius:8,flexWrap:'wrap'}}>
          <span style={{fontSize:'0.76rem',fontWeight:700,color:'#4f8fff'}}>{selectedAlerts.size} selected</span>
          <button onClick={()=>{setAlertOverrides(prev=>{const n={...prev};[...selectedAlerts].forEach(id=>{n[id]={...(n[id]||{}),verdict:'FP',confidence:99}});return n;});setSelectedAlerts(new Set());}}
            style={{padding:'4px 12px',borderRadius:6,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            Mark FP
          </button>
          <button onClick={()=>{setAlertOverrides(prev=>{const n={...prev};[...selectedAlerts].forEach(id=>{n[id]={...(n[id]||{}),verdict:'TP',acknowledged:true}});return n;});setSelectedAlerts(new Set());}}
            style={{padding:'4px 12px',borderRadius:6,border:'1px solid #f0405e30',background:'#f0405e10',color:'#f0405e',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            Mark TP
          </button>
          <button onClick={()=>{setAlertOverrides(prev=>{const n={...prev};[...selectedAlerts].forEach(id=>{n[id]={...(n[id]||{}),acknowledged:true}});return n;});setSelectedAlerts(new Set());}}
            style={{padding:'4px 12px',borderRadius:6,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            Acknowledge
          </button>
          <button onClick={()=>{
            const sel=alerts.filter(a=>selectedAlerts.has(a.id));
            const sevOrder={Critical:0,High:1,Medium:2,Low:3};
            const top=sel.sort((a,b)=>(sevOrder[a.severity]||4)-(sevOrder[b.severity]||4))[0];
            const incId='INC-'+String(Date.now()).slice(-4);
            const inc={id:incId,title:'Incident — '+(top&&top.title||'Multiple alerts'),severity:top&&top.severity||'High',status:'Active',created:new Date().toLocaleString(),updated:new Date().toLocaleString(),alertCount:sel.length,devices:[...new Set(sel.map(a=>a.device).filter(Boolean))],mitreTactics:[...new Set(sel.map(a=>a.mitre).filter(Boolean))],aiSummary:'Incident from '+sel.length+' alerts: '+sel.map(a=>a.title).join('; ').slice(0,120),alerts:sel.map(a=>a.id),timeline:buildAiTimeline(sel,incId)};
            setCreatedIncidents(prev=>[inc,...prev]);setSelectedAlerts(new Set());setActiveTab('incidents');
          }} style={{padding:'4px 12px',borderRadius:6,border:'1px solid #8b6fff30',background:'#8b6fff10',color:'#8b6fff',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            Create Incident
          </button>
          {setAlertSnoozes && <button onClick={()=>{const until=Date.now()+(2*60*60*1000);setAlertSnoozes(prev=>{const n={...prev};[...selectedAlerts].forEach(id=>{n[id]=until;});return n;});setSelectedAlerts(new Set());}}
            style={{padding:'4px 12px',borderRadius:6,border:'1px solid #f0a03030',background:'#f0a03010',color:'#f0a030',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            Snooze 2h
          </button>}
          <button onClick={()=>setSelectedAlerts(new Set())}
            style={{marginLeft:'auto',padding:'4px 10px',borderRadius:6,border:'1px solid var(--wt-border)',background:'none',color:'var(--wt-muted)',fontSize:'0.68rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            Deselect all
          </button>
        </div>
      )}

      {/* Empty state */}
      {alertsFiltered.length === 0 && (
        <div style={{padding:'48px 24px',textAlign:'center',color:'var(--wt-muted)'}}>
          {alerts.length > 0 ? (
            <div style={{fontSize:'0.84rem'}}>No alerts match your filters.{' '}
              <button onClick={()=>{setAlertSearch('');setAlertSevFilter('all');setAlertSrcFilter('all');}}
                style={{color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:'0.84rem',textDecoration:'underline'}}>Clear filters</button>
            </div>
          ) : demoMode ? (
            <div style={{fontSize:'0.84rem'}}>No demo alerts loaded.</div>
          ) : (
            <div>
              <div style={{fontSize:'2.2rem',marginBottom:10}}>✓</div>
              <div style={{fontSize:'0.9rem',fontWeight:700,color:'var(--wt-text)',marginBottom:6}}>No alerts yet</div>
              <div style={{fontSize:'0.78rem',lineHeight:1.7,maxWidth:280,margin:'0 auto'}}>
                Watchtower syncs every 60 seconds. Connect an integration in the{' '}
                <button onClick={()=>setActiveTab&&setActiveTab('tools')}
                  style={{color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:'0.78rem',textDecoration:'underline'}}>Tools tab</button>.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alert rows */}
      {alertsPaged.map(alert => {
        const ov = alertOverrides[alert.id] || {};
        const effectiveVerdict = ov.verdict || alert.verdict;
        const vStyle = VERDICT_STYLE[effectiveVerdict] || VERDICT_STYLE.Pending;
        const expanded = expandedAlerts.has(alert.id);
        const aiText = (!demoMode && aiTriageCache[alert.id]?.result?.reasoning) || '';
        const aiVerdict = aiText.match(/True Positive|False Positive|Suspicious/i)?.[0] || '';
        const aiConf = aiText.match(/\d+%/)?.[0] || '';
        const aiVC = aiVerdict.toLowerCase().includes('true')?'#f0405e':aiVerdict.toLowerCase().includes('false')?'#22d49a':'#f0a030';
        const isSelected = selectedAlerts.has(alert.id);
        const hasNote = !!alertNotes[alert.id];
        const cached = aiTriageCache[alert.id];
        const isAcknowledged = !!(ov.acknowledged || alert.acknowledged);
        const isSnoozed = alertSnoozes && alertSnoozes[alert.id] && alertSnoozes[alert.id] > Date.now();
        const deviceAlertCount = deviceCounts[alert.device] || 0;
        const isHotDevice = deviceAlertCount >= 3;
        const ageStr = relTime(alert.rawTime, alert.time);
        const isFresh = alert.rawTime && (Date.now() - new Date(alert.rawTime).getTime()) < 15*60*1000;
        const isStale = alert.rawTime && (Date.now() - new Date(alert.rawTime).getTime()) > 4*60*60*1000;
        // SLA breach indicator on alert card: Critical unacked >1h, High unacked >4h
        const alertAgeMs = alert.rawTime ? Date.now() - new Date(alert.rawTime).getTime() : 0;
        const alertSlaMs = alert.severity==='Critical' ? 3600000 : alert.severity==='High' ? 14400000 : 0;
        const isSlaBreach = !isAcknowledged && alertSlaMs > 0 && alertAgeMs > alertSlaMs && effectiveVerdict === 'Pending';

        return (
          <div key={alert.id} style={{padding:0,overflow:'hidden',background:'var(--wt-card)',
            border:`1px solid ${isSelected?'#4f8fff60':isSlaBreach?'#f0405e60':alert.severity==='Critical'&&!isAcknowledged?'#f0405e30':'var(--wt-border)'}`,
            borderRadius:10,opacity:isAcknowledged?0.65:isSnoozed?0.75:1,
            transition:'border-color .15s,opacity .15s'}}>

            {/* Collapsed row */}
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',cursor:'pointer'}} onClick={()=>toggleAlertExpand(alert.id)}>
              {/* Checkbox */}
              <div onClick={e=>{e.stopPropagation();setSelectedAlerts(prev=>{const n=new Set(prev);n.has(alert.id)?n.delete(alert.id):n.add(alert.id);return n;})}}
                style={{width:15,height:15,borderRadius:3,border:`1px solid ${isSelected?'#4f8fff':'var(--wt-border2)'}`,background:isSelected?'#4f8fff':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer'}}>
                {isSelected && <span style={{color:'#fff',fontSize:'0.5rem',fontWeight:900}}>✓</span>}
              </div>
              {/* Severity bar */}
              <div style={{width:3,height:32,borderRadius:2,background:SEV_COLOR[alert.severity]||'#6b7a94',flexShrink:0}}/>
              {/* Main content */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2,flexWrap:'wrap'}}>
                  <span style={{fontSize:'0.78rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                    textDecoration:isAcknowledged?'line-through':undefined,
                    color:isAcknowledged?'var(--wt-muted)':undefined,
                    maxWidth:'60vw'}}>{alert.title}</span>
                  {isFresh && <span style={{fontSize:'0.46rem',fontWeight:800,padding:'1px 4px',borderRadius:3,background:'#22d49a',color:'#fff',flexShrink:0}}>NEW</span>}
                  {isSlaBreach && <span style={{fontSize:'0.46rem',fontWeight:800,padding:'1px 4px',borderRadius:3,background:'#f0405e',color:'#fff',flexShrink:0}}>SLA BREACH</span>}
                  {isHotDevice && <span style={{fontSize:'0.46rem',fontWeight:800,padding:'1px 4px',borderRadius:3,background:'#f0405e20',color:'#f0405e',border:'1px solid #f0405e30',flexShrink:0}}>🔥 {deviceAlertCount}</span>}
                  {hasNote && <span style={{fontSize:'0.46rem',color:'#f0a030',background:'#f0a03012',border:'1px solid #f0a03025',padding:'1px 4px',borderRadius:3,flexShrink:0}}>note</span>}
                  {isAcknowledged && <span style={{fontSize:'0.46rem',color:'#22d49a',background:'#22d49a12',padding:'1px 4px',borderRadius:3,flexShrink:0,fontWeight:800}}>ACK</span>}
                  {isSnoozed && <span style={{fontSize:'0.46rem',color:'#8b6fff',padding:'1px 4px',borderRadius:3,background:'#8b6fff15',flexShrink:0}}>💤</span>}
                </div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
                  <SevBadge sev={alert.severity}/>
                  <span style={{fontSize:'0.52rem',fontWeight:700,padding:'1px 5px',borderRadius:3,background:'#4f8fff12',color:'#4f8fff',border:'1px solid #4f8fff20'}}>{alert.source}</span>
                  {alert.device && <span style={{fontSize:'0.52rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{alert.device}</span>}
                  <span style={{fontSize:'0.52rem',color:isFresh?'#22d49a':isStale?'var(--wt-dim)':'var(--wt-muted)',fontWeight:isFresh?700:400}}>{ageStr}</span>
                  {alert.mitre && <span style={{fontSize:'0.48rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{alert.mitre}</span>}
                </div>
              </div>
              {/* Right side: verdict + quick actions */}
              <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                {/* Quick FP/TP — no expand needed */}
                <div onClick={e=>e.stopPropagation()} style={{display:'flex',gap:3}}>
                  <button onClick={()=>setAlertOverrides(prev=>({...prev,[alert.id]:{...(prev[alert.id]||{}),verdict:'FP',confidence:99}}))}
                    style={{padding:'2px 7px',borderRadius:4,border:'1px solid #22d49a40',background:effectiveVerdict==='FP'?'#22d49a':'transparent',color:effectiveVerdict==='FP'?'#fff':'#22d49a',fontSize:'0.58rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',lineHeight:1.4}}>
                    FP
                  </button>
                  <button onClick={()=>setAlertOverrides(prev=>({...prev,[alert.id]:{...(prev[alert.id]||{}),verdict:'TP',acknowledged:true}}))}
                    style={{padding:'2px 7px',borderRadius:4,border:'1px solid #f0405e40',background:effectiveVerdict==='TP'?'#f0405e':'transparent',color:effectiveVerdict==='TP'?'#fff':'#f0405e',fontSize:'0.58rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',lineHeight:1.4}}>
                    TP
                  </button>
                </div>
                {aiVerdict && !demoMode && <span style={{fontSize:'0.5rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:`${aiVC}15`,color:aiVC}}>AI: {aiVerdict.split(' ')[0]}</span>}
                {alert.confidence && !aiVerdict && <span style={{fontSize:'0.5rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{alert.confidence}%</span>}
                <span style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>{expanded?'▲':'▼'}</span>
              </div>
            </div>

            {/* Expanded detail */}
            {expanded && (
              <div style={{padding:'0 12px 14px 40px',borderTop:'1px solid var(--wt-border)'}}>
                {/* Description if available */}
                {alert.description && (
                  <div style={{marginTop:10,fontSize:'0.72rem',color:'var(--wt-muted)',lineHeight:1.6,padding:'7px 10px',background:'var(--wt-card2)',borderRadius:7,borderLeft:'2px solid #4f8fff40'}}>
                    {alert.description}
                  </div>
                )}
                {/* Demo AI triage */}
                {demoMode && alert.aiReasoning && (
                  <div style={{marginTop:12}}>
                    <div style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>AI Triage</div>
                    <div style={{fontSize:'0.76rem',color:'var(--wt-secondary)',lineHeight:1.7,marginBottom:8}}>{alert.aiReasoning}</div>
                    <div style={{marginBottom:8,padding:'7px 10px',background:'rgba(79,143,255,0.05)',border:'1px solid #4f8fff20',borderRadius:7}}>
                      <div style={{fontSize:'0.58rem',fontWeight:700,color:'#4f8fff',marginBottom:5}}>✦ CORRELATED ACROSS SOURCES</div>
                      <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:5}}>
                        {[{src:alert.source||'EDR',c:'#f0405e'},{src:'Tenable Vuln Scan',c:'#00b3e3'},{src:'NCSC Threat Feed',c:'#22d49a'},{src:'ThreatFox IOCs',c:'#f0a030'}].map(({src,c})=>(
                          <span key={src} style={{fontSize:'0.56rem',padding:'1px 6px',borderRadius:3,background:`${c}12`,color:c,border:`1px solid ${c}25`,fontWeight:700}}>{src}</span>
                        ))}
                      </div>
                      <div style={{fontSize:'0.63rem',color:'var(--wt-muted)',lineHeight:1.55}}>
                        Verdict from <strong style={{color:'var(--wt-secondary)'}}>{alert.source}</strong> detection on <strong style={{color:'var(--wt-secondary)'}}>{alert.device||'this host'}</strong>, cross-referenced with Tenable CVE exposure, NCSC sector advisories, and ThreatFox IOCs. Confidence {alert.confidence||'N/A'}%.
                      </div>
                    </div>
                    {alert.evidenceChain?.length > 0 && (
                      <div style={{marginBottom:8}}>
                        <div style={{fontSize:'0.58rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:4}}>EVIDENCE CHAIN</div>
                        {(alert.evidenceChain||[]).map((e,i)=>(
                          <div key={i} style={{fontSize:'0.72rem',color:'var(--wt-secondary)',padding:'2px 0',display:'flex',gap:6}}>
                            <span style={{color:'#4f8fff',flexShrink:0}}>{i+1}.</span>{e}
                          </div>
                        ))}
                      </div>
                    )}
                    {alert.aiActions?.length > 0 && (
                      <div style={{marginBottom:8}}>
                        <div style={{fontSize:'0.58rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:4}}>ACTIONS TAKEN</div>
                        {(alert.aiActions||[]).map((a,i)=>(
                          <div key={i} style={{fontSize:'0.72rem',color:'#22d49a',display:'flex',gap:6}}><span>✓</span>{a}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Live AI triage - spinner */}
                {!demoMode && (cached === undefined || (cached && cached.loading)) && (
                  <div style={{padding:'10px 0',fontSize:'0.72rem',color:'var(--wt-muted)',display:'flex',alignItems:'center',gap:8}}>
                    <span style={{width:10,height:10,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}}/>
                    AI triage running…
                  </div>
                )}
                {/* Live AI triage - result */}
                {!demoMode && cached && cached.result && (
                  <div style={{marginTop:12,background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(34,201,146,0.03))',border:'1px solid #4f8fff20',borderRadius:10,overflow:'hidden'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderBottom:'1px solid #4f8fff15'}}>
                      <span style={{fontSize:'0.6rem',fontWeight:800,color:'#4f8fff',letterSpacing:'0.5px'}}>✦ AI TRIAGE</span>
                      {aiVerdict && <span style={{fontSize:'0.6rem',fontWeight:800,padding:'1px 8px',borderRadius:4,background:`${aiVC}18`,color:aiVC,border:`1px solid ${aiVC}30`}}>{aiVerdict}{aiConf?' · '+aiConf:''}</span>}
                      <div style={{display:'flex',gap:4,marginLeft:'auto'}}>
                        {[{src:'Taegis',c:'#f0405e'},{src:'Tenable',c:'#00b3e3'},{src:'Intel',c:'#22d49a'},{src:'IOCs',c:'#f0a030'}].map(({src,c})=>(
                          <span key={src} style={{fontSize:'0.5rem',padding:'1px 5px',borderRadius:3,background:`${c}12`,color:c,fontWeight:700}}>{src}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{padding:'10px 12px'}}>
                      {aiText.split('\n').filter(s=>s.trim()).map((line,i,arr)=>(
                        <div key={i} style={{fontSize:'0.72rem',color:'var(--wt-secondary)',lineHeight:1.7,marginBottom:i<arr.length-1?6:0}}>{line.trim()}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:12}}>
                  <button onClick={()=>setAlertOverrides(prev=>({...prev,[alert.id]:{...(prev[alert.id]||{}),verdict:'FP',confidence:99}}))}
                    style={{padding:'4px 12px',borderRadius:6,border:'1px solid #22d49a30',background:effectiveVerdict==='FP'?'#22d49a':'#22d49a10',color:effectiveVerdict==='FP'?'#fff':'#22d49a',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    {effectiveVerdict==='FP'?'✓ Marked FP':'Mark FP'}
                  </button>
                  <button onClick={()=>setAlertOverrides(prev=>({...prev,[alert.id]:{...(prev[alert.id]||{}),verdict:'TP',acknowledged:true}}))}
                    style={{padding:'4px 12px',borderRadius:6,border:'1px solid #f0405e30',background:effectiveVerdict==='TP'?'#f0405e':'#f0405e10',color:effectiveVerdict==='TP'?'#fff':'#f0405e',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    {effectiveVerdict==='TP'?'✓ Marked TP':'Mark TP'}
                  </button>
                  {setAlertSnoozes && <button onClick={()=>{
                    const dur=2*60*60*1000;
                    setAlertSnoozes(prev=>prev[alert.id]&&prev[alert.id]>Date.now()?{...prev,[alert.id]:undefined}:{...prev,[alert.id]:Date.now()+dur});
                  }} style={{padding:'4px 12px',borderRadius:6,border:'1px solid #8b6fff30',background:'#8b6fff10',color:'#8b6fff',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    {isSnoozed?'Unsnoozed 💤':'Snooze 2h'}
                  </button>}
                  <button onClick={()=>setAlertOverrides(prev=>({...prev,[alert.id]:{...(prev[alert.id]||{}),acknowledged:!isAcknowledged}}))}
                    style={{padding:'4px 12px',borderRadius:6,border:`1px solid ${isAcknowledged?'#22d49a50':'#4f8fff30'}`,background:isAcknowledged?'#22d49a15':'#4f8fff10',color:isAcknowledged?'#22d49a':'#4f8fff',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    {isAcknowledged?'✓ Acked':'Acknowledge'}
                  </button>
                  <button onClick={()=>{
                    const singleIncId='INC-'+String(Date.now()).slice(-4);
                    const inc={id:singleIncId,title:'Incident — '+alert.title,severity:alert.severity,status:'Active',created:new Date().toLocaleString(),updated:new Date().toLocaleString(),alertCount:1,devices:alert.device?[alert.device]:[],mitreTactics:alert.mitre?[alert.mitre]:[],aiSummary:'Incident from: '+alert.title,alerts:[alert.id],timeline:buildAiTimeline([alert],singleIncId)};
                    setCreatedIncidents(prev=>[inc,...prev]);setActiveTab('incidents');
                  }} style={{padding:'4px 12px',borderRadius:6,border:'1px solid #8b6fff30',background:'#8b6fff10',color:'#8b6fff',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    Create Case
                  </button>
                </div>

                {/* Analyst Notes */}
                <div style={{marginTop:12}}>
                  <div style={{fontSize:'0.58rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Analyst Notes</div>
                  {editingNote===alert.id ? (
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      <textarea value={noteInput} onChange={e=>setNoteInput(e.target.value)} rows={3}
                        placeholder="Add investigation notes, IOCs, findings…"
                        style={{width:'100%',padding:'8px 10px',background:'var(--wt-card2)',border:'1px solid #4f8fff40',borderRadius:7,color:'var(--wt-text)',fontSize:'0.76rem',fontFamily:'Inter,sans-serif',outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
                      <div style={{display:'flex',gap:6}}>
                        <button onClick={()=>{
                          if(noteInput.trim()){setAlertNotes(prev=>({...prev,[alert.id]:noteInput.trim()}));fetch('/api/alert-notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({alertId:alert.id,note:noteInput.trim()})}).catch(()=>{});}
                          else{const n={...alertNotes};delete n[alert.id];setAlertNotes(n);fetch('/api/alert-notes',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({alertId:alert.id})}).catch(()=>{});}
                          setEditingNote(null);setNoteInput('');
                        }} style={{padding:'4px 12px',borderRadius:6,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Save</button>
                        <button onClick={()=>{setEditingNote(null);setNoteInput('');}} style={{padding:'4px 10px',borderRadius:6,border:'1px solid var(--wt-border)',background:'none',color:'var(--wt-muted)',fontSize:'0.68rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Cancel</button>
                        {alertNotes[alert.id] && <button onClick={()=>{const n={...alertNotes};delete n[alert.id];setAlertNotes(n);setEditingNote(null);setNoteInput('');}} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #f0405e30',background:'none',color:'#f0405e',fontSize:'0.68rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Delete</button>}
                      </div>
                    </div>
                  ) : (
                    <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                      {alertNotes[alert.id] ? (
                        <div style={{flex:1,fontSize:'0.74rem',color:'var(--wt-secondary)',lineHeight:1.65,padding:'7px 10px',background:'#f0a03008',border:'1px solid #f0a03020',borderRadius:7,fontStyle:'italic'}}>
                          "{alertNotes[alert.id]}"
                        </div>
                      ) : (
                        <span style={{fontSize:'0.72rem',color:'var(--wt-dim)'}}>No notes yet</span>
                      )}
                      <button onClick={()=>{setEditingNote(alert.id);setNoteInput(alertNotes[alert.id]||'');}}
                        style={{padding:'3px 9px',borderRadius:5,border:'1px solid var(--wt-border2)',background:'none',color:'var(--wt-muted)',fontSize:'0.64rem',cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>
                        {alertNotes[alert.id]?'Edit':'+ Note'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Pagination */}
      {alertTotalPages > 1 && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 4px',marginTop:4}}>
          <span style={{fontSize:'0.7rem',color:'var(--wt-muted)'}}>
            {alertPageClamped*ALERT_PAGE_SIZE+1}–{Math.min((alertPageClamped+1)*ALERT_PAGE_SIZE,alertsSorted.length)} of {alertsSorted.length}
          </span>
          <div style={{display:'flex',gap:4}}>
            <button disabled={alertPageClamped===0} onClick={()=>setAlertPage(alertPageClamped-1)}
              style={{padding:'4px 12px',borderRadius:6,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:alertPageClamped===0?'var(--wt-dim)':'var(--wt-text)',fontSize:'0.72rem',cursor:alertPageClamped===0?'not-allowed':'pointer',fontFamily:'Inter,sans-serif'}}>
              Prev
            </button>
            {Array.from({length:Math.min(alertTotalPages,5)},(_,i)=>{
              const p=alertTotalPages<=5?i:Math.max(0,Math.min(alertPageClamped-2,alertTotalPages-5))+i;
              return <button key={p} onClick={()=>setAlertPage(p)}
                style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${p===alertPageClamped?'#4f8fff':'var(--wt-border2)'}`,background:p===alertPageClamped?'#4f8fff15':'var(--wt-card2)',color:p===alertPageClamped?'#4f8fff':'var(--wt-text)',fontSize:'0.72rem',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:p===alertPageClamped?700:400}}>{p+1}</button>;
            })}
            <button disabled={alertPageClamped>=alertTotalPages-1} onClick={()=>setAlertPage(alertPageClamped+1)}
              style={{padding:'4px 12px',borderRadius:6,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:alertPageClamped>=alertTotalPages-1?'var(--wt-dim)':'var(--wt-text)',fontSize:'0.72rem',cursor:alertPageClamped>=alertTotalPages-1?'not-allowed':'pointer',fontFamily:'Inter,sans-serif'}}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
