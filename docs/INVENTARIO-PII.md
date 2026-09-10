# INVENTÁRIO DE PII E DADO REAL DE CLIENTE — `general-laudos`

> Card **OSS-2**. Levantamento nominal de todo dado pessoal / de cliente que vive no
> repositório, no **working tree** e no **histórico git** completo.
> Gerado em 2026-08-21 sobre `chore/graphify-versioning-policy` @ `86dd5ef`, 512 commits.
>
> **Este documento não apaga nada.** Ele é a lista que a purga (OSS-1 / OSS-4) vai consumir.
> **Este documento não transcreve nenhum dado pessoal** — só caminho, tipo, volume e contagem.
> Onde o remédio exige o literal (ex.: `--replace-text`), o valor é obtido pelo executor da
> purga a partir do `arquivo:linha` citado aqui — nunca copiado para dentro deste arquivo.

---

## Estado da aplicação (reconciliado no OSS-4 — 2026-08-21)

> Este documento deixou de ser só o mapa do que **existia**: cada linha dos
> Grupos A, B, C e E agora carrega o **Estado** do remédio e a **Evidência** de
> onde ele foi aplicado. O alvo é o clone `general-laudos-clean.git`; o
> repositório original não foi tocado.

| Estado | Linhas | Significado |
|---|---|---|
| **APLICADO** | 47 | O remédio foi executado no clone e verificado. |
| **PRESERVADO** | 14 | Não é PII (marca do produto) ou é fixture — vai a público como está. |
| **PENDENTE** | 1 (P1, fora das tabelas) | Achado novo, fora do que o inventário original decidiu — precisa de decisão humana. |

### O que o OSS-1 já tinha aplicado antes deste card

O clone chegou ao OSS-4 com `migration/backups/**`, `launcher-production/backups/**`,
`prisma/dev.db`, `prisma/prisma/dev.db`, `.next/**` e `app/api/dev-seed/route.ts`
**já ausentes de todas as revisões** — a purga de segredos do OSS-1 levou junto
esses diretórios. Isso explica por que o clone chegou com 112 binários (comando
do card) em vez dos 311 do levantamento: sobravam 130 imagens de
`public/uploads`, 19 arquivos de marca do produto e 1 de infra do operador. As
linhas correspondentes estão marcadas `APLICADO · OSS-1` para o documento
continuar fechando com o levantamento original.

### O que o OSS-4 aplicou

1. **Purga de caminhos** (`git filter-repo --invert-paths`, 14 caminhos):
   `public/uploads`, `launcher-production/1.png`, `traefik-data`,
   `dias_trabalho.json`, os dois scripts ad-hoc nominais ao cliente, e os seis
   caminhos já ausentes, reconfirmados.
   Binários no histórico: **112 → 19** (os 19 de marca do produto).
2. **Refactor de anonimização** no HEAD, antes da purga de texto — commit
   `[OSS-4] refactor(pii)`. O nome do cliente deixou de ser valor do tipo
   `UserRole`; o domínio agora é `admin | client_a | client_b`, declarado em
   `lib/roles.ts` (módulo sem dependência de Node, para poder ser importado por
   client component e pelo middleware). A identidade da empresa saiu do código
   e vive em `AdminSetting`.
3. **Migration de dados**
   `prisma/migrations/20260821000000_rename_client_roles/migration.sql`, com a
   nota de operação em [`docs/OPERACAO.md`](OPERACAO.md).
4. **Purga de texto** (`--replace-text` + `--replace-message`, 24 regras) sobre
   nome do cliente, razão social, rua, cidade, telefone e e-mail do operador,
   em todas as revisões e também nas mensagens de commit. `--replace-text`
   sozinho **não** reescreve mensagem de commit — foram duas passadas.

### Verificação (rodada após a purga, sobre `general-laudos-clean.git`)

| Checagem | Antes | Depois |
|---|---|---|
| Binários `pdf/jpe?g/png/db/xlsx` no histórico | 112 | **19** (só marca do produto) |
| `git log --all -- public/uploads` | 77 commits | **vazio** |
| `git log --all -- '*.db'` | — | **vazio** |
| Arquivos citando o cliente no HEAD | 32 | **0** |
| Arquivos citando o cliente em **todas** as revisões | — | **0** |
| Ocorrências do nome em blobs (varredura dos 458 blobs) | 184 | **0** |
| Ocorrências em mensagens de commit | 4 | **0** |
| Rua / cidade / telefone / e-mail do operador em blobs | 18 / 18 / 20 / 15 | **0 / 0 / 0 / 0** |
| Tamanho do clone | 13 MB | **3,1 MB** |

### PENDENTE — achado fora do escopo do inventário original

| # | Achado | Estado | Por que ficou pendente |
|---|---|---|---|
| P1 | O **hostname de produção do operador** (domínio próprio, sem parte local de e-mail) aparece em **76 arquivos** — configs de nginx/Traefik/Docker, `.bat` de instalação, docs de DNS e URLs de fallback em código. | **PENDENTE** | O inventário decidiu remédio só para o **e-mail** do operador (B19–B21), não para o hostname nu, e o hostname não é PII de terceiro: é a infra do dono do repositório, e publicá-la é decisão dele. Remover exigiria parametrizar 76 arquivos por variável de ambiente — trabalho de card próprio. **Nada foi aplicado.** |

