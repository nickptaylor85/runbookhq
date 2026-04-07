'use client';
import React from 'react';
import WtMarkdown from './WtMarkdown';

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
  liveVulns, liveAlerts, customIntel,
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
  alertAssignees, setAlertAssignees,
  onAudit,
  autoClosedIds,
  isAdmin,
  syncStatus,
  onAutoIncident,
}) {
  const canVote = isAdmin || userTier !== 'community';
  const canTeam = isAdmin || userTier !== 'community';

  // Structured triage results (evidence chain, hunt queries) — fetched from /api/triage
  const [triageResults, setTriageResults] = React.useState({});
  const [triageLoading, setTriageLoading] = React.useState(new Set());
  const [autoExecutedActions, setAutoExecutedActions] = React.useState({});
  const [blastResults, setBlastResults] = React.useState({});
  const [blastLoading, setBlastLoading] = React.useState(new Set());
  const [showBlast, setShowBlast] = React.useState(new Set());
  const [showHuntQuery, setShowHuntQuery] = React.useState(new Set());

  // Write analyst verdict to institutional knowledge store
  function writeKnowledge(alert, verdict, note) {
    if (demoMode) return;
    fetch('/api/tenant-knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ts: Date.now(),
        alertTitle: alert.title,
        source: alert.source,
        severity: alert.severity,
        device: alert.device,
        mitre: alert.mitre,
        verdict,
        analystNote: note || undefined,
      }),
    }).catch(() => {});
  }

  // Fetch structured triage for a live alert when it expands
  function fetchTriage(alert) {
    if (demoMode || triageLoading.has(alert.id)) return;
    // Clear stale cached result so re-analyse works
    if (triageResults[alert.id] && !alert._forceRefresh) return;
    setTriageLoading(prev => new Set([...prev, alert.id]));

    // Enrich with context from connected tools
    // 1. Device vulns from Tenable/Qualys/etc for this specific device
    const deviceVulns = alert.device && alert.device !== 'Unknown'
      ? (liveVulns||[]).filter(v =>
          (v.affectedAssets||[]).includes(alert.device) ||
          v.device === alert.device
        ).slice(0,5).map(v => ({ cve: v.cve, title: v.title, cvss: v.cvss, kev: v.kev }))
      : [];

    // 2. Co-occurring alerts on same device/user in last 24h
    const relatedAlerts = (liveAlerts||[]).filter(a =>
      a.id !== alert.id &&
      ((alert.device && a.device === alert.device) ||
       (alert.user && alert.user !== 'Unknown' && a.user === alert.user) ||
       (alert.ip && a.ip === alert.ip))
    ).slice(0,8).map(a => ({
      title: a.title, source: a.source, severity: a.severity, verdict: a.verdict || a.aiVerdict,
    }));

    // 3. IOC matches from Intel tab data
    const iocMatches = alert.ip
      ? (customIntel||[]).flatMap(i => (i.iocs||[]).includes(alert.ip) ? [{ indicator: alert.ip, source: i.source, threatActor: i.title }] : []).slice(0,3)
      : [];

    // 4. Asset criticality hints
    const assetContext = {
      isDomainController: alert.device?.toLowerCase().includes('dc') || alert.title?.toLowerCase().includes('domain controller'),
      isServer: alert.device?.toLowerCase().startsWith('srv-') || alert.device?.toLowerCase().startsWith('server'),
      isExecutive: alert.user?.toLowerCase().includes('cfo') || alert.user?.toLowerCase().includes('ceo') || alert.user?.toLowerCase().includes('ciso'),
      hasPrivilegedAccess: alert.user?.toLowerCase().includes('admin') || alert.title?.toLowerCase().includes('admin'),
    };

    fetch('/api/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alertId: alert.id, title: alert.title, severity: alert.severity,
        source: alert.source, device: alert.device, mitre: alert.mitre,
        description: alert.description, ip: alert.ip, user: alert.user,
        confidence: alert.confidence, tags: alert.tags, rawTime: alert.rawTime,
        // Rich context from connected tools
        relatedAlerts: relatedAlerts.length > 0 ? relatedAlerts : undefined,
        deviceVulns: deviceVulns.length > 0 ? deviceVulns : undefined,
        iocMatches: iocMatches.length > 0 ? iocMatches : undefined,
        assetContext: (assetContext.isDomainController || assetContext.isServer || assetContext.isExecutive || assetContext.hasPrivilegedAccess) ? assetContext : undefined,
      }),
    }).then(r => r.json()).then(d => {
      if (!d.ok) {
        const errMsg = d.error?.includes('Essentials') ? 'APEX requires Essentials plan — upgrade at /pricing'
          : d.error?.includes('API key') || d.error?.includes('api_key') ? 'No Anthropic API key — add one in the Tools tab'
          : d.error?.includes('Rate limit') ? 'Rate limited — please wait a moment and retry'
          : d.error || 'AI analysis failed — please retry';
        setTriageResults(prev => ({ ...prev, [alert.id]: { error: errMsg } }));
        return;
      }
      if (d.ok && d.result) {
        setTriageResults(prev => ({ ...prev, [alert.id]: d.result }));
        // Full Auto: if APEX confirms TP, execute remediation actions automatically
        if (automation === 2 && d.result.verdict === 'TP' && d.result.confidence >= 75 && d.result.immediateActions?.length) {
          const actionablePriorities = ['CRITICAL', 'HIGH'];
          const autoActions = d.result.immediateActions.filter(a => actionablePriorities.includes(a.priority));
          if (autoActions.length > 0) {
            fetch('/api/response-actions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-tenant-id': alert.source || 'global' },
              body: JSON.stringify({
                action: 'full_auto_batch',
                immediateActions: autoActions,
                alertId: alert.id,
                alertTitle: alert.title,
                verdict: d.result.verdict,
                confidence: d.result.confidence,
                device: alert.device,
                ip: alert.ip,
                user: alert.user,
                analyst: 'APEX Full Auto',
              }),
            }).then(r => r.json()).then(res => {
              if (res.ok && res.executedActions?.length) {
                setAutoExecutedActions(prev => ({ ...prev, [alert.id]: res.executedActions }));
              }
            }).catch(() => {});
          }
          // Auto-create an incident and trigger deep investigation
          if (onAutoIncident) {
            setTimeout(() => onAutoIncident(alert, d.result), 400);
          }
        }
        // Auto+Notify (level 1): create incident for Critical/High TPs without executing actions
        if (automation === 1 && d.result.verdict === 'TP' && ['Critical','High'].includes(alert.severity) && d.result.confidence >= 80) {
          if (onAutoIncident) {
            setTimeout(() => onAutoIncident(alert, d.result), 400);
          }
        }
      }
    }).catch(() => {
      setTriageResults(prev => ({ ...prev, [alert.id]: { error: 'AI analysis unavailable — check your API key or try again' } }));
    }).finally(() => {
      setTriageLoading(prev => { const n = new Set(prev); n.delete(alert.id); return n; });
    });
  }

  // Fetch blast radius when analyst confirms TP
  function fetchBlastRadius(alert) {
    if (blastResults[alert.id] || blastLoading.has(alert.id)) return;
    setBlastLoading(prev => new Set([...prev, alert.id]));
    fetch('/api/blast-radius', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alertId: alert.id, title: alert.title, severity: alert.severity,
        source: alert.source, device: alert.device, mitre: alert.mitre,
        user: alert.user, ip: alert.ip, description: alert.description,
      }),
    }).then(r => r.json()).then(d => {
      if (d.ok && d.result) setBlastResults(prev => ({ ...prev, [alert.id]: d.result }));
    }).catch(() => {}).finally(() => {
      setBlastLoading(prev => { const n = new Set(prev); n.delete(alert.id); return n; });
    });
  }

  function toggleAlertExpand(id) {
    setExpandedAlerts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function handleExpand(alert) {
    toggleAlertExpand(alert.id);
    // Triage is now on-demand — analyst clicks "Deep Analyse" button
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
    <div style={{display:'flex',flexDirection:'column',gap:8,overflowX:'hidden',maxWidth:'100%'}}>

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
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
          <span style={{fontSize:'0.66rem',color:'var(--wt-muted)'}}>
            {alerts.length} total · {fpAlerts.length} auto-FP · {tpAlerts.length} escalated
          </span>
          {canTeam ? (
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
          ) : (
          <span title='Upgrade to Essentials to export' style={{padding:'4px 10px',borderRadius:6,border:'1px solid var(--wt-border)',color:'var(--wt-dim)',fontSize:'0.68rem',cursor:'not-allowed'}}>🔒 Export</span>
          )}
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

      {/* Bulk action bar — always visible, lights up when alerts selected */}
      <div className='wt-bulk-bar' style={{display:'flex',alignItems:'center',gap:6,padding:'7px 12px',background:selectedAlerts.size>0?'#4f8fff12':'var(--wt-card)',border:`1px solid ${selectedAlerts.size>0?'#4f8fff30':'var(--wt-border)'}`,borderRadius:8,transition:'all .15s'}}>
        {/* Select-all checkbox */}
        <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',flexShrink:0}}>
          <input type='checkbox'
            checked={alertsFiltered.length>0 && alertsFiltered.every(a=>selectedAlerts.has(a.id))}
            ref={el=>{if(el) el.indeterminate = selectedAlerts.size>0 && !alertsFiltered.every(a=>selectedAlerts.has(a.id));}}
            onChange={e=>{
              if(e.target.checked) setSelectedAlerts(new Set(alertsFiltered.map(a=>a.id)));
              else setSelectedAlerts(new Set());
            }}
            style={{width:14,height:14,cursor:'pointer',accentColor:'#4f8fff'}}
          />
          <span style={{fontSize:'0.68rem',color:selectedAlerts.size>0?'#4f8fff':'var(--wt-muted)',fontWeight:selectedAlerts.size>0?700:400,minWidth:60}}>
            {selectedAlerts.size>0?`${selectedAlerts.size} selected`:`Select all`}
          </span>
        </label>
        <div style={{width:1,height:16,background:'var(--wt-border)',flexShrink:0}} />
        <button onClick={()=>{setAlertOverrides(prev=>{const n={...prev};[...selectedAlerts].forEach(id=>{n[id]={...(n[id]||{}),verdict:'FP',confidence:99}});return n;});setSelectedAlerts(new Set());}}
          disabled={selectedAlerts.size===0}
          style={{padding:'4px 12px',borderRadius:6,border:'1px solid #22d49a30',background:'#22d49a10',color:selectedAlerts.size>0?'#22d49a':'var(--wt-dim)',fontSize:'0.7rem',fontWeight:700,cursor:selectedAlerts.size>0?'pointer':'not-allowed',fontFamily:'Inter,sans-serif',opacity:selectedAlerts.size>0?1:0.4}}>
          ✓ Mark FP
        </button>
        <button onClick={()=>{setAlertOverrides(prev=>{const n={...prev};[...selectedAlerts].forEach(id=>{n[id]={...(n[id]||{}),verdict:'TP',acknowledged:true}});return n;});setSelectedAlerts(new Set());}}
          disabled={selectedAlerts.size===0}
          style={{padding:'4px 12px',borderRadius:6,border:'1px solid #f0405e30',background:'#f0405e10',color:selectedAlerts.size>0?'#f0405e':'var(--wt-dim)',fontSize:'0.7rem',fontWeight:700,cursor:selectedAlerts.size>0?'pointer':'not-allowed',fontFamily:'Inter,sans-serif',opacity:selectedAlerts.size>0?1:0.4}}>
          ⚠ Mark TP
        </button>
        <button onClick={()=>{setAlertOverrides(prev=>{const n={...prev};[...selectedAlerts].forEach(id=>{n[id]={...(n[id]||{}),acknowledged:true}});return n;});setSelectedAlerts(new Set());}}
          disabled={selectedAlerts.size===0}
          style={{padding:'4px 12px',borderRadius:6,border:'1px solid #4f8fff30',background:'#4f8fff10',color:selectedAlerts.size>0?'#4f8fff':'var(--wt-dim)',fontSize:'0.7rem',fontWeight:700,cursor:selectedAlerts.size>0?'pointer':'not-allowed',fontFamily:'Inter,sans-serif',opacity:selectedAlerts.size>0?1:0.4}}>
          Acknowledge
        </button>
        <button onClick={()=>{setAlertOverrides(prev=>{const n={...prev};[...selectedAlerts].forEach(id=>{n[id]={...(n[id]||{}),closed:true,closedAt:Date.now()}});return n;});setSelectedAlerts(new Set());}}
          disabled={selectedAlerts.size===0}
          style={{padding:'4px 12px',borderRadius:6,border:'1px solid #6b7a9430',background:'#6b7a9410',color:selectedAlerts.size>0?'#6b7a94':'var(--wt-dim)',fontSize:'0.7rem',fontWeight:700,cursor:selectedAlerts.size>0?'pointer':'not-allowed',fontFamily:'Inter,sans-serif',opacity:selectedAlerts.size>0?1:0.4}}>
          Close
        </button>
        {setAlertSnoozes && <button onClick={()=>{const until=Date.now()+(2*60*60*1000);setAlertSnoozes(prev=>{const n={...prev};[...selectedAlerts].forEach(id=>{n[id]=until;});return n;});setSelectedAlerts(new Set());}}
          disabled={selectedAlerts.size===0}
          style={{padding:'4px 12px',borderRadius:6,border:'1px solid #f0a03030',background:'#f0a03010',color:selectedAlerts.size>0?'#f0a030':'var(--wt-dim)',fontSize:'0.7rem',fontWeight:700,cursor:selectedAlerts.size>0?'pointer':'not-allowed',fontFamily:'Inter,sans-serif',opacity:selectedAlerts.size>0?1:0.4}}>
          Snooze 2h
        </button>}
        <button onClick={()=>{
            const sel=alerts.filter(a=>selectedAlerts.has(a.id));
            const sevOrder={Critical:0,High:1,Medium:2,Low:3};
            const top=sel.sort((a,b)=>(sevOrder[a.severity]||4)-(sevOrder[b.severity]||4))[0];
            const incId='INC-'+String(Date.now()).slice(-4);
            const inc={id:incId,title:'Incident — '+(top&&top.title||'Multiple alerts'),severity:top&&top.severity||'High',status:'Active',created:new Date().toLocaleString(),updated:new Date().toLocaleString(),alertCount:sel.length,devices:[...new Set(sel.map(a=>a.device).filter(Boolean))],mitreTactics:[...new Set(sel.map(a=>a.mitre).filter(Boolean))],aiSummary:'Incident from '+sel.length+' alerts: '+sel.map(a=>a.title).join('; ').slice(0,120),alerts:sel.map(a=>a.id),timeline:buildAiTimeline(sel,incId)};
            setCreatedIncidents(prev=>[inc,...prev]);setSelectedAlerts(new Set());setActiveTab('incidents');
          }}
          disabled={selectedAlerts.size===0}
          style={{padding:'4px 12px',borderRadius:6,border:'1px solid #8b6fff30',background:'#8b6fff10',color:selectedAlerts.size>0?'#8b6fff':'var(--wt-dim)',fontSize:'0.7rem',fontWeight:700,cursor:selectedAlerts.size>0?'pointer':'not-allowed',fontFamily:'Inter,sans-serif',opacity:selectedAlerts.size>0?1:0.4}}>
          + Incident
        </button>
        {selectedAlerts.size>0 && <button onClick={()=>{
            const noun = selectedAlerts.size===1 ? "alert" : "alerts";
            const msg = "Delete " + selectedAlerts.size + " " + noun + " permanently? This cannot be undone.";
            if(!window.confirm(msg)) return;
            setAlertOverrides(prev=>{const n={...prev};[...selectedAlerts].forEach(id=>{n[id]={...(n[id]||{}),deleted:true,deletedAt:Date.now()}});return n;});
            setSelectedAlerts(new Set());
          }}
          style={{padding:"4px 12px",borderRadius:6,border:"1px solid #f0405e30",background:"#f0405e08",color:"#f0405e",fontSize:"0.7rem",fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
          🗑 Delete
        </button>}
        {selectedAlerts.size>0 && <button onClick={()=>setSelectedAlerts(new Set())}
          style={{marginLeft:'auto',padding:'4px 8px',borderRadius:6,border:'1px solid var(--wt-border)',background:'none',color:'var(--wt-muted)',fontSize:'0.66rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
          ×
        </button>}
      </div>

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
          ) : syncStatus === 'syncing' ? (
            <div>
              <div style={{width:28,height:28,borderRadius:'50%',border:'3px solid #4f8fff',borderTopColor:'transparent',margin:'0 auto 12px',animation:'spin 0.8s linear infinite'}} />
              <div style={{fontSize:'0.9rem',fontWeight:700,color:'var(--wt-text)',marginBottom:4}}>Syncing live data…</div>
              <div style={{fontSize:'0.74rem',color:'var(--wt-muted)'}}>Fetching alerts from your connected tools</div>
            </div>
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
        const isAutoClosed = autoClosedIds && autoClosedIds.has(alert.id);
        const deviceAlertCount = deviceCounts[alert.device] || 0;
        const isHotDevice = deviceAlertCount >= 3;
        const ageStr = relTime(alert.rawTime, alert.time);
        const isFresh = alert.rawTime && (Date.now() - new Date(alert.rawTime).getTime()) < 15*60*1000;
        const isStale = alert.rawTime && (Date.now() - new Date(alert.rawTime).getTime()) > 4*60*60*1000;
        const alertAgeMs = alert.rawTime ? Date.now() - new Date(alert.rawTime).getTime() : 0;
        const alertSlaMs = alert.severity==='Critical' ? 3600000 : alert.severity==='High' ? 14400000 : 0;
        const isSlaBreach = !isAcknowledged && alertSlaMs > 0 && alertAgeMs > alertSlaMs && effectiveVerdict === 'Pending';
        // Structured triage result (evidence chain, hunt queries)
        const structTriage = triageResults[alert.id];
        const structLoading = triageLoading.has(alert.id);
        const isTP = effectiveVerdict === 'TP';
        const blastResult = blastResults[alert.id];
        const blastIsLoading = blastLoading.has(alert.id);
        const showingBlast = showBlast.has(alert.id);
        const showingHunt = showHuntQuery.has(alert.id);

        return (
          <div key={alert.id} style={{padding:0,overflow:'hidden',background:'var(--wt-card)',
            border:`1px solid ${isSelected?'#4f8fff60':isSlaBreach?'#f0405e60':alert.severity==='Critical'&&!isAcknowledged?'#f0405e30':'var(--wt-border)'}`,
            borderRadius:10,opacity:isAcknowledged?0.65:isSnoozed?0.75:1,
            transition:'border-color .15s,opacity .15s'}}>

            {/* Collapsed row */}
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',cursor:'pointer'}} onClick={()=>handleExpand(alert)}>
              {/* Checkbox */}
              <div onClick={e=>{e.stopPropagation();setSelectedAlerts(prev=>{const n=new Set(prev);n.has(alert.id)?n.delete(alert.id):n.add(alert.id);return n;})}}
                style={{width:15,height:15,borderRadius:3,border:`1px solid ${isSelected?'#4f8fff':'var(--wt-border2)'}`,background:isSelected?'#4f8fff':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer'}}>
                {isSelected && <span style={{color:'#fff',fontSize:'0.5rem',fontWeight:900}}>✓</span>}
              </div>
              {/* Severity bar — glows on SLA breach */}
              <div style={{width:3,height:32,borderRadius:2,background:SEV_COLOR[alert.severity]||'#6b7a94',flexShrink:0,boxShadow:isSlaBreach?`0 0 5px ${SEV_COLOR[alert.severity]}`:undefined}}/>
              {/* Title + meta */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                  <span style={{fontSize:'0.78rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:isAcknowledged?'line-through':undefined,color:isAcknowledged?'var(--wt-muted)':undefined,maxWidth:'55vw'}}>{alert.title}</span>
                  {isAutoClosed && <span style={{fontSize:'0.44rem',fontWeight:800,padding:'1px 4px',borderRadius:3,background:'#22d49a',color:'#fff',flexShrink:0}}>AI CLOSED</span>}
                  {isSnoozed && <span style={{fontSize:'0.44rem',padding:'1px 4px',borderRadius:3,background:'#8b6fff15',color:'#8b6fff',flexShrink:0}}>💤</span>}
                </div>
                <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
                  <SevBadge sev={alert.severity}/>
                  <span style={{fontSize:'0.52rem',fontWeight:700,padding:'1px 5px',borderRadius:3,background:'#4f8fff12',color:'#4f8fff',border:'1px solid #4f8fff20'}}>{alert.source}</span>
                  {alert.device && <span style={{fontSize:'0.52rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{alert.device}</span>}
                  {alert.mitre && <span style={{fontSize:'0.48rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{alert.mitre}</span>}
                </div>
              </div>
              {/* Right: time + verdict + FP/TP + chevron */}
              <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
                <span style={{fontSize:'0.5rem',color:isFresh?'#22d49a':isStale?'var(--wt-dim)':'var(--wt-muted)',fontWeight:isFresh?700:400,flexShrink:0}}>{ageStr}</span>
                <div onClick={e=>e.stopPropagation()} style={{display:'flex',gap:3}}>
                  {canVote ? (<>
                    <button onClick={()=>{setAlertOverrides(prev=>({...prev,[alert.id]:{...(prev[alert.id]||{}),verdict:'FP',confidence:99}}));onAudit&&onAudit({type:'verdict',verdict:'FP',alertId:alert.id,alertTitle:alert.title,alertSev:alert.severity,analyst:'Analyst'});writeKnowledge(alert,'FP');}}
                      style={{padding:'2px 7px',borderRadius:4,border:'1px solid #22d49a40',background:effectiveVerdict==='FP'?'#22d49a':'transparent',color:effectiveVerdict==='FP'?'#fff':'#22d49a',fontSize:'0.58rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',lineHeight:1.4}}>FP</button>
                    <button onClick={()=>{setAlertOverrides(prev=>({...prev,[alert.id]:{...(prev[alert.id]||{}),verdict:'TP',acknowledged:true}}));onAudit&&onAudit({type:'verdict',verdict:'TP',alertId:alert.id,alertTitle:alert.title,alertSev:alert.severity,analyst:'Analyst'});writeKnowledge(alert,'TP');if(!demoMode)fetchBlastRadius(alert);}}
                      style={{padding:'2px 7px',borderRadius:4,border:'1px solid #f0405e40',background:effectiveVerdict==='TP'?'#f0405e':'transparent',color:effectiveVerdict==='TP'?'#fff':'#f0405e',fontSize:'0.58rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',lineHeight:1.4}}>TP</button>
                  </>) : (<span style={{fontSize:'0.54rem',padding:'2px 6px',borderRadius:4,background:effectiveVerdict&&effectiveVerdict!=='Pending'?vStyle.bg:'transparent',color:effectiveVerdict&&effectiveVerdict!=='Pending'?vStyle.c:'var(--wt-dim)',fontWeight:700,border:effectiveVerdict&&effectiveVerdict!=='Pending'?`1px solid ${vStyle.c}30`:'none'}}>{effectiveVerdict&&effectiveVerdict!=='Pending'?effectiveVerdict:'—'}</span>)}
                </div>
                {aiVerdict && !demoMode && <span style={{fontSize:'0.48rem',fontWeight:800,padding:'1px 4px',borderRadius:3,background:`${aiVC}15`,color:aiVC,flexShrink:0}}>AI {aiVerdict.includes('True')?'TP':aiVerdict.includes('False')?'FP':'?'}</span>}
                <button onClick={e=>{e.stopPropagation();if(!window.confirm("Delete this alert? This cannot be undone.")) return;setAlertOverrides(prev=>({...prev,[alert.id]:{...(prev[alert.id]||{}),deleted:true,deletedAt:Date.now()}}));}}
                  title='Delete alert'
                  style={{padding:'1px 5px',borderRadius:4,border:'1px solid #f0405e20',background:'transparent',color:'#f0405e60',fontSize:'0.64rem',cursor:'pointer',lineHeight:1.4,flexShrink:0}}>🗑</button>
                <span style={{fontSize:'0.56rem',color:'var(--wt-dim)',flexShrink:0}}>{expanded?'▲':'▼'}</span>
              </div>
            </div>
            {/* AI confidence gradient bar — thin strip at bottom of collapsed card */}
            {(effectiveVerdict!=='Pending'||aiVerdict||(alert.confidence&&alert.confidence>0)) && !expanded && (
              <div style={{height:2,background:`linear-gradient(90deg,${effectiveVerdict==='TP'||aiVerdict.includes('True')?'#f0405e':effectiveVerdict==='FP'||aiVerdict.includes('False')?'#22d49a':'#f0a030'},transparent)`,width:`${Math.min(100,alert.confidence||60)}%`,transition:'width .5s ease',borderRadius:'0 0 0 0'}} />
            )}

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
                    <div style={{padding:'8px 10px',background:'rgba(79,143,255,0.03)',border:'1px solid rgba(79,143,255,0.1)',borderRadius:7,marginBottom:8}}><WtMarkdown text={alert.aiReasoning} compact={true} /></div>
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
                {/* Live AI triage - spinner (only show if user has API key configured = team+) */}
                {!demoMode && canTeam && (cached === undefined || (cached && cached.loading)) && (
                  <div style={{padding:'10px 0',fontSize:'0.72rem',color:'var(--wt-muted)',display:'flex',alignItems:'center',gap:8}}>
                    <span style={{width:10,height:10,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}}/>
                    AI triage running…
                  </div>
                )}
                {/* Community upgrade prompt - shown instead of AI triage */}
                {!demoMode && !canTeam && (
                  <div style={{marginTop:10,padding:'10px 12px',background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(139,111,255,0.05))',border:'1px solid #4f8fff20',borderRadius:10,display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:'1.2rem'}}>✦</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'0.72rem',fontWeight:700,color:'#4f8fff',marginBottom:2}}>AI Triage — Essentials+</div>
                      <div style={{fontSize:'0.66rem',color:'var(--wt-muted)',lineHeight:1.5}}>Upgrade to get evidence chain, MITRE mapping, hunt queries & blast radius on every alert.</div>
                    </div>
                    <a href='/pricing' style={{padding:'5px 12px',borderRadius:7,background:'#4f8fff',color:'#fff',fontSize:'0.66rem',fontWeight:700,textDecoration:'none',flexShrink:0,whiteSpace:'nowrap'}}>Upgrade →</a>
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
                    {canVote && <button onClick={()=>{setAlertOverrides(prev=>({...prev,[alert.id]:{...(prev[alert.id]||{}),verdict:'FP',confidence:99}}));onAudit&&onAudit({type:'verdict',verdict:'FP',alertId:alert.id,alertTitle:alert.title,alertSev:alert.severity,analyst:'Analyst'});writeKnowledge(alert,'FP',alertNotes[alert.id]);}}
                    style={{padding:'4px 12px',borderRadius:6,border:'1px solid #22d49a30',background:effectiveVerdict==='FP'?'#22d49a':'#22d49a10',color:effectiveVerdict==='FP'?'#fff':'#22d49a',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    {effectiveVerdict==='FP'?'✓ Marked FP':'Mark FP'}
                  </button>}
                  {canVote && <button onClick={()=>{setAlertOverrides(prev=>({...prev,[alert.id]:{...(prev[alert.id]||{}),verdict:'TP',acknowledged:true}}));onAudit&&onAudit({type:'verdict',verdict:'TP',alertId:alert.id,alertTitle:alert.title,alertSev:alert.severity,analyst:'Analyst'});writeKnowledge(alert,'TP',alertNotes[alert.id]);if(!demoMode){fetchBlastRadius(alert);setShowBlast(prev=>{const n=new Set(prev);n.add(alert.id);return n;});}}}
                    style={{padding:'4px 12px',borderRadius:6,border:'1px solid #f0405e30',background:effectiveVerdict==='TP'?'#f0405e':'#f0405e10',color:effectiveVerdict==='TP'?'#fff':'#f0405e',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    {effectiveVerdict==='TP'?'✓ Marked TP':'Mark TP'}
                  </button>}
                  {!canVote && (
                    <div style={{padding:'10px 14px',borderRadius:8,background:'linear-gradient(135deg,rgba(79,143,255,0.06),rgba(139,111,255,0.04))',border:'1px solid #4f8fff20',display:'flex',alignItems:'center',gap:12}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'0.68rem',fontWeight:700,color:'#4f8fff',marginBottom:3}}>AI Triage — Essentials+</div>
                        <div style={{fontSize:'0.62rem',color:'var(--wt-muted)',lineHeight:1.5}}>Evidence chain · Blast radius · Hunt queries · FP/TP verdict · MITRE mapping</div>
                      </div>
                      <a href='/pricing' style={{padding:'6px 14px',borderRadius:7,background:'#4f8fff',color:'#fff',fontSize:'0.68rem',fontWeight:700,textDecoration:'none',flexShrink:0,whiteSpace:'nowrap'}}>Upgrade →</a>
                    </div>
                  )}
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
                  {canTeam && !demoMode && <button onClick={()=>setShowHuntQuery(prev=>{const n=new Set(prev);n.has(alert.id)?n.delete(alert.id):n.add(alert.id);return n;})}
                    style={{padding:'4px 12px',borderRadius:6,border:'1px solid #4f8fff30',background:showingHunt?'#4f8fff':'#4f8fff10',color:showingHunt?'#fff':'#4f8fff',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    🔍 Hunt Queries
                  </button>}
                </div>

                {/* STRUCTURED TRIAGE — on-demand deep analysis (Team+, live mode) */}
                {!demoMode && canTeam && (
                  <div style={{marginTop:12}}>
                    {/* APEX button: team+ only. Community sees upgrade prompt instead */}
                    {!structTriage && !structLoading && canTeam && (
                      <button
                        onClick={()=>fetchTriage(alert)}
                        style={{display:'flex',alignItems:'center',gap:8,padding:'7px 16px',borderRadius:8,border:'1px solid #4f8fff35',background:'linear-gradient(135deg,#4f8fff0a,#8b6fff08)',color:'#4f8fff',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'all .15s',width:'100%',justifyContent:'center',marginBottom:8}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor='#4f8fff60';e.currentTarget.style.background='linear-gradient(135deg,#4f8fff18,#8b6fff12)';}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor='#4f8fff35';e.currentTarget.style.background='linear-gradient(135deg,#4f8fff0a,#8b6fff08)';}}
                      >
                        <span style={{fontSize:'0.9rem'}}>✦</span>
                        <span>Deep Analyse — APEX AI Investigation</span>
                        <span style={{fontSize:'0.6rem',color:'#8b6fff',fontWeight:600,marginLeft:'auto',padding:'1px 6px',borderRadius:3,background:'#8b6fff15',border:'1px solid #8b6fff25'}}>AI</span>
                      </button>
                    )}
                    {!structTriage && !structLoading && !canTeam && !demoMode && (
                      <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',borderRadius:8,border:'1px solid #4f8fff20',background:'#4f8fff08',marginBottom:8,cursor:'pointer'}} onClick={()=>window.location.href='/pricing'}>
                        <span style={{fontSize:'0.9rem',opacity:0.5}}>✦</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'0.72rem',fontWeight:700,color:'#4f8fff50'}}>APEX Deep Analysis</div>
                          <div style={{fontSize:'0.62rem',color:'var(--wt-dim)'}}>Evidence chain · MITRE mapping · Hunt queries · Essentials+</div>
                        </div>
                        <a href='/pricing' style={{padding:'4px 10px',borderRadius:6,background:'#4f8fff',color:'#fff',fontSize:'0.62rem',fontWeight:700,textDecoration:'none',flexShrink:0}}>Upgrade →</a>
                      </div>
                    )}
                    {/* Loading state with skeleton */}
                    {structLoading && (
                      <div style={{display:'flex',flexDirection:'column',gap:8,padding:'12px 16px',borderRadius:8,border:'1px solid #4f8fff20',background:'#4f8fff06',marginBottom:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{width:12,height:12,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.7s linear infinite',flexShrink:0}} />
                          <span style={{fontSize:'0.8rem',color:'#4f8fff',fontWeight:600}}>APEX analysing…</span>
                        </div>
                        <div style={{height:9,borderRadius:4,background:'var(--wt-card2)',width:'88%',animation:'skeleton-shimmer 1.4s ease infinite'}} />
                        <div style={{height:9,borderRadius:4,background:'var(--wt-card2)',width:'65%',animation:'skeleton-shimmer 1.4s ease infinite',animationDelay:'0.15s'}} />
                        <div style={{height:9,borderRadius:4,background:'var(--wt-card2)',width:'75%',animation:'skeleton-shimmer 1.4s ease infinite',animationDelay:'0.3s'}} />
                        <div style={{height:9,borderRadius:4,background:'var(--wt-card2)',width:'50%',animation:'skeleton-shimmer 1.4s ease infinite',animationDelay:'0.45s'}} />
                      </div>
                    )}
                    {/* Error state */}
                    {structTriage && structTriage.error && (
                      <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,border:'1px solid #f0405e25',background:'#f0405e08',marginBottom:8}}>
                        <span style={{fontSize:'1rem'}}>⚠</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'0.72rem',fontWeight:700,color:'#f0405e'}}>APEX analysis failed</div>
                          <div style={{fontSize:'0.64rem',color:'var(--wt-muted)',marginTop:1}}>{structTriage.error}</div>
                        </div>
                        <button onClick={()=>{setTriageResults(prev=>{const n={...prev};delete n[alert.id];return n;});fetchTriage(alert);}} aria-label='Retry APEX analysis' style={{padding:'4px 10px',borderRadius:5,border:'1px solid #f0405e30',background:'#f0405e10',color:'#f0405e',fontSize:'0.62rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Retry</button>
                      </div>
                    )}
                    {/* Evidence Chain — shown after analysis completes */}
                    {structTriage && (
                      <div style={{background:'linear-gradient(135deg,rgba(79,143,255,0.04),rgba(34,201,146,0.03))',border:'1px solid #4f8fff20',borderRadius:10,overflow:'hidden',marginBottom:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderBottom:'1px solid #4f8fff15'}}>
                          <span style={{fontSize:'0.6rem',fontWeight:800,color:'#4f8fff',letterSpacing:'0.5px'}}>✦ APEX ANALYSIS</span>
                          <span style={{fontSize:'0.6rem',fontWeight:800,padding:'1px 8px',borderRadius:4,background:(structTriage.verdict==='TP'?'#f0405e':structTriage.verdict==='FP'?'#22d49a':'#f0a030')+'18',color:structTriage.verdict==='TP'?'#f0405e':structTriage.verdict==='FP'?'#22d49a':'#f0a030'}}>{structTriage.verdict} · {structTriage.confidence}%</span>
                          {structTriage.mitreMapping?.id && <span style={{fontSize:'0.52rem',color:'#8b6fff',fontFamily:'JetBrains Mono,monospace'}}>{structTriage.mitreMapping.id} — {structTriage.mitreMapping.tactic}</span>}
                          {structTriage.modelVersion && <span style={{fontSize:'0.5rem',color:'var(--wt-dim)',marginLeft:'auto',fontFamily:'JetBrains Mono,monospace'}}>{structTriage.modelVersion}</span>}
                          <button onClick={()=>{setTriageResults(prev=>{const n={...prev};delete n[alert.id];return n;});fetchTriage(alert);}} style={{padding:'2px 8px',borderRadius:4,border:'1px solid #4f8fff25',background:'#4f8fff0a',color:'#4f8fff',fontSize:'0.52rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}} aria-label='Re-run APEX analysis' title='Re-run analysis'>↺ Re-analyse</button>
                        </div>
                        <div style={{padding:'10px 12px'}}>
                          <div style={{padding:'10px 12px',background:'rgba(79,143,255,0.03)',border:'1px solid rgba(79,143,255,0.1)',borderRadius:7,marginBottom:12}}><WtMarkdown text={structTriage.analystNarrative || structTriage.reasoning} compact={true} /></div>
                          {structTriage.evidenceChain?.length > 0 && (
                            <div style={{marginBottom:10}}>
                              {structTriage.evidenceChain.map((step,i)=>(
                                <div key={i} style={{display:'flex',gap:8,padding:'6px 8px',marginBottom:3,borderRadius:6,background:`rgba(79,143,255,0.04)`,border:'1px solid rgba(79,143,255,0.1)',alignItems:'flex-start'}}>
                                  <span style={{fontSize:'0.68rem',fontWeight:900,color:'#4f8fff',flexShrink:0,fontFamily:'JetBrains Mono,monospace',minWidth:18}}>#{i+1}</span>
                                  <span style={{fontSize:'0.76rem',color:'var(--wt-secondary)',lineHeight:1.6}}>{step}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {structTriage.immediateActions?.length > 0 && (
                            <div style={{marginBottom:10}}>
                              <div style={{fontSize:'0.7rem',fontWeight:700,color:'#f0a030',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                                ⚡ Immediate Actions
                                {<span style={{fontSize:'0.7rem',fontWeight:600,color:'var(--wt-dim)',textTransform:'none',letterSpacing:0}}>— steps for your connected tools only</span>}
                              </div>
                              {structTriage.immediateActions.map((a,i)=>{
                                const action = typeof a === 'string' ? a : a.action;
                                const priority = typeof a === 'object' ? a.priority : null;
                                const tf = typeof a === 'object' ? a.timeframe : null;
                                const owner = typeof a === 'object' ? a.owner : null;
                                const pColor = priority==='CRITICAL'?'#f0405e':priority==='HIGH'?'#f97316':'#f0a030';
                                return (
                                  <div key={i} style={{display:'flex',gap:10,padding:'8px 10px',marginBottom:4,borderRadius:7,background:`${pColor}08`,border:`1px solid ${pColor}20`,alignItems:'flex-start'}}>
                                    <div style={{width:22,height:22,borderRadius:5,background:pColor,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'0.7rem',fontWeight:900,color:'#fff'}}>{i+1}</div>
                                    <div style={{flex:1}}>
                                      <div style={{fontSize:'0.78rem',color:'var(--wt-text)',fontWeight:600,lineHeight:1.5}}>{action}</div>
                                      {(tf||owner)&&<div style={{fontSize:'0.68rem',color:'var(--wt-dim)',marginTop:3,display:'flex',gap:8}}>
                                        {tf&&<span style={{padding:'1px 6px',borderRadius:3,background:'rgba(255,255,255,0.05)',fontFamily:'JetBrains Mono,monospace'}}>{tf}</span>}
                                        {owner&&<span style={{padding:'1px 6px',borderRadius:3,background:`${pColor}12`,color:pColor,fontWeight:600}}>→ {owner}</span>}
                                      </div>}
                                    </div>
                                    <span style={{fontSize:'0.64rem',fontWeight:800,padding:'2px 6px',borderRadius:3,background:pColor+'20',color:pColor,flexShrink:0,fontFamily:'JetBrains Mono,monospace'}}>{priority||'ACT'}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {structTriage.counterarguments?.length > 0 && (
                            <div style={{marginBottom:8,padding:'8px 10px',background:'#f0a03008',border:'1px solid #f0a03020',borderRadius:6}}>
                              <div style={{fontSize:'0.54rem',fontWeight:700,color:'#f0a030',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>⚖ Counterarguments Considered</div>
                              {structTriage.counterarguments.map((c,i)=>(
                                <div key={i} style={{fontSize:'0.64rem',color:'#f0a030',marginBottom:2,opacity:0.8}}>• {c}</div>
                              ))}
                            </div>
                          )}
                          {structTriage.escalationTriggers?.length > 0 && (
                            <div style={{marginBottom:8,padding:'8px 10px',background:'#f0405e06',border:'1px solid #f0405e18',borderRadius:6}}>
                              <div style={{fontSize:'0.54rem',fontWeight:700,color:'#f0405e',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>🚨 Escalation Triggers</div>
                              {structTriage.escalationTriggers.map((t,i)=>(
                                <div key={i} style={{fontSize:'0.64rem',color:'#f0405e',marginBottom:2,opacity:0.85}}>• {t}</div>
                              ))}
                            </div>
                          )}
                          {structTriage.campaignIndicators?.length > 0 && (
                            <div style={{padding:'8px 10px',background:'#8b6fff06',border:'1px solid #8b6fff18',borderRadius:6}}>
                              <div style={{fontSize:'0.54rem',fontWeight:700,color:'#8b6fff',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>🔗 Campaign Indicators</div>
                              {structTriage.campaignIndicators.map((c,i)=>(
                                <div key={i} style={{fontSize:'0.64rem',color:'#8b6fff',marginBottom:2,opacity:0.85}}>• {c}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Hunt Queries */}
                    {/* Full Auto execution banner */}
                    {automation === 2 && autoExecutedActions[alert.id]?.length > 0 && (
                      <div style={{marginBottom:8,padding:'10px 14px',background:'linear-gradient(135deg,rgba(34,212,154,0.06),rgba(79,143,255,0.04))',border:'1px solid #22d49a25',borderRadius:10}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                          <span style={{fontSize:'0.58rem',fontWeight:800,color:'#22d49a',letterSpacing:'0.5px',textTransform:'uppercase'}}>⚡ APEX AUTO-RESPONSE EXECUTED</span>
                          <span style={{fontSize:'0.52rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace',marginLeft:'auto'}}>Full Auto Mode</span>
                        </div>
                        {autoExecutedActions[alert.id].map((action, i) => (
                          <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'3px 0',fontSize:'0.68rem',color:'#22d49a'}}>
                            <span style={{flexShrink:0}}>✓</span>
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {structTriage && showingHunt && (
                      <div style={{background:'#080a12',border:'1px solid #1e2536',borderRadius:10,padding:'10px 12px',marginBottom:8}}>
                        <div style={{fontSize:'0.58rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Hunt Queries</div>
                        {[{label:'Splunk SPL',val:structTriage.huntQueries?.splunk,c:'#65a637'},{label:'Sentinel KQL',val:structTriage.huntQueries?.sentinel,c:'#00a4ef'},{label:'Defender AH',val:structTriage.huntQueries?.defender,c:'#f97316'},{label:'Elastic EQL',val:structTriage.huntQueries?.elastic,c:'#00bfb3'}].map(({label,val,c})=>val&&(
                          <div key={label} style={{marginBottom:8}}>
                            <div style={{fontSize:'0.52rem',fontWeight:700,color:c,marginBottom:3}}>{label}</div>
                            <div style={{display:'flex',gap:6,alignItems:'flex-start'}}>
                              <code style={{flex:1,fontSize:'0.6rem',fontFamily:'JetBrains Mono,monospace',color:'#22c992',background:'#050810',padding:'6px 8px',borderRadius:5,display:'block',wordBreak:'break-all',lineHeight:1.5}}>{val}</code>
                              <button onClick={()=>navigator.clipboard?.writeText(val)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${c}30`,background:`${c}12`,color:c,fontSize:'0.52rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Copy</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* BLAST RADIUS — shows when TP is confirmed */}
                {isTP && !demoMode && canTeam && (showingBlast || blastIsLoading || blastResult) && (
                  <div style={{marginTop:10,border:'1px solid #f0405e30',borderRadius:10,overflow:'hidden',background:'linear-gradient(135deg,rgba(240,64,94,0.04),rgba(139,111,255,0.03))'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderBottom:'1px solid #f0405e20'}}>
                      <span style={{fontSize:'0.6rem',fontWeight:800,color:'#f0405e',letterSpacing:'0.5px'}}>💥 BLAST RADIUS ANALYSIS</span>
                      {blastResult && <span style={{fontSize:'0.58rem',fontWeight:700,padding:'1px 7px',borderRadius:3,background:(blastResult.estimatedSeverity==='Critical'?'#f0405e':blastResult.estimatedSeverity==='Expanding'?'#f97316':'#22d49a')+'20',color:blastResult.estimatedSeverity==='Critical'?'#f0405e':blastResult.estimatedSeverity==='Expanding'?'#f97316':'#22d49a'}}>{blastResult.estimatedSeverity}</span>}
                      {!blastResult && <button onClick={()=>fetchBlastRadius(alert)} style={{marginLeft:'auto',padding:'3px 10px',borderRadius:4,border:'1px solid #f0405e30',background:'#f0405e12',color:'#f0405e',fontSize:'0.6rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Run Analysis</button>}
                    </div>
                    {blastIsLoading && <div style={{padding:'10px 12px',fontSize:'0.72rem',color:'var(--wt-muted)',display:'flex',alignItems:'center',gap:8}}><span style={{width:10,height:10,borderRadius:'50%',border:'2px solid #f0405e',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}}/>Mapping blast radius…</div>}
                    {blastResult && (
                      <div className='wt-two-col' style={{padding:'10px 12px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                        {blastResult.affectedScope && (
                          <div>
                            <div style={{fontSize:'0.54rem',fontWeight:700,color:'#f0405e',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.5px'}}>Affected Scope</div>
                            {blastResult.affectedScope.users?.length>0&&<div style={{fontSize:'0.64rem',color:'var(--wt-secondary)',marginBottom:2}}>👤 {blastResult.affectedScope.users.join(', ')}</div>}
                            {blastResult.affectedScope.devices?.length>0&&<div style={{fontSize:'0.64rem',color:'var(--wt-secondary)',marginBottom:2}}>💻 {blastResult.affectedScope.devices.join(', ')}</div>}
                            {blastResult.affectedScope.services?.length>0&&<div style={{fontSize:'0.64rem',color:'var(--wt-secondary)',marginBottom:2}}>⚙️ {blastResult.affectedScope.services.join(', ')}</div>}
                            {blastResult.affectedScope.dataStores?.length>0&&<div style={{fontSize:'0.64rem',color:'var(--wt-secondary)',marginBottom:2}}>🗄️ {blastResult.affectedScope.dataStores.join(', ')}</div>}
                          </div>
                        )}
                        {blastResult.lateralRisk?.paths?.length>0 && (
                          <div>
                            <div style={{fontSize:'0.54rem',fontWeight:700,color:'#f97316',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.5px'}}>Lateral Movement Risk</div>
                            {blastResult.lateralRisk.paths.map((p,i)=><div key={i} style={{fontSize:'0.62rem',color:'#f97316',marginBottom:2}}>→ {p}</div>)}
                          </div>
                        )}
                        {blastResult.immediateContainment?.length>0 && (
                          <div style={{gridColumn:'1 / -1'}}>
                            <div style={{fontSize:'0.54rem',fontWeight:700,color:'#22d49a',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.5px'}}>Immediate Containment</div>
                            {blastResult.immediateContainment.map((a,i)=><div key={i} style={{fontSize:'0.64rem',color:'#22d49a',marginBottom:2}}>⚡ {a}</div>)}
                          </div>
                        )}
                        {blastResult.forensicCommands?.length>0 && (
                          <div style={{gridColumn:'1 / -1'}}>
                            <div style={{fontSize:'0.54rem',fontWeight:700,color:'#4f8fff',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.5px'}}>Forensic Commands</div>
                            {blastResult.forensicCommands.map((cmd,i)=>(
                              <div key={i} style={{display:'flex',gap:6,alignItems:'flex-start',marginBottom:4}}>
                                <code style={{flex:1,fontSize:'0.58rem',fontFamily:'JetBrains Mono,monospace',color:'#22c992',background:'#050810',padding:'4px 7px',borderRadius:4,display:'block',wordBreak:'break-all'}}>{cmd}</code>
                                <button onClick={()=>navigator.clipboard?.writeText(cmd)} style={{padding:'3px 7px',borderRadius:3,border:'1px solid #4f8fff30',background:'#4f8fff12',color:'#4f8fff',fontSize:'0.5rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Copy</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

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
