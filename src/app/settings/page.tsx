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
              <p style={{ fontSize: '0.74rem', color: '#6b7a94', marginBottom: 14, lineHeight: 1.6 }}>
                Manage your Anthropic API key for AI triage, Co-Pilot, and remediation queries. Your key is encrypted at rest.
              </p>
              <a href="/dashboard" onClick={e => { e.preventDefault(); sessionStorage.setItem('wt_open_tab', 'tools'); window.location.href = '/dashboard'; }}
                style={{ ...BTN, textDecoration: 'none', display: 'inline-block' }}>
                Manage API Key → Tools Tab
              </a>
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
              <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 16, color: '#e8ecf4' }}>Security</div>
              <div style={{ fontSize: '0.74rem', color: '#6b7a94', marginBottom: 14 }}>
                Change your password or manage two-factor authentication.
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
