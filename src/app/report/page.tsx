'use client';
import React, { useState, useEffect } from 'react';
export default function Report() {
  const [data, setData] = useState<any>(null);
  const [branding, setBranding] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  useEffect(() => {
    fetch('/api/mssp/branding')
      .then(r => r.ok ? r.json() : {})
      .then((d: { branding?: Record<string, string> }) => setBranding(d.branding || {}))
      .catch(() => {});
    Promise.all([
      fetch('/api/unified-alerts').then(r => r.json()),
      fetch('/api/coverage').then(r => r.json()),
      fetch('/api/posture').then(r => r.json()),
    ]).then(([alerts, coverage, posture]) => {
      setData({ alerts, coverage, posture });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  return (
    <div style={{ minHeight:'100vh', background:'#090d18', color:'#e8ecf4',
      fontFamily:'Inter,sans-serif', padding:32 }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          marginBottom:32 }}>
          <div>
            <h1 style={{ fontSize:'1.8rem', fontWeight:900, letterSpacing:-1 }}>
              {branding.name || 'Watchtower'} — Security Report
            </h1>
            <p style={{ color:'#6b7a94', marginTop:4, fontSize:'0.88rem' }}>
              Period: {period}
            </p>
          </div>
          <select value={period} onChange={e => setPeriod(e.target.value)}
            style={{ padding:'8px 14px', borderRadius:8, border:'1px solid rgba(0,180,240,0.13)',
              background:'rgba(14,24,46,0.55)', color:'#e8ecf4', fontSize:'0.82rem',
              fontFamily:'Inter,sans-serif', cursor:'pointer', outline:'none' }}>
            {['7d','14d','30d','90d'].map(p => (
              <option key={p} value={p}>{p === '7d' ? '7 days' : p === '14d' ? '14 days' :
                p === '30d' ? '30 days' : '90 days'}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div style={{ textAlign:'center', padding:80, color:'#6b7a94' }}>
            Loading report…
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {[
              { label:'Alerts Processed', val: data?.alerts?.alerts?.length || 0, color:'#4f8fff' },
              { label:'Coverage', val: data?.coverage?.totalConnected || 0, color:'#22d49a' },
              { label:'Posture Score', val: data?.posture?.score || 'N/A', color:'#f0a030' },
            ].map(s => (
              <div key={s.label} style={{ padding:'20px', background:'rgba(14,24,46,0.55)',
                border:`1px solid ${s.color}18`, borderRadius:12 }}>
                <div style={{ fontSize:'2rem', fontWeight:900, color:s.color,
                  fontFamily:'JetBrains Mono,monospace', letterSpacing:-2 }}>{s.val}</div>
                <div style={{ fontSize:'0.7rem', color:'#6b7a94', marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
