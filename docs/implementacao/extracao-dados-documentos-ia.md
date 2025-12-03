# Documentação Completa: Extração de Dados de Documentos com IA

## Objetivo

Documentar toda a lógica utilizada para extração automática de dados de documentos de veículos usando Inteligência Artificial, desde o upload do arquivo até o autopreenchimento completo do formulário.

---

## 1. Visão Geral do Fluxo

### Fluxograma do Processo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE EXTRAÇÃO DE DADOS                   │
└─────────────────────────────────────────────────────────────────┘

    [Usuário acessa página de cadastro de veículos]
                    |
                    v
    ┌───────────────────────────────┐
    │  Carrega lista de clientes     │
    │  via GET /api/clients          │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Usuário seleciona cliente    │
    │  (obrigatório para upload)    │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Usuário faz upload do        │
    │  documento (PDF/Image)        │
    │  via VehicleDocumentProcessor │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Validação: Cliente selecionado?│
    │  Se não: Exibe erro e bloqueia │
    └───────────────────────────────┘
                    |
                    v (se válido)
    ┌───────────────────────────────┐
    │  Cria FormData com arquivo    │
    │  e envia POST /api/process-    │
    │  document                      │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  API recebe arquivo e faz     │
    │  upload para OpenAI Files API │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Cria Thread no OpenAI         │
    │  Assistants API                │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Envia mensagem com prompt    │
    │  fixo + anexo do arquivo       │
    │  usando file_search tool      │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Executa Run do Assistant    │
    │  (modelo: gpt-4.1-mini)      │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Polling: Aguarda conclusão   │
    │  (até 60 tentativas, 1.5s     │
    │   intervalo, max ~90s)        │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Recupera mensagem de resposta│
    │  do Assistant                 │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Retorna resposta textual     │
    │  (JSON em markdown) para      │
    │  frontend                     │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Frontend recebe resposta e   │
    │  extrai JSON usando regex     │
    │  (procura por ```json ou {})  │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Faz parse do JSON e          │
    │  normaliza campos:            │
    │  - placa                      │
    │  - numeroChassi (nro_chassi)  │
    │  - especieTipo (especie_tipo) │
    │  - marcaModelo (marca_modelo) │
    │  - anoFabricacaoModelo        │
    │    (ano_fabricacao/ano_modelo)│
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Chama callback onDataParsed  │
    │  com dados normalizados       │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Página atualiza estado      │
    │  prefillData com dados       │
    │  extraídos                   │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  VehicleForm recebe           │
    │  initialData via props        │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  useEffect detecta initialData│
    │  e atualiza formData state    │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Formulário exibe campos      │
    │  pré-preenchidos              │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Usuário valida/edita campos  │
    │  e submete formulário         │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  POST /api/vehicles com       │
    │  dados + clientId              │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Prisma cria registro no BD   │
    │  vinculado ao cliente         │
    └───────────────────────────────┘
                    |
                    v
    ┌───────────────────────────────┐
    │  Retorna sucesso e limpa      │
    │  formulário                   │
    └───────────────────────────────┘
```

### Descrição das Etapas Principais

1. **Seleção de Cliente**: O usuário deve selecionar um cliente antes de processar documentos. Isso é obrigatório para vincular o veículo ao cliente correto.

2. **Upload do Documento**: O usuário faz upload de um arquivo (PDF, JPG, PNG, JPEG) através de um componente especializado.

3. **Processamento com IA**: O arquivo é enviado para a API OpenAI Assistants, que utiliza um modelo de IA para extrair informações do documento.

4. **Extração e Parsing**: A resposta da IA (em formato JSON dentro de markdown) é processada e os dados são normalizados para o formato esperado pelo formulário.

5. **Autopreenchimento**: Os dados extraídos são automaticamente inseridos nos campos do formulário.

6. **Persistência**: Após validação/edição pelo usuário, os dados são salvos no banco de dados vinculados ao cliente selecionado.

---

## 2. Arquitetura e Componentes

### Mapeamento de Arquivos

```
app/
├── vehicles/
│   └── page.tsx                    # Página principal que orquestra o fluxo
│
├── api/
│   ├── process-document/
│   │   └── route.ts                # API que integra com OpenAI Assistants
│   └── vehicles/
│       └── route.ts                # API de CRUD de veículos (POST/GET/DELETE)
│
components/
└── vehicles/
    ├── VehicleDocumentProcessor.tsx # Componente de upload e processamento IA
    └── VehicleForm.tsx              # Formulário que recebe dados pré-preenchidos
```

### Responsabilidades de Cada Componente

#### `app/vehicles/page.tsx`
- **Responsabilidade**: Orquestração do fluxo completo
- **Funções principais**:
  - Carregar lista de clientes ao montar o componente
  - Gerenciar estado do cliente selecionado
  - Receber dados extraídos via callback `handleDocumentDataParsed`
  - Passar dados pré-preenchidos para o `VehicleForm`
  - Coordenar comunicação entre `VehicleDocumentProcessor` e `VehicleForm`

#### `components/vehicles/VehicleDocumentProcessor.tsx`
- **Responsabilidade**: Upload de arquivo e processamento com IA
- **Funções principais**:
  - Validar se cliente foi selecionado antes de permitir upload
  - Criar FormData com arquivo selecionado
  - Enviar requisição POST para `/api/process-document`
  - Processar resposta da API (extrair JSON da resposta markdown)
  - Normalizar campos da resposta da IA para formato do formulário
  - Chamar callback `onDataParsed` com dados normalizados
  - Exibir estados de carregamento e mensagens de erro/sucesso

#### `app/api/process-document/route.ts`
- **Responsabilidade**: Integração com OpenAI Assistants API
- **Funções principais**:
  - Receber arquivo via FormData
  - Fazer upload do arquivo para OpenAI Files API
  - Criar thread no OpenAI Assistants
  - Enviar mensagem com prompt fixo e anexo do arquivo
  - Executar run do assistant (modelo gpt-4.1-mini)
  - Fazer polling para aguardar conclusão (até 60 tentativas, 1.5s intervalo)
  - Recuperar resposta final do assistant
  - Retornar resposta textual para o frontend

#### `components/vehicles/VehicleForm.tsx`
- **Responsabilidade**: Formulário de cadastro com autopreenchimento
- **Funções principais**:
  - Receber `initialData` via props
  - Atualizar estado interno quando `initialData` muda (useEffect)
  - Permitir edição manual de todos os campos
  - Validar e submeter dados para `/api/vehicles`
  - Exibir mensagens de sucesso/erro
  - Limpar formulário após sucesso

#### `app/api/vehicles/route.ts`
- **Responsabilidade**: Persistência de dados no banco
- **Funções principais**:
  - POST: Criar novo veículo vinculado ao cliente
  - GET: Listar veículos (opcionalmente filtrado por cliente)
  - DELETE: Remover veículo
  - Validar unicidade de placa e chassi
  - Tratar erros de duplicidade (HTTP 409)

---

## 3. Fluxo Detalhado Passo a Passo

### 3.1. Seleção de Cliente

**Arquivo**: `app/vehicles/page.tsx`

**Processo**:
1. Ao montar o componente, executa `useEffect` que busca clientes via `GET /api/clients`
2. Lista de clientes é armazenada no estado `clients`
3. Usuário seleciona cliente através de um `<select>` que exibe nome e CNPJ
4. ID do cliente selecionado é armazenado em `selectedClientId`
5. Se cliente não estiver selecionado, o upload é bloqueado

**Código relevante**:
```typescript
// Carregamento de clientes
useEffect(() => {
  const fetchClients = async () => {
    const response = await fetch('/api/clients');
    const clientsData = await response.json();
    setClients(clientsData);
  };
  fetchClients();
}, []);

// Seleção de cliente
<select
  value={selectedClientId}
  onChange={(e) => setSelectedClientId(e.target.value)}
>
  <option value="">Escolha um cliente...</option>
  {clients.map((client) => (
    <option key={client.id} value={client.id}>
      {client.name} - CNPJ: {client.cnpj}
    </option>
  ))}
</select>
```

### 3.2. Upload do Documento

**Arquivo**: `components/vehicles/VehicleDocumentProcessor.tsx`

**Processo**:
1. Usuário clica no botão "Import from Document (PDF/Image)"
2. Abre seletor de arquivo (aceita `.pdf`, `.png`, `.jpg`, `.jpeg`)
3. Ao selecionar arquivo, dispara `handleFileChange`
4. Valida se `clientId` foi fornecido (se não, exibe erro e retorna)
5. Define estado `isProcessing = true` e exibe mensagem "Processando documento com IA..."
6. Cria `FormData` e anexa o arquivo
7. Envia requisição POST para `/api/process-document`

**Código relevante**:
```typescript
const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validação obrigatória de cliente
  if (!clientId) {
    setStatus('Erro: Selecione um cliente antes de processar o documento.');
    return;
  }

  setIsProcessing(true);
  setStatus('Processando documento com IA...');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/process-document', {
    method: 'POST',
    body: formData,
  });
  // ... continua no próximo passo
};
```

### 3.3. Processamento com IA (OpenAI)

**Arquivo**: `app/api/process-document/route.ts`

**Processo detalhado**:

#### 3.3.1. Recepção do Arquivo
```typescript
const formData = await request.formData();
const file = formData.get('file') as File;

if (!file) {
  return NextResponse.json({ error: 'No file provided' }, { status: 400 });
}
```

#### 3.3.2. Upload para OpenAI Files API
```typescript
const uploadedFile = await openai.files.create({
  file,
  purpose: 'assistants'
});
// Retorna: { id: 'file-xxx', ... }
```

#### 3.3.3. Criação de Thread
```typescript
const thread = await openai.beta.threads.create();
// Retorna: { id: 'thread_xxx', ... }
```

#### 3.3.4. Envio de Mensagem com Anexo
```typescript
const message = await openai.beta.threads.messages.create(thread.id, {
  role: 'user',
  content: [
    {
      type: 'text',
      text: 'Extraia Placa Nro. Chassi Espécie/Tipo Marca/Modelo Ano Fabric./Modelo e retorne em JSON'
    }
  ],
  attachments: [
    {
      file_id: uploadedFile.id,
      tools: [{ type: 'file_search' }]
    }
  ]
});
```

**Prompt fixo utilizado**: 
```
"Extraia Placa Nro. Chassi Espécie/Tipo Marca/Modelo Ano Fabric./Modelo e retorne em JSON"
```

#### 3.3.5. Execução do Assistant
```typescript
const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: assistantId,  // ID do assistant pré-configurado
  model: 'gpt-4.1-mini'
});
```

**Configurações**:
- **Assistant ID**: Pré-configurado (não incluído no código por segurança)
- **Modelo**: `gpt-4.1-mini`
- **Tool**: `file_search` (permite ao assistant ler o conteúdo do arquivo)

#### 3.3.6. Polling para Aguardar Conclusão
```typescript
let status = 'queued';
let attempts = 0;
const maxAttempts = 60;

while (status !== 'completed' && attempts < maxAttempts) {
  await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s intervalo
  const runStatus = await openai.beta.threads.runs.retrieve(run.id, { thread_id: thread.id });
  status = runStatus.status;
  attempts++;

  if (status === 'failed') {
    throw new Error(`Execução falhou: ${runStatus.last_error?.message}`);
  }
}
```

**Estados possíveis**:
- `queued`: Aguardando processamento
- `in_progress`: Processando
- `completed`: Concluído com sucesso
- `failed`: Falhou (lança exceção)

**Timeout**: Máximo de 90 segundos (60 tentativas × 1.5s)

#### 3.3.7. Recuperação da Resposta
```typescript
const messages = await openai.beta.threads.messages.list(thread.id, {
  order: 'desc',
  limit: 1
});

const messageContent = messages.data[0]?.content.find(c => c.type === 'text');

if (!messageContent) {
  throw new Error('Nenhuma resposta textual recebida do assistente.');
}

return NextResponse.json({
  resposta: messageContent.text.value
});
```

**Formato da resposta**: Texto que contém JSON, geralmente envolvido em markdown:
```markdown
```json
{
  "ABC1234": {
    "placa": "ABC1234",
    "nro_chassi": "9BW12345678901234",
    "especie_tipo": "CARGA/CAMINHÃO",
    "marca_modelo": "VOLVO/FH460",
    "ano_fabricacao": "2023",
    "ano_modelo": "2024"
  }
}
```
```

### 3.4. Extração e Parsing dos Dados

**Arquivo**: `components/vehicles/VehicleDocumentProcessor.tsx`

**Processo**:

#### 3.4.1. Recepção da Resposta
```typescript
const result = await response.json();
// result.resposta contém a string com JSON em markdown
```

#### 3.4.2. Extração do JSON da Resposta Markdown
```typescript
// Tenta encontrar JSON dentro de blocos ```json ou objeto JSON direto
const jsonMatch = result.resposta.match(/```json\s*([\s\S]*?)\s*```/) 
               || result.resposta.match(/\{[\s\S]*\}/);

if (jsonMatch) {
  const jsonStr = jsonMatch[1] || jsonMatch[0]; // Extrai conteúdo do JSON
  const extractedData = JSON.parse(jsonStr);
}
```

**Estratégia de parsing**:
1. Primeiro tenta encontrar bloco markdown ` ```json ... ``` `
2. Se não encontrar, procura por objeto JSON direto `{ ... }`
3. Extrai o conteúdo e faz parse com `JSON.parse()`

#### 3.4.3. Normalização dos Campos

A resposta da IA pode vir em diferentes formatos. O código normaliza para o formato esperado pelo formulário:

```typescript
// Estrutura esperada da IA (exemplo):
{
  "ABC1234": {  // Chave dinâmica (geralmente a placa)
    "placa": "ABC1234",
    "nro_chassi": "9BW12345678901234",
    "especie_tipo": "CARGA/CAMINHÃO",
    "marca_modelo": "VOLVO/FH460",
    "ano_fabricacao": "2023",
    "ano_modelo": "2024"
  }
}

// Normalização para formato do formulário:
const firstKey = Object.keys(extractedData)[0];
const vehicleData = extractedData[firstKey];

const parsedData = {
  placa: vehicleData.placa || firstKey,  // Usa chave como fallback
  numeroChassi: vehicleData.nro_chassi || '',
  especieTipo: vehicleData.especie_tipo || '',
  marcaModelo: vehicleData.marca_modelo || '',
  anoFabricacaoModelo: vehicleData.ano_fabricacao && vehicleData.ano_modelo
    ? `${vehicleData.ano_fabricacao}/${vehicleData.ano_modelo}`
    : ''
};
```

**Mapeamento de campos**:
- `nro_chassi` → `numeroChassi`
- `especie_tipo` → `especieTipo`
- `marca_modelo` → `marcaModelo`
- `ano_fabricacao` + `ano_modelo` → `anoFabricacaoModelo` (formato: "2023/2024")

#### 3.4.4. Chamada do Callback
```typescript
onDataParsed(parsedData);
```

Isso dispara o callback na página principal que atualiza o estado `prefillData`.

### 3.5. Autopreenchimento do Formulário

**Arquivo**: `components/vehicles/VehicleForm.tsx`

**Processo**:

#### 3.5.1. Recebimento dos Dados via Props
```typescript
<VehicleForm initialData={prefillData} clientId={selectedClientId} />
```

#### 3.5.2. Atualização do Estado quando initialData Muda
```typescript
useEffect(() => {
  if (initialData) {
    setFormData(prev => ({ ...prev, ...initialData }));
  }
}, [initialData]);
```

**Comportamento**:
- Quando `initialData` muda (recebe dados extraídos), o `useEffect` detecta
- Atualiza o estado `formData` mesclando com dados anteriores (preserva campos já preenchidos)
- React re-renderiza o formulário com campos atualizados

#### 3.5.3. Exibição nos Campos
```typescript
<InputField 
  label="Placa" 
  name="placa" 
  value={formData.placa}  // Valor atualizado automaticamente
  onChange={handleChange} 
/>
```

**Campos do formulário**:
1. **Placa**: Campo de texto
2. **Nro. Chassi**: Campo de texto
3. **Espécie/Tipo**: Campo de texto
4. **Marca/Modelo**: Campo de texto
5. **Ano Fabric./Modelo**: Campo de texto (formato: "YYYY/YYYY")

#### 3.5.4. Edição Manual
O usuário pode editar qualquer campo após o autopreenchimento:
```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};
```

### 3.6. Persistência no Banco de Dados

**Arquivo**: `app/api/vehicles/route.ts`

**Processo**:

#### 3.6.1. Submissão do Formulário
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const vehicleData = {
    ...formData,
    clientId: clientId  // Adiciona ID do cliente selecionado
  };

  const response = await fetch('/api/vehicles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vehicleData),
  });
};
```

