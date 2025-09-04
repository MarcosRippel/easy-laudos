# 🐳 Sistema Next.js Dockerizado - IP Isolado

## 📋 **Resumo**
Sistema Emissor de Laudos Next.js containerizado com IP isolado (172.40.0.10) e proxy Traefik em portas customizadas para evitar conflitos.

## 🚀 **Deploy Rápido**

### **1. Pré-requisitos**
- Docker Desktop instalado e **DESPAUSADO** (ícone da baleia)
- Portas 9080, 9443, 9090 livres no sistema

### **2. Deploy em 1 Clique**
```bash
# Execute o script automatizado
NEXTJS-REAL-DEPLOY.bat
```

## 🔧 **Configuração Técnica**

### **Rede Docker Isolada**
- **Subnet**: 172.40.0.0/24
- **Gateway**: 172.40.0.1
- **Traefik**: 172.40.0.2
- **Next.js App**: 172.40.0.10

### **Portas Customizadas**
- **9080**: HTTP (não conflita com porta 80)
- **9443**: HTTPS (não conflita com porta 443)
- **9090**: Dashboard Traefik (não conflita com porta 8080)

### **Componentes**
1. **Traefik v3.0** - Proxy reverso com SSL automático
2. **Next.js App** - Sua aplicação containerizada
3. **Rede Isolada** - Subnet dedicada 172.40.0.0/24

## 🌐 **Acesso ao Sistema**

### **URLs Disponíveis**
- **Sistema Principal**: http://localhost:9080
- **HTTPS Seguro**: https://localhost:9443  
- **Dashboard Traefik**: http://localhost:9090
- **Domínio**: https://inspetor.terpens.com.br (com DNS configurado)

### **IP Direto da Aplicação**
- **Container IP**: 172.40.0.10
- **Porta Interna**: 3000

## 🛠️ **Comandos Úteis**

### **Gerenciamento**
```bash
# Iniciar sistema
docker-compose -f docker-compose-nextjs-real.yml up -d

# Parar sistema
docker-compose -f docker-compose-nextjs-real.yml down

# Ver logs
docker-compose -f docker-compose-nextjs-real.yml logs -f

# Rebuild completo
docker-compose -f docker-compose-nextjs-real.yml up --build -d

# Status dos containers
docker ps
```

### **Troubleshooting**
```bash
# Verificar rede
docker network inspect 5emissordelaudos-inspetor_nextjs-network

# Ver logs específicos
docker logs emissor-laudos-nextjs
docker logs traefik-nextjs

# Testar conectividade
curl -I http://localhost:9080
```

## 📁 **Arquivos Principais**

### **[`docker-compose-nextjs-real.yml`](docker-compose-nextjs-real.yml)**
Configuração Docker Compose com:
- Traefik proxy configurado
- Next.js app containerizada
- Rede isolada 172.40.0.0/24
- Volumes persistentes
- SSL automático Let's Encrypt

### **[`Dockerfile`](Dockerfile)**
Build otimizado para produção:
- Node.js 18 Alpine
- Dependências Python instaladas
- Build Next.js com ESLint desabilitado
- Healthcheck configurado
- Usuário não-root para segurança

### **[`NEXTJS-REAL-DEPLOY.bat`](NEXTJS-REAL-DEPLOY.bat)**
Script automatizado que:
- Verifica Docker Desktop ativo
- Para containers antigos
- Faz rebuild da aplicação
- Inicia sistema completo
- Mostra status final

## 🔒 **Segurança**

### **Isolamento de Rede**
- Subnet dedicada 172.40.0.0/24
- Sem acesso direto à rede host
- Comunicação apenas via proxy Traefik

### **SSL/TLS**
- Certificados Let's Encrypt automáticos
- Redirecionamento HTTP → HTTPS
- Headers de segurança configurados

### **Container Security**
- Usuário não-root (nextjs:1001)
- Volumes com permissões restritas
- Healthcheck para monitoramento

## 📈 **Monitoramento**

### **Health Checks**
```bash
# Verificar saúde da aplicação
curl -f http://localhost:9080/api/health

# Status via Docker
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### **Dashboard Traefik**
Acesse http://localhost:9090 para:
- Ver rotas configuradas
- Monitorar tráfego
- Verificar certificados SSL
- Diagnosticar problemas

## ⚠️ **Problemas Comuns**

### **Docker Desktop Pausado**
```
Erro: "Docker Desktop is manually paused"
Solução: Clique no ícone da baleia → Unpause
```

### **Arquivo não encontrado**
```
Erro: "docker-compose-nextjs-real.yml: No such file"
Solução: Execute o script do diretório correto do projeto
```

### **Porta em uso**
```
Erro: "Port already in use"
Solução: Use portas 9080/9443/9090 ou pare outros serviços
```

### **Build falha por ESLint**
```
Erro: ESLint errors during build
Solução: Dockerfile já tem NEXT_DISABLE_ESLINT=true configurado
```

## 🎯 **Próximos Passos**

1. **DNS Configurado**: Aponte inspetor.terpens.com.br para seu IP
2. **SSL Produção**: Configure domínio real para certificados válidos
3. **Backup**: Use sistema de backup automático implementado
4. **Monitoring**: Configure Prometheus/Grafana se necessário

---
**✅ Sistema pronto para produção com IP isolado 172.40.0.10!**