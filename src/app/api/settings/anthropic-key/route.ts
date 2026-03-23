import { NextRequest, NextResponse } from 'next/server';

// Updates the ANTHROPIC_API_KEY env var on this Vercel project
// Requires VERCEL_TOKEN and VERCEL_PROJECT_ID to be set in env vars
export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();
    if (!key || !key.startsWith('sk-ant-')) {
      return NextResponse.json({ ok: false, message: 'Invalid Anthropic API key format' }, { status: 400 });
    }

    const vercelToken = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID || 'prj_Guzg3LtsTJGzaWpU56iZhBlclVhP';
    const teamId = process.env.VERCEL_TEAM_ID || 'team_OexndxX61Nt5IcnnoAAaSuk5';

    if (!vercelToken) {
      // No Vercel token — just validate the key format and return instructions
      return NextResponse.json({
        ok: false,
        message: 'VERCEL_TOKEN not set. Add your key manually in Vercel Dashboard → Settings → Environment Variables → ANTHROPIC_API_KEY, then redeploy.',
      }, { status: 200 });
    }

    // Check if env var already exists
    const checkRes = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/env?teamId=${teamId}`,
      { headers: { Authorization: `Bearer ${vercelToken}` } }
    );
    const checkData = await checkRes.json();
    const existing = checkData.envs?.find((e: any) => e.key === 'ANTHROPIC_API_KEY');

    if (existing) {
      // Update existing
      const updateRes = await fetch(
        `https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}?teamId=${teamId}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: key, type: 'encrypted', target: ['production', 'preview'] }),
        }
      );
      if (!updateRes.ok) throw new Error('Failed to update env var');
    } else {
      // Create new
      const createRes = await fetch(
        `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'ANTHROPIC_API_KEY', value: key, type: 'encrypted', target: ['production', 'preview'] }),
        }
      );
      if (!createRes.ok) throw new Error('Failed to create env var');
    }

    return NextResponse.json({ ok: true, message: 'API key saved. Trigger a redeploy for it to take effect.' });
  } catch (e: any) {
    console.error('Save Anthropic key error:', e);
    return NextResponse.json({ ok: false, message: e.message || 'Failed to save key' }, { status: 500 });
  }
}
