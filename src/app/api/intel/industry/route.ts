import { NextRequest, NextResponse } from 'next/server';
import { getAnthropicKey } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

const VALID_INDUSTRIES = new Set([
  'Financial Services', 'Healthcare', 'Retail & eCommerce', 'Manufacturing',
  'Energy & Utilities', 'Government & Public Sector', 'Technology & SaaS',
  'Legal & Professional Services', 'Education', 'Media & Entertainment'
]);

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 intel requests per user per minute
    const userId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
    const rl = await checkRateLimit(`intel:${userId}`, 10, 60);
    if (!rl.ok) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json() as { industry?: unknown };
    if (!body || typeof body.industry !== 'string') {
      return NextResponse.json({ error: 'industry required' }, { status: 400 });
    }
    
    // Validate against allowlist
    const { industry } = body;
    if (!VALID_INDUSTRIES.has(industry)) {
      return NextResponse.json({ error: 'Invalid industry value' }, { status: 400 });
    }

    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const apiKey = await getAnthropicKey(tenantId);
    if (!apiKey) {
      return NextResponse.json({ ok: false, items: [], message: 'No API key configured' });
    }

    const prompt = `Generate 3 current threat intelligence items specifically relevant to ${industry} organizations. 
Return valid JSON array only, no markdown. Each item: { id, title, summary, severity (Critical/High/Medium/Low), source, time, iocs (array of strings), mitre (technique ID), industrySpecific: true }`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', max_tokens: 1500,
        system: 'You are a threat intelligence analyst. Return only valid JSON, no markdown.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) return NextResponse.json({ ok: false, items: [] });
    const data = await resp.json() as { content: Array<{ type: string; text: string }> };
    const text = data.content?.find((b: any) => b.type === 'text')?.text || '[]';
    
    try {
      const items = JSON.parse(text.replace(/```json?|```/g, '').trim());
      return NextResponse.json({ ok: true, items: Array.isArray(items) ? items : [] });
    } catch {
      return NextResponse.json({ ok: false, items: [] });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
