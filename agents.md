# 🤖 Agent Instructions - Easy Laudos (Emissor de Laudos - Inspetor)

> **Projeto**: Easy Laudos - Sistema de Emissão de Laudos de Inspeção Técnica Veicular
> **Stack**: Next.js 15.3.3 | React 19 | TypeScript 5 | Prisma 6.9 | SQLite | Puppeteer | Tailwind CSS 4
> **Porta Dev**: 3006 (`npm run dev` → `localhost:3006`)

---

## 📋 Resumo do Sistema

O Easy Laudos é uma aplicação web Next.js (App Router) para emissão de laudos de inspeção técnica de veículos pesados. O sistema gera PDFs profissionais conformes às normas ABNT/INMETRO/CONTRAN para 5 tipos de inspeção: Checklist, LIT, Ruído, Pino Rei e Quinta Roda.

---

## 🏗️ Arquitetura em 3 Frases

1. **Frontend**: React 19 Client Components + Tailwind CSS 4 + CSS Modules, com `AuthWrapper` (context) protegendo todas as rotas e `MainLayout` fornecendo sidebar/header.
2. **Backend**: 32 API Routes REST em `/app/api/`, autenticação por cookie `gts_session` (8h TTL), multi-tenancy via coluna `userId`.
3. **Dados**: Prisma ORM com SQLite (`prisma/dev.db`), 7+ modelos (User, Client, Vehicle, Laudo + 3 subtipos, Equipment, AdminSetting).

---

## 📂 Estrutura Crítica

```
app/
├── api/          # 32 endpoints REST
├── login/        # Rota pública
├── admin/        # Admin-only (users, equipments, settings)
├── emitirlaudo/  # Selector de tipo de laudo
├── laudos/       # Formulários de laudo (create, checklist, pino-rei, quinta-roda)
├── clients/      # Cadastro de clientes
└── vehicles/     # Gestão de veículos + OCR

components/
├── auth/         # AuthWrapper (React Context global)
├── layout/       # MainLayout (Sidebar + Header)
├── laudos/       # 5 formulários complexos (Checklist=135KB, maior)
├── vehicles/     # Form + OCR + PDF reader
└── equipments/   # Notificações de calibração

lib/
├── prisma.ts     # Singleton Prisma Client
├── auth.ts       # hashPassword (SHA-256 + salt), tipos, helpers
├── middleware-auth.ts  # getSessionFromRequest (cookie parser)
└── download.ts   # Helpers de download

prisma/
├── schema.prisma # 292 linhas, 7+ modelos com enums
└── dev.db        # SQLite ativo (~925KB)
```

---

## 🔑 Auth & Multi-Tenancy

- **Sessão**: Cookie `gts_session` = `JSON{userId, username, role, loginTime}` (8h)
- **Hash**: `SHA-256(password + AUTH_SALT)`
- **Roles**: `admin` | `client_a` | `client_b`
- **Isolamento**: Coluna `userId` em Client, Equipment, AdminSetting
- **Admin vê**: dados com `userId = null`
- **cliente vê**: dados com seu `userId` específico

---

## 📄 5 Tipos de Laudo

| Tipo | Form Component | Tamanho | Dados Chave |
|------|---------------|---------|-------------|
| **Checklist** | ChecklistForm.tsx | 135KB | Dezenas de itens de verificação + fotos |
| **LIT** | CreateLaudoForm.tsx | 46KB | Inspeção técnica geral |
| **Ruído** | RuidoForm.tsx | 29KB | 12 medições dB + equipamento |
| **Pino Rei** | PinoReiForm.tsx | 38KB | Visual pino + mesa + ensaios |
| **Quinta Roda** | QuintaRodaForm.tsx | 32KB | 12 itens visuais + 3 fotos |

---

## 🎯 Regras para o Agente

### ✅ SEMPRE FAZER
1. **Verificar auth**: Qualquer novo endpoint deve usar `getSessionFromRequest()`
2. **Multi-tenancy**: Filtrar por `userId` em queries de Client e Equipment
3. **TypeScript**: Todo código deve ser tipado, usar interfaces de `types/`
4. **CSS Modules**: Novos componentes devem ter `.module.css` correspondente
5. **Prisma migrations**: Sempre criar migration após alterar `schema.prisma`
6. **Testar PDF**: Alterações no schema que afetam laudos devem validar geração de PDF

### ❌ NUNCA FAZER
1. **Não expor dados de outros tenants** - sempre verificar userId
2. **Não modificar `dev.db` diretamente** - usar Prisma CLI
3. **Não alterar estrutura de cookies** sem atualizar AuthWrapper e middleware
4. **Não adicionar npm packages** sem justificativa (manter bundle pequeno)
5. **Não quebrar as rotas de PDF** - são o core de negócio do sistema

### ⚠️ CUIDADO
1. **ChecklistForm.tsx (135KB)** - arquivo massivo, editar com cuidado
2. **PDF route.ts (62KB)** - lógica complexa de templates inline
3. **Prisma Decimal** - campos de ruído retornam `Decimal`, converter com `toNumber()`
4. **Puppeteer** - requer Chrome/Chromium no ambiente para gerar PDFs

---

## 📚 Documentação Completa

Toda a documentação detalhada está em `documentacao/`:
- `00_INDICE.md` - Índice geral
- `01_ARQUITETURA.md` - Arquitetura completa + diagramas
- `02_BANCO_DE_DADOS.md` - Schema, ER, modelos detalhados
- `03_FLUXOS.md` - 10 diagramas de fluxo do sistema
- `04_API_REFERENCE.md` - Todos os 32 endpoints
- `05_COMPONENTES.md` - Hierarquia de componentes React
- `06_AUTENTICACAO.md` - Auth, sessão, segurança, multi-tenancy
- `07_PDF_GENERATION.md` - Motor de geração de PDFs

---

## 🔧 Comandos Úteis

```bash
npm run dev          # Dev server porta 3006 (Turbopack)
npm run build        # Build produção
npm run start:https  # HTTPS local
npx prisma studio    # GUI do banco de dados
npx prisma migrate dev  # Nova migration
npx prisma generate  # Regenerar client
```


## 🕸️ Graphify (knowledge graph)

Este repo faz parte do ecossistema GTS que usa **graphify** para mapear código em grafo de conhecimento.
Manual completo: ver `MANUTENCAO-GRAPHIFY.md` na raiz deste repo.

Se existir `graphify-out/graph.json` aqui, leia `graphify-out/GRAPH_REPORT.md` antes de usar grep/glob.

**Comandos essenciais:**
- `/graphify .` — pipeline completo (1ª vez, custa tokens)
- `graphify update .` — rebuild AST (grátis, seguro de rodar sempre)
- `graphify query "pergunta"` — consulta no grafo (grátis)

Painel de controle: http://localhost:9000 → card 🕸️ Graphify Watch.
