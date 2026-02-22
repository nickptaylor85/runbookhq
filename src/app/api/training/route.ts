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

  // Save quiz attempt
  if (action === "saveQuiz") {
    const attempt = await prisma.quizAttempt.create({
      data: { userId: user.id, playbookId: data.playbookId, score: data.score, total: data.total, answers: data.answers }
    });
    return NextResponse.json({ attempt });
  }

  // Award certification
  if (action === "awardCert") {
    const cert = await prisma.certification.create({
      data: { userId: data.userId || user.id, playbookId: data.playbookId, drillScore: data.score, expiresAt: new Date(Date.now() + (data.validDays || 90) * 86400000) }
    });
    await prisma.auditLog.create({ data: { actorId: user.id, action: "CERT_AWARDED", target: data.playbookId, details: { score: data.score, userId: data.userId || user.id } } });
    return NextResponse.json({ certification: cert });
  }

  // Custom inject CRUD
  if (action === "createInject") {
    const inject = await prisma.customInject.create({ data: { title: data.title, text: data.text, severity: data.severity || "medium", category: data.category, timingMin: data.timingMin || 300, timingMax: data.timingMax || 900 } });
    return NextResponse.json({ inject });
  }
  if (action === "deleteInject") {
    await prisma.customInject.delete({ where: { id: data.id } });
    return NextResponse.json({ ok: true });
  }

  // AI Scenario Simulator prompt
  if (action === "simulateScenario") {
    const apiKey = (await prisma.user.findUnique({ where: { id: user.id }, select: { anthropicKey: true } }))?.anthropicKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 });
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 2000,
        system: `You are a cybersecurity incident simulation engine. Generate a realistic, branching incident narrative. The user has made a decision and you must continue the scenario with consequences and new choices. Always output valid JSON with this schema: {"narrative":"string describing what happens next","choices":[{"id":"a","text":"choice description"},{"id":"b","text":"choice description"}],"resolved":false,"score_impact":0}. Set resolved=true when the incident is fully resolved.`,
        messages: [{ role: "user", content: data.prompt }]
      })
    });
    const result = await res.json();
    const text = result.content?.[0]?.text || "{}";
    try { return NextResponse.json({ scenario: JSON.parse(text.replace(/```json|```/g, "").trim()) }); }
    catch { return NextResponse.json({ scenario: { narrative: text, choices: [], resolved: true, score_impact: 0 } }); }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode");

  if (mode === "certs") {
    const certs = await prisma.certification.findMany({ where: { userId: user.id }, orderBy: { awardedAt: "desc" } });
    return NextResponse.json({ certifications: certs });
  }
  if (mode === "quizzes") {
    const attempts = await prisma.quizAttempt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 });
    return NextResponse.json({ attempts });
  }
  if (mode === "injects") {
    const injects = await prisma.customInject.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ injects });
  }
  if (mode === "allCerts") {
    const certs = await prisma.certification.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { awardedAt: "desc" } });
    return NextResponse.json({ certifications: certs });
  }

  return NextResponse.json({ error: "Missing mode" }, { status: 400 });
}
