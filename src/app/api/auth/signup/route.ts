import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2), email: z.string().email(), password: z.string().min(8),
  company: z.string().optional(), jobTitle: z.string().optional(),
  invite: z.string().min(1, "Invite token is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    const { name, email, password, company, jobTitle, invite: token } = parsed.data;
    const normalized = email.toLowerCase().trim();

    // Validate invite token
    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite) return NextResponse.json({ error: "Invalid invite link. Ask your admin for a new one." }, { status: 403 });
    if (invite.usedAt) return NextResponse.json({ error: "This invite has already been used." }, { status: 403 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: "This invite has expired. Ask your admin for a new one." }, { status: 403 });
    if (invite.email !== normalized) return NextResponse.json({ error: "This invite was sent to a different email address." }, { status: 403 });

    if (await prisma.user.findUnique({ where: { email: normalized } }))
      return NextResponse.json({ error: "Account already exists" }, { status: 409 });

    const user = await prisma.user.create({
      data: {
        name, email: normalized,
        hashedPassword: await bcrypt.hash(password, 12),
        role: invite.role,
        company: company || null,
        jobTitle: jobTitle || null,
      },
    });

    // Mark invite as used
    await prisma.invite.update({ where: { id: invite.id }, data: { usedAt: new Date() } });

    return NextResponse.json({ message: "Account created", userId: user.id }, { status: 201 });
  } catch (e) {
    console.error("Signup error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
