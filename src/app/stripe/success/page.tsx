'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const PLAN_NAMES: Record<string, string> = {
  team: 'Team',
  business: 'Business',
  mssp: 'MSSP',
};

export default function StripeSuccessPage() {
  const params = useSearchParams();
  const plan = params.get('plan') || 'team';
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    const redirect = setTimeout(() => { window.location.href = '/dashboard'; }, 4000);
    return () => { clearInterval(interval); clearTimeout(redirect); };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#e8ecf4', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#22d49a,#4f8fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '2rem' }}>✓</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: -1.5, marginBottom: 10 }}>You're in.</h1>
        <p style={{ fontSize: '1rem', color: '#6b7a94', lineHeight: 1.7, marginBottom: 28 }}>
          Welcome to Watchtower {PLAN_NAMES[plan]}. Your 14-day free trial starts now — no charge until it ends.
        </p>
        <div style={{ padding: '16px 20px', background: '#0a0d14', border: '1px solid #22d49a20', borderRadius: 12, marginBottom: 28, fontSize: '0.8rem', color: '#6b7a94', lineHeight: 1.8 }}>
          <div style={{ color: '#22d49a', fontWeight: 700, marginBottom: 4 }}>Next steps</div>
          Connect your first security tool → Your alerts start flowing → AI begins triaging immediately
        </div>
        <div style={{ fontSize: '0.76rem', color: '#3a4050' }}>
          Redirecting to your dashboard{dots}
        </div>
        <a href='/dashboard' style={{ display: 'inline-block', marginTop: 16, padding: '10px 28px', borderRadius: 9, background: '#4f8fff', color: '#fff', fontSize: '0.84rem', fontWeight: 700, textDecoration: 'none' }}>Go to Dashboard →</a>
      </div>
    </div>
  );
}
