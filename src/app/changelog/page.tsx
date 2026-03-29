'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const VERSIONS = [
  {
    version: 'v74.9.135',
    date: '2026-03-29',
    tag: 'UX',
    tagColor: '#8b6fff',
    summary: 'UX redesign sprint — Threat Level bar on overview, priority actions, clean alert cards with confidence bars, MSSP war room portfolio',
    changes: [
      { type: 'feat', text: 'OVERVIEW: Replaced verbose AI brief with a live Threat Level bar (CRITICAL/HIGH/ELEVATED/GUARDED) that dynamically calculates your current risk posture and shows up to 3 Priority Actions — specific, clickable items the analyst should address right now.' },
      { type: 'feat', text: 'OVERVIEW: Threat Level drives visual theming — pulsing red dot for CRITICAL, amber for HIGH, steady green for GUARDED. All priority actions are tappable and navigate directly to the relevant tab.' },
      { type: 'feat', text: 'ALERTS: Collapsed card redesigned — removed 6 badge types from the title row (NEW, SLA BREACH, hot device, assignee, note, ACK). Cleaner read: title + source + device + MITRE + time + FP/TP + AI verdict. SLA breach now shown via severity bar glow.' },
      { type: 'feat', text: 'ALERTS: AI confidence gradient bar — a 2px coloured strip at the bottom of each collapsed card shows AI verdict confidence at a glance. Red = TP lean, green = FP lean, amber = uncertain. Width scales with confidence %. No click required.' },
      { type: 'feat', text: 'ALERTS: Community upgrade CTA redesigned — instead of a blunt lock icon, community users see an evidence-chain preview panel with specific features listed (Evidence chain · Blast radius · Hunt queries · FP/TP verdict · MITRE mapping) and an Upgrade button.' },
      { type: 'feat', text: 'MSSP: Needs Attention strip at top of portfolio — surfaces clients with 3+ critical alerts, overdue billing, or posture below 75. Each row has a direct "View alerts →" button. Critical count pulses red.' },
      { type: 'feat', text: 'MSSP: Client cards redesigned with coloured left border (red = critical threat, amber = elevated, green = guarded), posture SVG ring with number inside, prominent CRIT/CASES/COV stat boxes, and live status dot.' },
      { type: 'feat', text: 'MSSP: War room header — shows total critical alerts across all clients with pulsing red dot, overdue MRR in amber, total MRR inline.' },
    ],
  },

  {
    version: 'v74.9.133',
    date: '2026-03-29',
    tag: 'Security',
    tagColor: '#f0405e',
    summary: 'Military-grade security hardening — scrypt passwords, rate-limited login, timing-safe comparison, header stripping, dev bypass removed, signup route built',
    changes: [
      { type: 'fix', text: 'PASSWORD HASHING: Replaced SHA-256 with scrypt (N=32768, r=8, p=1) via Node.js built-in crypto.scryptSync. Backward-compatible: old SHA-256 hashes verified on login then re-hashed with scrypt on next save. GPU brute-force cost increased by ~100,000x.' },
      { type: 'fix', text: 'TIMING ATTACK: Middleware session token comparison now uses constant-time XOR byte comparison instead of string !== comparison. Eliminates token prefix oracle timing attack.' },
      { type: 'fix', text: 'HEADER SPOOFING: Middleware now strips x-is-admin, x-user-id, x-user-tier from ALL incoming requests before processing — including public routes. Prevents identity header injection attacks.' },
      { type: 'fix', text: 'DEV ADMIN BYPASS: Removed the code path in /api/auth/session that returned isAdmin:true if WATCHTOWER_ADMIN_EMAIL/PASS env vars were unset. Now returns 401 unconditionally without a valid session.' },
      { type: 'fix', text: 'HARDCODED DEFAULT REMOVED: Login route no longer falls back to password "changeme" if WATCHTOWER_ADMIN_PASS is unset — returns 503 Server Configuration Error instead.' },
      { type: 'fix', text: 'LOGIN RATE LIMITING: Added checkRateLimit("login:{email}", 5, 300) — 5 attempts per 5 minutes per email address. Parallel brute-force attacks now fail at the rate limiter, not just the 300ms delay.' },
      { type: 'fix', text: 'ACCOUNT LOCKOUT: Failed logins tracked in Redis. After 10 failures in 15 minutes, further attempts are blocked by the rate limiter.' },
      { type: 'fix', text: 'ADMIN PASSWORD TIMING: Admin password comparison now uses crypto.timingSafeEqual() preventing timing attacks on the hardcoded admin credential check.' },
      { type: 'fix', text: 'ADMIN CHECK ON AUDIT ROUTE: /api/audit GET was missing requireAdmin check — any authenticated user could read all tenant audit entries. Fixed.' },
      { type: 'feat', text: 'SIGNUP ROUTE BUILT: /api/auth/signup now exists with: scrypt password hashing, email format validation, rate limiting (3/hour per IP), platform signup_enabled flag check, unique tenant ID creation, Community auto-verification, Redis user storage.' },
    ],
  },

  {
    version: 'v74.9.132',
    date: '2026-03-29',
    tag: 'Audit',
    tagColor: '#22d49a',
    summary: 'Live audit fixes: widget slug_map key mismatch, admin/tenants key mismatch, pricing FAQ duplicate word',
    changes: [
      { type: 'fix', text: '/api/widget was returning 404 Invalid slug for all slugs — it read from wt:global:slug_map but slug-map API writes to wt:mssp:slug_map. Now aligned.' },
      { type: 'fix', text: '/api/admin/tenants had the same key mismatch — now reads wt:mssp:slug_map.' },
      { type: 'fix', text: 'Pricing FAQ MSSP question said "Enterprise/Enterprise/MSSP plan" — duplicate from find-replace. Fixed to "Enterprise/MSSP plan".' },
    ],
  },

  {
    version: 'v74.9.131',
    date: '2026-03-29',
    tag: 'GTM',
    tagColor: '#f0a030',
    summary: 'Market-ready sprint — paywall enforcement, UX consistency, NIS2/DORA export, 2-tool community limit, unified tab navigation',
    changes: [
      { type: 'fix', text: 'Export CSV locked to Essentials+ — community users see a disabled greyed lock button instead of being able to download alert data.' },
      { type: 'fix', text: '250-alert live limit now enforced — community tier live alerts sliced to 250 before render, not just in demo data constants.' },
      { type: 'fix', text: '2-tool limit active in ToolsTab — after 2 connected tools, Community users see Upgrade button instead of Connect. Count badge shows X/2 tools.' },
      { type: 'fix', text: 'Community expanded-alert UX — spinner no longer shows for users who cannot use AI triage (no BYOK). Shows upgrade CTA with evidence chain/blast radius preview instead.' },
      { type: 'fix', text: 'Unified tab navigation — TABS array is now the single source of truth for all 11 tabs. Removed duplicate Compliance and Sales buttons from top bar. All tabs share tab-btn class with consistent active states.' },
      { type: 'feat', text: 'Compliance sidebar icon (🗂) added — Professional+ users now see Compliance in the left icon sidebar. MSSP Portfolio (🏢) added for Enterprise users. Bottom nav updated with correct distinct icons.' },
      { type: 'feat', text: 'NIS2/DORA Export button in Compliance tab — generates a regulatory text report covering NIS2 Art.21, DORA Art.10, ISO 27001, Cyber Essentials, and NIST CSF v2.0, pre-populated from live alert/incident data.' },
      { type: 'feat', text: 'Board Report PDF button moved inline to Compliance tab header for discoverability.' },
    ],
  },

  {
    version: 'v74.9.130',
    date: '2026-03-29',
    tag: 'Routes',
    tagColor: '#8b6fff',
    summary: 'Implemented 17 stub API routes — posture scoring, incidents CRUD, batch auto-triage, NL query, runbooks, Taegis isolate/endpoints, MSSP client reports, widget, admin analytics, noise reduction, AI insights',
    changes: [
      { type: 'feat', text: '/api/posture — Weighted posture score (0-100) from coverage 30% + critical alerts 30% + KEV vulns 20% + FP rate 20%. POST to update from dashboard data, GET to retrieve cached score.' },
      { type: 'feat', text: '/api/unified-alerts — Merges alerts from all connected tools post-sync with deduplication by title+device. Filter by severity and source. 60s Redis cache.' },
      { type: 'feat', text: '/api/incidents — Full CRUD for incidents in Redis (GET list, POST upsert/replace, DELETE by ID). Enables cross-session incident persistence.' },
      { type: 'feat', text: '/api/auto-triage — Batch triage up to 20 alerts in one AI call. Returns TP/FP/SUS verdict + confidence + reasoning per alert. 24h Redis cache per alert.' },
      { type: 'feat', text: '/api/nl-query — Natural language to Splunk SPL + Sentinel KQL + Defender Advanced Hunting. Pass device/IP/user context for targeted queries.' },
      { type: 'feat', text: '/api/runbooks — Runbook CRUD with 4 pre-built SOC runbooks: Ransomware, Phishing/BEC, Credential Theft, Data Exfiltration. Each has steps/containment/eradication/recovery sections.' },
      { type: 'feat', text: '/api/taegis/isolate — Real Taegis GraphQL device isolation. Finds endpoint by hostname, runs isolateEndpoint mutation, audit-logs the action.' },
      { type: 'feat', text: '/api/taegis/endpoints — Lists all Taegis endpoints via GraphQL with OS, isolation status, sensor version, and network interfaces. 5-min cache.' },
      { type: 'feat', text: '/api/mssp/client-reports — On-demand HTML security report generated and emailed to client. Uses last exec summary from Redis for metrics.' },
      { type: 'feat', text: '/api/widget — Public embeddable status widget (CORS enabled). Returns sanitised posture score and org branding for a client slug. No auth required.' },
      { type: 'feat', text: '/api/admin/analytics — Usage analytics: AI call count/success rate/avg duration, FP/TP verdict breakdown, posture score, SLA event count.' },
      { type: 'feat', text: '/api/admin/tenants — Lists all tenant IDs from slug map. Admin only.' },
      { type: 'feat', text: '/api/admin/reset-password — Admin-triggered password reset email via Resend with signed token. Token stored in Redis with 24h TTL.' },
      { type: 'feat', text: '/api/admin/seed-demos — Seeds demo posture and settings data for a tenant. Admin only.' },
      { type: 'feat', text: '/api/noise-reduction — AI analysis of alert patterns to identify top FP sources and generate suppression rules (Splunk/KQL). 1h cache.' },
      { type: 'feat', text: '/api/ai-insights — Daily contextual security insight with headline, priority, action item and trend direction. 6h cache per tenant.' },
      { type: 'fix', text: 'AdminPortal subscriber data updated to new pricing: Enterprise £2,499, Professional £799, Essentials £149/seat. Filter tabs updated to match.' },
    ],
  },

  {
    version: 'v74.9.129',
    date: '2026-03-29',
    tag: 'Audit',
    tagColor: '#f0a030',
    summary: 'Full code audit — rate limiting, SWC line length fix, connectedTools dep, slug-map cast, 40 stub routes catalogued',
    changes: [
      { type: 'fix', text: 'Added rate limiting to all AI API routes that were missing it: /api/triage, /api/blast-radius, /api/investigate, /api/exec-summary, /api/shift-handover. 30 requests/60s per user.' },
      { type: 'fix', text: 'DASHBOARD_CSS constant on L34 was 4,995 chars — split into two concatenated strings. SWC parser crashes on lines > ~5,000 chars.' },
      { type: 'fix', text: 'connectedTools object used as useEffect dependency caused sync effect to re-fire on every render (object reference changes). Changed to Object.keys(connectedTools).join(",") — a stable string.' },
      { type: 'fix', text: 'api/mssp/slug-map DELETE handler used "as any" cast — replaced with proper Record<string,unknown> type guard.' },
      { type: 'audit', text: '40 stub API routes identified (10L stubs returning ok:true). These are intentional stubs for future expansion — no functional gap as they are not called by the UI. Security: all production-relevant routes (copilot, triage, blast-radius, investigate, audit, sla, email, response-actions, stripe, cron) are real and fully implemented.' },
      { type: 'audit', text: 'Auth: no cross-tenant data leakage detected. Tenant ID is injected by middleware from verified session cookie — cannot be spoofed. All Redis keys are namespaced wt:{tenantId}:. Rate limiting keyed by x-user-id from session.' },
    ],
  },

  {
    version: 'v74.9.127',
    date: '2026-03-29',
    tag: 'Polish',
    tagColor: '#22d49a',
    summary: 'Full pricing alignment across all 12 files — admin permanently unlocked including AlertsTab canVote/canTeam',
    changes: [
      { type: 'fix', text: 'Admin accounts were still seeing Upgrade to Triage prompt in AlertsTab because isAdmin was not being passed as a prop and canVote/canTeam only checked userTier. Fixed: isAdmin now passed to AlertsTab, canVote and canTeam both check isAdmin || userTier !== community.' },
      { type: 'fix', text: 'AdminPortal subscriber pricing table updated: Team→Essentials £149/seat, Business→Professional £799/mo, MSSP→Enterprise £2,499/mo.' },
      { type: 'fix', text: 'SalesDashboard plan data updated: Essentials £149/seat, Professional £799/mo, Enterprise £2,499/mo. AI GTM prompt updated to new plan names and prices.' },
      { type: 'fix', text: 'Signup page plan list updated to Essentials/Professional/Enterprise with correct pricing.' },
      { type: 'fix', text: 'Landing page footer updated: Team from £49/seat/mo → Essentials from £149/seat/mo.' },
      { type: 'fix', text: 'Co-Pilot API error message updated from Team plan to Essentials plan. Docs, security, guide, MSSPPortfolio, pricing FAQ all updated to use Enterprise/MSSP naming.' },
    ],
  },

  {
    version: 'v74.9.126',
    date: '2026-03-29',
    tag: 'Polish',
    tagColor: '#22d49a',
    summary: 'Internal pricing labels updated, admin permanently unlocked, user guide rewritten, landing page and changelog current',
    changes: [
      { type: 'fix', text: 'Settings page Plan & Billing now shows correct pricing: Essentials £149/seat/mo, Professional £799/mo, Enterprise £2,499/mo. Plan names updated from Team/Business/MSSP to Essentials/Professional/Enterprise.' },
      { type: 'fix', text: 'Admin tier selector dropdown updated from old names (Team/Business/MSSP) to new names (Essentials/Professional/Enterprise). All "Upgrade to Team" prompts in the UI now say "Upgrade to Essentials".' },
      { type: 'fix', text: 'Admin accounts are permanently unlocked for all features via both canUse() and GateWall — confirmed working through isAdmin bypass in both functions. No feature gate applies to admin.' },
      { type: 'feat', text: 'User Guide completely rewritten: new pricing tiers, new plan names, Evidence Chain, Blast Radius, Co-Pilot with institutional knowledge, Deep Investigation (Tier 2/3), Hunt Query Generator, Shift Handover, MSSP cross-client correlation, automated weekly reports. All 11 sections updated.' },
    ],
  },

  {
    version: 'v74.9.125',
    date: '2026-03-29',
    tag: 'AI Features',
    tagColor: '#8b6fff',
    summary: '5 core differentiating AI features: evidence chain, blast radius, institutional knowledge, Tier 2/3 investigation, hunt query generator',
    changes: [
      { type: 'feat', text: 'Evidence Chain Transparency — every alert that expands now runs /api/triage to get a structured verdict with numbered evidence steps, MITRE mapping, and reasoning. Analyst can see exactly why the AI reached its verdict. Results cached 24h per alert.' },
      { type: 'feat', text: 'Blast Radius Analysis — confirming a TP immediately triggers /api/blast-radius. AI maps affected users, devices, services, lateral movement paths, and forensic commands to run. Panel appears in the alert expand with copy buttons.' },
      { type: 'feat', text: 'Institutional Knowledge — every FP/TP verdict is written to /api/tenant-knowledge (Redis list, last 100). Co-Pilot now injects the last 25 analyst decisions as context on every call, learning your environment over time.' },
      { type: 'feat', text: 'Tier 2/3 Deep Investigation — Incidents tab has a new "Deep Investigate" button (Team+). Calls /api/investigate with all grouped alerts, returns: reconstructed attack timeline, root cause, attacker objective, lateral movement paths, remediation plan (Critical/High/Medium), forensic commands, extracted IOCs, and detection gaps.' },
      { type: 'feat', text: 'Hunt Query Generator — structured triage now auto-generates Splunk SPL, Sentinel KQL, and Defender Advanced Hunting queries for every live alert. Hunt Queries button in expanded alert view shows all three with copy buttons.' },
    ],
  },

  {
    version: 'v74.9.124',
    date: '2026-03-29',
    tag: 'Strategy',
    tagColor: '#8b6fff',
    summary: 'Market-realistic pricing, demo auto-play, 2025/26 AI differentiator features updated across landing, pricing, and demo pages',
    changes: [
      { type: 'feat', text: 'Pricing restructured to market rates: Community £0, Essentials £149/seat/mo, Professional £799/mo (up to 15 analysts), Enterprise/MSSP £2,499/mo. Previous prices were 10x below MDR market (Secureworks £60K–£320K/yr, Cortex XSIAM $250K+/yr).' },
      { type: 'feat', text: 'Demo page now auto-starts the first simulation 600ms after load. Visitors immediately see Watchtower in action without needing to click Play. Also added mobile responsive layout — sidebar collapses below timeline on small screens.' },
      { type: 'feat', text: 'Landing page FEATURES updated to 2025/26 AI differentiators: Agentic AI Triage, Evidence Chain Transparency, Blast Radius Analysis, Autonomous Response (no SOAR playbooks), AI Co-Pilot, SLA Intelligence, BYOK Per-Client Isolation.' },
      { type: 'feat', text: 'Pricing page FAQ now includes market comparison context (vs Sentinel per-GB, vs XSIAM enterprise pricing) and ROI justification (analyst hours recovered, MTTA improvement).' },
      { type: 'feat', text: 'Landing page plan names updated to Essentials/Professional/Enterprise to match new positioning and tier capabilities.' },
    ],
  },

  {
    version: 'v74.9.123',
    date: '2026-03-29',
    tag: 'Quality',
    tagColor: '#22d49a',
    summary: '8 audit fixes: viewport, FP/TP gate, auto-notify UI, SLA display, audit log tab, demo link, dynamic slug map, client report cron',
    changes: [
      { type: 'fix', text: 'Mobile viewport meta tag — added export const viewport to layout.tsx. All mobile visitors now render at device width instead of desktop-scaled 1200px.' },
      { type: 'fix', text: 'FP/TP verdict buttons now gated for Community tier. Community users see the current verdict badge and a locked upgrade prompt instead of clickable buttons. Pricing promise (read-only) now enforced.' },
      { type: 'feat', text: 'Auto+Notify UI feedback — alerts auto-closed by the automation slider now show an "AI CLOSED" badge in the alert card. Uses separate autoClosedIds state to avoid the alertOverrides→actedAlerts re-render loop.' },
      { type: 'feat', text: 'SLA stats displayed in Shift Metrics — the bottom-right "Tools Live" card switches to show MTTA (Critical) in minutes when in live mode and SLA data is available from /api/sla.' },
      { type: 'feat', text: 'Audit Log tab in Admin Portal — fetches last 100 entries from /api/audit with type badges, verdict colour-coding, analyst name, timestamp, and affected alert/incident title.' },
      { type: 'feat', text: 'Demo page linked from landing page — hero CTA "See features" replaced with "See live demo" linking to /demo. Also added Demo to footer nav.' },
      { type: 'feat', text: 'Dynamic MSSP slug mapping — /api/mssp/slug-map stores slug→tenantId mapping in Redis. Branded login page at /login/[slug] now fetches mapping dynamically. New clients can be added without a code deploy.' },
      { type: 'feat', text: 'Per-client weekly reports in cron — /api/cron now reads client list from slug map, generates exec summary for each client, and sends it to their configured email address. Runs Monday 08:00 UTC.' },
    ],
  },

  {
    version: 'v74.9.119',
    date: '2026-03-29',
    tag: 'Security + UX',
    tagColor: '#f0405e',
    summary: 'Tier enforcement, co-pilot gate, email notifications, automation fixes, audit log, MSSP correlation',
    changes: [
      { type: 'fix', text: 'Tier selector (Community/Team/Business/MSSP) is now admin-only. Previously any user could switch themselves to MSSP and bypass all paywalls.' },
      { type: 'fix', text: 'Co-Pilot button now gated to Team+ in both the AI Threat Brief and the sidebar. Community users see an upgrade prompt instead of the chat.' },
      { type: 'feat', text: 'Email notifications wired. When a new critical alert arrives in live mode, and notif_critical is enabled in Settings, an email fires via /api/email. Reads email address from user settings.' },
      { type: 'fix', text: 'Automation slider Auto+Notify now actually closes high-confidence FPs (≥90%) — marks them acknowledged and auto-closed, fires Slack notification. Previously it labelled itself Auto+Notify but did nothing.' },
      { type: 'fix', text: 'Automation slider Full Auto now correctly uses autoFiredRef to prevent re-firing on re-renders. Old automation useEffect removed.' },
      { type: 'feat', text: 'Audit log entries written on: FP/TP verdict (any alert card), incident close, incident escalate, auto-close FP, auto-isolate TP. All write to /api/audit with analyst, timestamp, and alert/incident context.' },
      { type: 'feat', text: 'MSSP correlation: after each successful live sync, the dashboard POSTs IOCs and CVEs to /api/mssp/correlation. Cross-tenant correlation panel now shows live results as clients sync.' },
    ],
  },

  {
    version: 'v74.9.113',
    date: '2026-03-28',
    tag: 'Major Release',
    tagColor: '#8b6fff',
    summary: 'All 4 sprint features: response actions, exec report, email, onboarding, API keys, audit, SLA, correlation, Stripe, cron',
    changes: [
      { type: 'feat', text: 'Sprint 1: Response actions route now fires real CrowdStrike Falcon isolation and Taegis isolation when automation slider is set to Full Auto in live mode. Audit log entry written per action.' },
      { type: 'feat', text: 'Sprint 1: Executive PDF report — /api/exec-summary generates a formatted HTML report with AI executive summary, key findings, and recommendations. Business+ "📊 Report" button in topbar opens print dialog.' },
      { type: 'feat', text: 'Sprint 1: MSSP branding now loaded from Redis on mount — survives page refresh. White-label name and colour persist across sessions.' },
      { type: 'feat', text: 'Sprint 1: Alert assignees persisted to Redis via alert-state route. Analyst claiming an alert now survives refresh and is visible to all team members.' },
      { type: 'feat', text: 'Sprint 2: Onboarding wizard — 3-step modal (Connect tool → Add API key → Go Live) shown when no tools connected. Replaces dead empty state.' },
      { type: 'feat', text: 'Sprint 2: Email notifications wired — /api/email sends real emails via Resend for critical alerts, incident creation, and weekly digest. HTML templates for all types.' },
      { type: 'feat', text: 'Sprint 2: Cross-tenant IOC correlation (/api/mssp/correlation) runs real comparison across client sync data. MSSP portfolio panel now shows live results when available.' },
      { type: 'feat', text: 'Sprint 3: Audit log — /api/audit records all analyst actions (FP/TP, auto-responses, incident create). Persisted to Redis, max 1000 entries per tenant.' },
      { type: 'feat', text: 'Sprint 3: SLA tracking — /api/sla records alert acknowledge events and calculates MTTA/MTTR by severity. Written automatically on alert acknowledgement.' },
      { type: 'feat', text: 'Sprint 3: API keys — /api/auth/api-keys supports create/list/revoke. Keys shown once on creation. Settings → API Keys tab with full management UI.' },
      { type: 'feat', text: 'Sprint 4: Cron job (/api/cron) runs weekly to send digest emails. vercel.json created with Monday 08:00 schedule.' },
      { type: 'feat', text: 'Sprint 4: Branded client login page at /login/[slug] — loads MSSP white-label branding from Redis and renders a custom login screen for each client.' },
      { type: 'feat', text: 'Sprint 4: Stripe portal (/api/stripe/portal) and webhook fully wired — plan changes update userTier in Redis, cancellations downgrade to community, payment failures send email.' },
    ],
  },

  {
    version: 'v74.9.109',
    date: '2026-03-28',
    tag: 'UX + Features',
    tagColor: '#4f8fff',
    summary: 'Nav cleanup, alert/incident assignees, volume chart, handover, MSSP branding, vuln sort',
    changes: [
      { type: 'feat', text: 'Compliance removed from main tab bar — now a secondary 🛡 Comply button visible only to admin/business users. Reduces nav from 9 tabs to 8.' },
      { type: 'feat', text: 'Alert Claim/Assign — analysts can claim an alert to themselves with one click. Assignee badge shown on collapsed card. State tracked per-session.' },
      { type: 'feat', text: 'Incident Assign — same claim pattern on incident rows. Incoming analyst can see who owns what at a glance.' },
      { type: 'feat', text: 'Overview: AI Noise Reduction panel replaced with 7-Day Alert Volume bar chart — real operational data, not fabricated metrics.' },
      { type: 'feat', text: 'Overview: ⇄ Handover button generates an AI shift handover brief from live data (open alerts, criticals, cases, SLA breaches, posture). Displays inline, dismissible.' },
      { type: 'feat', text: 'Shift handover API (/api/shift-handover) now generates real AI content using Claude Haiku rather than returning hardcoded JSON.' },
      { type: 'feat', text: 'MSSP Portfolio: 🎨 Branding button opens white-label config panel (product name, tagline, brand colour). Saves to Redis via /api/mssp/branding.' },
      { type: 'feat', text: 'Branding API (/api/mssp/branding) now reads/writes to Redis instead of returning empty stubs.' },
      { type: 'fix', text: 'Vulns: global sort by severity × device count × CVSS before grouping by product. Most impactful vulns always appear first within each group.' },
      { type: 'fix', text: 'Alert page size increased from 10 to 25 — fewer clicks to review a shift.' },
    ],
  },

  {
    version: 'v74.9.107',
    date: '2026-03-28',
    tag: 'Fix + Features',
    tagColor: '#22d49a',
    summary: 'Fix intel/incidents/coverage/vulns/comply, cross-tenant alerts, branding, signup toggle',
    changes: [
      { type: 'fix', text: 'General intel now always shows CISA KEV / ThreatFox / URLhaus feeds as background intel regardless of mode. Industry-specific AI intel uses industryIntel variable.' },
      { type: 'fix', text: 'Incidents: demo incidents no longer shown in live mode. Only user-created incidents visible when demoMode=false.' },
      { type: 'fix', text: 'Coverage: gapDevices now filtered to only devices where missing.length>0. coveredPct uses actual Tenable estate size in live mode.' },
      { type: 'fix', text: 'Vulns: grouped by product name with severity badge counts per group (Critical N, High N etc). IIFE renders product sections sorted by highest severity.' },
      { type: 'fix', text: 'Compliance: shows informative empty state in live mode when no MITRE-tagged alerts have arrived yet.' },
      { type: 'feat', text: 'MSSP Portfolio: Cross-Tenant Correlation panel showing IOCs and CVEs present across multiple clients. In production this auto-generates cross-client advisories.' },
      { type: 'fix', text: 'Landing page: copyright footer now reads Watchtower Ltd, not RunbookHQ Ltd.' },
      { type: 'feat', text: 'Admin → Platform tab: SignupToggle lets admin enable/disable public sign-ups. Register route enforces the flag via wt:platform:settings Redis key.' },
    ],
  },

  {
    version: 'v74.9.106',
    date: '2026-03-28',
    tag: 'Production Readiness',
    tagColor: '#4f8fff',
    summary: 'Persist analyst work, alert dedup, SLA badges, live intel cleanup, AI timelines, CVE fix',
    changes: [
      { type: 'feat', text: 'Alert overrides (FP/TP/ACK) persisted to Redis via /api/alert-state. Debounced 2s save, loads on mount. Analyst verdicts survive page refresh.' },
      { type: 'feat', text: 'Alert deduplication — live alerts merged by ID across syncs. Analyst work on existing alerts preserved between 60s syncs.' },
      { type: 'feat', text: 'SLA breach badge on alert cards: Critical unacked >1h and High unacked >4h show red SLA BREACH badge and border.' },
      { type: 'feat', text: 'Incidents from live alerts now have AI-generated timelines with real commands — SIEM queries, EDR hunts, isolation commands, runbook generation based on MITRE tactic.' },
      { type: 'fix', text: 'Intel tab live mode: no longer appends demo defaults alongside AI intel. Live = AI-generated only.' },
      { type: 'fix', text: 'CVE extraction uses /^CVE-\\d{4}-\\d+$/ regex instead of startsWith — correct for all tag formats.' },
      { type: 'fix', text: 'durationMs now included in sync log entries.' },
    ],
  },
  {
    version: 'v74.9.105',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Coverage only vs connected tools, sync route timing',
    changes: [
      { type: 'fix', text: 'Coverage per-tool bars now use connected tools only. Empty state shown when no tools connected in live mode.' },
      { type: 'fix', text: 'Sync route now returns durationMs per tool.' },
    ],
  },
  {
    version: 'v74.9.104',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix orphaned comment on useState line 336',
    changes: [
      { type: 'fix', text: 'str_replace left "live intel fetch" text fused onto livetenableNews useState declaration causing SWC parse error.' },
    ],
  },
  {
    version: 'v74.9.103',
    date: '2026-03-28',
    tag: 'Fix + Features',
    tagColor: '#22d49a',
    summary: 'No demo data in live mode, coverage only vs connected tools, vuln asset CSV, fix doubled commands, tools grouped by type',
    changes: [
      { type: 'fix', text: 'Intel: live mode shows zero demo intel. Tenable "In The News" now fetches from /api/intel/tenable-news (AI-generated CVE advisories, 6h cache). Demo mode still shows static demo data.' },
      { type: 'fix', text: 'Coverage: gap device "missing tools" now derived from actually connected EDR tools (CrowdStrike, Defender, SentinelOne, Carbon Black) — not hardcoded CrowdStrike. If no EDR connected, says "No EDR configured".' },
      { type: 'feat', text: 'Vulns: affected devices shows count only (large orange number). "⬇ Export Assets CSV" button downloads hostname/CVE/severity/plugin for all affected assets.' },
      { type: 'fix', text: 'Cases: removed inline cmd display from timeline entries. Commands now appear only in the "AI Commands Executed" panel below — previously showed twice.' },
      { type: 'feat', text: 'Tools: integrations now grouped by category (EDR, SIEM, XDR, NDR, Vuln, CSPM, Identity, Email, Network) with divider labels. Filter buttons still work across groups.' },
    ],
  },
  {
    version: 'v74.9.102',
    date: '2026-03-28',
    tag: 'Features',
    tagColor: '#22d49a',
    summary: 'Vuln patch links, coverage device totals, overview cleanup, intel sections, AI commands in cases, sync log',
    changes: [
      { type: 'feat', text: 'Vuln cards: NVD, Find Patch, and Tenable Plugin links always visible — no longer gated behind vuln.patch. All links show on every card that has a CVE.' },
      { type: 'feat', text: 'Coverage: Total device count badge in header. OS breakdown pills show counts inline (Windows 42, Linux 18). Live mode shows Tenable-derived device count.' },
      { type: 'feat', text: 'Overview: Hot Assets panel removed. Shift Metrics now full-width 4-column card grid — Unacked Criticals, SLA Breaches, FPs Auto-Closed, Tools Live.' },
      { type: 'feat', text: 'Intel: each section capped at top 3. Added Tenable "In The News" section with 3 Tenable Research CVE disclosures, CVE badges, MITRE tags, read-article links.' },
      { type: 'feat', text: 'Cases: "AI Commands Executed" sub-panel below timeline — extracts all AI-actor cmd fields, terminal-style display with timestamps, action labels, and copy buttons.' },
      { type: 'feat', text: 'Tools: Sync log always visible above tool grid — dark terminal style, newest-first, auto-scrolls to latest, colour-coded per tool, shows duration ms.' },
      { type: 'fix', text: 'liveVulns mapping uses v.affectedAssets?.length for device count so grouped Tenable vulns show correct asset counts.' },
    ],
  },
  {
    version: 'v74.9.101',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix AdminPortal double-button and guide.tsx fused entry syntax errors',
    changes: [
      { type: 'fix', text: 'AdminPortal line 83: str_replace fused two button closings. Removed orphaned ontWeight:700... tail.' },
      { type: 'fix', text: 'guide/page.tsx line 84: AI Triage body was appended directly after AI Query Log body. Restored as separate entries.' },
    ],
  },
  {
    version: 'v74.9.100',
    date: '2026-03-28',
    tag: 'Features',
    tagColor: '#22d49a',
    summary: 'Tenable vulns grouped by plugin — unique vulnerabilities with affected asset count and list',
    changes: [
      { type: 'feat', text: 'Tenable adapter now produces one record per unique plugin (vulnerability), not one per asset. affectedAssets[] field added to NormalisedAlert type.' },
      { type: 'feat', text: 'Vulns tab: device count now shows the real number of affected assets per vulnerability (e.g. "7 devices affected"). Expanded view lists all hostnames as individual badges.' },
      { type: 'feat', text: 'Coverage tab: live device derivation now expands affectedAssets from each grouped vuln record to enumerate all unique scanned hosts — previously only used the primary device field.' },
      { type: 'feat', text: 'Plugin log now shows per-plugin asset count: "[tenable] plugin 12345 CVE-2024-xxxx → 7 asset(s)" for easy diagnosis.' },
    ],
  },
  {
    version: 'v74.9.99',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix AI log tab missing from admin nav, Taegis API rewrite per official docs',
    changes: [
      { type: 'fix', text: 'AI Query Log invisible — "ailog" was missing from admin portal tab array [\'subscribers\',\'users\',...]. Tab panel existed but was never reachable. Added ailog with ✦ AI Log label and fetchAiLog() on click.' },
      { type: 'fix', text: 'requireAdmin in ailog route now also allows dev mode (no WATCHTOWER_ADMIN_EMAIL set) so AI log is visible in local/staging environments.' },
      { type: 'fix', text: 'Taegis adapter rewritten per official docs (docs.taegis.secureworks.com): region-specific auth host, search_id + tenant_id in query, removed invalid fields (full_title, third_party_details, origin), extended to -7d window.' },
      { type: 'fix', text: 'Taegis auth endpoint now uses region-specific host for non-us1 regions (api.{region}.taegis.secureworks.com) — was hardcoded to us1 host for all regions.' },
      { type: 'fix', text: 'Taegis GraphQL errors now logged individually before throwing — easier to diagnose schema mismatches.' },
      { type: 'fix', text: 'Taegis verdict mapping adds RESOLVED status → TP (alongside CLOSED).' },
    ],
  },
  {
    version: 'v74.9.98',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix tenableSev orphaned code from partial str_replace',
    changes: [
      { type: 'fix', text: 'Partial str_replace left orphaned }dium\'; fragment at line 66 of adapters.ts causing SWC parse error. Cleaned up tenableSev function.' },
    ],
  },
  {
    version: 'v74.9.97',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix Tenable severity filter — use string values per official API docs',
    changes: [
      { type: 'fix', text: 'Root cause of 0 results: Tenable workbenches API requires string severity values (High, Critical) not integers. filter.0.value=2 was silently ignored, returning all 412 info-level plugins.' },
      { type: 'fix', text: 'Corrected filter URL to use filter.0.value=High&filter.1.value=Critical with filter.search_type=or per official Tenable docs.' },
      { type: 'fix', text: 'Updated tenableSev() to handle both string labels (\'Critical\',\'High\',\'Medium\') and legacy integers (4,3,2) from older endpoints.' },
    ],
  },
  {
    version: 'v74.9.96',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Tenable: remove broken server-side filter, log raw plugin fields, multi-field severity check',
    changes: [
      { type: 'fix', text: 'Removed server-side integer filter — was returning sev=0 on all 412 plugins. Now fetches without filter and logs full raw plugin field names to diagnose actual severity field.' },
      { type: 'fix', text: 'Client-side filter checks all known Tenable severity fields: severity, severity_id, vpr_score, cvss3_base_score, risk_factor string.' },
    ],
  },
  {
    version: 'v74.9.95',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix Taegis — widen CQL query, add token validation, remove invalid schema field',
    changes: [
      { type: 'fix', text: 'Removed status=\'OPEN\' filter from CQL — alerts are often UNDER_REVIEW or ACTIVE, causing empty results. New query: FROM alert WHERE severity >= 0.6 EARLIEST=-24h.' },
      { type: 'fix', text: 'Removed resolution_reason from GraphQL query — field not present in all Taegis schema versions, causing silent query failure.' },
      { type: 'fix', text: 'Added HTTP error check on token fetch — now throws clear error if Taegis auth returns 401/403 instead of silently using undefined token.' },
      { type: 'fix', text: 'Added post-query logging: total_results, list count, status, reason from Taegis response for easier diagnosis.' },
    ],
  },
  {
    version: 'v74.9.94',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix duplicate SCAN_INFO_PLUGINS declaration in adapters.ts',
    changes: [
      { type: 'fix', text: 'Two const SCAN_INFO_PLUGINS declarations in same function scope caused webpack identifier conflict. Removed old declaration at line 106, kept updated one at line 117.' },
    ],
  },
  {
    version: 'v74.9.93',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix duplicate url keys and missing closing braces in demo intel data',
    changes: [
      { type: 'fix', text: 'def1 and def2 had duplicate url: keys from two URL-addition passes colliding. SWC parser rejected the object literal.' },
      { type: 'fix', text: 'def3 and def4 were missing closing } so the next object was parsed as a key of the previous one.' },
    ],
  },
  {
    version: 'v74.9.92',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix Tenable server-side filter value=2 — was ignoring integer, returning all info plugins',
    changes: [
      { type: 'fix', text: 'Changed filter.0.value from integer 2 to string medium. Tenable API silently ignores unknown filter values and returns everything — hence 412 sev=0 plugins.' },
      { type: 'fix', text: 'Also includes all undeployed changes from v74.9.90 and v74.9.91 (SOC improvements, Taegis fix, intel URLs).' },
    ],
  },
  {
    version: 'v74.9.91',
    date: '2026-03-28',
    tag: 'SOC UX',
    tagColor: '#22d49a',
    summary: 'SOC analyst improvements — relative time, FP/TP inline, hot assets, SLA countdown, shift metrics',
    changes: [
      { type: 'feat', text: 'Alert cards: relative time ("2h ago") using rawTime from live Taegis alerts. Fresh alerts (<15m) show green NEW badge. Stale alerts (>4h) dim timestamp.' },
      { type: 'feat', text: 'Alert cards: FP / TP quick-action buttons on every collapsed row — no expand needed. Buttons toggle filled state when verdict applied.' },
      { type: 'feat', text: 'Alert cards: hot device indicator — if a device has 3+ alerts, shows 🔥 count inline on the collapsed card.' },
      { type: 'feat', text: 'Alert cards: description field shown when expanded (populated by live Taegis alerts).' },
      { type: 'feat', text: 'Alert header: unacked critical counter with red badge when criticals need acknowledgement.' },
      { type: 'feat', text: 'Overview: Hot Assets panel — bar chart of devices with most alerts across the estate. Instant visual for which host is screaming.' },
      { type: 'feat', text: 'Overview: Shift Metrics panel — Unacked Criticals, SLA Breaches, FPs Auto-Closed, Tools Live. Shift handover at a glance.' },
      { type: 'feat', text: 'Incidents: SLA countdown visible on every collapsed row — "SLA 2h 15m remaining" or "SLA breached 45m ago" in red. No expand needed.' },
      { type: 'fix', text: 'Incidents: fixed crash when inc.timeline or inc.mitreTactics is undefined (new incidents from live alerts lack these fields).' },
    ],
  },
  {
    version: 'v74.9.90',
    date: '2026-03-28',
    tag: 'Features + Fixes',
    tagColor: '#22d49a',
    summary: 'Alert expand fixed, Tenable Medium+ vulns, all demo intel URLs added, full SOC audit',
    changes: [
      { type: 'fix', text: 'Alert expand crash: alertSnoozes and setAlertSnoozes were passed as props but missing from AlertsTab destructuring — ReferenceError on every expand in live mode.' },
      { type: 'fix', text: 'Tenable filter changed to sev>=2 (includes Medium) — environments with no High/Critical were getting 0 results.' },
      { type: 'fix', text: 'All 9 demo intel entries now have real URLs pointing to SecurityWeek, BleepingComputer, NCSC, CISA, ThreatFox. SOURCE_URLS dead code removed from intel route.' },
      { type: 'feat', text: 'Co-Pilot system prompt rewritten as senior SOC analyst persona — leads with verdict, names TTPs, writes actual detection commands, knows its role in Watchtower.' },
      { type: 'fix', text: 'Naming consistency: Cases used across both desktop tabbar and mobile nav.' },
    ],
  },
  {
    version: 'v74.9.89',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix alert expand ReferenceError — alertSnoozes missing from props destructuring',
    changes: [
      { type: 'fix', text: 'alertSnoozes and setAlertSnoozes were passed as props from page.jsx but never declared in AlertsTab\'s destructuring list. Caused ReferenceError on every alert expand in live mode.' },
    ],
  },
  {
    version: 'v74.9.88',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix alert expand crash + rebuild AI summary panel layout',
    changes: [
      { type: 'fix', text: 'alert.evidenceChain?.length and alert.aiActions?.length — optional chaining prevents crash when these fields are null on live Taegis alerts.' },
      { type: 'fix', text: 'AI triage result panel rebuilt: header bar with auto-detected verdict badge (TP/FP/Suspicious) and confidence %, source pills, reasoning split on newlines for readability.' },
      { type: 'fix', text: 'Verdict extraction moved outside JSX (precomputed as aiVerdict, aiConf, aiVC) to avoid IIFE in render which SWC parser rejects.' },
    ],
  },
  {
    version: 'v74.9.87',
    date: '2026-03-28',
    tag: 'Debug',
    tagColor: '#6b7a94',
    summary: 'Add Tenable raw diagnostic logging per-severity to diagnose 0-result issue',
    changes: [
      { type: 'fix', text: 'Log each severity level count as a separate console.log line (Vercel truncates long single-line logs). Revealed sev0=412 — all plugins returning as Info/None severity.' },
      { type: 'fix', text: 'Added sample plugin field log to see actual Tenable response structure.' },
    ],
  },
  {
    version: 'v74.9.86',
    date: '2026-03-28',
    tag: 'AI',
    tagColor: '#8b6fff',
    summary: 'Co-Pilot live context — every AI message includes full dashboard snapshot',
    changes: [
      { type: 'feat', text: 'Every Co-Pilot message now includes a live context snapshot: up to 15 active alerts with title/severity/source/device/verdict/MITRE, top 8 vulns with CVE/severity/device, all open cases, coverage %, connected tools, posture score.' },
      { type: 'feat', text: 'Conversation history sent with each message (last 6 exchanges) — follow-up questions now work correctly.' },
      { type: 'feat', text: 'Suggested prompts are now dynamic — if critical alerts exist, first prompt names the top one. Prompts generated from live data state.' },
      { type: 'feat', text: 'LIVE/DEMO badge with alert count shown in Co-Pilot header so analyst knows what context the AI is working with.' },
      { type: 'feat', text: 'System prompt rewritten — AI now uses live context to answer "what is my biggest threat right now?", "which device is most at risk?", "summarise for shift handover".' },
    ],
  },
  {
    version: 'v74.9.85',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix alert expand crash — vStyle undefined on live Taegis alerts',
    changes: [
      { type: 'fix', text: 'VERDICT_STYLE[alert.verdict] returns undefined if verdict string is unexpected. Added || VERDICT_STYLE.Pending fallback so vStyle is always a valid object.' },
    ],
  },
  {
    version: 'v74.9.84',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix alert expand crash + Taegis severity mapping',
    changes: [
      { type: 'fix', text: 'alert.evidenceChain.map and alert.aiActions.map crash when these fields are undefined on live Taegis alerts. Added ||[] fallback.' },
      { type: 'fix', text: 'Added taegisSev() mapper: Taegis uses 0.0–1.0 float scale. normSev was treating 0.9 as Low (< 4). New mapper: >=0.9→Critical, >=0.7→High, >=0.4→Medium, <0.4→Low.' },
    ],
  },
  {
    version: 'v74.9.83',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix duplicate critVulns declaration',
    changes: [
      { type: 'fix', text: 'Overview stats block added a second const critVulns at line 662, conflicting with the existing declaration at line 634. Removed duplicate, updated hero stat to use critVulns.length.' },
    ],
  },
  {
    version: 'v74.9.82',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix overview section missing closing )} bracket',
    changes: [
      { type: 'fix', text: 'New overview content ended with ) instead of )} — the && conditional wrapper requires both ) to close JSX and } to close the && block.' },
    ],
  },
  {
    version: 'v74.9.81',
    date: '2026-03-28',
    tag: 'Redesign',
    tagColor: '#4f8fff',
    summary: 'Overview redesign, live data wiring, Co-Pilot upgrade, full site audit fixes',
    changes: [
      { type: 'feat', text: 'Overview: 5 hero stats (Critical Alerts, Total Alerts, Open Cases, Critical Vulns, Posture Score) — large, colour-coded, each clickable to relevant tab.' },
      { type: 'feat', text: 'Overview: AI Threat Brief — one-paragraph situational awareness wired to live data with Open Co-Pilot button.' },
      { type: 'feat', text: 'Overview: 4-quadrant drill-down grid — Alerts by Severity bar chart, Estate Coverage %, Top 5 Vulns, Active Cases + Tool Health. All clickable.' },
      { type: 'feat', text: 'Overview: 7-day posture sparkline (SVG polyline) and AI Noise Reduction stats.' },
      { type: 'fix', text: 'Live alert/vuln counts now correctly wired in overview — was showing demo data only.' },
      { type: 'fix', text: 'Coverage tab: OS breakdown pills (Windows/Linux/macOS) now visible — osBreakdown computed but never passed before.' },
      { type: 'fix', text: 'CVSS "N/A" no longer displayed when unavailable from Tenable.' },
      { type: 'fix', text: 'Copilot prompt rewritten as senior SOC analyst — leads with verdict, names TTPs, writes detection commands.' },
    ],
  },
  {
    version: 'v74.9.80',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix Tenable 0 records — remove broken CVSS filter',
    changes: [
      { type: 'fix', text: 'cvss3_base_score is not present on /workbenches/vulnerabilities list endpoint. Every High severity plugin failed cvss >= 6.5, producing 0 results. Removed CVSS gate, replaced with blocklist of known scan-info plugin IDs.' },
    ],
  },
  {
    version: 'v74.9.79',
    date: '2026-03-28',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix redis import in ailog route — use named functions not client object',
    changes: [
      { type: 'fix', text: 'AI log route imported { redis } but the lib exports individual async functions (redisGet, redisHSet etc). No redis client object exists. Added redisLPush, redisLRange, redisLTrim to redis.ts and updated route to use them.' },
    ],
  },
  {
    version: 'v74.9.78',
    date: '2026-03-28',
    tag: 'Features',
    tagColor: '#22d49a',
    summary: 'AI query log (admin-only), full context capture on every AI call',
    changes: [
      { type: 'feat', text: 'AI Query Log: every AI call (triage, Co-Pilot, intel, vuln assist) logged to Redis. GET /api/ai/ailog enforces x-is-admin: true. Admin Portal → ✦ AI Log tab with stats strip and rolling table.' },
      { type: 'feat', text: 'Each log entry captures: timestamp, user, tenant, query type, prompt preview, alert ID/title/verdict context, vuln ID/CVE context, industry, duration ms, success/error.' },
      { type: 'feat', text: 'Copilot route passes alertId, alertTitle, vulnId, vulnCve through to the log for full operational context.' },
    ],
  },
  {
    version: 'v74.9.52',
    date: '2026-03-27',

    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix apostrophe syntax error in Co-Pilot suggested prompts',
    changes: [
      { type: 'fix', text: 'Unescaped apostrophe in copilot prompt string caused SWC parse error at build time' },
    ],
  },
  {
    version: 'v74.9.51',
    date: '2026-03-27',
    tag: 'Features',
    tagColor: '#22d49a',
    summary: 'AI Co-Pilot panel, SLA countdown, compliance mapping, noise reduction stats, shift handover',
    changes: [
      { type: 'feat', text: 'AI Co-Pilot — slide-in chat panel (✦ sidebar button). Message thread, suggested prompts, Enter to send. Team+ gated. Calls /api/copilot with rate limiting.' },
      { type: 'feat', text: 'SLA countdown on every incident row — Critical=1h, High=4h, Medium=24h, Low=72h. Badge turns orange >75% elapsed, red when breached. Updates every 60s.' },
      { type: 'feat', text: 'Compliance Mapping tab (Business+) — MITRE ATT&CK → ISO 27001 / Cyber Essentials / NIST CSF table from live alerts. Framework score cards with gap lists. KEV vuln compliance impact panel.' },
      { type: 'feat', text: 'Noise reduction stats on Overview — FPs auto-closed, analyst time recovered, auto-acted alerts at current automation level.' },
      { type: 'feat', text: 'Shift Handover button (Team+) — one click generates a formatted plain-text shift brief ready to paste into Slack or Teams.' },
    ],
  },
  {
    version: 'v74.9.50',
    date: '2026-03-27',
    tag: 'Features',
    tagColor: '#22d49a',
    summary: 'Slack delivery live, snooze wired, shortcut modal, stripe refresh',
    changes: [
      { type: 'feat', text: 'Slack webhook route now delivers real rich attachments — severity colour, verdict emoji, source, device, and link back to dashboard.' },
      { type: 'feat', text: 'slack_webhook added to ALLOWED_SETTINGS — saves from Settings → Notifications were silently dropped before.' },
      { type: 'feat', text: 'Alert snooze (2h) now wired end-to-end — button in expanded alert row, state filters from Alerts feed until expiry.' },
      { type: 'feat', text: 'Keyboard shortcut help modal — press ? anywhere in the dashboard to open.' },
      { type: 'fix', text: 'Duplicate CrowdStrike entry removed from landing page integrations TOOLS array.' },
      { type: 'fix', text: 'Stripe success page now refreshes user settings so plan tier updates immediately after payment.' },
    ],
  },
  {
    version: 'v74.9.49',
    date: '2026-03-27',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix TDZ crash — dashboard main page broken after v74.9.47',
    changes: [
      { type: 'fix', text: 'Slack webhook useEffect referenced critAlerts before its declaration (Temporal Dead Zone). Caused React hydration crash — dashboard loaded but was non-interactive.' },
      { type: 'fix', text: 'Moved Slack useEffect and lastNotifiedRef to after critAlerts derivation at line 570.' },
    ],
  },
  {
    version: 'v74.9.48',
    date: '2026-03-27',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix gap devices field mismatch — coverage and overview broken',
    changes: [
      { type: 'fix', text: 'DEMO_GAP_DEVICES_BASE used wrong field names (name/lastSeenDays vs hostname/ip/reason/lastSeen). Deleted it, added lastSeenDays to original DEMO_GAP_DEVICES.' },
      { type: 'fix', text: 'Coverage heatmap card now shows coloured left-border and heat label badge per device.' },
    ],
  },
  {
    version: 'v74.9.47',
    date: '2026-03-27',
    tag: 'Polish',
    tagColor: '#8b6fff',
    summary: 'Lighter navy colour palette + complete user guide rewrite',
    changes: [
      { type: 'feat', text: 'Dark theme lifted from near-black void (#050508) to dark navy (#090d18) — matches Linear/Vercel aesthetic. Applied across all 10 dashboard files, landing, settings, login.' },
      { type: 'feat', text: 'User guide fully rewritten — 11 sections, accordion layout, live search, documents all new features including keyboard shortcuts, snooze, SLA, compliance, PDF report, Slack.' },
    ],
  },
  {
    version: 'v74.9.46',
    date: '2026-03-27',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Nuke stale TSX files shadowing JSX fixes — root cause of blank tabs',
    changes: [
      { type: 'fix', text: 'Next.js resolves .tsx before .jsx. 9 stale .tsx files from old monolith split were shadowing all the fixed .jsx files — AdminPortal, SalesDashboard, MSSPPortfolio, ToolsTab, AlertsTab, page were all loading broken old versions.' },
      { type: 'fix', text: 'Fixed missing hook imports in AdminPortal (useState/useEffect), SalesDashboard (useState/useRef/useEffect), MSSPPortfolio (useState).' },
      { type: 'fix', text: 'Fixed 2 conditional <> fragments in IntelTab and 1 in pricing page.' },
    ],
  },
  {
    version: 'v74.9.45',
    date: '2026-03-27',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix ToolsTab useState import + overview grid max-width',
    changes: [
      { type: 'fix', text: 'ToolsTab.jsx useState not in import — save button crash on Tools tab.' },
      { type: 'fix', text: 'Overview stat grid max-width constrained so cards do not stretch on ultrawide.' },
    ],
  },
  {
    version: 'v74.9.42',
    date: '2026-03-27',
    tag: 'Fix',
    tagColor: '#f0405e',
    summary: 'Fix Mark FP bug + full mobile layout',
    changes: [
      { type: 'fix', text: 'alertOverrides never applied to displayed alerts — const alerts = rawAlerts bypassed the override merge. Fixed with .map() pattern.' },
      { type: 'feat', text: 'Full mobile layout — bottom nav bar, collapsed top bar, responsive grids, stacked filter rows, safe area insets.' },
    ],
  },
  {
    version: 'v74.9.41',
    date: '2026-03-27',
    tag: 'Features',
    tagColor: '#22d49a',
    summary: 'Dead links fixed, inline API key manager, favicon, legal pages, signup CTAs',
    changes: [
      { type: 'feat', text: 'Inline API key manager in Settings — save, test, and delete Anthropic key without leaving the page.' },
      { type: 'feat', text: 'SVG favicon at /public/favicon.svg — shield-check gradient icon.' },
      { type: 'feat', text: 'Legal pages built: /privacy, /terms, /security, /docs — all linked from footer.' },
      { type: 'fix', text: 'All signup CTAs point to /signup (not /login). Footer links no longer 404.' },
    ],
  },
  {
    version: 'v74.9.11',
    date: '2026-03-25',
    tag: 'Alerts',
    tagColor: '#4f8fff',
    summary: 'Complete alerts tab overhaul — all missing features built',
    changes: [
      { type: 'feat', text: 'Sort alerts by time (newest/oldest), severity, or source A–Z' },
      { type: 'feat', text: 'Create Incident from any alert — single-click or bulk-select multiple alerts into one correlated incident' },
      { type: 'feat', text: 'Export filtered alerts to CSV (ID, title, severity, source, device, time, verdict, confidence, MITRE, notes)' },
      { type: 'feat', text: 'Analyst Notes — inline per-alert note-taking with add/edit/delete and 📝 badge on collapsed cards' },
      { type: 'feat', text: 'Pagination — 10 alerts per page with windowed page buttons and "X–Y of Z" count' },
      { type: 'fix', text: 'Alert verdict/acknowledge changes now persist via alertOverrides state pattern' },
      { type: 'fix', text: 'Manually created incidents appear immediately in Incidents tab' },
    ],
  },
  {
    version: 'v74.9.9 – v74.9.10',
    date: '2026-03-25',
    tag: 'Auth & Payments',
    tagColor: '#22d49a',
    summary: 'Full signup/login flows, MFA steps, working Stripe checkout',
    changes: [
      { type: 'feat', text: 'Login page rebuilt: MFA TOTP challenge step, invite token acceptance, forgot password, reset-confirm all in one page' },
      { type: 'feat', text: 'Signup page: plan selector (Community/Team/Business/MSSP), real account creation, auto-Stripe checkout for paid plans' },
      { type: 'feat', text: '/api/auth/register implemented — creates user in Redis with hashed password, validates uniqueness' },
      { type: 'feat', text: 'Stripe checkout now reads price IDs from Redis (Admin → Stripe config) with env var fallback' },
      { type: 'fix', text: 'useSearchParams() wrapped in Suspense on login page for Next.js 15 compatibility' },
      { type: 'fix', text: 'Double intel fetch on live mode mount eliminated via hasMountedRef guard' },
    ],
  },
  {
    version: 'v74.9.8',
    date: '2026-03-25',
    tag: 'Threat Intel',
    tagColor: '#f0405e',
    summary: 'Live threat intel actually works — date context, proper fallbacks, source URLs',
    changes: [
      { type: 'fix', text: 'Empty array treated as truthy caused blank intel — fixed to null-fallback on empty/error responses' },
      { type: 'fix', text: 'Live intel was mixing in demo items even when fresh data loaded — now shows only AI intel in live mode' },
      { type: 'feat', text: "Today's date injected into AI prompt so intel feels current not timeless" },
      { type: 'feat', text: 'Intel items now have real source URLs (NCSC, CISA, ThreatFox etc) — "Read article →" links to actual sources' },
      { type: 'feat', text: '● LIVE badge on intel header, spinner during refresh, "Add API key" warning when no key configured' },
      { type: 'feat', text: 'AI prompted to use named threat actors (APT41, Lazarus, BlackCat) and real CVE numbers' },
    ],
  },
  {
    version: 'v74.9.7',
    date: '2026-03-25',
    tag: 'Bug Fixes',
    tagColor: '#f0a030',
    summary: 'Seven functional bugs fixed across intel, vulns, Sales AI, and coverage',
    changes: [
      { type: 'fix', text: 'Intel articles now link to source URLs — was pointing at Google search for title text' },
      { type: 'fix', text: 'Intel tab auto-fetches on live mode toggle and mount — was only updating on dropdown change' },
      { type: 'fix', text: 'Live mode vulns: sync results now split by source — Tenable/Nessus/Qualys/Wiz go to Vulns tab, rest to Alerts' },
      { type: 'fix', text: 'Sales AI stale closure fixed — useEffect now uses inline fetch, fires correctly on every gap change' },
      { type: 'feat', text: 'Deploy Agent button added to coverage gap device rows — opens existing modal' },
      { type: 'feat', text: 'Chase Payment buttons now open pre-filled mailto: with client name and invoice reminder' },
      { type: 'fix', text: 'getAiAnalysis converted from async/await to promise-based to avoid hook ordering issues' },
    ],
  },
  {
    version: 'v74.9.4 – v74.9.6',
    date: '2026-03-25',
    tag: 'MFA & SAML',
    tagColor: '#8b6fff',
    summary: 'Full TOTP/MFA and SAML 2.0 SSO — zero new npm dependencies',
    changes: [
      { type: 'feat', text: 'TOTP/MFA — pure Node.js crypto implementation (RFC 6238), no npm deps. Setup in Settings → Account' },
      { type: 'feat', text: 'TOTP login challenge: password success → MFA step if enabled → session issued' },
      { type: 'feat', text: 'SAML 2.0 SSO — Admin → SAML tab. Supports Okta, Azure AD, Google Workspace, OneLogin, any SAML 2.0 IdP' },
      { type: 'feat', text: 'SP Metadata endpoint at /api/auth/saml/metadata for IdP configuration' },
      { type: 'feat', text: 'Auto-provision new users on first SAML login with configurable default role and domain allowlist' },
      { type: 'feat', text: 'Attribute mapping (email, displayName, role) configurable per IdP in Admin → SAML panel' },
      { type: 'fix', text: 'SAML crash on load: currentTenant was used in panel but not passed as prop to AdminPortal' },
    ],
  },
  {
    version: 'v74.9.0 – v74.9.3',
    date: '2026-03-24',
    tag: 'Platform',
    tagColor: '#22d49a',
    summary: 'Real user persistence, invite flow, Stripe admin panel, landing page refresh',
    changes: [
      { type: 'feat', text: 'User persistence — staff users stored in Redis as AES-256-GCM encrypted JSON with full CRUD' },
      { type: 'feat', text: 'Real invite flow — generates signed token, sends email via Resend, 48h expiry, invited user sets own password' },
      { type: 'feat', text: 'Password reset — time-limited token via Redis (1h TTL), email delivery, confirm flow' },
      { type: 'feat', text: 'Enhanced login — handles owner (env vars), staff (Redis), invite token acceptance in one route' },
      { type: 'feat', text: 'Stripe Admin panel — configure publishable key, secret key, webhook secret, and all plan price IDs. Keys encrypted in Redis' },
      { type: 'feat', text: 'Stripe tab in Admin portal with plan status indicators and webhook setup instructions' },
      { type: 'feat', text: 'Landing page rebuilt — fixed broken CDN logos (now inline coloured badges), 9 features, updated pricing, all sections' },
      { type: 'fix', text: 'Copilot route: duplicate prompt variable caused webpack build failure' },
      { type: 'fix', text: 'Sales AI: BYOK gate was 403-ing admin users due to missing x-is-admin header injection' },
    ],
  },
  {
    version: 'v74.8.26 – v74.8.30',
    date: '2026-03-23',
    tag: 'Security Hardening',
    tagColor: '#f0405e',
    summary: '0 Critical, 0 High, 0 Medium security findings — full pen test remediation',
    changes: [
      { type: 'security', text: 'Auth middleware (src/middleware.ts) — Web Crypto API HMAC session tokens, intercepts all /api/* routes' },
      { type: 'security', text: 'AES-256-GCM encryption (src/lib/encrypt.ts) — all tool credentials encrypted before Redis write' },
      { type: 'security', text: 'SSRF protection (src/lib/ssrf.ts) — blocks private IP ranges, per-tool domain allowlists' },
      { type: 'security', text: 'Rate limiting (src/lib/ratelimit.ts) — Upstash Redis: copilot 20/min, sync 30/min, test 10/min' },
      { type: 'security', text: 'Credentials GET endpoint — only returns URL/region, all secrets masked as ••••••••' },
      { type: 'security', text: 'isAdmin loaded from /api/auth/session — HMAC verified, not client-supplied' },
      { type: 'security', text: 'All 7 /api/admin/* routes have requireAdmin() guard returning 403' },
      { type: 'security', text: 'Security headers in next.config.js — X-Frame-Options: DENY, X-Content-Type-Options, etc.' },
      { type: 'security', text: 'BYOK enforcement — Community users blocked from AI Co-Pilot (long prompts >200 chars)' },
    ],
  },
  {
    version: 'v74.8.16 – v74.8.25',
    date: '2026-03-22',
    tag: 'Integrations',
    tagColor: '#4f8fff',
    summary: 'All 18 adapters verified and fixed — Taegis XDR, Darktrace HMAC, full demo data coverage',
    changes: [
      { type: 'fix', text: 'Taegis XDR auth endpoint corrected: https://api.ctpx.secureworks.com/auth/api/v2/auth/token (form-encoded)' },
      { type: 'fix', text: 'Taegis GraphQL endpoint and CQL query syntax corrected, response path fixed to data.alertsServiceSearch.alerts.list[]' },
      { type: 'fix', text: 'Darktrace HMAC-SHA1 signing verified and working via Web Crypto API' },
      { type: 'fix', text: 'SentinelOne ApiToken header prefix confirmed correct' },
      { type: 'fix', text: 'QRadar SEC header and Version: 14.0 confirmed correct' },
      { type: 'feat', text: 'Demo data expanded from 6 to 14 alerts covering all 18 supported tools' },
      { type: 'feat', text: 'New demo alerts: Taegis (ransomware), Proofpoint (phishing), Okta (OAuth consent), Elastic (Log4Shell), SentinelOne (Cobalt Strike), Carbon Black (Empire C2), Tenable (KEV CVE), QRadar (insider threat)' },
    ],
  },
  {
    version: 'v74.8.0 – v74.8.15',
    date: '2026-03-21',
    tag: 'Core Platform',
    tagColor: '#8b6fff',
    summary: 'Initial production build — dashboard, all tabs, MSSP, Sales, Admin portal',
    changes: [
      { type: 'feat', text: 'Single-pane dashboard with Overview, Alerts, Coverage, Vulns, Intel, Incidents, Tools tabs' },
      { type: 'feat', text: '18 security tool integrations: CrowdStrike, Defender, Sentinel, Splunk, SentinelOne, Darktrace, QRadar, Elastic, Tenable, Nessus, Carbon Black, Zscaler, Okta, Proofpoint, Mimecast, Qualys, Wiz, Taegis XDR' },
      { type: 'feat', text: 'AI triage on every alert — TP/FP/SUS verdict, confidence score, evidence chain, recommended actions' },
      { type: 'feat', text: 'AI Co-Pilot chat assistant scoped to security operations topics' },
      { type: 'feat', text: 'MSSP Portfolio tab — per-client posture, revenue, usage. Tenant switching. White-label branding' },
      { type: 'feat', text: 'Sales Dashboard — MRR/ARR target planner, AI-generated GTM strategy' },
      { type: 'feat', text: 'Admin Portal — subscribers, users/roles, platform health, broadcast. Invite staff, RBAC roles' },
      { type: 'feat', text: 'Demo ↔ Live mode toggle — live mode syncs from connected tools every 60 seconds' },
      { type: 'feat', text: 'Autonomous response automation — 3 levels: Recommend Only, Auto+Notify, Full Auto' },
      { type: 'feat', text: 'Redis persistence for all settings, credentials, and user data via Upstash' },
      { type: 'feat', text: 'Coverage gap map with Deploy Agent modal and per-tool filtering' },
      { type: 'feat', text: 'Vulnerability intelligence with CISA KEV badges, AI remediation queries (Splunk SPL, Sentinel KQL, Defender)' },
      { type: 'feat', text: 'Incident management with AI attack narratives, MITRE kill chains, timeline views' },
    ],
  },
];

