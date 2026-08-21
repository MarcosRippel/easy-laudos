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

// O dominio de papeis vive em `lib/roles.ts` (sem dependencia de Node) para
// poder ser importado por client components e pelo middleware. Reexportado
// aqui para nao quebrar quem ja importava de `lib/auth`.
export type { UserRole, AuthUser } from './roles';
export {
  USER_ROLES,
  CLIENT_ROLES,
  ROLE_LABELS,
  roleLabel,
  isUserRole,
  isAdmin,
  isClientUser,
} from './roles';
