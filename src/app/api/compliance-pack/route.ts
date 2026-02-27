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
  const framework = new URL(req.url).searchParams.get("framework") || "soc2";

  const playbooks = await prisma.playbook.findMany({ where: { status: { in: ["APPROVED", "ACTIVE"] } }, include: { executions: { where: { status: "COMPLETED" }, take: 10, orderBy: { completedAt: "desc" } } } });
  const certs = await prisma.certification.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { awardedAt: "desc" }, take: 20 });
  const drills = await prisma.execution.findMany({ where: { mode: "DRILL", status: "COMPLETED" }, take: 20, orderBy: { completedAt: "desc" }, include: { playbook: { select: { title: true } } } });
  const liveIncidents = await prisma.execution.findMany({ where: { mode: "LIVE", status: "COMPLETED" }, take: 20, orderBy: { completedAt: "desc" }, include: { playbook: { select: { title: true, severity: true } } } });

  // Build evidence pack
  const pack: any = {
    generatedAt: new Date().toISOString(),
    framework,
    organisation: (await prisma.brandingConfig.findFirst())?.companyName || "Organisation",
    summary: {
      approvedPlaybooks: playbooks.length,
      totalActions: playbooks.reduce((s, p) => s + ((p.data as any)?.phases?.reduce((ps: number, ph: any) => ps + (ph.actions?.length || 0), 0) || 0), 0),
      completedDrills: drills.length,
      liveIncidents: liveIncidents.length,
      activeCertifications: certs.filter(c => new Date(c.expiresAt) > new Date()).length,
      complianceCoverage: {}
    },
    playbooks: playbooks.map(pb => ({
      title: pb.title, status: pb.status, severity: pb.severity, framework: pb.framework,
      complianceTags: pb.complianceTags,
      phases: ((pb.data as any)?.phases || []).length,
      actions: ((pb.data as any)?.phases || []).reduce((s: number, ph: any) => s + (ph.actions?.length || 0), 0),
      lastExecution: pb.executions[0]?.completedAt || null
    })),
    drillHistory: drills.map(d => ({
      playbook: d.playbook?.title, date: d.completedAt, score: d.score, ref: d.incidentRef
    })),
    incidentHistory: liveIncidents.map(i => ({
      playbook: i.playbook?.title, severity: i.playbook?.severity, date: i.completedAt, ref: i.incidentRef
    })),
    certifications: certs.map(c => ({
      user: c.user?.name || c.user?.email, score: c.drillScore, awarded: c.awardedAt, expires: c.expiresAt, valid: new Date(c.expiresAt) > new Date()
    })),
    controlMapping: {}
  };

  // Compliance coverage percentages
  const soc2Controls = ["CC6.1", "CC6.2", "CC6.8", "CC7.2", "CC7.3", "CC7.4", "CC8.1"];
  const iso27001Controls = ["A.5.24", "A.5.25", "A.5.26", "A.5.27", "A.5.28", "A.8.15", "A.8.16"];
  const nistCsfControls = ["DE.AE", "DE.CM", "DE.DP", "RS.RP", "RS.CO", "RS.AN", "RS.MI", "RS.IM", "RC.RP"];
  const allTags = playbooks.flatMap(p => p.complianceTags);
  pack.summary.complianceCoverage = {
    soc2: Math.round(soc2Controls.filter(c => allTags.some(t => t.includes(c))).length / soc2Controls.length * 100),
    iso27001: Math.round(iso27001Controls.filter(c => allTags.some(t => t.includes(c))).length / iso27001Controls.length * 100),
    nistCsf: Math.round(nistCsfControls.filter(c => allTags.some(t => t.includes(c))).length / nistCsfControls.length * 100)
  };

  return NextResponse.json({ pack });
}
