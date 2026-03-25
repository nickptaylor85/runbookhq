'use client';
import { useState } from 'react';

const SECTIONS = [
  {
    id: 'overview',
    title: '🗺 Overview',
    content: [
      { heading: 'What is Watchtower?', body: 'Watchtower is your AI-powered SOC in a single screen. It connects to all your security tools, ingests every alert, triages them with Claude AI in under 3.2 seconds, and takes automated action where you allow it. Your analysts arrive to a clean queue — threats contained, noise eliminated.' },
      { heading: 'Who is it for?', body: 'Security teams of all sizes. Solo analysts who need AI assistance. Mid-market teams replacing a 6-tab workflow. Enterprise SOCs wanting automation. MSSPs managing multiple client environments from one console. Each use case has a plan tier — from Community (free) to MSSP (£799/mo + per-client fee).' },
      { heading: 'The three things it does', body: '1. Ingests alerts from all your connected tools into one feed.\n2. Triages every alert with AI — returning a verdict (TP/FP/Suspicious), confidence score, evidence chain, and recommended actions.\n3. Acts automatically (if enabled) — isolating devices, blocking IPs, disabling accounts, notifying your team.' },
    ],
  },
  {
    id: 'tabs',
    title: '📊 Dashboard Tabs',
    content: [
      { heading: 'Overview', body: 'Your SOC command centre. Estate health at a glance: devices, tool status, alert counts, and vulnerability summary. The AI Shift Brief at the top summarises overnight activity.' },
      { heading: 'Alerts', body: 'Every alert triaged by AI. Click any alert to expand it — full reasoning, evidence chain, confidence score, and what actions were taken. Live alerts get on-demand AI triage automatically on expansion. Alerts marked "AI acted" have already been responded to.' },
      { heading: 'Coverage', body: 'Shows which devices are covered by which tools, and which are unmonitored blind spots. Click "Deploy Agent" on any gap device. Fixing coverage gaps is one of the highest-value security activities — unmonitored devices are invisible to your detections.' },
      { heading: 'Vulns', body: 'Top vulnerabilities ranked by severity × prevalence. CISA KEV badges mean the CVE is actively exploited in the wild — treat these as 72-hour deadlines. Click any vuln for AI-generated Splunk SPL, Sentinel KQL, and Defender hunting queries tailored to your stack.' },
      { heading: 'Intel', body: 'Live threat intelligence filtered to your industry. Select your sector from the dropdown to get AI-curated intel. Use the IOC search to hunt for specific indicators across Splunk, Sentinel, and Defender.' },
      { heading: 'Incidents', body: 'Correlated incidents with AI-generated attack narratives, MITRE ATT&CK kill chains, full timelines, and affected devices. Close incidents when resolved — this logs the closure time and feeds back into posture scoring.' },
      { heading: 'Tools', body: 'Connect and manage all integrations. Click "+ Connect" on any tool, enter credentials, and hit "Test Connection" before saving. Credentials are encrypted at rest with AES-256-GCM. Secrets are never returned to the browser after saving.' },
      { heading: 'Portfolio (MSSP only)', body: 'Your managed client portfolio. View each client\'s security posture, revenue, and usage. Switch into any client\'s dashboard context with the "View →" button. The footer shows your Watchtower cost vs client MRR margin.' },
      { heading: '📈 Sales (Sales role & Admin)', body: 'Revenue tracking and AI go-to-market planning. Set an MRR or ARR target, see which customer mix fills the gap, and get a Claude-generated GTM strategy with ideal customer profile, acquisition channels, and realistic timelines.' },
      { heading: '🔧 Admin (Admin only)', body: 'Platform management for Watchtower admins. See all subscribers, manage staff users, configure Stripe, monitor platform health, and broadcast messages to all tenants. See the Admin section below for full detail.' },
    ],
  },
  {
    id: 'livemode',
    title: '🔴 Live vs Demo Mode',
    content: [
      { heading: 'Demo mode', body: 'The default view. Pre-populated with realistic data from all 14 supported tools — CrowdStrike, Darktrace, Defender, Splunk, Sentinel, Zscaler, Taegis XDR, Proofpoint, Okta, Elastic, SentinelOne, Carbon Black, Tenable, and QRadar. Safe to show to prospects and stakeholders.' },
      { heading: 'Live mode', body: 'Toggle from the top bar. Watchtower fetches real alerts from your connected tools every 60 seconds. The first sync runs immediately on switch. A "Syncing…" spinner appears during fetch; errors are shown inline per tool so you know exactly which integration is having issues.' },
      { heading: 'Live alert AI triage', body: 'When you expand a live alert that has no pre-built enrichment, AI triage fires automatically. A loading animation appears while Claude analyses the alert context. Result is cached for the session — expanding the same alert again doesn\'t re-call the API.' },
    ],
  },
  {
    id: 'tools',
    title: '🔌 Integrations (all 18)',
    content: [
      { heading: 'CrowdStrike Falcon', body: 'Credential fields: Base URL (e.g. https://api.crowdstrike.com), Client ID, Client Secret. Authentication: OAuth2 client credentials. Fetches detections with severity ≥ medium in the last 7 days.' },
      { heading: 'Microsoft Defender for Endpoint', body: 'Credential fields: Tenant ID, Client ID, Client Secret. Authentication: Azure AD OAuth2 (api.securitycenter.microsoft.com). Fetches high/medium alerts ordered by creation time.' },
      { heading: 'Microsoft Sentinel', body: 'Credential fields: Tenant ID, Client ID, Client Secret, Subscription ID, Resource Group, Workspace Name. Authentication: Azure AD OAuth2. Fetches incidents via Sentinel REST API.' },
      { heading: 'Splunk', body: 'Credential fields: Host (e.g. https://splunk.company.com:8089), Token (Splunk HEC/REST API token). Runs a saved search for high/critical alerts in the last 7 days.' },
      { heading: 'Secureworks Taegis XDR', body: 'Credential fields: Client ID, Client Secret, Region (us1/eu1/us2). Authentication: OAuth2 client credentials. Fetches open alerts with severity ≥ 0.6 via GraphQL. GraphQL endpoint: api.ctpx.secureworks.com (us1) or api.{region}.taegis.secureworks.com.' },
      { heading: 'SentinelOne', body: 'Credential fields: Management URL (e.g. https://your-tenant.sentinelone.net), API Token. Authentication: ApiToken header. Fetches threats from the last 7 days.' },
      { heading: 'Darktrace', body: 'Credential fields: Hostname (e.g. https://darktrace.company.com), Public Token, Private Token. Authentication: HMAC-SHA1 signature per request (implemented automatically). Fetches model breaches with score ≥ 0.5.' },
      { heading: 'Elastic Security', body: 'Credential fields: Kibana URL, API Key (base64), Space ID (optional). Authentication: ApiKey header. Fetches open detection signals.' },
      { heading: 'IBM QRadar', body: 'Credential fields: QRadar Host, SEC Token (UUID format). Authentication: SEC header. Fetches offenses via SIEM REST API v14.' },
      { heading: 'Tenable.io', body: 'Credential fields: Access Key, Secret Key. Authentication: X-ApiKeys header. Fetches high/critical vulnerabilities from the last 7 days via workbenches API.' },
      { heading: 'Nessus', body: 'Credential fields: Host (e.g. https://nessus.company.com:8834), Access Key, Secret Key. Authentication: X-ApiKeys header. Fetches completed scan results.' },
      { heading: 'Carbon Black Cloud', body: 'Credential fields: CB Cloud URL, Org Key, API ID, API Secret Key. Authentication: X-Auth-Token (secret/id format). Fetches alerts with severity ≥ 3.' },
      { heading: 'Zscaler', body: 'Credential fields: Cloud URL, Username, Password, API Key. Authentication: obfuscated API key + session cookie. Fetches audit log events (BLOCK, CAUTION actions).' },
      { heading: 'Okta', body: 'Credential fields: Domain (e.g. https://company.okta.com), API Token. Authentication: SSWS token header. Fetches system log events for suspicious authentication activity.' },
      { heading: 'Proofpoint', body: 'Credential fields: Service Principal, Secret. Authentication: Basic auth. Fetches SIEM API events for clicked/blocked threats.' },
      { heading: 'Mimecast', body: 'Credential fields: Base URL, Client ID, Client Secret. Authentication: OAuth2. Fetches SIEM threat intelligence logs.' },
      { heading: 'Qualys VMDR', body: 'Credential fields: Platform URL, Username, Password. Authentication: Basic auth with X-Requested-With header. Fetches high/critical vulnerabilities.' },
      { heading: 'Wiz', body: 'Credential fields: Client ID, Client Secret. Authentication: OAuth2 (auth.app.wiz.io). Fetches critical/high issues from the last 7 days via GraphQL.' },
    ],
  },
  {
    id: 'automation',
    title: '⚡ Automation',
    content: [
      { heading: 'Three automation levels', body: 'Recommend Only — AI triages and suggests, no action taken. Analysts review everything.\n\nAuto + Notify — AI acts on high-confidence verdicts (>90%) and notifies via Slack/email. Analysts review the rest.\n\nFull Auto — AI acts on all high-confidence verdicts autonomously. Recommended only after validating AI accuracy on your environment for 30+ days.' },
      { heading: 'What "acting" means', body: 'Depending on which tools you have connected and the alert type, automated actions include: isolating a device via CrowdStrike/SentinelOne/Carbon Black, blocking an IP via Zscaler, disabling a user account via Okta/Azure AD, and creating a Slack/Teams notification.' },
      { heading: 'Audit trail', body: 'Every automated action is logged with a timestamp, the AI confidence score that triggered it, and a one-click revert option. Nothing happens silently — every action is visible in the incident timeline.' },
    ],
  },
  {
    id: 'ai',
    title: '🤖 AI Features',
    content: [
      { heading: 'AI Triage', body: 'Every alert gets a verdict (True Positive / False Positive / Suspicious), confidence score (0-100%), reasoning paragraph, evidence chain (3-5 factors), and recommended actions. Demo alerts have pre-built enrichment. Live alerts are triaged on-demand by Claude when you expand them.' },
      { heading: 'AI Co-Pilot', body: 'The chat-style assistant for open-ended security questions. Available on Team plan and above. Ask it to explain a MITRE technique, generate a detection query, summarise an incident, or draft a risk report. Scoped to security operations topics only.' },
      { heading: 'AI Remediation Queries', body: 'From the Vulns tab — click any vulnerability and hit Splunk SPL, Sentinel KQL, or Defender Advanced Hunting to get production-ready detection queries. Queries are generated fresh by AI, not pre-canned, and incorporate your estate context.' },
      { heading: 'AI Intel', body: 'From the Intel tab — click any intel item and then an IOC search button to generate hunt queries. The industry intel feed itself is AI-curated to your sector when you select your industry in settings.' },
      { heading: 'Sales Dashboard AI', body: 'Set a revenue target and Claude generates a full go-to-market strategy: ideal customer profile, acquisition channels, conversion tactics, and realistic timelines based on your current metrics and the gap to close.' },
      { heading: 'BYOK (Bring Your Own Key)', body: 'Community plan uses read-only AI triage. Team, Business, and MSSP plans require a Bring Your Own Key Anthropic API key. This means your AI usage is billed directly to your Anthropic account — Watchtower never sees your token usage costs. Add your key in Tools → AI Engine → Anthropic API Key.' },
    ],
  },
  {
    id: 'admin',
    title: '🔧 Admin Portal',
    content: [
      { heading: 'Accessing the Admin Portal', body: 'Visible only to the platform owner (hardcoded admin credentials set via Vercel env vars: WATCHTOWER_ADMIN_EMAIL and WATCHTOWER_ADMIN_PASS). Click the "🔧 Admin" tab in the top navigation bar or the sidebar icon. The Admin portal has five views: Subscribers, Users, Platform, Stripe, and Broadcast.' },
      { heading: 'Subscribers view', body: 'Every organisation subscribed to Watchtower — MSSPs, Business, Team, and Community tiers. Filter by plan and status. Click "Impersonate →" on any subscriber to enter their dashboard context and see exactly what they see. Use the £ Chase button on overdue accounts. Platform MRR breakdown shown at the bottom.' },
      { heading: 'Users / Roles management', body: 'Invite and manage internal staff accounts. Three roles:\n\nTech Admin — full access: all customer adds/moves/changes, tool integrations, settings, all dashboard tabs. Cannot invite other Admins.\n\nSales — read-only security tabs + full Sales Dashboard access. Can set revenue targets and view AI GTM strategies. Cannot modify customer settings.\n\nViewer — Overview, Alerts, Coverage, Vulns, Intel, Incidents only. Read-only, no Tools tab, no Admin, no Sales.' },
      { heading: 'Inviting a user', body: '1. Go to Admin → Users tab.\n2. Enter the person\'s name, email address, and select their role.\n3. Click "Send Invite" — an email is sent to their address with a secure invite link (valid 48 hours).\n4. They click the link, set their own password, and are immediately active.\n5. Their status shows as "Pending" until they accept. You can resend the invite if needed.' },
      { heading: 'Platform health view', body: 'API call volume, AI token usage, Redis performance, uptime metrics, active sessions, sync errors, new signups, and churn — all at a glance. Use this to monitor platform performance and catch issues before customers notice.' },
      { heading: 'Stripe configuration', body: 'Set up payment processing directly from Admin → Stripe. Enter your Stripe Publishable Key, Secret Key, Webhook Secret, and Price IDs for each plan tier. All keys are encrypted with AES-256-GCM in Redis — the secret key is never returned after saving. The webhook endpoint to configure in your Stripe dashboard is shown inline.' },
      { heading: 'Broadcast messages', body: 'Send a dismissable banner to all logged-in users across all tenants simultaneously — ideal for maintenance notices, security advisories, or product announcements. You can also compose a message targeted at a specific subscriber.' },
    ],
  },
  {
    id: 'stripe',
    title: '💳 Stripe Setup',
    content: [
      { heading: 'Step 1: Get your Stripe keys', body: 'Go to dashboard.stripe.com → Developers → API Keys. Copy your Publishable Key (pk_live_...) and Secret Key (sk_live_...). For testing first, use the test keys (pk_test_... / sk_test_...).' },
      { heading: 'Step 2: Create products and prices', body: 'In Stripe Dashboard → Products, create three products: MSSP (£799/mo recurring), Business (£199/mo recurring), Team (£49/seat/mo recurring). Copy the Price ID (price_...) for each.' },
      { heading: 'Step 3: Configure webhook', body: 'In Stripe Dashboard → Developers → Webhooks, click "Add endpoint". Enter: https://getwatchtower.io/api/stripe/webhook. Enable these events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed. Copy the Signing Secret (whsec_...).' },
      { heading: 'Step 4: Enter in Admin panel', body: 'Go to 🔧 Admin → Stripe tab. Enter all four values (publishable key, secret key, webhook secret, three price IDs) and click Save. All values are encrypted at rest. The plan status indicators turn green when all price IDs are set.' },
      { heading: 'Step 5: Test the flow', body: 'Use Stripe\'s test mode with card 4242 4242 4242 4242 to complete a test checkout. The webhook should fire and update the tenant\'s plan tier in Redis. Check Admin → Subscribers to confirm the plan change registered.' },
    ],
  },
  {
    id: 'mssp',
    title: '🏢 MSSP Features',
    content: [
      { heading: 'Portfolio view', body: 'The Portfolio tab (MSSP plan only) shows all your managed clients. Three views: Security (posture, alerts, incidents), Revenue (MRR, renewals, billing status), Usage (alerts processed, AI closures, tools connected). Expand any client to navigate directly into their alerts, incidents, or vuln tabs.' },
      { heading: 'Tenant switching', body: 'Click "View →" on any client to enter their dashboard context. Everything you see updates to reflect their data only — alerts, vulns, incidents, tools, posture. The client\'s name appears in the top bar. Click your own name to return to your primary context.' },
      { heading: 'Per-client BYOK', body: 'Each client brings their own Anthropic API key. You add it in their context via Tools → AI Engine. This means each client\'s AI calls are billed directly to their Anthropic account, completely isolated from other clients and from your own Watchtower usage.' },
      { heading: 'White-label branding', body: 'Upload your logo and brand colours via Admin → Branding. Clients who log in see your brand, not Watchtower\'s. The dashboard title, favicon, and colour scheme all update. The Watchtower name is hidden from client-facing views.' },
      { heading: 'Your margin calculation', body: 'The Portfolio tab footer always shows your Watchtower subscription cost vs total client MRR, so you can see your profit margin at a glance. Standard MSSP pricing: £799/mo base includes 5 clients. Each additional client is £79/mo.' },
    ],
  },
  {
    id: 'security',
    title: '🔒 Security & Privacy',
    content: [
      { heading: 'Credential storage', body: 'All tool credentials (API keys, client secrets, tokens) are encrypted with AES-256-GCM before storage in Redis. The encryption key is set via the WATCHTOWER_ENCRYPT_KEY Vercel environment variable. Credentials are never logged, never returned to the browser after saving (only non-sensitive fields like hostname and region are returned), and never included in sync requests — the server loads them directly from Redis.' },
      { heading: 'Authentication', body: 'Sessions use HMAC-SHA256 signed tokens (no JWT dependency). Tokens are stored as httpOnly secure cookies — inaccessible to JavaScript. Sessions expire after 24 hours. The admin password is set via Vercel environment variables (WATCHTOWER_ADMIN_EMAIL and WATCHTOWER_ADMIN_PASS) — never stored in code.' },
      { heading: 'Staff user passwords', body: 'Staff user passwords are SHA-256 hashed with your session secret before storage — never stored in plaintext. Password resets generate a time-limited token (1 hour TTL) via Redis, sent via email.' },
      { heading: 'Rate limiting', body: 'All AI endpoints (copilot, intel, sync, test connection) are rate-limited via Upstash Redis. The copilot endpoint: 20 requests/minute/user. Sync: 30/minute. Test connection: 10/minute. Intel: 10/minute.' },
      { heading: 'SSRF protection', body: 'All user-supplied URLs for tool credentials are validated against an allowlist before any server-side fetch. Private IP ranges (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x) are blocked. Each tool type only connects to its expected domain.' },
      { heading: 'Tenant isolation', body: 'Every API route reads the tenant ID from a middleware-verified session token (x-tenant-id header injected by Next.js middleware). Users cannot access other tenants\' data by manipulating cookies — the tenant ID is derived from the authenticated session.' },
      { heading: 'Pen test status', body: 'Current posture (v74.8.26): 0 Critical, 0 High, 0 Medium, 1 Low (stub routes without rate limiting). Four pen tests conducted. All critical/high findings resolved. Admin routes protected with isAdmin check, credentials masked in GET responses, SSRF validated at route level.' },
    ],
  },
  {
    id: 'settings',
    title: '⚙️ Settings',
    content: [
      { heading: 'General settings', body: 'Theme (dark/light), industry/sector (for threat intel personalisation), default dashboard mode (demo/live), and automation level. All settings persist to Redis and apply across devices.' },
      { heading: 'Anthropic API key (BYOK)', body: 'In Tools → AI Engine section. Enter your Anthropic API key. Tested on save. Stored encrypted in Redis. Required for Team, Business, and MSSP plans. Community plan gets read-only AI triage without a key.' },
      { heading: 'Notifications', body: 'In Settings → Notifications. Toggle alerts for critical alerts, new incidents, weekly digest, and sync errors. Configure a Slack webhook URL for real-time notifications.' },
      { heading: 'Environment variables', body: 'Required Vercel env vars for production:\n\nWATCHTOWER_ENCRYPT_KEY — 64 hex chars (32 bytes) for AES-256\nWATCHTOWER_SESSION_SECRET — 32+ char string for HMAC\nWATCHTOWER_ADMIN_EMAIL — admin login email\nWATCHTOWER_ADMIN_PASS — admin login password\nWATCHTOWER_API_KEY — programmatic API access key\nRESEND_API_KEY — for email delivery (invites, resets)\nEMAIL_FROM — sender address (e.g. Watchtower <noreply@...>)\nNEXT_PUBLIC_BASE_URL — your deployment URL\nUPSTASH_REDIS_REST_URL — your Upstash Redis URL\nUPSTASH_REDIS_REST_TOKEN — your Upstash auth token' },
    ],
  },
];

