# 🌐 CONFIGURAÇÃO DNS E ROTEADOR - GUIA COMPLETO

## ⚠️ AVISO IMPORTANTE
**NÃO USE 177.126.153.190 NO DNS!** Este é um IP virtual local que só funciona dentro do seu computador.

---

## 📊 ENTENDA OS IPs

| Tipo de IP | Valor | Onde Funciona | Uso |
|------------|-------|---------------|-----|
| **IP Virtual Local** | 177.126.153.190 | Só no seu PC | Sistema roda aqui |
| **IP Local do PC** | 192.168.x.x | Na sua rede local | Configurar no roteador |
| **IP Público** | (descobrir abaixo) | Internet | Configurar no DNS |

---

## 🔍 PASSO 1: DESCUBRA SEUS IPs

### A) Descubra seu IP PÚBLICO (para o DNS):
```cmd
curl ifconfig.me
```
Ou acesse: https://whatismyipaddress.com

**Exemplo:** 189.45.67.123

### B) Descubra o IP LOCAL do seu PC (para o roteador):
```cmd
ipconfig
```
Procure por "Endereço IPv4"

**Exemplo:** 192.168.1.100

---

## 🌐 PASSO 2: CONFIGURE O DNS DO DOMÍNIO

### No painel de controle do seu domínio (Registro.br, GoDaddy, etc.):

```
Tipo: A
Nome: inspetor
Valor: [SEU IP PÚBLICO] ← NÃO use 177.126.153.190!
TTL: 3600
```

### Exemplo real:
```
inspetor.terpens.com.br → A → 189.45.67.123
```

---

## 🔧 PASSO 3: CONFIGURE O ROTEADOR

### OPÇÃO A: Port Forwarding (Recomendado)

Acesse seu roteador (geralmente http://192.168.1.1) e configure:

| Nome do Serviço | Porta Externa | IP Interno do PC | Porta Interna |
|-----------------|---------------|------------------|---------------|
| Inspetor Web | 80 | 192.168.1.100 | 3000 |
| Inspetor HTTPS | 443 | 192.168.1.100 | 3000 |
| Inspetor App | 3000 | 192.168.1.100 | 3000 |

### OPÇÃO B: DMZ (Mais simples, menos seguro)

1. Acesse configurações do roteador
2. Procure por "DMZ"
3. Ative e coloque o IP do seu PC: 192.168.1.100
4. Salve

---

## 📝 CONFIGURAÇÃO POR MARCA DE ROTEADOR

### **TP-Link:**
```
Avançado → NAT → Servidores Virtuais → Adicionar
- Porta de Serviço: 80
- Porta Interna: 3000
- IP: 192.168.1.100
- Protocolo: TCP
- Status: Ativado
```

### **D-Link:**
```
Avançado → Redirecionamento de Porta → Adicionar
- Nome: Inspetor
- IP Privado: 192.168.1.100
- Porta Pública: 80
- Porta Privada: 3000
```

### **Intelbras:**
```
Rede → NAT → Port Forwarding → Novo
- Nome: Sistema Inspetor
- Interface: WAN
- Protocolo: TCP
- Porta Externa: 80
- IP Interno: 192.168.1.100
- Porta Interna: 3000
```

### **Huawei:**
```
Internet → Port Mapping → Add
- Service Name: Inspetor
- External Port: 80
- Internal IP: 192.168.1.100
- Internal Port: 3000
```

---

## ✅ PASSO 4: TESTE A CONFIGURAÇÃO

### 1. Inicie o sistema:
```cmd
# Execute como ADMINISTRADOR:
INICIAR-GARANTIDO.bat
```

### 2. Teste localmente:
- http://localhost:3000 ✓
- http://177.126.153.190:3000 ✓

### 3. Teste na rede local:
- http://192.168.1.100:3000 ✓

### 4. Teste externamente (aguarde DNS propagar - até 48h):
- http://inspetor.terpens.com.br ✓

---

## 🔴 EXEMPLO COMPLETO REAL

Vamos supor:
- Seu IP público: **189.45.67.123**
- IP do seu PC: **192.168.1.100**

### 1. No DNS (Registro.br):
```
inspetor.terpens.com.br → A → 189.45.67.123
```

### 2. No Roteador:
```
Porta 80 Externa → 192.168.1.100:3000
Porta 3000 Externa → 192.168.1.100:3000
```

### 3. No Windows (já configurado pelos scripts):
```
IP Virtual: 177.126.153.190 (automático)
Sistema rodando na porta 3000
```

---

## 🚨 SOLUÇÃO DE PROBLEMAS

### DNS não funciona?
- Aguarde até 48h para propagação
- Teste com: `nslookup inspetor.terpens.com.br`

### Roteador não redireciona?
- Verifique se o firewall do roteador está permitindo
- Confirme o IP local do PC não mudou
- Teste desativando temporariamente o Windows Defender

### Sistema não inicia?
- Execute como Administrador
- Use `INICIAR-GARANTIDO.bat`
- Verifique se Node.js está instalado

---

## 📞 RESUMO RÁPIDO

1. **DNS aponta para:** Seu IP PÚBLICO (NÃO 177.126.153.190)
2. **Roteador redireciona para:** IP local do PC:3000
3. **Sistema roda em:** 177.126.153.190:3000 (virtual local)

**FLUXO:**
Internet → IP Público → Roteador → PC (192.168.x.x) → Sistema (177.126.153.190)

---

## ⚡ COMANDO RÁPIDO PARA DESCOBRIR TUDO

Execute este comando para ver todos os IPs necessários:

```cmd
@echo off
echo.
echo === SEUS IPs ===
echo.
echo IP PUBLICO (para DNS):
curl -s ifconfig.me
echo.
echo.
echo IP LOCAL (para roteador):
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do echo %%a
echo.
echo IP VIRTUAL (ja configurado):
echo 177.126.153.190
echo.
pause
```

Salve como `VER-MEUS-IPS.bat` e execute.