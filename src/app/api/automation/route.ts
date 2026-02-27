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

  if (action === "define") {
    const auto = await prisma.automationDef.create({
      data: { playbookId: data.playbookId, phase: data.phase, actionIndex: data.actionIndex, name: data.name, method: data.method || "POST", endpoint: data.endpoint, headers: data.headers, body: data.body, authType: data.authType, authValue: data.authValue }
    });
    return NextResponse.json({ automation: auto });
  }

  if (action === "run") {
    const auto = await prisma.automationDef.findUnique({ where: { id: data.automationId } });
    if (!auto) return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    try {
      const headers: any = { "Content-Type": "application/json", ...((auto.headers as any) || {}) };
      if (auto.authType === "bearer") headers["Authorization"] = `Bearer ${auto.authValue}`;
      else if (auto.authType === "apikey") headers["X-API-Key"] = auto.authValue;
      else if (auto.authType === "basic") headers["Authorization"] = `Basic ${Buffer.from(auto.authValue || "").toString("base64")}`;
      const res = await fetch(auto.endpoint, { method: auto.method || "POST", headers, body: auto.body || undefined });
      const result = await res.text();
      await prisma.auditLog.create({ data: { actorId: user.id, action: "AUTOMATION_RUN", target: auto.id, details: { name: auto.name, status: res.status, success: res.ok } } });
      // Add to execution timeline if executionId provided
      if (data.executionId) {
        await prisma.timelineEntry.create({ data: { executionId: data.executionId, userId: user.id, type: "automation", message: `Automation "${auto.name}" executed — ${res.ok ? "Success" : "Failed"} (${res.status})`, phase: auto.phase, metadata: { automationId: auto.id, status: res.status } } });
      }
      return NextResponse.json({ success: res.ok, status: res.status, result: result.slice(0, 2000) });
    } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
  }

  if (action === "delete") {
    await prisma.automationDef.delete({ where: { id: data.id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const playbookId = new URL(req.url).searchParams.get("playbookId");
  if (!playbookId) return NextResponse.json({ error: "playbookId required" }, { status: 400 });
  const automations = await prisma.automationDef.findMany({ where: { playbookId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ automations });
}
