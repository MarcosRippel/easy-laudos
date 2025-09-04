#!/usr/bin/env python3
"""
Sistema de Backup Automático - Container Docker
Sistema Emissor de Laudos - IP Virtual: 172.20.0.10
"""

import os
import sys
import json
import shutil
import sqlite3
import tarfile
import time
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

# Configuração de logging
def setup_logging():
    log_dir = Path("/app/logs")
    log_dir.mkdir(exist_ok=True)
    
    log_file = log_dir / f"backup_{datetime.now().strftime('%Y%m%d')}.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger(__name__)

logger = setup_logging()

class ContainerBackupSystem:
    """Sistema completo de backup para container Docker"""
    
    def __init__(self, config_file="/app/docker/backup-config.json"):
        self.config = self.load_config(config_file)
        self.backup_dir = Path("/app/backups")
        self.backup_dir.mkdir(exist_ok=True, parents=True)
        
    def load_config(self, config_file):
        """Carrega configurações de backup"""
        default_config = {
            "database_backup": True,
            "uploads_backup": True,
            "logs_backup": True,
            "full_backup": False,
            "retention_days": 7,
            "max_backups": 10,
            "compression": True,
            "encrypt": False
        }
        
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    file_config = json.load(f)
                    default_config.update(file_config)
            except Exception as e:
                logger.warning(f"Erro ao carregar config de backup: {e}")
        
        return default_config
    
    def backup_database(self):
        """Backup do banco SQLite com verificação de integridade"""
        try:
            db_path = Path("/app/prisma/dev.db")
            if not db_path.exists():
                logger.warning("Banco de dados não encontrado")
                return False
            
            # Verificar integridade antes do backup
            if not self.verify_database_integrity(str(db_path)):
                logger.error("Banco com problemas de integridade - backup cancelado")
                return False
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = self.backup_dir / f"database_backup_{timestamp}.db"
            
            # Backup com verificação
            shutil.copy2(db_path, backup_file)
            
            # Verificar backup criado
            if backup_file.exists() and backup_file.stat().st_size > 0:
                logger.info(f"Backup do banco criado: {backup_file}")
                return True
            else:
                logger.error("Falha na criação do backup do banco")
                return False
                
        except Exception as e:
            logger.error(f"Erro no backup do banco: {e}")
            return False
    
    def backup_uploads(self):
        """Backup dos arquivos de upload"""
        try:
            uploads_dir = Path("/app/public/uploads")
            if not uploads_dir.exists():
                logger.info("Diretório de uploads não existe ainda")
                return True
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = self.backup_dir / f"uploads_backup_{timestamp}.tar.gz"
            
            with tarfile.open(backup_file, "w:gz") as tar:
                tar.add(uploads_dir, arcname="uploads")
            
            logger.info(f"Backup de uploads criado: {backup_file}")
            return True
            
        except Exception as e:
            logger.error(f"Erro no backup de uploads: {e}")
            return False
    
    def backup_logs(self):
        """Backup dos logs do sistema"""
        try:
            logs_dir = Path("/app/logs")
            if not logs_dir.exists():
                logger.warning("Diretório de logs não encontrado")
                return False
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = self.backup_dir / f"logs_backup_{timestamp}.tar.gz"
            
            with tarfile.open(backup_file, "w:gz") as tar:
                for log_file in logs_dir.glob("*.log"):
                    # Só incluir logs de até 7 dias
                    if log_file.stat().st_mtime > time.time() - (7 * 24 * 3600):
                        tar.add(log_file, arcname=f"logs/{log_file.name}")
            
            logger.info(f"Backup de logs criado: {backup_file}")
            return True
            
        except Exception as e:
            logger.error(f"Erro no backup de logs: {e}")
            return False
    
    def full_system_backup(self):
        """Backup completo do sistema"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = self.backup_dir / f"full_backup_{timestamp}.tar.gz"
            
            logger.info("Iniciando backup completo do sistema...")
            
            with tarfile.open(backup_file, "w:gz") as tar:
                # Banco de dados
                db_path = Path("/app/prisma/dev.db")
                if db_path.exists():
                    tar.add(db_path, arcname="database/dev.db")
                
                # Uploads
                uploads_dir = Path("/app/public/uploads")
                if uploads_dir.exists():
                    tar.add(uploads_dir, arcname="uploads")
                
                # Configurações
                if os.path.exists("/app/.env"):
                    tar.add("/app/.env", arcname="config/.env")
                
                # SSL (se existir)
                ssl_dir = Path("/app/ssl")
                if ssl_dir.exists():
                    tar.add(ssl_dir, arcname="ssl")
            
            logger.info(f"Backup completo criado: {backup_file}")
            return True
            
        except Exception as e:
            logger.error(f"Erro no backup completo: {e}")
            return False
    
    def verify_database_integrity(self, db_path):
        """Verifica integridade do banco SQLite"""
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Verificar integridade
            cursor.execute("PRAGMA integrity_check")
            result = cursor.fetchone()
            
            conn.close()
            
            if result and result[0] == "ok":
                return True
            else:
                logger.error(f"Problema de integridade no banco: {result}")
                return False
                
        except Exception as e:
            logger.error(f"Erro na verificação de integridade: {e}")
            return False
    
    def cleanup_old_backups(self):
        """Remove backups antigos baseado na configuração"""
        try:
            retention_days = self.config.get('retention_days', 7)
            max_backups = self.config.get('max_backups', 10)
            
            cutoff_time = time.time() - (retention_days * 24 * 3600)
            
            # Listar todos os backups
            all_backups = []
            for pattern in ['*_backup_*.db', '*_backup_*.tar.gz']:
                all_backups.extend(self.backup_dir.glob(pattern))
            
            # Ordenar por data de modificação (mais recente primeiro)
            all_backups.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            removed_count = 0
            
            # Remover por idade
            for backup_file in all_backups:
                if backup_file.stat().st_mtime < cutoff_time:
                    backup_file.unlink()
                    logger.info(f"Backup antigo removido: {backup_file.name}")
                    removed_count += 1
            
            # Manter apenas os N backups mais recentes
            remaining_backups = [f for f in all_backups if f.exists()]
            if len(remaining_backups) > max_backups:
                for backup_file in remaining_backups[max_backups:]:
                    backup_file.unlink()
                    logger.info(f"Backup removido (excesso): {backup_file.name}")
                    removed_count += 1
            
            if removed_count > 0:
                logger.info(f"Limpeza concluída: {removed_count} backups removidos")
            
        except Exception as e:
            logger.error(f"Erro na limpeza de backups: {e}")
    
    def get_backup_status(self):
        """Retorna status dos backups"""
        try:
            backups = list(self.backup_dir.glob("*backup*"))
            backups.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            status = {
                "total_backups": len(backups),
                "backup_dir_size": sum(f.stat().st_size for f in backups),
                "last_backup": None,
                "recent_backups": []
            }
            
            if backups:
                last_backup = backups[0]
                status["last_backup"] = {
                    "file": last_backup.name,
                    "size": last_backup.stat().st_size,
                    "date": datetime.fromtimestamp(last_backup.stat().st_mtime).isoformat()
                }
                
                # Últimos 5 backups
                for backup in backups[:5]:
                    status["recent_backups"].append({
                        "file": backup.name,
                        "size": backup.stat().st_size,
                        "date": datetime.fromtimestamp(backup.stat().st_mtime).isoformat()
                    })
            
            return status
            
        except Exception as e:
            logger.error(f"Erro ao obter status de backup: {e}")
            return {"error": str(e)}
    
    def run_backup_cycle(self):
        """Executa ciclo completo de backup"""
        logger.info("=== INICIANDO CICLO DE BACKUP ===")
        
        success_count = 0
        total_tasks = 0
        
        # Backup do banco de dados
        if self.config.get('database_backup', True):
            total_tasks += 1
            if self.backup_database():
                success_count += 1
        
        # Backup dos uploads
        if self.config.get('uploads_backup', True):
            total_tasks += 1
            if self.backup_uploads():
                success_count += 1
        
        # Backup dos logs
        if self.config.get('logs_backup', True):
            total_tasks += 1
            if self.backup_logs():
                success_count += 1
        
        # Backup completo
        if self.config.get('full_backup', False):
            total_tasks += 1
            if self.full_system_backup():
                success_count += 1
        
        # Limpeza de backups antigos
        self.cleanup_old_backups()
        
        logger.info(f"=== CICLO CONCLUÍDO: {success_count}/{total_tasks} backups bem-sucedidos ===")
        
        return success_count == total_tasks

if __name__ == "__main__":
    backup_system = ContainerBackupSystem()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "database":
            backup_system.backup_database()
        elif command == "uploads":
            backup_system.backup_uploads()
        elif command == "logs":
            backup_system.backup_logs()
        elif command == "full":
            backup_system.full_system_backup()
        elif command == "cleanup":
            backup_system.cleanup_old_backups()
        elif command == "status":
            status = backup_system.get_backup_status()
            print(json.dumps(status, indent=2))
        else:
            print("Comandos disponíveis: database, uploads, logs, full, cleanup, status")
    else:
        # Execução padrão - ciclo completo
        backup_system.run_backup_cycle()