import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
  const s = await getServerSession(authOptions);
  return s?.user ? (s.user as any) : null;
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { indicator, type, vtApiKey, abuseIpDbKey } = await req.json();
  if (!indicator) return NextResponse.json({ error: "indicator required" }, { status: 400 });

  // Check cache (24h TTL)
  const cached = await prisma.threatIntel.findFirst({ where: { indicator, queriedAt: { gte: new Date(Date.now() - 86400000) } } });
  if (cached) return NextResponse.json({ results: [cached] });

  const results: any[] = [];

  // VirusTotal
  if (vtApiKey) {
    try {
      const vtType = type === "ip" ? "ip-addresses" : type === "domain" ? "domains" : type === "hash" ? "files" : "urls";
      const vtIndicator = type === "url" ? Buffer.from(indicator).toString("base64url") : indicator;
      const res = await fetch(`https://www.virustotal.com/api/v3/${vtType}/${vtIndicator}`, { headers: { "x-apikey": vtApiKey } });
      if (res.ok) {
        const data = await res.json();
        const attrs = data.data?.attributes || {};
        const stats = attrs.last_analysis_stats || {};
        const score = stats.malicious || 0;
        const intel = await prisma.threatIntel.upsert({
          where: { indicator_source: { indicator, source: "virustotal" } },
          update: { score, data: { stats, reputation: attrs.reputation, tags: attrs.tags, lastAnalysis: attrs.last_analysis_date }, queriedAt: new Date() },
          create: { indicator, type: type || "unknown", source: "virustotal", score, data: { stats, reputation: attrs.reputation, tags: attrs.tags } }
        });
        results.push(intel);
      }
    } catch (e) { results.push({ source: "virustotal", error: "Query failed" }); }
  }

  // AbuseIPDB
  if (abuseIpDbKey && type === "ip") {
    try {
      const res = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(indicator)}&maxAgeInDays=90`, { headers: { Key: abuseIpDbKey, Accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        const d = data.data || {};
        const intel = await prisma.threatIntel.upsert({
          where: { indicator_source: { indicator, source: "abuseipdb" } },
          update: { score: d.abuseConfidenceScore, data: { isp: d.isp, domain: d.domain, country: d.countryCode, totalReports: d.totalReports, usageType: d.usageType }, queriedAt: new Date() },
          create: { indicator, type: "ip", source: "abuseipdb", score: d.abuseConfidenceScore, data: { isp: d.isp, domain: d.domain, country: d.countryCode, totalReports: d.totalReports } }
        });
        results.push(intel);
      }
    } catch (e) { results.push({ source: "abuseipdb", error: "Query failed" }); }
  }

  // If no API keys, return basic type classification
  if (!vtApiKey && !abuseIpDbKey) {
    const basic = await prisma.threatIntel.upsert({
      where: { indicator_source: { indicator, source: "local" } },
      update: { queriedAt: new Date() },
      create: { indicator, type: type || "unknown", source: "local", score: null, data: { note: "No enrichment API keys configured. Add VirusTotal or AbuseIPDB keys in Settings." } }
    });
    results.push(basic);
  }

  return NextResponse.json({ results });
}
