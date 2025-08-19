# ✅ CHECKLIST PÓS-MIGRAÇÃO - SISTEMA GTS

## 📋 Verificações Essenciais

Este documento contém todas as verificações manuais que devem ser realizadas após a migração do sistema GTS para garantir que tudo está funcionando corretamente.

---

## 1️⃣ VERIFICAÇÕES BÁSICAS

### 🔍 Sistema e Dependências
- [ ] Node.js instalado (versão 18+)
- [ ] npm instalado (versão 9+)
- [ ] Todas as dependências instaladas sem erros
- [ ] Comando `npm run dev` funciona sem erros
- [ ] Sistema acessível em http://localhost:3000

### 📁 Estrutura de Arquivos
- [ ] Pasta `prisma/` existe com `dev.db`
- [ ] Pasta `public/uploads/` existe com imagens
- [ ] Pasta `templates/` existe com arquivos HTML
- [ ] Arquivos `.env` e `.env.local` configurados
- [ ] Logo da empresa em `public/logo.png`

---

## 2️⃣ VERIFICAÇÕES DO BANCO DE DADOS

### 🗄️ Conexão e Estrutura
- [ ] Banco SQLite acessível
- [ ] Comando `npx prisma studio` abre o banco
- [ ] Tabelas criadas corretamente:
  - [ ] Client
  - [ ] Vehicle
  - [ ] Laudo
  - [ ] Equipment
  - [ ] LaudoRuido
  - [ ] LaudoPinoRei
  - [ ] LaudoQuintaRoda
  - [ ] AdminSetting

### 📊 Dados Migrados
- [ ] Clientes existentes aparecem
- [ ] Veículos cadastrados estão presentes
- [ ] Laudos anteriores foram migrados
- [ ] Equipamentos cadastrados estão corretos

---

## 3️⃣ VERIFICAÇÕES FUNCIONAIS

### 🏠 Página Inicial
- [ ] Página inicial carrega sem erros
- [ ] Menu de navegação funciona
- [ ] Links para todas as seções estão ativos
- [ ] Logo da empresa aparece corretamente

### 👥 Módulo de Clientes
- [ ] Lista de clientes carrega
- [ ] Busca de clientes funciona
- [ ] Cadastro de novo cliente funciona
- [ ] Edição de cliente funciona
- [ ] Exclusão de cliente funciona (se permitido)

### 🚗 Módulo de Veículos
- [ ] Lista de veículos carrega
- [ ] Cadastro de novo veículo funciona
- [ ] Associação com cliente funciona
- [ ] Busca por placa funciona
- [ ] Busca por chassi funciona

### 📝 Módulo de Laudos

#### Laudo de Checklist
- [ ] Formulário de checklist abre
- [ ] Todos os campos são preenchíveis
- [ ] Salvar laudo funciona
- [ ] Gerar PDF funciona
- [ ] PDF gerado tem layout correto
- [ ] Logo aparece no PDF

#### Laudo de Pino Rei
- [ ] Formulário de pino rei abre
- [ ] Seleção de equipamento funciona
- [ ] Campos de medição funcionam
- [ ] Upload de fotos funciona
- [ ] Gerar PDF funciona
- [ ] PDF contém todas as informações

#### Laudo de Quinta Roda
- [ ] Formulário de quinta roda abre
- [ ] 12 itens de verificação funcionam
- [ ] Upload de 3 fotos funciona
- [ ] Resultado final é calculado
- [ ] PDF é gerado corretamente

#### Laudo de Ruído
- [ ] Formulário de ruído abre
- [ ] Campos de medição funcionam
- [ ] Cálculo de médias funciona
- [ ] Equipamento de medição é selecionável
- [ ] PDF é gerado com gráficos

### 🔧 Módulo de Equipamentos
- [ ] Lista de equipamentos carrega
- [ ] Cadastro de novo equipamento funciona
- [ ] Validação de datas funciona
- [ ] Filtro por tipo funciona
- [ ] Alerta de vencimento funciona

---

## 4️⃣ VERIFICAÇÕES DE UPLOADS E IMAGENS

### 📸 Arquivos de Upload
- [ ] Imagens antigas foram restauradas
- [ ] Upload de novas imagens funciona
- [ ] Imagens aparecem nos laudos
- [ ] Imagens aparecem nos PDFs
- [ ] Tamanho das imagens está otimizado

### 🖼️ Verificar Imagens Específicas
- [ ] Fotos de veículos (FRENTE, LADO)
- [ ] Fotos de quinta roda
- [ ] Fotos de pino rei
- [ ] Logo da empresa
- [ ] Outras imagens do sistema

---

## 5️⃣ VERIFICAÇÕES DE APIS

### 🔌 APIs REST
Execute no terminal ou Postman:

