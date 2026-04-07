'use client';
import React, { useState, useEffect } from 'react';

const LOGO_MAP = {
  crowdstrike:'crowdstrike',defender:'microsoftdefender',sentinelone:'sentinelone',carbonblack:'vmware',
  sophos:'sophos',tanium:null,intune:'microsoftintune',splunk:'splunk',sentinel:'microsoftazure',
  qradar:'ibm',elastic:'elastic',chronicle:'googlecloud',logrhythm:null,rapid7:'rapid7',exabeam:null,
  sumo_logic:'sumologic',datadog:'datadog',panther:null,darktrace:'darktrace',vectra:null,taegis:null,
  cortex:'paloaltonetworks',aws_security_hub:'amazonaws',azure_defender:'microsoftazure',
  google_workspace:'google',gcp_scc:'googlecloud',tenable:'tenable',nessus:'tenable',qualys:'qualys',
  wiz:'wiz',prisma_cloud:'prismacloud',lacework:'lacework',orca:null,aqua:'aquasecurity',snyk:'snyk',
  checkmarx:'checkmarx',github_advanced:'github',proofpoint:'proofpoint',mimecast:'mimecast',
  abnormal:null,m365_defender:'microsoft',barracuda:'barracuda',zscaler:'zscaler',fortigate:'fortinet',
  palo_ngfw:'paloaltonetworks',cisco_firepower:'cisco',checkpoint:null,okta:'okta',
  entra:'microsoftentra',duo:'cisco',jumpcloud:'jumpcloud',cyberark:'cyberark',beyondtrust:'beyondtrust',
  sailpoint:'sailpoint',active_directory:'microsoftactivedirectory',servicenow:'servicenow',
  pagerduty:'pagerduty',jira:'jira',freshservice:'freshworks',zendesk:'zendesk',connectwise:'connectwise',
  halopsa:null,autotask:null,huntress:null,xsoar:'paloaltonetworks',swimlane:null,tines:'tines',torq:null,
  virustotal:'virustotal',recorded_future:'recordedfuture',alienvault:'alienvault',threatconnect:null,
  misp:null,mandiant:'mandiant',claroty:null,nozomi:null,dragos:null,axonius:null,
  slack:'slack',teams:'microsoftteams',
};

