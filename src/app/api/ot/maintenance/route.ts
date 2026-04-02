import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet, sanitiseKeySegment } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

const MW_KEY = (t: string) => `wt:${sanitiseKeySegment(t)}:ot_maintenance_windows`;

interface MaintenanceWindow {
  id: string;
  name: string;
  start: number;
  end: number;
  zones: string[];
  createdBy: string;
  notes: string;
  createdAt: number;
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = req.headers.get('x-tenant-id') || 'global';
  const rl = await checkRateLimit(`ot-mw:${userId}`, 60, 60);
  if (!rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const raw = await redisGet(MW_KEY(tenantId));
    const windows: MaintenanceWindow[] = raw ? JSON.parse(raw) : [];
    // Return all windows — client filters by active/upcoming
    return NextResponse.json({ ok: true, windows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = req.headers.get('x-tenant-id') || 'global';
  const rl = await checkRateLimit(`ot-mw-post:${userId}`, 20, 60);
  if (!rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const body = await req.json();
    const { name, start, end, zones, notes } = body as Partial<MaintenanceWindow>;

    if (!name || typeof start !== 'number' || typeof end !== 'number' || !Array.isArray(zones)) {
      return NextResponse.json({ error: 'name, start, end, zones required' }, { status: 400 });
    }
    if (end <= start) return NextResponse.json({ error: 'end must be after start' }, { status: 400 });

    const raw = await redisGet(MW_KEY(tenantId));
    const windows: MaintenanceWindow[] = raw ? JSON.parse(raw) : [];

    const newWindow: MaintenanceWindow = {
      id: `mw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: String(name).slice(0, 100),
      start: Number(start),
      end: Number(end),
      zones: zones.filter((z: any) => typeof z === 'string').slice(0, 10),
      createdBy: userId,
      notes: String(notes || '').slice(0, 500),
      createdAt: Date.now(),
    };

    windows.push(newWindow);
    // Keep last 100 windows
    const trimmed = windows.slice(-100);
    await redisSet(MW_KEY(tenantId), JSON.stringify(trimmed));

    return NextResponse.json({ ok: true, window: newWindow });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = req.headers.get('x-tenant-id') || 'global';
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  try {
    const raw = await redisGet(MW_KEY(tenantId));
    const windows: MaintenanceWindow[] = raw ? JSON.parse(raw) : [];
    const filtered = windows.filter(w => w.id !== id);
    await redisSet(MW_KEY(tenantId), JSON.stringify(filtered));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
