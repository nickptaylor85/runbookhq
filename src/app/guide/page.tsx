'use client';
import React, { useState } from 'react';

const SECTIONS = [
  {
    id: 'getting-started', title: 'Getting Started', icon: '🚀',
    items: [
      { heading: `What is Watchtower?`, body: `Watchtower is your AI-powered SOC in a single screen. It connects to all your security tools, ingests every alert, triages them with Claude AI in under 3.2 seconds, and takes automated action where you allow it. Your analysts arrive to a clean queue — threats contained, noise eliminated.` },
      { heading: `Plans at a glance`, body: `Community (£0) — up to 3 tool integrations, read-only AI triage, 1 seat.\nEssentials (£149/seat/mo, min 2 seats) — unlimited tools, full AI Co-Pilot, automation, SLA tracking, BYOK.\nProfessional (£1,199/mo flat, up to 15 analysts) — everything in Essentials plus PDF reports, API, RBAC, compliance mapping, full audit trail.\nEnterprise/MSSP (£3,499/mo, unlimited analysts) — everything in Professional plus multi-tenant portfolio, white-label, per-client BYOK, cross-client AI threat correlation, branded client logins, dedicated account manager.\n\nAll paid plans require a BYOK Anthropic API key — AI costs go direct to your Anthropic account.` },
      { heading: `The three things it does`, body: `1. Ingests alerts from all your connected tools into one unified feed.\n2. Triages every alert with AI — verdict (TP/FP/Suspicious), confidence score, numbered evidence chain, MITRE mapping, hunt queries, and recommended actions. All cached 24h per alert.\n3. Acts automatically (if enabled) — isolating devices, blocking IPs, notifying your team via Slack, and filing audit entries for every action.` },
      { heading: `First 5 minutes`, body: `1. Sign up at getwatchtower.io/signup and select your plan.\n2. Add your Anthropic API key in Settings → General → AI Configuration.\n3. Go to the Tools tab and connect your first integration.\n4. If you are on a self-serve plan, switch from Demo to Live mode using the DEMO/LIVE toggle in the top bar. (Provisioned MSSP client accounts run in the mode configured by your platform administrator and do not have this toggle.)\n5. Your first real alerts will appear within 60 seconds.` },
    ],
  },
  {
    id: 'dashboard', title: 'The Dashboard', icon: '📊',
    items: [
      { heading: `Navigation`, body: `Sidebar on the left (desktop) or bottom navigation bar (mobile). Top bar shows tab labels on desktop. On mobile, top bar collapses to theme toggle and DEMO/LIVE switch — use the bottom nav to change tabs. Admin users see a tier selector dropdown in the top bar to simulate any plan level.` },
      { heading: `Keyboard shortcuts`, body: `Press ? at any time to open the shortcut help overlay. Navigate with G then a letter:\n\nG + O → Overview\nG + A → Alerts\nG + C → Coverage\nG + V → Vulns\nG + I → Intel\nG + N → Incidents\nG + T → Tools\n\nPress Escape to close any overlay. Shortcuts are disabled when a text field is focused.` },
      { heading: `Overview tab`, body: `Your SOC command centre. Shows:\n\n• 5 Hero Stats — Critical Alerts, Total Alerts, Open Cases, Critical Vulns, Posture Score. Clickable, jumping to the relevant tab.\n• AI Threat Level Bar — CRITICAL/HIGH/GUARDED/ELEVATED with specific actions. Co-Pilot and Shift Handover buttons inline.\n• 4-quadrant drill-down — Alerts by Severity, Estate Coverage, Top 5 Vulnerabilities, Active Cases.\n• 7-day Posture Sparkline + Alert Volume Chart.\n• Shift Metrics — Unacked Criticals, SLA Breaches, FPs Auto-Closed, Tools Live.\n\nThe overview is intentionally concise — Emerging Threats and full incident lists live in dedicated Intel and Cases tabs.` },
      { heading: `Alerts tab`, body: `Every alert triaged by AI. Sort, filter by severity or source, or search by title/device/source. Click any alert row to expand full AI reasoning, evidence chain, and actions.\n\nExpanded alert shows (live mode, Essentials+):\n• Structured triage — numbered evidence chain, MITRE tactic/technique/ID, confidence, reasoning\n• Immediate actions — specific steps for this alert\n• Hunt Queries — Splunk SPL, Sentinel KQL, Defender Advanced Hunting auto-generated\n• Blast Radius — appears automatically when you confirm TP. Maps affected users, devices, lateral movement paths, and forensic commands to run.\n\nLive alerts get on-demand triage automatically when expanded. Demo alerts have pre-built enrichment.` },
      { heading: `Incidents tab`, body: `Correlated incidents with AI-generated attack narratives, MITRE ATT&CK kill chains, and full timelines.\n\nExpanded incident shows:\n1. AI Attack Narrative — one-paragraph situational summary.\n2. Attack Timeline — chronological log of AI and analyst actions.\n3. Deep Investigate button (Essentials+) — runs a full Tier 2/3 AI investigation covering:\n   • Root cause analysis\n   • Attacker objective\n   • Reconstructed attack timeline\n   • Lateral movement paths\n   • Remediation plan (Critical/High/Medium priority with owner)\n   • Forensic commands per tool with copy buttons\n   • Extracted IOCs\n   • Detection gaps found` },
      { heading: `Coverage tab`, body: `Estate coverage shows every device in your environment with agent/scan status.\n\nOS Breakdown — grouped by exact OS version: Windows 10, Windows 11, Windows Server 2022, Ubuntu 22.04, RHEL 9, macOS 14, etc. Each version shows a bar with device count and percentage. Only Windows, Linux, and macOS device types are counted — network gear, printers and IoT excluded automatically.\n\nPer-tool coverage bars — see what percentage of your estate each connected tool covers. Filter the gap list by tool.\n\nDevices with Gaps — the list of hosts visible to Tenable or MDM but missing expected agent coverage. Export as CSV. Red left border = stale (7+ days), amber = 3-7 days, green = recently seen.\n\nData sources: Tenable /workbenches/assets (30-day window), Taegis endpointsQuery, Intune/Axonius/Tanium/Huntress device records.` },
      { heading: `Tools tab`, body: `Connect and manage all integrations. Click a tool to enter credentials, then "Test Connection" to validate before saving.\n\nThe Sync Log shows every sync event in newest-first order — timestamp, tool name, record count, duration in ms. Errors show in red.\n\nCredentials are encrypted at rest with AES-256-GCM. Secret fields are never returned to the browser after saving.` },
    ],
  },
  {
    id: 'alerts', title: 'Alert Actions', icon: '🔔',
    items: [
      { heading: `FP / TP verdicts (Essentials+)`, body: `Mark any alert as False Positive or True Positive — via the quick FP/TP buttons on the collapsed card, or the full buttons in the expanded view. Community tier sees the current verdict badge only (read-only as per the pricing tier).\n\nEvery verdict is written to institutional knowledge — Watchtower learns your environment over time and injects recent analyst decisions into the Co-Pilot context automatically.` },
      { heading: `Blast Radius (auto on TP)`, body: `When you mark an alert as TP in live mode, Watchtower automatically calls the blast radius engine. Within ~3 seconds a panel appears showing:\n• Affected users, devices, and services\n• Lateral movement paths from the compromised host\n• Estimated severity (Contained / Expanding / Critical)\n• Forensic commands to run immediately (copy buttons included)\n• Immediate containment steps\n\nNo configuration needed — it fires automatically for every TP confirmation.` },
      { heading: `Acknowledge`, body: `Marks an alert as reviewed without changing the verdict. Acknowledged alerts show a green ACK badge and reduce in opacity. Bulk acknowledge via the select bar.` },
      { heading: `Snooze`, body: `Hides an alert from the feed for 2 hours — ideal during known maintenance windows. Snoozed alerts reappear automatically when the duration expires.` },
      { heading: `Create Incident`, body: `Promote one or more alerts to a formal incident. Select alerts with the checkbox, then click "Create Incident" in the bulk action bar. The incident appears immediately in the Incidents tab with linked alert IDs and a pre-built AI attack narrative.` },
      { heading: 'Hunt Queries', body: 'Click "🔍 Hunt Queries" in any expanded live alert to reveal AI-generated search queries for:\n• Splunk SPL\n• Microsoft Sentinel KQL\n• Defender Advanced Hunting\n\nEach query is pre-filled with the alert\'s device, IP, and IOC context. Copy button on every query.' },
      { heading: `Export CSV`, body: `The "Export CSV" button downloads all currently filtered alerts as a CSV — title, severity, source, device, time, verdict, confidence. All filters apply to the export.` },
    ],
  },
  {
    id: 'live', title: 'Live Mode & Sync', icon: '⚡',
    items: [
      { heading: `Demo vs Live mode`, body: `Demo mode (default) pre-populates the dashboard with realistic data. Safe to show to prospects and stakeholders.\n\nLive mode fetches real alerts from your connected tools every 60 seconds. The first sync runs immediately on switch. Errors show inline next to the sync indicator.\n\nNote: Provisioned MSSP client accounts (created by a platform administrator) have their demo/live mode set by the administrator. The DEMO/LIVE toggle is not shown for these accounts.` },
      { heading: `AI triage on live alerts`, body: `In auto mode (Auto + Notify or Full Auto), APEX proactively triages every incoming live alert on arrival — no analyst interaction required. In Recommend Only mode, triage fires when you expand an alert.

Structured triage includes: verdict, confidence, 4-step evidence chain, MITRE mapping, and hunt queries. Results are cached 24h in Redis — expanding the same alert again is instant. Triage uses your BYOK Anthropic key.` },
      { heading: `Institutional knowledge`, body: `Every FP/TP verdict you confirm is stored per-tenant (last 100 decisions). The Co-Pilot injects the last 25 analyst decisions as context on every call. Over time Watchtower learns your environment — recognising patterns like "Defender ATP alerts from SRV-BACKUP01 are usually FP" without any manual rule-writing.` },
      { heading: `Slack & email notifications`, body: `In Live mode, Watchtower posts to your Slack webhook and sends email when new Critical alerts arrive (Essentials+). Configure in Settings → Notifications. Each notification includes alert title, severity, source, device, AI verdict, and confidence.` },
    ],
  },
  {
    id: 'integrations', title: 'Integrations', icon: '🔌',
    items: [
      { heading: `CrowdStrike Falcon`, body: `Fields: Base URL (https://api.crowdstrike.com), Client ID, Client Secret. Auth: OAuth2 client credentials. Fetches detections with severity ≥ medium from the last 7 days.` },
      { heading: `Microsoft Defender for Endpoint`, body: `Fields: Tenant ID, Client ID, Client Secret. Auth: Azure AD OAuth2. Fetches high/medium alerts.` },
      { heading: `Microsoft Sentinel`, body: `Fields: Tenant ID, Client ID, Client Secret, Subscription ID, Resource Group, Workspace Name. Auth: Azure AD OAuth2. Fetches incidents via Sentinel REST API.` },
      { heading: `Splunk`, body: `Fields: Host (https://splunk.company.com:8089), Token. Runs a saved search for high/critical alerts from the last 7 days.` },
      { heading: `Taegis XDR (Secureworks)`, body: `Fields: Client ID, Client Secret, Region (us1/us2/eu). Auth: OAuth2. Fetches high/critical alerts.` },
      { heading: `Tenable`, body: `Fields: Access Key, Secret Key. Fetches vulnerability plugins grouped by severity from the last 30 days. Provides the coverage and vuln data for the dashboard.` },
      { heading: `Anthropic (AI)`, body: `Your BYOK key is stored encrypted per-tenant. All AI calls (Co-Pilot, structured triage, blast radius, deep investigation, hunt queries) use your key. AI costs are billed direct to your Anthropic account — no AI markup from Watchtower.` },
    ],
  },
  {
    id: 'automation', title: 'Automation', icon: '🤖',
    items: [
      { heading: `Three levels (Essentials+)`, body: `0 — Recommend Only: AI triages and suggests, but takes no action. Analysts make all decisions.\n1 — Auto + Notify: AI auto-closes high-confidence FPs (≥90%) and sends Slack notification. All TP alerts still require analyst action.\n2 — Full Auto: In addition to Auto+Notify, AI isolates devices and logs to audit for confirmed Critical TPs with ≥80% confidence.` },
      { heading: `Auto-closed badge`, body: `When the automation slider closes a FP, the alert card shows a green "AI CLOSED" badge. The automation banner in the header shows a count of AI-closed FPs in the current session.` },
      { heading: `Audit trail`, body: `Every automated action — FP close, device isolation, Slack notification — is written to the audit log with timestamp, action type, alert title, confidence, and automation level. Visible in the Admin Portal → Audit tab.` },
    ],
  },
  {
    id: 'ai', title: 'AI Features', icon: '✦',
    items: [
      { heading: `Evidence Chain (Essentials+)`, body: `Every live alert that expands gets a structured triage result with:\n• Verdict — TP / FP / Suspicious\n• Confidence score (0–100%)\n• Reasoning — 2–3 sentence analytical explanation\n• Evidence Chain — numbered steps showing how the AI reached its verdict (typically 3–4 steps)\n• MITRE ATT&CK mapping — tactic, technique, and ID\n• Immediate Actions — specific steps for this alert type\n\nResults are cached 24h per alert.` },
      { heading: `Blast Radius Analysis (Essentials+)`, body: `Fires automatically when you confirm TP. The AI maps the full impact of the breach:\n• Affected users and accounts\n• Affected devices and services\n• Data stores at risk\n• Lateral movement paths from the compromised host\n• High-risk targets (domain controllers, file servers)\n• Immediate containment actions\n• Forensic commands (PowerShell, CrowdStrike RTR, etc.) with copy buttons\n• Estimated severity: Contained / Expanding / Critical` },
      { heading: `Co-Pilot (Essentials+)`, body: `Security-scoped AI chat in the dashboard sidebar. Ask anything about your live data:\n• "What are my highest risk alerts right now?"\n• "Generate a Splunk query to hunt for C2 from this IP"\n• "Summarise this incident for my CISO"\n• "Explain what T1055 means for this alert"\n\nCo-Pilot receives your full live context — alert list, vulns, open incidents, coverage gaps — automatically. It also learns from your institutional knowledge (last 25 analyst decisions) to give environment-specific answers.` },
      { heading: `Institutional Knowledge`, body: `Every FP/TP verdict you confirm is stored per-tenant (last 100 decisions, never shared between tenants). The Co-Pilot injects the last 25 automatically on every call.\n\nThis means the longer you use Watchtower, the more accurately it recognises your environment's noise patterns — without any rule-writing or configuration.` },
      { heading: `Deep Investigation (Essentials+)`, body: `Click "✦ Deep Investigate" on any incident to run a full Tier 2/3 analysis. The AI reviews all grouped alerts and returns:\n• Root cause analysis\n• Attacker objective\n• Reconstructed attack timeline (with significance per step)\n• Lateral movement paths\n• Remediation plan — Critical/High/Medium priority actions with owner assignment\n• Forensic commands per tool with copy buttons\n• Extracted IOCs\n• Detection gaps that would have caught this earlier` },
      { heading: `Hunt Query Generator`, body: `Available in two places:\n1. Expanded alert view — "🔍 Hunt Queries" button reveals Splunk SPL, Sentinel KQL, and Defender Advanced Hunting queries auto-generated for that specific alert.\n2. Intel tab — each threat intelligence item with IOCs has a "Generate Hunt Queries" button that creates IOC-specific hunt queries for all three platforms.` },
      { heading: `Shift Handover`, body: `Click "⇄ Handover" in the AI Threat Brief section. The AI generates a brief covering:\n• Alerts triaged this shift\n• Critical alerts still open\n• Incidents escalated vs closed\n• Posture score at handover\n• Top threat requiring attention\n\nGenerated from live data. Paste into Slack or Teams.` },
    ],
  },
  {
    id: 'admin', title: 'Admin Portal', icon: '🔑',
    items: [
      { heading: `Accessing admin`, body: `The Admin Portal tab appears only for admin-flagged accounts. It is never visible to standard analysts. Admin accounts bypass all tier gates — every feature is permanently unlocked regardless of the subscription tier set in the system.` },
      { heading: `Audit Log tab`, body: `Shows the last 100 analyst actions: FP/TP verdicts, incident status changes, auto-closed FPs, auto-response actions. Each entry shows: type (colour-coded), verdict, analyst name, timestamp, and affected alert/incident title. Useful for compliance reviews and shift accountability.` },
      { heading: `AI Action Log tab`, body: `Every AI call made under your tenant — prompt preview, model used, duration, alert/vuln linked, and whether the call succeeded. Useful for monitoring API key usage and debugging triage failures.` },
      { heading: `Users & invites`, body: `Invite team members by email. Assign roles: Owner, Tech Admin, Sales, Viewer. Each role has different tab access — Viewers see read-only alert feed; Sales sees the Sales Dashboard; Tech Admins can connect tools.` },
      { heading: `Tier selector`, body: `The admin top bar shows a tier dropdown (Community / Essentials / Professional / Enterprise). Use this to simulate any plan to test tier gates and UI behaviour without changing the actual subscription.` },
    ],
  },
  {
    id: 'mssp', title: 'MSSP Features', icon: '🏢',
    items: [
      { heading: `Enterprise / MSSP plan`, body: `The £3,499/mo plan includes unlimited analysts, unlimited client tenants, white-label branding, per-client BYOK isolation, cross-client AI threat correlation, automated weekly client reports, and branded login pages. Designed for MSSPs managing 5–50+ clients from one console.` },
      { heading: `Portfolio view`, body: `The MSSP Portfolio tab shows every client tenant in a grid: posture score, critical alert count, open cases, tool count, and last-synced timestamp. Click any client to switch context to that tenant. Revenue tracking and MRR targets are visible in the Sales Dashboard.` },
      { heading: `White-label branding`, body: `Set a custom organisation name, primary colour, and tagline for each client. Changes take effect immediately across all pages when the client accesses their branded login URL.` },
      { heading: `Branded client logins`, body: `Each client gets a login URL at /login/[slug]. The slug maps to a tenant ID stored in Redis — add new clients without a code deploy via the MSSP dashboard. Branding is loaded dynamically from your white-label settings for that tenant.` },
      { heading: `Per-client BYOK isolation`, body: `Each client tenant stores its own Anthropic API key, encrypted separately. AI calls for Client A never touch Client B's key or data. Complete isolation required for regulated industries.` },
      { heading: `Cross-client AI correlation`, body: `After each live sync, Watchtower posts IOCs (device hostnames, CVEs) from that client to the cross-tenant correlation engine. If the same IOC appears in multiple client environments, a correlation finding is generated — letting you identify campaigns targeting multiple clients simultaneously.` },
      { heading: `Automated weekly reports`, body: `Every Monday at 08:00 UTC, the cron job generates an AI executive summary for each client and emails it to their configured address. Reports cover: alert volume, threat severity distribution, posture score, SLA performance, and top risks. Branded with client colours.` },
    ],
  },
  {
    id: 'security', title: 'Security', icon: '🔐',
    items: [
      { heading: `BYOK credential model`, body: `Your Anthropic API key is stored encrypted with AES-256-GCM, per-tenant in Redis. It is only decrypted server-side immediately before an AI API call. The decrypted key is never logged, cached in memory longer than the request lifetime, or returned to the browser.` },
      { heading: `Tool credentials`, body: `All integration credentials (API keys, OAuth tokens, secrets) are stored encrypted at rest. Secret fields are write-only — entering a new value replaces the old one; the existing value is never returned to the browser.` },
      { heading: `Session security`, body: `Sessions use signed cookies (WATCHTOWER_SESSION_SECRET). All session tokens are HttpOnly and Secure. Admin status is injected by middleware from the verified session cookie on every API request — it cannot be spoofed by a client-supplied header.` },
      { heading: `TOTP / 2FA`, body: `Two-factor authentication via TOTP (Google Authenticator, Authy, 1Password, etc.) is supported for all accounts.\n\nSelf-serve accounts: enable in Settings → Security. After enabling, every login requires the 6-digit code.\n\nProvisioned MSSP client accounts: MFA enrollment is mandatory. On first login you will be redirected to /setup-2fa automatically. Scan the QR code with your authenticator app, enter the 6-digit code to confirm, then proceed to the dashboard. Every subsequent login requires the code. If you lose access to your authenticator, contact your platform administrator to reset MFA for your account.` },
    ],
  },
  {
    id: 'settings', title: 'Settings', icon: '⚙️',
    items: [
      { heading: `AI Configuration`, body: `Add your Anthropic API key here. The key is stored encrypted per-tenant. Test the connection with the "Test AI" button — it makes a live call to Claude and confirms the response.` },
      { heading: `Notifications`, body: `Configure Slack webhook URL and email address for critical alert notifications. Toggle the weekly digest on/off. Notifications only fire in Live mode.` },
      { heading: `API Keys`, body: `Generate, list, and revoke named API keys for programmatic access to the Watchtower API. Each key shows its creation date, last-used date, and can be revoked instantly. Professional+ plan.` },
    ],
  },,
  {
    id: 'mobile', title: 'Mobile & PWA', icon: '📱',
    items: [
      { heading: `Android install`, body: `Open getwatchtower.io in Chrome on Android → ⋮ menu → Add to Home Screen → Add. Opens in standalone mode like a native app with offline fallback.` },
      { heading: `Mobile navigation`, body: `Under 640px the top tab bar collapses. A bottom nav bar shows Overview, Alerts, Cases, Tools, Settings. The ⋯ More button reveals remaining tabs.` },
      { heading: `Digital font toggle`, body: `The 01 button in the topbar switches the dashboard to JetBrains Mono terminal font. Persisted in localStorage.` },
      { heading: `Offline mode`, body: `The service worker caches the dashboard shell on first load. An /offline fallback page shows when a page was never cached.` },
    ],
  },
  {
    id: 'ot', title: 'OT / ICS Add-on', icon: '🏭',
    items: [
      { heading: `Overview`, body: `The OT/ICS add-on is a licensable extension for MSSPs serving operational technology clients. Enabled per-tenant from the Admin Portal. Pricing: £999/mo flat + £1/OT device/mo.` },
      { heading: `Purdue Model Map`, body: `Interactive zone diagram showing L0 Field Devices, L1 Controllers, L2 SCADA, L3 MES, L3.5 DMZ, and L4 IT. Click any zone to see its assets and active alerts. Anomalous cross-zone traffic (e.g. IT bypassing DMZ to reach SCADA) is highlighted in red.` },
      { heading: `OT Asset Inventory`, body: `Separate from IT Coverage. Shows PLCs, RTUs, HMIs, SCADA servers, historians, field sensors — with vendor, model, firmware, protocols, CVE count, and status (online/degraded/compromised/offline).` },
      { heading: `OT-Safe APEX Triage`, body: `APEX operates under strict OT safety constraints when triaging OT alerts:\n\n• Never recommends isolating a live process device\n• Never auto-closes OT alerts as false positives\n• Always recommends notifying the plant/process engineer before any action\n• Returns otSafeActions (what to do) and otUnsafeActions (what not to do)\n• Severity is downgraded for devices in safe/monitored Purdue zones` },
      { heading: `Enabling per client`, body: `In the Admin Portal, the OT Add-on panel shows toggle + device limit input. Toggle to enable — this activates the OT tab for that tenant. Set the device count to calculate the monthly cost (£999 + £1 × devices).` },
    ],
  }
];

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = search.length > 1
    ? SECTIONS.map(s => ({ ...s, items: s.items.filter(i => i.heading.toLowerCase().includes(search.toLowerCase()) || i.body.toLowerCase().includes(search.toLowerCase())) })).filter(s => s.items.length > 0)
    : SECTIONS;

  const currentSection = filtered.find(s => s.id === activeSection) || filtered[0];

  return (
    <div style={{ minHeight: '100vh', background: '#090d18', color: '#e8ecf4', fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #1d2535', background: '#0c1122', gap: 12, flexWrap: 'wrap' }}>
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit', flexShrink: 0 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="url(#gg)"/>
            <path d="M14 5.5L22 9V15.5C22 19.5 18.5 23 14 24.5C9.5 23 6 19.5 6 15.5V9L14 5.5Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7"/>
            <path d="M11.5 14.5L13.5 16.5L17.5 12" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="gg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
          </svg>
          <span style={{ fontWeight: 800, fontSize: '0.96rem' }}>Watchtower</span>
        </a>
        <span style={{ color: '#2a3448', margin: '0 4px' }}>/</span>
        <span style={{ fontSize: '0.86rem', color: '#6b7a94', fontWeight: 600 }}>User Guide</span>
        <input placeholder="Search guide…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, border: '1px solid #1d2535', background: '#131929', color: '#e8ecf4', fontSize: '0.8rem', fontFamily: 'Inter,sans-serif', outline: 'none', width: 200 }} />
        <a href="/dashboard" style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #1d2535', borderRadius: 8, color: '#6b7a94', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>← Dashboard</a>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 220, background: '#0c1122', borderRight: '1px solid #1d2535', padding: '16px 0', flexShrink: 0, overflowY: 'auto' }}>
          {(search.length > 1 ? filtered : SECTIONS).map(s => (
            <button key={s.id} onClick={() => { setActiveSection(s.id); setSearch(''); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: activeSection === s.id ? '#4f8fff14' : 'transparent', border: 'none', borderLeft: `2px solid ${activeSection === s.id ? '#4f8fff' : 'transparent'}`, color: activeSection === s.id ? '#4f8fff' : '#7a8aa4', fontSize: '0.78rem', fontWeight: activeSection === s.id ? 700 : 500, cursor: 'pointer', fontFamily: 'Inter,sans-serif', textAlign: 'left', transition: 'all .12s' }}>
              <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{s.icon}</span>{s.title}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', maxWidth: 860 }}>
          {search.length > 1 ? (
            filtered.length === 0 ? (
              <div style={{ color: '#4a5568', fontSize: '0.84rem', padding: '32px 0' }}>No results for "{search}"</div>
            ) : filtered.map(s => (
              <div key={s.id} style={{ marginBottom: 32 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4f8fff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>{s.icon} {s.title}</div>
                {s.items.map(item => (
                  <div key={item.heading} style={{ marginBottom: 10, padding: '14px 16px', background: '#131929', border: '1px solid #1d2535', borderRadius: 10 }}>
                    <h2 style={{ fontSize: '0.86rem', fontWeight: 700, marginBottom: 8, color: '#e8ecf4' }}>{item.heading}</h2>
                    <p style={{ fontSize: '0.8rem', color: '#96a6bc', lineHeight: 1.8, whiteSpace: 'pre-line', margin: 0 }}>{item.body}</p>
                  </div>
                ))}
              </div>
            ))
          ) : currentSection ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>{currentSection.icon} {currentSection.title}</h1>
                <div style={{ height: 1, background: '#1d2535', marginTop: 16 }} />
              </div>
              {currentSection.items.map(item => {
                const key = currentSection.id + item.heading;
                const expanded = expandedItem === key;
                return (
                  <div key={key} style={{ marginBottom: 8, background: '#131929', border: `1px solid ${expanded ? '#4f8fff30' : '#1d2535'}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color .15s' }}>
                    <button onClick={() => setExpandedItem(expanded ? null : key)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'transparent', border: 'none', color: '#e8ecf4', cursor: 'pointer', fontFamily: 'Inter,sans-serif', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>{item.heading}</span>
                      <span style={{ fontSize: '0.7rem', color: '#4a5568', flexShrink: 0, marginLeft: 12 }}>{expanded ? '▲' : '▼'}</span>
                    </button>
                    {expanded && (
                      <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid #1d2535' }}>
                        <p style={{ fontSize: '0.82rem', color: '#96a6bc', lineHeight: 1.85, whiteSpace: 'pre-line', marginTop: 12, marginBottom: 0 }}>{item.body}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
