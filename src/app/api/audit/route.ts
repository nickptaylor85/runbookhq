import { NextResponse } from 'next/server';
import { loadPlatformData, savePlatformData } from '@/lib/config-store';

export async function GET() {
  const configs = await loadPlatformData();
  const logs = (configs.auditLog || []).slice(-100).reverse();
  return NextResponse.json({ logs, total: configs.auditLog?.length || 0 });
}

export async function POST(req: Request) {
  const { action, detail } = await req.json();
  const configs = await loadPlatformData();
  if (!configs.auditLog) configs.auditLog = [];
  configs.auditLog.push({ action, detail, time: new Date().toISOString() });
  if (configs.auditLog.length > 1000) configs.auditLog = configs.auditLog.slice(-500);
  await savePlatformData(configs);
  return NextResponse.json({ ok: true });
}
