## Cadastro Automático de Veículos com IA

### Objetivo
- Documentar o fluxo completo que permite importar documentos de veículos, extrair dados com OpenAI, pré-preencher o modal de cadastro e salvar o veículo vinculado ao cliente correto (CNPJ).
- Servir como material de apresentação da ideia para o CEO da COBLI, mostrando como o recurso pode ser incorporado ao modal de “Adicionar motorista” já existente na plataforma deles.

### Visão Geral
- O usuário abre o modal de cadastro de veículo.
- Seleciona o cliente destinatário (via lista com nome e CNPJ).
- Anexa o documento do veículo (PDF, JPG, PNG, JPEG).
- Um assistente da OpenAI extrai placa, chassi, espécie/tipo, marca/modelo e ano fabricação/modelo.
- O formulário é preenchido automaticamente; o usuário pode validar/ajustar os campos.
- Ao confirmar, os dados são persistidos na base via API REST `/api/vehicles`.

### Fluxograma do Processo

```mermaid
flowchart TD
    A[Usuário abre modal "Adicionar veículo"] --> B{Cliente selecionado?}
    B -- Não --> B1[Mensagem "Selecione um cliente"] --> A
    B -- Sim --> C[Upload de PDF/Imagem]
    C --> D[POST /api/process-document]
    D -->|OpenAI Assistant| E[Thread + Run GPT-4.1-mini]
    E --> F[Resposta em JSON]
    F --> G[Parse e padronização dos campos]
    G --> H[Formulário pré-preenchido]
    H --> I{Usuário confirma/edita?}
    I -- Ajusta --> H
    I -- Confirma --> J[POST /api/vehicles]
    J --> K[Prisma grava veículo vinculado ao cliente]
    K --> L[Mensagem de sucesso / formulário limpo]
```

### Componentes Principais
- `app/vehicles/page.tsx`: página que carrega clientes (`/api/clients`), mantém estado do cliente selecionado e integra `VehicleDocumentProcessor` (upload+IA) com `VehicleForm` (edição e envio).
- `components/vehicles/VehicleDocumentProcessor.tsx`: gerencia upload, verifica cliente escolhido, chama `/api/process-document`, trata o JSON retornado e dispara `onDataParsed` para popular o formulário.
- `app/api/process-document/route.ts`: endpoint Next.js que usa OpenAI Assistants API. Faz upload do arquivo, cria thread, executa o assistant `gpt-4.1-mini` com prompt fixo e devolve a resposta textual.
- `components/vehicles/VehicleForm.tsx`: formulário controlado, exibe campos pré-preenchidos, permite edição e dispara POST `/api/vehicles`.
- `app/api/vehicles/route.ts`: cria registros de veículo com Prisma, garantindo vínculo com o cliente (`clientId`) e tratando duplicidade de placa ou chassi.
- `prisma/schema.prisma`: define modelos `Client` e `Vehicle`, incluindo restrições de unicidade.
- `components/vehicles/VehiclePdfReader.tsx` (opcional/legado): leitor OCR com Tesseract.js para fallback offline sem OpenAI.

### Sequência Técnica Detalhada
1. **Seleção do cliente** (`app/vehicles/page.tsx`):
   - Ao montar, busca clientes via `/api/clients` e monta `<select>` exibindo nome + CNPJ.
   - O ID do cliente é requisito; sem ele o upload é bloqueado.
2. **Upload e processamento IA** (`VehicleDocumentProcessor`):
   - Aceita PDF/JPEG/PNG.
   - Envia `FormData` para `/api/process-document`.
   - Exibe estados de carregamento, mensagens de erro/sucesso e logs detalhados.
3. **Extração com OpenAI** (`/api/process-document`):
   - Usa SDK `openai` com chave e assistant pré-configurados.
   - Cria thread, anexa arquivo com ferramenta `file_search` e roda o assistant `gpt-4.1-mini`.
   - Aguarda até 60 tentativas (1,5 s intervalo) para concluir.
   - Retorna `messageContent.text.value` em formato markdown contendo JSON.
