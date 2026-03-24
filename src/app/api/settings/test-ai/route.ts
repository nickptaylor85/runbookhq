import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey } from '@/lib/redis';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const apiKey = await getAnthropicKey(tenantId);
    if (!apiKey) {
      return NextResponse.json({ ok: false, configured: false, message: 'No API key found. Add your Anthropic key below.' });
    }
    // Quick test call
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 10, messages: [{ role: 'user', content: 'ping' }] }),
    });
    if (!resp.ok) {
      const err = await resp.json() as { error?: { message?: string } };
      return NextResponse.json({ ok: false, configured: true, message: err?.error?.message || 'Key invalid' });
    }
    // NOTE: tenantId intentionally NOT returned to client
    return NextResponse.json({ ok: true, configured: true, message: 'Anthropic API key is working.' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, configured: false, message: 'Could not reach Anthropic API' });
  }
}
