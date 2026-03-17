import { getTenantFromRequest } from '@/lib/config-store';
import { NextResponse } from 'next/server';
import { getTaegisToken, taegisGraphQL } from '@/lib/api-clients';

export async function POST(req: Request) {
  const { tenantId } = getTenantFromRequest(req);
  const { title, alertId, description, priority } = await req.json();
  const taegisAuth = await getTaegisToken(tenantId || undefined);
  if (!taegisAuth) return NextResponse.json({ ok: false, error: 'Taegis auth failed' });

  try {
    const mutation = `mutation createInvestigationV2($input: CreateInvestigationInput!) { createInvestigationV2(input: $input) { id short_id description status priority created_at } }`;
    const variables = { input: { title: title || 'Watchtower Investigation', assigneeId: '@customer', status: 'OPEN', keyFindings: description || '', priority: priority || 2, type: 'SECURITY_INVESTIGATION' } };
    const result = await taegisGraphQL(mutation, variables, taegisAuth.token, taegisAuth.base);
    if (result.errors) return NextResponse.json({ ok: false, error: result.errors[0]?.message || 'Failed', raw: JSON.stringify(result.errors).substring(0, 300) });
    const inv = result.data?.createInvestigationV2;
    return NextResponse.json({ ok: true, investigation: inv, message: `Investigation ${inv?.shortId || inv?.id} created` });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
