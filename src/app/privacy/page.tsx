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
        <span style={{fontSize: '0.84rem', color: '#6b7a94', fontWeight: 600}}>Privacy Policy</span>
        <a href="/" style={{marginLeft: 'auto', padding: '6px 14px', background: 'transparent', border: '1px solid #1e2536', borderRadius: 7, color: '#6b7a94', fontSize: '0.76rem', fontWeight: 600, textDecoration: 'none'}}>← Back</a>
      </div>

      <div style={{maxWidth: 760, margin: '0 auto', padding: '48px 24px'}}>
        <h1 style={{fontSize: '2rem', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8}}>Privacy Policy</h1>
        <p style={{fontSize: '0.9rem', color: '#6b7a94', marginBottom: 32}}>How we handle your data</p>
        <div style={{height: 1, background: '#141820', marginBottom: 36}}/>

          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Data We Collect</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>We collect account information (email, hashed password), usage data (last login, settings preferences), security tool credentials (encrypted with AES-256-GCM at rest), and AI API keys (encrypted, never returned to the browser). We do not collect or store the contents of your security alerts beyond what is necessary to render the dashboard.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>How We Use Data</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>Account data is used solely to authenticate and personalise your experience. Credentials are used only to make API calls to your connected tools on your behalf. We do not sell, share, or use your data for advertising. AI API calls are made directly from our servers to Anthropic under your own API key — we do not log the content of those calls.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Data Storage & Security</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>All data is stored in encrypted Redis (Upstash) hosted in the US. Credentials are encrypted with AES-256-GCM before storage. Passwords are hashed with bcrypt. Session tokens are HMAC-signed. TLS is enforced on all connections.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Your Rights</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>You may delete your account and all associated data at any time via Settings → Account → Delete Account. For data requests or questions, contact us at privacy@runbookhq.com.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Cookies</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>We use a single session cookie (httpOnly, secure, sameSite=strict) for authentication. No tracking or advertising cookies are used.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Contact</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>RunbookHQ Ltd · privacy@runbookhq.com · Registered in England & Wales</p>
          </div>
        <div style={{marginTop: 48, padding: '16px 20px', background: '#070a14', borderRadius: 10, border: '1px solid #141820', fontSize: '0.72rem', color: '#3a4050', textAlign: 'center'}}>
          Watchtower &middot; RunbookHQ Ltd &middot; 2026 &middot; <a href="/privacy" style={{color: '#4a5568', textDecoration: 'none'}}>Privacy</a> &middot; <a href="/terms" style={{color: '#4a5568', textDecoration: 'none'}}>Terms</a>
        </div>
      </div>
    </div>
  );
}
