/**
 * Script para iniciar servidor HTTPS local com certificados SSL
 * Usa os certificados em ssl/inspetor.terpens.com.br.*
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Configurações
const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const httpPort = 3002;
const httpsPort = 9444;

// Diretório de certificados SSL
const sslDir = path.join(__dirname, 'ssl');
const certFile = path.join(sslDir, 'inspetor.terpens.com.br.crt');
const keyFile = path.join(sslDir, 'inspetor.terpens.com.br.key');

// Verificar certificados SSL da HostGator
if (!fs.existsSync(certFile)) {
    console.error('❌ Certificado SSL não encontrado:', certFile);
    console.log('Por favor, baixe o certificado da HostGator e coloque em ssl/');
    console.log('Arquivo necessário: ssl/inspetor.terpens.com.br.crt');
    process.exit(1);
}

if (!fs.existsSync(keyFile)) {
    console.error('❌ Chave SSL não encontrada:', keyFile);
    console.log('Por favor, baixe a chave privada da HostGator e coloque em ssl/');
    console.log('Arquivo necessário: ssl/inspetor.terpens.com.br.key');
    process.exit(1);
}

console.log('✅ Certificados SSL encontrados!');
console.log('📄 Certificado:', certFile);
console.log('🔑 Chave:', keyFile);

// Criar aplicação Next.js
const app = next({ dev, hostname, port: httpPort });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    // Criar servidor HTTP (redireciona para HTTPS)
    createServer((req, res) => {
        const host = req.headers.host?.replace(':' + httpPort, ':' + httpsPort) || 'localhost:' + httpsPort;
        res.writeHead(301, { Location: `https://${host}${req.url}` });
        res.end();
    }).listen(httpPort, (err) => {
        if (err) throw err;
        console.log(`🔄 HTTP rodando em http://localhost:${httpPort} (redireciona para HTTPS)`);
    });

    // Configurar opções HTTPS
    const httpsOptions = {
        key: fs.readFileSync(keyFile),
        cert: fs.readFileSync(certFile)
    };

    // Criar servidor HTTPS
    https.createServer(httpsOptions, async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Erro ao processar requisição:', err);
            res.statusCode = 500;
            res.end('Erro interno do servidor');
        }
    }).listen(httpsPort, (err) => {
        if (err) throw err;
        
        console.log('');
        console.log('🚀 Sistema Emissor de Laudos - HTTPS Ativo!');
        console.log('================================================');
        console.log('');
        console.log('🌐 URLs de Acesso:');
        console.log('');
        console.log('  Local:');
        console.log(`  ├─ https://localhost:${httpsPort}`);
        console.log(`  ├─ https://127.0.0.1:${httpsPort}`);
        console.log(`  └─ https://177.126.153.190:${httpsPort}`);
        console.log('');
        console.log('  Domínio:');
        console.log('  └─ https://inspetor.terpens.com.br');
        console.log('');
        console.log('================================================');
        console.log('🔒 Certificados SSL carregados com sucesso!');
        console.log('✅ Sistema pronto para produção com HTTPS');
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
    console.log('\n👋 Encerrando servidor HTTPS...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Encerrando servidor HTTPS...');
    process.exit(0);
});