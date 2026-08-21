# Manual do Usuário - Easy Laudos

## 📖 Índice

1. [Introdução](#introdução)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Dashboard Principal](#dashboard-principal)
4. [Gestão de Clientes](#gestão-de-clientes)
5. [Gestão de Veículos](#gestão-de-veículos)
6. [Emissão de Laudos](#emissão-de-laudos)
7. [Gestão de Equipamentos](#gestão-de-equipamentos)
8. [Histórico e Relatórios](#histórico-e-relatórios)
9. [Configurações](#configurações)
10. [Dúvidas Frequentes](#dúvidas-frequentes)

## 🎯 Introdução

### O que é o Easy Laudos?

O Easy Laudos é um sistema completo para emissão e gerenciamento de laudos de inspeção técnica veicular. Com ele, você pode:

- ✅ Cadastrar clientes e veículos
- ✅ Emitir 5 tipos diferentes de laudos
- ✅ Gerenciar equipamentos de medição
- ✅ Acompanhar histórico completo
- ✅ Gerar relatórios e estatísticas
- ✅ Controlar vencimentos e calibrações

### Requisitos do Sistema

- **Navegador**: Chrome, Firefox, Edge ou Safari (versões recentes)
- **Conexão**: Internet estável
- **Resolução**: Mínimo 1366x768 pixels
- **JavaScript**: Deve estar habilitado

## 🔐 Acesso ao Sistema

### Como fazer login

1. Acesse o endereço do sistema no seu navegador
2. Na tela de login, insira:
   - **Usuário**: Seu nome de usuário fornecido
   - **Senha**: Sua senha pessoal
3. Clique em **Entrar**

### Tipos de Usuário

| Tipo | Permissões |
|------|------------|
| **Admin** | Acesso total ao sistema |
| **Inspetor A** | Acesso aos seus próprios laudos e clientes |
| **Inspetor B** | Acesso aos seus próprios laudos e clientes |

### Primeiro Acesso

No primeiro acesso, recomendamos:
1. Alterar sua senha padrão
2. Configurar dados da empresa
3. Cadastrar equipamentos de medição
4. Fazer um laudo de teste

## 🏠 Dashboard Principal

O Dashboard é sua página inicial após o login. Aqui você encontra:

### 1. Estatísticas Rápidas

- **Total de Clientes**: Quantidade de clientes cadastrados
- **Total de Veículos**: Veículos registrados no sistema
- **Total de Laudos**: Laudos emitidos até o momento

### 2. Notificações Importantes

⚠️ **Alertas de Calibração**: Equipamentos próximos do vencimento aparecem em destaque

### 3. Histórico Recente

Tabela com os últimos laudos emitidos, contendo:
- Ordem de Serviço
- Cliente
- Veículo (Placa e Modelo)
- Tipo de Laudo
- Data de Emissão
- Data de Vencimento
- Ações (Visualizar/Excluir)

### 4. Filtros de Pesquisa

Você pode filtrar o histórico por:
- **Tipo de Laudo**: Checklist, LIT, Ruído, etc.
- **Cliente**: Selecione um cliente específico
- **Período**: Data inicial e final
- **Busca**: Digite OS, placa ou nome do cliente

## 👥 Gestão de Clientes

### Cadastrar Novo Cliente

1. No menu lateral, clique em **Clientes**
2. Clique no botão **Novo Cliente**
3. Preencha os dados:

#### Dados Obrigatórios
- **CNPJ**: Número do CNPJ (apenas números)
- **Razão Social**: Nome da empresa

#### Dados Opcionais
- **Endereço**: Rua e número
- **Cidade/Estado**: Localização
- **CEP**: Código postal
- **Telefone**: Contato principal

4. Clique em **Salvar**

### Editar Cliente

1. Localize o cliente na lista
2. Clique no ícone de edição ✏️
3. Altere os dados necessários
4. Clique em **Salvar Alterações**

### Buscar Cliente

Use a barra de pesquisa para encontrar clientes por:
- Nome/Razão Social
- CNPJ
- Cidade

## 🚗 Gestão de Veículos

### Cadastrar Veículo

#### Método 1: Cadastro Manual

1. Acesse **Veículos** > **Novo Veículo**
2. Preencha:
   - **Placa**: Formato ABC-1234 ou ABC1D23
   - **Chassi**: Número do chassi (17 caracteres)
   - **Marca/Modelo**: Ex: SCANIA/R440
   - **Ano**: Fabricação/Modelo (Ex: 2020/2021)
   - **Cliente**: Selecione o proprietário

3. Clique em **Cadastrar**

#### Método 2: Importação de Documento

1. Clique em **Importar do Documento**
2. Faça upload do CRLV em PDF
3. O sistema extrairá automaticamente:
   - Placa
   - Chassi
   - Marca/Modelo
   - Ano
4. Confirme os dados e salve

### Vincular Veículo a Cliente

1. Na tela de edição do veículo
2. Selecione o cliente no campo **Proprietário**
3. Salve as alterações

## 📋 Emissão de Laudos

### Tipos de Laudos Disponíveis

| Tipo | Descrição | Uso |
|------|-----------|-----|
| **✅ Checklist** | Inspeção geral com múltiplos itens | Vistoria completa |
| **📝 LIT** | Laudo de Inspeção Técnica | Padrão INMETRO |
| **🔊 Ruído** | Medição de níveis sonoros | Teste de ruído |
| **🔧 Pino Rei** | Inspeção de pino rei | Cavalo mecânico |
| **🔧 Quinta Roda** | Inspeção de quinta roda | Sistema de engate |

### Como Emitir um Laudo

#### Passo 1: Iniciar Emissão

1. Clique em **Emitir Laudo** no menu
2. Selecione o tipo de laudo desejado
3. O formulário específico será carregado

#### Passo 2: Preencher Dados Básicos

Todos os laudos requerem:

- **Ordem de Serviço**: Gerada automaticamente (pode editar)
- **Cliente**: Selecione da lista
- **Veículo**: Escolha o veículo do cliente
- **Data de Emissão**: Data atual (pode alterar)

#### Passo 3: Dados Específicos por Tipo

##### Laudo Checklist
- Marque os itens inspecionados
- Adicione observações se necessário
- Defina resultado (Aprovado/Reprovado)

##### Laudo LIT
- Dados do fabricante do equipamento
- Mês/Ano de fabricação
- Upload de 3 fotos obrigatórias:
  - Foto Dianteira
  - Foto Traseira
  - Foto do Chassi

##### Laudo de Ruído
- Selecione o equipamento calibrado
- Insira 6 medições de aceleração
- Insira 6 medições de marcha lenta
- Sistema calcula automaticamente:
  - Mediana
  - Valor máximo
  - Resultado final

##### Laudo Pino Rei
- Selecione equipamento de medição
- Preencha checklist de inspeção:
  - Posição vertical
  - Presença de trincas
  - Integridade da fixação
  - Diâmetro medido
- Upload de fotos
- Resultado da inspeção

##### Laudo Quinta Roda
- Dados do fabricante
- Modelo e número de identificação
- Checklist de 12 itens
- Upload de 3 fotos
- Resultado final

#### Passo 4: Upload de Imagens

1. Clique em **Escolher Arquivo**
2. Selecione a imagem (JPG, PNG)
3. Aguarde o upload
4. Repita para cada foto necessária

> ⚠️ **Dica**: Imagens devem ter no máximo 5MB

#### Passo 5: Gerar PDF

1. Revise todos os dados
2. Clique em **Gerar Laudo PDF**
3. Aguarde o processamento
4. O PDF será baixado automaticamente

### Página Dedicada para Laudos Frequentes

Para laudos que você emite com frequência, use as páginas dedicadas:

- `/laudos/checklist` - Formulário expandido do Checklist
- `/laudos/pino-rei` - Interface otimizada para Pino Rei
- `/laudos/quinta-roda` - Formulário completo Quinta Roda

## 🔧 Gestão de Equipamentos

### Importância do Controle

Manter equipamentos calibrados é essencial para:
- ✅ Validade legal dos laudos
- ✅ Conformidade com normas
- ✅ Precisão das medições

### Cadastrar Equipamento

1. Acesse **Admin** > **Equipamentos**
2. Clique em **Novo Equipamento**
3. Preencha:

| Campo | Exemplo | Observação |
|-------|---------|------------|
| **Nome** | AKSO | Fabricante |
| **Modelo** | AK824 | Modelo do equipamento |
| **Número Certificado** | AKSO AK824 107420/24 | Identificação única |
| **Data Calibração** | 17/07/2024 | Última calibração |
| **Data Vencimento** | 17/07/2025 | Próxima calibração |
| **Tipo** | Decibelímetro | Categoria |

4. Clique em **Salvar**

### Notificações de Vencimento

O sistema alerta automaticamente:

- 🔴 **Vencido**: Equipamento fora da validade
- 🟡 **30 dias**: Vencerá no próximo mês
- 🟢 **Válido**: Equipamento em dia

### Renovar Calibração

1. Localize o equipamento
2. Clique em **Editar**
3. Atualize:
   - Nova data de calibração
   - Nova data de vencimento
   - Número do novo certificado
4. Salve as alterações

## 📊 Histórico e Relatórios

### Consultar Histórico

#### Acesso Rápido
No Dashboard, você vê os últimos laudos emitidos

#### Histórico Completo
1. Menu **Laudos** > **Histórico**
2. Use os filtros para refinar:
   - Período específico
   - Tipo de laudo
   - Cliente
   - Veículo

### Exportar Dados

#### Exportar Lista
1. Aplique os filtros desejados
2. Clique em **Exportar**
3. Escolha o formato:
   - Excel (.xlsx)
   - CSV
   - PDF

### Estatísticas

O sistema mostra automaticamente:
- Laudos por período
- Tipos mais emitidos
- Clientes mais ativos
- Taxa de aprovação/reprovação

## ⚙️ Configurações

### Dados da Empresa

Para usuários Admin:

1. Acesse **Admin** > **Configurações**
2. Atualize:
   - Nome da empresa
   - CNPJ
   - Endereço completo
   - Telefone
   - Logo (upload de imagem)
3. Clique em **Salvar Configurações**

> ℹ️ Estes dados aparecem nos laudos emitidos

### Gerenciar Usuários (Admin)

#### Criar Usuário
1. **Admin** > **Usuários**
2. Clique em **Novo Usuário**
3. Defina:
   - Nome de usuário
   - Senha inicial
   - Tipo (Admin/Inspetor A/Inspetor B)
4. Salve

#### Resetar Senha
1. Localize o usuário
2. Clique em **Resetar Senha**
3. Informe a nova senha temporária
4. O usuário deve alterar no próximo acesso

### Personalização de Laudos

Cada usuário pode ter suas configurações:
- Título do laudo
- Informações da empresa
- Texto de rodapé

## ❓ Dúvidas Frequentes

### Problemas Comuns

#### Não consigo fazer login
- Verifique usuário e senha
- Certifique-se que Caps Lock está desligado
- Limpe o cache do navegador (Ctrl+F5)

#### PDF não é gerado
- Verifique se todos campos obrigatórios foram preenchidos
- Confirme que as imagens foram carregadas
- Tente um navegador diferente

#### Imagem não carrega
- Verifique o tamanho (máx 5MB)
- Formato deve ser JPG ou PNG
- Conexão internet estável

#### Equipamento não aparece na lista
- Confirme que está cadastrado
- Verifique se não está vencido
- Equipamento deve estar ativo

### Atalhos Úteis

| Atalho | Função |
|--------|--------|
| `Ctrl + N` | Novo laudo |
| `Ctrl + S` | Salvar |
| `Ctrl + P` | Imprimir |
| `Esc` | Cancelar/Fechar |

### Boas Práticas

1. **Backup Regular**
   - Sistema faz backup automático
   - Exporte dados importantes mensalmente

2. **Organização**
   - Mantenha cadastros atualizados
   - Delete laudos antigos desnecessários
   - Organize clientes por categoria

3. **Segurança**
   - Troque senha periodicamente
   - Não compartilhe seu acesso
   - Faça logout ao terminar

4. **Qualidade**
   - Revise dados antes de gerar PDF
   - Mantenha equipamentos calibrados
   - Tire fotos com boa iluminação

## 📞 Suporte

### Contato

Em caso de dúvidas ou problemas:

- **Email**: suporte@easylaudos.com.br
- **WhatsApp**: (00) 00000-0000
- **Horário**: Segunda a Sexta, 8h às 18h

### Informações Úteis para Suporte

Ao contatar o suporte, tenha em mãos:
- Seu nome de usuário
- Descrição detalhada do problema
- Prints de tela (se possível)
- Navegador e versão utilizados

## 🔄 Atualizações

O sistema é atualizado regularmente com:
- Correções de bugs
- Novos recursos
- Melhorias de performance
- Atualizações de segurança

### Como saber se há atualizações?

- Avisos aparecem no Dashboard
- Email para administradores
- Changelog disponível no sistema

## 📝 Glossário

| Termo | Significado |
|-------|-------------|
| **OS** | Ordem de Serviço |
| **LIT** | Laudo de Inspeção Técnica |
| **CRLV** | Certificado de Registro e Licenciamento de Veículo |
| **Chassi** | Número de identificação do veículo |
| **Calibração** | Ajuste e certificação de equipamento de medição |
| **PDF** | Portable Document Format (formato do laudo final) |
| **Upload** | Envio de arquivo para o sistema |
| **Dashboard** | Painel principal com resumo de informações |

---

**Versão do Manual**: 1.0.0  
**Última Atualização**: Setembro 2025  
**Easy Laudos** - Sistema de Emissão de Laudos Técnicos