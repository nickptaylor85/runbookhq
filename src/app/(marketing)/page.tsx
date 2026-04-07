'use client';
import React from 'react';
import { useState, useEffect, useRef } from 'react';

const ALERTS = [
  { sev:'crit', title:'LSASS credential dump — DC01', verdict:'TP', conf:98, action:'Isolated host, opened INC-0847', time:'09:14' },
  { sev:'high', title:'C2 beacon → 185.220.101.42', verdict:'TP', conf:94, action:'Blocked IP, notified SOC', time:'09:16' },
  { sev:'med', title:'Scheduled task persistence — SRV-APP02', verdict:'SUS', conf:67, action:'Flagged for analyst review', time:'09:22' },
  { sev:'low', title:'Windows Update triggered PowerShell', verdict:'FP', conf:99, action:'Auto-closed, suppressed', time:'09:31' },
];

// Simple Icons CDN: https://cdn.simpleicons.org/{slug}/ffffff
const LOGO_MAP: Record<string,string|null> = {
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

// Inline SVG tool icons — no external dependency, always renders
const TOOLS = [
  { name:'CrowdStrike',        color:'#f0405e', abbr:'CS', id:'crowdstrike' },
  { name:'Defender',           color:'#00a4ef', abbr:'DF', id:'defender' },
  { name:'Taegis XDR',        color:'#e8172c', abbr:'TX', id:'taegis' },
  { name:'Tenable',            color:'#00b3e3', abbr:'TN', id:'tenable' },
  { name:'SentinelOne',        color:'#8c2be2', abbr:'S1', id:'sentinelone' },
  { name:'Splunk',             color:'#65a637', abbr:'SP', id:'splunk' },
  { name:'Sentinel',           color:'#0078d4', abbr:'MS', id:'sentinel' },
  { name:'Darktrace',          color:'#6b4fbd', abbr:'DT', id:'darktrace' },
  { name:'Zscaler',            color:'#00aae7', abbr:'ZS', id:'zscaler' },
  { name:'Elastic',            color:'#00bfb3', abbr:'EL', id:'elastic' },
  { name:'QRadar',             color:'#006699', abbr:'QR', id:'qradar' },
  { name:'Okta',               color:'#007dc1', abbr:'OK', id:'okta' },
  { name:'Proofpoint',         color:'#007dba', abbr:'PP', id:'proofpoint' },
  { name:'Nessus',             color:'#00b3e3', abbr:'NS', id:'nessus' },
  { name:'Wiz',                color:'#10b981', abbr:'WZ', id:'wiz' },
  { name:'Palo Alto Cortex',   color:'#fa582d', abbr:'PA', id:'cortex' },
  { name:'AWS Security Hub',   color:'#ff9900', abbr:'AW', id:'aws_security_hub' },
  { name:'Defender for Cloud', color:'#0078d4', abbr:'DC', id:'azure_defender' },
  { name:'ServiceNow',         color:'#62d84e', abbr:'SN', id:'servicenow' },
  { name:'PagerDuty',          color:'#06ac38', abbr:'PD', id:'pagerduty' },
  { name:'Jira',               color:'#0052cc', abbr:'JR', id:'jira' },
  { name:'Chronicle',          color:'#4285f4', abbr:'GC', id:'chronicle' },
  { name:'LogRhythm',          color:'#e31837', abbr:'LR', id:'logrhythm' },
  { name:'Rapid7',             color:'#e53935', abbr:'R7', id:'rapid7' },
  { name:'Exabeam',            color:'#1565c0', abbr:'EX', id:'exabeam' },
  { name:'Vectra AI',          color:'#3f51b5', abbr:'VA', id:'vectra' },
  { name:'Entra ID',           color:'#0078d4', abbr:'EN', id:'entra' },
  { name:'Cisco Duo',          color:'#6dc037', abbr:'DU', id:'duo' },
  { name:'JumpCloud',          color:'#0066ff', abbr:'JC', id:'jumpcloud' },
  { name:'CyberArk',           color:'#e31837', abbr:'CA', id:'cyberark' },
  { name:'Sophos',             color:'#005cb9', abbr:'SX', id:'sophos' },
  { name:'Abnormal',           color:'#1976d2', abbr:'AB', id:'abnormal' },
  { name:'FortiGate',          color:'#da291c', abbr:'FG', id:'fortigate' },
  { name:'VirusTotal',         color:'#3949ab', abbr:'VT', id:'virustotal' },
  { name:'Recorded Future',    color:'#e53935', abbr:'RF', id:'recorded_future' },
  { name:'Axonius',            color:'#4caf50', abbr:'AX', id:'axonius' },
  { name:'ConnectWise',        color:'#e31837', abbr:'CW', id:'connectwise' },
  { name:'Mimecast',           color:'#0078d4', abbr:'MC', id:'mimecast' },
  { name:'Qualys',             color:'#c8102e', abbr:'QL', id:'qualys' },
  { name:'Carbon Black',       color:'#ff5722', abbr:'CB', id:'carbonblack' },
  { name:'Google Workspace',   color:'#4285f4', abbr:'GW', id:'google_workspace' },
  { name:'Cortex XSOAR',       color:'#fa582d', abbr:'XS', id:'xsoar' },
  { name:'Swimlane',           color:'#1976d2', abbr:'SW', id:'swimlane' },
  { name:'Tines',              color:'#00bcd4', abbr:'TI', id:'tines' },
  { name:'Prisma Cloud',       color:'#fa582d', abbr:'PC', id:'prisma_cloud' },
  { name:'Lacework',           color:'#00897b', abbr:'LW', id:'lacework' },
  { name:'Orca Security',      color:'#43a047', abbr:'OR', id:'orca' },
  { name:'Snyk',               color:'#4c4a73', abbr:'SN', id:'snyk' },
  { name:'Halo PSA',           color:'#1565c0', abbr:'HP', id:'halopsa' },
  { name:'Autotask',           color:'#ff6f00', abbr:'AT', id:'autotask' },
  { name:'Huntress',           color:'#e53935', abbr:'HU', id:'huntress' },
  { name:'BeyondTrust',        color:'#6a1b9a', abbr:'BT', id:'beyondtrust' },
  { name:'Active Directory',   color:'#0078d4', abbr:'AD', id:'active_directory' },
  { name:'Palo Alto NGFW',     color:'#fa582d', abbr:'PN', id:'palo_ngfw' },
  { name:'Cisco Firepower',    color:'#049fd9', abbr:'CF', id:'cisco_firepower' },
  { name:'Check Point',        color:'#cc0000', abbr:'CP', id:'checkpoint' },
  { name:'AlienVault OTX',     color:'#546e7a', abbr:'OT', id:'alienvault' },
  { name:'ThreatConnect',      color:'#1a237e', abbr:'TC', id:'threatconnect' },
  { name:'MISP',               color:'#388e3c', abbr:'MI', id:'misp' },
  { name:'Mandiant',           color:'#d32f2f', abbr:'MA', id:'mandiant' },
  { name:'Tanium',             color:'#00acc1', abbr:'TM', id:'tanium' },
  { name:'Claroty',            color:'#00695c', abbr:'CL', id:'claroty' },
  { name:'Nozomi',             color:'#1565c0', abbr:'NZ', id:'nozomi' },
  { name:'GCP Security Cmd',   color:'#4285f4', abbr:'GS', id:'gcp_scc' },
  { name:'Sumo Logic',         color:'#00a1e0', abbr:'SU', id:'sumo_logic' },
  { name:'Datadog Security',   color:'#632ca6', abbr:'DD', id:'datadog' },
  { name:'Panther',            color:'#ffb300', abbr:'PT', id:'panther' },
  { name:'M365 Defender',      color:'#0078d4', abbr:'MD', id:'m365_defender' },
  { name:'Slack',              color:'#4a154b', abbr:'SL', id:'slack' },
  { name:'Teams',              color:'#6264a7', abbr:'MT', id:'teams' },
  { name:'Freshservice',       color:'#00b388', abbr:'FS', id:'freshservice' },
  { name:'Zendesk',            color:'#03363d', abbr:'ZD', id:'zendesk' },
];

const FEATURES = [
  { icon:'⚡', title:'Agentic AI Triage', body:'AI investigates every alert like a senior analyst — not just flags it. Evidence chain, MITRE mapping, confidence score, and recommended action. All in under 3.2 seconds.' },
  { icon:'🧠', title:'Evidence Chain Transparency', body:'See exactly why the AI reached every verdict. Full audit log of sources queried, indicators evaluated, and reasoning steps — defensible to any auditor.' },
  { icon:'🛡', title:'Estate Coverage Gaps', body:'Devices, coverage gaps, missing agents — mapped in real time from your Tenable/Nessus data. Know where you\'re blind before an attacker finds it.' },
  { icon:'🔍', title:'Blast Radius Analysis', body:'When a breach is confirmed, AI instantly maps impact: which users, devices, and credentials are exposed. Response plan generated before a human opens a ticket.' },
  { icon:'🤖', title:'Autonomous Response', body:'Full Auto: isolate hosts, block IPs, disable accounts — executed in seconds with a complete audit trail and one-click revert. No SOAR playbooks to write.' },
  { icon:'📊', title:'MSSP Portfolio', body:'Manage 50 clients from one console. Per-client posture, alerts, cross-tenant threat correlation. White-label ready — your brand on every screen.' },
  { icon:'✦', title:'AI Co-Pilot', body:'Security-scoped chat in the dashboard. Ask about MITRE techniques, generate SPL/KQL hunt queries, summarise incidents, or get a shift brief — all without leaving your SOC view.' },
  { icon:'🔐', title:'BYOK — Per-Client Isolation', body:'Each analyst team\'s AI calls run under their own Anthropic key. No shared context between tenants. Complete data isolation that compliance teams require.' },
  { icon:'📋', title:'Shift Handover AI', body:'One-click AI-generated handover brief: alerts triaged, incidents open, posture score, MTTA vs SLA, and recommended actions for the incoming analyst.' },
  { icon:'🌐', title:'Live Threat Intelligence', body:'Industry-specific threat feeds with AI summarisation. One-click generates hunt queries for your SIEM. IOC matching across all connected tools automatically.' },
  { icon:'📈', title:'Compliance Mapping', body:'Active alerts automatically mapped to ISO 27001, Cyber Essentials, and NIST CSF. Framework score cards show which controls are failing and why.' },
  { icon:'⏱', title:'SLA Intelligence', body:'MTTA and MTTR tracked by severity. Analyst acknowledgement timestamped automatically. SLA breach alerts fire before you miss an SLA — not after.' },
];

const PLANS = [
  { name:'Community', price:'£0', annualPrice:'£0', period:'forever', color:'#6b7a94', features:['Up to 3 tool integrations','AI alert triage (read-only)','Up to 250 alerts/day','1 seat','Community support'] },
  { name:'Essentials', price:'£149', annualPrice:'£127', period:'/seat/mo', annualPeriod:'/seat/mo billed annually', color:'#4f8fff', badge:'Most Popular', features:['Unlimited integrations','Full AI Co-Pilot + agentic triage','Automation & response actions','BYOK — your Anthropic key', 'RBAC & full audit log','SLA tracking (MTTA/MTTR)'] },
  { name:'Professional', price:'£1,199', annualPrice:'£1,019', period:'/mo flat', annualPeriod:'/mo billed annually', color:'#22d49a', features:['Everything in Essentials','Up to 15 analyst seats','PDF board reports + API','RBAC & full audit trail','MITRE compliance mapping'] },
  { name:'Enterprise', price:'£3,499', annualPrice:'£2,974', period:'/mo', annualPeriod:'/mo billed annually', color:'#8b6fff', badge:'MSSP', features:['Everything in Professional','Unlimited analysts & clients','White-label branding','Per-client BYOK isolation','Portfolio + cross-client AI intel','Dedicated account manager'] },
];

function LogoBadge({ color, abbr, slug }: { color: string; abbr: string; slug?: string | null }) {
  return (
    <span style={{ width:18, height:18, borderRadius:4, flexShrink:0, position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${color}cc,${color}55)`, fontSize:'0.44rem', fontWeight:900, color:'#fff', letterSpacing:0, overflow:'hidden' }}>
      {abbr}
      {slug && (
        <img
          src={`https://cdn.simpleicons.org/${slug}/ffffff`}
          alt=""
          aria-hidden="true"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain', padding:'2px', background:'#0d111e' }}
          onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none';}}
        />
      )}
    </span>
  );
}

