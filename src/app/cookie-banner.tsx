'use client';
import React from 'react';

export default function CookieBanner() {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('wt_cookie_consent')) {
      setShow(true);
    }
  }, []);
  if (!show) return null;
  function accept() { localStorage.setItem('wt_cookie_consent', 'accepted'); setShow(false); }
  function decline() {
    localStorage.setItem('wt_cookie_consent', 'declined');
    setShow(false);
    if (typeof window !== 'undefined') {
      (window as any)['ga-disable-' + (process.env.NEXT_PUBLIC_GA_ID || '')] = true;
    }
  }
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, padding: '12px 20px', background: 'rgba(14,24,46,0.95)', borderTop: '1px solid #1d2535', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'space-between', fontFamily: 'Inter,sans-serif' }}>
      <p style={{ fontSize: '0.78rem', color: '#8a9ab0', lineHeight: 1.6, margin: 0, flex: 1, minWidth: 240 }}>
        We use analytics cookies (Google Analytics, LinkedIn Insight Tag) to understand how visitors use the site.{' '}
        <a href="/privacy" style={{ color: '#4f8fff', textDecoration: 'none' }}>Privacy policy</a>
      </p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={decline} style={{ padding: '7px 16px', borderRadius: 7, border: '1px solid rgba(0,180,240,0.13)', background: 'transparent', color: '#6b7a94', fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 600 }}>Decline</button>
        <button onClick={accept} style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: '#4f8fff', color: '#fff', fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 700 }}>Accept cookies</button>
      </div>
    </div>
  );
}
