import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey } from '@/lib/redis';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { prompt, messages } = await req.json();
    const cookieStore = cookies();
    const tenantId = cookieStore.get('wt_tenant')?.value || 'global';
    const apiKey = await getAnthropicKey(tenantId);
    if (!apiKey) {
      return NextResponse.json({ ok: false, message: 'No Anthropic API key configured. Add your key in the Tools tab.' }, { status: 503 });
    }
    const msgArray = messages || [{ role: 'user', content: prompt || 'Hello' }];
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: 'You are an expert SOC analyst and security engineer. Be concise, technical, and actionable. No markdown formatting — plain text only.',
        messages: msgArray,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Anthropic error:', data);
      return NextResponse.json({ ok: false, message: data.error?.message || 'AI request failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, response: data.content?.[0]?.text || '' });
  } catch(e: any) {
    console.error('Copilot error:', e.message);
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
