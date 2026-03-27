'use client';
import AlertsTab from './AlertsTab';
import React, { useState, useEffect } from 'react';
import MSSPPortfolio from './MSSPPortfolio';
import ToolsTab from './ToolsTab';
import SalesDashboard from './SalesDashboard';
import AdminPortal from './AdminPortal';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_TOOLS = [
  {id:'crowdstrike',name:'CrowdStrike Falcon',category:'EDR',desc:'Endpoint detection & response'},
  {id:'defender',name:'Microsoft Defender',category:'EDR',desc:'Defender for Endpoint — Azure AD app required'},
  {id:'sentinelone',name:'SentinelOne',category:'EDR',desc:'AI-powered endpoint protection'},
  {id:'carbonblack',name:'Carbon Black',category:'EDR',desc:'Carbon Black Cloud'},
  {id:'splunk',name:'Splunk SIEM',category:'SIEM',desc:'Splunk Enterprise Security or Cloud'},
  {id:'sentinel',name:'Microsoft Sentinel',category:'SIEM',desc:'Cloud-native SIEM — Azure AD app required'},
  {id:'qradar',name:'IBM QRadar',category:'SIEM',desc:'Security intelligence platform'},
  {id:'elastic',name:'Elastic Security',category:'SIEM',desc:'SIEM built on Elastic Stack'},
  {id:'darktrace',name:'Darktrace',category:'NDR',desc:'AI network anomaly detection — HMAC auth'},
  {id:'taegis',name:'Secureworks Taegis',category:'XDR',desc:'Extended detection & response'},
  {id:'tenable',name:'Tenable.io',category:'Vuln',desc:'Cloud vulnerability management'},
  {id:'nessus',name:'Nessus',category:'Vuln',desc:'On-premise vulnerability scanner'},
  {id:'qualys',name:'Qualys',category:'Vuln',desc:'Cloud-based vulnerability management'},
  {id:'wiz',name:'Wiz',category:'CSPM',desc:'Cloud security posture management'},
  {id:'proofpoint',name:'Proofpoint',category:'Email',desc:'Email security & threat protection'},
  {id:'mimecast',name:'Mimecast',category:'Email',desc:'Email security platform'},
  {id:'zscaler',name:'Zscaler',category:'Network',desc:'Zero trust network access'},
  {id:'okta',name:'Okta',category:'Identity',desc:'Identity & access management'},
];


const DASHBOARD_CSS = '*{margin:0;padding:0;box-sizing:border-box}\n        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}\n        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}\n\n        /* ── Dark theme (default) ── */\n        .wt-root {\n          --wt-bg: #050508;\n          --wt-sidebar: #07080f;\n          --wt-card: #09091a;\n          --wt-card2: #0a0d14;\n          --wt-border: #141820;\n          --wt-border2: #1e2536;\n          --wt-text: #e8ecf4;\n          --wt-muted: #6b7a94;\n          --wt-secondary: #8a9ab0;\n          --wt-dim: #3a4050;\n        }\n        /* ── Light theme ── */\n        .wt-root.light {\n          --wt-bg: #f5f6fa;\n          --wt-sidebar: #ffffff;\n          --wt-card: #ffffff;\n          --wt-card2: #f0f2f8;\n          --wt-border: #e2e5ef;\n          --wt-border2: #c8cedd;\n          --wt-text: #0f1117;\n          --wt-muted: #5a6580;\n          --wt-secondary: #4a5568;\n          --wt-dim: #8090a8;\n        }\n\n        .tab-btn{padding:7px 16px;border:none;background:transparent;cursor:pointer;font-size:0.76rem;font-weight:600;font-family:Inter,sans-serif;border-radius:8px;transition:all .15s;white-space:nowrap;color:var(--wt-muted)}\n        .tab-btn.active{background:#4f8fff18;color:#4f8fff}\n        .tab-btn:not(.active) {color:var(--wt-secondary);background:var(--wt-card2)}\n        .row-hover{transition:background .12s}\n        .row-hover:hover{background:var(--wt-card2)!important}\n        .vuln-row:hover{background:var(--wt-card2)!important;cursor:pointer}\n        .alert-card{border-radius:10px;border:1px solid var(--wt-border);background:var(--wt-card);transition:border-color .15s}\n        .alert-card:hover{border-color:#4f8fff28}';

const CRED_FIELDS = {
  crowdstrike:[{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true},{key:'base_url',label:'Base URL (optional)',placeholder:'https://api.crowdstrike.com'}],
  defender:[{key:'tenant_id',label:'Tenant ID',placeholder:'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'},{key:'client_id',label:'Application (Client) ID'},{key:'client_secret',label:'Client Secret',secret:true}],
  sentinelone:[{key:'host',label:'Management URL',placeholder:'https://your-tenant.sentinelone.net'},{key:'api_token',label:'API Token',secret:true}],
  carbonblack:[{key:'host',label:'CB Cloud URL',placeholder:'https://defense.conferdeploy.net'},{key:'org_key',label:'Org Key'},{key:'api_id',label:'API ID'},{key:'api_secret',label:'API Secret Key',secret:true}],
  splunk:[{key:'host',label:'Splunk Host',placeholder:'https://splunk.company.com:8089'},{key:'token',label:'API Token',secret:true}],
  sentinel:[{key:'tenant_id',label:'Tenant ID'},{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true},{key:'subscription_id',label:'Subscription ID'},{key:'resource_group',label:'Resource Group'},{key:'workspace',label:'Workspace Name'}],
  qradar:[{key:'host',label:'QRadar Host',placeholder:'https://qradar.company.com'},{key:'sec_token',label:'SEC Token',secret:true}],
  elastic:[{key:'host',label:'Kibana URL',placeholder:'https://kibana.company.com'},{key:'api_key',label:'API Key',secret:true},{key:'space',label:'Space ID (optional)',placeholder:'default'}],
  darktrace:[{key:'host',label:'Darktrace Hostname',placeholder:'https://darktrace.company.com'},{key:'public_key',label:'Public Token'},{key:'private_key',label:'Private Token',secret:true}],
  taegis:[{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true},{key:'region',label:'Region',placeholder:'us1'}],
  tenable:[{key:'access_key',label:'Access Key'},{key:'secret_key',label:'Secret Key',secret:true}],
  nessus:[{key:'host',label:'Nessus Host',placeholder:'https://nessus.company.com:8834'},{key:'access_key',label:'Access Key'},{key:'secret_key',label:'Secret Key',secret:true}],
  qualys:[{key:'platform',label:'Platform URL',placeholder:'https://qualysapi.qualys.com'},{key:'username',label:'Username'},{key:'password',label:'Password',secret:true}],
  wiz:[{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true},{key:'api_endpoint',label:'API Endpoint',placeholder:'https://api.eu1.app.wiz.io/graphql'}],
  proofpoint:[{key:'principal',label:'Service Principal'},{key:'secret',label:'Secret',secret:true}],
  mimecast:[{key:'base_url',label:'Base URL',placeholder:'https://eu-api.mimecast.com'},{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true}],
  zscaler:[{key:'cloud',label:'Cloud URL',placeholder:'https://zsapi.zscaler.net'},{key:'username',label:'Username'},{key:'password',label:'Password',secret:true},{key:'api_key',label:'API Key',secret:true}],
  okta:[{key:'domain',label:'Okta Domain',placeholder:'https://company.okta.com'},{key:'api_token',label:'API Token',secret:true}],
};

