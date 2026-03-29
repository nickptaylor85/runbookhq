'use client';
import React, { useState, useRef, useEffect } from 'react';
export default function SalesDashboard() {
  const [mrrTarget, setMrrTarget] = useState('');
  const [arrTarget, setArrTarget] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Current revenue data (in production, load from /api/admin/analytics)
  // Recalculated with new pricing: 2×Enterprise £2,499 + 3×Professional £799 + 2×Essentials avg 3 seats×£149
  const CURRENT = {
    mrr: 8289,  // 2×2499 + 3×799 + 2×(3×149) = 4998+2397+894
    arr: 99468,
    customers: { mssp:2, business:3, team:2, community:1 },
    growth: { jan:5100, feb:6800, mar:8289 }, // last 3 months MRR
    churn: 1,
    newThisMonth: 1,
    pipeline: 4, // leads in pipeline
  };

  const PLAN_VALUES = {
    mssp:     { name:'Enterprise',    mrr:2499, label:'£2,499/mo', color:'#8b6fff' },
    business: { name:'Professional',  mrr:799,  label:'£799/mo',   color:'#22d49a' },
    team:     { name:'Essentials',    mrr:447,  label:'~£447/mo',  color:'#4f8fff', note:'avg 3 seats × £149' },
    community:{ name:'Community',     mrr:0,    label:'Free',      color:'#6b7a94' },
  };

  const mrrGap = mrrTarget ? Math.max(0, parseInt(mrrTarget.replace(/[^0-9]/g,'')) - CURRENT.mrr) : 0;
  const arrGap = arrTarget ? Math.max(0, parseInt(arrTarget.replace(/[^0-9]/g,'')) - CURRENT.arr) : 0;
  const effectiveGap = mrrGap || (arrGap ? Math.ceil(arrGap/12) : 0);

  // Calculate how many of each plan type needed to fill the gap
  const mixes = effectiveGap > 0 ? [
    { label:'All Enterprise',  plans:'Enterprise partners', count:Math.ceil(effectiveGap/2499), mrr:Math.ceil(effectiveGap/2499)*2499, color:'#8b6fff', note:'Highest value — longer sales cycle' },
    { label:'All Professional',plans:'Professional orgs',   count:Math.ceil(effectiveGap/799),  mrr:Math.ceil(effectiveGap/799)*799,   color:'#22d49a', note:'Mid-market, 2-4 week close' },
    { label:'All Essentials',  plans:'Essentials plans',   count:Math.ceil(effectiveGap/447),  mrr:Math.ceil(effectiveGap/447)*447,   color:'#4f8fff', note:'SMB, fastest close, lower ACV' },
    { label:'Mixed (recommended)', plans:'1 Enterprise + Professional',
      count: 1 + Math.ceil(Math.max(0,effectiveGap-2499)/799),
      mrr: 2499 + Math.ceil(Math.max(0,effectiveGap-2499)/799)*799,
      color:'#f0a030', note:'Balance of velocity + value' },
  ] : [];

  function getAiAnalysis() {
    if (!effectiveGap || analysisLoading) return;
    setAnalysisLoading(true);
    setAiAnalysis(null);
    const mrrVal = mrrTarget ? parseInt(mrrTarget) || CURRENT.mrr : Math.ceil(arrGap/12) + CURRENT.mrr;
    const gap = Math.max(0, mrrVal - CURRENT.mrr);
    const prompt = `You are a SaaS sales strategist for Watchtower, a cybersecurity SOC dashboard for MSSPs and enterprise SOC teams. AI-powered, BYOK model, 18 tool integrations.

Current state: MRR £${CURRENT.mrr.toLocaleString()}/mo | ARR £${CURRENT.arr.toLocaleString()}/yr
Customer mix: ${CURRENT.customers.mssp} Enterprise, ${CURRENT.customers.business} Professional, ${CURRENT.customers.team} Essentials
MoM growth: £${Object.values(CURRENT.growth)[0].toLocaleString()} → £${Object.values(CURRENT.growth)[1].toLocaleString()} → £${Object.values(CURRENT.growth)[2].toLocaleString()}
Target MRR: £${mrrVal.toLocaleString()}/mo | Gap to close: £${gap.toLocaleString()}/mo

Plans: Enterprise £2,499/mo | Professional £799/mo | Essentials £149/seat/mo (min 2 seats)

Give a direct, actionable go-to-market strategy to close this gap. Be specific — name real channels, tactics, and timelines. Structure your response exactly as:

ICP: [2 sentences on who to target — industry, size, job title, pain point]

CHANNELS: [3 specific channels with brief tactic for each]

CONVERSION: [3 specific conversion tactics]

TIMELINE: [Realistic month-by-month breakdown to hit target]`;

    fetch('/api/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'global' },
      body: JSON.stringify({ prompt }),
    })
    .then(r => r.json())
    .then(d => {
      if (d.ok && d.response) {
        setAiAnalysis(d.response);
      } else {
        setAiAnalysis(d.message || d.error || 'No Anthropic API key configured — add your key in the Tools tab to enable AI GTM analysis.');
      }
      setAnalysisLoading(false);
    })
    .catch(e => { setAiAnalysis('Connection error: ' + e.message); setAnalysisLoading(false); });
  }

  // Auto-run analysis when target is set (debounced 800ms)
  const prevGapRef = React.useRef(0);
  React.useEffect(()=>{
    if (effectiveGap > 0 && effectiveGap !== prevGapRef.current) {
      prevGapRef.current = effectiveGap;
      setAiAnalysis(null);
      setAnalysisLoading(false);
      const t = setTimeout(()=>{
        if (!effectiveGap) return;
        setAnalysisLoading(true);
        setAiAnalysis(null);
        const mrrVal = mrrTarget ? (parseInt(mrrTarget) || CURRENT.mrr) : Math.ceil(arrTarget ? parseInt(arrTarget)/12 : 0);
        const gap = Math.max(0, mrrVal - CURRENT.mrr);
        if (!mrrVal || mrrVal <= CURRENT.mrr) { setAnalysisLoading(false); return; }
        const prompt = `You are a SaaS sales strategist for Watchtower, a cybersecurity SOC dashboard for MSSPs and enterprise SOC teams. AI-powered, BYOK model, 18 tool integrations.

Current state: MRR £${CURRENT.mrr.toLocaleString()}/mo | ARR £${CURRENT.arr.toLocaleString()}/yr
Customer mix: ${CURRENT.customers.mssp} Enterprise, ${CURRENT.customers.business} Professional, ${CURRENT.customers.team} Essentials
MoM growth: £${Object.values(CURRENT.growth)[0].toLocaleString()} → £${Object.values(CURRENT.growth)[1].toLocaleString()} → £${Object.values(CURRENT.growth)[2].toLocaleString()}
Target MRR: £${mrrVal.toLocaleString()}/mo | Gap to close: £${gap.toLocaleString()}/mo

Plans: Enterprise £2,499/mo | Professional £799/mo | Essentials £149/seat/mo (min 2 seats)

Give a direct, actionable go-to-market strategy to close this gap. Be specific — name real channels, tactics, and timelines. Structure your response exactly as:

ICP: [2 sentences on who to target — industry, size, job title, pain point]

CHANNELS: [3 specific channels with brief tactic for each]

CONVERSION: [3 specific conversion tactics]

TIMELINE: [Realistic month-by-month breakdown to hit target]`;

        fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'global' },
          body: JSON.stringify({ prompt }),
        })
        .then(r => r.json())
        .then(d => {
          if (d.ok && d.response) {
            setAiAnalysis(d.response);
          } else {
            setAiAnalysis(d.message || d.error || 'Add your Anthropic API key in the Tools tab to enable AI GTM analysis.');
          }
          setAnalysisLoading(false);
        })
        .catch(e => { setAiAnalysis('Connection error: ' + e.message); setAnalysisLoading(false); });
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
              {analysisLoading && <span style={{fontSize:'0.62rem',color:'#4f8fff',display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}}/>Generating…</span>}
              {!analysisLoading && <button onClick={getAiAnalysis} style={{marginLeft:'auto',fontSize:'0.6rem',padding:'3px 10px',borderRadius:5,border:'1px solid #4f8fff30',background:'#4f8fff12',color:'#4f8fff',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:700}}>{aiAnalysis ? '↻ Regenerate' : '⚡ Generate Strategy'}</button>}
            </div>
            {analysisLoading && (
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {[95,80,65,50].map((w,i)=>(
                  <div key={i} style={{height:10,borderRadius:4,background:'var(--wt-border)',width:w+'%',animation:'pulse 1.5s ease infinite',animationDelay:i*0.2+'s'}}/>
                ))}
              </div>
            )}
            {aiAnalysis && !analysisLoading && (
              <div style={{fontSize:'0.74rem',color:'var(--wt-secondary)',lineHeight:1.8}}>
                {aiAnalysis.split('\n').filter(l=>l.trim()).map((line,i)=>{
                  const isHeader = /^(ICP|CHANNELS|CONVERSION|TIMELINE):/i.test(line.trim());
                  const isError = line.startsWith('No Anthropic') || line.startsWith('Connection error') || line.startsWith('Add your');
                  return (
                    <div key={i} style={{marginBottom: isHeader ? 8 : 4}}>
                      {isHeader
                        ? <div style={{fontSize:'0.58rem',fontWeight:800,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'1px',marginBottom:2,marginTop:i>0?10:0}}>{line.trim()}</div>
                        : <div style={{color: isError ? '#f0a030' : 'var(--wt-secondary)',paddingLeft: isHeader ? 0 : 0}}>{line.trim()}</div>
                      }
                    </div>
                  );
                })}
              </div>
            )}
            {!aiAnalysis && !analysisLoading && (
              <div style={{fontSize:'0.72rem',color:'var(--wt-dim)',textAlign:'center',padding:'8px 0'}}>Click Generate Strategy to get AI-powered GTM advice for this target</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}