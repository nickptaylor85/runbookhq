'use client';
import React, { useState, useEffect } from 'react';

// Signup toggle sub-component — reads/writes signup_enabled flag from Redis via /api/admin/platform
function AnalyticsView() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(()=>{
    fetch('/api/admin/analytics',{headers:{'x-is-admin':'true'}})
      .then(r=>r.json()).then(d=>{ setData(d); setLoading(false); }).catch(()=>setLoading(false));
  },[]);

  if (loading) return <div style={{fontSize:'0.72rem',color:'var(--wt-muted)',padding:'24px 0',textAlign:'center'}}>Loading analytics…</div>;
  if (!data) return <div style={{fontSize:'0.72rem',color:'#f0405e',padding:'24px 0',textAlign:'center'}}>Failed to load analytics</div>;

  const stats = [
    {label:'Total Signups',    val: data.totalSignups   ?? 0, color:'#4f8fff', sub:'all time'},
    {label:'This Week',        val: data.weeklySignups  ?? 0, color:'#22d49a', sub:'last 7 days'},
    {label:'Paying Customers', val: data.paidCustomers  ?? 0, color:'#8b6fff', sub:'team + business + mssp'},
    {label:'Community Free',   val: data.communityUsers ?? 0, color:'#f0a030', sub:'free tier'},
    {label:'Churn (30d)',       val: data.churn30d       ?? 0, color:'#f0405e', sub:'cancellations'},
    {label:'MRR',              val: `£${(data.mrr ?? 0).toLocaleString()}`, color:'#22d49a', sub:'monthly recurring'},
  ];

  const tierBreakdown = data.tierBreakdown || {community:0, team:0, business:0, mssp:0};

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
        {stats.map(s=>(
          <div key={s.label} style={{padding:'14px 16px',background:'var(--wt-card)',border:`1px solid ${s.color}18`,borderRadius:12}}>
            <div style={{fontSize:'1.8rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.color,letterSpacing:-2,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:'0.66rem',fontWeight:700,color:s.color,marginTop:3}}>{s.label}</div>
            <div style={{fontSize:'0.58rem',color:'var(--wt-muted)',marginTop:1}}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
        <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:12}}>Tier Distribution</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[
            {key:'mssp',     label:'Enterprise',   color:'#8b6fff'},
            {key:'business', label:'Professional', color:'#22d49a'},
            {key:'team',     label:'Essentials',   color:'#4f8fff'},
            {key:'community',label:'Community',    color:'#6b7a94'},
          ].map(t=>{
            const total = Object.values(tierBreakdown).reduce((a,b)=>a+b,0) || 1;
            const count = tierBreakdown[t.key] || 0;
            const pct = Math.round(count/total*100);
            return (
              <div key={t.key} style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:80,fontSize:'0.66rem',fontWeight:700,color:t.color,flexShrink:0}}>{t.label}</div>
                <div style={{flex:1,height:8,background:'var(--wt-card2)',borderRadius:4,overflow:'hidden'}}>
                  <div style={{width:`${pct}%`,height:'100%',background:t.color,borderRadius:4,transition:'width .5s ease'}} />
                </div>
                <div style={{width:40,fontSize:'0.66rem',color:'var(--wt-muted)',textAlign:'right',fontFamily:'JetBrains Mono,monospace'}}>{count}</div>
                <div style={{width:32,fontSize:'0.62rem',color:t.color,textAlign:'right'}}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
      {data.weeklyTrend && data.weeklyTrend.length > 0 && (
        <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:14}}>Signup Trend — Last 8 Weeks</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:6,height:80}}>
            {data.weeklyTrend.map((w,i)=>{
              const maxCount = Math.max(...data.weeklyTrend.map(x=>x.count), 1);
              const h = Math.round((w.count / maxCount) * 64);
              return (
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                  <div style={{fontSize:'0.52rem',color:'#4f8fff',fontWeight:700,fontFamily:'JetBrains Mono,monospace',minHeight:12}}>{w.count||''}</div>
                  <div style={{width:'100%',background:'#4f8fff',borderRadius:'3px 3px 0 0',height:Math.max(h,2),transition:'height .4s ease'}} title={`${w.count} signups (${w.paid} paid)`} />
                  <div style={{fontSize:'0.5rem',color:'var(--wt-muted)',textAlign:'center'}}>{w.week}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {data.recentSignups && data.recentSignups.length > 0 && (
        <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:10}}>Recent Signups</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {data.recentSignups.slice(0,10).map((u,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 10px',background:'var(--wt-card2)',borderRadius:7}}>
                <div style={{flex:1,fontSize:'0.72rem',fontFamily:'JetBrains Mono,monospace',color:'var(--wt-text)'}}>{u.email}</div>
                <div style={{fontSize:'0.62rem',color:'var(--wt-muted)'}}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : '—'}</div>
                <span style={{fontSize:'0.56rem',fontWeight:800,padding:'2px 7px',borderRadius:4,
                  background: u.plan==='mssp'?'#8b6fff18':u.plan==='business'?'#22d49a18':u.plan==='team'?'#4f8fff18':'#6b7a9418',
                  color:       u.plan==='mssp'?'#8b6fff':u.plan==='business'?'#22d49a':u.plan==='team'?'#4f8fff':'#6b7a94',
                  border:      `1px solid ${u.plan==='mssp'?'#8b6fff30':u.plan==='business'?'#22d49a30':u.plan==='team'?'#4f8fff30':'#6b7a9430'}`,
                }}>{(u.plan||'community').toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function SignupToggle() {
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(()=>{
    fetch('/api/admin/platform',{headers:{'x-is-admin':'true'}}).then(r=>r.json()).then(d=>{
      if (typeof d.signup_enabled === 'boolean') setEnabled(d.signup_enabled);
      setLoaded(true);
    }).catch(()=>setLoaded(true));
  },[]);
  const toggle = async () => {
    setSaving(true);
    try {
      const newVal = !enabled;
      const r = await fetch('/api/admin/platform',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':'global'},body:JSON.stringify({signup_enabled:newVal})});
      if (r.ok) {
        setEnabled(newVal);
      } else {
        console.error('[signup toggle] failed:', r.status, await r.text().catch(()=>''));
      }
    } catch(e) { console.error('[signup toggle] error:', e); }
    setSaving(false);
  };
  return (
    <div style={{padding:'14px 16px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,display:'flex',alignItems:'center',gap:12}}>
      <div style={{flex:1}}>
        <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:2}}>Public Sign-ups</div>
        <div style={{fontSize:'0.64rem',color:'var(--wt-muted)'}}>
          {enabled ? 'New users can register at /signup' : 'Sign-up page is disabled — existing users unaffected'}
        </div>
      </div>
      <button onClick={toggle} disabled={saving||!loaded} style={{padding:'6px 16px',borderRadius:7,border:`1px solid ${enabled?'#22d49a30':'#f0405e30'}`,background:enabled?'#22d49a15':'#f0405e12',color:enabled?'#22d49a':'#f0405e',fontSize:'0.72rem',fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>
        {saving?'Saving…':enabled?'✓ Enabled — click to disable':'✗ Disabled — click to enable'}
      </button>
    </div>
  );
}


function AuditLogView({ tenantId }) {
  const [entries, setEntries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('all');
  React.useEffect(()=>{
    fetch('/api/audit?limit=200',{headers:{'x-tenant-id':tenantId}}).then(r=>r.json()).then(d=>{if(d.entries)setEntries(d.entries);setLoading(false);}).catch(()=>setLoading(false));
  },[tenantId]);
  if(loading) return <div style={{fontSize:'0.76rem',color:'var(--wt-muted)'}}>Loading…</div>;
  if(entries.length===0) return <div style={{fontSize:'0.76rem',color:'var(--wt-muted)',padding:'16px 0'}}>No audit entries yet. Analyst verdicts, incident changes, and auto-responses appear here.</div>;
  const typeColors = {verdict:'#4f8fff',incident_status:'#f0a030',auto_close_fp:'#22d49a',auto_response:'#f0405e',auto_notify_tp:'#f97316',auto_response_full:'#f0405e',incident_note:'#8b6fff',default:'#6b7a94'};
  const typeLabels = {verdict:'Verdict',incident_status:'Status Change',auto_close_fp:'Auto-FP Close',auto_response:'Auto-Response',auto_notify_tp:'Auto-TP Notify',auto_response_full:'Full Auto Action',incident_note:'Note Added'};
  const types = ['all',...new Set(entries.map(e=>e.type).filter(Boolean))];
  const filtered = filter==='all' ? entries : entries.filter(e=>e.type===filter);
  return (
    <div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
        {types.slice(0,8).map(t=>(
          <button key={t} onClick={()=>setFilter(t)} style={{padding:'3px 10px',borderRadius:5,border:`1px solid ${filter===t?typeColors[t]||'#4f8fff':'var(--wt-border)'}`,background:filter===t?(typeColors[t]||'#4f8fff')+'15':'transparent',color:filter===t?typeColors[t]||'#4f8fff':'var(--wt-muted)',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            {t==='all'?'All':typeLabels[t]||t}
          </button>
        ))}
      </div>
      <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:10,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'55px minmax(80px,120px) minmax(80px,120px) 1fr 60px',padding:'7px 14px',borderBottom:'1px solid var(--wt-border)',fontSize:'0.66rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px'}}>
          <span>Time</span><span>Type</span><span>User</span><span>Detail</span><span>Verdict</span>
        </div>
        <div style={{maxHeight:450,overflowY:'auto'}}>
          {filtered.map((e,i)=>{
            const col = typeColors[e.type]||typeColors.default;
            const user = e.analyst||e.userId||'—';
            const detail = e.alertTitle||e.incidentId||e.action||e.type||'';
            return (
              <div key={i} style={{display:'grid',gridTemplateColumns:'55px minmax(80px,120px) minmax(80px,120px) 1fr 60px',padding:'7px 14px',borderBottom:'1px solid var(--wt-border)',background:i%2===0?'transparent':'var(--wt-card2)',alignItems:'center',gap:6}}>
                <span style={{fontSize:'0.66rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{e.ts?new Date(e.ts).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):''}</span>
                <span style={{fontSize:'0.68rem',fontWeight:700,padding:'1px 6px',borderRadius:3,background:col+'18',color:col,border:`1px solid ${col}30`,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{typeLabels[e.type]||e.type||'action'}</span>
                <span style={{fontSize:'0.72rem',fontWeight:600,color:'var(--wt-text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={user}>{user.length>18?user.slice(0,16)+'…':user}</span>
                <span style={{fontSize:'0.72rem',color:'var(--wt-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={detail}>{detail.slice(0,60)}</span>
                <span style={{fontSize:'0.72rem',fontWeight:700,color:e.verdict==='FP'?'#22d49a':e.verdict==='TP'?'#f0405e':e.status?'#f0a030':'var(--wt-dim)'}}>{e.verdict||e.status||'—'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminPortal({ setCurrentTenant, setActiveTab, clientBanner, setClientBanner, adminBannerInput, setAdminBannerInput, userRole, setUserRole, currentTenant }) {
  const WTC_SUBSCRIBERS = [
    {id:'mssp-cyberguard', name:'CyberGuard Solutions',  type:'Enterprise', plan:'Enterprise', seats:0, mrr:2499, clients:4,  status:'Active',  posture:84, alerts:36, incidents:7,  coverage:93, joined:'2024-01-10', billing:'Paid'},
    {id:'mssp-secureops',  name:'SecureOps Ltd',         type:'Enterprise', plan:'Enterprise', seats:0, mrr:2499, clients:2,  status:'Active',  posture:79, alerts:22, incidents:4,  coverage:90, joined:'2024-03-15', billing:'Paid'},
    {id:'org-fintech',     name:'FinTech Global',        type:'Professional', plan:'Professional', seats:15, mrr:799,  clients:0,  status:'Active',  posture:88, alerts:12, incidents:2,  coverage:96, joined:'2024-02-01', billing:'Paid'},
    {id:'org-healthco',    name:'HealthCo Systems',      type:'Professional', plan:'Professional', seats:10, mrr:799,  clients:0,  status:'Active',  posture:72, alerts:19, incidents:3,  coverage:87, joined:'2024-04-20', billing:'Overdue'},
    {id:'org-logistics',   name:'Logistics UK Ltd',      type:'Professional', plan:'Professional', seats:10, mrr:799,  clients:0,  status:'Churned', posture:0,  alerts:0,  incidents:0,  coverage:0,  joined:'2023-11-01', billing:'Churned'},
    {id:'org-startup1',    name:'DevStack Inc',          type:'Essentials', plan:'Essentials', seats:4, mrr:596,  clients:0,  status:'Active',  posture:91, alerts:5,  incidents:1,  coverage:98, joined:'2024-05-01', billing:'Paid'},
    {id:'org-startup2',    name:'CloudBase Ltd',         type:'Essentials', plan:'Essentials', seats:3, mrr:447,  clients:0,  status:'Trial',   posture:65, alerts:8,  incidents:0,  coverage:78, joined:'2024-03-28', billing:'Trial'},
    {id:'org-free1',       name:'TestOrg Alpha',         type:'Community',plan:'Community',seats:1,  mrr:0,    clients:0,  status:'Active',  posture:55, alerts:2,  incidents:0,  coverage:60, joined:'2024-06-01', billing:'Free'},
  ];
  const [adminView, setAdminView] = useState('subscribers');
  const [aiLog, setAiLog] = useState(null);
  const [aiLogLoading, setAiLogLoading] = useState(false);
  async function fetchAiLog() {
    setAiLogLoading(true);
    try {
      // Always fetch global tenant for AI log — entries are logged under admin's own tenant
      const r = await fetch('/api/ai/ailog?limit=200', {headers:{'x-is-admin':'true','x-tenant-id':'global'}});
      if (r.ok) {
        const d = await r.json();
        if (d.ok) setAiLog(d);
        else console.error('[ailog] error:', d);
      } else {
        console.error('[ailog] HTTP', r.status, await r.text().catch(()=>''));
      }
    } catch(e) { console.error('[ailog] fetch error:', e); }
    setAiLogLoading(false);
  }
  const [filterPlan, setFilterPlan] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Users/Roles state
  const [staffUsers, setStaffUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [setPassState, setSetPassState] = useState({});
  const [inviteForm, setInviteForm] = useState({name:'',email:'',role:'viewer',tempPassword:''});
  const [inviteStatus, setInviteStatus] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // Load users from Redis on mount
  useEffect(()=>{
    fetch('/api/admin/users').then(r=>r.json()).then(d=>{
      if(d.ok && Array.isArray(d.users) && d.users.length > 0) {
        setStaffUsers(d.users.map(u=>({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status === 'active' ? 'Active' : u.status === 'pending' ? 'Pending' : u.status || 'Active',
          joined: u.createdAt?.slice(0,10) || '',
          lastSeen: u.lastSeen || 'Never',
        })));
      }
      setUsersLoaded(true);
    }).catch(()=>setUsersLoaded(true));
  },[]);

  // Stripe config state
  const [stripeConfig, setStripeConfig] = useState({publishableKey:'',secretKey:'',webhookSecret:'',priceMssp:'',priceBusiness:'',priceTeamPerSeat:''});
  const [stripeSaving, setStripeSaving] = useState(false);

  // SAML config state
  const [samlConfig, setSamlConfig] = useState({enabled:false,idpEntityId:'',idpSsoUrl:'',idpCert:'',attributeMapping:{email:'email',name:'displayName',role:'role'},defaultRole:'viewer',domains:'',spEntityId:''});
  const [samlSaving, setSamlSaving] = useState(false);
  const [samlSaved, setSamlSaved] = useState(false);
  React.useEffect(()=>{
    fetch('/api/admin/saml-config').then(r=>r.json()).then(d=>{
      if(d.ok&&d.configured) setSamlConfig(prev=>({...prev,...d,domains:Array.isArray(d.domains)?d.domains.join(','):d.domains||''}));
    }).catch(()=>{});
  },[]);
  const [stripeSaved, setStripeSaved] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  React.useEffect(()=>{
    fetch('/api/admin/stripe-config').then(r=>r.json()).then(d=>{
      if (d.ok && d.configured) setStripeConfig(prev=>({...prev,...d}));
      setStripeLoaded(true);
    }).catch(()=>setStripeLoaded(true));
  },[]);

  const activeSubs = WTC_SUBSCRIBERS.filter(s=>s.status!=='Churned');
  const totalMRR = WTC_SUBSCRIBERS.reduce((s,c)=>s+c.mrr,0);
  const overdueRevenue = WTC_SUBSCRIBERS.filter(s=>s.billing==='Overdue').reduce((s,c)=>s+c.mrr,0);
  const totalMSSPs = WTC_SUBSCRIBERS.filter(s=>s.type==='MSSP').length;
  const totalManagedClients = WTC_SUBSCRIBERS.filter(s=>s.type==='MSSP').reduce((s,c)=>s+c.clients,0);
  const filtered = WTC_SUBSCRIBERS.filter(s=>(filterPlan==='All'||s.plan===filterPlan)&&(filterStatus==='All'||s.status===filterStatus));
  const planColor = {MSSP:'#8b6fff',Business:'#22d49a',Team:'#4f8fff',Community:'#6b7a94'};
  const statusColor = {Active:'#22d49a',Trial:'#f0a030',Overdue:'#f0405e',Churned:'#3a4050',Free:'#6b7a94'};

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <div>
          <h2 style={{fontSize:'0.88rem',fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
            🔧 Watchtower Admin
            <span style={{fontSize:'0.62rem',color:'#f0a030',background:'#f0a03012',padding:'2px 8px',borderRadius:4,border:'1px solid #f0a03025',fontWeight:700}}>PLATFORM ADMIN</span>
          </h2>
          <div style={{fontSize:'0.68rem',color:'var(--wt-muted)',marginTop:3}}>All organisations subscribed to Watchtower · Impersonate any tenant to view their dashboard</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:4,background:'var(--wt-card2)',borderRadius:7,padding:3,overflowX:'auto',flexShrink:0}}>
          {['analytics','subscribers','users','platform','stripe','saml','broadcast','ailog','audit'].map(v=>(
            <button key={v} onClick={()=>{setAdminView(v);if(v==='ailog')fetchAiLog();}} style={{padding:'5px 11px',borderRadius:5,border:'none',background:adminView===v?'#f0a030':'transparent',color:adminView===v?'#fff':'var(--wt-muted)',fontSize:'0.64rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',whiteSpace:'nowrap',flexShrink:0}}>{v==='ailog'?'✦ AI Log':v.charAt(0).toUpperCase()+v.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* Signup toggle — always visible at the top of admin portal */}
      <SignupToggle />

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
        {[
          {label:'Total MRR',      val:`£${totalMRR.toLocaleString()}`, sub:'monthly recurring', color:'#22d49a'},
          {label:'Active Orgs',    val:activeSubs.length,  sub:`${WTC_SUBSCRIBERS.length} total`, color:'#4f8fff'},
          {label:'MSSP Partners',  val:totalMSSPs,  sub:`${totalManagedClients} end-clients`, color:'#8b6fff'},
          {label:'Overdue',        val:overdueRevenue>0?`£${overdueRevenue}`:'£0', sub:overdueRevenue>0?'action needed':'all clear', color:overdueRevenue>0?'#f0405e':'#22d49a'},
        ].map(s=>(
          <div key={s.label} style={{padding:'14px 16px',background:'var(--wt-card)',border:`1px solid ${s.color}18`,borderRadius:12}}>
            <div style={{fontSize:'1.8rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.color,letterSpacing:-2,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:'0.58rem',fontWeight:700,color:s.color,textTransform:'uppercase',letterSpacing:'0.5px',marginTop:3}}>{s.sub}</div>
            <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>
      {adminView==='subscribers' && (
        <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
            <span style={{fontSize:'0.72rem',fontWeight:700}}>All Subscribers</span>
            <div style={{display:'flex',gap:4,marginLeft:'auto',flexWrap:'wrap'}}>
              {['All','Enterprise','Professional','Essentials','Community'].map(p=>(
                <button key={p} onClick={()=>setFilterPlan(p)} style={{padding:'3px 9px',borderRadius:5,border:`1px solid ${filterPlan===p?planColor[p]||'#4f8fff':'var(--wt-border2)'}`,background:filterPlan===p?(planColor[p]||'#4f8fff')+'15':'transparent',color:filterPlan===p?planColor[p]||'#4f8fff':'var(--wt-muted)',fontSize:'0.6rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>{p}</button>
              ))}
              <span style={{width:1,background:'var(--wt-border)',margin:'0 2px'}}/>
              {['All','Active','Trial','Overdue','Churned'].map(s=>(
                <button key={s} onClick={()=>setFilterStatus(s)} style={{padding:'3px 9px',borderRadius:5,border:`1px solid ${filterStatus===s?statusColor[s]||'#4f8fff':'var(--wt-border2)'}`,background:filterStatus===s?(statusColor[s]||'#4f8fff')+'15':'transparent',color:filterStatus===s?statusColor[s]||'#4f8fff':'var(--wt-muted)',fontSize:'0.6rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 90px 70px 60px 60px 140px',gap:8,padding:'6px 10px',fontSize:'0.56rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid var(--wt-border)',marginBottom:4}}>
            <span>Organisation</span><span style={{textAlign:'center'}}>Plan</span><span style={{textAlign:'center'}}>MRR</span><span style={{textAlign:'center'}}>Status</span><span style={{textAlign:'center'}}>Posture</span><span style={{textAlign:'right'}}>Actions</span>
          </div>
          {filtered.map(sub=>(
            <div key={sub.id} style={{display:'grid',gridTemplateColumns:'1fr 90px 70px 60px 60px 140px',gap:8,padding:'9px 10px',alignItems:'center',borderBottom:'1px solid var(--wt-border)',opacity:sub.status==='Churned'?0.4:1}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:'0.78rem',fontWeight:700}}>{sub.name}</span>
                  {sub.type==='MSSP' && <span style={{fontSize:'0.48rem',padding:'1px 5px',borderRadius:3,background:'#8b6fff15',color:'#8b6fff',fontWeight:700,border:'1px solid #8b6fff20'}}>MSSP · {sub.clients} clients</span>}
                </div>
                <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:1}}>Joined {sub.joined} · {sub.seats>0?sub.seats+' seats':'flat rate'}</div>
              </div>
              <div style={{textAlign:'center'}}><span style={{fontSize:'0.6rem',fontWeight:700,padding:'2px 7px',borderRadius:4,background:(planColor[sub.plan]||'#6b7a94')+'15',color:planColor[sub.plan]||'#6b7a94',border:`1px solid ${(planColor[sub.plan]||'#6b7a94')}20`}}>{sub.plan}</span></div>
              <div style={{textAlign:'center',fontSize:'0.74rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:sub.mrr>0?'var(--wt-text)':'var(--wt-dim)'}}>{sub.mrr>0?`£${sub.mrr}`:'—'}</div>
              <div style={{textAlign:'center'}}><span style={{fontSize:'0.56rem',fontWeight:700,padding:'2px 6px',borderRadius:3,background:(statusColor[sub.status]||'#6b7a94')+'15',color:statusColor[sub.status]||'#6b7a94'}}>{sub.status}</span></div>
              <div style={{textAlign:'center',fontSize:'0.74rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:sub.posture>=85?'#22d49a':sub.posture>=70?'#f0a030':sub.posture>0?'#f0405e':'var(--wt-dim)'}}>{sub.posture>0?sub.posture+'%':'—'}</div>
              <div style={{display:'flex',gap:4,justifyContent:'flex-end'}}>
                {sub.status!=='Churned' && <button onClick={async()=>{
                    await fetch('/api/admin/impersonate',{method:'POST',headers:{'Content-Type':'application/json','x-is-admin':'true','x-user-id':'admin','x-tenant-id':currentTenant||'global'},body:JSON.stringify({targetTenantId:sub.id,targetTenantName:sub.name})}).catch(()=>{});
                    setCurrentTenant(sub.id);setActiveTab('overview');
                  }} style={{padding:'4px 8px',borderRadius:5,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.58rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Impersonate →</button>}
                <button onClick={()=>setAdminBannerInput(`[${sub.name}] `)} style={{padding:'4px 7px',borderRadius:5,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.58rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>📢</button>
                {sub.billing==='Overdue' && <button onClick={()=>window.open(`mailto:billing@example.com?subject=Overdue Invoice — ${sub.name}&body=Hi,%0A%0AYour Watchtower subscription payment is overdue. Please settle at your earliest convenience.`,'_blank')} style={{padding:'4px 7px',borderRadius:5,border:'1px solid #f97316',background:'#f9731610',color:'#f97316',fontSize:'0.58rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>£ Chase</button>}
              </div>
            </div>
          ))}
          <div style={{marginTop:12,padding:'10px 12px',background:'var(--wt-card2)',borderRadius:8,display:'flex',gap:16,flexWrap:'wrap'}}>
            {['Enterprise','Professional','Essentials'].map(p=>{
              const subs=WTC_SUBSCRIBERS.filter(s=>s.plan===p&&s.status!=='Churned');
              const mrr=subs.reduce((s,c)=>s+c.mrr,0);
              return mrr>0?(<div key={p} style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:7,height:7,borderRadius:2,background:planColor[p],flexShrink:0}}/><span style={{fontSize:'0.66rem',color:'var(--wt-muted)'}}>{p}: <strong style={{color:planColor[p]}}>£{mrr}/mo</strong> · {subs.length} org{subs.length!==1?'s':''}</span></div>):null;
            })}
            <div style={{marginLeft:'auto',fontSize:'0.66rem',color:'var(--wt-muted)'}}>Total ARR: <strong style={{color:'#22d49a'}}>£{(totalMRR*12).toLocaleString()}</strong></div>
          </div>
        </div>
      )}

      {adminView==='analytics' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <AnalyticsView />
        </div>
      )}

      {adminView==='users' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>

          {/* Invite / Create user form */}
          <div style={{background:'var(--wt-card)',border:'1px solid #4f8fff20',borderRadius:12,padding:'18px 20px'}}>
            <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:4}}>Invite or Create Staff User</div>
            <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:14,lineHeight:1.6}}>Add a team member. Set a temp password to let them log in immediately, or leave blank to send an invite link.</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 140px 140px 110px',gap:10,alignItems:'flex-end',flexWrap:'wrap'}}>
              <div>
                <label style={{display:'block',fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Full Name</label>
                <input value={inviteForm.name} onChange={e=>setInviteForm(f=>({...f,name:e.target.value}))}
                  placeholder='Sarah Chen'
                  style={{width:'100%',padding:'8px 11px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:7,color:'var(--wt-text)',fontSize:'0.8rem',fontFamily:'Inter,sans-serif',outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Email Address</label>
                <input value={inviteForm.email} onChange={e=>setInviteForm(f=>({...f,email:e.target.value}))}
                  placeholder='sarah@yourcompany.com' type='email'
                  style={{width:'100%',padding:'8px 11px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:7,color:'var(--wt-text)',fontSize:'0.8rem',fontFamily:'Inter,sans-serif',outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Role</label>
                <select value={inviteForm.role} onChange={e=>setInviteForm(f=>({...f,role:e.target.value}))}
                  style={{width:'100%',padding:'8px 11px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:7,color:'var(--wt-text)',fontSize:'0.78rem',fontFamily:'Inter,sans-serif',outline:'none',cursor:'pointer'}}>
                  <option value='tech_admin'>Tech Admin</option>
                  <option value='sales'>Sales</option>
                  <option value='viewer'>Viewer</option>
                </select>
              </div>
              <div>
                <label style={{display:'block',fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Temp Password <span style={{color:'var(--wt-dim)',fontWeight:400,textTransform:'none'}}>(optional)</span></label>
                <input value={inviteForm.tempPassword} onChange={e=>setInviteForm(f=>({...f,tempPassword:e.target.value}))}
                  placeholder='Skip to send invite link'
                  type='text'
                  style={{width:'100%',padding:'8px 11px',background:'var(--wt-card2)',border:`1px solid ${inviteForm.tempPassword&&inviteForm.tempPassword.length<8?'#f0405e40':inviteForm.tempPassword.length>=8?'#22d49a40':'var(--wt-border2)'}`,borderRadius:7,color:'var(--wt-text)',fontSize:'0.78rem',fontFamily:'JetBrains Mono,monospace',outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:'0.62rem',fontWeight:700,color:'transparent',marginBottom:5}}>.</label>
                <button
                  onClick={async()=>{
                    if (!inviteForm.email || !inviteForm.name) return;
                    setInviteStatus('sending');
                    try {
                      if (inviteForm.tempPassword && inviteForm.tempPassword.length >= 8) {
                        // Create user directly with password — no invite email
                        const r = await fetch('/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create',name:inviteForm.name,email:inviteForm.email,role:inviteForm.role})});
                        const d = await r.json();
                        if (r.ok && d.user) {
                          // Set the temp password
                          await fetch('/api/admin/users/set-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:d.user.id,password:inviteForm.tempPassword})});
                          setStaffUsers(prev=>[...prev, {id:d.user.id, name:inviteForm.name, email:inviteForm.email, role:inviteForm.role, status:'Active', joined:new Date().toISOString().slice(0,10), lastSeen:'Never'}]);
                          setInviteForm({name:'',email:'',role:'viewer',tempPassword:''});
                          setInviteStatus('created');
                        } else { setInviteStatus('error'); }
                      } else {
                        // Send invite link
                        const r = await fetch('/api/auth/invite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:inviteForm.name,email:inviteForm.email,role:inviteForm.role})});
                        const d = await r.json();
                        if (r.ok) {
                          setStaffUsers(prev=>[...prev, {id:d.userId||('u'+Date.now()), name:inviteForm.name, email:inviteForm.email, role:inviteForm.role, status:'Pending', joined:new Date().toISOString().slice(0,10), lastSeen:'Never'}]);
                          setInviteForm({name:'',email:'',role:'viewer',tempPassword:''});
                          setInviteStatus('sent');
                        } else { setInviteStatus('error'); }
                      }
                    } catch(e) { setInviteStatus('error'); }
                    setTimeout(()=>setInviteStatus(null), 4000);
                  }}
                  disabled={inviteStatus==='sending'||!inviteForm.email||!inviteForm.name||(!!inviteForm.tempPassword&&inviteForm.tempPassword.length<8)}
                  style={{width:'100%',padding:'9px 0',borderRadius:7,border:'none',background:inviteStatus==='error'?'#f0405e':inviteForm.tempPassword&&inviteForm.tempPassword.length>=8?'#22d49a':'#4f8fff',color:'#fff',fontSize:'0.78rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',opacity:inviteStatus==='sending'||!inviteForm.email||!inviteForm.name||(!!inviteForm.tempPassword&&inviteForm.tempPassword.length<8)?0.5:1}}>
                  {inviteStatus==='sending'?'…':inviteStatus==='sent'?'✓ Invite sent!':inviteStatus==='created'?'✓ User created!':inviteStatus==='error'?'Error — retry':inviteForm.tempPassword&&inviteForm.tempPassword.length>=8?'Create User':'Send Invite'}
                </button>
              </div>
            </div>
          </div>

          {/* Role capability guide */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {[
              {role:'Tech Admin', color:'#4f8fff', icon:'⚙️', caps:[
                'All customer account adds, moves, changes',
                'Connect / disconnect tool integrations',
                'Edit tenant settings and billing',
                'View all tabs including Admin',
                'Cannot invite other Admins',
              ]},
              {role:'Sales', color:'#22d49a', icon:'📈', caps:[
                'View-only access to security tabs',
                'Full Sales Dashboard access',
                'Set and track MRR/ARR targets',
                'View AI customer mix strategy',
                'Cannot modify customer settings',
              ]},
              {role:'Viewer', color:'#8b6fff', icon:'👁', caps:[
                'Overview, Alerts, Coverage, Vulns',
                'Intel and Incidents (read-only)',
                'No Tools, Admin, or Sales tabs',
                'Cannot modify any settings',
                'Cannot trigger actions',
              ]},
            ].map(r=>(
              <div key={r.role} style={{background:'var(--wt-card)',border:`1px solid ${r.color}20`,borderRadius:10,padding:'14px 16px'}}>
                <div style={{fontSize:'0.76rem',fontWeight:700,color:r.color,marginBottom:8}}>{r.icon} {r.role}</div>
                {r.caps.map(c=>(
                  <div key={c} style={{fontSize:'0.66rem',color:'var(--wt-secondary)',padding:'2px 0 2px 12px',position:'relative',lineHeight:1.4}}>
                    <span style={{position:'absolute',left:0,top:6,width:4,height:4,borderRadius:'50%',background:r.color,display:'block'}}/>
                    {c}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Staff user list */}
          <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
            <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:12}}>Team Members ({staffUsers.length}){!usersLoaded&&<span style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginLeft:8,fontWeight:400}}>Loading…</span>}</div>
            {/* Column headers */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 180px 100px 80px 160px',gap:8,padding:'5px 10px',fontSize:'0.56rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid var(--wt-border)',marginBottom:4}}>
              <span>User</span><span>Email</span><span>Role</span><span>Status</span><span style={{textAlign:'right'}}>Actions</span>
            </div>
            {staffUsers.map(user=>{
              const roleColor = {owner:'#f0a030',tech_admin:'#4f8fff',sales:'#22d49a',viewer:'#8b6fff'}[user.role]||'#6b7a94';
              const roleLabel = {owner:'Owner',tech_admin:'Tech Admin',sales:'Sales',viewer:'Viewer'}[user.role]||user.role;
              const isEditing = editingUser===user.id;
              return (
                <div key={user.id} style={{display:'grid',gridTemplateColumns:'1fr 180px 100px 80px 160px',gap:8,padding:'9px 10px',alignItems:'center',borderBottom:'1px solid var(--wt-border)',opacity:user.status==='Pending'?0.75:1}}>
                  <div>
                    <div style={{fontSize:'0.78rem',fontWeight:600}}>{user.name}</div>
                    <div style={{fontSize:'0.58rem',color:'var(--wt-dim)',marginTop:1}}>Last seen: {user.lastSeen}</div>
                  </div>
                  <div style={{fontSize:'0.66rem',color:'var(--wt-muted)',fontFamily:'JetBrains Mono,monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.email}</div>
                  <div>
                    {isEditing ? (
                      <select defaultValue={user.role}
                        onChange={async e=>{
                          const newRole = e.target.value;
                          setStaffUsers(prev=>prev.map(u=>u.id===user.id?{...u,role:newRole}:u));
                          setEditingUser(null);
                          await fetch('/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'update',userId:user.id,role:newRole})}).catch(()=>{});
                        }}
                        style={{padding:'3px 6px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:5,color:'var(--wt-text)',fontSize:'0.68rem',fontFamily:'Inter,sans-serif',outline:'none',cursor:'pointer'}}>
                        <option value='tech_admin'>Tech Admin</option>
                        <option value='sales'>Sales</option>
                        <option value='viewer'>Viewer</option>
                      </select>
                    ) : (
                      <span style={{fontSize:'0.62rem',fontWeight:700,padding:'2px 8px',borderRadius:4,background:roleColor+'15',color:roleColor,border:`1px solid ${roleColor}25`}}>{roleLabel}</span>
                    )}
                  </div>
                  <div>
                    <span style={{fontSize:'0.58rem',fontWeight:700,padding:'2px 6px',borderRadius:3,background:user.status==='Active'?'#22d49a12':'#f0a03012',color:user.status==='Active'?'#22d49a':'#f0a030'}}>{user.status}</span>
                  </div>
                  <div style={{display:'flex',gap:5,justifyContent:'flex-end',flexWrap:'wrap'}}>
                    {!isEditing && (
                      <button onClick={()=>setEditingUser(user.id)} style={{padding:'3px 8px',borderRadius:5,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Edit</button>
                    )}
                    {isEditing && (
                      <button onClick={()=>setEditingUser(null)} style={{padding:'3px 8px',borderRadius:5,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Cancel</button>
                    )}
                    {/* Set temp password */}
                    {(()=>{
                      const ps = setPassState[user.id] || {};
                      if (ps.open) return (
                        <div style={{display:'flex',gap:4,alignItems:'center'}}>
                          <input
                            autoFocus
                            type='text'
                            placeholder='Min 8 chars'
                            value={ps.val||''}
                            onChange={e=>setSetPassState(prev=>({...prev,[user.id]:{...ps,val:e.target.value,done:false,error:null}}))}
                            onKeyDown={async e=>{
                              if(e.key==='Escape') setSetPassState(prev=>({...prev,[user.id]:{...ps,open:false}}));
                              if(e.key==='Enter') {
                                if(!ps.val||ps.val.length<8) return;
                                setSetPassState(prev=>({...prev,[user.id]:{...ps,saving:true}}));
                                const r = await fetch('/api/admin/users/set-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:user.email,password:ps.val})});
                                const d = await r.json();
                                if(r.ok) {
                                  setStaffUsers(prev=>prev.map(u=>u.id===user.id?{...u,status:'Active'}:u));
                                  setSetPassState(prev=>({...prev,[user.id]:{open:false,done:true}}));
                                } else {
                                  setSetPassState(prev=>({...prev,[user.id]:{...ps,saving:false,error:d.error||'Failed'}}));
                                }
                              }
                            }}
                            style={{padding:'3px 7px',width:120,background:'var(--wt-card2)',border:'1px solid #4f8fff40',borderRadius:5,color:'var(--wt-text)',fontSize:'0.66rem',fontFamily:'JetBrains Mono,monospace',outline:'none'}}
                          />
                          <button
                            disabled={ps.saving||!ps.val||ps.val.length<8}
                            onClick={async()=>{
                              if(!ps.val||ps.val.length<8) return;
                              setSetPassState(prev=>({...prev,[user.id]:{...ps,saving:true}}));
                              const r = await fetch('/api/admin/users/set-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:user.email,password:ps.val})});
                              const d = await r.json();
                              if(r.ok) {
                                setStaffUsers(prev=>prev.map(u=>u.id===user.id?{...u,status:'Active'}:u));
                                setSetPassState(prev=>({...prev,[user.id]:{open:false,done:true}}));
                              } else {
                                setSetPassState(prev=>({...prev,[user.id]:{...ps,saving:false,error:d.error||'Failed'}}));
                              }
                            }}
                            style={{padding:'3px 8px',borderRadius:5,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.6rem',fontWeight:700,cursor:ps.saving||!ps.val||ps.val.length<8?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',opacity:ps.saving||!ps.val||ps.val.length<8?0.5:1}}>
                            {ps.saving?'…':'Set'}
                          </button>
                          <button onClick={()=>setSetPassState(prev=>({...prev,[user.id]:{...ps,open:false}}))} style={{padding:'3px 6px',borderRadius:5,border:'1px solid var(--wt-border)',background:'transparent',color:'var(--wt-dim)',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>✕</button>
                          {ps.error&&<span style={{fontSize:'0.58rem',color:'#f0405e'}}>{ps.error}</span>}
                        </div>
                      );
                      return (
                        <button
                          onClick={()=>setSetPassState(prev=>({...prev,[user.id]:{open:true,val:'',done:false}}))}
                          style={{padding:'3px 8px',borderRadius:5,border:`1px solid ${setPassState[user.id]?.done?'#22d49a30':'#f0a03025'}`,background:setPassState[user.id]?.done?'#22d49a10':'#f0a03008',color:setPassState[user.id]?.done?'#22d49a':'#f0a030',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                          {setPassState[user.id]?.done?'✓ Pass set':'Set Pass'}
                        </button>
                      );
                    })()}
                    {(
                      <button onClick={async()=>{
                        if (!user.id) { console.error('[remove] user.id is undefined', user); return; }
                        if (!window.confirm(`Remove ${user.name||user.email} from the team? This cannot be undone.`)) return;
                        // Optimistic remove
                        setStaffUsers(prev=>prev.filter(u=>u.id!==user.id));
                        try {
                          const r = await fetch('/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete',userId:user.id})});
                          if (!r.ok) {
                            const d = await r.json().catch(()=>({}));
                            console.error('[remove] API error', r.status, d);
                            // Revert on failure
                            setStaffUsers(prev=>[...prev, user].sort((a,b)=>a.name?.localeCompare(b.name||'')||0));
                          }
                        } catch(e) {
                          console.error('[remove] fetch error', e);
                          setStaffUsers(prev=>[...prev, user].sort((a,b)=>a.name?.localeCompare(b.name||'')||0));
                        }
                      }}
                        style={{padding:'3px 8px',borderRadius:5,border:'1px solid #f0405e25',background:'#f0405e08',color:'#f0405e',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Remove</button>
                    )}
                    {user.status==='Pending' && (
                      <button style={{padding:'3px 8px',borderRadius:5,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Resend</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {adminView==='platform' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {/* Stats grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {[
            {label:'API Calls Today',val:'12,847',color:'#4f8fff',sub:'↑ 8% vs yesterday'},
            {label:'AI Tokens Used',val:'4.2M',color:'#8b6fff',sub:'across all tenants'},
            {label:'Redis Ops/min',val:'847',color:'#22d49a',sub:'avg latency 1.2ms'},
            {label:'Avg Uptime (30d)',val:'99.97%',color:'#22d49a',sub:'1 incident this month'},
            {label:'Active Sessions',val:'23',color:'#4f8fff',sub:'right now'},
            {label:'Sync Errors (24h)',val:'2',color:'#f0405e',sub:'Taegis · Splunk'},
            {label:'Alerts Triaged',val:'1,847',color:'#f0a030',sub:'across all orgs today'},
            {label:'New Signups (7d)',val:'3',color:'#22d49a',sub:'2 trial, 1 paid'},
            {label:'Churn (30d)',val:'1',color:'#f0405e',sub:'Logistics UK Ltd'},
          ].map(s=>(
            <div key={s.label} style={{padding:'14px 16px',background:'var(--wt-card)',border:`1px solid ${s.color}18`,borderRadius:12}}>
              <div style={{fontSize:'1.6rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.color,letterSpacing:-2,lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:4}}>{s.label}</div>
              <div style={{fontSize:'0.58rem',color:s.color,marginTop:2,opacity:0.8}}>{s.sub}</div>
            </div>
          ))}
          </div>
      </div>
      )}

      {adminView==='stripe' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{padding:'16px 18px',background:'var(--wt-card)',border:'1px solid #8b6fff20',borderRadius:12}}>
            <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:4,display:'flex',alignItems:'center',gap:8}}>
              💳 Stripe Configuration
              {stripeConfig.publishableKey && stripeConfig.publishableKey !== '••••••••' && <span style={{fontSize:'0.58rem',color:'#22d49a',background:'#22d49a12',padding:'2px 7px',borderRadius:4,border:'1px solid #22d49a25'}}>✓ Configured</span>}
            </div>
            <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:18,lineHeight:1.6}}>
              Connect your Stripe account to enable subscription payments. Keys are encrypted at rest.
              <a href='https://dashboard.stripe.com/apikeys' target='_blank' rel='noopener' style={{color:'#4f8fff',marginLeft:6}}>Get your keys →</a>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[
                {key:'publishableKey', label:'Publishable Key', placeholder:'pk_live_...', hint:'Safe to use in browser'},
                {key:'secretKey', label:'Secret Key', placeholder:'sk_live_...', hint:'Never share — server only', secret:true},
                {key:'webhookSecret', label:'Webhook Secret', placeholder:'whsec_...', hint:'From Stripe webhook settings', secret:true},
                {key:'priceMssp', label:'MSSP Price ID', placeholder:'price_...', hint:'Monthly Enterprise/MSSP plan price ID'},
                {key:'priceBusiness', label:'Business Price ID', placeholder:'price_...', hint:'Monthly Professional plan price ID'},
                {key:'priceTeamPerSeat', label:'Team Per-Seat Price ID', placeholder:'price_...', hint:'Per-seat Essentials plan price ID'},
              ].map(field=>(
                <div key={field.key}>
                  <label style={{display:'block',fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>{field.label}</label>
                  <input
                    type={field.secret ? 'password' : 'text'}
                    value={stripeConfig[field.key] || ''}
                    onChange={e=>setStripeConfig(prev=>({...prev,[field.key]:e.target.value}))}
                    placeholder={field.placeholder}
                    style={{width:'100%',padding:'8px 11px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:7,color:'var(--wt-text)',fontSize:'0.78rem',fontFamily:'JetBrains Mono,monospace',outline:'none',boxSizing:'border-box'}}
                  />
                  <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:3}}>{field.hint}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:16,display:'flex',gap:10,alignItems:'center'}}>
              <button
                onClick={async()=>{
                  setStripeSaving(true); setStripeSaved(false);
                  try {
                    const res = await fetch('/api/admin/stripe-config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(stripeConfig)});
                    const d = await res.json();
                    if (d.ok) { setStripeSaved(true); setTimeout(()=>setStripeSaved(false),3000); }
                  } catch(e) {}
                  setStripeSaving(false);
                }}
                disabled={stripeSaving}
                style={{padding:'9px 22px',borderRadius:8,border:'none',background:'#8b6fff',color:'#fff',fontSize:'0.78rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',opacity:stripeSaving?0.7:1}}>
                {stripeSaving?'Saving…':'Save Stripe Config'}
              </button>
              {stripeSaved && <span style={{fontSize:'0.72rem',color:'#22d49a',fontWeight:600}}>✓ Saved and encrypted</span>}
            </div>
          </div>

          <div style={{padding:'14px 18px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12}}>
            <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:10}}>Webhook endpoint to configure in Stripe</div>
            <div style={{padding:'10px 12px',background:'var(--wt-card2)',borderRadius:7,fontFamily:'JetBrains Mono,monospace',fontSize:'0.72rem',color:'#4f8fff',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>https://getwatchtower.io/api/stripe/webhook</span>
              <button onClick={()=>navigator.clipboard.writeText('https://getwatchtower.io/api/stripe/webhook')} style={{padding:'3px 8px',borderRadius:5,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Copy</button>
            </div>
            <div style={{fontSize:'0.66rem',color:'var(--wt-muted)',marginTop:8,lineHeight:1.6}}>
              Events to enable: <strong style={{color:'var(--wt-text)'}}>checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed</strong>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {[
              {plan:'Enterprise', price:'£3,499/mo', id:stripeConfig.priceMssp, color:'#8b6fff'},
              {plan:'Professional', price:'£1,199/mo', id:stripeConfig.priceBusiness, color:'#22d49a'},
              {plan:'Essentials', price:'£149/seat', id:stripeConfig.priceTeamPerSeat, color:'#4f8fff'},
            ].map(p=>(
              <div key={p.plan} style={{padding:'12px 14px',background:'var(--wt-card)',border:`1px solid ${p.color}20`,borderRadius:10}}>
                <div style={{fontSize:'0.7rem',fontWeight:700,color:p.color,marginBottom:2}}>{p.plan}</div>
                <div style={{fontSize:'0.84rem',fontWeight:800,fontFamily:'JetBrains Mono,monospace',marginBottom:6}}>{p.price}</div>
                <div style={{fontSize:'0.6rem',color:p.id&&p.id!=='••••••••'?'#22d49a':'#f0405e',fontWeight:600}}>{p.id&&p.id!=='••••••••'?'✓ Price ID set':'⚠ Price ID missing'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminView==='saml' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{padding:'16px 18px',background:'var(--wt-card)',border:'1px solid #4f8fff20',borderRadius:12}}>
            <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:4,display:'flex',alignItems:'center',gap:10}}>
              🔐 SAML SSO Configuration
              <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:'0.72rem',fontWeight:600,color:samlConfig.enabled?'#22d49a':'#6b7a94'}}>
                <input type='checkbox' checked={samlConfig.enabled} onChange={e=>setSamlConfig(prev=>({...prev,enabled:e.target.checked}))}
                  style={{cursor:'pointer'}}/>
                {samlConfig.enabled?'Enabled':'Disabled'}
              </label>
            </div>
            <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:18,lineHeight:1.6}}>
              Allow staff to sign in via your company's Identity Provider (Okta, Azure AD, Google Workspace, etc.) using SAML 2.0.
              Users without accounts are auto-provisioned with the default role.
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              {[
                {key:'idpEntityId', label:'IdP Entity ID', placeholder:'https://your-idp.okta.com/...'},
                {key:'idpSsoUrl', label:'IdP SSO URL (POST binding)', placeholder:'https://your-idp.okta.com/app/.../sso/saml'},
                {key:'spEntityId', label:'SP Entity ID (your domain)', placeholder:'https://getwatchtower.io'},
                {key:'defaultRole', label:'Default role for new SAML users', type:'select'},
                {key:'domains', label:'Allowed email domains (comma-separated)', placeholder:'yourcompany.com, subsidiary.com'},
              ].map(field=>(
                <div key={field.key} style={{gridColumn:field.key==='idpCert'?'1 / -1':undefined}}>
                  <label style={{display:'block',fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>{field.label}</label>
                  {field.type==='select'?(
                    <select value={samlConfig.defaultRole} onChange={e=>setSamlConfig(prev=>({...prev,defaultRole:e.target.value}))}
                      style={{width:'100%',padding:'8px 11px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:7,color:'var(--wt-text)',fontSize:'0.78rem',fontFamily:'Inter,sans-serif',outline:'none',cursor:'pointer'}}>
                      <option value='tech_admin'>Tech Admin</option>
                      <option value='sales'>Sales</option>
                      <option value='viewer'>Viewer</option>
                    </select>
                  ):(
                    <input value={samlConfig[field.key]||''} onChange={e=>setSamlConfig(prev=>({...prev,[field.key]:e.target.value}))}
                      placeholder={field.placeholder||''}
                      style={{width:'100%',padding:'8px 11px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:7,color:'var(--wt-text)',fontSize:'0.78rem',fontFamily:'JetBrains Mono,monospace',outline:'none',boxSizing:'border-box'}}/>
                  )}
                </div>
              ))}
            </div>

            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>IdP Certificate (X.509 PEM)</label>
              <textarea value={samlConfig.idpCert||''} onChange={e=>setSamlConfig(prev=>({...prev,idpCert:e.target.value}))}
                rows={4} placeholder={'-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----'}
                style={{width:'100%',padding:'8px 11px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:7,color:'var(--wt-text)',fontSize:'0.72rem',fontFamily:'JetBrains Mono,monospace',outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
            </div>

            <div style={{marginBottom:16,padding:'12px 14px',background:'var(--wt-card2)',borderRadius:8,border:'1px solid var(--wt-border)'}}>
              <div style={{fontSize:'0.7rem',fontWeight:700,marginBottom:6}}>Attribute Mapping</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {[['email','Email attribute','email'],['name','Name attribute','displayName'],['role','Role attribute (optional)','role']].map(([key,lbl,ph])=>(
                  <div key={key}>
                    <label style={{display:'block',fontSize:'0.6rem',fontWeight:600,color:'var(--wt-dim)',marginBottom:3}}>{lbl}</label>
                    <input value={(samlConfig.attributeMapping||{})[key]||''} onChange={e=>setSamlConfig(prev=>({...prev,attributeMapping:{...prev.attributeMapping,[key]:e.target.value}}))}
                      placeholder={ph}
                      style={{width:'100%',padding:'5px 8px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:5,color:'var(--wt-text)',fontSize:'0.72rem',fontFamily:'JetBrains Mono,monospace',outline:'none',boxSizing:'border-box'}}/>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
              <button onClick={async()=>{
                setSamlSaving(true);setSamlSaved(false);
                const payload={...samlConfig,domains:samlConfig.domains?samlConfig.domains.split(',').map(d=>d.trim()).filter(Boolean):[]};
                try{const r=await fetch('/api/admin/saml-config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
                const d=await r.json();if(d.ok){setSamlSaved(true);setTimeout(()=>setSamlSaved(false),3000);}}catch(e){}
                setSamlSaving(false);
              }} disabled={samlSaving} style={{padding:'9px 22px',borderRadius:8,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.78rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',opacity:samlSaving?0.7:1}}>
                {samlSaving?'Saving…':'Save SAML Config'}
              </button>
              {samlSaved&&<span style={{fontSize:'0.72rem',color:'#22d49a',fontWeight:600}}>✓ Saved</span>}
            </div>
          </div>

          <div style={{padding:'14px 18px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12}}>
            <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:10}}>SP Metadata & Configuration</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                {label:'SP Metadata URL', val:'https://getwatchtower.io/api/auth/saml/metadata'},
                {label:'ACS URL (AssertionConsumerService)', val:'https://getwatchtower.io/api/auth/saml/callback'},
                {label:'SP Entity ID', val:'https://getwatchtower.io'},
                {label:'SSO Login URL', val:`https://getwatchtower.io/api/auth/saml?tenant=${currentTenant}`},
              ].map(item=>(
                <div key={item.label} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:'var(--wt-card2)',borderRadius:7}}>
                  <span style={{fontSize:'0.62rem',color:'var(--wt-muted)',minWidth:200,fontWeight:600}}>{item.label}</span>
                  <span style={{flex:1,fontFamily:'JetBrains Mono,monospace',fontSize:'0.66rem',color:'#4f8fff'}}>{item.val}</span>
                  <button onClick={()=>navigator.clipboard.writeText(item.val)} style={{padding:'3px 8px',borderRadius:5,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Copy</button>
                </div>
              ))}
            </div>
            <div style={{marginTop:10,fontSize:'0.68rem',color:'var(--wt-muted)',lineHeight:1.7}}>
              Supported IdPs: <strong style={{color:'var(--wt-text)'}}>Okta · Azure AD / Entra ID · Google Workspace · OneLogin · Ping Identity · JumpCloud · Any SAML 2.0 IdP</strong>
            </div>
          </div>
        </div>
      )}

      {adminView==='broadcast' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
            <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:4}}>📢 Broadcast to All Subscribers</div>
            <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:12,lineHeight:1.6}}>Send a dismissable banner to every logged-in user across all tenants.</div>
            <textarea value={adminBannerInput} onChange={e=>setAdminBannerInput(e.target.value)} placeholder='e.g. Scheduled maintenance Sunday 02:00–04:00 UTC…' rows={3} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:'var(--wt-text)',fontSize:'0.78rem',fontFamily:'Inter,sans-serif',resize:'none',outline:'none',boxSizing:'border-box'}} />
            <div style={{display:'flex',gap:8,marginTop:10}}>
              <button onClick={()=>{if(!adminBannerInput.trim())return;setClientBanner(adminBannerInput.trim());setAdminBannerInput('');fetch('/api/settings/user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientBanner:adminBannerInput.trim()})}).catch(()=>{});}} style={{padding:'8px 20px',borderRadius:8,border:'none',background:'#f0a030',color:'#fff',fontSize:'0.78rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>📢 Publish Platform-Wide</button>
              {clientBanner && <button onClick={()=>{setClientBanner(null);fetch('/api/settings/user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientBanner:''})}).catch(()=>{});}} style={{padding:'8px 16px',borderRadius:8,border:'1px solid #f0405e30',background:'#f0405e0a',color:'#f0405e',fontSize:'0.78rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>✕ Clear</button>}
            </div>
            {clientBanner && <div style={{marginTop:10,padding:'10px 14px',background:'#f0a03012',border:'1px solid #f0a03030',borderRadius:8,fontSize:'0.74rem',color:'#f0a030'}}>📢 Active: {clientBanner}</div>}
          </div>
          <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
            <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:12}}>Target Specific Subscriber</div>
            {WTC_SUBSCRIBERS.filter(s=>s.status!=='Churned').map(sub=>(
              <div key={sub.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--wt-border)'}}>
                <span style={{flex:1,fontSize:'0.76rem'}}>{sub.name}</span>
                <span style={{fontSize:'0.58rem',color:planColor[sub.plan]||'#6b7a94',fontWeight:700}}>{sub.plan}</span>
                <button onClick={()=>setAdminBannerInput(`[${sub.name}] `)} style={{padding:'4px 10px',borderRadius:6,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.62rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Compose →</button>
              </div>
            ))}
          </div>
        </div>
      )}



      {adminView==='ailog' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <h3 style={{fontSize:'0.88rem',fontWeight:700}}>AI Query Log</h3>
            <span style={{fontSize:'0.62rem',color:'var(--wt-muted)'}}>Every AI call through Watchtower — admin only</span>
            <button onClick={fetchAiLog} disabled={aiLogLoading} style={{marginLeft:'auto',padding:'4px 12px',borderRadius:5,border:'1px solid #4f8fff28',background:'#4f8fff0a',color:'#4f8fff',fontSize:'0.64rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>{aiLogLoading?'Loading…':'⟳ Refresh'}</button>
          </div>
          {aiLog && aiLog.stats && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
              {[{l:'Total',v:aiLog.stats.total,c:'#4f8fff'},{l:'OK',v:aiLog.stats.ok,c:'#22d49a'},{l:'Errors',v:aiLog.stats.errors,c:'#f0405e'},{l:'Avg ms',v:aiLog.stats.avgDurationMs,c:'#f0a030'}].map(s=>(
                <div key={s.l} style={{padding:'10px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:8,textAlign:'center'}}>
                  <div style={{fontSize:'1.3rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.c}}>{s.v}</div>
                  <div style={{fontSize:'0.58rem',color:'var(--wt-dim)',marginTop:2}}>{s.l}</div>
                </div>
              ))}
              {aiLog.stats.byType && Object.entries(aiLog.stats.byType).length > 0 && (
                <div style={{gridColumn:'1/-1',display:'flex',gap:6,flexWrap:'wrap',padding:'8px 10px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:8}}>
                  <span style={{fontSize:'0.58rem',color:'var(--wt-dim)',marginRight:4,alignSelf:'center'}}>By type:</span>
                  {Object.entries(aiLog.stats.byType).map(([type,count])=>{
                    const tc = {'triage':'#f0405e','vuln_assist':'#8b6fff','intel':'#22d49a','copilot':'#4f8fff','shift_handover':'#f0a030','other':'#6b7a94'};
                    const c = tc[type]||'#6b7a94';
                    return <span key={type} style={{fontSize:'0.6rem',padding:'2px 8px',borderRadius:4,background:c+'15',color:c,border:'1px solid '+c+'30',fontWeight:700}}>{type}: {count}</span>;
                  })}
                </div>
              )}
            </div>
          )}
          {!aiLog && !aiLogLoading && (
            <div style={{padding:'32px',textAlign:'center',color:'var(--wt-muted)',fontSize:'0.76rem',border:'1px dashed var(--wt-border)',borderRadius:10}}>Click Refresh to load AI query log. Entries appear after any AI action (triage, co-pilot, intel, vuln assist).</div>
          )}
          {aiLogLoading && <div style={{padding:'20px',textAlign:'center',color:'var(--wt-muted)',fontSize:'0.76rem'}}>Loading…</div>}
          {aiLog && aiLog.entries && aiLog.entries.length === 0 && (
            <div style={{padding:'20px',textAlign:'center',color:'var(--wt-muted)',fontSize:'0.76rem'}}>No AI queries logged yet. Run triage, open Co-Pilot, or fetch threat intel to see entries.</div>
          )}
          {aiLog && aiLog.entries && aiLog.entries.length > 0 && (
            <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:10,overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'60px minmax(70px,90px) minmax(80px,110px) 1fr 48px 48px',padding:'6px 12px',borderBottom:'1px solid var(--wt-border)',fontSize:'0.66rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                <span>Time</span><span>Type</span><span>User / Tenant</span><span>Prompt / Context</span><span>ms</span><span>Status</span>
              </div>
              <div style={{maxHeight:500,overflowY:'auto'}}>
                {aiLog.entries.map((e,i)=>{
                  const tc = {'triage':'#f0405e','vuln_assist':'#8b6fff','intel':'#22d49a','copilot':'#4f8fff','shift_handover':'#f0a030','other':'#6b7a94'};
                  const c = tc[e.type]||'#6b7a94';
                  const ctx = e.alertTitle?'Alert: '+e.alertTitle:e.vulnCve?'Vuln: '+e.vulnCve:e.industry&&e.industry!=='ioc_hunt'?'Intel: '+e.industry:e.promptPreview||'—';
                  return (
                    <div key={i} style={{display:'grid',gridTemplateColumns:'60px minmax(70px,90px) minmax(80px,110px) 1fr 48px 48px',padding:'6px 12px',borderBottom:'1px solid #1d2535',background:i%2===0?'transparent':'var(--wt-card2)',fontSize:'0.68rem',alignItems:'center',gap:4}}>
                      <span style={{color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace',fontSize:'0.64rem'}}>{new Date(e.ts).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>
                      <span style={{padding:'1px 5px',borderRadius:3,background:c+'18',color:c,border:'1px solid '+c+'30',fontWeight:700,fontSize:'0.64rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.type}</span>
                      <div style={{overflow:'hidden'}}><div style={{fontWeight:600,color:'var(--wt-text)',fontSize:'0.68rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.userId||'anon'}</div><div style={{fontSize:'0.62rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{e.tenantId||'global'}</div></div>
                      <span style={{color:'var(--wt-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:'0.6rem'}} title={ctx}>{ctx.slice(0,80)}</span>
                      <span style={{color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace',fontSize:'0.56rem'}}>{e.durationMs}ms</span>
                      <span style={{fontWeight:700,fontSize:'0.6rem',color:e.ok?'#22d49a':'#f0405e'}}>{e.ok?'✓ OK':'✗ '+((e.error||'err').slice(0,15))}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

        {adminView==='audit' && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{fontSize:'0.82rem',fontWeight:700}}>Analyst Audit Log</div>
            <div style={{fontSize:'0.72rem',color:'var(--wt-muted)',marginBottom:4}}>FP/TP verdicts, incident status changes, auto-responses. Last 100 entries.</div>
            <AuditLogView tenantId='global' />
          </div>
        )}
    </div>
  );
}