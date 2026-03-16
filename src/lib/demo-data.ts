// Demo data for preview mode

export const DEMO_DEFENDER_ALERTS = [
  { id: 'da-001', title: 'Suspicious PowerShell execution', severity: 'high', status: 'new', source: 'Defender MDE', category: 'Execution', device: 'WS042.corp.local', user: 'jsmith', timestamp: new Date(Date.now() - 1800000).toISOString(), mitre: 'T1059.001' },
  { id: 'da-002', title: 'Credential dumping attempt via LSASS', severity: 'critical', status: 'investigating', source: 'Defender MDE', category: 'Credential Access', device: 'SRV-DC01.corp.local', user: 'admin_svc', timestamp: new Date(Date.now() - 3600000).toISOString(), mitre: 'T1003.001' },
  { id: 'da-003', title: 'Suspicious outbound connection to known C2', severity: 'high', status: 'new', source: 'Defender XDR', category: 'Command & Control', device: 'WS015.corp.local', user: 'mthompson', timestamp: new Date(Date.now() - 7200000).toISOString(), mitre: 'T1071.001' },
  { id: 'da-004', title: 'Phishing email with malicious attachment', severity: 'medium', status: 'resolved', source: 'Defender XDR', category: 'Initial Access', device: 'MAIL-GW', user: 'awilliams', timestamp: new Date(Date.now() - 14400000).toISOString(), mitre: 'T1566.001' },
  { id: 'da-005', title: 'Lateral movement via SMB', severity: 'high', status: 'investigating', source: 'Defender MDE', category: 'Lateral Movement', device: 'FS01.corp.local', user: 'admin_svc', timestamp: new Date(Date.now() - 5400000).toISOString(), mitre: 'T1021.002' },
  { id: 'da-006', title: 'Ransomware behavior detected', severity: 'critical', status: 'new', source: 'Defender MDE', category: 'Impact', device: 'WS088.corp.local', user: 'kpatel', timestamp: new Date(Date.now() - 600000).toISOString(), mitre: 'T1486' },
  { id: 'da-007', title: 'Suspicious DLL side-loading', severity: 'medium', status: 'new', source: 'Defender MDE', category: 'Defense Evasion', device: 'WS022.corp.local', user: 'jlee', timestamp: new Date(Date.now() - 9000000).toISOString(), mitre: 'T1574.002' },
  { id: 'da-008', title: 'MFA fatigue attack detected', severity: 'high', status: 'investigating', source: 'Defender XDR', category: 'Credential Access', device: 'CLOUD-AAD', user: 'cdavis', timestamp: new Date(Date.now() - 2700000).toISOString(), mitre: 'T1621' },
];

export const DEMO_TAEGIS_ALERTS = [
  { id: 'ta-001', title: 'Brute force authentication detected', severity: 'high', status: 'new', source: 'Taegis XDR', category: 'Credential Access', device: 'VPN-GW-01', user: 'multiple', timestamp: new Date(Date.now() - 900000).toISOString(), mitre: 'T1110' },
  { id: 'ta-002', title: 'Anomalous data transfer volume', severity: 'medium', status: 'new', source: 'Taegis XDR', category: 'Exfiltration', device: 'WS033.corp.local', user: 'contractor-ext', timestamp: new Date(Date.now() - 4800000).toISOString(), mitre: 'T1048' },
  { id: 'ta-003', title: 'Suspicious scheduled task creation', severity: 'medium', status: 'investigating', source: 'Taegis XDR', category: 'Persistence', device: 'SRV-APP02.corp.local', user: 'svc_deploy', timestamp: new Date(Date.now() - 10800000).toISOString(), mitre: 'T1053.005' },
  { id: 'ta-004', title: 'DNS tunnelling indicators', severity: 'high', status: 'new', source: 'Taegis XDR', category: 'Command & Control', device: 'WS042.corp.local', user: 'jsmith', timestamp: new Date(Date.now() - 2400000).toISOString(), mitre: 'T1572' },
  { id: 'ta-005', title: 'Kerberoasting activity detected', severity: 'critical', status: 'new', source: 'Taegis XDR', category: 'Credential Access', device: 'SRV-DC01.corp.local', user: 'admin_svc', timestamp: new Date(Date.now() - 1200000).toISOString(), mitre: 'T1558.003' },
  { id: 'ta-006', title: 'Unusual process injection', severity: 'medium', status: 'resolved', source: 'Taegis XDR', category: 'Defense Evasion', device: 'WS019.corp.local', user: 'bwilson', timestamp: new Date(Date.now() - 18000000).toISOString(), mitre: 'T1055' },
];

