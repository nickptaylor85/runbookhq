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
  const { executionId, phase, actionIndex, type, title, content, metadata } = await req.json();
  if (!executionId || !title || !content) return NextResponse.json({ error: "executionId, title, content required" }, { status: 400 });
  const ev = await prisma.evidence.create({
    data: { executionId, userId: user.id, phase, actionIndex, type: type || "note", title, content, metadata },
    include: { user: { select: { name: true } } }
  });
  await prisma.auditLog.create({ data: { actorId: user.id, action: "EVIDENCE_ADDED", target: executionId, details: { type, title } } });
  return NextResponse.json({ evidence: ev });
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const executionId = new URL(req.url).searchParams.get("executionId");
  if (!executionId) return NextResponse.json({ error: "executionId required" }, { status: 400 });
  const items = await prisma.evidence.findMany({
    where: { executionId }, orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true } } }
  });
  return NextResponse.json({ evidence: items });
}
