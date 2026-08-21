# 🧩 Componentes React - Easy Laudos

## 1. Hierarquia de Componentes

```
RootLayout (app/layout.tsx)
└── AuthWrapper (components/auth/AuthWrapper.tsx)
    ├── LoginPage (app/login/page.tsx)           [Rota pública, SEM layout]
    └── MainLayout (components/layout/MainLayout.tsx)   [Rotas protegidas]
        ├── Sidebar (nav lateral com links)
        ├── Header (título + user info)
        └── {children}
            ├── Home/Dashboard (app/page.tsx)
            │   ├── StatCard (inline)
            │   └── EquipmentNotifications
            ├── ClientCreate (app/clients/create/page.tsx)
            │   └── ClientForm (components/clients/)
            ├── VehiclesPage (app/vehicles/page.tsx)
            │   ├── VehicleForm
            │   ├── VehicleDocumentProcessor
            │   └── VehiclePdfReader
            ├── EmitirLaudo (app/emitirlaudo/page.tsx)
            ├── LaudosPage (app/laudos/page.tsx)
            ├── LaudoCreate (app/laudos/create/page.tsx)
            │   └── CreateLaudoForm (LIT)
            ├── LaudoChecklist (app/laudos/checklist/page.tsx)
            │   └── ChecklistForm
            ├── LaudoPinoRei (app/laudos/pino-rei/page.tsx)
            │   └── PinoReiForm
            ├── LaudoQuintaRoda (app/laudos/quinta-roda/page.tsx)
            │   └── QuintaRodaForm
            ├── AdminPage (app/admin/page.tsx)
            │   └── AdminDashboard, SettingsForm
            ├── AdminUsers (app/admin/users/page.tsx)
            └── AdminEquipments (app/admin/equipments/page.tsx)
```

---

## 2. Componentes Core

### AuthWrapper (`components/auth/AuthWrapper.tsx`)
- **Tipo**: Context Provider (Client Component)
- **Responsabilidade**: Gerencia autenticação global
- **Exporta**: `useAuth()` hook
- **Lógica**:
  - Verifica sessão via `GET /api/auth/me`
  - Redireciona para `/login` se não autenticado
  - Redireciona admin para `/admin`, inspetor para `/`
  - Wraps children em `MainLayout` (exceto `/login`)

### MainLayout (`components/layout/MainLayout.tsx`)
- **Tipo**: Layout Component (Client Component)
- **Tamanho**: 292 linhas / 12KB
- **Responsabilidade**: Sidebar + Header + Content area
- **Features**:
  - Sidebar com navegação
  - Ícones SVG inline
  - Itens condicionais por role (admin-only)
  - Active state baseado em `usePathname()`
  - Logout via `useAuth().logout()`

---

## 3. Formulários de Laudo

| Componente | Arquivo | Tamanho | Descrição |
|-----------|---------|---------|-----------|
| **ChecklistForm** | `components/laudos/ChecklistForm.tsx` | 135KB | Formulário mais complexo. Checklist com dezenas de itens de verificação, fotos, observações |
| **CreateLaudoForm** | `components/laudos/CreateLaudoForm.tsx` | 46KB | LIT - Laudo de Inspeção Técnica geral |
| **PinoReiForm** | `components/laudos/PinoReiForm.tsx` | 38KB | Inspeção de pino rei + mesa + ensaios complementares |
| **QuintaRodaForm** | `components/laudos/QuintaRodaForm.tsx` | 32KB | 12 itens de exame visual + 3 fotos |
| **RuidoForm** | `components/laudos/RuidoForm.tsx` | 29KB | 12 medições dB + seleção de equipamento + resultado |

### Padrão dos Formulários
Todos seguem a mesma estrutura:
1. **Step 1**: Seleção de cliente (dropdown com busca, opção de criar)
2. **Step 2**: Seleção de veículo (dropdown por cliente, opção de criar)
3. **Step 3**: Dados técnicos específicos do tipo de laudo
4. **Step 4**: Upload de fotos (até 3)
5. **Step 5**: Submissão e geração do PDF
6. CSS Module correspondente para estilização

---

## 4. Componentes de Veículos

| Componente | Descrição |
|-----------|-----------|
| **VehicleForm** | Formulário de cadastro manual de veículo |
| **VehicleDocumentProcessor** | Processamento IA de doc veicular (~7KB) |
| **VehiclePdfReader** | Leitura de PDF/imagem via OCR (~3.3KB) |

---

## 5. Outros Componentes

| Componente | Diretório | Descrição |
|-----------|-----------|-----------|
| **EquipmentNotifications** | `equipments/` | Alertas de calibração vencida (badge amarelo/vermelho) |
| **ClientForm** | `clients/` | Formulário de cadastro de cliente |
| **AdminDashboard** | `admin/` | Painel admin com métricas e configurações |

---

## 6. Padrão de Estilização

```
Cada componente usa CSS Modules:
ComponentName.tsx  → lógica e JSX
ComponentName.module.css → estilos isolados

Referência no código:
  import styles from './ComponentName.module.css';
  <div className={styles.container}>
```

Combinação com Tailwind CSS 4 para utilitários globais em `globals.css`.
