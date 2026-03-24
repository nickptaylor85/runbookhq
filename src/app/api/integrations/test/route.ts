import { NextRequest, NextResponse } from 'next/server';
import { ADAPTERS } from '@/lib/integrations';
import { validateCredentials } from '@/lib/ssrf';
import { checkRateLimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 tests/min per user
    const userId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
    const rl = await checkRateLimit(`test:${userId}`, 10, 60);
    if (!rl.ok) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });
    }

    const body = await req.json() as { id: unknown; credentials: unknown };
    
    // Validate input
    if (!body || typeof body.id !== 'string' || body.id.length > 50) {
      return NextResponse.json({ ok: false, message: 'Invalid tool ID' }, { status: 400 });
    }
    if (typeof body.credentials !== 'object' || !body.credentials || Array.isArray(body.credentials)) {
      return NextResponse.json({ ok: false, message: 'credentials must be an object' }, { status: 400 });
    }

    const { id, credentials } = body as { id: string; credentials: Record<string, string> };

    // SSRF protection — validate any URL fields
    const ssrfCheck = validateCredentials(id, credentials);
    if (!ssrfCheck.ok) {
      return NextResponse.json({ ok: false, message: `Security check failed: ${ssrfCheck.error}` }, { status: 400 });
    }

    const adapter = ADAPTERS[id];
    if (!adapter) {
      return NextResponse.json({ ok: false, message: 'Unknown integration' }, { status: 400 });
    }
    
    const result = await adapter.testConnection(credentials);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
