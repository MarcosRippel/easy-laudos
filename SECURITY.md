# Política de Segurança

## Reportando uma vulnerabilidade

Se você encontrar uma vulnerabilidade de segurança neste projeto — incluindo, mas não limitado a, bypass de autenticação, exposição de dados de outro usuário/tenant, injeção (SQL, XSS, path traversal) ou segredo exposto no repositório —, **não abra uma issue pública**.

Reporte diretamente por e-mail para **rippel.marcos@gmail.com**, com:

- Descrição do problema e impacto potencial.
- Passos para reproduzir (ou prova de conceito, se aplicável).
- Versão/commit em que você testou.

## Escopo

Está no escopo: o código deste repositório (`app/`, `components/`, `lib/`, `prisma/`, scripts de deploy incluídos no repo).

Fora do escopo: infraestrutura de produção do mantenedor (servidores, túneis, serviços internos) — isso não é público e reportar aqui não alcança essa camada.

## O que esperar

Este é um projeto mantido por uma pessoa, sem SLA formal. O compromisso é:

- Confirmar o recebimento do relato assim que possível.
- Investigar e, se procedente, corrigir antes de qualquer divulgação pública.
- Dar crédito a quem reportou, se desejado, quando a correção for publicada.

Não há garantia de prazo fixo de resposta — para um problema crítico com exploração ativa conhecida, mencione isso explicitamente no e-mail.

## Variáveis de ambiente que o app exige

`SESSION_SECRET` (mínimo 32 caracteres, `openssl rand -base64 32`) assina o
cookie de sessão, e `AUTH_SALT` alimenta o hash de senha legado. Nenhuma das
duas tem valor padrão no código: sem elas o app recusa login e sessão em vez de
cair para um segredo previsível. O placeholder `CHANGE_ME…` do `.env.example`
também é recusado — um segredo publicado no repositório assinaria cookie que
qualquer pessoa forja. Trocar `SESSION_SECRET` invalida todas as
sessões abertas — é o que fazer ao suspeitar de vazamento.

## Segredos já expostos no histórico

Este repositório teve chaves e tokens commitados no histórico git antes de se tornar público. Essas credenciais são consideradas queimadas (já rotacionadas) — não é necessário reportá-las como descoberta nova, mas se você encontrar um segredo que pareça **ainda ativo**, reporte por e-mail em vez de comentar publicamente onde ele está.
