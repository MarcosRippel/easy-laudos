# 🔄 Fluxos do Sistema - Easy Laudos

## 1. Fluxo de Autenticação

```
┌─────────┐     GET /login      ┌────────────┐
│ Usuário │────────────────────▶│ Login Page │
│         │                     │ (login/    │
└────┬────┘                     │  page.tsx) │
     │                          └─────┬──────┘
     │                                │
     │    POST /api/auth/login        │ Preenche usuário + senha
     │    { username, password }      │
     │◄───────────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ API: /api/auth/login         │
│                              │
│ 1. Busca user no Prisma      │
│ 2. hashPassword(input)       │
│    SHA-256 + salt             │
│ 3. Compara com hash do DB    │
│ 4. Se OK → Set Cookie        │
│    gts_session = JSON{       │
│      userId, username, role, │
│      loginTime               │
│    }                         │
│    maxAge: 8 horas           │
│ 5. Retorna {user}            │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ AuthWrapper (React Context)  │
│                              │
│ 1. useEffect → GET /api/     │
│    auth/me (verifica cookie) │
│ 2. Se válido → setUser()     │
│ 3. Se admin → redirect       │
│    /admin                    │
│ 4. Se cliente → redirect /   │
│ 5. Se inválido → redirect    │
│    /login                    │
│                              │
│ Protege TODAS as rotas       │
│ exceto /login                │
└──────────────────────────────┘
```

---

## 2. Fluxo Principal: Emissão de Laudo

```
┌─────────┐   Acessa /emitirlaudo   ┌─────────────────────┐
│ Inspetor│ ──────────────────────▶  │ Selector de Laudo   │
│         │                          │                     │
└────┬────┘                          │ Escolhe 1 de 5:     │
     │                               │ ☐ Checklist         │
     │                               │ ☐ LIT               │
     │                               │ ☐ Ruído             │
     │                               │ ☐ Pino Rei          │
     │                               │ ☐ Quinta Roda       │
     │                               └──────────┬──────────┘
     │                                          │
     ▼                                          ▼
┌────────────────────────────────────────────────────────────┐
│              FORMULÁRIO DO LAUDO SELECIONADO               │
│                                                            │
│  PASSO 1 → Selecionar/Cadastrar Cliente (CNPJ)            │
│             GET /api/clients                                │
│                                                            │
│  PASSO 2 → Selecionar/Cadastrar Veículo (Placa, Chassi)   │
│             GET /api/vehicles                               │
│             * OCR disponível via /api/process-document      │
│                                                            │
│  PASSO 3 → Preencher Dados Técnicos                        │
│             • Checklist: itens de verificação               │
│             • LIT: dados gerais + fotos                     │
│             • Ruído: 12 medições + equipamento              │
│             • Pino Rei: visual + mesa + ensaios             │
│             • Quinta Roda: 12 itens visuais                 │
│                                                            │
│  PASSO 4 → Upload de Fotos (até 3)                         │
│             POST /api/upload                                │
│                                                            │
│  PASSO 5 → Gerar Laudo                                     │
│             POST /api/laudos                                │
│             POST /api/laudos/ruido (ou pino-rei, etc.)     │
│             POST /api/laudos/pdf (gera PDF)                │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│                  GERAÇÃO DO PDF                            │
│                                                            │
│  1. Busca dados completos (joins com client, vehicle)     │
│  2. Busca adminSettings (logo, nome empresa)              │
│  3. Gera HTML do laudo (template inline)                  │
│  4. Puppeteer renderiza HTML → PDF                        │
│     • Tamanho A4                                           │
│     • Logo da empresa                                      │
│     • Fotos incorporadas (base64)                          │
│     • Gráficos SVG (ruído)                                 │
│  5. Retorna binary PDF ao navegador                       │
│  6. Download automático                                    │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Fluxo de Gestão de Clientes

```
┌─────────┐   /clients/create   ┌──────────────────────┐
│ Inspetor│ ──────────────────▶ │ Formulário Cliente   │
└────┬────┘                     │                      │
     │                          │ • CNPJ              │
     │                          │ • Razão Social      │
     │                          │ • Endereço completo │
     │                          │ • Telefone          │
     │                          └──────────┬───────────┘
     │                                     │
     │      POST /api/clients              │
     │◄────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ API: /api/clients            │