**Estrutura de dados enviada**:
```json
{
  "placa": "ABC1234",
  "numeroChassi": "9BW12345678901234",
  "especieTipo": "CARGA/CAMINHÃO",
  "marcaModelo": "VOLVO/FH460",
  "anoFabricacaoModelo": "2023/2024",
  "clientId": "cliente-uuid-123"
}
```

#### 3.6.2. Criação no Banco de Dados
```typescript
const newVehicle = await prisma.vehicle.create({
  data: {
    placa: body.placa,
    especieTipo: body.especieTipo,
    marcaModelo: body.marcaModelo,
    numeroChassi: body.numeroChassi,
    anoFabricacaoModelo: body.anoFabricacaoModelo,
    clientId: body.clientId,  // Vincula ao cliente
  },
});
```

#### 3.6.3. Tratamento de Erros

**Duplicidade de Placa ou Chassi**:
```typescript
if (error.code === 'P2002') {  // Erro Prisma de unicidade
  return NextResponse.json(
    { message: 'A vehicle with this license plate (placa) or chassis number (chassi) already exists.' },
    { status: 409 }
  );
}
```

**Outros erros**:
```typescript
return NextResponse.json(
  { message: 'Failed to create vehicle' },
  { status: 500 }
);
```

#### 3.6.4. Limpeza do Formulário
Após sucesso, o formulário é limpo:
```typescript
setMessage('Vehicle saved successfully!');
setFormData(initialFormState); // Limpa todos os campos
```

