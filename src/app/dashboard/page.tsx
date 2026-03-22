'use client';
import { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type SevKey = 'Critical'|'High'|'Medium'|'Low';
type VerdictKey = 'TP'|'FP'|'SUS'|'Pending';
type AutomationLevel = 0|1|2;
interface Tool { id:string; name:string; configured:boolean; active:boolean; alertCount?:number; }
interface Alert { id:string; title:string; severity:SevKey; source:string; device:string; time:string; verdict:VerdictKey; confidence:number; aiReasoning:string; aiActions:string[]; evidenceChain:string[]; runbookSteps:string[]; mitre?:string; incidentId?:string; }
interface GapDevice { hostname:string; ip:string; os:string; missing:string[]; reason:string; lastSeen:string; }
interface Vuln { id:string; cve:string; title:string; severity:SevKey; cvss:number; prevalence:number; affected:number; affectedDevices:string[]; description:string; remediation:string[]; kev:boolean; patch?:string; }
interface IntelItem { id:string; title:string; summary:string; severity:SevKey; source:string; time:string; iocs?:string[]; mitre?:string; industrySpecific:boolean; }
interface Incident { id:string; title:string; severity:SevKey; status:'Active'|'Contained'|'Closed'; created:string; updated:string; alertCount:number; devices:string[]; mitreTactics:string[]; timeline:{t:string;actor:'AI'|'Analyst';action:string;detail:string}[]; aiSummary:string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const SEV_COLOR:Record<SevKey,string> = { Critical:'#f0405e', High:'#f97316', Medium:'#f0a030', Low:'#4f8fff' };
const VERDICT_STYLE:Record<VerdictKey,{c:string,bg:string,label:string}> = {
  TP:{c:'#f0405e',bg:'#f0405e12',label:'True Positive'},
  FP:{c:'#22d49a',bg:'#22d49a12',label:'False Positive'},
  SUS:{c:'#f0a030',bg:'#f0a03012',label:'Suspicious'},
  Pending:{c:'#6b7a94',bg:'#6b7a9412',label:'Pending'},
};
const INDUSTRIES = ['Financial Services','Healthcare','Retail & eCommerce','Manufacturing','Energy & Utilities','Government & Public Sector','Legal & Professional','Technology','Education','Telecommunications'];

// ─── Demo Data ─────────────────────────────────────────────────────────────────
const DEMO_TOOLS:Tool[] = [
  {id:'crowdstrike',name:'CrowdStrike',configured:true,active:true,alertCount:8},
  {id:'defender',name:'Defender',configured:true,active:true,alertCount:5},
  {id:'taegis',name:'Taegis XDR',configured:false,active:false},
  {id:'darktrace',name:'Darktrace',configured:true,active:true,alertCount:3},
  {id:'splunk',name:'Splunk',configured:true,active:true,alertCount:12},
  {id:'sentinel',name:'Sentinel',configured:true,active:true,alertCount:4},
  {id:'tenable',name:'Tenable',configured:true,active:true},
  {id:'proofpoint',name:'Proofpoint',configured:true,active:true,alertCount:2},
];

const DEMO_GAP_DEVICES:GapDevice[] = [
  {hostname:'SRV-LEGACY01',ip:'10.0.4.22',os:'Windows Server 2008',missing:['EDR','Vuln Scanner'],reason:'Legacy OS — agent incompatible',lastSeen:'2h ago'},
  {hostname:'laptop-MKTG07',ip:'10.0.2.87',os:'Windows 11',missing:['EDR'],reason:'User-initiated uninstall',lastSeen:'15m ago'},
  {hostname:'SRV-NAS01',ip:'10.0.3.15',os:'FreeNAS',missing:['EDR','Vuln Scanner','SIEM'],reason:'NAS device — no agent support',lastSeen:'5m ago'},
  {hostname:'KIOSK-LOBBY',ip:'10.0.1.200',os:'Windows 10 IoT',missing:['Vuln Scanner'],reason:'IoT device — restricted access',lastSeen:'1m ago'},
  {hostname:'laptop-HR03',ip:'10.0.2.44',os:'macOS 13',missing:['EDR'],reason:'Pending deployment — ticket open',lastSeen:'30m ago'},
];

const DEMO_ALERTS:Alert[] = [
  {id:'a1',title:'LSASS memory access — DC01',severity:'Critical',source:'CrowdStrike',device:'DC01',time:'09:14',verdict:'TP',confidence:98,aiReasoning:'Domain controller targeted by LSASS memory access. Service account credentials at high risk. T1003.001 — high-fidelity detection. No maintenance window active. Previous login from this account was legitimate, now accessing LSASS — strong indicator of credential dumping.',evidenceChain:['Domain controller targeted — highest value asset','Service account admin_svc used laterally across 3 hosts','T1003.001 — credential dumping technique, high-fidelity','No scheduled maintenance or admin activity logged','Sequence mirrors known Mimikatz behaviour'],aiActions:['Incident INC-0847 created and assigned to Tier 2','admin_svc account disabled (revert available)','SOC Slack #incidents channel notified','5-step runbook generated and attached'],runbookSteps:['Isolate DC01 from network immediately','Reset admin_svc credentials across all domains','Run forensic memory capture on DC01','Search SIEM for admin_svc lateral movement in last 48h','Notify CISO — potential domain compromise'],mitre:'T1003.001',incidentId:'INC-0847'},
  {id:'a2',title:'C2 beacon to 185.220.101.42:443',severity:'High',source:'Darktrace',device:'SRV-FINANCE01',time:'09:16',verdict:'TP',confidence:94,aiReasoning:'Darktrace detected anomalous HTTPS beacon with JA3 fingerprint matching known C2. IP 185.220.101.42 appears on ThreatFox with LockBit association. Darktrace device confidence deviation 96/100. Beaconing interval is 300s — consistent with C2 heartbeat.',evidenceChain:['IP 185.220.101.42 on ThreatFox — LockBit C2','Darktrace: device behaviour deviation 96/100','JA3 TLS fingerprint matches known C2 tooling','300s beacon interval — classic C2 heartbeat','Same IP seen in sector threat intel feed 48h ago'],aiActions:['IP blocked at Zscaler perimeter','Darktrace packet capture initiated','Threat intel IOC added to watchlist','SRV-FINANCE01 network access restricted'],runbookSteps:['Block IP at all perimeter controls','Analyse all traffic from SRV-FINANCE01 last 72h','Check for additional beaconing hosts','Preserve memory image before isolation','Report IOC to information sharing group'],mitre:'T1071.001'},
  {id:'a3',title:'Scheduled task created — SRV-APP02',severity:'Medium',source:'Defender',device:'SRV-APP02',time:'09:22',verdict:'SUS',confidence:67,aiReasoning:'Scheduled task created by non-standard account outside business hours. Technique is consistent with persistence but could be legitimate deployment tooling. User account has no prior history of scheduled task creation. Confidence is moderate — analyst review recommended.',evidenceChain:['Task created at 02:17 AM — outside business hours','Non-standard service account as task creator','No change ticket matching this action','Similar technique seen in APT29 playbook','No other anomalous activity from this account'],aiActions:['Alert flagged for analyst review','Task hash added to monitoring watchlist','No automated action taken — SUS confidence below threshold'],runbookSteps:['Review task definition and target binary','Cross-reference with change management system','Check source account login history','If unconfirmed legitimate — isolate and investigate'],mitre:'T1053.005'},
  {id:'a4',title:'Windows Update triggered PowerShell',severity:'Low',source:'Splunk',device:'WS-SALES12',time:'09:31',verdict:'FP',confidence:99,aiReasoning:'PowerShell execution traced to Windows Update process (wuauclt.exe → powershell.exe). This is a known Microsoft update pattern. Parent process chain matches legitimate Microsoft signing certificate. Update KB5034441 scheduled for this host. No malicious indicators present.',evidenceChain:['Parent: wuauclt.exe — legitimate Windows Update process','Microsoft-signed certificate chain verified','KB5034441 scheduled for this host at 09:30','No network egress from PowerShell process','No payload or download cradle observed'],aiActions:['Auto-closed — False Positive 99% confidence','Suppression rule created for this update pattern'],runbookSteps:[],mitre:'T1059.001'},
  {id:'a5',title:'Anomalous VPN login — new geography',severity:'Medium',source:'Sentinel',device:'cloud-vpn',time:'09:38',verdict:'SUS',confidence:72,aiReasoning:'User jsmith@corp logged in from Singapore — their established baseline is UK. Travel is possible but no flight booking detected in calendar. Account has MFA enabled. Timing is 03:00 local time in Singapore — unusual for legitimate travel. Monitoring and MFA re-challenge applied.',evidenceChain:['User baseline: London, UK — current location: Singapore','03:00 AM local login time — unusual pattern','No calendar events indicating travel','MFA enrolled but not challenged recently','No prior Singapore login in 12 months'],aiActions:['MFA re-challenge sent to user','Session maintained pending MFA response','Account flagged for 24h enhanced monitoring','HR calendar integration checked — no travel noted'],runbookSteps:['Await MFA response — escalate if no response in 10m','If MFA passed — continue monitoring for anomalies','If MFA failed — suspend account immediately','Check with user direct via phone'],mitre:'T1078'},
  {id:'a6',title:'Large file upload to personal cloud',severity:'High',source:'Zscaler',device:'laptop-HR03',time:'10:02',verdict:'TP',confidence:88,aiReasoning:'HR03 user uploaded 18GB to a personal Google Drive account over 2 hours. Upload volume is 36x their daily baseline. User has a resignation notice on file (from HR record cross-reference). Files accessed include payroll data directories. DLP policy triggered.',evidenceChain:['18GB upload — 36x user daily baseline','Destination: personal Google Drive account','User has active resignation notice (HR integrated)','Files included: /finance/payroll/2025 directory','DLP tag: PII and financial data detected'],aiActions:['Upload throttled via Zscaler policy','HR and Legal teams alerted automatically','Files accessed logged to audit trail','Account flagged for enhanced DLP monitoring'],runbookSteps:['Legal team review of acceptable use policy breach','Preserve DLP logs for HR proceedings','Remotely wipe device on departure','Brief IT security on offboarding procedure'],mitre:'T1567.002'},
];

const DEMO_VULNS:Vuln[] = [
  {id:'v1',cve:'CVE-2024-21413',title:'Microsoft Outlook NTLM Credential Leak',severity:'Critical',cvss:9.8,prevalence:94,affected:23,affectedDevices:['laptop-CFO01','laptop-SALES03','WS-HR01','+ 20 more'],description:'Critical RCE/NTLM relay vulnerability in Microsoft Outlook. Exploitable via malicious email links without user interaction. Actively exploited in the wild by APT actors.',remediation:['Apply Microsoft patch KB5002112 immediately','Enable Windows Credential Guard on all endpoints','Block outbound SMB (TCP 445) at perimeter','Add to email gateway URL filtering rules','Consider blocking external hyperlinks in email until patched'],kev:true,patch:'KB5002112'},
  {id:'v2',cve:'CVE-2024-3400',title:'PAN-OS Command Injection — GlobalProtect',severity:'Critical',cvss:10.0,prevalence:88,affected:2,affectedDevices:['FW-EDGE01','FW-BRANCH01'],description:'Critical command injection in Palo Alto GlobalProtect gateway. CVSSv3 10.0. Exploited by nation-state actors (UNC5221) in the wild. Full command execution as root possible.',remediation:['Apply PAN-OS patch 11.1.2-h3 or later immediately','Enable Threat Prevention signatures for CVE-2024-3400','Review GlobalProtect logs for IOCs: sessions from unexpected IPs','Isolate affected firewalls if patch cannot be applied immediately','Contact Palo Alto PSIRT if compromise suspected'],kev:true,patch:'PAN-OS 11.1.2-h3'},
  {id:'v3',cve:'CVE-2024-27198',title:'JetBrains TeamCity Auth Bypass',severity:'Critical',cvss:9.8,prevalence:76,affected:3,affectedDevices:['SRV-CICD01','SRV-BUILD02','SRV-BUILD03'],description:'Authentication bypass in JetBrains TeamCity build server. Allows unauthenticated remote code execution. APT29 (Cozy Bear) actively exploiting to compromise CI/CD pipelines and inject malicious build artifacts.',remediation:['Upgrade TeamCity to version 2023.11.4 immediately','If upgrade not possible, restrict TeamCity to VPN access only','Review all build logs for unexpected plugin installations','Audit service account permissions used by TeamCity','Check build artifacts for unexpected modifications'],kev:true,patch:'TeamCity 2023.11.4'},
  {id:'v4',cve:'CVE-2023-46805',title:'Ivanti ICS/IPS Authentication Bypass',severity:'Critical',cvss:8.2,prevalence:71,affected:1,affectedDevices:['IVANTI-GW01'],description:'Authentication bypass affecting Ivanti Connect Secure and Policy Secure. Chained with CVE-2024-21887 for RCE. Mass exploitation observed. CISA emergency directive issued.',remediation:['Apply Ivanti patch immediately or take gateway offline','Run Ivanti Integrity Checker Tool','Reset all passwords for users authenticated via affected gateway','Review SIEM for suspicious authentication patterns','Consider replacing with alternative VPN solution if persistent issues'],kev:true},
  {id:'v5',cve:'CVE-2024-1708',title:'ConnectWise ScreenConnect Path Traversal',severity:'Critical',cvss:8.4,prevalence:65,affected:1,affectedDevices:['SCREENCONNECT01'],description:'Path traversal vulnerability in ConnectWise ScreenConnect. Allows unauthenticated RCE. Ransomware groups actively using this to gain initial access to MSP-managed networks.',remediation:['Upgrade ScreenConnect to version 23.9.8 or later','If upgrade delayed, disable external access until patched','Review ScreenConnect audit logs for unauthorized sessions','Check all managed endpoints for unauthorized ScreenConnect sessions','Alert clients if you are an MSP using ScreenConnect'],kev:true,patch:'ScreenConnect 23.9.8'},
  {id:'v6',cve:'CVE-2024-21762',title:'Fortinet FortiOS OOB Write — SSL VPN',severity:'Critical',cvss:9.6,prevalence:82,affected:2,affectedDevices:['FORTI-EDGE01','FORTI-DR01'],description:'Out-of-bounds write in Fortinet FortiOS SSL VPN. No authentication required. Likely exploited in the wild. Fortinet issued emergency patch.',remediation:['Upgrade FortiOS to 7.4.3 or 7.2.7 immediately','Disable SSL VPN if upgrade cannot be applied immediately','Monitor for IOCs: unexpected admin account creation, config changes','Check FortiGuard subscription is active and updated','Verify all admin accounts — delete any unrecognised'],kev:true,patch:'FortiOS 7.4.3'},
  {id:'v7',cve:'CVE-2024-20767',title:'Adobe ColdFusion RCE — Public Files',severity:'High',cvss:8.7,prevalence:58,affected:4,affectedDevices:['SRV-WEB01','SRV-WEB02','SRV-WEB03','SRV-WEB04'],description:'Remote code execution in Adobe ColdFusion via the administrator panel. Allows arbitrary file read and potential RCE. Web-facing ColdFusion servers at significant risk.',remediation:['Apply Adobe patch APSB24-14 immediately','If ColdFusion admin interface is internet-facing, take offline','Restrict admin interface to management VLAN only','Enable WAF rules for ColdFusion exploit attempts','Review web server logs for scanning activity'],kev:false,patch:'APSB24-14'},
  {id:'v8',cve:'CVE-2024-22024',title:'Ivanti Connect Secure XXE Injection',severity:'High',cvss:8.3,prevalence:52,affected:1,affectedDevices:['IVANTI-GW01'],description:'XXE injection in Ivanti Connect Secure and Neurons for ZTA. Can be used to access sensitive files. Affects same device as CVE-2023-46805 — prioritise remediation.',remediation:['Covered by same Ivanti patch as CVE-2023-46805','Verify patch applied to both vulnerabilities simultaneously','Run Ivanti ICT scan post-patching','Monitor for XML-related errors in gateway logs'],kev:false},
  {id:'v9',cve:'CVE-2024-27956',title:'WordPress Automatic Plugin SQL Injection',severity:'High',cvss:9.8,prevalence:45,affected:2,affectedDevices:['SRV-WEB02','SRV-WEB03'],description:'Critical SQL injection in WordPress Automatic plugin. Allows unauthenticated attackers to create admin users and upload webshells. Rapidly weaponised.',remediation:['Update Automatic plugin to version 3.92.1 or later','Scan WordPress installations for unauthorized admin accounts','Check for uploaded files in wp-content/uploads — remove suspicious','Enable WAF plugin (Wordfence) or cloud WAF rule','Consider disabling XML-RPC if not needed'],kev:false,patch:'Automatic plugin 3.92.1'},
  {id:'v10',cve:'CVE-2023-48788',title:'Fortinet EMS SQL Injection — RCE',severity:'High',cvss:9.3,prevalence:38,affected:1,affectedDevices:['EMS-SERVER01'],description:'SQL injection in Fortinet FortiClientEMS. Enables RCE without authentication. Widely exploited against internet-exposed EMS servers. DoJ charged attackers exploiting this.',remediation:['Upgrade FortiClientEMS to 7.2.3 or 7.0.10','Restrict EMS to internal network — no direct internet exposure','Check EMS logs for unauthorized SQL activity','Audit all managed endpoint agents for unexpected configuration changes'],kev:true,patch:'FortiClientEMS 7.2.3'},
];

const DEMO_INCIDENTS:Incident[] = [
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

const DEMO_INTEL_BY_INDUSTRY:Record<string,IntelItem[]> = {
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
function SevBadge({sev}:{sev:SevKey}) {
  return <span style={{fontSize:'0.5rem',fontWeight:800,padding:'1px 6px',borderRadius:3,color:'#fff',background:SEV_COLOR[sev]}}>{sev.toUpperCase()}</span>;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={onClose}>
      <div style={{background:'#0a0d14',border:'1px solid #1e2536',borderRadius:16,maxWidth:700,width:'100%',maxHeight:'85vh',overflow:'auto',position:'relative'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',padding:'16px 20px',borderBottom:'1px solid #141820',position:'sticky',top:0,background:'#0a0d14',zIndex:10}}>
          <span style={{fontWeight:700,fontSize:'0.92rem'}}>{title}</span>
          <button onClick={onClose} style={{marginLeft:'auto',background:'none',border:'none',color:'#6b7a94',cursor:'pointer',fontSize:'1.2rem',lineHeight:1}}>×</button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({val,label,sub,color,onClick}:{val:string|number;label:string;sub?:string;color:string;onClick?:()=>void}) {
  return (
    <div onClick={onClick} style={{padding:'14px 12px',background:'#09091a',border:'1px solid #141820',borderRadius:10,textAlign:'center',cursor:onClick?'pointer':'default',transition:'border-color .15s'}}
      onMouseEnter={e=>{ if(onClick)(e.currentTarget as HTMLElement).style.borderColor='#4f8fff40'; }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor='#141820'; }}>
      <div style={{fontSize:'1.5rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color,letterSpacing:-1}}>{val}</div>
      <div style={{fontSize:'0.62rem',fontWeight:700,color:'#6b7a94',textTransform:'uppercase',letterSpacing:'0.4px',marginTop:2}}>{label}</div>
      {sub && <div style={{fontSize:'0.56rem',color:'#3a4050',marginTop:2}}>{sub}</div>}
      {onClick && <div style={{fontSize:'0.48rem',color:'#4f8fff',marginTop:4}}>click to view →</div>}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [automation, setAutomation] = useState<AutomationLevel>(1);
  const [modal, setModal] = useState<{type:string;data?:unknown}|null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert|null>(null);
  const [selectedVuln, setSelectedVuln] = useState<Vuln|null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident|null>(null);
  const [vulnAiLoading, setVulnAiLoading] = useState(false);
  const [vulnAiText, setVulnAiText] = useState('');
  const [industry, setIndustry] = useState('Financial Services');
  const [intelLoading, setIntelLoading] = useState(false);
  const [customIntel, setCustomIntel] = useState<IntelItem[]|null>(null);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  const tools = DEMO_TOOLS;
  const alerts = DEMO_ALERTS;
  const vulns = DEMO_VULNS;
  const incidents = DEMO_INCIDENTS;

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

  const intelItems = customIntel || (DEMO_INTEL_BY_INDUSTRY[industry] || DEMO_INTEL_BY_INDUSTRY['default']);
  const allIntel = [...intelItems, ...DEMO_INTEL_BY_INDUSTRY['default'].filter(i=>!intelItems.find(x=>x.id===i.id))];

  async function fetchIntelForIndustry(ind:string) {
    setIntelLoading(true);
    setCustomIntel(null);
    try {
      const resp = await fetch('/api/intel/industry', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({industry:ind}) });
      if (resp.ok) { const d = await resp.json(); setCustomIntel(d.items); }
    } catch(e) {}
    setIntelLoading(false);
  }

  async function getVulnAiHelp(vuln:Vuln) {
    setVulnAiLoading(true);
    setVulnAiText('');
    try {
      const resp = await fetch('/api/copilot', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt:`Provide concise remediation guidance for ${vuln.cve} - ${vuln.title} in a corporate environment. Cover: 1) Immediate mitigation steps, 2) Permanent fix, 3) Detection/hunting queries, 4) Business risk if unpatched. Be specific and actionable.`}) });
      if (resp.ok) {
        const d = await resp.json();
        const text = d.response || `AI remediation for ${vuln.cve}: Apply vendor patch ${vuln.patch || 'immediately'}. Priority: ${vuln.severity}. ${vuln.kev ? 'CISA KEV listed — 72h compliance deadline.' : ''} Contact security team for deployment plan.`;
        let i = 0;
        const interval = setInterval(()=>{ setVulnAiText(text.slice(0,i)); i++; if(i>text.length) clearInterval(interval); }, 12);
      }
    } catch(e) {
      setVulnAiText(`Remediation for ${vuln.cve}: ${vuln.remediation.join('. ')}`);
    }
    setVulnAiLoading(false);
  }

  function toggleAlertExpand(id:string) {
    setExpandedAlerts(prev => { const n = new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  }

  const TABS = ['overview','alerts','coverage','vulns','intel','incidents','tools'];

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#050508',color:'#e8ecf4',fontFamily:'Inter,sans-serif'}}>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .tab-btn{padding:7px 16px;border:none;background:transparent;cursor:pointer;font-size:0.76rem;font-weight:600;font-family:Inter,sans-serif;border-radius:8px;transition:all .15s;white-space:nowrap}
        .tab-btn.active{background:#4f8fff18;color:#4f8fff}
        .tab-btn:not(.active){color:#6b7a94}
        .tab-btn:not(.active):hover{color:#a0adc4;background:#0a0d14}
        .row-hover{transition:background .12s}
        .row-hover:hover{background:#0d1020!important}
        .vuln-row:hover{background:#0a0d18!important;cursor:pointer}
        .alert-card{border-radius:10px;border:1px solid #141820;background:#09091a;transition:border-color .15s}
        .alert-card:hover{border-color:#4f8fff28}
      `}</style>

      {/* SIDEBAR */}
      <div style={{width:48,background:'#08090f',borderRight:'1px solid #141820',display:'flex',flexDirection:'column',alignItems:'center',padding:'10px 0',gap:4,flexShrink:0}}>
        <div style={{width:30,height:30,borderRadius:8,background:'linear-gradient(135deg,#4f8fff,#8b6fff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.62rem',color:'#fff',fontWeight:900,marginBottom:10}}>W</div>
        {[{t:'overview',i:'📊'},{t:'alerts',i:'🔔'},{t:'coverage',i:'🛡'},{t:'vulns',i:'🔍'},{t:'intel',i:'🌐'},{t:'incidents',i:'📋'},{t:'tools',i:'🔌'}].map(({t,i})=>(
          <button key={t} onClick={()=>setActiveTab(t)} title={t.charAt(0).toUpperCase()+t.slice(1)} style={{width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,fontSize:'0.85rem',border:'none',cursor:'pointer',background:activeTab===t?'#4f8fff18':'transparent',transition:'background .15s'}}>
            {i}{t==='alerts'&&critAlerts.length>0&&<span style={{position:'absolute',marginLeft:16,marginTop:-16,width:7,height:7,borderRadius:'50%',background:'#f0405e',display:'block'}} />}
          </button>
        ))}
        <div style={{marginTop:'auto',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
          <a href='/settings' title='Settings' style={{width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,fontSize:'0.85rem'}}>⚙️</a>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* TOP BAR */}
        <div style={{display:'flex',alignItems:'center',padding:'8px 18px',borderBottom:'1px solid #141820',gap:12,background:'#07080f',flexShrink:0,flexWrap:'wrap'}}>
          <div style={{display:'flex',gap:2}}>
            {TABS.map(t=>(
              <button key={t} className={`tab-btn${activeTab===t?' active':''}`} onClick={()=>setActiveTab(t)}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
                {t==='alerts'&&critAlerts.length>0&&<span style={{marginLeft:5,fontSize:'0.48rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:'#f0405e',color:'#fff'}}>{critAlerts.length}</span>}
                {t==='vulns'&&kevVulns.length>0&&<span style={{marginLeft:5,fontSize:'0.48rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:'#f97316',color:'#fff'}}>{kevVulns.length} KEV</span>}
              </button>
            ))}
          </div>
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:10}}>
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:7,background:'#0a0d14',border:'1px solid #141820'}}>
              <span style={{fontSize:'0.62rem',color:'#6b7a94'}}>Automation:</span>
              {(['Recommend','Auto+Notify','Full Auto'] as const).map((l,i)=>(
                <button key={l} onClick={()=>setAutomation(i as AutomationLevel)} style={{padding:'2px 8px',borderRadius:4,fontSize:'0.58rem',fontWeight:700,border:'none',cursor:'pointer',background:automation===i?'#4f8fff':'transparent',color:automation===i?'#fff':'#6b7a94',fontFamily:'Inter,sans-serif',transition:'all .15s'}}>{l}</button>
              ))}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:5,fontSize:'0.7rem',color:'#6b7a94'}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#22c992',boxShadow:'0 0 6px #22c992',display:'block',animation:'pulse 2s ease infinite'}} />
              {activeTools.length} tools live
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{flex:1,overflow:'auto',padding:'16px 18px'}}>

          {/* ═══════════════════════════════ OVERVIEW ═══════════════════════════════ */}
          {activeTab==='overview' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>

              {/* AI Brief */}
              <div style={{padding:'12px 16px',background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(34,201,146,0.05))',border:'1px solid #4f8fff18',borderRadius:12,display:'flex',alignItems:'flex-start',gap:10}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:'#4f8fff',boxShadow:'0 0 8px #4f8fff',flexShrink:0,marginTop:2,animation:'pulse 3s ease infinite'}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff',marginBottom:3}}>AI SHIFT BRIEF — {new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div>
                  <div style={{fontSize:'0.78rem',color:'#8a9ab0',lineHeight:1.65}}>Processed {alerts.length} alerts this session. Auto-closed {fpAlerts.length} false positives. Escalated {tpAlerts.length} true positives to incidents. <strong style={{color:'#f0405e'}}>{critAlerts.length} critical alerts</strong> require immediate attention. Estate coverage at {coveredPct}% — {gapDevices.length} devices missing agents.</div>
                </div>
                <span style={{fontSize:'0.62rem',color:'#22d49a',fontWeight:700,background:'#22d49a12',padding:'3px 8px',borderRadius:4,flexShrink:0}}>AI Active</span>
              </div>

              {/* Estate Health 2×2 */}
              <div>
                <div style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Estate Health</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>

                  {/* Devices + Gaps */}
                  <div onClick={()=>setModal({type:'gaps'})} style={{padding:16,background:'#09091a',border:'1px solid #141820',borderRadius:12,cursor:'pointer',transition:'border-color .15s'}}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='#4f8fff40'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor='#141820'}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:'0.72rem',fontWeight:700,color:'#6b7a94',marginBottom:2}}>Devices</div>
                        <div style={{fontSize:'2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',letterSpacing:-2,color:'#e8ecf4'}}>{totalDevices}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',marginBottom:2}}>{gapDevices.length} with gaps</div>
                        <div style={{fontSize:'0.52rem',color:'#3a4050'}}>Click to view →</div>
                      </div>
                    </div>
                    <div style={{height:6,background:'#141820',borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',background:'linear-gradient(90deg,#22d49a,#4f8fff)',borderRadius:3,width:`${coveredPct}%`,transition:'width 1s'}} />
                    </div>
                    <div style={{fontSize:'0.6rem',color:'#6b7a94',marginTop:4}}>{coveredPct}% agent coverage</div>
                  </div>

                  {/* Tool Status */}
                  <div onClick={()=>setModal({type:'tools'})} style={{padding:16,background:'#09091a',border:'1px solid #141820',borderRadius:12,cursor:'pointer',transition:'border-color .15s'}}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='#4f8fff40'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor='#141820'}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:'0.72rem',fontWeight:700,color:'#6b7a94',marginBottom:2}}>Tool Status</div>
                        <div style={{fontSize:'2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',letterSpacing:-2,color:'#22d49a'}}>{activeTools.length}<span style={{fontSize:'1rem',color:'#3a4050'}}>/{tools.length}</span></div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.62rem',fontWeight:700,color:tools.filter(t=>!t.active).length>0?'#f0a030':'#22d49a',marginBottom:2}}>{tools.filter(t=>!t.active).length} inactive</div>
                        <div style={{fontSize:'0.52rem',color:'#3a4050'}}>Click to manage →</div>
                      </div>
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {tools.map(t=>(
                        <span key={t.id} style={{fontSize:'0.52rem',fontWeight:600,padding:'2px 7px',borderRadius:4,background:t.active?'#22d49a12':'#f0a03012',color:t.active?'#22d49a':'#f0a030',border:`1px solid ${t.active?'#22d49a20':'#f0a03020'}`}}>{t.name}</span>
                      ))}
                    </div>
                  </div>

                  {/* Alert Sources */}
                  <div onClick={()=>setModal({type:'alerts-ingested'})} style={{padding:16,background:'#09091a',border:'1px solid #141820',borderRadius:12,cursor:'pointer',transition:'border-color .15s'}}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='#4f8fff40'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor='#141820'}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:'0.72rem',fontWeight:700,color:'#6b7a94',marginBottom:2}}>Alerts Ingested</div>
                        <div style={{fontSize:'2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',letterSpacing:-2,color:'#4f8fff'}}>{alerts.length}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',marginBottom:2}}>{critAlerts.length} critical</div>
                        <div style={{fontSize:'0.52rem',color:'#3a4050'}}>Click for AI detail →</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      {[{l:'TP',v:tpAlerts.length,c:'#f0405e'},{l:'FP',v:fpAlerts.length,c:'#22d49a'},{l:'SUS',v:alerts.filter(a=>a.verdict==='SUS').length,c:'#f0a030'}].map(s=>(
                        <div key={s.l} style={{flex:1,textAlign:'center',padding:'4px 0',background:'#050508',borderRadius:6}}>
                          <div style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.c}}>{s.v}</div>
                          <div style={{fontSize:'0.5rem',color:'#3a4050',fontWeight:700}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vulns / SLA */}
                  <div onClick={()=>setActiveTab('vulns')} style={{padding:16,background:'#09091a',border:'1px solid #141820',borderRadius:12,cursor:'pointer',transition:'border-color .15s'}}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='#4f8fff40'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor='#141820'}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:'0.72rem',fontWeight:700,color:'#6b7a94',marginBottom:2}}>Vulnerabilities</div>
                        <div style={{fontSize:'2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',letterSpacing:-2,color:'#f0405e'}}>{vulns.length}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',marginBottom:2}}>{kevVulns.length} KEV — patch now</div>
                        <div style={{fontSize:'0.52rem',color:'#3a4050'}}>Click for details →</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      {[{l:'Crit',v:critVulns.length,c:'#f0405e'},{l:'High',v:vulns.filter(v=>v.severity==='High').length,c:'#f97316'},{l:'Med',v:vulns.filter(v=>v.severity==='Medium').length,c:'#f0a030'}].map(s=>(
                        <div key={s.l} style={{flex:1,textAlign:'center',padding:'4px 0',background:'#050508',borderRadius:6}}>
                          <div style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.c}}>{s.v}</div>
                          <div style={{fontSize:'0.5rem',color:'#3a4050',fontWeight:700}}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Posture */}
              <div style={{display:'flex',alignItems:'center',gap:12,padding:16,background:'#09091a',border:'1px solid #141820',borderRadius:12}}>
                <div style={{position:'relative',width:64,height:64,flexShrink:0}}>
                  <svg viewBox='0 0 100 100' style={{width:'100%',height:'100%'}}>
                    <circle cx={50} cy={50} r={42} fill='none' stroke='#141820' strokeWidth={8} />
                    <circle cx={50} cy={50} r={42} fill='none' stroke={postureColor} strokeWidth={8} strokeDasharray={`${(posture/100)*264} 264`} strokeLinecap='round' transform='rotate(-90 50 50)' style={{transition:'stroke-dasharray 1s ease'}} />
                  </svg>
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-60%)',fontSize:'1.2rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:postureColor}}>{posture}</div>
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,45%)',fontSize:'0.6rem',fontWeight:800,color:postureColor}}>C+</div>
                </div>
                <div>
                  <div style={{fontSize:'0.82rem',fontWeight:700,marginBottom:3}}>Security Posture</div>
                  <div style={{fontSize:'0.74rem',color:'#6b7a94',lineHeight:1.6}}>{critAlerts.length} critical alerts active · {kevVulns.length} KEV patches outstanding · {gapDevices.length} devices uncovered</div>
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
                <span style={{fontSize:'0.62rem',color:'#22d49a',background:'#22d49a12',padding:'2px 8px',borderRadius:4}}>{autLabel} — AI handling enabled</span>
                <span style={{marginLeft:'auto',fontSize:'0.7rem',color:'#6b7a94'}}>{alerts.length} total · {fpAlerts.length} auto-closed · {tpAlerts.length} escalated</span>
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
                          <span style={{fontSize:'0.52rem',color:'#3a4050',fontFamily:'JetBrains Mono,monospace'}}>{alert.device}</span>
                          <span style={{fontSize:'0.52rem',color:'#3a4050'}}>{alert.time}</span>
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
                        <span style={{fontSize:'0.72rem',color:'#3a4050'}}>{expanded?'▲':'▼'}</span>
                      </div>
                    </div>
                    {expanded && (
                      <div style={{padding:'0 14px 14px 14px',borderTop:'1px solid #141820'}}>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12}}>
                          <div>
                            <div style={{fontSize:'0.6rem',fontWeight:700,color:'#4a5568',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>AI Reasoning</div>
                            <div style={{fontSize:'0.74rem',color:'#8a9ab0',lineHeight:1.65}}>{alert.aiReasoning}</div>
                            <div style={{fontSize:'0.6rem',fontWeight:700,color:'#4a5568',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6,marginTop:10}}>Evidence Chain</div>
                            {alert.evidenceChain.map(e=>(
                              <div key={e} style={{fontSize:'0.72rem',color:'#a0adc4',padding:'2px 0 2px 12px',position:'relative'}}>
                                <span style={{position:'absolute',left:0,top:9,width:5,height:5,borderRadius:'50%',background:'#4f8fff',display:'block'}} />{e}
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{fontSize:'0.6rem',fontWeight:700,color:'#22d49a',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>AI Actions Taken</div>
                            {alert.aiActions.map(a=>(
                              <div key={a} style={{fontSize:'0.72rem',color:'#22d49a',padding:'2px 0',display:'flex',gap:6}}>
                                <span>✓</span><span>{a}</span>
                              </div>
                            ))}
                            {alert.runbookSteps.length>0 && (
                              <>
                                <div style={{fontSize:'0.6rem',fontWeight:700,color:'#4a5568',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6,marginTop:10}}>Runbook Steps</div>
                                {alert.runbookSteps.map((s,i)=>(
                                  <div key={s} style={{fontSize:'0.72rem',color:'#8a9ab0',padding:'2px 0',display:'flex',gap:6}}>
                                    <span style={{color:'#4f8fff',fontWeight:700,flexShrink:0,fontSize:'0.6rem',background:'#4f8fff15',borderRadius:3,padding:'1px 4px'}}>{i+1}</span><span>{s}</span>
                                  </div>
                                ))}
                              </>
                            )}
                            {alert.incidentId && (
                              <button onClick={()=>{ setActiveTab('incidents'); setSelectedIncident(incidents.find(i=>i.id===alert.incidentId)||null); }} style={{marginTop:10,padding:'5px 12px',borderRadius:6,border:'1px solid #4f8fff30',background:'#4f8fff12',color:'#4f8fff',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                                → View {alert.incidentId}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
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
                      <div key={tool.id} style={{padding:'10px 14px',background:'#09091a',border:'1px solid #141820',borderRadius:10,display:'flex',alignItems:'center',gap:12}}>
                        <div style={{width:110,fontSize:'0.76rem',fontWeight:600,flexShrink:0}}>{tool.name}</div>
                        <div style={{flex:1,height:8,background:'#141820',borderRadius:4,overflow:'hidden'}}>
                          <div style={{height:'100%',background:`linear-gradient(90deg,${pctColor},${pctColor}aa)`,borderRadius:4,width:`${pct}%`,transition:'width 1s'}} />
                        </div>
                        <span style={{fontSize:'0.72rem',fontWeight:800,fontFamily:'JetBrains Mono,monospace',color:pctColor,minWidth:36,textAlign:'right'}}>{pct}%</span>
                        <span style={{fontSize:'0.6rem',color:'#3a4050',minWidth:80,textAlign:'right'}}>{gapCount>0?<span style={{color:'#f0a030'}}>{gapCount} devices missing</span>:'Full coverage'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Devices with gaps */}
              <div>
                <div style={{fontSize:'0.62rem',fontWeight:700,color:'#f0405e',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Devices with Gaps ({gapDevices.length})</div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {gapDevices.map(dev=>(
                    <div key={dev.hostname} style={{padding:'12px 14px',background:'#09091a',border:'1px solid #f0405e18',borderRadius:10}}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                            <span style={{fontSize:'0.8rem',fontWeight:700,fontFamily:'JetBrains Mono,monospace'}}>{dev.hostname}</span>
                            <span style={{fontSize:'0.6rem',color:'#3a4050',fontFamily:'JetBrains Mono,monospace'}}>{dev.ip}</span>
                            <span style={{fontSize:'0.58rem',color:'#6b7a94'}}>{dev.os}</span>
                          </div>
                          <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:4}}>
                            {dev.missing.map(m=>(
                              <span key={m} style={{fontSize:'0.52rem',fontWeight:700,padding:'2px 7px',borderRadius:3,background:'#f0405e12',color:'#f0405e',border:'1px solid #f0405e20'}}>Missing: {m}</span>
                            ))}
                          </div>
                          <div style={{fontSize:'0.66rem',color:'#6b7a94'}}>{dev.reason} · Last seen {dev.lastSeen}</div>
                        </div>
                        <button style={{padding:'4px 10px',borderRadius:6,border:'1px solid #4f8fff30',background:'#4f8fff12',color:'#4f8fff',fontSize:'0.62rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',flexShrink:0}}>Deploy Agent</button>
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
                    <div className='vuln-row' onClick={()=>setSelectedVuln(selectedVuln?.id===vuln.id?null:vuln)} style={{padding:'10px 14px',background:selectedVuln?.id===vuln.id?'#0a0d18':'#09091a',border:`1px solid ${selectedVuln?.id===vuln.id?'#4f8fff30':'#141820'}`,borderRadius:10,display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:22,height:22,borderRadius:6,background:rank<3?'#f0405e18':'#141820',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.62rem',fontWeight:900,color:rank<3?'#f0405e':'#6b7a94',flexShrink:0,fontFamily:'JetBrains Mono,monospace'}}>{rank+1}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:2}}>
                          <span style={{fontSize:'0.78rem',fontWeight:700}}>{vuln.title}</span>
                          {vuln.kev && <span style={{fontSize:'0.48rem',fontWeight:800,padding:'1px 5px',borderRadius:3,background:'#f97316',color:'#fff',flexShrink:0}}>CISA KEV</span>}
                        </div>
                        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                          <SevBadge sev={vuln.severity} />
                          <span style={{fontSize:'0.6rem',color:'#4f8fff',fontFamily:'JetBrains Mono,monospace',fontWeight:700}}>CVSS {vuln.cvss}</span>
                          <span style={{fontSize:'0.6rem',color:'#3a4050',fontFamily:'JetBrains Mono,monospace'}}>{vuln.cve}</span>
                          <span style={{fontSize:'0.58rem',color:'#6b7a94'}}>{vuln.affected} device{vuln.affected!==1?'s':''} affected</span>
                          <span style={{fontSize:'0.58rem',color:'#f0a030'}}>{vuln.prevalence}% prevalence in estate</span>
                        </div>
                      </div>
                      <span style={{fontSize:'0.62rem',color:'#4f8fff',flexShrink:0}}>{selectedVuln?.id===vuln.id?'▲':'▼'}</span>
                    </div>
                    {selectedVuln?.id===vuln.id && (
                      <div style={{padding:'14px 16px',background:'#070912',border:'1px solid #4f8fff20',borderTop:'none',borderRadius:'0 0 10px 10px',marginBottom:0}}>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                          <div>
                            <div style={{fontSize:'0.7rem',color:'#8a9ab0',lineHeight:1.65,marginBottom:10}}>{vuln.description}</div>
                            <div style={{fontSize:'0.6rem',fontWeight:700,color:'#4a5568',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Affected Devices</div>
                            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                              {vuln.affectedDevices.map(d=><span key={d} style={{fontSize:'0.58rem',padding:'2px 7px',borderRadius:3,background:'#141820',color:'#6b7a94',fontFamily:'JetBrains Mono,monospace'}}>{d}</span>)}
                            </div>
                            {vuln.patch && <div style={{marginTop:8,fontSize:'0.66rem',color:'#22d49a'}}>📦 Patch available: <strong>{vuln.patch}</strong></div>}
                          </div>
                          <div>
                            <div style={{fontSize:'0.6rem',fontWeight:700,color:'#4a5568',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:5}}>Remediation Steps</div>
                            {vuln.remediation.map((r,i)=>(
                              <div key={r} style={{fontSize:'0.7rem',color:'#8a9ab0',padding:'3px 0 3px 14px',position:'relative',lineHeight:1.5}}>
                                <span style={{position:'absolute',left:0,top:9,width:5,height:5,borderRadius:'50%',background:'#22d49a',display:'block'}} />
                                {r}
                              </div>
                            ))}
                            <div style={{marginTop:12,padding:'10px',background:'#0a0d14',border:'1px solid #4f8fff18',borderRadius:8}}>
                              <div style={{fontSize:'0.6rem',fontWeight:700,color:'#4f8fff',marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
                                <span style={{width:6,height:6,borderRadius:'50%',background:'#4f8fff',display:'block'}} />AI Remediation Assistant
                              </div>
                              {vulnAiText ? (
                                <div style={{fontSize:'0.7rem',color:'#a0adc4',lineHeight:1.65}}>{vulnAiText}</div>
                              ) : (
                                <button onClick={()=>getVulnAiHelp(vuln)} disabled={vulnAiLoading} style={{padding:'6px 14px',borderRadius:6,border:'1px solid #4f8fff30',background:'#4f8fff12',color:'#4f8fff',fontSize:'0.72rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:6}}>
                                  {vulnAiLoading?<span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',border:'2px solid #4f8fff',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}} />:'✦'}
                                  {vulnAiLoading?'Generating guidance…':'Ask AI for remediation help'}
                                </button>
                              )}
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
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Threat Intelligence</h2>
                <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:'auto'}}>
                  <span style={{fontSize:'0.7rem',color:'#6b7a94'}}>Industry:</span>
                  <select value={industry} onChange={e=>{setIndustry(e.target.value);fetchIntelForIndustry(e.target.value);}} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #1e2536',background:'#0a0d14',color:'#e8ecf4',fontSize:'0.76rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
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
                {allIntel.filter(i=>i.industrySpecific).map(item=>(
                  <div key={item.id} style={{padding:'12px 14px',background:'#0a0206',border:'1px solid #f0405e18',borderRadius:10,marginBottom:6}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                          <SevBadge sev={item.severity} />
                          <span style={{fontSize:'0.78rem',fontWeight:700}}>{item.title}</span>
                        </div>
                        <div style={{fontSize:'0.74rem',color:'#8a9ab0',lineHeight:1.65,marginBottom:6}}>{item.summary}</div>
                        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                          <span style={{fontSize:'0.58rem',color:'#4f8fff'}}>{item.source}</span>
                          <span style={{fontSize:'0.58rem',color:'#3a4050'}}>{item.time}</span>
                          {item.mitre && <span style={{fontSize:'0.52rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{item.mitre}</span>}
                          {item.iocs && item.iocs.length>0 && <span style={{fontSize:'0.58rem',color:'#f0a030'}}>{item.iocs.length} IOCs available</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* General intel */}
              <div>
                <div style={{fontSize:'0.62rem',fontWeight:700,color:'#6b7a94',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>General Intelligence</div>
                {allIntel.filter(i=>!i.industrySpecific).map(item=>(
                  <div key={item.id} style={{padding:'12px 14px',background:'#09091a',border:'1px solid #141820',borderRadius:10,marginBottom:6}}>
                    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                      <SevBadge sev={item.severity} />
                      <span style={{fontSize:'0.78rem',fontWeight:700}}>{item.title}</span>
                    </div>
                    <div style={{fontSize:'0.74rem',color:'#8a9ab0',lineHeight:1.65,marginBottom:6}}>{item.summary}</div>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <span style={{fontSize:'0.58rem',color:'#4f8fff'}}>{item.source}</span>
                      <span style={{fontSize:'0.58rem',color:'#3a4050'}}>{item.time}</span>
                    </div>
                  </div>
                ))}
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
                    <div key={a.device} style={{padding:'10px 14px',background:'#09091a',border:'1px solid #8b6fff18',borderRadius:10,marginBottom:5,display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:38,height:38,borderRadius:8,background:'#8b6fff15',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:'#8b6fff'}}>{a.score}</span>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'0.76rem',fontWeight:700,marginBottom:2}}>{a.device}</div>
                        <div style={{fontSize:'0.7rem',color:'#6b7a94'}}>{a.desc}</div>
                      </div>
                      <span style={{fontSize:'0.6rem',color:'#3a4050',flexShrink:0}}>{a.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════ INCIDENTS ══════════════════════════════ */}
          {activeTab==='incidents' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Incidents</h2>
                <span style={{fontSize:'0.62rem',color:'#f0405e',background:'#f0405e12',padding:'2px 8px',borderRadius:4}}>{incidents.filter(i=>i.status==='Active').length} Active</span>
              </div>
              {incidents.map(inc=>{
                const isSel = selectedIncident?.id===inc.id;
                const statusColor = inc.status==='Active'?'#f0405e':inc.status==='Contained'?'#f0a030':'#22d49a';
                return (
                  <div key={inc.id} style={{background:'#09091a',border:`1px solid ${isSel?'#4f8fff40':'#141820'}`,borderRadius:12,overflow:'hidden'}}>
                    <div style={{padding:'12px 16px',cursor:'pointer',display:'flex',alignItems:'flex-start',gap:12}} onClick={()=>setSelectedIncident(isSel?null:inc)}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <span style={{fontSize:'0.62rem',fontWeight:800,color:'#4f8fff',fontFamily:'JetBrains Mono,monospace'}}>{inc.id}</span>
                          <span style={{fontSize:'0.52rem',fontWeight:700,padding:'2px 7px',borderRadius:3,background:`${statusColor}15`,color:statusColor,border:`1px solid ${statusColor}25`}}>{inc.status.toUpperCase()}</span>
                          <SevBadge sev={inc.severity} />
                        </div>
                        <div style={{fontSize:'0.84rem',fontWeight:700,marginBottom:4}}>{inc.title}</div>
                        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                          {inc.mitreTactics.map(t=><span key={t} style={{fontSize:'0.52rem',color:'#7c6aff',fontFamily:'JetBrains Mono,monospace'}}>{t}</span>)}
                          <span style={{fontSize:'0.58rem',color:'#3a4050'}}>{inc.alertCount} alerts · {inc.devices.length} devices</span>
                          <span style={{fontSize:'0.58rem',color:'#3a4050'}}>Updated {inc.updated.split(' ')[1]}</span>
                        </div>
                      </div>
                      <span style={{fontSize:'0.7rem',color:'#3a4050',flexShrink:0}}>{isSel?'▲':'▼'}</span>
                    </div>
                    {isSel && (
                      <div style={{borderTop:'1px solid #141820',padding:'14px 16px'}}>
                        <div style={{fontSize:'0.74rem',color:'#8a9ab0',lineHeight:1.65,padding:'10px',background:'linear-gradient(135deg,rgba(79,143,255,0.04),rgba(34,201,146,0.04))',border:'1px solid #4f8fff15',borderRadius:8,marginBottom:12}}>
                          <span style={{fontSize:'0.6rem',fontWeight:700,color:'#4f8fff',display:'block',marginBottom:4}}>AI ATTACK NARRATIVE</span>
                          {inc.aiSummary}
                        </div>
                        <div style={{fontSize:'0.62rem',fontWeight:700,color:'#4a5568',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Attack Timeline</div>
                        <div style={{display:'flex',flexDirection:'column',gap:0}}>
                          {inc.timeline.map((event,i)=>(
                            <div key={i} style={{display:'flex',gap:0,padding:'5px 0'}}>
                              <div style={{display:'flex',flexDirection:'column',alignItems:'center',minWidth:50}}>
                                <span style={{fontSize:'0.6rem',fontFamily:'JetBrains Mono,monospace',color:'#3a4050',marginBottom:3}}>{event.t}</span>
                                <div style={{width:8,height:8,borderRadius:'50%',background:event.actor==='AI'?'#4f8fff':'#22d49a',flexShrink:0}} />
                                {i<inc.timeline.length-1&&<div style={{width:1,flex:1,background:'#141820',minHeight:16,marginTop:2}} />}
                              </div>
                              <div style={{flex:1,paddingLeft:10,paddingBottom:8}}>
                                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:1}}>
                                  <span style={{fontSize:'0.52rem',fontWeight:700,padding:'1px 5px',borderRadius:3,background:event.actor==='AI'?'#4f8fff15':'#22d49a15',color:event.actor==='AI'?'#4f8fff':'#22d49a'}}>{event.actor}</span>
                                  <span style={{fontSize:'0.74rem',fontWeight:600}}>{event.action}</span>
                                </div>
                                <div style={{fontSize:'0.68rem',color:'#6b7a94'}}>{event.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{display:'flex',gap:6,marginTop:10}}>
                          {['Add Note','Escalate','Close Incident'].map(a=>(
                            <button key={a} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #1e2536',background:'transparent',color:'#8a9ab0',fontSize:'0.68rem',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>{a}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {/* ═══════════════════════════════ TOOLS ══════════════════════════════════ */}
          {activeTab==='tools' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Connected Tools</h2>
                <span style={{fontSize:'0.62rem',color:'#22d49a',background:'#22d49a12',padding:'2px 8px',borderRadius:4}}>{tools.filter(t=>t.active).length} active</span>
              </div>
              {/* Connected tools */}
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {tools.map(tool=>(
                  <div key={tool.id} style={{padding:'14px 16px',background:'#09091a',border:`1px solid ${tool.active?'#22c99220':'#f0405e18'}`,borderRadius:12,display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:10,height:10,borderRadius:'50%',background:tool.active?'#22c992':'#f0405e',boxShadow:tool.active?'0 0 8px #22c992':'none',flexShrink:0}} />
                    <div style={{flex:1}}>
                      <div style={{fontSize:'0.84rem',fontWeight:700,marginBottom:2}}>{tool.name}</div>
                      <div style={{fontSize:'0.66rem',color:'#6b7a94'}}>{tool.active?`Connected · ${tool.alertCount||0} alerts today`:'Not configured — click to set up'}</div>
                    </div>
                    {tool.active
                      ? <span style={{fontSize:'0.62rem',fontWeight:700,color:'#22d49a',padding:'3px 10px',borderRadius:5,background:'#22d49a10',border:'1px solid #22d49a20'}}>Active</span>
                      : <a href='/settings' style={{padding:'5px 14px',borderRadius:7,background:'#4f8fff',color:'#fff',fontSize:'0.72rem',fontWeight:700,textDecoration:'none'}}>Configure →</a>}
                  </div>
                ))}
              </div>
              {/* Add new tool */}
              <div style={{padding:'20px',background:'#09091a',border:'2px dashed #1e2536',borderRadius:12,textAlign:'center'}}>
                <div style={{fontSize:'1.4rem',marginBottom:8}}>🔌</div>
                <div style={{fontSize:'0.82rem',fontWeight:700,marginBottom:4}}>Add a new tool</div>
                <div style={{fontSize:'0.72rem',color:'#6b7a94',marginBottom:14}}>Connect CrowdStrike, Splunk, Sentinel, Taegis, Tenable, and 15+ more</div>
                <a href='/settings' style={{display:'inline-block',padding:'8px 24px',borderRadius:8,background:'#4f8fff',color:'#fff',fontSize:'0.8rem',fontWeight:700,textDecoration:'none'}}>+ Add Tool</a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════ MODALS ════════════════════════════════════ */}

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
                <span style={{fontSize:'0.6rem',color:'#3a4050',fontFamily:'JetBrains Mono,monospace'}}>{dev.ip}</span>
                <span style={{fontSize:'0.6rem',color:'#6b7a94'}}>{dev.os}</span>
                <span style={{fontSize:'0.58rem',color:'#3a4050',marginLeft:'auto'}}>Last seen {dev.lastSeen}</span>
              </div>
              <div style={{display:'flex',gap:5,marginBottom:4}}>
                {dev.missing.map(m=><span key={m} style={{fontSize:'0.56rem',fontWeight:700,padding:'2px 7px',borderRadius:3,background:'#f0405e12',color:'#f0405e',border:'1px solid #f0405e20'}}>Missing: {m}</span>)}
              </div>
              <div style={{fontSize:'0.68rem',color:'#6b7a94'}}>{dev.reason}</div>
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
              <div key={s.label} style={{textAlign:'center',padding:'10px',background:'#050508',borderRadius:8,border:'1px solid #141820'}}>
                <div style={{fontSize:'1.6rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.c,letterSpacing:-1}}>{s.val}</div>
                <div style={{fontSize:'0.6rem',color:'#4a5568'}}>{s.label}</div>
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