│                              │
│ 1. Valida dados              │
│ 2. Verifica CNPJ unique      │
│    por userId                │
│ 3. prisma.client.create()    │
│ 4. Retorna {client}         │
└──────────────────────────────┘
```

---

## 4. Fluxo de Gestão de Veículos

```
┌─────────┐   /vehicles       ┌──────────────────────┐
│ Inspetor│ ───────────────▶  │ Página de Veículos   │
└────┬────┘                   │                      │
     │                        │ Opções:              │
     │                        │ 1. Cadastro Manual   │
     │                        │ 2. OCR Documento     │
     │                        │    (VehiclePdfReader) │
     │                        │ 3. Processamento IA  │
     │                        │    (VehicleDocProc)   │
     │                        └──────────┬───────────┘
     │                                   │
     │  Caminho Manual:                  │
     │  POST /api/vehicles               │
     │  {placa, chassi, modelo, ...}     │
     │                                   │
     │  Caminho OCR:                     │
     │  POST /api/process-document       │
     │  (Tesseract.js / OpenAI)          │
     │  → Extrai dados do CRLV           │
     │  → Preenche formulário auto       │
     │                                   │
     ▼                                   ▼
┌──────────────────────────────┐
│ API: /api/vehicles           │
│                              │
│ 1. Valida placa (unique)     │
│ 2. Valida chassi (unique)    │
│ 3. prisma.vehicle.create()   │
│ 4. Associa ao Client         │
│ 5. Retorna {vehicle}        │
└──────────────────────────────┘
```

---

## 5. Fluxo do Dashboard

```
┌─────────┐   / (Home)         ┌──────────────────────┐
│ Usuário │ ───────────────▶   │ Dashboard Principal  │
└────┬────┘                    │                      │
     │                         │ ┌──────────────────┐ │
     │  GET /api/stats         │ │   STAT CARDS     │ │
     │  → {clients, vehicles,  │ │ Total Clientes   │ │
     │     laudos}             │ │ Total Veículos   │ │
     │                         │ │ Total Laudos     │ │
     │  GET /api/laudos/       │ └──────────────────┘ │
     │  paginated              │                      │
     │  → { laudos[], page,    │ ┌──────────────────┐ │
     │     total }             │ │ FILTROS          │ │
     │                         │ │ • Tipo de laudo  │ │
     │                         │ │ • Cliente        │ │
     │                         │ │ • Data início    │ │
     │                         │ │ • Data fim       │ │
     │                         │ │ • Busca texto    │ │
     │                         │ └──────────────────┘ │
     │                         │                      │
     │                         │ ┌──────────────────┐ │
     │                         │ │ TABELA LAUDOS    │ │
     │                         │ │ • OS, Tipo, Data │ │
     │                         │ │ • Cliente, Placa │ │
     │                         │ │ • Ações: PDF ↓   │ │
     │                         │ │          🗑️ Del   │ │
     │                         │ │ • Paginação      │ │
     │                         │ └──────────────────┘ │
     │                         │                      │
     │                         │ ┌──────────────────┐ │
     │                         │ │ NOTIFICAÇÕES     │ │
     │                         │ │ Equipamentos     │ │
     │                         │ │ vencidos ⚠️      │ │
     │                         │ └──────────────────┘ │
     │                         └──────────────────────┘
