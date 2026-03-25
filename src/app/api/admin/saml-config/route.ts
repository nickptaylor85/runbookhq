import { NextRequest, NextResponse } from 'next/server';
import { getSamlConfig, saveSamlConfig, SamlConfig } from '@/lib/saml';

function requireAdmin(req: NextRequest) {
  if (req.headers.get('x-is-admin') !== 'true') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  return null;
}

export async function GET(req: NextRequest) {
  const err = requireAdmin(req); if (err) return err;
  const tenantId = req.headers.get('x-tenant-id') || 'global';
  const config = await getSamlConfig(tenantId);
  if (!config) return NextResponse.json({ ok: true, configured: false });
  // Mask certificate
  return NextResponse.json({ ok: true, configured: true, ...config, idpCert: config.idpCert ? '••••••••' : '' });
}

export async function POST(req: NextRequest) {
  const err = requireAdmin(req); if (err) return err;
  const tenantId = req.headers.get('x-tenant-id') || 'global';
  try {
    const body = await req.json() as Partial<SamlConfig>;
    const existing = await getSamlConfig(tenantId) || {} as SamlConfig;
    const updated: SamlConfig = {
      enabled: body.enabled ?? existing.enabled ?? false,
      idpEntityId: body.idpEntityId || existing.idpEntityId || '',
      idpSsoUrl: body.idpSsoUrl || existing.idpSsoUrl || '',
      idpCert: (body.idpCert && body.idpCert !== '••••••••') ? body.idpCert : existing.idpCert || '',
      spEntityId: body.spEntityId || existing.spEntityId || (process.env.NEXT_PUBLIC_BASE_URL || 'https://getwatchtower.io'),
      attributeMapping: body.attributeMapping || existing.attributeMapping || { email: 'email', name: 'displayName' },
      defaultRole: body.defaultRole || existing.defaultRole || 'viewer',
      domains: body.domains || existing.domains || [],
    };
    await saveSamlConfig(tenantId, updated);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