- [ ] GET `/api/clients` - Lista clientes
- [ ] GET `/api/vehicles` - Lista veículos
- [ ] GET `/api/laudos` - Lista laudos
- [ ] GET `/api/equipments` - Lista equipamentos
- [ ] GET `/api/laudos/next-os` - Próximo número OS
- [ ] POST `/api/laudos/pdf` - Gera PDF

### 📡 Respostas das APIs
- [ ] Status 200 para requisições válidas
- [ ] Dados JSON bem formatados
- [ ] Paginação funciona (se aplicável)
- [ ] Filtros funcionam corretamente

---

## 6️⃣ VERIFICAÇÕES DE SEGURANÇA

### 🔐 Configurações Sensíveis
- [ ] Chaves API não estão expostas no código
- [ ] `.env` não está no repositório Git
- [ ] Senha do banco (se houver) está segura
- [ ] HTTPS configurado (produção)
- [ ] CORS configurado corretamente

### 🛡️ Validações
- [ ] Validação de CNPJ funciona
- [ ] Validação de campos obrigatórios
- [ ] Tratamento de erros adequado
- [ ] Logs não expõem dados sensíveis

---

## 7️⃣ VERIFICAÇÕES DE PERFORMANCE

### ⚡ Desempenho
- [ ] Páginas carregam em menos de 3 segundos
- [ ] PDFs são gerados em menos de 5 segundos
- [ ] Busca retorna resultados rapidamente
- [ ] Upload de imagens não trava o sistema
- [ ] Múltiplos usuários simultâneos (se aplicável)

### 💾 Recursos
- [ ] Uso de memória está normal
- [ ] CPU não fica sobrecarregada
- [ ] Espaço em disco suficiente
- [ ] Logs não crescem excessivamente

---

## 8️⃣ VERIFICAÇÕES DE INTEGRAÇÃO

### 🔗 OpenAI API
- [ ] Chave da API está configurada
- [ ] Assistant ID está correto
- [ ] Integração funciona (se usada)
- [ ] Limites de uso configurados
- [ ] Fallback em caso de erro

### 🖨️ Geração de PDFs
- [ ] Puppeteer instalado corretamente
- [ ] Chrome/Chromium disponível
- [ ] Templates HTML funcionam
- [ ] Fontes são carregadas
- [ ] Imagens aparecem nos PDFs

---

## 9️⃣ TESTES FUNCIONAIS COMPLETOS

### 📝 Criar um Laudo Completo
1. [ ] Cadastrar novo cliente
2. [ ] Cadastrar novo veículo
3. [ ] Criar laudo de checklist
4. [ ] Adicionar todas as informações
5. [ ] Gerar PDF
6. [ ] Verificar PDF gerado
7. [ ] Salvar e fechar

### 🔄 Fluxo Completo
1. [ ] Login no sistema (se aplicável)
2. [ ] Navegar por todos os módulos
3. [ ] Criar registros em cada módulo
4. [ ] Editar registros criados
5. [ ] Gerar relatórios
6. [ ] Fazer logout (se aplicável)

---

## 🔟 VERIFICAÇÕES FINAIS

### 📱 Responsividade
- [ ] Sistema funciona em desktop
- [ ] Sistema funciona em tablet
- [ ] Sistema funciona em mobile
- [ ] PDFs são legíveis em todos os dispositivos

### 🌐 Navegadores
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (se Mac)
- [ ] Mobile browsers

### 📚 Documentação
- [ ] README.md está atualizado
- [ ] Instruções de uso estão claras
- [ ] Contatos de suporte definidos
- [ ] Backup agendado configurado

---

## ⚠️ PROBLEMAS COMUNS E SOLUÇÕES

### Problema: "Cannot find module"
**Solução:** Execute `npm install` novamente

### Problema: "Database connection failed"
**Solução:** Verifique o arquivo `.env` e o caminho do banco

### Problema: "Port 3000 already in use"
**Solução:** Pare outros processos ou mude a porta

### Problema: "Puppeteer failed to launch"
**Solução:** Instale dependências do Chrome/Chromium

### Problema: "Upload failed"
**Solução:** Verifique permissões da pasta `public/uploads`

---

## 📞 SUPORTE

Em caso de problemas:
1. Verifique os logs em `migration/logs/`
2. Execute `node migration/check-prerequisites.js`
3. Consulte `migration/README-MIGRACAO.md`
4. Verifique o relatório de migração

---

## ✅ APROVAÇÃO FINAL

- [ ] **Todas as verificações acima foram realizadas**
- [ ] **Sistema está funcionando corretamente**
- [ ] **Backup de segurança foi criado**
- [ ] **Equipe foi treinada no uso do sistema**
- [ ] **Documentação está completa e atualizada**

**Data da Verificação:** ___/___/______

**Responsável:** _______________________

**Assinatura:** ________________________

---

*Este documento foi gerado automaticamente pelo sistema de migração GTS*
*Versão: 0.1.0 | Data: 18/01/2025*