---

## 4. Detalhamento Técnico

### 4.1. Estrutura de Dados em Cada Etapa

#### Etapa 1: Upload (FormData)
```typescript
FormData {
  file: File {
    name: "documento.pdf",
    type: "application/pdf",
    size: 123456
  }
}
```

#### Etapa 2: Resposta da API OpenAI (JSON)
```typescript
{
  resposta: string  // Texto contendo JSON em markdown
}
```

#### Etapa 3: Dados Extraídos (JSON Parseado)
```typescript
{
  "ABC1234": {
    placa: string,
    nro_chassi: string,
    especie_tipo: string,
    marca_modelo: string,
    ano_fabricacao: string,
    ano_modelo: string
  }
}
```

#### Etapa 4: Dados Normalizados (ParsedVehicleData)
```typescript
interface ParsedVehicleData {
  placa?: string;
  numeroChassi?: string;
  especieTipo?: string;
  marcaModelo?: string;
  anoFabricacaoModelo?: string;
}
```

#### Etapa 5: Dados do Formulário (VehicleFormData)
```typescript
interface VehicleFormData {
  placa: string;
  numeroChassi: string;
  especieTipo: string;
  marcaModelo: string;
  anoFabricacaoModelo: string;
}
```

#### Etapa 6: Dados para API (Request Body)
```typescript
{
  placa: string;
  numeroChassi: string;
  especieTipo: string;
  marcaModelo: string;
  anoFabricacaoModelo: string;
  clientId: string;  // Adicionado antes do envio
}
```

