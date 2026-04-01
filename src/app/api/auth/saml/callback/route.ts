import { checkRateLimit } from '@/lib/ratelimit';
import { NextRequest, NextResponse } from 'next/server';
import { getSamlConfig, parseSamlResponse } from '@/lib/saml';
import { signSession } from '@/lib/encrypt';
import { getUserByEmail, createUser } from '@/lib/users';

export async function POST(req: NextRequest) {
  const _rlIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'anon';
  const _rl = await checkRateLimit('saml:' + _rlIp, 30, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://getwatchtower.io';
  try {
    const form = await req.formData();
    const samlResponse = form.get('SAMLResponse') as string;
    const relayStateRaw = form.get('RelayState') as string;
    if (!samlResponse) return NextResponse.redirect(`${base}/login?error=no_saml_response`);

    let tenantId = 'global';
    try { tenantId = JSON.parse(relayStateRaw)?.tenantId || 'global'; } catch {}

    const config = await getSamlConfig(tenantId);
    if (!config?.enabled) return NextResponse.redirect(`${base}/login?error=saml_disabled`);

    // SECURITY: parseSamlResponse does not yet verify the XML digital signature.
    // Until xmldsig verification is implemented, reject all SAML responses to prevent
    // account takeover via forged assertions. SAML SSO must remain disabled.
    return NextResponse.redirect(`${base}/login?error=saml_signature_verification_required`);
    // eslint-disable-next-line no-unreachable
    const attrs = parseSamlResponse(samlResponse, config);
    if (!attrs) return NextResponse.redirect(`${base}/login?error=saml_parse_failed`);

    // Find or create user
    let user = await getUserByEmail(tenantId, attrs.email);
    if (!user) {
      user = await createUser(tenantId, {
        name: attrs.name,
        email: attrs.email,
        role: attrs.role as any,
        tenantId,
        status: 'active',
      });
    }

    const token = signSession({ userId: user.id, tenantId, isAdmin: false, email: user.email, role: user.role });
    const res = NextResponse.redirect(`${base}/dashboard`);
    res.cookies.set('wt_session', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 86400, path: '/',
    });
    return res;
  } catch (e: any) {
    return NextResponse.redirect(`${base}/login?error=saml_error`);
  }
}
