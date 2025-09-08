# 🔒 Configuração HTTPS - Sistema Emissor de Laudos

## 📋 Visão Geral

Este guia detalha a configuração completa de HTTPS para o Sistema Emissor de Laudos, incluindo certificados SSL, configuração de servidores e acesso seguro via `https://inspetor.terpens.com.br`.

## 🚀 Início Rápido

### Método 1: Configuração Automática Completa (RECOMENDADO)

```batch
# Execute como ADMINISTRADOR
INICIAR-SISTEMA-HTTPS-COMPLETO.bat
```

Este script configurará automaticamente:
- ✅ IP Virtual (177.126.153.190)
- ✅ Certificados SSL
- ✅ Firewall
- ✅ Servidor HTTPS
- ✅ Redirecionamento HTTP → HTTPS

### Método 2: Com Nginx Proxy Reverso

```batch
# 1. Instale o Nginx primeiro
INSTALAR-NGINX-WINDOWS.bat

# 2. Configure HTTPS no Nginx
CONFIGURAR-NGINX-HTTPS.bat

# 3. Inicie o sistema
INICIAR-SISTEMA-HTTPS-COMPLETO.bat
```

## 📁 Estrutura de Arquivos HTTPS

```
📦 Sistema Emissor de Laudos
├── 📁 ssl/
│   ├── 🔐 inspetor.terpens.com.br.crt    # Certificado SSL
│   └── 🔑 inspetor.terpens.com.br.key    # Chave privada
├── 📄 start-https-local.js                # Servidor Node.js HTTPS
├── 🔧 INICIAR-SISTEMA-HTTPS-COMPLETO.bat  # Launcher principal
├── 🔧 CONFIGURAR-NGINX-HTTPS.bat          # Config Nginx
└── 🔧 VERIFICAR-STATUS-HTTPS.bat          # Verificador de status
```

## 🔐 Certificados SSL

### Opção 1: Certificados Válidos (Produção)

Coloque seus certificados SSL válidos em:
```
ssl/inspetor.terpens.com.br.crt  # Certificado
ssl/inspetor.terpens.com.br.key  # Chave privada
```

### Opção 2: Certificado Auto-assinado (Desenvolvimento)

O sistema criará automaticamente se não encontrar certificados:

```batch
# Gerado automaticamente via OpenSSL
openssl req -x509 -newkey rsa:4096 \
  -keyout ssl/inspetor.terpens.com.br.key \
  -out ssl/inspetor.terpens.com.br.crt \
  -days 365 -nodes \
  -subj "/CN=inspetor.terpens.com.br/O=General Truck System/C=BR"
```

⚠️ **Aviso**: Certificados auto-assinados mostrarão avisos de segurança no navegador.

## 🌐 URLs de Acesso

### Desenvolvimento Local

| Protocolo | URL | Porta | Descrição |
|-----------|-----|-------|-----------|
| HTTP | http://localhost:3000 | 3000 | Redireciona para HTTPS |
| HTTP | http://177.126.153.190:3000 | 3000 | IP Virtual HTTP |
| HTTPS | https://localhost:9443 | 9443 | HTTPS direto Node.js |
| HTTPS | https://177.126.153.190:9443 | 9443 | HTTPS via IP Virtual |

### Produção (com Nginx)

| Protocolo | URL | Porta | Descrição |
|-----------|-----|-------|-----------|
| HTTP | http://inspetor.terpens.com.br | 80 | Redireciona para HTTPS |
| HTTPS | https://inspetor.terpens.com.br | 443 | Acesso principal HTTPS |
| HTTPS | https://inspetor.terpens.com.br:9443 | 9443 | HTTPS alternativo |

## 🔧 Configuração do Servidor HTTPS

### Arquivo: `start-https-local.js`

```javascript
// Configuração HTTPS
const httpsOptions = {
    key: fs.readFileSync('ssl/inspetor.terpens.com.br.key'),
    cert: fs.readFileSync('ssl/inspetor.terpens.com.br.crt')
};

// Servidor HTTPS na porta 9443
https.createServer(httpsOptions, (req, res) => {
    app.getRequestHandler()(req, res);
}).listen(9443, '0.0.0.0', () => {
    console.log('> HTTPS Server running on https://localhost:9443');
});

// Redirecionamento HTTP → HTTPS
http.createServer((req, res) => {
    res.writeHead(301, {
        Location: `https://${req.headers.host.replace(':3000', ':9443')}${req.url}`
    });
    res.end();
}).listen(3000);
```

## 🛡️ Configuração de Firewall

As seguintes portas são configuradas automaticamente:

```batch
# Regras de firewall configuradas
netsh advfirewall firewall add rule name="Sistema Emissor HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Sistema Emissor HTTPS" dir=in action=allow protocol=TCP localport=443
netsh advfirewall firewall add rule name="Sistema Emissor Dev" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Sistema Emissor HTTPS Alt" dir=in action=allow protocol=TCP localport=9443
```

## 📊 Verificação de Status

Execute para verificar o status completo do HTTPS:

```batch
VERIFICAR-STATUS-HTTPS.bat
```

Verificações realizadas:
- ✅ Certificados SSL
- ✅ IP Virtual
- ✅ Portas abertas
- ✅ Serviços em execução
- ✅ Regras de firewall
- ✅ Conectividade HTTPS

## 🔄 Nginx como Proxy Reverso

### Configuração Nginx (`C:\nginx\conf\sites-available\inspetor-https.conf`)

```nginx
# Redirecionamento HTTP → HTTPS
server {
    listen 80;
    listen 177.126.153.190:80;
    server_name inspetor.terpens.com.br;
    return 301 https://$server_name$request_uri;
}

