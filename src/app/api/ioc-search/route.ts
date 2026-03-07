import { NextResponse } from 'next/server';
import { DEMO_DEFENDER_ALERTS, DEMO_TAEGIS_ALERTS, DEMO_TENABLE_VULNS, DEMO_ZSCALER } from '@/lib/demo-data';

// In production, this would fan out to each tool's API
// For now, searches demo data and returns matches per tool
export async function POST(req: Request) {
  const { ioc } = await req.json();
  if (!ioc || ioc.length < 3) return NextResponse.json({ error: 'IOC too short' }, { status: 400 });

  const q = ioc.toLowerCase().trim();
  const results: any[] = [];

  // Check alerts (Defender + Taegis)
  [...DEMO_DEFENDER_ALERTS, ...DEMO_TAEGIS_ALERTS].forEach(a => {
    if (a.title.toLowerCase().includes(q) || a.device?.toLowerCase().includes(q) || a.user?.toLowerCase().includes(q) || a.mitre?.toLowerCase().includes(q)) {
      results.push({ tool: a.source, type: 'alert', match: a.title, severity: a.severity, detail: `Device: ${a.device || 'N/A'} | User: ${a.user || 'N/A'}`, timestamp: a.timestamp });
    }
  });

  // Check Tenable vulns
  DEMO_TENABLE_VULNS.topCritical.forEach(v => {
    if (v.id.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)) {
      results.push({ tool: 'Tenable', type: 'vulnerability', match: `${v.id}: ${v.name}`, severity: 'critical', detail: `CVSS ${v.cvss} | ${v.hosts} hosts | EPSS ${(v.epss * 100).toFixed(0)}%`, timestamp: v.firstSeen });
    }
  });

  // Check IPs (demo: known bad IPs)
  const knownIPs: Record<string, any> = {
    '185.220.101.42': { tool: 'Zscaler ZIA', type: 'blocked_ip', match: 'C2 server — blocked', severity: 'critical', detail: 'Blocked 47 connection attempts in last 24h' },
    '91.215.85.14': { tool: 'Darktrace', type: 'anomaly', match: 'DNS tunnel endpoint', severity: 'high', detail: 'Unusual DNS query patterns detected' },
    '103.75.190.12': { tool: 'Recorded Future', type: 'intel', match: 'Known ransomware infrastructure', severity: 'critical', detail: 'Risk score: 92/100 | Associated with BlackSuit' },
  };
  Object.entries(knownIPs).forEach(([ip, info]) => {
    if (ip.includes(q) || q.includes(ip.split('.').slice(0, 3).join('.'))) {
      results.push({ ...info, timestamp: new Date().toISOString() });
    }
  });

  // Check domains
  const knownDomains: Record<string, any> = {
    'update-microsoft-365.com': { tool: 'Zscaler ZIA', type: 'blocked_domain', match: 'Credential phishing domain — blocked', severity: 'high', detail: 'Spoofing O365 login. 3 users attempted access.' },
    'evil.corp': { tool: 'Recorded Future', type: 'intel', match: 'Sanctioned entity domain', severity: 'critical', detail: 'OFAC sanctioned. Associated with Dridex.' },
  };
  Object.entries(knownDomains).forEach(([d, info]) => {
    if (d.includes(q)) results.push({ ...info, timestamp: new Date().toISOString() });
  });

  // Check hashes
  if (q.length >= 32) {
    results.push({ tool: 'Defender MDE', type: 'file_hash', match: 'Hash lookup', severity: 'info', detail: q.length === 64 ? 'SHA-256 — checking VirusTotal, MDE, S1...' : 'MD5 — checking across all EDR tools...', timestamp: new Date().toISOString() });
  }

  return NextResponse.json({ ioc: q, resultCount: results.length, results, demo: true });
}
