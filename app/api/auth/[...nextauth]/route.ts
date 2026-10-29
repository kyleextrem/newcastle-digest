import { NextRequest } from 'next/server';
import { getAuth } from '@/auth';

export const dynamic = 'force-dynamic';

async function handle(request: NextRequest) {
  const auth = getAuth();
  if (!auth) {
    return new Response(null, { status: 404 });
  }
  if (request.method === 'POST') {
    return auth.handlers.POST(request);
  }
  return auth.handlers.GET(request);
}

export const GET = handle;
export const POST = handle;
