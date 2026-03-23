'use client';
import { useState } from 'react';

type MSSPTenant = { id: string; name: string; type: string };
type MSSPPortfolioProps = { currentTenant: string; setCurrentTenant: (t: string) => void; DEMO_TENANTS: MSSPTenant[]; };
type PortfolioView = 'security' | 'revenue';

const CLIENTS = [
  { id: 'client-acme',   name: 'Acme Financial',  plan: 'Business', seats: 8,  mrr: 199, contractStart: '2024-01-15', renewalDate: '2025-01-15', billingStatus: 'Paid',    posture: 82, alerts: 8,  critAlerts: 3, incidents: 2, coverage: 94, kevVulns: 3, lastSeen: '2m ago' },
  { id: 'client-nhs',    name: 'NHS Trust Alpha', plan: 'Business', seats: 14, mrr: 199, contractStart: '2024-03-01', renewalDate: '2025-03-01', billingStatus: 'Paid',    posture: 71, alerts: 15, critAlerts: 5, incidents: 3, coverage: 88, kevVulns: 7, lastSeen: '1m ago' },
  { id: 'client-retail', name: 'RetailCo UK',     plan: 'Team',     seats: 6,  mrr: 294, contractStart: '2024-06-10', renewalDate: '2025-06-10', billingStatus: 'Paid',    posture: 91, alerts: 4,  critAlerts: 1, incidents: 1, coverage: 97, kevVulns: 4, lastSeen: '5m ago' },
  { id: 'client-gov',    name: 'Gov Dept Beta',   plan: 'Business', seats: 10, mrr: 199, contractStart: '2024-09-20', renewalDate: '2025-09-20', billingStatus: 'Overdue', posture: 78, alerts: 9,  critAlerts: 3, incidents: 1, coverage: 92, kevVulns: 5, lastSeen: '8m ago' },
];

