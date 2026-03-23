'use client';
import { useState } from 'react';

const SECTIONS = [
  {
    id: 'overview',
    title: '🗺 Overview',
    content: [
      {
        heading: 'What is Watchtower?',
        body: 'Watchtower is your AI-powered SOC in a single screen. It connects to all your security tools, ingests every alert, triages them with AI in under 3.2 seconds, and takes automated action where you allow it. Your analysts arrive to a clean queue — threats contained, noise eliminated.',
      },
      {
        heading: 'The three things it does',
        body: '1. Ingests alerts from all your connected tools into one feed.\n2. Triages every alert with AI — returning a verdict (TP/FP/Suspicious), confidence score, evidence chain, and recommended actions.\n3. Acts automatically (if you enable it) — isolating devices, blocking IPs, disabling accounts, notifying your team.',
      },
    ],
  },
  {
    id: 'tabs',
    title: '📊 Dashboard Tabs',
    content: [
      {
        heading: 'Overview',
        body: 'Your SOC command centre. Shows estate health at a glance: devices, tool status, alert ingestion counts, and vulnerability summary. Click any stat block to drill into detail. The AI Shift Brief at the top summarises what happened overnight.',
      },
      {
        heading: 'Alerts',
        body: 'Every alert ingested from your connected tools, triaged by AI. Each card shows the severity, source tool, device, MITRE technique, and AI verdict. Click any alert to expand it — you\'ll see the full AI reasoning, evidence chain, and what actions were taken. Alerts marked "AI acted" have already been responded to.',
      },
      {
        heading: 'Coverage',
        body: 'Shows which percentage of your estate is covered by each security tool, and which specific devices are missing agents. Use the "Deploy Agent" button on any gap device to initiate deployment. Fixing coverage gaps is one of the highest-value things you can do — unmonitored devices are blind spots.',
      },
      {
        heading: 'Vulns',
        body: 'Top 10 vulnerabilities ranked by severity × prevalence in your estate. CISA KEV badges mean the CVE is actively being exploited in the wild — treat these as 72-hour deadlines. Click any vuln to see affected devices, remediation steps, patch links, and ask the AI Remediation Assistant for tailored guidance.',
      },
      {
        heading: 'Intel',
        body: 'Live threat intelligence, filtered to your industry. Select your sector from the dropdown and Watchtower generates AI-curated intel relevant to your threat landscape — active threat actors, new CVEs being weaponised, sector-specific campaigns. If Darktrace is connected, you\'ll also see real-time network anomaly detections here.',
      },
      {
        heading: 'Incidents',
        body: 'Correlated incidents created automatically when multiple related alerts fire. Each incident has an AI-generated attack narrative, a MITRE ATT&CK kill chain, a full timeline showing AI and analyst actions, and affected devices. Use "Close Incident" when the threat is resolved — this updates the status and logs the closure time.',
      },
      {
        heading: 'Tools',
        body: 'Connect and manage all your security integrations. Click "+ Connect" on any tool, enter your API credentials, and hit "Test Connection" to validate before saving. Credentials are validated live against the vendor API. Use the category filter to find tools by type.',
      },
    ],
  },
  {
    id: 'automation',
    title: '⚡ Automation',
    content: [
      {
        heading: 'Three automation levels',
        body: 'Recommend Only — AI triages and suggests, but takes no action. Analysts review everything.\nAuto + Notify — AI acts on high-confidence verdicts (>90%) and notifies your team via Slack/email. Analysts review everything else.\nFull Auto — AI acts on all high-confidence verdicts without requiring approval. Recommended only after you\'ve validated AI accuracy on your environment.',
      },
      {
        heading: 'What "acting" means',
        body: 'Depending on your connected tools, the AI can: isolate a device from the network (via CrowdStrike/SentinelOne), block an IP at the perimeter (via Zscaler/firewall), disable a user account (via Okta/Azure AD), quarantine a file (via EDR). Every action is logged with a full audit trail and has a one-click revert button.',
      },
      {
        heading: 'Starting safely',
        body: 'We recommend starting on "Recommend Only" for your first 2 weeks. Review the AI verdicts manually and check they match your expectations. Once you\'re confident in accuracy, move to "Auto + Notify". Only move to "Full Auto" after at least a month of validated results.',
      },
    ],
  },
  {
    id: 'integrations',
    title: '🔌 Connecting Tools',
    content: [
      {
        heading: 'How to connect a tool',
        body: '1. Go to the Tools tab.\n2. Find your tool — use the category filter (EDR, SIEM, Vuln, etc.).\n3. Click "+ Connect".\n4. Enter the required credentials (API key, client ID/secret, host URL).\n5. Click "Test Connection" — this validates your credentials against the real API.\n6. If the test passes, click "Save & Connect".\n\nThe tool will start syncing alerts within 60 seconds.',
      },
      {
        heading: 'CrowdStrike — getting credentials',
        body: 'In the CrowdStrike Falcon console: API Clients & Keys → Add new API client. Required scopes: Detections:Read, Hosts:Read. Copy the Client ID and Client Secret shown at creation (the secret is only shown once).',
      },
      {
        heading: 'Microsoft Defender / Sentinel',
        body: 'Both require an Azure AD App Registration. In Azure portal: App Registrations → New registration → note the Application (Client) ID and Tenant ID. Under "Certificates & secrets" create a new client secret. For Defender, grant API permissions: WindowsDefenderATP → AdvancedQuery.Read.All, Alert.Read.All. For Sentinel, assign the Security Reader role on the workspace.',
      },
      {
        heading: 'Splunk',
        body: 'In Splunk: Settings → Tokens → New Token. The host should be your Splunk management port (default 8089). Watchtower queries the notable events index — ensure your ES Notable Events are populating for best results.',
      },
      {
        heading: 'Darktrace',
        body: 'In Darktrace: Admin → API Token Management → Create token pair. You need both the public and private tokens. The host is your Darktrace appliance URL. Watchtower uses HMAC-SHA1 signing for all requests.',
      },
    ],
  },
  {
    id: 'ai',
    title: '🤖 AI Features',
    content: [
      {
        heading: 'AI Triage',
        body: 'Every alert is automatically assessed by AI using context from: the alert itself, the device\'s history, the user\'s behaviour baseline, related alerts in the last 48 hours, and known threat intel. The result is a verdict (TP/FP/Suspicious), a confidence score (0–100%), and a full evidence chain explaining the reasoning.',
      },
      {
        heading: 'AI Co-Pilot',
        body: 'Ask the AI anything about your security posture. "What\'s the most critical thing to fix right now?", "Summarise all activity on DC01 in the last 24 hours", "Is this IP associated with any known threat actors?". Available on Team plan and above.',
      },
      {
        heading: 'AI Remediation Assistant',
        body: 'On any vulnerability, click "Ask AI for remediation help". The AI generates tailored remediation guidance for your specific environment — immediate mitigation steps, permanent fix, detection queries you can run in your SIEM, and business risk if left unpatched.',
      },
      {
        heading: 'Industry Threat Intel',
        body: 'In the Intel tab, select your industry from the dropdown. Watchtower generates AI-curated threat intelligence specific to your sector — which threat actors are targeting your industry right now, what TTPs they\'re using, and which CVEs are being weaponised in active campaigns.',
      },
    ],
  },
  {
    id: 'faq',
    title: '❓ FAQ',
    content: [
      {
        heading: 'Why is my alert count different from my SIEM?',
        body: 'Watchtower de-duplicates alerts across tools and applies a recency filter (last 24h by default on initial sync). Your SIEM may show lifetime totals. After the first sync, ongoing alerts arrive in real time.',
      },
      {
        heading: 'Can I trust the AI verdicts?',
        body: 'The AI achieves ~94% accuracy on high-confidence verdicts (>85% confidence). On lower-confidence verdicts, always have a human review. We recommend reviewing the evidence chain on every verdict for the first 2 weeks to build confidence in the AI\'s reasoning for your environment.',
      },
      {
        heading: 'What data does Watchtower store?',
        body: 'Watchtower stores alert metadata, AI verdicts, and action logs. Raw log data stays in your own SIEM. Integration credentials are encrypted at rest using AES-256 and never logged or shared.',
      },
      {
        heading: 'Who do I contact for support?',
        body: 'Email hello@getwatchtower.io — we typically respond within 2 hours during UK business hours. For critical production issues, include "URGENT" in the subject line.',
      },
      {
        heading: 'How do I add more seats or clients?',
        body: 'Go to /pricing and upgrade your plan, or email hello@getwatchtower.io. For MSSP clients, additional clients are £49/mo each and can be added instantly from your portfolio dashboard.',
      },
    ],
  },
];

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [search, setSearch] = useState('');

  const section = SECTIONS.find(s => s.id === activeSection);

  const filtered = search
    ? SECTIONS.flatMap(s => s.content
        .filter(c => c.heading.toLowerCase().includes(search.toLowerCase()) || c.body.toLowerCase().includes(search.toLowerCase()))
        .map(c => ({ ...c, section: s.title }))
      )
    : [];

  return (
    <div style={{ background: '#050508', color: '#e8ecf4', fontFamily: 'Inter, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`*{margin:0;padding:0;box-sizing:border-box} a{text-decoration:none;color:inherit}`}</style>

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #141820', background: '#07080f', gap: 12 }}>
        <a href='/' style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 800, fontSize: '0.92rem' }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg,#4f8fff,#8b6fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', color: '#fff', fontWeight: 900 }}>W</div>
          Watchtower
        </a>
        <span style={{ color: '#3a4050', fontSize: '0.8rem' }}>/</span>
        <span style={{ color: '#6b7a94', fontSize: '0.8rem' }}>User Guide</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <a href='/dashboard' style={{ padding: '6px 14px', borderRadius: 7, background: '#4f8fff', color: '#fff', fontSize: '0.76rem', fontWeight: 700 }}>← Back to Dashboard</a>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={{ width: 220, background: '#07080f', borderRight: '1px solid #141820', padding: '16px 0', flexShrink: 0, overflow: 'auto' }}>
          <div style={{ padding: '0 14px 12px' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search guide…' style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #1e2536', background: '#0a0d14', color: '#e8ecf4', fontSize: '0.74rem', fontFamily: 'Inter,sans-serif', outline: 'none' }} />
          </div>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => { setActiveSection(s.id); setSearch(''); }} style={{ width: '100%', textAlign: 'left', padding: '8px 16px', background: activeSection === s.id ? '#4f8fff12' : 'transparent', borderLeft: `3px solid ${activeSection === s.id ? '#4f8fff' : 'transparent'}`, border: 'none', color: activeSection === s.id ? '#e8ecf4' : '#6b7a94', fontSize: '0.78rem', fontWeight: activeSection === s.id ? 700 : 500, cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all .15s' }}>
              {s.title}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflow: 'auto', padding: '28px 36px', maxWidth: 760 }}>
          {search ? (
            <div>
              <div style={{ fontSize: '0.72rem', color: '#6b7a94', marginBottom: 16 }}>{filtered.length} results for "{search}"</div>
              {filtered.length === 0 && <div style={{ color: '#6b7a94', fontSize: '0.82rem' }}>No results found.</div>}
              {filtered.map((c, i) => (
                <div key={i} style={{ padding: '14px 16px', background: '#09091a', border: '1px solid #141820', borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#4f8fff', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.section}</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: 6 }}>{c.heading}</div>
                  <div style={{ fontSize: '0.76rem', color: '#8a9ab0', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{c.body}</div>
                </div>
              ))}
            </div>
          ) : section ? (
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: -1, marginBottom: 24 }}>{section.title}</h1>
              {section.content.map((c, i) => (
                <div key={i} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: i < section.content.length - 1 ? '1px solid #141820' : 'none' }}>
                  <h2 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 8, color: '#e8ecf4' }}>{c.heading}</h2>
                  <div style={{ fontSize: '0.8rem', color: '#8a9ab0', lineHeight: 1.85, whiteSpace: 'pre-line' }}>{c.body}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
