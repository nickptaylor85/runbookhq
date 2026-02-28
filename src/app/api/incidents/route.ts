import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// GET - List incidents with filters
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const severity = url.searchParams.get("severity");
  const id = url.searchParams.get("id");

  if (id) {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: { tasks: { orderBy: { createdAt: "asc" } }, logs: { orderBy: { createdAt: "desc" }, take: 50 }, alerts: true, user: { select: { name: true, email: true } } },
    });
    return NextResponse.json({ incident });
  }

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (severity && severity !== "all") where.severity = severity;

  const incidents = await prisma.incident.findMany({
    where,
    include: { tasks: true, alerts: { select: { id: true } }, logs: { take: 1, orderBy: { createdAt: "desc" } }, user: { select: { name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const stats = {
    open: await prisma.incident.count({ where: { status: { not: "closed" } } }),
    critical: await prisma.incident.count({ where: { severity: "critical", status: { not: "closed" } } }),
    avgTasks: 0,
  };

  return NextResponse.json({ incidents, stats });
}

// POST - Create incident or perform actions
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const userId = (session.user as any).id;
  const userName = (session.user as any).name || (session.user as any).email;

  // Create new incident
  if (body.action === "create") {
    const incident = await prisma.incident.create({
      data: {
        title: body.title,
        severity: body.severity || "medium",
        description: body.description,
        source: body.source,
        commander: body.commander || userName,
        playbookRef: body.playbookRef,
        affectedAssets: body.affectedAssets || [],
        tags: body.tags || [],
        userId,
      },
    });

    // Create tasks from playbook if provided
    if (body.tasks?.length) {
      await prisma.incidentTask.createMany({
        data: body.tasks.map((t: any, i: number) => ({
          incidentId: incident.id,
          phase: t.phase,
          action: t.action,
          assignee: t.assignee,
          priority: i,
        })),
      });
    }

    await prisma.incidentLog.create({
      data: { incidentId: incident.id, action: "INCIDENT_CREATED", actor: userName, details: `Incident "${body.title}" created with severity ${body.severity}` },
    });

    return NextResponse.json({ incident });
  }

  // Update incident phase/status
  if (body.action === "updateStatus") {
    const update: any = {};
    if (body.status) update.status = body.status;
    if (body.phase) update.phase = body.phase;
    if (body.commander) update.commander = body.commander;
    if (body.status === "closed") update.closedAt = new Date();

    const incident = await prisma.incident.update({ where: { id: body.incidentId }, data: update });

    await prisma.incidentLog.create({
      data: { incidentId: body.incidentId, action: "STATUS_CHANGED", actor: userName, phase: body.phase, details: `Status → ${body.status || ""}${body.phase ? `, Phase → ${body.phase}` : ""}` },
    });

    return NextResponse.json({ incident });
  }

  // Complete a task
  if (body.action === "completeTask") {
    const task = await prisma.incidentTask.update({
      where: { id: body.taskId },
      data: { status: "completed", completedAt: new Date(), completedBy: userName, notes: body.notes },
    });

    await prisma.incidentLog.create({
      data: { incidentId: body.incidentId, action: "TASK_COMPLETED", actor: userName, phase: task.phase, details: `Completed: ${task.action}${body.notes ? ` — ${body.notes}` : ""}` },
    });

    return NextResponse.json({ task });
  }

  // Add task
  if (body.action === "addTask") {
    const task = await prisma.incidentTask.create({
      data: { incidentId: body.incidentId, phase: body.phase, action: body.taskAction, assignee: body.assignee },
    });
    await prisma.incidentLog.create({
      data: { incidentId: body.incidentId, action: "TASK_ADDED", actor: userName, phase: body.phase, details: `Added task: ${body.taskAction}` },
    });
    return NextResponse.json({ task });
  }

  // Add log entry
  if (body.action === "addLog") {
    const log = await prisma.incidentLog.create({
      data: { incidentId: body.incidentId, action: body.logAction || "NOTE", actor: userName, phase: body.phase, details: body.details, metadata: body.metadata },
    });
    return NextResponse.json({ log });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.incident.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
