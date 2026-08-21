/**
 * Script de Backup dos Arquivos de Upload
 * Sistema GTS - General Truck System
 * 
 * Este script faz backup de todos os arquivos de upload,
 * preservando as imagens dos veículos e laudos.
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

class UploadsBackup {
  constructor() {
    this.sourcePath = 'public/uploads';
    this.backupDir = 'migration/backups/uploads';
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.fileList = [];
    this.totalSize = 0;
  }

  // Verifica se a pasta de uploads existe
  checkUploadsFolder() {
    log('\n📁 Verificando pasta de uploads...', 'blue');
    
    if (!fs.existsSync(this.sourcePath)) {
      log('⚠️ Pasta de uploads não encontrada. Criando estrutura...', 'yellow');
      fs.mkdirSync(this.sourcePath, { recursive: true });
      return { exists: false, fileCount: 0 };
    }

    const files = fs.readdirSync(this.sourcePath);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });

    log(`✅ Pasta encontrada: ${imageFiles.length} imagens`, 'green');
    
    return { exists: true, fileCount: imageFiles.length, files: imageFiles };
  }

  // Cria diretório de backup
  createBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      log(`📂 Diretório de backup criado: ${this.backupDir}`, 'green');
    }
  }

  // Calcula hash MD5 do arquivo
  calculateHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  // Analisa arquivo de upload
  analyzeFile(fileName) {
    const filePath = path.join(this.sourcePath, fileName);
    const stats = fs.statSync(filePath);
    const hash = this.calculateHash(filePath);
    
    return {
      name: fileName,
      path: filePath,
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2),
      modified: stats.mtime,
      hash: hash
    };
  }

  // Faz backup de um arquivo
  backupFile(fileInfo) {
    const backupPath = path.join(this.backupDir, fileInfo.name);
    
    // Copia o arquivo
    fs.copyFileSync(fileInfo.path, backupPath);
    
    // Verifica integridade
    const backupHash = this.calculateHash(backupPath);
    
    if (fileInfo.hash !== backupHash) {
      throw new Error(`Falha na integridade: ${fileInfo.name}`);
    }
    
    return backupPath;
  }

  // Faz backup de todos os uploads
  backupAllUploads(files) {
    log('\n📸 Fazendo backup dos arquivos de upload...', 'blue');
    
    const backupResults = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const fileName of files) {
      try {
        const fileInfo = this.analyzeFile(fileName);
        const backupPath = this.backupFile(fileInfo);
        
        backupResults.push({
          ...fileInfo,
          backupPath: backupPath,
          status: 'success'
        });
        
        this.totalSize += fileInfo.size;
        successCount++;
        
        log(`  ✅ ${fileName} (${fileInfo.sizeKB}KB)`, 'green');
        
      } catch (error) {
        errorCount++;
        log(`  ❌ Erro em ${fileName}: ${error.message}`, 'red');
        
        backupResults.push({
          name: fileName,
          status: 'error',
          error: error.message
        });
      }
    }
    
    log(`\n📊 Resumo: ${successCount} arquivos copiados, ${errorCount} erros`, 'cyan');
    log(`💾 Tamanho total: ${(this.totalSize / (1024 * 1024)).toFixed(2)}MB`, 'cyan');
    
    return backupResults;
  }

  // Agrupa arquivos por tipo/padrão
  groupFilesByPattern(files) {
    const groups = {
      vehiclePhotos: [],      // Fotos de veículos (FRENTE, LADO, etc)
      quintaRodaPhotos: [],   // Fotos de quinta roda (números)
      clientLogos: [],       // Logotipos do cliente
      pages: [],              // Páginas digitalizadas
      whatsapp: [],           // Imagens do WhatsApp
      others: []              // Outros
    };
    
    files.forEach(file => {
      if (file.includes('FRENTE') || file.includes('LADO') || file.includes('DIREITO')) {
        groups.vehiclePhotos.push(file);
      } else if (file.includes('clientlogo')) {
        groups.clientLogos.push(file);
      } else if (file.includes('page_')) {
        groups.pages.push(file);
      } else if (file.includes('WhatsApp')) {
        groups.whatsapp.push(file);
      } else if (/^\d{13}-\d+\.(png|jpg)$/i.test(file)) {
        groups.quintaRodaPhotos.push(file);
      } else {
        groups.others.push(file);
      }
    });
    
    return groups;
  }

  // Cria relatório de análise
  createAnalysisReport(files, backupResults) {
    log('\n📋 Gerando relatório de análise...', 'blue');
    
    const groups = this.groupFilesByPattern(files);
    
    const report = {
      timestamp: this.timestamp,
      date: new Date().toLocaleString('pt-BR'),
      summary: {
        totalFiles: files.length,
        totalSizeMB: (this.totalSize / (1024 * 1024)).toFixed(2),
        successfulBackups: backupResults.filter(r => r.status === 'success').length,
        failedBackups: backupResults.filter(r => r.status === 'error').length
      },
      fileGroups: {
        vehiclePhotos: groups.vehiclePhotos.length,
        quintaRodaPhotos: groups.quintaRodaPhotos.length,
        clientLogos: groups.clientLogos.length,
        pages: groups.pages.length,
        whatsapp: groups.whatsapp.length,
        others: groups.others.length
      },
      groups: groups,
      backupDetails: backupResults
    };
    
    const reportPath = path.join(this.backupDir, `uploads-report-${this.timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    log('📊 Análise dos arquivos:', 'cyan');
    log(`  • Fotos de veículos: ${groups.vehiclePhotos.length}`, 'cyan');
    log(`  • Fotos de quinta roda: ${groups.quintaRodaPhotos.length}`, 'cyan');
    log(`  • Logotipos do cliente: ${groups.clientLogos.length}`, 'cyan');
    log(`  • Páginas digitalizadas: ${groups.pages.length}`, 'cyan');
    log(`  • Imagens WhatsApp: ${groups.whatsapp.length}`, 'cyan');
    log(`  • Outros: ${groups.others.length}`, 'cyan');
    
    return report;
  }

  // Cria script de restauração
  createRestoreScript() {
    const scriptContent = `#!/bin/bash
# Script de Restauração dos Uploads
# Gerado em: ${new Date().toLocaleString('pt-BR')}

echo "🔄 Restaurando arquivos de upload..."

# Cria pasta de uploads se não existir
mkdir -p public/uploads

# Copia todos os arquivos
cp migration/backups/uploads/* public/uploads/

echo "✅ Uploads restaurados com sucesso!"
echo "📊 Total de arquivos: $(ls public/uploads | wc -l)"
`;

    const scriptPath = path.join(this.backupDir, `restore-uploads-${this.timestamp}.sh`);
    fs.writeFileSync(scriptPath, scriptContent);
    
    // Script para Windows
    const scriptContentWin = `@echo off
REM Script de Restauração dos Uploads
REM Gerado em: ${new Date().toLocaleString('pt-BR')}

echo Restaurando arquivos de upload...

REM Cria pasta de uploads se não existir
if not exist "public\\uploads" mkdir "public\\uploads"

REM Copia todos os arquivos
xcopy /Y "migration\\backups\\uploads\\*" "public\\uploads\\"

echo Uploads restaurados com sucesso!
`;

    const scriptPathWin = path.join(this.backupDir, `restore-uploads-${this.timestamp}.bat`);
    fs.writeFileSync(scriptPathWin, scriptContentWin);
    
    log(`\n📜 Scripts de restauração criados`, 'green');
  }

  // Executa backup completo
  async execute() {
    try {
      log('\n' + '='.repeat(60), 'cyan');
      log('BACKUP DOS ARQUIVOS DE UPLOAD - SISTEMA GTS', 'cyan');
      log('='.repeat(60), 'cyan');
      
      // Verifica pasta
      const folderInfo = this.checkUploadsFolder();
      
      if (!folderInfo.exists || folderInfo.fileCount === 0) {
        log('\n⚠️ Nenhum arquivo para fazer backup', 'yellow');
        return null;
      }
      
      // Cria diretório
      this.createBackupDirectory();
      
      // Faz backup de todos os arquivos
      const backupResults = this.backupAllUploads(folderInfo.files);
      
      // Cria relatório
      const report = this.createAnalysisReport(folderInfo.files, backupResults);
      
      // Cria scripts de restauração
      this.createRestoreScript();
      
      // Resumo final
      log('\n' + '='.repeat(60), 'cyan');
      log('✅ BACKUP DE UPLOADS CONCLUÍDO!', 'green');
      log('='.repeat(60), 'cyan');
      log(`\n📁 Pasta de backup: ${this.backupDir}`, 'blue');
      log(`📸 Total de arquivos: ${folderInfo.fileCount}`, 'blue');
      log(`💾 Tamanho total: ${report.summary.totalSizeMB}MB`, 'blue');
      
      return report;
      
    } catch (error) {
      log(`\n❌ Erro no backup: ${error.message}`, 'red');
      throw error;
    }
  }
}

// Função principal
async function main() {
  const backup = new UploadsBackup();
  
  try {
    await backup.execute();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = UploadsBackup;