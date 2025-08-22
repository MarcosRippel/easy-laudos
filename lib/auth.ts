import { createHash } from 'crypto';

// Hash simples e seguro para senhas
export function hashPassword(password: string): string {
  return createHash('sha256').update(password + (process.env.AUTH_SALT || 'gts-salt')).digest('hex');
}

// Verificar senha
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Tipos de usuário
export type UserRole = 'admin' | 'client_a' | 'client_b';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

// Verificar se é admin
export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

// Verificar se é usuário cliente
export function isClientUser(role: UserRole): boolean {
  return role === 'client_a' || role === 'client_b';
}