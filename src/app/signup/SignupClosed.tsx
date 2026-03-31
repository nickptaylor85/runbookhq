'use client';
import React, { useState } from 'react';

export default function SignupClosed() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) return;
    setLoading(true);
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {}
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#090d18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', color: '#e8ecf4', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="9" fill="url(#wg)"/>
              <path d="M17 7L26 11V18C26 22.5 22 26.5 17 28C12 26.5 8 22.5 8 18V11L17 7Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
              <path d="M14.5 18L16.5 20L20.5 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs><linearGradient id="wg" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
            </svg>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Watchtower</span>
          </a>
        </div>

        <div style={{ background: '#131929', border: '1px solid #263044', borderRadius: 16, padding: '36px 28px' }}>
          {!submitted ? (
            <>
              <div style={{ fontSize: '2rem', marginBottom: 16 }}>🔒</div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8 }}>Registration paused</h1>
              <p style={{ fontSize: '0.84rem', color: '#6b7a94', lineHeight: 1.7, marginBottom: 28 }}>
                We&apos;re currently in a closed period. Drop your email below and we&apos;ll notify you as soon as signups reopen.
              </p>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{ width: '100%', padding: '11px 14px', background: '#070a14', border: '1px solid #263044', borderRadius: 8, color: '#e8ecf4', fontSize: '0.88rem', fontFamily: 'Inter,sans-serif', outline: 'none', boxSizing: 'border-box' as const }}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading || !email.includes('@')}
                style={{ width: '100%', padding: 11, border: 'none', borderRadius: 9, color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif', background: email.includes('@') ? '#4f8fff' : '#1d2535', transition: 'background .15s' }}
              >
                {loading ? 'Joining…' : 'Notify me when open →'}
              </button>
              <p style={{ marginTop: 16, fontSize: '0.72rem', color: '#3a4050' }}>
                Already have an account? <a href="/login" style={{ color: '#4f8fff', textDecoration: 'none', fontWeight: 600 }}>Sign in</a>
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '2rem', marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>You&apos;re on the list</h2>
              <p style={{ fontSize: '0.84rem', color: '#6b7a94', lineHeight: 1.7 }}>
                We&apos;ll email <strong style={{ color: '#e8ecf4' }}>{email}</strong> when signups reopen.
              </p>
              <p style={{ marginTop: 20, fontSize: '0.72rem', color: '#3a4050' }}>
                <a href="/" style={{ color: '#4f8fff', textDecoration: 'none', fontWeight: 600 }}>← Back to homepage</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
