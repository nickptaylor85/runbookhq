import { getTenantFromRequest } from '@/lib/config-store';
import { NextResponse } from 'next/server';
import { getTaegisToken, taegisGraphQL } from '@/lib/api-clients';

export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const { hostname, action } = await req.json();
  if (!hostname) return NextResponse.json({ error: 'No hostname' }, { status: 400 });

  const taegisAuth = await getTaegisToken(tenantId || undefined);
  if (!taegisAuth) return NextResponse.json({ error: 'Taegis auth failed', ok: false });

  try {
    // First find the endpoint ID by hostname
    const searchQuery = `query { endpointAssets(filter: { hostname: "${hostname}" }, first: 1) { edges { node { id hostId hostname sensorVersion isolationStatus } } } }`;
    const searchResult = await taegisGraphQL(searchQuery, {}, taegisAuth.token, taegisAuth.base);
    
    const endpoint = searchResult.data?.endpointAssets?.edges?.[0]?.node;
    if (!endpoint) {
      return NextResponse.json({ ok: false, error: `Endpoint '${hostname}' not found in Taegis`, searched: true });
    }

    const isolate = action !== 'restore';
    
    // Isolate or restore
    const mutation = isolate 
      ? `mutation { isolateEndpoint(input: { hostId: "${endpoint.hostId || endpoint.id}" }) { success message } }`
      : `mutation { restoreEndpoint(input: { hostId: "${endpoint.hostId || endpoint.id}" }) { success message } }`;
    
    const result = await taegisGraphQL(mutation, {}, taegisAuth.token, taegisAuth.base);
    
    if (result.errors) {
      return NextResponse.json({ ok: false, error: result.errors[0]?.message || 'Mutation failed', endpoint: endpoint.hostname });
    }

    return NextResponse.json({ 
      ok: true, 
      message: `${isolate ? 'Isolated' : 'Restored'} ${endpoint.hostname} via Taegis`,
      endpoint: { id: endpoint.id, hostname: endpoint.hostname, isolationStatus: isolate ? 'isolated' : 'active' },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
