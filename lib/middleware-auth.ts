import { NextRequest } from 'next/server';
import { AuthUser, CLIENT_ROLES, isUserRole } from './roles';
import { SESSION_COOKIE_NAME, verifySession } from './session-cookie';

/**
 * Le a sessao do cookie `gts_session`.
 *
 * O cookie e assinado com HMAC-SHA256 (ver `lib/session-cookie.ts`): o valor
 * so vira sessao depois que a assinatura confere com o `SESSION_SECRET` do
 * ambiente. Cookie forjado, adulterado, expirado, do formato antigo (JSON
 * puro) ou lido sem segredo configurado devolve `null` — fail-closed.
 */
export async function getSessionFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!sessionCookie) return null;

  // Assinatura + expiracao sao verificadas aqui dentro.
  const sessionData = await verifySession(sessionCookie.value);
  if (!sessionData) return null;

  // A assinatura garante que o papel saiu do nosso login, mas o valor ainda
  // precisa pertencer ao dominio de UserRole (papel removido do sistema depois
  // de a sessao ter sido emitida = sessao invalida).
  if (!isUserRole(sessionData.role)) return null;

  return {
    id: sessionData.userId,
    username: sessionData.username,
    role: sessionData.role,
  };
}

export function requireAuth(user: AuthUser | null): boolean {
  return user !== null;
}

export function requireAdmin(user: AuthUser | null): boolean {
  return user !== null && user.role === 'admin';
}

export function requireClientUser(user: AuthUser | null): boolean {
  return user !== null && (CLIENT_ROLES as readonly string[]).includes(user.role);
}
