#!/usr/bin/env node

/**
 * Script de Verificacao de Vulnerabilidade CVE-2025-55182
 * Verifica se as versoes do React estao corrigidas
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('VERIFICACAO DE SEGURANCA - CVE-2025-55182');
console.log('========================================\n');

// Versoes vulneraveis
const VULNERABLE_VERSIONS = ['19.0.0', '19.1.0', '19.1.1', '19.2.0'];
const MIN_SAFE_VERSION = '19.1.2';

// Ler package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('1. Verificando package.json...');
const reactVersion = packageJson.dependencies?.react || packageJson.devDependencies?.react;
const reactDomVersion = packageJson.dependencies?.['react-dom'] || packageJson.devDependencies?.['react-dom'];

console.log(`   React: ${reactVersion}`);
console.log(`   React-DOM: ${reactDomVersion}\n`);

// Verificar versoes instaladas
console.log('2. Verificando versoes instaladas...');
try {
    const reactInstalled = execSync('npm list react --depth=0', { encoding: 'utf8', cwd: path.join(__dirname, '..') });
    const reactDomInstalled = execSync('npm list react-dom --depth=0', { encoding: 'utf8', cwd: path.join(__dirname, '..') });
    
    const reactMatch = reactInstalled.match(/react@([\d.]+)/);
    const reactDomMatch = reactDomInstalled.match(/react-dom@([\d.]+)/);
    
    const reactInstalledVersion = reactMatch ? reactMatch[1] : 'N/A';
    const reactDomInstalledVersion = reactDomMatch ? reactDomMatch[1] : 'N/A';
    
    console.log(`   React instalado: ${reactInstalledVersion}`);
    console.log(`   React-DOM instalado: ${reactDomInstalledVersion}\n`);
    
    // Verificar se esta vulneravel
    let isVulnerable = false;
    
    if (VULNERABLE_VERSIONS.includes(reactInstalledVersion)) {
        console.log('   [X] VULNERAVEL: React esta em uma versao vulneravel!');
        isVulnerable = true;
    } else if (reactInstalledVersion >= MIN_SAFE_VERSION || reactInstalledVersion.startsWith('19.2.1') || reactInstalledVersion.startsWith('19.0.1')) {
        console.log('   [OK] SEGURO: React esta em uma versao corrigida.');
    } else {
        console.log('   [!] ATENCAO: Versao nao identificada. Verifique manualmente.');
    }
    
    if (VULNERABLE_VERSIONS.includes(reactDomInstalledVersion)) {
        console.log('   [X] VULNERAVEL: React-DOM esta em uma versao vulneravel!');
        isVulnerable = true;
    } else if (reactDomInstalledVersion >= MIN_SAFE_VERSION || reactDomInstalledVersion.startsWith('19.2.1') || reactDomInstalledVersion.startsWith('19.0.1')) {
        console.log('   [OK] SEGURO: React-DOM esta em uma versao corrigida.');
    } else {
        console.log('   [!] ATENCAO: Versao nao identificada. Verifique manualmente.');
    }
    
    console.log('\n3. Verificando dependencias do Next.js...');
    try {
        const nextInfo = execSync('npm list next --depth=0', { encoding: 'utf8', cwd: path.join(__dirname, '..') });
        const nextMatch = nextInfo.match(/next@([\d.]+)/);
        const nextVersion = nextMatch ? nextMatch[1] : 'N/A';
        console.log(`   Next.js: ${nextVersion}`);
        console.log('   [INFO] Os pacotes react-server-dom-* sao dependencias transitivas do Next.js.');
        console.log('   [INFO] Ao atualizar React e Next.js, eles sao atualizados automaticamente.\n');
    } catch (err) {
        console.log('   [!] Nao foi possivel verificar a versao do Next.js\n');
    }
    
    // Resumo
    console.log('========================================');
    if (isVulnerable) {
        console.log('RESULTADO: SISTEMA VULNERAVEL');
        console.log('========================================');
        console.log('\nACAO NECESSARIA:');
        console.log('Execute: npm install react@^19.1.2 react-dom@^19.1.2');
        console.log('Ou: npm install react@^19.2.1 react-dom@^19.2.1\n');
        process.exit(1);
    } else {
        console.log('RESULTADO: SISTEMA SEGURO');
        console.log('========================================');
        console.log('\nAs versoes do React estao corrigidas.');
        console.log('Recomendacao: Execute testes apos a atualizacao.\n');
        process.exit(0);
    }
    
} catch (error) {
    console.error('Erro ao verificar versoes:', error.message);
    process.exit(1);
}

