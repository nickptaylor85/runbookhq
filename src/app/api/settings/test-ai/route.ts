import { NextResponse } from 'next/server';
import { getAnthropicKey } from '@/lib/redis';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tenantId = cookieStore.get('wt_tenant')?.value || 'global';
    const apiKey = await getAnthropicKey(tenantId);
    if (!apiKey) {
      return NextResponse.json({ ok: false, configured: false, message: 'No API key found. Add your Anthropic key below.', tenantId });
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [{ role: 'user', content: 'ok' }] }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ ok: false, configured: true, message: `Key invalid: ${data.error?.message || 'Auth failed'}`, tenantId });
    const source = process.env.ANTHROPIC_API_KEY ? 'environment variable' : `Redis (tenant: ${tenantId})`;
    return NextResponse.json({ ok: true, configured: true, message: `API key valid ✓ (${source})`, tenantId });
  } catch(e: any) {
    return NextResponse.json({ ok: false, configured: false, message: `Error: ${e.message}` });
  }
}
