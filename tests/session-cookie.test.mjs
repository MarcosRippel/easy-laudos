/**
 * Prova de que o cookie de sessao forjado e RECUSADO.
 *
 *   npm test
 *   (equivale a `node --test --experimental-strip-types tests/`)
 *
 * O teste ataca `lib/session-cookie.ts` do jeito que um invasor atacaria o
 * cookie `gts_session`: escrevendo JSON puro, trocando o papel para `admin`,
 * reaproveitando assinatura de outro payload, assinando com outro segredo e
 * apresentando sessao vencida. Nenhum desses casos pode virar sessao.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const SECRET = 'segredo-de-teste-com-32-chars-no-minimo-ok';
process.env.SESSION_SECRET = SECRET;

const { signSession, verifySession, SESSION_MAX_AGE_MS, hasSessionSecret } = await import(
  '../lib/session-cookie.ts'
);

const admin = { userId: 'u1', username: 'inspetor', role: 'admin', loginTime: Date.now() };

const b64url = (s) => Buffer.from(s, 'utf8').toString('base64url');

test('cookie assinado por nos e aceito e devolve o payload intacto', async () => {
  const cookie = await signSession(admin);
  const session = await verifySession(cookie);
  assert.deepEqual(session, admin);
});

test('cookie JSON puro (o bypass antigo) e RECUSADO', async () => {
  const forjado = JSON.stringify({ ...admin, userId: 'qualquer' });
  assert.equal(await verifySession(forjado), null);
});

test('payload adulterado com a assinatura original e RECUSADO (escalacao de papel)', async () => {
  const cookie = await signSession({ ...admin, role: 'client_a' });
  const [version, , signature] = cookie.split('.');
  const payloadAdmin = b64url(JSON.stringify({ ...admin, role: 'admin' }));
  const adulterado = `${version}.${payloadAdmin}.${signature}`;

  assert.equal(await verifySession(adulterado), null);
  // e o original, esse sim, continua valendo — com o papel que foi assinado
  assert.equal((await verifySession(cookie))?.role, 'client_a');
});

test('cookie assinado com OUTRO segredo e RECUSADO', async () => {
  process.env.SESSION_SECRET = 'outro-segredo-do-atacante-com-32-chars-ok';
  const cookieDoAtacante = await signSession(admin);
  process.env.SESSION_SECRET = SECRET;

  assert.equal(await verifySession(cookieDoAtacante), null);
});

test('assinatura trocada por lixo e RECUSADA', async () => {
  const cookie = await signSession(admin);
  const [version, payload] = cookie.split('.');
  assert.equal(await verifySession(`${version}.${payload}.${b64url('lixo')}`), null);
  assert.equal(await verifySession(`${version}.${payload}.`), null);
  assert.equal(await verifySession(`${version}.${payload}`), null);
});

test('sessao vencida (mais de 8h) e RECUSADA mesmo com assinatura valida', async () => {
  const cookie = await signSession({ ...admin, loginTime: Date.now() - SESSION_MAX_AGE_MS - 1000 });
  assert.equal(await verifySession(cookie), null);
});

test('sessao datada no futuro e RECUSADA', async () => {
  const cookie = await signSession({ ...admin, loginTime: Date.now() + 10 * 60 * 1000 });
  assert.equal(await verifySession(cookie), null);
});

test('sem SESSION_SECRET nada e assinado nem aceito (fail-closed)', async () => {
  const cookieValido = await signSession(admin);

  delete process.env.SESSION_SECRET;
  assert.equal(hasSessionSecret(), false);
  await assert.rejects(() => signSession(admin), /SESSION_SECRET/);
  assert.equal(await verifySession(cookieValido), null, 'sem segredo, nem cookie legitimo passa');

  process.env.SESSION_SECRET = 'curto-demais';
  assert.equal(hasSessionSecret(), false);
  await assert.rejects(() => signSession(admin), /SESSION_SECRET/);
  assert.equal(await verifySession(cookieValido), null);

  process.env.SESSION_SECRET = SECRET;
});

test('placeholder CHANGE_ME do .env.example e RECUSADO mesmo sendo longo', async () => {
  const cookieValido = await signSession(admin);

  // exatamente o valor que `cp .env.example .env` deixa no ambiente
  process.env.SESSION_SECRET = 'CHANGE_ME__gere_com_openssl_rand_base64_32';
  assert.equal(hasSessionSecret(), false);
  await assert.rejects(() => signSession(admin), /CHANGE_ME/);
  assert.equal(await verifySession(cookieValido), null, 'segredo publico do repo nao pode validar sessao');

  process.env.SESSION_SECRET = SECRET;
});

test('cookie vazio, ausente ou sem versao e RECUSADO', async () => {
  for (const valor of [undefined, null, '', '...', 'v2.abc.def', 'abc.def']) {
    assert.equal(await verifySession(valor), null, `deveria recusar: ${String(valor)}`);
  }
});
