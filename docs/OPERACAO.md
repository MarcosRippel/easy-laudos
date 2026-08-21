# Operação

Notas de operação do `general-laudos` — o que precisa ser feito à mão em um
banco que já existe, além de `prisma migrate deploy`.

---

## Papéis de usuário genéricos (`client_a` / `client_b`)

### O que mudou

A coluna `User.role` deixou de guardar o nome do cliente. O domínio de papéis
agora é fechado e genérico, declarado em [`lib/roles.ts`](../lib/roles.ts):

```ts
export type UserRole = 'admin' | 'client_a' | 'client_b';
```

- `admin` — administrador; enxerga todos os inspetores.
- `client_a`, `client_b` — as duas contas operacionais de inspetor.

A identidade da empresa que aparece no laudo (razão social, endereço,
telefone, logo) **não** vive mais em nenhum literal de código: ela vem da
tabela `AdminSetting`, por inspetor. Ver *Identidade da empresa* abaixo.

### Quem precisa rodar a migration

**Quem já tem banco com dados.** A migration
`prisma/migrations/20260821000000_rename_client_roles` converte os papéis
legados para o domínio novo:

```bash
npx prisma migrate deploy
```

Instalação nova (banco vazio, `prisma migrate deploy` ou `prisma db push` +
`npx tsx prisma/seed-users.ts`) não precisa de nada: o seed já cria `client_a` e
`client_b`.

### O que acontece se você não rodar

**As contas de inspetor param de logar.** `getSessionFromRequest`
([`lib/middleware-auth.ts`](../lib/middleware-auth.ts)) valida o papel da
sessão contra o domínio de `UserRole` e devolve `null` para papel
desconhecido — um papel legado é tratado como sessão inválida. A conta
`admin` continua funcionando, então o acesso ao sistema não se perde: dá para
entrar como `admin` e corrigir os papéis pelo painel `/admin/users`.

Nenhum dado de laudo é afetado — a migration só toca `User.role`. O
`username` **não** é alterado: quem logava com o nome antigo continua logando
com o nome antigo, só o papel muda. (Renomear em massa colidiria com a
constraint `UNIQUE` de `username` quando dois papéis legados convergem para o
mesmo papel novo.)

### Como a migration converte

A regra é o **sufixo ordinal do papel legado**, não o nome do cliente
(de propósito: o nome não existe mais em lugar nenhum do repositório).

| Papel legado | Vira |
|---|---|
| qualquer papel fora do domínio terminado em `1` | `client_a` |
| qualquer papel fora do domínio terminado em `2` | `client_b` |
| qualquer outro papel fora do domínio | `client_a` (revisar no painel admin) |
| `admin` | inalterado |

O terceiro caso existe para não deixar usuário sem login. Revise-o em
`/admin/users` depois de rodar.

A migration é idempotente: rodar de novo não casa nenhuma linha.

### Se você preferir outros nomes de papel

`client_a` / `client_b` são propositalmente neutros. Para trocar, mude os três
lugares e escreva uma migration equivalente:

1. `lib/roles.ts` — `UserRole`, `USER_ROLES`, `CLIENT_ROLES`, `ROLE_LABELS`
2. `prisma/seed-users.ts` — `CLIENT_ACCOUNTS`
3. `app/admin/users/AdminUsers.module.css` — as classes `.role.client_a` / `.role.client_b`

O `<option>` do seletor em `app/admin/users/page.tsx` e o rótulo na listagem
já leem de `ROLE_LABELS`, então mudam sozinhos.

---

## Identidade da empresa no laudo (`AdminSetting`)

### O que mudou

Os geradores de PDF **não têm mais fallback de razão social, endereço ou
telefone**. Antes, `adminSettings.companyName || '<razão social real>'`
enterrava a identidade de um cliente específico no código; agora o valor vem
sempre do banco.

Campos usados (tabela `AdminSetting`, um registro por inspetor via `userId`):

| Campo | Onde aparece |
|---|---|
| `companyName` | cabeçalho e rodapé de todos os laudos |
| `companyAddress` | cabeçalho dos laudos |
| `companyPhone` | cabeçalho dos laudos |
| `companyLogoUrl` | logo do cabeçalho |
| `companyTaxId` | rodapé, quando preenchido |

### O que acontece se estiver vazio

O laudo é gerado com o campo em branco (e `companyName` cai no padrão
`'Your Company Name'` criado junto com o registro). Não há mais nenhum nome de
empresa embutido no código — preencha em **Admin → Configurações** antes de
emitir laudo para valer.

---

## Seed de usuários

```bash
SEED_PASSWORD='uma-senha-forte' npx tsx prisma/seed-users.ts
```

Sem `SEED_PASSWORD`, o seed usa `change-me` — o que só é aceitável na sua
máquina. Troque a senha no primeiro login em qualquer outro ambiente.