function ToolLogo({toolId, color, abbr}) {
  const slug = LOGO_MAP[toolId];
  return (
    <span style={{width:28,height:28,borderRadius:7,flexShrink:0,position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${color}cc,${color}44)`,fontSize:'0.5rem',fontWeight:900,color:'#fff',letterSpacing:0,overflow:'hidden'}}>
      {abbr}
      {slug && (
        <img
          src={`https://cdn.simpleicons.org/${slug}/ffffff`}
          alt=""
          aria-hidden="true"
          style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',padding:'4px',background:'rgba(16,20,36,0.90)'}}
          onError={e=>{e.currentTarget.style.display='none';}}
        />
      )}
    </span>
  );
}



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
  // XDR
  cortex:[{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true},{key:'region',label:'Region',placeholder:'api-us-1'}],
  // Cloud
  aws_security_hub:[{key:'access_key_id',label:'AWS Access Key ID'},{key:'secret_access_key',label:'AWS Secret Access Key',secret:true},{key:'region',label:'AWS Region',placeholder:'eu-west-2'}],
  azure_defender:[{key:'tenant_id',label:'Tenant ID'},{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true},{key:'subscription_id',label:'Subscription ID'}],
  google_workspace:[{key:'service_account_json',label:'Service Account JSON (paste contents)',secret:true},{key:'admin_email',label:'Admin Email',placeholder:'admin@company.com'}],
  // ITSM
  servicenow:[{key:'instance',label:'Instance URL',placeholder:'https://company.service-now.com'},{key:'username',label:'Username'},{key:'password',label:'Password',secret:true}],
  pagerduty:[{key:'api_key',label:'API Key',secret:true},{key:'service_id',label:'Service ID (optional)',placeholder:'PXXXXXX'}],
  jira:[{key:'host',label:'Jira URL',placeholder:'https://company.atlassian.net'},{key:'email',label:'Email'},{key:'api_token',label:'API Token',secret:true},{key:'project_key',label:'Project Key',placeholder:'SEC'}],
  // MSP tools
  connectwise:[{key:'site',label:'Site URL',placeholder:'https://na.myconnectwise.net'},{key:'company_id',label:'Company ID'},{key:'public_key',label:'Public Key'},{key:'private_key',label:'Private Key',secret:true}],
  // SIEM additions
  chronicle:[{key:'customer_id',label:'Customer ID'},{key:'service_account_json',label:'Service Account JSON',secret:true},{key:'region',label:'Region',placeholder:'us'}],
  logrhythm:[{key:'host',label:'LogRhythm API URL',placeholder:'https://logrhythm.company.com:8501'},{key:'api_key',label:'API Key',secret:true}],
  rapid7:[{key:'host',label:'InsightIDR URL',placeholder:'https://us.api.insight.rapid7.com'},{key:'api_key',label:'API Key',secret:true}],
  exabeam:[{key:'host',label:'Exabeam URL',placeholder:'https://company.exabeam.cloud'},{key:'username',label:'Username'},{key:'password',label:'Password',secret:true}],
  // NDR addition
  vectra:[{key:'host',label:'Vectra Brain URL',placeholder:'https://brain.vectra.ai'},{key:'api_key',label:'API Token',secret:true}],
  // Identity additions
  entra:[{key:'tenant_id',label:'Tenant ID'},{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true}],
  duo:[{key:'api_hostname',label:'API Hostname',placeholder:'api-xxxxxxxx.duosecurity.com'},{key:'integration_key',label:'Integration Key'},{key:'secret_key',label:'Secret Key',secret:true}],
  jumpcloud:[{key:'api_key',label:'API Key',secret:true},{key:'org_id',label:'Organisation ID (optional)'}],
  cyberark:[{key:'host',label:'PAS URL',placeholder:'https://cyberark.company.com'},{key:'username',label:'Username'},{key:'password',label:'Password',secret:true}],
  // EDR addition
  sophos:[{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true},{key:'region',label:'API Region',placeholder:'eu-west-1'}],
  // Email addition
  abnormal:[{key:'api_key',label:'API Token',secret:true}],
  // Network/Firewall
  fortigate:[{key:'host',label:'FortiGate URL',placeholder:'https://firewall.company.com'},{key:'api_key',label:'API Token',secret:true}],
  // Threat Intel
  virustotal:[{key:'api_key',label:'API Key',secret:true}],
  recorded_future:[{key:'api_key',label:'API Key',secret:true}],
  // Asset
  axonius:[{key:'host',label:'Axonius URL',placeholder:'https://company.axonius.com'},{key:'api_key',label:'API Key'},{key:'api_secret',label:'API Secret',secret:true}],
  // SOAR
  xsoar:[{key:'host',label:'XSOAR URL',placeholder:'https://xsoar.company.com'},{key:'api_key',label:'API Key',secret:true}],
  swimlane:[{key:'host',label:'Swimlane URL',placeholder:'https://swimlane.company.com'},{key:'api_key',label:'API Key',secret:true}],
  tines:[{key:'api_key',label:'API Key',secret:true},{key:'tenant_url',label:'Tenant URL',placeholder:'https://company.tines.com'}],
  torq:[{key:'api_key',label:'API Key',secret:true},{key:'workspace_id',label:'Workspace ID'}],
  // CSPM additions
  prisma_cloud:[{key:'api_url',label:'API URL',placeholder:'https://api.prismacloud.io'},{key:'access_key',label:'Access Key ID'},{key:'secret_key',label:'Secret Key',secret:true}],
  lacework:[{key:'account',label:'Account Name',placeholder:'mycompany'},{key:'api_key',label:'API Key'},{key:'api_secret',label:'API Secret',secret:true}],
  orca:[{key:'api_token',label:'API Token',secret:true}],
  aqua:[{key:'host',label:'Aqua URL',placeholder:'https://api.aquasec.com'},{key:'api_key',label:'API Key'},{key:'api_secret',label:'API Secret',secret:true}],
  // AppSec
  snyk:[{key:'api_token',label:'API Token',secret:true},{key:'org_id',label:'Organisation ID (optional)'}],
  checkmarx:[{key:'host',label:'CxSAST URL',placeholder:'https://checkmarx.company.com'},{key:'username',label:'Username'},{key:'password',label:'Password',secret:true}],
  github_advanced:[{key:'token',label:'Personal Access Token',secret:true},{key:'org',label:'GitHub Organisation',placeholder:'myorg'}],
  // MSP additions
  halopsa:[{key:'host',label:'HaloPSA URL',placeholder:'https://company.halopsa.com'},{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true}],
  autotask:[{key:'username',label:'API Username'},{key:'secret',label:'API Secret',secret:true},{key:'integration_code',label:'Integration Code'}],
  huntress:[{key:'api_key',label:'API Key'},{key:'api_secret',label:'API Secret',secret:true}],
  // Identity additions
  beyondtrust:[{key:'host',label:'BeyondTrust URL',placeholder:'https://bt.company.com'},{key:'api_key',label:'API Key',secret:true}],
  sailpoint:[{key:'org',label:'Organisation ID'},{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true}],
  active_directory:[{key:'host',label:'AD Server',placeholder:'ldaps://dc.company.com:636'},{key:'username',label:'Bind Username'},{key:'password',label:'Bind Password',secret:true},{key:'base_dn',label:'Base DN',placeholder:'DC=company,DC=com'}],
  // Network/Firewall additions
  palo_ngfw:[{key:'host',label:'Panorama URL',placeholder:'https://panorama.company.com'},{key:'api_key',label:'API Key',secret:true}],
  cisco_firepower:[{key:'host',label:'FMC URL',placeholder:'https://fmc.company.com'},{key:'username',label:'Username'},{key:'password',label:'Password',secret:true}],
  checkpoint:[{key:'host',label:'SmartConsole URL',placeholder:'https://checkpoint.company.com'},{key:'api_key',label:'API Key',secret:true}],
  // ThreatIntel additions
  alienvault:[{key:'api_key',label:'API Key',secret:true}],
  threatconnect:[{key:'base_url',label:'Base URL',placeholder:'https://app.threatconnect.com'},{key:'access_id',label:'Access ID'},{key:'secret_key',label:'Secret Key',secret:true}],
  misp:[{key:'host',label:'MISP URL',placeholder:'https://misp.company.com'},{key:'api_key',label:'Auth Key',secret:true}],
  mandiant:[{key:'api_key',label:'API Key'},{key:'api_secret',label:'API Secret',secret:true}],
  // Endpoint management
  tanium:[{key:'host',label:'Tanium Console URL',placeholder:'https://tanium.company.com'},{key:'api_token',label:'API Token',secret:true}],
  intune:[{key:'tenant_id',label:'Tenant ID'},{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true}],
  // OT/ICS
  claroty:[{key:'host',label:'CTD URL',placeholder:'https://ctd.company.com'},{key:'username',label:'Username'},{key:'password',label:'Password',secret:true}],
  nozomi:[{key:'host',label:'Vantage URL',placeholder:'https://nozomi.company.com'},{key:'api_key',label:'API Key',secret:true}],
  dragos:[{key:'host',label:'Platform URL',placeholder:'https://platform.dragos.com'},{key:'api_key',label:'API Token'},{key:'api_secret',label:'API Secret',secret:true}],
  // Cloud additions
  gcp_scc:[{key:'project_id',label:'GCP Project ID'},{key:'service_account_json',label:'Service Account JSON',secret:true}],
  // SIEM additions
  sumo_logic:[{key:'access_id',label:'Access ID'},{key:'access_key',label:'Access Key',secret:true},{key:'endpoint',label:'API Endpoint',placeholder:'https://api.sumologic.com'}],
  datadog:[{key:'api_key',label:'API Key',secret:true},{key:'app_key',label:'Application Key',secret:true},{key:'site',label:'Site',placeholder:'datadoghq.eu'}],
  panther:[{key:'api_token',label:'API Token',secret:true},{key:'api_host',label:'API Host',placeholder:'https://api.company.runpanther.net'}],
  // Comms / Ticketing
  slack:[{key:'webhook_url',label:'Webhook URL',placeholder:'https://hooks.slack.com/services/...',secret:true},{key:'channel',label:'Default Channel',placeholder:'#security-alerts'}],
  teams:[{key:'webhook_url',label:'Webhook URL',placeholder:'https://company.webhook.office.com/...',secret:true}],
  freshservice:[{key:'domain',label:'Domain',placeholder:'company.freshservice.com'},{key:'api_key',label:'API Key',secret:true}],
  zendesk:[{key:'subdomain',label:'Subdomain',placeholder:'company'},{key:'email',label:'Email'},{key:'api_token',label:'API Token',secret:true}],
  m365_defender:[{key:'tenant_id',label:'Tenant ID'},{key:'client_id',label:'Client ID'},{key:'client_secret',label:'Client Secret',secret:true}],
  barracuda:[{key:'api_token',label:'API Token',secret:true},{key:'region',label:'Region',placeholder:'us-west-2'}],
};

