import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
  const s = await getServerSession(authOptions);
  if (!s?.user) return null;
  const userId = (s.user as any).id;
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
}

// POST — create invite
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Only admins and managers can send invites" }, { status: 403 });
  }

  const { email, role } = await req.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const normalized = email.toLowerCase().trim();

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });

  // Check for existing unused invite
  const existingInvite = await prisma.invite.findFirst({
    where: { email: normalized, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (existingInvite) return NextResponse.json({ error: "Active invite already exists for this email" }, { status: 409 });

  // Only admins can invite admins/managers
  const assignRole = role || "USER";
  if ((assignRole === "ADMIN" || assignRole === "MANAGER") && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can assign admin/manager roles" }, { status: 403 });
  }

  const invite = await prisma.invite.create({
    data: {
      email: normalized,
      role: assignRole,
      invitedById: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Build invite URL
  const baseUrl = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const inviteUrl = `${protocol}://${baseUrl}/signup?invite=${invite.token}`;

  await prisma.auditLog.create({
    data: { actorId: user.id, action: "USER_CREATED", target: `Invited ${normalized} as ${assignRole}` },
  });

  return NextResponse.json({ invite, inviteUrl }, { status: 201 });
}

// GET — list invites
export async function GET() {
  const user = await getUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    include: { invitedBy: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ invites });
}

// DELETE — revoke invite
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Invite ID required" }, { status: 400 });

  await prisma.invite.delete({ where: { id } });

  return NextResponse.json({ message: "Invite revoked" });
}
