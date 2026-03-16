import { getTenantFromRequest } from '@/lib/config-store';
import { NextResponse } from 'next/server';
import { getTaegisToken, taegisGraphQL } from '@/lib/api-clients';

export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const { action, target, tool, alertId } = await req.json();

  // Real Taegis isolation
  if (action === 'isolate_device' && target) {
    const taegisAuth = await getTaegisToken(tenantId || undefined);
    if (taegisAuth) {
      try {
        const searchQuery = `query { endpointAssets(filter: { hostname: "${target.split('.')[0]}" }, first: 5) { edges { node { id hostId hostname isolationStatus } } } }`;
        const searchResult = await taegisGraphQL(searchQuery, {}, taegisAuth.token, taegisAuth.base);
        const endpoint = searchResult.data?.endpointAssets?.edges?.[0]?.node;
        if (endpoint) {
          const mutation = `mutation { isolateEndpoint(input: { hostId: "${endpoint.hostId || endpoint.id}" }) { success message } }`;
          const result = await taegisGraphQL(mutation, {}, taegisAuth.token, taegisAuth.base);
          if (!result.errors) {
            return NextResponse.json({ ok: true, message: `Isolated ${endpoint.hostname} via Taegis XDR`, live: true });
          }
          return NextResponse.json({ ok: false, error: result.errors?.[0]?.message || 'Isolation failed', live: true });
        }
        // Endpoint not found in Taegis - fall through to demo
      } catch (e) {
        return NextResponse.json({ ok: false, error: 'Taegis API error: ' + String(e) });
      }
    }
  }

  // Demo responses for other actions
  const responses: Record<string, string> = {
    'isolate_device': `Isolation initiated for ${target} via ${tool}`,
    'block_ip': `IP ${target} blocked in ${tool} firewall rules`,
    'disable_user': `Account ${target} disabled in Azure AD`,
    'quarantine_file': `File quarantined on ${target} via ${tool}`,
    'run_scan': `AV scan initiated on ${target}`,
    'collect_evidence': `Evidence collection started on ${target}`,
    'restore_device': `Restore initiated for ${target} via ${tool}`,
  };

  // Simulate a short delay
  await new Promise(r => setTimeout(r, 800));
  return NextResponse.json({ ok: true, message: responses[action] || `Action ${action} completed on ${target}`, demo: true });
}
