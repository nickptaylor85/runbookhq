import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: any = { feeds: [], updatedAt: new Date().toISOString() };

  // CISA Known Exploited Vulnerabilities (no key needed)
  try {
    const r = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', { next: { revalidate: 3600 } });
    if (r.ok) {
      const d = await r.json();
      const recent = (d.vulnerabilities || []).slice(-10).reverse().map((v: any) => ({
        type: 'cve', source: 'CISA KEV', severity: 'critical',
        title: v.cveID + ': ' + v.vulnerabilityName,
        detail: v.shortDescription,
        vendor: v.vendorProject, product: v.product,
        dateAdded: v.dateAdded, dueDate: v.dueDate,
        action: v.requiredAction,
        link: 'https://nvd.nist.gov/vuln/detail/' + v.cveID,
      }));
      results.feeds.push({ name: 'CISA KEV', count: d.vulnerabilities?.length || 0, items: recent, ok: true });
    }
  } catch(e) { results.feeds.push({ name: 'CISA KEV', ok: false, error: String(e) }); }

  // Abuse.ch ThreatFox — recent IOCs (no key needed)
  try {
    const r = await fetch('https://threatfox-api.abuse.ch/api/v1/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'get_iocs', days: 1 }),
    });
    if (r.ok) {
      const d = await r.json();
      const iocs = (d.data || []).slice(0, 10).map((ioc: any) => ({
        type: 'ioc', source: 'ThreatFox', severity: ioc.threat_type === 'botnet_cc' ? 'critical' : 'high',
        title: (ioc.threat_type_desc || ioc.threat_type) + ': ' + ioc.ioc_value,
        detail: (ioc.malware_printable || '') + (ioc.tags?.length ? ' — ' + ioc.tags.join(', ') : ''),
        malware: ioc.malware_printable, iocType: ioc.ioc_type,
        confidence: ioc.confidence_level,
        link: 'https://threatfox.abuse.ch/ioc/' + ioc.id + '/',
      }));
      results.feeds.push({ name: 'ThreatFox', count: d.data?.length || 0, items: iocs, ok: true });
    }
  } catch(e) { results.feeds.push({ name: 'ThreatFox', ok: false, error: String(e) }); }

  // Abuse.ch URLhaus — recent malware URLs (no key)
  try {
    const r = await fetch('https://urlhaus-api.abuse.ch/v1/urls/recent/limit/10/');
    if (r.ok) {
      const d = await r.json();
      const urls = (d.urls || []).slice(0, 8).map((u: any) => ({
        type: 'url', source: 'URLhaus', severity: 'high',
        title: 'Malware URL: ' + (u.url_status || '') + ' — ' + (u.threat || 'unknown'),
        detail: u.url + ' (' + (u.tags?.join(', ') || 'untagged') + ')',
        tags: u.tags, status: u.url_status,
        link: 'https://urlhaus.abuse.ch/url/' + u.id + '/',
      }));
      results.feeds.push({ name: 'URLhaus', count: d.urls?.length || 0, items: urls, ok: true });
    }
  } catch(e) { results.feeds.push({ name: 'URLhaus', ok: false, error: String(e) }); }

  return NextResponse.json(results);
}
