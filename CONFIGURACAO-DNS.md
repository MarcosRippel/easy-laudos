# 📡 Configuração DNS - Sistema Emissor de Laudos Docker

## 🎯 **Objetivo**
Configurar o DNS para que `inspetor.terpens.com.br` aponte para o sistema Docker com IP virtual `172.20.0.10`.

## 🌐 **Configuração no Provedor DNS**

### **1. Painel do Provedor DNS**
Acesse o painel de controle do seu provedor de DNS (onde o domínio `terpens.com.br` está registrado).

### **2. Criar/Editar Registro A**
Crie ou edite o registro DNS com as seguintes configurações:

```
Tipo: A
Nome: inspetor
Domínio: terpens.com.br
Destino: [IP-PUBLICO-DO-SEU-SERVIDOR]
TTL: 300 (5 minutos) ou 3600 (1 hora)
```

**⚠️ IMPORTANTE**: Substitua `[IP-PUBLICO-DO-SEU-SERVIDOR]` pelo IP público real do servidor onde o Docker está rodando.

### **3. Verificar IP Público do Servidor**
Execute no servidor:
```bash
curl -4 ifconfig.me
```
ou
```bash
curl -4 icanhazip.com
```

## 🔧 **Configuração Local (Desenvolvimento/Teste)**

### **Windows - Arquivo Hosts**
Para testar localmente, edite o arquivo `C:\Windows\System32\drivers\etc\hosts`:

```
# Sistema Emissor de Laudos Docker
127.0.0.1    inspetor.terpens.com.br
```

### **Linux/Mac - Arquivo Hosts**
Edite o arquivo `/etc/hosts`:
```bash
sudo nano /etc/hosts
```

Adicione:
```
# Sistema Emissor de Laudos Docker
127.0.0.1    inspetor.terpens.com.br
```

## 🚀 **Configuração no Servidor de Produção**

### **1. IP Estático**
Certifique-se de que o servidor tem IP estático ou configure um DNS dinâmico.

### **2. Roteamento para Docker**
O Docker automaticamente roteia o tráfego das portas 80/443 do host para o container `172.20.0.10`.

### **3. Firewall do Servidor**
Configure o firewall para permitir tráfego nas portas:
- **80** (HTTP)
- **443** (HTTPS)

#### Ubuntu/Debian:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

#### CentOS/RHEL:
```bash
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

#### Windows:
Execute o script `docker-firewall-setup.bat` como administrador.

## 🔍 **Verificação da Configuração**

### **1. Verificar Resolução DNS**
```bash
nslookup inspetor.terpens.com.br
```

Deve retornar o IP do seu servidor.

### **2. Testar Conectividade HTTP**
```bash
curl -I http://inspetor.terpens.com.br
```

### **3. Testar Conectividade HTTPS**
```bash
curl -I https://inspetor.terpens.com.br
```

### **4. Verificar Certificado SSL**
```bash
openssl s_client -connect inspetor.terpens.com.br:443 -servername inspetor.terpens.com.br
```

## 🛡️ **Certificados SSL**

### **Certificados Existentes**
O sistema usa os certificados localizados em:
- `ssl/inspetor.terpens.com.br.crt`
- `ssl/inspetor.terpens.com.br.key`

### **Renovação de Certificados**
Para renovar certificados, substitua os arquivos na pasta `ssl/` e reinicie o container:
```bash
docker compose restart
```

## 🔄 **Propagação DNS**

### **Tempo de Propagação**
- **Local**: Imediato (após limpar cache DNS)
- **Global**: 24-48 horas (dependendo do TTL configurado)

### **Limpar Cache DNS Local**
#### Windows:
```cmd
ipconfig /flushdns
```

#### Linux:
```bash
sudo systemctl reload systemd-resolved
```

#### Mac:
```bash
sudo dscacheutil -flushcache
```

## ✅ **Checklist de Configuração**

- [ ] Registro A criado no provedor DNS
- [ ] IP público do servidor confirmado
- [ ] Firewall configurado (portas 80/443)
- [ ] Certificados SSL na pasta `ssl/`
- [ ] Container Docker iniciado
- [ ] DNS resolvendo corretamente
- [ ] HTTPS respondendo
- [ ] Redirecionamento HTTP → HTTPS funcionando

## 📞 **Suporte**

Para problemas relacionados ao DNS:
1. Verificar logs do container: `docker compose logs`
2. Testar conectividade: `curl -v https://inspetor.terpens.com.br`
3. Verificar configuração nginx: `docker/nginx.conf`

---

**Criado para Sistema Emissor de Laudos - IP Virtual Docker: 172.20.0.10**