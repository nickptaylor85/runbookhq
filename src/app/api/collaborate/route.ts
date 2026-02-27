import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
  const s = await getServerSession(authOptions);
  return s?.user ? (s.user as any) : null;
}

// Share a playbook with another user
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { playbookId, email, role } = await req.json();

  const playbook = await prisma.playbook.findUnique({ where:{id:playbookId} });
  if (!playbook || playbook.ownerId !== user.id) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const target = await prisma.user.findUnique({ where:{ email: email.toLowerCase().trim() } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "Cannot share with yourself" }, { status: 400 });

  const collab = await prisma.collaborator.upsert({
    where: { playbookId_userId: { playbookId, userId: target.id } },
    create: { playbookId, userId: target.id, role: role || "VIEWER" },
    update: { role: role || "VIEWER" },
  });

  // Notify
  await prisma.notification.create({
    data: { userId: target.id, type: "PLAYBOOK_SHARED", title: "Playbook Shared", message: `${user.name || user.email} shared "${playbook.title}" with you as ${role || "VIEWER"}`, link: `/workspace?pb=${playbookId}` },
  });

  return NextResponse.json({ collaborator: collab });
}

// List collaborators for a playbook, or list playbooks shared with me
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const playbookId = url.searchParams.get("playbookId");
  const mode = url.searchParams.get("mode");

  if (mode === "shared-with-me") {
    const collabs = await prisma.collaborator.findMany({
      where: { userId: user.id },
      include: { playbook: { include: { owner: { select: { name:true, email:true } } } } },
    });
    return NextResponse.json({ shared: collabs });
  }

  if (playbookId) {
    const collabs = await prisma.collaborator.findMany({
      where: { playbookId },
      include: { user: { select: { id:true, name:true, email:true } } },
    });
    return NextResponse.json({ collaborators: collabs });
  }

  return NextResponse.json({ error: "Missing params" }, { status: 400 });
}

// Update playbook status (approval workflow)
export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { playbookId, action, data } = await req.json();

  const playbook = await prisma.playbook.findUnique({ where:{id:playbookId}, include:{collaborators:true} });
  if (!playbook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = playbook.ownerId === user.id;
  const collab = playbook.collaborators.find(c => c.userId === user.id);
  const canEdit = isOwner || collab?.role === "EDITOR" || collab?.role === "REVIEWER";
  if (!canEdit) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  if (action === "submitForReview") {
    await prisma.playbook.update({ where:{id:playbookId}, data:{status:"REVIEW"} });
    // Notify reviewers
    const reviewers = playbook.collaborators.filter(c => c.role === "REVIEWER" || c.role === "EDITOR");
    for (const r of reviewers) {
      await prisma.notification.create({
        data: { userId:r.userId, type:"REVIEW_REQUESTED", title:"Review Requested", message:`"${playbook.title}" is ready for review`, link:`/workspace?pb=${playbookId}` },
      });
    }
    return NextResponse.json({ status: "REVIEW" });
  }

  if (action === "approve") {
    await prisma.playbook.update({ where:{id:playbookId}, data:{status:"APPROVED"} });
    await prisma.notification.create({
      data: { userId:playbook.ownerId, type:"PLAYBOOK_APPROVED", title:"Playbook Approved", message:`"${playbook.title}" was approved by ${user.name||user.email}` },
    });
    return NextResponse.json({ status: "APPROVED" });
  }

  if (action === "activate") {
    await prisma.playbook.update({ where:{id:playbookId}, data:{status:"ACTIVE"} });
    return NextResponse.json({ status: "ACTIVE" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// Remove a collaborator
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const collabId = url.searchParams.get("id");
  if (!collabId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const collab = await prisma.collaborator.findUnique({ where:{id:collabId}, include:{playbook:true} });
  if (!collab || collab.playbook.ownerId !== user.id) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  await prisma.collaborator.delete({ where:{id:collabId} });
  return NextResponse.json({ message: "Removed" });
}
