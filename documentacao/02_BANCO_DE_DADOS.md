# 🗄️ Banco de Dados - Easy Laudos

## 1. Visão Geral

- **ORM**: Prisma 6.9.0
- **Database**: SQLite 3.x (`prisma/dev.db`, ~925KB)
- **Schema**: `prisma/schema.prisma` (292 linhas)
- **Migrations**: 8 migrations versionadas

---

## 2. Diagrama de Entidades (ER)

```
┌──────────────┐      ┌──────────────┐      ┌──────────────────┐
│     User     │──1:N─│    Client    │──1:N─│     Vehicle      │
│              │      │              │      │                  │
│ id           │      │ id           │      │ id               │
│ username (U) │      │ cnpj         │      │ placa (U)        │
│ password     │      │ name         │      │ numeroChassi (U) │
│ role         │      │ address*     │      │ marcaModelo      │
│ isActive     │      │ phone        │      │ anoFabModelo     │
└──────┬───────┘      │ userId (FK)  │      │ especieTipo      │
       │              └──────┬───────┘      │ clientId (FK)    │
       │                     │              └────────┬─────────┘
       │                     │                       │
       │              ┌──────┴────────────────┐      │
       │              │        Laudo          │◄─────┘
       │              │                       │
       │              │ id                    │
       │              │ ordemServico (U)      │
       │              │ codTemporal           │
       │              │ dataEmissao           │
       │              │ laudoType             │──────────────────────┐
       │              │ clientId (FK)         │                      │
       │              │ vehicleId (FK)        │                      │
       │              │ fabricanteEquipamento │                      │
       │              │ diametroPinoRei       │                      │
       │              │ fotos (3 URLs)        │                      │
       │              │ observacoes           │                      │
       │              │ dataVencimento        │                      │
       │              └───┬─────┬─────┬───────┘                      │
       │                  │     │     │                               │
       │           ┌──────┘     │     └──────┐                       │
       │           ▼            ▼            ▼                       │
       │    ┌────────────┐ ┌──────────┐ ┌──────────────┐            │
       │    │ LaudoRuido │ │LaudoPino │ │LaudoQuintaR. │            │
       │    │            │ │   Rei    │ │              │            │
       │    │ 6 acel. dB │ │ visual   │ │ 12 itens     │            │
       │    │ 6 m.lenta  │ │ pino     │ │ visual       │            │
       │    │ medianas   │ │ mesa     │ │ resultado    │            │
       │    │ resultado  │ │ ensaios  │ │ 3 fotos      │            │
       │    │ inspetor   │ │ 3 fotos  │ │ inspetor     │            │
       │    │ equipId FK │ │ equipId  │ │ equipId FK   │            │
       │    └────────────┘ └──────────┘ └──────────────┘            │
       │                                                             │
       │         ┌──────────────┐      ┌────────────────┐           │
       ├──1:N───│ AdminSetting │      │   Equipment    │◄──────────┘
       │         │              │      │                │ (FK from Laudos)
       │         │ companyName  │      │ id             │
       │         │ companyTaxId │      │ name           │
       │         │ companyLogo  │      │ model          │
       │         │ reportTitle  │      │ certNumber(U)  │
       │         │ userId (FK)  │      │ calibDate      │
       │         └──────────────┘      │ expireDate     │
       │                               │ equipmentType  │
       └──1:N──────────────────────────│ isActive       │
                                       │ userId (FK)    │
                                       └────────────────┘
```

**Legenda**: `(U)` = Unique, `(FK)` = Foreign Key, `1:N` = Um para Muitos

---

## 3. Modelos Detalhados

### 3.1 User
| Campo | Tipo | Constraint | Descrição |
|-------|------|-----------|-----------|
| id | String | PK, CUID | Identificador |
| username | String | UNIQUE | Nome de login |
| password | String | - | Hash SHA-256 |
| role | String | - | `admin` \| `client_a` \| `client_b` |
| isActive | Boolean | default: true | Status ativo |

### 3.2 Client
| Campo | Tipo | Constraint | Descrição |
|-------|------|-----------|-----------|
| id | String | PK, CUID | Identificador |
| cnpj | String | @@unique com userId | CNPJ da empresa |
| name | String | - | Razão social |
| address* | String? | - | Rua, Número, Cidade, Estado, CEP, Bairro |
| phone | String? | - | Telefone |
| userId | String? | FK → User | Multi-tenancy (null = admin) |

### 3.3 Vehicle
| Campo | Tipo | Constraint | Descrição |
|-------|------|-----------|-----------|
| id | String | PK, CUID | Identificador |
| placa | String | UNIQUE | Placa do veículo |
| numeroChassi | String | UNIQUE | Chassi |
| marcaModelo | String? | - | Ex: "Scania G 440" |
| anoFabricacaoModelo | String? | - | "2020/2021" |
| especieTipo | String? | - | Tipo do veículo |
| clientId | String | FK → Client | Proprietário |

### 3.4 Laudo (Base)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| laudoType | String | `checklist` \| `lit` \| `ruido` \| `pino-rei` \| `quinta-roda` |
| ordemServico | String (UNIQUE) | Número sequencial (ex: "OS-2024-001") |
| dataEmissao | DateTime | Data de emissão |
| codTemporal | String? | Código para autenticação do laudo |
| fotos | 3× String? | fotoDianteiraUrl, fotoTraseiraUrl, fotoChassiUrl |

### 3.5 LaudoRuido
- **6 medições de aceleração** e **6 de marcha lenta** (Decimal, 0-120 dB)
- Cálculos automáticos: mediana e máximo
- Resultado: "APROVADO" | "REPROVADO"
- Referência ao `Equipment` (decibelímetro)

### 3.6 LaudoPinoRei
- Exame visual do pino: 7 booleans + enum `TipoFixacaoPino`
- Inspeção da mesa: 3 booleans + enum `TipoFixacaoMesa`
- Ensaios complementares
- 3 fotos (chassi, pino rei, mesa)
- Resultado por seção + geral (`ResultadoInspecao` enum)

### 3.7 LaudoQuintaRoda
- **12 itens de exame visual** (Boolean)
- Dados da quinta roda: fabricante, modelo, número de identificação
- 3 fotos
- Resultado final (`ResultadoInspecao` enum)

### 3.8 Equipment
| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | String | Nome (ex: "AKSO") |
| model | String | Modelo (ex: "AK824") |
| certificateNumber | String | Número do certificado |
| calibrationDate | DateTime | Data de calibração |
| expirationDate | DateTime | Data de vencimento |
| equipmentType | String | `DECIBELIMETRO` \| `CALIBRADOR` \| `OUTROS` |

### 3.9 AdminSetting
- Configurações da empresa (nome, CNPJ, logo, endereço)
- Título do relatório
- Isolado por `userId`

---

## 4. Enums

```prisma
enum TipoFixacaoPino {  SOLDA | FLANGEADO | APARAFUSADA  }
enum TipoFixacaoMesa {  SOLDA | APARAFUSADA  }
enum ResultadoInspecao { APROVADO | REPROVADO  }
```

---

## 5. Constraints Importantes

| Constraint | Tabela | Descrição |
|-----------|--------|-----------|
| `@@unique([cnpj, userId])` | Client | CNPJ único por usuário |
| `@@unique([certificateNumber, userId])` | Equipment | Certificado único por usuário |
| `@unique placa` | Vehicle | Placa única global |
| `@unique numeroChassi` | Vehicle | Chassi único global |
| `@unique ordemServico` | Laudo | OS única global |
| `@unique laudoId` | LaudoRuido/PinoRei/QuintaRoda | 1:1 com Laudo |
