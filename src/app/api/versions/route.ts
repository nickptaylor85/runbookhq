import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
  const s = await getServerSession(authOptions);
  return s?.user ? (s.user as any).id : null;
}

export async function POST(req: NextRequest) {
  const userId = await getUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { playbookId, data, changelog } = await req.json();
  const lastVersion = await prisma.playbookVersion.findFirst({ where:{playbookId}, orderBy:{version:"desc"} });
  const version = (lastVersion?.version || 0) + 1;
  const v = await prisma.playbookVersion.create({ data:{ playbookId, version, data, changelog: changelog || `Version ${version}`, createdById: userId } });
  return NextResponse.json({ version: v });
}

export async function GET(req: NextRequest) {
  const userId = await getUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const playbookId = new URL(req.url).searchParams.get("playbookId");
  if (!playbookId) return NextResponse.json({ error: "playbookId required" }, { status: 400 });
  const versions = await prisma.playbookVersion.findMany({
    where: { playbookId },
    orderBy: { version: "desc" },
    include: { createdBy: { select: { name:true, email:true } } },
  });
  return NextResponse.json({ versions });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { playbookId, version } = await req.json();
  const v = await prisma.playbookVersion.findFirst({ where:{ playbookId, version } });
  if (!v) return NextResponse.json({ error: "Version not found" }, { status: 404 });
  await prisma.playbook.update({ where:{id:playbookId}, data:{ data: v.data as any } });
  return NextResponse.json({ message: "Rolled back", data: v.data });
}