export const DEMO_TENABLE_VULNS = {
  summary: { critical: 24, high: 142, medium: 891, low: 2340, info: 5620, total: 9017 },
  topCritical: [
    { id: 'CVE-2024-3400', plugin: 168191, name: 'PAN-OS GlobalProtect RCE', severity: 'critical', cvss: 10.0, hosts: 4, firstSeen: '2024-12-01', exploitable: true, epss: 0.97 },
    { id: 'CVE-2024-21887', plugin: 187654, name: 'Ivanti Connect Secure Auth Bypass', severity: 'critical', cvss: 9.1, hosts: 2, firstSeen: '2024-11-15', exploitable: true, epss: 0.94 },
    { id: 'CVE-2024-1709', plugin: 190233, name: 'ConnectWise ScreenConnect RCE', severity: 'critical', cvss: 10.0, hosts: 1, firstSeen: '2024-12-10', exploitable: true, epss: 0.96 },
    { id: 'CVE-2023-46805', plugin: 186432, name: 'Ivanti Policy Secure Auth Bypass', severity: 'critical', cvss: 8.2, hosts: 2, firstSeen: '2024-10-20', exploitable: true, epss: 0.91 },
    { id: 'CVE-2024-47575', plugin: 192100, name: 'FortiManager Missing Auth', severity: 'critical', cvss: 9.8, hosts: 1, firstSeen: '2025-01-05', exploitable: true, epss: 0.89 },
    { id: 'CVE-2024-23897', plugin: 189440, name: 'Jenkins CLI Arbitrary File Read', severity: 'critical', cvss: 9.8, hosts: 3, firstSeen: '2024-11-28', exploitable: true, epss: 0.92 },
    { id: 'CVE-2024-6387', plugin: 191020, name: 'OpenSSH regreSSHion RCE', severity: 'critical', cvss: 8.1, hosts: 8, firstSeen: '2024-12-15', exploitable: true, epss: 0.85 },
  ],
  assetCounts: { total: 1842, scanned: 1756, notScanned: 86, withCritical: 34, withHigh: 218 },
  scanHealth: { lastFullScan: new Date(Date.now() - 86400000).toISOString(), coverage: 95.3, avgScanAge: 2.1 },
};

export const DEMO_ZSCALER = {
  zia: { blockedThreats: 4280, blockedUrls: 12450, dlpViolations: 34, bandwidthGB: 892, sslInspected: 94.2, policyHits24h: 28400,
    topBlocked: [
      { category: 'Adware/Spyware', count: 1550, trend: 'stable' },
      { category: 'Malware', count: 1240, trend: 'up' },
      { category: 'Phishing', count: 890, trend: 'stable' },
      { category: 'Botnet C2', count: 420, trend: 'down' },
      { category: 'Cryptomining', count: 180, trend: 'up' },
    ],
  },
  zpa: { totalApps: 48, activeUsers: 342, postureFails: 23,
    connectors: { total: 12, healthy: 10, degraded: 1, offline: 1 },
    topApps: [
      { name: 'Internal Portal', users: 245, sessions: 1240, health: 'healthy' },
      { name: 'Dev Environment', users: 89, sessions: 560, health: 'healthy' },
      { name: 'HR System', users: 124, sessions: 380, health: 'healthy' },
      { name: 'Finance App', users: 67, sessions: 290, health: 'degraded' },
      { name: 'Admin Console', users: 18, sessions: 95, health: 'healthy' },
    ],
  },
};

export const DEMO_COVERAGE = {
  totalDevices: 1842,
  tools: {
    defender: { installed: 1798, healthy: 1756, degraded: 30, offline: 12, version: '4.18.24090' },
    taegis: { installed: 1780, healthy: 1742, degraded: 28, offline: 10, version: '2.8.4' },
    tenable: { installed: 1700, healthy: 1645, degraded: 40, offline: 15, version: '10.6.1' },
    zscaler: { installed: 1650, healthy: 1612, degraded: 28, offline: 10, version: '4.2.0.198' },
  },
  gaps: [
    { hostname: 'SRV-LEGACY01', os: 'Windows Server 2012 R2', missing: ['tenable', 'zscaler'], reason: 'Legacy OS — agent incompatible' },
    { hostname: 'SRV-LEGACY02', os: 'Windows Server 2012 R2', missing: ['tenable', 'zscaler'], reason: 'Legacy OS — agent incompatible' },
    { hostname: 'OT-PLC-001', os: 'RTOS', missing: ['defender', 'taegis', 'tenable', 'zscaler'], reason: 'OT device — no agent support' },
    { hostname: 'OT-PLC-002', os: 'RTOS', missing: ['defender', 'taegis', 'tenable', 'zscaler'], reason: 'OT device — no agent support' },
    { hostname: 'DEV-MAC-042', os: 'macOS 14.2', missing: ['taegis'], reason: 'Pending Taegis Mac agent rollout' },
    { hostname: 'WS-NEW-088', os: 'Windows 11 23H2', missing: ['tenable'], reason: 'New device — scan pending' },
    { hostname: 'WS-NEW-089', os: 'Windows 11 23H2', missing: ['tenable'], reason: 'New device — scan pending' },
    { hostname: 'KIOSK-01', os: 'Windows 10 IoT', missing: ['taegis', 'zscaler'], reason: 'Kiosk — limited agent support' },
  ],
};

