import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const severity = url.searchParams.get("severity");
  const source = url.searchParams.get("source");
  const mine = url.searchParams.get("mine");

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (severity && severity !== "all") where.severity = severity;
  if (source && source !== "all") where.source = source;
  if (mine === "true") where.claimedBy = (session.user as any).name || (session.user as any).email;

  const alerts = await prisma.alert.findMany({ where, orderBy: [{ severity: "asc" }, { createdAt: "desc" }], take: 200, include: { incident: { select: { id: true, title: true } } } });

  const stats = {
    total: await prisma.alert.count(),
    new: await prisma.alert.count({ where: { status: "new" } }),
    claimed: await prisma.alert.count({ where: { status: "claimed" } }),
    critical: await prisma.alert.count({ where: { severity: "critical", status: { in: ["new", "claimed"] } } }),
    sources: {} as Record<string, number>,
  };

  const sourceCounts = await prisma.alert.groupBy({ by: ["source"], _count: true });
  sourceCounts.forEach((s) => (stats.sources[s.source] = s._count));

  return NextResponse.json({ alerts, stats });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const userName = (session.user as any).name || (session.user as any).email;

  if (body.action === "create") {
    const alert = await prisma.alert.create({
      data: { title: body.title, source: body.source || "manual", severity: body.severity || "medium", description: body.description, rawData: body.rawData, mitreTactic: body.mitreTactic, mitreTech: body.mitreTech, affectedAsset: body.affectedAsset },
    });
    return NextResponse.json({ alert });
  }

  if (body.action === "claim") {
    const alert = await prisma.alert.update({ where: { id: body.alertId }, data: { status: "claimed", claimedBy: userName } });
    return NextResponse.json({ alert });
  }

  if (body.action === "unclaim") {
    const alert = await prisma.alert.update({ where: { id: body.alertId }, data: { status: "new", claimedBy: null } });
    return NextResponse.json({ alert });
  }

  if (body.action === "resolve") {
    const alert = await prisma.alert.update({ where: { id: body.alertId }, data: { status: body.resolution || "resolved", resolvedAt: new Date() } });
    return NextResponse.json({ alert });
  }

  if (body.action === "escalate") {
    const alert = await prisma.alert.update({ where: { id: body.alertId }, data: { status: "escalated", incidentId: body.incidentId } });
    return NextResponse.json({ alert });
  }

  // Bulk ingest from integrations
  if (body.action === "bulkIngest") {
    const created = await prisma.alert.createMany({
      data: (body.alerts || []).map((a: any) => ({ title: a.title, source: a.source, severity: a.severity || "medium", description: a.description, rawData: a.rawData, mitreTactic: a.mitreTactic, mitreTech: a.mitreTech, affectedAsset: a.affectedAsset })),
      skipDuplicates: true,
    });
    return NextResponse.json({ count: created.count });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) { await prisma.alert.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  // Bulk clear resolved
  const clear = url.searchParams.get("clearResolved");
  if (clear) { await prisma.alert.deleteMany({ where: { status: { in: ["resolved", "false_positive"] } } }); return NextResponse.json({ ok: true }); }
  return NextResponse.json({ error: "Missing id" }, { status: 400 });
}
