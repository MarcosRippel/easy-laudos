# 📦 MIGRAÇÃO DO SISTEMA GTS (General Truck System)

## 🎯 Visão Geral
Este guia fornece instruções completas para migrar o sistema GTS para um novo servidor, mantendo TODAS as configurações, dados e funcionalidades intactas.

## ⚡ Pré-requisitos no Servidor de Destino
- **Node.js**: versão 18.x ou superior
- **npm**: versão 9.x ou superior
- **Sistema Operacional**: Windows, Linux ou macOS
- **Espaço em Disco**: Mínimo 5GB livre
- **RAM**: Mínimo 2GB disponível

## 📝 Estrutura dos Scripts de Migração

### Scripts de Backup (Servidor Origem)
1. `check-prerequisites.js` - Verifica pré-requisitos
2. `backup-database.js` - Backup do banco SQLite
3. `backup-uploads.js` - Backup dos arquivos de upload
4. `backup-pdfs.js` - Backup dos PDFs gerados
5. `create-migration-package.js` - Cria pacote ZIP completo

### Scripts de Restauração (Servidor Destino)
6. `install-dependencies.js` - Instala dependências Node.js
7. `setup-prisma.js` - Configura Prisma e restaura banco
8. `restore-uploads.js` - Restaura arquivos de upload
9. `test-apis.js` - Testa APIs críticas
10. `test-pdf-generation.js` - Valida geração de PDFs

### Script Principal
11. `migration-orchestrator.js` - Orquestra todo o processo

## 🚀 PROCESSO DE MIGRAÇÃO PASSO A PASSO

### PARTE 1: NO SERVIDOR DE ORIGEM

#### Passo 1: Preparar Backup
```bash
# Navegue até a pasta do projeto
cd c:/Apps/GTS-main

# Execute o verificador de pré-requisitos
node migration/check-prerequisites.js

# Crie o pacote de migração completo
node migration/create-migration-package.js
```

Isso criará um arquivo `gts-migration-package-[timestamp].zip` contendo:
- Todo o código fonte
- Banco de dados SQLite
- Todos os arquivos de upload
- Todos os PDFs gerados
- Scripts de migração
- Configurações de ambiente

#### Passo 2: Transferir Pacote
Transfira o arquivo ZIP para o servidor de destino usando:
- FTP/SFTP
- Pen Drive
- Cloud Storage
- Rede local

### PARTE 2: NO SERVIDOR DE DESTINO

#### Passo 3: Extrair e Preparar
```bash
# Crie a pasta do projeto
mkdir c:/Apps
cd c:/Apps

# Extraia o pacote
unzip gts-migration-package-*.zip

# Entre na pasta do projeto
cd GTS-main
```

#### Passo 4: Configurar Ambiente
```bash
# Copie o arquivo de ambiente
cp .env.example .env
cp .env.example .env.local

# IMPORTANTE: Edite .env e .env.local com suas configurações
# - Mantenha as chaves da API OpenAI
# - Ajuste URLs se necessário
```

#### Passo 5: Executar Migração
```bash
# Execute o orquestrador de migração
node migration/migration-orchestrator.js
```

Este script automaticamente:
1. ✅ Verifica pré-requisitos
2. ✅ Instala dependências Node.js
3. ✅ Configura o Prisma
4. ✅ Restaura o banco de dados
5. ✅ Restaura arquivos de upload
6. ✅ Testa todas as APIs
7. ✅ Valida geração de PDFs

#### Passo 6: Iniciar o Sistema
```bash
# Modo desenvolvimento
npm run dev

# OU Modo produção
npm run build
npm run start
```

## 🔍 VERIFICAÇÕES PÓS-MIGRAÇÃO

### Verificações Automáticas
O script `test-apis.js` verifica automaticamente:
- ✅ Conexão com banco de dados
- ✅ APIs de Clientes
- ✅ APIs de Veículos
- ✅ APIs de Laudos (todos os tipos)
- ✅ APIs de Equipamentos
- ✅ Geração de PDFs

### Verificações Manuais
Consulte `CHECKLIST-POS-MIGRACAO.md` para verificações manuais detalhadas.

## 🆘 SOLUÇÃO DE PROBLEMAS

### Erro: "Cannot find module"
```bash
# Reinstale as dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Database connection failed"
```bash
# Verifique o arquivo .env
# DATABASE_URL deve apontar para: file:./prisma/dev.db

# Recrie o banco se necessário
npx prisma db push
node migration/restore-database.js
```

### Erro: "Puppeteer failed to launch"
```bash
# Instale dependências do sistema para Puppeteer
# Windows: Geralmente funciona automaticamente
# Linux: sudo apt-get install chromium-browser
# macOS: brew install chromium
```

### Erro: "Upload folder not found"
```bash
# Crie a pasta e restaure uploads
mkdir -p public/uploads
node migration/restore-uploads.js
```

## 📊 ESTRUTURA DO SISTEMA

```
GTS-main/
├── app/                    # Aplicação Next.js
├── components/             # Componentes React
├── prisma/                 # Schema e migrações do banco
│   └── dev.db             # Banco de dados SQLite
├── public/                 
│   ├── uploads/           # Imagens dos laudos (68 arquivos)
│   └── logo.png           # Logo da empresa
├── templates/              # Templates HTML para PDFs
├── types/                  # TypeScript types
├── migration/              # Scripts de migração
├── .env                    # Variáveis de ambiente
└── .env.local             # Variáveis locais
```

## 🔐 INFORMAÇÕES SENSÍVEIS

### Arquivos com Dados Sensíveis
- `.env` e `.env.local` - Chaves de API
- `prisma/dev.db` - Banco de dados com todos os registros
- `public/uploads/` - Imagens dos veículos e laudos

### Recomendações de Segurança
1. **NUNCA** commite `.env` ou `.env.local` no Git
2. **SEMPRE** faça backup antes de migrar
3. **PROTEJA** o acesso ao servidor
4. **MONITORE** logs após migração

## 📝 NOTAS IMPORTANTES

1. **Banco de Dados**: O sistema usa SQLite. O arquivo `dev.db` contém TODOS os dados.
2. **Uploads**: As imagens em `public/uploads/` estão vinculadas aos laudos no banco.
3. **Templates**: Os arquivos HTML em `templates/` são essenciais para gerar PDFs.
4. **Dependências**: Puppeteer requer Chrome/Chromium instalado.
5. **Portas**: O sistema roda na porta 3000 por padrão.

## ✅ CHECKLIST RÁPIDO

- [ ] Node.js instalado
- [ ] Pacote de migração transferido
- [ ] Arquivos extraídos
- [ ] .env configurado
- [ ] Dependências instaladas
- [ ] Banco restaurado
- [ ] Uploads restaurados
- [ ] Sistema testado
- [ ] PDFs funcionando

## 📞 SUPORTE

Em caso de problemas durante a migração:
1. Verifique os logs em `migration/logs/`
2. Consulte `CHECKLIST-POS-MIGRACAO.md`
3. Execute `node migration/test-apis.js` para diagnóstico

---

**IMPORTANTE**: Sempre faça backup completo antes de iniciar a migração!

Data de criação: ${new Date().toLocaleString('pt-BR')}
Versão do sistema: 0.1.0