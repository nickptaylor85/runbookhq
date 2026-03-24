'use client';
import React from 'react';
import { SEV_COLOR } from './dashboardData';
import type { SevKey } from './dashboardTypes';

export function SevBadge({ sev }: { sev: SevKey }) {
  return (
    <span style={{ fontSize: '0.5rem', fontWeight: 800, padding: '1px 6px', borderRadius: 3, color: '#fff', background: SEV_COLOR[sev] }}>
      {sev.toUpperCase()}
    </span>
  );
}

type ModalProps = { title: string; onClose: () => void; children: React.ReactNode };
export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'var(--wt-card2)', border: '1px solid var(--wt-border2)', borderRadius: 16, maxWidth: 700, width: '100%', maxHeight: '85vh', overflow: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #141820', position: 'sticky', top: 0, background: 'var(--wt-card2)', zIndex: 10 }}>
          <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{title}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--wt-muted)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

type StatCardProps = { val: string | number; label: string; sub?: string; color: string; onClick?: () => void };
export function StatCard({ val, label, sub, color, onClick }: StatCardProps) {
  return (
    <div onClick={onClick} style={{ padding: '14px 12px', background: 'var(--wt-card)', border: '1px solid #141820', borderRadius: 10, textAlign: 'center', cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.borderColor = '#4f8fff40'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--wt-border)'; }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace', color, letterSpacing: -1 }}>{val}</div>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--wt-muted)', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.56rem', color: 'var(--wt-dim)', marginTop: 2 }}>{sub}</div>}
      {onClick && <div style={{ fontSize: '0.48rem', color: '#4f8fff', marginTop: 4 }}>click to view</div>}
    </div>
  );
}

type GateWallProps = { feature: string; requiredTier: string; children: React.ReactNode; userTier: string };
export function GateWall({ feature, requiredTier, children, userTier }: GateWallProps) {
  const levels: Record<string, number> = { community: 0, team: 1, business: 2, mssp: 3 };
  if ((levels[userTier] || 0) >= (levels[requiredTier] || 0)) {
    return <>{children}</>;
  }
  const tierColors: Record<string, string> = { team: '#4f8fff', business: '#22d49a', mssp: '#8b6fff' };
  const tierPrices: Record<string, string> = { team: '£49/seat', business: '£199/mo', mssp: '£799/mo' };
  const label = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);
  const bg = tierColors[requiredTier] || '#4f8fff';
  const price = tierPrices[requiredTier] || '';
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
      <div style={{ filter: 'blur(3px)', opacity: 0.3, pointerEvents: 'none', userSelect: 'none' }}>{children}</div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,5,8,0.85)', borderRadius: 12, border: '1px solid #ffffff10' }}>
        <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>🔒</div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>{feature}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--wt-muted)', marginBottom: 14, textAlign: 'center', maxWidth: 260 }}>Available on {label} plan and above</div>
        <a href='/pricing' style={{ padding: '8px 20px', borderRadius: 8, background: bg, color: '#fff', fontSize: '0.76rem', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>Upgrade to {label} — {price}</a>
      </div>
    </div>
  );
}
