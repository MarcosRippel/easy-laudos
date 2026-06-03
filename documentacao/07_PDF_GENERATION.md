# 📄 Geração de PDFs - Easy Laudos

## 1. Visão Geral

O sistema gera **5 tipos de laudos em PDF** profissional usando dois engines:

| Engine | Uso | Descrição |
|--------|-----|-----------|
| **Puppeteer** | Primário | Renderiza HTML→PDF com fidelidade total (CSS, imagens, SVG) |
| **pdf-lib** | Auxiliar | Manipulação programática de PDFs existentes |

**Arquivo principal**: `app/api/laudos/pdf/route.ts` (1451 linhas, 62KB)

---

## 2. Arquitetura de Geração

```
POST /api/laudos/pdf
   │
   ├── Body: { laudoId, laudoType, adminSettings? }
   │
   ▼
┌───────────────────────────────────────────┐
│            POST Handler                    │
│                                           │
│  1. Identifica tipo do laudo              │
│  2. Busca dados completos (Prisma joins)  │
│  3. Busca AdminSettings (logo, empresa)   │
│  4. Roteamento por tipo:                  │
│     ├── 'ruido'      → generateRuidoPDF() │
│     ├── 'checklist'  → generateChecklistHTML() │
│     ├── 'pino-rei'   → Gerado via /api/laudos/pino-rei/pdf │
│     └── 'quinta-roda' → Gerado via /api/laudos/quinta-roda/pdf │
│                                           │
│  5. Puppeteer:                            │
│     a. puppeteer.launch({headless: true}) │
│     b. page.setContent(html)              │
│     c. page.pdf({ format: 'A4' })         │
│     d. browser.close()                    │
│                                           │
│  6. Return: Binary PDF stream             │
└───────────────────────────────────────────┘
```

---

## 3. Funções por Tipo de Laudo

### 3.1 `generateRuidoPDF(laudoId, adminSettings, qrCodeSvg, documentHash)`
- **Linhas**: 12-238
- **Template**: `templates/laudo-ruido-template.html` (placeholders `{{companyName}}`, `{{companyAddress}}`, `{{companyPhone}}`, etc.)
- **Dados**: 12 medições dB (6 aceleração + 6 marcha lenta)
- **Logo**: Lido via `readFileSync` do filesystem, fallback HTTP na porta 3006
- **Cálculos**:
  - `toNumber(value)`: Converte Prisma Decimal → number
  - `calculateMedian(values)`: Mediana das 6 medições
  - `calculateChartCoordinates(value)`: Posição SVG para gráfico
- **Output**: HTML com tabela de medições + gráfico SVG com barras + QR Code + Hash

### 3.2 `generateChecklistHTML(fullLaudo, adminSettings)`
- **Linhas**: 240-1314 (maior função, ~1074 linhas)
- **Dados**: Dezenas de itens de verificação, fotos, observações
- **Helpers**:
  - `mapMedicaoValue(value, defaultType)`: Mapeamento de valores
  - `processImageUrl(url)`: Converte imagem para Base64 (inline no PDF)
  - `renderCheckbox(value)`: Renderiza checkbox visual
  - `renderField(label, field)`: Campo de dados
  - `renderTextField(label, field)`: Campo de texto
- **Output**: HTML extenso com layout tabulado profissional

### 3.3 Pino Rei (`/api/laudos/pino-rei/pdf/route.ts`)
- Endpoint separado
- Seções: Visual do Pino + Mesa + Ensaios + Fotos

### 3.4 Quinta Roda (`/api/laudos/quinta-roda/pdf/route.ts`)
- Endpoint separado
- 12 itens de verificação + 3 fotos

---

## 4. Processamento de Imagens e Logo

### Logo da Empresa
Todos os laudos usam o padrão **filesystem-first** para carregar o logo:
```typescript
// 1. Tenta ler do filesystem (URLs relativas como /uploads/logo.png)
const logoPath = join(process.cwd(), 'public', adminSettings.companyLogoUrl);
const logoBytes = readFileSync(logoPath);
logoBase64 = `data:image/png;base64,${logoBytes.toString('base64')}`;

// 2. Fallback HTTP para URLs absolutas (porta 3006)
```

### Fotos/Imagens dos Laudos
```typescript
async function processImageUrl(url: string | null): Promise<string> {
  // 1. Se null → retorna placeholder transparente
  // 2. Se começa com "data:" → já é base64, retorna
  // 3. Se começa com "/" → lê do filesystem local
  //    readFileSync(join(process.cwd(), 'public', url))
  //    → Converte para data:image/xxx;base64,...
  // 4. Se URL externa → fetch + buffer → base64
}
```

**Por quê Base64?**: Puppeteer renderiza HTML offline, então imagens precisam ser inline.

---

## 5. Templates de PDF

| Laudo | Template | Método |
|-------|----------|--------|
| **Ruído** | `templates/laudo-ruido-template.html` | Arquivo externo + `{{placeholders}}` |
| **Pino Rei** | `templates/laudo-pino-rei-template.html` | Arquivo externo + `{{placeholders}}` |
| **Quinta Roda** | `templates/laudo-quinta-roda-template.html` | Arquivo externo + `{{placeholders}}` |
| **Checklist** | Inline em `pdf/route.ts` | HTML gerado programaticamente |
| **LIT** | Inline em `pdf/route.ts` | HTML gerado programaticamente |

### Templates externos (Ruído, Pino Rei, Quinta Roda)
Usam `readFileSync` para ler o arquivo HTML e substituem `{{placeholders}}`:
- `{{companyName}}`, `{{companyAddress}}`, `{{companyPhone}}` — dados dinâmicos do AdminSettings
- `{{logoPath}}` — logo em base64
- `{{clientName}}`, `{{vehicleBrand}}`, etc. — dados do laudo
- `{{qrCodeSvg}}`, `{{documentHash}}` — verificação de autenticidade

---

## 6. Configuração do Puppeteer

```typescript
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
const page = await browser.newPage();
await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
const pdfBuffer = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
});
await browser.close();
```

---

## 7. Gráfico de Ruído (SVG)

O laudo de ruído inclui um **gráfico SVG** gerado programaticamente:

```
┌────────────────────────────────┐
│ dB                              │
│ 120 ┤                           │
│     │                           │
│  81 ┤─── Limite Legal ──────── │
│     │  █  █  █                  │
│  75 ┤  █  █  █  █  █  █        │
│     │  █  █  █  █  █  █        │
│   0 └──1──2──3──4──5──6──────  │
│       Aceleração  M.Lenta       │
└────────────────────────────────┘

calculateChartCoordinates(value):
  - Mapeia 0-120 dB → coordenadas SVG
  - Barras verticais com cores
  - Linha de limite legal em vermelho
```
