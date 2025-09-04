#!/usr/bin/env python3
"""
Launcher Container - Sistema Emissor de Laudos Docker
IP Virtual: 172.20.0.10
Porta HTTPS: 443 (via nginx)
"""

import os
import sys
import json
import subprocess
import threading
import time
import shutil
import signal
import logging
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

# Configuração de logging para container
def setup_logging():
    """Configura sistema de logs otimizado para container"""
    log_dir = Path("/app/logs")
    log_dir.mkdir(exist_ok=True)
    
    log_file = log_dir / f"launcher_{datetime.now().strftime('%Y%m%d')}.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler(sys.stdout)  # Para logs do Docker
        ]
    )
    return logging.getLogger(__name__)

logger = setup_logging()

class ContainerProcessManager:
    """Gerenciador de processos otimizado para container"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.process: Optional[subprocess.Popen] = None
        self.running = False
        self.restart_count = 0
        self.max_restarts = 5
        
    def start(self):
        """Inicia o processo Next.js no container"""
        if self.running:
            logger.warning("Processo já está em execução")
            return False
            
        try:
            # No container, estamos no diretório correto
            work_dir = "/app"
            
            logger.info(f"Iniciando Next.js em {work_dir}")
            
            # Comando otimizado para container
            cmd = ["npm", "run", "start"]  # Usa next start (produção)
            
            self.process = subprocess.Popen(
                cmd,
                cwd=work_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env=dict(os.environ, **{
                    'NODE_ENV': 'production',
                    'PORT': '3000',
                    'DATABASE_URL': 'file:./prisma/dev.db'
                })
            )
            
            self.running = True
            logger.info(f"Next.js iniciado com PID: {self.process.pid}")
            
            # Thread para monitorar o processo
            monitor_thread = threading.Thread(target=self._monitor_process)
            monitor_thread.daemon = True
            monitor_thread.start()
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao iniciar processo: {e}")
            return False
    
    def stop(self):
        """Para o processo graciosamente"""
        if not self.running or not self.process:
            logger.warning("Nenhum processo em execução")
            return False
            
        try:
            logger.info("Parando processo Next.js...")
            self.process.terminate()
            self.process.wait(timeout=10)
            self.running = False
            logger.info("Processo parado com sucesso")
            return True
            
        except subprocess.TimeoutExpired:
            logger.warning("Processo não respondeu, forçando parada...")
            self.process.kill()
            self.running = False
            return True
            
        except Exception as e:
            logger.error(f"Erro ao parar processo: {e}")
            return False
    
    def restart(self):
        """Reinicia o processo"""
        logger.info("Reiniciando processo...")
        self.stop()
        time.sleep(2)
        return self.start()
    
    def _monitor_process(self):
        """Monitora o processo e reinicia se necessário"""
        while self.running:
            if self.process and self.process.poll() is not None:
                logger.error(f"Processo encerrou inesperadamente com código: {self.process.returncode}")
                
                if self.config.get('auto_restart', True) and self.restart_count < self.max_restarts:
                    self.restart_count += 1
                    logger.info(f"Tentando auto-restart ({self.restart_count}/{self.max_restarts})...")
                    time.sleep(5)
                    self.running = False
                    self.start()
                else:
                    logger.error("Máximo de restarts atingido ou auto-restart desabilitado")
                    self.running = False
                    
            time.sleep(5)  # Check a cada 5 segundos

class ContainerBackupManager:
    """Gerenciador de backup otimizado para container"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.backup_dir = Path("/app/backups")
        self.backup_dir.mkdir(exist_ok=True, parents=True)
        
    def backup_database(self):
        """Realiza backup do banco SQLite"""
        if not self.config.get('backup_enabled', True):
            return
            
        try:
            db_path = Path("/app/prisma/dev.db")
            if not db_path.exists():
                logger.warning(f"Banco de dados não encontrado: {db_path}")
                return
                
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = self.backup_dir / f"backup_{timestamp}.db"
            
            shutil.copy2(db_path, backup_file)
            logger.info(f"Backup criado: {backup_file}")
            
            # Limpar backups antigos (manter últimos 7)
            self._cleanup_old_backups()
            
        except Exception as e:
            logger.error(f"Erro ao fazer backup: {e}")
    
    def _cleanup_old_backups(self):
        """Remove backups antigos, mantendo apenas os 7 mais recentes"""
        backups = sorted(self.backup_dir.glob("backup_*.db"))
        if len(backups) > 7:
            for old_backup in backups[:-7]:
                old_backup.unlink()
                logger.info(f"Backup antigo removido: {old_backup}")
    
    def start_scheduler(self):
        """Inicia agendador de backups"""
        def run_backup():
            while True:
                time.sleep(self.config.get('backup_interval_hours', 6) * 3600)
                self.backup_database()
        
        backup_thread = threading.Thread(target=run_backup)
        backup_thread.daemon = True
        backup_thread.start()
        logger.info("Agendador de backup iniciado")