export const DEMO_METRICS = {
  alertsLast24h: { total: 147, critical: 8, high: 34, medium: 62, low: 43 },
  mttr: { current: 32, previous: 41, target: 30, unit: 'min' },
  mttd: { current: 8.5, previous: 12, target: 10, unit: 'min' },
  incidentsOpen: 3,
  slaCompliance: 94.2,
  topSources: [
    { source: 'Defender MDE', count: 52, pct: 35 },
    { source: 'Taegis XDR', count: 38, pct: 26 },
    { source: 'Defender XDR', count: 29, pct: 20 },
    { source: 'Zscaler ZIA', count: 18, pct: 12 },
    { source: 'Tenable', count: 10, pct: 7 },
  ],
  alertTrend: [32,28,45,38,52,41,67,55,48,72,61,58,44,39,53,47,62,71,55,48,63,58,42,51],
  sevTrend: {
    critical: [1,0,2,1,3,1,2,4,2,1,3,2,1,0,2,1,3,4,2,1,2,3,1,2],
    high: [8,6,12,9,14,10,18,14,12,19,15,14,11,9,13,12,16,18,14,12,16,14,10,13],
  },
};

export const DEMO_TIMELINE = [
  { id: 't01', time: new Date(Date.now() - 300000).toISOString(), type: 'alert', severity: 'critical', title: 'Ransomware behavior detected on WS088', source: 'Defender MDE', icon: '🔴' },
  { id: 't02', time: new Date(Date.now() - 600000).toISOString(), type: 'action', severity: 'info', title: 'Auto-isolated WS088 from network', source: 'Defender MDE', icon: '🛡' },
  { id: 't03', time: new Date(Date.now() - 900000).toISOString(), type: 'alert', severity: 'high', title: 'Brute force on VPN-GW-01 — 847 attempts in 5 min', source: 'Taegis XDR', icon: '🟠' },
  { id: 't04', time: new Date(Date.now() - 1200000).toISOString(), type: 'alert', severity: 'critical', title: 'Kerberoasting from SRV-DC01 by admin_svc', source: 'Taegis XDR', icon: '🔴' },
  { id: 't05', time: new Date(Date.now() - 1800000).toISOString(), type: 'alert', severity: 'high', title: 'Encoded PowerShell on WS042 by jsmith', source: 'Defender MDE', icon: '🟠' },
  { id: 't06', time: new Date(Date.now() - 2400000).toISOString(), type: 'scan', severity: 'info', title: 'Tenable scan completed — 3 new critical CVEs', source: 'Tenable', icon: '🔍' },
  { id: 't07', time: new Date(Date.now() - 2700000).toISOString(), type: 'alert', severity: 'high', title: 'MFA fatigue attack on cdavis — 12 push requests', source: 'Defender XDR', icon: '🟠' },
  { id: 't08', time: new Date(Date.now() - 3600000).toISOString(), type: 'alert', severity: 'critical', title: 'LSASS credential dump on SRV-DC01', source: 'Defender MDE', icon: '🔴' },
  { id: 't09', time: new Date(Date.now() - 4200000).toISOString(), type: 'block', severity: 'info', title: 'ZIA blocked 42 connections to known C2 infrastructure', source: 'Zscaler ZIA', icon: '🚫' },
  { id: 't10', time: new Date(Date.now() - 5400000).toISOString(), type: 'alert', severity: 'high', title: 'Lateral movement via SMB from WS042 to FS01', source: 'Defender MDE', icon: '🟠' },
  { id: 't11', time: new Date(Date.now() - 7200000).toISOString(), type: 'posture', severity: 'warning', title: 'ZPA: 23 devices failing posture checks', source: 'Zscaler ZPA', icon: '⚠️' },
  { id: 't12', time: new Date(Date.now() - 10800000).toISOString(), type: 'action', severity: 'info', title: 'Night shift handover — 82 alerts cleared', source: 'SOC Ops', icon: '📋' },
];