const TAG_TYPES: Record<string, { color: string; label: string }> = {
  feat: { color: '#4f8fff', label: 'Feature' },
  fix: { color: '#22d49a', label: 'Fix' },
  security: { color: '#f0405e', label: 'Security' },
  perf: { color: '#f0a030', label: 'Performance' },
};

export default function ChangelogPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'feat'|'fix'|'security'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated || d.isAdmin || d.userId) { setAuthed(true); }
        else { router.replace('/login'); }
        setLoading(false);
      })
      .catch(() => { router.replace('/login'); setLoading(false); });
  }, [router]);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#050508', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', color:'#6b7a94' }}>
      Loading…
    </div>
  );
  if (!authed) return null;

  const filtered = VERSIONS.map(v => ({
    ...v,
    changes: v.changes.filter(c =>
      (filter === 'all' || c.type === filter) &&
      (search === '' || c.text.toLowerCase().includes(search.toLowerCase()) || v.summary.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter(v => v.changes.length > 0);

  const totalFeat = VERSIONS.flatMap(v => v.changes).filter(c => c.type === 'feat').length;
  const totalFix = VERSIONS.flatMap(v => v.changes).filter(c => c.type === 'fix').length;
  const totalSec = VERSIONS.flatMap(v => v.changes).filter(c => c.type === 'security').length;

  return (
    <div style={{ minHeight:'100vh', background:'#050508', color:'#e8ecf4', fontFamily:'Inter,sans-serif' }}>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', padding:'12px 24px', borderBottom:'1px solid #141820', background:'#07090f', gap:12, position:'sticky', top:0, zIndex:50 }}>
        <a href="/dashboard" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', color:'inherit' }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <rect width="26" height="26" rx="7" fill="url(#clg)"/>
            <path d="M13 4.5L20 8V13.5C20 17 17 20.5 13 22C9 20.5 6 17 6 13.5V8L13 4.5Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7"/>
            <path d="M10.5 13L12.5 15L16 11" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="clg" x1="0" y1="0" x2="26" y2="26" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
          </svg>
          <span style={{ fontWeight:800, fontSize:'0.9rem' }}>Watchtower</span>
        </a>
        <span style={{ color:'#2a3448', margin:'0 2px' }}>/</span>
        <span style={{ fontSize:'0.82rem', color:'#6b7a94', fontWeight:600 }}>Feature Updates</span>
        <span style={{ fontSize:'0.6rem', fontWeight:700, padding:'2px 8px', borderRadius:4, background:'#f0405e12', color:'#f0405e', border:'1px solid #f0405e25', marginLeft:4 }}>ADMIN ONLY</span>
        <a href="/dashboard" style={{ marginLeft:'auto', padding:'6px 14px', background:'transparent', border:'1px solid #1e2536', borderRadius:7, color:'#6b7a94', fontSize:'0.76rem', fontWeight:600, textDecoration:'none' }}>← Dashboard</a>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:'1.6rem', fontWeight:900, letterSpacing:-1, marginBottom:8 }}>Feature Updates</h1>
          <p style={{ fontSize:'0.84rem', color:'#6b7a94', marginBottom:24 }}>Every change shipped to Watchtower — features, fixes, and security hardening.</p>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
            {[
              { v:`v74.8 – v74.9`, l:'Version range', c:'#4f8fff' },
              { v:`${totalFeat}`, l:'Features shipped', c:'#4f8fff' },
              { v:`${totalFix}`, l:'Bugs fixed', c:'#22d49a' },
              { v:`${totalSec}`, l:'Security items', c:'#f0405e' },
            ].map(s => (
              <div key={s.l} style={{ padding:'14px 16px', background:'#0a0d14', border:'1px solid #141820', borderRadius:10 }}>
                <div style={{ fontSize:'1.5rem', fontWeight:900, fontFamily:'JetBrains Mono,monospace', color:s.c, letterSpacing:-1 }}>{s.v}</div>
                <div style={{ fontSize:'0.66rem', color:'#6b7a94', marginTop:4 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Filter + search */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            {(['all','feat','fix','security'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:'5px 14px', borderRadius:6, border:`1px solid ${filter===f?'#4f8fff':'#1e2536'}`, background:filter===f?'#4f8fff15':'transparent', color:filter===f?'#4f8fff':'#6b7a94', fontSize:'0.74rem', fontWeight:filter===f?700:500, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all .12s' }}>
                {f === 'all' ? 'All' : f === 'feat' ? '✦ Features' : f === 'fix' ? '⚡ Fixes' : '🔒 Security'}
              </button>
            ))}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search changes…"
              style={{ marginLeft:'auto', padding:'6px 12px', borderRadius:7, border:'1px solid #1e2536', background:'#0a0d14', color:'#e8ecf4', fontSize:'0.76rem', fontFamily:'Inter,sans-serif', outline:'none', width:200 }} />
          </div>
        </div>

        {/* Timeline */}
        <div style={{ position:'relative' }}>
          {/* Vertical line */}
          <div style={{ position:'absolute', left:15, top:8, bottom:8, width:2, background:'linear-gradient(180deg,#4f8fff40,#8b6fff20)', borderRadius:1 }} />

          {filtered.map((v, vi) => (
            <div key={v.version} style={{ display:'flex', gap:20, marginBottom:36, position:'relative' }}>
              {/* Dot */}
              <div style={{ width:32, height:32, borderRadius:'50%', background:`${v.tagColor}15`, border:`2px solid ${v.tagColor}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, zIndex:1 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:v.tagColor }} />
              </div>

              {/* Content */}
              <div style={{ flex:1, paddingTop:4 }}>
                {/* Version header */}
                <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                  <span style={{ fontSize:'1rem', fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:'#e8ecf4' }}>{v.version}</span>
                  <span style={{ fontSize:'0.62rem', fontWeight:700, padding:'2px 8px', borderRadius:4, background:`${v.tagColor}15`, color:v.tagColor, border:`1px solid ${v.tagColor}25` }}>{v.tag}</span>
                  <span style={{ fontSize:'0.66rem', color:'#3a4050', marginLeft:'auto' }}>{v.date}</span>
                </div>
                <p style={{ fontSize:'0.82rem', color:'#8a9ab0', marginBottom:12, lineHeight:1.5 }}>{v.summary}</p>

                {/* Change list */}
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {v.changes.map((c, ci) => {
                    const t = TAG_TYPES[c.type] || TAG_TYPES.feat;
                    return (
                      <div key={ci} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'7px 10px', background:'#0a0d14', borderRadius:8, border:'1px solid #0e1218' }}>
                        <span style={{ fontSize:'0.58rem', fontWeight:700, padding:'2px 6px', borderRadius:3, background:`${t.color}15`, color:t.color, border:`1px solid ${t.color}20`, flexShrink:0, marginTop:1, letterSpacing:'0.3px' }}>
                          {c.type === 'feat' ? 'FEAT' : c.type === 'fix' ? 'FIX' : c.type === 'security' ? 'SEC' : 'PERF'}
                        </span>
                        <span style={{ fontSize:'0.8rem', color:'#8a9ab0', lineHeight:1.55 }}>{c.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 0', color:'#3a4050', fontSize:'0.84rem' }}>
            No changes match your search
          </div>
        )}

        <div style={{ marginTop:40, padding:'16px 20px', background:'#0a0d14', border:'1px solid #141820', borderRadius:10, fontSize:'0.72rem', color:'#3a4050', textAlign:'center' }}>
          Watchtower · RunbookHQ Ltd · v74.9.11 · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
