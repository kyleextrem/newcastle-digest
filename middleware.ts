import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/shop/admin/sign-in') {
    return NextResponse.next();
  }

  const hasSession = request.cookies.getAll().some((cookie) => {
    return (
      cookie.name === 'authjs.session-token' ||
      cookie.name.startsWith('authjs.session-token.') ||
      cookie.name === '__Secure-authjs.session-token' ||
      cookie.name.startsWith('__Secure-authjs.session-token.')
    );
  });

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/shop/admin/sign-in';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/shop/admin', '/shop/admin/:path*'],
};
