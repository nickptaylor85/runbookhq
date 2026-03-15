import { NextResponse } from 'next/server';
import { tenableHeaders } from '@/lib/api-clients';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pid = searchParams.get('pid') || '205452';
  
  const headers = await tenableHeaders();
  if (!headers) return NextResponse.json({ error: 'No creds' });

  const results: any = { pid, attempts: [] };

  // Attempt 1: workbenches/assets with plugin_id filter
  try {
    const url1 = `https://cloud.tenable.com/workbenches/assets?filter.0.filter=plugin_id&filter.0.quality=eq&filter.0.value=${pid}`;
    const res1 = await fetch(url1, { headers, cache: 'no-store' });
    const data1 = await res1.json();
    results.attempts.push({ method: 'workbenches/assets filter', status: res1.status, assetCount: data1.assets?.length || 0, sample: (data1.assets || []).slice(0, 2).map((a: any) => ({ hostname: a.agent_name?.[0] || a.hostname?.[0] || a.ipv4?.[0], os: a.operating_system?.[0] })), error: data1.error });
  } catch (e) { results.attempts.push({ method: 'workbenches/assets filter', error: String(e) }); }

  // Attempt 2: workbenches/vulnerabilities/{pid}/outputs
  try {
    const url2 = `https://cloud.tenable.com/workbenches/vulnerabilities/${pid}/outputs`;
    const res2 = await fetch(url2, { headers, cache: 'no-store' });
    const data2 = await res2.json();
    results.attempts.push({ method: 'vuln outputs', status: res2.status, outputCount: data2.outputs?.length || 0, sampleKeys: data2.outputs?.[0] ? Object.keys(data2.outputs[0]) : [], sample: (data2.outputs || []).slice(0, 1) });
  } catch (e) { results.attempts.push({ method: 'vuln outputs', error: String(e) }); }

  // Attempt 3: workbenches/assets/vulnerabilities (different endpoint)
  try {
    const url3 = `https://cloud.tenable.com/workbenches/vulnerabilities/${pid}/outputs?date_range=30`;
    const res3 = await fetch(url3, { headers, cache: 'no-store' });
    const data3 = await res3.json();
    results.attempts.push({ method: 'vuln outputs date_range', status: res3.status, outputCount: data3.outputs?.length || 0, sample: JSON.stringify(data3).substring(0, 500) });
  } catch (e) { results.attempts.push({ method: 'vuln outputs date_range', error: String(e) }); }

  return NextResponse.json(results);
}
