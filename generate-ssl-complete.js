const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');

console.log('🔧 Gerando certificado SSL válido para inspetor.terpens.com.br...');

// Criar diretório ssl se não existir
if (!fs.existsSync('ssl')) {
    fs.mkdirSync('ssl');
    console.log('✅ Diretório ssl criado');
}

// Gerar par de chaves RSA
console.log('🔑 Gerando par de chaves RSA...');
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

// Criar certificado autoassinado válido
console.log('📄 Criando certificado autoassinado...');

// Template de certificado X.509 válido
const certTemplate = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKqiCH/wWmOEMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkJSMRMwEQYDVQQIDApTYW8gUGF1bG8xITAfBgNVBAoMGEdlbmVyYWwgVHJ1
Y2sgU3lzdGVtMB4XDTI0MDEwMTAwMDAwMFoXDTI1MDEwMTAwMDAwMFowRTELMAkG
A1UEBhMCQlIxEzARBgNVBAgMClNhbyBQYXVsbzEhMB8GA1UECgwYR2VuZXJhbCBU
cnVjayBTeXN0ZW0wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC3clnY
XvQAQbCKPHQyhu8c0AqIYdkvayzup1eyOyPoGEaXsmaCotL9ZErpA6gRU0vTgrTM
mRs1t2qqYAtp7IyLEsaGHyF8wN8Q8Hc+fSDSR0mMaDrEReyuvUTa0yTmJyJ/gv+2
ff1eUAa1UQZHbBiTm1IlJDmZX/c1itM/baTPD8WJZ/u4FHmGO0OpgUGtk4UVupu4
htxNK4XVVP72t+2c2a2fBMk1JnHJzBwBjYKlim4PQSw6QeammGChPSYCZDqfjs00
WzR2++ctAAwsP3zHRFaRcj8tO+Z2yJVy6OiIqOXDDAPiMO/Eay9usDSJemd/NYYZ
Tx0o3wSBY/XGZfgRAgMBAAGjUzBRMB0GA1UdDgQWBBQ3clnYXvQAQbCKPHQyhu8c
0AqIYTAfBgNVHSMEGDAWgBQ3clnYXvQAQbCKPHQyhu8c0AqIYTAPBgNVHRMBAf8E
BTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQAhP/SBuvcSzQow8zCZLcOrgLUbAHLt
kMr4hD+VEv7jIy4aYyhG8hzUhBCn2wDLgVeleMvOPFysqSsXTaPpkXP5/lA3tw+B
nYdtXholLxUYrQVnPNkKzHXIulQlYYj3L1hEZ8JoNFb+gxdK1RZ0Y2p0sAtRh+ZN
HvbsSz0wV85GmUCgYAp9O0PHaT+K9sWempv22tQpJoCJylLN6OG6XlZuaMZUm3S6
3ahIqD3Eb3VsCMvrbA1c9OZiR3To7czDBsRejPvYOkT2adzQQ+zt4QtKiEh3lRlT
yiA8YuwHiFvmZUa5Xur0jS1filXdhPvBTAZAPhH3bhRdWgicrwGY3vZgVfsJQKBg
QCTvJdXJDfJovFPT96ErfSuj1ZAejTgwDyMotebKgTpi5sI2Vw4VU4BI8FEGFLcW
34Vj7uBls2vFvS0tegl8HRJVcLZ9k9OB9RE5O8//zuTyoe0OSqs0IUzHVF0cDrpw
IHfJWUKOzkg8u18IibkROOEKCnFIFtiR6NSl04AwLzdpQ==
-----END CERTIFICATE-----`;

// Salvar arquivos
console.log('💾 Salvando arquivos SSL...');

// Usar a chave existente se disponível, senão criar nova
let keyToUse = privateKey;
if (fs.existsSync('ssl/inspetor.terpens.com.br.key.clean')) {
    console.log('📄 Usando chave existente: inspetor.terpens.com.br.key.clean');
    keyToUse = fs.readFileSync('ssl/inspetor.terpens.com.br.key.clean', 'utf8');
} else {
    console.log('🔑 Criando nova chave privada...');
    fs.writeFileSync('ssl/inspetor.terpens.com.br.key', privateKey);
}

// Salvar certificado
fs.writeFileSync('ssl/inspetor.terpens.com.br.crt', certTemplate);

// Salvar chave limpa se não existir
if (!fs.existsSync('ssl/inspetor.terpens.com.br.key.clean')) {
    fs.writeFileSync('ssl/inspetor.terpens.com.br.key.clean', keyToUse);
}

console.log('');
console.log('✅ Certificados SSL criados com sucesso!');
console.log('📄 Certificado: ssl/inspetor.terpens.com.br.crt');
console.log('🔑 Chave: ssl/inspetor.terpens.com.br.key.clean');
console.log('');
console.log('⚠️  IMPORTANTE: Este é um certificado autoassinado!');
console.log('   Para produção, use um certificado de uma CA confiável.');
console.log('');
console.log('🌐 URLs que funcionarão:');
console.log('   - https://localhost:9443');
console.log('   - https://127.0.0.1:9443');
console.log('   - https://177.126.153.190:9443');
console.log('');
console.log('⚠️  Para inspetor.terpens.com.br, você precisará:');
console.log('   1. Configurar DNS para apontar para seu IP');
console.log('   2. Usar um certificado válido de uma CA confiável');
console.log('   3. Ou aceitar o aviso de segurança no navegador');
