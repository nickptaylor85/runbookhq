'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const TOP_TOOLS = [
  { id:'crowdstrike', name:'CrowdStrike Falcon', cat:'EDR', color:'#f0405e', fields:['client_id','client_secret'] },
  { id:'defender', name:'Microsoft Defender', cat:'EDR', color:'#00a4ef', fields:['tenant_id','client_id','client_secret'] },
  { id:'sentinelone', name:'SentinelOne', cat:'EDR', color:'#8c2be2', fields:['api_token','console_url'] },
  { id:'splunk', name:'Splunk Enterprise', cat:'SIEM', color:'#65a637', fields:['host','token'] },
  { id:'sentinel', name:'Microsoft Sentinel', cat:'SIEM', color:'#0078d4', fields:['workspace_id','client_id','client_secret'] },
  { id:'tenable', name:'Tenable.io', cat:'Vuln', color:'#00b3e3', fields:['access_key','secret_key'] },
  { id:'okta', name:'Okta', cat:'Identity', color:'#007dc1', fields:['domain','api_token'] },
  { id:'elastic', name:'Elastic Security', cat:'SIEM', color:'#00bfb3', fields:['cloud_id','api_key'] },
];

const ROLES = [
  { id:'analyst', icon:'🛡', title:'SOC Analyst', sub:'I triage alerts and investigate incidents daily' },
  { id:'mssp', icon:'🏢', title:'MSSP / MDR', sub:'I manage security for multiple client organisations' },
  { id:'leader', icon:'📊', title:'Security Leader', sub:'I need posture visibility and board-level reporting' },
  { id:'eval', icon:'🔍', title:'Just Evaluating', sub:'I want to see what Watchtower can do' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('');
  const [selectedTool, setSelectedTool] = useState('');
  const [toolFields, setToolFields] = useState<Record<string,string>>({});
  const [aiKey, setAiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session').then(r=>r.json()).then(d=>{
      if (!d.authenticated) { router.replace('/login'); return; }
      setAuthenticated(true);
    }).catch(()=>router.replace('/login'));
  }, [router]);

  async function connectTool() {
    if (!selectedTool || Object.values(toolFields).some(v=>!v.trim())) return;
    setSaving(true);
    try {
      await fetch('/api/tools/connect', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ toolId:selectedTool, credentials:toolFields }),
      });
    } catch {}
    setSaving(false);
    setStep(2);
  }

  async function saveAiKey() {
    if (!aiKey.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/settings/anthropic-key', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ key:aiKey }),
      });
    } catch {}
    setSaving(false);
    finish();
  }

  function finish() {
    router.push('/dashboard');
  }

  if (!authenticated) return null;

  const tool = TOP_TOOLS.find(t=>t.id===selectedTool);
  const progress = Math.round(((step + 1) / 4) * 100);

  return (
    <div style={{minHeight:'100vh',background:'#060c18',color:'#e8ecf4',fontFamily:'Inter,system-ui,sans-serif',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,position:'relative'}}>
      <style>{`*{margin:0;padding:0;box-sizing:border-box}body{background:#060c18}
.ob-bg{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 80% 60% at 50% 20%,rgba(79,143,255,0.10) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 80%,rgba(130,0,255,0.08) 0%,transparent 55%),radial-gradient(rgba(0,180,240,0.04) 1px,transparent 1px),#060c18;background-size:auto,auto,40px 40px,auto}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.ob-card{animation:fadeIn .35s ease both}
.ob-field:focus{border-color:rgba(79,143,255,0.5)!important;outline:none}`}</style>
      <div className="ob-bg" />

      {/* Progress bar */}
      <div style={{position:'fixed',top:0,left:0,right:0,height:3,background:'rgba(79,143,255,0.1)',zIndex:10}}>
        <div style={{height:'100%',width:`${progress}%`,background:'linear-gradient(90deg,#4f8fff,#8b6fff)',borderRadius:2,transition:'width .4s ease'}} />
      </div>

      {/* Logo */}
      <div style={{position:'fixed',top:16,left:20,display:'flex',alignItems:'center',gap:8,zIndex:10}}>
        <div style={{width:26,height:26,borderRadius:7,background:'linear-gradient(135deg,#4f8fff,#8b6fff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem',color:'#fff',fontWeight:900}}>W</div>
        <span style={{fontWeight:800,fontSize:'0.9rem'}}>Watchtower</span>
      </div>

      {/* Skip */}
      <button onClick={finish} style={{position:'fixed',top:16,right:20,background:'none',border:'none',color:'#4a5568',fontSize:'0.78rem',cursor:'pointer',fontFamily:'inherit',zIndex:10}}>
        Skip setup →
      </button>

      <div style={{maxWidth:540,width:'100%',position:'relative',zIndex:1}} className="ob-card" key={step}>

        {/* STEP 0: Welcome + Role */}
        {step === 0 && (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'2.4rem',marginBottom:12}}>👋</div>
            <h1 style={{fontSize:'1.6rem',fontWeight:900,letterSpacing:'-1px',marginBottom:8}}>Welcome to Watchtower</h1>
            <p style={{fontSize:'0.88rem',color:'#6b7a94',marginBottom:32,lineHeight:1.6}}>Let&apos;s get your SOC connected. This takes about 2 minutes.</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:24}}>
              {ROLES.map(r=>(
                <div key={r.id} onClick={()=>setRole(r.id)}
                  style={{padding:'16px 14px',background:role===r.id?'rgba(79,143,255,0.12)':'rgba(14,24,46,0.55)',border:`1px solid ${role===r.id?'rgba(79,143,255,0.40)':'rgba(0,180,240,0.13)'}`,borderRadius:12,cursor:'pointer',transition:'all .15s',textAlign:'left'}}>
                  <div style={{fontSize:'1.2rem',marginBottom:6}}>{r.icon}</div>
                  <div style={{fontSize:'0.82rem',fontWeight:700,marginBottom:2}}>{r.title}</div>
                  <div style={{fontSize:'0.68rem',color:'#6b7a94',lineHeight:1.4}}>{r.sub}</div>
                </div>
              ))}
            </div>
            <button onClick={()=>{if(role)setStep(1);}} disabled={!role}
              style={{width:'100%',padding:'12px',borderRadius:10,border:'none',background:role?'#4f8fff':'#1d2535',color:role?'#fff':'#4a5568',fontSize:'0.9rem',fontWeight:700,cursor:role?'pointer':'not-allowed',fontFamily:'inherit',transition:'all .15s'}}>
              Continue →
            </button>
          </div>
        )}

        {/* STEP 1: Connect a tool */}
        {step === 1 && (
          <div>
            <div style={{textAlign:'center',marginBottom:28}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',background:'rgba(79,143,255,0.10)',border:'1px solid rgba(79,143,255,0.25)',borderRadius:20,fontSize:'0.68rem',color:'#4f8fff',fontWeight:600,marginBottom:12}}>Step 1 of 3</div>
              <h2 style={{fontSize:'1.3rem',fontWeight:800,letterSpacing:'-0.5px',marginBottom:6}}>Connect your first tool</h2>
              <p style={{fontSize:'0.82rem',color:'#6b7a94',lineHeight:1.6}}>Choose a security tool to start pulling live data. You can add more later from the Tools tab.</p>
            </div>

            {!selectedTool ? (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {TOP_TOOLS.map(t=>(
                  <div key={t.id} onClick={()=>{setSelectedTool(t.id);setToolFields({});}}
                    style={{padding:'14px',background:'rgba(14,24,46,0.55)',border:'1px solid rgba(0,180,240,0.13)',borderRadius:10,cursor:'pointer',transition:'border-color .15s',display:'flex',alignItems:'center',gap:10}}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor=t.color+'60')}
                    onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(0,180,240,0.13)')}>
                    <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${t.color}cc,${t.color}55)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.55rem',fontWeight:900,color:'#fff',flexShrink:0}}>{t.id.slice(0,2).toUpperCase()}</div>
                    <div>
                      <div style={{fontSize:'0.78rem',fontWeight:700}}>{t.name}</div>
                      <div style={{fontSize:'0.62rem',color:'#4a5568'}}>{t.cat}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tool && (
              <div style={{background:'rgba(14,24,46,0.55)',border:`1px solid ${tool.color}30`,borderRadius:12,padding:'20px'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                  <div style={{width:36,height:36,borderRadius:8,background:`linear-gradient(135deg,${tool.color}cc,${tool.color}55)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem',fontWeight:900,color:'#fff'}}>{tool.id.slice(0,2).toUpperCase()}</div>
                  <div>
                    <div style={{fontSize:'0.88rem',fontWeight:700}}>{tool.name}</div>
                    <div style={{fontSize:'0.68rem',color:tool.color}}>{tool.cat}</div>
                  </div>
                  <button onClick={()=>{setSelectedTool('');setToolFields({});}} style={{marginLeft:'auto',background:'none',border:'none',color:'#4a5568',fontSize:'0.76rem',cursor:'pointer',fontFamily:'inherit'}}>✕ Change</button>
                </div>
                {tool.fields.map(f=>(
                  <div key={f} style={{marginBottom:10}}>
                    <label style={{display:'block',fontSize:'0.72rem',fontWeight:600,color:'#6b7a94',marginBottom:4,textTransform:'capitalize'}}>{f.replace(/_/g,' ')}</label>
                    <input className="ob-field" type={f.includes('secret')||f.includes('key')||f.includes('token')||f.includes('password')?'password':'text'}
                      value={toolFields[f]||''} onChange={e=>setToolFields(prev=>({...prev,[f]:e.target.value}))}
                      placeholder={f.includes('url')?'https://...':'Enter '+f.replace(/_/g,' ')}
                      style={{width:'100%',padding:'10px 12px',background:'rgba(4,8,20,0.6)',border:'1px solid rgba(0,180,240,0.13)',borderRadius:8,color:'#e8ecf4',fontSize:'0.82rem',fontFamily:'JetBrains Mono,monospace',boxSizing:'border-box'}} />
                  </div>
                ))}
                <button onClick={connectTool} disabled={saving||Object.values(toolFields).some(v=>!v.trim())}
                  style={{width:'100%',padding:'11px',borderRadius:9,border:'none',background:saving?'#1d2535':'#4f8fff',color:'#fff',fontSize:'0.85rem',fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:'inherit',marginTop:6}}>
                  {saving?'Connecting…':'Connect & Continue →'}
                </button>
              </div>
            )}

            <div style={{display:'flex',justifyContent:'space-between',marginTop:16}}>
              <button onClick={()=>setStep(0)} style={{background:'none',border:'none',color:'#4a5568',fontSize:'0.78rem',cursor:'pointer',fontFamily:'inherit'}}>← Back</button>
              <button onClick={()=>setStep(2)} style={{background:'none',border:'none',color:'#4f8fff',fontSize:'0.78rem',cursor:'pointer',fontFamily:'inherit'}}>Skip for now →</button>
            </div>
          </div>
        )}

        {/* STEP 2: AI Key */}
        {step === 2 && (
          <div>
            <div style={{textAlign:'center',marginBottom:28}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',background:'rgba(79,143,255,0.10)',border:'1px solid rgba(79,143,255,0.25)',borderRadius:20,fontSize:'0.68rem',color:'#4f8fff',fontWeight:600,marginBottom:12}}>Step 2 of 3</div>
              <h2 style={{fontSize:'1.3rem',fontWeight:800,letterSpacing:'-0.5px',marginBottom:6}}>Add your AI engine</h2>
              <p style={{fontSize:'0.82rem',color:'#6b7a94',lineHeight:1.6}}>Watchtower uses Anthropic Claude for AI triage. Your key — your data. No commingling.</p>
            </div>

            <div style={{background:'rgba(14,24,46,0.55)',border:'1px solid rgba(0,180,240,0.13)',borderRadius:12,padding:'20px'}}>
              <label style={{display:'block',fontSize:'0.72rem',fontWeight:600,color:'#6b7a94',marginBottom:6}}>Anthropic API Key</label>
              <input className="ob-field" type="password" value={aiKey} onChange={e=>setAiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                style={{width:'100%',padding:'10px 12px',background:'rgba(4,8,20,0.6)',border:'1px solid rgba(0,180,240,0.13)',borderRadius:8,color:'#e8ecf4',fontSize:'0.82rem',fontFamily:'JetBrains Mono,monospace',boxSizing:'border-box',marginBottom:12}} />
              <div style={{fontSize:'0.72rem',color:'#4a5568',lineHeight:1.6,marginBottom:14}}>
                Get your key at <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noopener noreferrer" style={{color:'#4f8fff',textDecoration:'none'}}>console.anthropic.com</a>. Your key is stored encrypted and never shared.
              </div>
              <button onClick={saveAiKey} disabled={saving||!aiKey.trim()}
                style={{width:'100%',padding:'11px',borderRadius:9,border:'none',background:aiKey.trim()?'#4f8fff':'#1d2535',color:aiKey.trim()?'#fff':'#4a5568',fontSize:'0.85rem',fontWeight:700,cursor:aiKey.trim()?'pointer':'not-allowed',fontFamily:'inherit'}}>
                {saving?'Saving…':'Save Key & Continue →'}
              </button>
            </div>

            <div style={{marginTop:16,padding:'14px',background:'rgba(34,212,154,0.06)',border:'1px solid rgba(34,212,154,0.15)',borderRadius:10}}>
              <div style={{fontSize:'0.78rem',fontWeight:700,color:'#22d49a',marginBottom:4}}>No key yet? No problem.</div>
              <div style={{fontSize:'0.72rem',color:'#6b7a94',lineHeight:1.5}}>You can use Demo mode to explore the full dashboard with simulated data. Add your key later from Settings.</div>
            </div>

            <div style={{display:'flex',justifyContent:'space-between',marginTop:16}}>
              <button onClick={()=>setStep(1)} style={{background:'none',border:'none',color:'#4a5568',fontSize:'0.78rem',cursor:'pointer',fontFamily:'inherit'}}>← Back</button>
              <button onClick={finish} style={{background:'none',border:'none',color:'#4f8fff',fontSize:'0.78rem',cursor:'pointer',fontFamily:'inherit'}}>Skip — use Demo mode →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Done */}
        {step === 3 && (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'3rem',marginBottom:16}}>🎉</div>
            <h2 style={{fontSize:'1.4rem',fontWeight:800,letterSpacing:'-0.5px',marginBottom:8}}>You&apos;re all set</h2>
            <p style={{fontSize:'0.88rem',color:'#6b7a94',lineHeight:1.6,marginBottom:24}}>Your SOC dashboard is ready. Alerts will start appearing as your connected tools sync.</p>
            <button onClick={finish}
              style={{padding:'13px 36px',borderRadius:10,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.9rem',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
              Open Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
