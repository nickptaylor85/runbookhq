import { NextResponse } from 'next/server';
import { getTaegisToken, taegisGraphQL } from '@/lib/api-clients';

export async function GET() {
  const taegisAuth = await getTaegisToken();
  if (!taegisAuth) return NextResponse.json({ error: 'No token' });

  const results: any = { base: taegisAuth.base, attempts: [] };

  // Attempt 1: Current CQL query
  try {
    const q1 = `query { alertsServiceSearch(in: { cql_query: "FROM alert WHERE severity >= 0.4 EARLIEST=-7d", offset: 0, limit: 5 }) { reason alerts { total_results list { id metadata { title severity } status } } } }`;
    const d1 = await taegisGraphQL(q1, {}, taegisAuth.token, taegisAuth.base);
    results.attempts.push({ method: 'alertsServiceSearch CQL 0.4 7d', total: d1.data?.alertsServiceSearch?.alerts?.total_results, reason: d1.data?.alertsServiceSearch?.reason, errors: d1.errors, sample: d1.data?.alertsServiceSearch?.alerts?.list?.slice(0,2) });
  } catch (e) { results.attempts.push({ method: 'alertsServiceSearch CQL', error: String(e) }); }

  // Attempt 2: No severity filter
  try {
    const q2 = `query { alertsServiceSearch(in: { cql_query: "FROM alert EARLIEST=-7d", offset: 0, limit: 5 }) { reason alerts { total_results list { id metadata { title severity } status } } } }`;
    const d2 = await taegisGraphQL(q2, {}, taegisAuth.token, taegisAuth.base);
    results.attempts.push({ method: 'alertsServiceSearch no filter 7d', total: d2.data?.alertsServiceSearch?.alerts?.total_results, reason: d2.data?.alertsServiceSearch?.reason, errors: d2.errors, sample: d2.data?.alertsServiceSearch?.alerts?.list?.slice(0,2) });
  } catch (e) { results.attempts.push({ method: 'no filter', error: String(e) }); }

  // Attempt 3: 30 day lookback
  try {
    const q3 = `query { alertsServiceSearch(in: { cql_query: "FROM alert EARLIEST=-30d", offset: 0, limit: 5 }) { reason alerts { total_results list { id metadata { title severity } status } } } }`;
    const d3 = await taegisGraphQL(q3, {}, taegisAuth.token, taegisAuth.base);
    results.attempts.push({ method: 'alertsServiceSearch 30d', total: d3.data?.alertsServiceSearch?.alerts?.total_results, reason: d3.data?.alertsServiceSearch?.reason, errors: d3.errors, sample: d3.data?.alertsServiceSearch?.alerts?.list?.slice(0,2) });
  } catch (e) { results.attempts.push({ method: '30d', error: String(e) }); }

  // Attempt 4: Try the investigations API instead
  try {
    const q4 = `query { allInvestigations(page: 0, perPage: 5) { id shortId title status priority createdAt } }`;
    const d4 = await taegisGraphQL(q4, {}, taegisAuth.token, taegisAuth.base);
    results.attempts.push({ method: 'allInvestigations', data: d4.data, errors: d4.errors, raw: JSON.stringify(d4).substring(0, 400) });
  } catch (e) { results.attempts.push({ method: 'investigations', error: String(e) }); }

  // Attempt 5: Try detections (Taegis uses "detections" not "alerts" in some versions)
  try {
    const q5 = `query { alertsServiceSearch(in: { cql_query: "FROM alert EARLIEST=-90d", offset: 0, limit: 5 }) { reason alerts { total_results } } }`;
    const d5 = await taegisGraphQL(q5, {}, taegisAuth.token, taegisAuth.base);
    results.attempts.push({ method: 'alerts 90d count only', total: d5.data?.alertsServiceSearch?.alerts?.total_results, errors: d5.errors });
  } catch (e) { results.attempts.push({ method: '90d count', error: String(e) }); }

  // Attempt 6: Try aggregation to see what's there
  try {
    const q6 = `query { alertsServiceAggregateBySeverity: alertsServiceSearch(in: { cql_query: "FROM alert EARLIEST=-90d", offset: 0, limit: 1 }) { reason alerts { total_results } } }`;
    const d6 = await taegisGraphQL(q6, {}, taegisAuth.token, taegisAuth.base);
    results.attempts.push({ method: 'alias 90d', data: d6.data, errors: d6.errors });
  } catch (e) { results.attempts.push({ method: 'alias', error: String(e) }); }

  // Attempt 7: Try endpoint assets to confirm data exists
  try {
    const q7 = `query { endpointAssets(first: 3) { totalCount edges { node { hostname } } } }`;
    const d7 = await taegisGraphQL(q7, {}, taegisAuth.token, taegisAuth.base);
    results.attempts.push({ method: 'endpointAssets count', total: d7.data?.endpointAssets?.totalCount, sample: d7.data?.endpointAssets?.edges?.slice(0,3), errors: d7.errors });
  } catch (e) { results.attempts.push({ method: 'endpoints', error: String(e) }); }

  return NextResponse.json(results);
}
