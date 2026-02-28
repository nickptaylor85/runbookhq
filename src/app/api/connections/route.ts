import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SUPPORTED = [
  { type: "defender", name: "Microsoft Defender", fields: ["tenantId", "clientId", "clientSecret"], desc: "Pull alerts and incidents from Microsoft 365 Defender via Graph API" },
  { type: "tenable", name: "Tenable.io", fields: ["apiKey"], desc: "Import vulnerability data and asset inventory from Tenable" },
  { type: "sentinel", name: "Microsoft Sentinel", fields: ["tenantId", "clientId", "clientSecret"], desc: "Ingest Sentinel incidents and alerts via Log Analytics" },
  { type: "crowdstrike", name: "CrowdStrike Falcon", fields: ["clientId", "clientSecret"], desc: "Pull detections and host data from Falcon platform" },
  { type: "zscaler", name: "Zscaler ZIA", fields: ["apiUrl", "apiKey"], desc: "Web security events and policy violations" },
  { type: "splunk", name: "Splunk", fields: ["apiUrl", "apiKey"], desc: "Search and ingest alerts from Splunk Enterprise/Cloud" },
  { type: "pagerduty", name: "PagerDuty", fields: ["apiKey"], desc: "On-call schedules, incident management, and escalation" },
  { type: "jira", name: "Jira", fields: ["apiUrl", "apiKey", "extraConfig"], desc: "Create and track security tickets in Jira" },
  { type: "slack", name: "Slack", fields: ["apiUrl"], desc: "Send alert notifications to Slack channels" },
  { type: "teams", name: "Microsoft Teams", fields: ["apiUrl"], desc: "Send notifications to Teams channels via webhook" },
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const integrations = await prisma.integration.findMany({ orderBy: { name: "asc" } });
  const masked = integrations.map((i) => ({ ...i, apiKey: i.apiKey ? "••••" + i.apiKey.slice(-4) : null, clientSecret: i.clientSecret ? "••••" + i.clientSecret.slice(-4) : null }));
  return NextResponse.json({ integrations: masked, supported: SUPPORTED });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "MANAGER") return NextResponse.json({ error: "Admin/Manager only" }, { status: 403 });
  const body = await req.json();

  if (body.action === "configure") {
    const integration = await prisma.integration.upsert({
      where: { name: body.name },
      update: { type: body.type, apiUrl: body.apiUrl, apiKey: body.apiKey, tenantId: body.tenantId, clientId: body.clientId, clientSecret: body.clientSecret, extraConfig: body.extraConfig, enabled: body.enabled ?? true, syncInterval: body.syncInterval || 300 },
      create: { name: body.name, type: body.type, apiUrl: body.apiUrl, apiKey: body.apiKey, tenantId: body.tenantId, clientId: body.clientId, clientSecret: body.clientSecret, extraConfig: body.extraConfig, enabled: body.enabled ?? true, syncInterval: body.syncInterval || 300 },
    });
    return NextResponse.json({ integration: { ...integration, apiKey: integration.apiKey ? "••••" + integration.apiKey.slice(-4) : null, clientSecret: integration.clientSecret ? "••••" + integration.clientSecret.slice(-4) : null } });
  }

  if (body.action === "test") {
    const integration = await prisma.integration.findUnique({ where: { name: body.name } });
    if (!integration) return NextResponse.json({ error: "Not found" }, { status: 404 });
    try {
      let result = { ok: false, message: "", count: 0 };
      if (integration.type === "defender" && integration.tenantId && integration.clientId && integration.clientSecret) {
        const tokenRes = await fetch(`https://login.microsoftonline.com/${integration.tenantId}/oauth2/v2.0/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `client_id=${integration.clientId}&client_secret=${integration.clientSecret}&scope=https://graph.microsoft.com/.default&grant_type=client_credentials` });
        if (tokenRes.ok) { const t = await tokenRes.json(); const r = await fetch("https://graph.microsoft.com/v1.0/security/alerts_v2?$top=1", { headers: { Authorization: `Bearer ${t.access_token}` } }); result = r.ok ? { ok: true, message: "Connected to Defender", count: 0 } : { ok: false, message: `Graph API: ${r.status}`, count: 0 }; }
        else result = { ok: false, message: `Auth failed: ${tokenRes.status}`, count: 0 };
      } else if (integration.type === "tenable" && integration.apiKey) {
        const keys = integration.apiKey.split(";");
        const r = await fetch("https://cloud.tenable.com/server/properties", { headers: { "X-ApiKeys": `accessKey=${keys[0]};secretKey=${keys[1] || keys[0]}` } });
        result = r.ok ? { ok: true, message: "Connected to Tenable.io", count: 0 } : { ok: false, message: `Tenable: ${r.status}`, count: 0 };
      } else if (integration.type === "pagerduty" && integration.apiKey) {
        const r = await fetch("https://api.pagerduty.com/abilities", { headers: { Authorization: `Token token=${integration.apiKey}`, "Content-Type": "application/json" } });
        result = r.ok ? { ok: true, message: "Connected to PagerDuty", count: 0 } : { ok: false, message: `PagerDuty: ${r.status}`, count: 0 };
      } else if ((integration.type === "slack" || integration.type === "teams") && integration.apiUrl) {
        const r = await fetch(integration.apiUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "🔔 SecOpsHQ integration test" }) });
        result = r.ok ? { ok: true, message: `${integration.type === "slack" ? "Slack" : "Teams"} webhook working`, count: 0 } : { ok: false, message: `Webhook: ${r.status}`, count: 0 };
      } else { result = { ok: true, message: "Config saved (live test not available for this type)", count: 0 }; }
      await prisma.integration.update({ where: { name: body.name }, data: { status: result.ok ? "connected" : "error", lastSync: result.ok ? new Date() : undefined, lastError: result.ok ? null : result.message } });
      return NextResponse.json({ result });
    } catch (e: any) {
      await prisma.integration.update({ where: { name: body.name }, data: { status: "error", lastError: e.message } });
      return NextResponse.json({ result: { ok: false, message: e.message } });
    }
  }

  if (body.action === "sync") {
    const integration = await prisma.integration.findUnique({ where: { name: body.name } });
    if (!integration?.enabled) return NextResponse.json({ error: "Not enabled" }, { status: 400 });
    let synced = 0;
    try {
      if (integration.type === "defender" && integration.tenantId && integration.clientId && integration.clientSecret) {
        const tokenRes = await fetch(`https://login.microsoftonline.com/${integration.tenantId}/oauth2/v2.0/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `client_id=${integration.clientId}&client_secret=${integration.clientSecret}&scope=https://graph.microsoft.com/.default&grant_type=client_credentials` });
        if (tokenRes.ok) {
          const token = await tokenRes.json();
          const r = await fetch("https://graph.microsoft.com/v1.0/security/alerts_v2?$top=50&$filter=status ne 'resolved'", { headers: { Authorization: `Bearer ${token.access_token}` } });
          if (r.ok) { const data = await r.json(); for (const a of data.value || []) { const sev: any = { high: "high", medium: "medium", low: "low", informational: "info" }; await prisma.alert.create({ data: { title: a.title || "Defender Alert", source: "Microsoft Defender", severity: sev[a.severity?.toLowerCase()] || "medium", description: a.description, rawData: a, mitreTactic: a.mitreTechniques?.[0]?.tactic, mitreTech: a.mitreTechniques?.[0]?.technique, affectedAsset: a.evidence?.[0]?.deviceDnsName } }).catch(() => {}); synced++; } }
        }
      }
      await prisma.integration.update({ where: { name: body.name }, data: { lastSync: new Date(), status: "connected", lastError: null } });
      return NextResponse.json({ synced });
    } catch (e: any) {
      await prisma.integration.update({ where: { name: body.name }, data: { lastError: e.message, status: "error" } });
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (body.action === "toggle") {
    await prisma.integration.update({ where: { name: body.name }, data: { enabled: body.enabled } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const name = new URL(req.url).searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });
  await prisma.integration.delete({ where: { name } });
  return NextResponse.json({ ok: true });
}
