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
        <span style={{fontSize: '0.84rem', color: '#6b7a94', fontWeight: 600}}>Security</span>
        <a href="/" style={{marginLeft: 'auto', padding: '6px 14px', background: 'transparent', border: '1px solid #1e2536', borderRadius: 7, color: '#6b7a94', fontSize: '0.76rem', fontWeight: 600, textDecoration: 'none'}}>← Back</a>
      </div>

      <div style={{maxWidth: 760, margin: '0 auto', padding: '48px 24px'}}>
        <h1 style={{fontSize: '2rem', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8}}>Security</h1>
        <p style={{fontSize: '0.9rem', color: '#6b7a94', marginBottom: 32}}>Our security posture and responsible disclosure</p>
        <div style={{height: 1, background: '#141820', marginBottom: 36}}/>

          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Platform Security</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>Watchtower is built with security as a first principle. All credentials are encrypted at rest with AES-256-GCM. Session tokens use HMAC-SHA256 signing via Web Crypto API. All connections use TLS 1.2+. Security headers are enforced on all responses (X-Frame-Options, X-Content-Type-Options, HSTS).</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Authentication</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>Passwords are hashed with bcrypt (12 rounds). Sessions are signed and verified server-side. TOTP/MFA is available for all accounts. SAML 2.0 SSO is supported for enterprise customers. Rate limiting is applied to all authentication endpoints.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Credential Handling</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>Tool credentials are encrypted with AES-256-GCM before storage. Secret keys are never returned to the browser after saving — only public fields (URLs, regions) are readable. Credentials are isolated per tenant.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>AI Security</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>AI API calls are made from our servers using your own Anthropic key. We do not log the content of AI prompts or responses. BYOK (bring your own key) ensures complete data isolation between tenants.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>SSRF & Injection Protection</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>All outbound tool API calls are validated against per-tool domain allowlists. Private IP ranges are blocked. All inputs are validated and sanitised before use.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Penetration Testing</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>Watchtower has undergone internal security testing achieving 0 Critical, 0 High, 0 Medium findings. We use the OWASP Top 10 as a baseline for ongoing security review.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Responsible Disclosure</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>If you discover a security vulnerability, please report it to security@runbookhq.com. We aim to respond within 48 hours and resolve critical issues within 7 days. Please do not publicly disclose vulnerabilities before we have had a chance to address them.</p>
          </div>
          <div style={{marginBottom: '28px'}}>
            <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: '10px', color: '#e8ecf4'}}>Contact</h2>
            <p style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>security@runbookhq.com</p>
          </div>
        <div style={{marginTop: 48, padding: '16px 20px', background: '#070a14', borderRadius: 10, border: '1px solid #141820', fontSize: '0.72rem', color: '#3a4050', textAlign: 'center'}}>
          Watchtower &middot; RunbookHQ Ltd &middot; 2026 &middot; <a href="/privacy" style={{color: '#4a5568', textDecoration: 'none'}}>Privacy</a> &middot; <a href="/terms" style={{color: '#4a5568', textDecoration: 'none'}}>Terms</a>
        </div>
      </div>
    </div>
  );
}
