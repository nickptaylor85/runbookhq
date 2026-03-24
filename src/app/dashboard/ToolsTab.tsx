'use client';
import React, { useState, useEffect } from 'react';

const ALL_TOOLS = [
  {id:'crowdstrike',name:'CrowdStrike Falcon',category:'EDR',desc:'Endpoint detection & response'},
  {id:'defender',name:'Microsoft Defender',category:'EDR',desc:'Defender for Endpoint — Azure AD app required'},
  {id:'sentinelone',name:'SentinelOne',category:'EDR',desc:'AI-powered endpoint protection'},
  {id:'carbonblack',name:'Carbon Black',category:'EDR',desc:'Carbon Black Cloud'},
  {id:'splunk',name:'Splunk SIEM',category:'SIEM',desc:'Splunk Enterprise Security or Cloud'},
  {id:'sentinel',name:'Microsoft Sentinel',category:'SIEM',desc:'Cloud-native SIEM — Azure AD app required'},
  {id:'qradar',name:'IBM QRadar',category:'SIEM',desc:'Security intelligence platform'},
  {id:'elastic',name:'Elastic Security',category:'SIEM',desc:'SIEM built on Elastic Stack'},
  {id:'darktrace',name:'Darktrace',category:'NDR',desc:'AI network anomaly detection — HMAC auth'},
  {id:'taegis',name:'Secureworks Taegis',category:'XDR',desc:'Extended detection & response'},
  {id:'tenable',name:'Tenable.io',category:'Vuln',desc:'Cloud vulnerability management'},
  {id:'nessus',name:'Nessus',category:'Vuln',desc:'On-premise vulnerability scanner'},
  {id:'qualys',name:'Qualys',category:'Vuln',desc:'Cloud-based vulnerability management'},
  {id:'wiz',name:'Wiz',category:'CSPM',desc:'Cloud security posture management'},
  {id:'proofpoint',name:'Proofpoint',category:'Email',desc:'Email security & threat protection'},
  {id:'mimecast',name:'Mimecast',category:'Email',desc:'Email security platform'},
  {id:'zscaler',name:'Zscaler',category:'Network',desc:'Zero trust network access'},
  {id:'okta',name:'Okta',category:'Identity',desc:'Identity & access management'},
];

const CRED_FIELDS = {
  crowdstrike:[{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true},{key:'base_url',label:'Base URL (optional)',placeholder:'https://api.crowdstrike.com'}],
  defender:[{key:'tenant_id',label:'Tenant ID',placeholder:'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'},{key:'client_id',label:'Application (Client) ID'},{key:'client_secret',label:'Client Secret',secret:true}],
  sentinelone:[{key:'host',label:'Management URL',placeholder:'https://your-tenant.sentinelone.net'},{key:'api_token',label:'API Token',secret:true}],
  carbonblack:[{key:'host',label:'CB Cloud URL',placeholder:'https://defense.conferdeploy.net'},{key:'org_key',label:'Org Key'},{key:'api_id',label:'API ID'},{key:'api_secret',label:'API Secret Key',secret:true}],
  splunk:[{key:'host',label:'Splunk Host',placeholder:'https://splunk.company.com:8089'},{key:'token',label:'API Token',secret:true}],
  sentinel:[{key:'tenant_id',label:'Tenant ID'},{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true},{key:'subscription_id',label:'Subscription ID'},{key:'resource_group',label:'Resource Group'},{key:'workspace',label:'Workspace Name'}],
  qradar:[{key:'host',label:'QRadar Host',placeholder:'https://qradar.company.com'},{key:'sec_token',label:'SEC Token',secret:true}],
  elastic:[{key:'host',label:'Kibana URL',placeholder:'https://kibana.company.com'},{key:'api_key',label:'API Key',secret:true},{key:'space',label:'Space ID (optional)',placeholder:'default'}],
  darktrace:[{key:'host',label:'Darktrace Hostname',placeholder:'https://darktrace.company.com'},{key:'public_key',label:'Public Token'},{key:'private_key',label:'Private Token',secret:true}],
  taegis:[{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true},{key:'region',label:'Region',placeholder:'us1'}],
  tenable:[{key:'access_key',label:'Access Key'},{key:'secret_key',label:'Secret Key',secret:true}],
  nessus:[{key:'host',label:'Nessus Host',placeholder:'https://nessus.company.com:8834'},{key:'access_key',label:'Access Key'},{key:'secret_key',label:'Secret Key',secret:true}],
  qualys:[{key:'platform',label:'Platform URL',placeholder:'https://qualysapi.qualys.com'},{key:'username',label:'Username'},{key:'password',label:'Password',secret:true}],
  wiz:[{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true},{key:'api_endpoint',label:'API Endpoint',placeholder:'https://api.eu1.app.wiz.io/graphql'}],
  proofpoint:[{key:'principal',label:'Service Principal'},{key:'secret',label:'Secret',secret:true}],
  mimecast:[{key:'base_url',label:'Base URL',placeholder:'https://eu-api.mimecast.com'},{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true}],
  zscaler:[{key:'cloud',label:'Cloud URL',placeholder:'https://zsapi.zscaler.net'},{key:'username',label:'Username'},{key:'password',label:'Password',secret:true},{key:'api_key',label:'API Key',secret:true}],
  okta:[{key:'domain',label:'Okta Domain',placeholder:'https://company.okta.com'},{key:'api_token',label:'API Token',secret:true}],
};

