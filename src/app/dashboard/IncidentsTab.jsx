'use client';
import React from 'react';

const SevBadge = ({ sev }) => {
  const c = { Critical:'#f0405e', High:'#f97316', Medium:'#f0a030', Low:'#4f8fff' }[sev] || '#6b7a94';
  return <span style={{ fontSize:'0.5rem', fontWeight:800, padding:'1px 5px', borderRadius:3, color:c, background:`${c}18`, border:`1px solid ${c}30`, textTransform:'uppercase', letterSpacing:'0.5px' }}>{sev}</span>;
};

export default function IncidentsTab({
  userTier, isAdmin, selectedIncident, setSelectedIncident, incidentStatuses, setIncidentStatuses, deletedIncidents, incidentNotes, setIncidentNotes, addingNoteTo, setAddingNoteTo, noteInput, setNoteInput, alerts, incidents, closeIncident, deleteIncident
}) {
  const [investResults, setInvestResults] = React.useState({});
  const [investLoading, setInvestLoading] = React.useState(new Set());
  const [showInvest, setShowInvest] = React.useState(new Set());
  const canTeam = userTier !== 'community';

  function runInvestigation(inc) {
    if (investResults[inc.id] || investLoading.has(inc.id)) return;
    setInvestLoading(prev => new Set([...prev, inc.id]));
    const incAlerts = alerts.filter(a => inc.alerts?.includes(a.id));
    fetch('/api/investigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incidentId: inc.id, title: inc.title, severity: inc.severity,
        alerts: incAlerts.map(a => ({ title: a.title, source: a.source, device: a.device, mitre: a.mitre, verdict: a.verdict, time: a.time })),
        devices: inc.devices, mitreTactics: inc.mitreTactics, aiSummary: inc.aiSummary,
      }),
    }).then(r => r.json()).then(d => {
      if (d.ok && d.result) setInvestResults(prev => ({ ...prev, [inc.id]: d.result }));
    }).catch(() => {}).finally(() => {
      setInvestLoading(prev => { const n = new Set(prev); n.delete(inc.id); return n; });
    });
  }

  return (
    <div>
      <GateWall feature='Incident Management' requiredTier='team' userTier={userTier} isAdmin={isAdmin}>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Incidents</h2>
            <span style={{fontSize:'0.62rem',color:'#f0405e',background:'#f0405e12',padding:'2px 8px',borderRadius:4}}>{incidents.filter(i=>i.status==='Active').length} Active</span>
          </div>
          {incidents.filter(inc=>!deletedIncidents.has(inc.id)).map(inc=>{
            const isSel = selectedIncident?.id===inc.id;
            const incStatus = incidentStatuses[inc.id] || inc.status;
            const statusColor = incStatus==='Active'?'#f0405e':incStatus==='Contained'?'#f0a030':incStatus==='Escalated'?'#8b6fff':'#22d49a';
            const investigation = investResults[inc.id];
            const investigating = investLoading.has(inc.id);
            const showingInvest = showInvest.has(inc.id);
            return (
              <div key={inc.id} style={{background:'var(--wt-card)',border:`1px solid ${isSel?'#4f8fff40':'var(--wt-border)'}`,borderRadius:12,overflow:'hidden'}}>
                <div style={{padding:'12px 16px',cursor:'pointer',display:'flex',alignItems:'flex-start',gap:12}} onClick={()=>setSelectedIncident(isSel?null:inc)}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:'0.62rem',fontWeight:800,color:'#4f8fff',fontFamily:'JetBrains Mono,monospace'}}>{inc.id}</span>
                      <span style={{fontSize:'0.52rem',fontWeight:700,padding:'2px 7px',borderRadius:3,background:`${statusColor}15`,color:statusColor,border:`1px solid ${statusColor}25`}}>{incStatus.toUpperCase()}</span>
                      <SevBadge sev={inc.severity} />
                      {investigation && <span style={{fontSize:'0.5rem',fontWeight:700,padding:'1px 6px',borderRadius:3,background:'#8b6fff18',color:'#8b6fff',border:'1px solid #8b6fff25'}}>✦ Investigated</span>}
                    </div>
                    <div style={{fontSize:'0.84rem',fontWeight:700,marginBottom:4}}>{inc.title}</div>
                    <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                      {inc.mitreTactics.map(t=><span key={t} style={{fontSize:'0.52rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{t}</span>)}
                      <span style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>{inc.alertCount} alerts · {inc.devices.length} devices</span>
                      <span style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>Updated {inc.updated.split(' ')[1]}</span>
                    </div>
                  </div>
                  <span style={{fontSize:'0.7rem',color:'var(--wt-dim)',flexShrink:0}}>{isSel?'▲':'▼'}</span>
                </div>
                {isSel && (
                  <div style={{borderTop:'1px solid #1d2535',padding:'14px 16px'}}>
                    <GateWall feature='AI Attack Narrative' requiredTier='team' userTier={userTier} isAdmin={isAdmin}>
                      <div style={{fontSize:'0.74rem',color:'var(--wt-secondary)',lineHeight:1.65,padding:'10px',background:'linear-gradient(135deg,rgba(79,143,255,0.04),rgba(34,201,146,0.04))',border:'1px solid #4f8fff15',borderRadius:8,marginBottom:12}}>
                        <span style={{fontSize:'0.6rem',fontWeight:700,color:'#4f8fff',display:'block',marginBottom:4}}>AI ATTACK NARRATIVE</span>
                        {inc.aiSummary}
                      </div>
                    </GateWall>
                    <div style={{fontSize:'0.62rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Attack Timeline</div>
                    <div style={{display:'flex',flexDirection:'column',gap:0}}>
                      {inc.timeline.map((event,i)=>(
                        <div key={i} style={{display:'flex',gap:0,padding:'5px 0'}}>
                          <div style={{display:'flex',flexDirection:'column',alignItems:'center',minWidth:50}}>
                            <span style={{fontSize:'0.6rem',fontFamily:'JetBrains Mono,monospace',color:'var(--wt-dim)',marginBottom:3}}>{event.t}</span>
                            <div style={{width:8,height:8,borderRadius:'50%',background:event.actor==='AI'?'#4f8fff':'#22d49a',flexShrink:0}} />
                            {i<inc.timeline.length-1&&<div style={{width:1,flex:1,background:'var(--wt-border)',minHeight:16,marginTop:2}} />}
                          </div>
                          <div style={{flex:1,paddingLeft:10,paddingBottom:8}}>
                            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:1}}>
                              <span style={{fontSize:'0.52rem',fontWeight:700,padding:'1px 5px',borderRadius:3,background:event.actor==='AI'?'#4f8fff15':'#22d49a15',color:event.actor==='AI'?'#4f8fff':'#22d49a'}}>{event.actor}</span>
                              <span style={{fontSize:'0.74rem',fontWeight:600}}>{event.action}</span>
                            </div>
                            <div style={{fontSize:'0.68rem',color:'var(--wt-muted)'}}>{event.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
                      <button onClick={()=>setAddingNoteTo(addingNoteTo===inc.id?null:inc.id)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid var(--wt-border2)',background:addingNoteTo===inc.id?'#4f8fff12':'transparent',color:'#8a9ab0',fontSize:'0.68rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>📝 Note</button>
                      {canTeam && <button onClick={()=>{if(!showingInvest){setShowInvest(prev=>{const n=new Set(prev);n.add(inc.id);return n;});runInvestigation(inc);}else{setShowInvest(prev=>{const n=new Set(prev);n.delete(inc.id);return n;});}}} style={{padding:'5px 12px',borderRadius:6,border:`1px solid ${showingInvest?'#8b6fff':'#8b6fff30'}`,background:showingInvest?'#8b6fff20':'#8b6fff0a',color:'#8b6fff',fontSize:'0.68rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>✦ {investigating?'Investigating…':'Deep Investigate'}</button>}
                      <button onClick={()=>setIncidentStatuses(prev=>({...prev,[inc.id]:'Escalated'}))} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #f0a03030',background:'#f0a03008',color:'#f0a030',fontSize:'0.68rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>⬆ Escalate</button>
                      <button onClick={()=>closeIncident(inc.id)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #22d49a30',background:'#22d49a0a',color:'#22d49a',fontSize:'0.68rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>✓ Close</button>
                      <button onClick={()=>deleteIncident(inc.id)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #f0405e25',background:'#f0405e0a',color:'#f0405e',fontSize:'0.68rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>🗑 Delete</button>
                    </div>
                    {showingInvest && (
                      <div style={{marginTop:14,background:'linear-gradient(135deg,rgba(139,111,255,0.05),rgba(79,143,255,0.03))',border:'1px solid #8b6fff25',borderRadius:12,overflow:'hidden'}}>
                        <div style={{padding:'10px 14px',borderBottom:'1px solid #8b6fff15',display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:'0.64rem',fontWeight:800,color:'#8b6fff',letterSpacing:'0.5px'}}>✦ TIER 2/3 DEEP INVESTIGATION</span>
                          {investigation && <span style={{fontSize:'0.56rem',color:'var(--wt-muted)',marginLeft:'auto'}}>AI-generated · verify with your tools</span>}
                        </div>
                        {investigating && <div style={{padding:'14px',fontSize:'0.72rem',color:'var(--wt-muted)',display:'flex',alignItems:'center',gap:8}}><span style={{width:10,height:10,borderRadius:'50%',border:'2px solid #8b6fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}}/>Running deep investigation…</div>}
                        {investigation && (
                          <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:14}}>
                            {investigation.rootCause && <div><div style={{fontSize:'0.56rem',fontWeight:700,color:'#f0405e',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Root Cause</div><div style={{fontSize:'0.72rem',color:'var(--wt-secondary)',lineHeight:1.65}}>{investigation.rootCause}</div></div>}
                            {investigation.attackerObjective && <div><div style={{fontSize:'0.56rem',fontWeight:700,color:'#f97316',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Attacker Objective</div><div style={{fontSize:'0.72rem',color:'#f97316',padding:'5px 10px',background:'#f9731612',borderRadius:6}}>{investigation.attackerObjective}</div></div>}
                            {investigation.affectedScope && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><div><div style={{fontSize:'0.56rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',marginBottom:4}}>Users at Risk</div>{investigation.affectedScope.users?.map((u,i)=><div key={i} style={{fontSize:'0.64rem',color:'var(--wt-secondary)',marginBottom:1}}>👤 {u}</div>)}</div><div><div style={{fontSize:'0.56rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',marginBottom:4}}>Devices at Risk</div>{investigation.affectedScope.devices?.map((d,i)=><div key={i} style={{fontSize:'0.64rem',color:'var(--wt-secondary)',marginBottom:1}}>💻 {d}</div>)}</div></div>}
                            {investigation.attackTimeline?.length>0 && <div><div style={{fontSize:'0.56rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',marginBottom:6}}>Reconstructed Attack Timeline</div>{investigation.attackTimeline.map((ev,i)=>(<div key={i} style={{display:'flex',gap:8,padding:'5px 0',borderBottom:'1px solid var(--wt-border)',alignItems:'flex-start'}}><span style={{fontSize:'0.6rem',fontFamily:'JetBrains Mono,monospace',color:'#4f8fff',flexShrink:0,minWidth:36}}>{ev.time}</span><div style={{flex:1}}><div style={{fontSize:'0.66rem',fontWeight:600,color:'var(--wt-text)',marginBottom:1}}>{ev.event}</div><div style={{fontSize:'0.6rem',color:'var(--wt-dim)'}}>{ev.significance}</div></div><span style={{fontSize:'0.52rem',color:'#4f8fff',fontWeight:700,flexShrink:0,padding:'1px 5px',background:'#4f8fff12',borderRadius:3}}>{ev.source}</span></div>))}</div>}
                            {investigation.lateralMovementPaths?.length>0 && <div><div style={{fontSize:'0.56rem',fontWeight:700,color:'#f97316',textTransform:'uppercase',marginBottom:4}}>Lateral Movement Paths</div>{investigation.lateralMovementPaths.map((path,i)=><div key={i} style={{fontSize:'0.64rem',color:'#f97316',marginBottom:2}}>→ {path}</div>)}</div>}
                            {investigation.remediationSteps?.length>0 && <div><div style={{fontSize:'0.56rem',fontWeight:700,color:'#22d49a',textTransform:'uppercase',marginBottom:6}}>Remediation Plan</div>{investigation.remediationSteps.map((s,i)=>{const pc=s.priority==='Critical'?'#f0405e':s.priority==='High'?'#f97316':'#f0a030';return(<div key={i} style={{display:'flex',gap:8,padding:'5px 8px',background:`${pc}08`,borderRadius:6,border:`1px solid ${pc}20`,marginBottom:4}}><span style={{fontSize:'0.52rem',fontWeight:700,color:pc,padding:'1px 5px',background:`${pc}15`,borderRadius:3,flexShrink:0}}>{s.priority}</span><div><div style={{fontSize:'0.66rem',color:'var(--wt-text)',fontWeight:600}}>{s.action}</div><div style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>Owner: {s.owner}</div></div></div>);})}</div>}
                            {investigation.forensicCommands?.length>0 && <div><div style={{fontSize:'0.56rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',marginBottom:6}}>Forensic Commands</div>{investigation.forensicCommands.map((fc,i)=>(<div key={i} style={{marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}><span style={{fontSize:'0.56rem',color:'var(--wt-dim)',fontWeight:700}}>{fc.tool} — {fc.purpose}</span><button onClick={()=>navigator.clipboard?.writeText(fc.command)} style={{padding:'2px 7px',borderRadius:3,border:'1px solid #4f8fff30',background:'#4f8fff12',color:'#4f8fff',fontSize:'0.5rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Copy</button></div><code style={{display:'block',fontSize:'0.6rem',fontFamily:'JetBrains Mono,monospace',color:'#22c992',background:'#050810',padding:'6px 8px',borderRadius:5,wordBreak:'break-all',lineHeight:1.5}}>{fc.command}</code></div>))}</div>}
                            {investigation.iocs?.length>0 && <div><div style={{fontSize:'0.56rem',fontWeight:700,color:'#f0a030',textTransform:'uppercase',marginBottom:4}}>Extracted IOCs</div><div style={{display:'flex',flexWrap:'wrap',gap:4}}>{investigation.iocs.map((ioc,i)=>(<span key={i} style={{fontSize:'0.62rem',fontFamily:'JetBrains Mono,monospace',padding:'2px 7px',background:'#f0a03010',border:'1px solid #f0a03025',borderRadius:4,color:'#f0a030'}}>{ioc}</span>))}</div></div>}
                            {investigation.detectionGaps?.length>0 && <div><div style={{fontSize:'0.56rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',marginBottom:4}}>Detection Gaps Found</div>{investigation.detectionGaps.map((g,i)=><div key={i} style={{fontSize:'0.62rem',color:'var(--wt-muted)',marginBottom:2}}>⚠️ {g}</div>)}</div>}
                          </div>
                        )}
                      </div>
                    )}
                    {addingNoteTo===inc.id && <div style={{marginTop:8,display:'flex',gap:6}}><input value={noteInput} onChange={e=>setNoteInput(e.target.value)} placeholder='Type a note...' style={{flex:1,padding:'6px 10px',borderRadius:6,border:'1px solid var(--wt-border2)',background:'var(--wt-card)',color:'var(--wt-text)',fontSize:'0.74rem',fontFamily:'Inter,sans-serif',outline:'none'}} /><button onClick={()=>{if(noteInput.trim()){setIncidentNotes(prev=>({...prev,[inc.id]:[...(prev[inc.id]||[]),{text:noteInput.trim(),time:new Date().toLocaleTimeString()}]}));setNoteInput('');setAddingNoteTo(null);}}} style={{padding:'6px 12px',borderRadius:6,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.7rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Save</button></div>}
                    {incidentNotes[inc.id]?.length>0 && <div style={{marginTop:8}}><div style={{fontSize:'0.6rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',marginBottom:4}}>Notes</div>{incidentNotes[inc.id].map((n,ni)=>(<div key={ni} style={{fontSize:'0.7rem',color:'var(--wt-secondary)',padding:'5px 8px',background:'var(--wt-card2)',borderRadius:5,marginBottom:3,display:'flex',justifyContent:'space-between',gap:8}}><span>{n.text}</span><span style={{color:'var(--wt-dim)',flexShrink:0,fontSize:'0.6rem'}}>{n.time}</span></div>))}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GateWall>
    </div>
  );
}
