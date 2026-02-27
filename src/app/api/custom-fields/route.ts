import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
  const s = await getServerSession(authOptions);
  return s?.user ? (s.user as any) : null;
}

export async function GET() {
  const fields = await prisma.customFieldDef.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ fields });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { name, fieldType, options, required } = await req.json();
  const field = await prisma.customFieldDef.create({ data: { name, fieldType: fieldType || "text", options: options || [], required: required || false } });
  return NextResponse.json({ field });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (id) await prisma.customFieldDef.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
