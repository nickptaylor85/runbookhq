'use client';
import React, { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <html>
      <body style={{ margin: 0, background: '#090d18', color: '#e8ecf4', fontFamily: 'Inter,sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '32px 24px', maxWidth: 480 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 20px' }}>
            <rect width="48" height="48" rx="13" fill="url(#eg)"/>
            <path d="M24 10L36 16V26C36 33 30.5 39.5 24 41.5C17.5 39.5 12 33 12 26V16L24 10Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
            <path d="M24 22V29" stroke="#f0405e" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="24" cy="33" r="1.2" fill="#f0405e"/>
            <defs><linearGradient id="eg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
          </svg>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: '0.84rem', color: '#6b7a94', lineHeight: 1.7, marginBottom: 24 }}>
            Watchtower encountered an unexpected error. Your data is safe — this is a display issue only.
          </p>
          {error?.digest && (
            <p style={{ fontSize: '0.68rem', color: '#3a4050', marginBottom: 20, fontFamily: 'JetBrains Mono,monospace' }}>
              Error ID: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={reset}
              style={{ padding: '10px 24px', background: '#4f8fff', border: 'none', borderRadius: 9, color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
              Try again
            </button>
            <a href="/dashboard"
              style={{ padding: '10px 24px', background: 'transparent', border: '1px solid #1d2535', borderRadius: 9, color: '#6b7a94', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
              Go to dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
