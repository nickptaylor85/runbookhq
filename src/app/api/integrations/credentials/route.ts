import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet, KEYS } from '@/lib/redis';
import { encrypt, decrypt } from '@/lib/encrypt';

function getTenantId(req: NextRequest): string {
  // Read from middleware-injected header (verified server-side)
  const tid = req.headers.get('x-tenant-id');
  if (!tid) return 'global'; // middleware always sets this
  return tid;
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const raw = await redisGet(KEYS.TOOL_CREDS(tenantId));
    if (!raw) return NextResponse.json({ ok: true, connected: {} });
    
    // Decrypt the stored blob
    const decrypted = decrypt(raw);
    const connected = JSON.parse(decrypted) as Record<string, Record<string, string>>;
    
    // Strip credentials from GET response — only return URL/config fields
    // Everything except host/region/platform URLs is masked
    const safe: Record<string, Record<string, string>> = {};
    for (const [id, creds] of Object.entries(connected)) {
      safe[id] = {};
      for (const [k, v] of Object.entries(creds)) {
        // Only return non-sensitive config fields (URLs, regions, non-secret identifiers)
        const isSafe = /^(host|base_url|platform|cloud|domain|api_endpoint|region|space|org_key)$/.test(k);
        safe[id][k] = isSafe ? v : '••••••••';
      }
    }
    return NextResponse.json({ ok: true, connected: safe });
  } catch (e: any) {
    return NextResponse.json({ ok: true, connected: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Credential writes: require tech_admin or higher role
    // Viewers and sales roles cannot modify integration credentials
    const userRole = req.headers.get('x-user-role') || 'viewer';
    const isAdmin = req.headers.get('x-is-admin') === 'true';
    const allowedRoles = ['owner', 'tech_admin'];
    if (!isAdmin && !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions to modify integrations' }, { status: 403 });
    }

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
