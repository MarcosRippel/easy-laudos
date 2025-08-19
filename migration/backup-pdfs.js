/**
 * Script de Backup dos PDFs Gerados
 * Sistema GTS - General Truck System
 * 
 * Este script faz backup de todos os PDFs gerados pelo sistema,
 * incluindo laudos de checklist, pino rei, quinta roda e ruído.
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

class PDFBackup {
  constructor() {
    this.rootPath = process.cwd();
    this.backupDir = 'migration/backups/pdfs';
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.pdfFiles = [];
    this.totalSize = 0;
  }

  // Procura PDFs na raiz do projeto
  findPDFsInRoot() {
    log('\n📄 Procurando PDFs na raiz do projeto...', 'blue');
    
    const files = fs.readdirSync(this.rootPath);
    const pdfs = files.filter(file => {
      return file.endsWith('.pdf') && fs.statSync(file).isFile();
    });
    
    log(`  Encontrados ${pdfs.length} PDFs na raiz`, 'cyan');
    return pdfs;
  }

  // Procura PDFs em subpastas
  findPDFsInSubfolders() {
    log('\n📂 Procurando PDFs em subpastas...', 'blue');
    
    const subfolders = ['public', 'ULTIMOCHECKLIST', 'downloads'];
    const allPdfs = [];
    
    for (const folder of subfolders) {
      if (fs.existsSync(folder)) {
        try {
          const files = this.findPDFsRecursive(folder);
          if (files.length > 0) {
            log(`  ${folder}/: ${files.length} PDFs`, 'cyan');
            allPdfs.push(...files);
          }
        } catch (error) {
          log(`  ⚠️ Erro ao ler ${folder}: ${error.message}`, 'yellow');
        }
      }
    }
    
    return allPdfs;
  }

  // Busca recursiva por PDFs
  findPDFsRecursive(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        this.findPDFsRecursive(filePath, fileList);
      } else if (file.endsWith('.pdf')) {
        fileList.push(filePath);
      }
    }
    
    return fileList;
  }

  // Categoriza PDFs por tipo
  categorizePDFs(pdfList) {
    const categories = {
      checklist: [],
      pinoRei: [],
      quintaRoda: [],
      ruido: [],
      isolamento: [],
      laudos: [],
      outros: []
    };
    
    pdfList.forEach(pdf => {
      const fileName = path.basename(pdf).toLowerCase();
      
      if (fileName.includes('checklist')) {
        categories.checklist.push(pdf);
      } else if (fileName.includes('pino-rei') || fileName.includes('pino rei')) {
        categories.pinoRei.push(pdf);
      } else if (fileName.includes('quinta-roda') || fileName.includes('quinta roda')) {
        categories.quintaRoda.push(pdf);
      } else if (fileName.includes('ruido')) {
        categories.ruido.push(pdf);
      } else if (fileName.includes('isolamento')) {
        categories.isolamento.push(pdf);
      } else if (fileName.includes('laudo')) {
        categories.laudos.push(pdf);
      } else {
        categories.outros.push(pdf);
      }
    });
    
    return categories;
  }

  // Cria diretório de backup
  createBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      log(`\n📁 Diretório de backup criado: ${this.backupDir}`, 'green');
    }
  }

  // Calcula hash MD5 do arquivo
  calculateHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  // Faz backup de um PDF
  backupPDF(pdfPath, category) {
    const fileName = path.basename(pdfPath);
    const categoryDir = path.join(this.backupDir, category);
    
    // Cria pasta da categoria se não existir
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    const backupPath = path.join(categoryDir, fileName);
    
    // Se já existe um arquivo com mesmo nome, adiciona timestamp
    let finalBackupPath = backupPath;
    if (fs.existsSync(backupPath)) {
      const ext = path.extname(fileName);
      const name = path.basename(fileName, ext);
      finalBackupPath = path.join(categoryDir, `${name}-${Date.now()}${ext}`);
    }
    
    // Copia o arquivo
    fs.copyFileSync(pdfPath, finalBackupPath);
    
    // Verifica integridade
    const sourceHash = this.calculateHash(pdfPath);
    const backupHash = this.calculateHash(finalBackupPath);
    
    if (sourceHash !== backupHash) {
      throw new Error(`Falha na integridade: ${fileName}`);
    }
    
    const stats = fs.statSync(pdfPath);
    this.totalSize += stats.size;
    
    return {
      original: pdfPath,
      backup: finalBackupPath,
      name: fileName,
      size: stats.size,
      sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
      hash: sourceHash,
      modified: stats.mtime
    };
  }

  // Faz backup de todos os PDFs
  backupAllPDFs(categories) {
    log('\n💾 Fazendo backup dos PDFs...', 'blue');
    
    const backupResults = {};
    let totalBackups = 0;
    
    for (const [category, pdfs] of Object.entries(categories)) {
      if (pdfs.length === 0) continue;
      
      log(`\n  📋 Categoria: ${category} (${pdfs.length} arquivos)`, 'cyan');
      backupResults[category] = [];
      
      for (const pdfPath of pdfs) {
        try {
          const result = this.backupPDF(pdfPath, category);
          backupResults[category].push(result);
          totalBackups++;
          log(`    ✅ ${result.name} (${result.sizeMB}MB)`, 'green');
        } catch (error) {
          log(`    ❌ Erro: ${path.basename(pdfPath)} - ${error.message}`, 'red');
        }
      }
    }
    
    log(`\n📊 Total de PDFs copiados: ${totalBackups}`, 'cyan');
    log(`💾 Tamanho total: ${(this.totalSize / (1024 * 1024)).toFixed(2)}MB`, 'cyan');
    
    return backupResults;
  }

  // Cria relatório detalhado
  createReport(allPdfs, categories, backupResults) {
    const report = {
      timestamp: this.timestamp,
      date: new Date().toLocaleString('pt-BR'),
      summary: {
        totalPDFs: allPdfs.length,
        totalSizeMB: (this.totalSize / (1024 * 1024)).toFixed(2),
        categories: {
          checklist: categories.checklist.length,
          pinoRei: categories.pinoRei.length,
          quintaRoda: categories.quintaRoda.length,
          ruido: categories.ruido.length,
          isolamento: categories.isolamento.length,
          laudos: categories.laudos.length,
          outros: categories.outros.length
        }
      },
      backupDetails: backupResults
    };
    
    const reportPath = path.join(this.backupDir, `pdf-backup-report-${this.timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    log(`\n📋 Relatório salvo: ${reportPath}`, 'green');
    
    return report;
  }

  // Cria script de limpeza
  createCleanupScript() {
    const scriptContent = `#!/bin/bash
# Script de Limpeza de PDFs Antigos
# Gerado em: ${new Date().toLocaleString('pt-BR')}
# 
# ATENÇÃO: Este script remove PDFs da raiz do projeto
# Use apenas após confirmar que o backup está completo

echo "⚠️  ATENÇÃO: Este script removerá PDFs antigos da raiz do projeto"
echo "Certifique-se de que o backup está completo antes de continuar!"
read -p "Deseja continuar? (s/n): " confirm

if [ "$confirm" != "s" ]; then
    echo "Operação cancelada"
    exit 0
fi

echo "🗑️  Removendo PDFs antigos..."

# Remove PDFs da raiz (exceto os em pastas)
find . -maxdepth 1 -name "*.pdf" -type f -delete

echo "✅ Limpeza concluída!"
`;

    const scriptPath = path.join(this.backupDir, `cleanup-pdfs-${this.timestamp}.sh`);
    fs.writeFileSync(scriptPath, scriptContent);
    
    // Script para Windows
    const scriptContentWin = `@echo off
REM Script de Limpeza de PDFs Antigos
REM Gerado em: ${new Date().toLocaleString('pt-BR')}

echo ATENCAO: Este script removera PDFs antigos da raiz do projeto
echo Certifique-se de que o backup esta completo antes de continuar!
set /p confirm="Deseja continuar? (s/n): "

if /i "%confirm%" neq "s" (
    echo Operacao cancelada
    exit /b 0
)

echo Removendo PDFs antigos...

REM Remove PDFs da raiz
del /q *.pdf 2>nul

echo Limpeza concluida!
`;

    const scriptPathWin = path.join(this.backupDir, `cleanup-pdfs-${this.timestamp}.bat`);
    fs.writeFileSync(scriptPathWin, scriptContentWin);
    
    log(`\n🧹 Scripts de limpeza criados (use com cuidado!)`, 'yellow');
  }

  // Executa backup completo
  async execute() {
    try {
      log('\n' + '='.repeat(60), 'cyan');
      log('BACKUP DOS PDFs - SISTEMA GTS', 'cyan');
      log('='.repeat(60), 'cyan');
      
      // Procura PDFs
      const rootPdfs = this.findPDFsInRoot();
      const subfolderPdfs = this.findPDFsInSubfolders();
      const allPdfs = [...rootPdfs, ...subfolderPdfs];
      
      if (allPdfs.length === 0) {
        log('\n⚠️ Nenhum PDF encontrado para backup', 'yellow');
        return null;
      }
      
      log(`\n📊 Total de PDFs encontrados: ${allPdfs.length}`, 'cyan');
      
      // Categoriza PDFs
      const categories = this.categorizePDFs(allPdfs);
      
      // Cria diretório de backup
      this.createBackupDirectory();
      
      // Faz backup
      const backupResults = this.backupAllPDFs(categories);
      
      // Cria relatório
      const report = this.createReport(allPdfs, categories, backupResults);
      
      // Cria scripts de limpeza
      this.createCleanupScript();
      
      // Resumo final
      log('\n' + '='.repeat(60), 'cyan');
      log('✅ BACKUP DE PDFs CONCLUÍDO!', 'green');
      log('='.repeat(60), 'cyan');
      log(`\n📁 Pasta de backup: ${this.backupDir}`, 'blue');
      log(`📄 Total de PDFs: ${allPdfs.length}`, 'blue');
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
  const backup = new PDFBackup();
  
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

module.exports = PDFBackup;