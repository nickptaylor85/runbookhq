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
  const { action, playbookId } = await req.json();

  if (action === "publish") {
    const pb = await prisma.playbook.findUnique({ where: { id: playbookId } });
    if (!pb || pb.ownerId !== user.id) return NextResponse.json({ error: "Not found or not owner" }, { status: 404 });
    // Anonymise: strip team names, tool names, keep structure
    const data = pb.data as any;
    const anonymised = {
      ...data,
      phases: data.phases?.map((ph: any) => ({
        ...ph,
        teams: ph.teams?.map((t: any) => ({ ...t, name: "Team" })) || [],
        tools: ph.tools?.map((t: any) => ({ ...t, name: "Tool", cat: t.cat })) || [],
        actions: ph.actions?.map((a: string) => a.replace(/\[[^\]]+\]/g, "[Role]")) || []
      }))
    };
    await prisma.playbook.update({ where: { id: playbookId }, data: { published: true, publishedAt: new Date(), data: { ...data, publishedData: anonymised } } });
    await prisma.auditLog.create({ data: { actorId: user.id, action: "PLAYBOOK_PUBLISHED", target: playbookId } });
    return NextResponse.json({ ok: true });
  }

  if (action === "clone") {
    const pb = await prisma.playbook.findUnique({ where: { id: playbookId } });
    if (!pb?.published) return NextResponse.json({ error: "Not published" }, { status: 404 });
    const data = (pb.data as any)?.publishedData || pb.data;
    const clone = await prisma.playbook.create({
      data: { title: pb.title + " (community)", severity: pb.severity, framework: pb.framework, status: "DRAFT", data, ownerId: user.id }
    });
    return NextResponse.json({ playbook: clone });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET() {
  const published = await prisma.playbook.findMany({
    where: { published: true },
    select: { id: true, title: true, severity: true, framework: true, publishedAt: true, complianceTags: true,
      owner: { select: { company: true } },
      _count: { select: { executions: true } }
    },
    orderBy: { publishedAt: "desc" }
  });
  return NextResponse.json({ playbooks: published });
}