export const DEMO_MITRE_MAP: Record<string, { count: number; severity: string }> = {
  'T1566': { count: 4, severity: 'high' },      // Phishing
  'T1059.001': { count: 3, severity: 'critical' }, // PowerShell
  'T1003.001': { count: 2, severity: 'critical' }, // LSASS
  'T1071.001': { count: 3, severity: 'high' },   // Web Protocols C2
  'T1021.002': { count: 2, severity: 'high' },   // SMB Lateral
  'T1053.005': { count: 1, severity: 'medium' }, // Scheduled Task
  'T1110': { count: 5, severity: 'high' },       // Brute Force
  'T1048': { count: 1, severity: 'medium' },     // Exfiltration
  'T1572': { count: 2, severity: 'high' },       // DNS Tunnel
  'T1190': { count: 1, severity: 'critical' },   // Exploit Public App
  'T1078': { count: 3, severity: 'high' },       // Valid Accounts
  'T1027': { count: 1, severity: 'medium' },     // Obfuscated Files
  'T1070': { count: 1, severity: 'medium' },     // Indicator Removal
  'T1018': { count: 2, severity: 'low' },        // Remote System Discovery
  'T1082': { count: 3, severity: 'low' },        // System Info Discovery
  'T1569.002': { count: 1, severity: 'high' },   // Service Execution
  'T1036': { count: 2, severity: 'medium' },     // Masquerading
  'T1547.001': { count: 1, severity: 'high' },   // Registry Run Keys
  'T1562.001': { count: 1, severity: 'critical' }, // Disable Security Tools
  'T1567.002': { count: 1, severity: 'high' },   // Exfil to Cloud
};

export const MITRE_TACTICS = [
  { id: 'TA0001', name: 'Initial Access', techs: ['T1566','T1190','T1078'] },
  { id: 'TA0002', name: 'Execution', techs: ['T1059.001','T1569.002'] },
  { id: 'TA0003', name: 'Persistence', techs: ['T1053.005','T1547.001'] },
  { id: 'TA0004', name: 'Privilege Esc', techs: ['T1078'] },
  { id: 'TA0005', name: 'Defense Evasion', techs: ['T1027','T1070','T1036','T1562.001'] },
  { id: 'TA0006', name: 'Credential Access', techs: ['T1003.001','T1110'] },
  { id: 'TA0007', name: 'Discovery', techs: ['T1018','T1082'] },
  { id: 'TA0008', name: 'Lateral Movement', techs: ['T1021.002'] },
  { id: 'TA0009', name: 'Collection', techs: [] },
  { id: 'TA0010', name: 'Exfiltration', techs: ['T1048','T1567.002'] },
  { id: 'TA0011', name: 'Command & Control', techs: ['T1071.001','T1572'] },
];

export const DEMO_TRENDS = {
  labels_7d: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  labels_30d: Array.from({length:30},(_,i)=>`D${i+1}`),
  labels_90d: Array.from({length:12},(_,i)=>`W${i+1}`),
  mttr: { '7d':[38,35,42,31,28,33,32], '30d':[45,42,40,38,41,39,36,38,35,33,37,34,32,35,33,31,34,32,30,33,31,29,32,30,28,31,29,32,30,32], '90d':[52,48,45,42,40,38,36,35,33,32,31,32] },
  mttd: { '7d':[12,10,11,9,8,9,8.5], '30d':[15,14,13,12,13,11,12,10,11,10,9,10,9,8,9,8,9,8,8.5,9,8,8.5,8,9,8,8.5,8,8.5,8,8.5], '90d':[18,16,14,13,12,11,10,9.5,9,8.5,8.5,8.5] },
  alerts: { '7d':[142,158,134,167,155,128,147], '30d':[120,132,145,138,142,158,134,167,155,128,147,162,138,145,152,148,135,142,155,160,148,138,145,150,142,138,155,148,142,147], '90d':[1020,1150,1080,1200,1100,1050,980,1020,1080,1050,1020,1040] },
  vulns_critical: { '7d':[28,26,25,24,24,23,24], '30d':[35,34,32,31,30,29,28,27,28,26,25,26,25,24,25,24,24,23,24,23,24,23,24,24,23,24,24,23,24,24], '90d':[48,45,42,38,35,32,30,28,26,25,24,24] },
};
