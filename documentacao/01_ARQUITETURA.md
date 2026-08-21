# 🏗️ Arquitetura Geral - Easy Laudos

## 1. Visão Geral

O **Easy Laudos** é um sistema web de emissão de laudos de inspeção técnica veicular construído em **Next.js 15** (App Router) com backend integrado via API Routes e banco de dados **SQLite** gerenciado por **Prisma ORM**.

O sistema atende empresas de inspeção de veículos pesados (caminhões, carretas) e gera **5 tipos de laudos técnicos** em PDF profissional com conformidade às normas ABNT/INMETRO/CONTRAN.

---

## 2. Stack Tecnológico

### Frontend
| Tecnologia | Versão | Papel |
|------------|--------|-------|
| **Next.js** | 15.3.3 | Framework full-stack (App Router, SSR, API Routes) |
| **React** | 19.1.2 | UI Components (Client + Server) |
| **TypeScript** | 5.x | Tipagem estática |
| **Tailwind CSS** | 4.x | Estilização |
| **Chart.js** | 4.5.0 | Gráficos de dashboard |
| **date-fns** | 4.1.0 | Formatação de datas |

### Backend & Data
| Tecnologia | Versão | Papel |
|------------|--------|-------|
| **Prisma ORM** | 6.9.0 | Gerenciamento do banco com type-safety |
| **SQLite** | 3.x | Banco de dados relacional (arquivo `prisma/dev.db`) |
| **Puppeteer** | 24.17.0 | Renderização HTML→PDF |
| **pdf-lib** | 1.17.1 | Manipulação programática de PDFs |
| **Tesseract.js** | 6.0.1 | OCR para extração de dados de documentos |
| **OpenAI** | 5.8.2 | Processamento inteligente de documentos |
| **Formidable** | 3.5.4 | Processamento de uploads multipart |
| **Archiver** | 7.0.1 | Compactação ZIP para download em lote |

### Infraestrutura
| Tecnologia | Papel |
|------------|-------|
| **Nginx** | Proxy reverso (opcional) |
| **Cloudflare Tunnel** | Acesso HTTPS seguro remoto |
| **Docker** | Containerização |
| **SSL Auto-gen** | Scripts de geração de certificados (`create-ssl-for-ip.js`) |

---

## 3. Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NAVEGADOR WEB                                │
│                   (Desktop / Mobile / Tablet)                        │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTPS (porta 3006 dev / 3000 prod)
                            ▼
               ┌─────────────────────────┐
               │  Cloudflare Tunnel /    │
               │  Nginx (Opcional)       │
               └────────────┬────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EASY LAUDOS SERVER                              │
