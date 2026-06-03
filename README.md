# 📋 Easy Laudos - Sistema de Emissão de Laudos de Inspeção Técnica Veicular

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black.svg)
![React](https://img.shields.io/badge/React-19.1.2-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)
![Prisma](https://img.shields.io/badge/Prisma-6.9.0-2D3748.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)
![Status](https://img.shields.io/badge/status-Production-success.svg)

**Sistema web completo para emissão automatizada de laudos técnicos de inspeção veicular com conformidade às normas brasileiras**

[Recursos](#-recursos-principais) • [Instalação](#-instalação) • [Uso](#-como-usar) • [Arquitetura](#%EF%B8%8F-arquitetura) • [API](#-api-reference)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Recursos Principais](#-recursos-principais)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitetura](#%EF%B8%8F-arquitetura)
- [Tipos de Laudos](#-tipos-de-laudos)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Como Usar](#-como-usar)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Configuração](#%EF%B8%8F-configuração)
- [API Reference](#-api-reference)
- [Deploy](#-deploy)
- [Manutenção](#-manutenção)
- [Suporte](#-suporte)

---

## 🎯 Sobre o Projeto

O **Easy Laudos** é uma solução web moderna e completa desenvolvida em **Next.js 15** para automatizar a emissão de laudos de inspeção técnica veicular. O sistema atende empresas especializadas em inspeções de veículos pesados, oferecendo geração profissional de PDFs técnicos com conformidade às normas brasileiras (ABNT, INMETRO, CONTRAN).

### Objetivos

- ✅ **Automatizar** a emissão de laudos técnicos profissionais em PDF
- ✅ **Padronizar** documentos conforme normas técnicas brasileiras
- ✅ **Controlar** cadastros de clientes, veículos e equipamentos de medição
- ✅ **Gerenciar** múltiplos usuários com isolamento de dados (multi-tenancy)
- ✅ **Monitorar** vencimento de calibrações de equipamentos
- ✅ **Rastrear** histórico completo de laudos emitidos
- ✅ **Garantir** conformidade legal e auditoria de inspeções

### Diferenciais

- 🚀 **Interface Moderna** - UI responsiva e intuitiva com Next.js 15 e React 19
- 📱 **Mobile-Friendly** - Acesso completo via smartphone/tablet
- 🔒 **Seguro** - Autenticação JWT com controle de acesso por perfil
- 📊 **Dashboard Analítico** - Métricas e gráficos de produtividade
- 🤖 **OCR Integrado** - Extração automática de dados de documentos (Tesseract.js)
- 🎨 **PDFs Profissionais** - Geração com pdf-lib e Puppeteer
- 🔄 **Multi-Usuário** - Isolamento total de dados por usuário
- ⚡ **Performance** - SSR/SSG com Next.js para carregamento rápido

---

## 🚀 Recursos Principais

### 📄 Gestão de Laudos

- **5 Tipos de Laudos Técnicos**:
  1. **Checklist de Inspeção** - Verificação completa de itens obrigatórios
  2. **LIT (Laudo de Inspeção Técnica)** - Laudo geral completo
  3. **Laudo de Ruído** - Medições de dB em aceleração e marcha lenta
  4. **Laudo de Pino Rei** - Inspeção de engate (5ª roda / pino rei)
  5. **Laudo de Quinta Roda** - Inspeção completa de quinta roda

- **Geração Automática de PDFs** - Documentos profissionais com logos e assinaturas
- **Registro Fotográfico** - Upload de até 3 fotos por laudo
- **Numeração Automática** - Ordem de serviço sequencial
- **Histórico Completo** - Rastreamento de todas as emissões
- **Busca Avançada** - Filtros por cliente, veículo, data, tipo
- **Download em Lote** - Exportação de múltiplos laudos em ZIP

### 🏢 Cadastros e Gestão

- **Clientes (CNPJ)** - Cadastro completo com endereço e contato
- **Veículos** - Placa, chassi, modelo, ano, espécie/tipo
- **Equipamentos de Medição** - Decibelímetros, calibradores, paquímetros
- **Alertas de Calibração** - Notificações de vencimento de certificados
- **Configurações da Empresa** - Logo, dados institucionais, personalização

### 👥 Controle de Acesso

- **3 Perfis de Usuário**:
  - **Admin** - Acesso total ao sistema, gerencia usuários
  - **client_a** - Usuário isolado com seus próprios dados
  - **client_b** - Usuário isolado com seus próprios dados

- **Autenticação JWT** - Login seguro com tokens
- **Isolamento de Dados** - Multi-tenancy por usuário
- **Auditoria** - Log de todas as ações e alterações

### 📊 Dashboards e Relatórios

- **Métricas em Tempo Real** - Total de laudos, clientes, veículos
- **Gráficos Interativos** - Chart.js com análises visuais
- **Relatórios Gerenciais** - Produtividade por período
- **Alertas Visuais** - Equipamentos vencidos ou próximos do vencimento

---

## 🛠 Stack Tecnológico

### Frontend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Next.js** | 15.3.3 | Framework React com SSR/SSG e App Router |
| **React** | 19.1.2 | Biblioteca de interface de usuário |
| **TypeScript** | 5.x | Tipagem estática e segurança de código |
| **Tailwind CSS** | 4.x | Framework CSS utilitário |
| **Chart.js** | 4.5.0 | Gráficos e visualizações de dados |
| **react-chartjs-2** | 5.3.0 | Wrapper React para Chart.js |
| **date-fns** | 4.1.0 | Manipulação e formatação de datas |

### Backend & Database

| Tecnologia | Versão | Propósito |
-----------|--------|-----------|
| **Prisma ORM** | 6.9.0 | Gerenciamento de banco de dados com type-safety |
| **SQLite** | 3.x | Banco de dados relacional embutido |
| **Next.js API Routes** | 15.3.3 | Endpoints REST API serverless |

### Geração de PDFs

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **pdf-lib** | 1.17.1 | Criação e manipulação de PDFs |
| **@pdf-lib/fontkit** | 1.1.1 | Suporte a fontes customizadas |
| **Puppeteer** | 24.17.0 | Renderização avançada de HTML para PDF |

### Processamento de Documentos

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Tesseract.js** | 6.0.1 | OCR (Reconhecimento Óptico de Caracteres) |
| **OpenAI API** | 5.8.2 | Processamento inteligente de documentos |
| **Formidable** | 3.5.4 | Upload e processamento de arquivos |
| **Archiver** | 7.0.1 | Compactação de arquivos (ZIP) |

### Infraestrutura & Deploy

- **Docker** - Containerização da aplicação
- **Nginx** - Proxy reverso e load balancer
- **Cloudflare Tunnel** - Acesso seguro HTTPS
- **Node.js** - Runtime JavaScript
- **npm/pnpm** - Gerenciamento de pacotes

---

## 🏗️ Arquitetura

### Diagrama de Alto Nível

```
┌──────────────────────────────────────────────────────────────┐
│                      USUÁRIO                                  │
│                  (Navegador Web)                              │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS
                         ▼
                ┌────────────────────┐
                │ Nginx Reverse Proxy│ (Opcional)
                └────────┬───────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                    EASY LAUDOS SERVER                           │
│                     (Next.js 15.3.3)                            │
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │   Frontend   │────▶│  API Routes  │────▶│   Prisma     │   │
│  │  (React 19)  │     │  (REST API)  │     │     ORM      │   │
│  └──────────────┘     └──────┬───────┘     └──────┬───────┘   │
│                               │                     │           │
│                               ▼                     ▼           │
│                    ┌─────────────────┐   ┌─────────────────┐   │
│                    │  PDF Generator  │   │   SQLite DB     │   │
│                    │ (pdf-lib/       │   │  (laudos.db)    │   │
│                    │  Puppeteer)     │   │                 │   │
│                    └─────────────────┘   └─────────────────┘   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Serviços Auxiliares                          │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ • OCR (Tesseract.js) - Extração de dados                 │ │
│  │ • Upload Handler - Gerenciamento de imagens              │ │
│  │ • JWT Auth - Autenticação e autorização                  │ │
│  │ • Validation - Validação de dados (Zod)                  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Camadas da Aplicação

1. **Presentation Layer** (Frontend)
   - React Components (Server & Client)
   - Tailwind CSS styling
   - Client-side routing (Next.js App Router)

2. **API Layer** (Backend)
   - Next.js API Routes (`/app/api/*`)
   - RESTful endpoints
   - Middleware de autenticação

3. **Business Logic Layer**
   - Validação de dados
   - Regras de negócio
   - Geração de PDFs

4. **Data Access Layer**
   - Prisma ORM
   - Database queries
   - Migrations

5. **Persistence Layer**
   - SQLite database
   - File storage (uploads)

---

## 📝 Tipos de Laudos

### 1. ✅ Checklist de Inspeção

Verificação completa de itens obrigatórios conforme normativa técnica.

**Características**:
- Lista de itens de verificação (checkbox)
- Registro fotográfico (3 fotos)
- Observações técnicas
- Resultado: Aprovado/Reprovado

---

### 2. 📋 LIT - Laudo de Inspeção Técnica

Laudo geral completo com todos os dados do veículo e cliente.

**Características**:
- Dados completos do cliente (CNPJ, endereço)
- Dados completos do veículo (placa, chassi, modelo, ano)
- Fabricante e modelo do equipamento inspecionado
- Dimensões (diâmetro do pino rei)
- Data de validade da inspeção
- Registro fotográfico (3 fotos: frontal, traseira, chassi)
- Observações técnicas

---

### 3. 🔊 Laudo de Ruído

Medição de níveis sonoros conforme resolução CONTRAN.

**Características**:
- **6 medições em aceleração** (0-120 dB)
- **6 medições em marcha lenta** (0-120 dB)
- Cálculo automático de medianas e máximos
- Equipamento decibelímetro calibrado
- Certificado de calibração
- Resultado: Aprovado/Reprovado (conforme limites legais)
- Inspetor responsável

**Limites CONTRAN**:
- Veículos leves: até 77 dB
- Veículos pesados: até 81 dB

---

### 4. 🔗 Laudo de Pino Rei

Inspeção técnica detalhada do pino rei (engate 5ª roda).

**Características**:

**Exame Visual do Pino Rei**:
- Posição vertical ✓
- Ausência de trincas ✓
- Integridade da fixação ✓
- Selo de identificação ✓
- Tipo de fixação (Solda/Flangeado/Aparafusada)
- Diâmetro registrado (mm)
- Estado de conservação ✓
- Resultado: Aprovado/Reprovado

**Inspeção Visual da Mesa**:
- Tipo de fixação (Solda/Aparafusada)
- Mesa bem fixada ✓
- Reparo de solda ✓
- Resultado: Aprovado/Reprovado

**Ensaios Complementares**:
- Ensaio realizado (Sim/Não)
- Descrição do ensaio

**Registro Fotográfico**:
- Foto do chassi
- Foto do pino rei
- Foto da mesa

**Normas Aplicáveis**: ABNT NBR 13096, NBR ISO 3584

---

### 5. 🔄 Laudo de Quinta Roda

Inspeção completa da quinta roda conforme normas técnicas.

**Características**:

**Dados da Quinta Roda**:
- Fabricante/Marca
- Modelo
- Número de identificação

**12 Itens de Exame Visual** (Sim/Não):
1. Selo de identificação da conformidade ✓
2. Ausência de trincas/rachaduras/reparos ✓
3. Íntegra e devidamente fixada ✓
4. Pinos de articulação íntegros ✓
5. Mancais sem ovalizações ou folgas excessivas ✓
6. Mecanismo de travamento funcionando ✓
7. Pinos devidamente presos ✓
8. Canais de lubrificação sem desgastes ✓
9. Apoios/sapatas sem trincas/folgas ✓
10. Cantoneiras e placas bem fixadas ✓
11. Aterramento devidamente fixado ✓
12. Ensaio complementar realizado ✓

**Resultado Final**: Aprovado/Reprovado

**Registro Fotográfico** (3 fotos):
- Foto 1 da quinta roda
- Foto 2 da quinta roda
- Foto do chassi

**Normas Aplicáves**: ABNT NBR 13096, NBR ISO 3584, NBR ISO 9367

---

## 📦 Pré-requisitos

### Sistema Operacional

- Windows 10/11 ou Windows Server 2016+
- Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
- macOS 11+ (BigSur ou superior)

### Software Necessário

```bash
# Node.js 18.17 ou superior
node --version  # Deve retornar v18.17+

# npm (gerenciador de pacotes Node)
npm --version

# Git (opcional, para controle de versão)
git --version
```

### Hardware Recomendado

| Componente | Mínimo | Recomendado | Produção |
|-----------|--------|-------------|-----------|
| **CPU** | 2 cores | 4 cores | 8+ cores |
| **RAM** | 2 GB | 4 GB | 8+ GB |
| **Disco** | 5 GB SSD | 10 GB SSD | 20+ GB SSD |
| **Rede** | 10 Mbps | 50 Mbps | 100 Mbps |

---

## 📥 Instalação

### 1. Clone do Repositório (ou extração do ZIP)

```bash
# Via Git
git clone <repository-url> easy-laudos
cd easy-laudos

# Ou extrair arquivo ZIP
unzip easy-laudos.zip
cd easy-laudos
```

### 2. Instalação de Dependências

```bash
# Instalar todas as dependências Node.js
npm install

# OU usar pnpm (mais rápido)
pnpm install

# OU usar yarn
yarn install
```

### 3. Configuração do Banco de Dados

```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrations (criar tabelas)
npx prisma migrate deploy

# OU em desenvolvimento
npx prisma migrate dev

# (Opcional) Popular banco com dados de teste
npx prisma db seed
```

### 4. Configuração do Ambiente

```bash
# Copiar arquivo de exemplo de configuração
cp .env.example .env

# Editar o arquivo .env com suas configurações
# DATABASE_URL já está configurado para SQLite local
```

Exemplo de `.env`:
```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua-chave-secreta-super-forte-aqui"
NEXT_PUBLIC_APP_NAME="Easy Laudos"
```

### 5. Criar Usuário Admin

```bash
# Executar script de criação de usuário admin
node scripts/create-admin.js

# OU usar Prisma Studio para criar manualmente
npx prisma studio
```

---

## 🎮 Como Usar

### Iniciar o Sistema

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Ou na porta 3000 (padrão)
npm run start

# Ou HTTPS local (com certificado SSL)
npm run start:https

# Produção (build otimizado)
npm run build
npm run start
```

### Acessar a Interface Web

Após iniciar, acesse:

- **HTTP (Desenvolvimento)**: `http://localhost:3000`
- **HTTPS (Local)**: `https://127.0.0.1:3000`
- **Produção**: `https://seu-dominio.com`

### Login Padrão

```
Usuário Administrador:
- Username: admin
- Senha: [configurada no setup]

Usuários Cliente:
- client_a / [senha]
- client_b / [senha]
```

### Parar o Sistema

- Pressione `Ctrl + C` no terminal

---

## 📁 Estrutura do Projeto

```
easy-laudos/
├── 📄 package.json                # Dependências e scripts npm
├── 📄 tsconfig.json               # Configuração TypeScript
├── 📄 next.config.js              # Configuração Next.js
├── 📄 tailwind.config.ts          # Configuração Tailwind CSS
├── 📄 postcss.config.mjs          # Configuração PostCSS
├── 📄 .env                        # Variáveis de ambiente (não versionado)
├── 📄 .env.example                # Exemplo de configuração
│
├── 📂 app/                        # Next.js App Router
│   ├── 📂 api/                    # API Routes (Backend)
│   │   ├── auth/                  # Autenticação JWT
│   │   ├── clients/               # CRUD de clientes
│   │   ├── vehicles/              # CRUD de veículos
│   │   ├── equipment/             # CRUD de equipamentos
│   │   ├── laudos/                # CRUD de laudos
│   │   ├── pdf/                   # Geração de PDFs
│   │   └── upload/                # Upload de imagens
│   │
│   ├── 📂 login/                  # Página de login
│   ├── 📂 admin/                  # Dashboard administrativo
│   ├── 📂 clients/                # Gestão de clientes
│   ├── 📂 vehicles/               # Gestão de veículos
│   ├── 📂 emitirlaudo/            # Emissão de laudos
│   ├── 📂 laudos/                 # Listagem de laudos
│   │
│   ├── 📄 page.tsx                # Homepage (Dashboard)
│   ├── 📄 layout.tsx              # Layout global
│   └── 📄 globals.css             # Estilos globais
│
├── 📂 prisma/                     # Prisma ORM
│   ├── 📄 schema.prisma           # Schema do banco de dados
│   └── 📂 migrations/             # Migrations SQL
│
├── 📂 components/                 # Componentes React reutilizáveis
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Card.tsx
│   └── (...)
│
├── 📂 lib/                        # Bibliotecas utilitárias
│   ├── prisma.ts                  # Cliente Prisma singleton
│   ├── auth.ts                    # Funções de autenticação
│   └── utils.ts                   # Utilidades gerais
│
├── 📂 types/                      # TypeScript types e interfaces
│   └── index.ts
│
├── 📂 public/                     # Arquivos estáticos públicos
│   ├── images/                    # Imagens e logos
│   ├── fonts/                     # Fontes customizadas
│   └── favicon.ico
│
├── 📂 uploads/                    # Uploads de usuários
│   ├── laudos/                    # PDFs gerados
│   └── fotos/                     # Fotos de inspeções
│
├── 📂 ssl/                        # Certificados SSL/TLS
│   ├── certificate.crt
│   └── private.key
│
├── 📂 launcher-production/        # Scripts de deployment
│   ├── launcher.py                # Launcher Python (HTTPS)
│   └── requirements.txt
│
├── 📂 docs/                       # Documentação adicional
│   ├── API-REFERENCE.md           # Referência da API
│   ├── DATABASE-SCHEMA.md         # Esquema do banco
│   ├── MANUAL-USUARIO.md          # Manual do usuário
│   └── SEGURANCA-AUTENTICACAO.md
│
└── 📄 dev.db                      # Banco SQLite (desenvolvimento)
```

---

## ⚙️ Configuração

### Arquivo `.env`

Variáveis de ambiente principais:

```bash
# === DATABASE ===
DATABASE_URL="file:./dev.db"

# === JWT AUTHENTICATION ===
JWT_SECRET="chave-secreta-super-forte-mude-em-producao-123456"

# === APPLICATION ===
NEXT_PUBLIC_APP_NAME="Easy Laudos"
NEXT_PUBLIC_COMPANY_NAME="Sua Empresa Ltda"

# === OPENAI (Opcional - para OCR avançado) ===
OPENAI_API_KEY="sk-..."

# === UPLOAD LIMITS ===
MAX_FILE_SIZE=10485760  # 10MB em bytes
ALLOWED_FILE_TYPES=".jpg,.jpeg,.png,.pdf"
```

### Configuração do Prisma

Editar `prisma/schema.prisma` se necessário:

```prisma
datasource db {
  provider = "sqlite"  // Pode mudar para "postgresql" ou "mysql"
  url      = env("DATABASE_URL")
}
```

### Configuração de HTTPS

Para habilitar HTTPS local:

1. Gerar certificados SSL:
```bash
node create-ssl-for-ip.js
```

2. Iniciar com HTTPS:
```bash
npm run start:https
```

---

## 📡 API Reference

### Autenticação

#### POST `/api/auth/login`
Autentica usuário e retorna JWT token.

**Request Body**:
```json
{
  "username": "admin",
  "password": "senha123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx123...",
    "username": "admin",
    "role": "admin"
  }
}
```

---

### Clientes

#### GET `/api/clients`
Lista todos os clientes do usuário logado.

#### POST `/api/clients`
Cria novo cliente.

**Request Body**:
```json
{
  "cnpj": "12.345.678/0001-90",
  "name": "Empresa Exemplo Ltda",
  "addressStreet": "Rua Exemplo",
  "addressNumber": "123",
  "addressCity": "São Paulo",
  "addressState": "SP",
  "addressZip": "01234-567",
  "phone": "(11) 1234-5678"
}
```

---

### Veículos

#### GET `/api/vehicles`
Lista todos os veículos.

#### POST `/api/vehicles`
Cria novo veículo.

**Request Body**:
```json
{
  "placa": "ABC-1234",
  "numeroChassi": "9BWAA1234ABC12345",
  "marcaModelo": "Scania G 440",
  "anoFabricacaoModelo": "2020/2021",
  "especieTipo": "Caminhão",
  "clientId": "clx123..."
}
```

---

### Laudos

#### GET `/api/laudos`
Lista todos os laudos emitidos.

#### POST `/api/laudos`
Cria novo laudo.

**Request Body (Exemplo - Laudo de Ruído)**:
```json
{
  "laudoType": "ruido",
  "ordemServico": "OS-2024-001",
  "clientId": "clx123...",
  "vehicleId": "clx456...",
  "dataEmissao": "2024-02-03T15:00:00Z",
  "equipmentId": "clx789...",
  "laudoRuido": {
    "aceleracao1": 75.5,
    "aceleracao2": 76.2,
    "aceleracao3": 75.8,
    "aceleracao4": 76.1,
    "aceleracao5": 75.9,
    "aceleracao6": 76.0,
    "marchaLenta1": 68.5,
    "marchaLenta2": 69.0,
    "marchaLenta3": 68.8,
    "marchaLenta4": 68.7,
    "marchaLenta5": 68.9,
    "marchaLenta6": 68.6,
    "resultado": "APROVADO",
    "inspetorResponsavel": "João da Silva - CREA 123456/SP"
  }
}
```

#### GET `/api/laudos/[id]/pdf`
Gera e retorna PDF do laudo.

**Response**: Binary PDF file

---

### Upload

#### POST `/api/upload`
Faz upload de imagem.

**Request**: multipart/form-data
**Response**:
```json
{
  "url": "/uploads/fotos/202402031500_abc123.jpg"
}
```

---

Ver documentação completa em [`docs/API-REFERENCE.md`](docs/API-REFERENCE.md)

---

## 🚀 Deploy

### Deploy em Produção (Linux/Ubuntu)

```bash
# 1. Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clonar projeto e configurar
git clone <repo-url> /var/www/easy-laudos
cd /var/www/easy-laudos

# 3. Instalar dependências
npm install --production

# 4. Configurar .env para produção
nano .env
# DATABASE_URL="file:/var/www/easy-laudos/production.db"
# JWT_SECRET="[gerar chave forte]"

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

### Deploy com Docker

```bash
# Build da imagem
docker build -t easy-laudos:latest .

# Executar container
docker run -d \
  --name easy-laudos \
  -p 3000:3000 \
  -v $(pwd)/.env:/app/.env \
  -v $(pwd)/production.db:/app/production.db \
  -v $(pwd)/uploads:/app/uploads \
  easy-laudos:latest
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name laudos.seudominio.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL com Certbot (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d laudos.seudominio.com
```

---

## 🔧 Manutenção

### Backup do Banco de Dados

```bash
# Backup manual
cp production.db backups/production_$(date +%Y%m%d).db

# Backup automatizado (cron)
0 2 * * * cp /var/www/easy-laudos/production.db /backups/easy-laudos_$(date +\%Y\%m\%d).db
```

### Verificação de Integridade

```bash
# Verificar status do banco
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

# Ver logs do Next.js
tail -f .next/server/app.log
```

### Limpeza de Arquivos Temporários

```bash
# Limpar cache do Next.js
rm -rf .next/cache

# Limpar uploads antigos (mais de 90 dias)
find uploads/fotos -type f -mtime +90 -delete

# Limpar PDFs temporários
find uploads/laudos/temp -type f -delete
```

---

## 📚 Documentação Adicional

Consulte os documentos na pasta `docs/`:

- [`API-REFERENCE.md`](API-REFERENCE.md) - Referência completa da API REST
- [`DATABASE-SCHEMA.md`](DATABASE-SCHEMA.md) - Esquema do banco de dados
- [`MANUAL-USUARIO.md`](MANUAL-USUARIO.md) - Manual do usuário final
- [`SEGURANCA-AUTENTICACAO.md`](SEGURANCA-AUTENTICACAO.md) - Segurança e autenticação
- [`INSTALACAO-CONFIGURACAO.md`](INSTALACAO-CONFIGURACAO.md) - Guia detalhado de instalação
- [`MANUTENCAO-SISTEMA.md`](MANUTENCAO-SISTEMA.md) - Procedimentos de manutenção

---

## 🆘 Suporte

### Solução de Problemas Comuns

#### Erro: "Cannot find module 'prisma/client'"
```bash
# Regenerar cliente Prisma
npx prisma generate
```

#### Erro: "Port 3000 already in use"
```bash
# Usar porta alternativa
PORT=3001 npm run dev

# Ou matar processo na porta 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux:
lsof -ti:3000 | xargs kill -9
```

#### Erro: "Database is locked"
```bash
# Fechar Prisma Studio e outras conexões
# Reiniciar aplicação
npm run build
npm run start
```

#### PDFs não estão sendo gerados
```bash
# Verificar permissões da pasta uploads
chmod -R 755 uploads/

# Reinstalar dependências de PDF
npm install pdf-lib puppeteer --force
```

### Contato

- **Email**: suporte@easylaudos.com.br
- **Telefone**: +55 (XX) XXXX-XXXX
- **Documentação**: https://docs.easylaudos.com.br
- **Issues**: GitHub Issues (se aplicável)

---

## 📝 Licença

Este software é proprietário e confidencial. Todos os direitos reservados.

**© 2024-2026 Easy Laudos. Uso não autorizado é estritamente proibido.**

---

## 🎉 Agradecimentos

Desenvolvido com ❤️ pela equipe Easy Laudos.

**Stack:** Next.js • React • TypeScript • Prisma • SQLite • Tailwind CSS • pdf-lib • Puppeteer

---

<div align="center">

**[⬆ Voltar ao topo](#-easy-laudos---sistema-de-emissão-de-laudos-de-inspeção-técnica-veicular)**

</div>
