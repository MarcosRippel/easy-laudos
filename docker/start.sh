#!/bin/bash
set -e

# Script de inicialização do Container - Sistema Emissor de Laudos
# IP Virtual: 172.20.0.10

echo "🐳 INICIANDO CONTAINER - SISTEMA EMISSOR DE LAUDOS"
echo "=================================================="

# Definir variáveis do container
export CONTAINER_IP="172.20.0.10"
export NODE_ENV="production"
export PORT="3000"
export DATABASE_URL="file:./prisma/dev.db"

# Função de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Função para verificar serviços
check_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    
    log "Verificando $service na porta $port..."
    
    for i in $(seq 1 $max_attempts); do
        if nc -z localhost $port 2>/dev/null; then
            log "✅ $service está respondendo"
            return 0
        fi
        log "⏳ Aguardando $service... ($i/$max_attempts)"
        sleep 2
    done
    
    log "❌ $service não respondeu em tempo hábil"
    return 1
}

# Criar diretórios necessários
log "Criando diretórios do container..."
mkdir -p /app/logs /app/backups /var/log/nginx /var/lib/nginx

# Ajustar permissões
log "Ajustando permissões..."
chown -R nextjs:nodejs /app/logs /app/backups
chown -R nginx:nginx /var/log/nginx /var/lib/nginx

# Verificar arquivos essenciais
log "Verificando arquivos essenciais..."

if [ ! -f "/app/prisma/dev.db" ]; then
    log "⚠️  Banco de dados não encontrado, criando..."
    cd /app
    npx prisma generate
    npx prisma db push
    log "✅ Banco de dados criado"
fi

if [ ! -f "/app/ssl/inspetor.terpens.com.br.crt" ]; then
    log "❌ Certificados SSL não encontrados em /app/ssl/"
    log "❌ Monte o volume SSL corretamente: -v ./ssl:/app/ssl:ro"
    exit 1
fi

# Verificar build do Next.js
log "Verificando build do Next.js..."
if [ ! -d "/app/.next" ]; then
    log "⚠️  Build não encontrado, executando npm run build..."
    cd /app
    npm run build
    log "✅ Build concluído"
fi

# Iniciar nginx em background
log "Iniciando nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Aguardar nginx estar pronto
sleep 2
if ! kill -0 $NGINX_PID 2>/dev/null; then
    log "❌ Falha ao iniciar nginx"
    exit 1
fi
log "✅ Nginx iniciado (PID: $NGINX_PID)"

# Aguardar nginx responder
check_service "nginx HTTP" 80
check_service "nginx HTTPS" 443

# Executar como usuário nextjs a partir daqui
log "Alterando para usuário nextjs..."

# Criar script temporário para executar como nextjs
cat > /tmp/start_nextjs.sh << 'EOF'
#!/bin/bash
set -e

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

cd /app

# Aguardar um pouco para nginx estar totalmente pronto
sleep 3

log "🚀 Iniciando launcher do container..."
exec python3 /app/docker/launcher-container.py
EOF

chmod +x /tmp/start_nextjs.sh
chown nextjs:nodejs /tmp/start_nextjs.sh

# Função de cleanup
cleanup() {
    log "🛑 Recebido sinal de parada..."
    
    # Parar nginx graciosamente
    if kill -0 $NGINX_PID 2>/dev/null; then
        log "Parando nginx..."
        kill -QUIT $NGINX_PID 2>/dev/null || true
        wait $NGINX_PID 2>/dev/null || true
    fi
    
    log "Container encerrado"
    exit 0
}

# Configurar trap para shutdown gracioso
trap cleanup SIGTERM SIGINT

# Executar launcher como usuário nextjs
log "🔄 Executando launcher como usuário nextjs..."
su-exec nextjs /tmp/start_nextjs.sh &
LAUNCHER_PID=$!

# Aguardar processos
log "✅ CONTAINER TOTALMENTE INICIALIZADO"
log "📡 HTTP: http://172.20.0.10:80"
log "🔒 HTTPS: https://inspetor.terpens.com.br:443"
log "🔍 Next.js Direto: http://172.20.0.10:3000"
log "💚 Health: http://172.20.0.10:3000/api/health"

# Loop principal - aguardar sinais
while true; do
    # Verificar se nginx ainda está rodando
    if ! kill -0 $NGINX_PID 2>/dev/null; then
        log "❌ Nginx morreu inesperadamente"
        cleanup
        exit 1
    fi
    
    # Verificar se launcher ainda está rodando
    if ! kill -0 $LAUNCHER_PID 2>/dev/null; then
        log "❌ Launcher morreu inesperadamente"
        cleanup
        exit 1
    fi
    
    sleep 10
done