### 4.2. Transformações e Mapeamentos

#### Mapeamento de Campos da IA para Formulário

| Campo IA (snake_case) | Campo Formulário (camelCase) | Transformação |
|----------------------|------------------------------|---------------|
| `placa` | `placa` | Direto (ou usa chave do objeto como fallback) |
| `nro_chassi` | `numeroChassi` | Renomeação simples |
| `especie_tipo` | `especieTipo` | Renomeação simples |
| `marca_modelo` | `marcaModelo` | Renomeação simples |
| `ano_fabricacao` + `ano_modelo` | `anoFabricacaoModelo` | Concatenação: `"${ano_fabricacao}/${ano_modelo}"` |

#### Lógica de Fallback
- Se `placa` não existir no objeto, usa a chave do objeto (geralmente é a placa)
- Campos vazios são preenchidos com string vazia `''`
- Ano só é concatenado se ambos `ano_fabricacao` e `ano_modelo` existirem

### 4.3. Tratamento de Erros

#### Erros no Frontend (VehicleDocumentProcessor)

1. **Cliente não selecionado**:
   ```typescript
   if (!clientId) {
     setStatus('Erro: Selecione um cliente antes de processar o documento.');
     return;
   }
   ```

2. **Erro na requisição HTTP**:
   ```typescript
   if (!response.ok) {
     throw new Error(`Failed to process document: ${response.status}`);
   }
   ```