---

## TL;DR

| | |
|---|---|
| Binários que podem carregar PII, no histórico | **311** (não 270 — ver *Nota de contagem*) |
| Desses, com **dado real de cliente ou do operador** | **292** (93,9 %) |
| Desses, **não é PII** (marca do próprio produto) | **19** |
| Arquivos de **texto** com dado real, no HEAD | **37** (Grupo B) |
| Arquivos de texto cujos acertos são **fictícios** (mantêm) | **10** + 7 migrations SQL (Grupo E) |
| Paths com dado real **só no histórico** | **17** (15 em `.next/`, `prisma/dev.db`, `app/api/dev-seed/route.ts`) |
| Mensagens de commit com PII literal | **0** |
| Registros pessoais nos dumps SQLite rastreados | **187 laudos, 4 clientes, 7 veículos, 4 usuários** (maior dump) |

> **Reconciliação da cobertura em texto:** a varredura do working tree acerta em **50** arquivos.
> São **37** do Grupo B (dado real) + **10** do Grupo E.1 (fixture / falso positivo) +
> **3** relatórios de upload já cobertos por A3. `37 + 10 + 3 = 50` — nenhum acerto fora do inventário.

**Veredito:** o repositório não pode ir a público sem purga de histórico. A PII não está
concentrada num canto — ela está em quatro camadas independentes: (1) uploads e PDFs de laudo,
(2) dumps de banco de produção, (3) a identidade do cliente **hardcoded no código-fonte**, e
(4) o nome do cliente **dentro do modelo de tipos de autenticação** (`UserRole`), o que torna a
anonimização um refactor e não um `sed`.

---

## Nota de contagem — o comando do card subconta 41 arquivos

O passo 2 do "Como confirmo" propõe:

```bash
git log --all --name-only --format="" | sort -u | grep -icE '\.(pdf|jpe?g|png|xlsx|csv|db|zip)$'
# → 270
```

Esse número está **errado por baixo**. O git escapa paths com caracteres não-ASCII e os devolve
entre aspas (`"migration/backups/uploads/1754104051240-Imagem do WhatsApp de 2025-07-09 \303\240(s) 11.31.54_….jpg"`),
então a âncora `$` do regex não casa com a extensão — ela cai depois da aspa. Todos os 41
arquivos perdidos são imagens recebidas por WhatsApp, ou seja, **exatamente a classe mais
sensível**. O comando correto:

```bash
git -c core.quotePath=false log --all --name-only --format="" | sort -u | grep -icE '\.(pdf|jpe?g|png|xlsx|csv|db|zip)$'
# → 311
```

**Este inventário classifica os 311.** Quem for validar com o comando do card vai ver 270;
a diferença é essa, e não uma lacuna de cobertura.

### Critério de exclusão declarado

Foram varridas **todas** as extensões presentes no histórico (1.178 paths únicos), não só as
sete do comando. Ficaram de fora, por não poderem carregar PII:

- **código e config** (`.ts .tsx .js .jsx .mjs .cjs .css .html .py .sh .bat .ps1 .yml .toml .prisma .conf`) — varridos por regex de PII em texto, resultado no Grupo B;
- **`.sql` (7 arquivos)** — migrations Prisma, só DDL; os `INSERT` que existem são `INSERT … SELECT` de recriação de tabela, sem nenhum `VALUES (…)` literal. Ver E11;
- **`.log` (6), `.txt` (1), `.meta` / `.rsc` / `.body` (24)** — varridos blob a blob no histórico: **0 acertos** de CPF, CNPJ, placa, telefone, e-mail ou nome de cliente;
- **`.map` (49), `.pack` (18), `.gz` (2), `.old` (4)** — artefatos de build do webpack, sem dado de usuário;
- **`.svg` (8), `.ttf` (1), `.ico` (2)** — vetores e fontes da marca do produto.

---

## Legenda de remédio

| Remédio | Significado |
|---|---|
| `--invert-paths` | `git filter-repo --invert-paths --path …` — o arquivo some do histórico inteiro. Para dado que não tem versão anonimizável. |
| `--replace-text` | `git filter-repo --replace-text …` — o literal é trocado em todos os commits. Para nome/endereço/telefone/e-mail embutido em código e doc. |
| `anonimizar` | Exige mudança de código antes da purga (não é troca de string). |
| `manter` | Não é PII; vai a público como está. |

---

## Grupo A — Binários (311 no histórico; 309 ainda rastreados no HEAD)

