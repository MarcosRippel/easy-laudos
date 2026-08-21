/**
 * Cookie de sessao assinado (HMAC-SHA256).
 *
 * Antes deste modulo o cookie `gts_session` era JSON puro: qualquer pessoa
 * podia digitar `{"userId":"1","role":"admin","loginTime":<agora>}` no
 * DevTools e entrar como administrador. Agora o valor do cookie carrega uma
 * assinatura que so quem tem o `SESSION_SECRET` consegue produzir, e a leitura
 * recusa qualquer valor cuja assinatura nao confira.
 *
 * Formato do cookie: `v1.<base64url(payload JSON)>.<base64url(HMAC-SHA256)>`
 * A assinatura cobre `v1.<payload>` — trocar o payload invalida a assinatura.
 *
 * Fail-closed: sem `SESSION_SECRET` no ambiente nao se assina nem se verifica
 * nada. `signSession` lanca (o login devolve 500) e `verifySession` devolve
 * null (a requisicao vira 401 / redirect para /login). Nao existe segredo
 * padrao embutido: um fallback no codigo publico anularia a assinatura.
 *
 * Sem dependencia de Node: usa apenas Web Crypto (`crypto.subtle`), que existe
 * tanto no runtime Edge do middleware quanto no runtime Node das rotas.
 */

export interface SessionPayload {
  userId: string;
  username: string;
  role: string;
  loginTime: number;
}

/** Duracao maxima de uma sessao: 8 horas. */
export const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

/** Nome do cookie de sessao. */
export const SESSION_COOKIE_NAME = 'gts_session';

const SESSION_VERSION = 'v1';

/**
 * Comprimento minimo do segredo. `openssl rand -base64 32` devolve 44 chars;
 * qualquer coisa abaixo de 32 e curta demais para uma chave HMAC de sessao.
 */
const MIN_SECRET_LENGTH = 32;

/**
 * O placeholder do `.env.example` comeca com isto. Um segredo que qualquer
 * pessoa le no repositorio publico assina cookie que qualquer pessoa forja —
 * seria o bypass antigo de volta por outra porta, so que silencioso.
 */
const PLACEHOLDER_PREFIX = 'CHANGE_ME';

function isUsableSecret(secret: string | undefined): secret is string {
  return (
    typeof secret === 'string' &&
    secret.length >= MIN_SECRET_LENGTH &&
    !secret.startsWith(PLACEHOLDER_PREFIX)
  );
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!isUsableSecret(secret)) {
    throw new Error(
      `SESSION_SECRET ausente, curto demais (minimo ${MIN_SECRET_LENGTH} chars) ` +
        'ou ainda com o placeholder CHANGE_ME do .env.example. ' +
        'Gere com `openssl rand -base64 32` e defina no ambiente — ver .env.example.'
    );
  }
  return secret;
}

/** Indica se o ambiente tem um `SESSION_SECRET` utilizavel. */
export function hasSessionSecret(): boolean {
  return isUsableSecret(process.env.SESSION_SECRET);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Assina o payload e devolve o valor pronto para ir no cookie.
 * Lanca se `SESSION_SECRET` nao estiver configurado.
 */
export async function signSession(payload: SessionPayload): Promise<string> {
  const key = await importKey(getSecret());
  const body =
    `${SESSION_VERSION}.` +
    base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

function isValidPayload(value: unknown): value is SessionPayload {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.userId === 'string' &&
    candidate.userId.length > 0 &&
    typeof candidate.username === 'string' &&
    typeof candidate.role === 'string' &&
    typeof candidate.loginTime === 'number' &&
    Number.isFinite(candidate.loginTime)
  );
}

/**
 * Verifica a assinatura e a validade temporal do cookie.
 *
 * Devolve o payload apenas quando: o formato bate, a assinatura confere com o
 * `SESSION_SECRET` atual, o payload tem os campos esperados e a sessao ainda
 * nao expirou. Qualquer outro caso — inclusive segredo ausente, cookie
 * adulterado ou JSON puro do formato antigo — devolve `null`.
 */
export async function verifySession(
  cookieValue: string | undefined | null,
  now: number = Date.now()
): Promise<SessionPayload | null> {
  if (!cookieValue) return null;

  try {
    const parts = cookieValue.split('.');
    if (parts.length !== 3) return null;

    const [version, encodedPayload, encodedSignature] = parts;
    if (version !== SESSION_VERSION) return null;
    if (!encodedPayload || !encodedSignature) return null;

    const key = await importKey(getSecret());
    const body = `${version}.${encodedPayload}`;
    // `crypto.subtle.verify` compara em tempo constante — nao ha comparacao
    // de strings de assinatura aqui, de proposito.
    const signatureOk = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(encodedSignature),
      new TextEncoder().encode(body)
    );
    if (!signatureOk) return null;

    const payload: unknown = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload)));
    if (!isValidPayload(payload)) return null;

    const age = now - payload.loginTime;
    if (age > SESSION_MAX_AGE_MS) return null;
    // Cookie datado no futuro (relogio adulterado no payload) tambem nao passa.
    if (age < -60_000) return null;

    return payload;
  } catch {
    // Segredo ausente, base64 invalido, JSON quebrado: tudo cai aqui e a
    // sessao e recusada. Fail-closed por construcao.
    return null;
  }
}
