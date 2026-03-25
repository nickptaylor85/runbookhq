import { NextRequest, NextResponse } from 'next/server';
import { getSamlConfig, buildSamlAuthnRequest } from '@/lib/saml';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenant') || 'global';
  const config = await getSamlConfig(tenantId);
  if (!config?.enabled) {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://getwatchtower.io';
    return NextResponse.redirect(`${base}/login?error=saml_not_configured`);
  }
  const relayState = JSON.stringify({ tenantId, ts: Date.now() });
  const redirectUrl = buildSamlAuthnRequest(config, relayState);
  return NextResponse.redirect(redirectUrl);
}
