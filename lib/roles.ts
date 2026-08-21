/**
 * Dominio de papeis de usuario — modulo sem dependencia de Node.
 *
 * Fica separado de `lib/auth.ts` de proposito: `auth.ts` importa `bcryptjs` e
 * `node:crypto`, que nao podem entrar no bundle de client component nem no
 * runtime de middleware. Quem so precisa do papel importa daqui.
 *
 * `client_a` e `client_b` sao os dois papeis de inspetor (contas operacionais
 * de cliente) e sao genericos de proposito: a identidade do cliente vive em
 * `AdminSetting`, nunca no tipo. Trocar estes literais exige migration de
 * dados na coluna `User.role` — ver
 * `prisma/migrations/20260821000000_rename_client_roles/migration.sql`.
 */
export type UserRole = 'admin' | 'client_a' | 'client_b';

export const USER_ROLES: readonly UserRole[] = ['admin', 'client_a', 'client_b'] as const;

/** Papeis de inspetor (tudo que nao e admin). */
export const CLIENT_ROLES: readonly UserRole[] = ['client_a', 'client_b'] as const;

/** Rotulo de exibicao do papel — o unico lugar onde o papel vira texto de tela. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  client_a: 'Inspetor A',
  client_b: 'Inspetor B',
};

/** Rotulo seguro para um papel que veio do banco e pode nao existir mais. */
export function roleLabel(role: string): string {
  return isUserRole(role) ? ROLE_LABELS[role] : role;
}

/** Type guard: a string veio de um banco/sessao e pode ser qualquer coisa. */
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

export function isAdmin(role: string): boolean {
  return role === 'admin';
}

export function isClientUser(role: string): boolean {
  return (CLIENT_ROLES as readonly string[]).includes(role);
}

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}
