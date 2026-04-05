import { NextRequest, NextResponse } from 'next/server';
import { redisGet } from '@/lib/redis';

const DEFAULT_MAP: Record<string, string> = {
  'acme-financial': 'client-acme', 'acme': 'client-acme',
  'nhs-trust': 'client-nhs', 'nhs': 'client-nhs',
  'retailco': 'client-retail',
  'gov-dept': 'client-gov', 'gov': 'client-gov',
};

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || '';
  const host = req.headers.get('host') || '';

  // Also try extracting from x-portal-slug header (set by middleware)
  const portalSlug = req.headers.get('x-portal-slug') || slug;

  if (!portalSlug) {
    return NextResponse.json({ ok: false, error: 'slug parameter required' }, { status: 400 });
  }

  try {
    // Resolve slug → tenantId
    const raw = await redisGet('wt:mssp:slug_map');
    const map: Record<string, string> = raw ? JSON.parse(raw) : DEFAULT_MAP;
    const tenantId = map[portalSlug];

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: 'Unknown portal' }, { status: 404 });
    }

    // Load branding for tenant
    const brandingRaw = await redisGet(`wt:${tenantId}:mssp_branding`);
    const branding = brandingRaw ? JSON.parse(brandingRaw) : {};

    return NextResponse.json({
      ok: true,
      slug: portalSlug,
      tenantId,
      branding: {
        name: branding.name || portalSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        primaryColor: branding.primaryColor || '#4f8fff',
        accentColor: branding.accentColor || '#00e5ff',
        tagline: branding.tagline || 'Security Portal',
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Resolution failed' }, { status: 500 });
  }
}
