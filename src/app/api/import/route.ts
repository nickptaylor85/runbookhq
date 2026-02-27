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
  const { format, data } = await req.json();

  try {
    if (format === "json") {
      const imported = typeof data === "string" ? JSON.parse(data) : data;
      const playbooks = Array.isArray(imported) ? imported : [imported];
      let count = 0;
      for (const pb of playbooks) {
        if (!pb.title || !pb.phases) continue;
        await prisma.playbook.create({
          data: { title: pb.title, description: pb.description || pb.scenario?.d, severity: pb.severity || pb.scenario?.s || "medium", framework: pb.framework || "nist", status: "DRAFT", data: pb, ownerId: user.id }
        });
        count++;
      }
      await prisma.auditLog.create({ data: { actorId: user.id, action: "PLAYBOOK_IMPORTED", details: { format: "json", count } } });
      return NextResponse.json({ imported: count });
    }

    if (format === "csv") {
      const lines = data.split("\n").map((l: string) => l.split(",").map((c: string) => c.trim().replace(/^"|"$/g, "")));
      if (lines.length < 2) return NextResponse.json({ error: "CSV must have header row and data" }, { status: 400 });
      const headers = lines[0].map((h: string) => h.toLowerCase());
      const phaseIdx = headers.indexOf("phase");
      const actionIdx = headers.indexOf("action");
      const roleIdx = headers.indexOf("role");
      if (phaseIdx < 0 || actionIdx < 0) return NextResponse.json({ error: "CSV must have Phase and Action columns" }, { status: 400 });

      const phases: any = {};
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (!row[phaseIdx]) continue;
        const pName = row[phaseIdx];
        if (!phases[pName]) phases[pName] = { name: pName, emoji: "📋", actions: [], tools: [], teams: [], isReq: false, isActions: [] };
        const action = roleIdx >= 0 && row[roleIdx] ? `[${row[roleIdx]}] ${row[actionIdx]}` : row[actionIdx];
        phases[pName].actions.push(action);
      }
      const pbData = { phases: Object.values(phases).map((p: any, i: number) => ({ ...p, idx: i })), scenario: { t: "Imported Playbook", d: "Imported from CSV", s: "medium" } };
      await prisma.playbook.create({ data: { title: "Imported Playbook", severity: "medium", framework: "nist", status: "DRAFT", data: pbData, ownerId: user.id } });
      await prisma.auditLog.create({ data: { actorId: user.id, action: "PLAYBOOK_IMPORTED", details: { format: "csv", phases: Object.keys(phases).length } } });
      return NextResponse.json({ imported: 1, phases: Object.keys(phases).length });
    }

    return NextResponse.json({ error: "Unsupported format. Use json or csv" }, { status: 400 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
