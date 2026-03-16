import { NextResponse } from 'next/server';
import { loadToolConfigs, saveToolConfigs } from '@/lib/config-store';
import { getTenantFromRequest } from '@/lib/config-store';

const INDUSTRIES = ['Healthcare','Financial Services','Government','Education','Manufacturing','Retail','Energy & Utilities','Technology','Legal','Construction','Transportation','Telecommunications'];

export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const { searchParams } = new URL(req.url);
  const industry = searchParams.get('industry');

  // Load saved industry preference
  const configs = await loadToolConfigs(tenantId || undefined);
  const savedIndustry = configs.tools?.settings?.credentials?.INDUSTRY || null;
  const activeIndustry = industry || savedIndustry || null;

  if (!activeIndustry) {
    return NextResponse.json({ industries: INDUSTRIES, selected: null, intel: [] });
  }

  // Check for Anthropic key
  const apiKey = configs.tools?.anthropic?.credentials?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ industries: INDUSTRIES, selected: activeIndustry, intel: getDemoIntel(activeIndustry), demo: true });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: `Today is ${today}. Search for the latest cybersecurity threats, vulnerabilities, and attack campaigns specifically targeting the ${activeIndustry} industry in the last 7 days. Then return ONLY a JSON array (no markdown, no backticks) of 5-8 threat intel items, each with: {"id": "unique", "title": "threat title", "severity": "critical|high|medium|low", "type": "ransomware|apt|vulnerability|phishing|malware|data_breach|supply_chain|insider", "summary": "2-3 sentence summary", "iocs": ["any IOCs mentioned"], "mitre": ["relevant MITRE techniques"], "source": "source name", "url": "source article URL if found", "date": "YYYY-MM-DD", "industry_relevance": "why this matters for ${activeIndustry}"}` }],
      }),
    });
    const data = await res.json();
    
    // Extract text from response (may have tool use blocks)
    let text = '';
    (data.content || []).forEach((block: any) => {
      if (block.type === 'text') text += block.text;
    });

    try {
      // Try to parse JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const intel = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ industries: INDUSTRIES, selected: activeIndustry, intel, demo: false, date: today });
      }
    } catch (e) {}

    // If parsing failed, return with raw text
    return NextResponse.json({ industries: INDUSTRIES, selected: activeIndustry, intel: getDemoIntel(activeIndustry), demo: true, _raw: text.substring(0, 500) });
  } catch (e) {
    return NextResponse.json({ industries: INDUSTRIES, selected: activeIndustry, intel: getDemoIntel(activeIndustry), demo: true, error: String(e) });
  }
}

export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const { industry } = await req.json();
  // Save industry preference to Redis
  const configs = await loadToolConfigs(tenantId || undefined);
  if (!configs.tools.settings) configs.tools.settings = { id: 'settings', enabled: true, credentials: {} };
  configs.tools.settings.credentials.INDUSTRY = industry;
  configs.updatedAt = new Date().toISOString();
  await saveToolConfigs(configs);
  return NextResponse.json({ ok: true, industry });
}

