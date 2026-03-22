import { NextRequest, NextResponse } from 'next/server';
import { ADAPTERS } from '@/lib/integrations';

export async function POST(req: NextRequest) {
  try {
    const { id, credentials } = await req.json();
    const adapter = ADAPTERS[id];
    if (!adapter) return NextResponse.json({ ok: false, message: 'Unknown integration' }, { status: 400 });

    const result = await adapter.testConnection(credentials);
    return NextResponse.json(result);
  } catch(e: any) {
    return NextResponse.json({ ok: false, message: 'Test failed', details: e.message }, { status: 500 });
  }
}
