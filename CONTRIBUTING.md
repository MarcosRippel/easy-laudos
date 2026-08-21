# Contribuindo

Obrigado por considerar contribuir com o Easy Laudos. Este documento cobre o mínimo para rodar o projeto localmente, testar uma mudança e abrir um PR.

## Setup

Siga o [`README.md`](README.md#-rodando-localmente) — `npm install`, `.env` a partir de `.env.example`, `npx prisma migrate dev`, `npm run dev`.

## Rodando checagens antes de abrir PR

O repositório **não tem suíte de testes automatizados nem CI configurados ainda** (`npm test` não existe). Antes de abrir um PR:

```bash
npm run lint      # eslint — obrigatório, deve passar sem erros
npm run build     # garante que o build de produção não quebrou
```

E teste manualmente o fluxo que você alterou rodando `npm run dev` e passando pela tela/rota afetada. Se você adicionar uma funcionalidade nova, descreva no PR como você validou manualmente (passos, dados de teste usados) — isso substitui o teste automatizado que ainda não existe.

Se a sua mudança envolve `prisma/schema.prisma`, gere a migration com `npx prisma migrate dev --name descricao-da-mudanca` e inclua os arquivos gerados em `prisma/migrations/` no commit.

## Padrão de commit

O histórico recente segue [Conventional Commits](https://www.conventionalcommits.org/) em português:

```
tipo(escopo): descrição curta no imperativo
```

Tipos usados no repo: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`. Exemplos reais:

```
fix(seg): exigir autenticacao em todas as rotas de API nao-publicas
feat(checklist): formulario expandido e persistencia dos 145 campos
refactor(seg): mover credenciais do Telegram para variaveis de ambiente
```

Um commit por mudança logicamente coesa. Descrição em minúsculas, sem ponto final.

## Abrindo um Pull Request

1. Fork ou branch a partir de `main`.
2. Nomeie a branch pelo que ela faz (`fix/`, `feat/`, `docs/` como prefixo é bem-vindo, mas não obrigatório).
3. Um PR por mudança — evite misturar refactor com feature nova.
4. Descreva no corpo do PR: o que mudou, por quê, e como você testou (lint/build + validação manual).
5. Se a mudança alterar `prisma/schema.prisma`, mencione isso explicitamente no PR — quem revisar vai querer conferir a migration.

## O que NÃO enviar em um commit ou PR

- **Segredo de qualquer tipo**: chave de API (OpenAI, Gemini), token de bot (Telegram), senha, certificado/chave privada TLS. Se você precisar de uma variável de ambiente nova, adicione-a com um placeholder em `.env.example` — nunca com o valor real.
- **PII de cliente**: fotos de documentos, laudos em PDF com dados reais, uploads de usuário. Esses caminhos já estão no `.gitignore` (`public/uploads/`, `data/`) — não force o `git add` sobre eles.
- **Artefatos de build**: `.next/`, `node_modules/`, `*.db` (exceto migrations, que são SQL versionado de propósito).
- **Arquivos de configuração local do seu editor/IDE** fora do que já está no `.gitignore`.

Se você notar segredo ou PII já commitado no histórico, **não abra um PR removendo o arquivo** (isso não limpa o histórico) — reporte de forma privada seguindo [`SECURITY.md`](SECURITY.md).