const CATEGORIES = ['All','EDR','SIEM','NDR','XDR','SOAR','Cloud','Vuln','CSPM','AppSec','Email','Network','Identity','ITSM','ThreatIntel','MSP','Firewall','Asset','OT/ICS','Comms'];
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
  // XDR additions
  {id:'cortex',name:'Palo Alto Cortex XDR',category:'XDR',desc:'Unified endpoint, cloud & network detection'},
  // Cloud / CSPM
  {id:'aws_security_hub',name:'AWS Security Hub',category:'Cloud',desc:'Aggregates GuardDuty, Inspector & partner findings'},
  {id:'azure_defender',name:'Microsoft Defender for Cloud',category:'Cloud',desc:'Azure workload protection — VMs, containers, SQL'},
  {id:'google_workspace',name:'Google Workspace',category:'Cloud',desc:'Admin audit logs, Drive, Gmail security events'},
  // ITSM
  {id:'servicenow',name:'ServiceNow',category:'ITSM',desc:'Enterprise ITSM — auto-create & sync incidents'},
  {id:'pagerduty',name:'PagerDuty',category:'ITSM',desc:'On-call escalation for confirmed critical incidents'},
  {id:'jira',name:'Jira Service Management',category:'ITSM',desc:'Mid-market incident tickets — Atlassian'},
  // MSP
  {id:'connectwise',name:'ConnectWise PSA',category:'MSP',desc:'MSP PSA — auto-create billable tickets from incidents'},
  // SIEM additions
  {id:'chronicle',name:'Google Chronicle / SecOps',category:'SIEM',desc:'Google cloud-native SIEM with 300+ native connectors'},
  {id:'logrhythm',name:'LogRhythm NextGen SIEM',category:'SIEM',desc:'Common in regulated industries — NHS, finance, gov'},
  {id:'rapid7',name:'Rapid7 InsightIDR',category:'SIEM',desc:'SIEM + SOAR for mid-market & hybrid environments'},
  {id:'exabeam',name:'Exabeam',category:'SIEM',desc:'UEBA-heavy SIEM popular in financial services'},
  // NDR addition
  {id:'vectra',name:'Vectra AI',category:'NDR',desc:'Network detection — lateral movement & cloud threats'},
  // Identity additions
  {id:'entra',name:'Microsoft Entra ID',category:'Identity',desc:'Azure AD — sign-in logs, conditional access, PIM alerts'},
  {id:'duo',name:'Cisco Duo',category:'Identity',desc:'MFA platform dominant in education & healthcare'},
  {id:'jumpcloud',name:'JumpCloud',category:'Identity',desc:'Cloud directory & MDM — popular with UK MSPs'},
  {id:'cyberark',name:'CyberArk PAM',category:'Identity',desc:'Privileged access management — session & credential logs'},
  // EDR addition
  {id:'sophos',name:'Sophos Intercept X',category:'EDR',desc:'Dominant EDR in UK SMB & MSP-managed estates'},
  // Email addition
  {id:'abnormal',name:'Abnormal Security',category:'Email',desc:'AI-native email security — Proofpoint/Mimecast alternative'},
  // Firewall
  {id:'fortigate',name:'Fortinet FortiGate',category:'Firewall',desc:'NGFW — firewall deny logs, threat events'},
  // Threat Intel
  {id:'virustotal',name:'VirusTotal',category:'ThreatIntel',desc:'IP, hash & domain enrichment — embedded in AI triage'},
  {id:'recorded_future',name:'Recorded Future',category:'ThreatIntel',desc:'Commercial threat intelligence feed & IOC enrichment'},
  // Asset
  {id:'axonius',name:'Axonius',category:'Asset',desc:'Asset intelligence — aggregates devices from all tools'},
  // SOAR
  {id:'xsoar',name:'Palo Alto Cortex XSOAR',category:'SOAR',desc:'Security orchestration, automation & response'},
  {id:'swimlane',name:'Swimlane',category:'SOAR',desc:'Low-code security automation platform'},
  {id:'tines',name:'Tines',category:'SOAR',desc:'No-code security workflow automation'},
  {id:'torq',name:'Torq',category:'SOAR',desc:'Hyperautomation — AI-native SOAR platform'},
  // CSPM additions
  {id:'prisma_cloud',name:'Palo Alto Prisma Cloud',category:'CSPM',desc:'Cloud-native security platform — CSPM + CWPP'},
  {id:'lacework',name:'Lacework',category:'CSPM',desc:'Cloud security & compliance — anomaly detection'},
  {id:'orca',name:'Orca Security',category:'CSPM',desc:'Agentless cloud security platform'},
  {id:'aqua',name:'Aqua Security',category:'CSPM',desc:'Container & cloud-native security'},
  // AppSec
  {id:'snyk',name:'Snyk',category:'AppSec',desc:'Developer-first security — OSS, containers, IaC'},
  {id:'checkmarx',name:'Checkmarx',category:'AppSec',desc:'SAST/SCA for enterprise application security'},
  {id:'github_advanced',name:'GitHub Advanced Security',category:'AppSec',desc:'Code scanning, secret detection, dependency review'},
  // MSP
  {id:'halopsa',name:'Halo PSA',category:'MSP',desc:'MSP PSA platform — popular in UK/EU market'},
  {id:'autotask',name:'Autotask (Datto)',category:'MSP',desc:'PSA for MSPs — Datto platform'},
  {id:'huntress',name:'Huntress MDR',category:'MSP',desc:'Managed detection & response for MSPs'},
  // Identity
  {id:'beyondtrust',name:'BeyondTrust PAM',category:'Identity',desc:'Privileged access management — session vault'},
  {id:'sailpoint',name:'SailPoint IGA',category:'Identity',desc:'Identity governance & administration'},
  {id:'active_directory',name:'Active Directory',category:'Identity',desc:'On-premise AD — LDAP event ingestion'},
  // Firewall
  {id:'palo_ngfw',name:'Palo Alto NGFW',category:'Firewall',desc:'Next-gen firewall logs via Panorama'},
  {id:'cisco_firepower',name:'Cisco Firepower',category:'Firewall',desc:'FTD/FMC firewall events & intrusion alerts'},
  {id:'checkpoint',name:'Check Point',category:'Firewall',desc:'SmartConsole threat prevention logs'},
  // ThreatIntel
  {id:'alienvault',name:'AlienVault OTX',category:'ThreatIntel',desc:'Open threat exchange — free community IOC feeds'},
  {id:'threatconnect',name:'ThreatConnect',category:'ThreatIntel',desc:'TIP — aggregate & operationalise threat intel'},
  {id:'misp',name:'MISP',category:'ThreatIntel',desc:'Open-source threat sharing platform'},
  {id:'mandiant',name:'Mandiant Threat Intel',category:'ThreatIntel',desc:'Premium threat intelligence — Google Cloud'},
  // Endpoint
  {id:'tanium',name:'Tanium',category:'EDR',desc:'Real-time endpoint management & detection'},
  {id:'intune',name:'Microsoft Intune',category:'EDR',desc:'MDM/MAM — device compliance & inventory'},
  // OT/ICS
  {id:'claroty',name:'Claroty',category:'OT/ICS',desc:'OT/ICS security — industrial network visibility'},
  {id:'nozomi',name:'Nozomi Networks',category:'OT/ICS',desc:'OT & IoT security monitoring'},
  {id:'dragos',name:'Dragos',category:'OT/ICS',desc:'ICS/OT threat detection & response'},
  // Cloud
  {id:'gcp_scc',name:'GCP Security Command Center',category:'Cloud',desc:'Google Cloud native security findings'},
  // SIEM
  {id:'sumo_logic',name:'Sumo Logic',category:'SIEM',desc:'Cloud-native log analytics & SIEM'},
  {id:'datadog',name:'Datadog Security',category:'SIEM',desc:'Cloud monitoring + SIEM + CSPM'},
  {id:'panther',name:'Panther',category:'SIEM',desc:'Detection-as-code cloud SIEM'},
  // Email
  {id:'m365_defender',name:'Microsoft 365 Defender',category:'Email',desc:'M365 suite — email, identity, endpoint, cloud apps'},
  {id:'barracuda',name:'Barracuda Email Security',category:'Email',desc:'Email security with managed XDR option'},
  // Comms/Ticketing
  {id:'slack',name:'Slack',category:'Comms',desc:'Alert notifications to Slack channels'},
  {id:'teams',name:'Microsoft Teams',category:'Comms',desc:'Incident notifications to Teams channels'},
  {id:'freshservice',name:'Freshservice',category:'ITSM',desc:'IT service management — Freshworks'},
  {id:'zendesk',name:'Zendesk',category:'ITSM',desc:'Support ticketing — create tickets from incidents'},
];
// Which dashboard sections each tool feeds
const TOOL_FEEDS = {
  crowdstrike:  ['Alerts','Coverage'],
  defender:     ['Alerts','Coverage'],
  sentinelone:  ['Alerts','Coverage'],
  'carbon-black': ['Alerts','Coverage'],
  darktrace:    ['Alerts','Coverage'],
  taegis:       ['Alerts','Coverage'],
  splunk:       ['Alerts'],
  sentinel:     ['Alerts'],
  qradar:       ['Alerts'],
  elastic:      ['Alerts'],
  tenable:      ['Vulns','Coverage'],
  nessus:       ['Vulns','Coverage'],
  qualys:       ['Vulns'],
  wiz:          ['Vulns'],
  okta:         ['Alerts'],
  proofpoint:   ['Alerts'],
  zscaler:      ['Alerts'],
  threatfox:    ['Intel'],
  // New tools
  cortex:           ['Alerts','Coverage'],
  aws_security_hub: ['Alerts','Vulns'],
  azure_defender:   ['Alerts','Vulns'],
  google_workspace: ['Alerts'],
  servicenow:       ['Incidents'],
  pagerduty:        ['Incidents'],
  jira:             ['Incidents'],
  connectwise:      ['Incidents'],
  chronicle:        ['Alerts'],
  logrhythm:        ['Alerts'],
  rapid7:           ['Alerts','Vulns'],
  exabeam:          ['Alerts'],
  vectra:           ['Alerts','Coverage'],
  entra:            ['Alerts'],
  duo:              ['Alerts'],
  jumpcloud:        ['Alerts','Coverage'],
  cyberark:         ['Alerts'],
  sophos:           ['Alerts','Coverage'],
  abnormal:         ['Alerts'],
  fortigate:        ['Alerts'],
  virustotal:       ['Intel'],
  recorded_future:  ['Intel'],
  axonius:          ['Coverage'],
  // SOAR
  xsoar:            ['Incidents'],
  swimlane:         ['Incidents'],
  tines:            ['Incidents'],
  torq:             ['Incidents'],
  // CSPM
  prisma_cloud:     ['Vulns','Alerts'],
  lacework:         ['Alerts','Vulns'],
  orca:             ['Vulns'],
  aqua:             ['Vulns'],
  // AppSec
  snyk:             ['Vulns'],
  checkmarx:        ['Vulns'],
  github_advanced:  ['Vulns'],
  // MSP
  halopsa:          ['Incidents'],
  autotask:         ['Incidents'],
  huntress:         ['Alerts','Coverage'],
  // Identity
  beyondtrust:      ['Alerts'],
  sailpoint:        ['Alerts'],
  active_directory: ['Alerts'],
  // Firewall
  palo_ngfw:        ['Alerts'],
  cisco_firepower:  ['Alerts'],
  checkpoint:       ['Alerts'],
  // ThreatIntel
  alienvault:       ['Intel'],
  threatconnect:    ['Intel'],
  misp:             ['Intel'],
  mandiant:         ['Intel'],
  // Endpoint
  tanium:           ['Alerts','Coverage'],
  intune:           ['Coverage'],
  // OT/ICS
  claroty:          ['Alerts','Coverage'],
  nozomi:           ['Alerts'],
  dragos:           ['Alerts'],
  // Cloud
  gcp_scc:          ['Alerts','Vulns'],
  // SIEM
  sumo_logic:       ['Alerts'],
  datadog:          ['Alerts'],
  panther:          ['Alerts'],
  // Email
  m365_defender:    ['Alerts'],
  barracuda:        ['Alerts'],
  // Comms
  slack:            ['Incidents'],
  teams:            ['Incidents'],
  freshservice:     ['Incidents'],
  zendesk:          ['Incidents'],
};

