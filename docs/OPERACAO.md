# Operação — Deploy, Manutenção e Suporte

> Conteúdo operacional movido do `README.md` (card OSS-3) para manter o README enxuto para quem está conhecendo o projeto. Este documento assume um ambiente de produção próprio (VPS, servidor dedicado, etc.) e cobre deploy, manutenção de rotina e troubleshooting.
>
> Alguns passos abaixo foram escritos originalmente para a instalação do mantenedor (serviço Windows via NSSM na porta `:3006`, túnel Cloudflare, Orquestrador interno na porta `:9000`, caminhos `D:\...`). Esses pontos estão marcados como **[específico da instalação do mantenedor]** — a alternativa genérica está descrita ao lado. Se você está rodando o projeto na sua própria infraestrutura, use a alternativa genérica.

---

## Deploy em Produção (Linux/Ubuntu)

```bash
# 1. Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clonar o projeto
git clone https://github.com/MarcosRippel/general-laudos.git
cd general-laudos

# 3. Instalar dependências
npm install --production

# 4. Configurar .env para produção
cp .env.example .env
nano .env
# DATABASE_URL="file:/caminho/absoluto/production.db"

# 5. Executar migrations
npx prisma migrate deploy
npx prisma generate

# 6. Build da aplicação
npm run build

# 7. Iniciar com PM2 (gerenciador de processos)
sudo npm install -g pm2
pm2 start npm --name "easy-laudos" -- start
pm2 save
pm2 startup
```

> **[específico da instalação do mantenedor]** Na instalação de referência, o processo acima é substituído por um serviço Windows registrado via NSSM na porta `:3006`, supervisionado por um "Orquestrador" interno (API HTTP na porta `:9000`) que sabe como parar/subir o serviço e checar sua saúde. Isso é infraestrutura interna do mantenedor, não faz parte deste repositório — a alternativa genérica para qualquer outra instalação é PM2 (acima) ou o container Docker (abaixo).

## Deploy com Docker

```bash
# Build da imagem
docker build -t easy-laudos:latest .

# Executar container
docker run -d \
  --name easy-laudos \
  -p 3006:3006 \
  -v $(pwd)/.env:/app/.env \
  -v $(pwd)/production.db:/app/production.db \
  -v $(pwd)/uploads:/app/uploads \
  easy-laudos:latest
```

O repositório também inclui um `docker-compose.yml` com Nginx como proxy reverso na frente do app — veja `docker-compose.yml` e `nginx.conf` na raiz.

## Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name laudos.seudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

> **[específico da instalação do mantenedor]** A instalação de referência expõe o app publicamente via **Cloudflare Tunnel** (Cloudflared) em vez de abrir a porta diretamente com Nginx + Certbot. Isso evita expor IP/porta do servidor. A alternativa genérica — sem depender de Cloudflare — é Nginx + Certbot (abaixo) ou qualquer outro proxy reverso com TLS.

## SSL com Certbot (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d laudos.seudominio.com
```

Para HTTPS local de desenvolvimento (sem domínio público), o repositório inclui scripts para gerar certificado autoassinado — ver `create-ssl-for-ip.js` e o script `npm run start:https`.

---

## Manutenção

### Backup do Banco de Dados

```bash
# Backup manual
cp production.db backups/production_$(date +%Y%m%d).db

# Backup automatizado (cron)
0 2 * * * cp /caminho/para/general-laudos/production.db /backups/easy-laudos_$(date +\%Y\%m\%d).db
```

### Verificação de Integridade

```bash
# Explorar o banco visualmente
npx prisma studio

# Executar migrations pendentes
npx prisma migrate deploy

# Regenerar cliente Prisma
npx prisma generate
```

### Atualização do Sistema

```bash
# 1. Fazer backup
cp production.db backups/pre-update_$(date +%Y%m%d).db

# 2. Atualizar código
git pull origin main

# 3. Atualizar dependências
npm install

# 4. Rebuild
npm run build

# 5. Reiniciar
pm2 restart easy-laudos
```

### Logs e Debugging

```bash
# Ver logs do PM2
pm2 logs easy-laudos

# Ver logs em tempo real
pm2 logs easy-laudos --lines 100

# Monitorar recursos
pm2 monit
```

### Limpeza de Arquivos Temporários

```bash
# Limpar cache do Next.js
rm -rf .next/cache

# Limpar uploads antigos (mais de 90 dias)
find public/uploads -type f -mtime +90 -delete
```

---

## Solução de Problemas Comuns

#### Erro: "Cannot find module 'prisma/client'"
```bash
npx prisma generate
```

#### Erro: "Port 3006 already in use"
```bash
# Usar porta alternativa
PORT=3001 npm run dev

# Ou matar processo na porta 3006
# Windows:
netstat -ano | findstr :3006
taskkill /PID <PID> /F

# Linux:
lsof -ti:3006 | xargs kill -9
```

#### Erro: "Database is locked"
```bash
# Fechar Prisma Studio e outras conexões, depois:
npm run build
npm run start
```

#### PDFs não estão sendo gerados
```bash
# Verificar permissões da pasta uploads
chmod -R 755 public/uploads/

# Reinstalar dependências de PDF/Puppeteer
npm install pdf-lib puppeteer --force
```

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

---

## Documentação técnica adicional

- [`API-REFERENCE.md`](../API-REFERENCE.md) — Referência completa da API REST
- [`DATABASE-SCHEMA.md`](../DATABASE-SCHEMA.md) — Esquema do banco de dados
- [`DOCUMENTACAO-ARQUITETURA.md`](../DOCUMENTACAO-ARQUITETURA.md) — Arquitetura detalhada
- [`INSTALACAO-CONFIGURACAO.md`](../INSTALACAO-CONFIGURACAO.md) — Guia de instalação de referência do mantenedor (contém passos específicos da instalação original — ver ressalva no topo deste documento)
- [`docs/00_INDICE.md`](00_INDICE.md) — Índice da documentação técnica interna
