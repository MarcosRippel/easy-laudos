import { NextRequest } from 'next/server';
import { AuthUser } from './auth';

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
  return user !== null && (user.role === 'client_a' || user.role === 'client_b');
}