function getDemoIntel(industry: string): any[] {
  const threats: Record<string, any[]> = {
    'Healthcare': [
      { id: 'ti1', title: 'Black Basta ransomware targeting healthcare providers', severity: 'critical', type: 'ransomware', summary: 'Black Basta affiliates exploiting unpatched VPN gateways to deploy ransomware across healthcare networks. Multiple US hospitals affected in the last week.', iocs: ['185.220.101.42'], mitre: ['T1190','T1486'], source: 'CISA', date: new Date().toISOString().split('T')[0], industry_relevance: 'Direct targeting of healthcare organisations for ransomware due to high willingness to pay and critical patient data.' },
      { id: 'ti2', title: 'Critical vulnerability in medical device DICOM servers', severity: 'critical', type: 'vulnerability', summary: 'CVE-2025-XXXX allows remote code execution on Philips DICOM servers used in radiology departments. Patch available.', iocs: [], mitre: ['T1190','T1210'], source: 'ICS-CERT', date: new Date().toISOString().split('T')[0], industry_relevance: 'Directly affects medical imaging infrastructure. Patient safety risk if imaging systems are compromised.' },
      { id: 'ti3', title: 'Phishing campaign impersonating NHS/CMS portals', severity: 'high', type: 'phishing', summary: 'Credential harvesting campaign using fake healthcare portal login pages. Targeting administrative staff with "urgent compliance" lures.', iocs: ['update-nhs-portal.com','cms-verify-login.com'], mitre: ['T1566.001','T1078'], source: 'PhishTank', date: new Date().toISOString().split('T')[0], industry_relevance: 'Healthcare admin staff are primary targets. Compromised credentials lead to patient data access.' },
      { id: 'ti4', title: 'Medusa ransomware variant with healthcare-specific encryption', severity: 'high', type: 'ransomware', summary: 'New Medusa variant specifically targets electronic health record (EHR) databases and PACS systems. Leaves clinical workstations functional to delay detection.', iocs: [], mitre: ['T1486','T1490'], source: 'Mandiant', date: new Date().toISOString().split('T')[0], industry_relevance: 'Specifically engineered to target healthcare IT infrastructure while avoiding detection.' },
      { id: 'ti5', title: 'Supply chain compromise in pharmacy management software', severity: 'medium', type: 'supply_chain', summary: 'Trojanised update to a widely-used pharmacy management platform detected. Exfiltrates prescription data and patient PII.', iocs: [], mitre: ['T1195.002','T1567'], source: 'SentinelLabs', date: new Date().toISOString().split('T')[0], industry_relevance: 'Pharmacy systems contain controlled substance records and patient data. Regulatory reporting required.' },
    ],
    'Financial Services': [
      { id: 'ti1', title: 'Lazarus Group targeting banking SWIFT infrastructure', severity: 'critical', type: 'apt', summary: 'North Korean APT Lazarus Group conducting new campaign against SWIFT messaging systems. Using watering hole attacks on financial sector websites.', iocs: ['91.215.85.14'], mitre: ['T1189','T1071'], source: 'FBI Flash Alert', date: new Date().toISOString().split('T')[0], industry_relevance: 'Direct threat to banking transaction infrastructure. SWIFT systems are primary target for financial theft.' },
      { id: 'ti2', title: 'AI-powered voice deepfake used in $25M wire fraud', severity: 'critical', type: 'phishing', summary: 'Threat actors using AI-generated voice deepfakes to impersonate CFOs and authorise fraudulent wire transfers. Three major incidents this week.', iocs: [], mitre: ['T1566.004','T1656'], source: 'FS-ISAC', date: new Date().toISOString().split('T')[0], industry_relevance: 'Financial institutions are primary targets for wire fraud. Voice verification processes need immediate review.' },
      { id: 'ti3', title: 'Critical vulnerability in trading platform API', severity: 'high', type: 'vulnerability', summary: 'Authentication bypass in widely-used trading platform API allows unauthorised order placement. Affects 200+ broker-dealers.', iocs: [], mitre: ['T1190','T1078'], source: 'SEC Alert', date: new Date().toISOString().split('T')[0], industry_relevance: 'Could enable market manipulation or unauthorised trading. Immediate patching required for regulatory compliance.' },
      { id: 'ti4', title: 'QakBot resurfaces targeting financial sector', severity: 'high', type: 'malware', summary: 'QakBot trojan has re-emerged with new evasion techniques, specifically targeting financial institutions via HTML smuggling in invoice-themed emails.', iocs: [], mitre: ['T1566.001','T1027'], source: 'Proofpoint', date: new Date().toISOString().split('T')[0], industry_relevance: 'Financial services remain the top target for banking trojans. Invoice-themed lures are highly effective in finance.' },
      { id: 'ti5', title: 'Insider threat: Former employee data exfiltration', severity: 'medium', type: 'insider', summary: 'Pattern of departing financial analysts exfiltrating client portfolio data via personal cloud storage. Three incidents reported to regulators this month.', iocs: [], mitre: ['T1567.002','T1048'], source: 'FS-ISAC', date: new Date().toISOString().split('T')[0], industry_relevance: 'Client data protection is a regulatory requirement. DLP and access review processes need strengthening.' },
    ],
  };
  // Default threats for any industry
  const defaults = [
    { id: 'ti1', title: `Ransomware campaigns actively targeting ${industry}`, severity: 'critical', type: 'ransomware', summary: `Multiple ransomware groups including LockBit and BlackSuit are actively targeting ${industry} organisations through VPN and RDP exploitation.`, iocs: [], mitre: ['T1190','T1486'], source: 'CISA', date: new Date().toISOString().split('T')[0], industry_relevance: `${industry} organisations are increasingly targeted due to operational disruption potential.` },
    { id: 'ti2', title: 'Critical zero-day in enterprise VPN appliances', severity: 'critical', type: 'vulnerability', summary: 'Active exploitation of zero-day vulnerability in Ivanti and Fortinet VPN products. Emergency patches available.', iocs: ['103.75.190.12'], mitre: ['T1190','T1133'], source: 'CISA KEV', date: new Date().toISOString().split('T')[0], industry_relevance: 'VPN appliances are the primary remote access point. Exploitation leads to full network compromise.' },
    { id: 'ti3', title: 'Business email compromise surge using AI-generated content', severity: 'high', type: 'phishing', summary: 'Significant increase in BEC attacks using AI to generate convincing email threads. Average loss per incident: $125,000.', iocs: [], mitre: ['T1566.001','T1534'], source: 'IC3', date: new Date().toISOString().split('T')[0], industry_relevance: `${industry} finance teams are primary targets for invoice fraud and payment diversion.` },
    { id: 'ti4', title: 'Supply chain attack via compromised npm/PyPI packages', severity: 'high', type: 'supply_chain', summary: 'Malicious packages discovered in npm and PyPI repositories targeting developer environments. Exfiltrates environment variables and SSH keys.', iocs: [], mitre: ['T1195.001','T1059'], source: 'Snyk', date: new Date().toISOString().split('T')[0], industry_relevance: 'Any organisation using open-source software is at risk. Developer workstations often have elevated access.' },
    { id: 'ti5', title: 'DNS tunnelling used for data exfiltration', severity: 'medium', type: 'malware', summary: 'Increase in DNS tunnelling techniques to bypass network security controls. Often used in conjunction with Cobalt Strike beacons.', iocs: [], mitre: ['T1572','T1071.004'], source: 'Recorded Future', date: new Date().toISOString().split('T')[0], industry_relevance: 'DNS-based exfiltration can bypass traditional network monitoring. Check for anomalous DNS query patterns.' },
  ];
  return threats[industry] || defaults;
}
