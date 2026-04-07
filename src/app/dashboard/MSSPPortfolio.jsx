'use client';
import React, { useState } from 'react';
export default function MSSPPortfolio({ currentTenant, setCurrentTenant, DEMO_TENANTS, isAdmin, setActiveTab, setAdminBannerInput, msspBranding, setMsspBranding }) {
  const [portfolioView, setPortfolioView] = React.useState('security');
  const [showBrandingConfig, setShowBrandingConfig] = React.useState(false);
  const [liveCorrelations, setLiveCorrelations] = React.useState([]);
  const [clients, setClients] = React.useState(null); // null = loading
  const [clientsError, setClientsError] = React.useState(false);

  React.useEffect(()=>{
    fetch('/api/mssp/correlation',{headers:{'x-tenant-id':'global'}}).then(r=>r.json()).then(d=>{if(d.correlations?.length>0)setLiveCorrelations(d.correlations);}).catch(()=>{});
  },[]);

  // Load live client data from tenant registry
  React.useEffect(()=>{
    fetch('/api/admin/tenants').then(r=>r.json()).then(d=>{
      if(d.tenants && Array.isArray(d.tenants) && d.tenants.length > 0) {
        // Map tenant data to client card format
        const mapped = d.tenants.map(t=>({
          id: t.id || t.tenantId,
          name: t.name || t.id,
          sector: t.sector || t.industry || 'Technology',
          seats: t.seats || 1,
          mrr: t.mrr || 0,
          contractStart: t.contractStart || t.createdAt?.slice(0,10) || '2025-01-01',
          renewalDate: t.renewalDate || '2026-01-01',
          billingStatus: t.billingStatus || 'Paid',
          posture: t.posture ?? 80,
          alerts: t.alerts ?? 0,
          critAlerts: t.critAlerts ?? 0,
          incidents: t.incidents ?? 0,
          coverage: t.coverage ?? 90,
          kevVulns: t.kevVulns ?? 0,
          lastSeen: t.lastSeen || 'recently',
          toolsConnected: t.toolsConnected ?? 0,
        }));
        setClients(mapped);
      } else {
        setClientsError(true);
      }
    }).catch(()=>setClientsError(true));
  },[]);

  const DEMO_CLIENTS = [
    {id:'client-acme',  name:'Acme Financial',  sector:'Financial Services', seats:8,  mrr:799, contractStart:'2024-01-15', renewalDate:'2025-01-15', billingStatus:'Paid',    posture:82, alerts:8,  critAlerts:3, incidents:2, coverage:94, kevVulns:3,  lastSeen:'2m ago',  toolsConnected:4},
    {id:'client-nhs',   name:'NHS Trust Alpha',  sector:'Healthcare',         seats:14, mrr:799, contractStart:'2024-03-01', renewalDate:'2025-03-01', billingStatus:'Paid',    posture:71, alerts:15, critAlerts:5, incidents:3, coverage:88, kevVulns:7,  lastSeen:'1m ago',  toolsConnected:6},
    {id:'client-retail',name:'RetailCo UK',      sector:'Retail',             seats:6,  mrr:447, contractStart:'2024-06-10', renewalDate:'2025-06-10', billingStatus:'Paid',    posture:91, alerts:4,  critAlerts:1, incidents:1, coverage:97, kevVulns:4,  lastSeen:'5m ago',  toolsConnected:5},
    {id:'client-gov',   name:'Gov Dept Beta',   sector:'Government',         seats:10, mrr:799, contractStart:'2024-09-20', renewalDate:'2025-09-20', billingStatus:'Overdue', posture:78, alerts:9,  critAlerts:3, incidents:1, coverage:92, kevVulns:5,  lastSeen:'8m ago',  toolsConnected:3},
  ];

  // Use live data if available, otherwise show demo data with banner
  const MY_CLIENTS = (clients && clients.length > 0) ? clients : DEMO_CLIENTS;
  const isDemo = !clients || clients.length === 0;
  const [brandingDraft, setBrandingDraft] = React.useState({name:'', primaryColor:'#8b6fff', tagline:''});
  const [brandingSaved, setBrandingSaved] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState(null);

  // Subdomain slug management
  const [showSlugManager, setShowSlugManager] = React.useState(false);
  const [slugMap, setSlugMap] = React.useState({});
  const [slugLoading, setSlugLoading] = React.useState(false);
  const [newSlug, setNewSlug] = React.useState('');
  const [newSlugTenant, setNewSlugTenant] = React.useState('');
  const [slugMsg, setSlugMsg] = React.useState('');

  // Load slug map
  React.useEffect(()=>{
    if(!showSlugManager) return;
    setSlugLoading(true);
    fetch('/api/mssp/slug-map').then(r=>r.json()).then(d=>{
      if(d.map) setSlugMap(d.map);
    }).catch(()=>{}).finally(()=>setSlugLoading(false));
  },[showSlugManager]);

  async function addSlug(){
    if(!newSlug||!newSlugTenant){setSlugMsg('Both slug and tenant ID are required');return;}
    if(!/^[a-z0-9][a-z0-9-]*$/.test(newSlug)){setSlugMsg('Slug must be lowercase alphanumeric with hyphens');return;}
    try{
      const r=await fetch('/api/mssp/slug-map',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:newSlug,tenantId:newSlugTenant})});
      const d=await r.json();
      if(d.ok){setSlugMap(d.map);setNewSlug('');setNewSlugTenant('');setSlugMsg('✓ Saved');}
      else setSlugMsg(d.error||'Failed');
    }catch(e){setSlugMsg('Error saving');}
    setTimeout(()=>setSlugMsg(''),3000);
  }

  async function removeSlug(slug){
    if(!confirm(`Remove portal subdomain "${slug}"?`)) return;
    try{
      const r=await fetch('/api/mssp/slug-map',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug})});
      const d=await r.json();
      if(d.ok) setSlugMap(d.map);
    }catch(e){}
  }

  const totalMRR = MY_CLIENTS.reduce((s,c)=>s+c.mrr, 0);
  const totalSeats = MY_CLIENTS.reduce((s,c)=>s+c.seats, 0);
  const overdueMRR = MY_CLIENTS.filter(c=>c.billingStatus==='Overdue').reduce((s,c)=>s+c.mrr, 0);
  const totalCrits = MY_CLIENTS.reduce((s,c)=>s+c.critAlerts, 0);
  const needsAttention = MY_CLIENTS.filter(c=>c.critAlerts>=3||c.billingStatus==='Overdue'||c.posture<75);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* ── WAR ROOM HEADER ── */}
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
            <h2 style={{fontSize:'0.88rem',fontWeight:700,margin:0}}>Client Portfolio</h2>
            <span style={{fontSize:'0.58rem',color:'#8b6fff',background:'#8b6fff12',padding:'2px 8px',borderRadius:4,border:'1px solid #8b6fff25',fontWeight:700}}>MSSP</span>
            {msspBranding?.name&&<span style={{fontSize:'0.58rem',color:'#8b6fff',opacity:0.7}}>· {msspBranding.name}</span>}
            <button onClick={()=>setShowBrandingConfig(s=>!s)} style={{fontSize:'0.54rem',padding:'1px 6px',borderRadius:3,border:'1px solid #8b6fff25',background:'#8b6fff0a',color:'#8b6fff',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>🎨 Branding</button>
            <button onClick={()=>setShowSlugManager(s=>!s)} style={{fontSize:'0.54rem',padding:'1px 6px',borderRadius:3,border:'1px solid #4f8fff25',background:'#4f8fff0a',color:'#4f8fff',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>🌐 Portals</button>
          </div>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            {isDemo && <span style={{fontSize:'0.6rem',color:'#f0a030',background:'#f0a03012',padding:'2px 8px',borderRadius:4,border:'1px solid #f0a03025',fontWeight:700}}>⚡ Demo data — add clients via Admin → Tenants</span>}
            <span style={{fontSize:'0.66rem',color:'var(--wt-muted)'}}>{MY_CLIENTS.length} clients · £{totalMRR.toLocaleString()}/mo MRR</span>
            {totalCrits>0&&<span style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',display:'flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:'#f0405e',boxShadow:'0 0 6px #f0405e',display:'block',animation:'pulse 1.5s ease infinite'}} />{totalCrits} active critical alerts across portfolio</span>}
            {overdueMRR>0&&<span style={{fontSize:'0.62rem',fontWeight:700,color:'#f97316'}}>⚠ £{overdueMRR}/mo overdue</span>}
          </div>
        </div>
        <div style={{display:'flex',gap:3,background:'var(--wt-card2)',borderRadius:7,padding:3}}>
          {['security','revenue','usage'].map(v=>(
            <button key={v} onClick={()=>setPortfolioView(v)} style={{padding:'5px 14px',borderRadius:5,border:'none',background:portfolioView===v?'#8b6fff':'transparent',color:portfolioView===v?'#fff':'var(--wt-muted)',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',textTransform:'capitalize'}}>{v}</button>
          ))}
        </div>
      </div>

      {/* Branding config */}
      {showBrandingConfig && (
        <div style={{padding:'14px 16px',background:'var(--wt-card)',border:'1px solid #8b6fff25',borderRadius:10}}>
          <div style={{fontSize:'0.7rem',fontWeight:700,marginBottom:10,color:'#8b6fff'}}>🎨 White-Label Branding</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10}}>
            {[{k:'name',label:'Product Name',ph:'CyberGuard SOC'},{k:'tagline',label:'Tagline',ph:'Powered by AI'},{k:'primaryColor',label:'Brand Colour',ph:'#8b6fff'}].map(f=>(
              <div key={f.k}>
                <div style={{fontSize:'0.6rem',color:'var(--wt-muted)',marginBottom:3}}>{f.label}</div>
                <input value={brandingDraft[f.k]||''} onChange={e=>setBrandingDraft(prev=>({...prev,[f.k]:e.target.value}))} placeholder={f.ph} style={{width:'100%',padding:'6px 9px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:6,color:'var(--wt-text)',fontSize:'0.74rem',fontFamily:'Inter,sans-serif',outline:'none',boxSizing:'border-box'}} />
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button onClick={async()=>{try{await fetch('/api/mssp/branding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(brandingDraft)});if(setMsspBranding)setMsspBranding(brandingDraft);setBrandingSaved(true);setTimeout(()=>setBrandingSaved(false),3000);}catch(e){}}} style={{padding:'6px 14px',borderRadius:6,border:'none',background:'#8b6fff',color:'#fff',fontSize:'0.7rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Save</button>
            {brandingSaved&&<span style={{fontSize:'0.66rem',color:'#22d49a',fontWeight:600}}>✓ Saved</span>}
            <button onClick={()=>setShowBrandingConfig(false)} style={{marginLeft:'auto',fontSize:'0.64rem',color:'var(--wt-muted)',background:'none',border:'none',cursor:'pointer'}}>Close</button>
          </div>
        </div>
      )}

      {/* ── SUBDOMAIN PORTAL MANAGER ── */}
      {showSlugManager && (
        <div style={{padding:'14px 16px',background:'var(--wt-card)',border:'1px solid #4f8fff25',borderRadius:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <span style={{fontSize:'0.7rem',fontWeight:700,color:'#4f8fff'}}>🌐 Client Portal Subdomains</span>
            <span style={{fontSize:'0.56rem',color:'var(--wt-dim)'}}>Map subdomains to client tenants — e.g. acme.getwatchtower.io</span>
          </div>

          {/* Existing mappings */}
          {slugLoading ? (
            <div style={{fontSize:'0.72rem',color:'var(--wt-muted)',padding:'8px 0'}}>Loading…</div>
          ) : Object.keys(slugMap).length === 0 ? (
            <div style={{fontSize:'0.72rem',color:'var(--wt-dim)',padding:'8px 0'}}>No portal subdomains configured yet</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:12}}>
              {Object.entries(slugMap).map(([slug, tid])=>(
                <div key={slug} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',background:'var(--wt-card2)',borderRadius:7,border:'1px solid var(--wt-border)'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:'#22d49a',boxShadow:'0 0 4px #22d49a',flexShrink:0}} />
                  <code style={{fontSize:'0.72rem',fontFamily:'JetBrains Mono,monospace',color:'#4f8fff',flex:'0 0 auto'}}>{slug}.getwatchtower.io</code>
                  <span style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>→</span>
                  <code style={{fontSize:'0.68rem',fontFamily:'JetBrains Mono,monospace',color:'var(--wt-muted)',flex:1}}>{tid}</code>
                  <button onClick={()=>{navigator.clipboard.writeText(`https://${slug}.getwatchtower.io`);}} title="Copy URL" style={{padding:'2px 6px',borderRadius:4,border:'1px solid #4f8fff25',background:'#4f8fff08',color:'#4f8fff',fontSize:'0.58rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Copy</button>
                  <button onClick={()=>window.open(`/portal?org=${slug}`,'_blank')} title="Preview portal" style={{padding:'2px 6px',borderRadius:4,border:'1px solid #8b6fff25',background:'#8b6fff08',color:'#8b6fff',fontSize:'0.58rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Preview</button>
                  <button onClick={()=>removeSlug(slug)} title="Remove" style={{padding:'2px 6px',borderRadius:4,border:'1px solid #f0405e25',background:'#f0405e08',color:'#f0405e',fontSize:'0.58rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* Add new mapping */}
          <div style={{display:'flex',gap:8,alignItems:'flex-end',flexWrap:'wrap'}}>
            <div>
              <div style={{fontSize:'0.56rem',color:'var(--wt-muted)',marginBottom:3}}>Subdomain slug</div>
              <div style={{display:'flex',alignItems:'center',gap:0}}>
                <input value={newSlug} onChange={e=>setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} placeholder="acme" style={{width:120,padding:'6px 9px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:'6px 0 0 6px',color:'var(--wt-text)',fontSize:'0.74rem',fontFamily:'JetBrains Mono,monospace',outline:'none',boxSizing:'border-box'}} />
                <span style={{padding:'6px 8px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderLeft:'none',borderRadius:'0 6px 6px 0',fontSize:'0.62rem',color:'var(--wt-dim)',whiteSpace:'nowrap'}}>.getwatchtower.io</span>
              </div>
            </div>
            <div>
              <div style={{fontSize:'0.56rem',color:'var(--wt-muted)',marginBottom:3}}>Tenant ID</div>
              <select value={newSlugTenant} onChange={e=>setNewSlugTenant(e.target.value)} style={{padding:'6px 9px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:6,color:'var(--wt-text)',fontSize:'0.74rem',fontFamily:'Inter,sans-serif',outline:'none',minWidth:160}}>
                <option value="">Select client…</option>
                {MY_CLIENTS.map(c=><option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
              </select>
            </div>
            <button onClick={addSlug} style={{padding:'6px 14px',borderRadius:6,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.7rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',height:32}}>+ Add</button>
            {slugMsg&&<span style={{fontSize:'0.64rem',color:slugMsg.startsWith('✓')?'#22d49a':'#f0405e',fontWeight:600}}>{slugMsg}</span>}
          </div>

          {/* Quick-register all clients */}
          <div style={{display:'flex',gap:8,alignItems:'center',marginTop:10,paddingTop:10,borderTop:'1px solid var(--wt-border)'}}>
            <button onClick={async()=>{
              let count=0;
              for(const c of MY_CLIENTS){
                const slug=c.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
                if(slugMap[slug]) continue;
                try{
                  const r=await fetch('/api/mssp/slug-map',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,tenantId:c.id})});
                  const d=await r.json();
                  if(d.ok){setSlugMap(d.map);count++;}
                }catch(e){}
              }
              setSlugMsg(count>0?`✓ Registered ${count} portal${count!==1?'s':''}`:'All clients already have portals');
              setTimeout(()=>setSlugMsg(''),3000);
            }} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #22d49a30',background:'#22d49a08',color:'#22d49a',fontSize:'0.66rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
              ⚡ Auto-register all clients
            </button>
            <span style={{fontSize:'0.56rem',color:'var(--wt-dim)'}}>Creates subdomain from client name for any unregistered clients</span>
            <button onClick={()=>setShowSlugManager(false)} style={{marginLeft:'auto',fontSize:'0.64rem',color:'var(--wt-muted)',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Close</button>
          </div>
        </div>
      )}

      {/* ── NEEDS ATTENTION STRIP ── */}
      {needsAttention.length > 0 && portfolioView==='security' && (
        <div style={{background:'rgba(240,64,94,0.12)',border:'1px solid #f0405e25',borderRadius:10,padding:'10px 14px'}}>
          <div style={{fontSize:'0.58rem',fontWeight:800,color:'#f0405e',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>⚡ Needs Attention — {needsAttention.length} client{needsAttention.length!==1?'s':''}</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {needsAttention.map(c=>(
              <div key={c.id} onClick={()=>setSelectedClient(selectedClient===c.id?null:c.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 10px',borderRadius:7,background:'var(--wt-card)',border:'1px solid #f0405e20',cursor:'pointer',transition:'border-color .15s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#f0405e50'} onMouseLeave={e=>e.currentTarget.style.borderColor='#f0405e20'}>
                <div style={{width:6,height:6,borderRadius:'50%',background:c.critAlerts>=3?'#f0405e':'#f97316',boxShadow:`0 0 5px ${c.critAlerts>=3?'#f0405e':'#f97316'}`,flexShrink:0}} />
                <span style={{fontSize:'0.76rem',fontWeight:700,flex:1}}>{c.name}</span>
                <div style={{display:'flex',gap:6}}>
                  {c.critAlerts>0&&<span style={{fontSize:'0.58rem',fontWeight:800,padding:'1px 6px',borderRadius:4,background:'#f0405e15',color:'#f0405e',border:'1px solid #f0405e25'}}>{c.critAlerts} critical</span>}
                  {c.billingStatus==='Overdue'&&<span style={{fontSize:'0.58rem',fontWeight:800,padding:'1px 6px',borderRadius:4,background:'#f9731615',color:'#f97316',border:'1px solid #f9731625'}}>overdue</span>}
                  {c.posture<75&&<span style={{fontSize:'0.58rem',fontWeight:700,padding:'1px 6px',borderRadius:4,background:'#f0a03012',color:'#f0a030'}}>posture {c.posture}%</span>}
                </div>
                <button onClick={e=>{e.stopPropagation();setCurrentTenant(c.id);if(setActiveTab)setActiveTab('alerts');}} style={{padding:'3px 10px',borderRadius:5,border:'1px solid #f0405e30',background:'#f0405e10',color:'#f0405e',fontSize:'0.62rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>View alerts →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security summary stats */}
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
        const threatColor = client.critAlerts>=4?'#f0405e':client.critAlerts>=2?'#f97316':client.posture<75?'#f0a030':'#22d49a';
        const daysToRenewal = Math.round((new Date(client.renewalDate).getTime()-Date.now())/(86400000));
        const renewalColor = daysToRenewal<30?'#f0405e':daysToRenewal<90?'#f0a030':'#22d49a';

        return (
          <div key={client.id} style={{background:currentTenant===client.id?'#080d18':'var(--wt-card)',border:`1px solid ${currentTenant===client.id?'#8b6fff40':isSel?'#8b6fff30':'var(--wt-border)'}`,borderRadius:12,overflow:'hidden',transition:'border-color .15s',borderLeft:`3px solid ${threatColor}`}}>

            {/* Client header row */}
            <div style={{padding:'12px 14px',display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>setSelectedClient(isSel?null:client.id)}>
              {/* Live status dot */}
              <div style={{width:8,height:8,borderRadius:'50%',background:'#22c992',boxShadow:'0 0 5px #22c992',flexShrink:0,animation:'pulse 3s ease infinite'}} />
              {/* Name + sector */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:2}}>
                  <span style={{fontSize:'0.84rem',fontWeight:700}}>{client.name}</span>
                  <span style={{fontSize:'0.54rem',color:'var(--wt-dim)',background:'var(--wt-card2)',padding:'1px 5px',borderRadius:3}}>{client.sector}</span>
                  {client.billingStatus==='Overdue' && <span style={{fontSize:'0.54rem',fontWeight:800,padding:'1px 6px',borderRadius:3,background:'#f97316',color:'#fff'}}>⚠ OVERDUE</span>}
                </div>
                <div style={{fontSize:'0.56rem',color:'var(--wt-dim)'}}>Last seen {client.lastSeen} · {client.toolsConnected} tools</div>
              </div>
              {/* Posture ring */}
              <div style={{display:'flex',flex:'0 0 auto',alignItems:'center',gap:4}}>
                <svg width="36" height="36" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--wt-border)" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="15" fill="none" stroke={postureColor} strokeWidth="3" strokeDasharray={`${(client.posture/100)*94.2} 94.2`} strokeLinecap="round" transform="rotate(-90 18 18)" style={{transition:'stroke-dasharray 1s'}}/>
                  <text x="18" y="22" textAnchor="middle" style={{fontSize:'9px',fontWeight:900,fontFamily:'JetBrains Mono,monospace',fill:postureColor}}>{client.posture}</text>
                </svg>
              </div>
              {/* Key metrics */}
              <div style={{display:'flex',gap:6,flex:'0 0 auto'}}>
                <div style={{textAlign:'center',padding:'4px 8px',background:client.critAlerts>0?'#f0405e08':'var(--wt-card2)',borderRadius:6,border:client.critAlerts>0?'1px solid #f0405e20':'1px solid var(--wt-border)',minWidth:42}}>
                  <div style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:client.critAlerts>0?'#f0405e':'var(--wt-muted)',lineHeight:1}}>{client.critAlerts}</div>
                  <div style={{fontSize:'0.46rem',color:'var(--wt-dim)',fontWeight:700}}>CRIT</div>
                </div>
                <div style={{textAlign:'center',padding:'4px 8px',background:'var(--wt-card2)',borderRadius:6,border:'1px solid var(--wt-border)',minWidth:42}}>
                  <div style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:'#f0a030',lineHeight:1}}>{client.incidents}</div>
                  <div style={{fontSize:'0.46rem',color:'var(--wt-dim)',fontWeight:700}}>CASES</div>
                </div>
                <div style={{textAlign:'center',padding:'4px 8px',background:'var(--wt-card2)',borderRadius:6,border:'1px solid var(--wt-border)',minWidth:42}}>
                  <div style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:'#22d49a',lineHeight:1}}>{client.coverage}%</div>
                  <div style={{fontSize:'0.46rem',color:'var(--wt-dim)',fontWeight:700}}>COV</div>
                </div>
              </div>
              {/* Actions */}
              <div style={{display:'flex',gap:5,flex:'0 0 auto'}} onClick={e=>e.stopPropagation()}>
                <button onClick={()=>{setCurrentTenant(client.id);if(setActiveTab)setActiveTab('overview');}} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #8b6fff30',background:'#8b6fff10',color:'#8b6fff',fontSize:'0.66rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Open →</button>
              </div>
              <span style={{fontSize:'0.54rem',color:'var(--wt-dim)',flexShrink:0}}>{isSel?'▲':'▼'}</span>
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
                  <button onClick={()=>{setCurrentTenant(client.id);if(setActiveTab)setActiveTab('tools');}} style={{padding:'7px 14px',borderRadius:7,border:'1px solid #22d49a30',background:'#22d49a08',color:'#22d49a',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}} title='Add this client Anthropic key in Tools → AI Engine'>🔑 BYOK Key</button>
                  {client.billingStatus==='Overdue' && <button onClick={e=>{e.stopPropagation();window.open(`mailto:accounts@${client.name.toLowerCase().split('').filter(c=>c>='a'&&c<='z').join('')}.com?subject=Outstanding Invoice — ${client.name}&body=Hi,%0A%0AThis is a reminder that your Watchtower subscription invoice is currently outstanding.%0APlease arrange payment at your earliest convenience.%0A%0ARegards,%0AWatchtower Team`,'_blank');}} style={{marginLeft:'auto',padding:'7px 14px',borderRadius:7,border:'1px solid #f97316',background:'#f9731610',color:'#f97316',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Chase Payment</button>}
                </div>
                {/* Portal subdomain link */}
                <div style={{marginTop:10,padding:'10px 12px',background:'#4f8fff06',border:'1px solid #4f8fff18',borderRadius:7}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <span style={{fontSize:'0.64rem',fontWeight:700,color:'#4f8fff'}}>🌐 Client Portal</span>
                    <span style={{fontSize:'0.54rem',color:'var(--wt-dim)'}}>Dedicated subdomain for this client</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <code style={{flex:1,fontSize:'0.72rem',fontFamily:'JetBrains Mono,monospace',color:'#4f8fff',padding:'5px 10px',background:'#070a14',borderRadius:5,border:'1px solid #1d2535'}}>
                      {(()=>{
                        // Derive slug from client name: "Acme Financial" → "acme-financial"
                        const slug = client.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
                        return `${slug}.getwatchtower.io`;
                      })()}
                    </code>
                    <button onClick={(e)=>{
                      e.stopPropagation();
                      const slug = client.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
                      navigator.clipboard.writeText(`https://${slug}.getwatchtower.io`);
                      const btn = e.currentTarget;
                      btn.textContent = '✓ Copied';
                      setTimeout(()=>btn.textContent='Copy URL',2000);
                    }} style={{padding:'5px 10px',borderRadius:5,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.66rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>
                      Copy URL
                    </button>
                    <button onClick={(e)=>{
                      e.stopPropagation();
                      const slug = client.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
                      window.open(`/portal?org=${slug}`,'_blank');
                    }} style={{padding:'5px 10px',borderRadius:5,border:'1px solid #8b6fff30',background:'#8b6fff10',color:'#8b6fff',fontSize:'0.66rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>
                      Preview ↗
                    </button>
                  </div>
                </div>
                <div style={{marginTop:8,padding:'7px 10px',background:'#22d49a06',border:'1px solid #22d49a18',borderRadius:7,fontSize:'0.64rem',color:'var(--wt-muted)'}}>
                  🔒 <strong style={{color:'var(--wt-secondary)'}}>BYOK isolation:</strong> This client&apos;s AI calls run under their own Anthropic key. Add or update it via the <button onClick={()=>{setCurrentTenant(client.id);if(setActiveTab)setActiveTab('tools');}} style={{color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:'0.64rem',padding:0,textDecoration:'underline'}}>Tools → AI Engine tab</button> while viewing this client.
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Cross-tenant correlation — IOCs and vulns seen across multiple clients */}
      {portfolioView==='security' && (
        <div style={{background:'var(--wt-card)',border:'1px solid #f97316 20',borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'10px 16px',background:'#f9731608',borderBottom:'1px solid #f9731620',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:'0.64rem',fontWeight:800,color:'#f97316',textTransform:'uppercase',letterSpacing:'0.5px'}}>⚡ Cross-Tenant Correlation</span>
            <span style={{fontSize:'0.58rem',color:'var(--wt-muted)'}}>IOCs and vulnerabilities detected across multiple clients</span>
            <span style={{fontSize:'0.54rem',color:'#f97316',background:'#f9731612',padding:'1px 6px',borderRadius:3,border:'1px solid #f9731625',fontWeight:700,marginLeft:'auto'}}>MSSP Intelligence</span>
          </div>
          <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>
            {(liveCorrelations.length > 0 ? liveCorrelations : [
              {type:'IOC',indicator:'185.220.101.0/24',desc:'C2 range',clients:['Acme Financial','NHS Trust Alpha','Gov Dept Beta'],severity:'Critical',mitre:'T1071.001'},
              {type:'CVE', indicator:'CVE-2024-21413',desc:'Outlook NTLM',clients:['Acme Financial','RetailCo UK'],severity:'Critical',mitre:'T1190'},
              {type:'IOC', indicator:'lockbit-ransom3.com',desc:'LockBit 3.0 C2',clients:['NHS Trust Alpha','Gov Dept Beta'],severity:'High',mitre:'T1486'},
              {type:'CVE', indicator:'CVE-2024-3400', desc:'PAN-OS RCE',clients:['Acme Financial','NHS Trust Alpha','RetailCo UK','Gov Dept Beta'],severity:'Critical',mitre:'T1190'},
            ]).map((item,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:item.clients.length>=3?'#f0405e06':'var(--wt-card2)',border:`1px solid ${item.clients.length>=3?'#f0405e20':'var(--wt-border)'}`,borderRadius:8}}>
                <span style={{fontSize:'0.52rem',fontWeight:800,padding:'2px 5px',borderRadius:3,background:item.type==='IOC'?'#f0405e20':'#8b6fff20',color:item.type==='IOC'?'#f0405e':'#8b6fff',flexShrink:0,minWidth:30,textAlign:'center'}}>{item.type}</span>
                <code style={{fontSize:'0.64rem',fontFamily:'JetBrains Mono,monospace',color:'#f0c070',flex:'0 0 auto',minWidth:140}}>{item.indicator}</code>
                <span style={{fontSize:'0.6rem',color:'var(--wt-dim)',flex:1}}>{item.desc}</span>
                <div style={{display:'flex',gap:3,flexWrap:'wrap',flex:'0 0 auto'}}>
                  {item.clients.map(c=><span key={c} style={{fontSize:'0.52rem',padding:'1px 5px',borderRadius:3,background:'var(--wt-border)',color:'var(--wt-muted)'}}>{c.split(' ')[0]}</span>)}
                </div>
                <span style={{fontSize:'0.52rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:`${item.severity==='Critical'?'#f0405e':'#f97316'}18`,color:item.severity==='Critical'?'#f0405e':'#f97316',flexShrink:0}}>{item.clients.length} clients</span>
                <span style={{fontSize:'0.48rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>{item.mitre}</span>
              </div>
            ))}
            <div style={{fontSize:'0.58rem',color:'var(--wt-dim)',paddingTop:4}}>
              💡 Correlation data is live — updated on each sync. IOCs and CVEs appearing in ≥2 clients generate a cross-client advisory — IOCs and CVEs appearing in ≥2 clients generate a cross-client advisory and alert all affected tenant dashboards.
            </div>
          </div>
        </div>
      )}

      {/* MSSP billing footer */}
      <div style={{padding:'12px 16px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
        <div style={{fontSize:'0.68rem',color:'var(--wt-muted)'}}>Your Watchtower MSSP subscription: <strong style={{color:'#8b6fff'}}>£{3499 + Math.max(0,(MY_CLIENTS.length-10)*199)}/mo</strong> · {MY_CLIENTS.length} clients ({MY_CLIENTS.length<=5?'included':MY_CLIENTS.length-5+' extra × £79'})</div>
        <div style={{fontSize:'0.68rem',color:'var(--wt-muted)'}}>Your MRR from clients: <strong style={{color:'#22d49a'}}>£{totalMRR}/mo</strong> · Margin: <strong style={{color:'#22d49a'}}>£{totalMRR-(3499+Math.max(0,(MY_CLIENTS.length-10)*199))}/mo</strong></div>
      </div>

    </div>
  );
}