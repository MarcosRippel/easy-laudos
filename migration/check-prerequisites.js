/**
 * Script de Verificação de Pré-requisitos
 * Sistema GTS - General Truck System
 * 
 * Este script verifica se o ambiente tem todos os pré-requisitos necessários
 * para executar o sistema GTS corretamente.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Cores para output no console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Função para imprimir com cores
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Classe principal do verificador
class PrerequisiteChecker {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  // Verifica versão do Node.js
  async checkNodeVersion() {
    try {
      const { stdout } = await execPromise('node --version');
      const version = stdout.trim();
      const versionNumber = parseFloat(version.substring(1));
      
      if (versionNumber >= 18.0) {
        this.results.passed.push(`✅ Node.js ${version} instalado (mínimo v18.0)`);
      } else {
        this.results.failed.push(`❌ Node.js ${version} - versão muito antiga (precisa v18.0+)`);
      }
    } catch (error) {
      this.results.failed.push('❌ Node.js não encontrado - instale em https://nodejs.org');
    }
  }

  // Verifica versão do npm
  async checkNpmVersion() {
    try {
      const { stdout } = await execPromise('npm --version');
      const version = stdout.trim();
      const versionNumber = parseFloat(version);
      
      if (versionNumber >= 9.0) {
        this.results.passed.push(`✅ npm ${version} instalado (mínimo v9.0)`);
      } else {
        this.results.warnings.push(`⚠️ npm ${version} - considere atualizar (recomendado v9.0+)`);
      }
    } catch (error) {
      this.results.failed.push('❌ npm não encontrado');
    }
  }

  // Verifica espaço em disco
  async checkDiskSpace() {
    try {
      const stats = fs.statfsSync(process.cwd());
      const availableGB = (stats.bavail * stats.bsize) / (1024 * 1024 * 1024);
      
      if (availableGB >= 5) {
        this.results.passed.push(`✅ Espaço em disco: ${availableGB.toFixed(2)}GB disponível`);
      } else if (availableGB >= 2) {
        this.results.warnings.push(`⚠️ Espaço em disco: ${availableGB.toFixed(2)}GB (recomendado 5GB+)`);
      } else {
        this.results.failed.push(`❌ Espaço insuficiente: ${availableGB.toFixed(2)}GB (mínimo 2GB)`);
      }
    } catch (error) {
      this.results.warnings.push('⚠️ Não foi possível verificar espaço em disco');
    }
  }

  // Verifica arquivos críticos do projeto
  async checkProjectFiles() {
    const criticalFiles = [
      'package.json',
      'prisma/schema.prisma',
      'next.config.ts',
      'tsconfig.json'
    ];

    const criticalDirs = [
      'app',
      'components',
      'prisma',
      'public',
      'templates',
      'types'
    ];

    // Verifica arquivos
    for (const file of criticalFiles) {
      if (fs.existsSync(file)) {
        this.results.passed.push(`✅ Arquivo encontrado: ${file}`);
      } else {
        this.results.failed.push(`❌ Arquivo crítico ausente: ${file}`);
      }
    }

    // Verifica diretórios
    for (const dir of criticalDirs) {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        this.results.passed.push(`✅ Diretório encontrado: ${dir}/`);
      } else {
        this.results.failed.push(`❌ Diretório crítico ausente: ${dir}/`);
      }
    }
  }

  // Verifica banco de dados
  async checkDatabase() {
    const dbPath = 'prisma/dev.db';
    
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      const sizeMB = stats.size / (1024 * 1024);
      this.results.passed.push(`✅ Banco de dados encontrado: ${sizeMB.toFixed(2)}MB`);
    } else {
      this.results.warnings.push('⚠️ Banco de dados não encontrado (será criado na migração)');
    }
  }

  // Verifica arquivos de ambiente
  async checkEnvironmentFiles() {
    if (fs.existsSync('.env')) {
      this.results.passed.push('✅ Arquivo .env encontrado');
    } else {
      this.results.warnings.push('⚠️ Arquivo .env não encontrado (será criado do .env.example)');
    }

    if (fs.existsSync('.env.local')) {
      this.results.passed.push('✅ Arquivo .env.local encontrado');
    } else {
      this.results.warnings.push('⚠️ Arquivo .env.local não encontrado (será criado do .env.example)');
    }
  }

  // Verifica pasta de uploads
  async checkUploadsFolder() {
    const uploadsPath = 'public/uploads';
    
    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath);
      this.results.passed.push(`✅ Pasta de uploads encontrada: ${files.length} arquivos`);
    } else {
      this.results.warnings.push('⚠️ Pasta de uploads não encontrada (será criada)');
    }
  }

  // Verifica templates
  async checkTemplates() {
    const templatesPath = 'templates';
    
    if (fs.existsSync(templatesPath)) {
      const files = fs.readdirSync(templatesPath);
      const htmlFiles = files.filter(f => f.endsWith('.html'));
      
      if (htmlFiles.length > 0) {
        this.results.passed.push(`✅ Templates HTML encontrados: ${htmlFiles.length} arquivos`);
      } else {
        this.results.failed.push('❌ Nenhum template HTML encontrado em templates/');
      }
    } else {
      this.results.failed.push('❌ Pasta de templates não encontrada');
    }
  }

  // Verifica Git (opcional)
  async checkGit() {
    try {
      await execPromise('git --version');
      this.results.passed.push('✅ Git instalado (opcional)');
    } catch (error) {
      this.results.warnings.push('⚠️ Git não instalado (opcional, mas recomendado)');
    }
  }

  // Gera relatório
  generateReport() {
    log('\n' + '='.repeat(60), 'cyan');
    log('RELATÓRIO DE PRÉ-REQUISITOS - SISTEMA GTS', 'cyan');
    log('='.repeat(60) + '\n', 'cyan');

    // Mostra itens aprovados
    if (this.results.passed.length > 0) {
      log('APROVADOS:', 'green');
      this.results.passed.forEach(item => log(item, 'green'));
      console.log();
    }

    // Mostra avisos
    if (this.results.warnings.length > 0) {
      log('AVISOS:', 'yellow');
      this.results.warnings.forEach(item => log(item, 'yellow'));
      console.log();
    }

    // Mostra falhas
    if (this.results.failed.length > 0) {
      log('FALHAS CRÍTICAS:', 'red');
      this.results.failed.forEach(item => log(item, 'red'));
      console.log();
    }

    // Resumo final
    log('='.repeat(60), 'cyan');
    log(`RESUMO: ${this.results.passed.length} aprovados, ${this.results.warnings.length} avisos, ${this.results.failed.length} falhas`, 'cyan');
    
    if (this.results.failed.length === 0) {
      log('\n✅ SISTEMA PRONTO PARA MIGRAÇÃO!', 'green');
      return true;
    } else {
      log('\n❌ CORRIJA AS FALHAS ANTES DE CONTINUAR!', 'red');
      return false;
    }
  }

  // Executa todas as verificações
  async runAllChecks() {
    log('Iniciando verificação de pré-requisitos...', 'blue');
    
    await this.checkNodeVersion();
    await this.checkNpmVersion();
    await this.checkDiskSpace();
    await this.checkProjectFiles();
    await this.checkDatabase();
    await this.checkEnvironmentFiles();
    await this.checkUploadsFolder();
    await this.checkTemplates();
    await this.checkGit();
    
    return this.generateReport();
  }

  // Salva relatório em arquivo
  async saveReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `migration/logs/prerequisite-check-${timestamp}.log`;
    
    // Cria pasta de logs se não existir
    const logsDir = path.dirname(reportPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Prepara conteúdo do relatório
    let content = `RELATÓRIO DE PRÉ-REQUISITOS - SISTEMA GTS\n`;
    content += `Data: ${new Date().toLocaleString('pt-BR')}\n`;
    content += `${'='.repeat(60)}\n\n`;
    
    content += `APROVADOS (${this.results.passed.length}):\n`;
    this.results.passed.forEach(item => content += `${item}\n`);
    
    content += `\nAVISOS (${this.results.warnings.length}):\n`;
    this.results.warnings.forEach(item => content += `${item}\n`);
    
    content += `\nFALHAS (${this.results.failed.length}):\n`;
    this.results.failed.forEach(item => content += `${item}\n`);
    
    fs.writeFileSync(reportPath, content);
    log(`\nRelatório salvo em: ${reportPath}`, 'blue');
  }
}

// Função principal
async function main() {
  const checker = new PrerequisiteChecker();
  
  try {
    const success = await checker.runAllChecks();
    await checker.saveReport();
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    log(`\nErro durante verificação: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = PrerequisiteChecker;