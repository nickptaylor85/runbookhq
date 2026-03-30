'use client';
import React, { useState, useEffect } from 'react';

const NAV_STYLE: React.CSSProperties = {
  minHeight: '100vh', background: '#090d18', color: '#e8ecf4',
  fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column',
};
const CARD: React.CSSProperties = {
  background: '#131929', border: '1px solid #263044', borderRadius: 12, padding: '20px 22px', marginBottom: 14,
};
const LABEL: React.CSSProperties = {
  display: 'block', fontSize: '0.72rem', color: '#6b7a94', fontWeight: 600, marginBottom: 6,
};
const INPUT: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: '#070a14', border: '1px solid #263044',
  borderRadius: 8, color: '#e8ecf4', fontSize: '0.84rem', fontFamily: 'Inter,sans-serif',
  outline: 'none', boxSizing: 'border-box',
};
const BTN: React.CSSProperties = {
  padding: '9px 20px', background: '#4f8fff', border: 'none', borderRadius: 8,
  color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
};

const INDUSTRIES = [
  'Financial Services', 'Healthcare', 'Retail & eCommerce', 'Manufacturing',
  'Energy & Utilities', 'Government & Public Sector', 'Technology & SaaS',
  'Legal & Professional Services', 'Education', 'Media & Entertainment',
];




function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ chars', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Symbol', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const color = score <= 1 ? '#f0405e' : score === 2 ? '#f97316' : score === 3 ? '#f0a030' : '#22d49a';
  const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';
  if (!password) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? color : '#1d2535', transition: 'background .2s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {checks.map(c => (
          <span key={c.label} style={{ fontSize: '0.6rem', color: c.ok ? '#22d49a' : '#3a4050', fontWeight: c.ok ? 700 : 400 }}>
            {c.ok ? '✓' : '○'} {c.label}
          </span>
        ))}
        <span style={{ fontSize: '0.6rem', color, fontWeight: 700, marginLeft: 'auto' }}>{label}</span>
      </div>
    </div>
  );
}

function ChangePasswordForm() {
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [status, setStatus] = React.useState<'idle'|'saving'|'ok'|'error'>('idle');
  const [msg, setMsg] = React.useState('');
  const INPUT_S: React.CSSProperties = { width: '100%', padding: '9px 12px', background: '#070a14', border: '1px solid #263044', borderRadius: 8, color: '#e8ecf4', fontSize: '0.84rem', fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' };

  async function submit() {
    if (!current || !next || !confirm) { setMsg('All fields required'); setStatus('error'); return; }
    if (next.length < 8) { setMsg('New password must be at least 8 characters'); setStatus('error'); return; }
    if (next !== confirm) { setMsg('New passwords do not match'); setStatus('error'); return; }
    setStatus('saving'); setMsg('');
    try {
      const r = await fetch('/api/settings/user', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: current, newPassword: next }) });
      const d = await r.json();
      if (d.ok) { setStatus('ok'); setMsg('Password updated'); setCurrent(''); setNext(''); setConfirm(''); setTimeout(() => setStatus('idle'), 3000); }
      else { setStatus('error'); setMsg(d.error || 'Update failed'); }
    } catch { setStatus('error'); setMsg('Network error'); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input type="password" placeholder="Current password" value={current} onChange={e => setCurrent(e.target.value)} style={INPUT_S} />
      <input type="password" placeholder="New password (min 8 chars)" value={next} onChange={e => setNext(e.target.value)} style={INPUT_S} />
      <PasswordStrength password={next} />
      <input type="password" placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} style={INPUT_S} />
      {msg && <div style={{ fontSize: '0.72rem', color: status === 'ok' ? '#22d49a' : '#f0405e', fontWeight: 600 }}>{status === 'ok' ? '✓ ' : ''}{msg}</div>}
      <button onClick={submit} disabled={status === 'saving'} style={{ alignSelf: 'flex-start', padding: '8px 18px', borderRadius: 8, border: 'none', background: '#4f8fff', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
        {status === 'saving' ? 'Updating…' : 'Update Password'}
      </button>
    </div>
  );
}

function DeleteAccountButton() {
  const [step, setStep] = React.useState<'idle'|'confirm'|'deleting'>('idle');
  const [typed, setTyped] = React.useState('');

  async function doDelete() {
    if (typed !== 'DELETE') return;
    setStep('deleting');
    try {
      await fetch('/api/settings/user', { method: 'DELETE' });
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/?deleted=1';
    } catch { setStep('confirm'); }
  }

  if (step === 'idle') return (
    <button onClick={() => setStep('confirm')} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #f0405e40', borderRadius: 8, color: '#f0405e', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
      Delete Account
    </button>
  );

  return (
    <div style={{ padding: '14px', background: '#f0405e08', border: '1px solid #f0405e30', borderRadius: 8, width: '100%', marginTop: 8 }}>
      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f0405e', marginBottom: 6 }}>Permanently delete your account?</div>
      <div style={{ fontSize: '0.7rem', color: '#6b7a94', marginBottom: 10, lineHeight: 1.6 }}>
        This will permanently erase your account, all alerts, incidents, and configuration. This action cannot be undone and complies with GDPR Art.17 right to erasure.
      </div>
      <div style={{ fontSize: '0.7rem', color: '#6b7a94', marginBottom: 8 }}>Type <strong style={{ color: '#e8ecf4' }}>DELETE</strong> to confirm:</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={typed} onChange={e => setTyped(e.target.value)} placeholder="DELETE" style={{ flex: 1, padding: '7px 10px', background: '#070a14', border: '1px solid #f0405e40', borderRadius: 7, color: '#e8ecf4', fontSize: '0.8rem', fontFamily: 'Inter,sans-serif', outline: 'none' }} />
        <button onClick={doDelete} disabled={typed !== 'DELETE' || step === 'deleting'} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: typed === 'DELETE' ? '#f0405e' : '#1d2535', color: '#fff', fontSize: '0.76rem', fontWeight: 700, cursor: typed === 'DELETE' ? 'pointer' : 'not-allowed', fontFamily: 'Inter,sans-serif' }}>
          {step === 'deleting' ? 'Deleting…' : 'Delete Forever'}
        </button>
        <button onClick={() => { setStep('idle'); setTyped(''); }} style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #1d2535', background: 'transparent', color: '#6b7a94', fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Cancel</button>
      </div>
    </div>
  );
}

