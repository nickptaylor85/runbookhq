import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const record = await prisma.playbookData.findUnique({ where: { userId: (s.user as any).id } });
  return NextResponse.json({ data: record?.data || null });
}

export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (s.user as any).id;
  const { data } = await req.json();
  await prisma.playbookData.upsert({ where:{userId}, create:{userId,data}, update:{data} });
  return NextResponse.json({ saved: true });
}