const NAV_STYLE: React.CSSProperties = {
  minHeight: '100vh',
  background: '#050508',
  color: '#e8ecf4',
  fontFamily: 'Inter,sans-serif',
  display: 'flex',
  flexDirection: 'column',
};

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('overview');
  const active = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];

  return (
    <div style={NAV_STYLE}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', padding:'12px 24px', borderBottom:'1px solid #141820', background:'#07090f', gap:12 }}>
        <a href="/dashboard" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', color:'inherit' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="url(#gg)"/>
            <path d="M14 5.5L22 9V15.5C22 19.5 18.5 23 14 24.5C9.5 23 6 19.5 6 15.5V9L14 5.5Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7"/>
            <path d="M11.5 14.5L13.5 16.5L17.5 12" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="gg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
          </svg>
          <span style={{ fontWeight:800, fontSize:'0.94rem' }}>Watchtower</span>
        </a>
        <span style={{ color:'#3a4050', margin:'0 4px' }}>/</span>
        <span style={{ fontSize:'0.84rem', color:'#6b7a94', fontWeight:600 }}>User Guide</span>
        <a href="/dashboard" style={{ marginLeft:'auto', padding:'6px 14px', background:'transparent', border:'1px solid #1e2536', borderRadius:7, color:'#6b7a94', fontSize:'0.76rem', fontWeight:600, textDecoration:'none' }}>← Dashboard</a>
      </div>

      <div style={{ flex:1, display:'flex' }}>
        {/* Sidebar */}
        <div style={{ width:220, flexShrink:0, borderRight:'1px solid #141820', padding:'20px 0', background:'#07090f' }}>
          <div style={{ padding:'0 16px', marginBottom:8, fontSize:'0.58rem', fontWeight:700, color:'#3a4050', textTransform:'uppercase', letterSpacing:'1px' }}>Contents</div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
              width:'100%', textAlign:'left', padding:'8px 16px', border:'none',
              background: activeSection === s.id ? '#4f8fff12' : 'transparent',
              borderLeft: `2px solid ${activeSection === s.id ? '#4f8fff' : 'transparent'}`,
              color: activeSection === s.id ? '#4f8fff' : '#6b7a94',
              fontSize:'0.78rem', fontWeight: activeSection === s.id ? 700 : 500,
              cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all .12s',
            }}>
              {s.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:'32px 40px', maxWidth:780, overflowY:'auto' }}>
          <h1 style={{ fontSize:'1.3rem', fontWeight:900, marginBottom:24, letterSpacing:-0.5 }}>{active.title}</h1>
          {active.content.map((item, i) => (
            <div key={i} style={{ marginBottom:28 }}>
              <h2 style={{ fontSize:'0.88rem', fontWeight:700, marginBottom:8, color:'#e8ecf4' }}>{item.heading}</h2>
              <div style={{ fontSize:'0.82rem', color:'#8a9ab0', lineHeight:1.85, whiteSpace:'pre-line' }}>{item.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
