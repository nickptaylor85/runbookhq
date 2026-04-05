'use client';
import React, { useState, useEffect, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Branding { name: string; primaryColor: string; accentColor: string; tagline: string; }
interface Alert { id: string; title: string; severity: string; source: string; device?: string; time: string; verdict?: string; mitre?: string; }
interface Vuln { id?: string; cve?: string; severity: string; title?: string; plugin_name?: string; device?: string; host_ip?: string; score?: number; }
interface Incident { id: string; title: string; severity: string; status: string; created: string; updated?: string; }

const SEV_COLORS: Record<string, string> = { Critical: '#f0405e', High: '#f97316', Medium: '#ffb300', Low: '#6b7a94', Info: '#4f8fff' };

// ─── Posture ring SVG component ──────────────────────────────────────────────
function PostureRing({ score, size = 120, accent }: { score: number; size?: number; accent: string }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#22d49a' : score >= 60 ? '#ffb300' : '#f0405e';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a1f30" strokeWidth="8" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x="50%" y="46%" textAnchor="middle" fontSize={size * 0.28} fontWeight="900" fill={color}
        fontFamily="'JetBrains Mono',monospace">{score}</text>
      <text x="50%" y="64%" textAnchor="middle" fontSize={size * 0.1} fill="#6b7a94"
        fontFamily="Inter,sans-serif" fontWeight="600">/ 100</text>
    </svg>
  );
}

// ─── Severity badge ──────────────────────────────────────────────────────────
function SevBadge({ sev }: { sev: string }) {
  const c = SEV_COLORS[sev] || '#6b7a94';
  return (
    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: 4,
      background: c + '18', color: c, textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{sev}</span>
  );
}

