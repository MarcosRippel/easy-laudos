const crypto = require('crypto');
const fs = require('fs');

console.log('🔧 Convertendo chave privada da HostGator para formato compatível...');

try {
    // Lê a chave privada da HostGator
    const privateKeyPem = fs.readFileSync('ssl/inspetor.terpens.com.br.key', 'utf8');
    
    console.log('✅ Chave privada lida com sucesso');
    console.log(`📄 Tamanho: ${privateKeyPem.length} caracteres`);
    console.log(`🔍 Início: ${privateKeyPem.substring(0, 50)}...`);
    
    // Tenta criar objeto de chave privada
    const keyObject = crypto.createPrivateKey({
        key: privateKeyPem,
        format: 'pem'
    });
    
    console.log('✅ Chave privada validada pelo Node.js');
    
    // Converte para formato PEM tradicional
    const convertedKey = keyObject.export({
        type: 'pkcs1',
        format: 'pem'
    });
    
    // Salva a chave convertida
    fs.writeFileSync('ssl/inspetor.terpens.com.br.key.converted', convertedKey);
    
    console.log('✅ Chave convertida salva como inspetor.terpens.com.br.key.converted');
    console.log(`🔍 Nova chave inicia com: ${convertedKey.substring(0, 50)}...`);
    
} catch (error) {
    console.error('❌ Erro ao converter chave:', error.message);
    console.error('🔍 Código do erro:', error.code);
    
    // Se a conversão falhar, vamos tentar apenas reescrever no formato correto
    console.log('🔄 Tentando reformatar a chave existente...');
    
    try {
        const privateKeyPem = fs.readFileSync('ssl/inspetor.terpens.com.br.key', 'utf8');
        
        // Remove caracteres extras e reescreve
        const cleanKey = privateKeyPem
            .replace(/\r\n/g, '\n')  // Normaliza quebras de linha
            .replace(/\r/g, '\n')     // Remove retornos de carro
            .trim();                   // Remove espaços extras
        
        fs.writeFileSync('ssl/inspetor.terpens.com.br.key.clean', cleanKey);
        console.log('✅ Chave limpa salva como inspetor.terpens.com.br.key.clean');
        
    } catch (cleanError) {
        console.error('❌ Erro ao limpar chave:', cleanError.message);
    }
}