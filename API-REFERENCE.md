# API Reference - Easy Laudos

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Endpoints de Auth](#endpoints-de-auth)
4. [Endpoints de Clientes](#endpoints-de-clientes)
5. [Endpoints de Veículos](#endpoints-de-veículos)
6. [Endpoints de Laudos](#endpoints-de-laudos)
7. [Endpoints de Equipamentos](#endpoints-de-equipamentos)
8. [Endpoints Administrativos](#endpoints-administrativos)
9. [Códigos de Status](#códigos-de-status)
10. [Tratamento de Erros](#tratamento-de-erros)

## 🎯 Visão Geral

### Base URL
```
Development: http://localhost:3000/api
Production: https://easylaudos.com.br/api
```

### Headers Padrão
```http
Content-Type: application/json
Authorization: Bearer {token}
```

### Formato de Resposta
```json
{
  "success": true,
  "data": {},
  "message": "Operação realizada com sucesso"
}
```

### Formato de Erro
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição do erro",
    "details": {}
  }
}
```

## 🔐 Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação. O token deve ser incluído no header `Authorization` de todas as requisições autenticadas.

### Obter Token
```http
POST /api/auth/login
```

### Usar Token
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Expiração
- Tokens expiram em 24 horas
- Renovação automática não implementada
- Necessário novo login após expiração

## 🔑 Endpoints de Auth

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_string",
    "user": {
      "id": "cuid",
      "username": "string",
      "role": "admin|client_a|client_b"
    }
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Usuário ou senha inválidos"
  }
}
```

### Logout
```http
POST /api/auth/logout
```

**Headers Required:**
```http
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

### Get Current User
```http
GET /api/auth/me
```

**Headers Required:**
```http
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "username": "string",
    "role": "admin|client_a|client_b",
    "isActive": true
  }
}
```

## 👥 Endpoints de Clientes

### Listar Clientes
```http
GET /api/clients
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Página atual (default: 1) |
| limit | number | Items por página (default: 10) |
| search | string | Buscar por nome ou CNPJ |
| userId | string | Filtrar por usuário (admin only) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "cnpj": "00.000.000/0000-00",
      "name": "Nome da Empresa",
      "addressStreet": "Rua Exemplo",
      "addressNumber": "123",
      "addressCity": "São Paulo",
      "addressState": "SP",
      "addressZip": "00000-000",
      "phone": "(11) 0000-0000",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

### Criar Cliente
```http
POST /api/clients
```

**Request Body:**
```json
{
  "cnpj": "00.000.000/0000-00",
  "name": "Nome da Empresa",
  "addressStreet": "Rua Exemplo",
  "addressNumber": "123",
  "addressCity": "São Paulo",
  "addressState": "SP",
  "addressZip": "00000-000",
  "addressDistrict": "Centro",
  "phone": "(11) 0000-0000"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "cnpj": "00.000.000/0000-00",
    "name": "Nome da Empresa",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_CNPJ",
    "message": "CNPJ já cadastrado"
  }
}
```

### Atualizar Cliente
```http
PUT /api/clients/{id}
```

**Request Body:**
```json
{
  "name": "Novo Nome",
  "phone": "(11) 9999-9999"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "name": "Novo Nome",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

### Deletar Cliente
```http
DELETE /api/clients/{id}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cliente removido com sucesso"
}
```

## 🚗 Endpoints de Veículos

### Listar Veículos
```http
GET /api/vehicles
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| clientId | string | Filtrar por cliente |
| placa | string | Buscar por placa |
| page | number | Página atual |
| limit | number | Items por página |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "placa": "ABC-1234",
      "especieTipo": "CAMINHÃO",
      "marcaModelo": "SCANIA/R440",
      "numeroChassi": "9BWZZZ377VT004251",
      "anoFabricacaoModelo": "2020/2021",
      "clientId": "cuid",
      "client": {
        "id": "cuid",
        "name": "Nome do Cliente"
      }
    }
  ]
}
```

### Criar Veículo
```http
POST /api/vehicles
```

**Request Body:**
```json
{
  "placa": "ABC-1234",
  "especieTipo": "CAMINHÃO",
  "marcaModelo": "SCANIA/R440",
  "numeroChassi": "9BWZZZ377VT004251",
  "anoFabricacaoModelo": "2020/2021",
  "clientId": "cuid"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "placa": "ABC-1234",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### Processar Documento (OCR)
```http
POST /api/process-document
```

**Request Body (multipart/form-data):**
```
file: [PDF file]
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "placa": "ABC-1234",
    "chassi": "9BWZZZ377VT004251",
    "marcaModelo": "SCANIA/R440",
    "anoFabricacao": "2020/2021",
    "proprietario": "Nome do Proprietário"
  }
}
```

## 📋 Endpoints de Laudos

### Listar Laudos
```http
GET /api/laudos
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| type | string | CHECKLIST, LIT, RUIDO, PINO_REI, QUINTA_RODA |
| clientId | string | Filtrar por cliente |
| vehicleId | string | Filtrar por veículo |
| dateFrom | string | Data inicial (YYYY-MM-DD) |
| dateTo | string | Data final (YYYY-MM-DD) |
| page | number | Página atual |
| limit | number | Items por página |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "ordemServico": "OS-2025-001",
      "dataEmissao": "2025-01-01T00:00:00Z",
      "laudoType": "CHECKLIST",
      "dataVencimento": "2025-12-31",
      "clientId": "cuid",
      "vehicleId": "cuid",
      "client": {
        "name": "Nome do Cliente"
      },
      "vehicle": {
        "placa": "ABC-1234",
        "marcaModelo": "SCANIA/R440"
      }
    }
  ]
}
```

### Criar Laudo Checklist
```http
POST /api/laudos/checklist
```

**Request Body:**
```json
{
  "ordemServico": "OS-2025-001",
  "dataEmissao": "2025-01-01T00:00:00Z",
  "clientId": "cuid",
  "vehicleId": "cuid",
  "checklist": {
    "item1": true,
    "item2": false,
    "item3": true
  },
  "observacoes": "Observações gerais",
  "resultado": "APROVADO"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "ordemServico": "OS-2025-001",
    "pdfUrl": "/api/laudos/pdf/cuid"
  }
}
```

### Criar Laudo de Ruído
```http
POST /api/laudos/ruido
```

**Request Body:**
```json
{
  "ordemServico": "OS-2025-002",
  "dataEmissao": "2025-01-01T00:00:00Z",
  "clientId": "cuid",
  "vehicleId": "cuid",
  "equipmentId": "cuid",
  "aceleracao": [85.2, 86.1, 85.5, 85.8, 86.0, 85.3],
  "marchaLenta": [72.1, 71.8, 72.3, 72.0, 71.9, 72.2],
  "inspetorResponsavel": "Nome do Inspetor"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "ordemServico": "OS-2025-002",
    "medianaAceleracao": 85.65,
    "maxAceleracao": 86.1,
    "medianaMarchaLenta": 72.05,
    "maxMarchaLenta": 72.3,
    "resultado": "APROVADO",
    "pdfUrl": "/api/laudos/pdf/cuid"
  }
}
```

### Criar Laudo Pino Rei
```http
POST /api/laudos/pino-rei
```

**Request Body:**
```json
{
  "ordemServico": "OS-2025-003",
  "dataEmissao": "2025-01-01T00:00:00Z",
  "clientId": "cuid",
  "vehicleId": "cuid",
  "equipmentId": "cuid",
  "dataValidadeInspecao": "31/12/2025",
  "posicaoVertical": true,
  "presencaTrincas": false,
  "integridadeFixacao": true,
  "seloIdentificacao": true,
  "tipoFixacaoPino": "SOLDA",
  "diametroRegistrado": 2.0,
  "estadoConservacao": true,
  "tipoFixacaoMesa": "APARAFUSADA",
  "mesaBemFixada": true,
  "mesaReparoSolda": false,
  "ensaioComplementar": false,
  "inspetorResponsavel": "Nome do Inspetor"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "ordemServico": "OS-2025-003",
    "resultadoPinoRei": "APROVADO",
    "resultadoMesa": "APROVADO",
    "resultadoGeral": "APROVADO",
    "pdfUrl": "/api/laudos/pdf/cuid"
  }
}
```

### Criar Laudo Quinta Roda
```http
POST /api/laudos/quinta-roda
```

**Request Body:**
```json
{
  "ordemServico": "OS-2025-004",
  "dataEmissao": "2025-01-01T00:00:00Z",
  "clientId": "cuid",
  "vehicleId": "cuid",
  "equipmentId": "cuid",
  "dataValidadeInspecao": "31/12/2025",
  "fabricanteMarca": "JOST",
  "modelo": "JSK37",
  "numeroIdentificacao": "123456",
  "seloIdentificacao": true,
  "presencaTrincas": false,
  "integraFixada": true,
  "pinosIntegros": true,
  "mancaisOvalados": false,
  "mecanismoTravamento": true,
  "pinosPressos": true,
  "desgastesCanais": false,
  "apoiosSapatas": false,
  "cantoneirasFixadas": true,
  "aterramentoFixado": true,
  "ensaioComplementar": false,
  "inspetorResponsavel": "Nome do Inspetor"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "ordemServico": "OS-2025-004",
    "resultadoFinal": "APROVADO",
    "pdfUrl": "/api/laudos/pdf/cuid"
  }
}
```

### Obter PDF do Laudo
```http
GET /api/laudos/pdf/{laudoId}
```

**Response (200):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="laudo-OS-2025-001.pdf"
[Binary PDF data]
```

### Deletar Laudo
```http
DELETE /api/laudos/{id}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Laudo removido com sucesso"
}
```

### Obter Próxima OS
```http
GET /api/laudos/next-os
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "nextOrdemServico": "OS-2025-042"
  }
}
```

### Obter Código Temporal
```http
GET /api/temporal-code
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "code": "TMP-20250101-1234"
  }
}
```

## 🔧 Endpoints de Equipamentos

### Listar Equipamentos
```http
GET /api/equipments
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| type | string | DECIBELIMETRO, CALIBRADOR, OUTROS |
| isActive | boolean | Filtrar ativos/inativos |
| expired | boolean | Filtrar vencidos |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "name": "AKSO",
      "model": "AK824",
      "certificateNumber": "AKSO AK824 107420/24",
      "calibrationDate": "2024-07-17T00:00:00Z",
      "expirationDate": "2025-07-17T00:00:00Z",
      "equipmentType": "DECIBELIMETRO",
      "isActive": true,
      "daysUntilExpiration": 180
    }
  ]
}
```

### Criar Equipamento
```http
POST /api/equipments
```

**Request Body:**
```json
{
  "name": "AKSO",
  "model": "AK824",
  "certificateNumber": "AKSO AK824 107420/24",
  "calibrationDate": "2024-07-17",
  "expirationDate": "2025-07-17",
  "equipmentType": "DECIBELIMETRO"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "name": "AKSO",
    "certificateNumber": "AKSO AK824 107420/24"
  }
}
```

### Atualizar Equipamento
```http
PUT /api/equipments/{id}
```

**Request Body:**
```json
{
  "calibrationDate": "2025-07-17",
  "expirationDate": "2026-07-17",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

### Notificações de Vencimento
```http
GET /api/equipments/notifications
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "expired": [
      {
        "id": "cuid",
        "name": "Equipamento Vencido",
        "expirationDate": "2024-12-31",
        "daysExpired": 1
      }
    ],
    "expiringSoon": [
      {
        "id": "cuid",
        "name": "Equipamento Próximo",
        "expirationDate": "2025-01-30",
        "daysUntilExpiration": 29
      }
    ]
  }
}
```

## 👤 Endpoints Administrativos

### Configurações da Empresa
```http
GET /api/admin/settings
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "companyName": "Nome da Empresa",
    "companyTaxId": "00.000.000/0000-00",
    "companyAddress": "Endereço Completo",
    "companyPhone": "(11) 0000-0000",
    "companyLogoUrl": "/uploads/logo.png",
    "reportTitle": "LAUDO DE INSPEÇÃO TÉCNICA"
  }
}
```

### Atualizar Configurações
```http
PUT /api/admin/settings
```

**Request Body:**
```json
{
  "companyName": "Novo Nome",
  "companyPhone": "(11) 9999-9999",
  "reportTitle": "LAUDO TÉCNICO"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

### Listar Usuários (Admin)
```http
GET /api/admin/users
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "username": "admin",
      "role": "admin",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Criar Usuário (Admin)
```http
POST /api/admin/users
```

**Request Body:**
```json
{
  "username": "novo_usuario",
  "password": "senha123",
  "role": "client_a"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "username": "novo_usuario",
    "role": "client_a"
  }
}
```

### Atualizar Usuário (Admin)
```http
PUT /api/admin/users/{id}
```

**Request Body:**
```json
{
  "password": "nova_senha",
  "isActive": false
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

### Estatísticas do Sistema
```http
GET /api/stats
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "clients": 150,
    "vehicles": 320,
    "laudos": 1250,
    "laudosByType": {
      "CHECKLIST": 450,
      "LIT": 300,
      "RUIDO": 200,
      "PINO_REI": 150,
      "QUINTA_RODA": 150
    },
    "laudosThisMonth": 85,
    "approvalRate": 0.92
  }
}
```

### Health Check
```http
GET /api/health
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "uptime": 86400,
    "version": "1.0.0"
  }
}
```

## 📎 Upload de Arquivos

### Upload de Imagem
```http
POST /api/upload
```

**Request Body (multipart/form-data):**
```
file: [Image file (JPG, PNG)]
type: "vehicle" | "logo" | "document"
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/1234567890-image.jpg",
    "filename": "image.jpg",
    "size": 1024000
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Arquivo excede o tamanho máximo de 5MB"
  }
}
```

## 📊 Códigos de Status

| Status | Descrição |
|--------|-----------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado com sucesso |
| 204 | No Content - Requisição bem-sucedida sem conteúdo |
| 400 | Bad Request - Requisição inválida |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito (ex: duplicado) |
| 422 | Unprocessable Entity - Validação falhou |
| 500 | Internal Server Error - Erro no servidor |

## 🚨 Tratamento de Erros

### Códigos de Erro Comuns

| Código | Descrição |
|--------|-----------|
| INVALID_CREDENTIALS | Credenciais inválidas |
| TOKEN_EXPIRED | Token JWT expirado |
| TOKEN_INVALID | Token JWT inválido |
| UNAUTHORIZED | Não autorizado |
| FORBIDDEN | Acesso negado |
| NOT_FOUND | Recurso não encontrado |
| DUPLICATE_ENTRY | Entrada duplicada |
| VALIDATION_ERROR | Erro de validação |
| FILE_TOO_LARGE | Arquivo muito grande |
| INVALID_FILE_TYPE | Tipo de arquivo inválido |
| DATABASE_ERROR | Erro no banco de dados |
| INTERNAL_ERROR | Erro interno do servidor |

### Exemplo de Tratamento de Erro

```javascript
// Cliente JavaScript
try {
  const response = await fetch('/api/laudos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  
  if (!result.success) {
    switch(result.error.code) {
      case 'TOKEN_EXPIRED':
        // Redirecionar para login
        window.location.href = '/login';
        break;
      case 'VALIDATION_ERROR':
        // Mostrar erros de validação
        showValidationErrors(result.error.details);
        break;
      default:
        // Mostrar erro genérico
        alert(result.error.message);
    }
  }
} catch (error) {
  console.error('Erro na requisição:', error);
}
```

### Rate Limiting

O sistema implementa rate limiting básico:
- 100 requisições por minuto por IP
- 1000 requisições por hora por usuário autenticado

Quando o limite é excedido:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Limite de requisições excedido",
    "retryAfter": 60
  }
}
```

## 🔄 Paginação

Endpoints que retornam listas suportam paginação:

**Query Parameters:**
- `page`: Número da página (default: 1)
- `limit`: Items por página (default: 10, max: 100)

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "total": 500,
    "page": 1,
    "limit": 10,
    "pages": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🔍 Busca e Filtros

Endpoints que suportam busca aceitam o parâmetro `search`:

```http
GET /api/clients?search=empresa
GET /api/vehicles?search=ABC-1234
GET /api/laudos?search=OS-2025
```

Filtros múltiplos podem ser combinados:

```http
GET /api/laudos?type=CHECKLIST&clientId=cuid&dateFrom=2025-01-01&dateTo=2025-12-31
```

## 📝 Exemplos de Uso

### Fluxo Completo de Criação de Laudo

```javascript
// 1. Autenticar
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'inspetor',
    password: 'senha123'
  })
});

const { data: { token } } = await loginResponse.json();

// 2. Buscar cliente
const clientsResponse = await fetch('/api/clients?search=Empresa', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data: clients } = await clientsResponse.json();
const clientId = clients[0].id;

// 3. Buscar veículo
const vehiclesResponse = await fetch(`/api/vehicles?clientId=${clientId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data: vehicles } = await vehiclesResponse.json();
const vehicleId = vehicles[0].id;

// 4. Upload de imagem
const formData = new FormData();
formData.append('file', imageFile);
formData.append('type', 'vehicle');

const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const { data: { url: imageUrl } } = await uploadResponse.json();

// 5. Criar laudo
const laudoResponse = await fetch('/api/laudos/checklist', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    ordemServico: 'OS-2025-001',
    dataEmissao: new Date().toISOString(),
    clientId,
    vehicleId,
    fotoDianteiraUrl: imageUrl,
    checklist: {
      item1: true,
      item2: true
    },
    resultado: 'APROVADO'
  })
});

const { data: laudo } = await laudoResponse.json();

// 6. Baixar PDF
window.open(`/api/laudos/pdf/${laudo.id}`, '_blank');
```

---

**Documento atualizado em**: Setembro 2025  
**Versão da API**: 1.0.0  
**Mantido por**: Equipe de Desenvolvimento Easy Laudos