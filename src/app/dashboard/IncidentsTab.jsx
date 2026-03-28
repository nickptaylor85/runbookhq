'use client';
import React from 'react';

export default function IncidentsTab({
  userTier, isAdmin, selectedIncident, setSelectedIncident, incidentStatuses, setIncidentStatuses, deletedIncidents, incidentNotes, setIncidentNotes, addingNoteTo, setAddingNoteTo, noteInput, setNoteInput, alerts, incidents, closeIncident, deleteIncident
}) {
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
                const incStatus = incidentStatuses[inc.id] || inc.status; const statusColor = incStatus==='Active'?'#f0405e':incStatus==='Contained'?'#f0a030':'#22d49a';
                return (
                  <div key={inc.id} style={{background:'var(--wt-card)',border:`1px solid ${isSel?'#4f8fff40':'var(--wt-border)'}`,borderRadius:12,overflow:'hidden'}}>
                    <div style={{padding:'12px 16px',cursor:'pointer',display:'flex',alignItems:'flex-start',gap:12}} onClick={()=>setSelectedIncident(isSel?null:inc)}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <span style={{fontSize:'0.62rem',fontWeight:800,color:'#4f8fff',fontFamily:'JetBrains Mono,monospace'}}>{inc.id}</span>
                          <span style={{fontSize:'0.52rem',fontWeight:700,padding:'2px 7px',borderRadius:3,background:`${statusColor}15`,color:statusColor,border:`1px solid ${statusColor}25`}}>{incStatus.toUpperCase()}</span>
                          <SevBadge sev={inc.severity} />
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
                          <button onClick={()=>setAddingNoteTo(addingNoteTo===inc.id?null:inc.id)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid var(--wt-border2)',background:addingNoteTo===inc.id?'#4f8fff12':'transparent',color:'#8a9ab0',fontSize:'0.68rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>📝 Add Note</button>
                          <button onClick={()=>setIncidentStatuses(prev=>({...prev,[inc.id]:'Escalated'}))} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #f0a03030',background:'#f0a03008',color:'#f0a030',fontSize:'0.68rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>⬆ Escalate</button>
                          <button onClick={()=>closeIncident(inc.id)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #22d49a30',background:'#22d49a0a',color:'#22d49a',fontSize:'0.68rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>✓ Close</button>
                          <button onClick={()=>deleteIncident(inc.id)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #f0405e25',background:'#f0405e0a',color:'#f0405e',fontSize:'0.68rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>🗑 Delete</button>
                        </div>
                        {addingNoteTo===inc.id && (
                          <div style={{marginTop:8,display:'flex',gap:6}}>
                            <input value={noteInput} onChange={e=>setNoteInput(e.target.value)} placeholder='Type a note...' style={{flex:1,padding:'6px 10px',borderRadius:6,border:'1px solid var(--wt-border2)',background:'var(--wt-card)',color:'var(--wt-text)',fontSize:'0.74rem',fontFamily:'Inter,sans-serif',outline:'none'}} />
                            <button onClick={()=>{if(noteInput.trim()){setIncidentNotes(prev=>({...prev,[inc.id]:[...(prev[inc.id]||[]),{text:noteInput.trim(),time:new Date().toLocaleTimeString()}]}));setNoteInput('');setAddingNoteTo(null);}}} style={{padding:'6px 12px',borderRadius:6,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.7rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Save</button>
                          </div>
                        )}
                        {incidentNotes[inc.id] && incidentNotes[inc.id].length>0 && (
                          <div style={{marginTop:8}}>
                            <div style={{fontSize:'0.6rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Notes</div>
                            {incidentNotes[inc.id].map((n,ni)=>(
                              <div key={ni} style={{fontSize:'0.7rem',color:'var(--wt-secondary)',padding:'5px 8px',background:'var(--wt-card2)',borderRadius:5,marginBottom:3,display:'flex',justifyContent:'space-between',gap:8}}>
                                <span>{n.text}</span><span style={{color:'var(--wt-dim)',flexShrink:0,fontSize:'0.6rem'}}>{n.time}</span>
                              </div>
                            ))}
                          </div>
                        )}
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
