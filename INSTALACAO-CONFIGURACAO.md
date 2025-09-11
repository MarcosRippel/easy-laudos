# 📦 Guia de Instalação e Configuração - Easy Laudos

## Índice
1. [Requisitos do Sistema](#requisitos-do-sistema)
2. [Instalação Passo a Passo](#instalação-passo-a-passo)
3. [Configuração do Ambiente](#configuração-do-ambiente)
4. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
5. [Configuração de Segurança](#configuração-de-segurança)
6. [Deploy em Produção](#deploy-em-produção)
7. [Docker e Containerização](#docker-e-containerização)
8. [Configuração de SSL/TLS](#configuração-de-ssltls)
9. [Backup e Restore](#backup-e-restore)
10. [Verificação da Instalação](#verificação-da-instalação)

---

## 📋 Requisitos do Sistema

### Hardware Mínimo
- **CPU**: 2 cores x86_64
- **RAM**: 4GB (8GB recomendado)
- **Armazenamento**: 20GB livres (SSD recomendado)
- **Rede**: Conexão estável com internet

### Software Necessário
- **Sistema Operacional**: Windows 10+, Ubuntu 20.04+, macOS 11+
- **Node.js**: v20.0.0 ou superior
- **npm**: v10.0.0 ou superior
- **Git**: v2.30.0 ou superior
- **SQLite**: v3.35.0 ou superior

### Dependências Opcionais
- **Docker**: v20.10.0+ (para containerização)
- **Nginx**: v1.18.0+ (para proxy reverso)
- **PM2**: v5.0.0+ (para gerenciamento de processos)

---

## 🚀 Instalação Passo a Passo

### 1. Clonar o Repositório
```bash
# Via HTTPS
git clone https://github.com/seu-usuario/easy-laudos.git

# Via SSH
git clone git@github.com:seu-usuario/easy-laudos.git

# Entrar no diretório
cd easy-laudos
```

### 2. Instalar Node.js e npm
```bash
# Windows - Baixar instalador de https://nodejs.org

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS com Homebrew
brew install node

# Verificar instalação
node --version  # Deve mostrar v20.x.x
npm --version   # Deve mostrar v10.x.x
```

### 3. Instalar Dependências do Projeto
```bash
# Instalar todas as dependências
npm install

# Ou com yarn
yarn install

# Instalar dependências de desenvolvimento
npm install --save-dev
```

### 4. Configurar Prisma e Banco de Dados
```bash
# Gerar cliente Prisma
npx prisma generate

# Criar banco de dados e executar migrations
npx prisma migrate deploy

# Seed inicial do banco (opcional)
npx prisma db seed
```

---

## ⚙️ Configuração do Ambiente

### 1. Criar Arquivo .env
```bash
# Copiar template de exemplo
cp .env.example .env

# Ou criar manualmente
touch .env
```

### 2. Variáveis de Ambiente Essenciais
```env
# Configurações do Aplicativo
NODE_ENV=development
PORT=3000
HOST=localhost

# Banco de Dados
DATABASE_URL="file:./dev.db"
DATABASE_LOG_LEVEL=warn

# Segurança
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_com_32_caracteres_min
SESSION_SECRET=sua_session_secret_super_segura_aqui_32_chars
ENCRYPTION_KEY=sua_chave_de_criptografia_32_caracteres

# API Keys
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_nextauth_secret_aqui

# Configurações de Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=.pdf,.jpg,.jpeg,.png

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app

# Configurações de PDF
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PDF_TIMEOUT=30000

# OCR
TESSERACT_LANG=por
TESSERACT_PATH=/usr/bin/tesseract

# Logs
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=10M
LOG_MAX_FILES=5

# Performance
ENABLE_CACHE=true
CACHE_TTL=3600
MAX_CONNECTIONS=100
```

### 3. Configuração para Diferentes Ambientes

#### Development (.env.development)
```env
NODE_ENV=development
DATABASE_URL="file:./dev.db"
DEBUG=true
LOG_LEVEL=debug
```

#### Production (.env.production)
```env
NODE_ENV=production
DATABASE_URL="file:./prod.db"
DEBUG=false
LOG_LEVEL=error
ENABLE_COMPRESSION=true
```

#### Testing (.env.test)
```env
NODE_ENV=test
DATABASE_URL="file:./test.db"
LOG_LEVEL=silent
```

---

## 🗄️ Configuração do Banco de Dados

### 1. SQLite (Padrão)
```bash
# Criar banco de dados
npx prisma migrate dev --name init

# Verificar status das migrations
npx prisma migrate status

# Reset do banco (CUIDADO: apaga todos os dados)
npx prisma migrate reset
```

### 2. Migração para PostgreSQL (Opcional)
```env
# Alterar DATABASE_URL no .env
DATABASE_URL="postgresql://user:password@localhost:5432/easylaudos"
```

```bash
# Atualizar schema.prisma
# Alterar provider de "sqlite" para "postgresql"

# Executar migrations
npx prisma migrate dev
```

### 3. Backup Automático
```bash
# Criar script de backup
mkdir -p scripts
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups"
DB_FILE="./prisma/dev.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_FILE "$BACKUP_DIR/backup_$TIMESTAMP.db"

# Manter apenas últimos 7 backups
ls -t $BACKUP_DIR/backup_*.db | tail -n +8 | xargs -r rm
EOF

chmod +x scripts/backup.sh

# Adicionar ao crontab para backup diário
(crontab -l 2>/dev/null; echo "0 2 * * * cd /path/to/easy-laudos && ./scripts/backup.sh") | crontab -
```

---

## 🔒 Configuração de Segurança

### 1. Gerar Secrets Seguros
```bash
# Gerar JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Gerar Session Secret
openssl rand -base64 32

# Gerar Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Configurar CORS
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGINS || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

### 3. Configurar Rate Limiting
```bash
# Instalar dependência
npm install express-rate-limit

# Adicionar ao .env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🚢 Deploy em Produção

### 1. Build da Aplicação
```bash
# Build do Next.js
npm run build

# Verificar build
npm run start
```

### 2. PM2 para Gerenciamento de Processos
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Criar configuração PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'easy-laudos',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    autorestart: true,
    max_restarts: 10
  }]
}
EOF

# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar startup
pm2 startup
```

### 3. Nginx como Proxy Reverso
```nginx
# /etc/nginx/sites-available/easy-laudos
server {
    listen 80;
    server_name seu-dominio.com.br;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com.br;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logs
    access_log /var/log/nginx/easy-laudos-access.log;
    error_log /var/log/nginx/easy-laudos-error.log;

    # Proxy Configuration
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    # Upload size
    client_max_body_size 10M;
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/easy-laudos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🐳 Docker e Containerização

### 1. Dockerfile
```dockerfile
# Dockerfile já existe no projeto
# Build da imagem
docker build -t easy-laudos:latest .

# Tag para registry
docker tag easy-laudos:latest seu-registry/easy-laudos:latest
```

### 2. Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/prod.db
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
```

```bash
# Iniciar com Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

---

## 🔐 Configuração de SSL/TLS

### 1. Let's Encrypt com Certbot
```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com.br

# Auto-renovação
sudo certbot renew --dry-run

# Adicionar ao crontab
(crontab -l 2>/dev/null; echo "0 0,12 * * * /usr/bin/certbot renew --quiet") | crontab -
```

### 2. Certificado Auto-assinado (Desenvolvimento)
```bash
# Gerar certificado
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./ssl/private.key \
  -out ./ssl/certificate.crt \
  -subj "/C=BR/ST=SP/L=Sao Paulo/O=Easy Laudos/CN=localhost"
```

---

## 💾 Backup e Restore

### 1. Backup Manual
```bash
# Backup completo
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  prisma/dev.db \
  uploads/ \
  .env \
  logs/

# Backup apenas banco
sqlite3 prisma/dev.db ".backup backup_$(date +%Y%m%d).db"
```

### 2. Restore
```bash
# Restore completo
tar -xzf backup_20240101_120000.tar.gz

# Restore apenas banco
sqlite3 prisma/dev.db ".restore backup_20240101.db"

# Regenerar Prisma Client
npx prisma generate
```

### 3. Backup Automático para Cloud
```bash
# Script para backup no S3
cat > scripts/cloud-backup.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$TIMESTAMP.tar.gz"

# Criar backup
tar -czf /tmp/$BACKUP_FILE prisma/dev.db uploads/

# Upload para S3
aws s3 cp /tmp/$BACKUP_FILE s3://seu-bucket/backups/

# Limpar arquivo local
rm /tmp/$BACKUP_FILE

# Manter apenas últimos 30 backups no S3
aws s3 ls s3://seu-bucket/backups/ | \
  sort -r | \
  tail -n +31 | \
  awk '{print $4}' | \
  xargs -I {} aws s3 rm s3://seu-bucket/backups/{}
EOF

chmod +x scripts/cloud-backup.sh
```

---

## ✅ Verificação da Instalação

### 1. Health Check
```bash
# Verificar se a aplicação está rodando
curl http://localhost:3000/api/health

# Resposta esperada
# {"status":"ok","timestamp":"2024-01-01T12:00:00.000Z"}
```

### 2. Verificar Dependências
```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar Prisma
npx prisma --version

# Verificar banco de dados
npx prisma db push --dry-run
```

### 3. Testes de Sistema
```bash
# Executar testes
npm test

# Verificar build
npm run build

# Verificar TypeScript
npm run type-check

# Verificar linting
npm run lint
```

### 4. Checklist de Verificação
- [ ] Node.js instalado e na versão correta
- [ ] Todas as dependências instaladas sem erros
- [ ] Arquivo .env configurado corretamente
- [ ] Banco de dados criado e migrations executadas
- [ ] Aplicação iniciando sem erros
- [ ] API respondendo corretamente
- [ ] Upload de arquivos funcionando
- [ ] Geração de PDFs funcionando
- [ ] Autenticação funcionando
- [ ] Logs sendo gerados corretamente

---

## 🆘 Troubleshooting Comum

### Problema: "Cannot find module"
```bash
# Solução
rm -rf node_modules package-lock.json
npm install
```

### Problema: "Database is locked"
```bash
# Solução
# Parar todos os processos Node.js
pkill -f node

# Reiniciar aplicação
npm run dev
```

### Problema: "EADDRINUSE: Port 3000 already in use"
```bash
# Solução
# Encontrar processo usando a porta
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou usar outra porta
PORT=3001 npm run dev
```

### Problema: "Prisma Client not generated"
```bash
# Solução
npx prisma generate
npm run build
```

---

## 📞 Suporte

Para problemas de instalação ou configuração:
1. Consulte a documentação completa em `/docs`
2. Verifique os logs em `/logs`
3. Consulte o arquivo `MANUTENCAO-SISTEMA.md`
4. Entre em contato com o suporte técnico

---

*Última atualização: Janeiro 2024*
*Versão do documento: 1.0.0*