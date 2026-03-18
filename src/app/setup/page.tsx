'use client';
import { useState } from 'react';

type Step = 'welcome'|'connect'|'verify'|'done';

export default function SetupWizard() {
  const [step, setStep] = useState<Step>('welcome');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [creds, setCreds] = useState<Record<string, Record<string, string>>>({});
  const [testing, setTesting] = useState<string|null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const tools = [
    { id: 'tenable', name: 'Tenable.io', icon: '🛡', fields: [{ key: 'TENABLE_ACCESS_KEY', label: 'Access Key', secret: false }, { key: 'TENABLE_SECRET_KEY', label: 'Secret Key', secret: true }] },
    { id: 'taegis', name: 'Secureworks Taegis', icon: '🎯', fields: [{ key: 'TAEGIS_CLIENT_ID', label: 'Client ID', secret: false }, { key: 'TAEGIS_CLIENT_SECRET', label: 'Client Secret', secret: true }] },
    { id: 'defender', name: 'Microsoft Defender', icon: '🔷', fields: [{ key: 'DEFENDER_TENANT_ID', label: 'Tenant ID', secret: false }, { key: 'DEFENDER_CLIENT_ID', label: 'Client ID', secret: false }, { key: 'DEFENDER_CLIENT_SECRET', label: 'Client Secret', secret: true }] },
    { id: 'crowdstrike', name: 'CrowdStrike', icon: '🦅', fields: [{ key: 'CS_CLIENT_ID', label: 'Client ID', secret: false }, { key: 'CS_CLIENT_SECRET', label: 'Client Secret', secret: true }] },
    { id: 'zscaler', name: 'Zscaler ZIA', icon: '☁', fields: [{ key: 'ZIA_API_KEY', label: 'API Key', secret: false }, { key: 'ZIA_USERNAME', label: 'Username', secret: false }, { key: 'ZIA_PASSWORD', label: 'Password', secret: true }] },
    { id: 'anthropic', name: 'Anthropic AI', icon: '🤖', fields: [{ key: 'ANTHROPIC_API_KEY', label: 'API Key', secret: true }], note: 'Powers AI triage, co-pilot, and threat intel' },
  ];

  function toggleTool(id: string) { setSelectedTools(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]); }
  function setCred(toolId: string, key: string, val: string) { setCreds(p => ({ ...p, [toolId]: { ...(p[toolId] || {}), [key]: val } })); }

  async function testTool(toolId: string) {
    setTesting(toolId);
    try {
      const r = await fetch('/api/tools/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toolId, credentials: creds[toolId] }) });
      const d = await r.json();
      setTestResults(p => ({ ...p, [toolId]: d }));
    } catch(e) { setTestResults(p => ({ ...p, [toolId]: { error: 'Test failed' } })); }
    setTesting(null);
  }

  async function saveAndFinish() {
    setSaving(true);
    for (const toolId of selectedTools) {
      if (creds[toolId] && Object.values(creds[toolId]).some(v => v)) {
        await fetch('/api/tools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toolId, credentials: creds[toolId], enabled: true }) });
      }
    }
    setSaving(false);
    setStep('done');
  }

  async function enableDemo() {
    setDemoMode(true);
    await fetch('/api/tools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toolId: '_demo', credentials: { mode: 'demo' }, enabled: true }) });
    setStep('done');
  }

  const connectedCount = Object.values(testResults).filter((r: any) => r.steps?.every((s: any) => s.ok)).length;

  return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="wz"><div className="wz-progress"><div className="wz-bar" style={{ width: step === 'welcome' ? '25%' : step === 'connect' ? '50%' : step === 'verify' ? '75%' : '100%' }} /></div>{step === 'welcome' && <div className="wz-step"><div className="wz-hero-icon">🏰</div><h1 className="wz-h1">Welcome to Watchtower</h1><p className="wz-sub">Your SOC command centre. Get set up in under 2 minutes.</p><div className="wz-options"><button className="wz-option" onClick={() => setStep('connect')}><span className="wz-opt-icon">🔌</span><div><div className="wz-opt-title">Connect my tools</div><div className="wz-opt-desc">Link Tenable, Taegis, Defender, or other security tools</div></div><span className="wz-arrow">→</span></button><button className="wz-option" onClick={enableDemo}><span className="wz-opt-icon">🎮</span><div><div className="wz-opt-title">Try with demo data</div><div className="wz-opt-desc">Explore the full dashboard with realistic synthetic data</div></div><span className="wz-arrow">→</span></button></div><p className="wz-hint">You can always connect real tools later from Settings</p><button className="wz-skip" onClick={() => { if(typeof window!=='undefined')sessionStorage.setItem('wt-skip-setup','1'); window.location.href='/dashboard'; }}>Skip setup entirely →</button></div>}{step === 'connect' && <div className="wz-step"><h1 className="wz-h1">Connect your tools</h1><p className="wz-sub">Select the tools you use. You can add more later.</p><div className="wz-tools">{tools.map(t => (<button key={t.id} className={`wz-tool ${selectedTools.includes(t.id) ? 'selected' : ''}`} onClick={() => toggleTool(t.id)}><span className="wz-tool-icon">{t.icon}</span><span className="wz-tool-name">{t.name}</span>{selectedTools.includes(t.id) && <span className="wz-check">✓</span>}</button>))}</div><div className="wz-actions"><button className="wz-btn-ghost" onClick={() => setStep('welcome')}>← Back</button><button className="wz-btn" onClick={() => setStep('verify')} disabled={selectedTools.length === 0}>Enter credentials →</button></div><button className="wz-skip" onClick={enableDemo}>Skip — use demo data instead</button></div>}{step === 'verify' && <div className="wz-step"><h1 className="wz-h1">Enter credentials</h1><p className="wz-sub">{selectedTools.length} tool{selectedTools.length > 1 ? 's' : ''} selected. Credentials are encrypted in your Redis instance.</p><div className="wz-cred-list">{selectedTools.map(tid => { const t = tools.find(x => x.id === tid); if (!t) return null; const result = testResults[tid]; const allOk = result?.steps?.every((s: any) => s.ok); return (<div key={tid} className="wz-cred-card"><div className="wz-cred-hd"><span>{t.icon} {t.name}</span>{result && <span style={{ color: allOk ? '#34e8a5' : '#ff4466', fontSize: '.72rem', fontWeight: 700 }}>{allOk ? '✓ Connected' : '✗ Failed'}</span>}</div>{t.note && <div style={{ fontSize: '.68rem', color: '#8896b8', marginBottom: 8 }}>{t.note}</div>}{t.fields.map(f => (<div key={f.key} className="wz-field"><label>{f.label}</label><input type={f.secret ? 'password' : 'text'} value={creds[tid]?.[f.key] || ''} onChange={e => setCred(tid, f.key, e.target.value)} placeholder={f.key} /></div>))}<button className="wz-test-btn" onClick={() => testTool(tid)} disabled={testing === tid}>{testing === tid ? 'Testing...' : 'Test Connection'}</button>{result && !allOk && <div style={{ fontSize: '.68rem', color: '#ff4466', marginTop: 4 }}>{result.steps?.find((s: any) => !s.ok)?.error || result.error || 'Connection failed'}</div>}</div>); })}</div><div className="wz-actions"><button className="wz-btn-ghost" onClick={() => setStep('connect')}>← Back</button><button className="wz-btn" onClick={saveAndFinish} disabled={saving}>{saving ? 'Saving...' : `Finish setup →`}</button></div></div>}{step === 'done' && <div className="wz-step"><div className="wz-hero-icon">🎉</div><h1 className="wz-h1">{demoMode ? "You're in demo mode" : "You're all set"}</h1><p className="wz-sub">{demoMode ? 'Explore the full dashboard with realistic data. Connect real tools anytime.' : `${connectedCount} tool${connectedCount !== 1 ? 's' : ''} connected. Your SOC dashboard is ready.`}</p><div className="wz-done-cards"><div className="wz-done-card"><span>◉</span> Posture score & live alerts</div><div className="wz-done-card"><span>🤖</span> AI-powered triage & co-pilot</div><div className="wz-done-card"><span>⏱</span> SLA tracking with deadlines</div><div className="wz-done-card"><span>📁</span> Incident timeline builder</div></div><a href="/dashboard" className="wz-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', marginTop: 20 }}>Open Dashboard →</a></div>}</div></>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#05070c;color:#eaf0ff;font-family:'DM Sans',sans-serif}
.wz{min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:20px 20px 60px}
.wz-progress{width:100%;max-width:500px;height:3px;background:#141928;border-radius:3px;margin-bottom:48px;overflow:hidden}
.wz-bar{height:100%;background:linear-gradient(90deg,#5b9aff,#8b6fff);border-radius:3px;transition:width .4s ease}
.wz-step{max-width:560px;width:100%;text-align:center}
.wz-hero-icon{font-size:3.2rem;margin-bottom:16px;filter:drop-shadow(0 0 20px rgba(91,154,255,.3))}
.wz-h1{font-size:1.8rem;font-weight:900;letter-spacing:-1.5px;margin-bottom:8px}
.wz-sub{font-size:.88rem;color:#8896b8;margin-bottom:32px;line-height:1.6}
.wz-options{display:flex;flex-direction:column;gap:10px;text-align:left}
.wz-option{display:flex;align-items:center;gap:14px;padding:18px 22px;background:linear-gradient(145deg,#0a0d15,#0f1219);border:1.5px solid #1e2840;border-radius:16px;cursor:pointer;transition:all .25s;width:100%;color:#eaf0ff;font-family:'DM Sans',sans-serif}
.wz-option:hover{border-color:#5b9aff;transform:translateX(4px);box-shadow:0 4px 20px rgba(91,154,255,.08)}
.wz-opt-icon{font-size:1.6rem;flex-shrink:0}
.wz-opt-title{font-size:.92rem;font-weight:700}
.wz-opt-desc{font-size:.72rem;color:#8896b8;margin-top:2px}
.wz-arrow{margin-left:auto;color:#5b9aff;font-size:1.2rem;transition:transform .2s}
.wz-option:hover .wz-arrow{transform:translateX(4px)}
.wz-hint{font-size:.68rem;color:#4a5672;margin-top:20px}
.wz-tools{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:24px}
.wz-tool{display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px 12px;background:#0a0d15;border:1.5px solid #1e2840;border-radius:14px;cursor:pointer;transition:all .2s;color:#8896b8;font-family:'DM Sans',sans-serif;position:relative}
.wz-tool:hover{border-color:#5b9aff40;color:#eaf0ff}
.wz-tool.selected{border-color:#5b9aff;background:#5b9aff08;color:#eaf0ff;box-shadow:0 0 16px rgba(91,154,255,.08)}
.wz-tool-icon{font-size:1.6rem}
.wz-tool-name{font-size:.72rem;font-weight:600}
.wz-check{position:absolute;top:6px;right:8px;color:#34e8a5;font-size:.72rem;font-weight:900}
.wz-actions{display:flex;justify-content:space-between;gap:12px}
.wz-btn{padding:12px 28px;border:none;border-radius:12px;background:linear-gradient(135deg,#5b9aff,#8b6fff);color:#fff;font-size:.88rem;font-weight:700;cursor:pointer;transition:all .25s;font-family:'DM Sans',sans-serif;box-shadow:0 4px 20px rgba(91,154,255,.3)}
.wz-btn:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(91,154,255,.4)}
.wz-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.wz-btn-ghost{padding:12px 24px;border:1px solid #1e2840;border-radius:12px;background:transparent;color:#8896b8;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
.wz-btn-ghost:hover{border-color:#5b9aff;color:#5b9aff}
.wz-skip{background:none;border:none;color:#4a5672;font-size:.72rem;cursor:pointer;margin-top:20px;font-family:'DM Sans',sans-serif;transition:color .2s}
.wz-skip:hover{color:#5b9aff}
.wz-cred-list{display:flex;flex-direction:column;gap:12px;text-align:left;margin-bottom:20px}
.wz-cred-card{background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #1e2840;border-radius:14px;padding:18px}
.wz-cred-hd{display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:.88rem;margin-bottom:10px}
.wz-field{margin-bottom:8px}
.wz-field label{display:block;font-size:.68rem;font-weight:600;color:#8896b8;margin-bottom:3px}
.wz-field input{width:100%;padding:9px 12px;background:#0f1219;border:1px solid #1e2840;border-radius:8px;color:#eaf0ff;font-size:.78rem;font-family:'JetBrains Mono',monospace;outline:none;transition:border .2s}
.wz-field input:focus{border-color:#5b9aff}
.wz-test-btn{padding:6px 14px;border:1px solid #5b9aff30;border-radius:8px;background:#5b9aff10;color:#5b9aff;font-size:.72rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif;margin-top:4px}
.wz-test-btn:hover{background:#5b9aff20}
.wz-test-btn:disabled{opacity:.5}
.wz-done-cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:24px;text-align:left}
.wz-done-card{display:flex;align-items:center;gap:8px;padding:12px 14px;background:linear-gradient(145deg,#0a0d15,#0f1219);border:1px solid #141928;border-radius:12px;font-size:.76rem;font-weight:600}
@media(max-width:600px){.wz{padding:16px 14px 40px}.wz-h1{font-size:1.4rem}.wz-tools{grid-template-columns:repeat(2,1fr)}.wz-done-cards{grid-template-columns:1fr}.wz-actions{flex-direction:column-reverse}.wz-option{padding:14px 16px}.wz-cred-card{padding:14px}}`;