class ContainerHealthCheck:
    """Sistema de health check para container"""
    
    def __init__(self, process_manager):
        self.process_manager = process_manager
    
    def check_nextjs(self):
        """Verifica se Next.js está respondendo"""
        try:
            import urllib.request
            response = urllib.request.urlopen("http://localhost:3000/api/health", timeout=5)
            return response.getcode() == 200
        except:
            return False
    
    def check_database(self):
        """Verifica se o banco está acessível"""
        try:
            db_path = "/app/prisma/dev.db"
            conn = sqlite3.connect(db_path)
            conn.execute("SELECT 1")
            conn.close()
            return True
        except:
            return False
    
    def get_status(self):
        """Retorna status completo do container"""
        return {
            "nextjs_healthy": self.check_nextjs(),
            "nextjs_running": self.process_manager.running,
            "database_healthy": self.check_database(),
            "container_ip": "172.20.0.10",
            "timestamp": datetime.now().isoformat()
        }

class ContainerLauncher:
    """Launcher principal para container Docker"""
    
    def __init__(self):
        self.config = self.load_config()
        self.start_time = datetime.now()
        self.process_manager = ContainerProcessManager(self.config)
        self.backup_manager = ContainerBackupManager(self.config)
        self.health_check = ContainerHealthCheck(self.process_manager)
        self.shutdown_requested = False
        
    def load_config(self):
        """Carrega configurações do ambiente e arquivo"""
        default_config = {
            "auto_restart": True,
            "backup_enabled": True,
            "backup_interval_hours": 6,
            "container_mode": True
        }
        
        # Tentar carregar config específico do container
        config_file = "/app/docker/launcher-container-config.json"
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    file_config = json.load(f)
                    default_config.update(file_config)
            except Exception as e:
                logger.warning(f"Erro ao carregar config do arquivo: {e}")
        
        return default_config
    
    def signal_handler(self, signum, frame):
        """Handler para shutdown gracioso"""
        logger.info(f"Recebido sinal {signum}, iniciando shutdown gracioso...")
        self.shutdown_requested = True
        self.shutdown()
    
    def shutdown(self):
        """Desliga o sistema graciosamente"""
        logger.info("Encerrando container...")
        
        # Parar processo Next.js
        if self.process_manager:
            self.process_manager.stop()
        
        logger.info("Container encerrado com sucesso")
        sys.exit(0)
    
    def wait_for_database(self, max_attempts=30):
        """Aguarda banco estar disponível (para primeira inicialização)"""
        logger.info("Verificando disponibilidade do banco de dados...")
        
        for attempt in range(max_attempts):
            if self.health_check.check_database():
                logger.info("Banco de dados disponível")
                return True
            
            logger.info(f"Aguardando banco... tentativa {attempt + 1}/{max_attempts}")
            time.sleep(2)
        
        logger.error("Banco de dados não ficou disponível")
        return False
    
    def run(self):
        """Executa o launcher do container"""
        logger.info("=" * 60)
        logger.info("CONTAINER LAUNCHER - SISTEMA EMISSOR DE LAUDOS")
        logger.info("IP: 172.20.0.10 | HTTPS: 443 (nginx) | HTTP: 3000 (nextjs)")
        logger.info("=" * 60)
        
        # Configurar handler de sinais
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        # Aguardar banco estar disponível
        if not self.wait_for_database():
            logger.error("Falha na inicialização - banco indisponível")
            sys.exit(1)
        
        # Iniciar processo Next.js
        logger.info("Iniciando Next.js...")
        if not self.process_manager.start():
            logger.error("Falha ao iniciar Next.js")
            sys.exit(1)
        
        # Aguardar Next.js estar pronto
        logger.info("Aguardando Next.js ficar pronto...")
        for i in range(30):
            if self.health_check.check_nextjs():
                logger.info("Next.js está respondendo")
                break
            time.sleep(2)
        else:
            logger.warning("Next.js demorou para responder, mas continuando...")
        
        # Iniciar backup scheduler
        if self.config['backup_enabled']:
            self.backup_manager.start_scheduler()
            self.backup_manager.backup_database()  # Backup inicial
        
        logger.info("CONTAINER TOTALMENTE INICIALIZADO")
        logger.info("- Next.js: http://localhost:3000")
        logger.info("- HTTPS via nginx: https://inspetor.terpens.com.br")
        logger.info("- Healthcheck: http://localhost:3000/api/health")
        
        # Loop principal - manter container vivo
        try:
            while not self.shutdown_requested:
                status = self.health_check.get_status()
                
                # Log periódico de status
                if int(time.time()) % 300 == 0:  # A cada 5 minutos
                    logger.info(f"Status: NextJS={status['nextjs_healthy']}, "
                              f"DB={status['database_healthy']}, "
                              f"Running={status['nextjs_running']}")
                
                time.sleep(10)  # Check a cada 10 segundos
                
        except KeyboardInterrupt:
            self.shutdown()

if __name__ == "__main__":
    launcher = ContainerLauncher()
    launcher.run()