'use client';
import React from 'react';

export default function CoverageTab({
  setDeployAgentDevice, gapToolFilter, setGapToolFilter, activeTools, coveredPct, totalDevices, gapDevices
}) {
  return (
    <div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Coverage</h2>
                <span style={{fontSize:'0.62rem',color:coveredPct>=90?'#22d49a':'#f0a030',background:coveredPct>=90?'#22d49a12':'#f0a03012',padding:'2px 8px',borderRadius:4}}>{coveredPct}% estate covered</span>
              </div>

              {/* Per-tool coverage */}
              <div>
                <div style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Tool Coverage Across Estate</div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {activeTools.map(tool=>{
                    const pct = tool.id==='crowdstrike'?96:tool.id==='defender'?91:tool.id==='darktrace'?100:tool.id==='splunk'?98:tool.id==='tenable'?84:tool.id==='proofpoint'?100:tool.id==='sentinel'?100:88;
                    const gapCount = Math.round(totalDevices*(1-pct/100));
                    const pctColor = pct>=95?'#22d49a':pct>=85?'#f0a030':'#f0405e';
                    return (
                      <div key={tool.id} onClick={()=>setGapToolFilter(gapToolFilter===tool.id?null:tool.id)} style={{padding:'10px 14px',background:gapToolFilter===tool.id?'var(--wt-card2)':'var(--wt-card)',border:`1px solid ${gapToolFilter===tool.id?'#4f8fff40':'#1d2535'}`,borderRadius:10,display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}>
                        <div style={{width:110,fontSize:'0.76rem',fontWeight:600,flexShrink:0}}>{tool.name}</div>
                        <div style={{flex:1,height:8,background:'var(--wt-border)',borderRadius:4,overflow:'hidden'}}>
                          <div style={{height:'100%',background:`linear-gradient(90deg,${pctColor},${pctColor}aa)`,borderRadius:4,width:`${pct}%`,transition:'width 1s'}} />
                        </div>
                        <span style={{fontSize:'0.72rem',fontWeight:800,fontFamily:'JetBrains Mono,monospace',color:pctColor,minWidth:36,textAlign:'right'}}>{pct}%</span>
                        <span style={{fontSize:'0.6rem',color:'var(--wt-dim)',minWidth:80,textAlign:'right'}}>{gapCount>0?<span style={{color:'#f0a030'}}>{gapCount} devices missing</span>:'Full coverage'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Devices with gaps */}
              <div>
                <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Devices with Gaps ({gapDevices.length})</div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {/* CSV export button */}
                  {gapToolFilter && (
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:'0.68rem',color:'#4f8fff',fontWeight:600}}>Showing devices missing {ALL_TOOLS.find(t=>t.id===gapToolFilter)?.name||gapToolFilter}</span>
                      <button onClick={()=>{
                        const filtered = gapDevices.filter(d=>d.missing.some(m=>ALL_TOOLS.find(t=>t.id===gapToolFilter)?.name && m.includes(ALL_TOOLS.find(t=>t.id===gapToolFilter).name.split(' ')[0])));
                        const csv = ['Hostname,IP,OS,Missing Tools,Reason,Last Seen', ...filtered.map(d=>`${d.hostname},${d.ip},${d.os},"${d.missing.join('; ')}","${d.reason}",${d.lastSeen}`)].join('\n');
                        const blob = new Blob([csv],{type:'text/csv'});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href=url; a.download=`coverage-gaps-${gapToolFilter}.csv`; a.click();
                        URL.revokeObjectURL(url);
                      }} style={{padding:'3px 10px',borderRadius:5,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.62rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Export CSV ↓</button>
                      <button onClick={()=>setGapToolFilter(null)} style={{padding:'3px 8px',borderRadius:5,border:'1px solid var(--wt-border)',background:'none',color:'var(--wt-muted)',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Clear ×</button>
                    </div>
                  )}
                  {(gapToolFilter ? gapDevices.filter(d=>d.missing.some(m=>ALL_TOOLS.find(t=>t.id===gapToolFilter)?.name && m.includes(ALL_TOOLS.find(t=>t.id===gapToolFilter).name.split(' ')[0]))) : gapDevices).map(dev=>(
                    <div key={dev.hostname} style={{padding:'12px 14px',background:'var(--wt-card)',border:'1px solid #f0405e18',borderRadius:10}}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                            <span style={{fontSize:'0.8rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace'}}>{dev.hostname}</span>
                            <span style={{fontSize:'0.6rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{dev.ip}</span>
                            <span style={{fontSize:'0.58rem',color:'var(--wt-muted)'}}>{dev.os}</span>
                          </div>
                          <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:4}}>
                            {dev.missing.map(m=>{
                              const catColor = m.includes('Falcon')||m.includes('Defender')||m.includes('SentinelOne')||m.includes('Carbon Black')?'#f0405e':m.includes('Splunk')||m.includes('Sentinel')||m.includes('QRadar')||m.includes('Elastic')?'#f0a030':m.includes('Tenable')||m.includes('Nessus')||m.includes('Qualys')?'#8b6fff':'#4f8fff';
                              return <span key={m} style={{fontSize:'0.62rem',fontWeight:700,padding:'3px 8px',borderRadius:4,background:`${catColor}14`,color:catColor,border:`1px solid ${catColor}28`,display:'flex',alignItems:'center',gap:4}}><span style={{fontSize:'0.5rem'}}>✗</span>{m}</span>;
                            })}
                          </div>
                          <div style={{fontSize:'0.66rem',color:'var(--wt-muted)'}}>{dev.reason} · Last seen {dev.lastSeen}</div>
                        </div>
                        <button onClick={()=>setDeployAgentDevice(dev)} style={{padding:'5px 12px',borderRadius:7,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Deploy Agent →</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
    </div>
  );
}