function MfaSetup() {
  const [mfaStatus, setMfaStatus] = React.useState<{enabled:boolean}|null>(null);
  const [step, setStep] = React.useState<'idle'|'setup'|'verify'|'disable'>('idle');
  const [qrUrl, setQrUrl] = React.useState('');
  const [secret, setSecret] = React.useState('');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  React.useEffect(() => {
    fetch('/api/auth/totp').then(r => r.json()).then(d => setMfaStatus(d));
  }, []);

  async function startSetup() {
    setError('');
    try {
      const res = await fetch('/api/auth/totp', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'setup' }) });
      const d = await res.json();
      if (d.ok) { setQrUrl(d.qrUrl); setSecret(d.secret); setStep('setup'); }
      else setError(d.error || `Setup failed (${res.status}) — check your session and try again`);
    } catch(e: any) { setError('Network error: ' + e.message); }
  }

  async function verifyCode() {
    setError('');
    const res = await fetch('/api/auth/totp', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'verify', code }) });
    const d = await res.json();
    if (d.ok) { setMfaStatus({ enabled: true }); setStep('idle'); setSuccess('MFA enabled! Your account is now protected.'); setTimeout(() => setSuccess(''), 4000); }
    else setError(d.error || 'Invalid code');
  }

  async function disableMfa() {
    setError('');
    const res = await fetch('/api/auth/totp', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'disable', code }) });
    const d = await res.json();
    if (d.ok) { setMfaStatus({ enabled: false }); setStep('idle'); setCode(''); setSuccess('MFA disabled.'); setTimeout(() => setSuccess(''), 3000); }
    else setError(d.error || 'Invalid code');
  }

  if (!mfaStatus) return <div style={{ fontSize: '0.74rem', color: '#6b7a94' }}>Loading…</div>;

  return (
    <div>
      {success && <div role='status' aria-live='polite' style={{ padding: '8px 12px', background: '#22d49a12', border: '1px solid #22d49a30', borderRadius: 7, fontSize: '0.72rem', color: '#22d49a', marginBottom: 12 }}>{success}</div>}
      {mfaStatus.enabled && step === 'idle' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 5, background: '#22d49a12', color: '#22d49a', border: '1px solid #22d49a25' }}>✓ MFA Enabled</span>
          <button onClick={() => setStep('disable')} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #f0405e30', borderRadius: 7, color: '#f0405e', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Disable MFA</button>
        </div>
      )}
      {!mfaStatus.enabled && step === 'idle' && (
        <div>
          <button onClick={startSetup} style={BTN}>Enable MFA →</button>
          {error && <div style={{ marginTop: 8, fontSize: '0.7rem', color: '#f0405e', background: '#f0405e08', border: '1px solid #f0405e25', borderRadius: 6, padding: '6px 10px' }}>{error}</div>}
        </div>
      )}
      {step === 'setup' && (
        <div>
          <div style={{ fontSize: '0.76rem', color: '#e8ecf4', marginBottom: 12, lineHeight: 1.6 }}>
            1. Scan this QR code with your authenticator app<br/>
            2. Enter the 6-digit code to verify and activate
          </div>
          <img src={qrUrl} alt="MFA QR Code" width={180} height={180} style={{ borderRadius: 8, border: '1px solid #263044', display: 'block', marginBottom: 12 }} />
          <div style={{ fontSize: '0.62rem', color: '#6b7a94', marginBottom: 6 }}>Manual entry key:</div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.74rem', color: '#4f8fff', background: '#4f8fff12', padding: '6px 10px', borderRadius: 6, marginBottom: 16, letterSpacing: 2 }}>{secret}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Enter 6-digit code" maxLength={6}
              style={{ ...INPUT, width: 160, fontFamily: 'JetBrains Mono,monospace', fontSize: '1.1rem', letterSpacing: 4, textAlign: 'center' }} />
            <button onClick={verifyCode} style={BTN}>Verify & Enable</button>
            <button onClick={() => setStep('idle')} style={{ padding: '9px 16px', background: 'transparent', border: '1px solid #263044', borderRadius: 8, color: '#6b7a94', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Cancel</button>
          </div>
          {error && <div style={{ color: '#f0405e', fontSize: '0.72rem', marginTop: 8 }}>{error}</div>}
        </div>
      )}
      {step === 'disable' && (
        <div>
          <div style={{ fontSize: '0.76rem', color: '#e8ecf4', marginBottom: 12 }}>Enter your current MFA code to disable:</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code" maxLength={6}
              style={{ ...INPUT, width: 160, fontFamily: 'JetBrains Mono,monospace', fontSize: '1.1rem', letterSpacing: 4, textAlign: 'center' }} />
            <button onClick={disableMfa} style={{ ...BTN, background: '#f0405e' }}>Disable MFA</button>
            <button onClick={() => setStep('idle')} style={{ padding: '9px 16px', background: 'transparent', border: '1px solid #263044', borderRadius: 8, color: '#6b7a94', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Cancel</button>
          </div>
          {error && <div style={{ color: '#f0405e', fontSize: '0.72rem', marginTop: 8 }}>{error}</div>}
        </div>
      )}
    </div>
  );
}


function ApiKeyManager() {
  const [key, setKey] = React.useState('');
  const [status, setStatus] = React.useState<'idle'|'loading'|'saved'|'error'>('idle');
  const [hasKey, setHasKey] = React.useState<boolean|null>(null);
  const [msg, setMsg] = React.useState('');

  React.useEffect(() => {
    fetch('/api/settings/anthropic-key')
      .then(r => r.json())
      .then((d: { hasKey?: boolean }) => setHasKey(d.hasKey ?? false))
      .catch(() => setHasKey(false));
  }, []);

  async function saveKey() {
    if (!key.startsWith('sk-ant-')) {
      setMsg('Key must start with sk-ant-'); setStatus('error'); return;
    }
    setStatus('loading');
    const res = await fetch('/api/settings/anthropic-key', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    }).then(r => r.json()) as { ok?: boolean; message?: string };
    if (res.ok) { setHasKey(true); setKey(''); setStatus('saved'); setMsg('Key saved'); setTimeout(() => { setStatus('idle'); setMsg(''); }, 3000); }
    else { setStatus('error'); setMsg(res.message || 'Failed to save'); }
  }

  async function removeKey() {
    if (!confirm('Remove your Anthropic API key? AI features will be disabled.')) return;
    setStatus('loading');
    await fetch('/api/settings/anthropic-key', { method: 'DELETE' });
    setHasKey(false); setStatus('idle'); setMsg('');
  }

  return (
    <div>
      {hasKey ? (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#22d49a0a', border:'1px solid #22d49a25', borderRadius:9, marginBottom:12 }}>
          <span style={{ fontSize:'0.72rem', color:'#22d49a', fontWeight:700 }}>✓ API key configured</span>
          <span style={{ fontSize:'0.68rem', color:'#3a4050', fontFamily:'JetBrains Mono,monospace' }}>sk-ant-••••••••••••</span>
          <button onClick={removeKey} style={{ marginLeft:'auto', padding:'4px 10px', background:'none', border:'1px solid #f0405e30', borderRadius:6, color:'#f0405e', fontSize:'0.68rem', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Remove</button>
        </div>
      ) : (
        <div style={{ fontSize:'0.72rem', color:'#f0a030', marginBottom:10, padding:'8px 12px', background:'#f0a03008', border:'1px solid #f0a03020', borderRadius:8 }}>
          ⚠ No API key — AI features are disabled. Add your Anthropic key below.
        </div>
      )}
      <div style={{ display:'flex', gap:8 }}>
        <input
          type="password" value={key} onChange={e => setKey(e.target.value)}
          placeholder="sk-ant-api03-..."
          style={{ ...INPUT, flex:1 }}
          onKeyDown={e => e.key === 'Enter' && saveKey()}
        />
        <button onClick={saveKey} disabled={status === 'loading' || !key}
          style={{ ...BTN, opacity: (!key || status === 'loading') ? 0.5 : 1, cursor: (!key || status === 'loading') ? 'not-allowed' : 'pointer', whiteSpace:'nowrap' }}>
          {status === 'loading' ? 'Saving…' : 'Save Key'}
        </button>
      </div>
      {msg && <div style={{ fontSize:'0.68rem', marginTop:6, color: status === 'error' ? '#f0405e' : '#22d49a' }}>{msg}</div>}
      <p style={{ fontSize:'0.66rem', color:'#3a4050', marginTop:8, lineHeight:1.5 }}>
        Get your key at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color:'#4f8fff' }}>console.anthropic.com</a>. Your key is never returned to the browser after saving.
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general'|'account'|'team'|'notifications'|'api-keys'>('general');
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<string|null>(null);
  const [keyLoading, setKeyLoading] = useState(false);

  function loadKeys() {
    fetch('/api/auth/api-keys').then(r => r.json()).then(d => { if (d.keys) setApiKeys(d.keys); }).catch(() => {});
  }
  useEffect(() => { if (activeTab === 'api-keys') loadKeys(); }, [activeTab]);

  useEffect(() => {
    fetch('/api/settings/user')
      .then(r => r.json())
      .then((d: { settings?: Record<string, string> }) => {
        if (d.settings) setSettings(d.settings);
      })
      .catch(() => {});
  }, []);

  async function saveSettings(updates: Record<string, string>) {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/settings/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      setSettings(prev => ({ ...prev, ...updates }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'account', label: 'Account' },
    { id: 'team', label: 'Team' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'api-keys', label: 'API Keys' },
  ] as const;

  return (
    <div style={NAV_STYLE}>
      {/* Top nav */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #1d2535', background: '#0c1122', gap: 12 }}>
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
            <rect width="28" height="28" rx="7" fill="url(#sg)"/>
            <path d="M14 5.5L22 9V15.5C22 19.5 18.5 23 14 24.5C9.5 23 6 19.5 6 15.5V9L14 5.5Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7"/>
            <path d="M11.5 14.5L13.5 16.5L17.5 12" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="sg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
          </svg>
          <span style={{ fontWeight: 800, fontSize: '0.96rem' }}>Watchtower</span>
        </a>
        <span style={{ color: '#3a4050', margin: '0 4px' }}>/</span>
        <span style={{ fontSize: '0.86rem', color: '#6b7a94', fontWeight: 600 }}>Settings</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {saved && <span style={{ fontSize: '0.72rem', color: '#22d49a', fontWeight: 600, padding: '5px 10px', background: '#22d49a10', borderRadius: 6, border: '1px solid #22d49a30' }}>✓ Saved</span>}
          <a href="/dashboard" style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #263044', borderRadius: 8, color: '#6b7a94', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>← Dashboard</a>
          <a href="/changelog" style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #263044', borderRadius: 8, color: '#6b7a94', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>📝 Changelog</a>
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 780, width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: -0.5, marginBottom: 24 }}>Settings</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: '#131929', borderRadius: 10, padding: 4, border: '1px solid #263044', width: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: '7px 18px', borderRadius: 7, border: 'none', fontFamily: 'Inter,sans-serif',
                background: activeTab === t.id ? '#4f8fff' : 'transparent',
                color: activeTab === t.id ? '#fff' : '#6b7a94',
                fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all .15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* General tab */}
        {activeTab === 'general' && (
          <div>
            <div style={CARD}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 16, color: '#e8ecf4' }}>Display Preferences</div>

              <div style={{ marginBottom: 16 }}>
                <label style={LABEL}>Theme</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['dark', 'light'].map(t => (
                    <button key={t} onClick={() => saveSettings({ theme: t })}
                      style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${settings.theme === t || (!settings.theme && t === 'dark') ? '#4f8fff' : '#263044'}`,
                        background: settings.theme === t || (!settings.theme && t === 'dark') ? '#4f8fff15' : 'transparent',
                        color: settings.theme === t || (!settings.theme && t === 'dark') ? '#4f8fff' : '#6b7a94',
                        fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                        textTransform: 'capitalize' }}>
                      {t === 'dark' ? '🌙' : '☀️'} {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={LABEL}>Industry / Sector</label>
                <select value={settings.industry || ''} onChange={e => saveSettings({ industry: e.target.value })}
                  style={{ ...INPUT, cursor: 'pointer' }}>
                  <option value="">Select your industry…</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <p style={{ fontSize: '0.68rem', color: '#4a5568', marginTop: 6 }}>
                  Used to personalise threat intelligence feeds for your sector.
                </p>
              </div>
            </div>

            <div style={CARD}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 16, color: '#e8ecf4' }}>Dashboard Defaults</div>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL}>Default Mode</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['true', '● DEMO', '#f0a030'], ['false', '● LIVE', '#22d49a']].map(([val, label, col]) => (
                    <button key={val} onClick={() => saveSettings({ demoMode: val })}
                      style={{ padding: '8px 20px', borderRadius: 8,
                        border: `1px solid ${settings.demoMode === val || (!settings.demoMode && val === 'true') ? col + '50' : '#263044'}`,
                        background: settings.demoMode === val || (!settings.demoMode && val === 'true') ? col + '15' : 'transparent',
                        color: settings.demoMode === val || (!settings.demoMode && val === 'true') ? col : '#6b7a94',
                        fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={LABEL}>Automation Level</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['0', 'Recommend Only', '#6b7a94'], ['1', 'Auto + Notify', '#f0a030'], ['2', 'Full Auto', '#22d49a']].map(([val, label, col]) => (
                    <button key={val} onClick={() => saveSettings({ automation: val })}
                      style={{ padding: '8px 14px', borderRadius: 8,
                        border: `1px solid ${settings.automation === val ? col + '50' : '#263044'}`,
                        background: settings.automation === val ? col + '15' : 'transparent',
                        color: settings.automation === val ? col : '#6b7a94',
                        fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={CARD}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8, color: '#e8ecf4' }}>AI Configuration</div>
              <p style={{ fontSize: '0.74rem', color: '#6b7a94', marginBottom: 16, lineHeight: 1.6 }}>
                Your Anthropic API key powers AI triage, the Co-Pilot, and all remediation query generation. Encrypted at rest with AES-256-GCM.
              </p>
              <ApiKeyManager />
            </div>
          </div>
        )}

        {/* Account tab */}
        {activeTab === 'account' && (
          <div>
            <div style={CARD}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 16, color: '#e8ecf4' }}>Plan & Billing</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#070a14', borderRadius: 9, border: '1px solid #263044', marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: '#8b6fff15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🛡</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                    {settings.userTier === 'team' ? 'Essentials' : settings.userTier === 'business' ? 'Professional' : settings.userTier === 'mssp' ? 'Enterprise' : 'Community'} Plan
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#6b7a94', marginTop: 2 }}>
                    {settings.userTier === 'team' ? '£149/seat/mo' : settings.userTier === 'business' ? '£1,199/mo' : settings.userTier === 'mssp' ? '£3,499/mo' : 'Free forever'}
                  </div>
                </div>
                <a href="/pricing" style={{ marginLeft: 'auto', padding: '7px 16px', background: '#4f8fff', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: '0.76rem', textDecoration: 'none' }}>
                  {settings.userTier && settings.userTier !== 'community' ? 'Manage' : 'Upgrade →'}
                </a>
              </div>
            </div>

            <div style={CARD}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 4, color: '#e8ecf4' }}>Two-Factor Authentication (TOTP)</div>
              <div style={{ fontSize: '0.72rem', color: '#6b7a94', marginBottom: 16, lineHeight: 1.6 }}>
                Protect your account with an authenticator app (Google Authenticator, Authy, 1Password etc.)
              </div>
              <MfaSetup />
            </div>
            <div style={CARD}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8, color: '#e8ecf4' }}>Change Password</div>
              <div style={{ fontSize: '0.74rem', color: '#6b7a94', marginBottom: 14 }}>Update your login password. You'll remain signed in on this device.</div>
              <ChangePasswordForm />
            </div>

            <div style={{ padding: '14px 18px', background: '#f0405e08', border: '1px solid #f0405e20', borderRadius: 10 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f0405e', marginBottom: 4 }}>Danger Zone</div>
              <div style={{ fontSize: '0.72rem', color: '#6b7a94', marginBottom: 12 }}>These actions are irreversible. Please be certain.</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #f0405e40', borderRadius: 8, color: '#f0405e', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
                  onClick={() => confirm('Sign out of this session?') && fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.href = '/login')}>
                  Sign Out
                </button>
                <DeleteAccountButton />
              </div>
            </div>
          </div>
        )}

        {/* Notifications tab */}
        {activeTab === 'notifications' && (
          <div style={CARD}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 16, color: '#e8ecf4' }}>Notification Preferences</div>
            <p style={{ fontSize: '0.74rem', color: '#6b7a94', marginBottom: 18, lineHeight: 1.6 }}>
              Configure Slack, email, and PagerDuty alerts for critical incidents and high-severity findings.
            </p>
            {[
              { label: 'Critical alerts', key: 'notify_critical', default: 'true' },
              { label: 'New incidents', key: 'notify_incidents', default: 'true' },
              { label: 'Weekly digest', key: 'notify_digest', default: 'false' },
              { label: 'Sync errors', key: 'notify_sync_errors', default: 'true' },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1d2535' }}>
                <span style={{ fontSize: '0.8rem' }}>{item.label}</span>
                <button onClick={() => saveSettings({ [item.key]: settings[item.key] === 'false' ? 'true' : 'false' })}
                  style={{ width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                    background: (settings[item.key] ?? item.default) === 'true' ? '#22d49a' : '#263044',
                    position: 'relative', transition: 'background .2s' }}>
                  <span style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left .2s', left: (settings[item.key] ?? item.default) === 'true' ? 21 : 3 }} />
                </button>
              </div>
            ))}
            <div style={{ marginTop: 18 }}>
              <label style={LABEL}>Slack Webhook URL</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="url" value={settings.slack_webhook || ''} placeholder="https://hooks.slack.com/services/..."
                  onChange={e => setSettings(prev => ({ ...prev, slack_webhook: e.target.value }))}
                  style={{ ...INPUT, flex: 1 }} />
                <button onClick={() => saveSettings({ slack_webhook: settings.slack_webhook || '' })} disabled={saving}
                  style={{ ...BTN, flexShrink: 0 }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}


      {activeTab === 'team' && (
        <div>
          <h2 style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: 4 }}>Team Members</h2>
          <p style={{ fontSize: '0.78rem', color: '#6b7a94', marginBottom: 20, lineHeight: 1.6 }}>Invite analysts and set their roles. Essentials requires minimum 2 seats.</p>
          {/* Invite form */}
          <div style={{ background: '#0a0d18', border: '1px solid #1d2535', borderRadius: 10, padding: '16px', marginBottom: 20 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4f8fff', marginBottom: 12 }}>Invite a team member</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input placeholder="colleague@company.com" style={{ flex: 1, minWidth: 180, padding: '9px 12px', background: '#070a14', border: '1px solid #263044', borderRadius: 8, color: '#e8ecf4', fontSize: '0.84rem', fontFamily: 'Inter,sans-serif', outline: 'none' }} />
              <select style={{ padding: '9px 12px', background: '#070a14', border: '1px solid #263044', borderRadius: 8, color: '#e8ecf4', fontSize: '0.84rem', fontFamily: 'Inter,sans-serif', cursor: 'pointer' }}>
                <option value="analyst">Analyst</option>
                <option value="tech_admin">Tech Admin</option>
                <option value="viewer">Viewer (read-only)</option>
                <option value="sales">Sales</option>
              </select>
              <button onClick={async () => {
                const emailEl = document.querySelector('input[placeholder="colleague@company.com"]') as HTMLInputElement;
                if (!emailEl?.value) return;
                const r = await fetch('/api/auth/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailEl.value, role: 'analyst' }) });
                const d = await r.json();
                if (d.ok) { emailEl.value = ''; alert('Invite sent to ' + emailEl.value); }
                else alert(d.error || 'Failed to send invite');
              }} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#4f8fff', color: '#fff', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', flexShrink: 0 }}>
                Send Invite
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: '0.66rem', color: '#3a4050' }}>
              Analyst — full triage access · Tech Admin — tool configuration · Viewer — read-only · Sales — GTM dashboard only
            </div>
          </div>
          {/* Role guide */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {[
              { role: 'Owner', color: '#8b6fff', desc: 'Full access, billing, team management' },
              { role: 'Tech Admin', color: '#4f8fff', desc: 'Tool configuration, BYOK keys, no billing' },
              { role: 'Analyst', color: '#22d49a', desc: 'Alert triage, incidents, co-pilot' },
              { role: 'Viewer', color: '#6b7a94', desc: 'Read-only — alerts, coverage, vulns' },
            ].map(r => (
              <div key={r.role} style={{ padding: '10px 14px', background: '#0a0d18', border: `1px solid ${r.color}20`, borderRadius: 8 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: r.color, marginBottom: 3 }}>{r.role}</div>
                <div style={{ fontSize: '0.66rem', color: '#6b7a94' }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'api-keys' && (
        <div>
          <h2 style={{ fontSize: '0.96rem', fontWeight: 700, marginBottom: 4 }}>API Keys</h2>
          <p style={{ fontSize: '0.78rem', color: '#6b7a94', marginBottom: 20, lineHeight: 1.6 }}>Generate keys to access Watchtower data programmatically. A key is shown only once — copy it immediately.</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key name (e.g. SIEM Integration)" style={{ flex: 1, padding: '9px 12px', background: '#070a14', border: '1px solid #263044', borderRadius: 8, color: '#e8ecf4', fontSize: '0.84rem', fontFamily: 'Inter, sans-serif', outline: 'none' }} />
            <button disabled={!newKeyName.trim() || keyLoading} onClick={async () => {
              setKeyLoading(true);
              try {
                const r = await fetch('/api/auth/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newKeyName.trim(), scopes: ['read:alerts', 'read:incidents', 'read:vulns'] }) });
                const d = await r.json();
                if (d.ok) { setNewKey(d.key); setNewKeyName(''); loadKeys(); }
              } catch {}
              setKeyLoading(false);
            }} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: newKeyName.trim() ? '#4f8fff' : '#1d2535', color: newKeyName.trim() ? '#fff' : '#3a4050', fontSize: '0.84rem', fontWeight: 700, cursor: newKeyName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif' }}>
              {keyLoading ? 'Creating…' : '+ Create Key'}
            </button>
          </div>
          {newKey && (
            <div style={{ background: '#06100e', border: '1px solid #22d49a30', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#22d49a', marginBottom: 6 }}>✓ Key created — copy it now, it won't be shown again</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <code style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#22d49a', wordBreak: 'break-all' }}>{newKey}</code>
                <button onClick={() => { navigator.clipboard.writeText(newKey); }} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #22d49a30', background: 'transparent', color: '#22d49a', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>Copy</button>
                <button onClick={() => setNewKey(null)} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid #1d2535', background: 'transparent', color: '#6b7a94', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>✕</button>
              </div>
            </div>
          )}
          {apiKeys.length === 0 ? (
            <div style={{ fontSize: '0.78rem', color: '#3a4050', textAlign: 'center', padding: '24px 0' }}>No API keys yet</div>
          ) : apiKeys.map((k: any) => (
            <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#0a0d18', border: '1px solid #1d2535', borderRadius: 8, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{k.name}</div>
                <div style={{ fontSize: '0.68rem', color: '#6b7a94', fontFamily: 'JetBrains Mono, monospace' }}>{k.prefix}… · {k.scopes?.join(', ')}</div>
              </div>
              <div style={{ fontSize: '0.64rem', color: '#3a4050' }}>Created {new Date(k.createdAt).toLocaleDateString('en-GB')}</div>
              <button onClick={async () => { await fetch('/api/auth/api-keys', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: k.id }) }); loadKeys(); }} style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid #f0405e25', background: 'transparent', color: '#f0405e', cursor: 'pointer', fontSize: '0.68rem', fontFamily: 'Inter, sans-serif' }}>Revoke</button>
            </div>
          ))}
        </div>
      )}      </div>
    </div>
  );
}