function ToolChip({ name, color, abbr, id }: { name: string; color: string; abbr: string; id?: string }) {
  const slug = id ? (LOGO_MAP[id] ?? null) : null;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'6px 12px', background:'rgba(16,22,40,0.85)', border:'1px solid rgba(0,180,240,0.10)', borderRadius:20, fontSize:'0.72rem', color:'#8a9ab0', fontWeight:600, transition:'all .15s', cursor:'default' }}
    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=color+'40';(e.currentTarget as HTMLElement).style.color='#e8ecf4';}}
    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='#1a2030';(e.currentTarget as HTMLElement).style.color='#8a9ab0';}}>
      <LogoBadge color={color} abbr={abbr} slug={slug} />
      {name}
    </span>
  );
}

function ROICalculator() {
  const [analysts, setAnalysts] = useState(3);
  const [alertsPerDay, setAlertsPerDay] = useState(200);
  const [hourlyRate, setHourlyRate] = useState(65);
  const hoursSaved = Math.round(alertsPerDay * 0.72 * 0.05 * 22 * analysts);
  const moneySaved = Math.round(hoursSaved * hourlyRate);
  return (
    <div style={{ maxWidth:640, margin:'0 auto', background:'rgba(16,22,40,0.85)', border:'1px solid rgba(0,180,240,0.10)', borderRadius:16, padding:'28px 32px' }}>
      <div className='roi-grid' style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:24 }}>
        <div>
          <label style={{ display:'block', fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Analysts</label>
          <input type='range' min={1} max={20} value={analysts} onChange={e=>setAnalysts(Number(e.target.value))} style={{ width:'100%', accentColor:'#4f8fff' }} />
          <span style={{ fontSize:'1.2rem', fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:'#e8ecf4' }}>{analysts}</span>
        </div>
        <div>
          <label style={{ display:'block', fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Alerts/day</label>
          <input type='range' min={50} max={2000} step={50} value={alertsPerDay} onChange={e=>setAlertsPerDay(Number(e.target.value))} style={{ width:'100%', accentColor:'#4f8fff' }} />
          <span style={{ fontSize:'1.2rem', fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:'#e8ecf4' }}>{alertsPerDay}</span>
        </div>
        <div>
          <label style={{ display:'block', fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Analyst rate (£/hr)</label>
          <input type='range' min={30} max={150} step={5} value={hourlyRate} onChange={e=>setHourlyRate(Number(e.target.value))} style={{ width:'100%', accentColor:'#4f8fff' }} />
          <span style={{ fontSize:'1.2rem', fontWeight:800, fontFamily:'JetBrains Mono,monospace', color:'#e8ecf4' }}>£{hourlyRate}</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {[
          { label:'Analyst hours saved/mo', val:`${hoursSaved.toLocaleString()}h`, color:'#4f8fff' },
          { label:'Estimated cost saving/mo', val:`£${moneySaved.toLocaleString()}`, color:'#22d49a' },
        ].map(s => (
          <div key={s.label} style={{ padding:'18px 20px', background:'rgba(10,14,28,0.90)', border:`1px solid ${s.color}20`, borderRadius:12 }}>
            <div style={{ fontSize:'2rem', fontWeight:900, fontFamily:'JetBrains Mono,monospace', color:s.color, letterSpacing:-2 }}>{s.val}</div>
            <div style={{ fontSize:'0.66rem', color:'#6b7a94', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveDashPreview() {
  const [visibleAlerts, setVisibleAlerts] = useState<number[]>([0]);
  const [aiText, setAiText] = useState('');
  const fullText = 'AI Shift Brief: Processed 23 alerts overnight. Auto-closed 18 FPs. Escalated 3 TPs to incidents. 2 critical alerts need immediate attention.';
  useEffect(() => {
    let i = 0;
    const addAlert = () => { if(i<ALERTS.length){setVisibleAlerts(p=>[...p,i]);i++;setTimeout(addAlert,800);} };
    const t = setTimeout(()=>addAlert(), 400);
    return ()=>clearTimeout(t);
  },[]);
  useEffect(()=>{
    let i=0;const iv=setInterval(()=>{setAiText(fullText.slice(0,i));i++;if(i>fullText.length)clearInterval(iv);},16);
    return()=>clearInterval(iv);
  },[]);
  const sevColor: Record<string,string> = { crit:'#f0405e', high:'#f97316', med:'#f0a030', low:'#4f8fff' };
  const vStyle: Record<string,{c:string;bg:string}> = { TP:{c:'#f0405e',bg:'#f0405e12'}, FP:{c:'#22d49a',bg:'#22d49a12'}, SUS:{c:'#f0a030',bg:'#f0a03012'} };
  return (
    <div style={{ background:'rgba(10,14,28,0.90)', border:'1px solid rgba(0,180,240,0.15)', borderRadius:14, overflow:'hidden', fontFamily:'Inter,sans-serif', maxWidth:860, margin:'0 auto', boxShadow:'0 40px 80px rgba(0,0,0,0.6)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', background:'rgba(8,12,22,0.90)', borderBottom:'1px solid rgba(0,180,240,0.10)' }}>
        <div style={{ display:'flex', gap:5 }}>
          {['#f0405e80','#f0a03080','#22c99280'].map((c,i)=><span key={i} style={{width:9,height:9,borderRadius:'50%',background:c,display:'block'}}/>)}
        </div>
        <span style={{ flex:1, textAlign:'center', fontSize:'0.6rem', color:'#3a4a60', fontFamily:'JetBrains Mono,monospace', background:'#060810', padding:'3px 12px', borderRadius:4 }}>getwatchtower.io/dashboard</span>
        <span style={{ fontSize:'0.58rem', color:'#22c992', display:'flex', alignItems:'center', gap:4 }}><span style={{width:5,height:5,borderRadius:'50%',background:'#22c992',boxShadow:'0 0 6px #22c992',display:'block'}}/>LIVE</span>
      </div>
      <div className='dash-preview' style={{ display:'flex', minHeight:300 }}>
        <div className='dash-preview-sidebar' style={{ width:44, background:'#08090f', borderRight:'1px solid rgba(0,180,240,0.08)', padding:'10px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{marginBottom:8}}>
            <rect width="28" height="28" rx="7" fill="url(#pg2)"/>
            <path d="M14 5.5L22 9V15.5C22 19.5 18.5 23 14 24.5C9.5 23 6 19.5 6 15.5V9L14 5.5Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7"/>
            <path d="M11.5 14.5L13.5 16.5L17.5 12" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="pg2" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
          </svg>
          {['📊','🔔','🛡','🔍','🌐','📋','📈'].map((ic,i)=><div key={i} style={{width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:6,fontSize:'0.7rem',background:i===0?'#4f8fff18':'transparent'}}>{ic}</div>)}
        </div>
        <div style={{ flex:1, padding:'12px 16px' }}>
          <div style={{ fontSize:'0.62rem', color:'#8a9ab0', padding:'7px 10px', background:'linear-gradient(135deg,rgba(79,143,255,0.05),rgba(34,201,146,0.05))', border:'1px solid #4f8fff18', borderRadius:8, marginBottom:10, display:'flex', alignItems:'flex-start', gap:6, minHeight:32 }}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#4f8fff',boxShadow:'0 0 8px #4f8fff',flexShrink:0,marginTop:2}}/>
            <span style={{fontSize:'0.6rem'}}>{aiText}<span style={{opacity:aiText.length<fullText.length?1:0,borderRight:'2px solid #4f8fff',marginLeft:1}}> </span></span>
          </div>
          <div className='dash-preview-stats' style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:10 }}>
            {[{l:'Posture',v:'91%',c:'#22d49a'},{l:'Critical',v:'0',c:'#22d49a'},{l:'Coverage',v:'99%',c:'#22d49a'},{l:'AI Closed',v:'847',c:'#4f8fff'}].map(s=>(
              <div key={s.l} style={{padding:'8px',background:'rgba(16,22,40,0.85)',borderRadius:8,textAlign:'center'}}>
                <div style={{fontSize:'1rem',fontWeight:900,fontFamily:'JetBrains Mono,monospace',color:s.c,letterSpacing:-1}}>{s.v}</div>
                <div style={{fontSize:'0.5rem',color:'#4a5568',marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {ALERTS.map((a,i)=>(
              <div key={i} style={{display:visibleAlerts.includes(i)?'flex':'none',alignItems:'center',gap:8,padding:'6px 8px',background:'rgba(16,22,40,0.85)',borderRadius:8,border:'1px solid rgba(0,180,240,0.13)',animation:'slideIn 0.3s ease'}}>
                <div style={{width:3,height:24,borderRadius:2,background:sevColor[a.sev],flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'0.68rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.title}</div>
                  <div style={{fontSize:'0.54rem',color:'#6b7a94',marginTop:1}}>{a.action}</div>
                </div>
                <span style={{fontSize:'0.5rem',fontWeight:800,padding:'2px 6px',borderRadius:3,color:vStyle[a.verdict]?.c,background:vStyle[a.verdict]?.bg,flexShrink:0}}>{a.verdict}</span>
                <span style={{fontSize:'0.5rem',color:'#3a4a60',flexShrink:0,fontFamily:'JetBrains Mono,monospace'}}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationsFloatButton({ tools }: { tools: typeof TOOLS }) {
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const cats = ['All','EDR','SIEM','XDR','Cloud','Identity','Vuln','ITSM','SOAR','Intel','OT'];
  const [cat, setCat] = React.useState('All');

  const filtered = tools.filter(t => {
    const name = t.name.toLowerCase();
    const matchFilter = !filter || name.includes(filter.toLowerCase());
    const catMap: Record<string,string[]> = {
      'EDR':['crowdstrike','sentinelone','defender','carbonblack','sophos','tanium','cylance','bitdefender','trellix','elastic'],
      'SIEM':['splunk','sentinel','qradar','elastic','sumo','datadog','logrhythm','securonix'],
      'XDR':['cortex','taegis','vectra','darktrace','cybereason'],
      'Cloud':['aws','azure','gcp','wiz','orca','aqua','prisma'],
      'Identity':['okta','entra','duo','cyberark','ping'],
      'Vuln':['tenable','nessus','qualys','rapid7'],
      'ITSM':['servicenow','jira','pagerduty','opsgenie'],
      'SOAR':['palo','xsoar','demisto'],
      'Intel':['misp','anomali','recorded'],
      'OT':['dragos','claroty','nozomi'],
    };
    const matchCat = cat === 'All' || (catMap[cat]||[]).some(k => name.toLowerCase().includes(k));
    return matchFilter && matchCat;
  });

  return (
    <>
      <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
        <button onClick={() => setOpen(true)}
          style={{ padding:'12px 28px', background:'linear-gradient(135deg,#4f8fff,#7c3aff)', color:'#fff', border:'none', borderRadius:10, fontSize:'0.9rem', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 20px rgba(79,143,255,0.3)', transition:'all .2s' }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLElement).style.boxShadow='0 8px 28px rgba(79,143,255,0.4)';}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='0 4px 20px rgba(79,143,255,0.3)';}}>
          <span>🔌</span> See all 80+ integrations + OT/ICS add-on
        </button>
        <a href='/signup' style={{ padding:'12px 28px', background:'transparent', color:'#4f8fff', border:'1px solid #4f8fff30', borderRadius:10, fontSize:'0.9rem', fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif', textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
          Don&apos;t see yours? Request →
        </a>
      </div>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#0d1122', border:'1px solid rgba(0,180,240,0.13)', borderRadius:18, width:'100%', maxWidth:680, maxHeight:'82vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>
            {/* Header */}
            <div style={{ padding:'18px 20px', borderBottom:'1px solid #1d2535', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'1rem', fontWeight:800 }}>80+ Integrations</div>
                <div style={{ fontSize:'0.74rem', color:'#6b7a94', marginTop:2 }}>Connects to your existing security stack — no rip-and-replace</div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background:'none', border:'1px solid rgba(0,180,240,0.13)', borderRadius:8, color:'#6b7a94', cursor:'pointer', fontSize:'1rem', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif' }}>×</button>
            </div>
            {/* Search + filter */}
            <div style={{ padding:'12px 20px', borderBottom:'1px solid #1d2535', display:'flex', gap:8, flexDirection:'column' }}>
              <input value={filter} onChange={e => setFilter(e.target.value)} placeholder='Search integrations…'
                style={{ width:'100%', padding:'8px 12px', background:'rgba(8,12,22,0.90)', border:'1px solid rgba(0,180,240,0.13)', borderRadius:8, color:'#e8ecf4', fontSize:'0.84rem', fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' as const }} />
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {cats.map(ct => (
                  <button key={ct} onClick={() => setCat(ct)}
                    style={{ padding:'3px 10px', borderRadius:20, border:`1px solid ${cat===ct?'#4f8fff':'#1d2535'}`, background:cat===ct?'#4f8fff15':'transparent', color:cat===ct?'#4f8fff':'#6b7a94', fontSize:'0.72rem', fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                    {ct}
                  </button>
                ))}
              </div>
            </div>
            {/* Grid */}
            <div style={{ overflowY:'auto', padding:'16px 20px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:8 }}>
                {filtered.map((t, i) => (
                  <div key={t.name+i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'rgba(16,22,40,0.85)', border:'1px solid rgba(0,180,240,0.13)', borderRadius:10, transition:'border-color .12s' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=t.color+'40';}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='#1d2535';}}>
                    <div style={{ width:28, height:28, borderRadius:7, background:t.color+'18', border:`1px solid ${t.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.62rem', fontWeight:900, color:t.color, flexShrink:0, fontFamily:'JetBrains Mono,monospace' }}>{t.abbr}</div>
                    <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#e8ecf4' }}>{t.name}</span>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'32px', color:'#6b7a94', fontSize:'0.84rem' }}>No integrations match &ldquo;{filter}&rdquo;</div>
                )}
              </div>
              <div style={{ marginTop:16, padding:'14px 16px', background:'#4f8fff08', border:'1px solid #4f8fff18', borderRadius:10, textAlign:'center' }}>
                <div style={{ fontSize:'0.84rem', color:'#4f8fff', fontWeight:600, marginBottom:4 }}>Don&apos;t see your tool?</div>
                <div style={{ fontSize:'0.76rem', color:'#6b7a94' }}>New integrations added weekly. <a href='mailto:hello@getwatchtower.io' style={{ color:'#4f8fff', textDecoration:'none' }}>Request one →</a></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function LandingPage() {
  const toolsRef = useRef<HTMLElement>(null);
  const [toolsVisible, setToolsVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(false); // 15% annual discount

  useEffect(()=>{
    const obs = new IntersectionObserver(([e])=>{if(e.isIntersecting)setToolsVisible(true);},{threshold:0.2});
    if(toolsRef.current) obs.observe(toolsRef.current);
    return ()=>obs.disconnect();
  },[]);

  const CSS = `
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#090d18;color:#e8ecf4;font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    @keyframes slideIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(79,143,255,0.3)}50%{box-shadow:0 0 40px rgba(79,143,255,0.6)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
    .nav-link{color:#6b7a94;text-decoration:none;font-size:0.82rem;font-weight:500;transition:color .15s}
    .nav-link:hover{color:#e8ecf4}
    .btn-primary{padding:11px 24px;background:#4f8fff;color:#fff;border:none;border-radius:9px;font-weight:700;font-size:0.85rem;cursor:pointer;transition:all .15s;text-decoration:none;display:inline-block;font-family:inherit}
    .btn-primary:hover{background:#6b9fff;transform:translateY(-1px);box-shadow:0 8px 24px rgba(79,143,255,0.35)}
    .btn-outline{padding:10px 22px;background:transparent;color:#e8ecf4;border:1px solid #2a3448;border-radius:9px;font-weight:600;font-size:0.85rem;cursor:pointer;transition:all .15s;text-decoration:none;display:inline-block;font-family:inherit}
    .btn-outline:hover{border-color:#4f8fff;color:#4f8fff}
    .section{max-width:1200px;margin:0 auto}
    @media(max-width:768px){
      .feat-grid{grid-template-columns:1fr!important}
      .plan-grid{grid-template-columns:1fr!important;max-width:400px!important;margin-left:auto!important;margin-right:auto!important}
      .hero-btns{flex-direction:column;align-items:center}
      .stats-bar{grid-template-columns:repeat(2,1fr)!important;gap:12px!important}
      .before-after{grid-template-columns:1fr!important;gap:14px!important}
      .before-after .ba-arrow{display:none!important}
      .how-grid{grid-template-columns:1fr!important}
      .int-grid{grid-template-columns:repeat(4,1fr)!important}
      .ot-grid{grid-template-columns:1fr!important}
      .roi-grid{grid-template-columns:1fr!important}
      .desktop-nav{display:none!important}
      .desktop-auth{gap:6px!important}
      .nav-bar{gap:12px!important;padding:0 14px!important}
      .nav-bar .btn-outline{display:none!important}
      .nav-bar .btn-primary{padding:7px 14px!important;font-size:0.74rem!important}
      .footer-wrap{flex-direction:column!important;text-align:center!important;gap:16px!important}
      .footer-links{justify-content:center!important;flex-wrap:wrap!important;gap:12px!important}
      .dash-preview-sidebar{display:none!important}
      .dash-preview-stats{grid-template-columns:repeat(2,1fr)!important}
      .dash-preview{min-height:240px!important}
    }
  `;

  return (
    <main style={{ background:'#090d18', color:'#e8ecf4', minHeight:'100vh', fontFamily:'Inter,system-ui,sans-serif' }}>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(5,5,8,0.9)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(0,180,240,0.10)', padding:'0 24px' }}>
        <div className='nav-bar' style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', height:58, gap:32 }}>
          <a href='/' style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none', color:'inherit', flexShrink:0 }}>
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <rect width="30" height="30" rx="8" fill="url(#navg)"/>
              <path d="M15 6L23 10V16C23 20 19.5 23.5 15 25C10.5 23.5 7 20 7 16V10L15 6Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
              <path d="M12.5 15.5L14.5 17.5L18.5 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs><linearGradient id="navg" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
            </svg>
            <span style={{ fontWeight:800, fontSize:'1rem', letterSpacing:-0.3 }}>Watchtower</span>
          </a>
          <div className='desktop-nav' style={{ display:'flex', gap:24, marginLeft:16 }}>
            {[['Features','#features'],['Pricing','#pricing'],['Integrations','#integrations'],['MSSP','#mssp'],['Demo','/demo']].map(([label,href])=>(
              <a key={label} href={href} className='nav-link'>{label}</a>
            ))}
          </div>
          <div className='desktop-auth' style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
            <a href='/login' className='btn-outline' style={{padding:'7px 16px',fontSize:'0.78rem'}}>Sign in</a>
            <a href='/signup' className='btn-primary' style={{padding:'8px 18px',fontSize:'0.78rem'}}>Get started free →</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding:'80px 24px 60px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 50% at 50% -10%,rgba(79,143,255,0.12),transparent)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'20%', left:'10%', width:300, height:300, borderRadius:'50%', background:'rgba(139,111,255,0.04)', filter:'blur(80px)', pointerEvents:'none' }}/>
        <div style={{ maxWidth:800, margin:'0 auto', position:'relative' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px', background:'#4f8fff12', border:'1px solid #4f8fff25', borderRadius:20, fontSize:'0.7rem', color:'#4f8fff', fontWeight:600, marginBottom:24 }}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#4f8fff',boxShadow:'0 0 8px #4f8fff',display:'block',animation:'pulse 2s ease infinite'}}/>
            80+ integrations + OT/ICS add-on · Autonomous AI triage + response · MSSP-ready
          </div>
          <h1 style={{ fontSize:'clamp(2.2rem,5vw,3.6rem)', fontWeight:900, lineHeight:1.08, letterSpacing:-2.5, marginBottom:20 }}>
            Your entire SOC.<br/>
            <span style={{ background:'linear-gradient(135deg,#4f8fff,#8b6fff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>One screen.</span>
          </h1>
          <p style={{ fontSize:'clamp(0.95rem,2vw,1.15rem)', color:'#6b7a94', lineHeight:1.75, marginBottom:32, maxWidth:580, margin:'0 auto 32px' }}>
            AI triages every alert in 3.2 seconds — evidence chain, MITRE mapping, verdict, response action.
            Connects to 80+ tools across EDR, SIEM, Cloud, Identity and OT/ICS. Built for MSSPs and enterprise SOCs.
          </p>
          <div className='hero-btns' style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
            <a href='/signup' className='btn-primary' style={{fontSize:'0.9rem',padding:'13px 28px'}}>Start free — no card needed →</a>
            <a href='/demo' className='btn-outline' style={{fontSize:'0.9rem',padding:'13px 24px'}}>See live demo</a>
          </div>
          <div style={{ marginTop:16, fontSize:'0.72rem', color:'#3a4a60' }}>Community plan free forever · Essentials from £149/seat/mo</div>
        </div>
      </section>

      {/* LIVE DASHBOARD PREVIEW */}
      <section style={{ padding:'0 24px 60px' }}>
        <LiveDashPreview />
      </section>

      {/* TRUST / STATS BAR */}
      <section style={{ padding:'32px 24px', background:'rgba(8,12,22,0.90)', borderTop:'1px solid rgba(0,180,240,0.10)', borderBottom:'1px solid rgba(0,180,240,0.10)' }}>
        <div className='stats-bar' style={{ maxWidth:960, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24, textAlign:'center' }}>
          {[
            { val:'3.2s', label:'Average AI triage time', color:'#4f8fff' },
            { val:'80+', label:'Tool integrations — EDR, SIEM, XDR, Cloud, Identity, OT', color:'#22d49a' },
            { val:'85%', label:'Alerts auto-resolved with full audit trail', color:'#8b6fff' },
            { val:'10×', label:'Analyst capacity increase', color:'#f0a030' },
          ].map(s => (
            <div key={s.label} style={{ padding:'20px 16px' }}>
              <div style={{ fontSize:'2.2rem', fontWeight:900, fontFamily:'JetBrains Mono,monospace', color:s.color, letterSpacing:-2, lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:'0.7rem', color:'#4a5568', marginTop:8, lineHeight:1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCT TOUR — SCREENSHOTS */}
      <section style={{ padding:'70px 24px' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>INSIDE THE PRODUCT</div>
            <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5 }}>See what your SOC actually gets</h2>
            <p style={{ fontSize:'0.88rem', color:'#6b7a94', marginTop:10 }}>Not mockups — this is the real dashboard running demo data.</p>
          </div>

          {/* Screenshot 1: AI Triage */}
          <div style={{ marginBottom:48 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:32, alignItems:'center' }} className="feat-grid">
              <div>
                <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#f0405e', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>AI TRIAGE</div>
                <h3 style={{ fontSize:'1.3rem', fontWeight:800, letterSpacing:-0.5, marginBottom:10, lineHeight:1.2 }}>Every alert investigated in 3.2 seconds</h3>
                <p style={{ fontSize:'0.82rem', color:'#6b7a94', lineHeight:1.7 }}>APEX — the AI analyst — cross-references every alert against your Tenable vulns, Entra ID logs, and threat intel. Full evidence chain, MITRE mapping, and recommended action.</p>
              </div>
              <div style={{ background:'rgba(14,24,46,0.55)', border:'1px solid rgba(0,180,240,0.13)', borderRadius:14, padding:'16px', overflow:'hidden' }}>
                <div style={{ padding:'10px 14px', background:'rgba(240,64,94,0.08)', border:'1px solid rgba(240,64,94,0.20)', borderRadius:10, marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ fontSize:'0.58rem', fontWeight:800, padding:'2px 6px', borderRadius:3, background:'#f0405e20', color:'#f0405e' }}>CRITICAL</span>
                    <span style={{ fontSize:'0.72rem', fontWeight:700 }}>LSASS credential dump — DC01</span>
                    <span style={{ marginLeft:'auto', fontSize:'0.62rem', color:'#4a5568' }}>09:14</span>
                  </div>
                  <div style={{ fontSize:'0.68rem', color:'#6b7a94', marginBottom:8 }}>CrowdStrike Falcon · T1003.001 Credential Access</div>
                  <div style={{ padding:'8px 10px', background:'rgba(4,8,20,0.7)', borderRadius:8, border:'1px solid rgba(0,180,240,0.08)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                      <span style={{ fontSize:'0.58rem', fontWeight:800, padding:'2px 6px', borderRadius:3, background:'#f0405e15', color:'#f0405e' }}>TRUE POSITIVE</span>
                      <span style={{ fontSize:'0.62rem', color:'#f0405e', fontWeight:700, fontFamily:'JetBrains Mono,monospace' }}>98% confidence</span>
                    </div>
                    <p style={{ fontSize:'0.68rem', color:'#8a9ab0', lineHeight:1.6, margin:0 }}>Mimikatz-style LSASS access detected. Service account credentials at risk. Tenable shows CVE-2024-XXXX on this host (CVSS 9.8, CISA KEV). Entra ID: admin_svc authenticated from unusual IP 12m prior. Immediate escalation recommended.</p>
                    <div style={{ marginTop:6, fontSize:'0.62rem', color:'#22d49a', fontWeight:600 }}>✓ Isolated host · Opened INC-0847 · Disabled admin_svc</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <div style={{ flex:1, padding:'8px 10px', background:'rgba(34,212,154,0.06)', border:'1px solid rgba(34,212,154,0.12)', borderRadius:8, fontSize:'0.64rem' }}>
                    <div style={{ color:'#22d49a', fontWeight:700, marginBottom:2 }}>17 auto-closed FPs</div>
                    <div style={{ color:'#4a5568' }}>85% noise eliminated</div>
                  </div>
                  <div style={{ flex:1, padding:'8px 10px', background:'rgba(79,143,255,0.06)', border:'1px solid rgba(79,143,255,0.12)', borderRadius:8, fontSize:'0.64rem' }}>
                    <div style={{ color:'#4f8fff', fontWeight:700, marginBottom:2 }}>3.2s avg triage</div>
                    <div style={{ color:'#4a5568' }}>vs 3.5hr manual</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Screenshot 2: MSSP Portfolio */}
          <div style={{ marginBottom:48 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:32, alignItems:'center' }} className="feat-grid">
              <div style={{ background:'rgba(14,24,46,0.55)', border:'1px solid rgba(0,180,240,0.13)', borderRadius:14, padding:'16px', overflow:'hidden' }}>
                <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#6b7a94', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>MSSP PORTFOLIO — 4 CLIENTS</div>
                {[
                  { name:'Acme Financial', score:87, alerts:3, color:'#22d49a', status:'Healthy' },
                  { name:'GlobalTech Corp', score:44, alerts:12, color:'#f0405e', status:'At Risk' },
                  { name:'Highland Distillers', score:72, alerts:5, color:'#f0a030', status:'Needs Attention' },
                  { name:'Nordic Energy AS', score:91, alerts:1, color:'#22d49a', status:'Healthy' },
                ].map(c => (
                  <div key={c.name} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'rgba(4,8,20,0.4)', border:'1px solid rgba(0,180,240,0.08)', borderRadius:8, marginBottom:6 }}>
                    <div style={{ width:36, height:36, borderRadius:8, background:`${c.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', fontWeight:900, color:c.color, fontFamily:'JetBrains Mono,monospace' }}>{c.score}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'0.78rem', fontWeight:700 }}>{c.name}</div>
                      <div style={{ fontSize:'0.62rem', color:c.color }}>{c.status} · {c.alerts} active alert{c.alerts!==1?'s':''}</div>
                    </div>
                    <span style={{ fontSize:'0.72rem', color:'#4f8fff' }}>↗</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#8b6fff', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>MSSP PORTFOLIO</div>
                <h3 style={{ fontSize:'1.3rem', fontWeight:800, letterSpacing:-0.5, marginBottom:10, lineHeight:1.2 }}>50 clients. One screen.</h3>
                <p style={{ fontSize:'0.82rem', color:'#6b7a94', lineHeight:1.7 }}>Per-client posture scores, alert volumes, SLA tracking, and AI cross-tenant correlation. White-label ready — your brand on every client portal. BYOK isolation per tenant.</p>
              </div>
            </div>
          </div>

          {/* Screenshot 3: Integrations */}
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:32, alignItems:'center' }} className="feat-grid">
              <div>
                <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#22d49a', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>INTEGRATIONS</div>
                <h3 style={{ fontSize:'1.3rem', fontWeight:800, letterSpacing:-0.5, marginBottom:10, lineHeight:1.2 }}>80+ tools. One API call.</h3>
                <p style={{ fontSize:'0.82rem', color:'#6b7a94', lineHeight:1.7 }}>EDR, SIEM, XDR, Cloud, Identity, Vuln, CSPM, OT/ICS, SOAR, ITSM. Connect in under 5 minutes. Normalised alert schema across every source.</p>
              </div>
              <div style={{ background:'rgba(14,24,46,0.55)', border:'1px solid rgba(0,180,240,0.13)', borderRadius:14, padding:'16px', overflow:'hidden' }}>
                <div className='int-grid' style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:6 }}>
                  {[
                    {n:'CrowdStrike',c:'#f0405e'},{n:'Defender',c:'#00a4ef'},{n:'SentinelOne',c:'#8c2be2'},{n:'Splunk',c:'#65a637'},{n:'Sentinel',c:'#0078d4'},{n:'Tenable',c:'#00b3e3'},
                    {n:'Okta',c:'#007dc1'},{n:'Elastic',c:'#00bfb3'},{n:'QRadar',c:'#006699'},{n:'Darktrace',c:'#6b4fbd'},{n:'Zscaler',c:'#00aae7'},{n:'Palo Alto',c:'#fa582d'},
                    {n:'AWS',c:'#ff9900'},{n:'Wiz',c:'#10b981'},{n:'Rapid7',c:'#e53935'},{n:'Proofpoint',c:'#007dba'},{n:'ServiceNow',c:'#62d84e'},{n:'Jira',c:'#0052cc'},
                    {n:'Entra ID',c:'#0078d4'},{n:'CyberArk',c:'#e31837'},{n:'FortiGate',c:'#da291c'},{n:'Chronicle',c:'#4285f4'},{n:'Sophos',c:'#005cb9'},{n:'+ 56 more',c:'#4f8fff'},
                  ].map(t=>(
                    <div key={t.n} style={{ padding:'8px 4px', background:`${t.c}18`, border:`1px solid ${t.c}20`, borderRadius:6, textAlign:'center' }}>
                      <div style={{ width:24, height:24, borderRadius:5, background:`linear-gradient(135deg,${t.c}cc,${t.c}55)`, margin:'0 auto 4px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.42rem', fontWeight:900, color:'#fff' }}>{t.n.slice(0,2).toUpperCase()}</div>
                      <div style={{ fontSize:'0.52rem', color:'#6b7a94', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.n}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:10, display:'flex', gap:8, fontSize:'0.64rem' }}>
                  <span style={{ padding:'3px 8px', background:'rgba(34,212,154,0.10)', border:'1px solid rgba(34,212,154,0.20)', borderRadius:4, color:'#22d49a', fontWeight:600 }}>EDR</span>
                  <span style={{ padding:'3px 8px', background:'rgba(79,143,255,0.10)', border:'1px solid rgba(79,143,255,0.20)', borderRadius:4, color:'#4f8fff', fontWeight:600 }}>SIEM</span>
                  <span style={{ padding:'3px 8px', background:'rgba(139,111,255,0.10)', border:'1px solid rgba(139,111,255,0.20)', borderRadius:4, color:'#8b6fff', fontWeight:600 }}>Cloud</span>
                  <span style={{ padding:'3px 8px', background:'rgba(240,160,48,0.10)', border:'1px solid rgba(240,160,48,0.20)', borderRadius:4, color:'#f0a030', fontWeight:600 }}>Identity</span>
                  <span style={{ padding:'3px 8px', background:'rgba(0,179,227,0.10)', border:'1px solid rgba(0,179,227,0.20)', borderRadius:4, color:'#00b3e3', fontWeight:600 }}>OT/ICS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section style={{ padding:'60px 24px', background:'rgba(10,14,28,0.90)', borderTop:'1px solid rgba(0,180,240,0.10)', borderBottom:'1px solid rgba(0,180,240,0.10)' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#f0405e', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>THE PROBLEM</div>
            <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5 }}>What your SOC looks like today vs with Watchtower</h2>
          </div>
          <div className='before-after' style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:24, alignItems:'center' }}>
            <div style={{ padding:24, background:'rgba(16,22,40,0.85)', border:'1px solid #f0405e18', borderRadius:14 }}>
              <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#f0405e', textTransform:'uppercase', letterSpacing:'1px', marginBottom:14 }}>Before Watchtower</div>
              {['400+ alerts/day, all need human review','6 separate tool consoles open','3.5 hour average triage time','80% are false positives eating analyst time','Junior analysts bottlenecked on senior review'].map(s=>(
                <div key={s} style={{display:'flex',gap:8,marginBottom:8,alignItems:'flex-start'}}>
                  <span style={{color:'#f0405e',flexShrink:0,marginTop:1}}>✗</span>
                  <span style={{fontSize:'0.78rem',color:'#6b7a94',lineHeight:1.5}}>{s}</span>
                </div>
              ))}
            </div>
            <div className='ba-arrow' style={{ fontSize:'1.5rem', color:'#3a4050' }}>→</div>
            <div style={{ padding:24, background:'rgba(16,22,40,0.85)', border:'1px solid #22d49a18', borderRadius:14 }}>
              <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#22d49a', textTransform:'uppercase', letterSpacing:'1px', marginBottom:14 }}>With Watchtower</div>
              {['<60 alerts actually need attention','1 screen for everything','3.2s AI triage with evidence chain','85% auto-resolved with full audit trail','Juniors work at senior level with AI guidance'].map(s=>(
                <div key={s} style={{display:'flex',gap:8,marginBottom:8,alignItems:'flex-start'}}>
                  <span style={{color:'#22d49a',flexShrink:0,marginTop:1}}>✓</span>
                  <span style={{fontSize:'0.78rem',color:'#8a9ab0',lineHeight:1.5}}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding:'64px 24px', textAlign:'center' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>HOW IT WORKS</div>
          <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5, marginBottom:40 }}>Up and running in under 15 minutes</h2>
          <div className='how-grid' style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, position:'relative' }}>
            {[
              { step:'01', icon:'🔌', title:'Connect your tools', body:'Point Watchtower at your existing stack — CrowdStrike, Splunk, Tenable, Okta and 76 more. No agents, no forwarders, no professional services. OAuth or API key, credentials encrypted at rest.', color:'#4f8fff' },
              { step:'02', icon:'🧠', title:'Add your AI key', body:'Paste your Anthropic API key (BYOK). Your AI costs go direct to your Anthropic account — Watchtower never touches your alert data. Each MSSP client gets their own isolated key.', color:'#8b6fff' },
              { step:'03', icon:'⚡', title:'Watch AI triage', body:'Alerts flow in. AI investigates each one like a senior analyst — evidence chain, MITRE mapping, confidence score, and recommended action — in under 3.2 seconds. You handle the decisions; AI handles the volume.', color:'#22d49a' },
            ].map((s, i) => (
              <div key={s.step} style={{ padding:28, background:'#0d111e', border:`1px solid ${s.color}20`, borderRadius:16, textAlign:'left', position:'relative' }}>
                <div style={{ position:'absolute', top:20, right:20, fontSize:'2.4rem', fontWeight:900, fontFamily:'JetBrains Mono,monospace', color:`${s.color}15`, lineHeight:1 }}>{s.step}</div>
                <div style={{ fontSize:'2rem', marginBottom:12 }}>{s.icon}</div>
                <h3 style={{ fontSize:'0.96rem', fontWeight:800, marginBottom:8, color:'#e8ecf4' }}>{s.title}</h3>
                <p style={{ fontSize:'0.76rem', color:'#6b7a94', lineHeight:1.75 }}>{s.body}</p>
                {i < 2 && <div style={{ position:'absolute', right:-24, top:'50%', transform:'translateY(-50%)', fontSize:'1.2rem', color:'#1d2535', zIndex:1 }}>→</div>}
              </div>
            ))}
          </div>
          <div style={{ marginTop:28, fontSize:'0.8rem', color:'#4a5568' }}>
            Average time from signup to first AI-triaged alert: <strong style={{ color:'#4f8fff' }}>11 minutes</strong>
          </div>
        </div>
      </section>

      {/* ROI */}
      <section style={{ padding:'60px 24px', textAlign:'center' }}>
        <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>BY THE NUMBERS</div>
        <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5, marginBottom:32 }}>Calculate your savings</h2>
        <ROICalculator />
      </section>

      {/* INTEGRATIONS */}
      <section id='integrations' ref={toolsRef as React.RefObject<HTMLElement>} style={{ padding:'60px 24px', textAlign:'center', background:'rgba(10,14,28,0.90)', borderTop:'1px solid rgba(0,180,240,0.10)', borderBottom:'1px solid rgba(0,180,240,0.10)' }}>
        <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>INTEGRATIONS</div>
        <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5, marginBottom:12 }}>Connects to everything you run</h2>
        <p style={{ color:'#6b7a94', fontSize:'0.88rem', lineHeight:1.8, marginBottom:24, maxWidth:580, margin:'0 auto 24px' }}>80+ integrations + OT/ICS add-on across EDR, SIEM, XDR, Cloud, Identity, ITSM, SOAR, Threat Intel, OT/ICS and more. No rip-and-replace — live in minutes.</p>
        <div style={{ display:'flex', justifyContent:'center', gap:10, flexWrap:'wrap', marginBottom:32 }}>
          {['EDR · XDR','SIEM · SOAR','Cloud Security','Identity','Vuln Management','ITSM','Threat Intel','OT/ICS'].map(cat => (
            <span key={cat} style={{ padding:'5px 14px', background:'#4f8fff10', border:'1px solid #4f8fff20', borderRadius:20, fontSize:'0.72rem', color:'#4f8fff', fontWeight:600 }}>{cat}</span>
          ))}
        </div>
        <IntegrationsFloatButton tools={TOOLS} />
      </section>

      {/* FEATURES */}
      <section id='features' style={{ padding:'70px 24px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:44 }}>
          <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>PLATFORM</div>
          <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5 }}>One screen for your entire SOC</h2>
        </div>
        <div className='feat-grid' style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {FEATURES.map(f=>(
            <div key={f.title} style={{ padding:22, background:'rgba(16,22,40,0.85)', border:'1px solid rgba(0,180,240,0.13)', borderRadius:14, transition:'all .2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='#4f8fff25';(e.currentTarget as HTMLElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLElement).style.boxShadow='0 12px 32px rgba(79,143,255,0.08)';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='#1d2535';(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none';}}>
              <div style={{ fontSize:'1.5rem', marginBottom:10 }}>{f.icon}</div>
              <h3 style={{ fontSize:'0.9rem', fontWeight:700, marginBottom:6 }}>{f.title}</h3>
              <p style={{ fontSize:'0.76rem', color:'#6b7a94', lineHeight:1.7 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MSSP SECTION */}
      <section id='mssp' style={{ padding:'60px 24px', maxWidth:860, margin:'0 auto' }}>
        <div style={{ padding:36, background:'linear-gradient(145deg,#131929,#0d1018)', border:'1px solid #8b6fff18', borderRadius:18, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#8b6fff,#4f8fff)' }}/>
          <div style={{ position:'absolute', bottom:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(139,111,255,0.06)', filter:'blur(40px)', pointerEvents:'none' }}/>
          <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#8b6fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>FOR MSSPs</div>
          <h2 style={{ fontSize:'1.7rem', fontWeight:800, letterSpacing:-1, marginBottom:10 }}>Manage 50 clients from one console</h2>
          <p style={{ fontSize:'0.9rem', color:'#6b7a94', lineHeight:1.75, marginBottom:24 }}>Client health at a glance. Cross-client threat correlation. Per-client BYOK keys — each client's AI calls stay isolated under their own Anthropic account. White-label — your brand, zero Watchtower branding.</p>
          <div className='ot-grid' style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:24 }}>
            {[
              { icon:'📊', title:'Portfolio Dashboard', body:'Every client on one screen. Drill into any tenant in one click. Posture, alerts, incidents, coverage.' },
              { icon:'📈', title:'Sales Dashboard + AI GTM', body:'Set your MRR/ARR targets. AI generates the exact customer mix and go-to-market strategy to get there.' },
              { icon:'🔐', title:'Per-client BYOK isolation', body:'Each client gets their own Anthropic key. Zero cross-contamination of AI context between tenants.' },
              { icon:'🏷', title:'Full white-label', body:'Your logo, your domain, your brand. Clients see your product — not Watchtower.' },
            ].map(f=>(
              <div key={f.title} style={{ padding:'14px 16px', background:'rgba(139,111,255,0.06)', border:'1px solid #8b6fff18', borderRadius:10 }}>
                <div style={{ fontSize:'1rem', marginBottom:6 }}>{f.icon}</div>
                <div style={{ fontSize:'0.78rem', fontWeight:700, marginBottom:4 }}>{f.title}</div>
                <div style={{ fontSize:'0.72rem', color:'#6b7a94', lineHeight:1.6 }}>{f.body}</div>
              </div>
            ))}
          </div>
          <a href='/signup?plan=mssp' className='btn-primary' style={{ background:'#8b6fff' }}>Start MSSP trial →</a>
        </div>
      </section>

      {/* SECURITY / COMPLIANCE TRUST */}
      <section style={{ padding:'40px 24px', background:'#080b14', borderTop:'1px solid rgba(0,180,240,0.10)', borderBottom:'1px solid rgba(0,180,240,0.10)' }}>
        <div style={{ maxWidth:860, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4a5568', textTransform:'uppercase', letterSpacing:'2px', marginBottom:20 }}>BUILT FOR REGULATED INDUSTRIES</div>
          <div style={{ display:'flex', justifyContent:'center', gap:10, flexWrap:'wrap' }}>
            {[
              { label:'ISO 27001 Mapping', icon:'🛡' },
              { label:'NIS2 / DORA Ready', icon:'📋' },
              { label:'GDPR Art.17 Compliant', icon:'🔒' },
              { label:'BYOK — Your Keys', icon:'🔑' },
              { label:'Encrypted at Rest', icon:'💾' },
              { label:'SOC 2 Audit Trail', icon:'📝' },
              { label:'Per-Tenant Isolation', icon:'🏢' },
              { label:'UK Data Residency', icon:'🇬🇧' },
            ].map(b => (
              <div key={b.label} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', background:'#0d111e', border:'1px solid rgba(0,180,240,0.10)', borderRadius:20, fontSize:'0.72rem', color:'#6b7a94' }}>
                <span>{b.icon}</span>
                <span style={{ fontWeight:600 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OT ADD-ON */}
      <section id="ot" style={{ padding:'60px 24px', background:'#0a0d16', borderTop:'1px solid rgba(0,180,240,0.10)', borderBottom:'1px solid rgba(0,180,240,0.10)' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'4px 12px',background:'#22d49a10',border:'1px solid #22d49a25',borderRadius:20,fontSize:'0.68rem',color:'#22d49a',fontWeight:700,marginBottom:12 }}>ADD-ON</div>
            <h2 style={{ fontSize:'1.8rem', fontWeight:800, letterSpacing:-1.5, marginBottom:10 }}>🏭 OT / ICS Security</h2>
            <p style={{ fontSize:'0.88rem', color:'#6b7a94', lineHeight:1.75, maxWidth:560, margin:'0 auto' }}>For MSSPs serving operational technology clients. Purdue model zone map, Claroty/Nozomi/Dragos/Armis integration, OT-specific AI triage — AI that knows never to auto-isolate a live PLC.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:28 }} className="feat-grid">
            {[
              { icon:'🗺', title:'Purdue Model Map', desc:'Interactive L0–L4 zone diagram. Click any zone to drill into assets and active alerts. Cross-zone anomalies highlighted in real time.' },
              { icon:'⚙', title:'OT Asset Inventory', desc:'PLCs, RTUs, HMIs, SCADA servers, historians — separate from IT Coverage. Device status, firmware version, CVE count, protocol.' },
              { icon:'🧠', title:'OT-Safe APEX Triage', desc:'AI knows the difference between a PLC and a laptop. Never auto-isolates live process devices. Recommends plant engineer before any action.' },
              { icon:'🔌', title:'5 OT Integrations', desc:'Claroty CTD, Nozomi Vantage, Dragos Platform, Armis — plus direct Modbus/DNP3 protocol detection via network tap.' },
              { icon:'⚡', title:'Cross-zone Anomaly Detection', desc:'IT→OT bypass alerts. Flags traffic that crosses the L3.5 DMZ boundary unexpectedly. Real-time zone-to-zone traffic map.' },
              { icon:'📋', title:'IEC 62443 Posture', desc:'Active alerts mapped to IEC 62443 security levels. Zone-by-zone compliance posture. NERC CIP mapping for energy sector.' },
            ].map((f:any) => (
              <div key={f.title} style={{ padding:'18px 20px', background:'rgba(16,22,40,0.85)', border:'1px solid rgba(0,180,240,0.13)', borderRadius:12 }}>
                <div style={{ fontSize:'1.4rem', marginBottom:8 }}>{f.icon}</div>
                <div style={{ fontSize:'0.82rem', fontWeight:700, marginBottom:5 }}>{f.title}</div>
                <div style={{ fontSize:'0.72rem', color:'#6b7a94', lineHeight:1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', background:'rgba(16,22,40,0.85)', border:'1px solid #22d49a20', borderRadius:12, flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ fontSize:'0.72rem', color:'#22d49a', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', marginBottom:4 }}>OT ADD-ON PRICING</div>
              <div style={{ fontSize:'1.5rem', fontWeight:900, fontFamily:'JetBrains Mono,monospace' }}>£999<span style={{ fontSize:'0.78rem', fontWeight:400, color:'#6b7a94' }}>/mo flat</span> <span style={{ color:'#3a4a60' }}>+</span> £1<span style={{ fontSize:'0.78rem', fontWeight:400, color:'#6b7a94' }}>/OT device/mo</span></div>
              <div style={{ fontSize:'0.72rem', color:'#4a5568', marginTop:4 }}>Per OT tenant. Enable per client from the MSSP admin portal. Enterprise plan required.</div>
            </div>
            <a href='mailto:hello@getwatchtower.io?subject=OT Add-on Enquiry' style={{ padding:'10px 24px', borderRadius:9, background:'#22d49a', color:'#050810', fontWeight:700, fontSize:'0.84rem', textDecoration:'none', flexShrink:0 }}>Talk to us about OT →</a>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id='pricing' style={{ padding:'70px 24px', textAlign:'center' }}>
        <div style={{ fontSize:'0.62rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:10 }}>PRICING</div>
        <h2 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:-1.5, marginBottom:8 }}>Simple, transparent pricing</h2>
        <p style={{ color:'#6b7a94', fontSize:'0.88rem', marginBottom:32 }}>Start free. Upgrade as you grow. No hidden fees.</p>
        <div className='plan-grid' style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, maxWidth:1060, margin:'0 auto' }}>
          {PLANS.map(p=>(
            <div key={p.name} style={{ padding:24, background:'rgba(16,22,40,0.85)', border:`1px solid ${p.name==='Business'?p.color+'30':'#1d2535'}`, borderRadius:16, position:'relative', display:'flex', flexDirection:'column', gap:4, transition:'all .2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow=`0 20px 48px ${p.color}18`;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none';}}>
              {p.badge && <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', padding:'3px 12px', background:p.color, borderRadius:20, fontSize:'0.6rem', fontWeight:800, color:'#fff', whiteSpace:'nowrap' }}>{p.badge}</div>}
              <div style={{ fontSize:'0.64rem', fontWeight:700, color:p.color, textTransform:'uppercase', letterSpacing:'1px', marginBottom:6 }}>{p.name}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:3, marginBottom:2 }}>
                <span style={{ fontSize:'2rem', fontWeight:900, letterSpacing:-2, fontFamily:'JetBrains Mono,monospace', color:'#e8ecf4' }}>{annualBilling && (p as any).annualPrice ? (p as any).annualPrice : p.price}</span>
                <span style={{ fontSize:'0.72rem', color:'#4a5568' }}>{annualBilling && (p as any).annualPeriod ? (p as any).annualPeriod : p.period}</span>
              </div>
              {annualBilling && (p as any).annualPrice && p.price !== '£0' && (
                <div style={{ fontSize:'0.62rem', color:'#22d49a', fontWeight:700, marginBottom:4 }}>Save 15% vs monthly</div>
              )}
              <div style={{ height:1, background:'#1d2535', margin:'12px 0' }}/>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
                {p.features.map(f=>(
                  <div key={f} style={{ display:'flex', gap:7, alignItems:'flex-start' }}>
                    <span style={{ color:p.color, fontSize:'0.75rem', flexShrink:0, marginTop:1 }}>✓</span>
                    <span style={{ fontSize:'0.75rem', color:'#8a9ab0', lineHeight:1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href='/signup' style={{ display:'block', marginTop:20, padding:'10px 0', background:p.name==='Business'?p.color:'transparent', border:`1px solid ${p.color}${p.name==='Business'?'':'50'}`, borderRadius:9, color:p.name==='Business'?'#fff':p.color, fontSize:'0.78rem', fontWeight:700, textDecoration:'none', textAlign:'center', transition:'all .15s' }}
                onMouseEnter={e=>{if(p.name!=='Business'){(e.currentTarget as HTMLElement).style.background=p.color+'20';}}}
                onMouseLeave={e=>{if(p.name!=='Business'){(e.currentTarget as HTMLElement).style.background='transparent';}}}>
                {p.name==='Community'?'Start for free':'Get started →'}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* EMAIL CAPTURE + BOOK DEMO */}
      <section style={{ padding:'64px 24px', textAlign:'center' }}>
        <div style={{ maxWidth:640, margin:'0 auto' }}>
          <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'2px', marginBottom:14 }}>Get Started</div>
          <h2 style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-1.5px', marginBottom:12, lineHeight:1.1 }}>See it on your own alerts</h2>
          <p style={{ fontSize:'0.9rem', color:'#6b7a94', lineHeight:1.7, marginBottom:28, maxWidth:480, margin:'0 auto 28px' }}>Connect your first tool in under 5 minutes. Community tier is free forever — no credit card, no sales call.</p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <a href='/signup' style={{ padding:'12px 28px', borderRadius:9, background:'#4f8fff', color:'#fff', fontWeight:700, fontSize:'0.9rem', textDecoration:'none' }}>Start free →</a>
            <a href='mailto:hello@getwatchtower.io?subject=Demo+Request' style={{ padding:'12px 28px', borderRadius:9, border:'1px solid rgba(0,180,240,0.20)', background:'transparent', color:'#e8ecf4', fontWeight:600, fontSize:'0.9rem', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>
              📅 Book a live demo
            </a>
          </div>
          <div style={{ marginTop:16, fontSize:'0.72rem', color:'#3a4050' }}>No credit card · Community free forever · 14-day trial on paid plans</div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding:'64px 24px', background:'#0a0d16', borderTop:'1px solid rgba(0,180,240,0.10)' }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#4f8fff', textTransform:'uppercase', letterSpacing:'2px', marginBottom:14, textAlign:'center' }}>FAQ</div>
          <h2 style={{ fontSize:'1.9rem', fontWeight:900, letterSpacing:'-1.5px', marginBottom:36, lineHeight:1.1, textAlign:'center' }}>Common questions</h2>
          {[
            { q:`Does my alert data stay secure with AI analysis?`, a:`Yes. Watchtower uses a BYOK (Bring Your Own Key) model — your Anthropic API key is yours. Alert data is processed under your own Anthropic account, not a shared platform account. For MSSPs, each client gets their own key with complete data isolation between tenants.` },
            { q:`What if I do not use CrowdStrike or Splunk?`, a:`Watchtower connects to 80+ tools across 20 categories — including SentinelOne, Microsoft Defender, Elastic, QRadar, AWS Security Hub, Sophos, Vectra, Entra ID, Cisco Duo, Datadog, Panther, and many more. EDR, SIEM, XDR, Cloud, Identity, CSPM, AppSec, OT/ICS, SOAR, and ITSM are all covered. New integrations are added weekly based on customer requests.` },
            { q:`Is there a minimum commitment or contract?`, a:`No. All plans are month-to-month. Community is free forever. Paid plans include a 14-day free trial with no credit card required. Cancel any time — no lock-in, no exit fees.` },
            { q:`How long does setup take?`, a:`Most teams connect their first tool and see live alerts within 15 minutes. Adding your Anthropic API key (or each client's key for MSSPs) takes another 2 minutes. Full onboarding — connecting 3–5 tools and configuring notifications — typically takes under an hour.` },
            { q:`Can community users access AI triage?`, a:`Community users see AI triage verdicts in read-only mode — the verdict and confidence score are visible without the evidence chain. Full AI Co-Pilot, response automation, and blast radius analysis require Essentials or above.` },
            { q:`Do you support NIS2 and DORA compliance reporting?`, a:`Yes. Watchtower maps active alerts to ISO 27001, Cyber Essentials, NIS2, and DORA control frameworks automatically. The Professional and Enterprise plans include PDF board-ready compliance reports and NIS2/DORA export format.` },
          ].map((item, i) => (
            <details key={i} style={{ padding:'16px 0', borderBottom:'1px solid #141820', cursor:'pointer' }}>
              <summary style={{ fontSize:'0.9rem', fontWeight:700, lineHeight:1.4, listStyle:'none', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                {item.q}
                <span style={{ color:'#4f8fff', fontSize:'1rem', flexShrink:0 }}>+</span>
              </summary>
              <p style={{ fontSize:'0.82rem', color:'#6b7a94', lineHeight:1.75, marginTop:12, paddingRight:24 }}>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'70px 24px', textAlign:'center', background:'rgba(10,14,28,0.90)', borderTop:'1px solid rgba(0,180,240,0.10)' }}>
        <div style={{ maxWidth:580, margin:'0 auto' }}>
          <h2 style={{ fontSize:'2.2rem', fontWeight:900, letterSpacing:-2, marginBottom:14, lineHeight:1.1 }}>Stop triaging alerts.<br/>Start doing security work.</h2>
          <p style={{ fontSize:'0.95rem', color:'#6b7a94', lineHeight:1.75, marginBottom:32 }}>Start for free today. Connect your first tool in under 5 minutes.</p>
          <a href='/signup' className='btn-primary' style={{ fontSize:'1rem', padding:'14px 36px' }}>Get started free →</a>
          <div style={{ marginTop:14, fontSize:'0.72rem', color:'#3a4a60' }}>No credit card · Community plan free forever · Essentials from £149/seat/mo</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className='footer-wrap' style={{ padding:'32px 24px', borderTop:'1px solid rgba(0,180,240,0.10)', display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:1100, margin:'0 auto', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect width="22" height="22" rx="6" fill="url(#fg)"/>
            <path d="M11 4L17.5 7V11.5C17.5 14.5 14.8 17.5 11 18.5C7.2 17.5 4.5 14.5 4.5 11.5V7L11 4Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
            <path d="M9.5 11.5L11 13L13.5 10" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="fg" x1="0" y1="0" x2="22" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/></linearGradient></defs>
          </svg>
          <span style={{ fontWeight:700, fontSize:'0.88rem' }}>Watchtower</span>
          <span style={{ color:'#2a3448', marginLeft:8, fontSize:'0.72rem' }}>© 2026 Watchtower Ltd</span>
        </div>
        <div className='footer-links' style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
          {[{l:'Privacy',h:'/privacy'},{l:'Terms',h:'/terms'},{l:'Security',h:'/security'},{l:'Press',h:'/press'},{l:'Blog',h:'/blog'},{l:'Changelog',h:'/changelog'},{l:'Docs',h:'/docs'},{l:'Demo',h:'/demo'}].map(({l,h})=><a key={l} href={h} style={{color:'#4a5568',fontSize:'0.76rem',textDecoration:'none'}} onMouseEnter={e=>{(e.target as HTMLElement).style.color='#8a9ab0';}} onMouseLeave={e=>{(e.target as HTMLElement).style.color='#4a5568';}}>{l}</a>)}
        </div>
      </footer>
    </main>
  );
}
