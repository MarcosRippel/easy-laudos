FROM node:22-slim

# Chromium para Puppeteer (geração de PDF)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    curl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Copiar package files primeiro para cache de camadas
COPY package*.json ./

# npm ci COMPLETO (precisa de devDependencies para build — lightningcss, etc.)
RUN npm ci

# Copiar código
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Remover devDependencies após build para diminuir imagem
RUN npm prune --omit=dev

# Criar diretório de uploads
RUN mkdir -p /app/public/uploads

EXPOSE 3006

ENV PORT=3006
ENV HOSTNAME=0.0.0.0
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3006"]