| # | Caminho | O que é | Real / fixture | Commits | Remédio | Estado | Evidência |
|---|---|---|---|---|---|---|---|
| A1 | `public/uploads/**` | **130 imagens** (74 jpg + 55 png/jpeg), 49,4 MB, média 380 KB — tamanho de foto de câmera, não de ícone. Composição: 44 fotos de veículo (frente / lado / conjunto / chassi / placa), 41 imagens recebidas por WhatsApp, **1 selfie com CNH** (documento pessoal, identificado pelo próprio nome do arquivo, que também carrega o primeiro nome do titular), 4 arquivos de logotipo do cliente, 3 páginas digitalizadas de documento, 37 uploads de nome genérico (`1.png`, `2.png`, `3.png`). Amostra verificada: foto frontal de caminhão com **placa Mercosul legível**. | **REAL** | 77 | `--invert-paths` | **APLICADO** | OSS-4 · `--invert-paths public/uploads` — 130 imagens, 0 commits restantes |
| A2 | `migration/backups/uploads/**` (imagens) | **68 imagens**, 32,4 MB — cópia de backup de A1: 27 fotos de veículo, 4 logotipos do cliente, 3 imagens de WhatsApp, 3 páginas digitalizadas, 31 uploads genéricos. | **REAL** | 50 | `--invert-paths` | **APLICADO** | OSS-1 · diretório já ausente do clone; reconfirmado no `--paths-from-file` do OSS-4 |
| A3 | `migration/backups/uploads/uploads-report-*.json` (3) | **Manifesto da PII**: lista os 68 nomes de arquivo (incluindo os de WhatsApp e o de documento pessoal), com hash e tamanho de cada um, agrupados em categorias que nomeiam o cliente. Publicar o manifesto vaza os nomes mesmo com as imagens removidas. | **REAL** (derivado) | 1 cada | `--invert-paths` | **APLICADO** | OSS-1 · idem (o manifesto sai junto com o diretório) |
| A4 | `migration/backups/uploads/restore-uploads-*.{bat,sh}` (6) | Scripts de restore que iteram sobre os mesmos nomes de arquivo. | **REAL** (derivado) | 1 cada | `--invert-paths` | **APLICADO** | OSS-1 · idem |
| A5 | `migration/backups/pdfs/checklist/**` | **54 PDFs de laudo.** Extração de texto: **54/54** contêm nome do cliente, placa de veículo, telefone e número de chassi (17 caracteres). São iterações de layout do mesmo laudo real, não fixtures. | **REAL** | 51 (dir.) | `--invert-paths` | **APLICADO** | OSS-1 · `migration/backups/pdfs` — 0 commits restantes |
| A6 | `migration/backups/pdfs/pinoRei/**` | **18 PDFs.** 12/18 com nome do cliente, placa e telefone. Os outros 6 (família `pino-rei-EXPANSAO-VERTICAL-*`) não devolvem texto extraível — provável falha de render. **Classificados como REAL** pela regra da dúvida: mesmo diretório, mesma origem, mesmo pipeline dos 12 confirmados. | **REAL** | 51 (dir.) | `--invert-paths` | **APLICADO** | OSS-1 · idem |
| A7 | `migration/backups/pdfs/ruido/**` | **6 PDFs.** 6/6 com nome do cliente, placa, telefone e chassi. | **REAL** | 51 (dir.) | `--invert-paths` | **APLICADO** | OSS-1 · idem |
| A8 | `migration/backups/pdfs/quintaRoda/**` | **3 PDFs.** 3/3 com nome do cliente, placa e telefone. | **REAL** | 51 (dir.) | `--invert-paths` | **APLICADO** | OSS-1 · idem |
| A9 | `migration/backups/database/gts-database-*.db` (3) | **Dump SQLite de produção**, 835 KB cada. Conteúdo do mais recente: **187 laudos**, **4 clientes** (4/4 com CNPJ, 3/4 com telefone formatado), **7 veículos** (7/7 com placa), 42 laudos de ruído, 16 de pino-rei, 14 de quinta-roda, 5 equipamentos. **2 linhas da tabela `Laudo` casam com formato de CPF.** 110 das 187 linhas de `Laudo` citam o cliente. | **REAL** | 7 (dir.) | `--invert-paths` | **APLICADO** | OSS-1 · `migration/backups/database` — 0 blobs `.db` no histórico |
| A10 | `launcher-production/backups/backup_2025090*.db` (7) | **Dump SQLite**, 926 KB cada, sete cópias do mesmo instante do dia 2025-09-01. Conteúdo: **4 usuários** (com hash de senha e nome de conta que identifica o cliente), **1 cliente com CNPJ**, **6 veículos com placa**, 15 equipamentos. | **REAL** | 1 | `--invert-paths` | **APLICADO** | OSS-1 · `launcher-production/backups` — 0 blobs `.db` no histórico |
| A11 | `prisma/dev.db`, `prisma/prisma/dev.db` | **Só no histórico** (`a1f4cfe`, removido em `08adf2f`) — 905 KB e 136 KB. Conteúdo do maior: 2 laudos, **8 veículos**, **4 usuários**, 1 cliente, 15 equipamentos. Não está no HEAD, mas está em `--all`. | **REAL** | 2 + 2 | `--invert-paths` | **APLICADO** | OSS-1 · `prisma/dev.db` e `prisma/prisma/dev.db` — 0 commits restantes |
| A12 | `launcher-production/1.png` | Screenshot do **painel de DNS do domínio do operador** — registros MX, SPF e chave pública DKIM à vista, com o subdomínio de produção. Não é PII de cliente, mas é exposição direta da infra do dono. | **REAL** (infra do operador) | 1 | `--invert-paths` | **APLICADO** | OSS-4 · `--invert-paths launcher-production/1.png` |
| A13 | `public/branding/**` (11) | Ícones e logotipos **do próprio produto** — `favicon`, `icon-192/512`, `icon-maskable-*`, `logo*`, `og-image`. 1,2 MB. Marca do dono do repo, não dado de terceiro. | **não é PII** | 5 (dir.) | **manter** | **PRESERVADO** | 11 arquivos — marca do produto, vão a público como estão |
| A14 | `public/*.{png,jpg}` na raiz (6) | Mesmos logotipos do produto, versões antigas fora de `branding/`. Amostra verificada (`public/para app em geral.jpg`): logotipo institucional do dono, sobre fundo branco. | **não é PII** | 1 cada | **manter** | **PRESERVADO** | 6 arquivos — marca do produto |
| A15 | `app/icon.png`, `app/apple-icon.png` (2) | Ícones de app do Next.js — mesma marca do produto. | **não é PII** | 1 cada | **manter** | **PRESERVADO** | 2 arquivos — marca do produto |

