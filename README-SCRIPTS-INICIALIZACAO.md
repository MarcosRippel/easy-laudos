# 📋 Guia Completo - Scripts de Inicialização do Sistema

## ✅ **PROBLEMA RESOLVIDO**

### Problema Original:
- Scripts executavam na pasta errada (`C:\Windows\system32`)
- Sistema fechava sozinho sem mostrar erros
- Não conseguia encontrar `package.json`

### Solução Aplicada:
- Scripts agora mudam automaticamente para pasta correta
- Adicionado `pause` no final para manter janela aberta
- Captura e exibição de todos os erros

---

## 🚀 **SCRIPTS PRINCIPAIS - USE ESTES!**

### 1. **INICIAR-SISTEMA-COMPLETO.bat** ⭐
Script completo com todas as verificações e configurações.

**Como usar:**
1. Clique com botão direito em `INICIAR-SISTEMA-COMPLETO.bat`
2. Selecione **"Executar como administrador"**
3. O script NÃO fechará sozinho - você verá todos os erros (se houver)

**Características:**
- ✅ Interface visual com caixas e ícones
- ✅ 9 etapas de configuração
- ✅ Muda automaticamente para pasta correta
- ✅ Verifica todos os pré-requisitos
- ✅ Instala dependências se necessário
- ✅ Configura IP virtual 177.126.153.190
- ✅ Detecta automaticamente se deve usar `npm run dev` ou `npm start`
- ✅ Mantém janela aberta com `pause`
- ✅ Mostra código de erro e possíveis causas

### 2. **INICIAR-SISTEMA-FINAL.bat** ⭐
Versão definitiva e mais robusta.

**Características:**
- ✅ Tratamento avançado de erros
- ✅ Usa `choice` para perguntas (mais confiável)
- ✅ Sempre mantém janela aberta

---

## 📁 **SCRIPTS DE DEBUG E DIAGNÓSTICO**

### Para Identificar Problemas:

1. **INICIAR-SISTEMA-DEBUG.bat**
   - Modo debug super detalhado
   - Mostra cada etapa do processo
   - Mantém janela aberta

2. **INICIAR-SISTEMA-MANUAL.bat**
   - Execução passo a passo
   - Pausa após cada comando
   - Permite escolher como iniciar

3. **DIAGNOSTICO-SISTEMA.bat**
   - Verifica todos os pré-requisitos
   - Não inicia o sistema, apenas verifica
   - Útil para identificar problemas

---

## 📁 **SCRIPTS ALTERNATIVOS**

### Scripts Simplificados:

4. **INICIAR-SISTEMA-CORRIGIDO.bat**
   - Versão corrigida com mudança de pasta
   - Verificações completas

5. **INICIAR-SISTEMA-DIRETO.bat**
   - Força caminho absoluto fixo
   - Menos verificações, mais rápido

6. **INICIAR-SISTEMA-SIMPLES.bat**
   - Versão mais básica
   - Menos verificações

---

## 🔧 **CONFIGURAÇÃO DO SISTEMA**

### IP Virtual:
- **IP**: 177.126.153.190
- **Portas**: 3000 (principal), 9080 (HTTP nginx), 9443 (HTTPS nginx)

### URLs de Acesso:
- **Local**: http://localhost:3000
- **IP Virtual**: http://177.126.153.190:3000
- **Com Nginx HTTP**: http://177.126.153.190:9080
- **Com Nginx HTTPS**: https://177.126.153.190:9443

### Pré-requisitos:
- ✅ Node.js instalado (v24.5.0 detectado)
- ✅ NPM instalado (v11.5.1 detectado)
- ✅ Executar como Administrador
- ✅ Estar na pasta do projeto

---

## 🛠️ **SOLUÇÃO DE PROBLEMAS**

### Se o script fecha sozinho:
1. Use `INICIAR-SISTEMA-COMPLETO.bat` ou `INICIAR-SISTEMA-FINAL.bat` (tem pause no final)
2. Execute como Administrador
3. Verifique se está na pasta correta

### Se não encontra package.json:
1. O script deve estar em: `d:\General Truck System\5. Emissor de Laudos - Inspetor`
2. Use `INICIAR-SISTEMA-DIRETO.bat` que força o caminho

### Se tem erro ao instalar dependências:
1. Verifique conexão com internet
2. Delete a pasta `node_modules` e tente novamente
3. Execute `npm install` manualmente

### Se a porta 3000 está em uso:
1. O script perguntará se deseja parar o processo anterior
2. Ou execute `taskkill /F /IM node.exe` manualmente

---

## 📝 **COMANDOS MANUAIS**

Se preferir executar manualmente no terminal:

```batch
# 1. Navegue até a pasta do projeto
cd "d:\General Truck System\5. Emissor de Laudos - Inspetor"

# 2. Instale dependências
npm install

# 3. Configure IP virtual (como admin)
netsh interface ipv4 add address "Loopback Pseudo-Interface 1" 177.126.153.190 255.255.255.255

# 4. Inicie o sistema
npm run dev
```

---

## ✅ **STATUS ATUAL**

- **Node.js**: v24.5.0 ✅
- **NPM**: v11.5.1 ✅
- **Scripts**: Corrigidos e funcionando ✅
- **IP Virtual**: Configurado ✅
- **Problema de fechar sozinho**: RESOLVIDO ✅

---

## 📌 **RECOMENDAÇÃO**

### **Para uso diário:**
**Use o `INICIAR-SISTEMA-COMPLETO.bat` como Administrador**

### **Para debug:**
**Use o `INICIAR-SISTEMA-DEBUG.bat` ou `INICIAR-SISTEMA-MANUAL.bat`**

Estes são os scripts mais completos, robustos e que não fecharão sozinho, permitindo que você veja qualquer erro que possa ocorrer.

---

## 🔍 **DIFERENÇAS ENTRE OS SCRIPTS**

| Script | Interface | Verificações | Debug | Pause |
|--------|-----------|--------------|-------|-------|
| COMPLETO | ✅ Visual com caixas | ✅ Todas | Normal | ✅ Sim |
| FINAL | Normal | ✅ Todas | ✅ Avançado | ✅ Sim |
| DEBUG | Normal | ✅ Todas | ✅ Detalhado | ✅ Sim |
| MANUAL | Normal | Passo a passo | ✅ Interativo | ✅ Sim |
| DIRETO | Normal | Básicas | Não | ✅ Sim |
| SIMPLES | Normal | Mínimas | Não | Não |

---

## 📞 **SUPORTE**

Se ainda tiver problemas:
1. Execute `DIAGNOSTICO-SISTEMA.bat` e verifique o resultado
2. Use `INICIAR-SISTEMA-MANUAL.bat` para controle passo a passo
3. Verifique os logs de erro que aparecem na tela

---

## 📦 **OUTROS SCRIPTS ÚTEIS**

- **INSTALAR-NGINX-WINDOWS.bat** - Instala e configura Nginx
- **MONITORAR-SISTEMA.bat** - Monitora o sistema em tempo real
- **DESINSTALAR-IP-VIRTUAL.bat** - Remove configurações de IP virtual

---

*Última atualização: 08/09/2025*