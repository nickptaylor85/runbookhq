'use client';
import React, { useState } from 'react';

const SECTIONS = [
  {
    id: 'getting-started', title: 'Getting Started', icon: '🚀',
    items: [
      { heading: 'What is Watchtower?', body: 'Watchtower is your AI-powered SOC in a single screen. It connects to all your security tools, ingests every alert, triages them with Claude AI in under 3.2 seconds, and takes automated action where you allow it. Your analysts arrive to a clean queue — threats contained, noise eliminated.' },
      { heading: 'Who is it for?', body: 'Security teams of all sizes. Solo analysts who need AI assistance. Mid-market teams replacing a 6-tab workflow. Enterprise SOCs wanting automation. MSSPs managing multiple client environments from one console. Each use case has a plan tier — from Community (free) to MSSP (£799/mo + per-client fee).' },
      { heading: 'The three things it does', body: '1. Ingests alerts from all your connected tools into one unified feed.\n2. Triages every alert with AI — returning a verdict (TP/FP/Suspicious), confidence score, evidence chain, and recommended actions.\n3. Acts automatically (if enabled) — isolating devices, blocking IPs, disabling accounts, notifying your team via Slack.' },
      { heading: 'First 5 minutes', body: '1. Sign up at getwatchtower.io/signup and select your plan.\n2. Add your Anthropic API key in Settings → General → AI Configuration.\n3. Go to the Tools tab and connect your first integration.\n4. Switch from Demo to Live mode using the toggle in the top bar.\n5. Your first real alerts will appear within 60 seconds.' },
    ],
  },
  {
    id: 'dashboard', title: 'The Dashboard', icon: '📊',
    items: [
      { heading: 'Navigation', body: 'The dashboard has a sidebar on the left (desktop) or a bottom navigation bar (mobile) with icon shortcuts to each tab. The top bar shows tab labels on desktop. On mobile, the top bar collapses to just theme toggle and DEMO/LIVE switch — use the bottom nav to change tabs.' },
      { heading: 'Keyboard shortcuts', body: 'Press ? at any time to open the shortcut help overlay. Navigate with G then a letter:\n\nG + O → Overview\nG + A → Alerts\nG + C → Coverage\nG + V → Vulns\nG + I → Intel\nG + N → Incidents\nG + T → Tools\nG + S → Sales\n\nPress Escape to close any overlay. Shortcuts are disabled when a text field is focused.' },
      { heading: 'Overview tab', body: 'Your SOC command centre. Shows:\n\n• 5 Hero Stats — Critical Alerts, Total Alerts, Open Cases, Critical Vulns, Posture Score. Each number is large, colour-coded, and clickable — tap any stat to jump directly to the relevant tab.\n• AI Threat Brief — a one-paragraph situational summary wired to live data. Names the top critical alert, coverage %, KEV count, posture score. Open Co-Pilot → button launches the AI chat.\n• 4-quadrant drill-down grid — Alerts by Severity (bar chart), Estate Coverage (% + gap device list), Top 5 Vulnerabilities (with KEV badges), Active Cases + Tool Health. All cards are clickable.\n• 7-day Posture Sparkline — SVG trend line with area fill.\n• Hot Assets panel — bar chart of which devices have the most alerts. Instantly see if one host is generating all the noise.\n• Shift Metrics panel — Unacked Criticals, SLA Breaches, FPs Auto-Closed, Tools Live. Everything you check at shift start or handover.' },
      { heading: 'Security posture gauge', body: 'A 0–100 score calculated from four factors: coverage percentage, critical alert count, unpatched KEV vulnerabilities, and false positive rate. The 7-day sparkline below the gauge shows your trajectory — upward is good, a downward trend means you should address open criticals or coverage gaps.' },
      { heading: 'Alerts tab', body: 'Every alert triaged by AI. Sort, filter by severity or source, or search by title/device/source. Click any alert row to expand full AI reasoning, evidence chain, and actions taken.\n\nEach collapsed alert card shows:\n• Relative time ("2h ago") — fresh alerts (<15 min) get a green NEW badge\n• Hot device indicator (🔥 N) — if a device has 3+ alerts, flagged inline\n• FP / TP quick-action buttons — no expand needed, tap to set verdict immediately\n• ACK / note / snoozed badges\n• AI verdict badge (AI: True Positive etc.) after live triage completes\n\nLive alerts get on-demand triage automatically when expanded. Demo alerts have pre-built enrichment.\n\nUnacknowledged criticals show a pulsing red counter in the tab header.' },
      { heading: 'Coverage tab', body: 'Shows which devices are covered by which tools, and which are unmonitored blind spots. Each gap device is colour-coded by how recently it was seen:\n\n🟢 Recent (today/yesterday)\n🟡 2–3 days ago\n🟠 4–7 days ago\n🔴 Stale — over 7 days (likely an agent failure)\n\nThe left-border colour and inline badge tell you at a glance which devices need urgent attention.' },
      { heading: 'Vulns tab', body: 'Top vulnerabilities ranked by severity × prevalence. CISA KEV badges mean the CVE is actively exploited in the wild — treat these as 72-hour deadlines. Click any vuln for AI-generated Splunk SPL, Sentinel KQL, and Defender hunting queries tailored to your stack.' },
      { heading: 'Intel tab', body: 'Live threat intelligence filtered to your industry. Select your sector from the dropdown to get AI-curated intel. Use the IOC search to generate hunt queries across Splunk, Sentinel, and Defender for any specific indicator.' },
      { heading: 'Incidents tab', body: 'Correlated incidents with AI-generated attack narratives, MITRE ATT&CK kill chains, full timelines, and affected devices.\n\nEach collapsed incident row shows:\n• ID, status badge, severity badge\n• Alert count and device count\n• SLA countdown inline — "SLA 2h 15m remaining" (amber) or "SLA breached 45m ago" (red). No expand needed to see SLA status. Thresholds: Critical=1h, High=4h, Medium=24h.\n\nExpand any incident for the AI attack narrative, timeline, notes, and action buttons (Escalate / Close / Delete).\n\nThe "View source alerts →" button inside any expanded incident jumps to the Alerts tab with those exact source alerts expanded.' },
      { heading: 'Tools tab', body: 'Connect and manage all integrations. Click "+ Connect" on any tool, enter credentials, and hit "Test Connection" to validate before saving. You can also save without testing if you know the credentials are correct.\n\nCredentials are encrypted at rest with AES-256-GCM. Secret fields are never returned to the browser after saving.' },
    ],
  },
  {
    id: 'alerts', title: 'Alert Actions', icon: '🔔',
    items: [
      { heading: 'Mark FP (False Positive)', body: 'Click "Mark FP" in any expanded alert — individually, or bulk-select multiple and use the bulk action bar at the top. The alert verdict immediately changes to FP, the card dims and strikes through, and the FP count updates in the Overview stat card.' },
      { heading: 'Acknowledge', body: 'Click "Acknowledge" in any expanded alert to mark it as reviewed without changing the verdict. Acknowledged alerts show a green ACK badge, reduce in opacity, and the title strikes through. Click "✓ Acknowledged" again to un-acknowledge. Bulk acknowledge via the select bar.' },
      { heading: 'Snooze', body: 'Snooze an alert to temporarily hide it from the feed — ideal during known maintenance windows or expected noise periods. Snoozed alerts disappear from the filtered list until the snooze duration expires, then reappear automatically. Available per-alert in the expanded action row.' },
      { heading: 'Create Incident', body: 'Promote one or more alerts to a formal incident. Select alerts with the checkbox, then click "Create Incident" in the bulk action bar — or click "Create Incident" inside any individual expanded alert. The new incident appears immediately in the Incidents tab, with the source alert IDs linked.' },
      { heading: 'Alert notes', body: 'Add analyst notes to any alert via the expanded detail view. Notes are session-persisted and marked with an orange "note" badge on the collapsed card. Useful for recording investigation steps or hypotheses during triage.' },
      { heading: 'Sort and filter', body: 'Sort by: Newest first, Oldest first, Severity high→low, Severity low→high, Source A–Z.\n\nFilter by: severity (Critical/High/Medium/Low), source tool, or free-text search across title, device, and source. All filters combine — e.g. "Critical alerts from CrowdStrike containing DC01". Click Clear to reset all filters at once.' },
      { heading: 'Export CSV', body: 'The "Export CSV" button in the Alerts tab header downloads all currently filtered alerts as a CSV file — title, severity, source, device, time, verdict, confidence. Useful for external ticketing or management reporting.' },
    ],
  },
  {
    id: 'live', title: 'Live Mode & Sync', icon: '⚡',
    items: [
      { heading: 'Demo vs Live mode', body: 'Demo mode (default) pre-populates the dashboard with realistic data from all 18 supported tools. Safe to show to prospects and stakeholders.\n\nLive mode fetches real alerts from your connected tools every 60 seconds. The first sync runs immediately on switch. A "Syncing…" spinner appears during fetch; errors show inline so you know exactly which integration is having issues.' },
      { heading: 'Live alert AI triage', body: 'When you expand a live alert that has no pre-built enrichment, AI triage fires automatically using your Anthropic API key. A loading spinner shows while Claude analyses the alert. The result is cached for the session — expanding the same alert again is instant.' },
      { heading: 'Slack notifications', body: 'In Live mode, Watchtower automatically posts to your configured Slack webhook when new Critical alerts arrive. Set your Incoming Webhook URL in Settings → Notifications. Each notification includes the alert title, severity, source tool, device, AI verdict, and confidence score.' },
      { heading: 'Sync errors', body: 'If a tool sync fails, the error appears inline next to the sync indicator in the top bar. Common causes: expired credentials, rate limiting by the source tool, or network connectivity issues. Re-enter credentials in the Tools tab to resolve.' },
    ],
  },
  {
    id: 'integrations', title: 'Integrations', icon: '🔌',
    items: [
      { heading: 'CrowdStrike Falcon', body: 'Fields: Base URL (https://api.crowdstrike.com), Client ID, Client Secret. Auth: OAuth2 client credentials. Fetches detections with severity ≥ medium from the last 7 days.' },
      { heading: 'Microsoft Defender for Endpoint', body: 'Fields: Tenant ID, Client ID, Client Secret. Auth: Azure AD OAuth2 (api.securitycenter.microsoft.com). Fetches high/medium alerts ordered by creation time.' },
      { heading: 'Microsoft Sentinel', body: 'Fields: Tenant ID, Client ID, Client Secret, Subscription ID, Resource Group, Workspace Name. Auth: Azure AD OAuth2. Fetches incidents via Sentinel REST API.' },
      { heading: 'Splunk', body: 'Fields: Host (https://splunk.company.com:8089), Token (HEC/REST API token). Runs a saved search for high/critical alerts from the last 7 days.' },
      { heading: 'Secureworks Taegis XDR', body: 'Fields: Client ID, Client Secret, Region (us1/eu1/us2). Auth: OAuth2 client credentials to api.ctpx.secureworks.com. Fetches open alerts via GraphQL with severity >= 0.6 (Taegis uses a 0.0–1.0 float scale: >=0.9=Critical, >=0.7=High, >=0.4=Medium).' },
      { heading: 'SentinelOne', body: 'Fields: Management URL (https://your-tenant.sentinelone.net), API Token. Auth: ApiToken header. Fetches threats from the last 7 days.' },
      { heading: 'Darktrace', body: 'Fields: Hostname, Public Token, Private Token. Auth: HMAC-SHA1 signature per request (auto-computed). Fetches model breaches with score ≥ 0.5.' },
      { heading: 'Elastic Security', body: 'Fields: Kibana URL, API Key (base64), Space ID (optional). Auth: ApiKey header. Fetches open detection signals.' },
      { heading: 'IBM QRadar', body: 'Fields: QRadar Host, SEC Token (UUID format). Auth: SEC header. Fetches offenses via SIEM REST API v14.' },
      { heading: 'Tenable.io', body: 'Fields: Access Key, Secret Key. Auth: X-ApiKeys header. Fetches High and Critical vulnerabilities from the last 90 days via /workbenches/vulnerabilities. Per-asset hostnames fetched via /workbenches/vulnerabilities/{id}/outputs in parallel. Note: the severity filter uses string values (High, Critical) per the Tenable API spec — not integers.' },
      { heading: 'Nessus', body: 'Fields: Host (https://nessus.company.com:8834), Access Key, Secret Key. Auth: X-ApiKeys header. Fetches completed scan results.' },
      { heading: 'Carbon Black Cloud', body: 'Fields: CB Cloud URL, Org Key, API ID, API Secret Key. Auth: X-Auth-Token. Fetches alerts with severity ≥ 3.' },
      { heading: 'Zscaler', body: 'Fields: Cloud URL, Username, Password, API Key. Auth: obfuscated API key + session cookie. Fetches audit log events (BLOCK, CAUTION actions).' },
      { heading: 'Okta', body: 'Fields: Domain (https://company.okta.com), API Token. Auth: SSWS token header. Fetches system log events for suspicious authentication activity.' },
      { heading: 'Proofpoint', body: 'Fields: Service Principal, Secret. Auth: Basic auth. Fetches SIEM API events for clicked/blocked threats.' },
      { heading: 'Mimecast', body: 'Fields: Base URL, Client ID, Client Secret. Auth: OAuth2. Fetches SIEM threat intelligence logs.' },
      { heading: 'Qualys VMDR', body: 'Fields: Platform URL, Username, Password. Auth: Basic auth with X-Requested-With header. Fetches high/critical vulnerabilities.' },
      { heading: 'Wiz', body: 'Fields: Client ID, Client Secret. Auth: OAuth2 (auth.app.wiz.io). Fetches critical/high issues from the last 7 days via GraphQL.' },
    ],
  },
  {
    id: 'automation', title: 'Automation', icon: '🤖',
    items: [
      { heading: 'Three automation levels', body: 'Recommend Only — AI triages and suggests, no action taken. Analysts review everything.\n\nAuto + Notify — AI acts on high-confidence verdicts (>90%) and sends a Slack notification to your configured webhook.\n\nFull Auto — AI acts on all high-confidence verdicts autonomously. Recommended only after validating AI accuracy on your environment for 30+ days.' },
      { heading: 'What "acting" means', body: 'Depending on which tools you have connected and the alert type, automated actions include: isolating a device via CrowdStrike/SentinelOne/Carbon Black, blocking an IP via Zscaler, disabling a user account via Okta/Azure AD, and sending a Slack notification to your webhook.' },
      { heading: 'Audit trail', body: 'Every automated action is logged with a timestamp, the AI confidence score that triggered it, and a one-click revert option. Nothing happens silently — every action is visible in the incident timeline.' },
    ],
  },
  {
    id: 'ai', title: 'AI Features', icon: '✦',
    items: [
      { heading: 'AI Triage', body: 'Every alert gets a verdict (True Positive / False Positive / Suspicious), confidence score (0–100%), reasoning paragraph, evidence chain (3–5 factors), and recommended actions. Demo alerts have pre-built enrichment. Live alerts are triaged on-demand by Claude when you expand them.' },
      { heading: 'AI Co-Pilot', body: 'The chat-style assistant wired to your live dashboard data. Available on Team plan and above.\n\nEvery message automatically includes a live snapshot of your current security environment:\n• Up to 15 active alerts with title, severity, source, device, verdict, MITRE tactic\n• Top 8 vulnerabilities with CVE, severity, device\n• All open cases with status\n• Estate coverage % and unmonitored devices\n• Connected tools and last sync time\n\nThis means you can ask:\n"What is my biggest threat right now?" → AI names the actual critical alert\n"Which device is most at risk?" → Cross-references alerts + vulns on the same host\n"Summarise for shift handover" → Uses real alert/incident state\n"What should I prioritise?" → Weighs criticals, KEV vulns, SLA breaches\n\nConversation history is sent with each message (last 6 exchanges) so follow-up questions work correctly.' },
      { heading: 'AI Remediation Queries', body: 'From the Vulns tab — click any vulnerability and hit "Splunk SPL", "Sentinel KQL", or "Defender Advanced Hunting" to get production-ready detection queries generated fresh by AI each time, incorporating your estate context.' },
      { heading: 'AI Intel', body: 'From the Intel tab — select your industry to get AI-curated threat intelligence for your sector. Click any intel item and use the IOC search buttons to generate hunt queries for specific indicators across your connected tools.' },
      { heading: 'Sales Dashboard AI', body: 'Set a revenue target and Claude generates a full go-to-market strategy: ideal customer profile, acquisition channels, conversion tactics, and realistic timelines based on your current metrics and the gap to close.' },
      { heading: 'PDF Security Report', body: 'Available on Business+ plans. Click "📄 Report" in the dashboard top bar to generate a formatted security report — top 10 alerts, posture summary, KEV patch status, and coverage gaps — and print or save to PDF directly from your browser.' },
      { heading: 'BYOK (Bring Your Own Key)', body: 'Team, Business, and MSSP plans require a Bring Your Own Key Anthropic API key. Add it in Settings → General → AI Configuration. Your key is encrypted at rest and your AI usage is billed directly to your Anthropic account — Watchtower never sees your token costs.\n\nGet a key at console.anthropic.com.' },
    ],
  },
  {
    id: 'admin', title: 'Admin Portal', icon: '🔧',
    items: [
      { heading: 'Accessing the Admin Portal', body: 'Visible only to the platform owner (credentials set via Vercel env vars: WATCHTOWER_ADMIN_EMAIL and WATCHTOWER_ADMIN_PASS). Click the "🔧 Admin" tab in the top nav or sidebar. Five views: Subscribers, Users, Platform, Stripe, and Broadcast.' },
      { heading: 'Subscribers view', body: 'Every organisation subscribed to Watchtower. Filter by plan and status. Click "Impersonate →" on any subscriber to enter their dashboard context and see exactly what they see. Use the £ Chase button on overdue accounts.' },
      { heading: 'Users / Roles management', body: 'Invite and manage internal staff accounts. Three roles:\n\nTech Admin — full access: all customer adds/moves/changes, tool integrations, settings, all dashboard tabs.\n\nSales — read-only security tabs + full Sales Dashboard access.\n\nViewer — Overview, Alerts, Coverage, Vulns, Intel, Incidents only. Read-only.' },
      { heading: 'Inviting a user', body: '1. Go to Admin → Users tab.\n2. Enter name, email, and role.\n3. Click "Send Invite" — an email is sent with a secure invite link (valid 48 hours).\n4. They click the link, set their password, and are immediately active.\n5. Status shows "Pending" until accepted. You can resend if needed.' },
      { heading: 'Platform health view', body: 'API call volume, AI token usage, Redis performance, uptime metrics, active sessions, sync errors, new signups, and churn — all at a glance.' },
      { heading: 'Stripe configuration', body: 'Set up payment processing from Admin → Stripe. Enter your Publishable Key, Secret Key, Webhook Secret, and Price IDs for each plan. All keys are encrypted at rest. The webhook endpoint to configure in Stripe is shown inline.' },
      { heading: 'Broadcast messages', body: 'Send a dismissable banner to all logged-in users simultaneously — for maintenance notices, security advisories, or announcements. You can also target a specific subscriber.' },
    ],
  },
  {
    id: 'mssp', title: 'MSSP Features', icon: '🏢',
    items: [
      { heading: 'Portfolio view', body: 'The Portfolio tab (MSSP plan only) shows all your managed clients. Three views: Security (posture, alerts, incidents), Revenue (MRR, renewals, billing status), Usage (alerts processed, AI closures, tools connected). Expand any client to navigate directly into their alerts, incidents, or vuln tabs.' },
      { heading: 'Tenant switching', body: 'Click "View →" on any client to enter their dashboard context. Everything updates to reflect their data only — alerts, vulns, incidents, tools, posture. The client name appears in the top bar. Click your own name to return to your primary context.' },
      { heading: 'Per-client BYOK', body: 'Each client brings their own Anthropic API key. Add it in their context via Tools → AI Engine. Their AI calls are billed directly to their Anthropic account, completely isolated from other clients and from your own Watchtower usage.' },
      { heading: 'White-label branding', body: 'Upload your logo and brand colours via Admin → Branding. Clients see your brand, not Watchtower\'s. The dashboard title, favicon, and colour scheme all update. The Watchtower name is hidden from client-facing views.' },
      { heading: 'Your margin calculation', body: 'The Portfolio footer always shows your Watchtower subscription cost vs total client MRR. Standard pricing: £799/mo base includes 5 clients. Each additional client: £79/mo.' },
    ],
  },
  {
    id: 'security', title: 'Security', icon: '🔐',
    items: [
      { heading: 'Credential storage', body: 'All tool credentials (API keys, client secrets, tokens) are encrypted with AES-256-GCM before storage in Redis. Credentials are never logged, never returned to the browser after saving, and never included in sync request payloads.' },
      { heading: 'Authentication', body: 'Sessions use HMAC-SHA256 signed tokens. Tokens are stored as httpOnly secure cookies — inaccessible to JavaScript. Sessions expire after 24 hours. The admin password is set via Vercel environment variables, never in code.' },
      { heading: 'Rate limiting', body: 'All AI endpoints are rate-limited via Upstash Redis. Copilot: 20 req/min/user. Sync: 30/min. Test connection: 10/min. Intel: 10/min.' },
      { heading: 'SSRF protection', body: 'All user-supplied URLs are validated against a per-tool allowlist before any server-side fetch. Private IP ranges (10.x, 172.16-31.x, 192.168.x, 127.x) are blocked. Each tool type only connects to its expected domain.' },
      { heading: 'Tenant isolation', body: 'Every API route reads the tenant ID from a middleware-verified session token. Users cannot access other tenants\' data by manipulating cookies — the tenant ID is derived from the authenticated session, not from client-supplied values.' },
      { heading: 'Pen test status', body: 'Current posture: 0 Critical, 0 High, 0 Medium, 1 Low. Admin routes protected with isAdmin check. Credentials masked in GET responses. SSRF validated at route level.' },
    ],
  },
  {
    id: 'settings', title: 'Settings', icon: '⚙️',
    items: [
      { heading: 'General settings', body: 'Theme (dark/light), industry/sector (for threat intel personalisation), default dashboard mode (demo/live), and automation level. All settings persist to Redis and apply across devices.' },
      { heading: 'AI Configuration', body: 'In Settings → General → AI Configuration. Enter your Anthropic API key (sk-ant-...). The key is encrypted immediately on save, tested for validity, and never shown again. Required for Team, Business, and MSSP plans. Get a key at console.anthropic.com.' },
      { heading: 'Slack notifications', body: 'In Settings → Notifications. Enter a Slack Incoming Webhook URL (https://hooks.slack.com/services/...). In Live mode, Watchtower automatically posts when new Critical alerts arrive, including the alert title, source, device, AI verdict, and confidence score.' },
      { heading: 'Notification toggles', body: 'Toggle individual notification types: Critical alerts, New incidents, Weekly digest, Sync errors. Changes save immediately to your user settings.' },
      { heading: 'Environment variables', body: 'Required Vercel env vars:\n\nWATCHTOWER_ENCRYPT_KEY — 64 hex chars (32 bytes) for AES-256\nWATCHTOWER_SESSION_SECRET — 32+ char string for HMAC\nWATCHTOWER_ADMIN_EMAIL — admin login email\nWATCHTOWER_ADMIN_PASS — admin login password\nWATCHTOWER_API_KEY — programmatic API access key\nRESEND_API_KEY — for email delivery\nEMAIL_FROM — sender address\nNEXT_PUBLIC_BASE_URL — your deployment URL\nUPSTASH_REDIS_REST_URL — Upstash Redis endpoint\nUPSTASH_REDIS_REST_TOKEN — Upstash auth token' },
    ],
  },
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
