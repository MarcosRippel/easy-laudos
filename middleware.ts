import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login'];
const ADMIN_ROUTES = ['/admin'];
const SESSION_MAX_AGE = 8 * 60 * 60 * 1000;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();

  // Security headers em todas as respostas
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // API e assets internos do Next.js não precisam de redirect
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return response;
  }

  // Rotas públicas
  if (PUBLIC_ROUTES.includes(pathname)) {
    return response;
  }

  // Verificar sessão
  const sessionCookie = request.cookies.get('gts_session');
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const session = JSON.parse(sessionCookie.value);

    if (Date.now() - session.loginTime > SESSION_MAX_AGE) {
      const redirect = NextResponse.redirect(new URL('/login', request.url));
      redirect.cookies.delete('gts_session');
      return redirect;
    }

    if (ADMIN_ROUTES.some(p => pathname.startsWith(p)) && session.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|icons/).*)'],
};
