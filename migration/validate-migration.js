/**
 * Script de Validação Pós-Migração
 * Sistema GTS - General Truck System
 * 
 * Este script verifica a integridade completa do sistema após a migração,
 * garantindo que todos os componentes foram migrados corretamente.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Função auxiliar para log colorido
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Classe principal de validação
class MigrationValidator {
  constructor() {
    this.validationResults = {
      timestamp: new Date().toISOString(),
      hostname: require('os').hostname(),
      platform: process.platform,
      nodeVersion: process.version,
      checks: [],
      warnings: [],
      errors: [],
      summary: {
        totalChecks: 0,
        passed: 0,
        warnings: 0,
        failed: 0
      }
    };
  }

  // Adiciona resultado de validação
  addResult(category, name, status, details = '') {
    const result = {
      category,
      name,
      status, // 'passed', 'warning', 'failed'
      details,
      timestamp: new Date().toISOString()
    };
    
    this.validationResults.checks.push(result);
    this.validationResults.summary.totalChecks++;
    
    switch (status) {
      case 'passed':
        this.validationResults.summary.passed++;
        log(`  ✅ ${name}`, 'green');
        break;
      case 'warning':
        this.validationResults.summary.warnings++;
        this.validationResults.warnings.push(result);
        log(`  ⚠️  ${name}: ${details}`, 'yellow');
        break;
      case 'failed':
        this.validationResults.summary.failed++;
        this.validationResults.errors.push(result);
        log(`  ❌ ${name}: ${details}`, 'red');
        break;
    }
  }

  // Verifica arquivos essenciais
  async checkEssentialFiles() {
    log('\n🔍 VERIFICANDO ARQUIVOS ESSENCIAIS', 'cyan');
    log('=' .repeat(50), 'cyan');

    const essentialFiles = [
      'package.json',
      'package-lock.json',
      'next.config.ts',
      'tsconfig.json',
      '.env',
      '.env.local',
      'prisma/schema.prisma'
    ];

    for (const file of essentialFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        this.addResult('files', `Arquivo ${file}`, 'passed', 
          `Tamanho: ${stats.size} bytes`);
      } else if (file === '.env' || file === '.env.local') {
        this.addResult('files', `Arquivo ${file}`, 'warning', 
          'Arquivo não encontrado - verifique se foi criado a partir do .env.example');
      } else {
        this.addResult('files', `Arquivo ${file}`, 'failed', 
          'Arquivo essencial não encontrado');
      }
    }
  }

  // Verifica diretórios importantes
  async checkDirectories() {
    log('\n📁 VERIFICANDO DIRETÓRIOS', 'cyan');
    log('=' .repeat(50), 'cyan');

    const importantDirs = [
      { path: 'app', required: true },
      { path: 'components', required: true },
      { path: 'lib', required: true },
      { path: 'prisma', required: true },
      { path: 'public', required: true },
      { path: 'templates', required: true },
      { path: 'types', required: true },
      { path: 'uploads', required: false },
      { path: 'pdfs', required: false },
      { path: 'backups', required: false },
      { path: 'node_modules', required: false },
      { path: '.next', required: false }
    ];

    for (const dir of importantDirs) {
      const dirPath = path.join(process.cwd(), dir.path);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        this.addResult('directories', `Diretório ${dir.path}`, 'passed', 
          `${files.length} itens encontrados`);
      } else if (dir.required) {
        this.addResult('directories', `Diretório ${dir.path}`, 'failed', 
          'Diretório obrigatório não encontrado');
      } else {
        this.addResult('directories', `Diretório ${dir.path}`, 'warning', 
          'Diretório opcional não encontrado - será criado conforme necessário');
      }
    }
  }

  // Verifica banco de dados
  async checkDatabase() {
    log('\n🗄️  VERIFICANDO BANCO DE DADOS', 'cyan');
    log('=' .repeat(50), 'cyan');

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      this.addResult('database', 'Arquivo do banco (dev.db)', 'passed', 
        `Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Verifica integridade do SQLite
      try {
        await execPromise(`sqlite3 ${dbPath} "PRAGMA integrity_check;"`);
        this.addResult('database', 'Integridade do banco', 'passed', 
          'Banco de dados íntegro');
      } catch (error) {
        if (error.message.includes('sqlite3')) {
          this.addResult('database', 'Integridade do banco', 'warning', 
            'sqlite3 não instalado - não foi possível verificar integridade');
        } else {
          this.addResult('database', 'Integridade do banco', 'failed', 
            `Erro ao verificar: ${error.message}`);
        }
      }
      
      // Verifica tabelas do Prisma
      try {
        const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        const tableMatches = schemaContent.match(/model\s+(\w+)/g);
        
        if (tableMatches) {
          const tableCount = tableMatches.length;
          this.addResult('database', 'Schema do Prisma', 'passed', 
            `${tableCount} modelos/tabelas definidos`);
        }
      } catch (error) {
        this.addResult('database', 'Schema do Prisma', 'failed', 
          `Erro ao ler schema: ${error.message}`);
      }
    } else {
      this.addResult('database', 'Arquivo do banco (dev.db)', 'failed', 
        'Banco de dados não encontrado');
    }
  }

  // Verifica variáveis de ambiente
  async checkEnvironment() {
    log('\n🔐 VERIFICANDO VARIÁVEIS DE AMBIENTE', 'cyan');
    log('=' .repeat(50), 'cyan');

    const envExamplePath = path.join(process.cwd(), '.env.example');
    const envPath = path.join(process.cwd(), '.env');
    const envLocalPath = path.join(process.cwd(), '.env.local');

    if (fs.existsSync(envExamplePath)) {
      const envExample = fs.readFileSync(envExamplePath, 'utf8');
      const requiredVars = envExample.match(/^([A-Z_]+)=/gm);
      
      if (requiredVars) {
        const varNames = requiredVars.map(v => v.replace('=', ''));
        
        // Verifica .env
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          let configuredCount = 0;
          
          for (const varName of varNames) {
            if (envContent.includes(`${varName}=`)) {
              configuredCount++;
            }
          }
          
          if (configuredCount === varNames.length) {
            this.addResult('environment', 'Arquivo .env', 'passed', 
              `Todas ${varNames.length} variáveis configuradas`);
          } else {
            this.addResult('environment', 'Arquivo .env', 'warning', 
              `${configuredCount}/${varNames.length} variáveis configuradas`);
          }
        } else {
          this.addResult('environment', 'Arquivo .env', 'warning', 
            'Arquivo não encontrado - crie a partir do .env.example');
        }
        
        // Verifica .env.local
        if (fs.existsSync(envLocalPath)) {
          this.addResult('environment', 'Arquivo .env.local', 'passed', 
            'Arquivo de configuração local encontrado');
        } else {
          this.addResult('environment', 'Arquivo .env.local', 'warning', 
            'Arquivo não encontrado - crie se necessário');
        }
      }
    }
  }

  // Verifica dependências Node.js
  async checkDependencies() {
    log('\n📦 VERIFICANDO DEPENDÊNCIAS', 'cyan');
    log('=' .repeat(50), 'cyan');

    // Verifica se node_modules existe
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    
    if (fs.existsSync(nodeModulesPath)) {
      const moduleCount = fs.readdirSync(nodeModulesPath).length;
      this.addResult('dependencies', 'Diretório node_modules', 'passed', 
        `${moduleCount} pacotes instalados`);
    } else {
      this.addResult('dependencies', 'Diretório node_modules', 'failed', 
        'Dependências não instaladas - execute npm install');
    }

    // Verifica package-lock.json
    const lockPath = path.join(process.cwd(), 'package-lock.json');
    if (fs.existsSync(lockPath)) {
      this.addResult('dependencies', 'Arquivo package-lock.json', 'passed', 
        'Lock file presente para instalação determinística');
    } else {
      this.addResult('dependencies', 'Arquivo package-lock.json', 'warning', 
        'Lock file ausente - pode causar inconsistências');
    }

    // Lista principais dependências
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
      );
      
      const criticalDeps = [
        '@prisma/client',
        'next',
        'react',
        'react-dom'
      ];
      
      const optionalDeps = [
        'sqlite3' // Opcional pois o Prisma gerencia seu próprio driver SQLite
      ];
      
      // Verifica dependências críticas
      for (const dep of criticalDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.addResult('dependencies', `Dependência ${dep}`, 'passed',
            `Versão: ${packageJson.dependencies[dep]}`);
        } else {
          this.addResult('dependencies', `Dependência ${dep}`, 'failed',
            'Dependência crítica não encontrada no package.json');
        }
      }
      
      // Verifica dependências opcionais
      for (const dep of optionalDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.addResult('dependencies', `Dependência ${dep}`, 'passed',
            `Versão: ${packageJson.dependencies[dep]}`);
        } else {
          this.addResult('dependencies', `Dependência ${dep}`, 'warning',
            'Dependência opcional - Prisma gerencia driver SQLite internamente');
        }
      }
    } catch (error) {
      this.addResult('dependencies', 'Análise de dependências', 'failed', 
        `Erro ao ler package.json: ${error.message}`);
    }
  }

  // Verifica permissões de arquivos (Linux/Mac)
  async checkPermissions() {
    log('\n🔒 VERIFICANDO PERMISSÕES', 'cyan');
    log('=' .repeat(50), 'cyan');

    if (process.platform === 'win32') {
      this.addResult('permissions', 'Verificação de permissões', 'warning', 
        'Sistema Windows - verificação de permissões não aplicável');
      return;
    }

    const criticalPaths = [
      { path: 'uploads', writable: true },
      { path: 'pdfs', writable: true },
      { path: 'backups', writable: true },
      { path: 'prisma/dev.db', writable: true }
    ];

    for (const item of criticalPaths) {
      const fullPath = path.join(process.cwd(), item.path);
      
      if (fs.existsSync(fullPath)) {
        try {
          fs.accessSync(fullPath, fs.constants.R_OK);
          if (item.writable) {
            fs.accessSync(fullPath, fs.constants.W_OK);
          }
          this.addResult('permissions', `Permissões de ${item.path}`, 'passed', 
            'Leitura' + (item.writable ? ' e escrita' : '') + ' OK');
        } catch (error) {
          this.addResult('permissions', `Permissões de ${item.path}`, 'failed', 
            `Sem permissão: ${error.message}`);
        }
      }
    }
  }

  // Verifica processos e portas
  async checkServices() {
    log('\n🚀 VERIFICANDO SERVIÇOS', 'cyan');
    log('=' .repeat(50), 'cyan');

    // Verifica se a porta 3000 está disponível
    try {
      const { stdout } = await execPromise(
        process.platform === 'win32'
          ? 'netstat -an | findstr :3000'
          : 'lsof -i :3000'
      );
      
      if (stdout.includes('LISTEN')) {
        this.addResult('services', 'Porta 3000', 'warning', 
          'Porta já em uso - pode haver conflito');
      } else {
        this.addResult('services', 'Porta 3000', 'passed', 
          'Porta disponível');
      }
    } catch (error) {
      // Se o comando falhar, assumimos que a porta está livre
      this.addResult('services', 'Porta 3000', 'passed', 
        'Porta aparentemente disponível');
    }

    // Verifica versão do Node.js
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    
    if (majorVersion >= 18) {
      this.addResult('services', 'Versão do Node.js', 'passed', 
        `Versão ${nodeVersion} compatível`);
    } else if (majorVersion >= 16) {
      this.addResult('services', 'Versão do Node.js', 'warning', 
        `Versão ${nodeVersion} pode funcionar mas recomenda-se 18+`);
    } else {
      this.addResult('services', 'Versão do Node.js', 'failed', 
        `Versão ${nodeVersion} incompatível - requer 16+`);
    }
  }

  // Calcula hash de arquivos críticos
  calculateFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  // Verifica integridade de arquivos críticos
  async checkFileIntegrity() {
    log('\n🔍 VERIFICANDO INTEGRIDADE DE ARQUIVOS', 'cyan');
    log('=' .repeat(50), 'cyan');

    const criticalFiles = [
      'package.json',
      'prisma/schema.prisma',
      'next.config.ts'
    ];

    const hashes = {};
    
    for (const file of criticalFiles) {
      const filePath = path.join(process.cwd(), file);
      
      if (fs.existsSync(filePath)) {
        try {
          const hash = this.calculateFileHash(filePath);
          hashes[file] = hash;
          this.addResult('integrity', `Hash de ${file}`, 'passed', 
            `SHA256: ${hash.substring(0, 16)}...`);
        } catch (error) {
          this.addResult('integrity', `Hash de ${file}`, 'failed', 
            `Erro ao calcular: ${error.message}`);
        }
      }
    }

    // Salva hashes para referência futura
    const hashesPath = path.join(process.cwd(), 'migration', 'file-hashes.json');
    fs.writeFileSync(hashesPath, JSON.stringify(hashes, null, 2));
  }

  // Testa funcionalidades básicas
  async testBasicFunctionality() {
    log('\n⚡ TESTANDO FUNCIONALIDADES BÁSICAS', 'cyan');
    log('=' .repeat(50), 'cyan');

    // Testa build do Next.js
    log('\n  🔨 Testando build do Next.js (pode demorar)...', 'yellow');
    
    try {
      const { stdout, stderr } = await execPromise('npm run build', {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      if (stderr && !stderr.includes('warn')) {
        this.addResult('functionality', 'Build do Next.js', 'warning', 
          'Build concluído com avisos');
      } else {
        this.addResult('functionality', 'Build do Next.js', 'passed', 
          'Build concluído com sucesso');
      }
    } catch (error) {
      this.addResult('functionality', 'Build do Next.js', 'failed', 
        `Erro no build: ${error.message}`);
    }

    // Testa conexão com Prisma
    try {
      await execPromise('npx prisma db push --skip-generate', {
        cwd: process.cwd()
      });
      this.addResult('functionality', 'Conexão Prisma', 'passed', 
        'Prisma conectado ao banco com sucesso');
    } catch (error) {
      this.addResult('functionality', 'Conexão Prisma', 'failed', 
        `Erro ao conectar: ${error.message}`);
    }
  }

  // Gera relatório final
  generateReport() {
    log('\n📊 GERANDO RELATÓRIO FINAL', 'cyan');
    log('=' .repeat(70), 'cyan');

    const reportPath = path.join(
      process.cwd(), 
      'migration', 
      `validation-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );

    // Salva relatório detalhado
    fs.writeFileSync(reportPath, JSON.stringify(this.validationResults, null, 2));

    // Exibe resumo
    const { totalChecks, passed, warnings, failed } = this.validationResults.summary;
    
    log('\n📈 RESUMO DA VALIDAÇÃO:', 'blue');
    log(`   Total de verificações: ${totalChecks}`, 'blue');
    log(`   ✅ Aprovadas: ${passed} (${((passed/totalChecks)*100).toFixed(1)}%)`, 'green');
    log(`   ⚠️  Avisos: ${warnings} (${((warnings/totalChecks)*100).toFixed(1)}%)`, 'yellow');
    log(`   ❌ Falhas: ${failed} (${((failed/totalChecks)*100).toFixed(1)}%)`, 'red');

    // Status geral
    log('\n🎯 STATUS GERAL:', 'magenta');
    if (failed === 0) {
      if (warnings === 0) {
        log('   ✅ MIGRAÇÃO VALIDADA COM SUCESSO!', 'green');
        log('   Sistema está pronto para uso em produção.', 'green');
      } else {
        log('   ⚠️  MIGRAÇÃO VALIDADA COM AVISOS', 'yellow');
        log('   Sistema funcional, mas revise os avisos acima.', 'yellow');
      }
    } else {
      log('   ❌ MIGRAÇÃO COM PROBLEMAS CRÍTICOS', 'red');
      log('   Corrija os erros antes de usar em produção.', 'red');
      
      log('\n📋 ERROS ENCONTRADOS:', 'red');
      this.validationResults.errors.forEach(error => {
        log(`   - ${error.name}: ${error.details}`, 'red');
      });
    }

    log(`\n💾 Relatório completo salvo em:`, 'cyan');
    log(`   ${reportPath}`, 'blue');
    
    return this.validationResults;
  }

  // Executa todas as validações
  async runAllValidations() {
    console.log('\n');
    log('=' .repeat(70), 'green');
    log('        VALIDADOR DE MIGRAÇÃO - SISTEMA GTS', 'green');
    log('=' .repeat(70), 'green');
    log(`\nIniciando validação em: ${new Date().toLocaleString('pt-BR')}`, 'cyan');
    
    try {
      await this.checkEssentialFiles();
      await this.checkDirectories();
      await this.checkDatabase();
      await this.checkEnvironment();
      await this.checkDependencies();
      await this.checkPermissions();
      await this.checkServices();
      await this.checkFileIntegrity();
      
      // Pergunta se deve executar testes funcionais
      log('\n❓ Deseja executar testes funcionais? (pode demorar)', 'yellow');
      log('   Isso incluirá build do Next.js e testes de conexão.', 'yellow');
      log('   Responda S para sim ou N para não: ', 'yellow');
      
      // Por padrão, não executa testes funcionais em modo automático
      if (process.argv.includes('--with-tests')) {
        await this.testBasicFunctionality();
      } else {
        log('   (Use --with-tests para incluir testes funcionais)', 'cyan');
      }
      
    } catch (error) {
      log(`\n❌ Erro durante validação: ${error.message}`, 'red');
      this.addResult('system', 'Erro de sistema', 'failed', error.message);
    }

    return this.generateReport();
  }
}

// Executa a validação
async function main() {
  const validator = new MigrationValidator();
  const results = await validator.runAllValidations();
  
  // Retorna código de saída apropriado
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

// Executa se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = MigrationValidator;