# Servidor HTTPS Principal
server {
    listen 443 ssl http2;
    listen 177.126.153.190:443 ssl http2;
    server_name inspetor.terpens.com.br;
    
    # Certificados SSL
    ssl_certificate "d:/General Truck System/5. Emissor de Laudos - Inspetor/ssl/inspetor.terpens.com.br.crt";
    ssl_certificate_key "d:/General Truck System/5. Emissor de Laudos - Inspetor/ssl/inspetor.terpens.com.br.key";
    
    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Headers de Segurança
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Proxy para Node.js
    location / {
        proxy_pass http://177.126.153.190:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🌍 Configuração DNS

### No Roteador

Configure o DNS interno para resolver `inspetor.terpens.com.br`:

1. **Acesse o roteador**: http://192.168.1.1
2. **DNS Local/Host Mapping**:
   ```
   inspetor.terpens.com.br → 177.126.153.190
   ```

### No Windows (hosts)

Edite `C:\Windows\System32\drivers\etc\hosts`:
```
177.126.153.190 inspetor.terpens.com.br
```

## 🐛 Solução de Problemas

### Erro: "NET::ERR_CERT_AUTHORITY_INVALID"

**Causa**: Certificado auto-assinado
**Solução**: 
- Chrome: Digite `thisisunsafe`
- Firefox: Clique em "Avançado" → "Aceitar o risco"
- Produção: Use certificado válido (Let's Encrypt, etc.)

### Erro: "502 Bad Gateway"

**Causa**: Servidor Node.js não está rodando
**Solução**:
```batch
# Verifique o status
VERIFICAR-STATUS-HTTPS.bat

# Reinicie o sistema
INICIAR-SISTEMA-HTTPS-COMPLETO.bat
```

### Erro: "ERR_CONNECTION_REFUSED"

**Causa**: Firewall bloqueando ou serviço não iniciado
**Solução**:
```batch
# Execute como administrador
INICIAR-SISTEMA-HTTPS-COMPLETO.bat
```

## 📈 Monitoramento

### Logs em Tempo Real

```batch
# Monitor de sistema
MONITORAR-SISTEMA.bat

# Logs do Nginx (se usando)
tail -f C:\nginx\logs\access.log
tail -f C:\nginx\logs\error.log
```

### Verificação de Certificado

```batch
# Verificar validade do certificado
openssl x509 -in ssl\inspetor.terpens.com.br.crt -text -noout

# Verificar datas
openssl x509 -in ssl\inspetor.terpens.com.br.crt -dates -noout
```

## 🔐 Segurança HTTPS

### Headers de Segurança Configurados

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

### Protocolos SSL

- ✅ TLS 1.2
- ✅ TLS 1.3
- ❌ SSL 2.0/3.0 (desabilitado)
- ❌ TLS 1.0/1.1 (desabilitado)

### Ciphers Seguros

```
HIGH:!aNULL:!MD5:!3DES:!CAMELLIA:!AES128
```

## 📝 Checklist de Implantação

- [ ] Obter certificados SSL válidos
- [ ] Colocar certificados em `ssl/`
- [ ] Configurar DNS no roteador
- [ ] Executar `INICIAR-SISTEMA-HTTPS-COMPLETO.bat` como admin
- [ ] Verificar status com `VERIFICAR-STATUS-HTTPS.bat`
- [ ] Testar acesso via https://inspetor.terpens.com.br
- [ ] Configurar backup dos certificados
- [ ] Documentar renovação de certificados

## 🆘 Suporte

### Logs de Diagnóstico

```batch
# Diagnóstico completo
DIAGNOSTICO-COMPLETO.bat > diagnostico.log 2>&1

# Status HTTPS
VERIFICAR-STATUS-HTTPS.bat > status-https.log 2>&1
```

### Comandos Úteis

```batch
# Verificar portas abertas
netstat -an | findstr "443 9443 3000"

# Verificar processos
tasklist | findstr "node nginx"

# Testar certificado
openssl s_client -connect localhost:9443 -servername inspetor.terpens.com.br
```

---

## 📚 Documentação Relacionada

- [README-SISTEMA-SEM-DOCKER.md](README-SISTEMA-SEM-DOCKER.md)
- [CONFIGURACAO-DNS-ROTEADOR.md](CONFIGURACAO-DNS-ROTEADOR.md)
- [README-SCRIPTS-INICIALIZACAO.md](README-SCRIPTS-INICIALIZACAO.md)

---

**Última atualização**: Dezembro 2024
**Versão**: 2.0 HTTPS
**Autor**: General Truck System - TI