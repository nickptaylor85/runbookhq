import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user && ((s.user as any).role === "ADMIN" || (s.user as any).role === "MANAGER") ? s : null;
}

export async function GET() {
  const config = await prisma.brandingConfig.findFirst();
  return NextResponse.json({ branding: config || { companyName: "SecOpsHQ", primaryColor: "4F6CF7", accentColor: "6366F1", pdfHeader: "RUNBOOKHQ", pdfFooter: "" } });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const data = await req.json();
  const existing = await prisma.brandingConfig.findFirst();
  const config = existing
    ? await prisma.brandingConfig.update({ where: { id: existing.id }, data: { companyName: data.companyName, logoUrl: data.logoUrl, primaryColor: data.primaryColor || "4F6CF7", accentColor: data.accentColor || "6366F1", pdfHeader: data.pdfHeader, pdfFooter: data.pdfFooter } })
    : await prisma.brandingConfig.create({ data: { companyName: data.companyName, logoUrl: data.logoUrl, primaryColor: data.primaryColor || "4F6CF7", accentColor: data.accentColor || "6366F1", pdfHeader: data.pdfHeader, pdfFooter: data.pdfFooter } });
  return NextResponse.json({ branding: config });
}
