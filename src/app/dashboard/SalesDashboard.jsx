'use client';
import React, { useState, useEffect } from 'react';

export default function SalesDashboard() {
  const [mrrTarget, setMrrTarget] = useState('');
  const [arrTarget, setArrTarget] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Load live analytics in live mode, fall back to demo data
  useEffect(() => {
    fetch('/api/admin/analytics', { headers: { 'x-is-admin': 'true' } })
      .then(r => r.json())
      .then(d => {
        if (d && (d.mrr !== undefined || d.totalSignups !== undefined)) {
          setLiveData(d);
        }
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, []);

  const DEMO = {
    mrr: 8289, arr: 99468,
    customers: { mssp: 2, business: 3, team: 2, community: 1 },
    growth: [5100, 6800, 8289],
    growthLabels: ['Jan', 'Feb', 'Mar'],
    churn: 1, newThisMonth: 1, pipeline: 4,
    totalSignups: 8, paidCustomers: 7, communityUsers: 1,
  };

  // Merge live + demo
  const D = liveData ? {
    mrr: liveData.mrr ?? DEMO.mrr,
    arr: (liveData.mrr ?? DEMO.mrr) * 12,
    customers: liveData.tierBreakdown ?? DEMO.customers,
    growth: liveData.mrrHistory ?? DEMO.growth,
    growthLabels: liveData.mrrHistoryLabels ?? DEMO.growthLabels,
    churn: liveData.churn30d ?? DEMO.churn,
    newThisMonth: liveData.weeklySignups ?? DEMO.newThisMonth,
    pipeline: DEMO.pipeline,
    totalSignups: liveData.totalSignups ?? DEMO.totalSignups,
    paidCustomers: liveData.paidCustomers ?? DEMO.paidCustomers,
    communityUsers: liveData.communityUsers ?? DEMO.communityUsers,
  } : DEMO;

  const PLAN_VALUES = {
    mssp:     { name: 'Enterprise',   mrr: 3499, color: '#8b6fff' },
    business: { name: 'Professional', mrr: 1199, color: '#22d49a' },
    team:     { name: 'Essentials',   mrr: 447,  color: '#4f8fff', note: 'avg 3 seats' },
    community:{ name: 'Community',    mrr: 0,    color: '#6b7a94' },
  };

  const momGrowth = D.growth.length >= 2
    ? Math.round(((D.growth[D.growth.length-1] - D.growth[D.growth.length-2]) / Math.max(1, D.growth[D.growth.length-2])) * 100)
    : 0;

  const mrrGap = mrrTarget ? Math.max(0, parseInt(mrrTarget.replace(/[^0-9]/g,'')) - D.mrr) : 0;
  const arrGap = arrTarget ? Math.max(0, parseInt(arrTarget.replace(/[^0-9]/g,'')) - D.arr) : 0;
  const effectiveGap = mrrGap || (arrGap ? Math.ceil(arrGap / 12) : 0);

  // Customer mix options
  const mixes = effectiveGap > 0 ? [
    { label: 'All Enterprise',    count: Math.ceil(effectiveGap / 3499), mrr: Math.ceil(effectiveGap / 3499) * 3499, color: '#8b6fff', note: 'Highest value — 4–6 week cycle', icon: '🏢' },
    { label: 'All Professional',  count: Math.ceil(effectiveGap / 1199), mrr: Math.ceil(effectiveGap / 1199) * 1199, color: '#22d49a', note: 'Mid-market, 2–3 week close', icon: '🏗' },
    { label: 'All Essentials',    count: Math.ceil(effectiveGap / 447),  mrr: Math.ceil(effectiveGap / 447) * 447,   color: '#4f8fff', note: 'SMB, fastest close, lower ACV', icon: '⚡' },
    { label: 'Mixed (recommended)', count: 1 + Math.ceil(Math.max(0, effectiveGap - 3499) / 1199), mrr: 3499 + Math.ceil(Math.max(0, effectiveGap - 3499) / 1199) * 1199, color: '#f0a030', note: 'Balance velocity + value', icon: '✦' },
  ] : [];

  // Predictions
  const avgGrowthRate = D.growth.length >= 3
    ? D.growth.slice(-3).reduce((s, v, i, a) => i === 0 ? s : s + (v - a[i-1]) / a[i-1], 0) / (D.growth.length - 1)
    : 0.15;
  const predict = (months) => Math.round(D.mrr * Math.pow(1 + avgGrowthRate, months));

  function getAiAnalysis() {
    if (!effectiveGap || analysisLoading) return;
    setAnalysisLoading(true);
    setAiAnalysis(null);
    const targetMrr = mrrTarget ? parseInt(mrrTarget) || D.mrr : Math.ceil(arrGap / 12) + D.mrr;
    const gap = Math.max(0, targetMrr - D.mrr);
    const prompt = `You are a SaaS sales strategist for Watchtower — an AI-powered SOC dashboard for MSSPs and enterprise security teams. BYOK model, 80+ integrations, key differentiator is AI triage speed (3.2s vs hours).

Current metrics:
- MRR: £${D.mrr.toLocaleString()}/mo | ARR: £${D.arr.toLocaleString()}/yr
- Customer mix: ${D.customers.mssp||0} Enterprise (£3,499/mo), ${D.customers.business||0} Professional (£1,199/mo), ${D.customers.team||0} Essentials (~£447/mo avg), ${D.customers.community||0} Community free
- MoM growth: ${momGrowth}% | Churn (30d): ${D.churn}
- Total signups: ${D.totalSignups} | Paid customers: ${D.paidCustomers}
- Target MRR: £${targetMrr.toLocaleString()}/mo | Gap to close: £${gap.toLocaleString()}/mo

Plans: Enterprise £3,499/mo (MSSP, unlimited clients) | Professional £1,199/mo (up to 15 analysts) | Essentials £149/seat/mo (min 2 seats)

Key buying signals: MSSP who manage multiple clients, SOC teams with alert fatigue, teams using CrowdStrike/Splunk/Tenable who want a unified pane of glass.

Give a direct, specific GTM strategy. Structure your response exactly as:

ICP: [2 sentences — who to target, why now, specific pain point]

CHANNELS: [3 channels with specific tactic for each — LinkedIn, partner channels, inbound, cold outbound, community, etc]

CONVERSION: [3 specific conversion tactics with urgency triggers]

TIMELINE: [Month-by-month plan to hit £${targetMrr.toLocaleString()}/mo]

QUICK WINS: [2-3 immediate actions this week that could close deals fast]`;

    fetch('/api/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'global' },
      body: JSON.stringify({ prompt }),
    })
    .then(r => r.json())
    .then(d => {
      setAiAnalysis(d.ok && d.response ? d.response : (d.message || d.error || 'Add your Anthropic API key in the Tools tab to enable AI GTM analysis.'));
      setAnalysisLoading(false);
    })
    .catch(e => { setAiAnalysis('Connection error: ' + e.message); setAnalysisLoading(false); });
  }

  // Auto-trigger analysis when target changes
  const prevGapRef = React.useRef(0);
  React.useEffect(() => {
    if (effectiveGap > 0 && effectiveGap !== prevGapRef.current) {
      prevGapRef.current = effectiveGap;
      setAiAnalysis(null);
      const t = setTimeout(() => { if (effectiveGap > 0) getAiAnalysis(); }, 900);
      return () => clearTimeout(t);
    }
  }, [effectiveGap]);

  const maxGrowth = Math.max(...D.growth, 1);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Sales Dashboard</h2>
        <span style={{fontSize:'0.62rem',color:'#22d49a',background:'#22d49a12',padding:'2px 8px',borderRadius:4,border:'1px solid #22d49a25',fontWeight:700}}>SALES</span>
        {liveData && <span style={{fontSize:'0.58rem',color:'#4f8fff',background:'#4f8fff12',padding:'2px 8px',borderRadius:4,border:'1px solid #4f8fff25'}}>✦ Live data</span>}
        {!liveData && !dataLoading && <span style={{fontSize:'0.58rem',color:'#f0a030',background:'#f0a03012',padding:'2px 8px',borderRadius:4}}>Demo data</span>}
      </div>

      {/* KPI strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}} className='wt-five-col'>
        {[
          {label:'MRR',val:`£${D.mrr.toLocaleString()}`,sub:'/month',color:'#22d49a'},
          {label:'ARR',val:`£${(D.arr/1000).toFixed(0)}k`,sub:'annualised',color:'#4f8fff'},
          {label:'Paid Customers',val:D.paidCustomers,sub:`+${D.newThisMonth} this week`,color:'#8b6fff'},
          {label:'MoM Growth',val:`${momGrowth>0?'+':''}${momGrowth}%`,sub:'vs last month',color:momGrowth>=0?'#22d49a':'#f0405e'},
          {label:'Churn (30d)',val:D.churn,sub:D.churn===0?'all clear':'action needed',color:D.churn===0?'#22d49a':'#f0405e'},
        ].map(s=>(
          <div key={s.label} style={{padding:'14px 12px',background:'var(--wt-card)',border:`1px solid ${s.color}18`,borderRadius:12}}>
            <div style={{fontSize:'1.6rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.color,letterSpacing:-2,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:'0.56rem',fontWeight:700,color:s.color,textTransform:'uppercase',letterSpacing:'0.5px',marginTop:3}}>{s.sub}</div>
            <div style={{fontSize:'0.58rem',color:'var(--wt-dim)',marginTop:1}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>

        {/* MRR trend */}
        <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:14}}>MRR Trend</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:8,height:70}}>
            {D.growth.map((val,i)=>{
              const pct = (val/maxGrowth)*100;
              return (
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                  <div style={{fontSize:'0.54rem',fontWeight:700,color:'#22d49a'}}>£{(val/1000).toFixed(1)}k</div>
                  <div style={{width:'100%',borderRadius:4,background:'#22d49a',height:pct+'%',minHeight:6}} />
                  <div style={{fontSize:'0.52rem',color:'var(--wt-dim)'}}>{D.growthLabels[i]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue mix */}
        <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:12}}>Revenue by Plan</div>
          {Object.entries(PLAN_VALUES).map(([key,plan])=>{
            const count = D.customers[key] || 0;
            const rev = count * plan.mrr;
            const pct = D.mrr > 0 ? Math.round(rev/D.mrr*100) : 0;
            if (!count) return null;
            return (
              <div key={key} style={{marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                  <span style={{fontSize:'0.68rem',fontWeight:600}}>{plan.name} <span style={{color:'var(--wt-dim)',fontWeight:400}}>({count})</span></span>
                  <span style={{fontSize:'0.68rem',fontWeight:700,color:plan.color}}>{rev>0?`£${rev.toLocaleString()}/mo`:'Free'}</span>
                </div>
                {pct>0&&<div style={{height:5,borderRadius:2,background:'var(--wt-border)',overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:plan.color,width:pct+'%',transition:'width .5s'}} /></div>}
              </div>
            );
          })}
        </div>

        {/* Forward projections */}
        <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:12}}>Projections</div>
          <div style={{fontSize:'0.58rem',color:'var(--wt-dim)',marginBottom:10}}>At current {momGrowth}% MoM growth rate</div>
          {[
            {label:'In 1 month',val:predict(1),delta:predict(1)-D.mrr},
            {label:'In 3 months',val:predict(3),delta:predict(3)-D.mrr},
            {label:'In 6 months',val:predict(6),delta:predict(6)-D.mrr},
            {label:'In 12 months',val:predict(12),delta:predict(12)-D.mrr},
          ].map(p=>(
            <div key={p.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid var(--wt-border)'}}>
              <span style={{fontSize:'0.64rem',color:'var(--wt-muted)'}}>{p.label}</span>
              <div style={{textAlign:'right'}}>
                <span style={{fontSize:'0.72rem',fontWeight:800,fontFamily:'JetBrains Mono,monospace',color:'#22d49a'}}>£{p.val.toLocaleString()}</span>
                <span style={{fontSize:'0.54rem',color:'#22d49a',marginLeft:6}}>+£{p.delta.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue target planner */}
      <div style={{background:'var(--wt-card)',border:'1px solid #4f8fff20',borderRadius:12,padding:'18px 20px'}}>
        <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:4}}>🎯 Revenue Target Planner</div>
        <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:16}}>Set a target and get AI-powered recommendations on exactly which customers to acquire</div>

        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:160}}>
            <label style={{display:'block',fontSize:'0.66rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>MRR Target</label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:'0.9rem',color:'var(--wt-muted)',fontWeight:700}}>£</span>
              <input type='text' placeholder='e.g. 15000' value={mrrTarget}
                onChange={e=>{setMrrTarget(e.target.value.replace(/[^0-9]/g,''));setArrTarget('');setAiAnalysis(null);}}
                style={{width:'100%',padding:'9px 12px 9px 26px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:8,color:'var(--wt-text)',fontSize:'0.96rem',fontFamily:'JetBrains Mono,monospace',fontWeight:700,outline:'none',boxSizing:'border-box'}} />
            </div>
            <div style={{fontSize:'0.58rem',color:'var(--wt-dim)',marginTop:2}}>per month</div>
          </div>
          <div style={{display:'flex',alignItems:'center',fontSize:'0.68rem',color:'var(--wt-dim)',marginTop:18}}>or</div>
          <div style={{flex:1,minWidth:160}}>
            <label style={{display:'block',fontSize:'0.66rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>ARR Target</label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:'0.9rem',color:'var(--wt-muted)',fontWeight:700}}>£</span>
              <input type='text' placeholder='e.g. 180000' value={arrTarget}
                onChange={e=>{setArrTarget(e.target.value.replace(/[^0-9]/g,''));setMrrTarget('');setAiAnalysis(null);}}
                style={{width:'100%',padding:'9px 12px 9px 26px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:8,color:'var(--wt-text)',fontSize:'0.96rem',fontFamily:'JetBrains Mono,monospace',fontWeight:700,outline:'none',boxSizing:'border-box'}} />
            </div>
            <div style={{fontSize:'0.58rem',color:'var(--wt-dim)',marginTop:2}}>per year</div>
          </div>
          <div style={{flex:1,minWidth:160,padding:'12px 14px',background:'var(--wt-card2)',borderRadius:8,border:'1px solid var(--wt-border)',display:'flex',flexDirection:'column',justifyContent:'center'}}>
            <div style={{fontSize:'0.58rem',color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Gap to close</div>
            <div style={{fontSize:'1.5rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:effectiveGap>0?'#f0a030':'#22d49a',letterSpacing:-2}}>
              {effectiveGap>0?`£${effectiveGap.toLocaleString()}/mo`:effectiveGap===0&&(mrrTarget||arrTarget)?'✓ On target':'—'}
            </div>
            {effectiveGap>0&&<div style={{fontSize:'0.6rem',color:'var(--wt-muted)',marginTop:2}}>= £{(effectiveGap*12).toLocaleString()} ARR needed</div>}
          </div>
        </div>

        {mixes.length > 0 && (
          <div style={{marginBottom:16}}>
            <div style={{fontSize:'0.64rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Customer Mix Options</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
              {mixes.map((mix,i)=>(
                <div key={i} style={{padding:'10px 12px',background:'var(--wt-card2)',border:`1px solid ${mix.color}25`,borderRadius:10}}>
                  <div style={{fontSize:'0.68rem',marginBottom:2}}>{mix.icon} <span style={{fontWeight:700,color:mix.color}}>{mix.label}</span></div>
                  <div style={{fontSize:'0.84rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:'var(--wt-text)',marginBottom:2}}>{mix.count}×</div>
                  <div style={{fontSize:'0.62rem',fontWeight:700,color:mix.color}}>£{mix.mrr.toLocaleString()}/mo</div>
                  <div style={{fontSize:'0.56rem',color:'var(--wt-dim)',marginTop:3}}>{mix.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {effectiveGap > 0 && (
          <div style={{padding:'14px 16px',background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(139,111,255,0.05))',border:'1px solid #4f8fff20',borderRadius:10}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:analysisLoading||aiAnalysis?10:0}}>
              <span style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'0.5px'}}>⚡ AI Go-to-Market Strategy</span>
              {analysisLoading && <span style={{fontSize:'0.6rem',color:'#4f8fff',display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}} />Generating…</span>}
              {!analysisLoading && <button onClick={getAiAnalysis} style={{marginLeft:'auto',fontSize:'0.6rem',padding:'3px 10px',borderRadius:5,border:'1px solid #4f8fff30',background:'#4f8fff12',color:'#4f8fff',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:700}}>{aiAnalysis?'↻ Regenerate':'⚡ Generate'}</button>}
            </div>
            {analysisLoading && (
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {[95,80,70,55].map((w,i)=>(
                  <div key={i} style={{height:10,borderRadius:4,background:'var(--wt-border)',width:w+'%',animation:'pulse 1.5s ease infinite',animationDelay:i*0.15+'s'}} />
                ))}
              </div>
            )}
            {aiAnalysis && !analysisLoading && (
              <div style={{fontSize:'0.74rem',color:'var(--wt-secondary)',lineHeight:1.8}}>
                {aiAnalysis.split('\n').filter(l=>l.trim()).map((line,i)=>{
                  const isHeader = /^(ICP|CHANNELS|CONVERSION|TIMELINE|QUICK WINS):/i.test(line.trim());
                  const isError = line.startsWith('No Anthropic')||line.startsWith('Connection error')||line.startsWith('Add your');
                  return (
                    <div key={i} style={{marginBottom:isHeader?8:3}}>
                      {isHeader
                        ? <div style={{fontSize:'0.58rem',fontWeight:800,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'1px',marginBottom:2,marginTop:i>0?10:0}}>{line.trim()}</div>
                        : <div style={{color:isError?'#f0a030':'var(--wt-secondary)'}}>{line.trim()}</div>
                      }
                    </div>
                  );
                })}
              </div>
            )}
            {!aiAnalysis && !analysisLoading && (
              <div style={{fontSize:'0.72rem',color:'var(--wt-dim)',padding:'4px 0'}}>Click Generate Strategy for AI-powered GTM advice</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
