import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user && (s.user as any).role === "ADMIN" ? s : null;
}

async function requireAuth() {
  const s = await getServerSession(authOptions);
  return s?.user ? s : null;
}

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mode = new URL(req.url).searchParams.get("mode");

  // Self profile
  if (mode === "self") {
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { id:true,name:true,email:true,role:true,status:true,company:true,jobTitle:true,apiCallsUsed:true,apiCallsLimit:true,anthropicKey:true,slackWebhookUrl:true,teamsWebhookUrl:true },
    });
    return NextResponse.json({ user });
  }

  // Admin list
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const users = await prisma.user.findMany({
    select: { id:true,name:true,email:true,role:true,status:true,company:true,jobTitle:true,apiCallsUsed:true,apiCallsLimit:true,lastLoginAt:true,createdAt:true,updatedAt:true,playbookData:{select:{updatedAt:true}} },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId, action, data } = await req.json();
  const selfId = (session.user as any).id;

  // Self-service actions
  if (action === "updateProfile" && userId === selfId) {
    const update: any = {};
    if (data.anthropicKey !== undefined) update.anthropicKey = data.anthropicKey || null;
    if (data.slackWebhookUrl !== undefined) update.slackWebhookUrl = data.slackWebhookUrl || null;
    if (data.teamsWebhookUrl !== undefined) update.teamsWebhookUrl = data.teamsWebhookUrl || null;
    if (data.name !== undefined) update.name = data.name;
    if (data.company !== undefined) update.company = data.company;
    if (data.jobTitle !== undefined) update.jobTitle = data.jobTitle;
    return NextResponse.json({ user: await prisma.user.update({ where:{id:selfId}, data:update, select:{id:true,name:true,anthropicKey:true,slackWebhookUrl:true,teamsWebhookUrl:true} }) });
  }

  // Admin actions
  if ((session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  try {
    switch (action) {
      case "updateStatus": return NextResponse.json({ user: await prisma.user.update({ where:{id:userId}, data:{status:data.status}, select:{id:true,email:true,status:true} }) });
      case "updateRole": return NextResponse.json({ user: await prisma.user.update({ where:{id:userId}, data:{role:data.role}, select:{id:true,email:true,role:true} }) });
      case "updateApiLimit": return NextResponse.json({ user: await prisma.user.update({ where:{id:userId}, data:{apiCallsLimit:data.limit}, select:{id:true,apiCallsLimit:true} }) });
      case "resetPassword": await prisma.user.update({ where:{id:userId}, data:{hashedPassword:await bcrypt.hash(data.password,12)} }); return NextResponse.json({ message:"Password reset" });
      case "resetApiUsage": return NextResponse.json({ user: await prisma.user.update({ where:{id:userId}, data:{apiCallsUsed:0}, select:{id:true,apiCallsUsed:true} }) });
      default: return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  if (userId === (session.user as any).id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ message: "Deleted" });
}
