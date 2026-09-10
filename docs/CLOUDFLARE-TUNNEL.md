# Hospedar local com Cloudflare Tunnel

Este projeto foi feito para rodar **no seu computador**, escutando só em
`127.0.0.1`, e aparecer na internet com HTTPS **sem abrir porta no roteador**.
Quem termina o TLS é a Cloudflare. O app em si fala HTTP.

```
https://laudos.seudominio.com
        │
        │  TLS (certificado da Cloudflare)
        ▼
   Cloudflare Edge
        │
        │  túnel criptografado (cloudflared)
        ▼
  cloudflared no mesmo PC do app
        │
        │  HTTP
        ▼
  127.0.0.1:3006  ←  npm run dev  /  next start
```

Isso é o jeito que a instalação original usava: o Next escuta em
`127.0.0.1:3006` (já é o padrão de `npm run dev` neste repo) e um
`cloudflared` **nativo no Windows**, como serviço, encaminha o hostname
público para `http://127.0.0.1:3006`. O `cloudflared` **não** ia no Docker
junto com o app — de dentro de um container, `localhost` é o container, não
o Node na máquina.

Não precisa de certificado local, Nginx, IP público nem port-forward.

---

## 0. O app tem que estar no ar, só em localhost

Siga o [README](../README.md#-rodando-localmente) até o `npm run dev`.
Confira **antes** de ligar o túnel:

```bash
curl -sS -o NUL -w "%{http_code}" http://127.0.0.1:3006/
```

Esperado: `200` ou um redirect do Next (`307`/`308`). Se isso falhar, o
túnel também vai falhar — ele só repassa o que o app responde.

Para servir o build de produção (não o `dev`):

```bash
npm run build
npx next start -H 127.0.0.1 -p 3006
```

`npm run start` neste repo **não** passa `-p 3006` (só o `dev` passa). Sem
`-p` / `PORT`, o Next sobe na 3000 e o túnel aponta para a porta errada.

O bind em `127.0.0.1` é de propósito: a porta não fica aberta na LAN. Quem
chega de fora passa só pelo túnel.

---

## 1. Teste rápido (URL temporária)

Serve para ver o app no celular em 30 segundos. A URL muda toda vez e some
quando você fecha o processo.

1. Instale o [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
2. Com o app rodando:

```bash
cloudflared tunnel --url http://127.0.0.1:3006
```

Ele imprime um `https://….trycloudflare.com`. Abra isso.

Para um hostname seu, que sobrevive a reboot, use o túnel **nomeado** abaixo.

---

## 2. Túnel nomeado (o jeito estável)

Conta Cloudflare + um domínio nela (o domínio precisa estar na mesma conta
em que você cria o túnel, senão o DNS não acha o destino).

### 2.1 Login e criação

```bash
cloudflared tunnel login
cloudflared tunnel create easy-laudos
```

O `login` abre o navegador. O `create` grava um JSON de credencial em
`%USERPROFILE%\.cloudflared\<id-do-tunel>.json` (Linux/macOS:
`~/.cloudflared/`). **Esse arquivo é a chave do túnel.** Não commite.
Não copie para o repositório. Se vazar, apague o túnel no painel e crie outro.

Anote o UUID que o `create` imprimiu.

### 2.2 Ingress

Crie `%USERPROFILE%\.cloudflared\config.yml` (fora do git):

```yaml
tunnel: <UUID-DO-TUNEL>
credentials-file: C:\Users\<voce>\.cloudflared\<UUID-DO-TUNEL>.json

ingress:
  - hostname: laudos.seudominio.com
    service: http://127.0.0.1:3006
  - service: http_status:404
```

O último item (`http_status:404`) é obrigatório — o cloudflared recusa
config sem catch-all.

O `service` é **HTTP** para o localhost. Não aponte HTTPS para o Next: quem
fala HTTPS com o visitante é a Cloudflare.

### 2.3 DNS

```bash
cloudflared tunnel route dns easy-laudos laudos.seudominio.com
```

Isso cria o CNAME do hostname para o túnel. Dá para fazer no Zero Trust
(Networks → Tunnels → o túnel → Public Hostname) com:

| Campo | Valor |
|---|---|
| Subdomain / Domain | `laudos` / `seudominio.com` |
| Type | HTTP |
| URL | `http://127.0.0.1:3006` |

O DNS nasce quando você salva o hostname. Não precisa abrir porta 80/443 no
roteador.

### 2.4 Rodar (e deixar como serviço no Windows)

Na frente, para testar:

```bash
cloudflared tunnel --config %USERPROFILE%\.cloudflared\config.yml run
```

Quando o `https://laudos.seudominio.com` responder, instale como serviço
Windows (sobe no boot, igual a instalação original):

```bash
cloudflared service install
```

O serviço lê o `config.yml` padrão em `%USERPROFILE%\.cloudflared\`.
Linux: `cloudflared service install` também, ou um unit systemd apontando
para o mesmo config.

---

## 3. Variáveis de ambiente do app

O Next precisa saber o URL **público HTTPS**. Sem isso, QR de verificação,
links de e-mail e redirects do middleware apontam para `localhost`.

No `.env` (nunca no git):

```bash
NODE_ENV=production

NEXT_PUBLIC_BASE_URL=https://laudos.seudominio.com
NEXT_PUBLIC_URL=https://laudos.seudominio.com
NEXT_PUBLIC_APP_URL=https://laudos.seudominio.com
NEXTAUTH_URL=https://laudos.seudominio.com

# cookie só via HTTPS — atrás do túnel o visitante sempre chega em https
SECURE_COOKIES=true

# SESSION_SECRET e AUTH_SALT: openssl rand -base64 32  (não use CHANGE_ME)
SESSION_SECRET=
AUTH_SALT=
```

O middleware já lê `X-Forwarded-Host` e `X-Forwarded-Proto` (o cloudflared
manda os dois) para não redirecionar o login de volta para `127.0.0.1`.

Depois de mudar `NEXT_PUBLIC_*`, precisa **rebuild** (`npm run build`): essas
variáveis entram no bundle do cliente.

---

## 4. Conferir

```bash
# a máquina, sem passar pela internet
curl.exe -sS -o NUL -w "%{http_code}" http://127.0.0.1:3006/

# o mundo, via Cloudflare
curl.exe -sS -o NUL -w "%{http_code}" https://laudos.seudominio.com/
```

Os dois têm que responder. Se o local vai e o público não, o problema é o
hostname/ingress, não o app.

---

## 5. O que não fazer

- **Não** coloque o token do túnel, o `credentials-file` nem o `config.yml`
  no git. Token em commit fica no histórico para sempre.
- **Não** rode o `cloudflared` no mesmo Docker do Next apontando para
  `http://localhost:3006` — localhost ali é o container. Se um dia o túnel
  for container, o `service:` tem que ser o **nome do serviço** na rede
  Docker (`http://easy-laudos:3006`), e o app precisa escutar em `0.0.0.0`
  **dentro** da rede interna, não na LAN. A instalação original evitou isso
  rodando o `cloudflared.exe` no Windows.
- **Não** abra a 3006 no firewall / roteador. O túnel existe justamente para
  isso não ser necessário.
- **Não** gere certificado Let's Encrypt local para o mesmo hostname: a
  Cloudflare já termina o HTTPS. Certificado local neste repo
  (`npm run start:https`, pasta `ssl/`) é outro modo, sem túnel.

---

## 6. Problemas comuns

| Sintoma | Causa típica | O que fazer |
|---|---|---|
| Público dá 530 / 502 | App caiu ou está em outra porta | `curl` na 3006; `next start` sem `-p 3006` sobe na 3000 |
| Local ok, público não | Hostname fora do ingress, ou `cloudflared` parado | `cloudflared tunnel info`; serviço Windows `cloudflared` |
| Login redireciona para `127.0.0.1` | `NEXT_PUBLIC_*` / `NEXTAUTH_URL` ainda em localhost | Ajuste o `.env`, rebuild |
| Cookie não gruda | `SECURE_COOKIES=true` sem HTTPS no visitante, ou o contrário | Atrás do túnel: `true` |
| `npm run dev` ok, produção não | `NEXT_PUBLIC_*` mudou depois do build | `npm run build` de novo |
| Túnel sobe e cai | `config.yml` sem o catch-all `http_status:404` | Copie o bloco `ingress` da seção 2.2 |

Para desligar o acesso público **sem apagar o DNS**: tire o hostname do
`ingress` (ou do Public Hostname no Zero Trust) e deixe o CNAME. Recolocar
a linha `hostname → http://127.0.0.1:3006` reativa. Foi assim que a
instalação original “desligava” o site sem perder o domínio.

---

## 7. Relação com o resto da documentação

- Setup do app: [README](../README.md#-rodando-localmente)
- Deploy sem Cloudflare (VPS + Nginx + Certbot, Docker): [OPERACAO.md](OPERACAO.md)
- O `ATUALIZARSISTEMA.md` da raiz cita o túnel no desenho de uma instalação
  antiga com Docker — o fluxo canônico para **este** repo é este arquivo.