**Fechamento aritmético do Grupo A:** 130 + 68 + 54 + 18 + 6 + 3 + 3 + 7 + 2 + 1 + 11 + 6 + 2 = **311** ✔
(A3 e A4 são `.json`/`.bat`/`.sh` e por isso **não** entram nos 311 — estão listados aqui por
serem derivados diretos da PII de A2.)

**Verificação de EXIF:** as 104 fotos `.jpg` de `public/uploads` e `migration/backups/uploads`
foram varridas por metadado EXIF — **nenhuma** carrega tags de GPS, fabricante ou modelo de
câmera. Não há geolocalização embutida. Isso reduz o risco, **não** o elimina: a placa é legível
no próprio pixel.

---

## Grupo B — Dado real em texto, no HEAD

### B.1 — Identidade do cliente hardcoded no código (razão social + endereço + telefone)

O rodapé do laudo tem a **razão social completa, o endereço de rua e o telefone** do cliente
gravados como literal, em sete arquivos, como valor de fallback (`adminSettings.companyName || '…'`)
ou direto no template. Isto é dado empresarial real e identificável.

| # | Caminho | Onde | Real / fixture | Commits | Remédio | Estado | Evidência |
|---|---|---|---|---|---|---|---|
| B1 | `app/api/laudos/pdf/route.ts` | linhas 170, 369, 1262, 1267 | **REAL** | 2 | `--replace-text` + **anonimizar** (remover o fallback; exigir `AdminSetting`) | **APLICADO** | OSS-4 · fallbacks literais removidos; identidade vem de `AdminSetting` via `lib/companyIdentity.ts` + `--replace-text` |
| B2 | `components/laudos/ChecklistForm.tsx` | linha 542 | **REAL** | 2 | `--replace-text` + **anonimizar** | **APLICADO** | OSS-4 · `drawText(companyHeaderLine(adminSettings), …)` + `--replace-text` |
| B3 | `components/laudos/CreateLaudoForm.tsx` | linha 482 | **REAL** | 2 | `--replace-text` + **anonimizar** | **APLICADO** | OSS-4 · idem; o texto de garantia passou a citar "a empresa emissora" |
| B4 | `templates/laudo-pino-rei-template.html` | linha 392 | **REAL** | 2 | `--replace-text` | **APLICADO** | OSS-4 · template parametrizado (`{{companyName}}` / `{{companyAddress}}` / `{{companyPhone}}`), substituição ligada em `app/api/laudos/pino-rei/pdf/route.ts` |
| B5 | `templates/laudo-quinta-roda-template.html` | linha 437 | **REAL** | 2 | `--replace-text` | **APLICADO** | OSS-4 · idem em `app/api/laudos/quinta-roda/pdf/route.ts` |
| B6 | `templates/laudo-ruido-template.html` | rodapé | **REAL** | 2 | `--replace-text` | **APLICADO** | OSS-4 · template já usava placeholders; rodapé anonimizado |
| B7 | `types/checklist.ts` | linha 515 — texto jurídico de isenção de garantia, nominal ao cliente | **REAL** | 2 | `--replace-text` | **APLICADO** | OSS-4 · texto jurídico passou a citar "a empresa emissora" |

### B.2 — Nome do cliente dentro do modelo de autenticação ⚠️

Este é o achado que muda o custo da anonimização. O nome do cliente não é um rótulo de tela: ele
é **valor do tipo `UserRole`**, é string persistida na coluna `User.role`, e é comparado
literalmente na autorização. Trocar por `--replace-text` **quebra o login de qualquer banco
existente** — exige migration de dados.

