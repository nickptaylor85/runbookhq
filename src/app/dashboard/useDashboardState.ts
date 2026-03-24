'use client';
import { useState, useEffect } from 'react';
import type { ConnectedMap } from './ToolsTab';
import {
  DEMO_TOOLS, DEMO_ALERTS, DEMO_VULNS, DEMO_INCIDENTS,
  DEMO_GAP_DEVICES, DEMO_INTEL_BY_INDUSTRY,
  TENANT_ALERTS, TENANT_VULNS, TENANT_INCIDENTS,
  ALL_TOOLS,
} from './dashboardData';
import type {
  Alert, Vuln, Incident, GapDevice, IntelItem, AutomationLevel, Theme, Tier,
} from './dashboardTypes';

export function useDashboardState() {
  const [activeTab, setActiveTab] = useState('overview');
  const [automation, setAutomation] = useState<AutomationLevel>(1);
  const [modal, setModal] = useState<{ type: string; data?: unknown } | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedVuln, setSelectedVuln] = useState<Vuln | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [vulnAiLoading, setVulnAiLoading] = useState<string | null>(null);
  const [vulnAiTexts, setVulnAiTexts] = useState<Record<string, string>>({});
  const [industry, setIndustry] = useState('Financial Services');
  const [intelLoading, setIntelLoading] = useState(false);
  const [customIntel, setCustomIntel] = useState<IntelItem[] | null>(null);
  const [expandedAlerts, setExpandedAlerts] = useState(new Set<string>());
  const [deployAgentDevice, setDeployAgentDevice] = useState<GapDevice | null>(null);
  const [incidentStatuses, setIncidentStatuses] = useState<Record<string, string>>({});
  const [deletedIncidents, setDeletedIncidents] = useState(new Set<string>());
  const [gapToolFilter, setGapToolFilter] = useState<string | null>(null);
  const [expandedIntel, setExpandedIntel] = useState(new Set<string>());
  const [demoMode, setDemoMode] = useState(true);
  const [connectedTools, setConnectedTools] = useState<ConnectedMap>({});
  const [currentTenant, setCurrentTenant] = useState('global');
  const [isAdmin] = useState(true);
  const [theme, setTheme] = useState<Theme>('dark');
  const [userTier, setUserTier] = useState<Tier>('community');

  const DEMO_TENANTS = [
    { id: 'global', name: 'My Organisation', type: 'direct' },
    { id: 'client-acme', name: 'Acme Financial', type: 'client' },
    { id: 'client-nhs', name: 'NHS Trust Alpha', type: 'client' },
    { id: 'client-retail', name: 'RetailCo UK', type: 'client' },
    { id: 'client-gov', name: 'Gov Dept Beta', type: 'client' },
  ];

  // Load persisted industry from Redis on mount
  useEffect(() => {
    fetch('/api/settings/user')
      .then(r => r.json())
      .then(d => { if (d.settings && d.settings.industry) setIndustry(d.settings.industry); })
      .catch(() => {});
  }, []);

  // Theme uses localStorage so it applies before hydration (avoids flash)
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('wt_theme') : null;
    if (saved === 'light') setTheme('light');
  }, []);

  function setIndustryPersisted(ind: string) {
    setIndustry(ind);
    fetch('/api/settings/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry: ind }),
    }).catch(() => {});
  }

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof window !== 'undefined') localStorage.setItem('wt_theme', next);
  }

  function toggleIntel(id: string) {
    setExpandedIntel(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  }

  function toggleAlertExpand(id: string) {
    setExpandedAlerts(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  }

  function closeIncident(id: string) {
    setIncidentStatuses(prev => ({ ...prev, [id]: 'Closed' }));
    setSelectedIncident(null);
  }

  function deleteIncident(id: string) {
    setDeletedIncidents(prev => new Set([...prev, id]));
    setSelectedIncident(null);
  }

  async function fetchIntelForIndustry(ind: string) {
    setIntelLoading(true);
    setCustomIntel(null);
    try {
      const resp = await fetch('/api/intel/industry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: ind }),
      });
      if (resp.ok) {
        const d = await resp.json();
        setCustomIntel(d.items);
      }
    } catch (_e) { /* silent */ }
    setIntelLoading(false);
  }

  async function getVulnAiHelp(vuln: Vuln) {
    setVulnAiLoading(vuln.id);
    const prompt = [
      'For ' + vuln.cve + ' (' + vuln.title + '), provide threat-hunting and detection information.',
      'Use ALL-CAPS section headers: DETECTION QUERIES, KNOWN IOCS AND INDICATORS, COMPENSATING CONTROLS, COMMON MISTAKES, ATTACK CHAINING.',
      'Under DETECTION QUERIES include: SPLUNK QUERY FOR [purpose], MICROSOFT SENTINEL KQL: [purpose] (SecurityEvent/SigninLogs/AuditLogs tables), MICROSOFT DEFENDER ADVANCED HUNTING: [purpose] (DeviceProcessEvents/DeviceNetworkEvents/DeviceFileEvents tables).',
      'No markdown, no backticks, plain text only.',
    ].join(' ');
    try {
      const resp = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (resp.ok) {
        const d = await resp.json();
        const text = d.response || d.message || 'AI unavailable — check your Anthropic API key in Tools.';
        let i = 0;
        const interval = setInterval(() => {
          setVulnAiTexts(prev => ({ ...prev, [vuln.id]: text.slice(0, i) }));
          i++;
          if (i > text.length) clearInterval(interval);
        }, 12);
      } else {
        setVulnAiTexts(prev => ({ ...prev, [vuln.id]: 'Request failed — check your Anthropic API key.' }));
      }
    } catch (_e) {
      setVulnAiTexts(prev => ({ ...prev, [vuln.id]: 'Request failed — check your Anthropic API key.' }));
    }
    setVulnAiLoading(null);
  }

  // Derived values
  const tierMap: Record<string, number> = { community: 0, team: 1, business: 2, mssp: 3 };
  const tierLevel = tierMap[userTier] || 0;
  const canUse = (min: Tier) => tierLevel >= tierMap[min];

  const tools = DEMO_TOOLS;
  const rawAlerts = TENANT_ALERTS[currentTenant] || DEMO_ALERTS;
  const connectedToolNames = new Set(
    Object.keys(connectedTools).map(id => {
      const found = ALL_TOOLS.find(t => t.id === id);
      return found ? found.name.split(' ')[0].toLowerCase() : id;
    })
  );
  const alerts = demoMode && Object.keys(connectedTools).length > 0
    ? rawAlerts.filter(a => !connectedToolNames.has(a.source.toLowerCase().split(' ')[0]))
    : rawAlerts;
  const vulns = TENANT_VULNS[currentTenant] || DEMO_VULNS;
  const incidents = TENANT_INCIDENTS[currentTenant] || DEMO_INCIDENTS;

  const activeTools = tools.filter(t => t.active);
  const totalDevices = 247;
  const gapDevices = DEMO_GAP_DEVICES;
  const coveredPct = Math.round(((totalDevices - gapDevices.length) / totalDevices) * 100);
  const critAlerts = alerts.filter(a => a.severity === 'Critical');
  const tpAlerts = alerts.filter(a => a.verdict === 'TP');
  const fpAlerts = alerts.filter(a => a.verdict === 'FP');
  const critVulns = vulns.filter(v => v.severity === 'Critical');
  const kevVulns = vulns.filter(v => v.kev);
  const posture = 74;
  const postureColor = '#f0a030';

  const autLabels = ['Recommend Only', 'Auto + Notify', 'Full Auto'];
  const autColors = ['#6b7a94', '#f0a030', '#22d49a'];
  const autLabel = autLabels[automation];
  const autColor = autColors[automation];

  const actedAlerts = alerts.filter(a => {
    if (automation === 0) return false;
    if (automation === 1) return a.verdict === 'FP' && a.confidence >= 90;
    return a.confidence >= 80;
  });
  const alertPlural = actedAlerts.length !== 1 ? 's' : '';
  const tpContained = alerts.filter(a => a.verdict === 'TP' && a.confidence >= 80).length;
  const fpSuppressed = alerts.filter(a => a.verdict === 'FP' && a.confidence >= 80).length;
  const automationBannerText = automation === 0
    ? 'AI is recommending only — all actions require analyst approval.'
    : automation === 1
    ? 'AI auto-closed ' + actedAlerts.length + ' high-confidence false positive' + alertPlural + ' and notified your team.'
    : 'AI acted autonomously on ' + actedAlerts.length + ' alert' + alertPlural + ' — ' + tpContained + ' threats contained, ' + fpSuppressed + ' FPs suppressed.';

  const intelItems = customIntel || DEMO_INTEL_BY_INDUSTRY[industry] || DEMO_INTEL_BY_INDUSTRY['default'];
  const allIntel = [...intelItems, ...DEMO_INTEL_BY_INDUSTRY['default'].filter(i => !intelItems.find((x: IntelItem) => x.id === i.id))];

  const TABS = ['overview', 'alerts', 'coverage', 'vulns', 'intel', 'incidents', 'tools', 'mssp'];

  return {
    // State
    activeTab, setActiveTab,
    automation, setAutomation,
    modal, setModal,
    selectedAlert, setSelectedAlert,
    selectedVuln, setSelectedVuln,
    selectedIncident, setSelectedIncident,
    vulnAiLoading, vulnAiTexts, setVulnAiTexts,
    industry, setIndustryPersisted,
    intelLoading, customIntel,
    expandedAlerts, expandedIntel,
    deployAgentDevice, setDeployAgentDevice,
    incidentStatuses, deletedIncidents,
    gapToolFilter, setGapToolFilter,
    demoMode, setDemoMode,
    connectedTools, setConnectedTools,
    currentTenant, setCurrentTenant,
    isAdmin,
    theme, toggleTheme,
    userTier, setUserTier,
    DEMO_TENANTS,
    // Functions
    toggleIntel, toggleAlertExpand,
    closeIncident, deleteIncident,
    fetchIntelForIndustry, getVulnAiHelp,
    canUse,
    // Derived
    tools, alerts, vulns, incidents,
    activeTools, totalDevices, gapDevices, coveredPct,
    critAlerts, tpAlerts, fpAlerts, critVulns, kevVulns,
    posture, postureColor,
    autLabel, autColor, actedAlerts, automationBannerText,
    intelItems, allIntel,
    TABS,
  };
}
