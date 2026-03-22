import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { industry } = await req.json();
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Generate 3 current threat intelligence items specifically relevant to the ${industry} industry in 2026.
Return ONLY a valid JSON array with this exact structure, no markdown, no preamble:
[{"id":"i1","title":"...","summary":"...","severity":"Critical","source":"...","time":"Xh ago","iocs":[],"mitre":"T1566.001","industrySpecific":true}]
Severity must be one of: Critical, High, Medium, Low. Make threats realistic and current.`
      }]
    });
    const text = (msg.content[0] as { type: 'text'; text: string }).text;
    const clean = text.replace(/```json|```/g, '').trim();
    const items = JSON.parse(clean);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
