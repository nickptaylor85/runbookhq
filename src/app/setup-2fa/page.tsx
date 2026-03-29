'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const INPUT: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: '#070a14',
  border: '1px solid #263044', borderRadius: 8, color: '#e8ecf4',
  fontSize: '0.9rem', fontFamily: 'JetBrains Mono, monospace',
  outline: 'none', textAlign: 'center', letterSpacing: '0.3em',
  boxSizing: 'border-box',
};

export default function Setup2FAPage() {
  const router = useRouter();
  const [step, setStep] = useState<'loading' | 'intro' | 'scan' | 'verify' | 'done'>('loading');
  const [qrUrl, setQrUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is authenticated and actually needs 2FA setup
  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.replace('/login'); return; }
      if (!d.mfaSetupRequired) {
        // Clear stale cookie before redirecting
        document.cookie = 'wt_mfa_pending=; max-age=0; path=/';
        router.replace('/dashboard');
        return;
      }
      setStep('intro');
    }).catch(() => router.replace('/login'));
  }, [router]);

  async function startSetup() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup' }),
      });
      const d = await res.json();
      if (d.ok) { setQrUrl(d.qrUrl); setSecret(d.secret); setStep('scan'); }
      else setError(d.error || 'Failed to start setup');
    } catch { setError('Network error'); }
    setLoading(false);
  }

  async function verifyCode() {
    if (code.length !== 6) { setError('Enter the 6-digit code'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', code }),
      });
      const d = await res.json();
      if (d.ok) { setStep('done'); setTimeout(() => router.replace('/dashboard'), 2000); }
      else setError('Invalid code — check your authenticator app and try again');
    } catch { setError('Network error'); }
    setLoading(false);
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh', background: '#050508', color: '#e8ecf4',
    fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '24px',
  };
  const cardStyle: React.CSSProperties = {
    width: '100%', maxWidth: 440,
    background: '#0a0d14', border: '1px solid #1d2535', borderRadius: 16,
    padding: '36px 32px', textAlign: 'center',
  };

  if (step === 'loading') return (
    <div style={containerStyle}>
      <div style={{width:10,height:10,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',animation:'spin .8s linear infinite'}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (step === 'done') return (
    <div style={containerStyle}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={cardStyle}>
        <div style={{fontSize:'2.5rem',marginBottom:16}}>🛡</div>
        <h1 style={{fontSize:'1.3rem',fontWeight:900,marginBottom:8,letterSpacing:'-0.5px'}}>Two-factor authentication enabled</h1>
        <p style={{fontSize:'0.82rem',color:'#6b7a94',marginBottom:8,lineHeight:1.6}}>Your account is now protected. Redirecting to your dashboard…</p>
        <div style={{fontSize:'0.72rem',color:'#22d49a',fontWeight:600}}>✓ Setup complete</div>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      <div style={cardStyle}>

        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:28}}>
          <div style={{width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#4f8fff,#8b6fff)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'0.72rem',color:'#fff'}}>W</div>
          <span style={{fontWeight:800,fontSize:'1rem'}}>Watchtower</span>
        </div>

        {/* Progress dots */}
        <div style={{display:'flex',justifyContent:'center',gap:6,marginBottom:28}}>
          {['intro','scan','verify'].map((s,i)=>(
            <div key={s} style={{width:8,height:8,borderRadius:'50%',background:['intro','scan','verify'].indexOf(step)>=i?'#4f8fff':'#1d2535',transition:'background .3s'}} />
          ))}
        </div>

        {step === 'intro' && (
          <>
            <div style={{fontSize:'2rem',marginBottom:14}}>🔐</div>
            <h1 style={{fontSize:'1.3rem',fontWeight:900,marginBottom:10,letterSpacing:'-0.5px'}}>Secure your account</h1>
            <p style={{fontSize:'0.82rem',color:'#6b7a94',lineHeight:1.7,marginBottom:8}}>
              Watchtower handles sensitive security data. Two-factor authentication is required for all accounts.
            </p>
            <p style={{fontSize:'0.78rem',color:'#6b7a94',lineHeight:1.6,marginBottom:24}}>
              You'll need an authenticator app — <strong style={{color:'#e8ecf4'}}>Google Authenticator</strong>, <strong style={{color:'#e8ecf4'}}>Authy</strong>, or <strong style={{color:'#e8ecf4'}}>1Password</strong> all work.
            </p>
            <button onClick={startSetup} disabled={loading} style={{width:'100%',padding:'12px 0',borderRadius:9,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.9rem',fontWeight:700,cursor:loading?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {loading ? <span style={{width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',display:'block',animation:'spin .8s linear infinite'}} /> : null}
              {loading ? 'Setting up…' : 'Set up authenticator →'}
            </button>
            <div style={{marginTop:12,fontSize:'0.66rem',color:'#3a4050'}}>This takes less than 2 minutes</div>
          </>
        )}

        {step === 'scan' && (
          <>
            <h1 style={{fontSize:'1.1rem',fontWeight:900,marginBottom:6,letterSpacing:'-0.3px'}}>Scan this QR code</h1>
            <p style={{fontSize:'0.78rem',color:'#6b7a94',marginBottom:18,lineHeight:1.6}}>Open your authenticator app and scan the QR code below.</p>
            {qrUrl && (
              <div style={{padding:12,background:'#fff',borderRadius:10,display:'inline-block',marginBottom:18}}>
                <img src={qrUrl} alt="2FA QR code" style={{width:160,height:160,display:'block'}} />
              </div>
            )}
            <div style={{marginBottom:18}}>
              <div style={{fontSize:'0.62rem',color:'#6b7a94',marginBottom:6}}>Or enter this key manually:</div>
              <div style={{padding:'8px 12px',background:'#070a14',border:'1px solid #263044',borderRadius:8,fontFamily:'JetBrains Mono,monospace',fontSize:'0.76rem',color:'#4f8fff',letterSpacing:'0.15em',wordBreak:'break-all'}}>{secret}</div>
            </div>
            <button onClick={()=>setStep('verify')} style={{width:'100%',padding:'12px 0',borderRadius:9,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.9rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
              I've scanned it →
            </button>
            <div style={{marginTop:10,fontSize:'0.66rem',color:'#3a4050'}}>Keep this key safe — you'll need it to recover access</div>
          </>
        )}

        {step === 'verify' && (
          <>
            <div style={{fontSize:'1.8rem',marginBottom:10}}>✦</div>
            <h1 style={{fontSize:'1.1rem',fontWeight:900,marginBottom:6,letterSpacing:'-0.3px'}}>Enter the 6-digit code</h1>
            <p style={{fontSize:'0.78rem',color:'#6b7a94',marginBottom:20,lineHeight:1.6}}>Open your authenticator app and enter the code shown for Watchtower.</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000 000"
              value={code}
              onChange={e=>setCode(e.target.value.replace(/\D/g,''))}
              onKeyDown={e=>e.key==='Enter'&&verifyCode()}
              style={INPUT}
              autoFocus
            />
            {error && <div style={{marginTop:10,fontSize:'0.74rem',color:'#f0405e',fontWeight:600}}>{error}</div>}
            <button onClick={verifyCode} disabled={loading||code.length!==6} style={{width:'100%',marginTop:16,padding:'12px 0',borderRadius:9,border:'none',background:code.length===6?'#4f8fff':'#1d2535',color:code.length===6?'#fff':'#3a4050',fontSize:'0.9rem',fontWeight:700,cursor:code.length===6&&!loading?'pointer':'not-allowed',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'background .15s'}}>
              {loading ? <span style={{width:14,height:14,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',display:'block',animation:'spin .8s linear infinite'}} /> : null}
              {loading ? 'Verifying…' : 'Verify and activate 2FA'}
            </button>
            <button onClick={()=>setStep('scan')} style={{width:'100%',marginTop:8,padding:'8px 0',borderRadius:7,border:'1px solid #1d2535',background:'transparent',color:'#6b7a94',fontSize:'0.76rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>← Back to QR code</button>
          </>
        )}

      </div>
    </div>
  );
}
