import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

// Runbook templates: store/retrieve per-tenant runbooks
// Pre-populated with common SOC response runbooks on first access

interface Runbook {
  id: string;
  title: string;
  triggerType: string; // 'ransomware' | 'phishing' | 'credential_theft' | 'data_exfil' | 'custom'
  mitre?: string;
  steps: string[];
  containment: string[];
  eradication: string[];
  recovery: string[];
  updatedAt: number;
}

const DEFAULT_RUNBOOKS: Runbook[] = [
  {
    id: 'rb-ransomware', title: 'Ransomware Response', triggerType: 'ransomware', mitre: 'T1486',
    steps: ['Isolate affected device immediately', 'Identify ransomware family via file extension and ransom note', 'Preserve forensic image before any remediation', 'Notify CISO and legal within 1 hour', 'Check backup integrity — do NOT connect to live network'],
    containment: ['Network isolate via CrowdStrike RTR contain command', 'Block C2 IPs at perimeter firewall', 'Disable compromised accounts', 'Force password reset for all accounts on affected subnet'],
    eradication: ['Remove ransomware binaries identified in AV scan', 'Identify and close initial access vector (phishing link, RDP, vulnerable service)', 'Patch exploited vulnerability', 'Audit scheduled tasks and registry run keys for persistence'],
    recovery: ['Restore from last known-good backup', 'Validate restore integrity before reconnecting to network', 'Monitor for re-infection for 72 hours', 'Update detection rules based on IOCs observed'],
    updatedAt: Date.now(),
  },
  {
    id: 'rb-phishing', title: 'Phishing / BEC Response', triggerType: 'phishing', mitre: 'T1566.001',
    steps: ['Quarantine malicious email from all mailboxes', 'Identify all recipients who received and potentially opened the email', 'Check email gateway logs for any replies or forwarding rules created', 'Identify any links clicked and credentials potentially entered'],
    containment: ['Reset credentials for any users who clicked links or opened attachments', 'Revoke active OAuth tokens for affected accounts', 'Block sender domain at email gateway', 'Disable any inbox rules created by attacker'],
    eradication: ['Remove malicious email from all mailboxes (admin purge)', 'Revoke any application permissions granted', 'Audit email forwarding rules across all affected accounts'],
    recovery: ['Re-enable MFA on affected accounts', 'Monitor mailboxes for anomalous activity for 30 days', 'Report phishing infrastructure to NCSC/relevant authority'],
    updatedAt: Date.now(),
  },
  {
    id: 'rb-credential-theft', title: 'Credential Theft Response', triggerType: 'credential_theft', mitre: 'T1003',
    steps: ['Identify scope: which accounts may be compromised', 'Check for lateral movement from affected accounts', 'Review authentication logs for anomalous logins (time, location, device)', 'Determine if privileged accounts are involved'],
    containment: ['Force password reset on all suspected compromised accounts', 'Revoke all active sessions and tokens', 'Enable stepped-up MFA for sensitive operations', 'Temporarily restrict affected accounts to minimal permissions'],
    eradication: ['Identify and remove credential-dumping tools (Mimikatz, LaZagne)', 'Remove persistence mechanisms (scheduled tasks, services, registry)', 'Audit and rotate service account passwords', 'Rotate API keys and certificates'],
    recovery: ['Monitor for further credential use from attacker', 'Implement privileged access workstation for admin tasks', 'Enable advanced audit logging for future detection'],
    updatedAt: Date.now(),
  },
  {
    id: 'rb-data-exfil', title: 'Data Exfiltration Response', triggerType: 'data_exfil', mitre: 'T1567.002',
    steps: ['Identify what data was accessed and exfiltrated', 'Determine volume and sensitivity of data involved', 'Identify exfiltration channel (cloud upload, email, USB, C2)', 'Assess regulatory notification obligations (GDPR 72-hour window)'],
    containment: ['Block exfiltration channel at perimeter', 'Isolate source device', 'Preserve network capture logs for forensics', 'Engage legal for breach notification assessment'],
    eradication: ['Identify and close data access vector', 'Remove any staging directories or scripts used by attacker', 'Revoke cloud storage tokens used for exfiltration'],
    recovery: ['Notify affected parties per regulatory requirements', 'Implement DLP controls on sensitive data paths', 'Enhance egress monitoring rules'],
    updatedAt: Date.now(),
  },
];

const runbookKey = (t: string) => `wt:${t}:runbooks`;

function getTenantId(req: NextRequest) {
  return req.headers.get('x-tenant-id') || 'global';
}

export async function GET(req: NextRequest) {
  // Rate limiting — 60 req/min per user
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:${_rlId}:${req.nextUrl.pathname}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
  // Tier enforcement: requires Essentials (team) or above
  const userTier = req.headers.get('x-user-tier') || 'community';
  const tierLevels: Record<string, number> = { community: 0, team: 1, business: 2, mssp: 3 };
  if ((tierLevels[userTier] || 0) < 1) {
    return NextResponse.json({ ok: false, error: 'This feature requires Essentials plan or above. Upgrade at /pricing.' }, { status: 403 });
  }
    const tenantId = getTenantId(req);
    const raw = await redisGet(runbookKey(tenantId));
    const runbooks: Runbook[] = raw ? JSON.parse(raw) : DEFAULT_RUNBOOKS;

    // Seed defaults if nothing stored yet
    if (!raw) {
      await redisSet(runbookKey(tenantId), JSON.stringify(DEFAULT_RUNBOOKS)).catch(() => {});
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (id) {
      const rb = runbooks.find(r => r.id === id);
      if (!rb) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
      return NextResponse.json({ ok: true, runbook: rb });
    }

    return NextResponse.json({ ok: true, runbooks });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = getTenantId(req);
    const body = await req.json() as Partial<Runbook>;
    if (!body.title || !body.steps?.length) {
      return NextResponse.json({ ok: false, error: 'title and steps required' }, { status: 400 });
    }

    const raw = await redisGet(runbookKey(tenantId));
    const runbooks: Runbook[] = raw ? JSON.parse(raw) : [...DEFAULT_RUNBOOKS];

    const id = body.id || `rb-${Date.now()}`;
    const newRunbook: Runbook = {
      id, title: body.title, triggerType: body.triggerType || 'custom',
      mitre: body.mitre, steps: body.steps || [],
      containment: body.containment || [], eradication: body.eradication || [],
      recovery: body.recovery || [], updatedAt: Date.now(),
    };

    const idx = runbooks.findIndex(r => r.id === id);
    if (idx >= 0) runbooks[idx] = newRunbook;
    else runbooks.push(newRunbook);

    await redisSet(runbookKey(tenantId), JSON.stringify(runbooks.slice(0, 100)));
    return NextResponse.json({ ok: true, runbook: newRunbook });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
