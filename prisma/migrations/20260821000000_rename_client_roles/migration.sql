-- Converte os papeis legados de inspetor para os papeis genericos do dominio.
--
-- Antes desta migration a coluna `User.role` guardava o nome do cliente com um
-- sufixo ordinal ("<cliente>1" / "<cliente>2"), e esse literal era comparado
-- diretamente na autorizacao (lib/middleware-auth.ts). O codigo agora so
-- reconhece 'admin' | 'client_a' | 'client_b' (lib/roles.ts).
--
-- Consequencia de NAO rodar esta migration num banco existente:
-- `getSessionFromRequest` valida o papel da sessao contra o dominio de
-- `UserRole` e devolve `null` para papel desconhecido — as contas de inspetor
-- deixam de logar. A conta `admin` continua funcionando, entao da para entrar
-- como admin e corrigir os papeis pelo painel /admin/users.
--
-- A regra de conversao e o SUFIXO ORDINAL do papel legado, nao o nome do
-- cliente (de proposito: esse nome nao existe mais em lugar nenhum do
-- repositorio). Qualquer papel fora do dominio novo terminado em "1" vira
-- `client_a`, terminado em "2" vira `client_b`, e qualquer outro papel
-- desconhecido vira `client_a` para nao deixar usuario sem login — revise
-- esses casos no painel admin.
--
-- Escopo: SO a coluna `User.role`. `User.username` NAO e tocado — o nome de
-- login de quem ja usa o sistema continua o mesmo, e renomear em massa
-- colidiria com a constraint UNIQUE quando dois papeis legados convergem para
-- o mesmo papel novo.
--
-- Idempotente: na segunda execucao nenhuma linha casa, porque todos os papeis
-- ja estao no dominio.

UPDATE "User"
   SET "role" = 'client_a'
 WHERE "role" NOT IN ('admin', 'client_a', 'client_b')
   AND "role" LIKE '%1';

UPDATE "User"
   SET "role" = 'client_b'
 WHERE "role" NOT IN ('admin', 'client_a', 'client_b')
   AND "role" LIKE '%2';

UPDATE "User"
   SET "role" = 'client_a'
 WHERE "role" NOT IN ('admin', 'client_a', 'client_b');