4. **Parsing** (`VehicleDocumentProcessor`):
   - Localiza bloco ```json``` ou objeto livre.
   - Converte para objeto, seleciona o primeiro veículo caso haja múltiplos.
   - Padroniza nomes de campos para o formulário (`placa`, `numeroChassi`, `especieTipo`, `marcaModelo`, `anoFabricacaoModelo`).
5. **Pré-preenchimento** (`VehicleForm`):
   - Recebe `initialData` via props e seta state interno.
   - Usuário pode alterar qualquer campo antes de salvar.
6. **Persistência** (`/api/vehicles`):
   - Recebe JSON do formulário, inclui `clientId` escolhido.
   - Usa Prisma para inserir e retorna o veículo criado.
   - Trata erros de unicidade (placa/chassi) e responde HTTP 409.
7. **Feedback**:
   - Formulário mostra mensagens de progresso e limpa campos após sucesso.

### Experiência do Usuário
- A interface atual é uma página dedicada, mas pode ser encapsulada em um modal como o de “Adicionar motorista” da COBLI.
- O botão “Import from Document 🤖” dispara o fluxo IA; estados visuais informam processamento e possíveis erros.
- Após o parsing, o usuário valida rapidamente os campos antes de salvar.

### API e Modelos
- **Clientes** (`/api/clients`): CRUD com Prisma; o GET ordena por nome para facilitar seleção.
- **Veículos** (`/api/vehicles`): aceita `placa`, `numeroChassi`, `especieTipo`, `marcaModelo`, `anoFabricacaoModelo`, `clientId`.
- **OpenAI** (`/api/process-document`):
  - Prompt fixo: “Extraia Placa Nro. Chassi Espécie/Tipo Marca/Modelo Ano Fabric./Modelo e retorne em JSON”.
  - Utiliza assistant ID `asst_kga7L8PQxvBb1PvA01OOkCkH` e modelo `gpt-4.1-mini`.
  - Tempo máximo de polling ≈ 90 segundos (60 tentativas × 1,5s).

### Tratamento de Erros e Logs
- **Frontend**: mensagens toast-like no `VehicleDocumentProcessor` e `VehicleForm` para orientar o usuário.
- **Backend**: logs extensivos no console (arquivo, cliente, status HTTP, JSON). Erros são serializados e devolvidos com mensagens claras.
- **Fallback**: caso o JSON não seja encontrado, o usuário recebe aviso e pode tentar novamente ou inserir manualmente.

### Segurança e Observações
- A chave da OpenAI está hardcoded em `app/api/process-document/route.ts`. Recomendado migrar para variáveis de ambiente com `process.env.OPENAI_API_KEY` antes de levar a ideia a produção ou apresentá-la externamente.
- Garantir limites de tamanho de arquivo e sanitização caso o recurso seja exposto externamente.
- Avaliar criptografia/mascaração de dados sensíveis (placa/chassi) no tráfego HTTP.

### Ideias Modernas e Benchmark
- Integração com **document AI** proprietários (ex.: AWS Textract, Google Doc AI) para diversificar provedores e reduzir dependência.
- Uso de **camada de verificação com modelos pequenos** (ex.: regex + heurísticas) para validar resposta da IA antes de exibir.
- Sugestão inspirada em plataformas modernas de frotas: anexar automaticamente o PDF do documento ao cadastro do veículo para auditoria.
- Oferecer **chat de revisão** no modal, permitindo solicitar nova extração ou correção via prompt customizado (semelhante a CRMs com copilots).

### Possíveis Evoluções para o Modal da COBLI
- Adicionar o botão “Importar documento com IA” ao lado do formulário manual de motorista, replicando o fluxo acima (seleção de cliente, upload, validação).
- Expandir campos extraídos para CNH do motorista, datas de validade e categorias, usando o mesmo backend com prompt ajustado.
- Incluir histórico de uploads para o cliente, permitindo reuso dos dados e auditoria.

### Próximos Passos Recomendados
- Refatorar a configuração da OpenAI para usar variáveis de ambiente e segredos gerenciados.
- Adicionar testes de integração (ex.: mocking do OpenAI) para garantir estabilidade.
- Criar componentes genéricos de modal para reutilizar com motoristas, veículos e equipamentos.
- Validar com o time da COBLI até que ponto a automação pode ser aplicada ao fluxo de motoristas (ex.: leitura de CNH, certificados, etc.).