| # | Caminho | Onde | Real / fixture | Commits | Remédio | Estado | Evidência |
|---|---|---|---|---|---|---|---|
| B8 | `lib/auth.ts` | l. 22 (`export type UserRole = 'admin' \| '<cliente>1' \| '<cliente>2'`), l. 34–35 (helper de papel) | **REAL** | 2 | **anonimizar** (refactor: papel genérico `inspector`) + `--replace-text` | **APLICADO** | OSS-4 · `UserRole` virou `admin | client_a | client_b` em `lib/roles.ts`; `is<Cliente>User` → `isClientUser` |
| B9 | `lib/middleware-auth.ts` | l. 38–39 — guarda de rota compara o papel literal | **REAL** | 1 | **anonimizar** + `--replace-text` | **APLICADO** | OSS-4 · `requireClientUser` compara contra `CLIENT_ROLES`; a sessão passa por type guard |
| B10 | `prisma/schema.prisma` | l. 21, 38, 113 (comentários), l. 290 (domínio da coluna `role`) | **REAL** | 2 | **anonimizar** + `--replace-text` | **APLICADO** | OSS-4 · comentários e domínio da coluna `role` reescritos |
| B11 | `prisma/seed-users.ts` | 26 ocorrências — cria as duas contas nominais do cliente. Também é onde vive a senha seed padrão (já rastreada no PANORAMA como achado de segredo, fora do escopo deste card) | **REAL** | 2 | **anonimizar** + `--replace-text` | **APLICADO** | OSS-4 · seed reescrito com `CLIENT_ACCOUNTS`; a senha padrão agora vem de `SEED_PASSWORD` |
| B12 | `app/admin/users/page.tsx` | l. 34, 68, 186–187 — o `<option>` do seletor de papel expõe o nome do cliente na UI | **REAL** | 1 | **anonimizar** + `--replace-text` | **APLICADO** | OSS-4 · o `<option>` lê `ROLE_LABELS`; a listagem usa `roleLabel()` |
| B13 | `app/admin/users/AdminUsers.module.css` | 2 ocorrências — classes CSS nomeadas pelo cliente | **REAL** | 1 | `--replace-text` | **APLICADO** | OSS-4 · classes `.role.client_a` / `.role.client_b` |

### B.3 — Scripts operacionais e artefatos de migração nominais ao cliente

| # | Caminho | O que é | Real / fixture | Commits | Remédio | Estado | Evidência |
|---|---|---|---|---|---|---|---|
| B14 | `clear-laudos-<cliente>.js` | 21 ocorrências — script ad-hoc de limpeza dos laudos daquele cliente, na raiz do repo. Não é produto. | **REAL** | 1 | `--invert-paths` | **APLICADO** | OSS-4 · `--invert-paths` no script ad-hoc de limpeza |
| B15 | `fix-and-clear-laudos.js` | 20 ocorrências — idem. | **REAL** | 1 | `--invert-paths` | **APLICADO** | OSS-4 · `--invert-paths` no script ad-hoc de limpeza |
| B16 | `migration/backup-uploads.js` | 8 ocorrências — classifica uploads em grupos, um deles nomeado pelo cliente (`<cliente>Logos`) | **REAL** | 1 | `--replace-text` | **APLICADO** | OSS-4 · grupo renomeado para `clientLogos` + `--replace-text` |
| B17 | `migration-system/01-exportar-sistema-completo.bat` | 2 ocorrências | **REAL** | 1 | `--replace-text` | **APLICADO** | OSS-4 · `(admin, client_a, client_b)` + `--replace-text` |
| B18 | `dias_trabalho.json` | Inventário de **944 arquivos da máquina do dono** (112 MB), com paths locais absolutos; 9 deles nomeiam o cliente. Não é PII de cliente, mas expõe a estrutura de disco do operador e não tem função no produto. | **REAL** (infra do operador) | 1 | `--invert-paths` | **APLICADO** | OSS-4 · `--invert-paths dias_trabalho.json` |

### B.4 — E-mail e domínio reais do operador

| # | Caminho | O que é | Real / fixture | Commits | Remédio | Estado | Evidência |
|---|---|---|---|---|---|---|---|
| B19 | `traefik-data/acme.json` | E-mail de conta ACME real, no domínio do operador (`terpens.com.br`). O arquivo também guarda a chave privada Let's Encrypt — **já é alvo do OSS-1**; listado aqui só para o inventário de PII ficar completo. | **REAL** | 1 | `--invert-paths` | **APLICADO** | OSS-4 · `--invert-paths traefik-data` (o OSS-1 tratou a chave; o diretório inteiro saiu agora) |
| B20 | `ALTERNATIVAS-DOCKER-AVANCADAS.md` | 3 ocorrências do mesmo e-mail real, em exemplos de config Traefik/Caddy | **REAL** | 1 | `--replace-text` | **APLICADO** | OSS-4 · e-mail trocado por `admin@example.com` + `--replace-text` no histórico |
| B21 | `app/login/page.tsx` | l. 447 — e-mail de suporte no domínio real do operador, renderizado no rodapé da tela de login (`mailto:`). As outras 2 ocorrências do arquivo são placeholders fictícios. | **REAL** (parcial) | 6 | `--replace-text` | **APLICADO** | OSS-4 · e-mail de suporte trocado por `suporte@example.com` + `--replace-text` |

### B.5 — Documentação que nomeia o cliente

Nenhum destes carrega CPF, CNPJ, placa ou telefone real — só o **nome do cliente**, o que já é
suficiente para revelar a relação comercial. Decisão única: se o repo público vai anonimizar o
cliente, todos entram no mesmo `--replace-text`.

