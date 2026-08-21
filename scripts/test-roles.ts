/**
 * Teste do dominio de papeis: `lib/roles.ts` + `lib/middleware-auth.ts`.
 *
 *   npx tsx scripts/test-roles.ts
 *
 * Cobre o que a anonimizacao do cliente mexeu: os papeis genericos
 * `client_a` / `client_b` sao aceitos, `admin` continua separado, e papel
 * desconhecido (o caso de um banco que nao rodou a migration) e recusado
 * tanto pelo type guard quanto pela leitura de sessao.
 */
import { USER_ROLES, CLIENT_ROLES, ROLE_LABELS, roleLabel, isUserRole, isAdmin, isClientUser } from '../lib/roles';
import { requireAuth, requireAdmin, requireClientUser, getSessionFromRequest } from '../lib/middleware-auth';
import { signSession } from '../lib/session-cookie';
import type { AuthUser } from '../lib/roles';

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  (esperado ${JSON.stringify(expected)}, obtido ${JSON.stringify(actual)})`);
}

const user = (role: string): AuthUser => ({ id: 'u1', username: 'u1', role: role as AuthUser['role'] });

console.log('--- dominio ---');
check('USER_ROLES', [...USER_ROLES], ['admin', 'client_a', 'client_b']);
check('CLIENT_ROLES', [...CLIENT_ROLES], ['client_a', 'client_b']);
check('ROLE_LABELS cobre o dominio', USER_ROLES.every((r) => Boolean(ROLE_LABELS[r])), true);

console.log('--- type guard ---');
check("isUserRole('client_a')", isUserRole('client_a'), true);
check("isUserRole('client_b')", isUserRole('client_b'), true);
check("isUserRole('admin')", isUserRole('admin'), true);
check("isUserRole(<papel legado>)", isUserRole('legacy_role_1'), false);
check('isUserRole(undefined)', isUserRole(undefined), false);

console.log('--- classificacao ---');
check("isAdmin('admin')", isAdmin('admin'), true);
check("isAdmin('client_a')", isAdmin('client_a'), false);
check("isClientUser('client_a')", isClientUser('client_a'), true);
check("isClientUser('client_b')", isClientUser('client_b'), true);
check("isClientUser('admin')", isClientUser('admin'), false);
check("isClientUser(<papel legado>)", isClientUser('legacy_role_1'), false);
check('roleLabel de papel desconhecido devolve o proprio valor', roleLabel('legacy_role_1'), 'legacy_role_1');

console.log('--- guardas de rota ---');
check('requireAuth(null)', requireAuth(null), false);
check("requireAuth(client_a)", requireAuth(user('client_a')), true);
check("requireAdmin(admin)", requireAdmin(user('admin')), true);
check("requireAdmin(client_a)", requireAdmin(user('client_a')), false);
check("requireClientUser(client_a)", requireClientUser(user('client_a')), true);
check("requireClientUser(client_b)", requireClientUser(user('client_b')), true);
check("requireClientUser(admin)", requireClientUser(user('admin')), false);
check('requireClientUser(<papel legado>)', requireClientUser(user('legacy_role_1')), false);
check('requireClientUser(null)', requireClientUser(null), false);

console.log('--- sessao (cookie) ---');
process.env.SESSION_SECRET ||= 'segredo-de-teste-com-32-chars-no-minimo-ok';

const requestWithCookie = (value: string | undefined) =>
  ({
    cookies: {
      get: (name: string) => (name === 'gts_session' && value ? { value } : undefined),
    },
  }) as unknown as Parameters<typeof getSessionFromRequest>[0];

const signedRequest = async (role: string) =>
  requestWithCookie(
    await signSession({ userId: 'u1', username: 'u1', role, loginTime: Date.now() })
  );

check("sessao assinada com 'client_a' e aceita", (await getSessionFromRequest(await signedRequest('client_a')))?.role, 'client_a');
check("sessao assinada com 'client_b' e aceita", (await getSessionFromRequest(await signedRequest('client_b')))?.role, 'client_b');
check("sessao assinada com 'admin' e aceita", (await getSessionFromRequest(await signedRequest('admin')))?.role, 'admin');
check('sessao assinada com papel legado e recusada (banco sem migration)', await getSessionFromRequest(await signedRequest('legacy_role_1')), null);

// O bypass historico: JSON puro no cookie, sem assinatura nenhuma.
const jsonPuro = JSON.stringify({ userId: 'u1', username: 'u1', role: 'admin', loginTime: Date.now() });
check('cookie JSON puro (formato antigo) e recusado', await getSessionFromRequest(requestWithCookie(jsonPuro)), null);

console.log(failures === 0 ? '\nOK — todas as asserções passaram.' : `\nFALHOU — ${failures} asserção(ões).`);
process.exit(failures === 0 ? 0 : 1);
