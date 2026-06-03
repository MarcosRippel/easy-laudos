# 🔐 Autenticação e Segurança - Easy Laudos

## 1. Visão Geral do Sistema de Auth

O Easy Laudos usa **autenticação baseada em cookie de sessão** (sem JWT). A sessão dura **8 horas** e é armazenada no cookie `gts_session`.

---

## 2. Fluxo de Autenticação

### 2.1 Login
```
Navegador                         Servidor
   │                                 │
   │  POST /api/auth/login           │
   │  {username, password}           │
   │ ──────────────────────────────▶ │
   │                                 │ 1. Busca user by username
   │                                 │ 2. hashPassword(password)
   │                                 │    = SHA-256(password + salt)
   │                                 │ 3. Compara com DB
   │                                 │ 4. Se OK: Set-Cookie:
   │                                 │    gts_session = JSON{
   │  Set-Cookie: gts_session        │      userId, username,
   │  200 {user}                     │      role, loginTime
   │ ◀────────────────────────────── │    }
   │                                 │    HttpOnly, Path=/,
   │                                 │    SameSite=Lax
   │                                 │    maxAge=28800 (8h)
```

### 2.2 Verificação de Sessão
```
Em CADA navegação de página:
  AuthWrapper → useEffect → GET /api/auth/me
    → Servidor lê cookie gts_session
    → Verifica se loginTime + 8h > now
    → Se válido: retorna {user}
    → Se inválido: retorna 401
```

### 2.3 Logout
```
POST /api/auth/logout
  → Servidor limpa cookie gts_session (maxAge=0)
  → Client redireciona para /login
```

---

## 3. Hashing de Senhas

**Arquivo**: `lib/auth.ts`

```typescript
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256')
    .update(password + (process.env.AUTH_SALT || 'gts-salt'))
    .digest('hex');
}
```

- **Algoritmo**: SHA-256
- **Salt**: Variável de ambiente `AUTH_SALT` (fallback: `'gts-salt'`)
- **Armazenamento**: Hash hex no campo `password` da tabela `User`

---

## 4. Middleware de Autenticação

**Arquivo**: `lib/middleware-auth.ts`

```typescript
function getSessionFromRequest(request: NextRequest): AuthUser | null {
  // 1. Lê cookie 'gts_session'
  // 2. Parse JSON
  // 3. Verifica expiração (8h)
  // 4. Retorna { id, username, role } ou null
}

function requireAuth(user: AuthUser | null): boolean   // != null
function requireAdmin(user: AuthUser | null): boolean   // role === 'admin'
function requireClientUser(user: AuthUser | null): boolean // role === 'client_a' || 'client_b'
```

---

## 5. Roles e Permissões

| Role | Dashboard | Laudos | Clientes | Veículos | Admin | Equipamentos | Usuários |
|------|-----------|--------|----------|----------|-------|-------------|----------|
| **admin** | ✅ | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ | ✅ CRUD | ✅ CRUD |
| **client_a** | ✅ | ✅ (próprios) | ✅ (próprios) | ✅ (próprios) | ❌ | ✅ (próprios) | ❌ |
| **client_b** | ✅ | ✅ (próprios) | ✅ (próprios) | ✅ (próprios) | ❌ | ✅ (próprios) | ❌ |

---

## 6. Multi-Tenancy

### Modelo de Isolamento
O isolamento de dados é feito via coluna `userId` nas tabelas:
- `Client` → `userId` (null = admin)
- `Equipment` → `userId` (null = admin)
- `AdminSetting` → `userId` (null = admin)

### Regras
- **admin**: Vê dados com `userId = null` (dados globais)
- **client_a/client_b**: Vê apenas dados com seu `userId`
- `Vehicle` é linkado via `clientId`, herdando o isolamento
- `Laudo` é linkado via `clientId` e `vehicleId`

### Constraint Importante
```prisma
@@unique([cnpj, userId])           // Client: mesmo CNPJ em tenants diferentes OK
@@unique([certificateNumber, userId]) // Equipment: mesmo certificado em tenants diferentes OK
```

---

## 7. Proteção de Rotas

### Frontend (AuthWrapper)
```
Rotas Públicas: ['/login']
Tudo o mais → Requer gts_session válido
  Se não autenticado → redirect /login
  Se autenticado + pathname==='/login':
    Se admin → redirect /admin
    Se cliente → redirect /
```

### Backend (API Routes)
Cada API route que precisa de auth faz:
```typescript
const session = getSessionFromRequest(request);
if (!session) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
```

---

## 8. Pontos de Atenção de Segurança

| Item | Status | Nota |
|------|--------|------|
| HTTPS | ✅ | Via Cloudflare Tunnel ou scripts SSL locais |
| Cookie HttpOnly | ✅ | gts_session tem HttpOnly |
| Cookie SameSite | ✅ | SameSite=Lax |
| Hash de senhas | ⚠️ | SHA-256 simples (considerar bcrypt/argon2) |
| Rate limiting | ❌ | Não implementado |
| CSRF | ⚠️ | Parcial via SameSite=Lax |
| Input validation | ⚠️ | Básica, sem Zod/Yup |
