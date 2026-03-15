import { NextResponse } from 'next/server';
import { tenableAPI } from '@/lib/api-clients';

export async function GET() {
  try {
    const data = await tenableAPI('/workbenches/vulnerabilities?date_range=30');
    const sample = (data.vulnerabilities || []).slice(0, 2);
    return NextResponse.json({
      total: data.vulnerabilities?.length || 0,
      sampleKeys: sample[0] ? Object.keys(sample[0]) : [],
      samples: sample,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