export default function ToolsTab({ connected, setConnected, toolSyncResults, doSync, syncingTool, demoMode, syncLog, userTier, isAdmin }) {
  const connectedCount = Object.keys(connected || {}).filter(k => connected[k]).length;
  const isCommunity = !isAdmin && userTier === 'community';
  const atToolLimit = isCommunity && connectedCount >= 2;
  const [filter, setFilter] = useState('All');
  const [modal, setModal] = useState(null);
  const [formVals, setFormVals] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
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

  const [toolSearch, setToolSearch] = React.useState('');
  const filtered = ALL_TOOLS.filter(t => {
    const matchCat = filter==='All' || t.category===filter;
    const matchSearch = !toolSearch || t.name.toLowerCase().includes(toolSearch.toLowerCase()) || t.category.toLowerCase().includes(toolSearch.toLowerCase());
    return matchCat && matchSearch;
  });

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
    if (!modal || Object.keys(formVals).length === 0) return;
    const newCreds = {...formVals};
    setConnected(prev=>({...prev,[modal.id]:newCreds}));
    // Persist to Redis
    fetch('/api/integrations/credentials', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({toolId:modal.id, credentials:newCreds})}).catch(()=>{});
    setModal(null);
    setSaveSuccess(true);
    setTimeout(()=>setSaveSuccess(false), 2500);
  }

  function handleDisconnect(id) {
    setConnected(prev=>{ const n={...prev}; delete n[id]; return n; });
    // Remove from Redis
    fetch('/api/integrations/credentials', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({toolId:id, credentials:null})}).catch(()=>{});
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* Header row */}
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <h2 style={{fontSize:'0.88rem',fontWeight:700}}>Integrations</h2>
        <span style={{fontSize:'0.62rem',color:'#22d49a',background:'#22d49a12',padding:'2px 8px',borderRadius:4}}>{Object.keys(connected).length} connected</span>
        {isCommunity && <span style={{fontSize:'0.62rem',color:'#f0a030',background:'#f0a03012',padding:'2px 8px',borderRadius:4,border:'1px solid #f0a03025'}}>{connectedCount}/2 tools — <a href='/pricing' style={{color:'#f0a030',textDecoration:'underline'}}>upgrade for unlimited</a></span>}
        <div style={{display:'flex',gap:6,marginLeft:'auto',flexWrap:'wrap',alignItems:'center'}}>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:'0.7rem',color:'var(--wt-muted)',pointerEvents:'none'}}>🔍</span>
            <input type='text' placeholder='Search tools...' value={toolSearch} onChange={e=>setToolSearch(e.target.value)}
              style={{padding:'4px 8px 4px 26px',background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:7,color:'var(--wt-text)',fontSize:'0.7rem',fontFamily:'Inter,sans-serif',outline:'none',width:150}}
            />
          </div>
          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setFilter(c)} style={{padding:'3px 10px',borderRadius:5,border:`1px solid ${filter===c?'#4f8fff40':'var(--wt-border2)'}`,background:filter===c?'#4f8fff18':'transparent',color:filter===c?'#4f8fff':'#6b7a94',fontSize:'0.62rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>{c}</button>
          ))}
        </div>
      </div>

      {/* Anthropic API Key */}
      <div style={{padding:'16px',background:'linear-gradient(135deg,rgba(79,143,255,0.13),rgba(139,111,255,0.13))',border:'1px solid #4f8fff25',borderRadius:12}}>
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

      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        {(()=>{
          const groupOrder = ['EDR','SIEM','XDR','NDR','Vuln','CSPM','Identity','Email','Network'];
          const groups = groupOrder.map(cat=>({cat,tools:filtered.filter(t=>t.category===cat)})).filter(g=>g.tools.length>0);
          const uncategorised = filtered.filter(t=>!groupOrder.includes(t.category));
          if(uncategorised.length) groups.push({cat:'Other',tools:uncategorised});
          return groups.map(({cat,tools})=>(
            <div key={cat}>
              <div style={{fontSize:'0.58rem',fontWeight:800,color:'var(--wt-dim)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:6,paddingLeft:2,display:'flex',alignItems:'center',gap:6}}>
                <span style={{width:14,height:1,background:'var(--wt-border)',display:'block'}} />
                {cat}
                <span style={{width:'100%',height:1,background:'var(--wt-border)',display:'block'}} />
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:5}}>
                {tools.map(tool=>{
                  const isOn = !!connected[tool.id];
                  const syncResult = toolSyncResults?.[tool.id];
                  const hasError = syncResult?.error;
                  const isRetrying = syncingTool === tool.id;
                  const syncDot = !isOn ? null : hasError ? '#f0405e' : syncResult ? '#22d49a' : '#f0a030';
                  const syncLabel = !isOn ? null : hasError ? 'Error' : syncResult ? 'OK' : demoMode ? 'Demo' : 'Pending sync';
                  return (
            <div key={tool.id} style={{padding:'12px 16px',background:'var(--wt-card)',border:`1px solid ${hasError&&isOn?'#f0405e25':isOn?'#22c99218':'var(--wt-border)'}`,borderRadius:10}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:9,height:9,borderRadius:'50%',background:isOn?'#22c992':'#252e42',boxShadow:isOn?'0 0 7px #22c992':'none',flexShrink:0}} />
                <ToolLogo toolId={tool.id} color={'#4f8fff'} abbr={tool.id.slice(0,2).toUpperCase()} />
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:1}}>
                    <span style={{fontSize:'0.82rem',fontWeight:700}}>{tool.name}</span>
                    <span style={{fontSize:'0.5rem',fontWeight:700,padding:'1px 6px',borderRadius:3,background:'#4f8fff12',color:'#4f8fff',border:'1px solid #4f8fff18'}}>{tool.category}</span>
                    {(TOOL_FEEDS[tool.id]||[]).map(feed=>(
                      <span key={feed} style={{fontSize:'0.48rem',fontWeight:700,padding:'1px 5px',borderRadius:3,background:feed==='Alerts'?'#f0405e12':feed==='Vulns'?'#8b6fff12':feed==='Coverage'?'#22d49a12':'#f0a03012',color:feed==='Alerts'?'#f0405e':feed==='Vulns'?'#8b6fff':feed==='Coverage'?'#22d49a':'#f0a030',border:`1px solid ${feed==='Alerts'?'#f0405e':feed==='Vulns'?'#8b6fff':feed==='Coverage'?'#22d49a':'#f0a030'}20`}}>{feed}</span>
                    ))}
                    {syncDot && <span style={{display:'inline-flex',alignItems:'center',gap:4,marginLeft:4}}>
                      <span style={{width:5,height:5,borderRadius:'50%',background:syncDot,boxShadow:`0 0 5px ${syncDot}`,display:'block'}} />
                      <span style={{fontSize:'0.56rem',fontWeight:700,color:syncDot}}>{syncLabel}</span>
                    </span>}
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
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,flexShrink:0}}>
                  {isOn
                    ? <button onClick={()=>{if(window.confirm('Disconnect '+tool.name+'?')) handleDisconnect(tool.id);}} style={{padding:'5px 14px',borderRadius:7,border:'1px solid #f0405e30',background:'#f0405e10',color:'#f0405e',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:5}}>🗑 Disconnect</button>
                    : atToolLimit
                      ? <a href='/pricing' style={{padding:'5px 14px',borderRadius:7,border:'1px solid #f0a03030',background:'#f0a03010',color:'#f0a030',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',textDecoration:'none'}}>🔒 Upgrade</a>
                      : <button onClick={()=>openModal(tool)} style={{padding:'5px 14px',borderRadius:7,border:'1px solid #4f8fff40',background:'#4f8fff12',color:'#4f8fff',fontSize:'0.68rem',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>+ Connect</button>}
                  {isOn && !demoMode && doSync && (
                    <button onClick={()=>doSync([tool.id])} disabled={isRetrying} style={{padding:'3px 10px',borderRadius:5,border:'1px solid #4f8fff28',background:'#4f8fff0a',color:isRetrying?'var(--wt-dim)':'#4f8fff',fontSize:'0.6rem',fontWeight:700,cursor:isRetrying?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',gap:4}}>
                      {isRetrying ? <span style={{display:'inline-flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:'50%',border:'1.5px solid #4f8fff',borderTopColor:'transparent',display:'block',animation:'spin 0.8s linear infinite'}} />Syncing…</span> : '⟳ Sync'}
                    </button>
                  )}
                </div>
              </div>
              {/* Per-tool sync status row */}
              {isOn && syncResult && (
                <div style={{marginTop:8,padding:'6px 10px',background:'var(--wt-card2)',borderRadius:7,border:`1px solid ${hasError?'#f0405e18':'var(--wt-border)'}`,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  {hasError ? (
                    <>
                      <span style={{fontSize:'0.62rem',color:'#f0405e',fontWeight:700}}>✗ Sync error</span>
                      <span style={{fontSize:'0.62rem',color:'#f0405e',fontFamily:'JetBrains Mono,monospace',flex:1,wordBreak:'break-all'}}>{syncResult.error}</span>
                    </>
                  ) : (
                    <>
                      <span style={{fontSize:'0.62rem',color:'#22d49a',fontWeight:700}}>✓ Last sync</span>
                      <span style={{fontSize:'0.62rem',color:'var(--wt-muted)',fontFamily:'JetBrains Mono,monospace'}}>{syncResult.syncedAt ? new Date(syncResult.syncedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '—'}</span>
                      <span style={{fontSize:'0.62rem',color:'var(--wt-muted)'}}>·</span>
                      <span style={{fontSize:'0.62rem',color:'var(--wt-secondary)',fontWeight:600}}>{syncResult.count ?? 0} records</span>
                      {syncResult.count === 0 && (
                        <span style={{fontSize:'0.6rem',color:'#f0a030',background:'#f0a03010',padding:'1px 7px',borderRadius:4,border:'1px solid #f0a03028'}}>⚠ No data returned — check credentials & permissions</span>
                      )}
                    </>
                  )}
                </div>
              )}
              {/* Connected but no sync result yet — show nudge */}
              {isOn && !syncResult && !demoMode && (
                <div style={{marginTop:6,fontSize:'0.6rem',color:'var(--wt-dim)',paddingLeft:21}}>Waiting for first sync… click ⟳ Sync to check now.</div>
              )}
            </div>
          );
                })}
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Sync Log — full width at bottom */}
      <div style={{background:'rgba(6,11,16,0.85)',border:'1px solid rgba(0,180,240,0.13)',borderRadius:10,overflow:'hidden'}}>
        <div style={{padding:'8px 14px',borderBottom:'1px solid rgba(0,180,240,0.10)',display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:'0.62rem',fontWeight:700,color:'#4f8fff'}}>📋 Sync Log</span>
          <span style={{fontSize:'0.56rem',color:'var(--wt-dim)',marginLeft:4}}>{syncLog&&syncLog.length>0?`${syncLog.length} events`:'live output'}</span>
          {syncLog&&syncLog.length>0 && (
            <span style={{fontSize:'0.56rem',color:syncLog[syncLog.length-1]?.error?'#f0405e':'#22d49a',marginLeft:'auto'}}>
              Last: {new Date(syncLog[syncLog.length-1]?.ts||Date.now()).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
            </span>
          )}
          {(!syncLog||syncLog.length===0)&&<span style={{fontSize:'0.56rem',color:'#f0a030',marginLeft:'auto'}}>No syncs yet — connect a tool and click Sync</span>}
        </div>
        <div style={{maxHeight:220,overflowY:'auto',fontFamily:'JetBrains Mono,monospace',fontSize:'0.6rem'}} ref={el=>{if(el)el.scrollTop=el.scrollHeight}}>
          {/* Summary row */}
          {syncLog&&syncLog.length>0 && (()=>{
            const ok=syncLog.filter(e=>!e.error);
            const err=syncLog.filter(e=>e.error);
            const total=ok.reduce((a,e)=>a+(e.count||0),0);
            const avgMs=ok.length?Math.round(ok.reduce((a,e)=>a+(e.durationMs||0),0)/ok.length):0;
            return (
              <div style={{padding:'6px 14px',borderBottom:'1px solid rgba(0,180,240,0.10)',display:'flex',gap:12,background:'rgba(7,13,21,0.8)'}}>
                <span style={{color:'#22d49a'}}>{ok.length} OK</span>
                {err.length>0&&<span style={{color:'#f0405e'}}>{err.length} errors</span>}
                <span style={{color:'#4f8fff'}}>{total.toLocaleString()} records</span>
                {avgMs>0&&<span style={{color:'#6b7a94'}}>{avgMs}ms avg</span>}
              </div>
            );
          })()}
          {syncLog&&syncLog.length>0 ? syncLog.slice().reverse().map((entry,i)=>{
            const toolColor = entry.toolId==='tenable'?'#00b3e3':entry.toolId==='crowdstrike'?'#f0405e':entry.toolId==='sentinel'?'#4f8fff':entry.toolId==='splunk'?'#65a637':entry.toolId==='defender'?'#00a4ef':entry.toolId==='sentinelone'?'#8c2be2':'#7c6aff';
            return (
              <div key={i} style={{display:'grid',gridTemplateColumns:'58px 110px 1fr 55px',alignItems:'center',gap:6,padding:'4px 14px',borderBottom:'1px solid rgba(0,180,240,0.06)',background:entry.error?'#f0405e06':i===0?'#0a1525':'transparent'}}>
                <span style={{color:'#3a4a5e',fontSize:'0.54rem'}}>{new Date(entry.ts).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>
                <span style={{color:toolColor,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{entry.toolId}</span>
                {entry.error
                  ? <span style={{color:'#f0405e',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>✗ {entry.error.slice(0,60)}</span>
                  : <span style={{color:entry.count>0?'#22d49a':'#f0a030',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {entry.count>0
                        ? `✓ ${entry.count} ${entry.dataType||'records'}`
                        : '⚠ 0 records — check credentials'}
                    </span>
                }
                <span style={{color:entry.durationMs&&entry.durationMs>5000?'#f0a030':'#4a5568',textAlign:'right',fontSize:'0.54rem'}}>{entry.durationMs?`${entry.durationMs}ms`:''}</span>
              </div>
            );
          }) : (
            <div style={{padding:'16px 14px',color:'#2a3448',fontSize:'0.6rem',textAlign:'center'}}>waiting for sync...</div>
          )}
        </div>
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setModal(null)}>
          <div style={{background:'var(--wt-card2)',border:'1px solid var(--wt-border2)',borderRadius:16,maxWidth:480,width:'100%',padding:24,maxHeight:'85vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:'0.92rem',fontWeight:800,marginBottom:4}}>Connect {modal.name}</div>
            <div style={{fontSize:'0.66rem',color:'#22d49a',background:'#22d49a08',border:'1px solid #22d49a20',borderRadius:6,padding:'6px 10px',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
              <span>🔒</span> Credentials encrypted at rest with AES-256-GCM — never returned to browser after saving.
            </div>
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
              <button onClick={handleSave} disabled={Object.keys(formVals).length===0} style={{flex:1,padding:'9px 0',borderRadius:8,border:'none',background:Object.keys(formVals).length>0?'#4f8fff':'var(--wt-border2)',color:Object.keys(formVals).length>0?'#fff':'#3a4050',fontSize:'0.78rem',fontWeight:700,cursor:Object.keys(formVals).length>0?'pointer':'not-allowed',fontFamily:'Inter,sans-serif'}}>
                {saveSuccess ? '✓ Saved' : 'Save & Connect'}
              </button>
              <button onClick={()=>setModal(null)} style={{padding:'9px 16px',borderRadius:8,border:'1px solid var(--wt-border2)',background:'transparent',color:'var(--wt-muted)',fontSize:'0.78rem',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}