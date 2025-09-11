# Documentação de Manutenção e Troubleshooting - Easy Laudos

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Manutenção Preventiva](#manutenção-preventiva)
3. [Manutenção Corretiva](#manutenção-corretiva)
4. [Troubleshooting Comum](#troubleshooting-comum)
5. [Monitoramento do Sistema](#monitoramento-do-sistema)
6. [Backup e Recuperação](#backup-e-recuperação)
7. [Performance e Otimização](#performance-e-otimização)
8. [Logs e Debugging](#logs-e-debugging)
9. [Atualizações do Sistema](#atualizações-do-sistema)
10. [Procedimentos de Emergência](#procedimentos-de-emergência)

## 🎯 Visão Geral

Este documento fornece diretrizes completas para manutenção e resolução de problemas do sistema Easy Laudos. É destinado à equipe técnica responsável pela operação e suporte do sistema.

### Arquitetura de Manutenção

```
┌─────────────────────────────────────────────────┐
│               MONITORAMENTO                      │
│         (Logs, Métricas, Alertas)               │
├─────────────────────────────────────────────────┤
│            MANUTENÇÃO PREVENTIVA                 │
│     (Backups, Limpeza, Atualizações)           │
├─────────────────────────────────────────────────┤
│            MANUTENÇÃO CORRETIVA                  │
│      (Troubleshooting, Correções)               │
└─────────────────────────────────────────────────┘
```

## 🔧 Manutenção Preventiva

### Rotinas Diárias

#### 1. Verificação de Saúde do Sistema
```bash
# Verificar status do serviço
systemctl status easylaudos

# Verificar uso de disco
df -h

# Verificar memória
free -m

# Verificar processos
ps aux | grep node
```

#### 2. Verificação de Logs
```bash
# Logs da aplicação
tail -f /var/log/easylaudos/app.log

# Logs de erro
tail -f /var/log/easylaudos/error.log

# Logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Rotinas Semanais

#### 1. Backup do Banco de Dados
```bash
# Script de backup automático
cd /path/to/project
node migration/backup-database.js

# Backup manual
sqlite3 prisma/dev.db ".backup '/backup/easylaudos-$(date +%Y%m%d).db'"
```

#### 2. Limpeza de Arquivos Temporários
```bash
# Limpar uploads antigos (mais de 90 dias)
find public/uploads -type f -mtime +90 -delete

# Limpar logs antigos
find /var/log/easylaudos -name "*.log" -mtime +30 -delete

# Limpar PDFs temporários
find /tmp -name "laudo-*.pdf" -mtime +7 -delete
```

#### 3. Verificação de Espaço em Disco
```bash
# Verificar tamanho das pastas
du -sh public/uploads/
du -sh migration/backups/
du -sh /var/log/

# Limpar cache do npm se necessário
npm cache clean --force
```

### Rotinas Mensais

#### 1. Análise de Performance
```bash
# Gerar relatório de performance
npm run analyze

# Verificar queries lentas do banco
sqlite3 prisma/dev.db "EXPLAIN QUERY PLAN SELECT ..."
```

#### 2. Atualização de Dependências
```bash
# Verificar dependências desatualizadas
npm outdated

# Atualizar dependências seguras
npm update

# Audit de segurança
npm audit
npm audit fix
```

#### 3. Otimização do Banco de Dados
```bash
# Vacuum do SQLite
sqlite3 prisma/dev.db "VACUUM;"

# Reindexar
sqlite3 prisma/dev.db "REINDEX;"

# Analisar estatísticas
sqlite3 prisma/dev.db "ANALYZE;"
```

## 🔨 Manutenção Corretiva

### Problemas Comuns e Soluções

#### 1. Sistema não inicia

**Sintomas**: Aplicação não responde na porta 3000

**Diagnóstico**:
```bash
# Verificar se a porta está em uso
lsof -i :3000

# Verificar logs de erro
journalctl -u easylaudos -n 50

# Verificar arquivo .env
cat .env
```

**Solução**:
```bash
# Matar processo travado
kill -9 $(lsof -t -i:3000)

# Reiniciar aplicação
npm run build
npm start

# Ou com PM2
pm2 restart easylaudos
```

#### 2. Erro de conexão com banco de dados

**Sintomas**: "Error: P1001: Can't reach database server"

**Diagnóstico**:
```bash
# Verificar integridade do banco
sqlite3 prisma/dev.db "PRAGMA integrity_check;"

# Verificar permissões
ls -la prisma/dev.db

# Verificar DATABASE_URL
echo $DATABASE_URL
```

**Solução**:
```bash
# Corrigir permissões
chmod 664 prisma/dev.db
chown www-data:www-data prisma/dev.db

# Regenerar cliente Prisma
npx prisma generate

# Executar migrações pendentes
npx prisma migrate deploy
```

#### 3. Upload de arquivos não funciona

**Sintomas**: Erro ao fazer upload de imagens

**Diagnóstico**:
```bash
# Verificar permissões da pasta
ls -la public/uploads/

# Verificar espaço em disco
df -h

# Verificar limite de upload no Nginx
grep client_max_body_size /etc/nginx/nginx.conf
```

**Solução**:
```bash
# Corrigir permissões
chmod 755 public/uploads
chown -R www-data:www-data public/uploads

# Aumentar limite no Nginx
# Editar /etc/nginx/nginx.conf
client_max_body_size 10M;

# Reiniciar Nginx
systemctl restart nginx
```

## 🔍 Troubleshooting Comum

### Problemas de Autenticação

#### Token JWT Inválido

**Erro**: "Invalid token" ou "Token expired"

**Solução**:
```javascript
// Verificar configuração JWT em lib/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = '24h'; // Ajustar se necessário

// Limpar tokens do navegador (cliente)
localStorage.removeItem('token');
sessionStorage.removeItem('token');
```

#### Usuário não consegue fazer login

**Verificações**:
```bash
# Verificar usuário no banco
sqlite3 prisma/dev.db "SELECT * FROM User WHERE username='usuario';"

# Resetar senha via script
node scripts/reset-password.js usuario nova-senha

# Verificar logs de autenticação
grep "auth" /var/log/easylaudos/app.log
```

### Problemas de PDF

#### PDF não é gerado

**Diagnóstico**:
```bash
# Verificar Puppeteer
node -e "const puppeteer = require('puppeteer'); puppeteer.launch().then(b => { console.log('OK'); b.close(); });"

# Verificar dependências do Chrome
ldd $(which chrome) | grep "not found"

# Verificar memória disponível
free -m
```

**Solução**:
```bash
# Instalar dependências do Chrome
apt-get install -y \
  libnss3 \
  libatk-bridge2.0-0 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libgtk-3-0 \
  libasound2

# Aumentar limite de memória do Node
export NODE_OPTIONS="--max-old-space-size=4096"
```

### Problemas de Performance

#### Sistema lento

**Diagnóstico**:
```bash
# Monitorar CPU e memória
top -p $(pgrep -f node)

# Verificar queries lentas
sqlite3 prisma/dev.db ".timer on" "SELECT ..."

# Verificar tamanho do banco
du -h prisma/dev.db
```

**Otimizações**:
```bash
# Adicionar índices necessários
sqlite3 prisma/dev.db "CREATE INDEX idx_laudo_date ON Laudo(dataEmissao);"

# Limpar dados antigos
node scripts/cleanup-old-data.js

# Otimizar imagens
find public/uploads -name "*.jpg" -exec jpegoptim {} \;
find public/uploads -name "*.png" -exec optipng {} \;
```

## 📊 Monitoramento do Sistema

### Métricas Essenciais

#### 1. Configurar Monitoramento
```bash
# Instalar PM2 para monitoramento
npm install -g pm2

# Iniciar aplicação com PM2
pm2 start npm --name "easylaudos" -- start

# Ativar monitoramento
pm2 monitor
```

#### 2. Métricas a Acompanhar

| Métrica | Valor Ideal | Alerta |
|---------|------------|--------|
| CPU Usage | < 70% | > 80% |
| Memory Usage | < 80% | > 90% |
| Response Time | < 200ms | > 500ms |
| Error Rate | < 1% | > 5% |
| Disk Usage | < 80% | > 90% |

#### 3. Scripts de Monitoramento
```bash
# health-check.sh
#!/bin/bash
curl -f http://localhost:3000/api/health || exit 1
```

### Alertas Automatizados

```javascript
// monitoring/alerts.js
const checkHealth = async () => {
  const diskUsage = await getDiskUsage();
  if (diskUsage > 90) {
    sendAlert('Disk usage critical: ' + diskUsage + '%');
  }
  
  const memoryUsage = await getMemoryUsage();
  if (memoryUsage > 90) {
    sendAlert('Memory usage critical: ' + memoryUsage + '%');
  }
};

setInterval(checkHealth, 60000); // A cada minuto
```

## 💾 Backup e Recuperação

### Estratégia de Backup

#### Backup Automático
```bash
# backup.sh
#!/bin/bash
BACKUP_DIR="/backup/easylaudos"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup do banco
sqlite3 prisma/dev.db ".backup '${BACKUP_DIR}/db_${DATE}.db'"

# Backup de uploads
tar -czf ${BACKUP_DIR}/uploads_${DATE}.tar.gz public/uploads/

# Backup de configurações
cp .env ${BACKUP_DIR}/env_${DATE}
cp -r ssl/ ${BACKUP_DIR}/ssl_${DATE}/

# Manter apenas últimos 30 dias
find ${BACKUP_DIR} -mtime +30 -delete
```

#### Configurar Cron
```bash
# Adicionar ao crontab
0 2 * * * /path/to/backup.sh
```

### Procedimento de Recuperação

#### 1. Restaurar Banco de Dados
```bash
# Parar aplicação
pm2 stop easylaudos

# Restaurar banco
cp /backup/easylaudos/db_20250901.db prisma/dev.db

# Verificar integridade
sqlite3 prisma/dev.db "PRAGMA integrity_check;"

# Reiniciar aplicação
pm2 start easylaudos
```

#### 2. Restaurar Uploads
```bash
# Extrair backup
tar -xzf /backup/easylaudos/uploads_20250901.tar.gz -C /

# Verificar permissões
chown -R www-data:www-data public/uploads
```

## ⚡ Performance e Otimização

### Otimizações de Código

#### 1. Lazy Loading
```javascript
// Implementar lazy loading para componentes pesados
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

#### 2. Caching
```javascript
// Implementar cache Redis para queries frequentes
const redis = require('redis');
const client = redis.createClient();

async function getCachedData(key) {
  const cached = await client.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetchFromDB();
  await client.setex(key, 3600, JSON.stringify(data));
  return data;
}
```

### Otimizações de Banco de Dados

#### 1. Índices Recomendados
```sql
-- Índices essenciais
CREATE INDEX idx_laudo_cliente ON Laudo(clientId);
CREATE INDEX idx_laudo_veiculo ON Laudo(vehicleId);
CREATE INDEX idx_laudo_tipo ON Laudo(laudoType);
CREATE INDEX idx_laudo_data ON Laudo(dataEmissao);
CREATE INDEX idx_vehicle_placa ON Vehicle(placa);
CREATE INDEX idx_client_cnpj ON Client(cnpj);
```

#### 2. Queries Otimizadas
```javascript
// Usar select específico ao invés de select *
const laudos = await prisma.laudo.findMany({
  select: {
    id: true,
    ordemServico: true,
    dataEmissao: true,
    client: {
      select: {
        name: true
      }
    }
  },
  take: 10 // Limitar resultados
});
```

## 📝 Logs e Debugging

### Configuração de Logs

#### 1. Estrutura de Logs
```javascript
// lib/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
```

#### 2. Análise de Logs
```bash
# Buscar erros específicos
grep -i error /var/log/easylaudos/*.log

# Contar ocorrências
grep "Error:" app.log | wc -l

# Logs em tempo real
tail -f app.log | grep --line-buffered ERROR
```

### Debug Mode

#### Ativar Debug
```bash
# Desenvolvimento
export DEBUG=easylaudos:*
npm run dev

# Produção temporário
export NODE_ENV=development
export DEBUG=easylaudos:*
node server.js
```

## 🔄 Atualizações do Sistema

### Processo de Atualização

#### 1. Preparação
```bash
# Backup completo
./backup.sh

# Verificar mudanças
git status
git diff

# Baixar atualizações
git pull origin main
```

#### 2. Atualização de Dependências
```bash
# Instalar novas dependências
npm install

# Atualizar banco de dados
npx prisma migrate deploy

# Rebuild da aplicação
npm run build
```

#### 3. Deploy
```bash
# Modo manutenção
echo "Sistema em manutenção" > public/maintenance.html

# Parar aplicação
pm2 stop easylaudos

# Atualizar
npm run build

# Reiniciar
pm2 start easylaudos

# Remover modo manutenção
rm public/maintenance.html
```

### Rollback

```bash
# Em caso de problemas
git reset --hard HEAD^
npm install
npm run build
pm2 restart easylaudos
```

## 🚨 Procedimentos de Emergência

### Sistema Fora do Ar

#### Ação Imediata:
1. Verificar status dos serviços
2. Analisar logs de erro
3. Reiniciar serviços se necessário
4. Ativar página de manutenção

```bash
# Script de emergência
#!/bin/bash
systemctl status easylaudos || systemctl restart easylaudos
systemctl status nginx || systemctl restart nginx
curl -f http://localhost:3000/api/health || echo "ALERTA: Sistema fora do ar!"
```

### Corrupção de Dados

#### Recuperação:
```bash
# Verificar integridade
sqlite3 prisma/dev.db "PRAGMA integrity_check;"

# Se corrompido, restaurar último backup
cp /backup/easylaudos/db_latest.db prisma/dev.db

# Verificar dados
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Laudo;"
```

### Ataque de Segurança

#### Resposta:
1. Isolar sistema
2. Analisar logs
3. Bloquear IPs suspeitos
4. Resetar senhas
5. Aplicar patches de segurança

```bash
# Bloquear IP
iptables -A INPUT -s IP_SUSPEITO -j DROP

# Analisar acessos
grep "401\|403" /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c

# Forçar reset de senhas
node scripts/force-password-reset.js
```

## 📞 Contatos de Emergência

### Equipe de Suporte

| Função | Contato | Horário |
|--------|---------|---------|
| Suporte N1 | suporte@easylaudos.com | 24/7 |
| Desenvolvedor | dev@easylaudos.com | Comercial |
| Infraestrutura | infra@easylaudos.com | 24/7 |
| Gerência | gerencia@easylaudos.com | Comercial |

### Escalonamento

1. **Nível 1**: Problemas operacionais simples (15 min)
2. **Nível 2**: Problemas técnicos complexos (30 min)
3. **Nível 3**: Falhas críticas do sistema (imediato)

---

**Documento atualizado em**: Setembro 2025  
**Versão**: 1.0.0  
**Mantido por**: Equipe Técnica Easy Laudos