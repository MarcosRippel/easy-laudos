# 🔀 MÚLTIPLOS SISTEMAS SEM CONFLITO - GUIA COMPLETO

## 📋 PROBLEMA RESOLVIDO
Você tem múltiplos sistemas rodando no mesmo servidor e precisa isolar cada um com IPs diferentes para evitar conflitos.

## ✅ SOLUÇÃO: IPs VIRTUAIS DIFERENTES

### **Sistema 1 - Outro Sistema (JÁ EXISTENTE):**
- **IP Virtual:** `177.126.153.189`
- **Porta:** 3001 (ou outra)
- **Domínio:** outro.exemplo.com.br

### **Sistema 2 - Emissor de Laudos (ESTE):**
- **IP Virtual:** `177.126.153.190`
- **Porta:** 3000
- **Domínio:** inspetor.terpens.com.br

---

## 🚀 COMO CONFIGURAR

### **1. Execute o configurador de múltiplos sistemas:**
```batch
# Como ADMINISTRADOR:
CONFIGURAR-MULTIPLOS-SISTEMAS.bat
```

### **2. Inicie o Sistema Emissor (isolado):**
```batch
# Como ADMINISTRADOR:
INICIAR-SISTEMA-ISOLADO.bat
```

---

## 🌐 CONFIGURAÇÃO DNS PARA MÚLTIPLOS DOMÍNIOS

### **⚠️ IMPORTANTE:**
**NÃO** use os IPs virtuais (177.126.153.x) no DNS! Use seu **IP PÚBLICO**.

### **No editor de DNS:**

Para ter múltiplos domínios no mesmo servidor, configure assim:

```dns
# Sistema 1 - Outro Sistema (já existente)
outro.exemplo.com.br → A → [SEU_IP_PUBLICO]

# Sistema 2 - Emissor de Laudos (ESTE)
inspetor.terpens.com.br → A → [SEU_IP_PUBLICO]
```

---

## 🔧 CONFIGURAÇÃO DO ROTEADOR

### **Port Forwarding para Múltiplos Sistemas:**

| Sistema | Domínio | Porta Externa | IP Interno | Porta Interna |
|---------|---------|--------------|------------|---------------|
| Outro | outro.exemplo.com.br | 8080 | IP_DO_PC | 3001 |
| Outro | outro.exemplo.com.br | 3001 | IP_DO_PC | 3001 |
| Emissor | inspetor.terpens.com.br | 80 | IP_DO_PC | 3000 |
| Emissor | inspetor.terpens.com.br | 3000 | IP_DO_PC | 3000 |

### **Exemplo com IPs reais:**
```
Sistema 1 (Outro - já existente):
  Porta 8080 → 192.168.1.100:3001
  Porta 3001 → 192.168.1.100:3001

Sistema 2 (Emissor - ESTE):
  Porta 80 → 192.168.1.100:3000
  Porta 3000 → 192.168.1.100:3000
```

---

## 🔄 USANDO NGINX COMO PROXY REVERSO (RECOMENDADO)

Para ter múltiplos domínios na porta 80, use Nginx:

### **1. Instale o Nginx:**
```batch
INSTALAR-NGINX-WINDOWS.bat
```

### **2. Configure os sites no Nginx:**

**Para Sistema 1 (Outro - já existente):**
```nginx
server {
    listen 80;
    server_name outro.exemplo.com.br;
    
    location / {
        proxy_pass http://177.126.153.189:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Para Sistema 2 (Emissor - ESTE):**
```nginx
server {
    listen 80;
    server_name inspetor.terpens.com.br;
    
    location / {
        proxy_pass http://177.126.153.190:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📊 TABELA DE IPs E PORTAS

| Sistema | IP Virtual Local | Porta | URL Local | URL Externa |
|---------|-----------------|-------|-----------|-------------|
| Outro Sistema (existente) | 177.126.153.189 | 3001 | http://177.126.153.189:3001 | http://outro.exemplo.com.br |
| Emissor de Laudos (ESTE) | 177.126.153.190 | 3000 | http://177.126.153.190:3000 | http://inspetor.terpens.com.br |

---

## ✅ VANTAGENS DESTA SOLUÇÃO

1. **Sem Conflitos:** Cada sistema tem seu próprio IP virtual
2. **Isolamento Total:** Sistemas não interferem entre si
3. **Múltiplos Domínios:** Cada sistema pode ter seu domínio
4. **Fácil Manutenção:** Sistemas independentes
5. **Sem Docker:** Solução nativa do Windows

---

## 🔴 FLUXO COMPLETO

```
Internet → IP Público → Roteador → PC → Nginx (opcional)
                                          ├→ 177.126.153.189:3001 (Outro - existente)
                                          └→ 177.126.153.190:3000 (Emissor - ESTE)
```

---

## 📝 COMANDOS ÚTEIS

### **Ver IPs virtuais configurados:**
```cmd
netsh interface ipv4 show address "Loopback Pseudo-Interface 1"
```

### **Remover um IP virtual:**
```cmd
netsh interface ipv4 delete address "Loopback Pseudo-Interface 1" 177.126.153.190
```

### **Ver portas em uso:**
```cmd
netstat -an | findstr :3000
netstat -an | findstr :3001
```

---

## 🚨 SOLUÇÃO DE PROBLEMAS

### **Conflito de portas?**
- Use portas diferentes: 3000, 3001, 3002, etc.

### **IP virtual não funciona?**
- Execute como Administrador
- Reinicie o computador após configurar

### **DNS não resolve?**
- Use IP público no DNS, não o virtual
- Aguarde propagação (até 48h)

---

## 💡 DICA IMPORTANTE

**Para produção**, considere usar:
- **Nginx** como proxy reverso (já incluído nos scripts)
- **SSL/HTTPS** para segurança
- **Firewall** bem configurado
- **Backup** regular dos sistemas

---

## 📋 RESUMO RÁPIDO

1. **Configure IPs virtuais diferentes** para cada sistema
2. **Use portas diferentes** para cada sistema
3. **Configure DNS** com IP público (mesmo para todos)
4. **Configure roteador** com port forwarding diferente
5. **Use Nginx** para gerenciar múltiplos domínios

**Resultado:** Múltiplos sistemas isolados sem conflito!