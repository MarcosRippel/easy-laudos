import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifySession } from '@/lib/session-cookie';

const PUBLIC_ROUTES = ['/login'];
const PUBLIC_PREFIXES = ['/verificar/'];
// `/admin` (Painel do Inspetor) e `/admin/equipments` são acessíveis a qualquer
// usuário autenticado — settings são multi-tenant por userId. Apenas a gestão
// de usuários (`/admin/users`) é restrita a admin.
const ADMIN_ROUTES = ['/admin/users'];

function resolveBaseUrl(request: NextRequest): URL {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = forwardedHost ?? request.headers.get('host');
  const proto = forwardedProto ?? request.nextUrl.protocol.replace(':', '');
  if (host) {
    return new URL(`${proto}://${host}`);
  }
  return new URL(request.url);
}

function redirectTo(request: NextRequest, path: string) {
  const base = resolveBaseUrl(request);
  return NextResponse.redirect(new URL(path, base));
}

export async function middleware(request: NextRequest) {
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

  // Rotas públicas (login + verificação pública por hash)
  if (PUBLIC_ROUTES.includes(pathname) || PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return response;
  }

  // Verificar sessão: o cookie só vale se a assinatura HMAC conferir e a
  // sessão ainda não tiver expirado. Cookie ausente, forjado, adulterado ou
  // vencido cai no mesmo lugar — de volta para o /login, sem o cookie.
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!sessionCookie) {
    return redirectTo(request, '/login');
  }

  const session = await verifySession(sessionCookie.value);
  if (!session) {
    const redirect = redirectTo(request, '/login');
    redirect.cookies.delete(SESSION_COOKIE_NAME);
    return redirect;
  }

  if (ADMIN_ROUTES.some(p => pathname.startsWith(p)) && session.role !== 'admin') {
    return redirectTo(request, '/');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|icons/|branding/).*)'],
};
