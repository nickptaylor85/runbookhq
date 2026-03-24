'use client';
import React from 'react';

interface SevBadgeProps { sev: string }
export function SevBadge({ sev }: SevBadgeProps) {
  const colors: Record<string, string> = {
    Critical: '#f0405e', High: '#f97316', Medium: '#f0a030', Low: '#4f8fff'
  };
  return (
    <span style={{ fontSize:'0.52rem', fontWeight:700, padding:'1px 6px', borderRadius:3,
      background:`${colors[sev] || '#6b7a94'}18`, color: colors[sev] || '#6b7a94',
      border:`1px solid ${colors[sev] || '#6b7a94'}25` }}>
      {sev}
    </span>
  );
}

interface StatCardProps { val: string | number; label: string; sub?: string; color: string; onClick?: () => void }
export function StatCard({ val, label, sub, color, onClick }: StatCardProps) {
  return (
    <div onClick={onClick} style={{ padding:'14px 16px', background:'var(--wt-card)',
      border:`1px solid ${color}18`, borderRadius:12, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontSize:'1.8rem', fontWeight:900, fontFamily:'JetBrains Mono,monospace',
        color, letterSpacing:-2, lineHeight:1 }}>{val}</div>
      {sub && <div style={{ fontSize:'0.58rem', fontWeight:700, color, textTransform:'uppercase',
        letterSpacing:'0.5px', marginTop:3 }}>{sub}</div>}
      <div style={{ fontSize:'0.6rem', color:'var(--wt-dim)', marginTop:2 }}>{label}</div>
    </div>
  );
}

interface ModalProps { title: string; onClose: () => void; children: React.ReactNode }
export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:200,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={onClose}>
      <div style={{ background:'var(--wt-card2)', border:'1px solid var(--wt-border2)',
        borderRadius:16, maxWidth:480, width:'100%', padding:24, maxHeight:'85vh', overflow:'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:'0.92rem', fontWeight:800, marginBottom:16 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}
