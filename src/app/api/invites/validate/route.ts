import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ valid: false, error: "No token provided" });

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ valid: false, error: "Invalid invite link. Ask your admin for a new one." });
  if (invite.usedAt) return NextResponse.json({ valid: false, error: "This invite has already been used." });
  if (invite.expiresAt < new Date()) return NextResponse.json({ valid: false, error: "This invite has expired. Ask your admin for a new one." });

  return NextResponse.json({ valid: true, email: invite.email, role: invite.role });
}
