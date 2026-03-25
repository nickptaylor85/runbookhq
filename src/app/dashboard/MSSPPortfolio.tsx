// @ts-nocheck
'use client';
import React from 'react';
export default function MSSPPortfolio({ currentTenant, setCurrentTenant, DEMO_TENANTS, isAdmin, setActiveTab, setAdminBannerInput }) {
  const [portfolioView, setPortfolioView] = React.useState('security');
  const [selectedClient, setSelectedClient] = React.useState(null);

  // The MSSP's own managed clients — organisations they provide SOC services to
  // In production this would load from /api/portfolio based on the MSSP's tenant ID
  const MY_CLIENTS = [
    {id:'client-acme',  name:'Acme Financial',  sector:'Financial Services', seats:8,  mrr:199, contractStart:'2024-01-15', renewalDate:'2025-01-15', billingStatus:'Paid',    posture:82, alerts:8,  critAlerts:3, incidents:2, coverage:94, kevVulns:3,  lastSeen:'2m ago',  toolsConnected:4},
    {id:'client-nhs',   name:'NHS Trust Alpha',  sector:'Healthcare',         seats:14, mrr:199, contractStart:'2024-03-01', renewalDate:'2025-03-01', billingStatus:'Paid',    posture:71, alerts:15, critAlerts:5, incidents:3, coverage:88, kevVulns:7,  lastSeen:'1m ago',  toolsConnected:6},
    {id:'client-retail',name:'RetailCo UK',      sector:'Retail',             seats:6,  mrr:294, contractStart:'2024-06-10', renewalDate:'2025-06-10', billingStatus:'Paid',    posture:91, alerts:4,  critAlerts:1, incidents:1, coverage:97, kevVulns:4,  lastSeen:'5m ago',  toolsConnected:5},
    {id:'client-gov',   name:'Gov Dept Beta',   sector:'Government',         seats:10, mrr:199, contractStart:'2024-09-20', renewalDate:'2025-09-20', billingStatus:'Overdue', posture:78, alerts:9,  critAlerts:3, incidents:1, coverage:92, kevVulns:5,  lastSeen:'8m ago',  toolsConnected:3},
  ];

  const totalMRR = MY_CLIENTS.reduce((s,c)=>s+c.mrr, 0);
  const totalSeats = MY_CLIENTS.reduce((s,c)=>s+c.seats, 0);
  const overdueMRR = MY_CLIENTS.filter(c=>c.billingStatus==='Overdue').reduce((s,c)=>s+c.mrr, 0);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <div>
          <h2 style={{fontSize:'0.88rem',fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
            My Client Portfolio
            <span style={{fontSize:'0.62rem',color:'#8b6fff',background:'#8b6fff12',padding:'2px 8px',borderRadius:4,border:'1px solid #8b6fff25',fontWeight:700}}>MSSP</span>
          </h2>
          <div style={{fontSize:'0.68rem',color:'var(--wt-muted)',marginTop:2}}>Organisations you manage security for · {MY_CLIENTS.length} active clients</div>
        </div>
        <div style={{display:'flex',gap:3,background:'var(--wt-card2)',borderRadius:7,padding:3,marginLeft:'auto'}}>
          {['security','revenue','usage'].map(v=>(
            <button key={v} onClick={()=>setPortfolioView(v)} style={{padding:'5px 14px',borderRadius:5,border:'none',background:portfolioView===v?'#8b6fff':'transparent',color:portfolioView===v?'#fff':'var(--wt-muted)',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',textTransform:'capitalize'}}>{v}</button>
          ))}
        </div>
      </div>

      {/* Security summary */}
      {portfolioView==='security' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[
            {label:'Active Incidents',  val:MY_CLIENTS.reduce((s,c)=>s+c.incidents,0),  color:'#f0405e'},
            {label:'Critical Alerts',   val:MY_CLIENTS.reduce((s,c)=>s+c.critAlerts,0), color:'#f0405e'},
            {label:'KEV Outstanding',   val:MY_CLIENTS.reduce((s,c)=>s+c.kevVulns,0),   color:'#f97316'},
            {label:'Avg Posture Score', val:`${Math.round(MY_CLIENTS.reduce((s,c)=>s+c.posture,0)/MY_CLIENTS.length)}%`, color:'#22d49a'},
          ].map(s=>(
            <div key={s.label} style={{padding:'14px 16px',background:'var(--wt-card)',border:`1px solid ${s.color}18`,borderRadius:12,textAlign:'center'}}>
              <div style={{fontSize:'1.8rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.color,letterSpacing:-2}}>{s.val}</div>
              <div style={{fontSize:'0.6rem',color:'var(--wt-muted)',marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue summary */}
      {portfolioView==='revenue' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[
            {label:'Monthly Recurring Revenue', val:`£${totalMRR.toLocaleString()}`, sub:'MRR', color:'#22d49a'},
            {label:'Annual Recurring Revenue',  val:`£${(totalMRR*12/1000).toFixed(1)}k`, sub:'ARR', color:'#4f8fff'},
            {label:'Seats Under Management',    val:totalSeats, sub:'seats', color:'#8b6fff'},
            {label:'Overdue Balance',           val:overdueMRR>0?`£${overdueMRR}`:'£0', sub:overdueMRR>0?'action needed':'all clear', color:overdueMRR>0?'#f0405e':'#22d49a'},
          ].map(s=>(
            <div key={s.label} style={{padding:'14px 16px',background:'var(--wt-card)',border:`1px solid ${s.color}18`,borderRadius:12}}>
              <div style={{fontSize:'1.8rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.color,letterSpacing:-2,lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:'0.58rem',fontWeight:700,color:s.color,textTransform:'uppercase',letterSpacing:'0.5px',marginTop:3}}>{s.sub}</div>
              <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Usage summary */}
      {portfolioView==='usage' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {[
            {label:'Total Alerts This Week',  val:MY_CLIENTS.reduce((s,c)=>s+c.alerts,0),   color:'#4f8fff'},
            {label:'AI Auto-Closed',          val:Math.round(MY_CLIENTS.reduce((s,c)=>s+c.alerts,0)*0.68)+' FPs', color:'#22d49a'},
            {label:'Tools Connected (avg)',   val:Math.round(MY_CLIENTS.reduce((s,c)=>s+c.toolsConnected,0)/MY_CLIENTS.length), color:'#8b6fff'},
            {label:'Critical Incidents Open', val:MY_CLIENTS.reduce((s,c)=>s+c.incidents,0), color:'#f0405e'},
            {label:'Avg Coverage',            val:Math.round(MY_CLIENTS.reduce((s,c)=>s+c.coverage,0)/MY_CLIENTS.length)+'%', color:'#22d49a'},
            {label:'Seats Managed',           val:totalSeats, color:'#4f8fff'},
          ].map(s=>(
            <div key={s.label} style={{padding:'14px',background:'var(--wt-card)',border:`1px solid ${s.color}18`,borderRadius:10}}>
              <div style={{fontSize:'1.4rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.color,letterSpacing:-1}}>{s.val}</div>
              <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:3}}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Per-client rows */}
      {MY_CLIENTS.map(client=>{
        const isSel = selectedClient===client.id;
        const postureColor = client.posture>=85?'#22d49a':client.posture>=70?'#f0a030':'#f0405e';
        const daysToRenewal = Math.round((new Date(client.renewalDate).getTime()-Date.now())/(86400000));
        const renewalColor = daysToRenewal<30?'#f0405e':daysToRenewal<90?'#f0a030':'#22d49a';

        return (
          <div key={client.id} style={{background:currentTenant===client.id?'#080d18':'var(--wt-card)',border:`1px solid ${currentTenant===client.id?'#8b6fff40':client.billingStatus==='Overdue'?'#f0405e20':'var(--wt-border)'}`,borderRadius:12,overflow:'hidden'}}>

            {/* Client header row */}
            <div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:12,cursor:'pointer'}} onClick={()=>setSelectedClient(isSel?null:client.id)}>
              <div style={{width:9,height:9,borderRadius:'50%',background:'#22c992',boxShadow:'0 0 6px #22c992',flexShrink:0}} />
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
                  <span style={{fontSize:'0.86rem',fontWeight:700}}>{client.name}</span>
                  <span style={{fontSize:'0.56rem',color:'var(--wt-dim)'}}>{client.sector}</span>
                  {client.billingStatus==='Overdue' && <span style={{fontSize:'0.54rem',fontWeight:700,padding:'1px 6px',borderRadius:3,background:'#f0405e12',color:'#f0405e',border:'1px solid #f0405e20'}}>⚠ OVERDUE</span>}
                  {currentTenant===client.id && <span style={{fontSize:'0.52rem',fontWeight:700,padding:'1px 6px',borderRadius:3,background:'#8b6fff15',color:'#8b6fff',border:'1px solid #8b6fff25'}}>VIEWING</span>}
                </div>
                <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:1}}>Last active {client.lastSeen} · {client.seats} seats · {client.toolsConnected} tools</div>
              </div>
              {/* Quick stats */}
              {portfolioView==='security' && (
                <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:`conic-gradient(${postureColor} ${client.posture}%,var(--wt-border) 0)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <div style={{width:20,height:20,borderRadius:'50%',background:'var(--wt-card)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.46rem',fontWeight:900,color:postureColor}}>{client.posture}</div>
                    </div>
                  </div>
                  {[{label:'Alerts',val:client.alerts,c:client.critAlerts>0?'#f0a030':'var(--wt-secondary)'},{label:'Critical',val:client.critAlerts,c:client.critAlerts>0?'#f0405e':'var(--wt-secondary)'},{label:'Incidents',val:client.incidents,c:client.incidents>0?'#f0405e':'var(--wt-secondary)'},{label:'Coverage',val:client.coverage+'%',c:client.coverage>=95?'#22d49a':client.coverage>=85?'#f0a030':'#f0405e'}].map(s=>(
                    <div key={s.label} style={{textAlign:'center',minWidth:46}}>
                      <div style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.c,letterSpacing:-1}}>{s.val}</div>
                      <div style={{fontSize:'0.5rem',color:'var(--wt-dim)'}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {portfolioView==='revenue' && (
                <div style={{display:'flex',gap:14}}>
                  {[{label:'MRR',val:`£${client.mrr}`,c:'#22d49a'},{label:'Renewal',val:`${daysToRenewal}d`,c:renewalColor},{label:'Billing',val:client.billingStatus,c:client.billingStatus==='Paid'?'#22d49a':'#f0405e'}].map(s=>(
                    <div key={s.label} style={{textAlign:'center',minWidth:52}}>
                      <div style={{fontSize:'0.9rem',fontWeight:800,fontFamily:'JetBrains Mono,monospace',color:s.c,letterSpacing:-0.5}}>{s.val}</div>
                      <div style={{fontSize:'0.5rem',color:'var(--wt-dim)'}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {portfolioView==='usage' && (
                <div style={{display:'flex',gap:14}}>
                  {[{label:'Alerts',val:client.alerts,c:'#4f8fff'},{label:'AI Closed',val:Math.round(client.alerts*0.68),c:'#22d49a'},{label:'Tools',val:client.toolsConnected,c:'#8b6fff'}].map(s=>(
                    <div key={s.label} style={{textAlign:'center',minWidth:46}}>
                      <div style={{fontSize:'0.9rem',fontWeight:800,fontFamily:'JetBrains Mono,monospace',color:s.c}}>{s.val}</div>
                      <div style={{fontSize:'0.5rem',color:'var(--wt-dim)'}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* Action buttons */}
              <div style={{display:'flex',gap:5,flexShrink:0,marginLeft:8}}>
                <button onClick={e=>{e.stopPropagation();setCurrentTenant(client.id);if(setActiveTab)setActiveTab('overview');}} style={{padding:'5px 12px',borderRadius:7,border:'1px solid #8b6fff30',background:currentTenant===client.id?'#8b6fff20':'#8b6fff10',color:'#8b6fff',fontSize:'0.66rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                  {currentTenant===client.id?'● Viewing':'View →'}
                </button>
                <button onClick={e=>{e.stopPropagation();if(setAdminBannerInput)setAdminBannerInput('['+client.name+'] ');}} style={{padding:'5px 9px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.66rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}} title='Send message to this client'>📢</button>
              </div>
              <span style={{fontSize:'0.7rem',color:'var(--wt-dim)',flexShrink:0}}>{isSel?'▲':'▼'}</span>
            </div>

            {/* Expanded detail */}
            {isSel && (
              <div style={{borderTop:'1px solid var(--wt-border)',padding:'14px 16px',background:'var(--wt-card2)'}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                  {[
                    {label:'Contract Start',val:client.contractStart,c:'var(--wt-secondary)'},
                    {label:'Next Renewal',  val:client.renewalDate,  c:renewalColor},
                    {label:'Monthly Value', val:`£${client.mrr}`,   c:'#22d49a'},
                    {label:'KEV Vulns',     val:client.kevVulns,    c:'#f97316'},
                  ].map(s=>(
                    <div key={s.label} style={{textAlign:'center',padding:'10px',background:'var(--wt-card)',borderRadius:8}}>
                      <div style={{fontSize:'0.9rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:s.c}}>{s.val}</div>
                      <div style={{fontSize:'0.56rem',color:'var(--wt-dim)',marginTop:3}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button onClick={()=>{setCurrentTenant(client.id);if(setActiveTab)setActiveTab('overview');}} style={{padding:'7px 16px',borderRadius:7,border:'1px solid #8b6fff30',background:'#8b6fff10',color:'#8b6fff',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>View Full Dashboard →</button>
                  <button onClick={()=>{setCurrentTenant(client.id);if(setActiveTab)setActiveTab('alerts');}} style={{padding:'7px 14px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Alerts</button>
                  <button onClick={()=>{setCurrentTenant(client.id);if(setActiveTab)setActiveTab('incidents');}} style={{padding:'7px 14px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Incidents</button>
                  <button onClick={()=>{setCurrentTenant(client.id);if(setActiveTab)setActiveTab('vulns');}} style={{padding:'7px 14px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Vulns</button>
                  {client.billingStatus==='Overdue' && <button onClick={e=>{e.stopPropagation();window.open(`mailto:accounts@${client.name.toLowerCase().split('').filter(c=>c>='a'&&c<='z').join('')}.com?subject=Outstanding Invoice — ${client.name}&body=Hi,%0A%0AThis is a reminder that your Watchtower subscription invoice is currently outstanding.%0APlease arrange payment at your earliest convenience.%0A%0ARegards,%0AWatchtower Team`,'_blank');}} style={{marginLeft:'auto',padding:'7px 14px',borderRadius:7,border:'1px solid #f97316',background:'#f9731610',color:'#f97316',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Chase Payment</button>}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* MSSP billing footer */}
      <div style={{padding:'12px 16px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
        <div style={{fontSize:'0.68rem',color:'var(--wt-muted)'}}>Your Watchtower MSSP subscription: <strong style={{color:'#8b6fff'}}>£{799 + Math.max(0,(MY_CLIENTS.length-5)*79)}/mo</strong> · {MY_CLIENTS.length} clients ({MY_CLIENTS.length<=5?'included':MY_CLIENTS.length-5+' extra × £79'})</div>
        <div style={{fontSize:'0.68rem',color:'var(--wt-muted)'}}>Your MRR from clients: <strong style={{color:'#22d49a'}}>£{totalMRR}/mo</strong> · Margin: <strong style={{color:'#22d49a'}}>£{totalMRR-(799+Math.max(0,(MY_CLIENTS.length-5)*79))}/mo</strong></div>
      </div>

    </div>
  );
}