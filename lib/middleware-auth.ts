import { NextRequest } from 'next/server';
import { AuthUser, CLIENT_ROLES, isUserRole } from './roles';

export function getSessionFromRequest(request: NextRequest): AuthUser | null {
  try {
    const sessionCookie = request.cookies.get('gts_session');
    if (!sessionCookie) return null;

    const sessionData = JSON.parse(sessionCookie.value);
    
    // Verificar se a sessão não expirou (8 horas)
    const now = Date.now();
    const loginTime = sessionData.loginTime;
    const maxAge = 8 * 60 * 60 * 1000; // 8 horas em ms
    
    if (now - loginTime > maxAge) {
      return null;
    }

    // A sessao vem de um cookie: o papel e dado nao confiavel ate ser validado
    // contra o dominio de UserRole. Papel desconhecido = sessao invalida.
    if (!isUserRole(sessionData.role)) return null;

    return {
      id: sessionData.userId,
      username: sessionData.username,
      role: sessionData.role,
    };
  } catch {
    return null;
  }
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