import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
  const s = await getServerSession(authOptions);
  return s?.user ? (s.user as any) : null;
}

// Start execution or check action
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, playbookId, executionId, incidentRef, notes, actionId, actionNotes } = await req.json();

  if (action === "start") {
    const playbook = await prisma.playbook.findUnique({ where:{id:playbookId} });
    if (!playbook) return NextResponse.json({ error: "Playbook not found" }, { status: 404 });

    const pbData = playbook.data as any;
    const execution = await prisma.execution.create({
      data: { playbookId, startedById: user.id, incidentRef, notes, status: "RUNNING" },
    });

    // Create exec actions from playbook phases
    const actions: any[] = [];
    if (pbData.phases) {
      for (const phase of pbData.phases) {
        phase.actions?.forEach((a: string, i: number) => {
          actions.push({ executionId: execution.id, phase: phase.name, actionIndex: i, actionText: a });
        });
        if (phase.isReq && phase.isActions) {
          phase.isActions.forEach((a: string, i: number) => {
            actions.push({ executionId: execution.id, phase: `${phase.name} (InfoSec)`, actionIndex: i, actionText: a });
          });
        }
      }
    }
    if (actions.length) await prisma.execAction.createMany({ data: actions });

    // Send webhook
    await sendWebhook(user.id, `🚨 Incident Started: ${pbData.scenario?.t || playbook.title}`, `Playbook "${playbook.title}" execution started${incidentRef ? ` (Ref: ${incidentRef})` : ''}`);

    // Notify
    await prisma.notification.create({
      data: { userId: user.id, type: "INCIDENT_STARTED", title: "Incident Started", message: `Execution of "${playbook.title}" has begun`, link: `/workspace?exec=${execution.id}` },
    });

    return NextResponse.json({ execution, actionCount: actions.length });
  }

  if (action === "checkAction") {
    const execAction = await prisma.execAction.update({
      where: { id: actionId },
      data: { completed: true, completedById: user.id, completedAt: new Date(), notes: actionNotes || null },
    });
    return NextResponse.json({ action: execAction });
  }

  if (action === "uncheckAction") {
    const execAction = await prisma.execAction.update({
      where: { id: actionId },
      data: { completed: false, completedById: null, completedAt: null, notes: null },
    });
    return NextResponse.json({ action: execAction });
  }

  if (action === "complete" || action === "abort") {
    const exec = await prisma.execution.update({
      where: { id: executionId },
      data: { status: action === "complete" ? "COMPLETED" : "ABORTED", completedAt: new Date() },
      include: { playbook: true },
    });

    await sendWebhook(user.id, action === "complete" ? `✅ Incident Resolved` : `⛔ Incident Aborted`, `Playbook "${exec.playbook.title}" execution ${action}ed`);

    await prisma.notification.create({
      data: { userId: user.id, type: "INCIDENT_COMPLETED", title: action === "complete" ? "Incident Resolved" : "Incident Aborted", message: `Execution of "${exec.playbook.title}" ${action}ed` },
    });

    return NextResponse.json({ execution: exec });
  }

  if (action === "pause" || action === "resume") {
    const exec = await prisma.execution.update({
      where: { id: executionId },
      data: { status: action === "pause" ? "PAUSED" : "RUNNING" },
    });
    return NextResponse.json({ execution: exec });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// Get execution details or list
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const executionId = url.searchParams.get("id");
  const mode = url.searchParams.get("mode");

  if (executionId) {
    const exec = await prisma.execution.findUnique({
      where: { id: executionId },
      include: { playbook: true, startedBy: { select:{name:true,email:true} }, actions: { orderBy:{actionIndex:"asc"}, include:{ completedBy:{ select:{name:true,email:true} } } } },
    });
    return NextResponse.json({ execution: exec });
  }

  if (mode === "active") {
    const execs = await prisma.execution.findMany({
      where: { status: { in: ["RUNNING","PAUSED"] } },
      include: { playbook: { select:{title:true,severity:true} }, startedBy:{ select:{name:true} } },
      orderBy: { startedAt: "desc" },
    });
    return NextResponse.json({ executions: execs });
  }

  // Dashboard stats
  if (mode === "stats") {
    const total = await prisma.execution.count();
    const completed = await prisma.execution.count({ where:{status:"COMPLETED"} });
    const active = await prisma.execution.count({ where:{status:{in:["RUNNING","PAUSED"]}} });
    const recent = await prisma.execution.findMany({
      take: 10, orderBy:{startedAt:"desc"},
      include: { playbook:{select:{title:true,severity:true}}, startedBy:{select:{name:true}} },
    });
    return NextResponse.json({ stats: { total, completed, active }, recent });
  }

  // All history
  const execs = await prisma.execution.findMany({
    orderBy: { startedAt: "desc" }, take: 50,
    include: { playbook:{select:{title:true,severity:true}}, startedBy:{select:{name:true,email:true}} },
  });
  return NextResponse.json({ executions: execs });
}

// Webhook helper
async function sendWebhook(userId: string, title: string, text: string) {
  try {
    const user = await prisma.user.findUnique({ where:{id:userId}, select:{slackWebhookUrl:true,teamsWebhookUrl:true} });
    if (user?.slackWebhookUrl) {
      await fetch(user.slackWebhookUrl, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ text:`*${title}*\n${text}` }) }).catch(()=>{});
    }
    if (user?.teamsWebhookUrl) {
      await fetch(user.teamsWebhookUrl, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ "@type":"MessageCard","summary":title,"sections":[{"activityTitle":title,"text":text}] }) }).catch(()=>{});
    }
  } catch {}
}