| # | Caminho | Ocorrências | Real / fixture | Commits | Remédio | Estado | Evidência |
|---|---|---|---|---|---|---|---|
| B22 | `documentacao/06_AUTENTICACAO.md` | 8 | **REAL** | 1 | `--replace-text` | **APLICADO** | OSS-4 · anonimizado no HEAD + `--replace-text` |
| B23 | `SEGURANCA-AUTENTICACAO.md` | 6 | **REAL** | 1 | `--replace-text` | **APLICADO** | OSS-4 · idem |
| B24 | `API-REFERENCE.md` | 6 | **REAL** | 1 | `--replace-text` | **APLICADO** | OSS-4 · idem |
| B25 | `README.md` | 5 | **REAL** | 3 | `--replace-text` | **APLICADO** | OSS-4 · idem |
| B26 | `MANUAL-USUARIO.md` | 4 | **REAL** | 1 | `--replace-text` | **APLICADO** | OSS-4 · idem |
| B27 | `DATABASE-SCHEMA.md` | 3 | **REAL** | 1 | `--replace-text` | **APLICADO** | OSS-4 · idem |
| B28 | `agents.md` | 3 | **REAL** | 1 | `--replace-text` | **APLICADO** | OSS-4 · idem |
| B29 | `DOCUMENTACAO-ARQUITETURA.md`, `documentacao/01_ARQUITETURA.md`, `documentacao/02_BANCO_DE_DADOS.md`, `migration-system/README-MIGRACAO-COMPLETA.md` | 2 cada | **REAL** | 1 cada | `--replace-text` | **APLICADO** | OSS-4 · idem (4 arquivos) |
| B30 | `documentacao/03_FLUXOS.md`, `documentacao/05_COMPONENTES.md` | 1 cada | **REAL** | 1 cada | `--replace-text` | **APLICADO** | OSS-4 · idem (2 arquivos) |
| B31 | `.gitignore` | 2 — regras nomeadas pelo cliente (`clear-laudos-<cliente>.js` etc.) | **REAL** | 3 | `--replace-text` | **APLICADO** | OSS-4 · regras renomeadas para não citar o cliente |

### B.6 — Zona cinzenta: marcado REAL pela regra da dúvida

| # | Caminho | Por que é dúvida | Decisão | Commits | Remédio | Estado | Evidência |
|---|---|---|---|---|---|---|---|
| B32 | `scripts/seed-test-data.ts` | O registro se chama `CLIENTE TESTE` e o CNPJ é claramente fictício (sequência de zeros) — sinais de fixture. **Mas** o telefone e o WhatsApp usam DDD 51 (RS, a região do cliente) e formato de número real, não `9999-9999`. Não dá para provar que não é o número do cliente. | **REAL** (regra da dúvida da missão) | 1 | **anonimizar** (trocar por `(11) 90000-0000`) | **APLICADO** | OSS-4 · telefone e WhatsApp trocados por `(11) 90000-0000` |
| B33 | `components/clients/ClientForm.tsx` | l. 106 — `placeholder="Ex: …"` com telefone de DDD 51 em formato real. Mesmo raciocínio de B32. | **REAL** (regra da dúvida) | 2 | **anonimizar** | **APLICADO** | OSS-4 · `placeholder="Ex: (11) 90000-0000"` |

---

## Grupo C — Dado real presente **só no histórico**

| # | Caminho | O que é | Real / fixture | Commits | Remédio | Estado | Evidência |
|---|---|---|---|---|---|---|---|
| C1 | `.next/**` — 15 paths com acerto de PII: `server/app/api/laudos/pdf/route.js`, `server/app/admin/users/page.js`, `server/app/vehicles/page.js`, `server/chunks/4157.js`, `server/chunks/4780.js`, `server/chunks/[root-of-the-server]__cf75eae7._.js`, `server/chunks/ssr/app_login_e99d63e4._.js`, `server/app/api/upload/route.js.nft.json`, `static/chunks/1605-*.js`, `static/chunks/8742-*.js`, `static/chunks/app/admin/users/page-*.js`, `static/chunks/app/login/page-*.js`, `static/chunks/app/vehicles/page-*.js`, `static/chunks/app_login_cafdc818._.js`, `static/css/2b722cf905210981.css` | Build compilado carregando as **mesmas** strings do Grupo B (razão social, telefone, placa de exemplo, e-mail). Removido do HEAD na limpeza de 2026-06, **continua em 211 commits**. | **REAL** (cópia derivada) | 211 (dir. inteiro) | `--invert-paths` no diretório `.next/` inteiro | **APLICADO** | OSS-1 · diretório `.next/` — 0 commits restantes |
| C2 | `app/api/dev-seed/route.ts` | Rota de seed de desenvolvimento, deletada do HEAD. Carrega CNPJ e telefone. | **REAL** (regra da dúvida) | 2 | `--invert-paths` | **APLICADO** | OSS-1 · `app/api/dev-seed/route.ts` — 0 commits restantes |

> Estes 17 paths são o motivo pelo qual `git rm --cached` **não basta**. Eles já não estão no
> HEAD e continuam publicáveis por qualquer `git log -p`.

---

## Grupo D — Mensagens de commit

Varridas as **512** mensagens (assunto + corpo) de `--all`:

| Padrão | Acertos literais | Nota |
|---|---|---|
| CPF | **0** | — |
| CNPJ | **0** | 2 assuntos citam a *palavra* "CNPJ" como nome de feature (`88781c2`, `22b60f1`) — não é dado |
| Placa | **0** | — |
| Telefone | **0** | — |
| E-mail | **0** | — |
| Nome do cliente | **2 assuntos** | `85bab9a` e `0129d66` citam as contas `<cliente>1`/`<cliente>2` |
| Autoria | 512 commits | Um único autor, e-mail pessoal do dono do repo |

