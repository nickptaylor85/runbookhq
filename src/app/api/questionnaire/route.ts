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

  // Gather all platform data for questionnaire answers
  const playbooks = await prisma.playbook.findMany({ where: { status: { in: ["APPROVED", "ACTIVE"] } } });
  const drills = await prisma.execution.findMany({ where: { mode: "DRILL", status: "COMPLETED" }, orderBy: { completedAt: "desc" } });
  const incidents = await prisma.execution.findMany({ where: { mode: "LIVE", status: "COMPLETED" }, orderBy: { completedAt: "desc" } });
  const certs = await prisma.certification.findMany({ where: { expiresAt: { gte: new Date() } } });
  const branding = await prisma.brandingConfig.findFirst();

  const allTags = playbooks.flatMap(p => p.complianceTags);
  const frameworks = new Set(playbooks.map(p => p.framework));
  const totalActions = playbooks.reduce((s, p) => s + ((p.data as any)?.phases?.reduce((ps: number, ph: any) => ps + (ph.actions?.length || 0), 0) || 0), 0);
  const avgDrillScore = drills.length ? Math.round(drills.reduce((s, d) => s + (d.score || 0), 0) / drills.length) : null;

  // Calculate MTTR
  const liveWithCompletion = incidents.filter(i => i.completedAt);
  const mttr = liveWithCompletion.length ? Math.round(liveWithCompletion.reduce((s, i) => s + (new Date(i.completedAt!).getTime() - new Date(i.startedAt).getTime()) / 60000, 0) / liveWithCompletion.length) : null;

  // Build Q&A pairs
  const answers: any = {
    "Do you have a documented incident response plan?": `Yes. We maintain ${playbooks.length} approved incident response playbooks covering ${[...frameworks].join(", ")} frameworks with ${totalActions} total response actions.`,
    "How often do you test your incident response plan?": drills.length ? `We conduct regular tabletop exercises. ${drills.length} drills completed to date${drills[0] ? `, most recent on ${new Date(drills[0].completedAt || drills[0].startedAt).toLocaleDateString()}` : ""}.${avgDrillScore ? ` Average drill score: ${avgDrillScore}%.` : ""}` : "Tabletop drill capability is configured and available.",
    "What is your average incident response time?": mttr ? `Our Mean Time to Respond (MTTR) across ${liveWithCompletion.length} resolved incidents is ${mttr} minutes.` : "MTTR tracking is configured. No completed incidents to report.",
    "Do you have defined roles and responsibilities for incident response?": `Yes. Our playbooks include role-based action assignments with auto-generated RACI matrices. Response roles are assigned to specific framework phases.`,
    "What frameworks does your IR program align to?": `Our program aligns to ${[...frameworks].map(f => f.toUpperCase()).join(", ")}. We maintain playbooks across ${frameworks.size} framework${frameworks.size > 1 ? "s" : ""}.`,
    "Do you map controls to compliance frameworks?": allTags.length ? `Yes. We map incident response controls to ${allTags.some(t => t.startsWith("soc2")) ? "SOC 2, " : ""}${allTags.some(t => t.startsWith("iso27001")) ? "ISO 27001, " : ""}${allTags.some(t => t.startsWith("nistcsf")) ? "NIST CSF" : ""}. ${allTags.length} control mappings across all playbooks.`.replace(/, $/, ".") : "Compliance mapping capability is available. Control tagging in progress.",
    "Do you maintain certification records for incident responders?": certs.length ? `Yes. ${certs.length} active certifications for incident response personnel, validated through scored tabletop exercises with ${avgDrillScore ? avgDrillScore + "%" : ""} average proficiency.` : "Certification tracking is configured.",
    "How do you track and preserve incident evidence?": "Our platform includes integrated evidence collection during incident response — screenshots, log snippets, IOC tracking, and communication timeline. All evidence is timestamped, attributed, and linked to specific playbook actions.",
    "Do you conduct post-incident reviews?": "Yes. Post-Incident Reports (PIRs) are generated from execution data including full action timeline, completion rates, SLA compliance, and AI-assisted analysis with improvement recommendations.",
  };

  return NextResponse.json({ company: branding?.companyName || "Organisation", answers, generatedAt: new Date().toISOString() });
}