const CATEGORIES = ['All','EDR','SIEM','NDR','XDR','Vuln','CSPM','Email','Network','Identity'];
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [automation, setAutomation] = useState(1);
  const [modal, setModal] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [vulnAiLoading, setVulnAiLoading] = useState(null);
  const [vulnAiTexts, setVulnAiTexts] = useState({});
  const [industry, setIndustry] = useState('Financial Services');
  // Load persisted settings from Redis on mount
  useEffect(()=>{
    fetch('/api/settings/user')
      .then(r=>r.json())
      .then(d=>{
        if (d.settings?.industry) {
          setIndustry(d.settings.industry);
          // Auto-fetch live intel on mount with saved industry
          if (d.settings.demoMode !== 'true') {
            fetchIntelForIndustry(d.settings.industry);
          }
        }
        if (d.settings?.demoMode !== undefined) setDemoMode(d.settings.demoMode === 'true');
        if (d.settings?.automation !== undefined) setAutomation(Number(d.settings.automation));
        if (d.settings?.userTier) setUserTier(d.settings.userTier);
        if (d.settings?.clientBanner) setClientBanner(d.settings.clientBanner || null);
      })
      .catch(()=>{});
  },[]);
  function setIndustryPersisted(ind) {
    setIndustry(ind);
    fetch('/api/settings/user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({industry:ind})}).catch(()=>{});
  }
  const [intelLoading, setIntelLoading] = useState(false);
  const [customIntel, setCustomIntel] = useState(null);
  const [expandedAlerts, setExpandedAlerts] = useState(new Set());
  // Alerts tab features
  const [alertSearch, setAlertSearch] = useState('');
  const [alertSevFilter, setAlertSevFilter] = useState('all');
  const [alertSrcFilter, setAlertSrcFilter] = useState('all');
  const [alertSort, setAlertSort] = useState('time-desc');
  const [alertPage, setAlertPage] = useState(0);
  const [selectedAlerts, setSelectedAlerts] = useState(new Set());
  const [alertNotes, setAlertNotes] = useState({});
  const [editingNote, setEditingNote] = useState(null);
  const [createdIncidents, setCreatedIncidents] = useState([]);
  const [alertOverrides, setAlertOverrides] = useState({});
  const [deployAgentDevice, setDeployAgentDevice] = useState(null);
  const [incidentStatuses, setIncidentStatuses] = useState({});
  const [deletedIncidents, setDeletedIncidents] = useState(new Set());
  function deleteIncident(id) { setDeletedIncidents(prev=>new Set([...prev,id])); setSelectedIncident(null); }
  const [incidentNotes, setIncidentNotes] = useState({});
  const [noteInput, setNoteInput] = useState('');
  const [addingNoteTo, setAddingNoteTo] = useState(null);
  const [gapToolFilter, setGapToolFilter] = useState(null);
  const [expandedIntel, setExpandedIntel] = useState(new Set());
  const [iocQueries, setIocQueries] = useState({});
  const [iocQueryLoading, setIocQueryLoading] = useState(null);
  const [demoMode, setDemoMode] = useState(true);
  const [clientBanner, setClientBanner] = useState(null);
  const [adminBannerInput, setAdminBannerInput] = useState('');
  const [connectedTools, setConnectedTools] = useState({});
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [liveVulns, setLiveVulns] = useState([]);
  const [aiTriageCache, setAiTriageCache] = useState({}); // alertId → {loading, result}
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | ok | error
  const [syncError, setSyncError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [currentTenant, setCurrentTenant] = useState('global');

  // Load persisted tool connections from Redis
  useEffect(()=>{
    fetch('/api/integrations/credentials')
      .then(r=>r.json())
      .then(d=>{
        if (d.connected && Object.keys(d.connected).length > 0) setConnectedTools(d.connected);
        setCredentialsLoaded(true);
      })
      .catch(()=>{ setCredentialsLoaded(true); });
  },[]);

  // Sync live data — only after credentials loaded, only in LIVE mode
  useEffect(()=>{
    if (!credentialsLoaded || demoMode || Object.keys(connectedTools).length === 0) return;
    const doSync = () => {
      setSyncStatus('syncing');
      setSyncError(null);
      const integrations = Object.entries(connectedTools).map(([id, credentials]) => ({id, credentials}));
      fetch('/api/integrations/sync', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({integrations: integrations.map(i=>({id:i.id})), since: Date.now() - 7*24*60*60*1000}),
      })
      .then(r=>r.json())
      .then(d=>{
        if (d.results) {
          const VULN_SOURCES = new Set(['tenable','nessus','qualys','wiz']);
          const allItems = d.results.flatMap(r => r.alerts || []);
          const vulnItems = allItems.filter(a => VULN_SOURCES.has((a.source||'').toLowerCase().split('').filter(c=>c>='a'&&c<='z').join('')));
          const alertItems = allItems.filter(a => !VULN_SOURCES.has((a.source||'').toLowerCase().split('').filter(c=>c>='a'&&c<='z').join('')));
          setLiveAlerts(alertItems);
          if (vulnItems.length > 0) {
            setLiveVulns(vulnItems.map(v => ({
              id: v.id,
              cve: (v.tags||[]).find(t => t?.startsWith?.('CVE')) || v.sourceId || 'N/A',
              title: v.title,
              severity: v.severity,
              cvss: v.confidence ? (v.confidence / 10).toFixed(1) : 'N/A',
              kev: (v.tags||[]).includes('kev'),
              affected: 1,
              affectedDevices: v.device ? [v.device] : [],
              description: v.description || v.title,
              source: v.source,
              rawTime: v.rawTime,
            })));
          }
          // Check for per-tool errors
          const errors = d.results.filter(r=>r.error).map(r=>`${r.toolId}: ${r.error}`);
          if (errors.length > 0) { setSyncError(errors.join(' · ')); setSyncStatus('error'); }
          else { setSyncStatus('ok'); }
        } else {
          setSyncStatus('error'); setSyncError(d.error || 'Sync failed');
        }
        setLastSynced(new Date().toLocaleTimeString());
      })
      .catch(e=>{ setSyncStatus('error'); setSyncError(e.message); });
    };
    doSync();
    const interval = setInterval(doSync, 60000);
    return () => clearInterval(interval);
  },[demoMode, connectedTools, credentialsLoaded]);

  // When switching to live mode, auto-fetch fresh intel
  useEffect(()=>{
    if (!demoMode) {
      fetchIntelForIndustry(industry);
    } else {
      setCustomIntel(null); // Clear live intel when switching back to demo
    }
  },[demoMode]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null); // null=owner, 'tech_admin', 'viewer', 'sales'
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [userTier, setUserTier] = useState('community');
  const [theme, setTheme] = useState('dark');

  const DEMO_TENANTS = [
    {id:'global', name:'My Organisation', type:'direct'},
    {id:'client-acme', name:'Acme Financial', type:'client'},
    {id:'client-nhs', name:'NHS Trust Alpha', type:'client'},
    {id:'client-retail', name:'RetailCo UK', type:'client'},
    {id:'client-gov', name:'Gov Dept Beta', type:'client'},
  ];

  function toggleIntel(id) {
    setExpandedIntel(prev => { const n = new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  }

  // Load session — check auth and get isAdmin from server
  useEffect(()=>{
    fetch('/api/auth/session')
      .then(r=>r.json())
      .then(d=>{
        if (d.authenticated) {
          setIsAdmin(d.isAdmin || false);
          if (d.role) setUserRole(d.role);
          if (d.tenantId) setCurrentTenant(d.tenantId);
        }
        setSessionLoaded(true);
      })
      .catch(()=>{ setSessionLoaded(true); });
  },[]);

  // Theme preference intentionally uses localStorage — it must apply synchronously
  // before React hydrates to avoid a dark→light flash. Not user data, pure display state.
  useEffect(()=>{
    const saved = typeof window !== 'undefined' ? localStorage.getItem('wt_theme') : null;
    if (saved === 'light') setTheme('light');
  },[]);

  // Live triage: trigger AI triage when alert expanded in live mode
  useEffect(()=>{
    if (demoMode) return;
    expandedAlerts.forEach(alertId=>{
      if (aiTriageCache[alertId]) return;
      const al = alerts.find(a=>a.id===alertId);
      if (!al) return;
      setAiTriageCache(prev=>({...prev,[alertId]:{loading:true,result:null}}));
      fetch('/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({prompt:'Triage this security alert in under 100 words. Verdict (True Positive/False Positive/Suspicious), confidence %, and key reasoning.\n\nAlert: '+al.title+'\nSource: '+al.source+'\nSeverity: '+al.severity})})
        .then(r=>r.json())
        .then(d=>setAiTriageCache(prev=>({...prev,[alertId]:{loading:false,result:d.ok?{reasoning:d.response}:null}})))
        .catch(()=>setAiTriageCache(prev=>({...prev,[alertId]:{loading:false,result:null}})));
    });
  },[expandedAlerts,demoMode]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof window !== 'undefined') localStorage.setItem('wt_theme', next);
  }

  // ── Tier ─────────────────────────────────────────────────────────────────────
  // In production this comes from the session/JWT. Change to test paywalls.
  const tierLevel = {community:0,team:1,business:2,mssp:3}[userTier];
  const canUse = (min) => tierLevel >= {community:0,team:1,business:2,mssp:3}[min];

  // ── Per-tenant demo data ──────────────────────────────────────────────────────
  const TENANT_ALERTS = {
    'global': DEMO_ALERTS,
    'client-acme': DEMO_ALERTS.slice(0,3).map(a=>({...a, id:a.id+'-acme', device:'acme-'+a.device, source:a.source})),
    'client-nhs': DEMO_ALERTS.slice(1,4).map(a=>({...a, id:a.id+'-nhs', device:'nhs-'+a.device, severity:a.severity==='Low'?'Medium':a.severity})),
    'client-retail': DEMO_ALERTS.slice(0,2).map(a=>({...a, id:a.id+'-retail', device:'retail-'+a.device})),
    'client-gov': DEMO_ALERTS.slice(2,5).map(a=>({...a, id:a.id+'-gov', device:'gov-'+a.device})),
  };
  const TENANT_VULNS = {
    'global': DEMO_VULNS,
    'client-acme': DEMO_VULNS.slice(0,4).map(v=>({...v, id:v.id+'-acme', affected: Math.max(1, Math.round(v.affected*0.6)), affectedDevices: v.affectedDevices.map(d=>'acme-'+d)})),
    'client-nhs': DEMO_VULNS.slice(0,7).map(v=>({...v, id:v.id+'-nhs', affected: Math.max(1, Math.round(v.affected*1.4)), affectedDevices: v.affectedDevices.map(d=>'nhs-'+d)})),
    'client-retail': DEMO_VULNS.slice(0,5).map(v=>({...v, id:v.id+'-retail', affectedDevices: v.affectedDevices.map(d=>'retail-'+d)})),
    'client-gov': DEMO_VULNS.slice(1,6).map(v=>({...v, id:v.id+'-gov', affectedDevices: v.affectedDevices.map(d=>'gov-'+d)})),
  };
  const TENANT_INCIDENTS = {
    'global': DEMO_INCIDENTS,
    'client-acme': DEMO_INCIDENTS.slice(0,1).map(i=>({...i, id:'INC-ACME-01', title:'[Acme] '+i.title})),
    'client-nhs': DEMO_INCIDENTS.map(i=>({...i, id:'INC-NHS-'+i.id.slice(-2), title:'[NHS] '+i.title})),
    'client-retail': [],
    'client-gov': DEMO_INCIDENTS.slice(0,1).map(i=>({...i, id:'INC-GOV-01', title:'[Gov] '+i.title})),
  };

  // Tool status: in DEMO show demo-active tools; in LIVE show connected tools
  const tools = ALL_TOOLS.map(t => {
    const isConnected = !!connectedTools[t.id];
    const demo = DEMO_TOOLS.find(d=>d.id===t.id);
    return {
      id: t.id, name: t.name,
      configured: isConnected || (!demoMode ? false : (demo?.configured || false)),
      active: demoMode ? (demo?.active || false) : isConnected,
      alertCount: demo?.alertCount,
    };
  }).filter(t => demoMode ? DEMO_TOOLS.find(d=>d.id===t.id) : t.active);

  // DEMO: always use demo data. LIVE: use live data if available, else empty (not demo)
  const rawAlerts = demoMode
    ? (TENANT_ALERTS[currentTenant] || DEMO_ALERTS)
    : liveAlerts;
  const alerts = rawAlerts;
  const vulns = demoMode
    ? (TENANT_VULNS[currentTenant] || DEMO_VULNS)
    : liveVulns.length > 0 ? liveVulns : (TENANT_VULNS[currentTenant] || DEMO_VULNS);
  const incidents = [...createdIncidents, ...(TENANT_INCIDENTS[currentTenant]||DEMO_INCIDENTS).filter(i=>!createdIncidents.find(c=>c.id===i.id))];

  const activeTools = tools.filter(t=>t.active);
  const taegisActive = tools.find(t=>t.id==='taegis')?.active || false;
  const darktrace = tools.find(t=>t.id==='darktrace');
  const totalDevices = 247;
  const gapDevices = DEMO_GAP_DEVICES;
  const coveredPct = Math.round(((totalDevices - gapDevices.length) / totalDevices) * 100);
  const critAlerts = alerts.filter(a=>a.severity==='Critical');
  const tpAlerts = alerts.filter(a=>a.verdict==='TP');
  const fpAlerts = alerts.filter(a=>a.verdict==='FP');
  const critVulns = vulns.filter(v=>v.severity==='Critical');
  const kevVulns = vulns.filter(v=>v.kev);
  const posture = 74;
  const postureColor = '#f0a030';

  const autLabel = ['Recommend Only','Auto + Notify','Full Auto'][automation];
  const autColor = ['#6b7a94','#f0a030','#22d49a'][automation];
  // Automation effects: filter what's "acted on" based on level
  const actedAlerts = alerts.filter(a => {
    if (automation === 0) return false; // Recommend Only — no auto actions
    if (automation === 1) return a.verdict === 'FP' && a.confidence >= 90; // Auto+Notify — auto-close high-confidence FPs only
    return a.confidence >= 80; // Full Auto — act on all high-confidence verdicts
  });
  const automationBannerText = automation === 0
    ? 'AI is recommending only — all actions require analyst approval.'
    : automation === 1
    ? `AI auto-closed ${actedAlerts.length} high-confidence false positive${actedAlerts.length!==1?'s':''} and notified your team.`
    : `AI acted autonomously on ${actedAlerts.length} alert${actedAlerts.length!==1?'s':''} — ${alerts.filter(a=>a.verdict==='TP'&&a.confidence>=80).length} threats contained, ${alerts.filter(a=>a.verdict==='FP'&&a.confidence>=80).length} FPs suppressed.`;

  const intelItems = customIntel || (DEMO_INTEL_BY_INDUSTRY[industry] || DEMO_INTEL_BY_INDUSTRY['default']);
  const allIntel = [...intelItems, ...DEMO_INTEL_BY_INDUSTRY['default'].filter(i=>!intelItems.find(x=>x.id===i.id))];

  async function fetchIntelForIndustry(ind) {
    setIntelLoading(true);
    setCustomIntel(null);
    try {
      const resp = await fetch('/api/intel/industry', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({industry:ind}) });
      if (resp.ok) { const d = await resp.json(); setCustomIntel(d.items); }
    } catch(e) {}
    setIntelLoading(false);
  }

  async function getVulnAiHelp(vuln, queryType) {
    const loadKey = vuln.id + ':' + queryType;
    setVulnAiLoading(loadKey);
    const prompts = {
      splunk: 'For ' + vuln.cve + ' (' + vuln.title + '), write 2-3 production-ready Splunk SPL detection queries. Use realistic Splunk index/sourcetype names. Label each: SPLUNK QUERY FOR [purpose]. Immediately follow each label with the query. No markdown, no backticks, plain text only.',
      sentinel: 'For ' + vuln.cve + ' (' + vuln.title + '), write 2-3 production-ready Microsoft Sentinel KQL detection queries using these tables: SecurityEvent, SigninLogs, AuditLogs, CommonSecurityLog, DeviceEvents. Label each: MICROSOFT SENTINEL KQL: [purpose]. Immediately follow each label with the query. No markdown, no backticks, plain text only.',
      defender: 'For ' + vuln.cve + ' (' + vuln.title + '), write 2-3 production-ready Microsoft Defender Advanced Hunting KQL queries using these tables: DeviceProcessEvents, DeviceNetworkEvents, DeviceFileEvents, DeviceRegistryEvents, IdentityLogonEvents. Label each: MICROSOFT DEFENDER ADVANCED HUNTING: [purpose]. Immediately follow each label with the query. No markdown, no backticks, plain text only.',
      iocs: 'For ' + vuln.cve + ' (' + vuln.title + '), provide known IOCs and threat indicators. Structure with these ALL-CAPS headers: KNOWN IP ADDRESSES, FILE HASHES, DOMAINS AND URLS, PROCESS INDICATORS, REGISTRY KEYS, MITRE TECHNIQUES. No markdown, plain text only.',
    };
    try {
      const resp = await fetch('/api/copilot', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt: prompts[queryType]}) });
      if (resp.ok) {
        const d = await resp.json();
        const text = d.response || d.message || 'AI response unavailable — check your Anthropic API key in the Tools tab.';
        let i = 0;
        const interval = setInterval(()=>{ setVulnAiTexts(prev=>({...prev,[loadKey]:text.slice(0,i)})); i++; if(i>text.length) clearInterval(interval); }, 12);
      } else {
        setVulnAiTexts(prev=>({...prev,[loadKey]:'Request failed — check your Anthropic API key in the Tools tab.'}));
      }
    } catch(e) {
      setVulnAiTexts(prev=>({...prev,[loadKey]:'Request failed — check your Anthropic API key in the Tools tab.'}));
    }
    setVulnAiLoading(null);
  }

  function closeIncident(id) {
    setIncidentStatuses(prev=>({...prev,[id]:'Closed'}));
    setSelectedIncident(null);
  }

  function toggleAlertExpand(id) {
    setExpandedAlerts(prev => { const n = new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  }

  const TABS = ['overview','alerts','coverage','vulns','intel','incidents','tools','mssp'];
  const isSales = userRole === 'sales' || isAdmin;
  const isViewer = userRole === 'viewer';
  const isTechAdmin = userRole === 'tech_admin' || isAdmin;

  // ── Alerts tab: derived sort/filter/page vars ──────────────────────────────
  const ALERT_SEV_ORDER = {Critical:0,High:1,Medium:2,Low:3};
  const alertsFiltered = alerts
    .filter(a=>!alertSearch || a.title.toLowerCase().includes(alertSearch.toLowerCase()) || (a.device||'').toLowerCase().includes(alertSearch.toLowerCase()) || (a.source||'').toLowerCase().includes(alertSearch.toLowerCase()))
    .filter(a=>alertSevFilter==='all' || a.severity===alertSevFilter)
    .filter(a=>alertSrcFilter==='all' || a.source===alertSrcFilter);
  const alertsSorted = alertSort==='time-asc' ? [...alertsFiltered].reverse()
    : alertSort==='sev-desc' ? [...alertsFiltered].sort((a,b)=>(ALERT_SEV_ORDER[a.severity]||4)-(ALERT_SEV_ORDER[b.severity]||4))
    : alertSort==='sev-asc' ? [...alertsFiltered].sort((a,b)=>(ALERT_SEV_ORDER[b.severity]||4)-(ALERT_SEV_ORDER[a.severity]||4))
    : alertSort==='src-asc' ? [...alertsFiltered].sort((a,b)=>a.source.localeCompare(b.source))
    : alertsFiltered;
  const ALERT_PAGE_SIZE = 10;
  const alertTotalPages = Math.ceil(alertsSorted.length / ALERT_PAGE_SIZE);
  const alertPageClamped = Math.min(alertPage, Math.max(0, alertTotalPages-1));
  const alertsPaged = alertsSorted.slice(alertPageClamped*ALERT_PAGE_SIZE, (alertPageClamped+1)*ALERT_PAGE_SIZE);
  // ── End alerts derived vars ────────────────────────────────────────────────

  return (
    <div className={`wt-root${theme === 'light' ? ' light' : ''}`} style={{display:'flex',minHeight:'100vh',background:'var(--wt-bg)',color:'var(--wt-text)',fontFamily:'Inter,sans-serif'}}>
      <style dangerouslySetInnerHTML={{__html:DASHBOARD_CSS}} />

      {/* SIDEBAR */}
      <div style={{width:48,background:'var(--wt-sidebar)',borderRight:'1px solid #141820',display:'flex',flexDirection:'column',alignItems:'center',padding:'10px 0',gap:4,flexShrink:0}}>
        <div style={{width:34,height:34,marginBottom:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" rx="9" fill="url(#wg)"/>
            <path d="M17 7L26 11V18C26 22.5 22 26.5 17 28C12 26.5 8 22.5 8 18V11L17 7Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
            <path d="M17 10L24 13.5V18.5C24 21.8 21 24.8 17 26C13 24.8 10 21.8 10 18.5V13.5L17 10Z" fill="rgba(255,255,255,0.1)"/>
            <path d="M14.5 18L16.5 20L20.5 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="wg" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
          </svg>
        </div>
        {[{t:'overview',i:'📊'},{t:'alerts',i:'🔔'},{t:'coverage',i:'🛡'},{t:'vulns',i:'🔍'},{t:'intel',i:'🌐'},{t:'incidents',i:'📋'},{t:'tools',i:'🔌'}].map(({t,i})=>(
          <button key={t} onClick={()=>setActiveTab(t)} title={t.charAt(0).toUpperCase()+t.slice(1)} style={{width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,fontSize:'0.85rem',border:'none',cursor:'pointer',background:activeTab===t?'#4f8fff18':'transparent',transition:'background .15s'}}>
            {i}{t==='alerts'&&critAlerts.length>0&&<span style={{position:'absolute',marginLeft:16,marginTop:-16,width:7,height:7,borderRadius:'50%',background:'#f0405e',display:'block'}} />}
          </button>
        ))}
        <div style={{marginTop:'auto',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
          {isAdmin && (
            <button onClick={()=>setActiveTab('admin')} title='Admin Portal'
              style={{width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',
                borderRadius:8,fontSize:'0.85rem',border:`1px solid ${activeTab==='admin'?'#f0a03040':'transparent'}`,
                cursor:'pointer',background:activeTab==='admin'?'#f0a03018':'transparent',
                transition:'all .15s',position:'relative'}}>
              🔧
              {activeTab!=='admin' && <span style={{position:'absolute',top:3,right:3,width:5,height:5,borderRadius:'50%',background:'#f0a030',boxShadow:'0 0 4px #f0a030'}} />}
            </button>
          )}
          <a href='/guide' title='User Guide' style={{width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,fontSize:'0.85rem',color:'inherit',textDecoration:'none'}}>📖</a>
          <a href='/settings' title='Settings' style={{width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,fontSize:'0.85rem',color:'inherit',textDecoration:'none'}}>⚙️</a>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* Client message banner */}
        {clientBanner && (
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 18px',background:'#f0a03015',borderBottom:'1px solid #f0a03030',flexShrink:0}}>
            <span style={{fontSize:'0.78rem'}}>📢</span>
            <span style={{fontSize:'0.74rem',color:'#f0c070',flex:1,fontWeight:500}}>{clientBanner}</span>
            {!isAdmin && <button onClick={()=>setClientBanner(null)} style={{padding:'2px 8px',borderRadius:5,border:'1px solid #f0a03030',background:'transparent',color:'#f0a030',fontSize:'0.62rem',cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Dismiss ×</button>}
          </div>
        )}

        {/* TOP BAR */}
        <div style={{display:'flex',alignItems:'center',padding:'8px 18px',borderBottom:'1px solid #141820',gap:12,background:'var(--wt-sidebar)',flexShrink:0,flexWrap:'wrap'}}>
          <div style={{display:'flex',gap:2,flexWrap:'wrap'}}>
            {TABS.filter(t=>{
              if (t==='mssp') return userTier==='mssp';
              if (isViewer) return ['overview','alerts','coverage','vulns','intel','incidents'].includes(t);
              return true;
            }).map(t=>(
              <button key={t} className={`tab-btn${activeTab===t?' active':''}`} onClick={()=>setActiveTab(t)}>
                {t==='mssp'?'Portfolio':t.charAt(0).toUpperCase()+t.slice(1)}
                {t==='alerts'&&critAlerts.length>0&&<span style={{marginLeft:5,fontSize:'0.48rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:'#f0405e',color:'#fff'}}>{critAlerts.length}</span>}
                {t==='vulns'&&kevVulns.length>0&&<span style={{marginLeft:5,fontSize:'0.48rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:'#f97316',color:'#fff'}}>{kevVulns.length} KEV</span>}
              </button>
            ))}
            {isSales && (
              <button className={`tab-btn${activeTab==='sales'?' active':''}`} onClick={()=>setActiveTab('sales')}
                style={{color:activeTab==='sales'?'#22d49a':undefined,background:activeTab==='sales'?'#22d49a18':undefined}}>
                📈 Sales
              </button>
            )}
            {isAdmin && (
              <button className={`tab-btn${activeTab==='admin'?' active':''}`} onClick={()=>setActiveTab('admin')}
                style={{color:activeTab==='admin'?'#f0a030':undefined,background:activeTab==='admin'?'#f0a03018':undefined}}>
                🔧 Admin
              </button>
            )}
          </div>
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:10}}>
            <button onClick={toggleTheme} title={theme==='dark'?'Light mode':'Dark mode'} style={{width:32,height:32,borderRadius:8,border:'1px solid var(--wt-border)',background:'var(--wt-card)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.9rem',flexShrink:0}}>{theme==='dark'?'☀️':'🌙'}</button>
              <button onClick={()=>setDemoMode(d=>{
                const next=!d;
                fetch('/api/settings/user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({demoMode:String(next)})}).catch(()=>{});
                return next;
              })} title={demoMode?'Switch to live data':'Switch to demo data'} style={{padding:'4px 10px',borderRadius:7,border:`1px solid ${demoMode?'#f0a03030':'#22d49a30'}`,background:demoMode?'#f0a03010':'#22d49a10',color:demoMode?'#f0a030':'#22d49a',fontSize:'0.62rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>{demoMode?'● DEMO':'● LIVE'}</button>
              <select value={userTier} onChange={e=>{
                setUserTier(e.target.value);
                fetch('/api/settings/user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userTier:e.target.value})}).catch(()=>{});
              }} title='Simulate plan tier' style={{padding:'3px 7px',borderRadius:6,border:'1px solid #8b6fff30',background:'#8b6fff10',color:'#8b6fff',fontSize:'0.6rem',fontWeight:700,fontFamily:'Inter,sans-serif',cursor:'pointer',outline:'none'}} >
                {(['community','team','business','mssp']).map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
              {isAdmin && (
                <select value={currentTenant} onChange={e=>setCurrentTenant(e.target.value)} style={{padding:'4px 8px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'var(--wt-card)',color:'var(--wt-text)',fontSize:'0.68rem',fontFamily:'Inter,sans-serif',cursor:'pointer',outline:'none',maxWidth:140}}>
                  {DEMO_TENANTS.map(t=>(
                    <option key={t.id} value={t.id}>{t.type==='client'?'◦ ':''}{t.name}</option>
                  ))}
                </select>
              )}
            {canUse('team') ? (
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:7,background:'var(--wt-card2)',border:'1px solid #141820'}}>
              <span style={{fontSize:'0.62rem',color:'var(--wt-muted)'}}>Automation:</span>
              {(['Recommend','Auto+Notify','Full Auto']).map((l,i)=>(
                <button key={l} onClick={()=>{
                  setAutomation(i);
                  fetch('/api/settings/user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({automation:String(i)})}).catch(()=>{});
                }} style={{padding:'2px 8px',borderRadius:4,fontSize:'0.58rem',fontWeight:700,border:'none',cursor:'pointer',background:automation===i?`${autColor}`:'transparent',color:automation===i?'#fff':'#6b7a94',fontFamily:'Inter,sans-serif',transition:'all .15s'}}>{l}</button>
              ))}
            </div>
            ) : (
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:7,background:'var(--wt-card2)',border:'1px solid #4f8fff20',opacity:0.7,cursor:'not-allowed'}} title='Upgrade to Team to enable automation'>
              <span style={{fontSize:'0.62rem',color:'var(--wt-muted)'}}>Automation:</span>
              <a href='/pricing' style={{fontSize:'0.58rem',color:'#4f8fff',fontWeight:700,textDecoration:'none'}}>🔒 Upgrade to Team</a>
            </div>
            )}
            <div style={{display:'flex',alignItems:'center',gap:5,fontSize:'0.7rem',color:'var(--wt-muted)'}}>
              {demoMode && <span style={{display:'inline-flex',alignItems:'center',gap:5}}><span style={{width:6,height:6,borderRadius:'50%',background:'#f0a030',display:'block'}} />{tools.filter(t=>t.active).length} tools (demo)</span>}
              {!demoMode && syncStatus==='syncing' && <span style={{display:'inline-flex',alignItems:'center',gap:5}}><span style={{width:8,height:8,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}} /><span style={{color:'#4f8fff'}}>Syncing…</span></span>}
              {!demoMode && syncStatus==='error' && <span style={{display:'inline-flex',alignItems:'center',gap:5}}><span style={{width:6,height:6,borderRadius:'50%',background:'#f0405e',display:'block'}} /><span style={{color:'#f0405e'}} title={syncError||''}>Sync error</span></span>}
              {!demoMode && syncStatus==='ok' && <span style={{display:'inline-flex',alignItems:'center',gap:5}}><span style={{width:6,height:6,borderRadius:'50%',background:'#22c992',boxShadow:'0 0 6px #22c992',display:'block'}} />{tools.filter(t=>t.active).length} live · {lastSynced}</span>}
              {!demoMode && syncStatus==='idle' && <span style={{display:'inline-flex',alignItems:'center',gap:5}}><span style={{width:6,height:6,borderRadius:'50%',background:'#6b7a94',display:'block'}} />{Object.keys(connectedTools).length} connected</span>}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{flex:1,overflow:'auto',padding:'16px 18px',background:'var(--wt-bg)'}}>

          {/* LIVE MODE — no data yet banner */}
          {!demoMode && liveAlerts.length === 0 && Object.keys(connectedTools).length > 0 && (
            <div style={{padding:'12px 16px',background:'#4f8fff08',border:'1px solid #4f8fff20',borderRadius:10,marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
              {syncStatus==='syncing' ? <span style={{width:12,height:12,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite',flexShrink:0}} /> : <span style={{fontSize:'0.9rem'}}>📡</span>}
              <div>
                <div style={{fontSize:'0.74rem',fontWeight:700,color:'#4f8fff'}}>{syncStatus==='syncing'?'Fetching live data from connected tools…':'Live mode — awaiting first sync'}</div>
                {syncError && <div style={{fontSize:'0.64rem',color:'#f0405e',marginTop:2}}>{syncError}</div>}
                {!syncError && syncStatus!=='syncing' && <div style={{fontSize:'0.64rem',color:'var(--wt-muted)',marginTop:1}}>Connected: {Object.keys(connectedTools).join(', ')} · Data syncs every 60s</div>}
              </div>
            </div>
          )}
          {!demoMode && Object.keys(connectedTools).length === 0 && (
            <div style={{padding:'12px 16px',background:'#f0a03008',border:'1px solid #f0a03020',borderRadius:10,marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:'0.9rem'}}>🔌</span>
              <div>
                <div style={{fontSize:'0.74rem',fontWeight:700,color:'#f0a030'}}>No tools connected — switch to Demo mode or connect a tool</div>
                <div style={{fontSize:'0.64rem',color:'var(--wt-muted)',marginTop:1}}>Go to the Tools tab to connect Taegis, Tenable, CrowdStrike and more</div>
              </div>
              <button onClick={()=>setDemoMode(true)} style={{marginLeft:'auto',padding:'5px 12px',borderRadius:6,border:'1px solid #f0a03030',background:'#f0a03010',color:'#f0a030',fontSize:'0.66rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Switch to Demo</button>
            </div>
          )}

          {/* ═══════════════════════════════ OVERVIEW ═══════════════════════════════ */}
          {activeTab==='overview' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>

              {/* AI Brief */}
              <div style={{padding:'12px 16px',background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(34,201,146,0.05))',border:'1px solid #4f8fff18',borderRadius:12,display:'flex',alignItems:'flex-start',gap:10}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:'#4f8fff',boxShadow:'0 0 8px #4f8fff',flexShrink:0,marginTop:2,animation:'pulse 3s ease infinite'}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff',marginBottom:3}}>AI SHIFT BRIEF — {new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div>
                  <div style={{fontSize:'0.78rem',color:'var(--wt-secondary)',lineHeight:1.65}}>Processed {alerts.length} alerts this session. Auto-closed {fpAlerts.length} false positives. Escalated {tpAlerts.length} true positives to incidents. <strong style={{color:'#f0405e'}}>{critAlerts.length} critical alerts</strong> require immediate attention. Estate coverage at {coveredPct}% — {gapDevices.length} devices missing agents.</div>
                </div>
                <span style={{fontSize:'0.62rem',color:'#22d49a',fontWeight:700,background:'#22d49a12',padding:'3px 8px',borderRadius:4,flexShrink:0}}>AI Active</span>
              </div>

              {/* Estate Health 2×2 */}
              <div>
                <div style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Estate Health</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>

                  {/* Devices + Gaps */}
                  <div onClick={()=>setModal({type:'gaps'})} style={{padding:16,background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12,cursor:'pointer',transition:'border-color .15s'}}
                    onMouseEnter={e=>(e.currentTarget).style.borderColor='#4f8fff40'}
                    onMouseLeave={e=>(e.currentTarget).style.borderColor='var(--wt-border)'}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:2}}>Devices</div>
                        <div style={{fontSize:'2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',letterSpacing:-2,color:'var(--wt-text)'}}>{totalDevices}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',marginBottom:2}}>{gapDevices.length} with gaps</div>
                        <div style={{fontSize:'0.52rem',color:'var(--wt-dim)'}}>Click to view →</div>
                      </div>
                    </div>
                    <div style={{height:6,background:'var(--wt-border)',borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',background:'linear-gradient(90deg,#22d49a,#4f8fff)',borderRadius:3,width:`${coveredPct}%`,transition:'width 1s'}} />
                    </div>
                    <div style={{fontSize:'0.6rem',color:'var(--wt-muted)',marginTop:4}}>{coveredPct}% agent coverage</div>
                  </div>

                  {/* Tool Status */}
                  <div onClick={()=>setModal({type:'tools'})} style={{padding:16,background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12,cursor:'pointer',transition:'border-color .15s'}}
                    onMouseEnter={e=>(e.currentTarget).style.borderColor='#4f8fff40'}
                    onMouseLeave={e=>(e.currentTarget).style.borderColor='var(--wt-border)'}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:2}}>Tool Status</div>
                        <div style={{fontSize:'2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',letterSpacing:-2,color:'#22d49a'}}>{activeTools.length}<span style={{fontSize:'1rem',color:'var(--wt-dim)'}}>/{tools.length}</span></div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.62rem',fontWeight:700,color:tools.filter(t=>!t.active).length>0?'#f0a030':'#22d49a',marginBottom:2}}>{tools.filter(t=>!t.active).length} inactive</div>
                        <div style={{fontSize:'0.52rem',color:'var(--wt-dim)'}}>Click to manage →</div>
                      </div>
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {tools.map(t=>(
                        <span key={t.id} style={{fontSize:'0.52rem',fontWeight:600,padding:'2px 7px',borderRadius:4,background:t.active?'#22d49a12':'#f0a03012',color:t.active?'#22d49a':'#f0a030',border:`1px solid ${t.active?'#22d49a20':'#f0a03020'}`}}>{t.name}</span>
                      ))}
                    </div>
                  </div>

                  {/* Alert Sources */}
                  <div onClick={()=>setModal({type:'alerts-ingested'})} style={{padding:16,background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12,cursor:'pointer',transition:'border-color .15s'}}
                    onMouseEnter={e=>(e.currentTarget).style.borderColor='#4f8fff40'}
                    onMouseLeave={e=>(e.currentTarget).style.borderColor='var(--wt-border)'}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:2}}>Alerts Ingested</div>
                        <div style={{fontSize:'2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',letterSpacing:-2,color:'#4f8fff'}}>{alerts.length}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',marginBottom:2}}>{critAlerts.length} critical</div>
                        <div style={{fontSize:'0.52rem',color:'var(--wt-dim)'}}>Click for AI detail →</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      {[{l:'TP',v:tpAlerts.length,c:'#f0405e'},{l:'FP',v:fpAlerts.length,c:'#22d49a'},{l:'SUS',v:alerts.filter(a=>a.verdict==='SUS').length,c:'#f0a030'}].map(s=>(
                        <div key={s.l} style={{flex:1,textAlign:'center',padding:'4px 0',background:'var(--wt-bg)',borderRadius:6}}>
                          <div style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.c}}>{s.v}</div>
                          <div style={{fontSize:'0.5rem',color:'var(--wt-dim)',fontWeight:700}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vulns / SLA */}
                  <div onClick={()=>setActiveTab('vulns')} style={{padding:16,background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12,cursor:'pointer',transition:'border-color .15s'}}
                    onMouseEnter={e=>(e.currentTarget).style.borderColor='#4f8fff40'}
                    onMouseLeave={e=>(e.currentTarget).style.borderColor='var(--wt-border)'}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:'0.72rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:2}}>Vulnerabilities</div>
                        <div style={{fontSize:'2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',letterSpacing:-2,color:'#f0405e'}}>{vulns.length}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',marginBottom:2}}>{kevVulns.length} KEV — patch now</div>
                        <div style={{fontSize:'0.52rem',color:'var(--wt-dim)'}}>Click for details →</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      {[{l:'Crit',v:critVulns.length,c:'#f0405e'},{l:'High',v:vulns.filter(v=>v.severity==='High').length,c:'#f97316'},{l:'Med',v:vulns.filter(v=>v.severity==='Medium').length,c:'#f0a030'}].map(s=>(
                        <div key={s.l} style={{flex:1,textAlign:'center',padding:'4px 0',background:'var(--wt-bg)',borderRadius:6}}>
                          <div style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.c}}>{s.v}</div>
                          <div style={{fontSize:'0.5rem',color:'var(--wt-dim)',fontWeight:700}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Row */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {/* Recent Alerts */}
                <div style={{padding:'14px 16px',background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                    <div style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'1px',flex:1}}>Recent Alerts</div>
                    <button onClick={()=>setActiveTab('alerts')} style={{fontSize:'0.58rem',color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:600}}>View all →</button>
                  </div>
                  {alerts.slice(0,4).map(a=>(
                    <div key={a.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:'1px solid var(--wt-border)'}}>
                      <div style={{width:4,height:24,borderRadius:2,background:SEV_COLOR[a.severity],flexShrink:0}} />
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'0.72rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.title}</div>
                        <div style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>{a.source} · {a.device} · {a.time}</div>
                      </div>
                      <span style={{fontSize:'0.52rem',fontWeight:700,padding:'1px 5px',borderRadius:3,background:VERDICT_STYLE[a.verdict].bg,color:VERDICT_STYLE[a.verdict].c,flexShrink:0}}>{a.verdict}</span>
                    </div>
                  ))}
                </div>
                {/* Active Incidents */}
                <div style={{padding:'14px 16px',background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                    <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',textTransform:'uppercase',letterSpacing:'1px',flex:1}}>Active Incidents</div>
                    <button onClick={()=>setActiveTab('incidents')} style={{fontSize:'0.58rem',color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:600}}>View all →</button>
                  </div>
                  {incidents.filter(i=>(incidentStatuses[i.id]||i.status)!=='Closed').slice(0,3).map(inc=>(
                    <div key={inc.id} onClick={()=>{setActiveTab('incidents');setSelectedIncident(inc);}} style={{padding:'6px 0',borderBottom:'1px solid var(--wt-border)',cursor:'pointer'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                        <span style={{fontSize:'0.6rem',fontWeight:700,color:'#4f8fff',fontFamily:'JetBrains Mono,monospace'}}>{inc.id}</span>
                        <SevBadge sev={inc.severity} />
                        <span style={{fontSize:'0.52rem',padding:'1px 5px',borderRadius:3,background:'#f0405e12',color:'#f0405e',fontWeight:700,border:'1px solid #f0405e20'}}>{(incidentStatuses[inc.id]||inc.status).toUpperCase()}</span>
                      </div>
                      <div style={{fontSize:'0.7rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{inc.title}</div>
                      <div style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>{inc.alertCount} alerts · {inc.devices.length} devices</div>
                    </div>
                  ))}
                  {incidents.filter(i=>(incidentStatuses[i.id]||i.status)!=='Closed').length===0 && (
                    <div style={{fontSize:'0.72rem',color:'var(--wt-muted)',padding:'12px 0',textAlign:'center'}}>✓ No active incidents</div>
                  )}
                </div>
              </div>

              {/* Top Active Threats */}
              <div style={{padding:'14px 16px',background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                  <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0a030',textTransform:'uppercase',letterSpacing:'1px',flex:1}}>🔥 Top Threats Right Now</div>
                  <button onClick={()=>setActiveTab('intel')} style={{fontSize:'0.58rem',color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:600}}>View intel →</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  {[
                    {title:'CVE-2024-21413',desc:'Outlook NTLM — CISA KEV',color:'#f0405e',badge:'CRITICAL'},
                    {title:'TA505 Active',desc:'Cobalt Strike campaign — fin. sector',color:'#f0a030',badge:'HIGH'},
                    {title:'LockBit 3.0',desc:'New infra post-takedown',color:'#f0a030',badge:'HIGH'},
                  ].map(t=>(
                    <div key={t.title} style={{padding:'8px 10px',background:'var(--wt-card2)',border:`1px solid ${t.color}18`,borderRadius:8}}>
                      <div style={{fontSize:'0.52rem',fontWeight:800,color:t.color,marginBottom:3}}>{t.badge}</div>
                      <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:2}}>{t.title}</div>
                      <div style={{fontSize:'0.6rem',color:'var(--wt-muted)'}}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Posture */}
              <div style={{display:'flex',alignItems:'center',gap:12,padding:16,background:'var(--wt-card)',border:'1px solid #141820',borderRadius:12}}>
                <div style={{position:'relative',width:64,height:64,flexShrink:0}}>
                  <svg viewBox='0 0 100 100' style={{width:'100%',height:'100%'}}>
                    <circle cx={50} cy={50} r={42} fill='none' stroke='var(--wt-border)' strokeWidth={8} />
                    <circle cx={50} cy={50} r={42} fill='none' stroke={postureColor} strokeWidth={8} strokeDasharray={`${(posture/100)*264} 264`} strokeLinecap='round' transform='rotate(-90 50 50)' style={{transition:'stroke-dasharray 1s ease'}} />
                  </svg>
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-60%)',fontSize:'1.2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:postureColor}}>{posture}</div>
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,45%)',fontSize:'0.6rem',fontWeight:800,color:postureColor}}>C+</div>
                </div>
                <div>
                  <div style={{fontSize:'0.82rem',fontWeight:700,marginBottom:3}}>Security Posture</div>
                  <div style={{fontSize:'0.74rem',color:'var(--wt-muted)',lineHeight:1.6}}>{critAlerts.length} critical alerts active · {kevVulns.length} KEV patches outstanding · {gapDevices.length} devices uncovered</div>
                  <div style={{fontSize:'0.64rem',color:'#f0a030',marginTop:4}}>⚠ Under pressure — address critical alerts and KEV patches to improve grade</div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════ ALERTS ══════════════════════════════════ */}{activeTab==='alerts' && (
              <AlertsTab
                alerts={alerts} demoMode={demoMode} automation={automation}
                autColor={autColor} autLabel={autLabel}
                fpAlerts={fpAlerts} tpAlerts={tpAlerts}
                alertSearch={alertSearch} setAlertSearch={setAlertSearch}
                alertSevFilter={alertSevFilter} setAlertSevFilter={setAlertSevFilter}
                alertSrcFilter={alertSrcFilter} setAlertSrcFilter={setAlertSrcFilter}
                alertSort={alertSort} setAlertSort={setAlertSort}
                alertPage={alertPage} setAlertPage={setAlertPage}
                alertTotalPages={alertTotalPages} alertPageClamped={alertPageClamped}
                alertsSorted={alertsSorted} alertsFiltered={alertsFiltered}
                alertsPaged={alertsPaged} ALERT_PAGE_SIZE={ALERT_PAGE_SIZE}
                selectedAlerts={selectedAlerts} setSelectedAlerts={setSelectedAlerts}
                expandedAlerts={expandedAlerts} setExpandedAlerts={setExpandedAlerts}
                alertNotes={alertNotes} setAlertNotes={setAlertNotes}
                editingNote={editingNote} setEditingNote={setEditingNote}
                noteInput={noteInput} setNoteInput={setNoteInput}
                alertOverrides={alertOverrides} setAlertOverrides={setAlertOverrides}
                aiTriageCache={aiTriageCache}
                createdIncidents={createdIncidents} setCreatedIncidents={setCreatedIncidents}
                setActiveTab={setActiveTab} userTier={userTier}
              />
            )}

          {/* ═══════════════════════════════ COVERAGE ═══════════════════════════════ */}
          {activeTab==='coverage' && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Coverage</h2>
                <span style={{fontSize:'0.62rem',color:coveredPct>=90?'#22d49a':'#f0a030',background:coveredPct>=90?'#22d49a12':'#f0a03012',padding:'2px 8px',borderRadius:4}}>{coveredPct}% estate covered</span>
              </div>

              {/* Per-tool coverage */}
              <div>
                <div style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Tool Coverage Across Estate</div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {activeTools.map(tool=>{
                    const pct = tool.id==='crowdstrike'?96:tool.id==='defender'?91:tool.id==='darktrace'?100:tool.id==='splunk'?98:tool.id==='tenable'?84:tool.id==='proofpoint'?100:tool.id==='sentinel'?100:88;
                    const gapCount = Math.round(totalDevices*(1-pct/100));
                    const pctColor = pct>=95?'#22d49a':pct>=85?'#f0a030':'#f0405e';
                    return (
                      <div key={tool.id} onClick={()=>setGapToolFilter(gapToolFilter===tool.id?null:tool.id)} style={{padding:'10px 14px',background:gapToolFilter===tool.id?'var(--wt-card2)':'var(--wt-card)',border:`1px solid ${gapToolFilter===tool.id?'#4f8fff40':'#141820'}`,borderRadius:10,display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}>
                        <div style={{width:110,fontSize:'0.76rem',fontWeight:600,flexShrink:0}}>{tool.name}</div>
                        <div style={{flex:1,height:8,background:'var(--wt-border)',borderRadius:4,overflow:'hidden'}}>
                          <div style={{height:'100%',background:`linear-gradient(90deg,${pctColor},${pctColor}aa)`,borderRadius:4,width:`${pct}%`,transition:'width 1s'}} />
                        </div>
                        <span style={{fontSize:'0.72rem',fontWeight:800,fontFamily:'JetBrains Mono,monospace',color:pctColor,minWidth:36,textAlign:'right'}}>{pct}%</span>
                        <span style={{fontSize:'0.6rem',color:'var(--wt-dim)',minWidth:80,textAlign:'right'}}>{gapCount>0?<span style={{color:'#f0a030'}}>{gapCount} devices missing</span>:'Full coverage'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Devices with gaps */}
              <div>
                <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Devices with Gaps ({gapDevices.length})</div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {/* CSV export button */}
                  {gapToolFilter && (
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:'0.68rem',color:'#4f8fff',fontWeight:600}}>Showing devices missing {ALL_TOOLS.find(t=>t.id===gapToolFilter)?.name||gapToolFilter}</span>
                      <button onClick={()=>{
                        const filtered = gapDevices.filter(d=>d.missing.some(m=>ALL_TOOLS.find(t=>t.id===gapToolFilter)?.name && m.includes(ALL_TOOLS.find(t=>t.id===gapToolFilter).name.split(' ')[0])));
                        const csv = ['Hostname,IP,OS,Missing Tools,Reason,Last Seen', ...filtered.map(d=>`${d.hostname},${d.ip},${d.os},"${d.missing.join('; ')}","${d.reason}",${d.lastSeen}`)].join('\n');
                        const blob = new Blob([csv],{type:'text/csv'});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href=url; a.download=`coverage-gaps-${gapToolFilter}.csv`; a.click();
                        URL.revokeObjectURL(url);
                      }} style={{padding:'3px 10px',borderRadius:5,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.62rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Export CSV ↓</button>
                      <button onClick={()=>setGapToolFilter(null)} style={{padding:'3px 8px',borderRadius:5,border:'1px solid var(--wt-border)',background:'none',color:'var(--wt-muted)',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Clear ×</button>
                    </div>
                  )}
                  {(gapToolFilter ? gapDevices.filter(d=>d.missing.some(m=>ALL_TOOLS.find(t=>t.id===gapToolFilter)?.name && m.includes(ALL_TOOLS.find(t=>t.id===gapToolFilter).name.split(' ')[0]))) : gapDevices).map(dev=>(
                    <div key={dev.hostname} style={{padding:'12px 14px',background:'var(--wt-card)',border:'1px solid #f0405e18',borderRadius:10}}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                            <span style={{fontSize:'0.8rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace'}}>{dev.hostname}</span>
                            <span style={{fontSize:'0.6rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{dev.ip}</span>
                            <span style={{fontSize:'0.58rem',color:'var(--wt-muted)'}}>{dev.os}</span>
                          </div>
                          <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:4}}>
                            {dev.missing.map(m=>{
                              const catColor = m.includes('Falcon')||m.includes('Defender')||m.includes('SentinelOne')||m.includes('Carbon Black')?'#f0405e':m.includes('Splunk')||m.includes('Sentinel')||m.includes('QRadar')||m.includes('Elastic')?'#f0a030':m.includes('Tenable')||m.includes('Nessus')||m.includes('Qualys')?'#8b6fff':'#4f8fff';
                              return <span key={m} style={{fontSize:'0.62rem',fontWeight:700,padding:'3px 8px',borderRadius:4,background:`${catColor}14`,color:catColor,border:`1px solid ${catColor}28`,display:'flex',alignItems:'center',gap:4}}><span style={{fontSize:'0.5rem'}}>✗</span>{m}</span>;
                            })}
                          </div>
                          <div style={{fontSize:'0.66rem',color:'var(--wt-muted)'}}>{dev.reason} · Last seen {dev.lastSeen}</div>
                        </div>
                        <button onClick={()=>setDeployAgentDevice(dev)} style={{padding:'5px 12px',borderRadius:7,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Deploy Agent →</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════ VULNS ══════════════════════════════════ */}
          {activeTab==='vulns' && (
            <div style={{display:'flex',flexDirection:'column',gap:0}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Top 10 Vulnerabilities</h2>
                <span style={{fontSize:'0.62rem',color:'#f0405e',background:'#f0405e12',padding:'2px 8px',borderRadius:4}}>Ranked by severity × prevalence in your estate</span>
                <span style={{marginLeft:'auto',fontSize:'0.62rem',color:'#f97316',background:'#f9731612',padding:'2px 8px',borderRadius:4}}>{kevVulns.length} CISA KEV — 72h deadline</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {DEMO_VULNS.map((vuln,rank)=>(
                  <div key={vuln.id}>
                    <div className='vuln-row' onClick={()=>setSelectedVuln(selectedVuln?.id===vuln.id?null:vuln)} style={{padding:'10px 14px',background:selectedVuln?.id===vuln.id?'#0a0d18':'#09091a',border:`1px solid ${selectedVuln?.id===vuln.id?'#4f8fff30':'var(--wt-border)'}`,borderRadius:10,display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:22,height:22,borderRadius:6,background:rank<3?'#f0405e18':'var(--wt-border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.62rem',fontWeight:900,color:rank<3?'#f0405e':'#6b7a94',flexShrink:0,fontFamily:'JetBrains Mono,monospace'}}>{rank+1}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:2}}>
                          <span style={{fontSize:'0.78rem',fontWeight:700}}>{vuln.title}</span>
                          {vuln.kev && <span style={{fontSize:'0.48rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:'#f97316',color:'#fff',flexShrink:0}}>CISA KEV</span>}
                        </div>
                        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                          <SevBadge sev={vuln.severity} />
                          <span style={{fontSize:'0.6rem',color:'#4f8fff',fontFamily:'JetBrains Mono,monospace',fontWeight:700}}>CVSS {vuln.cvss}</span>
                          <span style={{fontSize:'0.6rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{vuln.cve}</span>
                          <span style={{fontSize:'0.58rem',color:'var(--wt-muted)'}}>{vuln.affected} device{vuln.affected!==1?'s':''} affected</span>
                          <span style={{fontSize:'0.58rem',color:'#f0a030'}}>{vuln.prevalence}% prevalence in estate</span>
                        </div>
                      </div>
                      <span style={{fontSize:'0.62rem',color:'#4f8fff',flexShrink:0}}>{selectedVuln?.id===vuln.id?'▲':'▼'}</span>
                    </div>
                    {selectedVuln?.id===vuln.id && (
                      <div style={{padding:'14px 16px',background:'#070912',border:'1px solid #4f8fff20',borderTop:'none',borderRadius:'0 0 10px 10px',marginBottom:0}}>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                          <div>
                            <div style={{fontSize:'0.7rem',color:'var(--wt-secondary)',lineHeight:1.65,marginBottom:10}}>{vuln.description}</div>
                            <div style={{fontSize:'0.6rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Affected Devices</div>
                            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                              {vuln.affectedDevices.map(d=><span key={d} style={{fontSize:'0.58rem',padding:'2px 7px',borderRadius:3,background:'var(--wt-border)',color:'var(--wt-muted)',fontFamily:'JetBrains Mono,monospace'}}>{d}</span>)}
                            </div>
                            <div style={{marginTop:10,display:'flex',gap:6,flexWrap:'wrap'}}>
                              {vuln.patch && <div style={{fontSize:'0.64rem',color:'#22d49a',width:'100%'}}>📦 Patch: <strong>{vuln.patch}</strong></div>}
                              <a href={`https://nvd.nist.gov/vuln/detail/${vuln.cve}`} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:6,background:'#4f8fff15',border:'1px solid #4f8fff30',color:'#4f8fff',textDecoration:'none',fontSize:'0.66rem',fontWeight:700}}>🔗 NVD Database</a>
                              {vuln.kev && <a href='https://www.cisa.gov/known-exploited-vulnerabilities-catalog' target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:6,background:'#f9731615',border:'1px solid #f9731630',color:'#f97316',textDecoration:'none',fontSize:'0.66rem',fontWeight:700}}>⚠ CISA KEV</a>}
                              {vuln.patch && <a href={`https://www.google.com/search?q=${encodeURIComponent(vuln.cve+' '+vuln.patch+' download')}`} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:6,background:'#22d49a15',border:'1px solid #22d49a30',color:'#22d49a',textDecoration:'none',fontSize:'0.66rem',fontWeight:700}}>📦 Find Patch</a>}
                            </div>
                          </div>
                          <div>
                            <div style={{fontSize:'0.6rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Remediation Steps</div>
                            {vuln.remediation.map((r,i)=>(
                              <div key={r} style={{fontSize:'0.7rem',color:'var(--wt-secondary)',padding:'3px 0 3px 14px',position:'relative',lineHeight:1.5}}>
                                <span style={{position:'absolute',left:0,top:9,width:5,height:5,borderRadius:'50%',background:'#22d49a',display:'block'}} />
                                {r}
                              </div>
                            ))}
                            <div style={{marginTop:12,padding:'10px',background:'var(--wt-card2)',border:'1px solid #4f8fff18',borderRadius:8}}>
                              <div style={{fontSize:'0.6rem',fontWeight:700,color:'#4f8fff',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                                <span style={{width:6,height:6,borderRadius:'50%',background:'#4f8fff',display:'block'}} />AI Remediation Assistant
                              </div>
                              <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:8}}>
                                {[
                                  {type:'splunk',label:'Splunk',color:'#f97316'},
                                  {type:'sentinel',label:'Sentinel',color:'#4f8fff'},
                                  {type:'defender',label:'Defender',color:'#22d49a'},
                                  {type:'iocs',label:'IOCs',color:'#f0405e'},
                                ].map(q=>{
                                  const key = vuln.id + ':' + q.type;
                                  const isLoading = vulnAiLoading === key;
                                  const hasResult = !!vulnAiTexts[key];
                                  return (
                                    <button key={q.type} onClick={()=>getVulnAiHelp(vuln,q.type)} disabled={isLoading} style={{padding:'4px 11px',borderRadius:5,border:'1px solid ' + q.color + '40',background:hasResult ? q.color + '20' : 'transparent',color:q.color,fontSize:'0.66rem',fontWeight:700,cursor:isLoading?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:4,opacity:isLoading?0.7:1}}>
                                      {isLoading && <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',border:'2px solid ' + q.color,borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}} />}
                                      {!isLoading && hasResult && <span>✓</span>}
                                      {!isLoading && !hasResult && <span>✦</span>}
                                      {q.label}
                                    </button>
                                  );
                                })}
                                {['splunk','sentinel','defender','iocs'].some(t=>vulnAiTexts[vuln.id+':'+t]) && (
                                  <button onClick={()=>setVulnAiTexts(prev=>{const n={...prev};['splunk','sentinel','defender','iocs'].forEach(t=>{delete n[vuln.id+':'+t];}); return n;})} style={{marginLeft:'auto',fontSize:'0.58rem',padding:'2px 7px',borderRadius:4,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-dim)',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Clear all</button>
                                )}
                              </div>
                              {['splunk','sentinel','defender','iocs'].map(t=>{
                                const key = vuln.id + ':' + t;
                                if (!vulnAiTexts[key]) return null;
                                const colors = {splunk:'#f97316',sentinel:'#4f8fff',defender:'#22d49a',iocs:'#f0405e'};
                                const labels = {splunk:'Splunk SPL',sentinel:'Sentinel KQL',defender:'Defender KQL',iocs:'IOCs'};
                                return (
                                  <div key={t} style={{marginBottom:8}}>
                                    <div style={{fontSize:'0.58rem',fontWeight:700,color:colors[t],marginBottom:4,textTransform:'uppercase',letterSpacing:'0.5px'}}>{labels[t]}</div>
                                    <RemediationOutput text={vulnAiTexts[key]} />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════ INTEL ══════════════════════════════════ */}
          {activeTab==='intel' && (
            <GateWall feature='Threat Intelligence' requiredTier='team' userTier={userTier}>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Threat Intelligence</h2>
                <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:'auto'}}>
                  <span style={{fontSize:'0.7rem',color:'var(--wt-muted)'}}>Industry:</span>
                  <select value={industry} onChange={e=>{setIndustryPersisted(e.target.value);fetchIntelForIndustry(e.target.value);}} style={{padding:'4px 10px',borderRadius:6,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:'var(--wt-text)',fontSize:'0.76rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
                  </select>
                  {intelLoading && <span style={{width:14,height:14,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}} />}
                </div>
              </div>

              {/* Industry-specific intel first */}
              <div>
                <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>
                  {industry} — Active Threats
                </div>
                {allIntel.filter(i=>i.industrySpecific).map(item=>{
                  const isExpanded = expandedIntel.has(item.id);
                  return (
                  <div key={item.id} style={{background:'#0a0206',border:`1px solid ${isExpanded?'#f0405e30':'#f0405e18'}`,borderRadius:10,marginBottom:6,overflow:'hidden'}}>
                    <div style={{padding:'12px 14px',cursor:'pointer'}} onClick={()=>toggleIntel(item.id)}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                            <SevBadge sev={item.severity} />
                            <span style={{fontSize:'0.78rem',fontWeight:700}}>{item.title}</span>
                          </div>
                          <div style={{fontSize:'0.74rem',color:'var(--wt-secondary)',lineHeight:1.65,marginBottom:6}}>{item.summary}</div>
                          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                            <span style={{fontSize:'0.58rem',color:'#4f8fff'}}>{item.source}</span>
                            <span style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>{item.time}</span>
                            {item.mitre && <span style={{fontSize:'0.52rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{item.mitre}</span>}
                            {item.iocs && item.iocs.length>0 && <span style={{fontSize:'0.58rem',fontWeight:700,color:'#f0a030',background:'#f0a03012',padding:'1px 6px',borderRadius:3,border:'1px solid #f0a03025'}}>{item.iocs.length} IOCs — click to view</span>}
                            <a href={item.url || `https://www.ncsc.gov.uk/search?q=${encodeURIComponent(item.title)}`} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{fontSize:'0.52rem',color:'#4f8fff',textDecoration:'none',padding:'1px 6px',border:'1px solid #4f8fff20',borderRadius:3,background:'#4f8fff0a'}}>Read article →</a>
                          </div>
                        </div>
                        <span style={{fontSize:'0.7rem',color:'var(--wt-dim)',flexShrink:0}}>{isExpanded?'▲':'▼'}</span>
                      </div>
                    </div>
                    {isExpanded && item.iocs && item.iocs.length>0 && (
                      <div style={{padding:'10px 14px 14px',borderTop:'1px solid #f0405e15',background:'#07010a'}}>
                        <div style={{fontSize:'0.6rem',fontWeight:700,color:'#f0a030',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Indicators of Compromise</div>
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {item.iocs.map(ioc=>(
                            <div key={ioc} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',background:'#0d0208',border:'1px solid #1e1010',borderRadius:6}}>
                              <span style={{width:6,height:6,borderRadius:'50%',background:'#f0a030',flexShrink:0}} />
                              <code style={{fontSize:'0.68rem',fontFamily:'JetBrains Mono,monospace',color:'#f0c070',flex:1,wordBreak:'break-all'}}>{ioc}</code>
                              <button onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(ioc);}} style={{fontSize:'0.54rem',padding:'2px 7px',borderRadius:3,border:'1px solid #f0a03025',background:'transparent',color:'#f0a030',cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Copy</button>
                            </div>
                          ))}
                        </div>
                        {item.mitre && (
                          <div style={{marginTop:10,display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontSize:'0.6rem',color:'var(--wt-dim)'}}>MITRE ATT&CK:</span>
                            <a href={`https://attack.mitre.org/techniques/${item.mitre.split('.').join('/')}/`} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{fontSize:'0.66rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'#7c6aff',textDecoration:'none',padding:'2px 8px',border:'1px solid #7c6aff25',borderRadius:3,background:'#7c6aff10'}}>{item.mitre} →</a>
                          </div>
                        )}
                        {item.iocs && item.iocs.length>0 && (
                          <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid #f0a03015'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                              <span style={{fontSize:'0.6rem',fontWeight:700,color:'#22d49a',textTransform:'uppercase',letterSpacing:'0.5px'}}>🔍 Hunt in your environment</span>
                              <button onClick={e=>{e.stopPropagation();setIocQueryLoading(item.id);fetch('/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Generate detection queries to hunt for these IOCs in a corporate environment: '+item.iocs.join(', ')+'. Provide: SPLUNK QUERY (SPL), MICROSOFT SENTINEL KQL, and MICROSOFT DEFENDER ADVANCED HUNTING queries. Each labelled clearly. No markdown, plain text only.'})}).then(r=>r.json()).then(d=>{setIocQueries(prev=>({...prev,[item.id]:d.response||''}));setIocQueryLoading(null);}).catch(()=>setIocQueryLoading(null));}} disabled={iocQueryLoading===item.id} style={{padding:'3px 10px',borderRadius:5,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.6rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:4}}>
                                {iocQueryLoading===item.id ? <span><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',border:'2px solid #22d49a',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}}/> Generating...</span> : <span>✦ Generate Hunt Queries</span>}
                              </button>
                              {iocQueries[item.id] && <button onClick={e=>{e.stopPropagation();setIocQueries(prev=>{const n={...prev};delete n[item.id];return n;});}} style={{padding:'2px 7px',borderRadius:4,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-dim)',fontSize:'0.56rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Clear</button>}
                            </div>
                            {iocQueries[item.id] && <RemediationOutput text={iocQueries[item.id]} />}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>

              {/* General intel */}
              <div>
                <div style={{fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>General Intelligence</div>
                {allIntel.filter(i=>!i.industrySpecific).map(item=>{
                  const isExpanded = expandedIntel.has(item.id);
                  return (
                  <div key={item.id} style={{background:'var(--wt-card)',border:`1px solid ${isExpanded?'#4f8fff30':'var(--wt-border)'}`,borderRadius:10,marginBottom:6,overflow:'hidden'}}>
                    <div style={{padding:'12px 14px',cursor:'pointer'}} onClick={()=>toggleIntel(item.id)}>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                        <SevBadge sev={item.severity} />
                        <span style={{fontSize:'0.78rem',fontWeight:700,flex:1}}>{item.title}</span>
                        <span style={{fontSize:'0.7rem',color:'var(--wt-dim)',flexShrink:0}}>{isExpanded?'▲':'▼'}</span>
                      </div>
                      <div style={{fontSize:'0.74rem',color:'var(--wt-secondary)',lineHeight:1.65,marginBottom:6}}>{item.summary}</div>
                      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                        <span style={{fontSize:'0.58rem',color:'#4f8fff'}}>{item.source}</span>
                        <span style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>{item.time}</span>
                        {item.iocs && item.iocs.length>0 && <span style={{fontSize:'0.58rem',fontWeight:700,color:'#f0a030',background:'#f0a03012',padding:'1px 6px',borderRadius:3,border:'1px solid #f0a03025'}}>{item.iocs.length} IOCs</span>}
                        {item.mitre && <span style={{fontSize:'0.52rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{item.mitre}</span>}
                      </div>
                    </div>
                    {isExpanded && item.iocs && item.iocs.length>0 && (
                      <div style={{padding:'10px 14px 14px',borderTop:'1px solid var(--wt-border)',background:'var(--wt-card2)'}}>
                        <div style={{fontSize:'0.6rem',fontWeight:700,color:'#f0a030',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Indicators of Compromise</div>
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {item.iocs.map(ioc=>(
                            <div key={ioc} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:6}}>
                              <span style={{width:6,height:6,borderRadius:'50%',background:'#f0a030',flexShrink:0}} />
                              <code style={{fontSize:'0.68rem',fontFamily:'JetBrains Mono,monospace',color:'#f0c070',flex:1,wordBreak:'break-all'}}>{ioc}</code>
                              <button onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(ioc);}} style={{fontSize:'0.54rem',padding:'2px 7px',borderRadius:3,border:'1px solid #f0a03025',background:'transparent',color:'#f0a030',cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Copy</button>
                            </div>
                          ))}
                        </div>
                        {item.mitre && (
                          <div style={{marginTop:10,display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontSize:'0.6rem',color:'var(--wt-dim)'}}>MITRE ATT&CK:</span>
                            <a href={`https://attack.mitre.org/techniques/${item.mitre.split('.').join('/')}/`} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{fontSize:'0.66rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'#7c6aff',textDecoration:'none',padding:'2px 8px',border:'1px solid #7c6aff25',borderRadius:3,background:'#7c6aff10'}}>{item.mitre} →</a>
                          </div>
                        )}
                        {item.iocs && item.iocs.length>0 && (
                          <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid #f0a03015'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                              <span style={{fontSize:'0.6rem',fontWeight:700,color:'#22d49a',textTransform:'uppercase',letterSpacing:'0.5px'}}>🔍 Hunt in your environment</span>
                              <button onClick={e=>{e.stopPropagation();setIocQueryLoading(item.id);fetch('/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Generate detection queries to hunt for these IOCs in a corporate environment: '+item.iocs.join(', ')+'. Provide: SPLUNK QUERY (SPL), MICROSOFT SENTINEL KQL, and MICROSOFT DEFENDER ADVANCED HUNTING queries. Each labelled clearly. No markdown, plain text only.'})}).then(r=>r.json()).then(d=>{setIocQueries(prev=>({...prev,[item.id]:d.response||''}));setIocQueryLoading(null);}).catch(()=>setIocQueryLoading(null));}} disabled={iocQueryLoading===item.id} style={{padding:'3px 10px',borderRadius:5,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.6rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:4}}>
                                {iocQueryLoading===item.id ? <span><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',border:'2px solid #22d49a',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}}/> Generating...</span> : <span>✦ Generate Hunt Queries</span>}
                              </button>
                              {iocQueries[item.id] && <button onClick={e=>{e.stopPropagation();setIocQueries(prev=>{const n={...prev};delete n[item.id];return n;});}} style={{padding:'2px 7px',borderRadius:4,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-dim)',fontSize:'0.56rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Clear</button>}
                            </div>
                            {iocQueries[item.id] && <RemediationOutput text={iocQueries[item.id]} />}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>

              {/* Darktrace anomalies if active */}
              {darktrace?.active && (
                <div>
                  <div style={{fontSize:'0.62rem',fontWeight:700,color:'#8b6fff',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Darktrace — Network Anomalies</div>
                  {[
                    {device:'SRV-FINANCE01',score:96,desc:'Anomalous outbound HTTPS beaconing — 300s interval, unusual destination',time:'1h ago'},
                    {device:'laptop-CFO01',score:88,desc:'Unusual internal reconnaissance — scanning 10.0.0.0/24 subnet',time:'2h ago'},
                    {device:'SRV-APP02',score:72,desc:'Elevated data transfer to external storage provider — 3x baseline',time:'3h ago'},
                  ].map(a=>(
                    <div key={a.device} style={{padding:'10px 14px',background:'var(--wt-card)',border:'1px solid #8b6fff18',borderRadius:10,marginBottom:5,display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:38,height:38,borderRadius:8,background:'#8b6fff15',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:'#8b6fff'}}>{a.score}</span>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'0.76rem',fontWeight:700,marginBottom:2}}>{a.device}</div>
                        <div style={{fontSize:'0.7rem',color:'var(--wt-muted)'}}>{a.desc}</div>
                      </div>
                      <span style={{fontSize:'0.6rem',color:'var(--wt-dim)',flexShrink:0}}>{a.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GateWall>
          )}

          {/* ═══════════════════════════════ INCIDENTS ══════════════════════════════ */}
          {activeTab==='incidents' && (
            <GateWall feature='Incident Management' requiredTier='team' userTier={userTier}>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Incidents</h2>
                <span style={{fontSize:'0.62rem',color:'#f0405e',background:'#f0405e12',padding:'2px 8px',borderRadius:4}}>{incidents.filter(i=>i.status==='Active').length} Active</span>
              </div>
              {incidents.filter(inc=>!deletedIncidents.has(inc.id)).map(inc=>{
                const isSel = selectedIncident?.id===inc.id;
                const incStatus = incidentStatuses[inc.id] || inc.status; const statusColor = incStatus==='Active'?'#f0405e':incStatus==='Contained'?'#f0a030':'#22d49a';
                return (
                  <div key={inc.id} style={{background:'var(--wt-card)',border:`1px solid ${isSel?'#4f8fff40':'var(--wt-border)'}`,borderRadius:12,overflow:'hidden'}}>
                    <div style={{padding:'12px 16px',cursor:'pointer',display:'flex',alignItems:'flex-start',gap:12}} onClick={()=>setSelectedIncident(isSel?null:inc)}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <span style={{fontSize:'0.62rem',fontWeight:800,color:'#4f8fff',fontFamily:'JetBrains Mono,monospace'}}>{inc.id}</span>
                          <span style={{fontSize:'0.52rem',fontWeight:700,padding:'2px 7px',borderRadius:3,background:`${statusColor}15`,color:statusColor,border:`1px solid ${statusColor}25`}}>{incStatus.toUpperCase()}</span>
                          <SevBadge sev={inc.severity} />
                        </div>
                        <div style={{fontSize:'0.84rem',fontWeight:700,marginBottom:4}}>{inc.title}</div>
                        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                          {inc.mitreTactics.map(t=><span key={t} style={{fontSize:'0.52rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{t}</span>)}
                          <span style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>{inc.alertCount} alerts · {inc.devices.length} devices</span>
                          <span style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>Updated {inc.updated.split(' ')[1]}</span>
                        </div>
                      </div>
                      <span style={{fontSize:'0.7rem',color:'var(--wt-dim)',flexShrink:0}}>{isSel?'▲':'▼'}</span>
                    </div>
                    {isSel && (
                      <div style={{borderTop:'1px solid #141820',padding:'14px 16px'}}>
                        <GateWall feature='AI Attack Narrative' requiredTier='team' userTier={userTier}>
              <div style={{fontSize:'0.74rem',color:'var(--wt-secondary)',lineHeight:1.65,padding:'10px',background:'linear-gradient(135deg,rgba(79,143,255,0.04),rgba(34,201,146,0.04))',border:'1px solid #4f8fff15',borderRadius:8,marginBottom:12}}>
                          <span style={{fontSize:'0.6rem',fontWeight:700,color:'#4f8fff',display:'block',marginBottom:4}}>AI ATTACK NARRATIVE</span>
                          {inc.aiSummary}
                        </div>
                        </GateWall>
                        <div style={{fontSize:'0.62rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Attack Timeline</div>
                        <div style={{display:'flex',flexDirection:'column',gap:0}}>
                          {inc.timeline.map((event,i)=>(
                            <div key={i} style={{display:'flex',gap:0,padding:'5px 0'}}>
                              <div style={{display:'flex',flexDirection:'column',alignItems:'center',minWidth:50}}>
                                <span style={{fontSize:'0.6rem',fontFamily:'JetBrains Mono,monospace',color:'var(--wt-dim)',marginBottom:3}}>{event.t}</span>
                                <div style={{width:8,height:8,borderRadius:'50%',background:event.actor==='AI'?'#4f8fff':'#22d49a',flexShrink:0}} />
                                {i<inc.timeline.length-1&&<div style={{width:1,flex:1,background:'var(--wt-border)',minHeight:16,marginTop:2}} />}
                              </div>
                              <div style={{flex:1,paddingLeft:10,paddingBottom:8}}>
                                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:1}}>
                                  <span style={{fontSize:'0.52rem',fontWeight:700,padding:'1px 5px',borderRadius:3,background:event.actor==='AI'?'#4f8fff15':'#22d49a15',color:event.actor==='AI'?'#4f8fff':'#22d49a'}}>{event.actor}</span>
                                  <span style={{fontSize:'0.74rem',fontWeight:600}}>{event.action}</span>
                                </div>
                                <div style={{fontSize:'0.68rem',color:'var(--wt-muted)'}}>{event.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
                          <button onClick={()=>setAddingNoteTo(addingNoteTo===inc.id?null:inc.id)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid var(--wt-border2)',background:addingNoteTo===inc.id?'#4f8fff12':'transparent',color:'#8a9ab0',fontSize:'0.68rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>📝 Add Note</button>
                          <button onClick={()=>setIncidentStatuses(prev=>({...prev,[inc.id]:'Escalated'}))} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #f0a03030',background:'#f0a03008',color:'#f0a030',fontSize:'0.68rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>⬆ Escalate</button>
                          <button onClick={()=>closeIncident(inc.id)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #22d49a30',background:'#22d49a0a',color:'#22d49a',fontSize:'0.68rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>✓ Close</button>
                          <button onClick={()=>deleteIncident(inc.id)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #f0405e25',background:'#f0405e0a',color:'#f0405e',fontSize:'0.68rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>🗑 Delete</button>
                        </div>
                        {addingNoteTo===inc.id && (
                          <div style={{marginTop:8,display:'flex',gap:6}}>
                            <input value={noteInput} onChange={e=>setNoteInput(e.target.value)} placeholder='Type a note...' style={{flex:1,padding:'6px 10px',borderRadius:6,border:'1px solid var(--wt-border2)',background:'var(--wt-card)',color:'var(--wt-text)',fontSize:'0.74rem',fontFamily:'Inter,sans-serif',outline:'none'}} />
                            <button onClick={()=>{if(noteInput.trim()){setIncidentNotes(prev=>({...prev,[inc.id]:[...(prev[inc.id]||[]),{text:noteInput.trim(),time:new Date().toLocaleTimeString()}]}));setNoteInput('');setAddingNoteTo(null);}}} style={{padding:'6px 12px',borderRadius:6,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.7rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Save</button>
                          </div>
                        )}
                        {incidentNotes[inc.id] && incidentNotes[inc.id].length>0 && (
                          <div style={{marginTop:8}}>
                            <div style={{fontSize:'0.6rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Notes</div>
                            {incidentNotes[inc.id].map((n,ni)=>(
                              <div key={ni} style={{fontSize:'0.7rem',color:'var(--wt-secondary)',padding:'5px 8px',background:'var(--wt-card2)',borderRadius:5,marginBottom:3,display:'flex',justifyContent:'space-between',gap:8}}>
                                <span>{n.text}</span><span style={{color:'var(--wt-dim)',flexShrink:0,fontSize:'0.6rem'}}>{n.time}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </GateWall>
          )}
          {/* ═══════════════════════════════ TOOLS ══════════════════════════════════ */}
          {activeTab==='tools' && (
            <ToolsTab connected={connectedTools} setConnected={setConnectedTools} />
          )}

          {/* ═══════════════════════════════ ADMIN PORTAL ═══════════════════════════════ */}
          {activeTab==='admin' && isAdmin && <AdminPortal setCurrentTenant={setCurrentTenant} setActiveTab={setActiveTab} clientBanner={clientBanner} setClientBanner={setClientBanner} adminBannerInput={adminBannerInput} setAdminBannerInput={setAdminBannerInput} userRole={userRole} setUserRole={setUserRole} currentTenant={currentTenant} />}

          {/* ═══════════════════════════════ MSSP PORTFOLIO ══════════════════════════ */}
          {activeTab==='mssp' && <MSSPPortfolio currentTenant={currentTenant} setCurrentTenant={setCurrentTenant} DEMO_TENANTS={DEMO_TENANTS} isAdmin={isAdmin} setActiveTab={setActiveTab} setAdminBannerInput={setAdminBannerInput} />}
          {activeTab==='sales' && isSales && <SalesDashboard />}
        </div>
      </div>

      {/* ═══════════════════════════════ MODALS ════════════════════════════════════ */}

      {/* Deploy Agent Modal */}
      {deployAgentDevice && (
        <Modal title={`Deploy Agent — ${deployAgentDevice.hostname}`} onClose={()=>setDeployAgentDevice(null)}>
          <div style={{fontSize:'0.78rem',color:'var(--wt-secondary)',lineHeight:1.7,marginBottom:16}}>
            This device is missing: <strong style={{color:'#f0405e'}}>{deployAgentDevice.missing.join(', ')}</strong><br />
            Reason: {deployAgentDevice.reason}
          </div>
          <div style={{fontSize:'0.7rem',fontWeight:700,color:'#4f8fff',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.5px'}}>Deployment Options</div>
          {[
            {title:'1. Automated Push (recommended)',desc:'Watchtower will push the agent via your existing RMM or SCCM/Intune. Requires admin credentials configured in Settings.',btn:'Push via RMM',color:'#4f8fff'},
            {title:'2. Manual install — Windows',desc:'Download the installer and run on the target device. Requires local admin rights.',btn:'Download .exe',color:'#22d49a'},
            {title:'3. Manual install — macOS/Linux',desc:'Run the curl command on the target device via SSH or terminal.',btn:'Copy curl command',color:'#22d49a'},
            {title:'4. Group Policy / MDM',desc:'Deploy at scale via GPO (Windows) or MDM profile (macOS). Recommended for 10+ devices.',btn:'Download GPO template',color:'#8b6fff'},
          ].map(opt=>(
            <div key={opt.title} style={{padding:'12px 14px',background:'var(--wt-card)',border:'1px solid #141820',borderRadius:10,marginBottom:8}}>
              <div style={{fontSize:'0.76rem',fontWeight:700,marginBottom:4}}>{opt.title}</div>
              <div style={{fontSize:'0.68rem',color:'var(--wt-muted)',marginBottom:8,lineHeight:1.5}}>{opt.desc}</div>
              <button style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${opt.color}30`,background:`${opt.color}12`,color:opt.color,fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>{opt.btn}</button>
            </div>
          ))}
          <div style={{marginTop:12,padding:'10px 14px',background:'var(--wt-card2)',border:'1px solid #4f8fff15',borderRadius:8,fontSize:'0.68rem',color:'var(--wt-muted)',lineHeight:1.6}}>
            💡 After deployment, the agent will check in within 5 minutes. This device will be removed from the gaps list automatically.
          </div>
        </Modal>
      )}

      {/* Coverage Gap Modal */}
      {modal?.type==='gaps' && (
        <Modal title={`Coverage Gaps — ${gapDevices.length} Devices`} onClose={()=>setModal(null)}>
          <div style={{marginBottom:10,padding:'8px 12px',background:'#f0405e0a',border:'1px solid #f0405e18',borderRadius:8,fontSize:'0.74rem',color:'#f0405e'}}>
            ⚠ These devices have no agent coverage — they are invisible to your security tools and represent active risk.
          </div>
          {gapDevices.map(dev=>(
            <div key={dev.hostname} style={{padding:'12px 0',borderBottom:'1px solid #141820'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontSize:'0.82rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace'}}>{dev.hostname}</span>
                <span style={{fontSize:'0.6rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{dev.ip}</span>
                <span style={{fontSize:'0.6rem',color:'var(--wt-muted)'}}>{dev.os}</span>
                <span style={{fontSize:'0.58rem',color:'var(--wt-dim)',marginLeft:'auto'}}>Last seen {dev.lastSeen}</span>
              </div>
              <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:4}}>
                {dev.missing.map(m=>{
                  const catColor = m.includes('Falcon')||m.includes('Defender')||m.includes('SentinelOne')||m.includes('Carbon Black')?'#f0405e':m.includes('Splunk')||m.includes('Sentinel')||m.includes('QRadar')||m.includes('Elastic')?'#f0a030':m.includes('Tenable')||m.includes('Nessus')||m.includes('Qualys')?'#8b6fff':'#4f8fff';
                  return <span key={m} style={{fontSize:'0.62rem',fontWeight:700,padding:'3px 8px',borderRadius:4,background:`${catColor}14`,color:catColor,border:`1px solid ${catColor}28`,display:'inline-flex',alignItems:'center',gap:4}}><span style={{fontSize:'0.5rem'}}>✗</span>{m}</span>;
                })}
              </div>
              <div style={{fontSize:'0.68rem',color:'var(--wt-muted)'}}>{dev.reason}</div>
            </div>
          ))}
        </Modal>
      )}

      {/* Tools Modal */}
      {modal?.type==='tools' && (
        <Modal title='Tool Status' onClose={()=>setModal(null)}>
          {tools.map(tool=>(
            <div key={tool.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #141820'}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:tool.active?'#22c992':'#f0405e',boxShadow:tool.active?'0 0 6px #22c992':'none',flexShrink:0}} />
              <span style={{flex:1,fontSize:'0.82rem',fontWeight:600}}>{tool.name}</span>
              <span style={{fontSize:'0.7rem',color:tool.active?'#22d49a':'#f0405e',fontWeight:700}}>{tool.active?'Connected':'Not configured'}</span>
              {tool.alertCount && tool.alertCount > 0 && <span style={{fontSize:'0.62rem',color:'#4f8fff'}}>{tool.alertCount} alerts today</span>}
              {!tool.active && <a href='/settings/tools' style={{padding:'3px 10px',borderRadius:5,background:'#4f8fff12',color:'#4f8fff',fontSize:'0.66rem',fontWeight:700,textDecoration:'none'}}>Configure →</a>}
            </div>
          ))}
        </Modal>
      )}

      {/* Alerts Ingested Modal */}
      {modal?.type==='alerts-ingested' && (
        <Modal title={`Alert Ingestion — What AI Did`} onClose={()=>setModal(null)}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
            {[{val:alerts.length,label:'Ingested',c:'#4f8fff'},{val:fpAlerts.length,label:'Auto-Closed FPs',c:'#22d49a'},{val:tpAlerts.length,label:'Escalated TPs',c:'#f0405e'}].map(s=>(
              <div key={s.label} style={{textAlign:'center',padding:'10px',background:'var(--wt-bg)',borderRadius:8,border:'1px solid #141820'}}>
                <div style={{fontSize:'1.6rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.c,letterSpacing:-1}}>{s.val}</div>
                <div style={{fontSize:'0.6rem',color:'var(--wt-dim)'}}>{s.label}</div>
              </div>
            ))}
          </div>
          {alerts.map(a=>(
            <div key={a.id} style={{padding:'10px 0',borderBottom:'1px solid #141820'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                <span style={{width:4,height:16,borderRadius:2,background:SEV_COLOR[a.severity],flexShrink:0}} />
                <span style={{fontSize:'0.78rem',fontWeight:600,flex:1}}>{a.title}</span>
                <span style={{fontSize:'0.56rem',fontWeight:800,padding:'2px 7px',borderRadius:3,color:VERDICT_STYLE[a.verdict].c,background:VERDICT_STYLE[a.verdict].bg}}>{a.verdict}</span>
              </div>
              <div style={{fontSize:'0.7rem',color:'#22d49a',paddingLeft:12}}>⚡ {a.aiActions[0]}</div>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}