│                       (Next.js 15.3.3)                               │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    CAMADA DE APRESENTAÇÃO                       ││
│  │  14 Páginas React (Server + Client Components)                  ││
│  │  ├── / (Dashboard Principal + Listagem de Laudos)               ││
│  │  ├── /login                                                     ││
│  │  ├── /admin (Dashboard Admin)                                   ││
│  │  ├── /admin/users (Gestão de Usuários)                          ││
│  │  ├── /admin/equipments (Equipamentos de Medição)                ││
│  │  ├── /clients/create (Cadastro de Clientes)                     ││
│  │  ├── /vehicles (Gestão de Veículos)                             ││
│  │  ├── /emitirlaudo (Selector de Tipo de Laudo)                   ││
│  │  ├── /laudos (Listagem de Laudos)                               ││
│  │  ├── /laudos/create (LIT - Laudo de Inspeção Técnica)           ││
│  │  ├── /laudos/checklist (Checklist de Inspeção)                  ││
│  │  ├── /laudos/pino-rei (Laudo de Pino Rei)                      ││
│  │  ├── /laudos/quinta-roda (Laudo de Quinta Roda)                 ││
│  │  └── /test-flow (Teste de Fluxo)                                ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      CAMADA DE API                              ││
│  │  32 Endpoints REST (Next.js API Routes)                          ││
│  │  ├── /api/auth/* (login, logout, me, register)                  ││
│  │  ├── /api/clients (CRUD)                                        ││
│  │  ├── /api/vehicles (CRUD)                                       ││
│  │  ├── /api/equipments/* (CRUD + notificações)                    ││
│  │  ├── /api/laudos/* (CRUD + PDF + tipos específicos)             ││
│  │  ├── /api/admin/* (settings, users)                             ││
│  │  ├── /api/upload (upload de imagens)                            ││
│  │  ├── /api/process-document (OCR)                                ││
│  │  ├── /api/stats (métricas)                                      ││
│  │  ├── /api/temporal-code (código temporal)                       ││
│  │  └── /api/health (health check)                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                   CAMADA DE NEGÓCIOS                            ││
│  │  ├── Geração de PDFs (Puppeteer + pdf-lib)                      ││
│  │  ├── OCR (Tesseract.js + OpenAI)                                ││
│  │  ├── Validações de negócio (normas ABNT/CONTRAN)                ││
│  │  ├── Cálculos de medições (medianas, máximos)                   ││
│  │  └── Compactação ZIP (Archiver)                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                   CAMADA DE DADOS                               ││
│  │  ├── Prisma ORM (client singleton em lib/prisma.ts)             ││
│  │  ├── SQLite (prisma/dev.db)                                     ││
│  │  ├── 7+ Modelos (User, Client, Vehicle, Laudo, etc.)           ││
│  │  └── Filesystem (uploads de fotos em /public/uploads/)          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                   AUTENTICAÇÃO                                  ││
│  │  ├── Cookie-based Session (gts_session, 8h TTL)                 ││
│  │  ├── SHA-256 password hashing (com salt)                        ││
│  │  ├── AuthWrapper (React Context global)                         ││
│  │  ├── Middleware de autenticação (lib/middleware-auth.ts)         ││
│  │  └── Multi-tenancy por userId (admin/client_a/client_b)         ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Estrutura de Diretórios

```
easy-laudos/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Dashboard Principal (Home)
│   ├── layout.tsx                # Layout Global (AuthWrapper)
│   ├── globals.css               # Estilos Globais
│   ├── api/                      # 32 Endpoints REST
│   │   ├── auth/                 # login, logout, me, register
│   │   ├── clients/              # CRUD de clientes
│   │   ├── vehicles/             # CRUD de veículos
│   │   ├── equipments/           # CRUD + notificações de calibração
│   │   ├── laudos/               # CRUD + PDF + subtipos (ruido, pino-rei, quinta-roda, checklist)
│   │   ├── admin/                # settings, users CRUD
│   │   ├── upload/               # Upload de imagens
│   │   ├── process-document/     # OCR com Tesseract/OpenAI
│   │   ├── stats/                # Métricas do sistema
│   │   ├── temporal-code/        # Código temporal
│   │   └── health/               # Saúde do sistema
│   ├── login/                    # Página de Login
│   ├── admin/                    # Dashboard Admin + Users + Equipments
│   ├── clients/                  # Cadastro de Clientes
│   ├── vehicles/                 # Gestão de Veículos
│   ├── emitirlaudo/              # Selector de Tipo de Laudo
│   ├── laudos/                   # Listagem + Formulários específicos
│   └── test-flow/                # Teste de Fluxo
│
├── components/                   # Componentes React
│   ├── auth/                     # AuthWrapper (Context Provider)
│   ├── layout/                   # MainLayout (Sidebar + Header)
│   ├── laudos/                   # 5 Formulários de Laudo
│   │   ├── ChecklistForm.tsx     # (135KB - mais complexo)
│   │   ├── CreateLaudoForm.tsx   # LIT - Laudo de Inspeção Técnica
│   │   ├── RuidoForm.tsx         # Laudo de Ruído
│   │   ├── PinoReiForm.tsx       # Laudo de Pino Rei
│   │   └── QuintaRodaForm.tsx    # Laudo de Quinta Roda
│   ├── vehicles/                 # VehicleForm, VehicleDocumentProcessor, VehiclePdfReader
│   ├── clients/                  # Formulário de clientes
│   ├── equipments/               # EquipmentNotifications
│   └── admin/                    # Painel administrativo
│
├── lib/                          # Utilitários de Backend
│   ├── prisma.ts                 # Singleton do Prisma Client
│   ├── auth.ts                   # Hash, tipos e helpers de auth
│   ├── middleware-auth.ts        # Extração de sessão do cookie
│   └── download.ts               # Helpers de download
│
├── types/                        # TypeScript Types
│   ├── checklist.ts              # Tipos do checklist (19KB)
│   ├── equipment.ts              # Tipos de equipamento
│   ├── pino-rei.ts               # Tipos do pino rei (5KB)
│   ├── quinta-roda.ts            # Tipos da quinta roda (8.6KB)
│   └── ruido.ts                  # Tipos do laudo de ruído
│
├── prisma/                       # Banco de Dados
│   ├── schema.prisma             # Schema (292 linhas, 7+ modelos)
│   ├── dev.db                    # SQLite database (925KB)
│   ├── seed.ts                   # Seed geral
│   ├── seed-users.ts             # Seed de usuários
│   └── migrations/               # 8 migrations
│
├── public/                       # Assets estáticos
├── ssl/                          # Certificados SSL
├── migration/                    # Scripts de migração (128 itens)
├── docker/                       # Config Docker
└── documentacao/                 # 📚 ESTA PASTA DE DOCUMENTAÇÃO
```

---

## 5. Camadas da Aplicação

### 5.1 Presentation Layer
- **Server Components**: Layout, metadata, SEO
- **Client Components**: Formulários interativos, dashboard, gráficos
- **Styling**: Tailwind CSS 4 + CSS Modules (`.module.css`)
- **State Management**: React Context (AuthContext) + useState/useEffect

### 5.2 API Layer
- **32 API Routes** organizadas por domínio em `/app/api/`
- Padrão RESTful (GET, POST, PUT, DELETE)
- Autenticação via cookie `gts_session`
- Responses: `NextResponse.json()`

### 5.3 Business Logic Layer
- Validação de dados de inspeção
- Cálculos de medições (mediana, máximo para laudos de ruído)
- Geração HTML→PDF via Puppeteer
- OCR de documentos veiculares

### 5.4 Data Access Layer
- **Prisma ORM** com singleton em `lib/prisma.ts`
- Queries tipadas com auto-complete TypeScript
- Includes/Relations para queries JOIN
- Constraints: `@@unique([cnpj, userId])`, `@unique`

### 5.5 Persistence Layer
- **SQLite** em arquivo (`prisma/dev.db`)
- **Filesystem** para uploads de fotos
- **8 migrations** versionadas

---

## 6. Decisões Arquiteturais

| Decisão | Justificativa |
|---------|---------------|
| **Next.js App Router** | Unifica frontend e backend em uma aplicação, simplifica deploy |
| **SQLite** | Zero-config, portável, ideal para baixo volume de dados |
| **Cookie-based Session** | Simples, sem JWT token management no client |
| **Puppeteer + pdf-lib** | Puppeteer para HTML→PDF complexo, pdf-lib para manipulação |
| **Multi-tenancy por userId** | Isolamento simples via coluna `userId` nas tabelas |
| **CSS Modules + Tailwind** | Módulos para escopo local, Tailwind para utilitários |
| **Turbopack (dev)** | Hot reload rápido em desenvolvimento (`--turbopack`) |
