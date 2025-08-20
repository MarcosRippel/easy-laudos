/**
 * Script de Criação do Pacote de Migração
 * Sistema GTS - General Truck System
 *
 * Este script cria um pacote ZIP completo com todos os arquivos
 * necessários para migrar o sistema para outro servidor.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Variável para armazenar o módulo archiver após instalação
let archiver;

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class MigrationPackageCreator {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.packageName = `gts-migration-package-${this.timestamp}.zip`;
    this.tempDir = `migration/temp-${this.timestamp}`;
    this.includeList = [];
    this.excludeList = [
      'node_modules',
      '.next',
      '.git',
      '*.log',
      'migration/temp-*',
      'migration/backups',
      'migration/logs',
      '*.zip'
    ];
  }

  // Mostra banner
  showBanner() {
    console.clear();
    log('\n' + '='.repeat(70), 'cyan');
    log('           CRIADOR DE PACOTE DE MIGRAÇÃO - SISTEMA GTS', 'cyan');
    log('='.repeat(70), 'cyan');
    log(`\nData: ${new Date().toLocaleString('pt-BR')}`, 'blue');
    log(`Pacote: ${this.packageName}`, 'blue');
    log('\n' + '='.repeat(70) + '\n', 'cyan');
  }

  // Executa scripts de backup
  async runBackupScripts() {
    log('📦 ETAPA 1: EXECUTANDO SCRIPTS DE BACKUP', 'magenta');
    log('=' .repeat(50), 'magenta');
    
    const scripts = [
      { file: 'migration/backup-database.js', name: 'Backup do Banco de Dados' },
      { file: 'migration/backup-uploads.js', name: 'Backup dos Uploads' },
      { file: 'migration/backup-pdfs.js', name: 'Backup dos PDFs' }
    ];
    
    for (const script of scripts) {
      if (fs.existsSync(script.file)) {
        try {
          log(`\n▶️  ${script.name}...`, 'blue');
          await execPromise(`node ${script.file}`);
          log(`✅ ${script.name} concluído`, 'green');
        } catch (error) {
          log(`⚠️  Aviso em ${script.name}: ${error.message}`, 'yellow');
        }
      }
    }
  }

  // Prepara lista de arquivos
  prepareFileList() {
    log('\n📋 ETAPA 2: PREPARANDO LISTA DE ARQUIVOS', 'magenta');
    log('=' .repeat(50), 'magenta');
    
    // Arquivos essenciais do projeto
    const essentialFiles = [
      'package.json',
      'package-lock.json',
      'next.config.ts',
      'tsconfig.json',
      'postcss.config.mjs',
      'eslint.config.mjs',
      '.env.example',
      'README.md'
    ];
    
    // Diretórios essenciais
    const essentialDirs = [
      'app',
      'components',
      'lib',
      'prisma',
      'public',
      'templates',
      'types',
      'migration'
    ];
    
    // Adiciona arquivos essenciais
    essentialFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.includeList.push(file);
        log(`  ✅ ${file}`, 'green');
      } else {
        log(`  ⚠️  ${file} não encontrado`, 'yellow');
      }
    });
    
    // Adiciona diretórios essenciais
    essentialDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.includeList.push(dir);
        log(`  ✅ ${dir}/`, 'green');
      } else {
        log(`  ⚠️  ${dir}/ não encontrado`, 'yellow');
      }
    });
    
    log(`\n📊 Total: ${this.includeList.length} itens para incluir`, 'cyan');
  }

  // Cria arquivo ZIP
  async createZipPackage() {
    log('\n🗜️  ETAPA 3: CRIANDO PACOTE ZIP', 'magenta');
    log('=' .repeat(50), 'magenta');
    
    return new Promise((resolve, reject) => {
      // Cria stream de escrita
      const output = fs.createWriteStream(this.packageName);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Máxima compressão
      });
      
      // Eventos
      output.on('close', () => {
        const sizeMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
        log(`\n✅ Pacote criado: ${this.packageName}`, 'green');
        log(`📦 Tamanho: ${sizeMB}MB`, 'cyan');
        log(`📁 Total de arquivos: ${archive.pointer()} bytes`, 'cyan');
        resolve();
      });
      
      archive.on('error', (err) => {
        log(`❌ Erro ao criar ZIP: ${err.message}`, 'red');
        reject(err);
      });
      
      archive.on('progress', (progress) => {
        if (progress.entries.processed % 100 === 0) {
          process.stdout.write('.');
        }
      });
      
      // Conecta archive ao output
      archive.pipe(output);
      
      // Adiciona arquivos e diretórios
      this.includeList.forEach(item => {
        const stats = fs.statSync(item);
        
        if (stats.isDirectory()) {
          archive.directory(item, item, {
            ignore: (file) => {
              // Ignora padrões da lista de exclusão
              return this.excludeList.some(pattern => {
                if (pattern.includes('*')) {
                  const regex = new RegExp(pattern.replace('*', '.*'));
                  return regex.test(file);
                }
                return file.includes(pattern);
              });
            }
          });
        } else {
          archive.file(item, { name: item });
        }
      });
      
      // Adiciona instruções especiais
      const instructions = `
INSTRUÇÕES DE MIGRAÇÃO - SISTEMA GTS
=====================================

1. Extraia este arquivo no servidor de destino
2. Entre na pasta GTS-main
3. Execute: node migration/migration-orchestrator.js
4. Siga as instruções na tela

Para mais detalhes, consulte:
- migration/README-MIGRACAO.md
- CHECKLIST-POS-MIGRACAO.md

Data do pacote: ${new Date().toLocaleString('pt-BR')}
`;
      
      archive.append(instructions, { name: 'LEIA-ME-PRIMEIRO.txt' });
      
      // Finaliza o archive
      archive.finalize();
    });
  }

  // Cria relatório do pacote
  createPackageReport() {
    log('\n📄 ETAPA 4: CRIANDO RELATÓRIO DO PACOTE', 'magenta');
    log('=' .repeat(50), 'magenta');
    
    const report = {
      packageName: this.packageName,
      createdAt: new Date().toISOString(),
      createdAtBR: new Date().toLocaleString('pt-BR'),
      includedItems: this.includeList,
      excludedPatterns: this.excludeList,
      systemInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        cwd: process.cwd()
      }
    };
    
    const reportPath = `migration-package-report-${this.timestamp}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    log(`✅ Relatório salvo: ${reportPath}`, 'green');
    
    return report;
  }

  // Limpa arquivos temporários
  cleanup() {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
      log('\n🧹 Arquivos temporários limpos', 'green');
    }
  }

  // Executa o processo completo
  async execute() {
    try {
      this.showBanner();
      
      // Executa backups
      await this.runBackupScripts();
      
      // Prepara lista de arquivos
      this.prepareFileList();
      
      // Verifica se archiver está instalado e carrega
      try {
        archiver = require('archiver');
        log('\n✅ Módulo archiver já está instalado', 'green');
      } catch (e) {
        log('\n📦 Instalando dependência archiver...', 'yellow');
        await execPromise('npm install archiver');
        
        // Carrega o archiver após instalação
        try {
          archiver = require('archiver');
          log('✅ Archiver instalado e carregado com sucesso!', 'green');
        } catch (loadError) {
          log('❌ Erro ao carregar archiver após instalação:', 'red');
          log(loadError.message, 'red');
          throw new Error('Não foi possível carregar o módulo archiver');
        }
      }
      
      // Cria pacote ZIP
      await this.createZipPackage();
      
      // Cria relatório
      this.createPackageReport();
      
      // Limpa temporários
      this.cleanup();
      
      // Instruções finais
      log('\n' + '='.repeat(70), 'green');
      log('✅ PACOTE DE MIGRAÇÃO CRIADO COM SUCESSO!', 'green');
      log('=' .repeat(70), 'green');
      
      log('\n📌 PRÓXIMOS PASSOS:', 'cyan');
      log('  1. Transfira o arquivo para o servidor de destino:', 'cyan');
      log(`     ${this.packageName}`, 'blue');
      log('  2. No servidor de destino, extraia o arquivo', 'cyan');
      log('  3. Entre na pasta e execute:', 'cyan');
      log('     node migration/migration-orchestrator.js', 'blue');
      log('  4. Siga as instruções na tela', 'cyan');
      
      return true;
      
    } catch (error) {
      log(`\n❌ Erro ao criar pacote: ${error.message}`, 'red');
      this.cleanup();
      throw error;
    }
  }
}

// Função principal
async function main() {
  const creator = new MigrationPackageCreator();
  
  try {
    await creator.execute();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = MigrationPackageCreator;