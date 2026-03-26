'use client';
import React from 'react';

export default function OverviewTab({
  setSelectedIncident, incidentStatuses, setModal, setActiveTab, alerts, vulns, incidents, tools, activeTools, critAlerts, tpAlerts, fpAlerts, critVulns, kevVulns, coveredPct, totalDevices, gapDevices
}) {
  return (
    <>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>

              {/* AI Brief */}
              <div style={{padding:'12px 16px',background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(34,201,146,0.05))',border:'1px solid #4f8fff18',borderRadius:12,display:'flex',alignItems:'flex-start',gap:10}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:'#4f8fff',boxShadow:'0 0 8px #4f8fff',flexShrink:0,marginTop:2,animation:'pulse 3s ease infinite'}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff',marginBottom:3}}>AI SHIFT BRIEF — {new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div>
                  <div style={{fontSize:'0.78rem',color:'var(--wt-secondary)',lineHeight:1.65}}>Processed {alerts.length} alerts this session. Auto-closed {fpAlerts.length} false positives. Escalated {tpAlerts.length} true positives to incidents. <strong style={{color:'#f0405e'}}>{critAlerts.length} critical alerts</strong> require immediate attention. Estate coverage at {coveredPct}% — {gapDevices.length} devices missing agents.</div>
                </div>
                <span style={{fontSize:'0.62rem',color:'#22d49a',fontWeight:700,background:'#22d49a12',padding:'3px 8px',borderRadius:4,flexShrink:0}}>AI Active</span>
              </div>

              {/* Estate Health 2×2 */}
              <div>
                <div style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Estate Health</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>

                  {/* Devices + Gaps */}
                  <div onClick={()=>setModal({type:'gaps'})} style={{padding:16,background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12,cursor:'pointer',transition:'border-color .15s'}}
                    onMouseEnter={e=>(e.currentTarget).style.borderColor='#4f8fff40'}
                    onMouseLeave={e=>(e.currentTarget).style.borderColor='var(--wt-border)'}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:2}}>Devices</div>
                        <div style={{fontSize:'2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',letterSpacing:-2,color:'var(--wt-text)'}}>{totalDevices}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',marginBottom:2}}>{gapDevices.length} with gaps</div>
                        <div style={{fontSize:'0.52rem',color:'var(--wt-dim)'}}>Click to view →</div>
                      </div>
                    </div>
                    <div style={{height:6,background:'var(--wt-border)',borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',background:'linear-gradient(90deg,#22d49a,#4f8fff)',borderRadius:3,width:`${coveredPct}%`,transition:'width 1s'}} />
                    </div>
                    <div style={{fontSize:'0.6rem',color:'var(--wt-muted)',marginTop:4}}>{coveredPct}% agent coverage</div>
                  </div>

                  {/* Tool Status */}
                  <div onClick={()=>setModal({type:'tools'})} style={{padding:16,background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12,cursor:'pointer',transition:'border-color .15s'}}
                    onMouseEnter={e=>(e.currentTarget).style.borderColor='#4f8fff40'}
                    onMouseLeave={e=>(e.currentTarget).style.borderColor='var(--wt-border)'}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:2}}>Tool Status</div>
                        <div style={{fontSize:'2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',letterSpacing:-2,color:'#22d49a'}}>{activeTools.length}<span style={{fontSize:'1rem',color:'var(--wt-dim)'}}>/{tools.length}</span></div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.62rem',fontWeight:700,color:tools.filter(t=>!t.active).length>0?'#f0a030':'#22d49a',marginBottom:2}}>{tools.filter(t=>!t.active).length} inactive</div>
                        <div style={{fontSize:'0.52rem',color:'var(--wt-dim)'}}>Click to manage →</div>
                      </div>
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {tools.map(t=>(
                        <span key={t.id} style={{fontSize:'0.52rem',fontWeight:600,padding:'2px 7px',borderRadius:4,background:t.active?'#22d49a12':'#f0a03012',color:t.active?'#22d49a':'#f0a030',border:`1px solid ${t.active?'#22d49a20':'#f0a03020'}`}}>{t.name}</span>
                      ))}
                    </div>
                  </div>

                  {/* Alert Sources */}
                  <div onClick={()=>setModal({type:'alerts-ingested'})} style={{padding:16,background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12,cursor:'pointer',transition:'border-color .15s'}}
                    onMouseEnter={e=>(e.currentTarget).style.borderColor='#4f8fff40'}
                    onMouseLeave={e=>(e.currentTarget).style.borderColor='var(--wt-border)'}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:2}}>Alerts Ingested</div>
                        <div style={{fontSize:'2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',letterSpacing:-2,color:'#4f8fff'}}>{alerts.length}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',marginBottom:2}}>{critAlerts.length} critical</div>
                        <div style={{fontSize:'0.52rem',color:'var(--wt-dim)'}}>Click for AI detail →</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      {[{l:'TP',v:tpAlerts.length,c:'#f0405e'},{l:'FP',v:fpAlerts.length,c:'#22d49a'},{l:'SUS',v:alerts.filter(a=>a.verdict==='SUS').length,c:'#f0a030'}].map(s=>(
                        <div key={s.l} style={{flex:1,textAlign:'center',padding:'4px 0',background:'var(--wt-bg)',borderRadius:6}}>
                          <div style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.c}}>{s.v}</div>
                          <div style={{fontSize:'0.5rem',color:'var(--wt-dim)',fontWeight:700}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vulns / SLA */}
                  <div onClick={()=>setActiveTab('vulns')} style={{padding:16,background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12,cursor:'pointer',transition:'border-color .15s'}}
                    onMouseEnter={e=>(e.currentTarget).style.borderColor='#4f8fff40'}
                    onMouseLeave={e=>(e.currentTarget).style.borderColor='var(--wt-border)'}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:2}}>Vulnerabilities</div>
                        <div style={{fontSize:'2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',letterSpacing:-2,color:'#f0405e'}}>{vulns.length}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',marginBottom:2}}>{kevVulns.length} KEV — patch now</div>
                        <div style={{fontSize:'0.52rem',color:'var(--wt-dim)'}}>Click for details →</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      {[{l:'Crit',v:critVulns.length,c:'#f0405e'},{l:'High',v:vulns.filter(v=>v.severity==='High').length,c:'#f97316'},{l:'Med',v:vulns.filter(v=>v.severity==='Medium').length,c:'#f0a030'}].map(s=>(
                        <div key={s.l} style={{flex:1,textAlign:'center',padding:'4px 0',background:'var(--wt-bg)',borderRadius:6}}>
                          <div style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.c}}>{s.v}</div>
                          <div style={{fontSize:'0.5rem',color:'var(--wt-dim)',fontWeight:700}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Row */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {/* Recent Alerts */}
                <div style={{padding:'14px 16px',background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                    <div style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'1px',flex:1}}>Recent Alerts</div>
                    <button onClick={()=>setActiveTab('alerts')} style={{fontSize:'0.58rem',color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:600}}>View all →</button>
                  </div>
                  {alerts.slice(0,4).map(a=>(
                    <div key={a.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:'1px solid var(--wt-border)'}}>
                      <div style={{width:4,height:24,borderRadius:2,background:SEV_COLOR[a.severity],flexShrink:0}} />
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'0.72rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.title}</div>
                        <div style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>{a.source} · {a.device} · {a.time}</div>
                      </div>
                      <span style={{fontSize:'0.52rem',fontWeight:700,padding:'1px 5px',borderRadius:3,background:VERDICT_STYLE[a.verdict].bg,color:VERDICT_STYLE[a.verdict].c,flexShrink:0}}>{a.verdict}</span>
                    </div>
                  ))}
                </div>
                {/* Active Incidents */}
                <div style={{padding:'14px 16px',background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                    <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',textTransform:'uppercase',letterSpacing:'1px',flex:1}}>Active Incidents</div>
                    <button onClick={()=>setActiveTab('incidents')} style={{fontSize:'0.58rem',color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:600}}>View all →</button>
                  </div>
                  {incidents.filter(i=>(incidentStatuses[i.id]||i.status)!=='Closed').slice(0,3).map(inc=>(
                    <div key={inc.id} onClick={()=>{setActiveTab('incidents');setSelectedIncident(inc);}} style={{padding:'6px 0',borderBottom:'1px solid var(--wt-border)',cursor:'pointer'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                        <span style={{fontSize:'0.6rem',fontWeight:700,color:'#4f8fff',fontFamily:'JetBrains Mono,monospace'}}>{inc.id}</span>
                        <SevBadge sev={inc.severity} />
                        <span style={{fontSize:'0.52rem',padding:'1px 5px',borderRadius:3,background:'#f0405e12',color:'#f0405e',fontWeight:700,border:'1px solid #f0405e20'}}>{(incidentStatuses[inc.id]||inc.status).toUpperCase()}</span>
                      </div>
                      <div style={{fontSize:'0.7rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{inc.title}</div>
                      <div style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>{inc.alertCount} alerts · {inc.devices.length} devices</div>
                    </div>
                  ))}
                  {incidents.filter(i=>(incidentStatuses[i.id]||i.status)!=='Closed').length===0 && (
                    <div style={{fontSize:'0.72rem',color:'var(--wt-muted)',padding:'12px 0',textAlign:'center'}}>✓ No active incidents</div>
                  )}
                </div>
              </div>

              {/* Top Active Threats */}
              <div style={{padding:'14px 16px',background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                  <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0a030',textTransform:'uppercase',letterSpacing:'1px',flex:1}}>🔥 Top Threats Right Now</div>
                  <button onClick={()=>setActiveTab('intel')} style={{fontSize:'0.58rem',color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:600}}>View intel →</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  {[
                    {title:'CVE-2024-21413',desc:'Outlook NTLM — CISA KEV',color:'#f0405e',badge:'CRITICAL'},
                    {title:'TA505 Active',desc:'Cobalt Strike campaign — fin. sector',color:'#f0a030',badge:'HIGH'},
                    {title:'LockBit 3.0',desc:'New infra post-takedown',color:'#f0a030',badge:'HIGH'},
                  ].map(t=>(
                    <div key={t.title} style={{padding:'8px 10px',background:'var(--wt-card2)',border:`1px solid ${t.color}18`,borderRadius:8}}>
                      <div style={{fontSize:'0.52rem',fontWeight:800,color:t.color,marginBottom:3}}>{t.badge}</div>
                      <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:2}}>{t.title}</div>
                      <div style={{fontSize:'0.6rem',color:'var(--wt-muted)'}}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Posture */}
              <div style={{display:'flex',alignItems:'center',gap:12,padding:16,background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12}}>
                <div style={{position:'relative',width:64,height:64,flexShrink:0}}>
                  <svg viewBox='0 0 100 100' style={{width:'100%',height:'100%'}}>
                    <circle cx={50} cy={50} r={42} fill='none' stroke='var(--wt-border)' strokeWidth={8} />
                    <circle cx={50} cy={50} r={42} fill='none' stroke={postureColor} strokeWidth={8} strokeDasharray={`${(posture/100)*264} 264`} strokeLinecap='round' transform='rotate(-90 50 50)' style={{transition:'stroke-dasharray 1s ease'}} />
                  </svg>
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-60%)',fontSize:'1.2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:postureColor}}>{posture}</div>
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,45%)',fontSize:'0.6rem',fontWeight:800,color:postureColor}}>C+</div>
                </div>
                <div>
                  <div style={{fontSize:'0.82rem',fontWeight:700,marginBottom:3}}>Security Posture</div>
                  <div style={{fontSize:'0.74rem',color:'var(--wt-muted)',lineHeight:1.6}}>{critAlerts.length} critical alerts active · {kevVulns.length} KEV patches outstanding · {gapDevices.length} devices uncovered</div>
                  <div style={{fontSize:'0.64rem',color:'#f0a030',marginTop:4}}>⚠ Under pressure — address critical alerts and KEV patches to improve grade</div>
                </div>
              </div>
</div></div></div></div>
    </>
  );
}
