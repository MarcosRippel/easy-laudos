# 🔄 ATUALIZARSISTEMA.md — Emissor de Laudos (Inspetor)

> Guia completo para entender a infraestrutura e atualizar o sistema em produção sem perder dados.

---

## 🏗️ Arquitetura de Deploy

### Diretórios importantes

| Caminho | Função |
|---------|--------|
| `D:\General Truck System\CLOUDFLARED\` | Raiz do projeto — contém o `docker-compose.yml` principal |
| `D:\General Truck System\CLOUDFLARED\5. Emissor de Laudos - Inspetor\` | **Código de PRODUÇÃO** — é daqui que o Docker builda |
| `D:\General Truck System\CLOUDFLARED\2 General Emissor de Laudos\Emissor de Laudos - Inspetor\` | Código de DESENVOLVIMENTO — NÃO vai para o Docker |

> ⚠️ **IMPORTANTE**: O `docker-compose.yml` na raiz aponta para a pasta `5.`, NÃO para a `2 General`. Se fizer alterações na pasta `2`, elas NÃO irão para produção. Sempre altere na pasta `5.` para deploy.

### Arquivos de infraestrutura

| Arquivo | Localização | Função |
|---------|-------------|--------|
| `docker-compose.yml` | `CLOUDFLARED\docker-compose.yml` | Define serviços `inspetor` (porta 3006) e `sassmaq` (porta 5555) |
| `Dockerfile` | `5. Emissor de Laudos - Inspetor\Dockerfile` | Build: node:22-slim + Chromium + npm ci + prisma generate + next build |
| `.dockerignore` | `5. Emissor de Laudos - Inspetor\.dockerignore` | Exclui node_modules, .next, dev.db do build (~10MB vs ~1GB) |
| `.env.docker` | `CLOUDFLARED\.env.docker` | Variáveis de ambiente compartilhadas |
| `dev.db` | `5. Emissor de Laudos - Inspetor\prisma\dev.db` | Banco SQLite — montado como volume, PERSISTE entre rebuilds |

### Fluxo de rede

```
inspetor.generaltms.com
  → Cloudflare Tunnel (cloudflared.exe no Windows, NÃO em Docker)
    → localhost:3006
      → container "inspetor" (Next.js 15.3.3)
        → /app/prisma/dev.db (volume do host)
```

---

## ⚡ Atualização Rápida (recomendado)

```bash
cd "D:\General Truck System\CLOUDFLARED"
docker-compose up -d --build inspetor
```

Isso faz:
- Rebuild da imagem Next.js com o código atualizado
- Restart do container na porta 3006
- **Banco de dados (dev.db) preservado** — montado como volume do host

---

## 🔨 Atualização Forçada (se o cache não pegar as mudanças)

```bash
cd "D:\General Truck System\CLOUDFLARED"
docker-compose build --no-cache inspetor
docker-compose up -d inspetor
```

⏱️ Demora ~3-5 minutos (rebuild completo).

---

## 📦 O que PERSISTE entre atualizações

| Item | Persiste? | Motivo |
|------|-----------|--------|
| **Banco de dados** (prisma/dev.db) | ✅ Sim | Montado como volume do host |
| **Uploads** (public/uploads/) | ✅ Sim | Volume Docker `inspetor-uploads` |
| **Sessões/Cookies** | ❌ Não | Cookie `gts_session` (8h TTL) é resetado no restart |
| **Código/Build** | ❌ Recriado | Rebuild da imagem Next.js |
| **node_modules** | ❌ Recriado | `npm ci` roda no build |

---

## 🔍 Comandos Úteis

| Ação | Comando |
|------|---------|
| Ver status | `docker ps` |
| Ver logs ao vivo | `docker logs -f inspetor` |
| Últimos 50 logs | `docker logs --tail 50 inspetor` |
| Parar container | `docker-compose stop inspetor` |
| Remover e recriar | `docker-compose up -d --force-recreate inspetor` |
| Entrar no container | `docker exec -it inspetor sh` |
| Backup do banco | `copy "5. Emissor de Laudos - Inspetor\prisma\dev.db" "dev.db.backup"` |

---

## ⚠️ Antes de Atualizar

1. **Faça backup do banco**: `copy "5. Emissor de Laudos - Inspetor\prisma\dev.db" "dev.db.backup"`
2. **Se mexer no schema.prisma**: rode `npx prisma migrate dev` ANTES do rebuild
3. **Se adicionar dependências**: o `npm ci` roda automaticamente no build

---

## 🐛 Troubleshooting

| Problema | Causa provável | Solução |
|----------|----------------|---------|
| Container não aparece no `docker ps` | Crashou no start | `docker logs inspetor` para ver o erro |
| Porta 3006 "address already in use" | Processo local usando a porta | `netstat -ano \| findstr "3006"` → matar o PID |
| Mudanças não refletem | Build cacheado | `docker-compose build --no-cache inspetor` |
| Banco vazio após rebuild | Volume não montado | Verificar `docker-compose.yml` tem o volume `dev.db` |
| PowerShell mostra "Exit code: 1" | Falso positivo do docker-compose no PS | Verificar `docker ps` — se diz "Up (healthy)", está OK |
| Site não abre no domínio | Cloudflare Tunnel parado | Reiniciar o Orquestrador (`INICIAR_ORQUESTRADOR.bat`) |
