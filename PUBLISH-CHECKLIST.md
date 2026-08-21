# Checklist de publicação — o que só o humano pode fazer

Este repositório é o **clone limpo** de `general-laudos`: o histórico já foi
reescrito para tirar segredos, PII de cliente e infraestrutura do dono, e o
build passa do zero para quem chega de fora.

O que sobrou **não é trabalho de máquina**. Nenhum item abaixo foi executado
por agente nenhum — cada um exige uma decisão ou uma credencial que só o
mantenedor tem. Faça-os na ordem.

---

## 1. Rotacionar tudo que já esteve no repositório privado

Limpar o histórico **não desfaz a exposição**: quem teve acesso ao repositório
privado (ou a qualquer clone, backup, CI ou máquina de dev) já viu esses
valores. Trate todos como **queimados** e gere novos antes de publicar.

- [ ] **OpenAI** — revogar a chave da API e emitir outra (`OPENAI_API_KEY`);
      conferir também o assistant id (`OPENAI_ASSISTANT_ID`).
- [ ] **Google Gemini** — revogar e reemitir `GEMINI_API_KEY`.
- [ ] **Telegram** — `/revoke` no @BotFather e novo `TELEGRAM_BOT_TOKEN`.
- [ ] **`NEXTAUTH_SECRET`** — gerar outro (`openssl rand -base64 32`). Todas as
      sessões ativas caem; é o efeito desejado.
- [ ] **`AUTH_SALT`** — o código não tem mais valor padrão embutido. Defina um
      salt novo no ambiente antes de subir (sem ele, a verificação de senhas
      no formato legado lança erro).
- [ ] **Os 2 certificados TLS** que estiveram versionados — revogar e reemitir
      o par (chave privada + certificado). Chave privada que apareceu num repo
      não volta a ser privada.
- [ ] **Conta ACME do Let's Encrypt** — a chave de conta esteve no repositório:
      desativar essa conta e registrar outra antes do próximo `certbot`.
- [ ] **Senha de seed nas contas vivas** — trocar a senha de todos os usuários
      que ainda usam a senha padrão do seed em qualquer banco em produção. O
      código já lê `SEED_PASSWORD` do ambiente, mas contas criadas antes disso
      continuam com a senha antiga.

## 2. Confirmar a titularidade do código

- [ ] Confirmar que o código é seu para licenciar — que **não é work-for-hire**
      nem trabalho encomendado cujos direitos pertençam a um cliente ou
      empregador, e que nenhum contrato vigente restringe a abertura.
- [ ] Confirmar o titular do copyright do `LICENSE` (hoje: *Marcos Rippel*) e a
      licença escolhida (hoje: **MIT**). Trocar agora é trivial; depois do push
      público, não.

## 3. Decidir sobre a identidade nos commits

- [ ] Os 178 commits do histórico carregam o **e-mail Gmail pessoal** do autor.
      Decidir entre: (a) manter como está; (b) reescrever para o e-mail
      `@users.noreply.github.com` do GitHub, com `git filter-repo --mailmap`.
      Se a opção for (b), faça **antes** do push — reescrever depois muda todos
      os hashes de um repositório que já é público.

## 4. Publicar

Só depois de tudo acima:

```bash
cd D:/_oss/general-laudos-clean.git

# revisão final, com os próprios olhos
git log --oneline | head -20
git ls-tree -r --name-only main | less

# criar o repositório e empurrar
gh repo create MarcosRippel/general-laudos --public --source=. --push
# (ou: gh repo create ... --public  &&  git push origin main)
```

- [ ] Repositório criado no GitHub.
- [ ] `main` empurrada.
- [ ] Conferir na interface do GitHub: LICENSE reconhecida, README renderizado,
      nenhum arquivo inesperado, nenhuma Action herdada com segredo.

---

## O que já está feito (não repetir)

- Histórico reescrito: sem chaves de API, sem chave privada RSA, sem token do
  bot, sem senha de banco, sem a senha de seed em nenhuma revisão.
- PII de cliente fora do histórico (dumps SQLite, uploads, PDFs, screenshots).
- Documentação e scripts internos de outro sistema removidos, junto com a
  topologia de rede do mantenedor.
- Metadados XMP/EXIF (conta Canva) removidos das imagens de branding em **todas**
  as revisões.
- `LICENSE`, `README.md` público, `CONTRIBUTING.md`, `SECURITY.md` e
  `docs/OPERACAO.md` no lugar; `package.json` sem `private: true`.
- Build verificado do zero: `npm ci && npx prisma generate && npx prisma db push
  && npm run build && npm run lint`.
