# 📋 Easy Laudos — Emissão de Laudos de Inspeção Técnica Veicular

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black.svg)
![React](https://img.shields.io/badge/React-19.1.2-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)
![Prisma](https://img.shields.io/badge/Prisma-6.9.0-2D3748.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Sistema web para emissão de laudos técnicos de inspeção veicular, com geração de PDF e conformidade às normas brasileiras (ABNT, INMETRO, CONTRAN).**

[Sobre](#-sobre-o-projeto) • [Rodando localmente](#-rodando-localmente) • [Estrutura](#-estrutura-do-projeto) • [Limitações](#%EF%B8%8F-limitações-e-estado-atual) • [Contribuindo](CONTRIBUTING.md)

</div>

---

## 🎯 Sobre o projeto

O **Easy Laudos** automatiza a emissão de laudos técnicos de inspeção de veículos pesados: cadastro de clientes e veículos, controle de equipamentos de medição (com alerta de vencimento de calibração) e geração de PDF profissional para cada tipo de laudo.

### Tipos de laudo suportados

| Laudo | O que verifica |
|---|---|
| **Checklist de Inspeção** | Itens obrigatórios de verificação, com registro fotográfico |
| **LIT** (Laudo de Inspeção Técnica) | Laudo geral com dados completos de cliente/veículo/equipamento |
| **Ruído** | 6 medições em aceleração + 6 em marcha lenta (dB), limites CONTRAN |
| **Pino Rei** | Exame visual do pino rei e da mesa de engate (5ª roda) |
| **Quinta Roda** | 12 itens de exame visual da quinta roda |

### Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Estilo | Tailwind CSS 4 + CSS Modules |
| Dados | Prisma ORM + SQLite (trocável por Postgres/MySQL via `DATABASE_URL`) |
| PDF | pdf-lib + Puppeteer (renderização de template HTML) |
| OCR / IA | Tesseract.js, OpenAI API, Google Gemini (opcional, para extração automática de dados de documentos) |

---

## 📦 Pré-requisitos

- Node.js 18.17+ e npm
- Git

Não há dependência de banco externo para rodar localmente — o `DATABASE_URL` padrão aponta para um arquivo SQLite (`prisma/dev.db`).

## 🚀 Rodando localmente

```bash
# 1. Clonar e instalar dependências
git clone https://github.com/MarcosRippel/general-laudos.git
cd general-laudos
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env — no mínimo DATABASE_URL já funciona com o valor padrão (SQLite local).
# As integrações de OCR/IA (OpenAI, Gemini) e notificação (Telegram) são opcionais.

# 3. Criar o banco a partir do schema (ver nota abaixo sobre por que não é "migrate dev")
npx prisma generate
npx prisma db push

# 4. Subir o servidor de desenvolvimento
npm run dev
```

> **Por que `db push` e não `migrate dev`?** O `prisma/schema.prisma` deste repo está à frente do histórico de migrations em `prisma/migrations/` — 4 colunas existem no schema (`AdminSetting.nomeResponsavel`, `Client.contactWhatsapp`, `Laudo.documentHash`, `LaudoRuido.ruidoMaximoMedido`) sem uma migration correspondente. Rodar `npx prisma migrate deploy` aplica só as migrations existentes e deixa o banco **sem** essas 4 colunas — o app quebra ao tocar nelas. `npx prisma db push` sincroniza o banco com o schema atual direto, contornando o problema para desenvolvimento local. Isso é uma dívida técnica real do repositório, não documentação errada — ver [Limitações](#%EF%B8%8F-limitações-e-estado-atual).

Não há usuário pré-criado: o repositório inclui `prisma/seed.ts` e `prisma/seed-users.ts`, mas **`npx prisma db seed` não está configurado** (falta o bloco `"prisma": {"seed": "..."}` no `package.json` e uma ferramenta como `tsx`/`ts-node` para rodar `.ts` fora do Next.js — nenhuma delas está instalada). Para criar o primeiro usuário, use o Prisma Studio:

```bash
npx prisma studio
# crie um registro em User manualmente — senha é hash bcrypt, veja lib/auth.ts para gerar o hash
```

O app sobe em `http://127.0.0.1:3006` — porta fixa definida no script `dev` do `package.json` (não a 3000 padrão do Next.js), livre para trocar editando `-p <porta>` no script. Não é acoplamento a infraestrutura: é só o valor que os scripts npm deste repo usam por padrão.

Outros scripts disponíveis:

```bash
npm run build   # build de produção
npm run start   # servir o build de produção
npm run lint    # eslint
```

Deploy em servidor próprio, Docker, Nginx e rotina de manutenção (backup, logs, troubleshooting) estão documentados em [`docs/OPERACAO.md`](docs/OPERACAO.md) — separado deste README porque assume um ambiente de produção que você mesmo administra.

---

## 📁 Estrutura do projeto

```
general-laudos/
├── app/                  # Next.js App Router
│   ├── api/              # API Routes (backend) — auth, clients, vehicles, laudos, pdf, upload...
│   ├── login/            # Rota pública de autenticação
│   ├── admin/            # Painel administrativo
│   ├── emitirlaudo/      # Fluxo de emissão de laudo
│   └── laudos/           # Listagem e histórico de laudos
├── components/           # Componentes React (inclui os formulários de cada tipo de laudo)
├── lib/                  # Prisma client, autenticação, utilitários
├── prisma/               # schema.prisma, migrations, seeds
├── types/                # Tipos TypeScript compartilhados
├── public/               # Estáticos (uploads de usuário ficam em public/uploads, fora do git)
└── docs/                 # Documentação técnica (arquitetura, API, banco de dados)
```

Referência completa da API: [`API-REFERENCE.md`](API-REFERENCE.md). Esquema do banco: [`DATABASE-SCHEMA.md`](DATABASE-SCHEMA.md).

---

## ⚠️ Limitações e estado atual

Sendo honesto sobre onde o projeto está hoje:

- **Sem suíte de testes automatizados.** Não há `npm test` nem CI configurado neste repositório ainda — validação é manual. Veja [`CONTRIBUTING.md`](CONTRIBUTING.md) para como testar uma mudança antes de abrir PR.
- **Migrations desatualizadas em relação ao schema.** `prisma/schema.prisma` tem 4 colunas (`AdminSetting.nomeResponsavel`, `Client.contactWhatsapp`, `Laudo.documentHash`, `LaudoRuido.ruidoMaximoMedido`) sem migration correspondente em `prisma/migrations/`. Confirmado rodando `npx prisma migrate diff` numa instalação limpa. Use `npx prisma db push` para desenvolvimento local (contorna o problema); em produção com `migrate deploy`, alguém precisa gerar a migration faltante primeiro.
- **`npx prisma db seed` não faz nada.** Os arquivos `prisma/seed.ts` e `prisma/seed-users.ts` existem mas não estão conectados ao comando — falta o bloco `"prisma": {"seed": ...}` no `package.json` e uma dependência para rodar TypeScript fora do Next.js (`tsx` ou `ts-node`, nenhuma presente). Confirmado: o comando roda e sai com código 0 sem criar nada. Crie o primeiro usuário via `npx prisma studio`.
- **SQLite por padrão.** O schema Prisma usa `provider = "sqlite"`; para produção multi-instância, trocar para Postgres/MySQL exige ajustar `prisma/schema.prisma` e `DATABASE_URL` — não testado neste repo com outro provider.
- **Multi-tenancy é por usuário, não por organização.** Isolamento de dados acontece via coluna `userId`, sem um conceito formal de "conta"/"empresa" acima do usuário.
- **Sem docker-compose para o banco.** O `docker-compose.yml` sobe o app e um proxy Nginx, mas assume SQLite em arquivo — não há serviço de Postgres incluso.
- **Integrações de IA (OpenAI, Gemini) e Telegram são opcionais** e degradam de forma graciosa se as chaves não estiverem configuradas, mas não foram testadas exaustivamente sem elas.

Detalhes de deploy em produção própria (fora da máquina do mantenedor) estão em [`docs/OPERACAO.md`](docs/OPERACAO.md), incluindo o que é específico da instalação original do mantenedor vs. o que é genérico.

---

## 🤝 Contribuindo

Veja [`CONTRIBUTING.md`](CONTRIBUTING.md).

## 🔒 Segurança

Para reportar uma vulnerabilidade, veja [`SECURITY.md`](SECURITY.md) — não abra uma issue pública.

## 📝 Licença

MIT — veja [`LICENSE`](LICENSE).

---

<div align="center">

**[⬆ Voltar ao topo](#-easy-laudos--emissão-de-laudos-de-inspeção-técnica-veicular)**

</div>