// ─── Portal Dashboard ────────────────────────────────────────────────────────
export default function PortalPage() {
  const [branding, setBranding] = useState<Branding>({ name: '', primaryColor: '#4f8fff', accentColor: '#00e5ff', tagline: 'Security Portal' });
  const [tenantId, setTenantId] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'vulns' | 'incidents' | 'reports'>('overview');

  // Data
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [vulns, setVulns] = useState<Vuln[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [posture, setPosture] = useState(0);
  const [coverage, setCoverage] = useState(0);
  const [toolCount, setToolCount] = useState(0);
  const [clientBanner, setClientBanner] = useState('');
  const [lastSync, setLastSync] = useState('');

  // Resolve branding
  useEffect(() => {
    const host = window.location.hostname;
    const parts = host.split('.');
    let slug = '';
    if (parts.length >= 3 && (host.endsWith('.getwatchtower.io') || host.endsWith('.getwatchtower.com'))) {
      slug = parts.slice(0, parts.length - 2).join('.');
    } else if (parts.length >= 2 && !host.includes('vercel.app') && !host.includes('localhost')) {
      slug = parts[0];
    }
    const params = new URLSearchParams(window.location.search);
    const qSlug = params.get('org') || slug;
    if (qSlug) {
      fetch(`/api/portal/resolve?slug=${encodeURIComponent(qSlug)}`)
        .then(r => r.json())
        .then(d => { if (d.ok) { setBranding(d.branding); setTenantId(d.tenantId); } })
        .catch(() => {});
    }
  }, []);

  // Check auth + load data
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) {
          setAuthenticated(true);
          setUserName(d.name || d.email?.split('@')[0] || '');
          if (d.tenantId) setTenantId(d.tenantId);
        } else {
          window.location.href = '/portal/login';
        }
      })
      .catch(() => { window.location.href = '/portal/login'; })
      .finally(() => setLoading(false));
  }, []);

  // Load security data when tenant is resolved
  const loadData = useCallback(async () => {
    if (!tenantId) return;
    const headers: Record<string, string> = { 'x-tenant-id': tenantId };
    try {
      // Alerts
      const [alertRes, vulnRes, incRes, postureRes, coverageRes] = await Promise.allSettled([
        fetch('/api/unified-alerts', { headers }).then(r => r.json()),
        fetch('/api/tenable', { headers }).then(r => r.json()),
        fetch('/api/incidents', { headers }).then(r => r.json()),
        fetch('/api/posture', { headers }).then(r => r.json()),
        fetch('/api/coverage', { headers }).then(r => r.json()),
      ]);

      if (alertRes.status === 'fulfilled' && alertRes.value?.alerts) {
        setAlerts(alertRes.value.alerts.slice(0, 50));
      }
      if (vulnRes.status === 'fulfilled' && vulnRes.value?.vulnerabilities) {
        setVulns(vulnRes.value.vulnerabilities.slice(0, 50));
      }
      if (incRes.status === 'fulfilled' && incRes.value?.incidents) {
        setIncidents(incRes.value.incidents);
      }
      if (postureRes.status === 'fulfilled') {
        setPosture(postureRes.value?.score ?? postureRes.value?.posture ?? 0);
        setToolCount(postureRes.value?.toolCount ?? 0);
      }
      if (coverageRes.status === 'fulfilled') {
        setCoverage(coverageRes.value?.coverage ?? coverageRes.value?.percentage ?? 0);
      }
      setLastSync(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    } catch {}
  }, [tenantId]);

  useEffect(() => { if (authenticated && tenantId) loadData(); }, [authenticated, tenantId, loadData]);

  // Load client banner
  useEffect(() => {
    if (!tenantId) return;
    fetch('/api/settings/user', { headers: { 'x-tenant-id': tenantId } })
      .then(r => r.json())
      .then(d => { if (d.settings?.clientBanner) setClientBanner(d.settings.clientBanner); })
      .catch(() => {});
  }, [tenantId]);

  const accent = branding.primaryColor;
  const orgName = branding.name || 'Security Portal';
  const critAlerts = alerts.filter(a => a.severity === 'Critical');
  const highAlerts = alerts.filter(a => a.severity === 'High');
  const critVulns = vulns.filter(v => v.severity === 'Critical' || (v.score && v.score >= 9));
  const activeIncidents = incidents.filter(i => i.status !== 'Closed' && i.status !== 'Resolved');

  // Demo data fallback
  const DEMO_ALERTS: Alert[] = [
    { id: 'pa1', title: 'Suspicious PowerShell execution on SRV-APP01', severity: 'High', source: 'CrowdStrike', device: 'SRV-APP01', time: '09:14', mitre: 'T1059.001' },
    { id: 'pa2', title: 'Failed MFA attempts from new geography', severity: 'Medium', source: 'Microsoft Sentinel', device: 'cloud-vpn', time: '09:38', mitre: 'T1078' },
    { id: 'pa3', title: 'Anomalous outbound HTTPS — possible C2', severity: 'Critical', source: 'Darktrace', device: 'WS-DEV03', time: '10:02', mitre: 'T1071.001' },
    { id: 'pa4', title: 'Windows Update PowerShell activity', severity: 'Low', source: 'Splunk', device: 'WS-SALES12', time: '10:31', verdict: 'FP', mitre: 'T1059.001' },
    { id: 'pa5', title: 'DLP: Bulk email forward to external domain', severity: 'High', source: 'Proofpoint', device: 'cloud-email', time: '11:15', mitre: 'T1114' },
  ];
  const DEMO_VULNS: Vuln[] = [
    { cve: 'CVE-2024-21413', severity: 'Critical', plugin_name: 'Microsoft Outlook NTLM Relay', host_ip: '10.0.2.15', score: 9.8 },
    { cve: 'CVE-2024-3400', severity: 'Critical', plugin_name: 'Palo Alto PAN-OS RCE', host_ip: '10.0.0.1', score: 10.0 },
    { cve: 'CVE-2024-1709', severity: 'High', plugin_name: 'ConnectWise ScreenConnect Auth Bypass', host_ip: '10.0.3.8', score: 8.4 },
    { cve: 'CVE-2023-46805', severity: 'High', plugin_name: 'Ivanti Connect Secure Auth Bypass', host_ip: '10.0.0.5', score: 8.2 },
  ];
  const DEMO_INCIDENTS: Incident[] = [
    { id: 'INC-0847', title: 'Domain Controller Compromise — Credential Dump', severity: 'Critical', status: 'Active', created: '2026-03-30 09:14' },
    { id: 'INC-0846', title: 'Suspected Insider Threat — Data Exfiltration', severity: 'High', status: 'Contained', created: '2026-03-30 08:45' },
  ];

  const displayAlerts = alerts.length > 0 ? alerts : DEMO_ALERTS;
  const displayVulns = vulns.length > 0 ? vulns : DEMO_VULNS;
  const displayIncidents = incidents.length > 0 ? incidents : DEMO_INCIDENTS;
  const displayPosture = posture || 78;
  const displayCoverage = coverage || 92;
  const isDemo = alerts.length === 0 && vulns.length === 0;

  const displayCritAlerts = displayAlerts.filter(a => a.severity === 'Critical');
  const displayHighAlerts = displayAlerts.filter(a => a.severity === 'High');
  const displayActiveInc = displayIncidents.filter(i => i.status !== 'Closed' && i.status !== 'Resolved');
  const displayCritVulns = displayVulns.filter(v => v.severity === 'Critical' || (v.score && v.score >= 9));

  if (loading) {
    return (
      <html lang="en"><body style={{ margin: 0, background: '#060c18' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,system-ui,sans-serif', color: '#6b7a94' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #1a1f30', borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </body></html>
    );
  }

  const TABS = [
    { id: 'overview' as const, label: 'Overview', icon: '◉' },
    { id: 'alerts' as const, label: 'Alerts', icon: '⚡', badge: displayCritAlerts.length || null },
    { id: 'vulns' as const, label: 'Vulnerabilities', icon: '🛡' },
    { id: 'incidents' as const, label: 'Incidents', icon: '📋', badge: displayActiveInc.length || null },
    { id: 'reports' as const, label: 'Reports', icon: '📊' },
  ];

  return (
    <html lang="en"><body style={{ margin: 0, background: '#060c18', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Inter,system-ui,sans-serif', color: '#e0e6f0' }}>

        {/* ── Top bar ────────────────────────────────────────────────────────── */}
        <header style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 54, borderBottom: '1px solid #1a1f30', background: '#0a0e1a', flexShrink: 0, gap: 16 }}>
          {/* Client brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 16, borderRight: '1px solid #1a1f30' }}>
            <div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${accent}, ${accent}80)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 900, color: '#fff' }}>
              {orgName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#e0e6f0', letterSpacing: '-0.3px' }}>{orgName}</span>
          </div>

          {/* Tabs */}
          <nav style={{ display: 'flex', gap: 0, height: '100%', alignItems: 'stretch' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                height: '100%', padding: '0 16px', border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? accent : 'transparent'}`,
                background: 'transparent', color: activeTab === tab.id ? accent : '#6b7a94',
                fontSize: '0.82rem', fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer', fontFamily: 'Inter,system-ui,sans-serif',
                display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s',
              }}>
                <span style={{ fontSize: '0.75rem' }}>{tab.icon}</span>
                {tab.label}
                {tab.badge && <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '1px 5px', borderRadius: 3, background: '#f0405e', color: '#fff' }}>{tab.badge}</span>}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {lastSync && <span style={{ fontSize: '0.66rem', color: '#3a4050' }}>Synced {lastSync}</span>}
            <button onClick={loadData} title="Refresh data" style={{ background: 'none', border: '1px solid #1a1f30', borderRadius: 6, padding: '4px 8px', color: '#6b7a94', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'Inter,system-ui,sans-serif' }}>↻ Refresh</button>
            <span style={{ fontSize: '0.78rem', color: '#6b7a94' }}>{userName}</span>
            <button onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.href = '/portal/login'); }}
              style={{ background: 'none', border: '1px solid #f0405e30', borderRadius: 6, padding: '4px 10px', color: '#f0405e', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'Inter,system-ui,sans-serif' }}>
              Sign out
            </button>
          </div>
        </header>

        {/* ── Client message banner ──────────────────────────────────────────── */}
        {clientBanner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: `${accent}08`, borderBottom: `1px solid ${accent}25`, flexShrink: 0 }}>
            <span style={{ fontSize: '0.88rem' }}>📢</span>
            <span style={{ fontSize: '0.84rem', color: accent, flex: 1, fontWeight: 500 }}>{clientBanner}</span>
          </div>
        )}

        {isDemo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: '#f0a03008', borderBottom: '1px solid #f0a03020', flexShrink: 0 }}>
            <span style={{ fontSize: '0.72rem', color: '#f0a030', fontWeight: 600 }}>⚡ Showing sample data — connect security tools via your MSSP provider to see live data</span>
          </div>
        )}

        {/* ── Main content ────────────────────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ═════ OVERVIEW TAB ═════ */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Headline cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Security Posture', val: displayPosture + '/100', color: displayPosture >= 80 ? '#22d49a' : displayPosture >= 60 ? '#ffb300' : '#f0405e', sub: displayPosture >= 80 ? 'Strong' : displayPosture >= 60 ? 'Moderate' : 'Needs attention' },
                  { label: 'Active Alerts', val: displayAlerts.length, color: displayCritAlerts.length > 0 ? '#f0405e' : '#22d49a', sub: `${displayCritAlerts.length} critical · ${displayHighAlerts.length} high` },
                  { label: 'Open Incidents', val: displayActiveInc.length, color: displayActiveInc.some(i => i.severity === 'Critical') ? '#f0405e' : '#4f8fff', sub: displayActiveInc.length > 0 ? `${displayActiveInc.filter(i => i.severity === 'Critical').length} critical` : 'None active' },
                  { label: 'Critical Vulns', val: displayCritVulns.length, color: displayCritVulns.length > 0 ? '#f0405e' : '#22d49a', sub: `${displayVulns.length} total findings` },
                  { label: 'Tool Coverage', val: displayCoverage + '%', color: displayCoverage >= 90 ? '#22d49a' : '#ffb300', sub: `${toolCount || '—'} tools connected` },
                ].map(card => (
                  <div key={card.label} style={{ background: '#0c1020', border: `1px solid ${card.color}20`, borderRadius: 12, padding: '18px 16px' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: card.color, fontFamily: "'JetBrains Mono',monospace" }}>{card.val}</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e0e6f0', marginTop: 4 }}>{card.label}</div>
                    <div style={{ fontSize: '0.68rem', color: '#6b7a94', marginTop: 2 }}>{card.sub}</div>
                  </div>
                ))}
              </div>

              {/* Posture ring + recent activity */}
              <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
                {/* Posture ring */}
                <div style={{ background: '#0c1020', border: '1px solid #1a1f30', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7a94', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Security Posture</div>
                  <PostureRing score={displayPosture} size={140} accent={accent} />
                  <div style={{ marginTop: 16, width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { label: 'Endpoint coverage', val: displayCoverage + '%', c: displayCoverage >= 90 ? '#22d49a' : '#ffb300' },
                      { label: 'Critical vulns', val: displayCritVulns.length, c: displayCritVulns.length === 0 ? '#22d49a' : '#f0405e' },
                      { label: 'Open incidents', val: displayActiveInc.length, c: displayActiveInc.length === 0 ? '#22d49a' : '#f97316' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                        <span style={{ color: '#6b7a94' }}>{row.label}</span>
                        <span style={{ fontWeight: 700, color: row.c, fontFamily: "'JetBrains Mono',monospace" }}>{row.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent alerts */}
                <div style={{ background: '#0c1020', border: '1px solid #1a1f30', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1f30', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Recent Alerts</span>
                    <button onClick={() => setActiveTab('alerts')} style={{ fontSize: '0.68rem', color: accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter,system-ui,sans-serif' }}>View all →</button>
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    {displayAlerts.slice(0, 6).map(alert => (
                      <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid #0f1424' }}>
                        <SevBadge sev={alert.severity} />
                        <span style={{ flex: 1, fontSize: '0.78rem', color: '#c8d0e0' }}>{alert.title}</span>
                        <span style={{ fontSize: '0.64rem', color: '#3a4050', fontFamily: "'JetBrains Mono',monospace" }}>{alert.source}</span>
                        <span style={{ fontSize: '0.64rem', color: '#3a4050', fontFamily: "'JetBrains Mono',monospace" }}>{alert.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Open incidents */}
              {displayActiveInc.length > 0 && (
                <div style={{ background: '#0c1020', border: '1px solid #1a1f30', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1f30', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Active Incidents</span>
                    <button onClick={() => setActiveTab('incidents')} style={{ fontSize: '0.68rem', color: accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter,system-ui,sans-serif' }}>View all →</button>
                  </div>
                  {displayActiveInc.slice(0, 4).map(inc => (
                    <div key={inc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #0f1424' }}>
                      <SevBadge sev={inc.severity} />
                      <code style={{ fontSize: '0.72rem', color: accent, fontFamily: "'JetBrains Mono',monospace" }}>{inc.id}</code>
                      <span style={{ flex: 1, fontSize: '0.78rem', color: '#c8d0e0' }}>{inc.title}</span>
                      <span style={{ fontSize: '0.64rem', padding: '2px 8px', borderRadius: 4, background: inc.status === 'Active' ? '#f0405e15' : '#ffb30015', color: inc.status === 'Active' ? '#f0405e' : '#ffb300', fontWeight: 600 }}>{inc.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═════ ALERTS TAB ═════ */}
          {activeTab === 'alerts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Security Alerts</h2>
                <span style={{ fontSize: '0.72rem', color: '#6b7a94' }}>{displayAlerts.length} total</span>
              </div>
              {/* Severity breakdown */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Critical', 'High', 'Medium', 'Low'].map(sev => {
                  const count = displayAlerts.filter(a => a.severity === sev).length;
                  return (
                    <div key={sev} style={{ padding: '8px 14px', background: '#0c1020', border: `1px solid ${SEV_COLORS[sev]}20`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", color: SEV_COLORS[sev] }}>{count}</span>
                      <span style={{ fontSize: '0.72rem', color: '#6b7a94' }}>{sev}</span>
                    </div>
                  );
                })}
              </div>
              {/* Alert list */}
              <div style={{ background: '#0c1020', border: '1px solid #1a1f30', borderRadius: 12, overflow: 'hidden' }}>
                {displayAlerts.map(alert => (
                  <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #0f1424', transition: 'background .1s' }}>
                    <SevBadge sev={alert.severity} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', color: '#e0e6f0', fontWeight: 600 }}>{alert.title}</div>
                      <div style={{ fontSize: '0.66rem', color: '#3a4050', marginTop: 2 }}>
                        {alert.device && <span>{alert.device} · </span>}
                        {alert.mitre && <span style={{ color: '#7c6aff' }}>{alert.mitre} · </span>}
                        {alert.source}
                      </div>
                    </div>
                    {alert.verdict && (
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                        background: alert.verdict === 'TP' ? '#f0405e15' : alert.verdict === 'FP' ? '#22d49a15' : '#ffb30015',
                        color: alert.verdict === 'TP' ? '#f0405e' : alert.verdict === 'FP' ? '#22d49a' : '#ffb300' }}>
                        {alert.verdict === 'TP' ? 'True Positive' : alert.verdict === 'FP' ? 'False Positive' : 'Suspicious'}
                      </span>
                    )}
                    <span style={{ fontSize: '0.68rem', color: '#3a4050', fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>{alert.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═════ VULNS TAB ═════ */}
          {activeTab === 'vulns' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Vulnerabilities</h2>
                <span style={{ fontSize: '0.72rem', color: '#6b7a94' }}>{displayVulns.length} findings</span>
              </div>
              <div style={{ background: '#0c1020', border: '1px solid #1a1f30', borderRadius: 12, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '80px 140px 1fr 120px 60px', gap: 8, padding: '10px 16px', borderBottom: '1px solid #1a1f30', fontSize: '0.66rem', color: '#3a4050', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  <span>Severity</span><span>CVE</span><span>Description</span><span>Host</span><span>CVSS</span>
                </div>
                {displayVulns.map((vuln, i) => (
                  <div key={vuln.cve || i} style={{ display: 'grid', gridTemplateColumns: '80px 140px 1fr 120px 60px', gap: 8, padding: '11px 16px', borderBottom: '1px solid #0f1424', alignItems: 'center' }}>
                    <SevBadge sev={vuln.severity} />
                    <code style={{ fontSize: '0.72rem', color: '#f0c070', fontFamily: "'JetBrains Mono',monospace" }}>{vuln.cve || '—'}</code>
                    <span style={{ fontSize: '0.78rem', color: '#c8d0e0' }}>{vuln.plugin_name || vuln.title || '—'}</span>
                    <span style={{ fontSize: '0.68rem', color: '#6b7a94', fontFamily: "'JetBrains Mono',monospace" }}>{vuln.host_ip || vuln.device || '—'}</span>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: (vuln.score || 0) >= 9 ? '#f0405e' : (vuln.score || 0) >= 7 ? '#f97316' : '#ffb300', fontFamily: "'JetBrains Mono',monospace" }}>{vuln.score || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═════ INCIDENTS TAB ═════ */}
          {activeTab === 'incidents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Incidents</h2>
                <span style={{ fontSize: '0.72rem', color: '#6b7a94' }}>{displayActiveInc.length} active</span>
              </div>
              <div style={{ background: '#0c1020', border: '1px solid #1a1f30', borderRadius: 12, overflow: 'hidden' }}>
                {displayIncidents.map(inc => (
                  <div key={inc.id} style={{ padding: '16px', borderBottom: '1px solid #0f1424' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <SevBadge sev={inc.severity} />
                      <code style={{ fontSize: '0.76rem', color: accent, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{inc.id}</code>
                      <span style={{ fontSize: '0.64rem', padding: '2px 8px', borderRadius: 4, background: inc.status === 'Active' ? '#f0405e15' : inc.status === 'Contained' ? '#ffb30015' : '#22d49a15', color: inc.status === 'Active' ? '#f0405e' : inc.status === 'Contained' ? '#ffb300' : '#22d49a', fontWeight: 600 }}>{inc.status}</span>
                      <span style={{ fontSize: '0.64rem', color: '#3a4050', marginLeft: 'auto' }}>{inc.created}</span>
                    </div>
                    <div style={{ fontSize: '0.86rem', color: '#e0e6f0', fontWeight: 600 }}>{inc.title}</div>
                  </div>
                ))}
                {displayIncidents.length === 0 && (
                  <div style={{ padding: 32, textAlign: 'center', color: '#3a4050', fontSize: '0.84rem' }}>No incidents to display</div>
                )}
              </div>
            </div>
          )}

          {/* ═════ REPORTS TAB ═════ */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Reports & Downloads</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {[
                  { title: 'Executive Summary', desc: 'High-level security posture overview for leadership', icon: '📊', endpoint: '/api/exec-summary' },
                  { title: 'Vulnerability Report', desc: 'Full Tenable vulnerability export with remediation priorities', icon: '🛡', endpoint: '/api/tenable/report' },
                  { title: 'Compliance Status', desc: 'Current framework mapping across NIST CSF, ISO 27001, Cyber Essentials', icon: '✅', endpoint: '/api/compliance-map' },
                  { title: 'Shift Handover', desc: 'SOC analyst handover notes and open actions', icon: '🔄', endpoint: '/api/shift-handover' },
                ].map(report => (
                  <div key={report.title} style={{ background: '#0c1020', border: '1px solid #1a1f30', borderRadius: 12, padding: '20px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: '1.2rem' }}>{report.icon}</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e0e6f0' }}>{report.title}</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#6b7a94', marginBottom: 14, lineHeight: 1.5 }}>{report.desc}</div>
                    <button onClick={() => {
                      fetch(report.endpoint, { headers: { 'x-tenant-id': tenantId } })
                        .then(r => r.json())
                        .then(d => {
                          // Download as JSON report for now
                          const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url; a.download = report.title.toLowerCase().replace(/ /g, '-') + '.json';
                          a.click(); URL.revokeObjectURL(url);
                        })
                        .catch(() => alert('Report generation failed — ensure tools are connected.'));
                    }} style={{
                      padding: '8px 16px', borderRadius: 7, border: `1px solid ${accent}30`,
                      background: `${accent}08`, color: accent, fontSize: '0.76rem', fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'Inter,system-ui,sans-serif',
                    }}>Generate →</button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <footer style={{ padding: '10px 20px', borderTop: '1px solid #0f1424', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="9" fill="url(#wgf)" />
              <path d="M17 7L26 11V18C26 22.5 22 26.5 17 28C12 26.5 8 22.5 8 18V11L17 7Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
              <defs><linearGradient id="wgf" x1="0" y1="0" x2="34" y2="34"><stop stopColor="#3b7fff" /><stop offset="1" stopColor="#7c3aff" /></linearGradient></defs>
            </svg>
            <span style={{ fontSize: '0.64rem', color: '#2a3040' }}>Powered by <a href="https://getwatchtower.io" target="_blank" rel="noopener noreferrer" style={{ color: '#4f8fff', textDecoration: 'none' }}>Watchtower</a></span>
          </div>
          <span style={{ fontSize: '0.64rem', color: '#1a1f30' }}>Tenant: {tenantId}</span>
        </footer>
      </div>
    </body></html>
  );
}
