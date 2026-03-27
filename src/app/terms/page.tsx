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
        <span style={{fontSize: '0.84rem', color: '#6b7a94', fontWeight: 600}}>Terms of Service</span>
        <a href="/" style={{marginLeft: 'auto', padding: '6px 14px', background: 'transparent', border: '1px solid #1e2536', borderRadius: 7, color: '#6b7a94', fontSize: '0.76rem', fontWeight: 600, textDecoration: 'none'}}>← Back</a>
      </div>

      <div style={{maxWidth: 760, margin: '0 auto', padding: '48px 24px'}}>
        <h1 style={{fontSize: '2rem', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8}}>Terms of Service</h1>
        <p style={{fontSize: '0.9rem', color: '#6b7a94', marginBottom: 32}}>Our terms of use</p>
        <div style={{height: 1, background: '#141820', marginBottom: 36}}/>

          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Acceptance</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>By accessing or using Watchtower, you agree to these terms. If you do not agree, do not use the service.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Service Description</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>Watchtower is a security operations dashboard that aggregates alerts from connected tools, provides AI-powered triage, and enables automated response. The service is provided "as is" for security operations purposes.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Account Responsibility</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>You are responsible for maintaining the security of your account credentials and API keys. You must not share accounts or use the service for unlawful purposes. You are responsible for all activity under your account.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Data & Credentials</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>You retain ownership of all data you connect to Watchtower. We act as a data processor on your behalf. You are responsible for having the right to connect the tools and data sources you configure.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Acceptable Use</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>The service may not be used to harm systems you do not have authorisation to access. AI features must not be used to generate content that violates applicable law. Automated responses must only target systems you own or are authorised to manage.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Liability Limitation</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>RunbookHQ Ltd is not liable for security incidents, data loss, or business disruption arising from use of the service. The service does not constitute professional security advice.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Termination</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>We may suspend or terminate accounts that violate these terms. You may cancel your account at any time via Settings.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Contact</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>RunbookHQ Ltd · legal@runbookhq.com</p>
          </div>
        <div style={{marginTop: 48, padding: '16px 20px', background: '#070a14', borderRadius: 10, border: '1px solid #141820', fontSize: '0.72rem', color: '#3a4050', textAlign: 'center'}}>
          Watchtower &middot; RunbookHQ Ltd &middot; 2026 &middot; <a href="/privacy" style={{color: '#4a5568', textDecoration: 'none'}}>Privacy</a> &middot; <a href="/terms" style={{color: '#4a5568', textDecoration: 'none'}}>Terms</a>
        </div>
      </div>
    </div>
  );
}
