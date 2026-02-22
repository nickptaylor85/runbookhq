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
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "100");
  const action = url.searchParams.get("action") || undefined;
  const logs = await prisma.auditLog.findMany({
    where: action ? { action: action as any } : {},
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { name: true, email: true } } },
  });
  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, target, details } = await req.json();
  const log = await prisma.auditLog.create({
    data: { actorId: user.id, action, target, details },
  });
  return NextResponse.json({ log });
}
