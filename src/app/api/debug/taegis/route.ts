import { NextResponse } from 'next/server';
import { loadToolConfigs } from '@/lib/config-store';

const REGIONS: Record<string, string> = {
  'us': 'https://api.ctpx.secureworks.com',
  'us2': 'https://api.delta.taegis.secureworks.com',
  'us3': 'https://api.foxtrot.taegis.secureworks.com',
  'eu': 'https://api.echo.taegis.secureworks.com',
  'eu2': 'https://api.golf.taegis.secureworks.com',
};

export async function GET() {
  const configs = await loadToolConfigs();
  const creds = configs.tools?.taegis?.credentials || {};
  const clientId = creds.TAEGIS_CLIENT_ID || '';
  const clientSecret = creds.TAEGIS_CLIENT_SECRET || '';
  const savedRegion = creds.TAEGIS_REGION || 'us';

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'No Taegis credentials in Redis' });
  }

  const results: any = { savedRegion, clientIdLength: clientId.length, attempts: [] };

  // Try all regions with form-encoded body
  for (const [region, base] of Object.entries(REGIONS)) {
    try {
      const res = await fetch(base + '/auth/api/v2/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`,
      });
      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = text.substring(0, 200); }
      results.attempts.push({
        region, base, method: 'form-body',
        status: res.status,
        ok: res.ok,
        hasToken: !!parsed?.access_token,
        response: typeof parsed === 'string' ? parsed : JSON.stringify(parsed).substring(0, 200),
      });
      if (parsed?.access_token) break; // Found it
    } catch (e) {
      results.attempts.push({ region, base, method: 'form-body', error: String(e) });
    }
  }

  // If none worked, try Basic auth on saved region
  const base = REGIONS[savedRegion] || REGIONS['us'];
  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch(base + '/auth/api/v2/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${basic}` },
      body: 'grant_type=client_credentials',
    });
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text.substring(0, 200); }
    results.attempts.push({
      region: savedRegion, base, method: 'basic-auth',
      status: res.status,
      ok: res.ok,
      hasToken: !!parsed?.access_token,
      response: typeof parsed === 'string' ? parsed : JSON.stringify(parsed).substring(0, 200),
    });
  } catch (e) {
    results.attempts.push({ region: savedRegion, base, method: 'basic-auth', error: String(e) });
  }

  // Also try JSON body
  try {
    const res = await fetch(base + '/auth/api/v2/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    });
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text.substring(0, 200); }
    results.attempts.push({
      region: savedRegion, base, method: 'json-body',
      status: res.status,
      ok: res.ok,
      hasToken: !!parsed?.access_token,
      response: typeof parsed === 'string' ? parsed : JSON.stringify(parsed).substring(0, 200),
    });
  } catch (e) {
    results.attempts.push({ region: savedRegion, base, method: 'json-body', error: String(e) });
  }

  return NextResponse.json(results);
}