3. **Erro no parsing JSON**:
   ```typescript
   try {
     const extractedData = JSON.parse(jsonStr);
   } catch (parseError) {
     throw new Error('Erro ao processar resposta do OpenAI');
   }
   ```

4. **JSON não encontrado na resposta**:
   ```typescript
   if (!jsonMatch) {
     throw new Error('Nenhum JSON válido encontrado na resposta');
   }
   ```

#### Erros no Backend (API process-document)

1. **Arquivo não fornecido**:
   ```typescript
   if (!file) {
     return NextResponse.json({ error: 'No file provided' }, { status: 400 });
   }
   ```

2. **Execução falhou no OpenAI**:
   ```typescript
   if (status === 'failed') {
     throw new Error(`Execução falhou: ${runStatus.last_error?.message}`);
   }
   ```

3. **Timeout (execução não completada)**:
   ```typescript
   if (status !== 'completed') {
     throw new Error(`Execução não completada: status final = ${status}`);
   }
   ```

4. **Resposta textual não encontrada**:
   ```typescript
   if (!messageContent) {
     throw new Error('Nenhuma resposta textual recebida do assistente.');
   }
   ```

#### Erros na API de Veículos

1. **Duplicidade de placa ou chassi**:
   ```typescript
   if (error.code === 'P2002') {
     return NextResponse.json(
       { message: 'Vehicle with this placa or chassi already exists.' },
       { status: 409 }
     );
   }
   ```

2. **Erro genérico**:
   ```typescript
   return NextResponse.json(
     { message: 'Failed to create vehicle' },
     { status: 500 }
   );
   ```

### 4.4. Validações

#### Validações no Frontend

