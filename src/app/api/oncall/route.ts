import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const schedules = await prisma.onCallSchedule.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ schedules });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body.action === "create") {
    const schedule = await prisma.onCallSchedule.create({
      data: { name: body.name, teamId: body.teamId, schedule: body.schedule || {}, currentPrimary: body.currentPrimary, currentSecondary: body.currentSecondary, escalationChain: body.escalationChain, rotationType: body.rotationType || "weekly", nextRotation: body.nextRotation ? new Date(body.nextRotation) : null },
    });
    return NextResponse.json({ schedule });
  }

  if (body.action === "update") {
    const schedule = await prisma.onCallSchedule.update({
      where: { id: body.id },
      data: { ...(body.currentPrimary && { currentPrimary: body.currentPrimary }), ...(body.currentSecondary !== undefined && { currentSecondary: body.currentSecondary }), ...(body.schedule && { schedule: body.schedule }), ...(body.escalationChain && { escalationChain: body.escalationChain }), ...(body.nextRotation && { nextRotation: new Date(body.nextRotation) }) },
    });
    return NextResponse.json({ schedule });
  }

  if (body.action === "rotate") {
    // Advance rotation
    const sched = await prisma.onCallSchedule.findUnique({ where: { id: body.id } });
    if (!sched) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const members = (sched.schedule as any)?.members || [];
    const currentIdx = members.indexOf(sched.currentPrimary);
    const nextIdx = (currentIdx + 1) % members.length;
    const nextSecIdx = (nextIdx + 1) % members.length;
    const updated = await prisma.onCallSchedule.update({
      where: { id: body.id },
      data: { currentPrimary: members[nextIdx], currentSecondary: members[nextSecIdx] || null },
    });
    return NextResponse.json({ schedule: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.onCallSchedule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
