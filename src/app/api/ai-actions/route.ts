import { NextResponse } from 'next/server';
import { loadTenantConfigs, saveTenantConfigs, getTenantFromRequest } from '@/lib/config-store';

// GET — return automation settings + action log
export async function GET(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const configs = await loadTenantConfigs(tenantId);
  
  const settings = configs.aiAutomation || {
    level: 'notify', // 'full_auto' | 'notify' | 'recommend'
    actions: {
      isolate_device: true,
      block_ip: true,
      disable_user: true,
      quarantine_file: true,
    }
  };
  
  const actionLog = (configs.aiActionLog || []).sort((a: any, b: any) => 
    new Date(b.time).getTime() - new Date(a.time).getTime()
  );
  
  // Demo action log if empty
  if (actionLog.length === 0) {
    const now = Date.now();
    const demoLog = [
      { id: 'act_demo1', type: 'isolate_device', target: 'WS042.corp.local', alertId: 'da-001', alertTitle: 'Suspicious PowerShell execution', tool: 'defender', confidence: 94, reasoning: 'Base64-encoded PS from outlook.exe child process — classic phishing chain', automationLevel: 'full_auto', status: 'executed', time: new Date(now - 1800000).toISOString(), executedBy: 'Watchtower AI', revertible: true, reverted: false },
      { id: 'act_demo2', type: 'block_ip', target: '185.220.101.42', alertId: 'da-003', alertTitle: 'Suspicious outbound connection to known C2', tool: 'zscaler', confidence: 97, reasoning: 'IP on 4 threat intel feeds, 60s beacon interval matches Cobalt Strike', automationLevel: 'full_auto', status: 'executed', time: new Date(now - 3600000).toISOString(), executedBy: 'Watchtower AI', revertible: true, reverted: false },
      { id: 'act_demo3', type: 'disable_user', target: 'admin_svc', alertId: 'da-002', alertTitle: 'Credential dumping attempt via LSASS', tool: 'azuread', confidence: 98, reasoning: 'LSASS access on DC — if creds extracted, attacker has domain admin', automationLevel: 'full_auto', status: 'executed', time: new Date(now - 2700000).toISOString(), executedBy: 'Watchtower AI', revertible: true, reverted: false },
      { id: 'act_demo4', type: 'quarantine_file', target: 'invoice_q3_final.docm (SHA256: a1b2c3...)', alertId: 'da-004', alertTitle: 'Phishing email with malicious attachment', tool: 'defender', confidence: 96, reasoning: 'Office macro dropper matching known Emotet pattern from ThreatFox', automationLevel: 'notify', status: 'executed', time: new Date(now - 5400000).toISOString(), executedBy: 'Watchtower AI', revertible: true, reverted: false },
      { id: 'act_demo5', type: 'block_ip', target: '91.215.85.17', alertId: 'ta-004', alertTitle: 'DNS tunnelling indicators', tool: 'zscaler', confidence: 91, reasoning: 'DNS queries to suspicious domain with high entropy subdomain — data exfil pattern', automationLevel: 'full_auto', status: 'executed', time: new Date(now - 7200000).toISOString(), executedBy: 'Watchtower AI', revertible: true, reverted: false },
    ];
    return NextResponse.json({ settings, actionLog: demoLog, total: demoLog.length, demo: true });
  }

  return NextResponse.json({ settings, actionLog, total: actionLog.length });
}

// POST — update settings, log action, or revert action
export async function POST(req: Request) {
  const { tenantId, email } = getTenantFromRequest(req);
  if (!tenantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  
  const body = await req.json();
  const configs = await loadTenantConfigs(tenantId);
  
  // Update automation level
  if (body.action === 'update_settings') {
    configs.aiAutomation = {
      level: body.level || 'notify',
      actions: body.actions || configs.aiAutomation?.actions || {
        isolate_device: true, block_ip: true, disable_user: true, quarantine_file: true
      }
    };
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true, settings: configs.aiAutomation });
  }
  
  // Log an AI action
  if (body.action === 'log_action') {
    if (!configs.aiActionLog) configs.aiActionLog = [];
    const entry = {
      id: 'act_' + Date.now().toString(36),
      type: body.type, // isolate_device, block_ip, disable_user, quarantine_file
      target: body.target, // hostname, IP, username, file hash
      alertId: body.alertId,
      alertTitle: body.alertTitle,
      incidentId: body.incidentId,
      tool: body.tool, // defender, crowdstrike, zscaler, azuread
      confidence: body.confidence,
      reasoning: body.reasoning,
      automationLevel: body.automationLevel || 'full_auto',
      status: body.status || 'executed', // executed, pending_approval, recommended, reverted
      time: new Date().toISOString(),
      executedBy: body.automationLevel === 'full_auto' ? 'Watchtower AI' : email,
      revertible: true,
      reverted: false,
    };
    configs.aiActionLog.push(entry);
    
    // Also add to incident timeline if incidentId provided
    if (body.incidentId && configs.incidents) {
      const inc = configs.incidents.find((i: any) => i.id === body.incidentId);
      if (inc) {
        if (!inc.timeline) inc.timeline = [];
        const actionLabels: Record<string, string> = {
          isolate_device: '🔒 Device isolated',
          block_ip: '🚫 IP/domain blocked',
          disable_user: '👤 User account disabled',
          quarantine_file: '📁 File quarantined',
        };
        inc.timeline.push({
          type: 'ai_action',
          time: entry.time,
          by: 'Watchtower AI',
          detail: `${actionLabels[body.type] || body.type}: ${body.target}`,
          actionId: entry.id,
          revertible: true,
        });
      }
    }
    
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true, entry });
  }
  
  // Revert an AI action
  if (body.action === 'revert') {
    if (!configs.aiActionLog) return NextResponse.json({ error: 'No action log' }, { status: 404 });
    const entry = configs.aiActionLog.find((a: any) => a.id === body.actionId);
    if (!entry) return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    
    entry.reverted = true;
    entry.revertedAt = new Date().toISOString();
    entry.revertedBy = email;
    entry.status = 'reverted';
    
    // Add revert to incident timeline
    if (entry.incidentId && configs.incidents) {
      const inc = configs.incidents.find((i: any) => i.id === entry.incidentId);
      if (inc && inc.timeline) {
        const revertLabels: Record<string, string> = {
          isolate_device: '🔓 Device un-isolated',
          block_ip: '✅ IP/domain unblocked',
          disable_user: '👤 User account re-enabled',
          quarantine_file: '📁 File released from quarantine',
        };
        inc.timeline.push({
          type: 'ai_revert',
          time: new Date().toISOString(),
          by: email,
          detail: `${revertLabels[entry.type] || 'Reverted'}: ${entry.target}`,
          actionId: entry.id,
        });
      }
    }
    
    await saveTenantConfigs(tenantId, configs);
    return NextResponse.json({ ok: true, reverted: entry });
  }
  
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
