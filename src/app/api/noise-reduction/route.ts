import { NextResponse } from 'next/server';
import { loadTenantConfigs, saveTenantConfigs, getTenantFromRequest } from '@/lib/config-store';

export async function GET(req: Request) {
  const { isDemoMode } = await import('@/lib/demo-check');
  if (await isDemoMode(getTenantFromRequest(req).tenantId)) {
    return NextResponse.json({ enabled: true, autoCloseThreshold: 95, stats: { totalProcessed: 285, autoClosed: 247, escalated: 38, timeSavedMins: 1976, weeklyData: [
      { week: 'W1', processed: 68, autoClosed: 59, escalated: 9, timeSaved: 472 },
      { week: 'W2', processed: 72, autoClosed: 63, escalated: 9, timeSaved: 504 },
      { week: 'W3', processed: 71, autoClosed: 61, escalated: 10, timeSaved: 488 },
      { week: 'W4', processed: 74, autoClosed: 64, escalated: 10, timeSaved: 512 },
    ] }, demo: true });
  }
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const configs = await loadTenantConfigs(tenantId);
  const nr = configs.noiseReduction || { enabled: false, autoCloseThreshold: 95, stats: { totalProcessed: 0, autoClosed: 0, escalated: 0, timeSavedMins: 0, weeklyData: [] }, rules: [] };
  return NextResponse.json(nr);
}

export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { action, enabled, threshold, alertId, verdict, confidence, reason } = await req.json();
  const configs = await loadTenantConfigs(tenantId);
  if (!configs.noiseReduction) configs.noiseReduction = { enabled: false, autoCloseThreshold: 95, stats: { totalProcessed: 0, autoClosed: 0, escalated: 0, timeSavedMins: 0, weeklyData: [] }, rules: [] };

  if (action === 'configure') {
    if (enabled !== undefined) configs.noiseReduction.enabled = enabled;
    if (threshold !== undefined) configs.noiseReduction.autoCloseThreshold = threshold;
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true });
  }

  if (action === 'record') {
    const nr = configs.noiseReduction;
    nr.stats.totalProcessed++;
    if (verdict === 'fp' && (confidence || 0) >= nr.autoCloseThreshold) {
      nr.stats.autoClosed++;
      nr.stats.timeSavedMins += 8;
    } else {
      nr.stats.escalated++;
    }
    // Update weekly data
    const now = new Date();
    const weekKey = `${now.getFullYear()}-W${Math.ceil((now.getDate() + now.getDay()) / 7)}`;
    let week = nr.stats.weeklyData.find((w: any) => w.week === weekKey);
    if (!week) { week = { week: weekKey, processed: 0, autoClosed: 0, escalated: 0, timeSaved: 0 }; nr.stats.weeklyData.push(week); }
    week.processed++;
    if (verdict === 'fp' && (confidence || 0) >= nr.autoCloseThreshold) { week.autoClosed++; week.timeSaved += 8; }
    else { week.escalated++; }
    // Keep last 12 weeks
    if (nr.stats.weeklyData.length > 12) nr.stats.weeklyData = nr.stats.weeklyData.slice(-12);
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true, autoClosed: verdict === 'fp' && (confidence || 0) >= nr.autoCloseThreshold });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
