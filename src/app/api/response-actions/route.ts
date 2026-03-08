import { NextResponse } from 'next/server';

// In production, these would call real APIs. For now, simulate success.
export async function POST(req: Request) {
  const { action, target, tool, alertId } = await req.json();
  
  const actions: Record<string, { label: string; simulated: string }> = {
    'isolate_device': { label: 'Isolate Device', simulated: `Device ${target} isolation initiated via ${tool}. Network access restricted to management VLAN only.` },
    'block_ip': { label: 'Block IP', simulated: `IP ${target} added to ZIA blocklist. Category: C2. Effective immediately across all locations.` },
    'block_domain': { label: 'Block Domain', simulated: `Domain ${target} added to ZIA URL blocklist. All users will see block page.` },
    'disable_user': { label: 'Disable User', simulated: `User ${target} disabled in Azure AD. Active sessions revoked. MFA reset required for re-enable.` },
    'quarantine_file': { label: 'Quarantine File', simulated: `File quarantined on endpoint via ${tool}. SHA-256 added to global block list.` },
    'run_scan': { label: 'Run AV Scan', simulated: `Full antivirus scan initiated on ${target} via ${tool}. Results in ~15 minutes.` },
    'collect_evidence': { label: 'Collect Evidence', simulated: `Forensic package collection started on ${target}. Memory dump + disk image + event logs.` },
  };

  const a = actions[action];
  if (!a) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  // Simulate a 1s delay for realism
  await new Promise(r => setTimeout(r, 500));

  return NextResponse.json({
    ok: true,
    action: a.label,
    target,
    tool,
    alertId,
    message: a.simulated,
    timestamp: new Date().toISOString(),
    demo: true,
  });
}
