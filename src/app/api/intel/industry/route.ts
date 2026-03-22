import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { industry } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ items: [] }, { status: 500 });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Generate 3 current threat intelligence items specifically relevant to the ${industry} industry in 2026. Return ONLY a valid JSON array, no markdown, no preamble: [{"id":"i1","title":"...","summary":"...","severity":"Critical","source":"...","time":"Xh ago","iocs":[],"mitre":"T1566.001","industrySpecific":true}]. Severity must be one of: Critical, High, Medium, Low.`,
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';
    const items = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json({ items });
  } catch(e) {
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
