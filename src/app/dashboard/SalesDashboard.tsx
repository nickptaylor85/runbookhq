// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import React from 'react';
export default function SalesDashboard() {
  const [mrrTarget, setMrrTarget] = useState('');
  const [arrTarget, setArrTarget] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Current revenue data (in production, load from /api/admin/analytics)
  const CURRENT = {
    mrr: 2814,  // £ per month
    arr: 33768,
    customers: { mssp:2, business:3, team:2, community:1 },
    growth: { jan:1890, feb:2200, mar:2814 }, // last 3 months MRR
    churn: 1,
    newThisMonth: 1,
    pipeline: 4, // leads in pipeline
  };

  const PLAN_VALUES = {
    mssp:     { name:'MSSP',     mrr:799,  label:'£799+/mo', color:'#8b6fff', clients:'+ £79/client' },
    business: { name:'Business', mrr:199,  label:'£199/mo',  color:'#22d49a' },
    team:     { name:'Team',     mrr:196,  label:'~£196/mo', color:'#4f8fff', note:'avg 4 seats × £49' },
    community:{ name:'Community',mrr:0,    label:'Free',     color:'#6b7a94' },
  };

  const mrrGap = mrrTarget ? Math.max(0, parseInt(mrrTarget.split('').filter(c=>c>='0'&&c<='9').join('')) - CURRENT.mrr) : 0;
  const arrGap = arrTarget ? Math.max(0, parseInt(arrTarget.split('').filter(c=>c>='0'&&c<='9').join('')) - CURRENT.arr) : 0;
  const effectiveGap = mrrGap || (arrGap ? Math.ceil(arrGap/12) : 0);

  // Calculate how many of each plan type needed to fill the gap
  const mixes = effectiveGap > 0 ? [
    { label:'All MSSP',     plans:'MSSP partners', count:Math.ceil(effectiveGap/799),   mrr:Math.ceil(effectiveGap/799)*799,   color:'#8b6fff', note:'Highest value — longer sales cycle' },
    { label:'All Business', plans:'Business orgs', count:Math.ceil(effectiveGap/199),   mrr:Math.ceil(effectiveGap/199)*199,   color:'#22d49a', note:'Mid-market, 2-4 week close' },
    { label:'All Team',     plans:'Team plans',    count:Math.ceil(effectiveGap/147),   mrr:Math.ceil(effectiveGap/147)*147,   color:'#4f8fff', note:'SMB, fastest close, lower ACV' },
    { label:'Mixed (recommended)', plans:'1 MSSP + Business',
      count: 1 + Math.ceil(Math.max(0,effectiveGap-799)/199),
      mrr: 799 + Math.ceil(Math.max(0,effectiveGap-799)/199)*199,
      color:'#f0a030', note:'Balance of velocity + value' },
  ] : [];

  function getAiAnalysis() {
    if (!effectiveGap || analysisLoading) return;
    setAnalysisLoading(true);
    setAiAnalysis(null);
    const mrrVal = mrrTarget ? parseInt(mrrTarget) : Math.ceil(arrGap/12) + CURRENT.mrr;
    const prompt = `You are a SaaS sales strategist for Watchtower, a cybersecurity SOC platform.

Current MRR: £${CURRENT.mrr}/mo · ARR: £${CURRENT.arr}/yr
Customers: ${CURRENT.customers.mssp} MSSP, ${CURRENT.customers.business} Business, ${CURRENT.customers.team} Team
MoM growth: £${CURRENT.growth.jan} → £${CURRENT.growth.feb} → £${CURRENT.growth.mar}
Target MRR: £${mrrVal}/mo · Gap to close: £${effectiveGap}/mo

Plans: MSSP £799/mo+£79/client | Business £199/mo | Team £49/seat

Provide a concise go-to-market strategy to close the gap. Include:
1. IDEAL CUSTOMER PROFILE: Who to target (industry, size, pain points)
2. CHANNELS: Top 3 acquisition channels
3. CONVERSION: Key tactics to accelerate close
4. TIMELINE: Realistic timeline to hit target
Keep it under 200 words, punchy and actionable.`;

    fetch('/api/copilot', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({prompt}),
    })
    .then(r=>r.json())
    .then(d=>{
      setAiAnalysis(d.ok ? d.response : (d.error || d.message || 'Could not generate analysis. Check your Anthropic API key in Tools.'));
      setAnalysisLoading(false);
    })
    .catch(e=>{ setAiAnalysis('Error: ' + e.message); setAnalysisLoading(false); });
  }

  // Auto-run analysis when target is set (debounced 800ms)
  const prevGapRef = React.useRef(0);
  React.useEffect(()=>{
    if (effectiveGap > 0 && effectiveGap !== prevGapRef.current) {
      prevGapRef.current = effectiveGap;
      setAiAnalysis(null);
      setAnalysisLoading(false);
      const t = setTimeout(()=>{
        // Inline call to avoid stale closure — reads current state at call time
        if (!effectiveGap) return;
        setAnalysisLoading(true);
        setAiAnalysis(null);
        const mrrVal = mrrTarget ? parseInt(mrrTarget) : Math.ceil(arrTarget ? parseInt(arrTarget)/12 : 0);
        const gap = Math.max(0, mrrVal - 2814);
        const prompt = `You are a SaaS sales strategist for Watchtower, a cybersecurity SOC platform.

Current MRR: £2,814/mo · ARR: £33,768/yr
Customers: 2 MSSP, 3 Business, 2 Team
MoM growth: £1,890 → £2,200 → £2,814
Target MRR: £${mrrVal}/mo · Gap to close: £${gap}/mo

Plans: MSSP £799/mo+£79/client | Business £199/mo | Team £49/seat

Provide a concise go-to-market strategy to close the gap. Include:
1. IDEAL CUSTOMER PROFILE: Who to target (industry, size, pain points)
2. CHANNELS: Top 3 acquisition channels
3. CONVERSION: Key tactics to accelerate close
4. TIMELINE: Realistic timeline to hit target
Keep it under 200 words, punchy and actionable.`;

        fetch('/api/copilot', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({prompt}),
        })
        .then(r=>r.json())
        .then(d=>{
          setAiAnalysis(d.ok ? d.response : (d.error || d.message || 'Could not generate analysis. Check your Anthropic API key in Tools.'));
          setAnalysisLoading(false);
        })
        .catch(e=>{
          setAiAnalysis('Error: ' + e.message);
          setAnalysisLoading(false);
        });
      }, 800);
      return () => clearTimeout(t);
    }
  }, [effectiveGap, mrrTarget, arrTarget]);

  const mrrGrowth = CURRENT.growth;
  const months = ['Jan','Feb','Mar'];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div>
        <h2 style={{fontSize:'0.88rem',fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
          📈 Sales Dashboard
          <span style={{fontSize:'0.62rem',color:'#22d49a',background:'#22d49a12',padding:'2px 8px',borderRadius:4,border:'1px solid #22d49a25',fontWeight:700}}>SALES</span>
        </h2>
        <div style={{fontSize:'0.68rem',color:'var(--wt-muted)',marginTop:2}}>Revenue performance, pipeline, and target planning</div>
      </div>

      {/* Current revenue stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
        {[
          {label:'Monthly Recurring Revenue', val:`£${CURRENT.mrr.toLocaleString()}`, sub:'MRR', color:'#22d49a'},
          {label:'Annual Recurring Revenue',  val:`£${(CURRENT.arr/1000).toFixed(1)}k`, sub:'ARR', color:'#4f8fff'},
          {label:'Paying Customers',          val:CURRENT.customers.mssp+CURRENT.customers.business+CURRENT.customers.team, sub:`+${CURRENT.newThisMonth} this month`, color:'#8b6fff'},
          {label:'MoM Growth',                val:`+${Math.round((CURRENT.growth.mar-CURRENT.growth.feb)/CURRENT.growth.feb*100)}%`,sub:'vs last month',color:'#22d49a'},
        ].map(s=>(
          <div key={s.label} style={{padding:'14px 16px',background:'var(--wt-card)',border:`1px solid ${s.color}18`,borderRadius:12}}>
            <div style={{fontSize:'1.8rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.color,letterSpacing:-2,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:'0.58rem',fontWeight:700,color:s.color,textTransform:'uppercase',letterSpacing:'0.5px',marginTop:3}}>{s.sub}</div>
            <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* MRR trend + plan mix */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>

        {/* MRR trend bar chart */}
        <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:14}}>MRR Trend</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:12,height:80}}>
            {months.map((m,i)=>{
              const val = Object.values(mrrGrowth)[i];
              const pct = (val / Math.max(...Object.values(mrrGrowth))) * 100;
              return (
                <div key={m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <div style={{fontSize:'0.62rem',fontWeight:700,color:'#22d49a'}}>£{(val/1000).toFixed(1)}k</div>
                  <div style={{width:'100%',borderRadius:4,background:'#22d49a',height:pct+'%',minHeight:8,transition:'height .3s'}}/>
                  <div style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>{m}</div>
                </div>
              );
            })}
          </div>
          <div style={{marginTop:12,paddingTop:10,borderTop:'1px solid var(--wt-border)',display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:'0.62rem',color:'var(--wt-muted)'}}>Pipeline: <strong style={{color:'#4f8fff'}}>{CURRENT.pipeline} leads</strong></span>
            <span style={{fontSize:'0.62rem',color:'var(--wt-muted)'}}>Churn: <strong style={{color:CURRENT.churn>0?'#f0405e':'#22d49a'}}>{CURRENT.churn} this month</strong></span>
          </div>
        </div>

        {/* Plan mix breakdown */}
        <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:14}}>Revenue by Plan</div>
          {Object.entries(PLAN_VALUES).map(([key,plan])=>{
            const count = CURRENT.customers[key] || 0;
            const rev = count * plan.mrr;
            const pct = CURRENT.mrr > 0 ? Math.round(rev/CURRENT.mrr*100) : 0;
            return count > 0 ? (
              <div key={key} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:'0.7rem',fontWeight:600}}>{plan.name} <span style={{color:'var(--wt-dim)',fontWeight:400}}>({count} customers)</span></span>
                  <span style={{fontSize:'0.7rem',fontWeight:700,color:plan.color}}>£{rev.toLocaleString()}/mo</span>
                </div>
                <div style={{height:6,borderRadius:3,background:'var(--wt-border)',overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:3,background:plan.color,width:pct+'%',transition:'width .5s'}}/>
                </div>
              </div>
            ) : null;
          })}
        </div>
      </div>

      {/* Revenue target planner */}
      <div style={{background:'var(--wt-card)',border:'1px solid #4f8fff20',borderRadius:12,padding:'18px 20px'}}>
        <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:4}}>🎯 Revenue Target Planner</div>
        <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:16}}>Set a target and get AI-powered recommendations on exactly which customers to acquire</div>

        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:180}}>
            <label style={{display:'block',fontSize:'0.66rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>MRR Target</label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:'0.88rem',color:'var(--wt-muted)',fontWeight:700}}>£</span>
              <input
                type='text' placeholder='e.g. 10000'
                value={mrrTarget}
                onChange={e=>{setMrrTarget(e.target.value.split('').filter(c=>c>='0'&&c<='9').join(''));setArrTarget('');setAiAnalysis(null);}}
                style={{width:'100%',padding:'10px 12px 10px 28px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:8,color:'var(--wt-text)',fontSize:'1rem',fontFamily:'JetBrains Mono,monospace',fontWeight:700,outline:'none',boxSizing:'border-box'}}
              />
            </div>
            <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:3}}>per month</div>
          </div>
          <div style={{display:'flex',alignItems:'center',fontSize:'0.7rem',color:'var(--wt-dim)',marginTop:20}}>or</div>
          <div style={{flex:1,minWidth:180}}>
            <label style={{display:'block',fontSize:'0.66rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>ARR Target</label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:'0.88rem',color:'var(--wt-muted)',fontWeight:700}}>£</span>
              <input
                type='text' placeholder='e.g. 120000'
                value={arrTarget}
                onChange={e=>{setArrTarget(e.target.value.split('').filter(c=>c>='0'&&c<='9').join(''));setMrrTarget('');setAiAnalysis(null);}}
                style={{width:'100%',padding:'10px 12px 10px 28px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:8,color:'var(--wt-text)',fontSize:'1rem',fontFamily:'JetBrains Mono,monospace',fontWeight:700,outline:'none',boxSizing:'border-box'}}
              />
            </div>
            <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:3}}>per year</div>
          </div>
          <div style={{flex:1,minWidth:180,padding:'14px',background:'var(--wt-card2)',borderRadius:8,border:'1px solid var(--wt-border)',display:'flex',flexDirection:'column',justifyContent:'center'}}>
            <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Gap to close</div>
            <div style={{fontSize:'1.6rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:effectiveGap>0?'#f0a030':'#22d49a',letterSpacing:-2}}>
              {effectiveGap>0 ? `£${effectiveGap.toLocaleString()}/mo` : effectiveGap===0&&(mrrTarget||arrTarget) ? '✓ On target' : '—'}
            </div>
            {effectiveGap > 0 && <div style={{fontSize:'0.62rem',color:'var(--wt-muted)',marginTop:2}}>= £{(effectiveGap*12).toLocaleString()} ARR needed</div>}
          </div>
        </div>

        {/* Plan mix options */}
        {mixes.length > 0 && (
          <div style={{marginBottom:16}}>
            <div style={{fontSize:'0.66rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Customer Mix Options to Close the Gap</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
              {mixes.map((mix,i)=>(
                <div key={i} style={{padding:'12px 14px',background:'var(--wt-card2)',border:`1px solid ${mix.color}25`,borderRadius:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                    <div style={{fontSize:'0.72rem',fontWeight:700,color:mix.color}}>{mix.label}</div>
                    <div style={{fontSize:'0.68rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'var(--wt-text)'}}>£{mix.mrr.toLocaleString()}/mo</div>
                  </div>
                  <div style={{fontSize:'0.66rem',color:'var(--wt-secondary)',marginBottom:4}}><strong style={{color:mix.color}}>{mix.count}</strong> {mix.plans}</div>
                  <div style={{fontSize:'0.62rem',color:'var(--wt-dim)'}}>{mix.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI strategy */}
        {effectiveGap > 0 && (
          <div style={{padding:'14px 16px',background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(139,111,255,0.05))',border:'1px solid #4f8fff20',borderRadius:10}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <span style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'0.5px'}}>⚡ AI Go-to-Market Strategy</span>
              {analysisLoading && <span style={{fontSize:'0.62rem',color:'#4f8fff',display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}}/>Generating strategy…</span>}
              {aiAnalysis && !analysisLoading && <button onClick={getAiAnalysis} style={{marginLeft:'auto',fontSize:'0.58rem',color:'var(--wt-dim)',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>↻ Regenerate</button>}
            </div>
            {analysisLoading && (
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {[95,80,65,50].map((w,i)=>(
                  <div key={i} style={{height:10,borderRadius:4,background:'var(--wt-border)',width:w+'%',animation:'pulse 1.5s ease infinite',animationDelay:i*0.2+'s'}}/>
                ))}
              </div>
            )}
            {aiAnalysis && !analysisLoading && (
              <div style={{fontSize:'0.74rem',color:'var(--wt-secondary)',lineHeight:1.75,whiteSpace:'pre-line'}}>{aiAnalysis}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Admin Portal ────────────────────────────────────────────────────────────
function AdminPortal({ setCurrentTenant, setActiveTab, clientBanner, setClientBanner, adminBannerInput, setAdminBannerInput, userRole, setUserRole, currentTenant }) {
  const WTC_SUBSCRIBERS = [
    {id:'mssp-cyberguard', name:'CyberGuard Solutions',  type:'MSSP',     plan:'MSSP',     seats:0,  mrr:1115, clients:4,  status:'Active',  posture:84, alerts:36, incidents:7,  coverage:93, joined:'2024-01-10', billing:'Paid'},
    {id:'mssp-secureops',  name:'SecureOps Ltd',         type:'MSSP',     plan:'MSSP',     seats:0,  mrr:957,  clients:2,  status:'Active',  posture:79, alerts:22, incidents:4,  coverage:90, joined:'2024-03-15', billing:'Paid'},
    {id:'org-fintech',     name:'FinTech Global',        type:'Business', plan:'Business', seats:10, mrr:199,  clients:0,  status:'Active',  posture:88, alerts:12, incidents:2,  coverage:96, joined:'2024-02-01', billing:'Paid'},
    {id:'org-healthco',    name:'HealthCo Systems',      type:'Business', plan:'Business', seats:10, mrr:199,  clients:0,  status:'Active',  posture:72, alerts:19, incidents:3,  coverage:87, joined:'2024-04-20', billing:'Overdue'},
    {id:'org-logistics',   name:'Logistics UK Ltd',      type:'Business', plan:'Business', seats:10, mrr:199,  clients:0,  status:'Churned', posture:0,  alerts:0,  incidents:0,  coverage:0,  joined:'2023-11-01', billing:'Churned'},
    {id:'org-startup1',    name:'DevStack Inc',          type:'Team',     plan:'Team',     seats:4,  mrr:196,  clients:0,  status:'Active',  posture:91, alerts:5,  incidents:1,  coverage:98, joined:'2024-05-01', billing:'Paid'},
    {id:'org-startup2',    name:'CloudBase Ltd',         type:'Team',     plan:'Team',     seats:3,  mrr:147,  clients:0,  status:'Trial',   posture:65, alerts:8,  incidents:0,  coverage:78, joined:'2024-03-28', billing:'Trial'},
    {id:'org-free1',       name:'TestOrg Alpha',         type:'Community',plan:'Community',seats:1,  mrr:0,    clients:0,  status:'Active',  posture:55, alerts:2,  incidents:0,  coverage:60, joined:'2024-06-01', billing:'Free'},
  ];
  const [adminView, setAdminView] = useState('subscribers');
  const [filterPlan, setFilterPlan] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Users/Roles state
  const [staffUsers, setStaffUsers] = useState([
    {id:'u1', name:'Nick Taylor',    email:'nick@getwatchtower.io',   role:'owner',      status:'Active', joined:'2024-01-01', lastSeen:'Now'},
    {id:'u2', name:'Sarah Chen',     email:'sarah@getwatchtower.io',  role:'tech_admin', status:'Active', joined:'2024-03-15', lastSeen:'2h ago'},
    {id:'u3', name:'James Harlow',   email:'james@getwatchtower.io',  role:'sales',      status:'Active', joined:'2024-05-01', lastSeen:'1d ago'},
    {id:'u4', name:'Emma Wilson',    email:'emma@getwatchtower.io',   role:'viewer',     status:'Active', joined:'2024-06-20', lastSeen:'3d ago'},
    {id:'u5', name:'Invited User',   email:'ops@clientco.com',        role:'viewer',     status:'Pending',joined:'2024-07-01', lastSeen:'Never'},
  ]);
  const [inviteForm, setInviteForm] = useState({name:'',email:'',role:'viewer'});
  const [inviteStatus, setInviteStatus] = useState(null); // null | 'sending' | 'sent' | 'error'
  const [editingUser, setEditingUser] = useState(null);

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
        <div style={{marginLeft:'auto',display:'flex',gap:4,background:'var(--wt-card2)',borderRadius:7,padding:3}}>
          {['subscribers','users','platform','stripe','saml','broadcast'].map(v=>(
            <button key={v} onClick={()=>setAdminView(v)} style={{padding:'5px 14px',borderRadius:5,border:'none',background:adminView===v?'#f0a030':'transparent',color:adminView===v?'#fff':'var(--wt-muted)',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',textTransform:'capitalize'}}>{v}</button>
          ))}
        </div>
        <a href='/changelog' style={{fontSize:'0.7rem',fontWeight:700,color:'#8b6fff',textDecoration:'none',display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:6,border:'1px solid #8b6fff25',background:'#8b6fff0a'}}>📋 Feature updates →</a>
      </div>

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
              {['All','MSSP','Business','Team','Community'].map(p=>(
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
                {sub.status!=='Churned' && <button onClick={()=>{setCurrentTenant(sub.id);setActiveTab('overview');}} style={{padding:'4px 8px',borderRadius:5,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.58rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Impersonate →</button>}
                <button onClick={()=>setAdminBannerInput(`[${sub.name}] `)} style={{padding:'4px 7px',borderRadius:5,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.58rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>📢</button>
                {sub.billing==='Overdue' && <button onClick={()=>window.open(`mailto:billing@example.com?subject=Overdue Invoice — ${sub.name}&body=Hi,%0A%0AYour Watchtower subscription payment is overdue. Please settle at your earliest convenience.`,'_blank')} style={{padding:'4px 7px',borderRadius:5,border:'1px solid #f97316',background:'#f9731610',color:'#f97316',fontSize:'0.58rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>£ Chase</button>}
              </div>
            </div>
          ))}
          <div style={{marginTop:12,padding:'10px 12px',background:'var(--wt-card2)',borderRadius:8,display:'flex',gap:16,flexWrap:'wrap'}}>
            {['MSSP','Business','Team'].map(p=>{
              const subs=WTC_SUBSCRIBERS.filter(s=>s.plan===p&&s.status!=='Churned');
              const mrr=subs.reduce((s,c)=>s+c.mrr,0);
              return mrr>0?(<div key={p} style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:7,height:7,borderRadius:2,background:planColor[p],flexShrink:0}}/><span style={{fontSize:'0.66rem',color:'var(--wt-muted)'}}>{p}: <strong style={{color:planColor[p]}}>£{mrr}/mo</strong> · {subs.length} org{subs.length!==1?'s':''}</span></div>):null;
            })}
            <div style={{marginLeft:'auto',fontSize:'0.66rem',color:'var(--wt-muted)'}}>Total ARR: <strong style={{color:'#22d49a'}}>£{(totalMRR*12).toLocaleString()}</strong></div>
          </div>
        </div>
      )}

      {adminView==='users' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>

          {/* Invite / Create user form */}
          <div style={{background:'var(--wt-card)',border:'1px solid #4f8fff20',borderRadius:12,padding:'18px 20px'}}>
            <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:4}}>Invite or Create Staff User</div>
            <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:14}}>Internal team only — not customer accounts. Assign a role to control dashboard access.</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 160px 120px',gap:10,alignItems:'flex-end',flexWrap:'wrap'}}>
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
                <button
                  onClick={()=>{
                    if (!inviteForm.email || !inviteForm.name) return;
                    setInviteStatus('sending');
                    // In production: POST /api/auth/invite
                    setTimeout(()=>{
                      setStaffUsers(prev=>[...prev, {
                        id:'u'+Date.now(), name:inviteForm.name, email:inviteForm.email,
                        role:inviteForm.role, status:'Pending', joined:new Date().toISOString().slice(0,10), lastSeen:'Never'
                      }]);
                      setInviteForm({name:'',email:'',role:'viewer'});
                      setInviteStatus('sent');
                      setTimeout(()=>setInviteStatus(null), 3000);
                    }, 800);
                  }}
                  disabled={inviteStatus==='sending'}
                  style={{width:'100%',padding:'9px 0',borderRadius:7,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.78rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',opacity:inviteStatus==='sending'?0.7:1}}>
                  {inviteStatus==='sending'?'Sending…':inviteStatus==='sent'?'✓ Sent!':'Send Invite'}
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
            <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:12}}>Team Members ({staffUsers.length})</div>
            {/* Column headers */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 180px 100px 80px 100px',gap:8,padding:'5px 10px',fontSize:'0.56rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid var(--wt-border)',marginBottom:4}}>
              <span>User</span><span>Email</span><span>Role</span><span>Status</span><span style={{textAlign:'right'}}>Actions</span>
            </div>
            {staffUsers.map(user=>{
              const roleColor = {owner:'#f0a030',tech_admin:'#4f8fff',sales:'#22d49a',viewer:'#8b6fff'}[user.role]||'#6b7a94';
              const roleLabel = {owner:'Owner',tech_admin:'Tech Admin',sales:'Sales',viewer:'Viewer'}[user.role]||user.role;
              const isEditing = editingUser===user.id;
              return (
                <div key={user.id} style={{display:'grid',gridTemplateColumns:'1fr 180px 100px 80px 100px',gap:8,padding:'9px 10px',alignItems:'center',borderBottom:'1px solid var(--wt-border)',opacity:user.status==='Pending'?0.75:1}}>
                  <div>
                    <div style={{fontSize:'0.78rem',fontWeight:600}}>{user.name}</div>
                    <div style={{fontSize:'0.58rem',color:'var(--wt-dim)',marginTop:1}}>Last seen: {user.lastSeen}</div>
                  </div>
                  <div style={{fontSize:'0.66rem',color:'var(--wt-muted)',fontFamily:'JetBrains Mono,monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.email}</div>
                  <div>
                    {isEditing ? (
                      <select defaultValue={user.role}
                        onChange={e=>{
                          setStaffUsers(prev=>prev.map(u=>u.id===user.id?{...u,role:e.target.value}:u));
                          setEditingUser(null);
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
                  <div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
                    {user.role !== 'owner' && !isEditing && (
                      <button onClick={()=>setEditingUser(user.id)} style={{padding:'3px 8px',borderRadius:5,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Edit</button>
                    )}
                    {isEditing && (
                      <button onClick={()=>setEditingUser(null)} style={{padding:'3px 8px',borderRadius:5,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Cancel</button>
                    )}
                    {user.role !== 'owner' && (
                      <button onClick={()=>setStaffUsers(prev=>prev.filter(u=>u.id!==user.id))}
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
                {key:'priceMssp', label:'MSSP Price ID', placeholder:'price_...', hint:'Monthly MSSP plan price ID'},
                {key:'priceBusiness', label:'Business Price ID', placeholder:'price_...', hint:'Monthly Business plan price ID'},
                {key:'priceTeamPerSeat', label:'Team Per-Seat Price ID', placeholder:'price_...', hint:'Per-seat Team plan price ID'},
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
              {plan:'MSSP', price:'£799+/mo', id:stripeConfig.priceMssp, color:'#8b6fff'},
              {plan:'Business', price:'£199/mo', id:stripeConfig.priceBusiness, color:'#22d49a'},
              {plan:'Team', price:'£49/seat', id:stripeConfig.priceTeamPerSeat, color:'#4f8fff'},
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
    </div>
  );
}
