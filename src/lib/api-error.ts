import { NextResponse } from 'next/server';

// Sanitise error responses — never expose stack traces in production
export function apiError(message: string, status: number, internalError?: unknown): NextResponse {
  if (process.env.NODE_ENV === 'production' && status === 500) {
    // Log internally but return generic message to client
    if (internalError) console.error('[api error]', internalError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ error: message }, { status });
}

export function sanitiseError(e: unknown): string {
  if (process.env.NODE_ENV === 'production') return 'Internal server error';
  return e instanceof Error ? e.message : String(e);
}