1. **Cliente obrigatório**: Bloqueia upload se não houver cliente selecionado
2. **Arquivo obrigatório**: Input de arquivo requer seleção
3. **Tipos de arquivo aceitos**: `.pdf`, `.png`, `.jpg`, `.jpeg`
4. **Campos do formulário**: Todos os campos são `required` no HTML

#### Validações no Backend

1. **Unicidade de placa**: Prisma schema define `@@unique([placa])`
2. **Unicidade de chassi**: Prisma schema define `@@unique([numeroChassi])`
3. **Cliente válido**: `clientId` deve existir na tabela `Client`

---

## 5. Exemplos de Respostas e Formatos

### 5.1. Exemplo de Resposta da IA

#### Resposta Bruta (markdown)
```markdown
Aqui estão os dados extraídos do documento:

```json
{
  "ABC1234": {
    "placa": "ABC1234",
    "nro_chassi": "9BW12345678901234",
    "especie_tipo": "CARGA/CAMINHÃO",
    "marca_modelo": "VOLVO/FH460",
    "ano_fabricacao": "2023",
    "ano_modelo": "2024"
  }
}
```

Os dados foram extraídos com sucesso.
```

#### Resposta Alternativa (JSON direto)
```json
{
  "XYZ9876": {
    "placa": "XYZ9876",
    "nro_chassi": "9BM95812345678901",
    "especie_tipo": "TRACAO/CAMINHAO TRATOR",
    "marca_modelo": "M.BENZ/7-2430",
    "ano_fabricacao": "2019",
    "ano_modelo": "2020"
  }
}
```

### 5.2. Estrutura JSON Esperada

#### Formato Padrão
```json
{
  "[PLACA]": {
    "placa": "string",
    "nro_chassi": "string (17 caracteres)",
    "especie_tipo": "string",
    "marca_modelo": "string",
    "ano_fabricacao": "string (4 dígitos)",
    "ano_modelo": "string (4 dígitos)"
  }
}
```

**Observações**:
- A chave do objeto é geralmente a placa do veículo
- Pode haver múltiplos veículos no mesmo objeto (o código pega o primeiro)
- Campos podem estar ausentes (serão preenchidos com string vazia)

### 5.3. Mapeamento de Campos Completo

#### Entrada (Documento)
```
DOCUMENTO DE PROPRIEDADE DE VEÍCULO AUTOMOTOR

PLACA EXERCICIO: ABC1234
NRO. CHASSI: 9BW12345678901234
ESPÉCIE/TIPO: CARGA/CAMINHÃO
MARCA/MODELO/VERSÃO: VOLVO/FH460 | ...
ANO FABRICAÇÃO: 2023
ANO MODELO: 2024
```

#### Saída Normalizada
```typescript
{
  placa: "ABC1234",
  numeroChassi: "9BW12345678901234",
  especieTipo: "CARGA/CAMINHÃO",
  marcaModelo: "VOLVO/FH460",
  anoFabricacaoModelo: "2023/2024"
}
```

### 5.4. Exemplo de Fluxo Completo

#### 1. Usuário seleciona cliente
```typescript
selectedClientId = "cliente-uuid-123"
```

#### 2. Upload de arquivo
```typescript
file = File {
  name: "crlv-abc1234.pdf",
  type: "application/pdf",
  size: 245678
}
```

