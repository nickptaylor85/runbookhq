'use client';
import React from 'react';

export default function IntelTab({
  industry, userTier, intelLoading, expandedIntel, iocQueryLoading, setIocQueryLoading, iocQueries, setIocQueries, activeTab, allIntel, INDUSTRIES, toggleIntel, fetchIntelForIndustry, GateWall, SevBadge, RemediationOutput
}) {
  return (
    <>
          {activeTab==='intel' && (
            <GateWall feature='Threat Intelligence' requiredTier='team' userTier={userTier}>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Threat Intelligence</h2>
                <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:'auto'}}>
                  <span style={{fontSize:'0.7rem',color:'var(--wt-muted)'}}>Industry:</span>
                  <select value={industry} onChange={e=>{setIndustryPersisted(e.target.value);fetchIntelForIndustry(e.target.value);}} style={{padding:'4px 10px',borderRadius:6,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:'var(--wt-text)',fontSize:'0.76rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
                  </select>
                  {intelLoading && <span style={{width:14,height:14,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}} />}
                </div>
              </div>

              {/* Industry-specific intel first */}
              <div>
                <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>
                  {industry} — Active Threats
                </div>
                {allIntel.filter(i=>i.industrySpecific).map(item=>{
                  const isExpanded = expandedIntel.has(item.id);
                  return (
                  <div key={item.id} style={{background:'#0a0206',border:`1px solid ${isExpanded?'#f0405e30':'#f0405e18'}`,borderRadius:10,marginBottom:6,overflow:'hidden'}}>
                    <div style={{padding:'12px 14px',cursor:'pointer'}} onClick={()=>toggleIntel(item.id)}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                            <SevBadge sev={item.severity} />
                            <span style={{fontSize:'0.78rem',fontWeight:700}}>{item.title}</span>
                          </div>
                          <div style={{fontSize:'0.74rem',color:'var(--wt-secondary)',lineHeight:1.65,marginBottom:6}}>{item.summary}</div>
                          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                            <span style={{fontSize:'0.58rem',color:'#4f8fff'}}>{item.source}</span>
                            <span style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>{item.time}</span>
                            {item.mitre && <span style={{fontSize:'0.52rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{item.mitre}</span>}
                            {item.iocs && item.iocs.length>0 && <span style={{fontSize:'0.58rem',fontWeight:700,color:'#f0a030',background:'#f0a03012',padding:'1px 6px',borderRadius:3,border:'1px solid #f0a03025'}}>{item.iocs.length} IOCs — click to view</span>}
                            <a href={item.url || `https://www.ncsc.gov.uk/search?q=${encodeURIComponent(item.title)}`} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{fontSize:'0.52rem',color:'#4f8fff',textDecoration:'none',padding:'1px 6px',border:'1px solid #4f8fff20',borderRadius:3,background:'#4f8fff0a'}}>Read article →</a>
                          </div>
                        </div>
                        <span style={{fontSize:'0.7rem',color:'var(--wt-dim)',flexShrink:0}}>{isExpanded?'▲':'▼'}</span>
                      </div>
                    </div>
                    {isExpanded && item.iocs && item.iocs.length>0 && (
                      <div style={{padding:'10px 14px 14px',borderTop:'1px solid #f0405e15',background:'#07010a'}}>
                        <div style={{fontSize:'0.6rem',fontWeight:700,color:'#f0a030',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Indicators of Compromise</div>
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {item.iocs.map(ioc=>(
                            <div key={ioc} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',background:'#0d0208',border:'1px solid #1e1010',borderRadius:6}}>
                              <span style={{width:6,height:6,borderRadius:'50%',background:'#f0a030',flexShrink:0}} />
                              <code style={{fontSize:'0.68rem',fontFamily:'JetBrains Mono,monospace',color:'#f0c070',flex:1,wordBreak:'break-all'}}>{ioc}</code>
                              <button onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(ioc);}} style={{fontSize:'0.54rem',padding:'2px 7px',borderRadius:3,border:'1px solid #f0a03025',background:'transparent',color:'#f0a030',cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Copy</button>
                            </div>
                          ))}
                        </div>
                        {item.mitre && (
                          <div style={{marginTop:10,display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontSize:'0.6rem',color:'var(--wt-dim)'}}>MITRE ATT&CK:</span>
                            <a href={`https://attack.mitre.org/techniques/${item.mitre.split('.').join('/')}/`} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{fontSize:'0.66rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'#7c6aff',textDecoration:'none',padding:'2px 8px',border:'1px solid #7c6aff25',borderRadius:3,background:'#7c6aff10'}}>{item.mitre} →</a>
                          </div>
                        )}
                        {item.iocs && item.iocs.length>0 && (
                          <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid #f0a03015'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                              <span style={{fontSize:'0.6rem',fontWeight:700,color:'#22d49a',textTransform:'uppercase',letterSpacing:'0.5px'}}>🔍 Hunt in your environment</span>
                              <button onClick={e=>{e.stopPropagation();setIocQueryLoading(item.id);fetch('/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Generate detection queries to hunt for these IOCs in a corporate environment: '+item.iocs.join(', ')+'. Provide: SPLUNK QUERY (SPL), MICROSOFT SENTINEL KQL, and MICROSOFT DEFENDER ADVANCED HUNTING queries. Each labelled clearly. No markdown, plain text only.'})}).then(r=>r.json()).then(d=>{setIocQueries(prev=>({...prev,[item.id]:d.response||''}));setIocQueryLoading(null);}).catch(()=>setIocQueryLoading(null));}} disabled={iocQueryLoading===item.id} style={{padding:'3px 10px',borderRadius:5,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.6rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:4}}>
                                {iocQueryLoading===item.id ? <span style={{display:'inline-flex',alignItems:'center',gap:4}}><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',border:'2px solid #22d49a',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}}/>Generating...</span> : <span>✦ Generate Hunt Queries</span>}
                              </button>
                              {iocQueries[item.id] && <button onClick={e=>{e.stopPropagation();setIocQueries(prev=>{const n={...prev};delete n[item.id];return n;});}} style={{padding:'2px 7px',borderRadius:4,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-dim)',fontSize:'0.56rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Clear</button>}
                            </div>
                            {iocQueries[item.id] && <RemediationOutput text={iocQueries[item.id]} />}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>

              {/* General intel */}
              <div>
                <div style={{fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>General Intelligence</div>
                {allIntel.filter(i=>!i.industrySpecific).map(item=>{
                  const isExpanded = expandedIntel.has(item.id);
                  return (
                  <div key={item.id} style={{background:'var(--wt-card)',border:`1px solid ${isExpanded?'#4f8fff30':'var(--wt-border)'}`,borderRadius:10,marginBottom:6,overflow:'hidden'}}>
                    <div style={{padding:'12px 14px',cursor:'pointer'}} onClick={()=>toggleIntel(item.id)}>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                        <SevBadge sev={item.severity} />
                        <span style={{fontSize:'0.78rem',fontWeight:700,flex:1}}>{item.title}</span>
                        <span style={{fontSize:'0.7rem',color:'var(--wt-dim)',flexShrink:0}}>{isExpanded?'▲':'▼'}</span>
                      </div>
                      <div style={{fontSize:'0.74rem',color:'var(--wt-secondary)',lineHeight:1.65,marginBottom:6}}>{item.summary}</div>
                      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                        <span style={{fontSize:'0.58rem',color:'#4f8fff'}}>{item.source}</span>
                        <span style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>{item.time}</span>
                        {item.iocs && item.iocs.length>0 && <span style={{fontSize:'0.58rem',fontWeight:700,color:'#f0a030',background:'#f0a03012',padding:'1px 6px',borderRadius:3,border:'1px solid #f0a03025'}}>{item.iocs.length} IOCs</span>}
                        {item.mitre && <span style={{fontSize:'0.52rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{item.mitre}</span>}
                      </div>
                    </div>
                    {isExpanded && item.iocs && item.iocs.length>0 && (
                      <div style={{padding:'10px 14px 14px',borderTop:'1px solid var(--wt-border)',background:'var(--wt-card2)'}}>
                        <div style={{fontSize:'0.6rem',fontWeight:700,color:'#f0a030',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Indicators of Compromise</div>
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {item.iocs.map(ioc=>(
                            <div key={ioc} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:6}}>
                              <span style={{width:6,height:6,borderRadius:'50%',background:'#f0a030',flexShrink:0}} />
                              <code style={{fontSize:'0.68rem',fontFamily:'JetBrains Mono,monospace',color:'#f0c070',flex:1,wordBreak:'break-all'}}>{ioc}</code>
                              <button onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(ioc);}} style={{fontSize:'0.54rem',padding:'2px 7px',borderRadius:3,border:'1px solid #f0a03025',background:'transparent',color:'#f0a030',cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Copy</button>
                            </div>
                          ))}
                        </div>
                        {item.mitre && (
                          <div style={{marginTop:10,display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontSize:'0.6rem',color:'var(--wt-dim)'}}>MITRE ATT&CK:</span>
                            <a href={`https://attack.mitre.org/techniques/${item.mitre.split('.').join('/')}/`} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{fontSize:'0.66rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'#7c6aff',textDecoration:'none',padding:'2px 8px',border:'1px solid #7c6aff25',borderRadius:3,background:'#7c6aff10'}}>{item.mitre} →</a>
                          </div>
                        )}
                        {item.iocs && item.iocs.length>0 && (
                          <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid #f0a03015'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                              <span style={{fontSize:'0.6rem',fontWeight:700,color:'#22d49a',textTransform:'uppercase',letterSpacing:'0.5px'}}>🔍 Hunt in your environment</span>
                              <button onClick={e=>{e.stopPropagation();setIocQueryLoading(item.id);fetch('/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Generate detection queries to hunt for these IOCs in a corporate environment: '+item.iocs.join(', ')+'. Provide: SPLUNK QUERY (SPL), MICROSOFT SENTINEL KQL, and MICROSOFT DEFENDER ADVANCED HUNTING queries. Each labelled clearly. No markdown, plain text only.'})}).then(r=>r.json()).then(d=>{setIocQueries(prev=>({...prev,[item.id]:d.response||''}));setIocQueryLoading(null);}).catch(()=>setIocQueryLoading(null));}} disabled={iocQueryLoading===item.id} style={{padding:'3px 10px',borderRadius:5,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.6rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:4}}>
                                {iocQueryLoading===item.id ? <span style={{display:'inline-flex',alignItems:'center',gap:4}}><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',border:'2px solid #22d49a',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}}/>Generating...</span> : <span>✦ Generate Hunt Queries</span>}
                              </button>
                              {iocQueries[item.id] && <button onClick={e=>{e.stopPropagation();setIocQueries(prev=>{const n={...prev};delete n[item.id];return n;});}} style={{padding:'2px 7px',borderRadius:4,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-dim)',fontSize:'0.56rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Clear</button>}
                            </div>
                            {iocQueries[item.id] && <RemediationOutput text={iocQueries[item.id]} />}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>

              {/* Darktrace anomalies if active */}
              {darktrace?.active && (
                <div>
                  <div style={{fontSize:'0.62rem',fontWeight:700,color:'#8b6fff',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Darktrace — Network Anomalies</div>
                  {[
                    {device:'SRV-FINANCE01',score:96,desc:'Anomalous outbound HTTPS beaconing — 300s interval, unusual destination',time:'1h ago'},
                    {device:'laptop-CFO01',score:88,desc:'Unusual internal reconnaissance — scanning 10.0.0.0/24 subnet',time:'2h ago'},
                    {device:'SRV-APP02',score:72,desc:'Elevated data transfer to external storage provider — 3x baseline',time:'3h ago'},
                  ].map(a=>(
                    <div key={a.device} style={{padding:'10px 14px',background:'var(--wt-card)',border:'1px solid #8b6fff18',borderRadius:10,marginBottom:5,display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:38,height:38,borderRadius:8,background:'#8b6fff15',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:'#8b6fff'}}>{a.score}</span>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'0.76rem',fontWeight:700,marginBottom:2}}>{a.device}</div>
                        <div style={{fontSize:'0.7rem',color:'var(--wt-muted)'}}>{a.desc}</div>
                      </div>
                      <span style={{fontSize:'0.6rem',color:'var(--wt-dim)',flexShrink:0}}>{a.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GateWall>
          )}

          {/* ═══════════════════════════════ INCIDENTS ══════════════════════════════ */}
    </>
  );
}