**Remédio:** `manter`, com uma ressalva — se a decisão for anonimizar o cliente, os **2 assuntos**
de commit entram no mesmo `--replace-text` (o `filter-repo` reescreve mensagem junto com blob).
A identidade do autor é o dono do repositório e é dele a decisão de publicá-la; nenhuma ação
recomendada.

---

## Grupo E — Acertos que **são** fixture, e por quê

O passo 3 do "Como confirmo" exige que todo acerto de padrão fora do inventário seja
justificado. Estes são os arquivos onde o regex acertou e o valor **não** é dado real.

### E.1 — Arquivos cujos acertos são inteiramente fictícios

| # | Caminho | Acertos | Real / fixture | Por que é fixture | Commits | Remédio | Estado | Evidência |
|---|---|---|---|---|---|---|---|---|
| E1 | `components/laudos/PinoReiForm.tsx` | 1 placa | **FIXTURE** | `placeholder="AAA1B23"` — placa-modelo do padrão Mercosul, sequência alfabética | 2 | **manter** | **PRESERVADO** | fixture / falso positivo — vai a público como está |
| E2 | `components/laudos/QuintaRodaForm.tsx` | 1 placa | **FIXTURE** | idem | 2 | **manter** | **PRESERVADO** | fixture / falso positivo — vai a público como está |
| E3 | `components/vehicles/VehicleForm.tsx` | 1 placa | **FIXTURE** | `placeholder="e.g., …"` — placa-modelo | 2 | **manter** | **PRESERVADO** | fixture / falso positivo — vai a público como está |
| E4 | `app/api/equipments/extract-certificate/route.ts` | 1 placa | **FIXTURE** | **falso positivo**: é o campo `"model"` de um exemplo de saída de OCR de certificado; o valor casa por acaso com o formato de placa | 1 | **manter** | **PRESERVADO** | fixture / falso positivo — vai a público como está |
| E5 | `diagnosticos/README-VULNERABILIDADE.md` | 1 placa | **FIXTURE** | **falso positivo**: `CVE-2025` casa com o formato de placa antiga `[A-Z]{3}-\d{4}` | 1 | **manter** | **PRESERVADO** | fixture / falso positivo — vai a público como está |
| E6 | `diagnosticos/verificar-vulnerabilidade-react.js` | 2 placas | **FIXTURE** | idem — `CVE-2025` | 1 | **manter** | **PRESERVADO** | fixture / falso positivo — vai a público como está |
| E7 | `docs/implementacao/correcao-cve-2025-55182.md` | 6 placas, 1 e-mail | **FIXTURE** | `CVE-2025` (falso positivo) + `cert.br` (endereço público de CERT, não pessoal) | 1 | **manter** | **PRESERVADO** | fixture / falso positivo — vai a público como está |
| E8 | `docs/implementacao/resumo-correcoes-seguranca.md` | 5 placas | **FIXTURE** | `CVE-2025` — falso positivo | 1 | **manter** | **PRESERVADO** | fixture / falso positivo — vai a público como está |
| E9 | `MANUTENCAO-SISTEMA.md` | 4 e-mails | **FIXTURE** | Todos em `@easylaudos.com` — domínio fictício de exemplo, tabela de escalonamento genérica | 1 | **manter** | **PRESERVADO** | fixture / falso positivo — vai a público como está |
| E10 | `INSTALACAO-CONFIGURACAO.md` | 2 e-mails | **FIXTURE** | `git@github.com` (host) e `seu-email@gmail.com` (placeholder de SMTP). *O arquivo contém senha de banco — é achado de segredo, escopo do OSS-1, não deste card.* | 1 | **manter** (quanto a PII) | **PRESERVADO** | fixture / falso positivo — vai a público como está |
| E11 | `prisma/migrations/*/migration.sql` (7) | — | **FIXTURE** | Só DDL. Há 5 `INSERT`, mas todos são `INSERT INTO "new_X" … SELECT … FROM "X"` — o padrão de recriação de tabela que o Prisma emite para SQLite. **Zero `VALUES (…)` literais** nos 7 arquivos (verificado) | 1 cada | **manter** | **PRESERVADO** | fixture / falso positivo — vai a público como está |

### E.2 — Arquivos **mistos**: já listados no Grupo B, mas parte dos acertos é fixture

Estes não podem ser "mantidos" (têm dado real em outra linha), mas os acertos abaixo
especificamente **não** devem entrar em nenhum `--replace-text`:

