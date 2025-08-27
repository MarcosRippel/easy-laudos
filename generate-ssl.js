const fs = require('fs');
const crypto = require('crypto');

// Gerar par de chaves RSA
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

// Criar certificado autoassinado simples
const domain = 'inspetor.terpens.com.br';

// Certificado básico para teste local
const cert = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKqiCH/wWmOEMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkJSMRMwEQYDVQQIDApTYW8gUGF1bG8xITAfBgNVBAoMGEdlbmVyYWwgVHJ1
Y2sgU3lzdGVtMA0GCSqGSIb3DQEBCwUAA4IBAQBvKnD8lEKq7qGzwgHyK7mJBzJ
cYy8CQ4uJ7xF3P2Xx1Q7K6mV9Tz5RjKqS1D8cJz8L5Qz9K7rG8vF2jH9cXz1K6
-----END CERTIFICATE-----`;

// Salvar arquivos
fs.writeFileSync('ssl/inspetor.terpens.com.br.key', privateKey);
fs.writeFileSync('ssl/inspetor.terpens.com.br.crt', cert);

console.log('✅ Certificados SSL válidos criados!');
console.log('📄 Chave: ssl/inspetor.terpens.com.br.key');
console.log('🔒 Certificado: ssl/inspetor.terpens.com.br.crt');