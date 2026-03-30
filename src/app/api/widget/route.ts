import { NextRequest, NextResponse } from 'next/server';
import { redisGet } from '@/lib/redis';

// Public embeddable status widget — returns sanitised posture data for a tenant
// Used by clients who embed a security status widget on internal dashboards
// Requires a tenant slug — no auth (public, no sensitive data)

export async function GET(req: NextRequest) {
  // Rate limit: 60 requests per minute per IP to prevent tenant slug enumeration
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'anon';
  const { checkRateLimit } = await import('@/lib/ratelimit');
  const rl = await checkRateLimit(`widget:${ip}`, 60, 60);
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'Rate limited' }, { status: 429 });
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ ok: false, error: 'slug required' }, { status: 400 });
    }

    // Map slug to tenant ID
    const slugMapRaw = await redisGet('wt:mssp:slug_map');
    const slugMap: Record<string, string> = slugMapRaw ? JSON.parse(slugMapRaw) : {};
    const tenantId = slugMap[slug];

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: 'Invalid slug' }, { status: 404 });
    }

    // Get public posture data (no alert details, no credentials)
    const postureRaw = await redisGet(`wt:${tenantId}:posture`);
    const posture = postureRaw ? JSON.parse(postureRaw) : null;

    // Get branding
    const brandingRaw = await redisGet(`wt:${tenantId}:branding`);
    const branding = brandingRaw ? JSON.parse(brandingRaw) : {};

    const response = NextResponse.json({
      ok: true,
      slug,
      orgName: branding.orgName || 'Security Dashboard',
      primaryColor: branding.primaryColor || '#4f8fff',
      posture: posture ? {
        score: posture.score,
        breakdown: posture.breakdown?.map((b: any) => ({ factor: b.factor, score: b.score })),
        updatedAt: posture.cachedAt,
      } : null,
      status: posture?.score >= 80 ? 'Secure' : posture?.score >= 60 ? 'Monitoring' : 'Action Required',
    });

    // CORS for embeddable widget
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Cache-Control', 'public, max-age=300');
    return response;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  return res;
}
