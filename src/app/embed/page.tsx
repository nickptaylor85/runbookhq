'use client';
import { useState, useEffect } from 'react';

export default function EmbedPage() {
  const [apiKey, setApiKey] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  async function loadPreview() {
    if (!apiKey) return;
    const r = await fetch('/api/widget?key=' + apiKey);
    if (r.ok) setPreview(await r.json());
  }

  const embedCode = `<div id="watchtower-widget"></div>
<script>
(function(){
  var k="${apiKey}";
  var t="${theme}";
  fetch("${typeof window !== 'undefined' ? window.location.origin : ''}/api/widget?key="+k)
    .then(function(r){return r.json()})
    .then(function(d){
      var c=t==="dark"?"background:#0a0d15;color:#eaf0ff;border:1px solid #1e2840":"background:#fff;color:#1a1a2e;border:1px solid #e8ecf4";
      var sc=d.status==="healthy"?"#34e8a5":d.status==="warning"?"#ff4466":"#ffb340";
      document.getElementById("watchtower-widget").innerHTML=
        '<div style="'+c+';border-radius:12px;padding:14px 18px;font-family:sans-serif;display:inline-flex;align-items:center;gap:12px">'+
        '<div style="width:10px;height:10px;border-radius:50%;background:'+sc+';box-shadow:0 0 8px '+sc+'"></div>'+
        '<div><div style="font-size:13px;font-weight:700">SOC Status: '+d.status.toUpperCase()+'</div>'+
        '<div style="font-size:11px;opacity:.6">'+d.openIncidents+' incidents · '+d.slaBreached+' SLA breaches · '+d.noiseReduction.timeSavedHours+'h AI saved</div></div>'+
        '<div style="margin-left:auto;font-size:9px;opacity:.4">Watchtower</div></div>';
    });
})();
</script>`;

  return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="em">
    <div className="em-hd"><div className="em-logo"><div className="em-logo-icon">W</div>Watchtower <span style={{ color: '#8896b8', fontWeight: 500, fontSize: '.82rem', marginLeft: 4 }}>Embeddable Widget</span></div><a href="/dashboard" className="em-back">← Dashboard</a></div>

    <div className="em-content">
      <h1 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 8 }}>Status Widget</h1>
      <p style={{ fontSize: '.82rem', color: '#8896b8', marginBottom: 24 }}>Embed your SOC status on your intranet, wiki, or status page. Shows live incidents, SLA status, and AI savings.</p>

      <div className="em-step"><span className="em-num">1</span><div><strong>Enter your API key</strong><p style={{ fontSize: '.72rem', color: '#8896b8', marginTop: 2 }}>Generate one from Settings → API Keys</p></div></div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="wt_..." style={{ flex: 1, padding: '10px 14px', background: '#0f1219', border: '1px solid #1e2840', borderRadius: 10, color: '#eaf0ff', fontSize: '.82rem', fontFamily: 'JetBrains Mono,monospace', outline: 'none' }} />
        <button onClick={loadPreview} style={{ padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#5b9aff,#8b6fff)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>Preview</button>
      </div>

      <div className="em-step"><span className="em-num">2</span><div><strong>Choose theme</strong></div></div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTheme('dark')} style={{ padding: '8px 16px', borderRadius: 8, background: theme === 'dark' ? '#5b9aff15' : 'transparent', border: `1px solid ${theme === 'dark' ? '#5b9aff' : '#1e2840'}`, color: theme === 'dark' ? '#5b9aff' : '#8896b8', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>🌙 Dark</button>
        <button onClick={() => setTheme('light')} style={{ padding: '8px 16px', borderRadius: 8, background: theme === 'light' ? '#5b9aff15' : 'transparent', border: `1px solid ${theme === 'light' ? '#5b9aff' : '#1e2840'}`, color: theme === 'light' ? '#5b9aff' : '#8896b8', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>☀ Light</button>
      </div>

      {preview && <><div className="em-step"><span className="em-num">3</span><div><strong>Preview</strong></div></div>
        <div style={{ padding: 20, background: theme === 'dark' ? '#05070c' : '#f8fafd', borderRadius: 12, marginBottom: 20, border: '1px solid #1e2840' }}>
          <div style={{ background: theme === 'dark' ? '#0a0d15' : '#fff', color: theme === 'dark' ? '#eaf0ff' : '#1a1a2e', border: `1px solid ${theme === 'dark' ? '#1e2840' : '#e8ecf4'}`, borderRadius: 12, padding: '14px 18px', display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'sans-serif' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: preview.status === 'healthy' ? '#34e8a5' : preview.status === 'warning' ? '#ff4466' : '#ffb340', boxShadow: `0 0 8px ${preview.status === 'healthy' ? '#34e8a5' : preview.status === 'warning' ? '#ff4466' : '#ffb340'}` }} />
            <div><div style={{ fontSize: 13, fontWeight: 700 }}>SOC Status: {preview.status.toUpperCase()}</div><div style={{ fontSize: 11, opacity: .6 }}>{preview.openIncidents} incidents · {preview.slaBreached} SLA breaches · {preview.noiseReduction?.timeSavedHours}h AI saved</div></div>
            <div style={{ marginLeft: 'auto', fontSize: 9, opacity: .4 }}>Watchtower</div>
          </div>
        </div>
      </>}

      <div className="em-step"><span className="em-num">{preview ? '4' : '3'}</span><div><strong>Copy embed code</strong><p style={{ fontSize: '.72rem', color: '#8896b8', marginTop: 2 }}>Paste into any HTML page, wiki, or intranet portal</p></div></div>
      <div style={{ position: 'relative' }}>
        <pre style={{ background: '#0f1219', border: '1px solid #1e2840', borderRadius: 10, padding: 16, fontSize: '.68rem', color: '#8896b8', overflow: 'auto', maxHeight: 200, fontFamily: 'JetBrains Mono,monospace', lineHeight: 1.6 }}>{embedCode}</pre>
        <button onClick={() => navigator.clipboard?.writeText(embedCode)} style={{ position: 'absolute', top: 8, right: 8, padding: '4px 12px', borderRadius: 6, background: '#5b9aff15', border: '1px solid #5b9aff30', color: '#5b9aff', fontSize: '.68rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>Copy</button>
      </div>
    </div>
  </div></>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#05070c;color:#eaf0ff;font-family:'DM Sans',sans-serif}
.em{max-width:700px;margin:0 auto;padding:20px}
.em-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px}
.em-logo{display:flex;align-items:center;gap:8px;font-weight:900;font-size:1.05rem}
.em-logo-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#5b9aff,#8b6fff);display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#fff;font-weight:900}
.em-back{color:#5b9aff;text-decoration:none;font-size:.78rem;font-weight:600}
.em-content{}
.em-step{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.em-num{width:24px;height:24px;border-radius:50%;background:#5b9aff15;color:#5b9aff;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:900;flex-shrink:0}
.em-step strong{font-size:.85rem}`;