#### 3. Resposta da API OpenAI
```typescript
{
  resposta: "```json\n{\"ABC1234\":{\"placa\":\"ABC1234\",...}}\n```"
}
```

#### 4. Dados parseados
```typescript
{
  "ABC1234": {
    placa: "ABC1234",
    nro_chassi: "9BW12345678901234",
    especie_tipo: "CARGA/CAMINHÃO",
    marca_modelo: "VOLVO/FH460",
    ano_fabricacao: "2023",
    ano_modelo: "2024"
  }
}
```

#### 5. Dados normalizados
```typescript
{
  placa: "ABC1234",
  numeroChassi: "9BW12345678901234",
  especieTipo: "CARGA/CAMINHÃO",
  marcaModelo: "VOLVO/FH460",
  anoFabricacaoModelo: "2023/2024"
}
```

#### 6. Dados no formulário (pré-preenchidos)
```html
<input name="placa" value="ABC1234" />
<input name="numeroChassi" value="9BW12345678901234" />
<input name="especieTipo" value="CARGA/CAMINHÃO" />
<input name="marcaModelo" value="VOLVO/FH460" />
<input name="anoFabricacaoModelo" value="2023/2024" />
```

#### 7. Dados enviados para API
```json
{
  "placa": "ABC1234",
  "numeroChassi": "9BW12345678901234",
  "especieTipo": "CARGA/CAMINHÃO",
  "marcaModelo": "VOLVO/FH460",
  "anoFabricacaoModelo": "2023/2024",
  "clientId": "cliente-uuid-123"
}
```

#### 8. Registro criado no banco
```typescript
{
  id: "veiculo-uuid-456",
  placa: "ABC1234",
  numeroChassi: "9BW12345678901234",
  especieTipo: "CARGA/CAMINHÃO",
  marcaModelo: "VOLVO/FH460",
  anoFabricacaoModelo: "2023/2024",
  clientId: "cliente-uuid-123",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

---

## 6. Considerações de Segurança e Performance

### 6.1. Limitações e Timeouts

#### Timeout do Processamento IA
- **Tempo máximo**: 90 segundos (60 tentativas × 1.5s)
- **Comportamento**: Se não completar, retorna erro
- **Impacto**: Usuário precisa tentar novamente ou inserir manualmente

#### Tamanho de Arquivo
- **Limite atual**: Não há validação explícita no código
- **Recomendação**: Adicionar validação de tamanho máximo (ex: 10MB)
- **OpenAI Files API**: Tem limites próprios de tamanho

#### Tipos de Arquivo Aceitos
- **Formatos**: `.pdf`, `.png`, `.jpg`, `.jpeg`
- **Validação**: Apenas no frontend (atributo `accept`)
- **Recomendação**: Validar também no backend

### 6.2. Tratamento de Erros

#### Estratégia de Retry
- **Atual**: Não há retry automático
- **Recomendação**: Implementar retry com backoff exponencial para erros temporários

#### Mensagens de Erro ao Usuário
- **Frontend**: Mensagens claras e específicas
- **Backend**: Logs detalhados no console, mensagens genéricas para o usuário
- **Recomendação**: Sistema de logging estruturado (ex: Winston, Pino)

### 6.3. Boas Práticas

#### Segurança

1. **Chaves de API**:
   - ⚠️ **Atual**: Hardcoded no código
   - ✅ **Recomendado**: Usar variáveis de ambiente (`process.env.OPENAI_API_KEY`)

2. **Validação de Entrada**:
   - ✅ Validar tipo de arquivo no backend
   - ✅ Validar tamanho de arquivo
   - ✅ Sanitizar dados antes de salvar no banco

3. **Autenticação**:
   - ⚠️ **Atual**: Não há autenticação na API
   - ✅ **Recomendado**: Implementar middleware de autenticação

4. **Rate Limiting**:
   - ⚠️ **Atual**: Não há limite de requisições
   - ✅ **Recomendado**: Implementar rate limiting para evitar abuso

#### Performance

1. **Otimização de Upload**:
   - Considerar compressão de imagens antes do upload
   - Implementar progress bar para uploads grandes

2. **Cache**:
   - Considerar cache de respostas da IA para documentos idênticos (hash do arquivo)

3. **Processamento Assíncrono**:
   - Para documentos grandes, considerar processamento em background (queue/job)

4. **Otimização de Polling**:
   - Ajustar intervalo de polling baseado no tamanho do arquivo
   - Implementar WebSocket para notificações em tempo real

#### Observabilidade

1. **Logging**:
   - ✅ Logs detalhados já implementados
   - ✅ Rastreamento de erros
   - ⚠️ **Recomendado**: Sistema de métricas (ex: Prometheus)

2. **Monitoramento**:
   - Tempo médio de processamento
   - Taxa de sucesso/falha
   - Uso de tokens da OpenAI

---

## 7. Fluxograma de Decisões e Erros

```
                    [Upload Iniciado]
                           |
                           v
              ┌────────────────────────┐
              │ Cliente selecionado?   │
              └────────────────────────┘
                     |              |
                    SIM            NÃO
                     |              |
                     v               v
        [Cria FormData]    [Exibe Erro: "Selecione cliente"]
                     |              |
                     |              └──> [Fim]
                     |
                     v
        [POST /api/process-document]
                     |
                     v
        ┌────────────────────────┐
        │ Arquivo recebido?      │
        └────────────────────────┘
               |              |
              SIM            NÃO
               |              |
               |              v
               |      [Erro 400: "No file provided"]
               |              |
               |              └──> [Fim]
               |
               v
        [Upload para OpenAI Files]
               |
               v
        ┌────────────────────────┐
        │ Upload bem-sucedido?   │
        └────────────────────────┘
               |              |
              SIM            NÃO
               |              |
               |              v
               |      [Erro: Falha no upload]
               |              |
               |              └──> [Fim]
               |
               v
        [Cria Thread + Envia Mensagem]
               |
               v
        [Executa Run do Assistant]
               |
               v
        ┌────────────────────────┐
        │ Polling (até 60x)      │
        └────────────────────────┘
               |
               v
        ┌────────────────────────┐
        │ Status = completed?    │
        └────────────────────────┘
         |        |          |
        SIM     FAILED    TIMEOUT
         |        |          |
         |        |          v
         |        |    [Erro: Timeout]
         |        |          |
         |        |          └──> [Fim]
         |        |
         |        v
         |   [Erro: Execução falhou]
         |        |
         |        └──> [Fim]
         |
         v
        [Recupera Resposta]
               |
               v
        ┌────────────────────────┐
        │ Resposta textual?      │
        └────────────────────────┘
               |              |
              SIM            NÃO
               |              |
               |              v
               |      [Erro: Sem resposta textual]
               |              |
               |              └──> [Fim]
               |
               v
        [Retorna para Frontend]
               |
               v
        [Frontend: Extrai JSON]
               |
               v
        ┌────────────────────────┐
        │ JSON encontrado?       │
        └────────────────────────┘
               |              |
              SIM            NÃO
               |              |
               |              v
               |      [Erro: JSON inválido]
               |              |
               |              └──> [Fim]
               |
               v
        [Parse JSON]
               |
               v
        ┌────────────────────────┐
        │ Parse bem-sucedido?    │
        └────────────────────────┘
               |              |
              SIM            NÃO
               |              |
               |              v
               |      [Erro: Erro ao parsear]
               |              |
               |              └──> [Fim]
               |
               v
        [Normaliza Campos]
               |
               v
        [Chama onDataParsed]
               |
               v
        [Atualiza prefillData]
               |
               v
        [Formulário pré-preenchido]
               |
               v
        ┌────────────────────────┐
        │ Usuário edita/confirma?│
        └────────────────────────┘
               |
               v
        [POST /api/vehicles]
               |
               v
        ┌────────────────────────┐
        │ Veículo criado?        │
        └────────────────────────┘
         |        |
        SIM     ERRO
         |        |
         |        v
         |   ┌────────────────────┐
         |   │ Erro P2002?       │
         |   └────────────────────┘
         |      |        |
         |     SIM      NÃO
         |      |        |
         |      |        v
         |      |   [Erro 500]
         |      |        |
         |      |        └──> [Fim]
         |      |
         |      v
         |   [Erro 409: Duplicidade]
         |      |
         |      └──> [Fim]
         |
         v
        [Sucesso: Veículo criado]
               |
               v
        [Limpa formulário]
               |
               v
              [Fim]
```

---

## 8. Referências de Código

### Arquivos Principais

1. **Página Principal**: `app/vehicles/page.tsx`
   - Linhas 21-56: Gerenciamento de estado e callbacks
   - Linhas 149: Integração dos componentes

2. **Processador de Documentos**: `components/vehicles/VehicleDocumentProcessor.tsx`
   - Linhas 23-147: Lógica de upload e processamento
   - Linhas 80-124: Parsing e normalização de dados

3. **API de Processamento**: `app/api/process-document/route.ts`
   - Linhas 10-119: Fluxo completo de integração com OpenAI

4. **Formulário**: `components/vehicles/VehicleForm.tsx`
   - Linhas 33-37: Autopreenchimento via useEffect
   - Linhas 46-79: Submissão e persistência

5. **API de Veículos**: `app/api/vehicles/route.ts`
   - Linhas 39-80: Criação de veículos

---

## 9. Conclusão

Este documento descreve completamente a lógica de extração de dados de documentos usando Inteligência Artificial. O sistema permite que usuários façam upload de documentos de veículos (PDF ou imagens), processe-os automaticamente com IA, extraia informações relevantes e preencha automaticamente um formulário de cadastro.

### Pontos-Chave

- **Fluxo completo automatizado**: Do upload à persistência, com mínimo de intervenção manual
- **Integração robusta com OpenAI**: Utiliza Assistants API com file_search para processar documentos
- **Tratamento de erros abrangente**: Em todas as etapas do processo
- **Normalização de dados**: Converte diferentes formatos de resposta da IA para formato padronizado
- **Validações em múltiplas camadas**: Frontend e backend

### Melhorias Futuras Recomendadas

1. Mover chaves de API para variáveis de ambiente
2. Implementar autenticação e autorização
3. Adicionar rate limiting
4. Implementar sistema de retry para erros temporários
5. Adicionar validação de tamanho de arquivo
6. Implementar processamento assíncrono para arquivos grandes
7. Adicionar sistema de métricas e monitoramento
8. Considerar cache de respostas para documentos idênticos

---

**Última atualização**: Janeiro 2024
**Versão do documento**: 1.0

