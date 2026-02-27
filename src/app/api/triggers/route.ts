import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// External webhook endpoint for SIEM/SOAR integration
// Authenticate via X-API-Key header matching a user's anthropicKey field
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return NextResponse.json({ error: "X-API-Key header required" }, { status: 401 });
  
  // Find user by their stored API key (repurposed as trigger auth)
  const user = await prisma.user.findFirst({ where: { anthropicKey: apiKey, status: "ACTIVE" } });
  if (!user) return NextResponse.json({ error: "Invalid API key" }, { status: 403 });

  const { action, playbookId, incidentRef, severity, notes } = await req.json();

  if (action === "launch") {
    if (!playbookId) return NextResponse.json({ error: "playbookId required" }, { status: 400 });
    const playbook = await prisma.playbook.findUnique({ where: { id: playbookId } });
    if (!playbook) return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
    
    const pbData = playbook.data as any;
    const execution = await prisma.execution.create({
      data: { playbookId, startedById: user.id, incidentRef: incidentRef || `AUTO-${Date.now().toString(36).toUpperCase()}`, notes, status: "RUNNING", mode: "LIVE" },
    });

    // Create exec actions
    const actions: any[] = [];
    if (pbData.phases) {
      for (const phase of pbData.phases) {
        phase.actions?.forEach((a: string, i: number) => {
          actions.push({ executionId: execution.id, phase: phase.name, actionIndex: i, actionText: a });
        });
      }
    }
    if (actions.length) await prisma.execAction.createMany({ data: actions });

    // Send webhook notification
    if (user.slackWebhookUrl) {
      await fetch(user.slackWebhookUrl, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `🚨 *Auto-triggered Incident*\nPlaybook: ${playbook.title}\nRef: ${execution.incidentRef}\nSeverity: ${severity || playbook.severity}` }),
      }).catch(() => {});
    }

    await prisma.notification.create({
      data: { userId: user.id, type: "INCIDENT_STARTED", title: "Auto-triggered Incident", message: `Playbook "${playbook.title}" launched via API trigger`, link: `/workspace?exec=${execution.id}` },
    });

    await prisma.auditLog.create({
      data: { actorId: user.id, action: "EXECUTION_STARTED", target: execution.id, details: { trigger: "api", playbookTitle: playbook.title, incidentRef: execution.incidentRef } },
    });

    return NextResponse.json({ execution: { id: execution.id, incidentRef: execution.incidentRef, actionCount: actions.length, status: "RUNNING" } }, { status: 201 });
  }

  if (action === "list-playbooks") {
    const playbooks = await prisma.playbook.findMany({
      where: { status: { in: ["ACTIVE", "APPROVED"] } },
      select: { id: true, title: true, severity: true, framework: true, status: true },
    });
    return NextResponse.json({ playbooks });
  }

  return NextResponse.json({ error: "Unknown action. Use 'launch' or 'list-playbooks'" }, { status: 400 });
}
