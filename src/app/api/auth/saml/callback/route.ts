import { NextRequest, NextResponse } from 'next/server';
import { getSamlConfig, parseSamlResponse } from '@/lib/saml';
import { signSession } from '@/lib/encrypt';
import { getUserByEmail, createUser } from '@/lib/users';

export async function POST(req: NextRequest) {
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
