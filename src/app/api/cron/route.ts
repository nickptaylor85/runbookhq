import { NextRequest, NextResponse } from 'next/server';

// Cron job handler — triggered by Vercel cron
// Runs scheduled tasks: report generation, alert digests, etc.
export async function GET(req: NextRequest) {
  try {
    // Verify this is a legitimate Vercel cron request
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Scheduled tasks would run here
    // e.g. send weekly report emails, clean up old data, sync alerts
    const results = {
      timestamp: new Date().toISOString(),
      tasks: [] as string[],
    };

    // Email reports via Resend — only if RESEND_API_KEY is configured
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      results.tasks.push('email-reports: enabled');
      // Email sending logic would go here
    } else {
      results.tasks.push('email-reports: skipped (RESEND_API_KEY not set)');
    }

    return NextResponse.json({ ok: true, ...results });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
