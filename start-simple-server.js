/**
 * Servidor simples para desenvolvimento
 * Funciona com HTTP na porta 3000
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Configurações
const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

console.log('🚀 Iniciando servidor de desenvolvimento...');

// Criar aplicação Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    // Criar servidor HTTP
    createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Erro ao processar requisição:', err);
            res.statusCode = 500;
            res.end('Erro interno do servidor');
        }
    }).listen(port, (err) => {
        if (err) throw err;
        
        console.log('');
        console.log('🚀 Sistema Emissor de Laudos - Servidor Ativo!');
        console.log('================================================');
        console.log('');
        console.log('🌐 URLs de Acesso:');
        console.log('');
        console.log('  Local:');
        console.log(`  ├─ http://localhost:${port}`);
        console.log(`  ├─ http://127.0.0.1:${port}`);
        console.log(`  └─ http://177.126.153.190:${port}`);
        console.log('');
        console.log('  Domínio:');
        console.log('  └─ http://inspetor.terpens.com.br:3000');
        console.log('');
        console.log('================================================');
        console.log('✅ Sistema pronto para desenvolvimento!');
        console.log('');
        console.log('Para parar o servidor: CTRL+C');
        console.log('');
    });
});

// Tratamento de erros
process.on('uncaughtException', (err) => {
    console.error('❌ Erro não capturado:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada:', reason);
    process.exit(1);
});

// Tratamento de sinal de interrupção
process.on('SIGINT', () => {
    console.log('\n👋 Encerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Encerrando servidor...');
    process.exit(0);
});
