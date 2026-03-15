import { NextResponse } from 'next/server';
import { tenableHeaders } from '@/lib/api-clients';

export async function GET() {
  const headers = await tenableHeaders();
  if (!headers) return NextResponse.json({ error: 'No Tenable credentials' });

  try {
    const res = await fetch('https://cloud.tenable.com/assets?chunk_size=5', { headers, cache: 'no-store' });
    const data = await res.json();
    // Return first 3 assets to see the actual structure
    return NextResponse.json({
      totalAssets: data.assets?.length || 0,
      sampleAssets: (data.assets || []).slice(0, 3),
      keys: data.assets?.[0] ? Object.keys(data.assets[0]) : [],
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
