# 🚀 SISTEMA DE MIGRAÇÃO COMPLETA - SISTEMA DE LAUDOS

## 📋 **VISÃO GERAL**

Este é um **sistema completo de migração** para transferir o **Sistema de Laudos** de um computador para outro, garantindo que funcione **identicamente** no novo ambiente.

### **🎯 O que este sistema faz:**
- ✅ Exporta TUDO do sistema atual (código, banco, uploads, certificados)
- ✅ Instala automaticamente todas as dependências no novo computador
- ✅ Configura automaticamente IP, rede, firewall e SSL
- ✅ Valida tudo com diagnóstico automático e correção de erros
- ✅ Monitora o sistema pós-migração em tempo real
- ✅ Oferece rollback automático em caso de problemas

---

## 📦 **ARQUIVOS DO SISTEMA**

### **Scripts Principais:**
1. **`01-exportar-sistema-completo.bat`** - Exporta sistema atual
2. **`02-instalador-dependencias.bat`** - Instala Node.js, Python, Git
3. **`03-instalar-sistema-completo.bat`** - Instala sistema no novo PC
4. **`04-iniciar-sistema.bat`** - Inicia sistema completo
5. **`05-sistema-validacao-diagnostico.bat`** - Valida e diagnostica problemas
6. **`06-rollback-automatico.bat`** - Desfaz migração se necessário
7. **`07-monitoramento-pos-migracao.bat`** - Monitora sistema em tempo real

---

## 🔥 **PROCESSO COMPLETO DE MIGRAÇÃO**

### **📍 NO COMPUTADOR ATUAL (origem):**

#### **PASSO 1: Exportar Sistema**
```bash
# Execute como administrador:
01-exportar-sistema-completo.bat
```

**O que acontece:**
- ✅ Valida sistema atual
- ✅ Copia código fonte completo
- ✅ Faz backup do banco SQLite
- ✅ Copia uploads (fotos dos laudos)
- ✅ Copia certificados SSL
- ✅ Gera checksums para validação
- ✅ Compacta tudo em um arquivo ZIP

**Resultado:** Arquivo `Sistema-Laudos-Export-Completo-YYYY-MM-DD.zip`

---

### **📍 NO COMPUTADOR NOVO (destino):**

#### **PASSO 2: Instalar Dependências**
```bash
# Execute como administrador:
02-instalador-dependencias.bat
```

**O que instala:**
- ✅ **Node.js LTS** (versão mais recente)
- ✅ **Python 3.12** (com pip)
- ✅ **Git** (controle de versão)
- ✅ **Visual C++ Build Tools** (para compilação)
- ✅ **Chocolatey** (gerenciador de pacotes)

**⚠️ IMPORTANTE:** Reinicie o computador após este passo!

---

#### **PASSO 3: Instalar Sistema Completo**
```bash
# Coloque o arquivo ZIP exportado no mesmo diretório do script
# Execute como administrador:
03-instalar-sistema-completo.bat
```

**O que acontece:**
- ✅ Detecta arquivo ZIP automaticamente
- ✅ Descompacta em `C:\Sistema-Laudos`
- ✅ Instala pacotes Node.js e Python
- ✅ Configura banco de dados SQLite
- ✅ Detecta IP automaticamente
- ✅ Atualiza configurações (.env)
- ✅ Configura firewall
- ✅ Valida instalação completa

---

#### **PASSO 4: Validar Instalação**
```bash
# Execute para verificar se está tudo OK:
05-sistema-validacao-diagnostico.bat
```

**O que verifica:**
- 🔍 Estrutura completa do sistema
- 🔍 Dependências (Node.js, Python, npm, pip)
- 🔍 Integridade do banco de dados
- 🔍 Arquivos de upload
- 🔍 Certificados SSL
- 🔍 Configurações (.env)
- 🔍 Conectividade de rede
- 🔍 Portas disponíveis
- 🔍 Regras de firewall
- 🔍 Espaço em disco

**Resultado:** Relatório detalhado com problemas e sugestões

---

#### **PASSO 5: Iniciar Sistema**
```bash
# Execute para iniciar tudo:
04-iniciar-sistema.bat
```

**O que inicia:**
- 🚀 **Python Launcher** (proxy HTTPS na porta 443)
- 🚀 **Next.js Server** (aplicação na porta 3000)
- 🌐 **Abre navegador** automaticamente
- 📊 **Monitora status** dos serviços

**URLs de acesso:**
- 🔒 **HTTPS:** `https://inspetor.terpens.com.br`
- 🌐 **HTTP:** `http://localhost:3000`

**Login padrão:**
- 👤 **Usuário:** `admin`
- 🔑 **Senha:** `admin`

---

#### **PASSO 6: Monitorar Sistema (Opcional)**
```bash
# Para monitoramento contínuo:
07-monitoramento-pos-migracao.bat
```

**Monitora em tempo real:**
- 📊 Status dos serviços
- 🌐 Conectividade HTTP/HTTPS
- 💻 Recursos (CPU, RAM, Disco)
- 💾 Integridade do banco
- 📄 Logs de erro
- ⚠️ Alertas automáticos

---

## 🚨 **EM CASO DE PROBLEMAS**

### **🔧 Se algo der errado durante a migração:**

```bash
# Execute o rollback:
06-rollback-automatico.bat
```

**O que faz o rollback:**
- 🛑 Para todos os serviços
- 💾 Salva backup de dados importantes
- 🗑️ Remove sistema instalado
- 🔥 Limpa regras de firewall
- 📦 Limpa cache npm/pip
- 🔌 Libera portas
- 📋 Gera relatório do rollback

---

## 📊 **COMPONENTES DO SISTEMA**

