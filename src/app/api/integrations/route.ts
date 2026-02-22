import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
  const s = await getServerSession(authOptions);
  return s?.user ? (s.user as any) : null;
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, data } = await req.json();

  // Webhook builder CRUD
  if (action === "createWebhook") {
    const wh = await prisma.webhookConfig.create({ data: { name: data.name, url: data.url, method: data.method || "POST", headers: data.headers, payloadTpl: data.payloadTpl, events: data.events || [] } });
    return NextResponse.json({ webhook: wh });
  }
  if (action === "testWebhook") {
    try {
      const payload = data.payloadTpl ? JSON.parse(data.payloadTpl.replace(/\{\{([^}]+)\}\}/g, "test")) : { text: "RunbookHQ webhook test" };
      const res = await fetch(data.url, { method: data.method || "POST", headers: { "Content-Type": "application/json", ...(data.headers || {}) }, body: JSON.stringify(payload) });
      return NextResponse.json({ success: res.ok, status: res.status });
    } catch (e: any) { return NextResponse.json({ success: false, error: e.message }); }
  }
  if (action === "fireWebhooks") {
    const hooks = await prisma.webhookConfig.findMany({ where: { active: true, events: { has: data.event } } });
    const results = [];
    for (const h of hooks) {
      try {
        let payload = h.payloadTpl || '{"event":"{{event}}","data":"{{data}}"}';
        payload = payload.replace(/\{\{event\}\}/g, data.event).replace(/\{\{data\}\}/g, JSON.stringify(data.payload || {}))
          .replace(/\{\{title\}\}/g, data.payload?.title || "").replace(/\{\{severity\}\}/g, data.payload?.severity || "")
          .replace(/\{\{ref\}\}/g, data.payload?.ref || "").replace(/\{\{timestamp\}\}/g, new Date().toISOString());
        await fetch(h.url, { method: h.method || "POST", headers: { "Content-Type": "application/json", ...((h.headers as any) || {}) }, body: payload });
        results.push({ id: h.id, name: h.name, success: true });
      } catch { results.push({ id: h.id, name: h.name, success: false }); }
    }
    return NextResponse.json({ results });
  }

  // Ticket creation (generic — works with Jira, ServiceNow, etc.)
  if (action === "createTicket") {
    const { executionId, system, endpoint, auth, fields } = data;
    try {
      const headers: any = { "Content-Type": "application/json" };
      if (auth?.type === "basic") headers["Authorization"] = `Basic ${Buffer.from(`${auth.user}:${auth.pass}`).toString("base64")}`;
      else if (auth?.type === "bearer") headers["Authorization"] = `Bearer ${auth.token}`;
      else if (auth?.type === "apikey") headers[auth.headerName || "X-API-Key"] = auth.key;
      const res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(fields) });
      const result = await res.json();
      if (executionId) {
        await prisma.execution.update({ where: { id: executionId }, data: { ticketUrl: result.self || result.url || result.key || endpoint } });
      }
      await prisma.auditLog.create({ data: { actorId: user.id, action: "TICKET_CREATED", target: executionId, details: { system, key: result.key || result.number } } });
      return NextResponse.json({ ticket: result });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  }

  // PagerDuty / Opsgenie escalation
  if (action === "escalate") {
    const { service, endpoint, apiKey, title, severity, details } = data;
    try {
      let body, headers: any = { "Content-Type": "application/json" };
      if (service === "pagerduty") {
        headers["Authorization"] = `Token token=${apiKey}`;
        body = { incident: { type: "incident", title, service: { id: details.serviceId, type: "service_reference" }, urgency: severity === "critical" ? "high" : "low", body: { type: "incident_body", details: details.description || title } } };
      } else {
        headers["Authorization"] = `GenieKey ${apiKey}`;
        body = { message: title, priority: severity === "critical" ? "P1" : severity === "high" ? "P2" : "P3", description: details.description || title };
      }
      const res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) });
      return NextResponse.json({ result: await res.json(), success: res.ok });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const webhooks = await prisma.webhookConfig.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ webhooks });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (id) await prisma.webhookConfig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
