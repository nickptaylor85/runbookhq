'use client';
import React from 'react';

export default function Page() {
  return (
    <div style={{minHeight: '100vh', background: '#050508', color: '#e8ecf4', fontFamily: 'Inter,sans-serif'}}>
      <div style={{display: 'flex', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #141820', background: '#07090f', gap: 12}}>
        <a href="/" style={{display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit'}}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <rect width="26" height="26" rx="7" fill="url(#plg)"/>
            <path d="M13 4.5L20 8V14C20 18 17 21.5 13 23C9 21.5 6 18 6 14V8L13 4.5Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7"/>
            <path d="M10.5 13L12.5 15L16.5 11" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="plg" x1="0" y1="0" x2="26" y2="26" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
          </svg>
          <span style={{fontWeight: 800, fontSize: '0.9rem'}}>Watchtower</span>
        </a>
        <span style={{color: '#2a3448', margin: '0 4px'}}>›</span>
        <span style={{fontSize: '0.84rem', color: '#6b7a94', fontWeight: 600}}>Documentation</span>
        <a href="/" style={{marginLeft: 'auto', padding: '6px 14px', background: 'transparent', border: '1px solid #1e2536', borderRadius: 7, color: '#6b7a94', fontSize: '0.76rem', fontWeight: 600, textDecoration: 'none'}}>← Back</a>
      </div>

      <div style={{maxWidth: 760, margin: '0 auto', padding: '48px 24px'}}>
        <h1 style={{fontSize: '2rem', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8}}>Documentation</h1>
        <p style={{fontSize: '0.9rem', color: '#6b7a94', marginBottom: 32}}>Watchtower platform documentation</p>
        <div style={{height: 1, background: '#141820', marginBottom: 36}}/>

          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Quick Start</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>Log in at getwatchtower.io/login. Navigate to the Tools tab and connect your first security tool. Switch to Live mode using the toggle in the top bar. Alerts from your connected tools will begin appearing within 60 seconds.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Dashboard Overview</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>The dashboard has 7 tabs: Overview (SOC health summary), Alerts (AI-triaged alert feed), Coverage (estate visibility), Vulns (vulnerability intelligence), Intel (threat intel), Incidents (correlated cases), and Tools (integrations). A sidebar with icon shortcuts is on the left.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Connecting Tools</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>Go to the Tools tab, click the tool you want to connect, enter credentials, click "Test Connection", then "Save". Supported tools: CrowdStrike, Defender, SentinelOne, Carbon Black, Splunk, Sentinel, QRadar, Elastic, Darktrace, Taegis XDR, Tenable, Nessus, Qualys, Wiz, Zscaler, Okta, Proofpoint, Mimecast.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>AI Triage</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>Every alert is automatically triaged with a verdict (True Positive, False Positive, or Suspicious), a confidence score, an evidence chain, and recommended actions. In Live mode, expanding an alert triggers on-demand AI triage using your configured Anthropic key.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Automation Levels</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>Three levels: Recommend Only (AI advises, humans act), Auto + Notify (AI acts and notifies you), Full Auto (AI acts silently). Available from Team plan upwards. All automated actions are fully audited and support one-click revert.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>AI Configuration (BYOK)</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>Go to Settings to add your Anthropic API key. The key is encrypted immediately and never shown again. For MSSPs, each client tenant can have their own key configured via Admin to ensure complete data isolation.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>MSSP Portfolio</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>Visible to MSSP plan users. Shows all client tenants in one view with posture, alert counts, and revenue. Use the tenant switcher in the top bar to drill into any client context.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Support</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>support@runbookhq.com. Community plan: community support. Team/Business/MSSP: direct email support with 24h SLA.</p>
          </div>
        <div style={{marginTop: 48, padding: '16px 20px', background: '#070a14', borderRadius: 10, border: '1px solid #141820', fontSize: '0.72rem', color: '#3a4050', textAlign: 'center'}}>
          Watchtower &middot; RunbookHQ Ltd &middot; 2026 &middot; <a href="/privacy" style={{color: '#4a5568', textDecoration: 'none'}}>Privacy</a> &middot; <a href="/terms" style={{color: '#4a5568', textDecoration: 'none'}}>Terms</a>
        </div>
      </div>
    </div>
  );
}
