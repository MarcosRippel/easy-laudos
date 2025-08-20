/**
 * Orquestrador Principal de Migração
 * Sistema GTS - General Truck System
 * 
 * Este é o script principal que coordena todo o processo de migração
 * executando todos os outros scripts na ordem correta.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

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

class MigrationOrchestrator {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = `migration/logs/migration-${this.timestamp}.log`;
    this.results = {
      success: [],
      warnings: [],
      errors: []
    };
  }

  // Cria diretório de logs
  setupLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  // Registra log em arquivo
  logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, logMessage);
  }

  // Exibe banner inicial
  showBanner() {
    console.clear();
    log('\n' + '='.repeat(70), 'cyan');
    log('                    SISTEMA GTS - MIGRAÇÃO COMPLETA', 'cyan');
    log('                     General Truck System v0.1.0', 'cyan');
    log('='.repeat(70), 'cyan');
    log(`\nData: ${new Date().toLocaleString('pt-BR')}`, 'blue');
    log(`Log: ${this.logFile}`, 'blue');
    log('\n' + '='.repeat(70) + '\n', 'cyan');
  }

  // Aguarda confirmação do usuário
  async getUserConfirmation(message) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      readline.question(`\n${message} (s/n): `, answer => {
        readline.close();
        resolve(answer.toLowerCase() === 's');
      });
    });
  }

  // Executa um comando com tratamento de erro
  async executeCommand(command, description) {
    try {
      log(`\n▶️  ${description}...`, 'blue');
      this.logToFile(`Executando: ${description}`);
      
      const { stdout, stderr } = await execPromise(command);
      
      if (stdout) {
        this.logToFile(`Saída: ${stdout}`);
      }
      if (stderr) {
        this.logToFile(`Avisos: ${stderr}`);
      }
      
      log(`✅ ${description} - Concluído!`, 'green');
      this.results.success.push(description);
      return true;
      
    } catch (error) {
      log(`❌ ${description} - Falhou!`, 'red');
      log(`   Erro: ${error.message}`, 'red');
      this.logToFile(`Erro em ${description}: ${error.message}`);
      this.results.errors.push({ task: description, error: error.message });
      return false;
    }
  }

  // FASE 1: Verificação de Pré-requisitos
  async phase1_Prerequisites() {
    log('\n🔍 FASE 1: VERIFICAÇÃO DE PRÉ-REQUISITOS', 'magenta');
    log('=' .repeat(50), 'magenta');
    
    const success = await this.executeCommand(
      'node migration/check-prerequisites.js',
      'Verificação de pré-requisitos'
    );
    
    if (!success) {
      log('\n⚠️  Pré-requisitos não atendidos. Corrija os problemas antes de continuar.', 'yellow');
      return false;
    }
    
    return true;
  }

  // FASE 2: Instalação de Dependências
  async phase2_InstallDependencies() {
    log('\n📦 FASE 2: INSTALAÇÃO DE DEPENDÊNCIAS', 'magenta');
    log('=' .repeat(50), 'magenta');
    
    // Verifica se node_modules existe
    if (fs.existsSync('node_modules')) {
      log('✅ Dependências já instaladas', 'green');
      return true;
    }
    
    log('\n⏳ Instalando dependências (pode demorar alguns minutos)...', 'yellow');
    
    const success = await this.executeCommand(
      'npm install',
      'Instalação de dependências'
    );
    
    if (!success) {
      log('\n❌ Falha na instalação de dependências', 'red');
      return false;
    }
    
    return true;
  }

  // FASE 3: Configuração do Ambiente
  async phase3_SetupEnvironment() {
    log('\n⚙️  FASE 3: CONFIGURAÇÃO DO AMBIENTE', 'magenta');
    log('=' .repeat(50), 'magenta');
    
    // Verifica arquivos .env
    const envFiles = ['.env', '.env.local'];
    let allExist = true;
    
    for (const file of envFiles) {
      if (!fs.existsSync(file)) {
        log(`⚠️  ${file} não encontrado`, 'yellow');
        
        if (fs.existsSync('.env.example')) {
          fs.copyFileSync('.env.example', file);
          log(`✅ ${file} criado a partir de .env.example`, 'green');
          log(`   ⚠️  IMPORTANTE: Edite ${file} com suas configurações!`, 'yellow');
          this.results.warnings.push(`${file} criado - necessita configuração`);
        } else {
          allExist = false;
        }
      } else {
        log(`✅ ${file} encontrado`, 'green');
      }
    }
    
    if (!allExist && !fs.existsSync('.env.example')) {
      log('\n❌ Arquivos de ambiente não encontrados', 'red');
      return false;
    }
    
    return true;
  }

  // FASE 4: Configuração do Prisma
  async phase4_SetupPrisma() {
    log('\n🗄️  FASE 4: CONFIGURAÇÃO DO BANCO DE DADOS', 'magenta');
    log('=' .repeat(50), 'magenta');
    
    // Verifica se o banco existe
    if (fs.existsSync('prisma/dev.db')) {
      log('✅ Banco de dados encontrado', 'green');
      
      // Gera cliente Prisma
      await this.executeCommand(
        'npx prisma generate',
        'Geração do cliente Prisma'
      );
    } else {
      log('⚠️  Banco de dados não encontrado', 'yellow');
      
      // Cria banco novo
      const createDb = await this.executeCommand(
        'npx prisma db push',
        'Criação do banco de dados'
      );
      
      if (!createDb) {
        return false;
      }
      
      // Se houver backup, restaura
      const backupDir = 'migration/backups/database';
      if (fs.existsSync(backupDir)) {
        const files = fs.readdirSync(backupDir);
        const dbBackup = files.find(f => f.endsWith('.db') && f.includes('gts-database'));
        
        if (dbBackup) {
          const backupPath = path.join(backupDir, dbBackup);
          fs.copyFileSync(backupPath, 'prisma/dev.db');
          log('✅ Banco restaurado do backup', 'green');
        }
      }
    }
    
    return true;
  }

  // FASE 5: Restauração de Uploads
  async phase5_RestoreUploads() {
    log('\n📸 FASE 5: RESTAURAÇÃO DE UPLOADS', 'magenta');
    log('=' .repeat(50), 'magenta');
    
    const uploadsDir = 'public/uploads';
    const backupDir = 'migration/backups/uploads';
    
    // Cria pasta de uploads se não existir
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      log('📁 Pasta de uploads criada', 'green');
    }
    
    // Restaura do backup se existir
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir);
      const images = files.filter(f => ['.jpg', '.jpeg', '.png', '.gif'].some(ext => f.endsWith(ext)));
      
      if (images.length > 0) {
        log(`📸 Restaurando ${images.length} imagens...`, 'blue');
        
        images.forEach(img => {
          const source = path.join(backupDir, img);
          const dest = path.join(uploadsDir, img);
          
          if (!fs.existsSync(dest)) {
            fs.copyFileSync(source, dest);
          }
        });
        
        log(`✅ ${images.length} imagens restauradas`, 'green');
      } else {
        log('ℹ️  Nenhuma imagem para restaurar', 'cyan');
      }
    } else {
      log('ℹ️  Pasta de backup não encontrada', 'cyan');
    }
    
    return true;
  }

  // FASE 6: Teste das APIs
  async phase6_TestAPIs() {
    log('\n🧪 FASE 6: TESTE DAS APIs', 'magenta');
    log('=' .repeat(50), 'magenta');
    
    // Inicia o servidor em background
    log('🚀 Iniciando servidor de teste...', 'blue');
    
    const serverProcess = exec('npm run dev');
    
    // Aguarda servidor iniciar
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Testa APIs básicas
    const apis = [
      { url: 'http://localhost:3000/api/clients', name: 'API de Clientes' },
      { url: 'http://localhost:3000/api/vehicles', name: 'API de Veículos' },
      { url: 'http://localhost:3000/api/laudos', name: 'API de Laudos' },
      { url: 'http://localhost:3000/api/equipments', name: 'API de Equipamentos' }
    ];
    
    log('\n📡 Testando APIs...', 'blue');
    
    for (const api of apis) {
      try {
        const response = await fetch(api.url);
        if (response.ok) {
          log(`  ✅ ${api.name}`, 'green');
        } else {
          log(`  ⚠️  ${api.name} - Status: ${response.status}`, 'yellow');
          this.results.warnings.push(`${api.name} retornou status ${response.status}`);
        }
      } catch (error) {
        log(`  ❌ ${api.name} - Erro de conexão`, 'red');
        this.results.warnings.push(`${api.name} não acessível`);
      }
    }
    
    // Para o servidor
    serverProcess.kill();
    
    return true;
  }

  // FASE 7: Geração de Relatório
  async phase7_GenerateReport() {
    log('\n📊 FASE 7: RELATÓRIO FINAL', 'magenta');
    log('=' .repeat(50), 'magenta');
    
    const report = {
      timestamp: this.timestamp,
      date: new Date().toLocaleString('pt-BR'),
      results: this.results,
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        cwd: process.cwd()
      }
    };
    
    const reportPath = `migration/logs/report-${this.timestamp}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    log('\n📋 RESUMO DA MIGRAÇÃO:', 'cyan');
    log('=' .repeat(50), 'cyan');
    log(`✅ Tarefas concluídas: ${this.results.success.length}`, 'green');
    log(`⚠️  Avisos: ${this.results.warnings.length}`, 'yellow');
    log(`❌ Erros: ${this.results.errors.length}`, 'red');
    
    if (this.results.warnings.length > 0) {
      log('\n⚠️  AVISOS:', 'yellow');
      this.results.warnings.forEach(w => log(`  • ${w}`, 'yellow'));
    }
    
    if (this.results.errors.length > 0) {
      log('\n❌ ERROS:', 'red');
      this.results.errors.forEach(e => log(`  • ${e.task}: ${e.error}`, 'red'));
    }
    
    log(`\n📄 Relatório completo: ${reportPath}`, 'blue');
    log(`📝 Log detalhado: ${this.logFile}`, 'blue');
    
    return true;
  }

  // FASE 8: Validação do Sistema
  async phase8_ValidateSystem() {
    log('\n' + '='.repeat(70), 'cyan');
    log('FASE 8: VALIDAÇÃO DO SISTEMA', 'cyan');
    log('=' .repeat(70), 'cyan');
    
    const startTime = Date.now();
    
    try {
      const userWantsValidation = await this.getUserConfirmation(
        '\nDeseja executar a validação completa do sistema? (recomendado)'
      );
      
      if (!userWantsValidation) {
        log('⏭️  Validação pulada pelo usuário', 'yellow');
        this.logResult('Validação do Sistema', 'warning', 'Pulada pelo usuário');
        return true;
      }
      
      log('\n🔍 Executando validação completa...', 'cyan');
      log('   Isso pode demorar alguns minutos...', 'yellow');
      
      // Executa o script de validação
      const { spawn } = require('child_process');
      const validation = spawn('node', ['migration/validate-migration.js'], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      await new Promise((resolve, reject) => {
        validation.on('close', code => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Validação retornou código ${code}`));
          }
        });
        
        validation.on('error', err => {
          reject(err);
        });
      });
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      log(`\n✅ Validação concluída em ${elapsed}s`, 'green');
      this.logResult('Validação do Sistema', 'success', `Concluída em ${elapsed}s`);
      
      return true;
      
    } catch (error) {
      log('\n⚠️  Erro durante validação:', 'yellow');
      log(`   ${error.message}`, 'yellow');
      log('   Execute manualmente: node migration/validate-migration.js', 'yellow');
      
      this.logResult('Validação do Sistema', 'warning', error.message);
      
      // Não é crítico, então retornamos true
      return true;
    }
  }

  // Executa migração completa
  async execute() {
    this.setupLogDirectory();
    this.showBanner();
    
    log('🚀 INICIANDO PROCESSO DE MIGRAÇÃO', 'green');
    log('\nEste processo irá:', 'cyan');
    log('  1. Verificar pré-requisitos do sistema', 'cyan');
    log('  2. Instalar dependências Node.js', 'cyan');
    log('  3. Configurar variáveis de ambiente', 'cyan');
    log('  4. Configurar banco de dados Prisma', 'cyan');
    log('  5. Restaurar arquivos de upload', 'cyan');
    log('  6. Testar APIs do sistema', 'cyan');
    log('  7. Gerar relatório final', 'cyan');
    log('  8. Validar integridade do sistema (opcional)', 'cyan');
    
    const confirm = await this.getUserConfirmation('\nDeseja continuar com a migração?');
    
    if (!confirm) {
      log('\n❌ Migração cancelada pelo usuário', 'red');
      return false;
    }
    
    // Executa fases
    const phases = [
      { fn: () => this.phase1_Prerequisites(), required: true },
      { fn: () => this.phase2_InstallDependencies(), required: true },
      { fn: () => this.phase3_SetupEnvironment(), required: true },
      { fn: () => this.phase4_SetupPrisma(), required: true },
      { fn: () => this.phase5_RestoreUploads(), required: false },
      { fn: () => this.phase6_TestAPIs(), required: false },
      { fn: () => this.phase7_GenerateReport(), required: false },
      { fn: () => this.phase8_ValidateSystem(), required: false }
    ];
    
    for (const phase of phases) {
      const success = await phase.fn();
      
      if (!success && phase.required) {
        log('\n❌ MIGRAÇÃO INTERROMPIDA DEVIDO A ERRO CRÍTICO', 'red');
        log('   Verifique o log para mais detalhes', 'red');
        return false;
      }
    }
    
    // Sucesso final
    log('\n' + '='.repeat(70), 'green');
    log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!', 'green');
    log('=' .repeat(70), 'green');
    
    log('\n📌 PRÓXIMOS PASSOS:', 'cyan');
    log('  1. Verifique as configurações em .env e .env.local', 'cyan');
    log('  2. Execute: npm run dev (para desenvolvimento)', 'cyan');
    log('  3. Ou execute: npm run build && npm run start (para produção)', 'cyan');
    log('  4. Acesse: http://localhost:3000', 'cyan');
    log('  5. Consulte CHECKLIST-POS-MIGRACAO.md para verificações manuais', 'cyan');
    
    return true;
  }
}

// Função principal
async function main() {
  const orchestrator = new MigrationOrchestrator();
  
  try {
    const success = await orchestrator.execute();
    process.exit(success ? 0 : 1);
  } catch (error) {
    log(`\n❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = MigrationOrchestrator;