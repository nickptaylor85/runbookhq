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
      var c=t==="dark"?"background:#0b0f18;color:#e6ecf8;border:1px solid #252e42":"background:#fff;color:#1a1a2e;border:1px solid #e8ecf4";
      var sc=d.status==="healthy"?"#22c992":d.status==="warning"?"#f0405e":"#ffb340";
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
    <div className="em-hd"><div className="em-logo"><div className="em-logo-icon">W</div>Watchtower <span style={{ color: '#8a9ab8', fontWeight: 500, fontSize: '.82rem', marginLeft: 4 }}>Embeddable Widget</span></div><a href="/dashboard" className="em-back">← Dashboard</a></div>

    <div className="em-content">
      <h1 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 8 }}>Status Widget</h1>
      <p style={{ fontSize: '.82rem', color: '#8a9ab8', marginBottom: 24 }}>Embed your SOC status on your intranet, wiki, or status page. Shows live incidents, SLA status, and AI savings.</p>

      <div className="em-step"><span className="em-num">1</span><div><strong>Enter your API key</strong><p style={{ fontSize: '.72rem', color: '#8a9ab8', marginTop: 2 }}>Generate one from Settings → API Keys</p></div></div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="wt_..." style={{ flex: 1, padding: '10px 14px', background: '#10141e', border: '1px solid #252e42', borderRadius: 10, color: '#e6ecf8', fontSize: '.82rem', fontFamily: 'JetBrains Mono,monospace', outline: 'none' }} />
        <button onClick={loadPreview} style={{ padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#3b8bff,#7c6aff)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>Preview</button>
      </div>

      <div className="em-step"><span className="em-num">2</span><div><strong>Choose theme</strong></div></div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTheme('dark')} style={{ padding: '8px 16px', borderRadius: 8, background: theme === 'dark' ? '#3b8bff15' : 'transparent', border: `1px solid ${theme === 'dark' ? '#3b8bff' : '#252e42'}`, color: theme === 'dark' ? '#3b8bff' : '#8a9ab8', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>🌙 Dark</button>
        <button onClick={() => setTheme('light')} style={{ padding: '8px 16px', borderRadius: 8, background: theme === 'light' ? '#3b8bff15' : 'transparent', border: `1px solid ${theme === 'light' ? '#3b8bff' : '#252e42'}`, color: theme === 'light' ? '#3b8bff' : '#8a9ab8', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>☀ Light</button>
      </div>

      {preview && <><div className="em-step"><span className="em-num">3</span><div><strong>Preview</strong></div></div>
        <div style={{ padding: 20, background: theme === 'dark' ? '#060910' : '#f8fafd', borderRadius: 12, marginBottom: 20, border: '1px solid #252e42' }}>
          <div style={{ background: theme === 'dark' ? '#0b0f18' : '#fff', color: theme === 'dark' ? '#e6ecf8' : '#1a1a2e', border: `1px solid ${theme === 'dark' ? '#252e42' : '#e8ecf4'}`, borderRadius: 12, padding: '14px 18px', display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'sans-serif' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: preview.status === 'healthy' ? '#22c992' : preview.status === 'warning' ? '#f0405e' : '#ffb340', boxShadow: `0 0 8px ${preview.status === 'healthy' ? '#22c992' : preview.status === 'warning' ? '#f0405e' : '#ffb340'}` }} />
            <div><div style={{ fontSize: 13, fontWeight: 700 }}>SOC Status: {preview.status.toUpperCase()}</div><div style={{ fontSize: 11, opacity: .6 }}>{preview.openIncidents} incidents · {preview.slaBreached} SLA breaches · {preview.noiseReduction?.timeSavedHours}h AI saved</div></div>
            <div style={{ marginLeft: 'auto', fontSize: 9, opacity: .4 }}>Watchtower</div>
          </div>
        </div>
      </>}

      <div className="em-step"><span className="em-num">{preview ? '4' : '3'}</span><div><strong>Copy embed code</strong><p style={{ fontSize: '.72rem', color: '#8a9ab8', marginTop: 2 }}>Paste into any HTML page, wiki, or intranet portal</p></div></div>
      <div style={{ position: 'relative' }}>
        <pre style={{ background: '#10141e', border: '1px solid #252e42', borderRadius: 10, padding: 16, fontSize: '.68rem', color: '#8a9ab8', overflow: 'auto', maxHeight: 200, fontFamily: 'JetBrains Mono,monospace', lineHeight: 1.6 }}>{embedCode}</pre>
        <button onClick={() => navigator.clipboard?.writeText(embedCode)} style={{ position: 'absolute', top: 8, right: 8, padding: '4px 12px', borderRadius: 6, background: '#3b8bff15', border: '1px solid #3b8bff30', color: '#3b8bff', fontSize: '.68rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>Copy</button>
      </div>
    </div>
  </div></>);
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#060910;color:#e6ecf8;font-family:'Outfit',sans-serif}
.em{max-width:700px;margin:0 auto;padding:20px}
.em-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px}
.em-logo{display:flex;align-items:center;gap:8px;font-weight:900;font-size:1.05rem}
.em-logo-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#3b8bff,#7c6aff);display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#fff;font-weight:900}
.em-back{color:#3b8bff;text-decoration:none;font-size:.78rem;font-weight:600}
.em-content{}
.em-step{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.em-num{width:24px;height:24px;border-radius:50%;background:#3b8bff15;color:#3b8bff;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:900;flex-shrink:0}
.em-step strong{font-size:.85rem}`;