const CATEGORIES = ['All','EDR','SIEM','NDR','XDR','Vuln','CSPM','Email','Network','Identity'];

function ToolsTab({ connected, setConnected }) {
  const [filter, setFilter] = useState('All');
  const [modal, setModal] = useState(null);
  const [formVals, setFormVals] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [anthropicKey, setAnthropicKey] = useState('');
  const [keyStatus, setKeyStatus] = useState('idle');
  const [aiTestStatus, setAiTestStatus] = useState(null);
  const [aiTestLoading, setAiTestLoading] = useState(false);

  useEffect(()=>{ testAiKey(); },[]);

  async function saveAnthropicKey() {
    if (!anthropicKey.trim()) return;
    setKeyStatus('saving');
    try {
      const res = await fetch('/api/settings/anthropic-key', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({key: anthropicKey.trim(), tenantId: aiTestStatus?.tenantId || 'global'}),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setKeyStatus('saved');
        setAnthropicKey('');
        await testAiKey();
      } else {
        setAiTestStatus({ok:false, configured:false, message: data.message || 'Failed to save key.'});
        setKeyStatus('error');
        setTimeout(()=>setKeyStatus('idle'), 4000);
      }
    } catch(e) { setKeyStatus('error'); setTimeout(()=>setKeyStatus('idle'), 3000); }
  }

  async function testAiKey() {
    setAiTestLoading(true);
    setAiTestStatus(null);
    try {
      const res = await fetch('/api/settings/test-ai');
      const data = await res.json();
      setAiTestStatus(data);
    } catch(e) {
      setAiTestStatus({ok:false, configured:false, message:'Could not reach test endpoint'});
    }
    setAiTestLoading(false);
  }

  async function handleRemoveKey() {
    await fetch('/api/settings/anthropic-key', {method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({tenantId: aiTestStatus ? aiTestStatus.tenantId : 'global'})});
    await testAiKey();
  }

  const filtered = filter==='All' ? ALL_TOOLS : ALL_TOOLS.filter(t=>t.category===filter);

  function openModal(tool) {
    setModal(tool);
    setFormVals({});
    setTestResult(null);
  }

  async function handleTest() {
    if (!modal) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/integrations/test', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:modal.id, credentials:formVals}),
      });
      const data = await res.json();
      setTestResult(data);
    } catch(e) {
      setTestResult({ok:false, message:'Test request failed'});
    }
    setTesting(false);
  }

  function handleSave() {
    if (!modal || !testResult?.ok) return;
    const newCreds = {...formVals};
    setConnected(prev=>({...prev,[modal.id]:newCreds}));
    // Persist to Redis
    fetch('/api/integrations/credentials', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({toolId:modal.id, credentials:newCreds})}).catch(()=>{});
    setModal(null);
  }

  function handleDisconnect(id) {
    setConnected(prev=>{ const n={...prev}; delete n[id]; return n; });
    // Remove from Redis
    fetch('/api/integrations/credentials', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({toolId:id, credentials:null})}).catch(()=>{});
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Integrations</h2>
        <span style={{fontSize:'0.62rem',color:'#22d49a',background:'#22d49a12',padding:'2px 8px',borderRadius:4}}>{Object.keys(connected).length} connected</span>
        <div style={{display:'flex',gap:4,marginLeft:'auto',flexWrap:'wrap'}}>
          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setFilter(c)} style={{padding:'3px 10px',borderRadius:5,border:`1px solid ${filter===c?'#4f8fff40':'var(--wt-border2)'}`,background:filter===c?'#4f8fff18':'transparent',color:filter===c?'#4f8fff':'#6b7a94',fontSize:'0.62rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>{c}</button>
          ))}
        </div>
      </div>

      {/* Anthropic API Key */}
      <div style={{padding:'16px',background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(139,111,255,0.05))',border:'1px solid #4f8fff25',borderRadius:12}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <div style={{width:8,height:8,borderRadius:'50%',background: aiTestStatus?.ok ? '#22c992' : '#f0a030',boxShadow: aiTestStatus?.ok ? '0 0 6px #22c992' : 'none',flexShrink:0}} />
          <span style={{fontSize:'0.82rem',fontWeight:700}}>AI Engine — Anthropic API Key</span>
          <span style={{fontSize:'0.58rem',fontWeight:700,padding:'2px 8px',borderRadius:4,background: aiTestStatus?.ok ? '#22d49a12' : '#f0a03012',color: aiTestStatus?.ok ? '#22d49a' : '#f0a030',border:`1px solid ${aiTestStatus?.ok ? '#22d49a20' : '#f0a03020'}`}}>
            {aiTestLoading ? 'Checking…' : aiTestStatus?.ok ? '✓ Active' : aiTestStatus?.configured ? '⚠ Key invalid' : '○ Not configured'}
          </span>
          <button onClick={testAiKey} disabled={aiTestLoading} style={{marginLeft:'auto',padding:'3px 10px',borderRadius:5,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.62rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            {aiTestLoading ? '…' : 'Test Key'}
          </button>
        </div>
        {aiTestStatus && (
          <div style={{padding:'8px 10px',borderRadius:7,background: aiTestStatus.ok ? '#22d49a08' : '#f0405e08',border:`1px solid ${aiTestStatus.ok ? '#22d49a20' : '#f0405e20'}`,fontSize:'0.7rem',color: aiTestStatus.ok ? '#22d49a' : '#f0a030',marginBottom:10,lineHeight:1.6}}>
            {aiTestStatus.message}
          </div>
        )}
        {!aiTestStatus?.ok && (
          <>
            <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:10,lineHeight:1.7}}>
              Add your Anthropic API key in <strong style={{color:'var(--wt-text)'}}>Vercel → Project Settings → Environment Variables</strong> as <code style={{background:'var(--wt-border)',padding:'1px 5px',borderRadius:3,fontFamily:'JetBrains Mono,monospace',fontSize:'0.68rem'}}>ANTHROPIC_API_KEY</code>, then redeploy. Or paste below to auto-save via API.
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input type='password' value={anthropicKey} onChange={e=>setAnthropicKey(e.target.value)} placeholder='sk-ant-api03-...' style={{flex:1,padding:'8px 12px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'var(--wt-bg)',color:'var(--wt-text)',fontSize:'0.76rem',fontFamily:'JetBrains Mono,monospace',outline:'none'}} />
              <button onClick={saveAnthropicKey} disabled={!anthropicKey.trim()||keyStatus==='saving'} style={{padding:'8px 16px',borderRadius:7,border:'none',background:keyStatus==='error'?'#f0405e':'#4f8fff',color:'#fff',fontSize:'0.74rem',fontWeight:700,cursor:anthropicKey.trim()?'pointer':'not-allowed',fontFamily:'Inter,sans-serif',flexShrink:0,opacity:anthropicKey.trim()?1:0.5}}>
                {keyStatus==='saving'?'Saving…':keyStatus==='error'?'✗ Failed':'Save Key'}
              </button>
            </div>
            <div style={{fontSize:'0.62rem',color:'var(--wt-dim)',marginTop:8}}>
              Get your key at <a href='https://console.anthropic.com/account/keys' target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{color:'#4f8fff',textDecoration:'none'}}>console.anthropic.com</a> · Tenant: <code style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.6rem',background:'var(--wt-border)',padding:'1px 4px',borderRadius:2}}>{aiTestStatus?.tenantId || 'global'}</code>
            </div>
          </>
        )}
        {aiTestStatus?.ok && (
          <>
          <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',lineHeight:1.6}}>
            AI triage, Co-Pilot, and remediation assistant are all active.
          </div>
          <button onClick={handleRemoveKey} style={{marginTop:8,padding:'5px 12px',borderRadius:7,border:'1px solid #f0405e25',background:'#f0405e0a',color:'#f0405e',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Remove Key</button>
          </>
        )}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {filtered.map(tool=>{
          const isOn = !!connected[tool.id];
          return (
            <div key={tool.id} style={{padding:'12px 16px',background:'var(--wt-card)',border:`1px solid ${isOn?'#22c99218':'var(--wt-border)'}`,borderRadius:10,display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:9,height:9,borderRadius:'50%',background:isOn?'#22c992':'#252e42',boxShadow:isOn?'0 0 7px #22c992':'none',flexShrink:0}} />
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:1}}>
                  <span style={{fontSize:'0.82rem',fontWeight:700}}>{tool.name}</span>
                  <span style={{fontSize:'0.5rem',fontWeight:700,padding:'1px 6px',borderRadius:3,background:'#4f8fff12',color:'#4f8fff',border:'1px solid #4f8fff18'}}>{tool.category}</span>
                </div>
                <div style={{fontSize:'0.64rem',color:isOn?'#22d49a':'var(--wt-muted)',display:'flex',alignItems:'center',gap:4}}>
                  {isOn && <span style={{width:5,height:5,borderRadius:'50%',background:'#22c992',boxShadow:'0 0 5px #22c992',display:'block'}} />}
                  {isOn ? 'Connected' : tool.desc}
                </div>
                {isOn && connected[tool.id] && (
                  <div style={{fontSize:'0.58rem',color:'var(--wt-dim)',marginTop:2}}>
                    {Object.entries(connected[tool.id]).filter(([k])=>!k.includes('secret')&&!k.includes('password')&&!k.includes('token')&&!k.includes('key')).slice(0,2).map(([k,v])=>(
                      <span key={k} style={{marginRight:8}}>{k}: <span style={{fontFamily:'JetBrains Mono,monospace'}}>{String(v).slice(0,20)}</span></span>
                    ))}
                  </div>
                )}
              </div>
              {isOn
                ? <button onClick={()=>{if(window.confirm('Disconnect '+tool.name+'?')) handleDisconnect(tool.id);}} style={{padding:'5px 14px',borderRadius:7,border:'1px solid #f0405e30',background:'#f0405e10',color:'#f0405e',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:5}}>🗑 Disconnect</button>
                : <button onClick={()=>openModal(tool)} style={{padding:'5px 14px',borderRadius:7,border:'1px solid #4f8fff40',background:'#4f8fff12',color:'#4f8fff',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>+ Connect</button>}
            </div>
          );
        })}
      </div>
      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setModal(null)}>
          <div style={{background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:16,maxWidth:480,width:'100%',padding:24,maxHeight:'85vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:'0.92rem',fontWeight:800,marginBottom:4}}>Connect {modal.name}</div>
            <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:18}}>Credentials are sent directly to the integration API for validation and never stored on our servers.</div>
            {(CRED_FIELDS[modal.id]||[]).map(f=>(
              <div key={f.key} style={{marginBottom:12}}>
                <div style={{fontSize:'0.68rem',fontWeight:600,color:'#8a9ab8',marginBottom:4}}>{f.label}</div>
                <input type={f.secret?'password':'text'} value={formVals[f.key]||''} onChange={e=>setFormVals(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder||''} style={{width:'100%',padding:'9px 12px',background:'var(--wt-bg)',border:'1px solid var(--wt-border2)',borderRadius:8,color:'var(--wt-text)',fontSize:'0.76rem',fontFamily:f.secret?'JetBrains Mono,monospace':'Inter,sans-serif',outline:'none'}} />
              </div>
            ))}
            {testResult && (
              <div style={{padding:'8px 12px',borderRadius:8,background:testResult.ok?'#22d49a0a':'#f0405e0a',border:`1px solid ${testResult.ok?'#22d49a20':'#f0405e20'}`,fontSize:'0.72rem',color:testResult.ok?'#22d49a':'#f0405e',marginBottom:12}}>
                {testResult.ok?'✓':'✗'} {testResult.message}
              </div>
            )}
            <div style={{display:'flex',gap:8,marginTop:4}}>
              <button onClick={handleTest} disabled={testing||Object.keys(formVals).length===0} style={{flex:1,padding:'9px 0',borderRadius:8,border:'1px solid #4f8fff30',background:'#4f8fff12',color:'#4f8fff',fontSize:'0.78rem',fontWeight:700,cursor:testing?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',opacity:testing?0.7:1}}>
                {testing?'Testing…':'Test Connection'}
              </button>
              <button onClick={handleSave} disabled={!testResult?.ok} style={{flex:1,padding:'9px 0',borderRadius:8,border:'none',background:testResult?.ok?'#4f8fff':'var(--wt-border2)',color:testResult?.ok?'#fff':'#3a4050',fontSize:'0.78rem',fontWeight:700,cursor:testResult?.ok?'pointer':'not-allowed',fontFamily:'Inter,sans-serif'}}>
                Save & Connect
              </button>
              <button onClick={()=>setModal(null)} style={{padding:'9px 16px',borderRadius:8,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.78rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DASHBOARD_CSS = '*{margin:0;padding:0;box-sizing:border-box}\n        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}\n        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}\n\n        /* ── Dark theme (default) ── */\n        .wt-root {\n          --wt-bg: #050508;\n          --wt-sidebar: #07080f;\n          --wt-card: #09091a;\n          --wt-card2: #0a0d14;\n          --wt-border: #141820;\n          --wt-border2: #1e2536;\n          --wt-text: #e8ecf4;\n          --wt-muted: #6b7a94;\n          --wt-secondary: #8a9ab0;\n          --wt-dim: #3a4050;\n        }\n        /* ── Light theme ── */\n        .wt-root.light {\n          --wt-bg: #f5f6fa;\n          --wt-sidebar: #ffffff;\n          --wt-card: #ffffff;\n          --wt-card2: #f0f2f8;\n          --wt-border: #e2e5ef;\n          --wt-border2: #c8cedd;\n          --wt-text: #0f1117;\n          --wt-muted: #5a6580;\n          --wt-secondary: #4a5568;\n          --wt-dim: #8090a8;\n        }\n\n        .tab-btn{padding:7px 16px;border:none;background:transparent;cursor:pointer;font-size:0.76rem;font-weight:600;font-family:Inter,sans-serif;border-radius:8px;transition:all .15s;white-space:nowrap;color:var(--wt-muted)}\n        .tab-btn.active{background:#4f8fff18;color:#4f8fff}\n        .tab-btn:not(.active) {color:var(--wt-secondary);background:var(--wt-card2)}\n        .row-hover{transition:background .12s}\n        .row-hover:hover{background:var(--wt-card2)!important}\n        .vuln-row:hover{background:var(--wt-card2)!important;cursor:pointer}\n        .alert-card{border-radius:10px;border:1px solid var(--wt-border);background:var(--wt-card);transition:border-color .15s}\n        .alert-card:hover{border-color:#4f8fff28}';
export default ToolsTab;
