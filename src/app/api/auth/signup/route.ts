import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2), email: z.string().email(), password: z.string().min(8),
  company: z.string().optional(), jobTitle: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    const { name, email, password, company, jobTitle } = parsed.data;
    const normalized = email.toLowerCase().trim();
    if (await prisma.user.findUnique({ where: { email: normalized } }))
      return NextResponse.json({ error: "Account already exists" }, { status: 409 });
    const user = await prisma.user.create({
      data: { name, email: normalized, hashedPassword: await bcrypt.hash(password, 12), company: company || null, jobTitle: jobTitle || null },
    });
    return NextResponse.json({ message: "Account created", userId: user.id }, { status: 201 });
  } catch (e) {
    console.error("Signup error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
