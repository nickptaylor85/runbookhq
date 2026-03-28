'use client';
import React from 'react';

const SECTION = ({title, children}: {title: string; children: React.ReactNode}) => (
  <div style={{marginBottom: 28}}>
    <h2 style={{fontSize: '1rem', fontWeight: 800, marginBottom: 10, color: '#e8ecf4'}}>{title}</h2>
    <div style={{fontSize: '0.87rem', color: '#8a9ab0', lineHeight: '1.8'}}>{children}</div>
  </div>
);

export default function Page() {
  return (
    <div style={{minHeight: '100vh', background: '#090d18', color: '#e8ecf4', fontFamily: 'Inter,sans-serif'}}>
      <div style={{display: 'flex', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #1d2535', background: '#0c1122', gap: 12}}>
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
        <a href="/" style={{marginLeft: 'auto', padding: '6px 14px', background: 'transparent', border: '1px solid #1d2535', borderRadius: 7, color: '#6b7a94', fontSize: '0.76rem', fontWeight: 600, textDecoration: 'none'}}>← Back</a>
      </div>

      <div style={{maxWidth: 760, margin: '0 auto', padding: '48px 24px'}}>
        <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16}}>
          <div>
            <h1 style={{fontSize: '2rem', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 8}}>Security</h1>
            <p style={{fontSize: '0.9rem', color: '#6b7a94'}}>Our security posture and responsible disclosure</p>
          </div>
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            {[['AES-256', '#4f8fff'], ['HMAC-SHA256', '#22d49a'], ['TLS 1.3', '#8b6fff'], ['OWASP Top 10', '#f0a030']].map(([label, color]) => (
              <span key={label} style={{padding: '4px 10px', borderRadius: 6, background: `${color}12`, border: `1px solid ${color}30`, color, fontSize: '0.62rem', fontWeight: 700}}>{label}</span>
            ))}
          </div>
        </div>
        <div style={{height: 1, background: '#1d2535', marginBottom: 36}}/>

        <SECTION title="Platform Security">
          Watchtower is built with security as a first principle. All credentials are encrypted at rest with AES-256-GCM. Session tokens use HMAC-SHA256 signing. All connections use TLS 1.3. Security headers are enforced on all responses (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, HSTS, Permissions-Policy).
        </SECTION>

        <SECTION title="Authentication & Access Control">
          Passwords are hashed with bcrypt (12 rounds). Sessions are signed and verified server-side with a 24-hour TTL. TOTP/MFA is available for all accounts. SAML 2.0 SSO is supported for enterprise customers. Role-based access control (RBAC) with four roles: Owner, Tech Admin, Sales, Viewer. Rate limiting is applied to all authentication endpoints via Upstash Redis.
        </SECTION>

        <SECTION title="Credential Handling">
          Tool credentials (API keys, client secrets, tokens) are encrypted with AES-256-GCM before storage in Redis. The encryption key is set via environment variable and never appears in code or logs. Secret keys are never returned to the browser after saving — only non-sensitive fields (URLs, regions) are readable. Credentials are isolated per tenant with no cross-tenant access.
        </SECTION>

        <SECTION title="Data Privacy & GDPR">
          Watchtower is operated by RunbookHQ Ltd (UK company). We process security telemetry data on your behalf as a data processor. Your data is stored in EU-region infrastructure (Upstash Redis, EU endpoints available on request). We do not sell, share, or use your security data for any purpose other than operating the service. We support data subject access requests and right-to-erasure requests — contact privacy@runbookhq.com. Our full data processing addendum (DPA) is available on request for Business and MSSP customers.
        </SECTION>

        <SECTION title="Data Residency">
          Default data storage is in Upstash Redis US East region. EU data residency is available for Business and MSSP plans using Upstash EU-West endpoints — contact us to configure this before account setup. AI API calls (Anthropic) are processed via your own BYOK key and subject to Anthropic&apos;s data processing terms. We do not retain the content of AI prompts or responses.
        </SECTION>

        <SECTION title="AI Security (BYOK)">
          AI API calls are made from our servers using your own Anthropic API key. We do not log the content of AI prompts or responses beyond standard request metadata. BYOK (bring your own key) ensures complete AI context isolation between tenants — no shared models, no shared context windows, no cross-tenant data leakage.
        </SECTION>

        <SECTION title="SSRF & Injection Protection">
          All outbound tool API calls are validated against per-tool domain allowlists before execution. Private IP ranges (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x) are blocked. All inputs are validated and sanitised. SQL injection is not applicable (Redis-only storage). XSS protection via Content-Security-Policy headers.
        </SECTION>

        <SECTION title="Penetration Testing & Security Review">
          Watchtower undergoes regular internal security review against the OWASP Top 10. Current posture: 0 Critical, 0 High, 0 Medium findings. Four security reviews conducted across the v74 series. We are working toward a formal third-party penetration test and SOC 2 Type II certification — expected Q4 2026. Enterprise customers requiring a security questionnaire response should contact security@runbookhq.com.
        </SECTION>

        <SECTION title="Bug Bounty & Responsible Disclosure">
          We operate a responsible disclosure programme. If you discover a security vulnerability, please report it to <a href="mailto:security@runbookhq.com" style={{color: '#4f8fff'}}>security@runbookhq.com</a> with a description and reproduction steps. We aim to acknowledge within 48 hours and resolve critical issues within 7 days. We credit researchers in our changelog with their permission. Please do not publicly disclose until we have had a chance to address the issue. We do not currently offer financial rewards but do offer recognition and early access to new features.
        </SECTION>

        <SECTION title="Contact">
          Security issues: <a href="mailto:security@runbookhq.com" style={{color: '#4f8fff'}}>security@runbookhq.com</a><br/>
          Privacy/GDPR: <a href="mailto:privacy@runbookhq.com" style={{color: '#4f8fff'}}>privacy@runbookhq.com</a><br/>
          General: <a href="mailto:hello@getwatchtower.io" style={{color: '#4f8fff'}}>hello@getwatchtower.io</a>
        </SECTION>

        <div style={{marginTop: 48, padding: '16px 20px', background: '#131929', borderRadius: 10, border: '1px solid #1d2535', fontSize: '0.72rem', color: '#3a4050', textAlign: 'center'}}>
          Watchtower &middot; RunbookHQ Ltd &middot; 2026 &middot; <a href="/privacy" style={{color: '#4a5568', textDecoration: 'none'}}>Privacy</a> &middot; <a href="/terms" style={{color: '#4a5568', textDecoration: 'none'}}>Terms</a>
        </div>
      </div>
    </div>
  );
}
