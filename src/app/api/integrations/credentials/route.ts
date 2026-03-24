import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet, KEYS } from '@/lib/redis';
import { encrypt, decrypt } from '@/lib/encrypt';

function getTenantId(req: NextRequest): string {
  // Read from middleware-injected header (verified server-side)
  return req.headers.get('x-tenant-id') || 'global';
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const raw = await redisGet(KEYS.TOOL_CREDS(tenantId));
    if (!raw) return NextResponse.json({ ok: true, connected: {} });
    
    // Decrypt the stored blob
    const decrypted = decrypt(raw);
    const connected = JSON.parse(decrypted) as Record<string, Record<string, string>>;
    
    // Strip secrets from the GET response — return only non-secret fields
    const safe: Record<string, Record<string, string>> = {};
    for (const [id, creds] of Object.entries(connected)) {
      safe[id] = {};
      for (const [k, v] of Object.entries(creds)) {
        const isSecret = /secret|password|token|key|private/i.test(k);
        safe[id][k] = isSecret ? '••••••••' : v;
      }
    }
    return NextResponse.json({ ok: true, connected: safe });
  } catch (e: any) {
    return NextResponse.json({ ok: true, connected: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { toolId: unknown; credentials: unknown };
    
    // Input validation
    if (!body || typeof body.toolId !== 'string' || body.toolId.length > 50) {
      return NextResponse.json({ error: 'Invalid toolId' }, { status: 400 });
    }
    if (body.credentials !== null && (typeof body.credentials !== 'object' || Array.isArray(body.credentials))) {
      return NextResponse.json({ error: 'credentials must be an object or null' }, { status: 400 });
    }

    const { toolId, credentials } = body as { toolId: string; credentials: Record<string, string> | null };
    const tenantId = getTenantId(req);
    
    // Load existing (decrypt first)
    const raw = await redisGet(KEYS.TOOL_CREDS(tenantId));
    const existing = raw ? JSON.parse(decrypt(raw)) as Record<string, Record<string, string>> : {};
    
    if (credentials === null) {
      delete existing[toolId];
    } else {
      // Sanitize credential values — max 500 chars each, string only
      const sanitized: Record<string, string> = {};
      for (const [k, v] of Object.entries(credentials)) {
        if (typeof k === 'string' && typeof v === 'string' && k.length < 50 && v.length < 500) {
          sanitized[k] = v;
        }
      }
      existing[toolId] = sanitized;
    }
    
    // Encrypt before storing
    const encrypted = encrypt(JSON.stringify(existing));
    await redisSet(KEYS.TOOL_CREDS(tenantId), encrypted);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
