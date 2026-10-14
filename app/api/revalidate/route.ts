/**
 * GET|POST /api/revalidate?path=/journal/newcastle-markets-guide&secret=xxx
 * On-demand revalidation for ISR pages.
 * Requires REVALIDATE_SECRET in Vercel environment variables.
 */
import { revalidatePath } from 'next/cache'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return handleRevalidate(request)
}

export async function POST(request: NextRequest) {
  return handleRevalidate(request)
}

async function handleRevalidate(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const secret = searchParams.get('secret')
  const path = searchParams.get('path')

  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Invalid secret' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!path) {
    return new Response(
      JSON.stringify({ error: 'Missing path parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    revalidatePath(path)
    return new Response(
      JSON.stringify({
        revalidated: true,
        path,
        now: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Failed to revalidate', details: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
