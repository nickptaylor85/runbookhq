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
  const { executionId, type, message, phase, metadata } = await req.json();
  if (!executionId || !message) return NextResponse.json({ error: "executionId and message required" }, { status: 400 });
  const entry = await prisma.timelineEntry.create({
    data: { executionId, userId: user.id, type: type || "update", message, phase, metadata },
    include: { user: { select: { name: true, email: true } } }
  });
  return NextResponse.json({ entry });
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const executionId = new URL(req.url).searchParams.get("executionId");
  if (!executionId) return NextResponse.json({ error: "executionId required" }, { status: 400 });
  const entries = await prisma.timelineEntry.findMany({
    where: { executionId }, orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true, email: true } } }
  });
  return NextResponse.json({ entries });
}