### **🏗️ Arquitetura:**
- **Next.js 15.3.3** - Framework React principal
- **SQLite + Prisma ORM** - Banco de dados (9 tabelas)
- **Python HTTPS Proxy** - Proxy SSL/TLS
- **Node.js** - Runtime JavaScript
- **SSL/TLS** - Certificados para HTTPS

### **📁 Estrutura de diretórios:**
```
C:\Sistema-Laudos\
├── app\                    # Páginas Next.js
├── components\             # Componentes React
├── lib\                    # Bibliotecas
├── prisma\                 # Schema e banco SQLite
├── public\                 # Arquivos estáticos
│   └── uploads\            # Fotos dos laudos
├── ssl\                    # Certificados SSL
├── launcher-production\    # Sistema Python HTTPS
├── .env                    # Configurações
└── package.json           # Dependências Node.js
```

### **🗄️ Banco de dados (9 tabelas):**
- **Users** - Usuários (admin, client_a, client_b)
- **Clients** - Clientes
- **Vehicles** - Veículos
- **Laudos** - Laudos principais
- **Equipment** - Equipamentos de medição
- **LaudoRuido** - Laudos de ruído
- **LaudoPinoRei** - Laudos de pino rei
- **LaudoQuintaRoda** - Laudos de quinta roda
- **AdminSetting** - Configurações administrativas

---

## ⚙️ **CONFIGURAÇÕES IMPORTANTES**

### **🌐 Domínio e IPs:**
- **Domínio:** `inspetor.terpens.com.br`
- **IP detectado automaticamente** pelo sistema
- **Portas:** 3000 (HTTP) e 443 (HTTPS)

### **🔐 SSL/HTTPS:**
- Certificados em `ssl/inspetor.terpens.com.br.crt/key`
- Proxy HTTPS automático via Python
- Redirecionamento automático HTTP → HTTPS

### **📁 Arquivos importantes:**
- **Banco:** `prisma/dev.db`
- **Uploads:** `public/uploads/`
- **Configs:** `.env`
- **SSL:** `ssl/`

---

## 🔍 **LOGS E DIAGNÓSTICO**

### **📍 Localização dos logs:**
```
C:\Sistema-Laudos-Instalacao\
├── instalacao-dependencias-YYYY-MM-DD.log
├── instalacao-completa-YYYY-MM-DD.log
├── inicializacao-YYYY-MM-DD.log
├── validacao-diagnostico-YYYY-MM-DD.log
├── monitoramento-YYYY-MM-DD.log
├── rollback-YYYY-MM-DD.log
├── DIAGNOSTICO-COMPLETO.txt
├── RELATORIO-INSTALACAO.txt
├── RELATORIO-ROLLBACK.txt
└── status-sistema.txt
```

### **🔧 Solução de problemas comuns:**

#### **❌ "Node.js não encontrado"**
```bash
# Reinstale as dependências:
02-instalador-dependencias.bat
# Reinicie o computador
```

#### **❌ "Porta 3000 em uso"**
```bash
# Pare processos existentes:
taskkill /f /im "node.exe"
```

#### **❌ "Banco de dados não encontrado"**
```bash
# Valide a exportação e reinstale:
05-sistema-validacao-diagnostico.bat
```

#### **❌ "HTTPS não funciona"**
```bash
# Verifique certificados SSL:
dir C:\Sistema-Laudos\ssl\
```

---

## 📞 **SUPORTE**

### **🚨 Se precisar de ajuda:**

1. **Execute o diagnóstico:**
   ```bash
   05-sistema-validacao-diagnostico.bat
   ```

2. **Verifique os logs em:**
   ```
   C:\Sistema-Laudos-Instalacao\
   ```

3. **Se nada funcionar, execute o rollback:**
   ```bash
   06-rollback-automatico.bat
   ```

---

## ✅ **CHECKLIST DE MIGRAÇÃO**

### **📋 No computador atual:**
- [ ] Executar `01-exportar-sistema-completo.bat`
- [ ] Verificar arquivo ZIP gerado
- [ ] Transferir ZIP para computador novo

### **📋 No computador novo:**
- [ ] Executar como admin `02-instalador-dependencias.bat`
- [ ] Reiniciar o computador
- [ ] Colocar ZIP no diretório dos scripts
- [ ] Executar como admin `03-instalar-sistema-completo.bat`
- [ ] Executar `05-sistema-validacao-diagnostico.bat`
- [ ] Se tudo OK, executar `04-iniciar-sistema.bat`
- [ ] Testar acesso: `https://inspetor.terpens.com.br`
- [ ] Login: admin/admin

### **📋 Pós-migração:**
- [ ] Sistema rodando corretamente
- [ ] HTTPS funcionando
- [ ] Login funcionando
- [ ] Dados preservados
- [ ] Uploads preservados
- [ ] Monitoramento ativo (opcional)

---

## 🎉 **RESULTADO FINAL**

Após a migração bem-sucedida, você terá:

✅ **Sistema idêntico** ao original  
✅ **Todos os dados preservados**  
✅ **HTTPS funcionando**  
✅ **Mesmo domínio** (inspetor.terpens.com.br)  
✅ **Localização fixa** (C:\Sistema-Laudos)  
✅ **Monitoramento automático**  
✅ **Backups de segurança**  
✅ **Rollback disponível**  

**🚀 O sistema estará funcionando exatamente igual ao anterior, só que no novo computador!**

---

## 📖 **INFORMAÇÕES TÉCNICAS**

**Criado por:** Sistema Automatizado de Migração  
**Versão:** 1.0  
**Compatibilidade:** Windows 10/11  
**Requisitos:** Privilégios de administrador  
**Tempo estimado:** 30-60 minutos  

---

*Para suporte técnico, consulte os logs detalhados ou execute o sistema de diagnóstico automático.*