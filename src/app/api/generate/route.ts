import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where:{id:userId}, select:{apiCallsUsed:true,apiCallsLimit:true,status:true,anthropicKey:true} });
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Account not active" }, { status: 403 });

  // Use user's own key if set, otherwise shared key with limits
  const apiKey = user.anthropicKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No API key configured. Add your own in Settings or contact admin." }, { status: 500 });

  // Only enforce limits when using shared key
  if (!user.anthropicKey && user.apiCallsUsed >= user.apiCallsLimit) {
    return NextResponse.json({ error: "API limit reached. Add your own API key in Settings or contact admin." }, { status: 429 });
  }

  try {
    const { system, messages } = await req.json();
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type":"application/json", "x-api-key":apiKey, "anthropic-version":"2023-06-01" },
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:3000, system, messages }),
    });
    const data = await res.json();
    if (!user.anthropicKey) {
      await prisma.user.update({ where:{id:userId}, data:{apiCallsUsed:{increment:1}} });
    }
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: "Generation failed" }, { status: 500 }); }
}
