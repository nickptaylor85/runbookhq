import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const latest = url.searchParams.get("latest");

  if (latest) {
    const handoff = await prisma.shiftHandoff.findFirst({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ handoff });
  }

  const handoffs = await prisma.shiftHandoff.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ handoffs });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const userName = (session.user as any).name || (session.user as any).email;

  if (body.action === "create") {
    // Auto-gather active incidents and pending alerts
    const activeIncidents = await prisma.incident.findMany({ where: { status: { not: "closed" } }, select: { id: true, title: true, severity: true, status: true, phase: true, commander: true } });
    const pendingAlerts = await prisma.alert.findMany({ where: { status: { in: ["new", "claimed"] } }, select: { id: true, title: true, severity: true, status: true, source: true, claimedBy: true } });

    const handoff = await prisma.shiftHandoff.create({
      data: {
        fromAnalyst: userName,
        fromShift: body.fromShift || "current",
        toShift: body.toShift || "next",
        notes: body.notes,
        priority: body.priority || "normal",
        activeIncidents: activeIncidents,
        pendingAlerts: pendingAlerts,
      },
    });
    return NextResponse.json({ handoff });
  }

  if (body.action === "acknowledge") {
    const handoff = await prisma.shiftHandoff.update({
      where: { id: body.handoffId },
      data: { acknowledged: true, acknowledgedBy: userName, acknowledgedAt: new Date() },
    });
    return NextResponse.json({ handoff });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