export function MSSPPortfolio({ currentTenant, setCurrentTenant, DEMO_TENANTS }: MSSPPortfolioProps) {
  const [portfolioView, setPortfolioView] = useState<PortfolioView>('security');

  const totalMRR = CLIENTS.reduce((s, c) => s + c.mrr, 0);
  const totalARR = totalMRR * 12;
  const overdueMRR = CLIENTS.filter(c => c.billingStatus === 'Overdue').reduce((s, c) => s + c.mrr, 0);
  const totalSeats = CLIENTS.reduce((s, c) => s + c.seats, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '0.88rem', fontWeight: 700 }}>Client Portfolio</h2>
        <span style={{ fontSize: '0.62rem', color: '#22d49a', background: '#22d49a12', padding: '2px 8px', borderRadius: 4 }}>{CLIENTS.length} clients</span>
        <div style={{ display: 'flex', gap: 3, background: 'var(--wt-card2)', borderRadius: 7, padding: 3, marginLeft: 8 }}>
          {(['security', 'revenue'] as PortfolioView[]).map(v => (
            <button key={v} onClick={() => setPortfolioView(v)} style={{ padding: '4px 12px', borderRadius: 5, border: 'none', background: portfolioView === v ? '#4f8fff' : 'transparent', color: portfolioView === v ? '#fff' : 'var(--wt-muted)', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', textTransform: 'capitalize' }}>{v}</button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: 'var(--wt-dim)' }}>Admin: <strong style={{ color: 'var(--wt-text)' }}>{DEMO_TENANTS.find(t => t.id === currentTenant)?.name || 'Global'}</strong></span>
      </div>

      {/* Revenue summary */}
      {portfolioView === 'revenue' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[
            { label: 'Monthly Recurring Revenue', val: `£${totalMRR.toLocaleString()}`, sub: 'MRR', color: '#22d49a' },
            { label: 'Annual Recurring Revenue',  val: `£${(totalARR / 1000).toFixed(1)}k`, sub: 'ARR', color: '#4f8fff' },
            { label: 'Total Seats Under Management', val: totalSeats, sub: 'seats', color: '#8b6fff' },
            { label: 'Overdue Balance', val: overdueMRR > 0 ? `£${overdueMRR}` : '£0', sub: overdueMRR > 0 ? 'action needed' : 'all clear', color: overdueMRR > 0 ? '#f0405e' : '#22d49a' },
          ].map(s => (
            <div key={s.label} style={{ padding: '14px 16px', background: 'var(--wt-card)', border: `1px solid ${s.color}18`, borderRadius: 12 }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace', color: s.color, letterSpacing: -2, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: '0.58rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 3 }}>{s.sub}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--wt-dim)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Security summary */}
      {portfolioView === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[
            { label: 'Active Incidents', val: CLIENTS.reduce((s, c) => s + c.incidents, 0), color: '#f0405e' },
            { label: 'Critical Alerts',  val: CLIENTS.reduce((s, c) => s + c.critAlerts, 0), color: '#f0405e' },
            { label: 'KEV Outstanding',  val: CLIENTS.reduce((s, c) => s + c.kevVulns, 0), color: '#f97316' },
            { label: 'Avg Coverage',     val: `${Math.round(CLIENTS.reduce((s, c) => s + c.coverage, 0) / CLIENTS.length)}%`, color: '#22d49a' },
          ].map(s => (
            <div key={s.label} style={{ padding: '14px 16px', background: 'var(--wt-card)', border: `1px solid ${s.color}18`, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace', color: s.color, letterSpacing: -2 }}>{s.val}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--wt-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Per-client rows */}
      {CLIENTS.map(client => {
        const isSelected = currentTenant === client.id;
        const postureColor = client.posture >= 85 ? '#22d49a' : client.posture >= 70 ? '#f0a030' : '#f0405e';
        const daysToRenewal = Math.round((new Date(client.renewalDate).getTime() - Date.now()) / 86400000);
        const renewalColor = daysToRenewal < 30 ? '#f0405e' : daysToRenewal < 90 ? '#f0a030' : '#22d49a';
        return (
          <div key={client.id} style={{ background: isSelected ? '#080d18' : 'var(--wt-card)', border: `1px solid ${isSelected ? '#4f8fff40' : 'var(--wt-border)'}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--wt-border)' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c992', boxShadow: '0 0 6px #22c992', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>{client.name}</span>
                  <span style={{ fontSize: '0.54rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#4f8fff12', color: '#4f8fff', border: '1px solid #4f8fff20' }}>{client.plan}</span>
                  {client.billingStatus === 'Overdue' && <span style={{ fontSize: '0.54rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#f0405e12', color: '#f0405e', border: '1px solid #f0405e20' }}>⚠ OVERDUE</span>}
                  {isSelected && <span style={{ fontSize: '0.52rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#4f8fff15', color: '#4f8fff', border: '1px solid #4f8fff25' }}>VIEWING</span>}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--wt-dim)', marginTop: 1 }}>Last seen {client.lastSeen} · {client.seats} seats</div>
              </div>
              <button onClick={() => setCurrentTenant(client.id)} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #4f8fff30', background: '#4f8fff12', color: '#4f8fff', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', flexShrink: 0 }}>
                {isSelected ? 'Viewing' : 'Switch →'}
              </button>
            </div>

            {portfolioView === 'revenue' && (
              <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
                {[
                  { label: 'MRR',     val: `£${client.mrr}`,                          color: '#22d49a' },
                  { label: 'ARR',     val: `£${(client.mrr * 12).toLocaleString()}`,   color: '#4f8fff' },
                  { label: 'Seats',   val: client.seats,                               color: 'var(--wt-secondary)' },
                  { label: 'Plan',    val: client.plan,                                color: '#8b6fff' },
                  { label: 'Billing', val: client.billingStatus,                       color: client.billingStatus === 'Paid' ? '#22d49a' : '#f0405e' },
                  { label: 'Renewal', val: `${daysToRenewal}d`,                        color: renewalColor },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace', color: s.color, letterSpacing: -0.5 }}>{s.val}</div>
                    <div style={{ fontSize: '0.52rem', color: 'var(--wt-dim)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {portfolioView === 'security' && (
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `conic-gradient(${postureColor} ${client.posture}%,var(--wt-border) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--wt-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 900, color: postureColor }}>{client.posture}</div>
                  </div>
                  <span style={{ fontSize: '0.6rem', color: 'var(--wt-dim)' }}>Posture</span>
                </div>
                {[
                  { label: 'Alerts',    val: client.alerts,      color: client.critAlerts > 0 ? '#f0a030' : 'var(--wt-secondary)' },
                  { label: 'Critical',  val: client.critAlerts,  color: client.critAlerts > 0 ? '#f0405e' : 'var(--wt-secondary)' },
                  { label: 'Incidents', val: client.incidents,   color: client.incidents > 0 ? '#f0405e' : 'var(--wt-secondary)' },
                  { label: 'KEV Vulns', val: client.kevVulns,    color: '#f97316' },
                  { label: 'Coverage',  val: `${client.coverage}%`, color: client.coverage >= 95 ? '#22d49a' : client.coverage >= 85 ? '#f0a030' : '#f0405e' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', minWidth: 52 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'JetBrains Mono,monospace', color: s.color, letterSpacing: -1 }}>{s.val}</div>
                    <div style={{ fontSize: '0.52rem', color: 'var(--wt-dim)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Revenue footer */}
      {portfolioView === 'revenue' && (
        <div style={{ padding: '12px 16px', background: 'var(--wt-card)', border: '1px solid var(--wt-border)', borderRadius: 12, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--wt-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Revenue by Plan</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {['Business', 'Team'].map(plan => {
                const planClients = CLIENTS.filter(c => c.plan === plan);
                if (!planClients.length) return null;
                const planMRR = planClients.reduce((s, c) => s + c.mrr, 0);
                const color = plan === 'Business' ? '#22d49a' : '#4f8fff';
                return (
                  <div key={plan} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.68rem', color: 'var(--wt-secondary)' }}>{plan}: <strong style={{ color }}>£{planMRR}/mo</strong> · {planClients.length} client{planClients.length !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--wt-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Your MSSP fee to Watchtower</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--wt-secondary)' }}>£799/mo base + {CLIENTS.length > 5 ? `${CLIENTS.length - 5} × £79 extra` : 'no extras (≤5 clients)'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
