'use client';

const SEV_COLOR = { Critical:'#f0405e', High:'#f97316', Medium:'#f0a030', Low:'#4f8fff' };
const VERDICT_STYLE = {
  TP: { color:'#f0405e', bg:'#f0405e12' },
  FP: { color:'#22d49a', bg:'#22d49a12' },
  SUS: { color:'#f0a030', bg:'#f0a03012' },
  Pending: { color:'#6b7a94', bg:'#6b7a9412' },
};
const SevBadge = ({ sev }) => (
  <span style={{ fontSize:'0.5rem', fontWeight:800, padding:'1px 5px', borderRadius:3,
    color:SEV_COLOR[sev]||'#6b7a94', background:`${SEV_COLOR[sev]||'#6b7a94'}18`,
    border:`1px solid ${SEV_COLOR[sev]||'#6b7a94'}30`, textTransform:'uppercase', letterSpacing:'0.5px' }}>
    {sev}
  </span>
);

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
  createdIncidents, setCreatedIncidents,
  setActiveTab,
  userTier,
}) {
  function toggleAlertExpand(id) {
    setExpandedAlerts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Live Alerts</h2>
        <span style={{fontSize:'0.62rem',fontWeight:600,padding:'3px 10px',borderRadius:5,background:`${autColor}12`,color:autColor,border:`1px solid ${autColor}20`}}>
          {['⚡','✦','🤖'][automation]} {autLabel}
        </span>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:'0.7rem',color:'var(--wt-muted)'}}>{alerts.length} total · {fpAlerts.length} auto-closed · {tpAlerts.length} escalated</span>
          <button onClick={()=>{
            const rows = [['ID','Title','Severity','Source','Device','User','IP','Time','Verdict','Confidence','MITRE','FP','Acknowledged','Snoozed','Notes']];
            alertsFiltered.forEach(a=>{
              const ov=alertOverrides[a.id]||{};
              rows.push([a.id,'"'+a.title+'"',a.severity,a.source,a.device||'',a.user||'',a.ip||'',a.time,ov.verdict||a.verdict||'',a.confidence||'',a.mitre||'',ov.fpMarked?'Yes':'No',ov.acknowledged?'Yes':'No',alertSnoozes&&alertSnoozes[a.id]&&alertSnoozes[a.id]>Date.now()?'Yes':'No','"'+(alertNotes[a.id]?alertNotes[a.id].replace(/"/g,"'"):'')+'"']);
            });
            const csv = rows.map(r=>r.join(',')).join('\n');
            const blob = new Blob([csv],{type:'text/csv'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href=url; a.download='watchtower-alerts-'+new Date().toISOString().split('T')[0]+'.csv'; a.click(); URL.revokeObjectURL(url);
          }} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="wt-filter-row" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <input value={alertSearch} onChange={e=>{setAlertSearch(e.target.value);setAlertPage(0);}}
          placeholder="Search alerts…"
          style={{padding:'6px 10px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:'var(--wt-text)',fontSize:'0.76rem',fontFamily:'Inter,sans-serif',outline:'none',width:180,flex:'1 1 140px'}}/>
        <select value={alertSevFilter} onChange={e=>{setAlertSevFilter(e.target.value);setAlertPage(0);}}
          style={{padding:'6px 10px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:'var(--wt-text)',fontSize:'0.76rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
          <option value='all'>All severities</option>
          <option value='Critical'>Critical</option>
          <option value='High'>High</option>
          <option value='Medium'>Medium</option>
          <option value='Low'>Low</option>
        </select>
        <select value={alertSrcFilter} onChange={e=>{setAlertSrcFilter(e.target.value);setAlertPage(0);}}
          style={{padding:'6px 10px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:'var(--wt-text)',fontSize:'0.76rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
          <option value='all'>All sources</option>
          {[...new Set(alerts.map(a=>a.source))].sort().map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={alertSort} onChange={e=>setAlertSort(e.target.value)}
          style={{padding:'6px 10px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:'var(--wt-text)',fontSize:'0.76rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
          <option value='time-desc'>Newest first</option>
          <option value='time-asc'>Oldest first</option>
          <option value='sev-desc'>Severity high→low</option>
          <option value='sev-asc'>Severity low→high</option>
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
        <div className="wt-bulk-bar" style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#4f8fff10',border:'1px solid #4f8fff25',borderRadius:8}}>
          <span style={{fontSize:'0.76rem',fontWeight:700,color:'#4f8fff'}}>{selectedAlerts.size} selected</span>
          <button onClick={()=>{
            setAlertOverrides(prev=>{const n={...prev};[...selectedAlerts].forEach(id=>{n[id]={...(n[id]||{}),verdict:'FP',confidence:99}});return n;});
            setSelectedAlerts(new Set());
          }} style={{padding:'4px 12px',borderRadius:6,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            Mark FP
          </button>
          <button onClick={()=>{
            setAlertOverrides(prev=>{const n={...prev};[...selectedAlerts].forEach(id=>{n[id]={...(n[id]||{}),verdict:'TP',acknowledged:true}});return n;});
            setSelectedAlerts(new Set());
          }} style={{padding:'4px 12px',borderRadius:6,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            Acknowledge
          </button>
          <button onClick={()=>{
            const sel=alerts.filter(a=>selectedAlerts.has(a.id));
            const sevOrder={Critical:0,High:1,Medium:2,Low:3};
            const top=sel.sort((a,b)=>(sevOrder[a.severity]||4)-(sevOrder[b.severity]||4))[0];
            const inc={id:'INC-'+String(Date.now()).slice(-4),title:'Incident — '+(top&&top.title||'Multiple alerts'),severity:top&&top.severity||'High',status:'Active',created:new Date().toLocaleString(),updated:new Date().toLocaleString(),alertCount:sel.length,devices:[...new Set(sel.map(a=>a.device).filter(Boolean))],mitreTactics:[...new Set(sel.map(a=>a.mitre).filter(Boolean))],aiSummary:'Incident from '+sel.length+' alerts: '+sel.map(a=>a.title).join('; ').slice(0,120),alerts:sel.map(a=>a.id)};
            setCreatedIncidents(prev=>[inc,...prev]);
            setSelectedAlerts(new Set());
            setActiveTab('incidents');
          }} style={{padding:'4px 12px',borderRadius:6,border:'1px solid #8b6fff30',background:'#8b6fff10',color:'#8b6fff',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            Create Incident
          </button>
          {setAlertSnoozes && <button onClick={()=>{
            const until=Date.now()+(2*60*60*1000);
            setAlertSnoozes(prev=>{const n={...prev};[...selectedAlerts].forEach(id=>{n[id]=until;});return n;});
            setSelectedAlerts(new Set());
          }} style={{padding:'4px 12px',borderRadius:6,border:'1px solid #f0a03030',background:'#f0a03010',color:'#f0a030',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
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
            <div style={{fontSize:'0.84rem'}}>
              No alerts match your filters.{' '}
              <button onClick={()=>{if(setAlertSearch)setAlertSearch('');if(setAlertSevFilter)setAlertSevFilter('all');if(setAlertSrcFilter)setAlertSrcFilter('all');}}
                style={{color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:'0.84rem',textDecoration:'underline'}}>
                Clear filters
              </button>
            </div>
          ) : demoMode ? (
            <div style={{fontSize:'0.84rem'}}>No demo alerts loaded.</div>
          ) : (
            <div>
              <div style={{fontSize:'2.2rem',marginBottom:10}}>✓</div>
              <div style={{fontSize:'0.9rem',fontWeight:700,color:'var(--wt-text)',marginBottom:6}}>No alerts yet</div>
              <div style={{fontSize:'0.78rem',lineHeight:1.7,maxWidth:280,margin:'0 auto'}}>
                Watchtower syncs every 60 seconds in live mode.
                Make sure at least one integration is connected in the{' '}
                <button onClick={()=>setActiveTab&&setActiveTab('tools')}
                  style={{color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:'0.78rem',textDecoration:'underline'}}>
                  Tools tab
                </button>.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alert rows */}
      {alertsPaged.map(alert => {
        const vStyle = VERDICT_STYLE[alert.verdict] || VERDICT_STYLE.Pending;
        const expanded = expandedAlerts.has(alert.id);
        const aiText = (!demoMode && aiTriageCache[alert.id]?.result?.reasoning) || '';
        const aiVerdict = aiText.match(/True Positive|False Positive|Suspicious/i)?.[0] || '';
        const aiConf = aiText.match(/\d+%/)?.[0] || '';
        const aiVC = aiVerdict.toLowerCase().includes('true')?'#f0405e':aiVerdict.toLowerCase().includes('false')?'#22d49a':'#f0a030';
        const aiActed = alert.verdict==='FP' || alert.verdict==='TP';
        const isSelected = selectedAlerts.has(alert.id);
        const hasNote = alertNotes[alert.id];
        const cached = aiTriageCache[alert.id];
        const isAcknowledged = !!(alert.acknowledged);
        return (
          <div key={alert.id} style={{padding:0,overflow:'hidden',background:'var(--wt-card)',border:`1px solid ${isSelected?'#4f8fff':isAcknowledged?'#22d49a28':'var(--wt-border)'}`,borderRadius:10,opacity:isAcknowledged?0.72:1}}>
            {/* Collapsed row */}
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer'}} onClick={()=>toggleAlertExpand(alert.id)}>
              <div onClick={e=>{e.stopPropagation();setSelectedAlerts(prev=>{const n=new Set(prev);n.has(alert.id)?n.delete(alert.id):n.add(alert.id);return n;})}}
                style={{width:16,height:16,borderRadius:4,border:`1px solid ${isSelected?'#4f8fff':'var(--wt-border2)'}`,background:isSelected?'#4f8fff':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer'}}>
                {isSelected && <span style={{color:'#fff',fontSize:'0.55rem',fontWeight:900}}>✓</span>}
              </div>
              <div style={{width:4,height:36,borderRadius:2,background:SEV_COLOR[alert.severity],flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                  <span style={{fontSize:'0.8rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:isAcknowledged?'line-through':undefined,color:isAcknowledged?'var(--wt-muted)':undefined}}>{alert.title}</span>
                  {hasNote && <span style={{fontSize:'0.48rem',color:'#f0a030',background:'#f0a03012',border:'1px solid #f0a03025',padding:'1px 5px',borderRadius:3,flexShrink:0}}>note</span>}
                  {isAcknowledged && <span style={{fontSize:'0.48rem',color:'#22d49a',background:'#22d49a12',border:'1px solid #22d49a25',padding:'1px 5px',borderRadius:3,flexShrink:0,fontWeight:800}}>ACK</span>}
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                  <SevBadge sev={alert.severity}/>
                  <span style={{fontSize:'0.52rem',fontWeight:700,padding:'1px 6px',borderRadius:3,background:'#4f8fff12',color:'#4f8fff',border:'1px solid #4f8fff18'}}>{alert.source}</span>
                  <span style={{fontSize:'0.52rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{alert.device}</span>
                  <span style={{fontSize:'0.52rem',color:'var(--wt-dim)'}}>{alert.time}</span>
                  {alert.mitre && <span style={{fontSize:'0.48rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{alert.mitre}</span>}
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                {vStyle && <span style={{fontSize:'0.58rem',fontWeight:800,padding:'2px 8px',borderRadius:4,color:vStyle.color,background:vStyle.bg,border:`1px solid ${vStyle.color}30`}}>{alert.verdict}</span>}
                {alert.confidence && <span style={{fontSize:'0.52rem',color:'var(--wt-muted)',fontFamily:'JetBrains Mono,monospace'}}>{alert.confidence}%</span>}
                {aiActed && <span style={{fontSize:'0.48rem',color:'#22d49a',fontWeight:700}}>AI acted</span>}
                <span style={{fontSize:'0.6rem',color:'var(--wt-dim)'}}>{expanded?'▲':'▼'}</span>
              </div>
            </div>

            {/* Expanded detail */}
            {expanded && (
              <div style={{padding:'0 14px 14px 44px',borderTop:'1px solid var(--wt-border)'}}>
                {/* Demo AI triage */}
                {demoMode && alert.aiReasoning && (
                  <div style={{marginTop:12}}>
                    <div style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>AI Triage</div>
                    <div style={{fontSize:'0.76rem',color:'var(--wt-secondary)',lineHeight:1.7,marginBottom:8}}>{alert.aiReasoning}</div>
                    {/* AI cross-source correlation panel */}
                    <div style={{marginBottom:8,padding:'7px 10px',background:'rgba(79,143,255,0.05)',border:'1px solid #4f8fff20',borderRadius:7}}>
                      <div style={{fontSize:'0.58rem',fontWeight:700,color:'#4f8fff',marginBottom:5}}>✦ CORRELATED ACROSS SOURCES</div>
                      <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:5}}>
                        {[{src:alert.source||'EDR',c:'#f0405e'},{src:'Tenable Vuln Scan',c:'#00b3e3'},{src:'NCSC Threat Feed',c:'#22d49a'},{src:'ThreatFox IOCs',c:'#f0a030'}].map(({src,c})=>(
                          <span key={src} style={{fontSize:'0.56rem',padding:'1px 6px',borderRadius:3,background:`${c}12`,color:c,border:`1px solid ${c}25`,fontWeight:700}}>{src}</span>
                        ))}
                      </div>
                      <div style={{fontSize:'0.63rem',color:'var(--wt-muted)',lineHeight:1.55}}>
                        Verdict derived from <strong style={{color:'var(--wt-secondary)'}}>{alert.source}</strong> detection, cross-referenced with Tenable CVE exposure on <strong style={{color:'var(--wt-secondary)'}}>{alert.device||'this host'}</strong>, live NCSC advisories for your sector, and ThreatFox IOC database. Confidence {alert.confidence||'N/A'}%.
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
                {/* Live AI triage */}
                {!demoMode && (cached === undefined || (cached && cached.loading)) && (
                  <div style={{padding:'10px 0',fontSize:'0.72rem',color:'var(--wt-muted)',display:'flex',alignItems:'center',gap:8}}>
                    <span style={{width:10,height:10,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}}/>
                    AI triage running…
                  </div>
                )}
                {!demoMode && cached && cached.result && (
                  <div style={{marginTop:12,background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(34,201,146,0.03))',border:'1px solid #4f8fff20',borderRadius:10,overflow:'hidden'}}>
                    {/* Header */}
                    <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderBottom:'1px solid #4f8fff15'}}>
                      <span style={{fontSize:'0.6rem',fontWeight:800,color:'#4f8fff',letterSpacing:'0.5px'}}>✦ AI TRIAGE</span>
                      {aiVerdict && <span style={{fontSize:'0.6rem',fontWeight:800,padding:'1px 8px',borderRadius:4,background:`${aiVC}18`,color:aiVC,border:`1px solid ${aiVC}30`}}>{aiVerdict}{aiConf?' · '+aiConf+' confidence':''}</span>}
                      {/* Sources consulted */}
                      <div style={{display:'flex',gap:4,marginLeft:'auto',flexWrap:'wrap'}}>
                        {[{src:'Taegis',c:'#f0405e'},{src:'Tenable',c:'#00b3e3'},{src:'Intel',c:'#22d49a'},{src:'IOCs',c:'#f0a030'}].map(({src,c})=>(
                          <span key={src} style={{fontSize:'0.5rem',padding:'1px 5px',borderRadius:3,background:`${c}12`,color:c,fontWeight:700}}>{src}</span>
                        ))}
                      </div>
                    </div>
                    {/* Reasoning text - split on newlines for readability */}
                    <div style={{padding:'10px 12px'}}>
                      {aiText.split('\n').filter(s=>s.trim()).map((line,i,arr)=>(
                        <div key={i} style={{fontSize:'0.72rem',color:'var(--wt-secondary)',lineHeight:1.7,marginBottom:i<arr.length-1?6:0}}>{line.trim()}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
                  <button onClick={()=>setAlertOverrides(prev=>({...prev,[alert.id]:{...(prev[alert.id]||{}),verdict:'FP',confidence:99}}))}
                    style={{padding:'4px 12px',borderRadius:6,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    Mark FP
                  </button>
                  {setAlertSnoozes && <button onClick={()=>{
                    const dur=2*60*60*1000; // 2h
                    setAlertSnoozes(prev=>prev[alert.id]&&prev[alert.id]>Date.now()?{...prev,[alert.id]:undefined}:{...prev,[alert.id]:Date.now()+dur});
                  }} style={{padding:'4px 12px',borderRadius:6,border:'1px solid #8b6fff30',background:'#8b6fff10',color:'#8b6fff',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    {alertSnoozes&&alertSnoozes[alert.id]&&alertSnoozes[alert.id]>Date.now()?'Snoozed 💤':'Snooze 2h'}
                  </button>}
                  <button onClick={()=>setAlertOverrides(prev=>({...prev,[alert.id]:{...(prev[alert.id]||{}),acknowledged:!isAcknowledged}}))}
                    style={{padding:'4px 12px',borderRadius:6,border:`1px solid ${isAcknowledged?'#22d49a50':'#4f8fff30'}`,background:isAcknowledged?'#22d49a15':'#4f8fff10',color:isAcknowledged?'#22d49a':'#4f8fff',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    {isAcknowledged ? '✓ Acknowledged' : 'Acknowledge'}
                  </button>
                  <button onClick={()=>{
                    const inc={id:'INC-'+String(Date.now()).slice(-4),title:'Incident — '+alert.title,severity:alert.severity,status:'Active',created:new Date().toLocaleString(),updated:new Date().toLocaleString(),alertCount:1,devices:alert.device?[alert.device]:[],mitreTactics:alert.mitre?[alert.mitre]:[],aiSummary:'Incident from: '+alert.title,alerts:[alert.id]};
                    setCreatedIncidents(prev=>[inc,...prev]);
                    setActiveTab('incidents');
                  }} style={{padding:'4px 12px',borderRadius:6,border:'1px solid #8b6fff30',background:'#8b6fff10',color:'#8b6fff',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    Create Incident
                  </button>
                </div>

                {/* Notes */}
                <div style={{marginTop:12}}>
                  <div style={{fontSize:'0.58rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Analyst Notes</div>
                  {editingNote===alert.id ? (
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      <textarea value={noteInput} onChange={e=>setNoteInput(e.target.value)}
                        rows={3} placeholder="Add a note…"
                        style={{width:'100%',padding:'8px 10px',background:'var(--wt-card2)',border:'1px solid #4f8fff40',borderRadius:7,color:'var(--wt-text)',fontSize:'0.76rem',fontFamily:'Inter,sans-serif',outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
                      <div style={{display:'flex',gap:6}}>
                        <button onClick={()=>{
                          if(noteInput.trim()){
                            setAlertNotes(prev=>({...prev,[alert.id]:noteInput.trim()}));
                            fetch('/api/alert-notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({alertId:alert.id,note:noteInput.trim()})}).catch(()=>{});
                          } else {
                            const n={...alertNotes}; delete n[alert.id]; setAlertNotes(n);
                            fetch('/api/alert-notes',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({alertId:alert.id})}).catch(()=>{});
                          }
                          setEditingNote(null); setNoteInput('');
                        }} style={{padding:'4px 12px',borderRadius:6,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Save</button>
                        <button onClick={()=>{setEditingNote(null);setNoteInput('');}}
                          style={{padding:'4px 10px',borderRadius:6,border:'1px solid var(--wt-border)',background:'none',color:'var(--wt-muted)',fontSize:'0.68rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Cancel</button>
                        {alertNotes[alert.id] && (
                          <button onClick={()=>{const n={...alertNotes};delete n[alert.id];setAlertNotes(n);setEditingNote(null);setNoteInput('');}}
                            style={{padding:'4px 10px',borderRadius:6,border:'1px solid #f0405e30',background:'none',color:'#f0405e',fontSize:'0.68rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Delete</button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                      {alertNotes[alert.id] ? (
                        <div style={{flex:1,fontSize:'0.76rem',color:'var(--wt-secondary)',lineHeight:1.65,padding:'7px 10px',background:'#f0a03008',border:'1px solid #f0a03020',borderRadius:7,fontStyle:'italic'}}>
                          "{alertNotes[alert.id]}"
                        </div>
                      ) : (
                        <span style={{fontSize:'0.72rem',color:'var(--wt-dim)'}}>No notes</span>
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
            Showing {alertPageClamped*ALERT_PAGE_SIZE+1}–{Math.min((alertPageClamped+1)*ALERT_PAGE_SIZE,alertsSorted.length)} of {alertsSorted.length} alerts
          </span>
          <div style={{display:'flex',gap:4}}>
            <button disabled={alertPageClamped===0} onClick={()=>setAlertPage(alertPageClamped-1)}
              style={{padding:'4px 12px',borderRadius:6,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:alertPageClamped===0?'var(--wt-dim)':'var(--wt-text)',fontSize:'0.72rem',cursor:alertPageClamped===0?'not-allowed':'pointer',fontFamily:'Inter,sans-serif'}}>
              Prev
            </button>
            {Array.from({length:Math.min(alertTotalPages,5)},(_,i)=>{
              const p = alertTotalPages<=5 ? i : Math.max(0,Math.min(alertPageClamped-2,alertTotalPages-5))+i;
              return (
                <button key={p} onClick={()=>setAlertPage(p)}
                  style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${p===alertPageClamped?'#4f8fff':'var(--wt-border2)'}`,background:p===alertPageClamped?'#4f8fff15':'var(--wt-card2)',color:p===alertPageClamped?'#4f8fff':'var(--wt-text)',fontSize:'0.72rem',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:p===alertPageClamped?700:400}}>
                  {p+1}
                </button>
              );
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
