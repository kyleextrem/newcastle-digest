/**
 * GET /api/shop/health
 * Development-only connectivity check. Returns whether a read-only query succeeded.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/db';

function isDevelopmentHealthCheck(): boolean {
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }

  const vercelEnv = process.env.VERCEL_ENV;
  return vercelEnv === undefined || vercelEnv === 'development';
}

export async function GET() {
  if (!isDevelopmentHealthCheck()) {
    return new NextResponse(null, { status: 404 });
  }

  const connected = await checkDatabaseConnection();

  return NextResponse.json(
    { ok: connected },
    {
      status: connected ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
