import { NextRequest, NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { checkRateLimit } from '@/lib/ratelimit';

// Full MITRE ATT&CK → compliance framework mapping
// Maps technique IDs to control references across ISO 27001, Cyber Essentials, and NIST CSF
const MITRE_MAP: Record<string, { iso: string; ce: string; nist: string; category: string }> = {
  'T1003':     { iso:'A.8.5 / A.8.16',  ce:'Access control',     nist:'PR.AC-1 / DE.CM-3',  category:'Credential Access' },
  'T1003.001': { iso:'A.8.3 / A.8.5',   ce:'Malware protection',  nist:'DE.CM-1 / RS.AN-1',  category:'Credential Access' },
  'T1027':     { iso:'A.8.16 / A.8.19', ce:'Malware protection',  nist:'DE.CM-4 / DE.AE-3',  category:'Defense Evasion' },
  'T1053.005': { iso:'A.8.8 / A.8.9',   ce:'Secure configuration',nist:'DE.CM-3 / PR.IP-1',  category:'Persistence' },
  'T1055':     { iso:'A.8.19 / A.8.9',  ce:'Malware protection',  nist:'DE.CM-4 / RS.AN-1',  category:'Defense Evasion' },
  'T1055.002': { iso:'A.8.19 / A.8.16', ce:'Malware protection',  nist:'DE.CM-4 / RS.AN-1',  category:'Defense Evasion' },
  'T1059':     { iso:'A.8.9 / A.8.19',  ce:'Malware protection',  nist:'PR.PT-3 / DE.CM-1',  category:'Execution' },
  'T1059.001': { iso:'A.8.19 / A.8.9',  ce:'Malware protection',  nist:'PR.PT-3 / DE.CM-1',  category:'Execution' },
  'T1071':     { iso:'A.8.20 / A.8.23', ce:'Network firewalls',   nist:'DE.CM-1 / PR.PT-4',  category:'Command & Control' },
  'T1071.001': { iso:'A.8.20 / A.8.23', ce:'Network firewalls',   nist:'DE.CM-1 / PR.PT-4',  category:'Command & Control' },
  'T1078':     { iso:'A.8.5 / A.9.2',   ce:'Access control',      nist:'PR.AC-1 / DE.CM-3',  category:'Valid Accounts' },
  'T1082':     { iso:'A.8.9 / A.8.16',  ce:'Secure configuration',nist:'DE.AE-3 / ID.AM-1',  category:'Discovery' },
  'T1110':     { iso:'A.8.5 / A.9.4',   ce:'Access control',      nist:'PR.AC-1 / DE.CM-3',  category:'Credential Access' },
  'T1190':     { iso:'A.8.8 / A.8.20',  ce:'Patch management',    nist:'PR.IP-12 / DE.CM-8', category:'Initial Access' },
  'T1486':     { iso:'A.8.7 / A.8.13',  ce:'Malware protection',  nist:'PR.IP-4 / RS.MI-1',  category:'Impact' },
  'T1528':     { iso:'A.8.2 / A.9.2',   ce:'Access control',      nist:'PR.AC-4 / DE.CM-7',  category:'Credential Access' },
  'T1547':     { iso:'A.8.9 / A.8.8',   ce:'Malware protection',  nist:'PR.IP-1 / DE.CM-7',  category:'Persistence' },
  'T1566.001': { iso:'A.8.23 / A.6.8',  ce:'Malware protection',  nist:'PR.AT-1 / DE.CM-1',  category:'Phishing' },
  'T1567.002': { iso:'A.8.24 / A.6.8',  ce:'Network firewalls',   nist:'PR.DS-5 / DE.CM-1',  category:'Exfiltration' },
  'T1620':     { iso:'A.8.19 / A.8.16', ce:'Malware protection',  nist:'DE.CM-4 / PR.PT-3',  category:'Defense Evasion' },
};

// Framework control domains for scoring
const ISO_CONTROLS = ['A.5 — Policies','A.6 — People','A.7 — Physical','A.8 — Technology','A.9 — Access','A.10 — Crypto'];
const CE_CONTROLS  = ['Firewalls','Secure config','Access control','Malware protection','Patch management'];
const NIST_FUNCS   = ['Identify (ID)','Protect (PR)','Detect (DE)','Respond (RS)','Recover (RC)'];

function scoreFramework(failingTechniques: string[]): {
  iso: { score: number; failingControls: string[] };
  ce:  { score: number; failingControls: string[] };
  nist:{ score: number; failingControls: string[] };
} {
  const isoFailing = new Set<string>();
  const ceFailing  = new Set<string>();
  const nistFailing= new Set<string>();

  for (const tech of failingTechniques) {
    // Exact or prefix match (T1003.001 matches T1003 too)
    const mapping = MITRE_MAP[tech] || MITRE_MAP[tech.split('.')[0]];
    if (!mapping) continue;
    // Extract ISO control family (A.8)
    mapping.iso.split('/').forEach(c => {
      const family = c.trim().split('.').slice(0, 2).join('.');
      isoFailing.add(family);
    });
    ceFailing.add(mapping.ce.trim());
    // Extract NIST function prefix (PR, DE, RS)
    mapping.nist.split('/').forEach(n => {
      const func = n.trim().split('.')[0].split('-')[0];
      nistFailing.add(func);
    });
  }

  const isoScore = Math.max(0, Math.round(100 - (isoFailing.size / ISO_CONTROLS.length) * 100));
  const ceScore  = Math.max(0, Math.round(100 - (ceFailing.size  / CE_CONTROLS.length)  * 100));
  const nistScore= Math.max(0, Math.round(100 - (nistFailing.size/ NIST_FUNCS.length)   * 100));

  return {
    iso:  { score: isoScore,  failingControls: [...isoFailing] },
    ce:   { score: ceScore,   failingControls: [...ceFailing]  },
    nist: { score: nistScore, failingControls: [...nistFailing] },
  };
}

const CACHE_KEY = (t: string) => `wt:${t}:compliance_map`;

export async function GET(req: NextRequest) {
  const _rlId = req.headers.get('x-user-id') || req.headers.get('x-forwarded-for') || 'anon';
  const _rl = await checkRateLimit(`api:\${_rlId}:\${req.nextUrl?.pathname || ''}`, 60, 60);
  if (!_rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'global';
    const url = new URL(req.url);
    const mitreTechniques = url.searchParams.get('techniques')?.split(',').filter(Boolean) || [];
    const bust = url.searchParams.get('bust') === '1';

    // Cache for 5 minutes unless bust=1
    if (!bust) {
      try {
        const cached = await redisGet(CACHE_KEY(tenantId));
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.cachedAt < 5 * 60 * 1000) {
            return NextResponse.json({ ok: true, ...parsed, cached: true });
          }
        }
      } catch {}
    }

    // Calculate scores from provided or default techniques
    const techniques = mitreTechniques.length > 0 ? mitreTechniques : [];
    const scores = scoreFramework(techniques);

    // Build per-technique mapping for the UI table
    const techniqueDetails = techniques.map(tech => {
      const mapping = MITRE_MAP[tech] || MITRE_MAP[tech.split('.')[0]] || {
        iso: 'A.8', ce: 'Access control', nist: 'DE.CM-1', category: 'Unknown'
      };
      return { technique: tech, ...mapping };
    });

    const result = {
      ok: true,
      scores,
      techniqueDetails,
      totalTechniques: techniques.length,
      failingCount: techniques.length,
      mapping: MITRE_MAP,
      cachedAt: Date.now(),
    };

    try { await redisSet(CACHE_KEY(tenantId), JSON.stringify(result)); } catch {}

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message }, { status: 500 });
  }
}
