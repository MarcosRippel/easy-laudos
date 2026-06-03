# 📡 API Reference - Easy Laudos

> 32 Endpoints REST via Next.js API Routes

---

## Autenticação

Todos os endpoints (exceto auth/login) requerem cookie `gts_session` válido.

---

## 1. Auth (`/api/auth/`)

| Método | Endpoint | Descrição | Body |
|--------|----------|-----------|------|
| POST | `/api/auth/login` | Login do usuário | `{username, password}` |
| POST | `/api/auth/logout` | Logout (limpa cookie) | - |
| GET | `/api/auth/me` | Retorna usuário logado | - |
| POST | `/api/auth/register` | Registrar novo usuário (admin only) | `{username, password, role}` |

**Cookie**: `gts_session` → JSON `{userId, username, role, loginTime}` com `maxAge: 8h`

---

## 2. Clients (`/api/clients/`)

| Método | Endpoint | Descrição | Body |
|--------|----------|-----------|------|
| GET | `/api/clients` | Lista clientes do usuário | - |
| POST | `/api/clients` | Criar novo cliente | `{cnpj, name, address*, phone}` |

**Multi-tenancy**: Filtra por `userId` automaticamente.
**Unique**: `@@unique([cnpj, userId])`

---

## 3. Vehicles (`/api/vehicles/`)

| Método | Endpoint | Descrição | Body |
|--------|----------|-----------|------|
| GET | `/api/vehicles` | Lista veículos | - |
| POST | `/api/vehicles` | Criar veículo | `{placa, numeroChassi, marcaModelo, anoFabricacaoModelo, especieTipo, clientId}` |

**Unique**: `placa`, `numeroChassi` (global)

---

## 4. Laudos (`/api/laudos/`)

### CRUD Base
| Método | Endpoint | Descrição | Body |
|--------|----------|-----------|------|
| GET | `/api/laudos` | Lista todos os laudos | Query: `?type=ruido` |
| POST | `/api/laudos` | Criar laudo base | `{clientId, vehicleId, ordemServico, dataEmissao, laudoType, ...}` |
| GET | `/api/laudos/[id]` | Buscar laudo por ID | - |
| DELETE | `/api/laudos/[id]` | Deletar laudo | - |

### Paginação & Filtros
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/laudos/paginated` | Paginação com filtros (type, clientId, date, search) |
| GET | `/api/laudos/latest` | Últimos laudos emitidos |
| GET | `/api/laudos/next-os` | Próximo número de OS disponível |

### Laudo de Ruído
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/laudos/ruido` | Criar laudo de ruído (12 medições + equipamento) |
| GET | `/api/laudos/ruido/[id]` | Buscar laudo de ruído por ID |

### Laudo de Pino Rei
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/laudos/pino-rei` | Criar laudo de pino rei (visual + mesa + ensaios) |
| GET | `/api/laudos/pino-rei/[id]` | Buscar laudo de pino rei |
| POST | `/api/laudos/pino-rei/pdf` | Gerar PDF do laudo de pino rei |

### Laudo de Quinta Roda
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/laudos/quinta-roda` | Criar laudo de quinta roda (12 itens visuais) |
| GET | `/api/laudos/quinta-roda/[id]` | Buscar laudo de quinta roda |
| POST | `/api/laudos/quinta-roda/pdf` | Gerar PDF da quinta roda |

### Checklist
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/laudos/checklist` | Criar checklist de inspeção |

### PDF
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/laudos/pdf` | Gerar PDF (aceita laudoType para routing) |

---

## 5. Equipments (`/api/equipments/`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/equipments` | Lista equipamentos (por userId) |
| POST | `/api/equipments` | Criar equipamento |
| GET | `/api/equipments/[id]` | Buscar equipamento |
| PUT | `/api/equipments/[id]` | Atualizar equipamento |
| DELETE | `/api/equipments/[id]` | Deletar equipamento |
| GET | `/api/equipments/notifications` | Alertas de calibração vencida |

---

## 6. Admin (`/api/admin/`)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/admin/settings` | Config da empresa | admin |
| PUT | `/api/admin/settings` | Atualizar config | admin |
| GET | `/api/admin/users` | Listar usuários | admin |
| POST | `/api/admin/users` | Criar usuário | admin |
| GET | `/api/admin/users/[id]` | Buscar usuário | admin |
| PUT | `/api/admin/users/[id]` | Atualizar usuário | admin |
| DELETE | `/api/admin/users/[id]` | Deletar usuário | admin |

---

## 7. Outros

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/upload` | Upload de imagens (multipart) |
| POST | `/api/process-document` | OCR de documentos (Tesseract/OpenAI) |
| GET | `/api/stats` | Métricas (total clients, vehicles, laudos) |
| GET | `/api/temporal-code` | Código temporal para autenticação |
| GET | `/api/health` | Health check do sistema |
