'use client';
import React, { useState, useEffect } from 'react';

const NAV_STYLE: React.CSSProperties = {
  minHeight: '100vh', background: '#050508', color: '#e8ecf4',
  fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column',
};
const CARD: React.CSSProperties = {
  background: '#0a0d14', border: '1px solid #1e2536', borderRadius: 12, padding: '20px 22px', marginBottom: 14,
};
const LABEL: React.CSSProperties = {
  display: 'block', fontSize: '0.72rem', color: '#6b7a94', fontWeight: 600, marginBottom: 6,
};
const INPUT: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: '#070a14', border: '1px solid #1e2536',
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
    const res = await fetch('/api/auth/totp', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'setup' }) });
    const d = await res.json();
    if (d.ok) { setQrUrl(d.qrUrl); setSecret(d.secret); setStep('setup'); }
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
      {success && <div style={{ padding: '8px 12px', background: '#22d49a12', border: '1px solid #22d49a30', borderRadius: 7, fontSize: '0.72rem', color: '#22d49a', marginBottom: 12 }}>{success}</div>}
      {mfaStatus.enabled && step === 'idle' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 5, background: '#22d49a12', color: '#22d49a', border: '1px solid #22d49a25' }}>✓ MFA Enabled</span>
          <button onClick={() => setStep('disable')} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid #f0405e30', borderRadius: 7, color: '#f0405e', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Disable MFA</button>
        </div>
      )}
      {!mfaStatus.enabled && step === 'idle' && (
        <button onClick={startSetup} style={BTN}>Enable MFA →</button>
      )}
      {step === 'setup' && (
        <div>
          <div style={{ fontSize: '0.76rem', color: '#e8ecf4', marginBottom: 12, lineHeight: 1.6 }}>
            1. Scan this QR code with your authenticator app<br/>
            2. Enter the 6-digit code to verify and activate
          </div>
          <img src={qrUrl} alt="MFA QR Code" width={180} height={180} style={{ borderRadius: 8, border: '1px solid #1e2536', display: 'block', marginBottom: 12 }} />
          <div style={{ fontSize: '0.62rem', color: '#6b7a94', marginBottom: 6 }}>Manual entry key:</div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '0.74rem', color: '#4f8fff', background: '#4f8fff12', padding: '6px 10px', borderRadius: 6, marginBottom: 16, letterSpacing: 2 }}>{secret}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Enter 6-digit code" maxLength={6}
              style={{ ...INPUT, width: 160, fontFamily: 'JetBrains Mono,monospace', fontSize: '1.1rem', letterSpacing: 4, textAlign: 'center' }} />
            <button onClick={verifyCode} style={BTN}>Verify & Enable</button>
            <button onClick={() => setStep('idle')} style={{ padding: '9px 16px', background: 'transparent', border: '1px solid #1e2536', borderRadius: 8, color: '#6b7a94', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Cancel</button>
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
            <button onClick={() => setStep('idle')} style={{ padding: '9px 16px', background: 'transparent', border: '1px solid #1e2536', borderRadius: 8, color: '#6b7a94', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Cancel</button>
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
  const [activeTab, setActiveTab] = useState<'general'|'account'|'notifications'>('general');

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
    { id: 'notifications', label: 'Notifications' },
  ] as const;

  return (
    <div style={NAV_STYLE}>
      {/* Top nav */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #141820', background: '#07090f', gap: 12 }}>
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
          <a href="/dashboard" style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #1e2536', borderRadius: 8, color: '#6b7a94', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>← Dashboard</a>
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 780, width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: -0.5, marginBottom: 24 }}>Settings</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: '#0a0d14', borderRadius: 10, padding: 4, border: '1px solid #1e2536', width: 'fit-content' }}>
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
                      style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${settings.theme === t || (!settings.theme && t === 'dark') ? '#4f8fff' : '#1e2536'}`,
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
                        border: `1px solid ${settings.demoMode === val || (!settings.demoMode && val === 'true') ? col + '50' : '#1e2536'}`,
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
                        border: `1px solid ${settings.automation === val ? col + '50' : '#1e2536'}`,
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#070a14', borderRadius: 9, border: '1px solid #1e2536', marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: '#8b6fff15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🛡</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', textTransform: 'capitalize' }}>
                    {settings.userTier || 'Community'} Plan
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#6b7a94', marginTop: 2 }}>
                    {settings.userTier === 'team' ? '£49/seat/mo' : settings.userTier === 'business' ? '£199/mo' : settings.userTier === 'mssp' ? '£799/mo' : 'Free forever'}
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
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8, color: '#e8ecf4' }}>Password</div>
              <div style={{ fontSize: '0.74rem', color: '#6b7a94', marginBottom: 14 }}>
                Change your login password.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href="/login" style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #1e2536', borderRadius: 8, color: '#6b7a94', fontSize: '0.76rem', fontWeight: 600, textDecoration: 'none' }}>
                  Change Password
                </a>
              </div>
            </div>

            <div style={{ padding: '14px 18px', background: '#f0405e08', border: '1px solid #f0405e20', borderRadius: 10 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f0405e', marginBottom: 4 }}>Danger Zone</div>
              <div style={{ fontSize: '0.72rem', color: '#6b7a94', marginBottom: 12 }}>These actions are irreversible. Please be certain.</div>
              <button style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #f0405e40', borderRadius: 8, color: '#f0405e', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
                onClick={() => confirm('Are you sure? This cannot be undone.') && fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.href = '/login')}>
                Sign Out
              </button>
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
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #141820' }}>
                <span style={{ fontSize: '0.8rem' }}>{item.label}</span>
                <button onClick={() => saveSettings({ [item.key]: settings[item.key] === 'false' ? 'true' : 'false' })}
                  style={{ width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                    background: (settings[item.key] ?? item.default) === 'true' ? '#22d49a' : '#1e2536',
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
      </div>
    </div>
  );
}
