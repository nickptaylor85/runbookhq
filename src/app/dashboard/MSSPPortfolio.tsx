'use client';
import React, { useState } from 'react';

interface Tenant { id: string; name: string; type: string }
interface MSSPPortfolioProps {
  currentTenant: string;
  setCurrentTenant: (id: string) => void;
  DEMO_TENANTS: Tenant[];
}

export default function MSSPPortfolio({ currentTenant, setCurrentTenant, DEMO_TENANTS }: MSSPPortfolioProps) {
  const [view, setView] = useState<'security'|'revenue'|'usage'>('security');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <h2 style={{ fontSize:'0.88rem', fontWeight:700 }}>Client Portfolio</h2>
      </div>
      <div style={{ display:'flex', gap:4 }}>
        {(['security','revenue','usage'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            style={{ padding:'4px 12px', borderRadius:5, border:'none',
              background: view===v ? '#4f8fff' : 'transparent',
              color: view===v ? '#fff' : 'var(--wt-muted)',
              fontSize:'0.68rem', fontWeight:700, cursor:'pointer',
              fontFamily:'Inter,sans-serif', textTransform:'capitalize' }}>
            {v}
          </button>
        ))}
      </div>
      {DEMO_TENANTS.filter(t => t.type === 'client').map(client => (
        <div key={client.id}
          style={{ padding:'12px 16px', background:'var(--wt-card)',
            border:`1px solid ${currentTenant===client.id?'#4f8fff40':'var(--wt-border)'}`,
            borderRadius:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:'0.86rem', fontWeight:700, flex:1 }}>{client.name}</span>
            <button onClick={() => setCurrentTenant(client.id)}
              style={{ padding:'5px 12px', borderRadius:7, border:'1px solid #4f8fff30',
                background:'#4f8fff12', color:'#4f8fff', fontSize:'0.68rem',
                fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
              {currentTenant===client.id ? 'Viewing' : 'View →'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
