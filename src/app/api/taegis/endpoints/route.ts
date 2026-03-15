import { NextResponse } from 'next/server';
import { getTaegisToken, taegisGraphQL } from '@/lib/api-clients';

export async function GET() {
  const taegisAuth = await getTaegisToken();
  if (!taegisAuth) return NextResponse.json({ ok: false, error: 'Taegis auth failed', endpoints: [] });

  try {
    const query = `query { endpointAssets(first: 50) { edges { node { id hostId hostname hostInfo { os osVersion } sensorVersion isolationStatus lastConnectedAt } } totalCount } }`;
    const data = await taegisGraphQL(query, {}, taegisAuth.token, taegisAuth.base);
    if (data.errors) return NextResponse.json({ ok: false, error: data.errors[0]?.message, endpoints: [], raw: JSON.stringify(data).substring(0, 500) });
    const edges = data.data?.endpointAssets?.edges || [];
    const endpoints = edges.map((e: any) => ({ id: e.node.id, hostId: e.node.hostId, hostname: e.node.hostname, os: e.node.hostInfo?.os || '', osVersion: e.node.hostInfo?.osVersion || '', sensorVersion: e.node.sensorVersion || '', isolated: e.node.isolationStatus === 'isolated', lastSeen: e.node.lastConnectedAt || '' }));
    return NextResponse.json({ ok: true, total: data.data?.endpointAssets?.totalCount || endpoints.length, endpoints });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), endpoints: [] });
  }
}
