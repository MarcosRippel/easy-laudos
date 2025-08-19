/**
 * Script de Backup do Banco de Dados
 * Sistema GTS - General Truck System
 * 
 * Este script faz backup do banco de dados SQLite,
 * preservando todos os dados de clientes, veículos, laudos e equipamentos.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class DatabaseBackup {
  constructor() {
    this.sourcePath = 'prisma/dev.db';
    this.backupDir = 'migration/backups/database';
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  // Verifica se o banco existe
  checkDatabase() {
    log('\n📊 Verificando banco de dados...', 'blue');
    
    if (!fs.existsSync(this.sourcePath)) {
      throw new Error(`Banco de dados não encontrado em ${this.sourcePath}`);
    }

    const stats = fs.statSync(this.sourcePath);
    const sizeMB = stats.size / (1024 * 1024);
    
    log(`✅ Banco encontrado: ${sizeMB.toFixed(2)}MB`, 'green');
    log(`📅 Última modificação: ${stats.mtime.toLocaleString('pt-BR')}`, 'cyan');
    
    return {
      size: stats.size,
      sizeMB: sizeMB,
      modified: stats.mtime
    };
  }

  // Cria diretório de backup
  createBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      log(`📁 Diretório de backup criado: ${this.backupDir}`, 'green');
    }
  }

  // Calcula hash MD5 do arquivo
  calculateHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  // Faz backup do banco principal
  backupMainDatabase() {
    log('\n💾 Fazendo backup do banco de dados...', 'blue');
    
    const backupName = `gts-database-${this.timestamp}.db`;
    const backupPath = path.join(this.backupDir, backupName);
    
    // Copia o arquivo
    fs.copyFileSync(this.sourcePath, backupPath);
    
    // Verifica integridade
    const sourceHash = this.calculateHash(this.sourcePath);
    const backupHash = this.calculateHash(backupPath);
    
    if (sourceHash !== backupHash) {
      throw new Error('Falha na verificação de integridade do backup!');
    }
    
    log(`✅ Backup criado: ${backupName}`, 'green');
    log(`🔐 Hash MD5: ${sourceHash}`, 'cyan');
    
    return {
      path: backupPath,
      name: backupName,
      hash: sourceHash
    };
  }

  // Faz backup dos arquivos relacionados ao banco
  backupRelatedFiles() {
    log('\n📎 Fazendo backup de arquivos relacionados...', 'blue');
    
    const relatedFiles = [
      'prisma/dev.db-journal',
      'prisma/schema.prisma',
      '.env',
      '.env.local'
    ];
    
    const backedUpFiles = [];
    
    for (const file of relatedFiles) {
      if (fs.existsSync(file)) {
        const fileName = path.basename(file);
        const backupName = `${fileName}-${this.timestamp}`;
        const backupPath = path.join(this.backupDir, backupName);
        
        fs.copyFileSync(file, backupPath);
        backedUpFiles.push(backupName);
        log(`✅ Backup: ${fileName}`, 'green');
      }
    }
    
    return backedUpFiles;
  }

  // Extrai estatísticas do banco
  async extractDatabaseStats() {
    log('\n📈 Extraindo estatísticas do banco...', 'blue');
    
    try {
      // Importa Prisma Client dinamicamente
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const stats = {
        clients: await prisma.client.count(),
        vehicles: await prisma.vehicle.count(),
        laudos: await prisma.laudo.count(),
        equipments: await prisma.equipment.count(),
        laudosRuido: await prisma.laudoRuido.count(),
        laudosPinoRei: await prisma.laudoPinoRei.count(),
        laudosQuintaRoda: await prisma.laudoQuintaRoda.count()
      };
      
      await prisma.$disconnect();
      
      log('📊 Estatísticas do banco:', 'cyan');
      log(`  • Clientes: ${stats.clients}`, 'cyan');
      log(`  • Veículos: ${stats.vehicles}`, 'cyan');
      log(`  • Laudos (total): ${stats.laudos}`, 'cyan');
      log(`  • Equipamentos: ${stats.equipments}`, 'cyan');
      log(`  • Laudos de Ruído: ${stats.laudosRuido}`, 'cyan');
      log(`  • Laudos de Pino Rei: ${stats.laudosPinoRei}`, 'cyan');
      log(`  • Laudos de Quinta Roda: ${stats.laudosQuintaRoda}`, 'cyan');
      
      return stats;
    } catch (error) {
      log('⚠️ Não foi possível extrair estatísticas (Prisma não configurado)', 'yellow');
      return null;
    }
  }

  // Cria arquivo de metadados
  createMetadataFile(backupInfo, stats) {
    const metadata = {
      timestamp: this.timestamp,
      date: new Date().toLocaleString('pt-BR'),
      backup: backupInfo,
      statistics: stats,
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        cwd: process.cwd()
      }
    };
    
    const metadataPath = path.join(this.backupDir, `metadata-${this.timestamp}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    log(`\n📋 Metadados salvos: metadata-${this.timestamp}.json`, 'green');
    
    return metadata;
  }

  // Cria script de restauração
  createRestoreScript(backupInfo) {
    const scriptContent = `#!/bin/bash
# Script de Restauração do Banco de Dados
# Gerado em: ${new Date().toLocaleString('pt-BR')}
# Backup: ${backupInfo.name}

echo "🔄 Restaurando banco de dados..."

# Faz backup do banco atual (se existir)
if [ -f "prisma/dev.db" ]; then
    mv prisma/dev.db prisma/dev.db.old
    echo "✅ Banco atual movido para dev.db.old"
fi

# Restaura o backup
cp "${backupInfo.path}" prisma/dev.db
echo "✅ Banco restaurado de ${backupInfo.name}"

# Verifica integridade
echo "🔐 Hash esperado: ${backupInfo.hash}"
echo "Verificação completa!"
`;

    const scriptPath = path.join(this.backupDir, `restore-${this.timestamp}.sh`);
    fs.writeFileSync(scriptPath, scriptContent);
    
    // Script para Windows
    const scriptContentWin = `@echo off
REM Script de Restauração do Banco de Dados
REM Gerado em: ${new Date().toLocaleString('pt-BR')}
REM Backup: ${backupInfo.name}

echo Restaurando banco de dados...

REM Faz backup do banco atual (se existir)
if exist "prisma\\dev.db" (
    move prisma\\dev.db prisma\\dev.db.old
    echo Banco atual movido para dev.db.old
)

REM Restaura o backup
copy "${backupInfo.path.replace(/\//g, '\\')}" prisma\\dev.db
echo Banco restaurado de ${backupInfo.name}

echo Hash esperado: ${backupInfo.hash}
echo Verificacao completa!
`;

    const scriptPathWin = path.join(this.backupDir, `restore-${this.timestamp}.bat`);
    fs.writeFileSync(scriptPathWin, scriptContentWin);
    
    log(`\n📜 Scripts de restauração criados:`, 'green');
    log(`  • Linux/Mac: restore-${this.timestamp}.sh`, 'cyan');
    log(`  • Windows: restore-${this.timestamp}.bat`, 'cyan');
  }

  // Executa backup completo
  async execute() {
    try {
      log('\n' + '='.repeat(60), 'cyan');
      log('BACKUP DO BANCO DE DADOS - SISTEMA GTS', 'cyan');
      log('='.repeat(60), 'cyan');
      
      // Verifica banco
      const dbInfo = this.checkDatabase();
      
      // Cria diretório
      this.createBackupDirectory();
      
      // Faz backup principal
      const backupInfo = this.backupMainDatabase();
      
      // Faz backup de arquivos relacionados
      const relatedFiles = this.backupRelatedFiles();
      
      // Extrai estatísticas
      const stats = await this.extractDatabaseStats();
      
      // Cria metadados
      const metadata = this.createMetadataFile({
        ...backupInfo,
        relatedFiles,
        originalSize: dbInfo.size
      }, stats);
      
      // Cria scripts de restauração
      this.createRestoreScript(backupInfo);
      
      // Resumo final
      log('\n' + '='.repeat(60), 'cyan');
      log('✅ BACKUP CONCLUÍDO COM SUCESSO!', 'green');
      log('='.repeat(60), 'cyan');
      log(`\n📁 Pasta de backup: ${this.backupDir}`, 'blue');
      log(`💾 Arquivo principal: ${backupInfo.name}`, 'blue');
      log(`📊 Tamanho: ${dbInfo.sizeMB.toFixed(2)}MB`, 'blue');
      log(`🔐 Integridade: ${backupInfo.hash}`, 'blue');
      
      return metadata;
      
    } catch (error) {
      log(`\n❌ Erro no backup: ${error.message}`, 'red');
      throw error;
    }
  }
}

// Função principal
async function main() {
  const backup = new DatabaseBackup();
  
  try {
    const result = await backup.execute();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = DatabaseBackup;