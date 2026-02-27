import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
  const s = await getServerSession(authOptions);
  return s?.user ? (s.user as any) : null;
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mode = new URL(req.url).searchParams.get("mode");

  if (mode === "mttr") {
    const execs = await prisma.execution.findMany({
      where: { status: "COMPLETED", completedAt: { not: null } },
      include: { playbook: { select: { severity: true, title: true, framework: true } } },
      orderBy: { completedAt: "desc" }, take: 100
    });
    const mttrData = execs.map(e => ({
      id: e.id, ref: e.incidentRef, title: e.playbook?.title, severity: e.playbook?.severity, mode: e.mode,
      startedAt: e.startedAt, completedAt: e.completedAt,
      durationMin: e.completedAt ? Math.round((new Date(e.completedAt).getTime() - new Date(e.startedAt).getTime()) / 60000) : null
    }));
    const bySeverity: any = {};
    mttrData.filter(m => m.mode === "LIVE" && m.durationMin).forEach(m => {
      const sev = m.severity || "medium";
      if (!bySeverity[sev]) bySeverity[sev] = [];
      bySeverity[sev].push(m.durationMin);
    });
    const avgBySeverity = Object.fromEntries(Object.entries(bySeverity).map(([k, v]: any) => [k, Math.round(v.reduce((s: number, n: number) => s + n, 0) / v.length)]));
    const overallMttr = mttrData.filter(m => m.mode === "LIVE" && m.durationMin).reduce((s, m) => s + (m.durationMin || 0), 0) / Math.max(1, mttrData.filter(m => m.mode === "LIVE").length);
    return NextResponse.json({ mttr: Math.round(overallMttr), bySeverity: avgBySeverity, incidents: mttrData });
  }

  if (mode === "effectiveness") {
    const playbooks = await prisma.playbook.findMany({
      include: { executions: { where: { status: "COMPLETED" }, select: { startedAt: true, completedAt: true, mode: true, score: true } } }
    });
    const effectiveness = playbooks.map(pb => {
      const liveExecs = pb.executions.filter(e => e.mode === "LIVE" && e.completedAt);
      const drillExecs = pb.executions.filter(e => e.mode === "DRILL");
      const avgDuration = liveExecs.length ? Math.round(liveExecs.reduce((s, e) => s + (new Date(e.completedAt!).getTime() - new Date(e.startedAt).getTime()) / 60000, 0) / liveExecs.length) : null;
      const avgDrillScore = drillExecs.length ? Math.round(drillExecs.reduce((s, e) => s + (e.score || 0), 0) / drillExecs.length) : null;
      return { id: pb.id, title: pb.title, severity: pb.severity, liveCount: liveExecs.length, drillCount: drillExecs.length, avgDurationMin: avgDuration, avgDrillScore, status: pb.status };
    }).filter(p => p.liveCount > 0 || p.drillCount > 0);
    return NextResponse.json({ effectiveness });
  }

  if (mode === "patterns") {
    const execs = await prisma.execution.findMany({
      where: { mode: "LIVE", status: "COMPLETED" },
      include: { playbook: { select: { title: true, severity: true } }, actions: { select: { phase: true, completed: true, completedAt: true } } },
      orderBy: { startedAt: "desc" }, take: 50
    });
    // Day of week distribution
    const dayDist = [0, 0, 0, 0, 0, 0, 0];
    execs.forEach(e => { dayDist[new Date(e.startedAt).getDay()]++; });
    // Phase completion rates
    const phaseStats: any = {};
    execs.forEach(e => {
      e.actions.forEach(a => {
        if (!phaseStats[a.phase]) phaseStats[a.phase] = { total: 0, completed: 0 };
        phaseStats[a.phase].total++;
        if (a.completed) phaseStats[a.phase].completed++;
      });
    });
    // Monthly trend
    const monthlyTrend: any = {};
    execs.forEach(e => {
      const key = new Date(e.startedAt).toISOString().slice(0, 7);
      monthlyTrend[key] = (monthlyTrend[key] || 0) + 1;
    });
    return NextResponse.json({ dayDistribution: dayDist, phaseStats, monthlyTrend, totalIncidents: execs.length });
  }

  if (mode === "recommendations") {
    // Generate playbook gap analysis
    const playbooks = await prisma.playbook.findMany({ select: { title: true, severity: true, framework: true, data: true, complianceTags: true } });
    const frameworks = new Set(playbooks.map(p => p.framework));
    const severities = new Set(playbooks.map(p => p.severity));
    const gaps: string[] = [];
    if (!severities.has("critical")) gaps.push("No critical-severity playbooks. Consider adding ransomware or data breach response.");
    if (!frameworks.has("mitre")) gaps.push("No MITRE ATT&CK-aligned playbooks. Consider generating one for adversary-focused response.");
    if (playbooks.length < 5) gaps.push(`Only ${playbooks.length} playbooks. Enterprise-ready programs typically have 8-15 covering different threat scenarios.`);
    const allTags = playbooks.flatMap(p => p.complianceTags);
    if (!allTags.some(t => t.startsWith("soc2"))) gaps.push("No SOC 2 compliance mappings. Map playbook controls for audit readiness.");
    if (!allTags.some(t => t.startsWith("iso27001"))) gaps.push("No ISO 27001 compliance mappings.");
    return NextResponse.json({ recommendations: gaps, playbookCount: playbooks.length, frameworkCount: frameworks.size });
  }

  return NextResponse.json({ error: "mode required: mttr, effectiveness, patterns, recommendations" }, { status: 400 });
}
