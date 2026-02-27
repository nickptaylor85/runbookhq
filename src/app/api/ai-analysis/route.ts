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
  const { executionId } = await req.json();
  const exec = await prisma.execution.findUnique({
    where: { id: executionId },
    include: { playbook: true, actions: true, timeline: { orderBy: { createdAt: "asc" } }, evidence: true }
  });
  if (!exec) return NextResponse.json({ error: "Execution not found" }, { status: 404 });

  const apiKey = (await prisma.user.findUnique({ where: { id: user.id }, select: { anthropicKey: true } }))?.anthropicKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 });

  const completedActions = exec.actions.filter(a => a.completed);
  const missedActions = exec.actions.filter(a => !a.completed);
  const duration = exec.completedAt ? Math.round((new Date(exec.completedAt).getTime() - new Date(exec.startedAt).getTime()) / 60000) : null;

  const prompt = `Analyse this completed incident response execution and provide actionable insights.

INCIDENT: ${exec.incidentRef || "No ref"}
PLAYBOOK: ${exec.playbook?.title} (${exec.playbook?.severity} severity, ${exec.playbook?.framework} framework)
MODE: ${exec.mode}
DURATION: ${duration ? duration + " minutes" : "Unknown"}
SCORE: ${exec.score || "N/A"}

COMPLETED ACTIONS (${completedActions.length}/${exec.actions.length}):
${completedActions.map(a => `- [${a.phase}] ${a.actionText} (completed ${a.completedAt ? new Date(a.completedAt).toISOString() : ""})`).join("\n")}

MISSED ACTIONS (${missedActions.length}):
${missedActions.map(a => `- [${a.phase}] ${a.actionText}`).join("\n")}

TIMELINE (${exec.timeline.length} entries):
${exec.timeline.map(t => `[${new Date(t.createdAt).toISOString()}] ${t.type}: ${t.message}`).join("\n")}

EVIDENCE COLLECTED: ${exec.evidence.length} items
IOCs LOGGED: ${Array.isArray(exec.iocs) ? (exec.iocs as any[]).length : 0}

Respond ONLY with valid JSON: {"summary":"2-3 sentence executive summary","whatWorked":["item1","item2"],"whatFailed":["item1"],"playbookChanges":["specific change 1","specific change 2"],"processImprovements":["improvement 1"],"riskScore":1-10,"nextSteps":["step1","step2"]}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, messages: [{ role: "user", content: prompt }] })
    });
    const result = await res.json();
    const text = result.content?.[0]?.text || "{}";
    const analysis = JSON.parse(text.replace(/```json|```/g, "").trim());
    await prisma.execution.update({ where: { id: executionId }, data: { aiAnalysis: analysis } });
    return NextResponse.json({ analysis });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