```

---

## 6. Fluxo Admin

```
┌─────────┐   /admin           ┌──────────────────────┐
│  Admin  │ ───────────────▶   │ Dashboard Admin      │
│ (role:  │                    │                      │
│  admin) │                    │ ┌──────────────────┐ │
└────┬────┘                    │ │ Métricas globais │ │
     │                         │ └──────────────────┘ │
     │                         │                      │
     ├── /admin/users          │ ┌──────────────────┐ │
     │   CRUD de usuários      │ │ Gestão Usuários  │ │
     │   POST /api/auth/       │ │ • Criar          │ │
     │   register              │ │ • Editar         │ │
     │   PUT /api/admin/       │ │ • Ativar/Desativ │ │
     │   users/[id]            │ └──────────────────┘ │
     │                         │                      │
     ├── /admin/equipments     │ ┌──────────────────┐ │
     │   CRUD equipamentos     │ │ Equipamentos     │ │
     │   GET/POST/PUT/DELETE   │ │ • Decibelímetro  │ │
     │   /api/equipments/*     │ │ • Calibrador     │ │
     │                         │ │ • Alertas ⚠️     │ │
     │                         │ └──────────────────┘ │
     │                         │                      │
     └── /admin (settings)     │ ┌──────────────────┐ │
         GET/PUT /api/admin/   │ │ Config Empresa   │ │
         settings              │ │ • Logo           │ │
                               │ │ • Nome/CNPJ      │ │
                               │ │ • Endereço       │ │
                               │ │ • Título laudo   │ │
                               │ └──────────────────┘ │
                               └──────────────────────┘
```

---

## 7. Fluxo de Upload de Fotos

```
┌─────────────────┐    POST /api/upload     ┌──────────────────┐
│ Formulário      │    multipart/form-data  │ API Upload       │
│ de Laudo        │ ──────────────────────▶ │                  │
│                 │                         │ 1. Formidable    │
│ <input file>    │                         │    parse         │
│                 │                         │ 2. Valida tipo   │
│                 │                         │    (.jpg/.png)   │
│                 │ ◀────────────────────── │ 3. Move para     │
│ Exibe preview   │    {url: "/uploads/..."}│    /public/      │
│ da foto         │                         │    uploads/      │
└─────────────────┘                         │ 4. Retorna URL   │
                                            └──────────────────┘
```

---

## 8. Fluxo de OCR / Processamento de Documento

```
┌─────────────────┐   POST /api/process-document   ┌──────────────────┐
│ VehiclePdfReader│   { file: PDF/imagem }          │ Process Document │
│ ou              │ ──────────────────────────────▶ │ API              │
│ VehicleDocProc. │                                 │                  │
└────────┬────────┘                                 │ Motor 1:         │
         │                                          │ Tesseract.js     │
         │                                          │ → OCR local      │
         │                                          │                  │
         │                                          │ Motor 2:         │
         │                                          │ OpenAI API       │
         │ ◀──────────────────────────────────────  │ → Extração IA    │
         │   { placa, chassi, modelo, ano, ... }    │                  │
         │                                          │ Retorna dados    │
         ▼                                          │ extraídos        │
  Preenche formulário                               └──────────────────┘
  automaticamente
```

---

## 9. Fluxo de Download em Lote (ZIP)

```
┌─────────────┐   Seleciona N laudos    ┌──────────────────┐
│  Dashboard  │ ─────────────────────▶  │ Gera PDFs cada   │
│  Tabela     │   "Download ZIP"        │ laudo selecionado │
│  Laudos     │                         │                  │
└─────────────┘                         │ Archiver cria    │
                                        │ arquivo .zip     │
                    ◀──────────────────  │                  │
                    Binary ZIP stream    │ Stream ao client │
                                        └──────────────────┘
```

---

## 10. Mapa de Navegação (Sidebar)

```
┌─────────────────────────────┐
│         SIDEBAR             │
│                             │
│  🏠 Dashboard       → /    │
│  👥 Clientes        → /clients/create │
│  🚛 Veículos        → /vehicles       │
│  📝 Emitir Laudo    → /emitirlaudo    │
│  📋 Laudos Emitidos → /laudos         │
│  ─────────────────────────  │
│  ⚙️ Admin*          → /admin          │
│  👤 Usuários*       → /admin/users    │
│  🔧 Equipamentos*  → /admin/equipments│
│  ─────────────────────────  │
│  🚪 Logout                  │
│                             │
│  * Visível apenas para admin│
└─────────────────────────────┘
```
