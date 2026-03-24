import { NextRequest, NextResponse } from 'next/server';

function getTenantId(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || 'global';
}

export async function GET(req: NextRequest) {
  const _tenantId = getTenantId(req);
  return NextResponse.json({"ok": true, "keys": []});
}

export async function POST(req: NextRequest) {
  const _tenantId = getTenantId(req);
  return NextResponse.json({"ok": true});
}

export async function DELETE(req: NextRequest) {
  const _tenantId = getTenantId(req);
  return NextResponse.json({"ok": true});
}