| Caminho | Acertos fictícios | Justificativa |
|---|---|---|
| `API-REFERENCE.md` (B24) | 4 CNPJ, 5 telefones, 6 placas | Corpo de request/response de exemplo: `"name": "Nome da Empresa"`, CNPJ de zeros, telefone DDD 11 genérico, placa `AAA1B23`. O que é real no arquivo é só o **nome do cliente** |
| `README.md` (B25) | 1 CNPJ, 1 telefone, 1 placa | `"Empresa Exemplo Ltda"`, CEP `01234-567`, e-mail `@easylaudos.com.br`. Real: só o nome do cliente |
| `MANUAL-USUARIO.md` (B26) | 2 placas, 1 e-mail | Formato de placa explicado ao usuário; e-mail `@easylaudos.com.br`; WhatsApp `(00) 00000-0000`. Real: só o nome do cliente |
| `SEGURANCA-AUTENTICACAO.md` (B23) | 4 e-mails | `@empresa.com` e `@exemplo.com`, com telefones `9999-9999`/`8888-8888`/`7777-7777`. Um dos trechos é justamente o exemplo de rotina de **anonimização** do próprio sistema. Real: só o nome do cliente |
| `app/login/page.tsx` (B21) | 1 CNPJ, 2 e-mails | `placeholder` de CNPJ (zeros) e `@empresa.com.br`. Real: o e-mail de suporte da l. 447 |
| `scripts/seed-test-data.ts` (B32) | 2 CNPJ | Cliente literalmente chamado `CLIENTE TESTE`, CNPJ de zeros. O que ficou marcado REAL é só o telefone/WhatsApp (ver B32) |
| `components/clients/ClientForm.tsx` (B33) | — | Único acerto é o telefone de exemplo, já tratado em B33 |

---

## O que a purga precisa saber (entrega para OSS-1 / OSS-4)

### Lista `--invert-paths` (dado que não tem versão anonimizável)

```
public/uploads/
migration/backups/uploads/
migration/backups/pdfs/
migration/backups/database/
launcher-production/backups/
launcher-production/1.png
prisma/dev.db
prisma/prisma/dev.db
.next/
clear-laudos-<cliente>.js
fix-and-clear-laudos.js
dias_trabalho.json
traefik-data/
app/api/dev-seed/route.ts
```

> ⚠️ Ao montar o `--path` para `public/uploads/` e `migration/backups/uploads/`, use
> `--path` de **diretório**, nunca uma lista de arquivos: 41 dos nomes têm caracteres não-ASCII
> e uma lista literal escrita à mão vai errar o escape (é a mesma armadilha da *Nota de contagem*).

### Lista `--replace-text` (literais a extrair dos `arquivo:linha` do Grupo B)

Quatro literais, todos localizáveis pelas referências acima — **não transcritos aqui por regra do card**:

1. Razão social completa do cliente → B1–B7, B22–B31 (+ 2 assuntos de commit)
2. Endereço de rua do cliente → B1 (l. 1262, 1267), B2, B3, B4, B5, B6
3. Telefone do cliente → B1–B6, B32, B33
4. E-mail real do operador → B19, B20, B21

### Trabalho de código que precede a purga (não é troca de string)

- **`UserRole`** (B8–B12): trocar os dois papéis nominais por papéis genéricos e escrever a
  migration de dados da coluna `User.role`. Sem isso, `--replace-text` produz um repo que não loga.
- **Fallback de identidade no PDF** (B1–B3): remover o `|| '<razão social>'` e falhar explicitamente
  quando `AdminSetting` não estiver preenchido. Trocar a string pelo nome de uma empresa fictícia
  só move o problema.

---

## Resposta à pergunta que o card faz: fixtures realistas ou dados sintéticos?

**Dados sintéticos.** Não sobra nenhuma fixture realista para aproveitar: as 289 imagens e PDFs
são todas derivadas de um único cliente real, os três dumps SQLite são cópias de produção, e os
únicos valores que já eram fictícios (`API-REFERENCE.md`, `README.md`, `MANUAL-USUARIO.md`,
`app/login/page.tsx` como placeholder, `SEGURANCA-AUTENTICACAO.md`, `MANUTENCAO-SISTEMA.md`,
`docs/implementacao/*.md`, `prisma/migrations/*.sql`, `diagnosticos/*`) já são placeholders de
documentação — `AAA1B23`, `00.000.000/0000-00`, `@easylaudos.com`, `@empresa.com`, `@exemplo.com` —
e podem ficar como estão.

O repo público vai precisar de um seed sintético novo: um cliente fictício, dois ou três veículos
com placa inventada, e um punhado de fotos genéricas (ou nenhuma foto — o fluxo de upload
funciona vazio).

---

## Como este inventário foi levantado (reprodutível)

```bash
# censo de binários no histórico — note o core.quotePath=false
git -c core.quotePath=false log --all --name-only --format="" | sort -u \
  | grep -iE '\.(pdf|jpe?g|png|xlsx|csv|db|zip)$'

# censo de TODAS as extensões, para justificar o critério de exclusão
git -c core.quotePath=false log --all --name-only --format="" | sort -u \
  | grep -oiE '\.[a-z0-9]{1,6}$' | sort | uniq -c | sort -rn

# PII em texto: varredura blob a blob de todo o histórico (781 blobs de texto)
git rev-list --objects --all   # + git cat-file --batch, regex de CPF/CNPJ/placa/tel/e-mail

# PDFs: pdftotext em cada um, contando acertos de padrão (nunca imprimindo o valor)
# dumps SQLite: sqlite3 em modo read-only, COUNT(*) por tabela + regex por linha
# EXIF: leitura do segmento APP1 de cada .jpg, listando IDs de tag sem ler valores
```

Nenhum arquivo foi movido, apagado ou alterado neste levantamento. Nenhum `filter-repo` foi
executado. O checkout original não foi tocado — todo o trabalho ficou na worktree
`oss-2-inventario-pii`.
