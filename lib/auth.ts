import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

const BCRYPT_ROUNDS = 12;

function sha256Legacy(password: string): string {
  return createHash('sha256').update(password + (process.env.AUTH_SALT || 'gts-salt')).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith('$2')) {
    return bcrypt.compare(password, hash);
  }
  // fallback transparente: hash SHA-256 antigo
  return sha256Legacy(password) === hash;
}

export type UserRole = 'admin' | 'client_a' | 'client_b';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

export function isClientUser(role: UserRole): boolean {
  return role === 'client_a' || role === 'client_b';
}
